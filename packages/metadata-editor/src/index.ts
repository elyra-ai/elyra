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
import { IThemeManager } from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { textEditorIcon } from '@jupyterlab/ui-components';

import { find } from '@lumino/algorithm';
import { Widget } from '@lumino/widgets';

import { MetadataEditor } from './MetadataEditor';

const BP_DARK_THEME_CLASS = 'bp3-dark';
const METADATA_EDITOR_ID = 'elyra-metadata-editor';

/**
 * Initialization data for the metadata-editor-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: METADATA_EDITOR_ID,
  autoStart: true,
  requires: [IEditorServices],
  optional: [IThemeManager],
  activate: (
    app: JupyterFrontEnd,
    editorServices: IEditorServices,
    themeManager: IThemeManager | null
  ) => {
    console.log('Elyra - metadata-editor extension is activated!');

    const openMetadataEditor = (args: {
      schema: string;
      namespace: string;
      name?: string;
      onSave: () => void;
    }): void => {
      let widgetLabel: string;
      if (args.name) {
        widgetLabel = args.name;
      } else {
        widgetLabel = `new:${args.schema}`;
      }
      const widgetId = `${METADATA_EDITOR_ID}:${args.namespace}:${args.schema}:${args.name}`;
      const openWidget = find(
        app.shell.widgets('main'),
        (widget: Widget, index: number) => {
          return widget.id == widgetId;
        }
      );
      if (openWidget) {
        console.log(openWidget);
        app.shell.activateById(widgetId);
        return;
      }

      const metadataEditorWidget = new MetadataEditor({
        ...args,
        editorServices
      });
      metadataEditorWidget.title.label = widgetLabel;
      metadataEditorWidget.id = widgetId;
      metadataEditorWidget.title.closable = true;
      metadataEditorWidget.title.icon = textEditorIcon;
      metadataEditorWidget.addClass(METADATA_EDITOR_ID);
      app.shell.add(metadataEditorWidget, 'main');

      updateTheme();
    };

    app.commands.addCommand(`${METADATA_EDITOR_ID}:open`, {
      execute: (args: any) => {
        openMetadataEditor(args);
      }
    });

    const updateTheme = (): void => {
      const isLight =
        themeManager.theme && themeManager.isLight(themeManager.theme);
      document
        .querySelectorAll(`.${METADATA_EDITOR_ID}`)
        .forEach((element: any) => {
          if (isLight) {
            element.className = element.className
              .replace(new RegExp(`${BP_DARK_THEME_CLASS}`, 'gi'), '')
              .trim();
          } else {
            element.className += ` ${BP_DARK_THEME_CLASS}`;
          }
        });
    };
    if (themeManager) {
      themeManager.themeChanged.connect(updateTheme);
    }
  }
};

export default extension;
