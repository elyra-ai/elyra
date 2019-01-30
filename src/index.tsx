import {ILayoutRestorer, JupyterLab, JupyterLabPlugin} from '@jupyterlab/application';
import {ICommandPalette, InstanceTracker} from "@jupyterlab/apputils";
import {JSONExt} from "@phosphor/coreutils";
import {Widget} from "@phosphor/widgets";

import {SubmitNotebookButtonExtension} from "./SubmitNotebook";
import {NotebookExperimentWidget} from "./NotebookExperiments";

import '../style/index.css';
/**
 * A JupyterLab extension to submit notebooks to
 * be executed in a remote platform
 */

export const dlw_extension: JupyterLabPlugin<void> = {
  id: 'dlw-extension',
  requires: [ICommandPalette, ILayoutRestorer],
  autoStart: true,
  activate: (
    app: JupyterLab,
    palette: ICommandPalette,
    restorer: ILayoutRestorer
  ): void => {
    console.log('Activating Deep Learning Workspace JupyterLab extension!');

    // Extension initialization code
    let buttonExtension = new SubmitNotebookButtonExtension(app);
    app.docRegistry.addWidgetExtension('Notebook', buttonExtension);
    app.contextMenu.addItem({
      selector: '.jp-Notebook',
      command: 'notebook:submit',
      rank: -0.5
    });

    // Declare a widget variable
    let notebookExperimentWidget: NotebookExperimentWidget

    setTimeout(() => {
      notebookExperimentWidget.update()
    }, 30 * 1000);

    // Add an application command
    const command: string = 'dlw:open-experiments';
    app.commands.addCommand(command, {
    label: 'Notebook Experiments',
    execute: () => {
      if (!notebookExperimentWidget) {
        // Create a new widget if one does not exist
        notebookExperimentWidget = new NotebookExperimentWidget();
        notebookExperimentWidget.update();
      }
      if (!tracker.has(notebookExperimentWidget)) {
        // Track the state of the widget for later restoration
        tracker.add(notebookExperimentWidget);
      }
      if (!notebookExperimentWidget.isAttached) {
        // Attach the widget to the main work area if it's not there
        app.shell.addToMainArea(notebookExperimentWidget);
      } else {
        // Refresh the comic in the widget
        notebookExperimentWidget.update();
      }

      // Add as right side panel
      app.shell.addToRightArea(notebookExperimentWidget)

      // Activate the widget
      app.shell.activateById(notebookExperimentWidget.id);
    }
  });

  // Add the command to the palette.
  palette.addItem({ command, category: 'Tutorial' });


  // Track and restore the widget state
  let tracker = new InstanceTracker<Widget>({ namespace: 'dlw' });
  restorer.restore(tracker, {
    command,
    args: () => JSONExt.emptyObject,
    name: () => 'dlw'
  });
  }
};

export default dlw_extension;