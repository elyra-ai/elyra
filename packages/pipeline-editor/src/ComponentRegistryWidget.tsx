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

import React from 'react';

export const COMPONENT_REGISTRY_NAMESPACE = 'component-registries';

const COMPONENT_REGISTRY_CLASS = 'elyra-metadata-component-registry';

/**
 * A React Component for displaying the runtime images list.
 */
class ComponentRegistryDisplay extends MetadataDisplay<
  IMetadataDisplayProps,
  IMetadataDisplayState
> {
  renderExpandableContent(metadata: IDictionary<any>): JSX.Element {
    return (
      <div>
        <h6>Component Registry</h6>
      </div>
    );
  }
}

/**
 * A widget for displaying runtime images.
 */
export class ComponentRegistryWidget extends MetadataWidget {
  constructor(props: IMetadataWidgetProps) {
    super(props);
  }

  renderDisplay(metadata: IMetadata[]): React.ReactElement {
    return (
      <ComponentRegistryDisplay
        metadata={metadata}
        updateMetadata={this.updateMetadata}
        openMetadataEditor={this.openMetadataEditor}
        namespace={COMPONENT_REGISTRY_NAMESPACE}
        sortMetadata={true}
        className={COMPONENT_REGISTRY_CLASS}
        labelName={(): string => {
          return 'runtime image';
        }}
      />
    );
  }
}
