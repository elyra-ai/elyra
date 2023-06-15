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

describe('Python Editor tests', () => {
  before(() => {
    cy.resetJupyterLab();
    cy.bootstrapFile('helloworld.py'); // load python file used to check existing contents
  });

  after(() => {
    // delete files created for testing
    cy.deleteFile('untitled*.py');
    cy.deleteFile('helloworld.py'); // delete python file used for testing

    // Delete runtime configuration used for testing
    cy.exec('elyra-metadata remove runtimes --name=kfp_test_runtime', {
      failOnNonZeroExit: false
    });
  });

  // Python Editor Tests
  it('opens blank Python editor from launcher', () => {
    cy.createNewScriptEditor('Python');
    cy.get('.lm-TabBar-tab[data-type="document-title"]');
  });

  it('check Python editor tab right click content', () => {
    cy.checkRightClickTabContent('Python');
  });

  it('close editor', () => {
    cy.closeTab(-1);
  });

  it('open Python file with expected content', () => {
    cy.openFileAndCheckContent('py');
  });

  it('opens blank Python editor from menu', () => {
    cy.findByRole('menuitem', { name: /file/i }).click();
    cy.findByText(/^new$/i).click();

    cy.get(
      '[data-command="script-editor:create-new-python-editor"] > .lm-Menu-itemLabel'
    ).click();
  });

  it('check toolbar and its content for Python file', () => {
    cy.checkScriptEditorToolbarContent();
  });

  it('check kernel dropdown has Python option', () => {
    cy.get('.elyra-ScriptEditor .jp-Toolbar select > option[value*=python]');
  });

  it('click the Run as Pipeline button should display dialog', () => {
    // Install runtime configuration
    cy.installRuntimeConfig({ type: 'kfp' });
    clickRunAsPipelineButton();
    // Check for expected dialog title
    cy.get('.jp-Dialog-header').should('have.text', 'Run file as pipeline');
    // Dismiss dialog
    cy.get('button.jp-mod-reject').click();

    // Close editor tab
    cy.closeTab(-1);
  });

  it('click the Run as Pipeline button on unsaved file should display save dialog', () => {
    // Create new python editor
    cy.createNewScriptEditor('Python');

    // Add some text to the editor (wait code editor to load)
    cy.wait(1000);
    cy.get('span[role="presentation"]')
      .should('be.visible')
      .type('print("test")');

    cy.wait(500);
    cy.dismissAssistant('scripteditor');

    clickRunAsPipelineButton();

    // Check expected save and submit dialog message
    cy.contains('.jp-Dialog-header', /this file contains unsaved changes/i);

    // Dismiss save and submit dialog
    cy.get('button.jp-mod-reject').click();

    // Close editor tab
    cy.closeTab(-1);

    // Dismiss save your work dialog by discarding changes
    cy.get('button.jp-mod-warn').click();
  });

  // check for new output console and scroll up/down buttons
  it('opens new output console', () => {
    cy.openHelloWorld('py');
    clickRunButton();
    cy.get('[id=tab-ScriptEditor-output]').should(
      'have.text',
      'Console Output'
    );
    cy.get('button[title="Top"]').should('be.visible');
    cy.get('button[title="Bottom"]').should('be.visible');

    //close console tab
    cy.closeTab(-1);

    // Close editor tab
    cy.closeTab(-1);
  });

  // TODO: Investigate CI failures commented below
  // check for expected output on running a valid code
  // it('checks for valid output', () => {
  //   cy.openHelloWorld('py');
  //   clickRunButton();
  //   cy.wait(1000);
  //   cy.get('.elyra-ScriptEditor-OutputArea-output').should(
  //     'have.text',
  //     'Hello Elyra\n'
  //   );

  //   //close console tab
  //   cy.closeTab(-1);

  //   // Close editor tab
  //   cy.closeTab(-1);
  // });

  // check for error message running an invalid code
  // it('checks for Error message', () => {
  //   cy.createNewScriptEditor('Python');
  //   cy.wait(1000);

  //   // Add some code with syntax error to the editor (wait code editor to load)
  //   cy.get('.CodeMirror-lines')
  //     .first()
  //     .should('be.visible')
  //     .type('print"test"');

  //   cy.wait(500);
  //   cy.dismissAssistant('scripteditor');
  //   clickRunButton();
  //   cy.findByText(/Error : SyntaxError/i).should('be.visible');

  //   //close console tab
  //   cy.closeTab(-1);

  //   // Close editor tab
  //   cy.closeTab(-1);

  //   // Dismiss save your work dialog by discarding changes
  //   cy.get('button.jp-mod-warn').click();
  // });
});

// ------------------------------
// ----- Utility Functions
// ------------------------------

// Click Run as Pipeline button
const clickRunAsPipelineButton = (): void => {
  cy.findByText(/run as pipeline/i).click();
};

// Click Run button
const clickRunButton = (): void => {
  cy.get('button[title="Run"]', { timeout: 30000 }).click();
};
