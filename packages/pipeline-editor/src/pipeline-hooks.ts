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

import { fetcher } from '@elyra/services';
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
  return useSWR<T>(`elyra/metadata/runtime-images`, fetcher);
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

export const useRuntimeComponents = <T = IRuntimeComponentsResponse>(
  pipelineRuntime = 'local'
): IReturn<T> => {
  return useSWR<T>(`elyra/pipeline/components/${pipelineRuntime}`, fetcher);
};

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

export const useComponentProperties = <T = IComponentPropertiesResponse>(
  runtimeName = 'local',
  componentCategory: string
): IReturn<T> => {
  return useSWR<T>(
    `elyra/pipeline/components/${runtimeName}/${componentCategory}/properties`,
    fetcher
  );
};
