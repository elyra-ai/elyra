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
import { DocumentWidget } from '@jupyterlab/docregistry';
import { IEditorTracker } from '@jupyterlab/fileeditor';
// import { Session } from '@jupyterlab/services';

/**
 * Debugger plugin.
 * Adapted from JupyterLab debugger extension.
 * A plugin that provides visual debugging support for script editors.
 */
const scriptEditorDebuggerExtension: JupyterFrontEndPlugin<void> = {
  id: 'elyra-script-editor-debugger',
  autoStart: true,
  requires: [IDebugger, IEditorTracker],
  optional: [ILabShell],
  activate: (
    app: JupyterFrontEnd,
    debug: IDebugger,
    editorTracker: IEditorTracker,
    labShell: ILabShell | null
  ) => {
    console.log('***Elyra - script-editor-debugger extension is activated!***');
    const handler = new Debugger.Handler({
      type: 'file',
      shell: app.shell,
      service: debug
    });

    //   const activeSessions: {
    //     [id: string]: Session.ISessionConnection;
    //   } = {};

    const updateHandlerAndCommands = async (
      widget: DocumentWidget
    ): Promise<void> => {
      // TODO: get kernel selection from widget
      const scriptEditorWidget = widget as ScriptEditor;
      const kernelSelection = scriptEditorWidget.getKernelSelection();
      console.log('kernelSelection: ' + kernelSelection);

      // TODO: start a kernel session
      const session = null;
      await handler.update(widget, session);
      app.commands.notifyCommandChanged();

      // const sessions = app.serviceManager.sessions;
      // try {
      //   const model = await sessions.findByPath(widget.context.path);
      //   if (!model) {
      //     return;
      //   }
      //   let session = activeSessions[model.id];
      //   if (!session) {
      //     // Use `connectTo` only if the session does not exist.
      //     // `connectTo` sends a kernel_info_request on the shell
      //     // channel, which blocks the debug session restore when waiting
      //     // for the kernel to be ready
      //     session = sessions.connectTo({ model });
      //     activeSessions[model.id] = session;
      //   }
      //   await handler.update(widget, session);
      //   app.commands.notifyCommandChanged();
      // } catch {
      //   return;
      // }
    };

    if (labShell) {
      labShell.currentChanged.connect((_, update) => {
        const widget = update.newValue;
        if (widget instanceof DocumentWidget) {
          const { content } = widget;
          if (content instanceof ScriptEditor) {
            void updateHandlerAndCommands(widget);
          }
        }
      });
    } else {
      editorTracker.currentChanged.connect((_, documentWidget) => {
        if (documentWidget) {
          void updateHandlerAndCommands(
            (documentWidget as unknown) as DocumentWidget
          );
        }
      });
    }
  }
};

export default scriptEditorDebuggerExtension;
