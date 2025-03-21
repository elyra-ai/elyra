/*
 * Copyright 2018-2025 Elyra Authors
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

import { MetadataWidget, MetadataEditorWidget } from '@elyra/metadata-common';
import { MetadataService } from '@elyra/services';

import {
  RequestErrors,
  PasswordField,
  CodeBlock,
  TagsField,
  DropDown,
  IErrorResponse
} from '@elyra/ui-components';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabStatus
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { ITranslator } from '@jupyterlab/translation';
import {
  textEditorIcon,
  LabIcon,
  IFormRendererRegistry
} from '@jupyterlab/ui-components';

import { find } from '@lumino/algorithm';
import { Widget } from '@lumino/widgets';

const METADATA_EDITOR_ID = 'elyra-metadata-editor';
const METADATA_WIDGET_ID = 'elyra-metadata';
const METADATA_EXTENSION_ID = '@elyra/metadata-extension';

const commandIDs = {
  openMetadata: 'elyra-metadata:open',
  closeTabCommand: 'elyra-metadata:close'
};

interface IOpenMetadataWidgetArgs {
  display_name: string;
  schemaspace: string;
  icon: string;
  addLabel?: string;
}

interface IOpenMetadataEditorArgs {
  schema: string;
  schemaspace: string;
  name?: string;
  onSave: () => void;
  titleContext?: string;
}

/**
 * Initialization data for the metadata-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: METADATA_WIDGET_ID,
  autoStart: true,
  requires: [
    ICommandPalette,
    IEditorServices,
    ILabStatus,
    IFormRendererRegistry,
    ITranslator
  ],
  activate: async (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    editorServices: IEditorServices,
    status: ILabStatus,
    componentRegistry: IFormRendererRegistry,
    translator: ITranslator
  ) => {
    console.log('Elyra - metadata extension is activated!');

    componentRegistry.addRenderer(`${METADATA_EXTENSION_ID}:plugin.code`, {
      fieldRenderer: (props) => {
        return CodeBlock(props);
      }
    });
    componentRegistry.addRenderer(`${METADATA_EXTENSION_ID}:plugin.tags`, {
      fieldRenderer: (props) => {
        return TagsField(props);
      }
    });
    componentRegistry.addRenderer(`${METADATA_EXTENSION_ID}:plugin.dropdown`, {
      fieldRenderer: (props) => {
        return DropDown(props);
      }
    });
    componentRegistry.addRenderer(`${METADATA_EXTENSION_ID}:plugin.password`, {
      fieldRenderer: (props) => {
        return PasswordField(props);
      }
    });

    const openMetadataEditor = (args: IOpenMetadataEditorArgs): void => {
      let widgetLabel: string;
      if (args.name) {
        widgetLabel = args.name;
      } else {
        widgetLabel = `New ${args.schema}`;
      }
      const widgetId = `${METADATA_EDITOR_ID}:${args.schemaspace}:${
        args.schema
      }:${args.name ? args.name : 'new'}`;
      const openWidget = find(app.shell.widgets('main'), (widget: Widget) => {
        return widget.id === widgetId;
      });
      if (openWidget) {
        app.shell.activateById(widgetId);
        return;
      }

      const metadataEditorWidget = new MetadataEditorWidget({
        ...args,
        schemaName: args.schema,
        editorServices,
        status,
        translator: translator.load('jupyterlab'),
        componentRegistry
      });
      const main = new MainAreaWidget({ content: metadataEditorWidget });
      main.title.label = widgetLabel;
      main.id = widgetId;
      main.title.closable = true;
      main.title.icon = textEditorIcon;
      metadataEditorWidget.addClass(METADATA_EDITOR_ID);
      app.shell.add(main, 'main');
    };

    app.commands.addCommand(`${METADATA_EDITOR_ID}:open`, {
      label: (args) => {
        return `New ${args.title} ${
          args.appendToTitle ? args.titleContext : ''
        }`;
      },
      execute: (args) => {
        openMetadataEditor(args as unknown as IOpenMetadataEditorArgs);
      }
    });

    const openMetadataWidget = (args: IOpenMetadataWidgetArgs): void => {
      const labIcon = LabIcon.resolve({ icon: args.icon });
      const widgetId = `${METADATA_WIDGET_ID}:${args.schemaspace}`;
      const metadataWidget = new MetadataWidget({
        app,
        display_name: args.display_name,
        schemaspace: args.schemaspace,
        icon: labIcon,
        addLabel: args.addLabel
      });
      metadataWidget.id = widgetId;
      metadataWidget.title.icon = labIcon;
      metadataWidget.title.caption = args.display_name;

      if (
        find(app.shell.widgets('left'), (value) => value.id === widgetId) ===
        undefined
      ) {
        app.shell.add(metadataWidget, 'left', { rank: 1000 });
      }
      app.shell.activateById(widgetId);
    };

    const openMetadataCommand: string = commandIDs.openMetadata;
    app.commands.addCommand(openMetadataCommand, {
      label: (args) => args.label as string,
      execute: (args) => {
        // Rank has been chosen somewhat arbitrarily to give priority
        // to the running sessions widget in the sidebar.
        openMetadataWidget(args as unknown as IOpenMetadataWidgetArgs);
      }
    });

    // Add command to close metadata tab
    const closeTabCommand: string = commandIDs.closeTabCommand;
    app.commands.addCommand(closeTabCommand, {
      label: 'Close Tab',
      execute: (_args) => {
        const contextNode: HTMLElement | undefined = app.contextMenuHitTest(
          (node) => !!node.dataset.id
        );
        if (contextNode) {
          const id = contextNode.dataset['id']!;
          const widget = find(
            app.shell.widgets('left'),
            (widget: Widget, _index: number) => {
              return widget.id === id;
            }
          );
          if (widget) {
            widget.dispose();
          }
        }
      }
    });
    app.contextMenu.addItem({
      selector:
        '[data-id^="elyra-metadata:"]:not([data-id$="code-snippets"]):not([data-id$="runtimes"])',
      command: closeTabCommand
    });

    try {
      const schemas = await MetadataService.getAllSchema();

      if (!schemas) {
        throw new Error('Failed to retrieve metadata schemas');
      }

      for (const schema of schemas) {
        let icon = 'ui-components:text-editor';
        let title = schema.title;
        if (schema.uihints) {
          if (schema.uihints.icon) {
            icon = schema.uihints.icon;
          }
          if (schema.uihints.title) {
            title = schema.uihints.title;
          }
        }
        palette.addItem({
          command: commandIDs.openMetadata,
          args: {
            label: `Manage ${title}`,
            display_name: schema.uihints?.title ?? '',
            schemaspace: schema.schemaspace,
            icon: icon
          },
          category: 'Elyra'
        });
      }
    } catch (error) {
      await RequestErrors.serverError(error as IErrorResponse);
    }
  }
};

export default extension;
