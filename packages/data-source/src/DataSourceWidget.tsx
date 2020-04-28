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

import { ExpandableComponent } from '@elyra/ui-components';

import {
  ReactWidget,
  UseSignal,
  Clipboard,
  Dialog,
  showDialog
} from '@jupyterlab/apputils';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { PathExt } from '@jupyterlab/coreutils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { copyIcon, addIcon } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

import React from 'react';

import { DataSourceManager, IDataSource } from './DataSource';

/**
 * The CSS class added to data source widget.
 */
const DATA_SOURCES_CLASS = 'elyra-DataSources';
const DATA_SOURCES_HEADER_CLASS = 'elyra-dataSourcesHeader';
const DATA_SOURCE_ITEM = 'elyra-dataSource-item';

/**
 * DataSourceDisplay props.
 */
interface IDataSourceDisplayProps {
  dataSources: IDataSource[];
  getCurrentWidget: () => Widget;
}

/**
 * A React Component for data-sources display list.
 */
class DataSourceDisplay extends React.Component<IDataSourceDisplayProps> {
  // TODO: Use code mirror to display code

  // Handle data source insert into an editor
  private insertDataSource = async (source: IDataSource): Promise<void> => {
    const widget: Widget = this.props.getCurrentWidget();
    const sourceStr: string = source.code.join('\n');

    if (
      widget instanceof DocumentWidget &&
      (widget as DocumentWidget).content instanceof FileEditor
    ) {
      const documentWidget = widget as DocumentWidget;
      const fileEditor = (documentWidget.content as FileEditor).editor;
      const markdownRegex = /^\.(md|mkdn?|mdown|markdown)$/;
      if (PathExt.extname(widget.context.path).match(markdownRegex) !== null) {
        // Wrap source into a code block when inserting it into a markdown file
        fileEditor.replaceSelection(
          '```' + source.language + '\n' + sourceStr + '\n```'
        );
      } else if (widget.constructor.name == 'PythonFileEditor') {
        this.verifyLanguageAndInsert(source, 'python', fileEditor);
      } else {
        fileEditor.replaceSelection(sourceStr);
      }
    } else if (widget instanceof NotebookPanel) {
      const notebookWidget = widget as NotebookPanel;
      const notebookCell = (notebookWidget.content as Notebook).activeCell;
      const notebookCellEditor = notebookCell.editor;

      if (notebookCell instanceof CodeCell) {
        const kernelInfo = await notebookWidget.sessionContext.session?.kernel
          ?.info;
        const kernelLanguage: string = kernelInfo?.language_info.name || '';
        this.verifyLanguageAndInsert(
          source,
          kernelLanguage,
          notebookCellEditor
        );
      } else if (notebookCell instanceof MarkdownCell) {
        // Wrap source into a code block when inserting it into a markdown cell
        notebookCellEditor.replaceSelection(
          '```' + source.language + '\n' + sourceStr + '\n```'
        );
      } else {
        notebookCellEditor.replaceSelection(sourceStr);
      }
    } else {
      this.showErrDialog('Code source insert failed: Unsupported widget');
    }
  };

  // Handle language compatibility between data source and editor
  private verifyLanguageAndInsert = async (
    source: IDataSource,
    editorLanguage: string,
    editor: CodeEditor.IEditor
  ): Promise<void> => {
    const sourceStr: string = source.code.join('\n');
    if (
      editorLanguage &&
      source.language.toLowerCase() !== editorLanguage.toLowerCase()
    ) {
      const result = await this.showWarnDialog(
        editorLanguage,
        source.displayName
      );
      if (result.button.accept) {
        editor.replaceSelection(sourceStr);
      }
    } else {
      // Language match or editorLanguage is unavailable
      editor.replaceSelection(sourceStr);
    }
  };

  // Display warning dialog when inserting a data source incompatible with editor's language
  private showWarnDialog = async (
    editorLanguage: string,
    sourceName: string
  ): Promise<Dialog.IResult<string>> => {
    return showDialog({
      title: 'Warning',
      body:
        'Code source "' +
        sourceName +
        '" is incompatible with ' +
        editorLanguage +
        '. Continue?',
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    });
  };

  // Display error dialog when inserting a data source into unsupported widget (i.e. not an editor)
  private showErrDialog = (errMsg: string): Promise<Dialog.IResult<string>> => {
    return showDialog({
      title: 'Error',
      body: errMsg,
      buttons: [Dialog.okButton()]
    });
  };

  // Render display of data source list
  private renderDataSource = (dataSource: IDataSource): JSX.Element => {
    const displayName = dataSource.displayName;

    const actionButtons = [
      {
        title: 'Copy',
        icon: copyIcon,
        onClick: (): void => {
          Clipboard.copyToSystem(dataSource.code.join('\n'));
        }
      },
      {
        title: 'Insert',
        icon: addIcon,
        onClick: (): void => {
          this.insertDataSource(dataSource);
        }
      }
    ];

    console.log(dataSource);

    return (
      <div key={dataSource.name} className={DATA_SOURCE_ITEM}>
        <ExpandableComponent
          displayName={displayName}
          tooltip={dataSource.description}
          actionButtons={actionButtons}
        ></ExpandableComponent>
      </div>
    );
  };

  render(): React.ReactElement {
    return (
      <div>
        <div id="dataSources">
          <div>{this.props.dataSources.map(this.renderDataSource)}</div>
        </div>
      </div>
    );
  }
}

/**
 * A widget for Data Sources.
 */
export class DataSourceWidget extends ReactWidget {
  dataSourceManager: DataSourceManager;
  renderDataSourcesSignal: Signal<this, IDataSource[]>;
  getCurrentWidget: () => Widget;

  constructor(getCurrentWidget: () => Widget) {
    super();
    this.getCurrentWidget = getCurrentWidget;
    this.dataSourceManager = new DataSourceManager();
    this.renderDataSourcesSignal = new Signal<this, IDataSource[]>(this);
  }

  // Request data sources from server
  async fetchData(): Promise<IDataSource[]> {
    return await this.dataSourceManager.findAll();
  }

  // Triggered when the widget button on side palette is clicked
  onAfterShow(msg: Message): void {
    this.fetchData().then((dataSources: IDataSource[]) => {
      this.renderDataSourcesSignal.emit(dataSources);
    });
  }

  render(): React.ReactElement {
    return (
      <div className={DATA_SOURCES_CLASS}>
        <header className={DATA_SOURCES_HEADER_CLASS}>
          {'</> Data Sources'}
        </header>
        <UseSignal signal={this.renderDataSourcesSignal} initialArgs={[]}>
          {(_, dataSources): React.ReactElement => (
            <DataSourceDisplay
              dataSources={dataSources}
              getCurrentWidget={this.getCurrentWidget}
            />
          )}
        </UseSignal>
      </div>
    );
  }
}

/**
 * A namespace for DataSource statics.
 */
export namespace DataSourceWidget {
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
