/*
 * Copyright 2018-2023 Elyra Authors
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

import { IRuntime, ISchema } from './PipelineService';

export interface IRuntimeData {
  platforms: {
    id: string;
    displayName: string;
    configs: {
      id: string;
      displayName: string;
      processor: {
        id: string;
      };
    }[];
  }[];
  allowLocal: boolean;
}

export const createRuntimeData = ({
  runtimes,
  schema,
  allowLocal,
}: {
  runtimes: IRuntime[];
  schema: ISchema[];
  allowLocal?: boolean;
}): IRuntimeData => {
  const platforms: IRuntimeData['platforms'] = [];
  for (const s of schema) {
    const found = platforms.find((p) => p.id === s.runtime_type);
    if (found) {
      continue;
    }
    platforms.push({
      id: s.runtime_type,
      displayName: s.title,
      configs: runtimes
        .filter((r) => r.metadata.runtime_type === s.runtime_type)
        .map((r) => ({
          id: r.name,
          displayName: r.display_name,
          processor: {
            id: r.schema_name,
          },
        })),
    });
  }
  return { platforms, allowLocal: !!allowLocal };
};

export interface IConfigDetails {
  id: string;
  displayName: string;
  platform: {
    id: string;
    displayName: string;
  };
  processor: {
    id: string;
  };
}

export const getConfigDetails = (
  runtimeData: IRuntimeData,
  configId: string,
): IConfigDetails | undefined => {
  for (const platform of runtimeData.platforms) {
    for (const config of platform.configs) {
      if (config.id === configId) {
        return {
          id: config.id,
          displayName: config.displayName,
          platform: {
            id: platform.id,
            displayName: platform.displayName,
          },
          processor: {
            id: config.processor.id,
          },
        };
      }
    }
  }
  return undefined;
};
