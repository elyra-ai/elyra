import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from "react";

import { NodeTooltip } from "./NodeTooltip";
import { PipelineCanvas } from "./PipelineCanvas";
import PipelineController from "./PipelineController";

interface Props {
  pipeline: any;
  nodes: any;
  mode: "vscode" | "jupyter";
  onAction?: (type: string) => any;
  onChange?: (pipeline: any) => any;
  onError?: () => any;
  onFileRequested?: () => any;
  readOnly?: boolean;
}

const isNodeTipEvent = (type: string, _e: ITipEvent): _e is ITipNode => {
  return type === "tipTypeNode";
};

const PipelineEditor = forwardRef(
  (
    {
      pipeline,
      nodes,
      mode,
      onAction,
      onChange,
      onError,
      onFileRequested,
      readOnly
    }: Props,
    ref
  ) => {
    const controller = useRef(new PipelineController());

    useEffect(() => {
      try {
        controller.current.open(pipeline);
      } catch {
        onError?.();
      }
    }, [onError, pipeline]);

    useImperativeHandle(ref, () => ({
      addFile: (item: any, x?: number, y?: number) => {
        console.log("add file");
        console.log(item);
        controller.current.addNode(item, x, y);
      }
    }));

    // TODO: only show "Open Files" if it's a file based node.
    const handleContextMenu = useCallback(
      (e: IContextMenuEvent, defaultMenu: IContextMenu): IContextMenu => {
        // If not a node use default menu
        if (e.type !== "node") {
          return defaultMenu;
        }

        // multiple nodes selected
        if (e.selectedObjectIds.length > 1) {
          return defaultMenu.concat({
            action: "openFile",
            label: "Open Files"
          });
        }

        // single EXECUTION node selected (not super node)
        if (e.targetObject.type === "execution_node") {
          return defaultMenu.concat(
            {
              action: "openFile",
              label: "Open File"
            },
            {
              action: "properties",
              label: "Properties"
            }
          );
        }

        // anything else
        return defaultMenu;
      },
      []
    );

    const handleClickAction = useCallback((e: ICanvasClickEvent): void => {
      if (e.clickType === "DOUBLE_CLICK" && e.objectType === "node") {
        for (const selectedObject of e.selectedObjectIds) {
          // TODO: open a file or properties or something, to discuss...
        }
      }
    }, []);

    const handleEditAction = useCallback(
      async (e: ICanvasEditEvent): Promise<void> => {
        switch (e.editType) {
          case "run": {
            onAction?.("run");
            break;
          }
          case "export": {
            onAction?.("export");
            break;
          }
          case "save": {
            onAction?.("save");
            break;
          }
          case "clear": {
            onAction?.("clear");
            break;
          }
          case "openRuntimes": {
            onAction?.("openRuntimes");
            break;
          }
          case "openFile": {
            onAction?.("openFile");
            break;
          }
          case "properties": {
            // common properties
            break;
          }
        }
        controller.current.validate();
        onChange?.(controller.current.getPipelineFlow());
      },
      [onAction, onChange]
    );

    const handleTooltip = (
      tipType: string,
      e: ITipEvent
    ): JSX.Element | null => {
      if (isNodeTipEvent(tipType, e) && e.node.type === "execution_node") {
        const error = e.node.app_data.invalidNodeError;
        const properties = controller.current.properties(e.node.id);
        return <NodeTooltip error={error} properties={properties} />;
      }
      return null;
    };

    return (
      <PipelineCanvas
        controller={controller.current}
        onContextMenu={handleContextMenu}
        onClickAction={handleClickAction}
        onEditAction={handleEditAction}
        onTooltip={handleTooltip}
      />
    );
  }
);

export { PipelineEditor };

export { default as PipelineController } from "./PipelineController";
