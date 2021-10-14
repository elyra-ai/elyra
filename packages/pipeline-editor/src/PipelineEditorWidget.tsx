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
import { migrate, validate } from '@elyra/pipeline-services';
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
  RequestErrors,
  showFormDialog,
  kubeflowIcon,
  airflowIcon,
  argoIcon,
  pipelineComponentsIcon
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

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { formDialogWidget } from './formDialogWidget';
import {
  usePalette,
  useRuntimeImages,
  useRuntimesSchema
} from './pipeline-hooks';
import { PipelineExportDialog } from './PipelineExportDialog';
import pipelineProperties from './pipelineProperties';
import {
  IRuntime,
  ISchema,
  PipelineService,
  RUNTIMES_SCHEMASPACE,
  RUNTIME_IMAGES_SCHEMASPACE,
  PIPELINE_COMPONENTS_SCHEMASPACE
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

const getAllPaletteNodes = (palette: any): any[] => {
  if (palette.categories === undefined) {
    return [];
  }

  const nodes = [];
  for (const c of palette.categories) {
    if (c.node_types) {
      nodes.push(...c.node_types);
    }
  }

  return nodes;
};

const getRuntimeDisplayName = (
  schemas: { name: string; display_name: string }[] | undefined,
  runtime: string | undefined
): string | undefined => {
  const schema = schemas?.find(s => s.name === runtime);
  return schema?.display_name;
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
  const ref = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [alert, setAlert] = React.useState('');

  const pipelineRuntimeName = pipeline?.pipelines?.[0]?.app_data?.runtime;

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

  useEffect(() => {
    if (runtimeImages?.length === 0) {
      RequestErrors.noMetadataError('runtime image');
    }
  }, [runtimeImages?.length]);

  useEffect(() => {
    if (paletteError) {
      RequestErrors.serverError(paletteError);
    }
  }, [paletteError]);

  useEffect(() => {
    if (runtimeImagesError) {
      RequestErrors.serverError(runtimeImagesError);
    }
  }, [runtimeImagesError]);

  useEffect(() => {
    if (runtimesSchemaError) {
      RequestErrors.serverError(runtimesSchemaError);
    }
  }, [runtimesSchemaError]);

  const contextRef = useRef(context);
  useEffect(() => {
    const currentContext = contextRef.current;

    const changeHandler = (): void => {
      const pipelineJson: any = currentContext.model.toJSON();

      // map IDs to display names
      const nodes = pipelineJson?.pipelines?.[0]?.nodes;
      if (nodes?.length > 0) {
        for (const node of nodes) {
          if (node?.app_data?.component_parameters?.runtime_image) {
            const image = runtimeImages?.find(
              i =>
                i.metadata.image_name ===
                node.app_data.component_parameters.runtime_image
            );
            if (image) {
              node.app_data.component_parameters.runtime_image =
                image.display_name;
            }
          }

          if (node?.app_data?.component_parameters) {
            for (const [key, val] of Object.entries(
              node?.app_data?.component_parameters
            )) {
              if (val === null) {
                node.app_data.component_parameters[key] = undefined;
              }
            }
          }
        }
      }
      // TODO: don't persist this, but this will break things right now
      if (pipelineJson?.pipelines?.[0]?.app_data) {
        if (!pipelineJson.pipelines[0].app_data.properties) {
          pipelineJson.pipelines[0].app_data.properties = {};
        }
        const pipeline_path = contextRef.current.path;
        const pipeline_name = PathExt.basename(
          pipeline_path,
          PathExt.extname(pipeline_path)
        );
        pipelineJson.pipelines[0].app_data.properties.name = pipeline_name;
        pipelineJson.pipelines[0].app_data.properties.runtime =
          pipelineRuntimeDisplayName ?? 'Generic';
      }
      setPipeline(pipelineJson);
      setLoading(false);
    };

    currentContext.ready.then(changeHandler);
    currentContext.model.contentChanged.connect(changeHandler);

    return (): void => {
      currentContext.model.contentChanged.disconnect(changeHandler);
    };
  }, [pipelineRuntimeDisplayName, runtimeImages]);

  const onChange = useCallback(
    (pipelineJson: any): void => {
      if (contextRef.current.isReady) {
        if (pipelineJson?.pipelines?.[0]?.nodes) {
          // map display names to IDs
          const nodes = pipelineJson?.pipelines?.[0]?.nodes;
          if (nodes?.length > 0) {
            for (const node of nodes) {
              if (node?.app_data?.component_parameters?.runtime_image) {
                const image = runtimeImages?.find(
                  i =>
                    i.display_name ===
                    node.app_data.component_parameters.runtime_image
                );
                if (image) {
                  node.app_data.component_parameters.runtime_image =
                    image.metadata.image_name;
                }
              }
            }
          }
        }

        contextRef.current.model.fromString(
          JSON.stringify(pipelineJson, null, 2)
        );
      }
    },
    [runtimeImages]
  );

  const isDialogAlreadyShowing = useRef(false);
  const onError = useCallback(
    (error?: Error): void => {
      if (isDialogAlreadyShowing.current) {
        return; // bail, we are already showing a dialog.
      }
      isDialogAlreadyShowing.current = true;
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
          isDialogAlreadyShowing.current = false;
          if (result.button.accept) {
            // proceed with migration
            console.log('migrating pipeline');
            const migratedPipeline = migrate(
              contextRef.current.model.toJSON(),
              pipeline => {
                // function for updating to relative paths in v2
                // uses location of filename as expected in v1
                for (const node of pipeline.nodes) {
                  node.app_data.filename = PipelineService.getPipelineRelativeNodePath(
                    contextRef.current.path,
                    node.app_data.filename
                  );
                }
                return pipeline;
              }
            );
            contextRef.current.model.fromString(
              JSON.stringify(migratedPipeline, null, 2)
            );
          } else {
            shell.currentWidget?.close();
          }
        });
      } else {
        showDialog({
          title: 'Load pipeline failed!',
          body: <p> {error || ''} </p>,
          buttons: [Dialog.okButton()]
        }).then(() => {
          isDialogAlreadyShowing.current = false;
          shell.currentWidget?.close();
        });
      }
    },
    [shell.currentWidget]
  );

  const onFileRequested = async (args: any): Promise<string[] | undefined> => {
    const filename = PipelineService.getWorkspaceRelativeNodePath(
      contextRef.current.path,
      args.filename ?? ''
    );

    switch (args.propertyID) {
      case 'elyra_dependencies':
        {
          const res = await showBrowseFileDialog(
            browserFactory.defaultBrowser.model.manager,
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
            browserFactory.defaultBrowser.model.manager,
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
              contextRef.current.path,
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
      contextRef.current.path,
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
        contextRef.current.path,
        node.app_data.component_parameters.filename
      );
      commands.execute(commandIDs.openDocManager, { path });
    }
  };

  const cleanNullProperties = React.useCallback((): void => {
    // Delete optional fields that have null value
    for (const node of pipeline?.pipelines[0].nodes) {
      if (node.app_data.component_parameters.cpu === null) {
        delete node.app_data.component_parameters.cpu;
      }
      if (node.app_data.component_parameters.memory === null) {
        delete node.app_data.component_parameters.memory;
      }
      if (node.app_data.component_parameters.gpu === null) {
        delete node.app_data.component_parameters.gpu;
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
    const errorMessages = validate(
      JSON.stringify(pipelineJson),
      getAllPaletteNodes(palette)
    );
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
      runtimes.button.label.includes(RUNTIMES_SCHEMASPACE) &&
        shell.activateById(`elyra-metadata:${RUNTIMES_SCHEMASPACE}`);
      return;
    }

    const schema = await PipelineService.getRuntimesSchema().catch(error =>
      RequestErrors.serverError(error)
    );

    let title = 'Export pipeline';
    if (
      pipelineRuntimeDisplayName !== undefined &&
      pipelineRuntimeName !== undefined
    ) {
      title = `Export pipeline for ${pipelineRuntimeDisplayName}`;
      const filteredRuntimeOptions = PipelineService.filterRuntimes(
        runtimes,
        pipelineRuntimeName
      );
      if (filteredRuntimeOptions.length === 0) {
        const runtimes = await RequestErrors.noMetadataError(
          'runtime',
          'export pipeline.',
          pipelineRuntimeDisplayName
        );
        if (Utils.isDialogResult(runtimes)) {
          if (runtimes.button.label.includes(RUNTIMES_SCHEMASPACE)) {
            // Open the runtimes widget
            shell.activateById(`elyra-metadata:${RUNTIMES_SCHEMASPACE}`);
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
  }, [
    cleanNullProperties,
    context.model,
    palette,
    pipelineRuntimeDisplayName,
    pipelineRuntimeName,
    shell
  ]);

  const handleRunPipeline = useCallback(async (): Promise<void> => {
    const pipelineJson: any = context.model.toJSON();
    // Check that all nodes are valid
    const errorMessages = validate(
      JSON.stringify(pipelineJson),
      getAllPaletteNodes(palette)
    );
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
    if (
      pipelineRuntimeDisplayName !== undefined &&
      pipelineRuntimeName !== undefined
    ) {
      title = `Run pipeline on ${pipelineRuntimeDisplayName}`;
      const filteredRuntimeOptions = PipelineService.filterRuntimes(
        runtimes,
        pipelineRuntimeName
      );
      if (filteredRuntimeOptions.length === 0) {
        const runtimes = await RequestErrors.noMetadataError(
          'runtime',
          'run pipeline.',
          pipelineRuntimeDisplayName
        );
        if (Utils.isDialogResult(runtimes)) {
          if (runtimes.button.label.includes(RUNTIMES_SCHEMASPACE)) {
            // Open the runtimes widget
            shell.activateById(`elyra-metadata:${RUNTIMES_SCHEMASPACE}`);
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
  }, [
    cleanNullProperties,
    context.model,
    palette,
    pipelineRuntimeDisplayName,
    pipelineRuntimeName,
    shell
  ]);

  const handleClearPipeline = useCallback(async (data: any): Promise<any> => {
    return showDialog({
      title: 'Clear Pipeline',
      body: 'Are you sure you want to clear the pipeline?',
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Clear' })]
    }).then(result => {
      if (result.button.accept) {
        const newPipeline: any = contextRef.current.model.toJSON();
        if (newPipeline?.pipelines?.[0]?.nodes?.length > 0) {
          newPipeline.pipelines[0].nodes = [];
        }
        const pipelineProperties =
          newPipeline?.pipelines?.[0]?.app_data?.properties;
        if (pipelineProperties) {
          // Remove all fields of pipeline properties except for the name/runtime (readonly)
          newPipeline.pipelines[0].app_data.properties = {
            name: pipelineProperties.name,
            runtime: pipelineProperties.runtime
          };
        }
        contextRef.current.model.fromJSON(newPipeline);
      }
    });
  }, []);

  const onAction = useCallback(
    (args: { type: string; payload?: any }) => {
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
          shell.activateById(`elyra-metadata:${RUNTIMES_SCHEMASPACE}`);
          break;
        case 'openRuntimeImages':
          shell.activateById(`elyra-metadata:${RUNTIME_IMAGES_SCHEMASPACE}`);
          break;
        case 'openPipelineComponents':
          shell.activateById(
            `elyra-metadata:${PIPELINE_COMPONENTS_SCHEMASPACE}`
          );
          break;
        case 'openFile':
          commands.execute(commandIDs.openDocManager, {
            path: PipelineService.getWorkspaceRelativeNodePath(
              contextRef.current.path,
              args.payload
            )
          });
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
      {
        action: 'openRuntimeImages',
        label: 'Open Runtime Images',
        enable: true,
        iconEnabled: IconUtil.encode(containerIcon),
        iconDisabled: IconUtil.encode(containerIcon)
      },
      {
        action: 'openPipelineComponents',
        label: 'Open Pipeline Components',
        enable: true,
        iconEnabled: IconUtil.encode(pipelineComponentsIcon),
        iconDisabled: IconUtil.encode(pipelineComponentsIcon)
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
            : pipelineRuntimeName === 'argo'
            ? argoIcon
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
          item.op = PipelineService.getNodeType(item.path);
          item.path = PipelineService.getPipelineRelativeNodePath(
            contextRef.current.path,
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
        setDefaultPosition(position);
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

  if (loading || palette === undefined) {
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
