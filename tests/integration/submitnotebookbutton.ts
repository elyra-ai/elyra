/*
 * Copyright 2018-2021 Elyra Authors
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
  before(() => {
    cy.openJupyterLab();
  });

  after(() => {
    // go back to file browser and delete file created for testing
    cy.get('.lm-TabBar-tab[data-id="filebrowser"]').click();
    cy.deleteFileByName('Untitled.ipynb');

    // Delete runtime configuration used for testing
    cy.exec('elyra-metadata remove runtimes --name=test_runtime', {
      failOnNonZeroExit: false
    });
  });

  it('check Submit Notebook button exists', () => {
    openNewNotebookFile();
    cy.contains('Submit Notebook');
  });

  it('click the Submit Script button should display dialog', () => {
    // Open runtimes sidebar
    cy.get('.jp-SideBar [title="Runtimes"]').click();
    // Create runtime configuration
    cy.createRuntimeConfig();
    // Validate it is now available
    cy.get('#elyra-metadata span.elyra-expandableContainer-name').contains(
      'Test Runtime'
    );
    // Click submit notebook button
    cy.contains('Submit Notebook').click();
    // Should have warning for unsaved changes
    cy.get('.jp-mod-accept > .jp-Dialog-buttonLabel')
      .contains('Save and Submit')
      .click();
    // Check for expected dialog title
    cy.get('.jp-Dialog')
      .find('div.jp-Dialog-header')
      .should('have.text', 'Submit notebook');
    // Dismiss  dialog
    cy.get('button.jp-mod-reject').click();
  });
});

// ------------------------------
// ----- Utility Functions
// ------------------------------

const openNewNotebookFile = (): void => {
  cy.get(
    '.jp-LauncherCard[data-category="Notebook"][title="Python 3"]:visible'
  ).click();
};
