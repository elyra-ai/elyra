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
import { IEditorServices, CodeEditor } from '@jupyterlab/codeeditor';

import { MetadataEditor, FormItem } from './MetadataEditor';

export const METADATA_EDITOR_ID = 'elyra-metadata-editor';

/**
 * Initialization data for the metadata-editor-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: METADATA_EDITOR_ID,
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
      name: (metadataEditor: MetadataEditor) => {
        return metadataEditor.id;
      },
      command: `${METADATA_EDITOR_ID}:open`,
      args: (widget: MetadataEditor) => ({
        metadata: widget.metadata,
        newFile: widget.newFile,
        namespace: widget.namespace,
        updateSignal: widget.updateSignal,
        fileName: widget.fileName
      })
    });
    const openMetadataEditor = async (args: {
      metadata: FormItem[];
      newFile: boolean;
      namespace: string;
      updateSignal: any;
      fileName: string;
      editor: CodeEditor.IEditor;
    }): Promise<void> => {
      const metadataEditorWidget = new MetadataEditor(
        args.metadata,
        args.newFile,
        args.updateSignal,
        editorServices.factoryService.newInlineEditor,
        args.namespace,
        editorTracker,
        args.fileName
      );
      // Make sure there aren't any other "Untitled" tabs open
      if (args.newFile) {
        metadataEditorWidget.title.label = 'Untitled';
        let untitledId = 1;
        while (
          editorTracker.find((widget: MetadataEditor): boolean => {
            return widget.title.label == metadataEditorWidget.title.label;
          })
        ) {
          metadataEditorWidget.title.label = `Untitled${untitledId}`;
          untitledId++;
        }
      } else {
        metadataEditorWidget.title.label = args.metadata.find(
          (item: FormItem) => {
            return item.label == 'Name';
          }
        ).value;
      }
      metadataEditorWidget.id = `${METADATA_EDITOR_ID}:${metadataEditorWidget.title.label}`;
      metadataEditorWidget.title.closable = true;
      metadataEditorWidget.title.icon = codeSnippetIcon;
      const filterWidget = (widget: MetadataEditor): boolean => {
        return widget.id == metadataEditorWidget.id;
      };
      const openWidget = editorTracker.find(filterWidget);
      if (args.newFile || !openWidget) {
        app.shell.add(metadataEditorWidget, 'main');
        editorTracker.add(metadataEditorWidget);
      } else if (openWidget) {
        app.shell.activateById(openWidget.id);
      }
    };
  }
};

export default extension;
