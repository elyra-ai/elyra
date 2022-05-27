/*
 * Copyright 2018-2022 Elyra Authors
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

describe('Code snippet from cells tests', () => {
  beforeEach(() => {
    cy.resetJupyterLab();

    // Create new python notebook
    cy.get(
      '.jp-LauncherCard[data-category="Notebook"][title="Python 3 (ipykernel)"]'
    ).click();
  });

  it('tests empty cell', () => {
    cy.get('span[role="presentation"]').rightclick({
      force: true
    });
    cy.get(
      'li.lm-Menu-item[data-command="codesnippet:save-as-snippet"]'
    ).should('have.class', 'p-mod-disabled');
  });

  it('tests 1 cell', () => {
    // Create new cell
    cy.get(
      '.jp-NotebookPanel-toolbar > div:nth-child(2) > button:nth-child(1)'
    ).click();

    populateCells();

    cy.get('span[role="presentation"]:nth-child(1)').rightclick({
      force: true
    });

    cy.get('li.lm-Menu-item[data-command="codesnippet:save-as-snippet"]');

    cy.wait(2000);

    cy.get('span[role="presentation"]').should('have.text', 'print("test")');
  });

  it('tests 2 cells', () => {
    // Create new cells
    cy.get(
      '.jp-NotebookPanel-toolbar > div:nth-child(2) > button:nth-child(1)'
    ).click();
    cy.get(
      '.jp-NotebookPanel-toolbar > div:nth-child(2) > button:nth-child(1)'
    ).click();

    populateCells();

    // Select all cells
    cy.get('div.jp-NotebookPanel').trigger('keydown', {
      key: 'a',
      ctrlKey: true
    });

    cy.get('span[role="presentation"]:nth-child(1)').rightclick({
      force: true
    });

    cy.get('li.lm-Menu-item[data-command="codesnippet:save-as-snippet"]');

    cy.wait(2000);

    cy.get('span[role="presentation"]').should(
      'have.text',
      `print("test")

            print("test")`
    );
  });
});

// ------------------------------
// ----- Utility Functions
// ------------------------------

// Populate cells
const populateCells = (): void => {
  cy.get('span[role="presentation"]').each(cell => {
    cell.type('print("test")');
    dismissAssistant();
  });
};

// Dismiss LSP code assistant box if visible
const dismissAssistant = (): void => {
  cy.get('body').then($body => {
    if ($body.find('.lsp-completer').length > 0) {
      // Dismiss code assistant box
      cy.get('.CodeMirror-lines')
        .first()
        .type('{esc}');
    }
  });
};
