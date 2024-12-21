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

import { Dialog } from '@jupyterlab/apputils';
import React from 'react';

export const unknownError = (message: string): any => ({
  title: 'Load pipeline failed!',
  body: message,
  buttons: [Dialog.okButton()],
});

export const elyraOutOfDate = {
  title: 'Load pipeline failed!',
  body: `This pipeline corresponds to a more recent version of Elyra and cannot be used until Elyra has been upgraded.`,
  buttons: [Dialog.okButton()],
};

export const unsupportedVersion = {
  title: 'Load pipeline failed!',
  body: 'This pipeline has an unrecognizable version.',
  buttons: [Dialog.okButton()],
};

export const pipelineOutOfDate = {
  title: 'Migrate pipeline?',
  body: (
    <p>
      This pipeline corresponds to an older version of Elyra and needs to be
      migrated.
      <br />
      Although the pipeline can be further edited and/or submitted after its
      update,
      <br />
      the migration will not be completed until the pipeline has been saved
      within the editor.
      <br />
      <br />
      Proceed with migration?
    </p>
  ),
  buttons: [Dialog.cancelButton(), Dialog.okButton()],
};

export const unsupportedFile = {
  title: 'Unsupported File(s)',
  body: 'Only supported files have been added to the pipeline.',
  buttons: [Dialog.okButton()],
};

export const clearPipeline = {
  title: 'Clear Pipeline',
  body: 'Are you sure you want to clear the pipeline?',
  buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Clear' })],
};
