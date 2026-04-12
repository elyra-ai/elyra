/*
 * Copyright 2018-2026 Elyra Authors
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

    // Wait for notebook and kernel to be ready
    cy.get('.jp-Notebook', { timeout: 10000 }).should('exist');
    waitForKernelIdle();
  });

  it('test empty cell', () => {
    cy.get('.jp-Notebook').should('have.length', 1);

    openCellContextMenuWithSnippetItem();

    cy.get(
      'li.lm-Menu-item[data-command="codesnippet:save-as-snippet"]'
    ).should('have.class', 'lm-mod-disabled');
  });

  it('test 1 cell', () => {
    populateCells();

    cy.get('.jp-Notebook').should('have.length', 1);

    openCellContextMenuWithSnippetItem();

    cy.get(
      'li.lm-Menu-item[data-command="codesnippet:save-as-snippet"]'
    ).click();

    // Wait for snippet editor to open
    cy.get('.elyra-metadataEditor', { timeout: 10000 }).should('be.visible');

    // Verify snippet editor contents
    cy.get('.elyra-metadataEditor .cm-editor .cm-content .cm-line').then(
      (lines) => {
        const content = [...lines]
          .map((line) => line.innerText)
          .join('\n')
          .trim();
        expect(content).to.equal('print("test")');
      }
    );
  });

  it('test 2 cells', () => {
    // Create new cells
    cy.get(
      '.jp-NotebookPanel-toolbar > div:nth-child(2) > jp-button:nth-child(1)'
    ).click();

    waitForKernelIdle();

    populateCells();

    // Select all cells
    cy.get(
      ':nth-child(1) > .jp-Cell-inputWrapper > .jp-InputArea > .jp-InputPrompt'
    )
      .first()
      .click({
        shiftKey: true
      });

    cy.get('div.lm-Widget.lm-Widget.jp-InputPrompt.jp-InputArea-prompt:visible')
      .first()
      .rightclick({
        force: true
      });

    openCellContextMenuWithSnippetItem();

    cy.get(
      'li.lm-Menu-item[data-command="codesnippet:save-as-snippet"]'
    ).click();

    // Wait for snippet editor to open
    cy.get('.elyra-metadataEditor', { timeout: 10000 }).should('be.visible');

    // Verify snippet editor contents
    cy.get('.elyra-metadataEditor .cm-editor .cm-content .cm-line').then(
      (lines) => {
        const content = [...lines]
          .map((line) => line.innerText)
          .join('\n')
          .trim();
        const occurrences = (content.match(/print\("test"\)/g) || []).length;
        expect(occurrences).to.equal(2);
      }
    );
  });
});

// ------------------------------
// ----- Utility Functions
// ------------------------------

// Wait for kernel to reach idle status
const waitForKernelIdle = (): void => {
  cy.get('[data-status="idle"]', { timeout: 30000 }).should('exist');
};

// Populate cells by re-querying each by index to avoid stale DOM references
const populateCells = (): void => {
  cy.get('.jp-Cell').then(($cells) => {
    for (let i = 0; i < $cells.length; i++) {
      cy.get('.jp-Cell')
        .eq(i)
        .click()
        .should('have.class', 'jp-mod-selected')
        .find('.jp-InputArea')
        .click()
        .type('print("test")', { delay: 100 });
    }
  });
};

// Retry opening context menu until the snippet command is registered.
// Extension commands register asynchronously; the menu must be
// re-opened to pick up newly available items.
const openCellContextMenuWithSnippetItem = (
  maxRetries: number = 5
): void => {
  const attemptOpen = (remaining: number): void => {
    cy.get('.jp-Cell').first().rightclick();
    cy.get('ul.lm-Menu-content').should('be.visible');

    cy.get('body').then(($body) => {
      const hasItem =
        $body.find(
          'li.lm-Menu-item[data-command="codesnippet:save-as-snippet"]'
        ).length > 0;

      if (!hasItem && remaining > 0) {
        // Dismiss menu and retry
        cy.get('body').click(0, 0, { force: true });
        cy.get('ul.lm-Menu-content').should('not.exist');
        attemptOpen(remaining - 1);
      }
    });
  };

  attemptOpen(maxRetries);
};
