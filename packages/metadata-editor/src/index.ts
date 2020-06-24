/*
 * Copyright 2018-2020 IBM Corporation
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
import { IEditorServices } from '@jupyterlab/codeeditor';
import { textEditorIcon } from '@jupyterlab/ui-components';

import { MetadataEditor, FormItem } from './MetadataEditor';

export const METADATA_EDITOR_ID = 'elyra-metadata-editor';

/**
 * Initialization data for the metadata-editor-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: METADATA_EDITOR_ID,
  autoStart: true,
  requires: [IEditorServices],
  activate: (app: JupyterFrontEnd, editorServices: IEditorServices) => {
    console.log('Elyra - metadata-editor extension is activated!');

    const openMetadataEditor = (args: {
      metadata: FormItem[];
      schema: string;
      namespace: string;
      name?: string;
      onSave: () => void;
    }): void => {
      const metadataEditorWidget = new MetadataEditor({
        ...args,
        editorServices
      });

      if (args.name) {
        metadataEditorWidget.title.label = args.name;
      } else {
        metadataEditorWidget.title.label = 'New Metadata';
      }
      metadataEditorWidget.id = METADATA_EDITOR_ID;
      metadataEditorWidget.title.closable = true;
      metadataEditorWidget.title.icon = textEditorIcon;
      app.shell.add(metadataEditorWidget, 'main');
    };

    app.commands.addCommand(`${METADATA_EDITOR_ID}:open`, {
      execute: (args: any) => {
        openMetadataEditor(args);
      }
    });
  }
};

export default extension;
