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

import { IDictionary } from '@elyra/application';
import {
  MetadataWidget,
  IMetadataWidgetProps,
  IMetadata,
  MetadataDisplay,
  IMetadataDisplayProps
} from '@elyra/metadata-common';
import React from 'react';

import { PipelineService } from './PipelineService';

export const RUNTIMES_NAMESPACE = 'runtimes';
export const KFP_SCHEMA = 'kfp';

/**
 * A React Component for displaying the runtimes list.
 */
class RuntimesDisplay extends MetadataDisplay<IMetadataDisplayProps> {
  renderExpandableContent(metadata: IDictionary<any>): JSX.Element {
    const apiEndpoint = metadata.metadata.api_endpoint.endsWith('/')
      ? metadata.metadata.api_endpoint
      : metadata.metadata.api_endpoint + '/';

    return (
      <div>
        <h6>Runtime History:</h6>
        <a href={apiEndpoint} target="_blank" rel="noreferrer noopener">
          {apiEndpoint}
        </a>
        <br />
        <br />
        <h6>Cloud Object Storage:</h6>
        <a
          href={metadata.metadata.cos_endpoint}
          target="_blank"
          rel="noreferrer noopener"
        >
          {metadata.metadata.cos_endpoint}
        </a>
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
    return await PipelineService.getRuntimes();
  }

  renderDisplay(metadata: IMetadata[]): React.ReactElement {
    return (
      <RuntimesDisplay
        metadata={metadata}
        updateMetadata={this.updateMetadata}
        openMetadataEditor={this.openMetadataEditor}
        namespace={RUNTIMES_NAMESPACE}
        schema={KFP_SCHEMA}
      />
    );
  }
}
