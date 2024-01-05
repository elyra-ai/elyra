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

import {
  MetadataWidget,
  IMetadataWidgetProps,
  IMetadata,
  MetadataDisplay,
  IMetadataDisplayProps,
  IMetadataDisplayState,
  IMetadataActionButton,
} from '@elyra/metadata-common';
import { IDictionary, MetadataService } from '@elyra/services';
import { RequestErrors } from '@elyra/ui-components';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { LabIcon, refreshIcon } from '@jupyterlab/ui-components';

import React from 'react';

import { IRuntimeType, PipelineService } from './PipelineService';

export const COMPONENT_CATALOGS_SCHEMASPACE = 'component-catalogs';

const COMPONENT_CATALOGS_CLASS = 'elyra-metadata-component-catalogs';

const handleError = (error: any): void => {
  // silently eat a 409, the server will log in in the console
  if (error.status !== 409) {
    RequestErrors.serverError(error);
  }
};

/**
 * A React Component for displaying the component catalogs list.
 */
class ComponentCatalogsDisplay extends MetadataDisplay<
  IMetadataDisplayProps,
  IMetadataDisplayState
> {
  actionButtons(metadata: IMetadata): IMetadataActionButton[] {
    return [
      {
        title: 'Reload components from catalog',
        icon: refreshIcon,
        onClick: (): void => {
          PipelineService.refreshComponentsCache(metadata.name)
            .then((response: any): void => {
              this.props.updateMetadata();
            })
            .catch((error) => handleError(error));
        },
      },
      ...super.actionButtons(metadata),
    ];
  }
  // render catalog entries
  renderExpandableContent(metadata: IDictionary<any>): JSX.Element {
    let category_output = <li key="No category">No category</li>;
    if (metadata.metadata.categories) {
      category_output = metadata.metadata.categories.map((category: string) => (
        <li key={category}>{category}</li>
      ));
    }

    return (
      <div>
        <h6>Runtime Type</h6>
        {metadata.metadata.runtime_type}
        <br />
        <br />
        <h6>Description</h6>
        {metadata.metadata.description ?? 'No description'}
        <br />
        <br />
        <h6>Categories</h6>
        <ul>{category_output}</ul>
      </div>
    );
  }

  // Allow for filtering by display_name, name, and description
  matchesSearch(searchValue: string, metadata: IMetadata): boolean {
    searchValue = searchValue.toLowerCase();
    // True if search string is in name or display_name,
    // or if the search string is empty
    const description = (metadata.metadata.description || '').toLowerCase();
    return (
      metadata.name.toLowerCase().includes(searchValue) ||
      metadata.display_name.toLowerCase().includes(searchValue) ||
      description.includes(searchValue)
    );
  }
}

/**
 * ComponentCatalogsWidget props.
 */
export interface IComponentCatalogsWidgetProps extends IMetadataWidgetProps {
  app: JupyterFrontEnd;
  display_name: string;
  schemaspace: string;
  icon: LabIcon;
  titleContext?: string;
  appendToTitle?: boolean;
  refreshCallback?: () => void;
}

/**
 * A widget for displaying component catalogs.
 */
export class ComponentCatalogsWidget extends MetadataWidget {
  refreshButtonTooltip: string;
  refreshCallback?: () => void;
  runtimeTypes: IRuntimeType[] = [];

  constructor(props: IComponentCatalogsWidgetProps) {
    super(props);
    this.refreshCallback = props.refreshCallback;
    this.refreshButtonTooltip =
      'Refresh list and reload components from all catalogs';
  }

  async getSchemas(): Promise<void> {
    try {
      const schemas = await MetadataService.getSchema(this.props.schemaspace);
      this.runtimeTypes = await PipelineService.getRuntimeTypes();
      const sortedSchema = schemas.sort((a: any, b: any) =>
        a.title.localeCompare(b.title),
      );
      this.schemas = sortedSchema.filter((schema: any) => {
        return !!this.runtimeTypes.find(
          (r) =>
            schema.properties?.metadata?.properties?.runtime_type?.enum?.includes(
              r.id,
            ) && r.runtime_enabled,
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
              appendToTitle: this.props.appendToTitle,
            } as any,
          });
        }
      }
      this.update();
    } catch (error) {
      RequestErrors.serverError(error);
    }
  }

  // wrapper function that refreshes the palette after calling updateMetadata
  updateMetadataAndRefresh = (): void => {
    super.updateMetadata();
    if (this.refreshCallback) {
      this.refreshCallback();
    }
  };

  refreshMetadata(): void {
    PipelineService.refreshComponentsCache()
      .then((response: any): void => {
        this.updateMetadataAndRefresh();
      })
      .catch((error) => handleError(error));
  }

  renderDisplay(metadata: IMetadata[]): React.ReactElement {
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
      <ComponentCatalogsDisplay
        metadata={filteredMetadata}
        updateMetadata={this.updateMetadataAndRefresh}
        openMetadataEditor={this.openMetadataEditor}
        schemaspace={COMPONENT_CATALOGS_SCHEMASPACE}
        sortMetadata={true}
        className={COMPONENT_CATALOGS_CLASS}
        omitTags={this.omitTags()}
        titleContext={this.props.titleContext}
      />
    );
  }
}
