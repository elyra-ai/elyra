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

import { ExpandableComponent, insertCodeSnippet } from '@elyra/ui-components';

import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { addIcon } from '@jupyterlab/ui-components';

import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { Signal } from '@lumino/signaling';
import { Widget, Menu } from '@lumino/widgets';

import React from 'react';

import { CodeTemplateManager } from './CodeTemplate';
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
  app: JupyterFrontEnd;
}

/**
 * A React Component for data-sources display list.
 */
class DataSourceDisplay extends React.Component<IDataSourceDisplayProps> {
  props: any;
  commandRegistry: CommandRegistry;

  constructor(props: any) {
    super(props);
  }

  private addSubmenu(dataSource: IDataSource): void {
    const languageMenus: any[] = [];
    const id = dataSource.id;
    for (const template of this.props.codeTemplates) {
      const language = template.language;
      const framework = template.framework;

      // Only show code templates that are for the format of this datasource
      const format = template.format;
      if (format != dataSource.format) {
        continue;
      }
      const menuObj: any = languageMenus.find((languageMenu: any) => {
        return languageMenu.language == language;
      });
      let menu: Menu;
      if (!menuObj) {
        menu = new Menu({ commands: this.commandRegistry });
        menu.title.label = language;

        languageMenus.push({ language: language, menu: menu });
        this.props.app.contextMenu.addItem({
          type: 'submenu' as Menu.ItemType,
          submenu: menu,
          selector:
            '.elyra-expandableContainer-actionButton[title="' + id + '"]'
        });
      } else {
        menu = menuObj.menu;
      }

      this.commandRegistry.addCommand(
        'insert-data-source:' + id + ':' + language + ':' + framework,
        {
          execute: (args: any) => {
            const snippetStr = eval('`' + template.code.join('\n') + '`');
            insertCodeSnippet(
              language,
              snippetStr,
              this.props.getCurrentWidget
            );
          },
          label: 'Insert ' + framework
        }
      );

      menu.addItem({
        command: 'insert-data-source:' + id + ':' + language + ':' + framework,
        args: { language: language, framework: framework }
      });
    }
  }

  // Render display of data source list
  private renderDataSource = (dataSource: IDataSource): JSX.Element => {
    const displayName = dataSource.displayName;

    const actionButtons = [
      {
        title: dataSource.id + '',
        icon: addIcon,
        onClick: (): void => {
          console.log('TODO automatically open context menu');
        }
      }
    ];

    let sourceTitle = dataSource.source;
    if (sourceTitle.length > 25) {
      sourceTitle = sourceTitle.substring(0, 25) + '...';
    }
    const sourceLink = <a href={dataSource.source}>{sourceTitle}</a>;
    const description = (
      <div className="elyra-dataSource-description">
        {dataSource.description}
      </div>
    );
    const body = (
      <div>
        {description}
        source : {sourceLink}
      </div>
    );

    return (
      <div key={dataSource.name} className={DATA_SOURCE_ITEM}>
        <ExpandableComponent
          displayName={displayName}
          tooltip={dataSource.description}
          actionButtons={actionButtons}
        >
          {' '}
          {body}{' '}
        </ExpandableComponent>
      </div>
    );
  };

  render(): React.ReactElement {
    this.commandRegistry = new CommandRegistry();
    for (const dataSource of this.props.dataSources) {
      this.addSubmenu(dataSource);
    }
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
  codeTemplateManager: CodeTemplateManager;
  renderDataSourcesSignal: Signal<this, any>;
  getCurrentWidget: () => Widget;
  app: JupyterFrontEnd;

  constructor(getCurrentWidget: () => Widget, app: JupyterFrontEnd) {
    super();
    this.getCurrentWidget = getCurrentWidget;
    this.dataSourceManager = new DataSourceManager();
    this.codeTemplateManager = new CodeTemplateManager();
    this.renderDataSourcesSignal = new Signal<this, any>(this);
    this.app = app;
  }

  // Request data sources and templates from server
  async fetchData(): Promise<any> {
    const dataSources = await this.dataSourceManager.findAll();
    const codeTemplates = await this.codeTemplateManager.findAll();
    return { dataSources: dataSources, codeTemplates: codeTemplates };
  }

  // Triggered when the widget button on side palette is clicked
  onAfterShow(msg: Message): void {
    this.fetchData().then((response: any) => {
      this.renderDataSourcesSignal.emit(response);
    });
  }

  render(): React.ReactElement {
    return (
      <div className={DATA_SOURCES_CLASS}>
        <header className={DATA_SOURCES_HEADER_CLASS}>{'Data Sources'}</header>
        <UseSignal
          signal={this.renderDataSourcesSignal}
          initialArgs={{ dataSources: [], codeTemplates: [] }}
        >
          {(_, response: any): React.ReactElement => {
            return (
              <DataSourceDisplay
                dataSources={response.dataSources}
                codeTemplates={response.codeTemplates}
                getCurrentWidget={this.getCurrentWidget}
                app={this.app}
              />
            );
          }}
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
