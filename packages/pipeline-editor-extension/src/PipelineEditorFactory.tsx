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

import { PipelineEditor } from '@elyra/pipeline-editor';
import { validate } from '@elyra/pipeline-services';
import {
  IconUtil,
  clearPipelineIcon,
  exportPipelineIcon,
  pipelineIcon,
  savePipelineIcon,
  showBrowseFileDialog,
  runtimesIcon,
  Dropzone,
  RequestErrors,
  showFormDialog
} from '@elyra/ui-components';
import { ILabShell } from '@jupyterlab/application';
import { Dialog, ReactWidget, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
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

import { formDialogWidget } from './formDialogWidget';
import nodes from './nodes';
import { PipelineExportDialog } from './PipelineExportDialog';
import { PipelineService } from './PipelineService';

const PIPELINE_CLASS = 'elyra-PipelineEditor';

export const commandIDs = {
  openPipelineEditor: 'pipeline-editor:open',
  openMetadata: 'elyra-metadata:open',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled',
  submitNotebook: 'notebook:submit',
  addFileToPipeline: 'pipeline-editor:add-node'
};

const PipelineWrapper = ({ context, browserFactory, shell, widget }: any) => {
  const ref = useRef(null);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState();

  useEffect(() => {
    context.ready.then(() => {
      const pipeline = context.model.toJSON();
      setPipeline(pipeline || undefined);
      setLoading(false);
    });
  }, [context]);

  const onChange = (pipelineJson: any) => {
    if (context.ready) {
      context.model.fromString(JSON.stringify(pipelineJson, null, 2));
    }
  };

  const onError = (error?: Error) => {
    showDialog({
      title: 'Load pipeline failed!',
      body: <p> {error || ''} </p>,
      buttons: [Dialog.okButton()]
    }).then(() => {
      if (shell.currentWidget) {
        shell.currentWidget.close();
      }
    });
  };

  const onFileRequested = (
    startPathInfo?: any,
    multiselect?: boolean
  ): Promise<string> => {
    const startPath = startPathInfo.defaultUri;
    const currentExt = PathExt.extname(startPath || '');
    const filename = PipelineService.getWorkspaceRelativeNodePath(
      context.path,
      //TODO: need to work out the logic to match current behavior
      ''
    );
    return showBrowseFileDialog(browserFactory.defaultBrowser.model.manager, {
      startPath: PathExt.dirname(filename),
      multiselect: multiselect,
      filter: (model: any): boolean => {
        const ext = PathExt.extname(model.path);
        return currentExt === '' || currentExt === ext;
      }
    }).then((result: any) => {
      if (result.button.accept && result.value.length) {
        return result.value.map((val: any) => {
          return val.path;
        });
      }
    });
  };

  const cleanNullProperties = (): void => {
    // Delete optional fields that have null value
    for (const node of ref.current?.getPipelineFlow().pipelines[0].nodes) {
      if (node.app_data.cpu === null) {
        delete node.app_data.cpu;
      }
      if (node.app_data.memory === null) {
        delete node.app_data.memory;
      }
      if (node.app_data.gpu === null) {
        delete node.app_data.gpu;
      }
    }
  };

  const handleExportPipeline = useCallback(async (): Promise<void> => {
    // prepare pipeline submission details
    const pipelineFlow = ref.current?.getPipelineFlow();
    // Warn user if the pipeline has invalid nodes
    const errorMessage = validate(pipelineFlow.toString(), nodes);
    if (errorMessage) {
      // this.setState({
      //   showValidationError: true,
      //   validationError: {
      //     errorMessage: errorMessage,
      //     errorSeverity: 'error'
      //   }
      // });
      return;
    }
    const runtimes = await PipelineService.getRuntimes().catch(error =>
      RequestErrors.serverError(error)
    );

    const schema = await PipelineService.getRuntimesSchema().catch(error =>
      RequestErrors.serverError(error)
    );

    const dialogOptions: Partial<Dialog.IOptions<any>> = {
      title: 'Export pipeline',
      body: formDialogWidget(
        <PipelineExportDialog runtimes={runtimes} schema={schema} />
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

    const pipeline_path = context.path;

    const pipeline_dir = PathExt.dirname(pipeline_path);
    const pipeline_name = PathExt.basename(
      pipeline_path,
      PathExt.extname(pipeline_path)
    );
    const pipeline_export_format = dialogResult.value.pipeline_filetype;

    let pipeline_export_path = pipeline_name + '.' + pipeline_export_format;
    // only prefix the '/' when pipeline_dir is non-empty
    if (pipeline_dir) {
      pipeline_export_path = pipeline_dir + '/' + pipeline_export_path;
    }

    const overwrite = dialogResult.value.overwrite;

    const runtime_config = dialogResult.value.runtime_config;
    const runtime = PipelineService.getRuntimeName(runtime_config, runtimes);

    PipelineService.setNodePathsRelativeToWorkspace(
      pipelineFlow.pipelines[0],
      context.path
    );

    cleanNullProperties();

    pipelineFlow.pipelines[0]['app_data']['name'] = pipeline_name;
    pipelineFlow.pipelines[0]['app_data']['runtime'] = runtime;
    pipelineFlow.pipelines[0]['app_data']['runtime-config'] = runtime_config;

    PipelineService.exportPipeline(
      pipelineFlow,
      pipeline_export_format,
      pipeline_export_path,
      overwrite
    ).catch(error => RequestErrors.serverError(error));
  }, [pipeline, context.path]);

  let panelOpen = false;

  const onAction = useCallback((args: { type: string; payload?: any }) => {
    console.log(args.type);
    switch (args.type) {
      case 'save':
        context.save();
        break;
      case 'export':
        handleExportPipeline();
        break;
      case 'openPanel':
        panelOpen = true;
        break;
      case 'closePanel':
        panelOpen = false;
        break;
    }
  }, []);

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
        label: 'Open panel',
        enable: true,
        iconTypeOverride: panelOpen ? 'paletteOpen' : 'paletteClose'
      }
    ]
  };

  const handleDrop = useCallback(
    async (e: IDragEvent): Promise<void> => {
      const fileBrowser = browserFactory.defaultBrowser;
      let failedAdd = 0;

      toArray(fileBrowser.selectedItems()).map(
        (item: any, index: number): void => {
          if (PipelineService.isSupportedNode(item)) {
            item.op = PipelineService.getNodeType(item.path);
            ref.current?.addFile(
              item,
              e.offsetX + 20 * index,
              e.offsetY + 20 * index
            );
          } else {
            failedAdd++;
          }
        }
      );

      if (failedAdd) {
        showDialog({
          title: 'Unsupported File(s)',
          body:
            'Currently, only selected notebook and python script files can be added to a pipeline',
          buttons: [Dialog.okButton()]
        });
      }
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
        onAction={onAction}
        onChange={onChange}
        onError={onError}
        onFileRequested={onFileRequested}
      />
    </Dropzone>
  );
};

export class PipelineEditorFactory extends ABCWidgetFactory<DocumentWidget> {
  browserFactory: IFileBrowserFactory;
  shell: ILabShell;

  constructor(options: any) {
    super(options);
    this.browserFactory = options.browserFactory;
    this.shell = options.shell;
  }

  protected createNewWidget(context: DocumentRegistry.Context): DocumentWidget {
    const content = ReactWidget.create(
      <PipelineWrapper
        context={context}
        browserFactory={this.browserFactory}
        shell={this.shell}
      />
    );

    const widget = new DocumentWidget({ content, context });
    widget.addClass(PIPELINE_CLASS);
    widget.title.icon = pipelineIcon;
    return widget;
  }
}
