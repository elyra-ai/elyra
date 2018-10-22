import { IDisposable } from '@phosphor/disposable';

//import { CommandRegistry } from '@phosphor/commands';

import { JupyterLab, JupyterLabPlugin } from '@jupyterlab/application';

import { ToolbarButton  } from '@jupyterlab/apputils';
//Dialog, IFrame, InstanceTracker, MainAreaWidget,showDialog

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { SubmitTable } from './SubmitTable'

import '../style/index.css';


class SubmitNotebookButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {

  constructor(app: JupyterLab) {
    this.app = app;
  }

  readonly app: JupyterLab;

  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    // Create the on-click callback for the toolbar button.
    // let submitNotebook = () => {
    //   dialogDemo()
    // };
    //
    // function dialogDemo(): void {
    //   showDialog({
    //     title: 'Create new notebook',
    //     body: SubmitTable.htmlContent,
    //     buttons: [Dialog.cancelButton(), Dialog.okButton()]
    //   });
    // }

    // Create the toolbar button
    let submitNotebookButton = new ToolbarButton({
      iconClassName: 'fa fa-send',
      label: 'Submit Notebook ...',
      onClick: SubmitTable.showSubmitDialog,
      tooltip: 'Submit Notebook ...'
    });

    // Add the toolbar button to the notebook
    panel.toolbar.insertItem(9, 'submitNotebook', submitNotebookButton);

    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return submitNotebookButton;
  }
}



function activate(app: JupyterLab): void {
  let buttonExtension = new SubmitNotebookButtonExtension(app);
  app.docRegistry.addWidgetExtension('Notebook', buttonExtension);
  app.contextMenu.addItem({
    selector: '.jp-Notebook',
    command: 'notebook:run-all-cells',
    rank: -0.5
  });
}


const extension: JupyterLabPlugin<void> = {
  id: 'runall-extension',
  autoStart: true,
  activate
};


export default extension;
