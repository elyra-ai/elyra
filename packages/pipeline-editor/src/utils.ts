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
import uuid4 from 'uuid/v4';

import pipeline_template from './pipeline-template.json';
import { ISubmitNotebookOptions } from './SubmitNotebook';

/**
 * A utilities class for static functions.
 */
export default class Utils {
  static getUUID(): any {
    return uuid4();
  }

  /*
   *
   */
  static generateNotebookPipeline(
    filename: string,
    options: ISubmitNotebookOptions
  ): any {
    const template = pipeline_template;
    const generated_uuid: string = Utils.getUUID();

    const artifactFileName = filename.replace(/^.*[\\/]/, '');
    const artifactName = artifactFileName.replace(/\.[^/.]+$/, '');

    template.id = generated_uuid;
    template.primary_pipeline = generated_uuid;
    template.pipelines[0].id = generated_uuid;

    template.pipelines[0].nodes[0].id = generated_uuid;
    template.pipelines[0].nodes[0].app_data.filename = filename;
    template.pipelines[0].nodes[0].app_data.runtime_image = options.framework;
    template.pipelines[0].nodes[0].app_data.env_vars = options.env;
    template.pipelines[0].nodes[0].app_data.dependencies = options.dependencies;

    template.pipelines[0].app_data.name = artifactName;
    template.pipelines[0].app_data.runtime = 'kfp';
    template.pipelines[0].app_data['runtime-config'] = options.runtime_config;

    return template;
  }

  /*
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

  /*
   * Check if an application specific field from the pipeline defintion exists
   * (e.g. pipelines[0][app_data][fieldName])
   */
  static hasPipelineAppdataField(node: any, fieldName: string): boolean {
    let isPresent = false;
    if (node['app_data']) {
      if (node['app_data'][fieldName]) {
        isPresent = true;
      }
    }
    return isPresent;
  }

  /*
   * Delete an application specific field from the pipeline definition
   * (e.g. pipelines[0][app_data][fieldName])
   */
  static deletePipelineAppdataField(node: any, fieldName: string): void {
    if (this.hasPipelineAppdataField(node, fieldName)) {
      delete node['app_data'][fieldName];
    }
  }

  /*
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
}
