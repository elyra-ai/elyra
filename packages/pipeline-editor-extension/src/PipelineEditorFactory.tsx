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
import {
  IconUtil,
  clearPipelineIcon,
  exportPipelineIcon,
  pipelineIcon,
  savePipelineIcon,
  runtimesIcon,
  Dropzone
} from '@elyra/ui-components';
import { ReactWidget } from '@jupyterlab/apputils';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';

import 'carbon-components/css/carbon-components.min.css';
import '@elyra/canvas/dist/styles/common-canvas.min.css';
import '../style/canvas.css';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { toArray } from '@lumino/algorithm';
import { IDragEvent } from '@lumino/dragdrop';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import nodes from './nodes';

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

  const [panelOpen, setPanelOpen] = useState(true);

  const onAction = useCallback(
    (type: string) => {
      console.log(type);
      switch (type) {
        case 'toggleOpenPanel':
          setPanelOpen(!panelOpen);
          break;
        case 'properties':
          setPanelOpen(true);
          break;
        case 'closePanel':
          setPanelOpen(false);
          break;
      }
    },
    [panelOpen]
  );

  const toolbar = {
    leftBar: [
      {
        action: 'run',
        label: 'Run Pipeline',
        enable: true
      },
      {
        action: 'save',
        label: 'Save Pipeline',
        enable: true,
        iconEnabled: IconUtil.encode(savePipelineIcon),
        iconDisabled: IconUtil.encode(savePipelineIcon)
      },
      {
        action: 'export',
        label: 'Export Pipeline',
        enable: true,
        iconEnabled: IconUtil.encode(exportPipelineIcon),
        iconDisabled: IconUtil.encode(exportPipelineIcon)
      },
      {
        action: 'clear',
        label: 'Clear Pipeline',
        enable: true,
        iconEnabled: IconUtil.encode(clearPipelineIcon),
        iconDisabled: IconUtil.encode(clearPipelineIcon)
      },
      {
        action: 'openRuntimes',
        label: 'Open Runtimes',
        enable: true,
        iconEnabled: IconUtil.encode(runtimesIcon),
        iconDisabled: IconUtil.encode(runtimesIcon)
      },
      { divider: true },
      { action: 'undo', label: 'Undo' },
      { action: 'redo', label: 'Redo' },
      { action: 'cut', label: 'Cut' },
      { action: 'copy', label: 'Copy' },
      { action: 'paste', label: 'Paste' },
      { action: 'createAutoComment', label: 'Add Comment', enable: true },
      { action: 'deleteSelectedObjects', label: 'Delete' },
      {
        action: 'arrangeHorizontally',
        label: 'Arrange Horizontally',
        enable: true
      },
      {
        action: 'arrangeVertically',
        label: 'Arrange Vertically',
        enable: true
      }
    ],
    rightBar: [
      {
        action: 'toggleOpenPanel',
        label: panelOpen ? 'Close panel' : 'Open panel',
        enable: true,
        iconTypeOverride: panelOpen ? 'paletteOpen' : 'paletteClose'
      }
    ]
  };

  const handleDrop = useCallback(
    async (e: IDragEvent): Promise<void> => {
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
    },
    [browserFactory.defaultBrowser]
  );

  if (loading) {
    return <div>loading</div>;
  }

  return (
    <Dropzone onDrop={handleDrop}>
      <PipelineEditor
        ref={ref}
        nodes={nodes}
        toolbar={toolbar}
        pipeline={pipeline}
        panelOpen={panelOpen}
        onAction={onAction}
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
