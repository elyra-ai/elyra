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

import { codeSnippetIcon } from '@elyra/ui-components';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';

import { Widget } from '@lumino/widgets';

import { DataSourceWidget } from './DataSourceWidget';

const DATA_SOURCE_EXTENSION_ID = 'elyra-data-source-extension';

/**
 * Initialization data for the data-source extension.
 */
export const data_source_extension: JupyterFrontEndPlugin<void> = {
  id: DATA_SOURCE_EXTENSION_ID,
  autoStart: true,
  requires: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
    console.log('Elyra - data-source extension is activated!');

    const getCurrentWidget = (): Widget => {
      return app.shell.currentWidget;
    };

    const dataSourceWidget = new DataSourceWidget(getCurrentWidget);
    dataSourceWidget.id = DATA_SOURCE_EXTENSION_ID;
    dataSourceWidget.title.icon = codeSnippetIcon;
    dataSourceWidget.title.caption = 'Data Source';

    // Rank has been chosen somewhat arbitrarily to give priority to the running
    // sessions widget in the sidebar.
    app.shell.add(dataSourceWidget, 'left', { rank: 900 });
  }
};

export default data_source_extension;
