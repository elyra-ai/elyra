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

import { IDictionary, RequestHandler } from '@elyra/application';
import { FrontendServices } from '@elyra/metadata-common';

import { showDialog, Dialog } from '@jupyterlab/apputils';
import * as React from 'react';

import Utils from './utils';

export const RUNTIMES_NAMESPACE = 'runtimes';
export const KFP_SCHEMA = 'kfp';
export const RUNTIME_IMAGES_NAMESPACE = 'runtime-images';
export const RUNTIME_IMAGE_SCHEMA = 'runtime-image';

export interface IRuntime {
  name: string;
  display_name: string;
}

export class PipelineService {
  /**
   * Returns a list of external runtime configurations available as
   * `runtimes metadata`. This is used to submit the pipeline to be
   * executed on these runtimes.
   */
  static async getRuntimes(showError = true): Promise<any> {
    const runtimes = await FrontendServices.getMetadata('runtimes');

    if (showError && Object.keys(runtimes).length === 0) {
      return FrontendServices.noMetadataError('runtimes');
    }

    return runtimes;
  }

  /**
   * Return a list of configured docker images that are used as runtimes environments
   * to run the pipeline nodes.
   */
  static async getRuntimeImages(): Promise<any> {
    let runtimeImages = await FrontendServices.getMetadata('runtime-images');

    runtimeImages = runtimeImages.sort(
      (a: any, b: any) => 0 - (a.name > b.name ? -1 : 1)
    );

    if (Object.keys(runtimeImages).length === 0) {
      return FrontendServices.noMetadataError('runtime-images');
    }

    const images: IDictionary<string> = {};
    for (const image in runtimeImages) {
      const imageName: string = runtimeImages[image]['metadata']['image_name'];
      images[imageName] = runtimeImages[image]['display_name'];
    }
    return images;
  }

  static getDisplayName(name: string, metadataArr: IDictionary<any>[]): string {
    return metadataArr.find(r => r['name'] === name)['display_name'];
  }

  /**
   * The runtime name is currently based on the schema name (one schema per runtime)
   * @param name
   * @param metadataArr
   */
  static getRuntimeName(name: string, metadataArr: IDictionary<any>[]): string {
    return metadataArr.find(r => r['name'] === name)['schema_name'];
  }

  /**
   * Submit the pipeline to be executed on an external runtime (e.g. Kbeflow Pipelines)
   *
   * @param pipeline
   * @param runtimeName
   */
  static async submitPipeline(
    pipeline: any,
    runtimeName: string
  ): Promise<any> {
    const response = await RequestHandler.makePostRequest(
      'elyra/pipeline/schedule',
      JSON.stringify(pipeline),
      true
    );

    let dialogTitle;
    let dialogBody;
    if (response['run_url']) {
      // pipeline executed remotely in a runtime of choice
      dialogTitle = 'Job submission to ' + runtimeName + ' succeeded';
      dialogBody = (
        <p>
          Check the status of your job at{' '}
          <a
            href={response['run_url']}
            target="_blank"
            rel="noopener noreferrer"
          >
            Run Details.
          </a>
          <br />
          The results and outputs are in the {
            response['object_storage_path']
          }{' '}
          working directory in{' '}
          <a
            href={response['object_storage_url']}
            target="_blank"
            rel="noopener noreferrer"
          >
            object storage
          </a>
          .
        </p>
      );
    } else {
      // pipeline executed in-place locally
      dialogTitle = 'Job execution succeeded';
      dialogBody = (
        <p>Your job has been executed in-place in your local environment.</p>
      );
    }

    return showDialog({
      title: dialogTitle,
      body: dialogBody,
      buttons: [Dialog.okButton()]
    });
  }

  /**
   * Export a pipeline to different formats (e.g. DSL, YAML, etc). These formats
   * are understood by a given runtime.
   *
   * @param pipeline
   * @param pipeline_export_format
   * @param pipeline_export_path
   * @param overwrite
   */
  static async exportPipeline(
    pipeline: any,
    pipeline_export_format: string,
    pipeline_export_path: string,
    overwrite: boolean
  ): Promise<any> {
    console.log(
      'Exporting pipeline to [' + pipeline_export_format + '] format'
    );

    console.log('Overwriting existing file: ' + overwrite);

    const body = {
      pipeline: pipeline,
      export_format: pipeline_export_format,
      export_path: pipeline_export_path,
      overwrite: overwrite
    };

    const response = await RequestHandler.makePostRequest(
      'elyra/pipeline/export',
      JSON.stringify(body),
      true
    );

    return showDialog({
      title: 'Pipeline export succeeded',
      body: <p>Exported file: {response['export_path']} </p>,
      buttons: [Dialog.okButton()]
    });
  }

  /**
   * Verify if the given pipeline is "current" by looking on it's version, and perform
   * any conversion if needed.
   *
   * @param pipelineDefinition
   */
  static convertPipeline(pipelineDefinition: any, pipelinePath: string): any {
    let pipelineJSON = JSON.parse(JSON.stringify(pipelineDefinition));

    const currentVersion: number = Utils.getPipelineVersion(pipelineJSON);

    if (currentVersion < 1) {
      // original pipeline definition without a version
      console.info('Migrating pipeline to version 1.');
      pipelineJSON = this.convertPipelineV0toV1(pipelineJSON);
    }
    if (currentVersion < 2) {
      // adding relative path on the pipeline filenames
      console.info('Migrating pipeline to version 2.');
      pipelineJSON = this.convertPipelineV1toV2(pipelineJSON, pipelinePath);
    }
    if (currentVersion < 3) {
      // Adding python script support
      console.info('Migrating pipeline to version 3 (current version).');
      pipelineJSON = this.convertPipelineV2toV3(pipelineJSON, pipelinePath);
    }
    return pipelineJSON;
  }

  private static convertPipelineV0toV1(pipelineJSON: any): any {
    Utils.renamePipelineAppdataField(
      pipelineJSON.pipelines[0],
      'title',
      'name'
    );
    Utils.deletePipelineAppdataField(pipelineJSON.pipelines[0], 'export');
    Utils.deletePipelineAppdataField(
      pipelineJSON.pipelines[0],
      'export_format'
    );
    Utils.deletePipelineAppdataField(pipelineJSON.pipelines[0], 'export_path');

    // look into nodes
    for (const nodeKey in pipelineJSON.pipelines[0]['nodes']) {
      const node = pipelineJSON.pipelines[0]['nodes'][nodeKey];
      Utils.renamePipelineAppdataField(node, 'artifact', 'filename');
      Utils.renamePipelineAppdataField(node, 'image', 'runtime_image');
      Utils.renamePipelineAppdataField(node, 'vars', 'env_vars');
      Utils.renamePipelineAppdataField(
        node,
        'file_dependencies',
        'dependencies'
      );
      Utils.renamePipelineAppdataField(
        node,
        'recursive_dependencies',
        'include_subdirectories'
      );
    }

    pipelineJSON.pipelines[0]['app_data']['version'] = 1;
    return pipelineJSON;
  }

  private static convertPipelineV1toV2(
    pipelineJSON: any,
    pipelinePath: string
  ): any {
    pipelineJSON.pipelines[0] = this.setNodePathsRelativeToPipeline(
      pipelineJSON.pipelines[0],
      pipelinePath
    );
    pipelineJSON.pipelines[0]['app_data']['version'] = 2;
    return pipelineJSON;
  }

  private static convertPipelineV2toV3(
    pipelineJSON: any,
    pipelinePath: string
  ): any {
    // No-Op this is to disable old versions of Elyra
    // to see a pipeline with Python Script nodes
    pipelineJSON.pipelines[0]['app_data']['version'] = 3;
    return pipelineJSON;
  }

  static getPipelineRelativeNodePath(
    pipelinePath: string,
    nodePath: string
  ): string {
    const relativePath: string = path.relative(
      path.dirname(pipelinePath),
      nodePath
    );
    return relativePath;
  }

  static getWorkspaceRelativeNodePath(
    pipelinePath: string,
    nodePath: string
  ): string {
    // since resolve returns an "absolute" path we need to strip off the leading '/'
    const workspacePath: string = path
      .resolve(path.dirname(pipelinePath), nodePath)
      .substring(1);
    return workspacePath;
  }

  static setNodePathsRelativeToPipeline(
    pipeline: any,
    pipelinePath: string
  ): any {
    for (const node of pipeline.nodes) {
      node.app_data.filename = this.getPipelineRelativeNodePath(
        pipelinePath,
        node.app_data.filename
      );
    }
    return pipeline;
  }

  static setNodePathsRelativeToWorkspace(
    pipeline: any,
    pipelinePath: string
  ): any {
    for (const node of pipeline.nodes) {
      node.app_data.filename = this.getWorkspaceRelativeNodePath(
        pipelinePath,
        node.app_data.filename
      );
    }
    return pipeline;
  }
}
