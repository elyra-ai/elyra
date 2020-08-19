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
import 'jest';

import { LabShell } from '@jupyterlab/application';
import { WidgetTracker } from '@jupyterlab/apputils';
import { DocumentManager } from '@jupyterlab/docmanager';
import {
  TextModelFactory,
  DocumentRegistry,
  Context,
  DocumentWidget
} from '@jupyterlab/docregistry';
import {
  FileBrowser,
  IFileBrowserFactory,
  FilterFileBrowserModel
} from '@jupyterlab/filebrowser';
import { ServiceManager } from '@jupyterlab/services';

import { CommandRegistry } from '@lumino/commands';
import { UUID } from '@lumino/coreutils';
import { mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import * as React from 'react';

import {
  PipelineEditorFactory,
  PipelineEditorWidget,
  PipelineEditor
} from '../PipelineEditorWidget';

const PIPELINE_FACTORY = 'Pipeline Editor';
const PIPELINE = 'pipeline';

configure({ adapter: new Adapter() });

jest.mock('../PipelineService');

describe('@elyra/pipeline-editor', () => {
  let pipelineEditorFactory: PipelineEditorFactory;
  let manager: DocumentManager;
  let textModelFactory: TextModelFactory;
  let services: ServiceManager;
  let pipelineEditorWidget: PipelineEditorWidget;

  describe('PipelineEditorFactory', () => {
    it('should create a PipelineEditorFactory', async () => {
      const tracker = new WidgetTracker<FileBrowser>({
        namespace: 'filebrowser'
      });
      textModelFactory = new TextModelFactory();
      const registry = new DocumentRegistry({
        textModelFactory
      });
      const opener: DocumentManager.IWidgetOpener = {
        open: widget => {
          // no-op
        }
      };
      services = new ServiceManager();
      await services.ready;
      manager = new DocumentManager({
        registry,
        opener,
        manager: services
      });
      const createFileBrowser = (
        id: string,
        options: IFileBrowserFactory.IOptions = {}
      ): FileBrowser => {
        const model = new FilterFileBrowserModel({
          auto: options.auto ?? true,
          manager: manager,
          driveName: options.driveName || '',
          refreshInterval: options.refreshInterval,
          state: options.state === null ? undefined : options.state || undefined
        });
        const restore = options.restore;
        const widget = new FileBrowser({ id, model, restore });

        // Track the newly created file browser.
        void tracker.add(widget);

        return widget;
      };

      // Manually restore and load the default file browser.
      const defaultBrowser = createFileBrowser('filebrowser', {
        auto: false,
        restore: false
      });

      const browserFactory = { createFileBrowser, defaultBrowser, tracker };
      const commands = new CommandRegistry();
      pipelineEditorFactory = new PipelineEditorFactory({
        name: PIPELINE_FACTORY,
        fileTypes: [PIPELINE],
        defaultFor: [PIPELINE],
        shell: new LabShell(),
        commands: commands,
        browserFactory: browserFactory,
        serviceManager: services
      });
      expect(pipelineEditorFactory).toBeInstanceOf(PipelineEditorFactory);
    });

    it('should create a PipelineEditorWidget', async () => {
      const context = new Context({
        manager: services,
        factory: textModelFactory,
        path: UUID.uuid4() + '.pipeline'
      });
      const documentWidget = pipelineEditorFactory.createNew(context);
      expect(documentWidget).toBeInstanceOf(DocumentWidget);
      expect(documentWidget.content).toBeInstanceOf(PipelineEditorWidget);
      pipelineEditorWidget = documentWidget.content as PipelineEditorWidget;
    });
  });

  describe('PipelineEditor', () => {
    it('should create a PipelineEditor', () => {
      const pipelineEditor = mount(
        <PipelineEditor
          shell={pipelineEditorWidget.shell}
          commands={pipelineEditorWidget.commands}
          browserFactory={pipelineEditorWidget.browserFactory}
          widgetContext={pipelineEditorWidget.context}
          widgetId={pipelineEditorWidget.id}
          serviceManager={pipelineEditorWidget.serviceManager}
          addFileToPipelineSignal={pipelineEditorWidget.addFileToPipelineSignal}
        />
      );
      expect(pipelineEditor.state()).toEqual({
        showPropertiesDialog: false,
        propertiesInfo: {},
        showValidationError: false,
        validationError: { errorMessage: '', errorSeverity: 'error' },
        emptyPipeline: true
      });
    });
  });
});
