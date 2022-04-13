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

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import { textEditorIcon } from '@jupyterlab/ui-components';
import { toArray } from '@lumino/algorithm';

import { CodeViewerWidget } from './CodeViewerWidget';

const ELYRA_CODE_VIEWER_NAMESPACE = 'elyra-code-viewer-extension';

/**
 * The command IDs used by the code-viewer plugin.
 */
const CommandIDs = {
  openViewer: 'elyra-code-viewer:open'
};

/**
 * Initialization data for the code-viewer extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: ELYRA_CODE_VIEWER_NAMESPACE,
  autoStart: true,
  requires: [IEditorServices],
  activate: (app: JupyterFrontEnd, editorServices: IEditorServices) => {
    console.log('Elyra - code-viewer extension is activated!');

    const openCodeViewer = (args: {
      content: string;
      label?: string;
      mimeType?: string;
      extension?: string;
    }): void => {
      const func = editorServices.factoryService.newDocumentEditor;
      const factory: CodeEditor.Factory = options => {
        return func(options);
      };

      // Derive mimetype from extension
      let mimetype = args.mimeType;
      if (!mimetype && args.extension) {
        mimetype = editorServices.mimeTypeService.getMimeTypeByFilePath(
          `temp.${args.extension.replace(/\\.$/, '')}`
        );
      }

      const widget = new CodeViewerWidget({
        factory,
        content: args.content,
        mimeType: mimetype
      });
      widget.title.label = args.label || 'Code Viewer';
      widget.title.caption = widget.title.label;

      // Get the fileType based on the mimetype to determine the icon
      const fileType = toArray(app.docRegistry.fileTypes()).find(fileType => {
        return mimetype ? fileType.mimeTypes.includes(mimetype) : undefined;
      });
      widget.title.icon = fileType?.icon ?? textEditorIcon;

      const main = new MainAreaWidget({ content: widget });
      app.shell.add(main, 'main');
    };

    app.commands.addCommand(CommandIDs.openViewer, {
      execute: (args: any) => {
        openCodeViewer(args);
      }
    });
  }
};

export default extension;
