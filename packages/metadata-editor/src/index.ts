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

import { codeSnippetIcon } from '@elyra/ui-components';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import { WidgetTracker } from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';

import { MetadataEditor } from './MetadataEditor';

const METADATA_EDITOR_NAMESPACE = 'elyra-metadata-editor-extension';
export const METADATA_EDITOR_ID = 'elyra-metadata-editor';

/**
 * Initialization data for the metadata-editor-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: METADATA_EDITOR_NAMESPACE,
  autoStart: true,
  requires: [IEditorServices],
  optional: [ILayoutRestorer],
  activate: (
    app: JupyterFrontEnd,
    editorServices: IEditorServices,
    restorer: ILayoutRestorer
  ) => {
    console.log('Elyra - metadata-editor extension is activated!');

    app.commands.addCommand(`${METADATA_EDITOR_ID}:open`, {
      execute: (args: any) => {
        openMetadataEditor(args);
      }
    });
    const editorTracker = new WidgetTracker<MetadataEditor>({
      namespace: METADATA_EDITOR_ID
    });
    restorer.restore(editorTracker, {
      name: (metadataEditor: any) => {
        return metadataEditor.metadata.name;
      },
      command: `${METADATA_EDITOR_ID}:open`,
      args: (widget: MetadataEditor) => ({
        name: widget.metadata.name,
        displayName: widget.metadata.displayName,
        description: widget.metadata.description,
        language: widget.metadata.language,
        code: widget.metadata.code,
        newFile: widget.newFile,
        endpoint: widget.endpoint
      })
    });
    const openMetadataEditor = async (args: {
      metadata: {
        name: string;
        displayName: string;
        description: string;
        language: string;
        code: string;
      };
      newFile: boolean;
      endpoint: string;
      updateSignal: () => void;
    }): Promise<void> => {
      const metadataEditorWidget = new MetadataEditor(
        args.metadata,
        args.newFile,
        args.updateSignal,
        editorServices.factoryService.newInlineEditor,
        args.endpoint
      );
      metadataEditorWidget.id = METADATA_EDITOR_ID;
      if (args.newFile) {
        metadataEditorWidget.title.label = 'New Snippet';
      } else {
        metadataEditorWidget.title.label = `[${args.metadata.language}] ${args.metadata.displayName}`;
      }
      metadataEditorWidget.title.closable = true;
      metadataEditorWidget.title.icon = codeSnippetIcon;
      const filterWidget = (widget: MetadataEditor): boolean => {
        return widget.metadata.name == args.metadata.name;
      };
      const openWidget = editorTracker.find(filterWidget);
      if (args.metadata.name == '' || !openWidget) {
        app.shell.add(metadataEditorWidget, 'main');
        editorTracker.add(metadataEditorWidget);
      }
    };
  }
};

export default extension;
