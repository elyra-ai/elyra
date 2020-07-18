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

import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { addIcon, LabIcon } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';
import React from 'react';

import { ExpandableComponent } from './ExpandableComponent';

/**
 * The CSS class added to metadata widgets.
 */
const METADATA_HEADER_CLASS = 'elyra-metadataHeader';
const METADATA_HEADER_BUTTON_CLASS = 'elyra-metadataHeader-button';
const METADATA_ITEM = 'elyra-metadata-item';

const commands = {
  OPEN_METADATA_EDITOR: 'elyra-metadata-editor:open'
};

export interface IMetadata {
  name: string;
  display_name: string;
  metadata: any;
  schema_name: string;
}

export interface IMetadataActionButton {
  title: string;
  icon: LabIcon;
  onClick: () => void;
}

/**
 * Basic MetadataDisplay props.
 */
export interface IMetadataDisplayProps {
  metadata: IMetadata[];
}

/**
 * A React Component for code-snippets display list.
 */
export abstract class MetadataDisplay<
  T extends IMetadataDisplayProps
> extends React.Component<T> {
  abstract actionButtons(metadata: IMetadata): IMetadataActionButton[];

  abstract renderExpandableContent(metadata: IMetadata): JSX.Element;

  // Render display of metadata list
  private renderMetadata = (metadata: IMetadata): JSX.Element => {
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
}

/**
 * A abstract widget for viewing metadata.
 */
export abstract class MetadataWidget extends ReactWidget {
  renderSignal: Signal<this, any>;
  props: IMetadataWidgetProps;

  protected constructor(props: IMetadataWidgetProps) {
    super();
    this.addClass('elyra-metadata');

    this.props = props;
    this.renderSignal = new Signal<this, any>(this);

    this.fetchMetadata = this.fetchMetadata.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.openMetadataEditor = this.openMetadataEditor.bind(this);
    this.renderDisplay = this.renderDisplay.bind(this);
  }

  protected addMetadata(): void {
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
   * @returns metadata in the format expected by `renderDisplay`
   */
  abstract async fetchMetadata(): Promise<any>;

  protected updateMetadata(): void {
    this.fetchMetadata().then((metadata: any[]) => {
      this.renderSignal.emit(metadata);
    });
  }

  // Triggered when the widget button on side panel is clicked
  onAfterShow(msg: Message): void {
    this.updateMetadata();
  }

  protected openMetadataEditor = (args: any): void => {
    this.props.app.commands.execute(commands.OPEN_METADATA_EDITOR, args);
  };

  /**
   * @returns a rendered instance of `MetadataDisplay`
   */
  abstract renderDisplay(metadata: IMetadata[]): React.ReactElement;

  render(): React.ReactElement {
    return (
      <div>
        <header className={METADATA_HEADER_CLASS}>
          <div style={{ display: 'flex' }}>
            <p> {this.props.display_name} </p>
          </div>
          <button
            className={METADATA_HEADER_BUTTON_CLASS}
            onClick={this.addMetadata.bind(this)}
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
