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

import { PipelineEditor, ThemeProvider } from '@elyra/pipeline-editor';
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
import {
  Dialog,
  ReactWidget,
  showDialog,
  showErrorMessage
} from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';

import 'carbon-components/css/carbon-components.min.css';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { toArray } from '@lumino/algorithm';
import { IDragEvent } from '@lumino/dragdrop';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { formDialogWidget } from './formDialogWidget';
import nodes from './nodes';
import { PipelineExportDialog } from './PipelineExportDialog';
import { PipelineService, RUNTIMES_NAMESPACE } from './PipelineService';
import { PipelineSubmissionDialog } from './PipelineSubmissionDialog';

const PIPELINE_CLASS = 'elyra-PipelineEditor';

export const commandIDs = {
  openPipelineEditor: 'pipeline-editor:open',
  openMetadata: 'elyra-metadata:open',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled',
  submitScript: 'python-editor:submit',
  submitNotebook: 'notebook:submit',
  addFileToPipeline: 'pipeline-editor:add-node'
};

const SvgIcon = ({ children }) => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      {children}
    </svg>
  );
};

const theme = {
  palette: {
    focus: 'var(--jp-border-color1)',
    border: 'black',
    divider: 'black',
    hover: 'rgba(255, 255, 255, 0.05)',
    active: 'rgba(255, 255, 255, 0.18)',
    primary: {
      main: 'var(--jp-inverse-layout-color4)',
      hover: 'var(--jp-inverse-layout-color3)',
      contrastText: 'var(--jp-layout-color1)'
    },
    secondary: {
      main: 'var(--jp-border-color1)',
      contrastText: 'black'
    },
    error: {
      main: 'var(--jp-error-color0)',
      contrastText: 'var(--jp-icon-contrast-color3)'
    },
    icon: {
      primary: 'var(--jp-ui-font-color0)',
      secondary: 'var(--jp-ui-font-color0)'
    },
    text: {
      primary: 'var(--jp-content-font-color0)',
      secondary: 'var(--jp-ui-font-color1)',
      bold: 'var(--jp-inverse-layout-color2)',
      inactive: 'var(--jp-inverse-layout-color4)',
      disabled: 'var(--jp-inverse-layout-color3)',
      link: 'var(--jp-content-link-color)',
      error: 'var(--jp-error-color0)'
    },
    background: {
      default: 'var(--jp-layout-color1)',
      secondary: 'var(--jp-editor-selected-background)',
      input: 'var(--jp-editor-selected-background)'
    },
    highlight: {
      border: 'rgba(0, 0, 0, 0.12)',
      hover: 'rgba(128, 128, 128, 0.07)',
      focus: 'rgba(128, 128, 128, 0.14)'
    }
  },
  typography: {
    fontFamily: 'var(--jp-ui-font-family)',
    fontWeight: 'normal',
    fontSize: 'var(--jp-code-font-size)'
  },
  overrides: {
    deleteIcon: (
      <SvgIcon>
        <path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z" />
      </SvgIcon>
    ),
    editIcon: (
      <SvgIcon>
        <path d="M13.23 1h-1.46L3.52 9.25l-.16.22L1 13.59 2.41 15l4.12-2.36.22-.16L15 4.23V2.77L13.23 1zM2.41 13.59l1.51-3 1.45 1.45-2.96 1.55zm3.83-2.06L4.47 9.76l8-8 1.77 1.77-8 8z" />
      </SvgIcon>
    ),
    folderIcon: (
      <SvgIcon>
        <path d="M14.5 3H7.71l-.85-.85L6.51 2h-5l-.5.5v11l.5.5h13l.5-.5v-10L14.5 3zm-.51 8.49V13h-12V7h4.49l.35-.15.86-.86H14v1.5l-.01 4zm0-6.49h-6.5l-.35.15-.86.86H2v-3h4.29l.85.85.36.15H14l-.01.99z" />
      </SvgIcon>
    ),
    closeIcon: (
      <SvgIcon>
        <path d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z" />
      </SvgIcon>
    ),
    propertiesIcon: (
      <SvgIcon>
        <path d="M3.5 2h-1v5h1V2zm6.1 5H6.4L6 6.45v-1L6.4 5h3.2l.4.5v1l-.4.5zm-5 3H1.4L1 9.5v-1l.4-.5h3.2l.4.5v1l-.4.5zm3.9-8h-1v2h1V2zm-1 6h1v6h-1V8zm-4 3h-1v3h1v-3zm7.9 0h3.19l.4-.5v-.95l-.4-.5H11.4l-.4.5v.95l.4.5zm2.1-9h-1v6h1V2zm-1 10h1v2h-1v-2z" />
      </SvgIcon>
    ),
    paletteIcon: (
      <SvgIcon>
        <path d="M8 1.003a7 7 0 0 0-7 7v.43c.09 1.51 1.91 1.79 3 .7a1.87 1.87 0 0 1 2.64 2.64c-1.1 1.16-.79 3.07.8 3.2h.6a7 7 0 1 0 0-14l-.04.03zm0 13h-.52a.58.58 0 0 1-.36-.14.56.56 0 0 1-.15-.3 1.24 1.24 0 0 1 .35-1.08 2.87 2.87 0 0 0 0-4 2.87 2.87 0 0 0-4.06 0 1 1 0 0 1-.9.34.41.41 0 0 1-.22-.12.42.42 0 0 1-.1-.29v-.37a6 6 0 1 1 6 6l-.04-.04zM9 3.997a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 7.007a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-7-5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM13 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
      </SvgIcon>
    ),
    checkIcon: (
      <SvgIcon>
        <path d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z" />
      </SvgIcon>
    )
  }
};

const PipelineWrapper = ({
  context,
  browserFactory,
  shell,
  widget,
  commands
}: any) => {
  const ref = useRef(null);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState(null);
  const [panelOpen, setPanelOpen] = React.useState(false);

  useEffect(() => {
    context.ready.then(() => {
      const pipeline = context.model.toJSON();
      setPipeline(pipeline);
      setLoading(false);
    });
  }, [context]);

  const onChange = (pipelineJson: any) => {
    setPipeline(pipelineJson);
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

  /*
   * TODO: Add this as a callback to double clicking nodes when
   * feature is available
   * Open node associated notebook
   */
  // const handleOpenFile = (selectedNodes: any): void => {
  //   for (let i = 0; i < selectedNodes.length; i++) {
  //     const path = PipelineService.getWorkspaceRelativeNodePath(
  //       context.path,
  //       selectedNodes[i].app_data.filename
  //     );
  //     commands.execute(commandIDs.openDocManager, { path });
  //   }
  // }

  const cleanNullProperties = React.useCallback((): void => {
    // Delete optional fields that have null value
    for (const node of pipeline?.pipelines[0].nodes) {
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
  }, [pipeline?.pipelines]);

  const handleExportPipeline = useCallback(async (): Promise<void> => {
    // prepare pipeline submission details
    // Warn user if the pipeline has invalid nodes
    if (!pipeline) {
      showErrorMessage('Failed export', 'Cannot export empty pipelines.');
      return;
    }
    const errorMessages = validate(JSON.stringify(pipeline), nodes);
    if (errorMessages && errorMessages.length > 0) {
      let errorMessage = '';
      for (const error of errorMessages) {
        errorMessage += error.message;
      }
      showErrorMessage('Failed export.', errorMessage);
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
      pipeline.pipelines[0],
      context.path
    );

    cleanNullProperties();

    pipeline.pipelines[0]['app_data']['name'] = pipeline_name;
    pipeline.pipelines[0]['app_data']['runtime'] = runtime;
    pipeline.pipelines[0]['app_data']['runtime-config'] = runtime_config;

    PipelineService.exportPipeline(
      pipeline,
      pipeline_export_format,
      pipeline_export_path,
      overwrite
    ).catch(error => RequestErrors.serverError(error));
  }, [pipeline, context.path, cleanNullProperties]);

  const handleRunPipeline = useCallback(async (): Promise<void> => {
    // Check that all nodes are valid
    const errorMessages = validate(JSON.stringify(pipeline), nodes);
    if (errorMessages && errorMessages.length > 0) {
      let errorMessage = '';
      for (const error of errorMessages) {
        errorMessage += error.message;
      }
      showErrorMessage('Failed export.', errorMessage);
      return;
    }

    const pipelineName = PathExt.basename(
      context.path,
      PathExt.extname(context.path)
    );

    const runtimes = await PipelineService.getRuntimes(false).catch(error =>
      RequestErrors.serverError(error)
    );
    const schema = await PipelineService.getRuntimesSchema().catch(error =>
      RequestErrors.serverError(error)
    );

    const local_runtime: any = {
      name: 'local',
      display_name: 'Run in-place locally'
    };
    runtimes.unshift(JSON.parse(JSON.stringify(local_runtime)));

    const dialogOptions: Partial<Dialog.IOptions<any>> = {
      title: 'Run pipeline',
      body: formDialogWidget(
        <PipelineSubmissionDialog
          name={pipelineName}
          runtimes={runtimes}
          schema={schema}
        />
      ),
      buttons: [Dialog.cancelButton(), Dialog.okButton()],
      defaultButton: 1,
      focusNodeSelector: '#pipeline_name'
    };
    const dialogResult = await showFormDialog(dialogOptions);

    if (dialogResult.value == null) {
      // When Cancel is clicked on the dialog, just return
      return;
    }

    // prepare pipeline submission details
    const runtime_config = dialogResult.value.runtime_config;
    const runtime =
      PipelineService.getRuntimeName(runtime_config, runtimes) || 'local';

    // PipelineService.setNodePathsRelativeToWorkspace(
    //   pipeline.pipelines[0],
    //   context.path
    // );

    cleanNullProperties();

    pipeline.pipelines[0]['app_data']['name'] =
      dialogResult.value.pipeline_name;
    pipeline.pipelines[0]['app_data']['runtime'] = runtime;
    pipeline.pipelines[0]['app_data']['runtime-config'] = runtime_config;
    pipeline.pipelines[0]['app_data']['source'] = PathExt.basename(
      context.path
    );

    PipelineService.submitPipeline(
      pipeline,
      PipelineService.getDisplayName(
        dialogResult.value.runtime_config,
        runtimes
      )
    ).catch(error => RequestErrors.serverError(error));
  }, [pipeline, context.path, cleanNullProperties]);

  const handleClearPipeline = useCallback(async (data: any): Promise<any> => {
    return showDialog({
      title: 'Clear Pipeline',
      body: 'Are you sure you want to clear the pipeline?',
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Clear' })]
    }).then(result => {
      if (result.button.accept) {
        // select all canvas elements
        setPipeline(null);
      }
    });
  }, []);

  const onAction = useCallback(
    (args: { type: string; payload?: any }) => {
      console.log(args.type);
      switch (args.type) {
        case 'save':
          context.save();
          break;
        case 'run':
          handleRunPipeline();
          break;
        case 'clear':
          handleClearPipeline(args.payload);
          break;
        case 'export':
          handleExportPipeline();
          break;
        case 'toggleOpenPanel':
          setPanelOpen(!panelOpen);
          break;
        case 'properties':
          setPanelOpen(true);
          break;
        case 'openRuntimes':
          shell.activateById(`elyra-metadata:${RUNTIMES_NAMESPACE}`);
          break;
        default:
          context;
      }
    },
    [context, panelOpen, handleExportPipeline, handleRunPipeline]
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
            item.path = PipelineService.getWorkspaceRelativeNodePath(
              context.path,
              item.path
            );
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
    <ThemeProvider theme={theme}>
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
    </ThemeProvider>
  );
};

export class PipelineEditorFactory extends ABCWidgetFactory<DocumentWidget> {
  browserFactory: IFileBrowserFactory;
  shell: ILabShell;
  commands: any;

  constructor(options: any) {
    super(options);
    this.browserFactory = options.browserFactory;
    this.shell = options.shell;
    this.commands = options.commands;
  }

  protected createNewWidget(context: DocumentRegistry.Context): DocumentWidget {
    const content = ReactWidget.create(
      <PipelineWrapper
        context={context}
        browserFactory={this.browserFactory}
        shell={this.shell}
        commands={this.commands}
      />
    );

    const widget = new DocumentWidget({ content, context });
    widget.addClass(PIPELINE_CLASS);
    widget.title.icon = pipelineIcon;
    return widget;
  }
}
