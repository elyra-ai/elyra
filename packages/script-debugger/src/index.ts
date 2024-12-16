/*
 * Copyright 2018-2023 Elyra Authors
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

import { ScriptEditor } from '@elyra/script-editor';
import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Debugger, IDebugger } from '@jupyterlab/debugger';
import { IEditorTracker } from '@jupyterlab/fileeditor';
import { KernelManager, Session, SessionManager } from '@jupyterlab/services';
import { Widget } from '@lumino/widgets';

/**
 * Debugger plugin.
 * Adapted from JupyterLab debugger extension.
 * A plugin that provides visual debugging support for script editors.
 */
const scriptEditorDebuggerExtension: JupyterFrontEndPlugin<void> = {
  id: 'elyra-script-debugger',
  autoStart: true,
  requires: [IDebugger, IEditorTracker],
  optional: [ILabShell],
  activate: (
    app: JupyterFrontEnd,
    debug: IDebugger,
    editorTracker: IEditorTracker,
    labShell: ILabShell | null
  ) => {
    console.log('Elyra - script-debugger extension is activated!');

    const handler = new Debugger.Handler({
      type: 'file',
      shell: app.shell,
      service: debug
    });

    const activeSessions: { [id: string]: Session.ISessionConnection } = {};
    const kernelManager = new KernelManager();
    const sessionManager = new SessionManager({
      kernelManager: kernelManager
    });

    const updateDebugger = async (widget: ScriptEditor): Promise<void> => {
      const widgetInFocus = app.shell.currentWidget;
      if (widget !== widgetInFocus) {
        return;
      }

      const kernelSelection = (widget as ScriptEditor).kernelSelection;

      const sessions = app.serviceManager.sessions;
      try {
        const path = widget.context.path;
        let sessionModel = await sessions.findByPath(path);
        if (!sessionModel) {
          // Start a kernel session for the selected kernel supporting debug
          const sessionConnection = await startSession(kernelSelection, path);
          sessionModel = await sessions.findByPath(path);
          if (sessionConnection && sessionModel) {
            activeSessions[sessionModel.id] = sessionConnection;
          }
        }
        if (sessionModel) {
          let sessionConnection: Session.ISessionConnection | null =
            activeSessions[sessionModel.id];
          if (!sessionConnection) {
            // Use `connectTo` only if the session does not exist.
            // `connectTo` sends a kernel_info_request on the shell
            // channel, which blocks the debug session restore when waiting
            // for the kernel to be ready
            sessionConnection = sessions.connectTo({ model: sessionModel });
            activeSessions[sessionModel.id] = sessionConnection;
          }

          await updateKernel(sessionConnection, kernelSelection);

          // Temporary solution to give enough time for the handler to update the UI on page reload.
          setTimeout(async () => {
            await handler.update(widget, sessionConnection);
            app.commands.notifyCommandChanged();
          }, 500);
        }
      } catch (error) {
        console.warn(
          'Exception: session connection = ' + JSON.stringify(error)
        );
      }
    };

    // Use a weakmap to track the callback function used by signal listeners
    // The object is cleared by garbabe collector when no longer in use avoiding memory leaks
    // Key: ScriptEditor widget
    // Value: instance of updateDebugger function
    const callbackControl = new WeakMap<ScriptEditor, () => Promise<void>>();

    const update = async (widget: Widget | null): Promise<void> => {
      if (widget instanceof ScriptEditor) {
        let callbackFn = callbackControl.get(widget);
        if (!callbackFn) {
          callbackFn = (): Promise<void> => updateDebugger(widget);
          callbackControl.set(widget, callbackFn);
        }
        updateDebugger(widget);

        // Listen to possible kernel selection changes
        widget.kernelSelectionChanged.disconnect(callbackFn);
        widget.kernelSelectionChanged.connect(callbackFn);
      }
    };

    if (labShell) {
      // Listen to main area's current focus changes.
      labShell.currentChanged.connect((_, widget) => {
        return update(widget.newValue);
      });
    }

    if (editorTracker) {
      // Listen to script editor's current instance changes.
      editorTracker.currentChanged.connect((_, widget) => {
        return update(widget);
      });
    }

    const startSession = async (
      kernelSelection: string,
      path: string
    ): Promise<Session.ISessionConnection | null> => {
      const options: Session.ISessionOptions = {
        kernel: {
          name: kernelSelection
        },
        path: path,
        type: 'file',
        name: path
      };
      let sessionConnection = null;
      try {
        if (kernelSelection) {
          sessionConnection = await sessionManager.startNew(options);
          sessionConnection.setPath(path);
          console.log(`Kernel session started for ${kernelSelection} kernel`);
        }
      } catch (error) {
        console.warn('Exception: start session = ' + JSON.stringify(error));
      }
      return sessionConnection;
    };

    const updateKernel = async (
      sessionConnection: Session.ISessionConnection,
      kernelSelection: string
    ): Promise<void> => {
      try {
        const prev = sessionConnection.kernel?.name;
        if (kernelSelection && prev !== kernelSelection) {
          await sessionConnection.changeKernel({ name: kernelSelection });
          console.log(`Kernel change from ${prev} to ${kernelSelection}`);
        }
      } catch (error) {
        console.warn('Exception: change kernel = ' + JSON.stringify(error));
      }
    };
  }
};

export default scriptEditorDebuggerExtension;
