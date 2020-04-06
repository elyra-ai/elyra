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
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette } from '@jupyterlab/apputils';

import '../style/index.css';
import { SubmitNotebookButtonExtension } from './SubmitNotebook';

const NOTEBOOK_SCHEDULER_NAMESPACE = 'elyra-notebook_scheduler_extension';

const commandIDs = {
  submitNotebook: 'notebook:submit'
};

/**
 * A JupyterLab extension to submit notebooks to
 * be executed in a remote runtime
 */

export const notebook_scheduler_extension: JupyterFrontEndPlugin<void> = {
  id: NOTEBOOK_SCHEDULER_NAMESPACE,
  requires: [ICommandPalette, ILayoutRestorer],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer
  ): void => {
    console.log('Elyra - notebook-scheduler extension is activated!');

    // Extension initialization code
    const buttonExtension = new SubmitNotebookButtonExtension(app);
    app.docRegistry.addWidgetExtension('Notebook', buttonExtension);
    app.contextMenu.addItem({
      selector: '.jp-Notebook',
      command: commandIDs.submitNotebook,
      rank: -0.5
    });
  }
};

export default notebook_scheduler_extension;
