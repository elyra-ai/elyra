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
describe('Submit Notebook Button tests', () => {
  beforeEach(() => {
    cy.deleteFile('*.ipynb');

    cy.bootstrapFile('helloworld.ipynb');

    cy.resetJupyterLab();
  });

  afterEach(() => {
    cy.deleteFile('*.ipynb');

    // Delete runtime configuration used for testing
    cy.exec('elyra-metadata remove runtimes --name=kfp_test_runtime', {
      failOnNonZeroExit: false
    });
  });

  it('check Submit Notebook button exists', () => {
    cy.openFile('helloworld.ipynb');
    cy.findByText(/run as pipeline/i).should('exist');
  });

  it('click the "Run as Pipeline" button should display dialog', () => {
    // Install runtime configuration
    cy.installRuntimeConfig({ type: 'kfp' });

    cy.findByRole('tab', { name: /file browser/i }).click();

    openNewNotebookFile();

    // Click submit notebook button
    cy.findByText(/run as pipeline/i).click();

    cy.findByRole('button', { name: /save and submit/i }).click();

    cy.findByText(/run file as pipeline/i).should('exist');

    // Dismiss  dialog
    cy.findByRole('button', { name: /cancel/i }).click();
  });
});

// ------------------------------
// ----- Utility Functions
// ------------------------------

const openNewNotebookFile = (): void => {
  cy.get(
    '.jp-LauncherCard[data-category="Notebook"][title*="Python 3"]:visible'
  )
    .first()
    .click();
  cy.wait(500);
};
