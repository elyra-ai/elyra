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
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { Debugger, IDebugger } from '@jupyterlab/debugger';
import { DocumentWidget } from '@jupyterlab/docregistry';
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

    const updateHandlerAndCommands = async (
      widget: ScriptEditor
    ): Promise<void> => {
      const kernelSelection = widget.getKernelSelection();
      const sessions = app.serviceManager.sessions;
      try {
        const model: Session.IModel | undefined = await sessions.findByPath(
          widget.context.path
        );
        console.log('model:\n' + model);
        if (model) {
          sessionConnection = activeSessions[model.id];
          if (!sessionConnection) {
            // Use `connectTo` only if the session does not exist.
            // `connectTo` sends a kernel_info_request on the shell
            // channel, which blocks the debug session restore when waiting
            // for the kernel to be ready
            sessionConnection = sessions.connectTo({ model });
            activeSessions[model.id] = sessionConnection;
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
            console.log(
              'Starting kernel session for ' + kernelSelection + '...'
            );
            sessionConnection = await startSession(
              kernelSelection,
              widget.context.path
            );
            console.log('Kernel session started for ' + kernelSelection);
          } catch (e) {
            showDialog({
              title: 'Error',
              body: 'Could not start session to debug script',
              buttons: [Dialog.okButton()]
            });
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
        if (
          widget instanceof DocumentWidget &&
          widget instanceof ScriptEditor
        ) {
          // TODO: This is not triggered when kernel dropdown is changed, only when the editor becomes the widget in focus
          void updateHandlerAndCommands(widget);
        }
      });
    } else {
      editorTracker.currentChanged.connect((_, widget) => {
        if (widget) {
          (widget as unknown) as DocumentWidget;
        }
      });
    }

    const startSession = async (
      kernelName: string,
      contextPath: string
    ): Promise<Session.ISessionConnection> => {
      const options: Session.ISessionOptions = {
        kernel: {
          name: kernelName
        },
        path: contextPath,
        type: 'file',
        name: contextPath
      };
      sessionConnection = await sessionManager.startNew(options);
      sessionConnection.setPath(contextPath);
      return sessionConnection;
    };
  }
};

export default scriptEditorDebuggerExtension;
