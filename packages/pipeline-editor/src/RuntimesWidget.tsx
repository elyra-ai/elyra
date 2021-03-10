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

import {
  MetadataWidget,
  IMetadataWidgetProps,
  IMetadata,
  MetadataDisplay,
  IMetadataDisplayProps,
  IMetadataDisplayState
} from '@elyra/metadata-common';
import { IDictionary } from '@elyra/services';
import { RequestErrors } from '@elyra/ui-components';
import React from 'react';

import { PipelineService, RUNTIMES_NAMESPACE } from './PipelineService';

const RUNTIMES_METADATA_CLASS = 'elyra-metadata-runtimes';

const addTrailingSlash = (url: string): string => {
  return url.endsWith('/') ? url : url + '/';
};

const getGithubURLFromAPI = (apiEndpoint: string): string => {
  // For enterprise instances the api is located at <hostname>/api/
  let baseURL = new URL(apiEndpoint).origin;

  // For github.com the api endpoint is located at api.github.com
  if (baseURL.includes('api.github.com')) {
    baseURL = baseURL.replace('api.', '');
  }

  return addTrailingSlash(baseURL);
};

export interface IRuntimesDisplayProps extends IMetadataDisplayProps {
  metadata: IMetadata[];
  openMetadataEditor: (args: any) => void;
  updateMetadata: () => void;
  namespace: string;
  sortMetadata: boolean;
  className: string;
  schemas: IDictionary<any>[];
}

/**
 * A React Component for displaying the runtimes list.
 */
class RuntimesDisplay extends MetadataDisplay<
  IRuntimesDisplayProps,
  IMetadataDisplayState
> {
  renderExpandableContent(metadata: IDictionary<any>): JSX.Element {
    const apiEndpoint = addTrailingSlash(metadata.metadata.api_endpoint);
    const cosEndpoint = addTrailingSlash(metadata.metadata.cos_endpoint);

    let githubRepoElement = null;
    let metadata_props = null;

    for (const schema of this.props.schemas) {
      if (schema.name === metadata.schema_name) {
        metadata_props = schema.properties.metadata.properties;
      }
    }

    if (metadata.schema_name === 'airflow' && metadata_props) {
      const githubRepoUrl =
        getGithubURLFromAPI(metadata.metadata.github_api_endpoint) +
        metadata.metadata.github_repo +
        '/tree/' +
        metadata.metadata.github_branch;
      githubRepoElement = (
        <span>
          <br />
          <br />
          <h6>{metadata_props.github_repo.title}</h6>
          <a href={githubRepoUrl} target="_blank" rel="noreferrer noopener">
            {githubRepoUrl}
          </a>
        </span>
      );
    }

    return (
      <div>
        <h6>
          {metadata_props ? metadata_props.api_endpoint.title : 'API Endpoint'}
        </h6>
        <a href={apiEndpoint} target="_blank" rel="noreferrer noopener">
          {apiEndpoint}
        </a>
        <br />
        <br />
        <h6>
          {metadata_props
            ? metadata_props.cos_endpoint.title
            : 'Cloud Object Storage'}
        </h6>
        <a href={cosEndpoint} target="_blank" rel="noreferrer noopener">
          {cosEndpoint}
        </a>
        {githubRepoElement}
      </div>
    );
  }
}

/**
 * A widget for displaying runtimes.
 */
export class RuntimesWidget extends MetadataWidget {
  constructor(props: IMetadataWidgetProps) {
    super(props);
  }

  async fetchMetadata(): Promise<any> {
    return await PipelineService.getRuntimes(false).catch(error =>
      RequestErrors.serverError(error)
    );
  }

  renderDisplay(metadata: IMetadata[]): React.ReactElement {
    return (
      <RuntimesDisplay
        metadata={metadata}
        updateMetadata={this.updateMetadata}
        openMetadataEditor={this.openMetadataEditor}
        namespace={RUNTIMES_NAMESPACE}
        sortMetadata={true}
        schemas={this.schemas}
        className={RUNTIMES_METADATA_CLASS}
      />
    );
  }
}
