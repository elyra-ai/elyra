/*
 * Copyright 2018-2021 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { migrate } from '@elyra/pipeline-services';
import { RequestErrors } from '@elyra/ui-components';
import { PathExt } from '@jupyterlab/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import * as React from 'react';

import { PipelineService } from '../PipelineService';

import {
  preparePipelineForDisplay,
  preparePipelineForStorage
} from './conversion-utils';
import {
  usePalette,
  useRuntimeImages,
  useRuntimesSchema
} from './pipeline-hooks';

interface IState {
  data: any;
  status: 'ready' | 'pending';
}

interface IAction {
  type: 'SET';
  payload: any;
}

const initialState: IState = {
  data: undefined,
  status: 'pending'
};

const reducer = (_state: IState, action: IAction): IState => {
  switch (action.type) {
    case 'SET':
      return {
        data: action.payload,
        status: 'ready'
      };
  }
};

const useServerError = (e: any): void => {
  React.useEffect(() => {
    if (e) {
      RequestErrors.serverError(e);
    }
  }, [e]);
};

const useMetadataError = (msg?: string): void => {
  React.useEffect(() => {
    if (msg) {
      RequestErrors.noMetadataError(msg);
    }
  }, [msg]);
};

const getRuntimeDisplayName = (
  schemas: { name: string; display_name: string }[] | undefined,
  runtime: string | undefined
): string | undefined => {
  const schema = schemas?.find(s => s.name === runtime);
  return schema?.display_name;
};

interface IReturn {
  pipeline: any;
  status: IState['status'];
  palette: any;
  updatePipeline(pipeline: any): void;
  migratePipeline(): void;
  savePipeline(): Promise<void>;
}

export const usePipeline = (context: DocumentRegistry.Context): IReturn => {
  const contextRef = React.useRef(context);
  const [{ data, status }, dispatch] = React.useReducer(reducer, initialState);

  const pipelineRuntimeName = data?.pipelines?.[0]?.app_data?.runtime;

  const { data: palette, error: paletteError } = usePalette(
    pipelineRuntimeName
  );

  const { data: runtimeImages, error: runtimeImagesError } = useRuntimeImages();

  const {
    data: runtimesSchema,
    error: runtimesSchemaError
  } = useRuntimesSchema();

  const pipelineRuntimeDisplayName = getRuntimeDisplayName(
    runtimesSchema,
    pipelineRuntimeName
  );

  // Show dialogs for any errors we come across while fetching data.
  useServerError(paletteError);
  useServerError(runtimeImagesError);
  useServerError(runtimesSchemaError);
  useMetadataError(runtimeImages?.length === 0 ? 'runtime image' : undefined);

  /**
   * Load the pipeline contents whenever JupyterLab's context is ready and set
   * up handlers for whenever the contents change.
   */
  React.useEffect(() => {
    const currentContext = contextRef.current;

    const changeHandler = (): void => {
      const pipelineJson = currentContext.model.toJSON();
      const pipeline_path = contextRef.current.path;
      const pipeline_name = PathExt.basename(
        pipeline_path,
        PathExt.extname(pipeline_path)
      );
      const pipeline = preparePipelineForDisplay(
        pipelineJson,
        runtimeImages,
        pipeline_name,
        pipelineRuntimeDisplayName
      );
      dispatch({ type: 'SET', payload: pipeline });
    };

    currentContext.ready.then(changeHandler);
    currentContext.model.contentChanged.connect(changeHandler);

    return (): void => {
      currentContext.model.contentChanged.disconnect(changeHandler);
    };
  }, [pipelineRuntimeDisplayName, runtimeImages]);

  /**
   * Notify JupyterLab that the pipeline file contents should change.
   * This will change the context models state to dirty as well as trigger
   * our contentChanged connections and update our internal state.
   */
  const updatePipeline = React.useCallback(
    pipeline => {
      if (contextRef.current.isReady) {
        const pipelineString = preparePipelineForStorage(
          pipeline,
          runtimeImages
        );
        contextRef.current.model.fromString(pipelineString);
      }
    },
    [runtimeImages]
  );

  /**
   * Migrate the pipeline in our internal state to the latest version.
   * Afterwards, calls updatePipeline to inform JupyterLab of changes.
   */
  const migratePipeline = React.useCallback(() => {
    console.log('migrating pipeline');
    const migratedPipeline = migrate(data, pipeline => {
      for (const node of pipeline.nodes) {
        // TODO: nick - find out how many times we call this
        node.app_data.filename = PipelineService.getPipelineRelativeNodePath(
          contextRef.current.path,
          node.app_data.filename
        );
      }
      return pipeline;
    });
    updatePipeline(migratedPipeline);
  }, [data, updatePipeline]);

  /**
   * Tell JupyterLab to persist the current context to file.
   */
  const savePipeline = React.useCallback(async () => {
    await contextRef.current.save();
  }, []);

  return {
    pipeline: data,
    status: status,
    palette,
    updatePipeline,
    migratePipeline,
    savePipeline
  };
};
