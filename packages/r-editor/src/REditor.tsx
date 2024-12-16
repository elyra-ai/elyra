/*
 * Copyright 2018-2023 Elyra Authors
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

import { DocumentRegistry, DocumentWidget } from '@jupyterlab/docregistry';
import { FileEditor } from '@jupyterlab/fileeditor';

export class REditor extends ScriptEditor {
  /**
   * Construct a new R Editor widget.
   */
  constructor(
    options: DocumentWidget.IOptions<FileEditor, DocumentRegistry.ICodeModel>
  ) {
    super(options);
  }
  getLanguage(): string {
    return 'R';
  }

  getIcon(): string {
    return 'rIcon';
  }
}
