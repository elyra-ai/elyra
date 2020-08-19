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
import { ExpandableComponent, trashIcon } from '@elyra/ui-components';

import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  Dialog,
  ReactWidget,
  showDialog,
  UseSignal
} from '@jupyterlab/apputils';
import { addIcon, editIcon, LabIcon } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';
import React from 'react';
import JSONTree from 'react-json-tree';

/**
 * The CSS class added to metadata widgets.
 */
export const METADATA_HEADER_CLASS = 'elyra-metadataHeader';
export const METADATA_HEADER_BUTTON_CLASS = 'elyra-metadataHeader-button';
export const METADATA_ITEM = 'elyra-metadata-item';
const METADATA_JSON_CLASS = 'jp-RenderedJSON CodeMirror cm-s-jupyter';

const commands = {
  OPEN_METADATA_EDITOR: 'elyra-metadata-editor:open'
};

// Provide an invalid theme object (this is on purpose!) to invalidate the
// react-json-tree's inline styles that override CodeMirror CSS classes
const theme = {
  scheme: 'jupyter',
  base00: 'invalid',
  base01: 'invalid',
  base02: 'invalid',
  base03: 'invalid',
  base04: 'invalid',
  base05: 'invalid',
  base06: 'invalid',
  base07: 'invalid',
  base08: 'invalid',
  base09: 'invalid',
  base0A: 'invalid',
  base0B: 'invalid',
  base0C: 'invalid',
  base0D: 'invalid',
  base0E: 'invalid',
  base0F: 'invalid'
};

export interface IMetadata {
  name: string;
  display_name: string;
  metadata: IDictionary<any>;
  schema_name: string;
}

export interface IMetadataActionButton {
  title: string;
  icon: LabIcon;
  feedback?: string;
  onClick: () => void;
}

/**
 * MetadataDisplay props.
 */
export interface IMetadataDisplayProps {
  metadata: IMetadata[];
  openMetadataEditor: (args: any) => void;
  updateMetadata: () => void;
  namespace: string;
  schema: string;
}

/**
 * A React Component for displaying a list of metadata
 */
export class MetadataDisplay<
  T extends IMetadataDisplayProps
> extends React.Component<T> {
  deleteMetadata = (metadata: IMetadata): Promise<void> => {
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

  /**
   * Classes that extend MetadataWidget should override this
   */
  renderExpandableContent(metadata: IDictionary<any>): JSX.Element {
    return (
      <div className={METADATA_JSON_CLASS}>
        <JSONTree
          data={metadata.metadata}
          theme={{
            extend: theme,
            valueLabel: 'cm-variable',
            valueText: 'cm-string',
            nestedNodeItemString: 'cm-comment'
          }}
          invertTheme={false}
          keyPath={['metadata']}
          getItemString={(type, data, itemType, itemString) =>
            Array.isArray(data) ? (
              // Always display array type and the number of items i.e. "[] 2 items".
              <span>
                {itemType} {itemString}
              </span>
            ) : Object.keys(data).length === 0 ? (
              // Only display object type when it's empty i.e. "{}".
              <span>{itemType}</span>
            ) : (
              null! // Upstream typings don't accept null, but it should be ok
            )
          }
          labelRenderer={([label, type]) => {
            return <span className="cm-keyword">{`${label}: `}</span>;
          }}
          valueRenderer={raw => {
            let className = 'cm-string';
            if (typeof raw === 'number') {
              className = 'cm-number';
            }
            if (raw === 'true' || raw === 'false') {
              className = 'cm-keyword';
            }
            return <span className={className}>{`${raw}`}</span>;
          }}
        />
      </div>
    );
  }

  // Render display of metadata list
  renderMetadata = (metadata: IMetadata): JSX.Element => {
    return (
      <div key={metadata.name} className={METADATA_ITEM}>
        <ExpandableComponent
          displayName={metadata.display_name}
          tooltip={metadata.metadata.description}
          actionButtons={this.actionButtons(metadata)}
        >
          <div id={metadata.name}>{this.renderExpandableContent(metadata)}</div>
        </ExpandableComponent>
      </div>
    );
  };

  render(): React.ReactElement {
    return (
      <div>
        <div id="elyra-metadata">
          <div>{this.props.metadata.map(this.renderMetadata)}</div>
        </div>
      </div>
    );
  }
}

/**
 * MetadataWidget props.
 */
export interface IMetadataWidgetProps {
  app: JupyterFrontEnd;
  display_name: string;
  namespace: string;
  schema: string;
  icon: LabIcon;
}

/**
 * A abstract widget for viewing metadata.
 */
export class MetadataWidget extends ReactWidget {
  renderSignal: Signal<this, any>;
  props: IMetadataWidgetProps;
  schemaDisplayName: string;

  constructor(props: IMetadataWidgetProps) {
    super();
    this.addClass('elyra-metadata');

    this.props = props;
    this.renderSignal = new Signal<this, any>(this);

    this.schemaDisplayName = props.schema;

    this.fetchMetadata = this.fetchMetadata.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.openMetadataEditor = this.openMetadataEditor.bind(this);
    this.renderDisplay = this.renderDisplay.bind(this);

    this.getSchema();
  }

  async getSchema(): Promise<void> {
    const schemas = await FrontendServices.getSchema(this.props.namespace);
    for (const schema of schemas) {
      if (this.props.schema === schema.name) {
        this.schemaDisplayName = schema.title;
        this.update();
        break;
      }
    }
  }

  addMetadata(): void {
    this.openMetadataEditor({
      onSave: this.updateMetadata,
      namespace: this.props.namespace,
      schema: this.props.schema
    });
  }

  /**
   * Request metadata from server and format it as expected by the
   * instance of `MetadataDisplay` rendered in `renderDisplay`
   *
   * Classes that extend MetadataWidget should override this
   *
   * @returns metadata in the format expected by `renderDisplay`
   */
  async fetchMetadata(): Promise<any> {
    return await FrontendServices.getMetadata(this.props.namespace);
  }

  updateMetadata(): void {
    this.fetchMetadata().then((metadata: any[]) => {
      this.renderSignal.emit(metadata);
    });
  }

  // Triggered when the widget button on side panel is clicked
  onAfterShow(msg: Message): void {
    this.updateMetadata();
  }

  openMetadataEditor = (args: any): void => {
    this.props.app.commands.execute(commands.OPEN_METADATA_EDITOR, args);
  };

  /**
   * Classes that extend MetadataWidget should override this
   *
   * @returns a rendered instance of `MetadataDisplay`
   */
  renderDisplay(metadata: IMetadata[]): React.ReactElement {
    return (
      <MetadataDisplay
        metadata={metadata}
        updateMetadata={this.updateMetadata}
        openMetadataEditor={this.openMetadataEditor}
        namespace={this.props.namespace}
        schema={this.props.schema}
      />
    );
  }

  render(): React.ReactElement {
    return (
      <div>
        <header className={METADATA_HEADER_CLASS}>
          <div style={{ display: 'flex' }}>
            <this.props.icon.react
              tag="span"
              width="auto"
              height="24px"
              verticalAlign="middle"
              marginRight="5px"
            />
            <p> {this.props.display_name} </p>
          </div>
          <button
            className={METADATA_HEADER_BUTTON_CLASS}
            onClick={this.addMetadata.bind(this)}
            title={`Create new ${this.schemaDisplayName}`}
          >
            <addIcon.react tag="span" elementPosition="center" width="16px" />
          </button>
        </header>
        <UseSignal signal={this.renderSignal} initialArgs={[]}>
          {(_, metadata): React.ReactElement => this.renderDisplay(metadata)}
        </UseSignal>
      </div>
    );
  }
}
