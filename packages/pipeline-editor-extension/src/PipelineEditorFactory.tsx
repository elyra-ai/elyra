/*
 * Copyright 2018-2020 Elyra Authors
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

import { PipelineEditor } from '@elyra/pipeline-editor';
import { Dropzone, pipelineIcon } from '@elyra/ui-components';
import { Dialog, ReactWidget, showDialog } from '@jupyterlab/apputils';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';

import 'carbon-components/css/carbon-components.min.css';
import '@elyra/canvas/dist/styles/common-canvas.min.css';
import '../style/canvas.css';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IDragEvent } from '@lumino/dragdrop';
import { toArray } from '@lumino/algorithm';

const PIPELINE_CLASS = 'elyra-PipelineEditor';

export const commandIDs = {
  openPipelineEditor: 'pipeline-editor:open',
  openMetadata: 'elyra-metadata:open',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled',
  submitNotebook: 'notebook:submit',
  addFileToPipeline: 'pipeline-editor:add-node'
};

const PipelineWrapper = ({ context, browserFactory, widget }: any) => {
  const ref = useRef(null);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState();

  useEffect(() => {
    context.ready.then(() => {
      const pipeline = context.model.toJSON();
      setPipeline(pipeline);
      setLoading(false);
    });
  }, [context]);

  const handleError = useCallback(async () => {
    await showDialog({
      title: 'Error',
      body: 'hello!',
      buttons: [Dialog.okButton()]
    });
    widget.close();
  }, [widget]);

  const handleAction = useCallback(async (type: string) => {
    await showDialog({
      title: type,
      body: 'hello!',
      buttons: [Dialog.okButton()]
    });
  }, []);

  const handleChange = useCallback(
    pipeline => {
      context.model.fromString(JSON.stringify(pipeline, null, 2));
    },
    [context]
  );

  const handleFileRequested = useCallback(async () => {
    await showDialog({
      title: 'Give me file',
      body: 'hello!',
      buttons: [Dialog.okButton()]
    });
  }, []);

  const handleDrop = useCallback(async (e: IDragEvent): Promise<void> => {
    const fileBrowser = browserFactory.defaultBrowser;

    toArray(fileBrowser.selectedItems()).map(
      (item: any, index: number): void => {
        ref.current?.addFile(
          item,
          e.offsetX + 20 * index,
          e.offsetY + 20 * index
        );
      }
    );
  }, []);

  if (loading) {
    return <div>loading</div>;
  }

  return (
    <Dropzone onDrop={handleDrop}>
      <PipelineEditor
        pipeline={pipeline}
        nodes={{}}
        mode="jupyter"
        ref={ref}
        onAction={handleAction}
        onChange={handleChange}
        onError={handleError}
        onFileRequested={handleFileRequested}
        readOnly={false}
      />
    </Dropzone>
  );
};

export class PipelineEditorFactory extends ABCWidgetFactory<DocumentWidget> {
  browserFactory: IFileBrowserFactory;

  constructor(options: any) {
    super(options);
    this.browserFactory = options.browserFactory;
  }

  protected createNewWidget(context: DocumentRegistry.Context): DocumentWidget {
    const content = ReactWidget.create(
      <PipelineWrapper context={context} browserFactory={this.browserFactory} />
    );

    const widget = new DocumentWidget({ content, context });
    widget.addClass(PIPELINE_CLASS);
    widget.title.icon = pipelineIcon;
    return widget;
  }
}
