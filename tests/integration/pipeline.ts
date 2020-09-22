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
const closePipeline = (): void => {
  cy.get(
    '.lm-TabBar-tab.lm-mod-current > .lm-TabBar-tabCloseIcon:visible'
  ).click();
};

const checkEnabledToolbarButtons = (buttons: string[]): void => {
  buttons.forEach((buttonClass: string) => {
    cy.get(`${buttonClass} button`)
      .should('have.length', 1)
      .should('not.be.disabled');
  });
};

const checkDisabledToolbarButtons = (buttons: string[]): void => {
  buttons.forEach((buttonClass: string) => {
    cy.get(`${buttonClass} button`)
      .should('have.length', 1)
      .should('be.disabled');
  });
};

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

  it('opens blank pipeline editor from launcher', () => {
    cy.get(
      '.lm-TabBar-tab[data-id="launcher-0"] > .lm-TabBar-tabCloseIcon:visible'
    ).click({ multiple: true });
    cy.get('.jp-ToolbarButtonComponent[title="New Launcher"]').click();
    cy.get('.jp-Launcher-cardContainer > [title="Pipeline Editor"]')
      .scrollIntoView()
      .click();
  });

  it('closes pipeline editor', () => {
    closePipeline();
  });

  it('deletes pipeline file', () => {
    cy.get('.jp-DirListing-content > [data-file-type="pipeline"]').rightclick();
    cy.get('.p-Menu-content > [data-command="filebrowser:delete"]').click();
    cy.get('.jp-mod-accept > .jp-Dialog-buttonLabel')
      .should('be.visible')
      .click();
  });

  it('opens blank pipeline editor from file menu', () => {
    cy.get(':nth-child(1) > .lm-MenuBar-itemLabel').click();
    cy.get(
      ':nth-child(2) > .lm-Menu-itemSubmenuIcon > svg > .jp-icon3 > path'
    ).click();
    cy.get(
      '[data-command="pipeline-editor:open"] > .lm-Menu-itemLabel'
    ).click();
  });

  it('checks for disabled buttons', () => {
    const disabledButtons = [
      '.run-action',
      '.export-action',
      '.clear-action',
      '.undo-action',
      '.redo-action',
      '.cut-action',
      '.copy-action',
      '.deleteSelectedObjects-action',
      '.arrangeHorizontally-action',
      '.arrangeVertically-action'
    ];
    checkDisabledToolbarButtons(disabledButtons);

    // TODO: investigate further
    // paste action always enabled (even when set to false in toolbarConfig)
    // cy.get('#paste-action button')
    //   .should('have.length', 1)
    //   .should('be.disabled');
  });

  it('checks for enabled buttons', () => {
    const enabledButtons = [
      '.save-action',
      '.openRuntimes-action',
      '.createAutoComment-action'
    ];
    checkEnabledToolbarButtons(enabledButtons);
  });

  it('closes pipeline editor', () => {
    closePipeline();
  });

  it('opens pipeline from file browser', () => {
    cy.get('.jp-DirListing-content > [data-file-type="pipeline"]').dblclick();
  });

  it('adds blank notebook to pipeline', () => {
    cy.get('.jp-DirListing-content > [data-file-type="notebook"]').rightclick();
    cy.get('[data-command="pipeline-editor:add-node"]').click();
  });

  it('checks for disabled buttons', () => {
    const disabledButtons = [
      '.redo-action',
      '.cut-action',
      '.copy-action',
      '.deleteSelectedObjects-action'
    ];
    checkDisabledToolbarButtons(disabledButtons);
  });

  it('checks for enabled buttons', () => {
    const enabledButtons = [
      '.run-action',
      '.save-action',
      '.export-action',
      '.clear-action',
      '.openRuntimes-action',
      '.undo-action',
      '.createAutoComment-action',
      '.arrangeHorizontally-action',
      '.arrangeVertically-action'
    ];
    checkEnabledToolbarButtons(enabledButtons);
  });

  it('opens runtimes sidebar', () => {
    cy.get('.openRuntimes-action button').click();
    cy.get('.jp-SideBar .lm-mod-current[title="Runtimes"]');
  });

  it('checks runtimes sidebar rendered', () => {
    cy.get('.elyra-metadata .elyra-metadataHeader').contains('Runtimes');
  });

  it('runs invalid pipeline', () => {
    cy.get('.run-action button').click();
    cy.get('.MuiAlert-message').should('be.visible');
    cy.get('image.node-image[data-image*=jp-icon-warn]');
  });

  // TODO:
  // - Drag and drop a notebook to pipeline editor
});
