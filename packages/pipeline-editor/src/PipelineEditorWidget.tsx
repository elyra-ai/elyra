/*
 * Copyright 2018-2025 Elyra Authors
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
import {
  migrate,
  validate,
  ComponentNotFoundError
} from '@elyra/pipeline-services';
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
  componentCatalogIcon,
  GenericObjectType
} from '@elyra/ui-components';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { Dialog, ReactWidget, showDialog } from '@jupyterlab/apputils';
import { PathExt } from '@jupyterlab/coreutils';
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget
} from '@jupyterlab/docregistry';
import { IDefaultFileBrowser } from '@jupyterlab/filebrowser';
import { ServiceManager } from '@jupyterlab/services';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import 'carbon-components/css/carbon-components.min.css';

import { toArray } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import {
  PartialJSONArray,
  PartialJSONObject,
  PartialJSONValue,
  ReadonlyPartialJSONObject
} from '@lumino/coreutils';
import { IDragEvent } from '@lumino/dragdrop';
import { Signal } from '@lumino/signaling';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  EmptyGenericPipeline,
  EmptyPlatformSpecificPipeline
} from './EmptyPipelineContent';
import { formDialogWidget } from './formDialogWidget';
import {
  IRuntimeComponentNodeType,
  IRuntimeComponentParameter,
  IRuntimeComponentsResponse,
  IRuntimeImage,
  usePalette,
  useRuntimeImages,
  useRuntimesSchema
} from './pipeline-hooks';
import { PipelineExportDialog } from './PipelineExportDialog';
import {
  PipelineService,
  RUNTIMES_SCHEMASPACE,
  RUNTIME_IMAGES_SCHEMASPACE,
  COMPONENT_CATALOGS_SCHEMASPACE,
  IRuntimeSchema
} from './PipelineService';
import { PipelineSubmissionDialog } from './PipelineSubmissionDialog';
import {
  createRuntimeData,
  getConfigDetails,
  IRuntimeData
} from './runtime-utils';
import { theme } from './theme';

import { getEmptyPipelineJson } from './index';

const PIPELINE_CLASS = 'elyra-PipelineEditor';

export const commandIDs = {
  openPipelineEditor: 'pipeline-editor:open',
  openMetadata: 'elyra-metadata:open',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled',
  saveDocManager: 'docmanager:save',
  submitScript: 'script-editor:submit',
  submitNotebook: 'notebook:submit',
  addFileToPipeline: 'pipeline-editor:add-node',
  refreshPalette: 'pipeline-editor:refresh-palette',
  openViewer: 'code-viewer:open'
};

interface IExtendedThemeProviderProps
  extends React.ComponentProps<typeof ThemeProvider> {
  children: React.ReactNode;
}

//extend ThemeProvider to accept the same props as original but with children prop as one of them.
const ExtendedThemeProvider: React.FC<IExtendedThemeProviderProps> = ({
  children,
  ...props
}) => {
  return <ThemeProvider {...props}>{children}</ThemeProvider>;
};

const getAllPaletteNodes = (
  palette: IRuntimeComponentsResponse | undefined
): IRuntimeComponentNodeType[] => {
  if (palette?.categories === undefined) {
    return [];
  }

  const nodes: IRuntimeComponentNodeType[] = [];
  for (const c of palette.categories) {
    if (c.node_types) {
      nodes.push(...c.node_types);
    }
  }

  return nodes;
};

const isRuntimeTypeAvailable = (data: IRuntimeData, type?: string): boolean => {
  for (const p of data.platforms) {
    if (type === undefined || p.id === type) {
      if (p.configs.length > 0) {
        return true;
      }
    }
  }
  return false;
};

const getDisplayName = (
  runtimesSchema?: IRuntimeSchema[],
  type?: string
): string | undefined => {
  if (!type) {
    return undefined;
  }
  const schema = runtimesSchema?.find((s) => s.runtime_type === type);
  return schema?.title;
};

interface IPipelineEditorWidgetProps {
  context: DocumentRegistry.Context;
  browserFactory: IDefaultFileBrowser;
  serviceManager: ServiceManager.IManager;
  shell: JupyterFrontEnd.IShell;
  commands: CommandRegistry;
  settings?: ISettingRegistry.ISettings;
  widgetId?: string;
  defaultRuntimeType: string;
}

class PipelineEditorWidget extends ReactWidget {
  addFileToPipelineSignal: Signal<
    PipelineEditorWidget,
    ReadonlyPartialJSONObject
  >;
  refreshPaletteSignal: Signal<PipelineEditorWidget, ReadonlyPartialJSONObject>;

  constructor(private readonly args: IPipelineEditorWidgetProps) {
    super();
    let nullPipeline = this.args.context.model.toJSON() === null;

    this.addFileToPipelineSignal = new Signal<
      PipelineEditorWidget,
      ReadonlyPartialJSONObject
    >(this);

    this.refreshPaletteSignal = new Signal<
      PipelineEditorWidget,
      ReadonlyPartialJSONObject
    >(this);

    this.args.context.model.contentChanged.connect(() => {
      if (nullPipeline) {
        nullPipeline = false;
        this.update();
      }
    });
    this.args.context.fileChanged.connect(() => {
      if (this.args.context.model.toJSON() === null) {
        const pipelineJson = getEmptyPipelineJson(this.args.defaultRuntimeType);
        this.args.context.model.fromString(JSON.stringify(pipelineJson));
      }
    });
  }

  render() {
    if (this.args.context.model.toJSON() === null) {
      return <div className="elyra-loader"></div>;
    }
    return (
      <PipelineWrapper
        context={this.args.context}
        browserFactory={this.args.browserFactory}
        shell={this.args.shell}
        commands={this.args.commands}
        addFileToPipelineSignal={this.addFileToPipelineSignal}
        refreshPaletteSignal={this.refreshPaletteSignal}
        widgetId={this.parent?.id}
        settings={this.args.settings}
        defaultRuntimeType={this.args.defaultRuntimeType}
        serviceManager={this.args.serviceManager}
      />
    );
  }
}

const PipelineWrapper: React.FC<
  IPipelineEditorWidgetProps & {
    addFileToPipelineSignal: Signal<
      PipelineEditorWidget,
      ReadonlyPartialJSONObject
    >;
    refreshPaletteSignal: Signal<
      PipelineEditorWidget,
      ReadonlyPartialJSONObject
    >;
  }
> = ({
  context,
  browserFactory,
  shell,
  commands,
  addFileToPipelineSignal,
  refreshPaletteSignal,
  settings,
  widgetId
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PipelineEditor API not typed
  const ref = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<GenericObjectType>(
    context.model.toJSON() as GenericObjectType
  );
  const [panelOpen, setPanelOpen] = React.useState(false);

  const type: string | undefined =
    pipeline?.pipelines?.[0]?.app_data?.runtime_type;

  const { data: runtimesSchema, error: runtimesSchemaError } =
    useRuntimesSchema();

  const doubleClickToOpenProperties =
    settings?.composite['doubleClickToOpenProperties'] ?? true;

  const runtimeDisplayName = getDisplayName(runtimesSchema, type) ?? 'Generic';

  const filePersistedRuntimeImages = useMemo(() => {
    const images: string[] = [];
    const pipelineDefaultRuntimeImage =
      pipeline?.pipelines?.[0]?.app_data?.properties?.pipeline_defaults
        ?.runtime_image;
    if (pipelineDefaultRuntimeImage?.length > 0) {
      images.push(pipelineDefaultRuntimeImage);
    }
    const nodes = pipeline?.pipelines?.[0]?.nodes;
    if (nodes?.length > 0) {
      for (const node of nodes) {
        const nodeRuntimeImage =
          node?.app_data?.component_parameters?.runtime_image;
        if (nodeRuntimeImage?.length > 0) {
          images.push(nodeRuntimeImage);
        }
      }
    }

    return images.map((imageName) => {
      return {
        name: imageName,
        display_name: imageName,
        metadata: {
          image_name: imageName
        }
      } as IRuntimeImage;
    });
  }, [pipeline]);

  const {
    data: palette,
    error: paletteError,
    mutate: mutatePalette
  } = usePalette(type, filePersistedRuntimeImages);

  useEffect(() => {
    const handleMutateSignal = (): void => {
      mutatePalette?.();
    };
    refreshPaletteSignal.connect(handleMutateSignal);
    return (): void => {
      refreshPaletteSignal.disconnect(handleMutateSignal);
    };
  }, [refreshPaletteSignal, mutatePalette]);

  const { data: runtimeImages, error: runtimeImagesError } = useRuntimeImages();

  useEffect(() => {
    if (runtimeImages?.length === 0) {
      RequestErrors.noMetadataError('runtime image');
    }
  }, [runtimeImages?.length]);

  useEffect(() => {
    if (paletteError) {
      RequestErrors.serverError(paletteError).then(() => {
        shell.currentWidget?.close();
      });
    }
  }, [paletteError, shell.currentWidget]);

  useEffect(() => {
    if (runtimeImagesError) {
      RequestErrors.serverError(runtimeImagesError).then(() => {
        shell.currentWidget?.close();
      });
    }
  }, [runtimeImagesError, shell.currentWidget]);

  useEffect(() => {
    if (runtimesSchemaError) {
      RequestErrors.serverError(runtimesSchemaError).then(() => {
        shell.currentWidget?.close();
      });
    }
  }, [runtimesSchemaError, shell.currentWidget]);

  const contextRef = useRef(context);
  useEffect(() => {
    const currentContext = contextRef.current;

    const changeHandler = (): void => {
      const pipelineJson = currentContext.model.toJSON() as GenericObjectType;

      // map IDs to display names
      const nodes = pipelineJson?.pipelines?.[0]?.nodes;
      if (nodes?.length > 0) {
        for (const node of nodes) {
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
          runtimeDisplayName;
      }
      setPipeline(pipelineJson);
      setLoading(false);
    };

    currentContext.ready.then(changeHandler);
    currentContext.model.contentChanged.connect(changeHandler);

    return (): void => {
      currentContext.model.contentChanged.disconnect(changeHandler);
    };
  }, [runtimeDisplayName]);

  const onChange = useCallback((pipelineJson: GenericObjectType): void => {
    const isNullOrEmpty = (
      value: PartialJSONValue | null | undefined
    ): boolean => value === null || value === undefined || value === '';

    const cleanArray = (arr: PartialJSONArray): PartialJSONArray => {
      const newArray: PartialJSONArray = [];

      for (const item of arr) {
        if (isNullOrEmpty(item)) {
          continue;
        }
        if (typeof item === 'object') {
          const itemCopy = JSON.parse(
            JSON.stringify(item)
          ) as PartialJSONObject;
          removeNullValues(itemCopy);
          newArray.push(itemCopy);
        } else {
          newArray.push(item);
        }
      }

      return newArray;
    };

    const removeNullValues = (data?: PartialJSONObject): void => {
      if (!data) {
        return;
      }

      for (const key in data) {
        const value = data[key];
        if (isNullOrEmpty(value)) {
          delete data[key];
        } else if (Array.isArray(value)) {
          data[key] = cleanArray(value);
        } else if (typeof value === 'object') {
          const objCopy = JSON.parse(JSON.stringify(value));
          removeNullValues(objCopy);
          data[key] = objCopy;
        }
      }
    };

    // Remove all null values from the pipeline
    for (const node of pipelineJson?.pipelines?.[0]?.nodes ?? []) {
      removeNullValues(node.app_data ?? {});
    }
    removeNullValues(
      pipelineJson?.pipelines?.[0]?.app_data?.properties?.pipeline_defaults ??
        {}
    );
    if (contextRef.current.isReady) {
      contextRef.current.model.fromString(
        JSON.stringify(pipelineJson, null, 2)
      );
    }
  }, []);

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
        }).then(async (result) => {
          isDialogAlreadyShowing.current = false;
          if (result.button.accept) {
            // proceed with migration
            console.log('migrating pipeline');
            const pipelineJSON =
              contextRef.current.model.toJSON() as GenericObjectType;
            try {
              const migratedPipeline = migrate(pipelineJSON, (pipeline) => {
                // function for updating to relative paths in v2
                // uses location of filename as expected in v1
                for (const node of pipeline.nodes) {
                  node.app_data.filename =
                    PipelineService.getPipelineRelativeNodePath(
                      contextRef.current.path,
                      node.app_data.filename
                    );
                }
                return pipeline;
              });
              contextRef.current.model.fromString(
                JSON.stringify(migratedPipeline, null, 2)
              );
            } catch (migrationError) {
              if (migrationError instanceof ComponentNotFoundError) {
                showDialog({
                  title: 'Pipeline migration aborted!',
                  body: (
                    <p>
                      {' '}
                      The pipeline you are trying to migrate uses example
                      components, which are not <br />
                      enabled in your environment. Complete the setup
                      instructions in{' '}
                      <a
                        href="https://elyra.readthedocs.io/en/v4.0.0rc5/user_guide/pipeline-components.html#example-custom-components"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Example Custom Components
                      </a>{' '}
                      and try again.
                    </p>
                  ),
                  buttons: [Dialog.okButton({ label: 'Close' })]
                }).then(() => {
                  shell.currentWidget?.close();
                });
              } else {
                showDialog({
                  title: 'Pipeline migration failed!',
                  body: <p> {(migrationError as Error)?.message || ''} </p>,
                  buttons: [Dialog.okButton()]
                }).then(() => {
                  shell.currentWidget?.close();
                });
              }
            }
          } else {
            shell.currentWidget?.close();
          }
        });
      } else {
        showDialog({
          title: 'Load pipeline failed!',
          body: <p> {error?.message || ''} </p>,
          buttons: [Dialog.okButton()]
        }).then(() => {
          isDialogAlreadyShowing.current = false;
          shell.currentWidget?.close();
        });
      }
    },
    [shell.currentWidget]
  );

  const onFileRequested = async (args: {
    filename?: string;
    propertyID?: string;
    filters?: { [key: string]: string[] };
  }): Promise<string[] | undefined> => {
    const pipelineFilePath = contextRef.current.path;
    const contextFilePath = args.filename
      ? PipelineService.getWorkspaceRelativeNodePath(
          pipelineFilePath,
          args.filename
        )
      : pipelineFilePath;
    const contextFolderPath = PathExt.dirname(contextFilePath);

    if (args.propertyID?.includes('dependencies')) {
      const res = await showBrowseFileDialog({
        manager: browserFactory.model.manager,
        multiselect: true,
        includeDir: true,
        rootPath: contextFolderPath,
        filter: (model) => {
          return model.path !== pipelineFilePath ? {} : null;
        }
      });

      if (res.button.accept && res.value?.length) {
        return res.value;
      }
    } else {
      const res = await showBrowseFileDialog({
        manager: browserFactory.model.manager,
        startPath: contextFolderPath,
        filter: (model) => {
          if (args.filters?.File === undefined || model.type === 'directory') {
            return {};
          }

          const ext = PathExt.extname(model.path);
          return args.filters.File.includes(ext) ? {} : null;
        }
      });

      if (res.button.accept && res.value?.length) {
        const file = PipelineService.getPipelineRelativeNodePath(
          contextRef.current.path,
          res.value[0]
        );
        return [file];
      }
    }

    return undefined;
  };

  const onPropertiesUpdateRequested = async (args: {
    component_parameters?: IRuntimeComponentParameter;
  }): Promise<{
    component_parameters?: IRuntimeComponentParameter;
  }> => {
    if (!contextRef.current.path || !args.component_parameters?.filename) {
      return args;
    }
    const path = PipelineService.getWorkspaceRelativeNodePath(
      contextRef.current.path,
      args.component_parameters.filename
    );
    const new_env_vars = await ContentParser.getEnvVars(path).then((response) =>
      response.map((str: string) => {
        return { env_var: str };
      })
    );

    const env_vars = args.component_parameters?.env_vars ?? [];
    const merged_env_vars = [
      ...env_vars,
      ...new_env_vars.filter(
        (new_var) =>
          !env_vars.some((old_var) => {
            return old_var.env_var === new_var.env_var;
          })
      )
    ];

    return {
      ...args,
      component_parameters: {
        ...args.component_parameters,
        env_vars: merged_env_vars.filter(Boolean)
      }
    };
  };

  const handleOpenComponentDef = useCallback(
    (componentId: string, componentSource: string) => {
      // Show error dialog if the component does not exist
      if (!componentId) {
        const dialogBody: string[] = [];
        try {
          const componentSourceJson = JSON.parse(componentSource);
          dialogBody.push(`catalog_type: ${componentSourceJson.catalog_type}`);
          for (const [key, value] of Object.entries(
            componentSourceJson.component_ref
          )) {
            dialogBody.push(`${key}: ${value}`);
          }
        } catch {
          dialogBody.push(componentSource);
        }
        return showDialog({
          title: 'Component not found',
          body: (
            <p>
              This node uses a component that is not stored in your component
              registry.
              {dialogBody.map((line, i) => (
                <span key={i}>
                  <br />
                  {line}
                </span>
              ))}
              <br />
              <br />
              <a
                href="https://elyra.readthedocs.io/en/v4.0.0rc5/user_guide/best-practices-custom-pipeline-components.html#troubleshooting-missing-pipeline-components"
                target="_blank"
                rel="noreferrer"
              >
                Learn more...
              </a>
            </p>
          ),
          buttons: [Dialog.okButton()]
        });
      }
      return PipelineService.getComponentDef(type, componentId)
        .then((res) => {
          if (!res) {
            return;
          }
          const nodeDef = getAllPaletteNodes(palette).find(
            (n) => n.id === componentId
          );
          commands.execute(commandIDs.openViewer, {
            content: res.content,
            mimeType: res.mimeType,
            label: nodeDef?.label ?? componentId
          });
        })
        .catch(async (e) => await RequestErrors.serverError(e));
    },
    [commands, palette, type]
  );

  const onDoubleClick = (data: { selectedObjectIds: string[] }): void => {
    for (let i = 0; i < data.selectedObjectIds.length; i++) {
      const node = pipeline.pipelines[0].nodes.find(
        (node: { id: string }) => node.id === data.selectedObjectIds[i]
      );
      const nodeDef = getAllPaletteNodes(palette).find(
        (n) => n.op === node?.op
      );
      if (node?.app_data?.component_parameters?.filename) {
        commands.execute(commandIDs.openDocManager, {
          path: PipelineService.getWorkspaceRelativeNodePath(
            contextRef.current.path,
            node.app_data.component_parameters.filename
          )
        });
      } else if (nodeDef && !nodeDef.app_data?.parameter_refs?.filehandler) {
        handleOpenComponentDef(nodeDef.id, node?.app_data?.component_source);
      }
    }
  };

  const handleSubmission = useCallback(
    async (actionType: 'run' | 'export'): Promise<void> => {
      const pipelineJson = context.model.toJSON() as GenericObjectType;
      // Check that all nodes are valid
      const errorMessages = validate(
        JSON.stringify(pipelineJson),
        getAllPaletteNodes(palette),
        palette?.properties
      );
      if (errorMessages && errorMessages.length > 0) {
        let errorMessage = '';
        for (const error of errorMessages) {
          errorMessage += (errorMessage ? '\n' : '') + error.message;
        }
        toast.error(`Failed ${actionType}: ${errorMessage}`);
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

      // TODO: Parallelize this
      const runtimeTypes = await PipelineService.getRuntimeTypes();
      const runtimes = await PipelineService.getRuntimes()
        .then((runtimeList) => {
          return runtimeList?.filter((runtime) => {
            return (
              !runtime.metadata.runtime_enabled &&
              !!runtimeTypes.find((r) => runtime.metadata.runtime_type === r.id)
            );
          });
        })
        .catch(async (error) => {
          await RequestErrors.serverError(error);
        });
      const schema = await PipelineService.getRuntimesSchema().catch(
        async (error) => {
          await RequestErrors.serverError(error);
        }
      );

      if (!runtimes) {
        await RequestErrors.noMetadataError('runtime');
        return;
      }

      if (!schema) {
        await RequestErrors.noMetadataError('schema');
        return;
      }

      const runtimeData = createRuntimeData({
        schema,
        runtimes,
        allowLocal: actionType === 'run'
      });

      let title =
        type !== undefined
          ? `${actionType} pipeline for ${runtimeDisplayName}`
          : `${actionType} pipeline`;

      if (actionType === 'export' || type !== undefined) {
        if (!isRuntimeTypeAvailable(runtimeData, type)) {
          const res = await RequestErrors.noMetadataError(
            'runtime',
            `${actionType} pipeline.`,
            type !== undefined ? runtimeDisplayName : undefined
          );

          if (res.button.label.includes(RUNTIMES_SCHEMASPACE)) {
            // Open the runtimes widget
            shell.activateById(`elyra-metadata:${RUNTIMES_SCHEMASPACE}`);
          }
          return;
        }
      }
      // Capitalize
      title = title.charAt(0).toUpperCase() + title.slice(1);

      let dialogOptions: Partial<Dialog.IOptions<GenericObjectType>>;

      pipelineJson.pipelines[0].app_data.properties.pipeline_parameters =
        pipelineJson.pipelines[0].app_data.properties.pipeline_parameters?.filter(
          (param: { name: string }) => {
            return !!pipelineJson.pipelines[0].nodes.find(
              (node: {
                app_data: {
                  component_parameters?: {
                    pipeline_parameters?: GenericObjectType;
                  };
                };
              }) => {
                return (
                  param.name !== '' &&
                  (node.app_data.component_parameters?.pipeline_parameters?.includes(
                    param.name
                  ) ||
                    (node.app_data.component_parameters &&
                      Object.values(node.app_data.component_parameters).find(
                        (property) =>
                          property.widget === 'parameter' &&
                          property.value === param.name
                      )))
                );
              }
            );
          }
        );

      const parameters =
        pipelineJson?.pipelines[0].app_data.properties.pipeline_parameters;

      switch (actionType) {
        case 'run':
          dialogOptions = {
            title,
            body: formDialogWidget(
              <PipelineSubmissionDialog
                name={pipelineName}
                runtimeData={runtimeData}
                pipelineType={type}
                parameters={parameters}
              />
            ),
            buttons: [Dialog.cancelButton(), Dialog.okButton()],
            defaultButton: 1,
            focusNodeSelector: '#pipeline_name'
          };
          break;
        case 'export':
          dialogOptions = {
            title,
            body: formDialogWidget(
              <PipelineExportDialog
                runtimeData={runtimeData}
                runtimeTypeInfo={runtimeTypes}
                pipelineType={type}
                exportName={pipelineName}
                parameters={parameters}
              />
            ),
            buttons: [Dialog.cancelButton(), Dialog.okButton()],
            defaultButton: 1,
            focusNodeSelector: '#runtime_config'
          };
          break;
      }

      const dialogResult = await showFormDialog(dialogOptions);

      if (dialogResult.value === null) {
        // When Cancel is clicked on the dialog, just return
        return;
      }

      // Clean null properties
      for (const node of pipelineJson.pipelines[0].nodes) {
        if (node.app_data.component_parameters.cpu === null) {
          delete node.app_data.component_parameters.cpu;
        }
        if (node.app_data.component_parameters.cpu_limit === null) {
          delete node.app_data.component_parameters.cpu_limit;
        }
        if (node.app_data.component_parameters.memory === null) {
          delete node.app_data.component_parameters.memory;
        }
        if (node.app_data.component_parameters.memory_limit === null) {
          delete node.app_data.component_parameters.memory_limit;
        }
        if (node.app_data.component_parameters.gpu === null) {
          delete node.app_data.component_parameters.gpu;
        }
      }

      const configDetails = getConfigDetails(
        runtimeData,
        dialogResult.value.runtime_config
      );

      PipelineService.setNodePathsRelativeToWorkspace(
        pipelineJson.pipelines[0],
        getAllPaletteNodes(palette),
        contextRef.current.path
      );

      // Metadata
      pipelineJson.pipelines[0].app_data.name =
        dialogResult.value.pipeline_name ?? pipelineName;
      pipelineJson.pipelines[0].app_data.source = PathExt.basename(
        contextRef.current.path
      );

      // Pipeline parameter overrides
      for (const paramIndex in parameters ?? []) {
        const param = parameters[paramIndex];
        if (param.name) {
          let paramOverride = dialogResult.value[`${param.name}-paramInput`];
          if (
            (param.default_value?.type === 'Integer' ||
              param.default_value?.type === 'Float') &&
            paramOverride !== ''
          ) {
            paramOverride = Number(paramOverride);
          }
          pipelineJson.pipelines[0].app_data.properties.pipeline_parameters[
            paramIndex
          ].value =
            paramOverride === '' ? param.default_value?.value : paramOverride;
        }
      }

      // Pipeline name
      pipelineJson.pipelines[0].app_data.name =
        dialogResult.value.pipeline_name ?? pipelineName;

      // Runtime info
      pipelineJson.pipelines[0].app_data.runtime_config =
        configDetails?.id ?? null;

      // Export info
      const pipeline_dir = PathExt.dirname(contextRef.current.path);
      const basePath = pipeline_dir ? `${pipeline_dir}/` : '';
      const exportType = dialogResult.value.pipeline_filetype;
      const exportName = dialogResult.value.export_name;
      const exportPath = `${basePath}${exportName}.${exportType}`;

      switch (actionType) {
        case 'run':
          PipelineService.submitPipeline(
            pipelineJson,
            configDetails?.platform.displayName ?? ''
          ).catch(async (error) => {
            await RequestErrors.serverError(error);
          });
          break;
        case 'export':
          PipelineService.exportPipeline(
            pipelineJson,
            exportType,
            exportPath,
            dialogResult.value.overwrite
          ).catch(async (error) => {
            await RequestErrors.serverError(error);
          });
          break;
      }
    },
    [context.model, palette, runtimeDisplayName, type, shell]
  );

  const handleClearPipeline = useCallback(async (): Promise<void> => {
    return showDialog({
      title: 'Clear Pipeline',
      body: 'Are you sure you want to clear the pipeline?',
      buttons: [
        Dialog.cancelButton(),
        Dialog.okButton({ label: 'Clear All' }),
        Dialog.okButton({ label: 'Clear Canvas' })
      ]
    }).then((result) => {
      if (result.button.accept) {
        const newPipeline =
          contextRef.current.model.toJSON() as GenericObjectType;
        if (newPipeline?.pipelines?.[0]?.nodes?.length > 0) {
          newPipeline.pipelines[0].nodes = [];
        }
        // remove supernode pipelines
        newPipeline.pipelines = [newPipeline.pipelines[0]];
        // only clear pipeline properties when "Clear All" is selected
        if (result.button.label === 'Clear All') {
          const pipelineProperties =
            newPipeline?.pipelines?.[0]?.app_data?.properties;
          if (pipelineProperties) {
            // Remove all fields of pipeline properties except for the name/runtime (readonly)
            newPipeline.pipelines[0].app_data.properties = {
              name: pipelineProperties.name,
              runtime: pipelineProperties.runtime
            };
          }
        }
        contextRef.current.model.fromJSON(newPipeline);
      }
    });
  }, []);

  const onAction = useCallback(
    (args: { type: string; payload?: GenericObjectType | string }) => {
      switch (args.type) {
        case 'save':
          contextRef.current.save();
          break;
        case 'run':
        case 'export':
          handleSubmission(args.type);
          break;
        case 'clear':
          handleClearPipeline();
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
        case 'openComponentCatalogs':
          shell.activateById(
            `elyra-metadata:${COMPONENT_CATALOGS_SCHEMASPACE}`
          );
          break;
        case 'openFile':
          if (typeof args.payload !== 'string') {
            return;
          }
          commands.execute(commandIDs.openDocManager, {
            path: PipelineService.getWorkspaceRelativeNodePath(
              contextRef.current.path,
              args.payload
            )
          });
          break;
        case 'openComponentDef':
          if (!args.payload || typeof args.payload !== 'object') {
            return;
          }
          handleOpenComponentDef(
            args.payload.componentId,
            args.payload.componentSource
          );
          break;
        default:
          break;
      }
    },
    [
      handleSubmission,
      handleClearPipeline,
      panelOpen,
      shell,
      commands,
      handleOpenComponentDef
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
        action: 'openComponentCatalogs',
        label: 'Open Component Catalogs',
        enable: true,
        iconEnabled: IconUtil.encode(componentCatalogIcon),
        iconDisabled: IconUtil.encode(componentCatalogIcon)
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
        label: `Runtime: ${runtimeDisplayName}`,
        incLabelWithIcon: 'before',
        enable: false,
        kind: 'tertiary'
        // TODO: re-add icon
        // iconEnabled: IconUtil.encode(ICON_MAP[type ?? ''] ?? pipelineIcon)
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
      const fileBrowser = browserFactory;
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PipelineEditor API not typed
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
          body: 'Only supported files (Notebooks, Python scripts, and R scripts) can be added to a pipeline.',
          buttons: [Dialog.okButton()]
        });
      }

      return;
    },
    [browserFactory, defaultPosition, shell, widgetId]
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

  if (loading || palette === undefined) {
    return <div className="elyra-loader"></div>;
  }

  const handleOpenCatalog = (): void => {
    shell.activateById(`elyra-metadata:${COMPONENT_CATALOGS_SCHEMASPACE}`);
  };

  const handleOpenSettings = (): void => {
    commands.execute('settingeditor:open', { query: 'Pipeline Editor' });
  };

  return (
    <ExtendedThemeProvider theme={theme}>
      <ToastContainer
        position="bottom-center"
        autoClose={30000}
        hideProgressBar
        closeOnClick={false}
        className="elyra-PipelineEditor-toast"
        draggable={false}
        theme="colored"
      />
      <Dropzone onDrop={handleDrop}>
        <PipelineEditor
          ref={ref}
          palette={palette}
          pipelineProperties={palette.properties}
          pipelineParameters={palette.parameters}
          toolbar={toolbar}
          pipeline={pipeline}
          onAction={onAction}
          onChange={onChange}
          onDoubleClickNode={
            doubleClickToOpenProperties ? undefined : onDoubleClick
          }
          onError={onError}
          onFileRequested={onFileRequested}
          onPropertiesUpdateRequested={onPropertiesUpdateRequested}
          leftPalette={true}
        >
          {type === undefined ? (
            <EmptyGenericPipeline onOpenSettings={handleOpenSettings} />
          ) : (
            <EmptyPlatformSpecificPipeline
              onOpenCatalog={handleOpenCatalog}
              onOpenSettings={handleOpenSettings}
            />
          )}
        </PipelineEditor>
      </Dropzone>
    </ExtendedThemeProvider>
  );
};

export class PipelineEditorFactory extends ABCWidgetFactory<DocumentWidget> {
  browserFactory: IDefaultFileBrowser;
  shell: JupyterFrontEnd.IShell;
  commands: CommandRegistry;
  serviceManager: ServiceManager.IManager;
  settings: ISettingRegistry.ISettings | undefined;
  defaultRuntimeType: string;
  content?: PipelineEditorWidget;

  constructor(
    options: Pick<
      IPipelineEditorWidgetProps,
      | 'shell'
      | 'commands'
      | 'browserFactory'
      | 'serviceManager'
      | 'settings'
      | 'defaultRuntimeType'
    > &
      Pick<
        DocumentRegistry.IWidgetFactoryOptions<DocumentWidget>,
        'name' | 'fileTypes' | 'defaultFor'
      >
  ) {
    super(options);
    this.browserFactory = options.browserFactory;
    this.shell = options.shell;
    this.commands = options.commands;
    this.settings = options.settings;
    this.serviceManager = options.serviceManager;
    this.defaultRuntimeType = options.defaultRuntimeType;
  }

  get addFileToPipelineSignal() {
    return this.content?.addFileToPipelineSignal;
  }

  get refreshPaletteSignal() {
    return this.content?.refreshPaletteSignal;
  }

  protected createNewWidget(context: DocumentRegistry.Context): DocumentWidget {
    // Creates a blank widget with a DocumentWidget wrapper
    const props: IPipelineEditorWidgetProps = {
      shell: this.shell,
      commands: this.commands,
      browserFactory: this.browserFactory,
      context: context,
      settings: this.settings,
      defaultRuntimeType: this.defaultRuntimeType,
      serviceManager: this.serviceManager
    };
    this.content = new PipelineEditorWidget(props);

    const widget = new DocumentWidget({ content: this.content, context });
    widget.addClass(PIPELINE_CLASS);
    widget.title.icon = pipelineIcon;
    return widget;
  }
}
