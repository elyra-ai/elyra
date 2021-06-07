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
import { ContentParser } from '@elyra/services';
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
  showFormDialog,
  pyIcon,
  rIcon,
  kubeflowIcon,
  airflowIcon
} from '@elyra/ui-components';
import { ILabShell } from '@jupyterlab/application';
import { Dialog, ReactWidget, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget,
  Context
} from '@jupyterlab/docregistry';

import 'carbon-components/css/carbon-components.min.css';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { LabIcon, notebookIcon } from '@jupyterlab/ui-components';
import { toArray } from '@lumino/algorithm';
import { IDragEvent } from '@lumino/dragdrop';
import { Signal } from '@lumino/signaling';
import { Snackbar } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { formDialogWidget } from './formDialogWidget';
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

const PIPELINE_CLASS = 'elyra-PipelineEditor';

export const commandIDs = {
  openPipelineEditor: 'pipeline-editor:open',
  openMetadata: 'elyra-metadata:open',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled',
  saveDocManager: 'docmanager:save',
  submitScript: 'script-editor:submit',
  submitNotebook: 'notebook:submit',
  addFileToPipeline: 'pipeline-editor:add-node'
};

const runtimeIcons = [kubeflowIcon, airflowIcon];

export const getRuntimeIcon = (runtime?: string): LabIcon => {
  for (const runtimeIcon of runtimeIcons) {
    if (`elyra:${runtime}` === runtimeIcon.name) {
      return runtimeIcon;
    }
  }
  return pipelineIcon;
};

class PipelineEditorWidget extends ReactWidget {
  browserFactory: IFileBrowserFactory;
  shell: ILabShell;
  commands: any;
  addFileToPipelineSignal: Signal<this, any>;
  context: Context;

  constructor(options: any) {
    super(options);
    this.browserFactory = options.browserFactory;
    this.shell = options.shell;
    this.commands = options.commands;
    this.addFileToPipelineSignal = options.addFileToPipelineSignal;
    this.context = options.context;
  }

  render(): any {
    return (
      <PipelineWrapper
        context={this.context}
        browserFactory={this.browserFactory}
        shell={this.shell}
        commands={this.commands}
        addFileToPipelineSignal={this.addFileToPipelineSignal}
        widgetId={this.parent?.id}
      />
    );
  }
}

interface IProps {
  context: DocumentRegistry.Context;
  browserFactory: IFileBrowserFactory;
  shell: ILabShell;
  commands: any;
  addFileToPipelineSignal: Signal<PipelineEditorWidget, any>;
  widgetId?: string;
}

const NodeIcons: Map<string, string> = new Map([
  [
    'notebooks',
    'data:image/svg+xml;utf8,' + encodeURIComponent(notebookIcon.svgstr)
  ],
  [
    'python-script',
    'data:image/svg+xml;utf8,' + encodeURIComponent(pyIcon.svgstr)
  ],
  ['r-script', 'data:image/svg+xml;utf8,' + encodeURIComponent(rIcon.svgstr)]
]);

const PipelineWrapper: React.FC<IProps> = ({
  context,
  browserFactory,
  shell,
  commands,
  addFileToPipelineSignal,
  widgetId
}) => {
  const ref = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [alert, setAlert] = React.useState('');
  const [updatedNodes, setUpdatedNodes] = React.useState([] as any[]);
  const pipelineRuntime = pipeline?.pipelines?.[0]?.app_data?.ui_data?.runtime;

  const contextRef = useRef(context);
  useEffect(() => {
    const currentContext = contextRef.current;

    const changeHandler = (): void => {
      const pipelineJson: any = currentContext.model.toJSON();
      if (
        pipelineJson?.pipelines?.[0]?.nodes &&
        pipelineJson?.pipelines?.[0]?.nodes.length > 0
      ) {
        // Update to display actual value of runtime image
        for (const node of pipelineJson?.pipelines?.[0]?.nodes) {
          const app_data = node?.app_data;
          if (app_data?.runtime_image) {
            if (runtimeImages.current?.[app_data.runtime_image]) {
              app_data.runtime_image =
                runtimeImages.current?.[app_data.runtime_image];
            }
          }
        }
      }
      setPipeline(pipelineJson);
      setLoading(false);
    };

    const loadNodes = (pipelineRuntime?: string) => {
      PipelineService.getRuntimeImages().then((images: any) => {
        runtimeImages.current = images;
        PipelineService.getRuntimeComponents(pipelineRuntime ?? 'local').then(
          async (serverNodes: any) => {
            const newNodes: any[] = [];
            for (const nodeCategory of serverNodes.categories) {
              await PipelineService.getComponentProperties(
                pipelineRuntime ?? 'local',
                nodeCategory.id
              ).then((properties: any) => {
                for (const node of nodeCategory.node_types) {
                  newNodes.push(node);
                  node.label = nodeCategory.label;
                  node.id = nodeCategory.id;
                  const nodeIcon = NodeIcons.get(nodeCategory.id);
                  if (!nodeIcon || nodeIcon === '') {
                    node.image =
                      'data:image/svg+xml;utf8,' +
                      encodeURIComponent(
                        getRuntimeIcon(pipelineRuntime).svgstr
                      );
                  } else {
                    node.image = nodeIcon;
                  }
                  node.description = nodeCategory.description;
                  node.properties = properties;
                  node.properties.uihints.parameter_info[1].data = {
                    items: Object.values(runtimeImages.current)
                  };
                }
              }, RequestErrors.serverError);
            }
            setUpdatedNodes(newNodes);
            changeHandler();
          },
          RequestErrors.serverError
        );
      }, RequestErrors.serverError);
    };

    loadNodes();

    // Trigger a re-load of the nodes if the pipeline runtime changes
    const maybeLoadNodes = (): void => {
      const pipelineJSON: any = currentContext.model.toJSON();
      const pipelineRuntime =
        pipelineJSON?.pipelines?.[0]?.app_data?.ui_data?.runtime?.name;
      if (
        pipelineRuntime !==
        pipeline?.pipelines?.[0]?.app_data?.ui_data?.runtime?.name
      ) {
        loadNodes(pipelineRuntime);
      } else {
        changeHandler();
      }
    };

    currentContext.ready.then(maybeLoadNodes);
    currentContext.model.contentChanged.connect(maybeLoadNodes);

    return (): void => {
      currentContext.model.contentChanged.disconnect(changeHandler);
    };
  }, []);

  const onChange = useCallback((pipelineJson: any): void => {
    if (contextRef.current.isReady) {
      if (pipelineJson?.pipelines?.[0]?.nodes) {
        // Update to store tag of runtime image
        for (const node of pipelineJson?.pipelines?.[0]?.nodes) {
          const app_data = node?.app_data;
          if (app_data?.runtime_image) {
            for (const tag in runtimeImages.current) {
              if (runtimeImages.current?.[tag] === app_data?.runtime_image) {
                app_data.runtime_image = tag;
              }
            }
          }
        }
      }
      contextRef.current.model.fromString(
        JSON.stringify(pipelineJson, null, 2)
      );
    }
  }, []);

  const onError = (error?: Error): void => {
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

  const runtimeImages = React.useRef<any>({});

  const onFileRequested = (args: any): Promise<string> => {
    let currentExt = '';
    if (args && args.filters && args.filters.File) {
      currentExt = args.filters.File[0];
    }
    const filename = PipelineService.getWorkspaceRelativeNodePath(
      contextRef.current.path,
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

  const onPropertiesUpdateRequested = async (args: any): Promise<any> => {
    const path = PipelineService.getWorkspaceRelativeNodePath(
      contextRef.current.path,
      args.filename
    );
    const new_env_vars = await ContentParser.getEnvVars(
      path
    ).then((response: any) => response.map((str: string) => (str = str + '=')));

    const env_vars = args.env_vars ?? [];
    const merged_env_vars = [
      ...env_vars,
      ...new_env_vars.filter(
        (new_var: string) =>
          !env_vars.some((old_var: string) => old_var.startsWith(new_var))
      )
    ];

    return { env_vars: merged_env_vars.filter(Boolean) };
  };

  const handleOpenFile = (data: any): void => {
    for (let i = 0; i < data.selectedObjectIds.length; i++) {
      const node = pipeline.pipelines[0].nodes.find(
        (node: any) => node.id === data.selectedObjectIds[i]
      );
      if (!node || !node.app_data || !node.app_data.filename) {
        continue;
      }
      const path = PipelineService.getWorkspaceRelativeNodePath(
        contextRef.current.path,
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
    const pipelineJson: any = context.model.toJSON();
    // prepare pipeline submission details
    // Warn user if the pipeline has invalid nodes
    if (!pipelineJson) {
      setAlert('Failed export: Cannot export empty pipelines.');
      return;
    }
    const errorMessages = validate(JSON.stringify(pipelineJson), updatedNodes);
    if (errorMessages && errorMessages.length > 0) {
      let errorMessage = '';
      for (const error of errorMessages) {
        errorMessage += error.message;
      }
      setAlert(`Failed export: ${errorMessage}`);
      return;
    }

    if (contextRef.current.model.dirty) {
      const dialogResult = await showDialog({
        title:
          'This pipeline contains unsaved changes. To submit the pipeline the changes need to be saved.',
        buttons: [
          Dialog.cancelButton(),
          Dialog.okButton({ label: 'Save and Submit' })
        ]
      });
      if (dialogResult.button && dialogResult.button.accept === true) {
        await contextRef.current.save();
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

    let title = 'Export pipeline';
    if (pipelineRuntime) {
      title = `Export pipeline for ${pipelineRuntime.display_name}`;
      const filteredRuntimeOptions = PipelineService.filterRuntimes(
        runtimes,
        pipelineRuntime.name
      );
      if (filteredRuntimeOptions.length === 0) {
        const runtimes = await RequestErrors.noMetadataError(
          'runtime',
          'export pipeline.',
          pipelineRuntime.display_name
        );
        if (Utils.isDialogResult(runtimes)) {
          if (runtimes.button.label.includes(RUNTIMES_NAMESPACE)) {
            // Open the runtimes widget
            shell.activateById(`elyra-metadata:${RUNTIMES_NAMESPACE}`);
          }
          return;
        }
        return;
      }
    }

    const dialogOptions: Partial<Dialog.IOptions<any>> = {
      title,
      body: formDialogWidget(
        <PipelineExportDialog
          runtimes={runtimes}
          runtime={pipelineRuntime?.name}
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
      pipelineJson.pipelines[0],
      contextRef.current.path
    );

    cleanNullProperties();

    pipelineJson.pipelines[0].app_data.name = pipeline_name;
    pipelineJson.pipelines[0].app_data.runtime = runtime;
    pipelineJson.pipelines[0].app_data['runtime-config'] = runtime_config;
    pipelineJson.pipelines[0].app_data.source = PathExt.basename(
      contextRef.current.path
    );

    PipelineService.exportPipeline(
      pipelineJson,
      pipeline_export_format,
      pipeline_export_path,
      overwrite
    ).catch(error => RequestErrors.serverError(error));

    PipelineService.setNodePathsRelativeToPipeline(
      pipelineJson.pipelines[0],
      contextRef.current.path
    );
  }, [context.model, pipeline?.pipelines, cleanNullProperties, shell]);

  const handleRunPipeline = useCallback(async (): Promise<void> => {
    const pipelineJson: any = context.model.toJSON();
    // Check that all nodes are valid
    const errorMessages = validate(JSON.stringify(pipelineJson), updatedNodes);
    if (errorMessages && errorMessages.length > 0) {
      let errorMessage = '';
      for (const error of errorMessages) {
        errorMessage += error.message;
      }
      setAlert(`Failed run: ${errorMessage}`);
      return;
    }

    if (contextRef.current.model.dirty) {
      const dialogResult = await showDialog({
        title:
          'This pipeline contains unsaved changes. To submit the pipeline the changes need to be saved.',
        buttons: [
          Dialog.cancelButton(),
          Dialog.okButton({ label: 'Save and Submit' })
        ]
      });
      if (dialogResult.button && dialogResult.button.accept === true) {
        await contextRef.current.save();
      } else {
        // Don't proceed if cancel button pressed
        return;
      }
    }

    const pipelineName = PathExt.basename(
      contextRef.current.path,
      PathExt.extname(contextRef.current.path)
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

    let title = 'Run pipeline';
    if (pipelineRuntime) {
      title = `Run pipeline on ${pipelineRuntime.display_name}`;
      const filteredRuntimeOptions = PipelineService.filterRuntimes(
        runtimes,
        pipelineRuntime.name
      );
      if (filteredRuntimeOptions.length === 0) {
        const runtimes = await RequestErrors.noMetadataError(
          'runtime',
          'run pipeline.',
          pipelineRuntime.display_name
        );
        if (Utils.isDialogResult(runtimes)) {
          if (runtimes.button.label.includes(RUNTIMES_NAMESPACE)) {
            // Open the runtimes widget
            shell.activateById(`elyra-metadata:${RUNTIMES_NAMESPACE}`);
          }
          return;
        }
        return;
      }
    }

    const dialogOptions: Partial<Dialog.IOptions<any>> = {
      title,
      body: formDialogWidget(
        <PipelineSubmissionDialog
          name={pipelineName}
          runtimes={runtimes}
          runtime={pipelineRuntime?.name}
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
      pipelineJson.pipelines[0],
      contextRef.current.path
    );

    cleanNullProperties();

    pipelineJson.pipelines[0]['app_data']['name'] =
      dialogResult.value.pipeline_name;
    pipelineJson.pipelines[0]['app_data']['runtime'] = runtime;
    pipelineJson.pipelines[0]['app_data']['runtime-config'] = runtime_config;
    pipelineJson.pipelines[0]['app_data']['source'] = PathExt.basename(
      contextRef.current.path
    );

    PipelineService.submitPipeline(
      pipelineJson,
      PipelineService.getDisplayName(
        dialogResult.value.runtime_config,
        runtimes
      )
    ).catch(error => RequestErrors.serverError(error));

    PipelineService.setNodePathsRelativeToPipeline(
      pipelineJson.pipelines[0],
      contextRef.current.path
    );
  }, [context.model, pipeline?.pipelines, cleanNullProperties, shell]);

  const handleClearPipeline = useCallback(async (data: any): Promise<any> => {
    return showDialog({
      title: 'Clear Pipeline',
      body: 'Are you sure you want to clear the pipeline?',
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Clear' })]
    }).then(result => {
      if (result.button.accept) {
        // select all canvas elements
        contextRef.current.model.fromString('');
      }
    });
  }, []);

  const onAction = useCallback(
    (args: { type: string; payload?: any }) => {
      console.log(args.type);
      switch (args.type) {
        case 'save':
          contextRef.current.save();
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
        case 'openFile':
          commands.execute(commandIDs.openDocManager, { path: args.payload });
          break;
        default:
          break;
      }
    },
    [
      handleRunPipeline,
      handleClearPipeline,
      handleExportPipeline,
      panelOpen,
      shell,
      commands
    ]
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
        action: '',
        label: `Runtime: ${pipelineRuntime?.display_name ?? 'Generic'}`,
        incLabelWithIcon: 'before',
        enable: false,
        kind: 'tertiary',
        // TODO: use getRuntimeIcon
        iconEnabled: IconUtil.encode(
          pipelineRuntime?.name === 'kfp'
            ? kubeflowIcon
            : pipelineRuntime?.name === 'airflow'
            ? airflowIcon
            : pipelineIcon
        )
      },
      {
        action: 'toggleOpenPanel',
        label: panelOpen ? 'Close Panel' : 'Open Panel',
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
      if (shell.currentWidget?.id !== widgetId) {
        return;
      }

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
            fileWidget?.dispose();
          }
          item.op = PipelineService.getNodeType(item.path);
          item.path = PipelineService.getPipelineRelativeNodePath(
            contextRef.current.path,
            item.path
          );
          item.x = (location?.x ?? 0) + position;
          item.y = (location?.y ?? 0) + position;

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

      return;
    },
    [browserFactory.defaultBrowser, defaultPosition, shell, widgetId]
  );

  const handleDrop = async (e: IDragEvent): Promise<void> => {
    handleAddFileToPipeline({ x: e.offsetX, y: e.offsetY });
  };

  useEffect(() => {
    const handleSignal = (): void => {
      handleAddFileToPipeline();
    };
    addFileToPipelineSignal.connect(handleSignal);
    return (): void => {
      addFileToPipelineSignal.disconnect(handleSignal);
    };
  }, [addFileToPipelineSignal, handleAddFileToPipeline]);

  const handleClose = (event?: React.SyntheticEvent, reason?: string): void => {
    if (reason === 'clickaway') {
      return;
    }

    setAlert('');
  };

  if (loading) {
    return <div>loading</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <Snackbar
        open={alert !== ''}
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
          nodes={updatedNodes}
          toolbar={toolbar}
          pipeline={pipeline}
          onAction={onAction}
          onChange={onChange}
          onDoubleClickNode={handleOpenFile}
          onError={onError}
          onFileRequested={onFileRequested}
          onPropertiesUpdateRequested={onPropertiesUpdateRequested}
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
    // Creates a blank widget with a DocumentWidget wrapper
    const props = {
      shell: this.shell,
      commands: this.commands,
      browserFactory: this.browserFactory,
      context: context,
      addFileToPipelineSignal: this.addFileToPipelineSignal
    };
    const content = new PipelineEditorWidget(props);

    const widget = new DocumentWidget({ content, context });
    widget.addClass(PIPELINE_CLASS);
    widget.title.icon = pipelineIcon;
    return widget;
  }
}
