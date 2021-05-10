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

import React, { FC, useCallback, useEffect, useRef, useState } from "react";

import { PipelineEditor, ThemeProvider } from "@elyra/pipeline-editor";
import { useComponents, useRuntimeImages } from "@elyra/services";
import {
  IconUtil,
  clearPipelineIcon,
  exportPipelineIcon,
  pipelineIcon,
  savePipelineIcon,
  showBrowseFileDialog,
  runtimesIcon,
  Dropzone,
} from "@elyra/ui-components";
import { ILabShell } from "@jupyterlab/application";
import { ReactWidget, showDialog } from "@jupyterlab/apputils";
import { PathExt } from "@jupyterlab/coreutils";
import {
  DocumentRegistry,
  ABCWidgetFactory,
  DocumentWidget,
  Context,
} from "@jupyterlab/docregistry";
import { IFileBrowserFactory } from "@jupyterlab/filebrowser";
import { toArray } from "@lumino/algorithm";
import { IDragEvent } from "@lumino/dragdrop";
import { Signal } from "@lumino/signaling";
import { Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import { clearPipeline, unsupportedFile, unknownError } from "../dialogs";
import { theme } from "../theme";

const PIPELINE_CLASS = "elyra-PipelineEditor";

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
        widgetId={this.parent?.id ?? ""}
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
  widgetId: string;
}

const PipelineWrapper: FC<IProps> = ({
  context,
  browserFactory,
  shell,
  commands,
  addFileToPipelineSignal,
  widgetId,
}) => {
  const { data: runtimeImages } = useRuntimeImages();
  // const { data: runtimes } = useRuntimes();
  const { data: nodes } = useComponents("generic");

  // TODO: don't do this...
  const updatedNodes = JSON.parse(JSON.stringify(nodes));
  for (const node of updatedNodes) {
    node.properties.uihints.parameter_info[1].data.items = runtimeImages?.map(
      (i) => i.display_name
    );
  }

  const ref = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any>();
  const [panelOpen, setPanelOpen] = useState(false);
  const [alert, setAlert] = useState<string>();

  const contextRef = useRef(context);
  useEffect(() => {
    const currentContext = contextRef.current;

    const changeHandler = (): void => {
      const pipelineJson: any = currentContext.model.toJSON();
      if (pipelineJson?.pipelines?.[0]?.nodes) {
        // Update to display actual value of runtime image
        for (const node of pipelineJson?.pipelines?.[0]?.nodes) {
          const app_data = node?.app_data;
          if (app_data?.runtime_image) {
            const image = runtimeImages?.find(
              (i) => i.metadata.image_name === app_data.runtime_image
            );
            if (image) {
              app_data.runtime_image = image.display_name;
            }
          }
        }
      }
      setPipeline(pipelineJson);
      setLoading(false);
    };

    currentContext.model.contentChanged.connect(changeHandler);

    currentContext.ready.then(changeHandler);

    return (): void => {
      currentContext.model.contentChanged.disconnect(changeHandler);
    };
  }, [runtimeImages]);

  const onChange = useCallback(
    (pipelineJson: any): void => {
      if (contextRef.current.isReady) {
        if (pipelineJson?.pipelines?.[0]?.nodes) {
          // Update to store tag of runtime image
          for (const node of pipelineJson?.pipelines?.[0]?.nodes) {
            const app_data = node?.app_data;
            if (app_data?.runtime_image) {
              const image = runtimeImages?.find(
                (i) => i.display_name === app_data?.runtime_image
              );
              if (image) {
                app_data.runtime_image = image?.metadata.image_name;
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

  const onError = async (error?: Error) => {
    await showDialog(unknownError(error?.message ?? ""));

    if (shell.currentWidget) {
      shell.currentWidget.close();
    }
  };

  const onFileRequested = (args: any): Promise<string> => {
    let currentExt = "";
    if (args && args.filters && args.filters.File) {
      currentExt = args.filters.File[0];
    }

    const filename = PathExt.resolve(PathExt.dirname(contextRef.current.path));

    return showBrowseFileDialog(browserFactory.defaultBrowser.model.manager, {
      startPath: PathExt.dirname(filename),
      multiselect: args.canSelectMany,
      filter: (model: any): boolean => {
        const ext = PathExt.extname(model.path);
        return currentExt === "" || currentExt === ext;
      },
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
        (node: any) => node.id === data.selectedObjectIds[i]
      );
      if (!node || !node.app_data || !node.app_data.filename) {
        continue;
      }

      const path = PathExt.resolve(
        PathExt.dirname(contextRef.current.path),
        node.app_data.filename
      );

      commands.execute("docmanager:open", { path });
    }
  };

  // const cleanNullProperties = useCallback((): void => {
  //   // Delete optional fields that have null value
  //   for (const node of pipeline?.pipelines[0].nodes) {
  //     if (node.app_data.cpu === null) {
  //       delete node.app_data.cpu;
  //     }
  //     if (node.app_data.memory === null) {
  //       delete node.app_data.memory;
  //     }
  //     if (node.app_data.gpu === null) {
  //       delete node.app_data.gpu;
  //     }
  //   }
  // }, [pipeline?.pipelines]);

  // const handleExportPipeline = useCallback(async (): Promise<void> => {
  //   const pipelineJson: any = context.model.toJSON();
  //   // prepare pipeline submission details
  //   // Warn user if the pipeline has invalid nodes
  //   if (!pipelineJson) {
  //     setAlert("Failed export: Cannot export empty pipelines.");
  //     return;
  //   }
  //   const errorMessages = validate(JSON.stringify(pipelineJson), nodes);
  //   if (errorMessages && errorMessages.length > 0) {
  //     let errorMessage = "";
  //     for (const error of errorMessages) {
  //       errorMessage += error.message;
  //     }
  //     setAlert(`Failed export: ${errorMessage}`);
  //     return;
  //   }

  //   if (contextRef.current.model.dirty) {
  //     const dialogResult = await showDialog(
  //       unsavedChanges({ type: "pipeline" })
  //     );
  //     if (dialogResult.button && dialogResult.button.accept === true) {
  //       await contextRef.current.save();
  //     } else {
  //       // Don't proceed if cancel button pressed
  //       return;
  //     }
  //   }

  //   if (runtimes === undefined) {
  //     // TODO: prompt user if they want to open runtimes panel
  //     // shell.activateById(`elyra-metadata:${RUNTIMES_NAMESPACE}`);
  //     return;
  //   }

  //   const dialogResult = await showFormDialog(
  //     exportPipelineDialog({ runtimes })
  //   );

  //   if (dialogResult.value == null) {
  //     // When Cancel is clicked on the dialog, just return
  //     return;
  //   }

  //   // prepare pipeline submission details
  //   const pipeline_path = contextRef.current.path;

  //   // const pipeline_dir = PathExt.dirname(pipeline_path);
  //   const pipeline_name = PathExt.basename(
  //     pipeline_path,
  //     PathExt.extname(pipeline_path)
  //   );
  //   // const pipeline_export_format = dialogResult.value.pipeline_filetype;

  //   // let pipeline_export_path = pipeline_name + "." + pipeline_export_format;
  //   // // only prefix the '/' when pipeline_dir is non-empty
  //   // if (pipeline_dir) {
  //   //   pipeline_export_path = pipeline_dir + "/" + pipeline_export_path;
  //   // }

  //   // const overwrite = dialogResult.value.overwrite;

  //   const runtime_config = dialogResult.value.runtime_config;
  //   const runtime = runtimes?.find((r) => r.name === runtime_config)
  //     ?.schema_name;

  //   // TODO: This should happen on the server?
  //   // PipelineService.setNodePathsRelativeToWorkspace(
  //   //   pipelineJson.pipelines[0],
  //   //   contextRef.current.path
  //   // );

  //   cleanNullProperties();

  //   pipelineJson.pipelines[0].app_data.name = pipeline_name;
  //   pipelineJson.pipelines[0].app_data.runtime = runtime;
  //   pipelineJson.pipelines[0].app_data["runtime-config"] = runtime_config;
  //   pipelineJson.pipelines[0].app_data.source = PathExt.basename(
  //     contextRef.current.path
  //   );

  //   exportPipeline();
  //   // exportPipeline(
  //   //   pipelineJson,
  //   //   pipeline_export_format,
  //   //   pipeline_export_path,
  //   //   overwrite
  //   // ).catch((error) => RequestErrors.serverError(error));

  //   // PipelineService.setNodePathsRelativeToPipeline(
  //   //   pipelineJson.pipelines[0],
  //   //   contextRef.current.path
  //   // );
  // }, [cleanNullProperties, context.model, nodes, runtimes]);

  // const handleRunPipeline = useCallback(async (): Promise<void> => {
  //   const pipelineJson: any = context.model.toJSON();
  //   // Check that all nodes are valid
  //   const errorMessages = validate(JSON.stringify(pipelineJson), nodes);
  //   if (errorMessages && errorMessages.length > 0) {
  //     let errorMessage = "";
  //     for (const error of errorMessages) {
  //       errorMessage += error.message;
  //     }
  //     setAlert(`Failed run: ${errorMessage}`);
  //     return;
  //   }

  //   if (contextRef.current.model.dirty) {
  //     const dialogResult = await showDialog(
  //       unsavedChanges({ type: "pipeline" })
  //     );
  //     if (dialogResult.button && dialogResult.button.accept === true) {
  //       await contextRef.current.save();
  //     } else {
  //       // Don't proceed if cancel button pressed
  //       return;
  //     }
  //   }

  //   const pipelineName = PathExt.basename(
  //     contextRef.current.path,
  //     PathExt.extname(contextRef.current.path)
  //   );

  //   const action = "run pipeline";
  //   const runtimes = await PipelineService.getRuntimes(
  //     false,
  //     action
  //   ).catch((error) => RequestErrors.serverError(error));
  //   const schema = await PipelineService.getRuntimesSchema().catch((error) =>
  //     RequestErrors.serverError(error)
  //   );

  //   const localRuntime: IRuntime = {
  //     name: "local",
  //     display_name: "Run in-place locally",
  //     schema_name: "local",
  //   };
  //   runtimes.unshift(JSON.parse(JSON.stringify(localRuntime)));

  //   const localSchema: ISchema = {
  //     name: "local",
  //     display_name: "Local Runtime",
  //   };
  //   schema.unshift(JSON.parse(JSON.stringify(localSchema)));

  //   const dialogResult = await showFormDialog(
  //     submitPipeline({ name: pipelineName, runtimes, schema })
  //   );

  //   if (dialogResult.value === null) {
  //     // When Cancel is clicked on the dialog, just return
  //     return;
  //   }

  //   const runtime_config = dialogResult.value.runtime_config;
  //   const runtime =
  //     PipelineService.getRuntimeName(runtime_config, runtimes) || "local";

  //   PipelineService.setNodePathsRelativeToWorkspace(
  //     pipelineJson.pipelines[0],
  //     contextRef.current.path
  //   );

  //   cleanNullProperties();

  //   pipelineJson.pipelines[0]["app_data"]["name"] =
  //     dialogResult.value.pipeline_name;
  //   pipelineJson.pipelines[0]["app_data"]["runtime"] = runtime;
  //   pipelineJson.pipelines[0]["app_data"]["runtime-config"] = runtime_config;
  //   pipelineJson.pipelines[0]["app_data"]["source"] = PathExt.basename(
  //     contextRef.current.path
  //   );

  //   PipelineService.submitPipeline(
  //     pipelineJson,
  //     PipelineService.getDisplayName(
  //       dialogResult.value.runtime_config,
  //       runtimes
  //     )
  //   ).catch((error) => RequestErrors.serverError(error));

  //   PipelineService.setNodePathsRelativeToPipeline(
  //     pipelineJson.pipelines[0],
  //     contextRef.current.path
  //   );
  // }, [context.model, cleanNullProperties]);

  const handleClearPipeline = useCallback(async () => {
    const result = await showDialog(clearPipeline);
    if (result.button.accept) {
      contextRef.current.model.fromString("");
    }
  }, []);

  const onAction = useCallback(
    ({ type, payload }) => {
      console.log(type);
      switch (type) {
        case "save":
          contextRef.current.save();
          break;
        case "run":
          // TODO
          // handleRunPipeline();
          break;
        case "clear":
          handleClearPipeline();
          break;
        case "export":
          // TODO
          // handleExportPipeline();
          break;
        case "toggleOpenPanel":
          setPanelOpen(!panelOpen);
          break;
        case "properties":
          setPanelOpen(true);
          break;
        case "openRuntimes":
          shell.activateById("elyra-metadata:runtimes");
          break;
        case "openFile":
          commands.execute("docmanager:open", { path: payload });
          break;
        default:
          break;
      }
    },
    [commands, handleClearPipeline, panelOpen, shell]
  );

  const toolbar = {
    leftBar: [
      {
        action: "run",
        label: "Run Pipeline",
        enable: true,
      },
      {
        action: "save",
        label: "Save Pipeline",
        enable: true,
        iconEnabled: IconUtil.encode(savePipelineIcon),
        iconDisabled: IconUtil.encode(savePipelineIcon),
      },
      {
        action: "export",
        label: "Export Pipeline",
        enable: true,
        iconEnabled: IconUtil.encode(exportPipelineIcon),
        iconDisabled: IconUtil.encode(exportPipelineIcon),
      },
      {
        action: "clear",
        label: "Clear Pipeline",
        enable: true,
        iconEnabled: IconUtil.encode(clearPipelineIcon),
        iconDisabled: IconUtil.encode(clearPipelineIcon),
      },
      {
        action: "openRuntimes",
        label: "Open Runtimes",
        enable: true,
        iconEnabled: IconUtil.encode(runtimesIcon),
        iconDisabled: IconUtil.encode(runtimesIcon),
      },
      { action: "undo", label: "Undo" },
      { action: "redo", label: "Redo" },
      { action: "cut", label: "Cut" },
      { action: "copy", label: "Copy" },
      { action: "paste", label: "Paste" },
      { action: "createAutoComment", label: "Add Comment", enable: true },
      { action: "deleteSelectedObjects", label: "Delete" },
      {
        action: "arrangeHorizontally",
        label: "Arrange Horizontally",
        enable: true,
      },
      {
        action: "arrangeVertically",
        label: "Arrange Vertically",
        enable: true,
      },
    ],
    rightBar: [
      {
        action: "toggleOpenPanel",
        label: "Open panel",
        enable: true,
        iconTypeOverride: panelOpen ? "paletteOpen" : "paletteClose",
      },
    ],
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

      toArray(fileBrowser.selectedItems()).forEach((file) => {
        if (file.path === "TODO") {
          // read the file contents
          // create a notebook widget to get a string with the node content then dispose of it
          // let itemContent: string;
          if (file.type === "notebook") {
            const fileWidget = fileBrowser.model.manager.open(file.path);
            // itemContent = (fileWidget as NotebookPanel).content.model.toString();
            fileWidget?.dispose();
          }
          // if either x or y is undefined use the default coordinates
          if (location === undefined) {
            position = defaultPosition;
          }
          const item = {
            // op:
            // path
            x: location?.x ?? 75 + position,
            y: location?.y ?? 85 + position,
          };
          // item.op = PipelineService.getNodeType(item.path);
          // item.path = PipelineService.getPipelineRelativeNodePath(
          //   contextRef.current.path,
          //   item.path
          // );

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
      if (location === undefined) {
        setDefaultPosition(position);
      }

      if (failedAdd) {
        return showDialog(unsupportedFile);
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
    if (reason === "clickaway") {
      return;
    }

    setAlert(undefined);
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
        <Alert severity="error" onClose={handleClose}>
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
      addFileToPipelineSignal: this.addFileToPipelineSignal,
    };
    const content = new PipelineEditorWidget(props);

    const widget = new DocumentWidget({ content, context });
    widget.addClass(PIPELINE_CLASS);
    widget.title.icon = pipelineIcon;
    return widget;
  }
}
