import {JupyterFrontEnd, JupyterFrontEndPlugin} from '@jupyterlab/application';
import {IEditorServices} from '@jupyterlab/codeeditor';
import '../style/index.css';
import {PythonFileEditorFactory} from "./widget";

/**
 * Initialization data for the python-runner-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'python-runner-extension',
  autoStart: true,
  requires: [IEditorServices],
  activate: (app: JupyterFrontEnd, editorServices: IEditorServices) => {
    console.log('JupyterLab extension python-runner-extension is activated!');

    const factory = new PythonFileEditorFactory({
      editorServices,
      factoryOptions: {
        name: 'PyEditor',
        fileTypes: ['python'],
        defaultFor: ['python']
      }
    });

    app.docRegistry.addWidgetFactory(factory);
  }
};

export default extension;
