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
    cy.resetJupyterLab();
    cy.bootstrapFile('helloworld.py'); // load python file used to check existing contents
    cy.bootstrapFile('helloworld.r'); // load R file used to check existing contents
  });

  after(() => {
    // delete files created for testing
    cy.deleteFile('untitled*.py');
    cy.deleteFile('untitled*.r');
    cy.deleteFile('helloworld.py'); // delete python file used for testing
    cy.deleteFile('helloworld.r'); // delete R file used for testing

    // Delete runtime configuration used for testing
    cy.exec('elyra-metadata remove runtimes --name=test_runtime', {
      failOnNonZeroExit: false
    });
  });

  // Python Tests
  it('opens blank Python file from launcher', () => {
    cy.get(
      '.jp-LauncherCard[data-category="Elyra"][title="Create a new Python file"]'
    ).click();
    cy.get('.lm-TabBar-tab[data-type="document-title"]');
  });

  it('check Python editor tab right click content', () => {
    checkRightClickTabContent('Python');
  });

  it('close editor', () => {
    cy.get('.lm-TabBar-tabCloseIcon:visible').click();
  });

  it('open Python file with expected content', () => {
    openFileAndCheckContent('py');
  });

  it('opens blank Python file from menu', () => {
    cy.findByRole('menuitem', { name: /file/i }).click();
    cy.findByText(/^new$/i).click();

    cy.get(
      '[data-command="script-editor:create-new-python-file"] > .lm-Menu-itemLabel'
    ).click();
  });

  it('check toolbar and its content for Python file', () => {
    checkToolbarContent();
  });

  it('check kernel dropdown has Python option', () => {
    cy.get('.elyra-ScriptEditor .jp-Toolbar select > option[value*=python]');
  });

  it('click the Run as Pipeline button should display dialog', () => {
    // Create runtime configuration
    cy.createRuntimeConfig();
    // Validate it is now available
    cy.get('#elyra-metadata\\:runtimes').within(() => {
      cy.findByText(/test runtime/i).should('exist');
    });
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
    cy.get(
      '.jp-LauncherCard[data-category="Elyra"][title="Create a new R file"]'
    ).click();
    cy.get('.lm-TabBar-tab[data-type="document-title"]');
  });

  it('check R editor tab right click content', () => {
    checkRightClickTabContent('R');
  });

  it('close R editor', () => {
    cy.get('.lm-TabBar-tabCloseIcon:visible').click();
  });

  it('open R file with expected content', () => {
    openFileAndCheckContent('r');
  });

  it('check icons', () => {
    // Check file menu editor contents
    cy.findByRole('menuitem', { name: /file/i }).click();
    cy.findByText(/^new$/i).click();
    cy.get(
      '[data-command="script-editor:create-new-r-file"] svg[data-icon="elyra:rIcon"]'
    );
    cy.get(
      '[data-command="script-editor:create-new-python-file"] svg[data-icon="elyra:pyIcon"]'
    );

    // Check python icons from launcher & file explorer
    cy.get(
      '.jp-LauncherCard[data-category="Elyra"][title="Create a new Python file"] svg[data-icon="elyra:pyIcon"]'
    ).click();
    cy.get(
      '#filebrowser [title*="Name: untitled1.py"] svg[data-icon="elyra:pyIcon"]'
    );
    cy.get('.lm-TabBar-tabCloseIcon:visible').click();

    // Check r icons from launcher & file explorer
    cy.get(
      '.jp-LauncherCard[data-category="Elyra"][title="Create a new R file"] svg[data-icon="elyra:rIcon"]'
    ).click();
    cy.get(
      '#filebrowser [title*="Name: untitled1.r"] svg[data-icon="elyra:rIcon"]'
    );
    cy.get('.lm-TabBar-tabCloseIcon:visible').click();
  });

  it('opens blank R file from menu', () => {
    cy.findByRole('menuitem', { name: /file/i }).click();
    cy.findByText(/^new$/i).click();

    cy.get(
      '[data-command="script-editor:create-new-r-file"] > .lm-Menu-itemLabel'
    ).click();
  });

  it('check toolbar and its content for R file', () => {
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

const checkRightClickTabContent = (fileType: string): void => {
  // Open right-click context menu
  cy.get('.lm-TabBar-tab[data-type="document-title"]').rightclick({
    force: true
  });

  // Check contents of each menu item
  cy.get('[data-command="application:close"] > .lm-Menu-itemLabel').contains(
    'Close Tab'
  );
  cy.get(
    '[data-command="application:close-other-tabs"] > .lm-Menu-itemLabel'
  ).contains('Close All Other Tabs');
  cy.get(
    '[data-command="application:close-right-tabs"] > .lm-Menu-itemLabel'
  ).contains('Close Tabs to Right');
  cy.get(
    '[data-command="filemenu:create-console"] > .lm-Menu-itemLabel'
  ).contains('Create Console for Editor');
  cy.get('[data-command="docmanager:rename"] > .lm-Menu-itemLabel').contains(
    `Rename ${fileType} File…`
  );
  cy.get('[data-command="docmanager:delete"] > .lm-Menu-itemLabel').contains(
    `Delete ${fileType} File`
  );
  cy.get('[data-command="docmanager:clone"] > .lm-Menu-itemLabel').contains(
    `New View for ${fileType} File`
  );
  cy.get(
    '[data-command="docmanager:show-in-file-browser"] > .lm-Menu-itemLabel'
  ).contains('Show in File Browser');
  cy.get(
    '[data-command="__internal:context-menu-info"] > .lm-Menu-itemLabel'
  ).contains('Shift+Right Click for Browser Menu');

  // Dismiss menu
  cy.get(
    '[data-command="docmanager:show-in-file-browser"] > .lm-Menu-itemLabel'
  ).click();
};

const openFileAndCheckContent = (fileExtension: string): void => {
  cy.findByRole('menuitem', { name: /file/i }).click();
  cy.findByText(/^open from path$/i).click({ force: true });

  // Search for helloworld file and open
  cy.get('input#jp-dialog-input-id').type(`/helloworld.${fileExtension}`);
  cy.get('.p-Panel .jp-mod-accept').click();

  // Ensure that the files contants are as expected
  cy.get('span[role="presentation"]').should($span => {
    expect($span.get(0).innerText).to.eq("print('Hello Elyra')");
  });

  // Close the file editor
  cy.get('.lm-TabBar-tabCloseIcon:visible')
    .last()
    .click();
};
