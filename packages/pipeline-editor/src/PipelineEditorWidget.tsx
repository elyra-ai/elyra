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

import {
  PipelineEditor,
  PipelineOutOfDateError,
  ThemeProvider
} from '@elyra/pipeline-editor';
import { ContentParser } from '@elyra/services';
import {
  IconUtil,
  clearPipelineIcon,
  exportPipelineIcon,
  pipelineIcon,
  savePipelineIcon,
  showBrowseFileDialog,
  runtimesIcon,
  containerIcon,
  Dropzone,
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

import { toArray } from '@lumino/algorithm';
import { IDragEvent } from '@lumino/dragdrop';
import { Signal } from '@lumino/signaling';
import { Snackbar } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';

import * as React from 'react';

import { usePipeline } from './pipeline/use-pipeline';
import pipelineProperties from './pipelineProperties';
import {
  PipelineService,
  RUNTIMES_NAMESPACE,
  RUNTIME_IMAGES_NAMESPACE
} from './PipelineService';
import { theme } from './theme';

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

const PipelineWrapper: React.FC<IProps> = ({
  context,
  browserFactory,
  shell,
  commands,
  addFileToPipelineSignal,
  widgetId
}) => {
  const pipelinePath = context.path;

  const {
    pipeline,
    palette,
    updatePipeline,
    migratePipeline,
    savePipeline
  } = usePipeline(context);

  const commandsRef = React.useRef(commands);
  const browserFactoryRef = React.useRef(browserFactory);
  const addFileToPipelineSignalRef = React.useRef(addFileToPipelineSignal);
  const shellRef = React.useRef(shell);
  const ref = React.useRef<any>(null);

  const [panelOpen, setPanelOpen] = React.useState(false);
  const [alert, setAlert] = React.useState('');

  const onChange = React.useCallback(
    (pipeline: any): void => {
      updatePipeline(pipeline);
    },
    [updatePipeline]
  );

  const onError = React.useCallback(
    (error?: Error): void => {
      if (error instanceof PipelineOutOfDateError) {
        showDialog({
          title: 'Migrate pipeline?',
          body: (
            <p>
              This pipeline corresponds to an older version of Elyra and needs
              to be migrated.
              <br />
              Although the pipeline can be further edited and/or submitted after
              its update,
              <br />
              the migration will not be completed until the pipeline has been
              saved within the editor.
              <br />
              <br />
              Proceed with migration?
            </p>
          ),
          buttons: [Dialog.cancelButton(), Dialog.okButton()]
        }).then(result => {
          if (result.button.accept) {
            migratePipeline();
          } else {
            if (shellRef.current.currentWidget) {
              shellRef.current.currentWidget.close();
            }
          }
        });
      } else {
        showDialog({
          title: 'Load pipeline failed!',
          body: <p> {error || ''} </p>,
          buttons: [Dialog.okButton()]
        }).then(() => {
          if (shellRef.current.currentWidget) {
            shellRef.current.currentWidget.close();
          }
        });
      }
    },
    [migratePipeline]
  );

  const onFileRequested = async (args: any): Promise<string[] | undefined> => {
    const filename = PipelineService.getWorkspaceRelativeNodePath(
      pipelinePath,
      args.filename ?? ''
    );

    switch (args.propertyID) {
      case 'elyra_dependencies':
        {
          const res = await showBrowseFileDialog(
            browserFactoryRef.current.defaultBrowser.model.manager,
            {
              multiselect: true,
              includeDir: true,
              rootPath: PathExt.dirname(filename),
              filter: (model: any): boolean => {
                return model.path !== filename;
              }
            }
          );

          if (res.button.accept && res.value.length) {
            return res.value.map((v: any) => v.path);
          }
        }
        break;
      default:
        {
          const res = await showBrowseFileDialog(
            browserFactoryRef.current.defaultBrowser.model.manager,
            {
              startPath: PathExt.dirname(filename),
              filter: (model: any): boolean => {
                if (args.filters?.File === undefined) {
                  return true;
                }

                const ext = PathExt.extname(model.path);
                return args.filters.File.includes(ext);
              }
            }
          );

          if (res.button.accept && res.value.length) {
            const file = PipelineService.getPipelineRelativeNodePath(
              pipelinePath,
              res.value[0].path
            );
            return [file];
          }
        }
        break;
    }

    return undefined;
  };

  const onPropertiesUpdateRequested = async (args: any): Promise<any> => {
    const path = PipelineService.getWorkspaceRelativeNodePath(
      pipelinePath,
      args.elyra_filename
    );
    const new_env_vars = await ContentParser.getEnvVars(
      path
    ).then((response: any) => response.map((str: string) => (str = str + '=')));

    const env_vars = args.elyra_env_vars ?? [];
    const merged_env_vars = [
      ...env_vars,
      ...new_env_vars.filter(
        (new_var: string) =>
          !env_vars.some((old_var: string) => old_var.startsWith(new_var))
      )
    ];

    return {
      elyra_env_vars: merged_env_vars.filter(Boolean)
    };
  };

  const handleOpenFile = (data: any): void => {
    for (let i = 0; i < data.selectedObjectIds.length; i++) {
      const node = pipeline.pipelines[0].nodes.find(
        (node: any) => node.id === data.selectedObjectIds[i]
      );
      if (!node?.app_data?.component_parameters?.filename) {
        continue;
      }
      const path = PipelineService.getWorkspaceRelativeNodePath(
        pipelinePath,
        node.app_data.component_parameters.filename
      );
      commandsRef.current.execute(commandIDs.openDocManager, { path });
    }
  };

  const handleClearPipeline = React.useCallback(async (data: any): Promise<
    any
  > => {
    return showDialog({
      title: 'Clear Pipeline',
      body: 'Are you sure you want to clear the pipeline?',
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Clear' })]
    }).then(result => {
      if (result.button.accept) {
        // TODO: nick - look into why we need such a complex "clear" logic
        // const newPipeline: any = contextRef.current.model.toJSON();
        // if (newPipeline?.pipelines?.[0]?.nodes?.length > 0) {
        //   newPipeline.pipelines[0].nodes = [];
        // }
        // const pipelineProperties =
        //   newPipeline?.pipelines?.[0]?.app_data?.properties;
        // if (pipelineProperties) {
        //   // Remove all fields of pipeline properties except for the name/runtime (readonly)
        //   newPipeline.pipelines[0].app_data.properties = {
        //     name: pipelineProperties.name,
        //     runtime: pipelineProperties.runtime
        //   };
        // }
        // contextRef.current.model.fromJSON(newPipeline);
      }
    });
  }, []);

  const onAction = React.useCallback(
    (args: { type: string; payload?: any }) => {
      switch (args.type) {
        case 'save':
          savePipeline();
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
          shellRef.current.activateById(`elyra-metadata:${RUNTIMES_NAMESPACE}`);
          break;
        case 'openRuntimeImages':
          shellRef.current.activateById(
            `elyra-metadata:${RUNTIME_IMAGES_NAMESPACE}`
          );
          break;
        case 'openFile':
          commandsRef.current.execute(commandIDs.openDocManager, {
            path: PipelineService.getWorkspaceRelativeNodePath(
              pipelinePath,
              args.payload
            )
          });
          break;
        default:
          break;
      }
    },
    [handleClearPipeline, panelOpen, pipelinePath, savePipeline]
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
      {
        action: 'openRuntimeImages',
        label: 'Open Runtime Images',
        enable: true,
        iconEnabled: IconUtil.encode(containerIcon),
        iconDisabled: IconUtil.encode(containerIcon)
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
        label: `Runtime: ${pipelineRuntimeDisplayName ?? 'Generic'}`,
        incLabelWithIcon: 'before',
        enable: false,
        kind: 'tertiary',
        iconEnabled: IconUtil.encode(
          pipelineRuntimeName === 'kfp'
            ? kubeflowIcon
            : pipelineRuntimeName === 'airflow'
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

  const defaultPositionRef = React.useRef(10);

  const handleAddFileToPipeline = React.useCallback(
    (location?: { x: number; y: number }) => {
      const fileBrowser = browserFactoryRef.current.defaultBrowser;
      // Only add file to pipeline if it is currently in focus
      if (shellRef.current.currentWidget?.id !== widgetId) {
        return;
      }

      let failedAdd = 0;
      let position = 0;
      const missingXY = !location;

      // if either x or y is undefined use the default coordinates
      if (missingXY) {
        position = defaultPositionRef.current;
        location = {
          x: 75,
          y: 85
        };
      }

      toArray(fileBrowser.selectedItems()).map((item: any): void => {
        if (PipelineService.isSupportedNode(item)) {
          item.op = PipelineService.getNodeType(item.path);
          item.path = PipelineService.getPipelineRelativeNodePath(
            pipelinePath,
            item.path
          );
          item.x = (location?.x ?? 0) + position;
          item.y = (location?.y ?? 0) + position;

          const success = ref.current?.addFile({
            nodeTemplate: {
              op: item.op
            },
            offsetX: item.x,
            offsetY: item.y,
            path: item.path
          });

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
        defaultPositionRef.current = position;
      }

      if (failedAdd) {
        return showDialog({
          title: 'Unsupported File(s)',
          body:
            'Only supported files (Notebooks, Python scripts, and R scripts) can be added to a pipeline.',
          buttons: [Dialog.okButton()]
        });
      }

      return;
    },
    [pipelinePath, widgetId]
  );

  const handleDrop = async (e: IDragEvent): Promise<void> => {
    handleAddFileToPipeline({ x: e.offsetX, y: e.offsetY });
  };

  React.useEffect(() => {
    const handleSignal = (): void => {
      handleAddFileToPipeline();
    };
    const signal = addFileToPipelineSignalRef.current;
    signal.connect(handleSignal);
    return (): void => {
      signal.disconnect(handleSignal);
    };
  }, [handleAddFileToPipeline]);

  const handleClose = (_e: React.SyntheticEvent, reason?: string): void => {
    if (reason === 'clickaway') {
      return;
    }

    setAlert('');
  };

  if (status === 'loading' || palette === undefined) {
    return <div className="elyra-loader"></div>;
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
          palette={palette}
          pipelineProperties={pipelineProperties}
          toolbar={toolbar}
          pipeline={pipeline}
          onAction={onAction}
          onChange={onChange}
          onDoubleClickNode={handleOpenFile}
          onError={onError}
          onFileRequested={onFileRequested}
          onPropertiesUpdateRequested={onPropertiesUpdateRequested}
          leftPalette={true}
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
