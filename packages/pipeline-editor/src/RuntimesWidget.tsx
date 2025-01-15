/*
 * Copyright 2018-2025 Elyra Authors
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
  MetadataDisplay,
  IMetadataDisplayProps,
  IOpenMetadataEditorArgs
} from '@elyra/metadata-common';
import {
  IMetadataResource,
  ISchemaResource,
  MetadataService
} from '@elyra/services';
import {
  GenericObjectType,
  IErrorResponse,
  RequestErrors
} from '@elyra/ui-components';
import React from 'react';

import {
  IRuntimeType,
  PipelineService,
  RUNTIMES_SCHEMASPACE
} from './PipelineService';

const RUNTIMES_METADATA_CLASS = 'elyra-metadata-runtimes';

interface IRuntimeSchema extends ISchemaResource {
  runtime_type: string;
}

const addTrailingSlash = (url: string): string => {
  return url.endsWith('/') ? url : url + '/';
};

const getGithubURLFromAPI = (apiEndpoint: string): string => {
  // For Enterprise Server the api is located at <hostname>/api/
  let baseURL = new URL(apiEndpoint).origin;

  // For Github.com and Github AE the api is located at api.<hostname>
  baseURL = baseURL.replace('api.', '');

  return addTrailingSlash(baseURL);
};

export interface IRuntimesDisplayProps extends IMetadataDisplayProps {
  metadata: IMetadataResource[];
  openMetadataEditor: (args: IOpenMetadataEditorArgs) => void;
  updateMetadata: () => void;
  schemaspace: string;
  sortMetadata: boolean;
  className: string;
  schemas?: ISchemaResource[];
  titleContext?: string;
  appendToTitle?: boolean;
}

/**
 * A React Component for displaying the runtimes list.
 */

class RuntimesDisplay extends MetadataDisplay<IRuntimesDisplayProps> {
  renderExpandableContent(metadata: IMetadataResource): JSX.Element {
    let apiEndpoint = addTrailingSlash(
      metadata.metadata.api_endpoint as string
    );
    let cosEndpoint = addTrailingSlash(
      metadata.metadata.cos_endpoint as string
    );

    let githubRepoElement: JSX.Element | null = null;
    let metadata_props: GenericObjectType | null = null;

    for (const schema of this.props.schemas ?? []) {
      if (schema.name === metadata.schema_name) {
        const metadata = schema.properties?.metadata as
          | GenericObjectType
          | undefined;
        metadata_props = metadata?.properties;
      }
    }

    if (metadata.schema_name === 'airflow' && metadata_props) {
      const githubRepoUrl =
        getGithubURLFromAPI(metadata.metadata.github_api_endpoint as string) +
        metadata.metadata.github_repo +
        '/tree/' +
        metadata.metadata.github_branch +
        '/';
      githubRepoElement = (
        <span>
          <h6>{metadata_props.github_repo.title}</h6>
          <a href={githubRepoUrl} target="_blank" rel="noreferrer noopener">
            {githubRepoUrl}
          </a>
          <br />
          <br />
        </span>
      );
    }
    if (metadata.schema_name === 'kfp') {
      if (metadata.metadata.public_api_endpoint) {
        // user specified a public API endpoint. use it instead of the API endpoint
        apiEndpoint = addTrailingSlash(
          metadata.metadata.public_api_endpoint as string
        );
      }
    }

    if (metadata.metadata.public_cos_endpoint) {
      // user specified a public COS endpoint. use it instead of the API endpoint
      cosEndpoint = addTrailingSlash(
        metadata.metadata.public_cos_endpoint as string
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
        {githubRepoElement}
        <h6>
          {metadata_props
            ? metadata_props.cos_endpoint.title
            : 'Cloud Object Storage'}
        </h6>
        <a href={cosEndpoint} target="_blank" rel="noreferrer noopener">
          {cosEndpoint}
        </a>
      </div>
    );
  }
}

/**
 * A widget for displaying runtimes.
 */
export class RuntimesWidget extends MetadataWidget {
  runtimeTypes: IRuntimeType[] = [];

  constructor(props: IMetadataWidgetProps) {
    super(props);
  }

  async fetchMetadata(): Promise<IMetadataResource[] | undefined> {
    return await PipelineService.getRuntimes().catch(async (error) => {
      await RequestErrors.serverError(error);
      return [];
    });
  }

  async getSchemas(): Promise<void> {
    try {
      const schemas = await MetadataService.getSchema(this.props.schemaspace);
      if (!schemas) {
        return;
      }
      this.runtimeTypes = await PipelineService.getRuntimeTypes();
      const sortedSchema = schemas.sort((a, b) =>
        (a.title ?? '').localeCompare(b.title ?? '')
      );
      this.schemas = sortedSchema.filter((schema) => {
        const runtimeSchema = schema as IRuntimeSchema;
        return !!this.runtimeTypes.find(
          (r) => r.id === runtimeSchema.runtime_type && r.runtime_enabled
        );
      });
      if (this.schemas?.length ?? 0 > 1) {
        for (const schema of this.schemas ?? []) {
          this.props.app.contextMenu.addItem({
            selector: `#${this.props.schemaspace} .elyra-metadataHeader-addButton`,
            command: 'elyra-metadata-editor:open',
            args: {
              onSave: this.updateMetadata,
              schemaspace: this.props.schemaspace,
              schema: schema.name,
              title: schema.title,
              titleContext: this.props.titleContext,
              appendToTitle: this.props.appendToTitle
            } as GenericObjectType
          });
        }
      }
      this.update();
    } catch (error) {
      await RequestErrors.serverError(error as IErrorResponse);
    }
  }

  private getSchemaTitle = (metadata: IMetadataResource): string => {
    if (this.schemas) {
      for (const schema of this.schemas) {
        if (schema.name === metadata.schema_name) {
          return schema.title ?? '';
        }
      }
    }

    return 'runtime configuration';
  };

  addMetadata(schema: string, titleContext?: string): void {
    this.openMetadataEditor({
      onSave: this.updateMetadata,
      schemaspace: this.props.schemaspace,
      schema: schema,
      titleContext: titleContext
    });
  }

  renderDisplay(metadata: IMetadataResource[]): React.ReactElement {
    if (Array.isArray(metadata) && !metadata.length) {
      // Empty metadata
      return (
        <div>
          <br />
          <h6 className="elyra-no-metadata-msg">
            Click the + button to add {this.props.display_name.toLowerCase()}
          </h6>
        </div>
      );
    }

    const filteredMetadata = metadata.filter((m) => {
      return !!this.runtimeTypes.find((r) => m.metadata?.runtime_type === r.id);
    });

    return (
      <RuntimesDisplay
        metadata={filteredMetadata}
        updateMetadata={this.updateMetadata}
        openMetadataEditor={this.openMetadataEditor}
        schemaspace={RUNTIMES_SCHEMASPACE}
        sortMetadata={true}
        schemas={this.schemas}
        className={RUNTIMES_METADATA_CLASS}
        labelName={this.getSchemaTitle}
        titleContext={this.props.titleContext}
        appendToTitle={this.props.appendToTitle}
      />
    );
  }
}
