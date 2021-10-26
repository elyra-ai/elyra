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

import { PIPELINE_CURRENT_VERSION } from '@elyra/pipeline-editor';

import { LabShell } from '@jupyterlab/application';
import { PathExt } from '@jupyterlab/coreutils';

import uuid4 from 'uuid/v4';

import pipeline_template from './pipeline-template.json';

/**
 * A utilities class for static functions.
 */
export default class Utils {
  /**
   * Utility to create a one node pipeline to submit a single file as a pipeline
   */
  static generateSingleFilePipeline(
    filename: string,
    runtime_platform: string,
    runtime_config: string,
    runtimeImage: string,
    dependencies: string[] | undefined,
    envObject: { [key: string]: string },
    cpu?: number,
    gpu?: number,
    memory?: number
  ): any {
    const template = JSON.parse(JSON.stringify(pipeline_template));
    const generated_uuid = uuid4();

    const artifactName = PathExt.basename(filename, PathExt.extname(filename));

    const envVars = Object.entries(envObject).map(
      ([key, val]) => `${key}=${val}`
    );

    template.id = generated_uuid;
    template.primary_pipeline = generated_uuid;
    template.pipelines[0].id = generated_uuid;

    template.pipelines[0].nodes[0].id = generated_uuid;
    template.pipelines[0].nodes[0].app_data.ui_data.label = PathExt.basename(
      filename
    );
    template.pipelines[0].nodes[0].app_data.component_parameters.filename = filename;
    template.pipelines[0].nodes[0].app_data.component_parameters.runtime_image = runtimeImage;
    template.pipelines[0].nodes[0].app_data.component_parameters.env_vars = envVars;
    template.pipelines[0].nodes[0].app_data.component_parameters.dependencies = dependencies;
    template.pipelines[0].nodes[0].app_data.component_parameters.cpu = cpu;
    template.pipelines[0].nodes[0].app_data.component_parameters.gpu = gpu;
    template.pipelines[0].nodes[0].app_data.component_parameters.memory = memory;

    template.pipelines[0].app_data.name = artifactName;
    template.pipelines[0].app_data.runtime = runtime_platform;
    template.pipelines[0].app_data['runtime-config'] = runtime_config;
    template.pipelines[0].app_data.version = PIPELINE_CURRENT_VERSION;
    template.pipelines[0].app_data.source = PathExt.basename(filename);
    template.pipelines[0].app_data['properties'] = {};
    template.pipelines[0].app_data['properties']['name'] = 'generic';
    template.pipelines[0].app_data['properties']['runtime'] = 'Generic';

    return template;
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
   * Check if the object is not an array, but the result of a Dialog instead
   */
  static isDialogResult(runtimesObj: any): boolean {
    return runtimesObj && !(runtimesObj instanceof Array) && runtimesObj.button;
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
