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

import { INode } from "./types";

interface IPalette {
  version: "3.0";
  categories: ICategory[];
}

interface ICategory {
  label: string;
  image: string;
  id: string;
  description: string;
  node_types: INodeType[];
}

interface INodeType {
  id: string;
  op: string;
  type: string;
  inputs: IPort[];
  outputs: IPort[];
  parameters: {};
  app_data: {
    ui_data: {
      label: string;
      description: string;
      image: string;
      x_pos: number;
      y_pos: number;
    };
  };
}

interface IPort {
  id: string;
  app_data: {
    ui_data: {
      cardinality: {
        min: number;
        max: number;
      };
      label: string;
    };
  };
}

export const createPalette = (nodes: INode[]): IPalette => {
  const palette: IPalette = {
    version: "3.0",
    categories: [
      {
        label: "Nodes",
        image: "",
        id: "nodes",
        description: "Nodes",
        node_types: []
      }
    ]
  };

  for (const node of nodes) {
    palette.categories[0].node_types.push({
      id: "",
      op: node.op,
      type: "execution_node",
      inputs: [
        {
          id: "inPort",
          app_data: {
            ui_data: {
              cardinality: {
                min: 0,
                max: -1
              },
              label: "Input Port"
            }
          }
        }
      ],
      outputs: [
        {
          id: "outPort",
          app_data: {
            ui_data: {
              cardinality: {
                min: 0,
                max: -1
              },
              label: "Output Port"
            }
          }
        }
      ],
      parameters: {},
      app_data: {
        ui_data: {
          label: node.label,
          description: node.description,
          image: node.image ?? "",
          x_pos: 0,
          y_pos: 0
        }
      }
    });
  }
  return palette;
};
