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
import { Dialog, ReactWidget, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';

import 'carbon-components/css/carbon-components.min.css';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
// import { NotebookPanel } from '@jupyterlab/notebook';
import { toArray } from '@lumino/algorithm';
import { IDragEvent } from '@lumino/dragdrop';
import { Signal } from '@lumino/signaling';
import { Snackbar } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { formDialogWidget } from './formDialogWidget';
import nodes from './nodes';
import { PipelineExportDialog } from './PipelineExportDialog';
import {
  IRuntime,
  ISchema,
  PipelineService,
  RUNTIMES_NAMESPACE
} from './PipelineService';
import { PipelineSubmissionDialog } from './PipelineSubmissionDialog';
import { theme } from './theme';
import Utils from './utils';
import { IDictionary } from '@elyra/services';

const PIPELINE_CLASS = 'elyra-PipelineEditor';

export const commandIDs = {
  openPipelineEditor: 'pipeline-editor:open',
  openMetadata: 'elyra-metadata:open',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled',
  submitScript: 'script-editor:submit',
  submitNotebook: 'notebook:submit',
  addFileToPipeline: 'pipeline-editor:add-node'
};

const PipelineWrapper = ({
  context,
  browserFactory,
  shell,
  widget,
  commands,
  addFileToPipelineSignal
}: any) => {
  const ref = useRef(null);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [alert, setAlert] = React.useState(null);

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

  PipelineService.getRuntimeImages().then(
    (runtimeImages: any) => {
      for (const node of nodes) {
        const imageEnum = [];
        for (const runtimeImage in runtimeImages) {
          imageEnum.push(runtimeImage);
          (node.properties.resources as IDictionary<string>)[
            'runtime_image.' + runtimeImage + '.label'
          ] = runtimeImages[runtimeImage];
        }
        node.properties.uihints.parameter_info[1].data.items = imageEnum;
      }
    }
    // TODO: add this back in when the readonly error is resolved
    // ).catch(
    //   error => RequestErrors.serverError(error)
  );

  const onFileRequested = (args: any): Promise<string> => {
    let currentExt = '';
    if (args && args.filters && args.filters.File) {
      currentExt = args.filters.File[0];
    }
    const filename = PipelineService.getWorkspaceRelativeNodePath(
      context.path,
      //TODO: need to work out the logic to match current behavior
      ''
    );
    return showBrowseFileDialog(browserFactory.defaultBrowser.model.manager, {
      startPath: PathExt.dirname(filename),
      multiselect: args.canSelectMany,
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

  const handleOpenFile = (data: any): void => {
    for (let i = 0; i < data.selectedObjectIds.length; i++) {
      const node = pipeline.pipelines[0].nodes.find(
        node => node.id === data.selectedObjectIds[i]
      );
      if (!node || !node.app_data || !node.app_data.filename) {
        continue;
      }
      const path = PipelineService.getWorkspaceRelativeNodePath(
        context.path,
        node.app_data.filename
      );
      commands.execute(commandIDs.openDocManager, { path });
    }
  };

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
      setAlert('Failed export: Cannot export empty pipelines.');
      return;
    }
    const errorMessages = validate(JSON.stringify(pipeline), nodes);
    if (errorMessages && errorMessages.length > 0) {
      let errorMessage = '';
      for (const error of errorMessages) {
        errorMessage += error.message;
      }
      setAlert(`Failed export: ${errorMessage}`);
      return;
    }

    if (context.model.dirty) {
      const dialogResult = await showDialog({
        title:
          'This pipeline contains unsaved changes. To submit the pipeline the changes need to be saved.',
        buttons: [
          Dialog.cancelButton(),
          Dialog.okButton({ label: 'Save and Submit' })
        ]
      });
      if (dialogResult.button && dialogResult.button.accept === true) {
        await context.save();
      } else {
        // Don't proceed if cancel button pressed
        return;
      }
    }

    const action = 'export pipeline';
    const runtimes = await PipelineService.getRuntimes(
      true,
      action
    ).catch(error => RequestErrors.serverError(error));

    if (Utils.isDialogResult(runtimes)) {
      // Open the runtimes widget
      runtimes.button.label.includes(RUNTIMES_NAMESPACE) &&
        shell.activateById(`elyra-metadata:${RUNTIMES_NAMESPACE}`);
      return;
    }

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

    // prepare pipeline submission details
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

    pipeline.pipelines[0].app_data.name = pipeline_name;
    pipeline.pipelines[0].app_data.runtime = runtime;
    pipeline.pipelines[0].app_data['runtime-config'] = runtime_config;
    pipeline.pipelines[0].app_data.source = PathExt.basename(context.path);

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
      setAlert(`Failed run: ${errorMessage}`);
      return;
    }

    if (context.model.dirty) {
      const dialogResult = await showDialog({
        title:
          'This pipeline contains unsaved changes. To submit the pipeline the changes need to be saved.',
        buttons: [
          Dialog.cancelButton(),
          Dialog.okButton({ label: 'Save and Submit' })
        ]
      });
      if (dialogResult.button && dialogResult.button.accept === true) {
        await context.save();
      } else {
        // Don't proceed if cancel button pressed
        return;
      }
    }

    const pipelineName = PathExt.basename(
      context.path,
      PathExt.extname(context.path)
    );

    const action = 'run pipeline';
    const runtimes = await PipelineService.getRuntimes(
      false,
      action
    ).catch(error => RequestErrors.serverError(error));
    const schema = await PipelineService.getRuntimesSchema().catch(error =>
      RequestErrors.serverError(error)
    );

    const localRuntime: IRuntime = {
      name: 'local',
      display_name: 'Run in-place locally',
      schema_name: 'local'
    };
    runtimes.unshift(JSON.parse(JSON.stringify(localRuntime)));

    const localSchema: ISchema = {
      name: 'local',
      display_name: 'Local Runtime'
    };
    schema.unshift(JSON.parse(JSON.stringify(localSchema)));

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

    if (dialogResult.value === null) {
      // When Cancel is clicked on the dialog, just return
      return;
    }

    const runtime_config = dialogResult.value.runtime_config;
    const runtime =
      PipelineService.getRuntimeName(runtime_config, runtimes) || 'local';

    PipelineService.setNodePathsRelativeToWorkspace(
      pipeline.pipelines[0],
      context.path
    );

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
  }, [pipeline, context, cleanNullProperties]);

  const handleClearPipeline = useCallback(async (data: any): Promise<any> => {
    return showDialog({
      title: 'Clear Pipeline',
      body: 'Are you sure you want to clear the pipeline?',
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Clear' })]
    }).then(result => {
      if (result.button.accept) {
        // select all canvas elements
        context.model.fromString('');
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

  const [defaultPosition, setDefaultPosition] = useState(10);

  const handleAddFileToPipeline = useCallback(
    (location?: { x: number; y: number }) => {
      const fileBrowser = browserFactory.defaultBrowser;
      // Only add file to pipeline if it is currently in focus
      // TODO: add check for this. Need to be able to find widgetId first
      // if (shell.currentWidget.id !== widget.widgetId) {
      //   return;
      // }

      let failedAdd = 0;
      let position = 0;
      const missingXY = !location;

      // if either x or y is undefined use the default coordinates
      if (missingXY) {
        position = defaultPosition;
        location = {
          x: 75,
          y: 85
        };
      }

      toArray(fileBrowser.selectedItems()).map((item: any): void => {
        if (PipelineService.isSupportedNode(item)) {
          // read the file contents
          // create a notebook widget to get a string with the node content then dispose of it
          // let itemContent: string;
          if (item.type == 'notebook') {
            const fileWidget = fileBrowser.model.manager.open(item.path);
            // itemContent = (fileWidget as NotebookPanel).content.model.toString();
            fileWidget.dispose();
          }
          item.op = PipelineService.getNodeType(item.path);
          item.path = PipelineService.getPipelineRelativeNodePath(
            context.path,
            item.path
          );
          item.x = location.x + position;
          item.y = location.y + position;

          const success = ref.current?.addFile(item);

          if (success) {
            position += 20;
          } else {
            // handle error
          }
        } else {
          failedAdd++;
        }
      });
      // update position if the default coordinates were used
      if (missingXY) {
        setDefaultPosition(position);
      }

      if (failedAdd) {
        return showDialog({
          title: 'Unsupported File(s)',
          body:
            'Currently, only selected notebook and python script files can be added to a pipeline',
          buttons: [Dialog.okButton()]
        });
      }
    },
    [browserFactory.defaultBrowser, context.path]
  );

  const handleDrop = async (e: IDragEvent): Promise<void> => {
    handleAddFileToPipeline({ x: e.offsetX, y: e.offsetY });
  };

  addFileToPipelineSignal.connect(() => {
    handleAddFileToPipeline();
  });

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setAlert(null);
  };

  if (loading) {
    return <div>loading</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <Snackbar
        open={alert !== null}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert severity={'error'} onClose={handleClose}>
          {alert}
        </Alert>
      </Snackbar>
      <Dropzone onDrop={handleDrop}>
        <PipelineEditor
          ref={ref}
          nodes={nodes}
          toolbar={toolbar}
          pipeline={pipeline}
          onAction={onAction}
          onChange={onChange}
          onDoubleClickNode={handleOpenFile}
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
  addFileToPipelineSignal: Signal<this, any>;

  constructor(options: any) {
    super(options);
    this.browserFactory = options.browserFactory;
    this.shell = options.shell;
    this.commands = options.commands;
    this.addFileToPipelineSignal = new Signal<this, any>(this);
  }

  protected createNewWidget(context: DocumentRegistry.Context): DocumentWidget {
    const content = ReactWidget.create(
      <PipelineWrapper
        context={context}
        browserFactory={this.browserFactory}
        shell={this.shell}
        commands={this.commands}
        addFileToPipelineSignal={this.addFileToPipelineSignal}
      />
    );

    const widget = new DocumentWidget({ content, context });
    widget.addClass(PIPELINE_CLASS);
    widget.title.icon = pipelineIcon;
    return widget;
  }
}
