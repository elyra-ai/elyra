/*
 * Copyright 2018-2022 Elyra Authors
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
  IMetadataActionButton
} from '@elyra/metadata-common';
import { MetadataService } from '@elyra/services';
import { RequestErrors } from '@elyra/ui-components';
import { refreshIcon } from '@jupyterlab/ui-components';

import React from 'react';

export const COMPONENT_CATALOGS_SCHEMASPACE = 'component-catalogs';

const COMPONENT_CATALOGS_CLASS = 'elyra-metadata-component-catalogs';

/**
 * A React Component for displaying the runtime images list.
 */
class ComponentCatalogsDisplay extends MetadataDisplay<
  IMetadataDisplayProps,
  IMetadataDisplayState
> {
  actionButtons(metadata: IMetadata): IMetadataActionButton[] {
    return [
      {
        title: 'Refresh',
        icon: refreshIcon,
        onClick: (): void => {
          MetadataService.putMetadata(
            COMPONENT_CATALOGS_SCHEMASPACE,
            metadata.name,
            JSON.stringify(metadata)
          )
            .then((response: any): void => {
              this.props.updateMetadata();
            })
            .catch(error => RequestErrors.serverError(error));
        }
      },
      ...super.actionButtons(metadata)
    ];
  }
}

/**
 * A widget for displaying runtime images.
 */
export class ComponentCatalogsWidget extends MetadataWidget {
  constructor(props: IMetadataWidgetProps) {
    super(props);
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

    return (
      <ComponentCatalogsDisplay
        metadata={metadata}
        updateMetadata={this.updateMetadata}
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
