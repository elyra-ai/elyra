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
    openJupyterLab();
    // cy.openJupyterLab();
  });

  it('Test opening Code Snippet extension', () => {
    openCodeSnippetExtension();
  });

  it('Test checking extension rendered', () => {
    cy.get('.elyra-metadata .elyra-metadataHeader').contains('Code Snippets');
  });

  it('Test persistency on page reload', () => {
    // Reload jupyterlab
    openJupyterLab();
    // cy.openJupyterLab();
    cy.get('.elyra-metadata .elyra-metadataHeader').contains('Code Snippets');
  });
});

describe('Test for creating new Code Snippet', () => {
  before(() => {
    openJupyterLab();
    // cy.openJupyterLab();
    openCodeSnippetExtension();
  });

  it('Test "Create new Code Snippet" button', () => {
    clickCreateNewSnippetButton();

    // Metadata editor is displayed
    cy.get(
      'li.lm-TabBar-tab[data-id="elyra-metadata-editor:code-snippets:code-snippet:new"]:visible'
    );
    // Close metadata editor tab
    closeCurrentTab();
  });

  it('Test saving empty form', () => {
    clickCreateNewSnippetButton();
    clickSaveAndCloseButton();

    // Metadata editor should not close
    cy.get(
      'li.lm-TabBar-tab[data-id="elyra-metadata-editor:code-snippets:code-snippet:new"]:visible'
    );

    // Fields marked as required should be highlighted
    cy.get('.bp3-intent-danger').as('required-warnings');
    cy.get('@required-warnings').should('have.length', 3);

    // Close metadata editor tab
    closeCurrentTab();
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
    checkSnippetIsDisplayed(snippetName);
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
    openJupyterLab();
    // cy.openJupyterLab();
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

    deleteSnippet(snippetName);
  });

  it('Test display on expand/collapse button', () => {
    clickCreateNewSnippetButton();

    const snippetName = 'test-code-snippet';
    fillMetadaEditorForm(snippetName);

    cy.wait(500);

    // Check new code snippet is displayed
    const item = checkSnippetIsDisplayed(snippetName);

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

    deleteSnippet(snippetName);
  });
});

describe('Test for editing a Code Snippet', () => {
  before(() => {
    openJupyterLab();
    // cy.openJupyterLab();
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
    clickSaveAndCloseButton();

    cy.wait(500);

    // Check new snippet name is displayed
    checkSnippetIsDisplayed(newSnippetName);

    // Check old snippet name does not exist
    cy.get('.elyra-metadata-item')
      .find('.elyra-expandableContainer-name')
      .should('not.contain', `${snippetName}`);

    deleteSnippet(newSnippetName);
  });
});

// ------------------------------
// ----- Utility Functions ------
// ------------------------------

const openJupyterLab = (): void => {
  // open jupyterlab with a clean workspace
  cy.visit('?token=test&reset').wait(1000);
};

const openCodeSnippetExtension = (): void => {
  cy.get('.jp-SideBar [title="Code Snippets"]').click();
  cy.get('.jp-SideBar .lm-mod-current[title="Code Snippets"]');
};

const clickCreateNewSnippetButton = (): void => {
  cy.get(
    '.elyra-metadataHeader-button[title="Create new Code Snippet"]'
  ).click();
};

const clickSaveAndCloseButton = (): void => {
  cy.get(
    '.elyra-metadataEditor-saveButton > .bp3-form-content > button:visible'
  ).click();
};

const closeCurrentTab = (): void => {
  cy.get('.jp-mod-current > .lm-TabBar-tabCloseIcon:visible').click();
};

const checkSnippetIsDisplayed = (snippetName: string): any => {
  return cy
    .get('.elyra-metadata-item')
    .find('.elyra-expandableContainer-name')
    .contains(`${snippetName}`);
};

const fillMetadaEditorForm = (name: string): void => {
  // Name code snippet
  cy.get('.elyra-metadataEditor-form-display_name').type(name);

  // Select python language from dropdown list
  cy.get('.elyra-metadataEditor')
    .find('button.bp3-button.jp-Button')
    .first()
    .click();
  cy.get('button.elyra-form-DropDown-item')
    .contains('Python')
    .click();

  // Add snippet code
  cy.get('.elyra-metadataEditor-code > .bp3-form-content').type(
    'print("Code Snippet Test")'
  );

  clickSaveAndCloseButton();
};

const deleteSnippet = (snippetName: string): void => {
  // Find element by name
  const item = checkSnippetIsDisplayed(snippetName);

  // Click on delete button
  item
    .parentsUntil('.elyra-metadata-item')
    .first()
    .find('button[title="Delete"]')
    .click();

  // Confirm on dialog
  cy.get('.jp-Dialog-header').contains(`Delete snippet: ${snippetName}?`);
  cy.get('button.jp-mod-accept').click();

  cy.wait(500);

  // Snippet name is no longer on display list

  cy.get('.elyra-metadata-item').then(($item: any) => {
    if ($item) {
      // A local machine may contain multiple code snippets in its test environment
      cy.get('.elyra-metadata-item')
        .find('.elyra-expandableContainer-name')
        .should('not.contain', `${snippetName}`);
    } else {
      // On a clean test environment, the only snippet is deleted, no further search needed
      return;
    }
  });
};

const getActionButtonsElement = (snippetName: string): any => {
  const actionButtonsElement = checkSnippetIsDisplayed(snippetName)
    .parentsUntil('.elyra-metadata-item')
    .find('.elyra-expandableContainer-action-buttons');

  return actionButtonsElement;
};
