/*
 * Copyright 2018-2020 Elyra Authors
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

describe('Test for Code Snippet extension load and render', () => {
  before(() => {
    cy.openJupyterLab();
  });

  it('Test opening Code Snippet extension', () => {
    openCodeSnippetExtension();
  });

  it('Test checking extension rendered', () => {
    cy.get('.elyra-metadata .elyra-metadataHeader').contains('Code Snippets');
  });

  it('Test persistency on page reload', () => {
    // Reload jupyterlab
    cy.openJupyterLab();
    cy.get('.elyra-metadata .elyra-metadataHeader').contains('Code Snippets');
  });
});

describe('Test for creating new Code Snippet', () => {
  before(() => {
    cy.openJupyterLab();
    openCodeSnippetExtension();
  });

  it('Test "Create new Code Snippet" button', () => {
    clickCreateNewSnippetButton();

    // Metadata editor is displayed
    cy.get(
      'li.lm-TabBar-tab[data-id="elyra-metadata-editor:code-snippets:code-snippet:new"]:visible'
    );
    // Close metadata editor tab
    cy.closeCurrentTab();
  });

  it('Test saving empty form', () => {
    clickCreateNewSnippetButton();
    saveAndCloseMetadataEditor();

    // Metadata editor should not close
    cy.get(
      'li.lm-TabBar-tab[data-id="elyra-metadata-editor:code-snippets:code-snippet:new"]:visible'
    );

    // Fields marked as required should be highlighted
    cy.get('.bp3-intent-danger').as('required-warnings');
    cy.get('@required-warnings').should('have.length', 3);

    // Close metadata editor tab
    cy.closeCurrentTab();
  });

  it('Test creating valid form', () => {
    clickCreateNewSnippetButton();

    const snippetName = 'test-code-snippet';

    fillMetadaEditorForm(snippetName);

    // Metadata editor tab should not be visible
    cy.get(
      'li.lm-TabBar-tab[data-id="elyra-metadata-editor:code-snippets:code-snippet:new"]'
    ).should('not.be.visible');

    cy.wait(500);

    // Check new code snippet is displayed
    getSnippetByName(snippetName);
  });

  it('Test creating duplicate Code Snippet', () => {
    clickCreateNewSnippetButton();

    // Use the name of an as existing code snippet
    const snippetName = 'test-code-snippet';
    fillMetadaEditorForm(snippetName);

    // Should display dialog
    cy.get('.jp-Dialog-header').contains('Error making request');

    // Close dialog
    cy.get('button.jp-mod-accept').click();
  });

  // Delete snippet
  it('Test deleting Code Snippet', () => {
    deleteSnippet('test-code-snippet');
  });
});

describe('Test for Code Snippet display', () => {
  before(() => {
    cy.openJupyterLab();
  });

  afterEach(() => {
    deleteSnippet('test-code-snippet');
  });

  it('Test action buttons are visible', () => {
    openCodeSnippetExtension();
    clickCreateNewSnippetButton();

    const snippetName = 'test-code-snippet';
    fillMetadaEditorForm(snippetName);

    cy.wait(500);

    const actionButtons = getActionButtonsElement(snippetName);
    const buttonTitles = ['Copy', 'Insert', 'Edit', 'Delete'];

    // Check expected buttons to be visible
    buttonTitles.forEach((title: string) => {
      actionButtons.within(() => {
        cy.get(`button[title=${title}]`).should('be.visible');
      });
    });
  });

  it('Test display on expand/collapse button', () => {
    clickCreateNewSnippetButton();

    const snippetName = 'test-code-snippet';
    fillMetadaEditorForm(snippetName);

    cy.wait(500);

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
});

describe('Test for editing a Code Snippet', () => {
  before(() => {
    cy.openJupyterLab();
  });

  after(() => {
    deleteSnippet('new-name');
  });

  it('Test editing a code snippet name', () => {
    openCodeSnippetExtension();
    clickCreateNewSnippetButton();

    const snippetName = 'test-code-snippet';
    fillMetadaEditorForm(snippetName);

    cy.wait(500);

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
  });
});

describe('Test for inserting a Code Snippet', () => {
  beforeEach(() => {
    cy.openJupyterLab();
  });
  afterEach(() => {
    deleteSnippet('test-code-snippet');
  });
  // after(() => {
  // Delete new files created
  // cy.get('li[title="File Browser (⇧ ⌘ F)"]').click();
  // deleteFileByType('notebook');
  // deleteFileByType('python');
  // deleteFileByType('markdown');
  // });

  it('Test inserting a code snippet into unsupported widget', () => {
    openCodeSnippetExtension();
    clickCreateNewSnippetButton();

    const snippetName = 'test-code-snippet';
    fillMetadaEditorForm(snippetName);

    cy.wait(500);

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

const clickCreateNewSnippetButton = (): void => {
  cy.get(
    '.elyra-metadataHeader-button[title="Create new Code Snippet"]'
  ).click();
};

const saveAndCloseMetadataEditor = (): void => {
  cy.get(
    '.elyra-metadataEditor-saveButton > .bp3-form-content > button:visible'
  ).click();
};

const getSnippetByName = (snippetName: string): any => {
  return cy.get(`[data-item-id="${snippetName}"]`);
};

const fillMetadaEditorForm = (snippetName: string): void => {
  // Name code snippet
  cy.get('.elyra-metadataEditor-form-display_name').type(snippetName);

  // Select python language from dropdown list
  editSnippetLanguage(snippetName, 'Python');

  // Add snippet code
  cy.get('.elyra-metadataEditor-code > .bp3-form-content').type(
    'print("Code Snippet Test")'
  );

  saveAndCloseMetadataEditor();
};

const deleteSnippet = (snippetName: string): void => {
  // Find element by name
  const item = getSnippetByName(snippetName);

  // Click on delete button
  item
    .parentsUntil('.elyra-metadata-item')
    .first()
    .find('button[title="Delete"]')
    .click();

  // Confirm action in dialog
  cy.get('.jp-Dialog-header').contains(`Delete snippet: ${snippetName}?`);
  cy.get('button.jp-mod-accept').click();
};

const getActionButtonsElement = (snippetName: string): any => {
  const actionButtonsElement = getSnippetByName(snippetName)
    .parentsUntil('.elyra-metadata-item')
    .find('.elyra-expandableContainer-action-buttons');

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
    .find('button.bp3-button.jp-Button')
    .first()
    .click();
  cy.get('button.elyra-form-DropDown-item')
    .contains(`${lang}`)
    .click();
};

// const closeTabWithoutSaving = (): void => {
//   cy.closeCurrentTab();
//   cy.get('button.jp-mod-accept.jp-mod-warn').click();
// };
