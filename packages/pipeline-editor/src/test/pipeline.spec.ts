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
import { TextModelFactory, DocumentRegistry } from '@jupyterlab/docregistry';
import {
  FileBrowser,
  IFileBrowserFactory,
  FilterFileBrowserModel
} from '@jupyterlab/filebrowser';
import { ServiceManager } from '@jupyterlab/services';

import { CommandRegistry } from '@lumino/commands';

import { PipelineEditorFactory } from '../PipelineEditorWidget';

const PIPELINE_FACTORY = 'Pipeline Editor';
const PIPELINE = 'pipeline';

describe('@elyra/pipeline-editor', () => {
  describe('PipelineEditorFactory', () => {
    it('should create a PipelineEditorFactory', () => {
      const tracker = new WidgetTracker<FileBrowser>({
        namespace: 'filebrowser'
      });
      const registry = new DocumentRegistry({
        textModelFactory: new TextModelFactory()
      });
      const opener: DocumentManager.IWidgetOpener = {
        open: widget => {
          // no-op
        }
      };
      const services = new ServiceManager();
      const manager = new DocumentManager({
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
      const pipelineEditorFactory = new PipelineEditorFactory({
        name: PIPELINE_FACTORY,
        fileTypes: [PIPELINE],
        defaultFor: [PIPELINE],
        shell: new LabShell(),
        commands: new CommandRegistry(),
        browserFactory: browserFactory
      });
      expect(pipelineEditorFactory).toBeInstanceOf(PipelineEditorFactory);
    });
  });
});
