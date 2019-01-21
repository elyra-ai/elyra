import { JupyterLab, JupyterLabPlugin } from '@jupyterlab/application';

import { SubmitNotebookButtonExtension} from "./SubmitNotebook";

import '../style/index.css';

/**
 * A JupyterLab extension to submit notebooks to
 * be executed in a remote platform
 */
const extension: JupyterLabPlugin<void> = {
  id: 'run-submit-notebook-extension',
  autoStart: true,
  activate: (
    app: JupyterLab
  ): void => {
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


export default extension;
