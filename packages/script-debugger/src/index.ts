/*
 * Copyright 2018-2022 Elyra Authors
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
    let sessionConnection: Session.ISessionConnection | null = null;

    const updateDebugger = async (widget: ScriptEditor): Promise<void> => {
      const kernelSelection = widget.getKernelSelection();

      const sessions = app.serviceManager.sessions;
      try {
        const path = widget.context.path;
        const sessionModel:
          | Session.IModel
          | undefined = await sessions.findByPath(path);

        if (sessionModel) {
          sessionConnection = activeSessions[sessionModel.id];
          if (!sessionConnection) {
            // Use `connectTo` only if the session does not exist.
            // `connectTo` sends a kernel_info_request on the shell
            // channel, which blocks the debug session restore when waiting
            // for the kernel to be ready
            sessionConnection = sessions.connectTo({ model: sessionModel });
            activeSessions[sessionModel.id] = sessionConnection;
          }
          await handler.update(widget, sessionConnection);
          app.commands.notifyCommandChanged();
        } else {
          const debuggerAvailable = await widget.isDebuggerAvailable(
            kernelSelection
          );
          if (!debuggerAvailable) {
            return;
          }
          // Start a kernel session for the selected kernel supporting debug
          try {
            await startSession(kernelSelection, path);
            console.log('Kernel session started for ' + kernelSelection);
          } catch (e) {
            console.warn(
              `Could not start session for ${kernelSelection} kernel to debug ${path} script`
            );
          }
        }
        await handler.update(widget, sessionConnection);
        app.commands.notifyCommandChanged();
      } catch {
        return;
      }
    };

    if (labShell) {
      labShell.currentChanged.connect((_, update) => {
        const widget = update.newValue;
        if (widget instanceof ScriptEditor) {
          void updateDebugger(widget);
        }
      });
    }

    editorTracker.currentChanged.connect((_, widget) => {
      if (widget instanceof ScriptEditor) {
        // TODO: add listener to kernel selection changes
        updateDebugger(widget as ScriptEditor);
      }
    });

    const startSession = async (
      kernelSelection: string,
      path: string
    ): Promise<void> => {
      const options: Session.ISessionOptions = {
        kernel: {
          name: kernelSelection
        },
        path: path,
        type: 'file',
        name: path
      };
      sessionConnection = await sessionManager.startNew(options);
      sessionConnection.setPath(path);
    };
  }
};

export default scriptEditorDebuggerExtension;
