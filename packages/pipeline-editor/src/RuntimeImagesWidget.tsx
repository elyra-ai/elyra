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
  //IMetadataDisplayState,
} from '@elyra/metadata-common';
import { IDictionary } from '@elyra/services';

import React from 'react';

export const RUNTIME_IMAGES_SCHEMASPACE = 'runtime-images';

const RUNTIME_IMAGES_CLASS = 'elyra-metadata-runtime-images';

const getLinkFromImageName = (imageName: string): string => {
  let hostname = '';
  const fqinParts = imageName.split('/');

  if (
    fqinParts[0].includes('.') ||
    fqinParts[0].includes(':') ||
    fqinParts[0].includes('localhost')
  ) {
    hostname = fqinParts[0];
    imageName = fqinParts.slice(1).join('/');
  }

  if (!hostname || hostname.includes('docker.io')) {
    hostname = 'hub.docker.com/r';
  }

  const imageRepo = imageName.split(':')[0];

  return `https://${hostname}/${imageRepo}`;
};

/**
 * A React Component for displaying the runtime images list.
 */
class RuntimeImagesDisplay extends MetadataDisplay<IMetadataDisplayProps> {
  renderExpandableContent(metadata: IDictionary<any>): JSX.Element {
    return (
      <div>
        <h6>Container Image</h6>
        <a
          href={getLinkFromImageName(metadata.metadata.image_name)}
          target="_blank"
          rel="noreferrer noopener"
        >
          {metadata.metadata.image_name}
        </a>
      </div>
    );
  }
}

/**
 * A widget for displaying runtime images.
 */
export class RuntimeImagesWidget extends MetadataWidget {
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
      <RuntimeImagesDisplay
        metadata={metadata}
        updateMetadata={this.updateMetadata}
        openMetadataEditor={this.openMetadataEditor}
        schemaspace={RUNTIME_IMAGES_SCHEMASPACE}
        sortMetadata={true}
        className={RUNTIME_IMAGES_CLASS}
        labelName={(): string => {
          return 'runtime image';
        }}
      />
    );
  }
}
