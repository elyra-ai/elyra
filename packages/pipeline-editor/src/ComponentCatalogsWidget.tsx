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
import { RequestErrors } from '@elyra/ui-components';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';
import { LabIcon, refreshIcon } from '@jupyterlab/ui-components';

import React from 'react';

import { PipelineService } from './PipelineService';

export const COMPONENT_CATALOGS_SCHEMASPACE = 'component-catalogs';

const COMPONENT_CATALOGS_CLASS = 'elyra-metadata-component-catalogs';

const handleError = (error: any): void => {
  // silently eat a 409, the server will log in in the console
  if (error.status !== 409) {
    RequestErrors.serverError(error);
  }
};

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
        title: 'Reload components from catalog',
        icon: refreshIcon,
        onClick: (): void => {
          PipelineService.refreshComponentsCache(metadata.name)
            .then((response: any): void => {
              this.props.updateMetadata();
            })
            .catch(error => handleError(error));
        }
      },
      ...super.actionButtons(metadata)
    ];
  }
}

/**
 * ComponentCatalogsWidget props.
 */
export interface IComponentCatalogsWidgetProps extends IMetadataWidgetProps {
  app: JupyterFrontEnd;
  themeManager?: IThemeManager;
  display_name: string;
  schemaspace: string;
  icon: LabIcon;
  titleContext?: string;
  appendToTitle?: boolean;
  refreshCallback?: () => void;
}

/**
 * A widget for displaying runtime images.
 */
export class ComponentCatalogsWidget extends MetadataWidget {
  refreshButtonTooltip: string;
  refreshCallback?: () => void;

  constructor(props: IComponentCatalogsWidgetProps) {
    super(props);
    this.refreshCallback = props.refreshCallback;
    this.refreshButtonTooltip =
      'Refresh list and reload components from all catalogs';
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
      .catch(error => handleError(error));
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
