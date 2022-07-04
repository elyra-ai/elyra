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
      const kernelSelection = (widget as ScriptEditor).kernelSelection;

      const debuggerAvailable = await widget.isDebuggerAvailable(
        kernelSelection
      );
      console.log(
        '#####updateDebugger debuggerAvailable=' + !!debuggerAvailable
      );
      if (!debuggerAvailable) {
        return;
      }

      const sessions = app.serviceManager.sessions;
      try {
        const path = widget.context.path;
        let sessionModel = await sessions.findByPath(path);

        console.log('#####updateDebugger sessionModel=' + !!sessionModel);
        if (!sessionModel) {
          // Start a kernel session for the selected kernel supporting debug
          try {
            const sessionConnection = await startSession(kernelSelection, path);
            sessionModel = await sessions.findByPath(path);

            if (!sessionModel) {
              // TODO throw error bla bla bla
              throw new Error(
                'ERROR: session model not found even after started'
              );
            }

            activeSessions[sessionModel.id] = sessionConnection;
            console.log(
              `Kernel session started for ${path} file with selected ${kernelSelection} kernel.`
            );
          } catch (e) {
            console.warn(
              `Could not start session for ${kernelSelection} kernel to debug ${path} script`
            );
          }
        }

        if (sessionModel) {
          let sessionConnection: Session.ISessionConnection | null =
            activeSessions[sessionModel.id];
          console.log(
            '#####updateDebugger sessionConnection=' + !!sessionConnection
          );
          if (!sessionConnection) {
            // Use `connectTo` only if the session does not exist.
            // `connectTo` sends a kernel_info_request on the shell
            // channel, which blocks the debug session restore when waiting
            // for the kernel to be ready
            sessionConnection = sessions.connectTo({ model: sessionModel });
            activeSessions[sessionModel.id] = sessionConnection;
          }

          console.log(
            '#####updateDebugger updating debugger handler sessionConnection=' +
              !!sessionConnection
          );
          await handler.update(widget, sessionConnection);
          app.commands.notifyCommandChanged();
        }
      } catch (ex) {
        // TODO
        console.log('#####updateDebugger exception=' + ex);
      }
    };

    // Use a weakmap to track the callback function used by signal listeners so that the object can be cleared by gargabe collector when no longer in use, avoiding memory leaks
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

        // listen to possible kernel selection changes
        widget.kernelSelectionChanged.disconnect(callbackFn);
        widget.kernelSelectionChanged.connect(callbackFn);
      }
    };

    if (labShell) {
      // listen to main area's current focus changes.
      labShell.currentChanged.connect((_, widget) => {
        console.log(
          'labShell.currentChanged####### old=' +
            widget.oldValue?.constructor.name +
            ' new=' +
            widget.newValue?.constructor.name
        );
        return update(widget.newValue);
      });
    }

    // if (editorTracker){
    //   // listen to script editor's current instance changes
    //   editorTracker.currentChanged.connect((_, widget) => { console.log('editorTracker.currentChanged#######'); return update(widget); });
    //   // listen to script editor's widget updates
    //   editorTracker.widgetUpdated.connect((_, widget) => { console.log('editorTracker.widgetUpdated#######'); return update(widget); });
    // }

    const startSession = async (
      kernelSelection: string,
      path: string
    ): Promise<Session.ISessionConnection> => {
      const options: Session.ISessionOptions = {
        kernel: {
          name: kernelSelection
        },
        path: path,
        type: 'file',
        name: path
      };
      const sessionConnection = await sessionManager.startNew(options);
      sessionConnection.setPath(path);

      return sessionConnection;
    };
  }
};

export default scriptEditorDebuggerExtension;
