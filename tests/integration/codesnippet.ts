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

describe('Code Snippet tests', () => {
  const snippetName = 'test-code-snippet';

  beforeEach(() => {
    cy.resetJupyterLab();
    openCodeSnippetExtension();
  });

  afterEach(() => {
    // delete code-snippet used for testing
    cy.exec(`elyra-metadata remove code-snippets --name=${snippetName}`, {
      failOnNonZeroExit: false
    });
  });

  it('should open the Code Snippet extension', () => {
    // make sure it is rendered properly
    cy.get('.elyra-metadata .elyra-metadataHeader').contains('Code Snippets');
    // and code-snippet create new button is visible
    cy.findByRole('button', { name: /create new code snippet/i }).should(
      'be.visible'
    );
  });

  it('should provide warnings when required fields are not entered properly', () => {
    createInvalidCodeSnippet(snippetName);

    // Metadata editor should not close
    cy.get('.lm-TabBar-tabLabel')
      .contains('New Code Snippet')
      .should('be.visible');

    // Fields marked as required should be highlighted
    cy.get('.error-detail li.text-danger').as('required-warnings');
    cy.get('@required-warnings').should('have.length', 2);
  });

  it('should create valid code-snippet', () => {
    createValidCodeSnippet(snippetName);

    // Metadata editor tab should not be visible
    cy.get('.lm-TabBar-tabLabel')
      .contains('New Code Snippet')
      .should('not.exist');

    // Check new code snippet is displayed
    getSnippetByName(snippetName);
  });

  it('should fail to create duplicate Code Snippet', () => {
    // create code snippet
    createValidCodeSnippet(snippetName);

    // tries to create duplicate code snippet
    createValidCodeSnippet(snippetName);

    // Should display dialog
    cy.get('.jp-Dialog-header').contains('Error making request');

    // Close dialog
    cy.get('button.jp-mod-accept').click();
  });

  it('should trigger save / submit on pressing enter', () => {
    populateCodeSnippetFields(snippetName);

    cy.get('.elyra-formEditor-form-display_name').type('{enter}');

    // Metadata editor tab should not be visible
    cy.get('.lm-TabBar-tabLabel')
      .contains('New Code Snippet')
      .should('not.exist');

    // Check new code snippet is displayed
    getSnippetByName(snippetName);
  });

  // Delete snippet
  it('should delete existing Code Snippet', () => {
    createValidCodeSnippet(snippetName);

    cy.wait(500);

    getSnippetByName(snippetName);

    deleteSnippet(snippetName);
  });

  // Duplicate snippet
  it('should duplicate existing Code Snippet', () => {
    createValidCodeSnippet(snippetName);
    cy.wait(500);
    let snippetRef = getSnippetByName(snippetName);
    expect(snippetRef).to.not.be.null;

    // create a duplicate of this snippet
    duplicateSnippet(snippetName);
    cy.wait(100);
    snippetRef = getSnippetByName(`${snippetName}-Copy1`);
    expect(snippetRef).to.not.be.null;

    // create another duplicate of this snippet
    duplicateSnippet(snippetName);
    cy.wait(100);
    snippetRef = getSnippetByName(`${snippetName}-Copy2`);
    expect(snippetRef).to.not.be.null;

    // cleanup
    deleteSnippet(snippetName);
    deleteSnippet(`${snippetName}-Copy1`);
    deleteSnippet(`${snippetName}-Copy2`);
  });

  it('should have visible action buttons for existing code snippet', () => {
    createValidCodeSnippet(snippetName);

    const actionButtons = getActionButtonsElement(snippetName);
    const buttonTitles = [
      'Copy to clipboard',
      'Insert',
      'Edit',
      'Duplicate',
      'Delete'
    ];

    // Check expected buttons to be visible
    buttonTitles.forEach((title: string) => {
      actionButtons.within(() => {
        cy.get(`button[title="${title}"]`).should('be.visible');
      });
    });
  });

  it('should display/hide code snippet content on expand/collapse button', () => {
    createValidCodeSnippet(snippetName);

    // Check new code snippet is displayed
    const item = getSnippetByName(snippetName);

    // Click on expand button
    item
      .parentsUntil('.elyra-metadata-item')
      .first()
      .find('button')
      .first()
      .click();

    // Check code mirror is visible
    cy.get('.elyra-expandableContainer-details-visible').should('exist');

    // Click on collapse button
    item
      .parentsUntil('.elyra-metadata-item')
      .first()
      .find('button')
      .first()
      .click();

    // Check code mirror is not visible
    cy.get('.elyra-expandableContainer-details-visible').should('not.exist');
  });

  it('should update code snippet name after editing it', () => {
    createValidCodeSnippet(snippetName);

    // Find new snippet in display and click on edit button
    getActionButtonsElement(snippetName).within(() => {
      cy.get('button[title="Edit"]').click();
    });

    // Edit snippet name
    const newSnippetName = 'new-name';
    cy.get('.elyra-formEditor-form-display_name')
      .find('input')
      .clear()
      .type(newSnippetName);
    saveAndCloseMetadataEditor();

    cy.wait(500);

    // Check new snippet name is displayed
    const updatedSnippetItem = getSnippetByName(newSnippetName);

    // Check old snippet name does not exist
    expect(updatedSnippetItem.innerText).not.to.eq(snippetName);

    // Delete updated code snippet
    deleteSnippet(newSnippetName);
  });

  it('should fail to insert a code snippet into unsupported widget', () => {
    // Give time for the Launcher tab to load
    cy.wait(2000);

    createValidCodeSnippet(snippetName);

    // Insert snippet into launcher widget
    insert(snippetName);

    // Check if insertion failed and dismiss dialog
    cy.get('.jp-Dialog-header').contains('Error');
    cy.get('button.jp-mod-accept').click();
    cy.wait(100);
  });

  it('should insert a python code snippet into python editor', () => {
    // Give time for the Launcher tab to load
    cy.wait(2000);

    createValidCodeSnippet(snippetName);

    // Open blank python file
    cy.createNewScriptEditor('Python');

    cy.wait(1500);

    // Insert snippet into python editor
    insert(snippetName);

    // Check if editor has the new code
    cy.get('.cm-editor:visible');
    cy.get('.cm-editor .cm-content .cm-line').contains(/test/i);
  });

  it('should fail to insert a java code snippet into python editor', () => {
    // Give time for the Launcher tab to load
    cy.wait(2000);

    createValidCodeSnippet(snippetName, 'Java');

    // Open blank python file
    cy.createNewScriptEditor('Python');

    cy.wait(500);

    // Insert snippet into python editor
    insert(snippetName);

    // Check for language mismatch warning
    cy.get('.jp-Dialog-header').contains(/warning/i);
    // Dismiss the dialog
    cy.findByRole('button', { name: /cancel/i }).click();

    // Check it did not insert the code
    cy.get('.cm-editor:visible');
    cy.get('.cm-editor .cm-content .cm-line').should('not.contain', /test/i);
  });

  // DEV NOTE: Uncomment the tests below to run them locally
  // TODO: Investigate tests below only failing on CI
  // Steps: checkCodeMirror, closeTabWithoutSaving

  // it('Test inserting a code snippet into a notebook', () => {
  //   openCodeSnippetExtension();
  //   clickCreateNewSnippetButton();

  //   const snippetName = 'test-code-snippet';
  //   fillMetadaEditorForm(snippetName);

  //   cy.wait(500);

  //   // Open blank notebook file
  //   cy.get(
  //     '.jp-LauncherCard[data-category="Notebook"][title="Python 3"]:visible'
  //   ).click();

  //   cy.wait(500);

  //   // Check widget is loaded
  //   cy.get('.CodeMirror:visible');

  //   insert(snippetName);

  //   // Check if notebook cell has the new code
  //   checkCodeMirror();
  //   // NOTE: Notebook cell is still empty when this test runs on CI

  //   closeTabWithoutSaving();
  //   // NOTE: Save dialog isn't visible when this test runs on CI
  // });

  //   it('Test inserting a code snippet into a markdown file', () => {
  //     openCodeSnippetExtension();
  //     clickCreateNewSnippetButton();

  //     const snippetName = 'test-code-snippet';
  //     fillMetadaEditorForm(snippetName);

  //     cy.wait(500);

  //     // Open blank notebook file
  //     cy.get(
  //       '.jp-LauncherCard[title="Create a new markdown file"]:visible'
  //     ).click();

  //     cy.wait(500);

  //     // Check widget is loaded
  //     cy.get('.CodeMirror:visible');

  //     insert(snippetName);

  //     // Check if notebook cell has the new code
  //     checkCodeMirror();

  //     // Check for language decoration
  //     cy.get('span.cm-comment')
  //       .first()
  //       .contains('Python');

  //     closeTabWithoutSaving();
  //   });
});

// ------------------------------
// ----- Utility Functions ------
// ------------------------------

const openCodeSnippetExtension = (): void => {
  cy.get('.jp-SideBar [title="Code Snippets"]').click();
  cy.get('.jp-SideBar .lm-mod-current[title="Code Snippets"]');
};

const getSnippetByName = (snippetName: string): any => {
  return cy.get(`[data-item-id="${snippetName}"]`);
};

const createInvalidCodeSnippet = (snippetName: string): any => {
  clickCreateNewSnippetButton();

  // Name code snippet
  cy.get('.elyra-formEditor-form-display_name').type(snippetName);

  saveAndCloseMetadataEditor();
};

const populateCodeSnippetFields = (
  snippetName: string,
  language?: string
): any => {
  clickCreateNewSnippetButton();

  // Name code snippet
  cy.get('.elyra-formEditor-form-display_name').type(snippetName);

  // Select python language from dropdown list
  editSnippetLanguage(snippetName, language ?? 'Python');

  // Add snippet code
  cy.get('.elyra-metadataEditor-new .cm-content[contenteditable="true"]')
    .first()
    .click({ force: true })
    .type('print("Code Snippet Test")', { delay: 100 });
};

const createValidCodeSnippet = (
  snippetName: string,
  language?: string
): any => {
  populateCodeSnippetFields(snippetName, language);

  saveAndCloseMetadataEditor();

  cy.wait(1000);
};

const clickCreateNewSnippetButton = (): void => {
  cy.findByRole('button', { name: /create new code snippet/i }).click();
};

const saveAndCloseMetadataEditor = (): void => {
  cy.get('.elyra-metadataEditor-saveButton > button:visible').click();
};

const deleteSnippet = (snippetName: string): void => {
  // Find element by name
  const item = getSnippetByName(snippetName);

  // Click on delete button
  item.find('button[title="Delete"]').click();

  // Confirm action in dialog
  cy.get('.jp-Dialog-header').contains(`Delete snippet '${snippetName}'?`);
  cy.get('button.jp-mod-accept').click();
};

const duplicateSnippet = (snippetName: string): void => {
  // Find element by name
  const item = getSnippetByName(snippetName);

  // Click duplicate button
  item.find('button[title="Duplicate"]').click();
};

const getActionButtonsElement = (snippetName: string): any => {
  const actionButtonsElement = getSnippetByName(snippetName).find(
    '.elyra-expandableContainer-action-buttons'
  );

  return actionButtonsElement;
};

const insert = (snippetName: string): void => {
  getActionButtonsElement(snippetName).within(() => {
    cy.get('button[title="Insert"]').click();
  });
  cy.wait(500);
};

const editSnippetLanguage = (snippetName: string, lang: string): void => {
  cy.get('.elyra-formEditor')
    .find('.elyra-form-DropDown-item option')
    .then((list) => Cypress._.map(list, 'value'))
    .should('include', lang);
  cy.get('.elyra-formEditor')
    .find('.elyra-formEditor-form-language input')
    .type(lang);
  cy.get('.elyra-formEditor-form-language input')
    .should('have.value', lang)
    .click();
};
