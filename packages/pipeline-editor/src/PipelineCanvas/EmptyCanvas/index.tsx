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

import { dragDropIcon } from "@elyra/ui-components";

export const EmptyCanvas: React.FC = () => {
  return (
    <div>
      <dragDropIcon.react tag="div" elementPosition="center" height="120px" />
      <h1>
        Start your new pipeline by dragging files from the file browser pane.
      </h1>
    </div>
  );
};
