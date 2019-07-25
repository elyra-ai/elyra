import {JupyterFrontEnd, JupyterFrontEndPlugin} from '@jupyterlab/application';
import {IEditorServices} from '@jupyterlab/codeeditor';
import '../style/index.css';
import {PythonFileEditorFactory} from "./widget";
import {ILauncher} from '@jupyterlab/launcher';
import {IMainMenu} from '@jupyterlab/mainmenu';

const PYTHON_ICON_CLASS = 'jp-PythonIcon';
const PYTHON_FACTORY = 'PyEditor';
const PYTHON = 'python';
/**
 * Initialization data for the python-runner-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'ewai-python-runner-extension',
  autoStart: true,
  requires: [IEditorServices],
  optional: [ILauncher, IMainMenu],
  activate: (
    app: JupyterFrontEnd, 
    editorServices: IEditorServices,
    launcher: ILauncher | null,
    menu: IMainMenu | null) => {
      console.log('AI Workspace - python-runner extension is activated!');

      const factory = new PythonFileEditorFactory({
        editorServices,
        factoryOptions: {
          name: PYTHON_FACTORY,
          fileTypes: [PYTHON],
          defaultFor: [PYTHON]
        }
      });

      const { commands } = app;

      // Function to create a new untitled python file, given the current working directory
      const createNew = (cwd: string, ext: string = 'py') => {
        return commands
          .execute('docmanager:new-untitled', {
            path: cwd,
            type: 'file',
            ext
          })
          .then(model => {
            return commands.execute('docmanager:open', {
              path: model.path,
              factory: PYTHON_FACTORY
            });
          });
      };
  
      // Add a command to create new Python file
      commands.addCommand(createNewPython, {
        label: args => (args['isPalette'] ? 'New Python File' : 'Python File'),
        caption: 'Create a new python file',
        iconClass: args => (args['isPalette'] ? '' : PYTHON_ICON_CLASS),
        execute: args => {
          let cwd = args['cwd'] ;
          return createNew(cwd as string, 'py');
        }
      });

      // Add a python launcher
      if (launcher) {
        launcher.add({
          command: createNewPython,
          category: 'Other',
          rank: 3
        });
      }

      if (menu) {
        // Add new python file creation to the file menu
        menu.fileMenu.newMenu.addGroup(
          [{ command: createNewPython }],
          30
        );
      }
      
      app.docRegistry.addWidgetFactory(factory);
    }
};

export default extension;
export const createNewPython = 'fileeditor:create-new-python-file';
export const createNew = 'fileeditor:create-new';
