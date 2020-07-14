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

import '../style/index.css';

import { FrontendServices } from '@elyra/application';
import { IDictionary } from '@elyra/application/lib/parsing';
import { ExpandableComponent, trashIcon } from '@elyra/ui-components';
import { JupyterFrontEnd } from '@jupyterlab/application';
import {
  Dialog,
  ReactWidget,
  showDialog,
  UseSignal
} from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { addIcon, editIcon } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';

import React from 'react';

import { PipelineService } from './PipelineService';

/**
 * The CSS class added to code snippet widget.
 */
const CODE_SNIPPETS_HEADER_CLASS = 'elyra-codeSnippetsHeader';
const CODE_SNIPPETS_HEADER_BUTTON_CLASS = 'elyra-codeSnippetHeader-button';
const CODE_SNIPPET_ITEM = 'elyra-codeSnippet-item';

const METADATA_EDITOR_ID = 'elyra-metadata-editor';
const commands = {
  OPEN_METADATA_EDITOR: `${METADATA_EDITOR_ID}:open`
};

const RUNTIMES_NAMESPACE = 'runtimes';
const KFP_SCHEMA = 'kfp';

/**
 * MetadataDisplay props.
 */
interface IProps {
  metadata: IDictionary<any>[];
  openMetadataEditor: (args: any) => void;
  updateMetadata: () => void;
}

/**
 * A React Component for code-snippets display list.
 */
class MetadataDisplay extends React.Component<IProps> {
  private deleteMetadata = (metadata: IDictionary<any>): Promise<void> => {
    return showDialog({
      title: `Delete runtime: ${metadata.displayName}?`,
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    }).then((result: any) => {
      // Do nothing if the cancel button is pressed
      if (result.button.accept) {
        FrontendServices.deleteMetadata(RUNTIMES_NAMESPACE, metadata.name);
      }
    });
  };

  // Render display of metadata list
  private renderMetadata = (metadata: IDictionary<any>): JSX.Element => {
    const actionButtons = [
      {
        title: 'Edit',
        icon: editIcon,
        onClick: (): void => {
          this.props.openMetadataEditor({
            onSave: this.props.updateMetadata,
            namespace: RUNTIMES_NAMESPACE,
            schema: KFP_SCHEMA,
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

    return (
      <div className={CODE_SNIPPET_ITEM}>
        <ExpandableComponent
          displayName={metadata.display_name}
          tooltip={metadata.metadata.description}
          actionButtons={actionButtons}
        >
          <div id={metadata.name}>
            <pre>
              <code>{JSON.stringify(metadata.metadata, null, 2)}</code>
            </pre>
          </div>
        </ExpandableComponent>
      </div>
    );
  };

  render(): React.ReactElement {
    return (
      <div>
        <div id="codeSnippets">
          <div>{this.props.metadata.map(this.renderMetadata)}</div>
        </div>
      </div>
    );
  }
}

/**
 * A widget for viewing Runtimes.
 */
export class RuntimesWidget extends ReactWidget {
  renderSignal: Signal<this, any>;
  app: JupyterFrontEnd;

  constructor(app: JupyterFrontEnd) {
    super();
    this.renderSignal = new Signal<this, any>(this);
    this.app = app;

    this.fetchData = this.fetchData.bind(this);
    this.updateRuntimes = this.updateRuntimes.bind(this);
    this.openMetadataEditor = this.openMetadataEditor.bind(this);
  }

  addMetadata(): void {
    this.openMetadataEditor({
      onSave: this.updateRuntimes,
      namespace: RUNTIMES_NAMESPACE,
      schema: KFP_SCHEMA
    });
  }

  // Request code snippets from server
  async fetchData(): Promise<any> {
    return await PipelineService.getRuntimes();
  }

  updateRuntimes(): void {
    this.fetchData().then((runtimes: IDictionary<any>[]) => {
      this.renderSignal.emit(runtimes);
    });
  }

  // Triggered when the widget button on side panel is clicked
  onAfterShow(msg: Message): void {
    this.updateRuntimes();
  }

  openMetadataEditor(args: any): void {
    this.app.commands.execute(commands.OPEN_METADATA_EDITOR, args);
  }

  render(): React.ReactElement {
    return (
      <div>
        <header className={CODE_SNIPPETS_HEADER_CLASS}>
          <div style={{ display: 'flex' }}>
            <p> Runtimes </p>
          </div>
          <button
            className={CODE_SNIPPETS_HEADER_BUTTON_CLASS}
            onClick={this.addMetadata.bind(this)}
          >
            <addIcon.react tag="span" elementPosition="center" width="16px" />
          </button>
        </header>
        <UseSignal signal={this.renderSignal} initialArgs={[]}>
          {(_, runtimes): React.ReactElement => (
            <MetadataDisplay
              metadata={runtimes}
              updateMetadata={this.updateRuntimes}
              openMetadataEditor={this.openMetadataEditor}
            />
          )}
        </UseSignal>
      </div>
    );
  }
}

/**
 * A namespace for CodeSnippet statics.
 */
export namespace RuntimesWidget {
  /**
   * Interface describing table of contents widget options.
   */
  export interface IOptions {
    /**
     * Application document manager.
     */
    docmanager: IDocumentManager;

    /**
     * Application rendered MIME type.
     */
    rendermime: IRenderMimeRegistry;
  }
}
