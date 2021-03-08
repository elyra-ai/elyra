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

describe('Code Snippet tests', () => {
  const snippetName = 'test-code-snippet';

  beforeEach(() => {
    cy.openJupyterLab();
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
    cy.get(
      '.elyra-metadata .elyra-metadataHeader-button[title="Create new Code Snippet"]'
    ).should('be.visible');
    // Close metadata editor tab
    cy.closeCurrentTab();
  });

  it('should provide warnings when required fields are not entered properly', () => {
    createInvalidCodeSnippet(snippetName);

    // Metadata editor should not close
    cy.get(
      'li.lm-TabBar-tab[data-id="elyra-metadata-editor:code-snippets:code-snippet:new"]'
    ).should('be.visible');

    // Fields marked as required should be highlighted
    cy.get('.MuiFormHelperText-root.Mui-error').as('required-warnings');
    cy.get('@required-warnings').should('have.length', 2);

    // Close metadata editor tab
    cy.closeCurrentTab();
  });

  it('should create valid code-snippet', () => {
    createValidCodeSnippet(snippetName);

    // Metadata editor tab should not be visible
    cy.get(
      'li.lm-TabBar-tab[data-id="elyra-metadata-editor:code-snippets:code-snippet:new"]'
    ).should('not.exist');

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

  // Delete snippet
  it('should delete existing Code Snippet', () => {
    createValidCodeSnippet(snippetName);

    cy.wait(500);

    getSnippetByName(snippetName);

    deleteSnippet(snippetName);
  });

  it('should have visible action buttons for existing code snippet', () => {
    createValidCodeSnippet(snippetName);

    const actionButtons = getActionButtonsElement(snippetName);
    const buttonTitles = ['Copy', 'Insert', 'Edit', 'Delete'];

    // Check expected buttons to be visible
    buttonTitles.forEach((title: string) => {
      actionButtons.within(() => {
        cy.get(`button[title=${title}]`).should('be.visible');
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
    cy.get('.elyra-metadataEditor-form-display_name')
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
    createValidCodeSnippet(snippetName);

    // Insert snippet into launcher widget
    insert(snippetName);

    // Check if insertion failed and dismiss dialog
    cy.get('.jp-Dialog-header').contains('Error');
    cy.get('button.jp-mod-accept').click();
    cy.wait(100);
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

  //   it('Test inserting a code snippet into a python editor', () => {
  //     openCodeSnippetExtension();
  //     clickCreateNewSnippetButton();

  //     const snippetName = 'test-code-snippet';
  //     fillMetadaEditorForm(snippetName);

  //     cy.wait(500);

  //     // Open blank python file
  //     cy.get(
  //       '.jp-LauncherCard[title="Create a new python file"]:visible'
  //     ).click();

  //     cy.wait(500);

  //     // Check widget is loaded
  //     cy.get('.CodeMirror:visible');

  //     insert(snippetName);

  //     // Check if python editor has the new code
  //     checkCodeMirror();

  //     // Edit snippet language
  //     getActionButtonsElement(snippetName).within(() => {
  //       cy.get('button[title="Edit"]').click();
  //     });
  //     cy.wait(100);
  //     editSnippetLanguage(snippetName, 'Java');
  //     saveAndCloseMetadataEditor();

  //     cy.wait(500);

  //     insert(snippetName);

  //     // Check for language mismatch warning
  //     cy.get('.jp-Dialog-header').contains('Warning');
  //     cy.get('button.jp-mod-accept').click();
  //     cy.wait(100);

  //     closeTabWithoutSaving();
  //   });

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
  cy.get('.elyra-metadataEditor-form-display_name').type(snippetName);

  saveAndCloseMetadataEditor();
};

const createValidCodeSnippet = (snippetName: string): any => {
  clickCreateNewSnippetButton();

  // Name code snippet
  cy.get('.elyra-metadataEditor-form-display_name').type(snippetName);

  // Select python language from dropdown list
  editSnippetLanguage(snippetName, 'Python');

  // Add snippet code
  cy.get('.CodeMirror .CodeMirror-scroll:visible').type(
    'print("Code Snippet Test")'
  );

  saveAndCloseMetadataEditor();

  cy.wait(1000);
};

const clickCreateNewSnippetButton = (): void => {
  cy.get(
    '.elyra-metadataHeader-button[title="Create new Code Snippet"]'
  ).click();
};

const saveAndCloseMetadataEditor = (): void => {
  cy.get('.elyra-metadataEditor-saveButton > button:visible').click();
};

// const fillMetadaEditorForm = (snippetName: string): void => {
//   // Name code snippet
//   cy.get('.elyra-metadataEditor-form-display_name').type(snippetName);

//   // Select python language from dropdown list
//   editSnippetLanguage(snippetName, 'Python');

//   // Add snippet code
//   cy.get('.elyra-metadataEditor-code > .bp3-form-content').type(
//     'print("Code Snippet Test")'
//   );

//   saveAndCloseMetadataEditor();
// };

const deleteSnippet = (snippetName: string): void => {
  // Find element by name
  const item = getSnippetByName(snippetName);

  // Click on delete button
  item.find('button[title="Delete"]').click();

  // Confirm action in dialog
  cy.get('.jp-Dialog-header').contains(`Delete snippet: ${snippetName}?`);
  cy.get('button.jp-mod-accept').click();
};

const getActionButtonsElement = (snippetName: string): any => {
  const actionButtonsElement = getSnippetByName(snippetName).find(
    '.elyra-expandableContainer-action-buttons'
  );

  return actionButtonsElement;
};

// const deleteFileByType = (type: string): void => {
//   cy.getFileByType(type).rightclick();
//   cy.get('.p-Menu-content > [data-command="filebrowser:delete"]').click();
//   cy.get('.jp-mod-accept > .jp-Dialog-buttonLabel:visible').click();
//   cy.wait(100);
// };

// const checkCodeMirror = (): void => {
//   cy.get('span.cm-string')
//     .first()
//     .contains('Code Snippet Test');
// };

const insert = (snippetName: string): void => {
  getActionButtonsElement(snippetName).within(() => {
    cy.get('button[title="Insert"]').click();
  });
  cy.wait(500);
};

const editSnippetLanguage = (snippetName: string, lang: string): void => {
  cy.get('.elyra-metadataEditor')
    .find('.elyra-form-DropDown-item .MuiOutlinedInput-root')
    .first()
    .click();
  cy.get('.MuiAutocomplete-listbox')
    .contains(`${lang}`)
    .click();
};

// const closeTabWithoutSaving = (): void => {
//   cy.closeCurrentTab();
//   cy.get('button.jp-mod-accept.jp-mod-warn').click();
// };
