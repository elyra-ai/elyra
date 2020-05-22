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
    // this.props = props;

    this.commandRegistry = new CommandRegistry();

    this.props.app.commands.addCommand('insert-data-source', {
      execute: (args: any) => {
        console.log('execute');
        console.log(args);
      },
      label: 'Insert'
    });

    this.props.app.contextMenu.addItem({
      selector: '.elyra-expandableContainer-actionButton',
      command: 'insert-data-source'
    });
  }

  private addSubmenu(dataSource: IDataSource): void {
    const languageMenus: any[] = [];
    for (const code of dataSource.code) {
      const language = code.language;
      const framework = code.framework;
      const menuObj: any = languageMenus.find((languageMenu: any) => {
        return languageMenu.language == language;
      });
      let menu: Menu;
      if (!menuObj) {
        console.log('no menu');
        menu = new Menu({ commands: this.commandRegistry });
        menu.title.label = language;

        languageMenus.push({ language: language, menu: menu });
        this.props.app.contextMenu.addItem({
          type: 'submenu' as Menu.ItemType,
          submenu: menu,
          selector: '.elyra-expandableContainer-actionButton'
        });
      } else {
        menu = menuObj.menu;
      }

      this.commandRegistry.addCommand(
        'insert-data-source:' + language + ':' + framework,
        {
          execute: (args: any) => {
            console.log('commandsreg');
            console.log(args);
          },
          label: 'Insert ' + framework
        }
      );

      menu.addItem({
        command: 'insert-data-source:' + language + ':' + framework,
        args: { language: language, framework: framework }
      });
    }
  }

  // Render display of data source list
  private renderDataSource = (dataSource: IDataSource): JSX.Element => {
    const displayName = dataSource.displayName;

    const actionButtons = [
      {
        title: 'Insert',
        icon: addIcon,
        onClick: (): void => {
          console.log('TODO OPEN CONTEXT MENU');
        }
      }
    ];

    this.addSubmenu(dataSource);

    // const br = '<br/>';
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
  app: JupyterFrontEnd;

  constructor(getCurrentWidget: () => Widget, app: JupyterFrontEnd) {
    super();
    this.getCurrentWidget = getCurrentWidget;
    this.dataSourceManager = new DataSourceManager();
    this.renderDataSourcesSignal = new Signal<this, IDataSource[]>(this);
    this.app = app;
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
        <header className={DATA_SOURCES_HEADER_CLASS}>{'Data Sources'}</header>
        <UseSignal signal={this.renderDataSourcesSignal} initialArgs={[]}>
          {(_, dataSources): React.ReactElement => (
            <DataSourceDisplay
              dataSources={dataSources}
              getCurrentWidget={this.getCurrentWidget}
              app={this.app}
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
