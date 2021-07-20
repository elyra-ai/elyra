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

import { MetadataService, RequestHandler } from '@elyra/services';
import {
  pipelineIcon,
  kubeflowIcon,
  airflowIcon,
  pyIcon,
  rIcon,
  IconUtil
} from '@elyra/ui-components';
import { LabIcon, notebookIcon } from '@jupyterlab/ui-components';
import produce from 'immer';
import useSWR from 'swr';

interface IReturn<T> {
  data?: T | undefined;
  error?: any;
}

type IRuntimeImagesResponse = IRuntimeImage[];

interface IRuntimeImage {
  name: string;
  display_name: string;
  metadata: {
    image_name: string;
  };
}

const metadataFetcher = async <T>(key: string): Promise<T> => {
  return await MetadataService.getMetadata(key);
};

export const useRuntimeImages = (): IReturn<IRuntimeImagesResponse> => {
  const { data, error } = useSWR<IRuntimeImagesResponse>(
    'runtime-images',
    metadataFetcher
  );

  data?.sort((a, b) => 0 - (a.name > b.name ? -1 : 1));

  return { data, error };
};

interface IRuntimeComponentsResponse {
  version: string;
  categories: IRuntimeComponent[];
}

interface IRuntimeComponent {
  label: string;
  image: string;
  id: string;
  description: string;
  runtime?: string;
  node_types: {
    op: string;
    id: string;
    type: 'execution_node';
    inputs: { app_data: any }[];
    outputs: { app_data: any }[];
    app_data: any;
  }[];
  extensions?: string[];
}

interface IComponentPropertiesResponse {
  current_parameters: { [key: string]: any };
  parameters: { id: string }[];
  uihints: {
    parameter_info: {
      parameter_ref: string;
      control: 'custom';
      custom_control_id: string;
      label: { default: string };
      description: {
        default: string;
        placement: 'on_panel';
      };
      data: any;
    }[];
  };
  group_info: {
    group_info: {
      id: string;
      parameter_refs: string[];
    }[];
  }[];
}

type INodeDefsResponse = INodeDef[];

interface INodeDef {
  label: string;
  op: string;
  image: string;
  description: string;
  runtime?: string;
  properties: IComponentPropertiesResponse;
  extensions?: string[];
}

const HACK = false;

// TODO: We should decouple components and properties to support lazy loading.
// TODO: type this
const componentFetcher = async (runtime: string): Promise<any> => {
  const palette = await RequestHandler.makeGetRequest<
    IRuntimeComponentsResponse
  >(`elyra/pipeline/components/${runtime}`);

  const componentList: string[] = [];
  if (HACK) {
    for (const category of palette.categories) {
      componentList.push(category.id);
    }
  } else {
    for (const category of palette.categories) {
      for (const node of category.node_types) {
        componentList.push(node.id);
      }
    }
  }

  const propertiesPromises = componentList.map(async componentID => {
    const res = await RequestHandler.makeGetRequest<
      IComponentPropertiesResponse
    >(`elyra/pipeline/components/${runtime}/${componentID}/properties`);
    return {
      id: componentID,
      properties: res
    };
  });

  // load all of the properties in parallel instead of serially
  const properties = await Promise.all(propertiesPromises);

  if (HACK) {
    const node_types = palette.categories
      .map((c: any) => {
        return c.node_types.map((n: any) => {
          return {
            op: n.op,
            description: c.description,
            id: c.id,
            image: c.id,
            label: c.id,
            type: n.type,
            inputs: n.inputs,
            outputs: n.outputs,
            parameters: n.parameters,
            app_data: {
              parameter_refs: c.parameter_refs,
              extensions: c.extensions,
              image: c.image,
              ui_data: n.app_data.ui_data
            }
          };
        });
      })
      .flat();
    // Ignore groups until backend returns full palette
    palette.categories = [
      {
        label: 'Nodes',
        image: IconUtil.encode(IconUtil.colorize(pipelineIcon, '#808080')),
        id: 'nodes',
        description: 'List of all available nodes',
        node_types: node_types
      }
    ];
  }

  // inject properties
  for (const category of palette.categories) {
    for (const node of category.node_types) {
      const prop = properties.find(p => p.id === node.id);
      node.app_data.properties = prop?.properties;
    }
  }

  return palette;
};

const NodeIcons: Map<string, string> = new Map([
  [
    'execute-notebook-node',
    'data:image/svg+xml;utf8,' + encodeURIComponent(notebookIcon.svgstr)
  ],
  [
    'execute-python-node',
    'data:image/svg+xml;utf8,' + encodeURIComponent(pyIcon.svgstr)
  ],
  [
    'execute-r-node',
    'data:image/svg+xml;utf8,' + encodeURIComponent(rIcon.svgstr)
  ]
]);

export const getRuntimeIcon = (runtime?: string): LabIcon => {
  const runtimeIcons = [kubeflowIcon, airflowIcon];
  for (const runtimeIcon of runtimeIcons) {
    if (`elyra:${runtime}` === runtimeIcon.name) {
      return runtimeIcon;
    }
  }
  return pipelineIcon;
};

export const useNodeDefs = (pipelineRuntime = 'local'): IReturn<any> => {
  const { data: runtimeImages, error: runtimeError } = useRuntimeImages();

  const { data: palette, error: nodeDefError } = useSWR(
    pipelineRuntime,
    componentFetcher
  );

  let updatedPalette;
  if (palette !== undefined) {
    updatedPalette = produce(palette, (draft: any) => {
      for (const category of draft.categories) {
        for (const node of category.node_types) {
          // update icon
          let nodeIcon = NodeIcons.get(node.op);
          if (nodeIcon === undefined || nodeIcon === '') {
            nodeIcon =
              'data:image/svg+xml;utf8,' +
              encodeURIComponent(getRuntimeIcon(pipelineRuntime).svgstr);
          }

          // Not sure which is needed...
          node.image = nodeIcon;
          node.app_data.image = nodeIcon;
          node.app_data.ui_data.image = nodeIcon;

          // update runtime images
          const runtimeImageIndex = node.app_data.properties.uihints.parameter_info.findIndex(
            (p: any) => p.parameter_ref === 'elyra_runtime_image'
          );

          const displayNames = (runtimeImages ?? []).map(i => i.display_name);

          if (runtimeImageIndex !== -1) {
            node.app_data.properties.uihints.parameter_info[
              runtimeImageIndex
            ].data.items = displayNames;
          }
        }
      }
    });
  }

  return { data: updatedPalette, error: runtimeError ?? nodeDefError };
};
