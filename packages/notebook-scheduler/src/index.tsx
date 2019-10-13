/*
 * Copyright 2018-2019 IBM Corporation
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
import {ILayoutRestorer, JupyterFrontEnd, JupyterFrontEndPlugin} from '@jupyterlab/application';
import {ICommandPalette} from "@jupyterlab/apputils";

import {SubmitNotebookButtonExtension} from "./SubmitNotebook";


import '../style/index.css';
/**
 * A JupyterLab extension to submit notebooks to
 * be executed in a remote platform
 */

export const ewai_extension: JupyterFrontEndPlugin<void> = {
  id: 'ewai-extension',
  requires: [ICommandPalette, ILayoutRestorer],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer
  ): void => {
    console.log('AI Workspace - notebook-scheduler extension is activated!');

    // Extension initialization code
    let buttonExtension = new SubmitNotebookButtonExtension(app);
    app.docRegistry.addWidgetExtension('Notebook', buttonExtension);
    app.contextMenu.addItem({
      selector: '.jp-Notebook',
      command: 'notebook:submit',
      rank: -0.5
    });
  }
};

export default ewai_extension;
