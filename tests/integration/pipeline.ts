/*
 * Copyright 2018-2020 IBM Corporation
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

describe('PipelineEditor', () => {
  it('opens jupyterlab', () => {
    cy.visit('?token=test&reset');
  });

  it('opens blank notebook', () => {
    cy.get('.jp-ToolbarButtonComponent[title="New Launcher"]').click();
    cy.get(
      '.jp-LauncherCard[data-category="Notebook"][title="Python 3"]:visible'
    ).click();
  });

  it('saves blank notebook', () => {
    cy.get(
      '[title="Save the notebook contents and create checkpoint"]:visible'
    ).click();
  });

  it('opens blank pipeline editor', () => {
    cy.get(
      '.lm-TabBar-tab[data-id="launcher-0"] > .lm-TabBar-tabCloseIcon:visible'
    ).click({ multiple: true });
    cy.get('.jp-ToolbarButtonComponent[title="New Launcher"]').click();
    cy.get('.jp-Launcher-cardContainer > [title="Pipeline Editor"]')
      .scrollIntoView()
      .click();
  });

  it('checks for disabled buttons', () => {
    cy.get('.run-action button')
      .should('have.length', 1)
      .should('be.disabled');
    cy.get('.export-action button')
      .should('have.length', 1)
      .should('be.disabled');
    cy.get('.clear-action button')
      .should('have.length', 1)
      .should('be.disabled');
    cy.get('.undo-action button')
      .should('have.length', 1)
      .should('be.disabled');
    cy.get('.redo-action button')
      .should('have.length', 1)
      .should('be.disabled');
    cy.get('.cut-action button')
      .should('have.length', 1)
      .should('be.disabled');
    cy.get('.copy-action button')
      .should('have.length', 1)
      .should('be.disabled');

    // TODO: investigate further
    // paste action always enabled (even when set to false in toolbarConfig)
    // cy.get('#paste-action button')
    //   .should('have.length', 1)
    //   .should('be.disabled');

    cy.get('.deleteSelectedObjects-action button')
      .should('have.length', 1)
      .should('be.disabled');
    cy.get('.arrangeHorizontally-action button')
      .should('have.length', 1)
      .should('be.disabled');
    cy.get('.arrangeVertically-action button')
      .should('have.length', 1)
      .should('be.disabled');
  });

  it('checks save and add comment buttons are enabled', () => {
    cy.get('.save-action button')
      .should('have.length', 1)
      .should('not.be.disabled');
    cy.get('.createAutoComment-action button')
      .should('have.length', 1)
      .should('not.be.disabled');
  });

  it('open runtimes sidebar', () => {
    cy.get('.openRuntimes-action button')
      .should('have.length', 1)
      .should('not.be.disabled')
      .click();

    cy.get('.jp-SideBar .lm-mod-current[title="Runtimes"]');
  });

  it('check runtimes sidebar rendered', () => {
    cy.get('.elyra-metadata .elyra-metadataHeader').contains('Runtimes');
  });

  // TODO:
  // - Drag and drop a notebook to pipeline editor
  // - Test expected buttons are enabled: run,save,export, clear, undo, cut,copy,delete, arrangeHorizontally, arrangeVertivally
});
