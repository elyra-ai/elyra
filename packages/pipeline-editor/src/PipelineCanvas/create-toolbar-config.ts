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

import {
  clearPipelineIcon,
  exportPipelineIcon,
  IconUtil,
  runtimesIcon,
  savePipelineIcon
} from "@elyra/ui-components";

interface IToolbarConfigItem {
  action: string;
  label: string;
  enable?: boolean;
  iconEnabled?: string;
  iconDisabled?: string;
}

interface IDivider {
  divider: true;
}

export const createToolbarConfig = (
  empty: boolean
): (IToolbarConfigItem | IDivider)[] => [
  {
    action: "run",
    label: "Run Pipeline",
    enable: !empty
  },
  {
    action: "save",
    label: "Save Pipeline",
    enable: true,
    iconEnabled: IconUtil.encode(savePipelineIcon),
    iconDisabled: IconUtil.encode(savePipelineIcon)
  },
  {
    action: "export",
    label: "Export Pipeline",
    enable: !empty,
    iconEnabled: IconUtil.encode(exportPipelineIcon),
    iconDisabled: IconUtil.encode(exportPipelineIcon)
  },
  {
    action: "clear",
    label: "Clear Pipeline",
    enable: !empty,
    iconEnabled: IconUtil.encode(clearPipelineIcon),
    iconDisabled: IconUtil.encode(clearPipelineIcon)
  },
  {
    action: "openRuntimes",
    label: "Open Runtimes",
    enable: true,
    iconEnabled: IconUtil.encode(runtimesIcon),
    iconDisabled: IconUtil.encode(runtimesIcon)
  },
  { divider: true },
  { action: "undo", label: "Undo" },
  { action: "redo", label: "Redo" },
  { action: "cut", label: "Cut" },
  { action: "copy", label: "Copy" },
  { action: "paste", label: "Paste" },
  { action: "createAutoComment", label: "Add Comment", enable: true },
  { action: "createRandomNode", label: "Add Random Node", enable: true }, // TODO: this is just temporary.
  { action: "deleteSelectedObjects", label: "Delete" },
  {
    action: "arrangeHorizontally",
    label: "Arrange Horizontally",
    enable: !empty
  },
  {
    action: "arrangeVertically",
    label: "Arrange Vertically",
    enable: !empty
  }
];
