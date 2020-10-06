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

import * as path from 'path';

import uuid4 from 'uuid/v4';

import { PIPELINE_CURRENT_VERSION } from './constants';
import pipeline_template from './pipeline-template.json';

/**
 * A utilities class for static functions.
 */
export default class Utils {
  static getUUID(): any {
    return uuid4();
  }

  /**
   * Utility to create a one node pipeline to submit a single Notebook as a pipeline
   */
  static generateNotebookPipeline(
    filename: string,
    runtime_config: string,
    runtimeImage: string,
    dependencies: string[],
    envObject: { [key: string]: string }
  ): any {
    const template = JSON.parse(JSON.stringify(pipeline_template));
    const generated_uuid: string = Utils.getUUID();

    const artifactName = path.basename(filename, path.extname(filename));

    const envVars = Object.entries(envObject).map(
      ([key, val]) => `${key}=${val}`
    );

    template.id = generated_uuid;
    template.primary_pipeline = generated_uuid;
    template.pipelines[0].id = generated_uuid;

    template.pipelines[0].nodes[0].id = generated_uuid;
    template.pipelines[0].nodes[0].app_data.filename = filename;
    template.pipelines[0].nodes[0].app_data.runtime_image = runtimeImage;
    template.pipelines[0].nodes[0].app_data.env_vars = envVars;
    template.pipelines[0].nodes[0].app_data.dependencies = dependencies;

    template.pipelines[0].app_data.name = artifactName;
    template.pipelines[0].app_data.runtime = 'kfp';
    template.pipelines[0].app_data['runtime-config'] = runtime_config;
    template.pipelines[0].app_data.version = PIPELINE_CURRENT_VERSION;

    return template;
  }

  /**
   * Check if the provided pipeline is empty (no nodes)
   *
   * @param pipelineDefinition
   */
  static isEmptyPipeline(pipelineDefinition: any): boolean {
    return Object.keys(pipelineDefinition.pipelines[0].nodes).length === 0;
  }

  /**
   * Check if the provided pipeline is clear of nodes and comments
   *
   * @param pipelineDefinition
   */
  static isEmptyCanvas(pipelineDefinition: any): boolean {
    return (
      this.isEmptyPipeline(pipelineDefinition) &&
      pipelineDefinition.pipelines[0].app_data.ui_data.comments.length === 0
    );
  }

  /**
   * Read the version of a Pipeline. If no version is found return 0
   *
   * @param pipelineDefinition
   */
  static getPipelineVersion(pipelineDefinition: any): number {
    let version = 0;

    if (pipelineDefinition)
      version =
        +this.getPipelineAppdataField(
          pipelineDefinition.pipelines[0],
          'version'
        ) || 0;

    return version;
  }

  /**
   * Read an application specific field from the pipeline definition
   * (e.g. pipelines[0][app_data][fieldName])
   */
  static getPipelineAppdataField(node: any, fieldName: string): string {
    if (this.hasPipelineAppdataField(node, fieldName)) {
      return node['app_data'][fieldName] as string;
    } else {
      return null;
    }
  }

  /**
   * Check if an application specific field from the pipeline defintion exists
   * (e.g. pipelines[0][app_data][fieldName])
   */
  static hasPipelineAppdataField(node: any, fieldName: string): boolean {
    return (
      Object.prototype.hasOwnProperty.call(node, 'app_data') &&
      Object.prototype.hasOwnProperty.call(node['app_data'], fieldName)
    );
  }

  /**
   * Delete an application specific field from the pipeline definition
   * (e.g. pipelines[0][app_data][fieldName])
   */
  static deletePipelineAppdataField(node: any, fieldName: string): void {
    if (this.hasPipelineAppdataField(node, fieldName)) {
      delete node['app_data'][fieldName];
    }
  }

  /**
   * Rename an application specific field from the pepileine definition if it exists by
   * by copying the field value to the new field name and then deleting the previously
   * existing field
   */
  static renamePipelineAppdataField(
    node: any,
    currentFieldName: string,
    newFieldName: string
  ): void {
    if (this.hasPipelineAppdataField(node, currentFieldName)) {
      node['app_data'][newFieldName] = node['app_data'][currentFieldName];
      this.deletePipelineAppdataField(node, currentFieldName);
    }
  }

  /**
   * Break an array into an array of "chunks", each "chunk" having "n" elements.
   * The final "chuck" may have less than "n" elements.
   * Example:
   * chunkArray(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 4)
   * -> [['a', 'b', 'c', 'd'], ['e', 'f', 'g']]
   */
  static chunkArray<T extends {}>(arr: T[], n: number): T[][] {
    return Array.from(Array(Math.ceil(arr.length / n)), (_, i) =>
      arr.slice(i * n, i * n + n)
    );
  }
}
