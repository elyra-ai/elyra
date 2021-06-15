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

import { RequestHandler } from '@elyra/services';
import {
  pipelineIcon,
  kubeflowIcon,
  airflowIcon,
  pyIcon,
  rIcon
} from '@elyra/ui-components';
import { LabIcon, notebookIcon } from '@jupyterlab/ui-components';
import produce from 'immer';
import useSWR from 'swr';

interface IReturn<T> {
  data?: T | undefined;
  error?: any;
}

interface IRuntimeImagesResponse {
  'runtime-images': IRuntimeImage[];
}

interface IRuntimeImage {
  name: string;
  display_name: string;
  metadata: {
    image_name: string;
  };
}

export const useRuntimeImages = <T = IRuntimeImagesResponse>(): IReturn<T> => {
  return useSWR<T>(
    `elyra/metadata/runtime-images`,
    RequestHandler.makeGetRequest
  );
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
  node_types: {
    op: string;
    type: 'execution_node';
    inputs: { app_data: any }[];
    outputs: { app_data: any }[];
    app_data: any;
  }[];
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
  properties: IComponentPropertiesResponse;
}

const componentFetcher = async (
  runtime: string
): Promise<INodeDefsResponse> => {
  const components = await RequestHandler.makeGetRequest<
    IRuntimeComponentsResponse
  >(`elyra/pipeline/components/${runtime}`);

  const propertiesPromises = components.categories.map(category =>
    RequestHandler.makeGetRequest<IComponentPropertiesResponse>(
      `elyra/pipeline/components/${runtime}/${category.id}/properties`
    )
  );

  // load all of the properties in parallel instead of serially
  const properties = await Promise.all(propertiesPromises);

  // zip together properties and components
  return properties.map((prop, i) => {
    const component = components.categories[i];
    return {
      op: component.node_types[0].op,
      image: component.image,
      label: component.label,
      description: component.description,
      properties: prop
    };
  });
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

export const useNodeDefs = (
  pipelineRuntime = 'local'
): IReturn<INodeDefsResponse> => {
  const { data: runtimeImages, error: runtimeError } = useRuntimeImages();

  const { data: nodeDefs, error: nodeDefError } = useSWR<INodeDefsResponse>(
    pipelineRuntime,
    componentFetcher
  );

  const updatedDefs = nodeDefs?.map(def =>
    produce(def, draft => {
      // update icon
      const nodeIcon = NodeIcons.get(draft.op);
      if (!nodeIcon || nodeIcon === '') {
        draft.image =
          'data:image/svg+xml;utf8,' +
          encodeURIComponent(getRuntimeIcon(pipelineRuntime).svgstr);
      } else {
        draft.image = nodeIcon;
      }

      // update runtime images
      const param = draft.properties.uihints.parameter_info.find(
        p => p.parameter_ref === 'runtime_image'
      );

      const displayNames = (runtimeImages?.['runtime-images'] ?? []).map(
        i => i.display_name
      );

      if (param?.data) {
        param.data.items = displayNames;
      } else {
        param!.data = {
          items: displayNames
        };
      }
    })
  );

  return { data: updatedDefs, error: runtimeError ?? nodeDefError };
};
