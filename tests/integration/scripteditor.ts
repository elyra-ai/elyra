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
describe('Script Editor tests', () => {
  before(() => {
    cy.openJupyterLab();
  });

  after(() => {
    // go back to file browser and delete file created for testing
    cy.get('.lm-TabBar-tab[data-id="filebrowser"]').click();
    cy.deleteFileByName('untitled.py');

    // Delete runtime configuration used for testing
    cy.exec('elyra-metadata remove runtimes --name=test_runtime', {
      failOnNonZeroExit: false
    });
  });

  it('opens blank python from launcher', () => {
    cy.get('[title="Create a new Python file"][tabindex="100"]').click();
    cy.get('.lm-TabBar-tab[data-type="document-title"]');
  });

  it('close python editor', () => {
    cy.get('.lm-TabBar-tabCloseIcon:visible').click();
    cy.deleteFileByName('untitled.py');
  });

  it('opens blank python from new menu', () => {
    cy.get(':nth-child(1) > .lm-MenuBar-itemLabel').click();
    cy.get(
      ':nth-child(2) > .lm-Menu-itemSubmenuIcon > svg > .jp-icon3 > path'
    ).click();
    cy.get(
      '[data-command="script-editor:create-new-python-file"] > .lm-Menu-itemLabel'
    ).click();
  });

  it('check toolbar and its content', () => {
    checkToolbarContent();
  });

  it('check kernel dropdown has python option', () => {
    cy.get('.elyra-ScriptEditor .jp-Toolbar select > option[value*=python]');
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
    // Click Submit Script button
    cy.contains('Submit Script').click();
    // Check for expected dialog title
    cy.get('.jp-Dialog-header').should('have.text', 'Submit script');
    // Dismiss  dialog
    cy.get('button.jp-mod-reject').click();
  });
});

// ------------------------------
// ----- Utility Functions
// ------------------------------

const checkToolbarContent = (): void => {
  cy.get('.elyra-ScriptEditor .jp-Toolbar');

  // check save button exists and icon
  cy.get('button[title="Save file contents"]');
  cy.get('svg[data-icon="ui-components:save"]');

  // check run button exists and icon
  cy.get('button[title="Run"]');
  cy.get('svg[data-icon="ui-components:run"]');

  // check stop button exists and icon
  cy.get('button[title="Stop"]');
  cy.get('svg[data-icon="ui-components:stop"]');

  // check select kernel dropdown exists
  cy.get('.elyra-ScriptEditor .jp-Toolbar select');

  // check Submit Script button exists
  cy.contains('Submit Script');
};
