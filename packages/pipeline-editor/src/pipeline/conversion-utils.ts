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

import produce from 'immer';

/**
 * Prepare the pipeline for saving / export / submission.
 *
 * tasks:
 *   - convert runtime image display names to their IDs
 */
export const preparePipelineForStorage = (
  pipeline: any,
  runtimeImages: any
): any => {
  const newPipeline = produce(pipeline, (draft: any) => {
    const nodes = draft?.pipelines?.[0]?.nodes;
    if (nodes && nodes.length > 0) {
      for (const node of nodes) {
        const componentParams = node?.app_data?.component_parameters;
        if (componentParams?.runtime_image) {
          const image = runtimeImages?.find(
            (i: any) => i.display_name === componentParams.runtime_image
          );
          if (image) {
            componentParams.runtime_image = image.metadata.image_name;
          }
        }
      }
    }
  });

  return JSON.stringify(newPipeline, null, 2);
};

// TODO: nick - why are we deleting null keys for render? shouldn't this happen
// at export?
/**
 * Prepare the pipeline for display in the UI.
 *
 * tasks:
 *   - convert runtime image IDs to their display names
 *   - remove any keys that have a null value
 *   - set a pipeline property for the filepath
 *   - set a pipeline property for the runtime (Generic / KFP / AirFlow)
 */
export const preparePipelineForDisplay = (
  pipeline: any,
  runtimeImages: any,
  pipeline_name: string,
  pipelineRuntimeDisplayName: string | undefined
): any => {
  return produce(pipeline, (draft: any) => {
    // map IDs to display names
    const nodes = draft?.pipelines?.[0]?.nodes;
    if (nodes?.length > 0) {
      for (const node of nodes) {
        if (node?.app_data?.component_parameters?.runtime_image) {
          const image = runtimeImages?.find(
            (i: any) =>
              i.metadata.image_name ===
              node.app_data.component_parameters.runtime_image
          );
          if (image) {
            node.app_data.component_parameters.runtime_image =
              image.display_name;
          }
        }

        if (node?.app_data?.component_parameters) {
          for (const [key, val] of Object.entries(
            node?.app_data?.component_parameters
          )) {
            if (val === null) {
              node.app_data.component_parameters[key] = undefined;
            }
          }
        }
      }
    }
    // TODO: don't persist this, but this will break things right now
    if (draft?.pipelines?.[0]?.app_data) {
      if (!draft.pipelines[0].app_data.properties) {
        draft.pipelines[0].app_data.properties = {};
      }

      draft.pipelines[0].app_data.properties.name = pipeline_name;
      draft.pipelines[0].app_data.properties.runtime =
        pipelineRuntimeDisplayName ?? 'Generic';
    }
  });
};
