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

export interface IRuntimesDisplayProps extends IMetadataDisplayProps {
  metadata: IMetadata[];
  openMetadataEditor: (args: any) => void;
  updateMetadata: () => void;
  namespace: string;
  sortMetadata: boolean;
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
    const apiEndpoint = metadata.metadata.api_endpoint.endsWith('/')
      ? metadata.metadata.api_endpoint
      : metadata.metadata.api_endpoint + '/';

    let metadata_props = null;

    for (const schema of this.props.schemas) {
      if (schema.name === metadata.schema_name) {
        metadata_props = schema.properties.metadata.properties;
      }
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
    return await PipelineService.getRuntimes(false).catch(error =>
      RequestErrors.serverError(error)
    );
  }

  renderDisplay(metadata: IMetadata[]): React.ReactElement {
    if (Array.isArray(metadata) && !metadata.length) {
      // Empty metadata
      return (
        <div>
          <br />
          <h6 className="elyra-no-metadata-msg">
            Click the + button to add a new Runtime
          </h6>
        </div>
      );
    }

    return (
      <RuntimesDisplay
        metadata={metadata}
        updateMetadata={this.updateMetadata}
        openMetadataEditor={this.openMetadataEditor}
        namespace={RUNTIMES_NAMESPACE}
        sortMetadata={true}
        schemas={this.schemas}
      />
    );
  }
}
