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
import { RequestErrors, showFormDialog } from '@elyra/ui-components';
import { Dialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import * as React from 'react';

import { formDialogWidget } from '../formDialogWidget';
import { PipelineExportDialog } from '../PipelineExportDialog';
import { PipelineService, RUNTIMES_NAMESPACE } from '../PipelineService';
import { PipelineSubmissionDialog } from '../PipelineSubmissionDialog';

import {
  preparePipelineForDisplay,
  preparePipelineForStorage
} from './conversion-utils';
import {
  usePalette,
  useRuntimeImages,
  useRuntimesSchema
} from './pipeline-hooks';
import {
  askToSave,
  assertValidPipeline,
  getRuntimes,
  NoMetadataError,
  prepare
} from './submission-utils';

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
  pipelineRuntimeName: string;
  pipelineRuntimeDisplayName: string | undefined;
  pipeline: any;
  status: IState['status'];
  palette: any;
  updatePipeline(pipeline: any): void;
  migratePipeline(): void;
  savePipeline(): Promise<void>;
  exportPipeline(): Promise<void>;
  submitPipeline(): Promise<void>;
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

  /**
   * Export the pipeline
   *
   * tasks:
   *   - validate
   *   - ask to save
   *   - get available runtimes instances
   *   - show form asking for info
   *   - finalize pipeline
   */
  const exportPipeline = React.useCallback(async (): Promise<void> => {
    assertValidPipeline(data, palette);

    if (contextRef.current.model.dirty) {
      const shouldSave = await askToSave();
      if (!shouldSave) {
        return; // bail
      }

      await savePipeline();
    }

    let schema, runtimes;
    try {
      runtimes = await getRuntimes(pipelineRuntimeName);
      schema = await PipelineService.getRuntimesSchema();
    } catch (error) {
      if (error instanceof NoMetadataError) {
        const res = await RequestErrors.noMetadataError(
          'runtime',
          'export pipeline',
          pipelineRuntimeDisplayName
        );
        // Open the runtimes widget
        if (res.button.label.includes(RUNTIMES_NAMESPACE)) {
          // TODO: nick - pass shell
          // shell.activateById(`elyra-metadata:${RUNTIMES_NAMESPACE}`);
        }
      } else {
        RequestErrors.serverError(error);
      }
      return; // bail
    }

    const title = pipelineRuntimeDisplayName
      ? `Export pipeline for ${pipelineRuntimeDisplayName}`
      : 'Export pipeline';

    const dialogOptions: Partial<Dialog.IOptions<any>> = {
      title,
      body: formDialogWidget(
        <PipelineExportDialog
          runtimes={runtimes}
          runtime={pipelineRuntimeName}
          schema={schema}
        />
      ),
      buttons: [Dialog.cancelButton(), Dialog.okButton()],
      defaultButton: 1,
      focusNodeSelector: '#runtime_config'
    };
    const dialogResult = await showFormDialog(dialogOptions);

    if (dialogResult.value == null) {
      // When Cancel is clicked on the dialog, just return
      return;
    }

    // prepare pipeline submission details
    const pipeline_path = contextRef.current.path;

    const pipeline_name = PathExt.basename(
      pipeline_path,
      PathExt.extname(pipeline_path)
    );

    const overwrite = dialogResult.value.overwrite;
    const pipeline_export_format = dialogResult.value.pipeline_filetype;

    const pipeline_dir = PathExt.dirname(pipeline_path);
    let pipeline_export_path = pipeline_name + '.' + pipeline_export_format;
    // only prefix the '/' when pipeline_dir is non-empty
    if (pipeline_dir) {
      pipeline_export_path = pipeline_dir + '/' + pipeline_export_path;
    }

    const runtime_config = dialogResult.value.runtime_config;
    const runtime = PipelineService.getRuntimeName(runtime_config, runtimes);

    const pipeline = prepare(data, {
      pipelinePath: pipeline_path,
      name: pipeline_name,
      runtime,
      runtimeConfig: runtime_config,
      source: PathExt.basename(pipeline_path)
    });

    PipelineService.exportPipeline(
      pipeline,
      pipeline_export_format,
      pipeline_export_path,
      overwrite
    ).catch(error => RequestErrors.serverError(error));
  }, [
    data,
    palette,
    pipelineRuntimeDisplayName,
    pipelineRuntimeName,
    savePipeline
  ]);

  /**
   * Submit the pipeline
   *
   * tasks:
   *   - validate
   *   - ask to save
   *   - get available runtimes instances
   *   - show form asking for info
   *   - finalize pipeline
   */
  const submitPipeline = React.useCallback(async (): Promise<void> => {
    assertValidPipeline(data, palette);

    if (contextRef.current.model.dirty) {
      const shouldSave = await askToSave();
      if (!shouldSave) {
        return; // bail
      }

      await savePipeline();
    }

    const pipelinePath = contextRef.current.path;

    const pipelineName = PathExt.basename(
      pipelinePath,
      PathExt.extname(pipelinePath)
    );

    let schema, runtimes;
    try {
      runtimes = await getRuntimes(pipelineRuntimeName);
      schema = await PipelineService.getRuntimesSchema();
    } catch (error) {
      if (error instanceof NoMetadataError) {
        // TODO: nick - can't throw here because it can be local
        // const res = await RequestErrors.noMetadataError(
        //   'runtime',
        //   'run pipeline',
        //   platform?.displayName
        // );
        // // Open the runtimes widget
        // if (res.button.label.includes(RUNTIMES_NAMESPACE)) {
        //   shell.activateById(`elyra-metadata:${RUNTIMES_NAMESPACE}`);
        // }
      } else {
        RequestErrors.serverError(error);
      }
    }

    runtimes.unshift({
      name: 'local',
      display_name: 'Run in-place locally',
      schema_name: 'local'
    });

    schema.unshift({
      name: 'local',
      display_name: 'Local Runtime'
    });

    const title = pipelineRuntimeDisplayName
      ? `Run pipeline on ${pipelineRuntimeDisplayName}`
      : 'Run pipeline';

    const dialogOptions: Partial<Dialog.IOptions<any>> = {
      title,
      body: formDialogWidget(
        <PipelineSubmissionDialog
          name={pipelineName}
          runtimes={runtimes}
          runtime={pipelineRuntimeName}
          schema={schema}
        />
      ),
      buttons: [Dialog.cancelButton(), Dialog.okButton()],
      defaultButton: 1,
      focusNodeSelector: '#pipeline_name'
    };
    const dialogResult = await showFormDialog(dialogOptions);

    if (dialogResult.value === null) {
      // When Cancel is clicked on the dialog, just return
      return;
    }

    const runtime_config = dialogResult.value.runtime_config;
    const runtime =
      PipelineService.getRuntimeName(runtime_config, runtimes) || 'local';

    const pipeline = prepare(data, {
      pipelinePath,
      name: dialogResult.value.pipeline_name,
      runtime,
      runtimeConfig: runtime_config,
      source: PathExt.basename(pipelinePath)
    });

    const displayName = PipelineService.getDisplayName(
      dialogResult.value.runtime_config,
      runtimes
    );

    try {
      await PipelineService.submitPipeline(pipeline, displayName);
    } catch (error) {
      RequestErrors.serverError(error);
    }
  }, [
    data,
    palette,
    pipelineRuntimeDisplayName,
    pipelineRuntimeName,
    savePipeline
  ]);

  return {
    pipelineRuntimeName,
    pipelineRuntimeDisplayName,
    pipeline: data,
    status: status,
    palette,
    updatePipeline,
    migratePipeline,
    savePipeline,
    exportPipeline,
    submitPipeline
  };
};
