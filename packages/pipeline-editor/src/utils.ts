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

import { PIPELINE_CURRENT_VERSION } from '@elyra/pipeline-editor';

import { LabShell } from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';

import uuid4 from 'uuid/v4';

import { IConfigDetails } from './runtime-utils';

/**
 * A utilities class for static functions.
 */
export default class Utils {
  /**
   * Utility to create a one node pipeline to submit a single file as a pipeline
   */
  static generateSingleFilePipeline(
    filename: string,
    configDetails: IConfigDetails | undefined,
    runtimeImage: string,
    dependencies: string[] | undefined,
    envObject: { [key: string]: string },
    cpu?: number,
    cpu_limit?: number,
    gpu?: number,
    memory?: number,
    memory_limit?: number
  ): any {
    const generated_uuid = uuid4();

    const artifactName = PathExt.basename(filename, PathExt.extname(filename));

    const envVars = Object.entries(envObject).map(
      ([key, val]) => `${key}=${val}`
    );

    return {
      doc_type: 'pipeline',
      version: '3.0',
      json_schema:
        'http://api.dataplatform.ibm.com/schemas/common-pipeline/pipeline-flow/pipeline-flow-v3-schema.json',
      id: generated_uuid,
      primary_pipeline: generated_uuid,
      pipelines: [
        {
          id: generated_uuid,
          nodes: [
            {
              id: generated_uuid,
              type: 'execution_node',
              op: 'execute-notebook-node',
              app_data: {
                component_parameters: {
                  filename,
                  runtime_image: runtimeImage,
                  outputs: [],
                  env_vars: envVars,
                  dependencies,
                  cpu,
                  cpu_limit,
                  gpu,
                  memory,
                  memory_limit,
                  include_subdirectories: false
                },
                ui_data: {
                  label: PathExt.basename(filename)
                }
              }
            }
          ],
          app_data: {
            name: artifactName,
            runtime_config: configDetails?.id,
            version: PIPELINE_CURRENT_VERSION,
            source: PathExt.basename(filename),
            properties: {
              name: 'generic'
            },
            ui_data: {
              comments: []
            }
          }
        }
      ],
      schemas: []
    };
  }

  /**
   * Break an array into an array of "chunks", each "chunk" having "n" elements.
   * The final "chuck" may have less than "n" elements.
   * Example:
   * chunkArray(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 4)
   * -> [['a', 'b', 'c', 'd'], ['e', 'f', 'g']]
   */
  static chunkArray<T>(arr: T[], n: number): T[][] {
    return Array.from(Array(Math.ceil(arr.length / n)), (_, i) =>
      arr.slice(i * n, i * n + n)
    );
  }

  /**
   * From a given widget, find the application shell and return it
   */
  static getLabShell = (widget: any): LabShell => {
    while (widget !== null && !(widget instanceof LabShell)) {
      widget = widget.parent;
    }

    return widget;
  };
}
