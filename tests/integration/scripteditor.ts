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
    // delete files created for testing
    cy.deleteFileByName('untitled.py');
    cy.deleteFileByName('untitled.r');

    // Delete runtime configuration used for testing
    cy.exec('elyra-metadata remove runtimes --name=test_runtime', {
      failOnNonZeroExit: false
    });
  });

  // Python Tests
  it('opens blank Python file from launcher', () => {
    cy.get('[title="Create a new Python file"][tabindex="100"]').click();
    cy.get('.lm-TabBar-tab[data-type="document-title"]');
  });

  it('close editor', () => {
    cy.get('.lm-TabBar-tabCloseIcon:visible').click();
    cy.deleteFileByName('untitled.py');
  });

  it('opens blank Python file from menu', () => {
    cy.get(':nth-child(1) > .lm-MenuBar-itemLabel').click();
    cy.get(
      ':nth-child(2) > .lm-Menu-itemSubmenuIcon > svg > .jp-icon3 > path'
    ).click();
    cy.get(
      '[data-command="script-editor:create-new-python-file"] > .lm-Menu-itemLabel'
    ).click();
  });

  it('check toolbar content', () => {
    checkToolbarContent();
  });

  it('check kernel dropdown has Python option', () => {
    cy.get('.elyra-ScriptEditor .jp-Toolbar select > option[value*=python]');
  });

  it('click the Run as Pipeline button should display dialog', () => {
    // Open runtimes sidebar
    cy.get('.jp-SideBar [title="Runtimes"]').click();
    // Create runtime configuration
    cy.createRuntimeConfig();
    // Validate it is now available
    cy.get('#elyra-metadata span.elyra-expandableContainer-name').contains(
      'Test Runtime'
    );
    // Click Run as Pipeline button
    cy.contains('Run as Pipeline').click();
    // Check for expected dialog title
    cy.get('.jp-Dialog-header').should('have.text', 'Run script as pipeline');
    // Dismiss  dialog
    cy.get('button.jp-mod-reject').click();

    // Close editor tab
    cy.get('.lm-TabBar-tabCloseIcon:visible')
      .eq(1)
      .click();

    // go back to file browser
    cy.get('.lm-TabBar-tab[data-id="filebrowser"]').click();
  });

  // R Tests
  it('opens blank R file from launcher', () => {
    cy.get('[title="Create a new R file"][tabindex="100"]').click();
    cy.get('.lm-TabBar-tab[data-type="document-title"]');
  });

  it('close R editor', () => {
    cy.get('.lm-TabBar-tabCloseIcon:visible').click();
  });

  it('opens blank R file from menu', () => {
    cy.get(':nth-child(1) > .lm-MenuBar-itemLabel').click();
    cy.get(
      ':nth-child(2) > .lm-Menu-itemSubmenuIcon > svg > .jp-icon3 > path'
    ).click();
    cy.get(
      '[data-command="script-editor:create-new-r-file"] > .lm-Menu-itemLabel'
    ).click();
  });

  it('check toolbar and its content', () => {
    checkToolbarContent();
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

  // check Run as Pipeline button exists
  cy.contains('Run as Pipeline');
};
