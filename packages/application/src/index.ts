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

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { elyraIcon } from './icons';

import '../style/index.css';

/**
 * Initialization data for the application extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'elyra-application',
  autoStart: true,
  requires: [IMainMenu, ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    mainMenu: IMainMenu,
    settings: ISettingRegistry
  ) => {
    console.log('Elyra - application extension is activated!');

    // Find the MainLogo widget in the shell and replace it with the Elyra Logo
    const widgets = app.shell.widgets('top');
    let widget = widgets.next();

    while (widget !== undefined) {
      if (widget.id === 'jp-MainLogo') {
        elyraIcon.element({
          container: widget.node,
          justify: 'center',
          margin: '2px 5px 2px 5px',
          height: 'auto',
          width: '20px'
        });
        break;
      }

      widget = widgets.next();
      console.log(widget);
    }
  }
};

export * from './parsing';
export * from './services';
export * from './submission';
export * from './icons';

export default extension;
