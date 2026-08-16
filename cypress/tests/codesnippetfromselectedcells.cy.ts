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

// The context menu item Elyra registers for `.jp-Cell`. It is registered with
// isVisible: () => true, so once the extension has activated the item is
// always in a cell's context menu -- only its enabled state varies.
const SNIPPET_MENU_ITEM =
  'li.lm-Menu-item[data-command="codesnippet:save-as-snippet"]';

describe('Code snippet from cells tests', () => {
  beforeEach(() => {
    // Each test creates another notebook, which JupyterLab names
    // Untitled.ipynb, Untitled1.ipynb, ... Clear them so they do not pile up
    // across these tests or the other specs sharing this shard's workspace.
    cy.deleteFiles(['Untitled*.ipynb']);

    cy.resetJupyterLab();

    // The code snippet extension registers its sidebar button and its cell
    // context menu item in the same activate(), so waiting for the button is a
    // precise signal that the menu item is registered too.
    cy.get('.jp-SideBar [title*="Code Snippets"]', { timeout: 20000 }).should(
      'exist'
    );

    // Create new python notebook
    cy.get(
      '.jp-LauncherCard[data-category="Notebook"][title="Python 3 (ipykernel)"]'
    ).click();

    // Wait for notebook and kernel to be ready
    cy.get('.jp-Notebook', { timeout: 10000 }).should('exist');
    waitForKernelIdle();
  });

  afterEach(() => {
    cy.deleteFiles(['Untitled*.ipynb']);
  });

  it('test empty cell', () => {
    cy.get('.jp-Notebook').should('have.length', 1);

    openCellContextMenu();

    cy.get(SNIPPET_MENU_ITEM).should('have.class', 'lm-mod-disabled');
  });

  it('test 1 cell', () => {
    populateCells();

    cy.get('.jp-Notebook').should('have.length', 1);

    openCellContextMenu();

    cy.get(SNIPPET_MENU_ITEM)
      .should('not.have.class', 'lm-mod-disabled')
      .click();

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

    openCellContextMenu(
      'div.lm-Widget.lm-Widget.jp-InputPrompt.jp-InputArea-prompt:visible'
    );

    cy.get(SNIPPET_MENU_ITEM)
      .should('not.have.class', 'lm-mod-disabled')
      .click();

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

// Wait for the kernel of the notebook under test to reach idle status. Scoped
// to the visible notebook panel: an unscoped [data-status="idle"] also matches
// the status bar indicator and any other widget's, which reports idle while
// this notebook is still connecting.
const waitForKernelIdle = (): void => {
  cy.get('.jp-NotebookPanel:visible [data-status="idle"]', {
    timeout: 30000
  }).should('exist');
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

// Open a cell's context menu. Callers then assert on SNIPPET_MENU_ITEM, and
// cy.get retries that query, which covers the extension registering its item
// slightly after the page settles. force: true fires the event on the cell
// itself, so the menu is always anchored on the .jp-Cell that Elyra's item is
// registered against, whatever floats above it.
//
// Never dismiss a menu by clicking page coordinates: body (0, 0) lands on
// JupyterLab's menu bar, and Lumino menu bars track the pointer once open, so
// follow-up clicks walk into File > New > Notebook and Kernel > Interrupt.
const openCellContextMenu = (target: string = '.jp-Cell'): void => {
  cy.get(target).first().rightclick({ force: true });
  cy.get('ul.lm-Menu-content').should('be.visible');
};
