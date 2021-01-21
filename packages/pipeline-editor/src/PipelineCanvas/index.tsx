/*
 * Copyright 2018-2020 IBM Corporation
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
import React from "react";

import { CommonCanvas } from "@elyra/canvas";
import { IntlProvider } from "react-intl";

import { createToolbarConfig } from "./create-toolbar-config";
import { EmptyCanvas } from "./EmptyCanvas";

interface IProps {
  controller: any;
  onContextMenu: (
    e: IContextMenuEvent,
    defaultMenu: IContextMenu
  ) => IContextMenu;
  onClickAction: (e: ICanvasClickEvent) => void;
  onEditAction: (e: ICanvasEditEvent) => void;
  onTooltip: (tipType: string, e: ITipEvent) => JSX.Element | null;
}

export const PipelineCanvas: React.FC<IProps> = ({
  controller,
  onContextMenu,
  onClickAction,
  onEditAction,
  onTooltip
}) => {
  const [empty, setEmpty] = React.useState(false);
  const toolbarConfig = createToolbarConfig(empty);

  React.useEffect(() => {
    const handleChange = (): void => {
      const state = controller.objectModel.store.getState();
      const emptyPipeline = state.canvasinfo.pipelines[0].nodes.length === 0;
      const noComments = state.canvasinfo.pipelines[0].comments.length === 0;
      setEmpty(emptyPipeline && noComments);
    };
    const unsubscribe = controller.objectModel.store.subscribe(handleChange);
    return (): void => unsubscribe();
  }, [controller.objectModel.store]);

  return (
    <IntlProvider locale="en">
      <CommonCanvas
        canvasController={controller}
        contextMenuHandler={onContextMenu}
        clickActionHandler={onClickAction}
        editActionHandler={onEditAction}
        tipHandler={onTooltip}
        toolbarConfig={toolbarConfig}
        config={{
          enableInternalObjectModel: true,
          emptyCanvasContent: <EmptyCanvas />,
          enablePaletteLayout: "Flyout", //'None', 'Modal'
          paletteInitialState: true,
          enableInsertNodeDroppedOnLink: true,
          enableNodeFormatType: "Horizontal"
        }}
        notificationConfig={{ enable: false }}
        contextMenuConfig={{
          enableCreateSupernodeNonContiguous: true,
          defaultMenuEntries: {
            saveToPalette: false,
            createSupernode: true
          }
        }}
      />
    </IntlProvider>
  );
};
