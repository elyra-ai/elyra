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

import { IDictionary, FrontendServices } from '@elyra/application';
import {
  trashIcon,
  MetadataWidget,
  IMetadata,
  IMetadataWidgetProps,
  IMetadataActionButton,
  MetadataDisplay,
  IMetadataDisplayProps
} from '@elyra/ui-components';

import { Dialog, showDialog } from '@jupyterlab/apputils';
import { editIcon } from '@jupyterlab/ui-components';
import React from 'react';

/**
 * DefaultMetadataDisplay props.
 */
interface IDefaultMetadataDisplayProps extends IMetadataDisplayProps {
  metadata: IMetadata[];
  openMetadataEditor: (args: any) => void;
  updateMetadata: () => void;
  namespace: string;
  schema: string;
}

/**
 * A React Component for displaying a metadata list.
 */
class DefaultMetadataDisplay extends MetadataDisplay<
  IDefaultMetadataDisplayProps
> {
  private deleteMetadata = (metadata: IMetadata): Promise<void> => {
    return showDialog({
      title: `Delete metadata: ${metadata.display_name}?`,
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    }).then((result: any) => {
      // Do nothing if the cancel button is pressed
      if (result.button.accept) {
        FrontendServices.deleteMetadata(this.props.namespace, metadata.name);
      }
    });
  };

  actionButtons = (metadata: IMetadata): IMetadataActionButton[] => {
    return [
      {
        title: 'Edit',
        icon: editIcon,
        onClick: (): void => {
          this.props.openMetadataEditor({
            onSave: this.props.updateMetadata,
            namespace: this.props.namespace,
            schema: this.props.schema,
            name: metadata.name
          });
        }
      },
      {
        title: 'Delete',
        icon: trashIcon,
        onClick: (): void => {
          this.deleteMetadata(metadata).then((response: any): void => {
            this.props.updateMetadata();
          });
        }
      }
    ];
  };

  renderExpandableContent(metadata: IDictionary<any>): JSX.Element {
    return (
      <pre>
        <code>{JSON.stringify(metadata.metadata, null, 2)}</code>
      </pre>
    );
  }
}

/**
 * A widget for viewing metadata.
 */
export class DefaultMetadataWidget extends MetadataWidget {
  constructor(props: IMetadataWidgetProps) {
    super(props);
  }

  async fetchMetadata(): Promise<any> {
    return await FrontendServices.getMetadata(this.props.namespace);
  }

  renderDisplay(metadata: IMetadata[]): React.ReactElement {
    return (
      <DefaultMetadataDisplay
        metadata={metadata}
        updateMetadata={this.updateMetadata}
        openMetadataEditor={this.openMetadataEditor}
        namespace={this.props.namespace}
        schema={this.props.schema}
      />
    );
  }
}
