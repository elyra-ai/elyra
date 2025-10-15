/*
 * Copyright 2018-2025 Elyra Authors
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

describe('R Editor tests', () => {
  before(() => {
    cy.resetJupyterLab();
    cy.bootstrapFile('helloworld.r'); // load R file used to check existing contents
  });

  after(() => {
    // delete files created for testing
    cy.deleteFile('untitled*.r');
    cy.deleteFile('helloworld.r'); // delete R file used for testing
  });

  // R Editor Tests
  it('opens blank R file from launcher', () => {
    cy.createNewScriptEditor('R');
    cy.get('.lm-TabBar-tab[data-type="document-title"]');
    cy.closeTab(-1);
  });

  it('check R editor tab right click content', () => {
    cy.createNewScriptEditor('R');
    // Wait for editor to fully load before testing right-click
    cy.get('.elyra-ScriptEditor').should('be.visible');
    cy.wait(500);
    cy.checkRightClickTabContent('R');
    cy.closeTab(-1);
  });

  it('close R editor', () => {
    cy.createNewScriptEditor('R');
    cy.closeTab(-1);
  });

  it('open R file with expected content', () => {
    cy.openFileAndCheckContent('r');
    cy.closeTab(-1);
  });

  it('check icons', () => {
    // Check file menu editor contents
    cy.get('.jp-MenuBar-item[data-command="filemenu:open"]').click();
    cy.get('[data-command="filemenu:new"] .lm-Menu-itemLabel').click();
    cy.get(
      '[data-command="script-editor:create-new-r-editor"] svg[data-icon="elyra:rIcon"]'
    );

    // Check r icons from launcher & file explorer
    cy.get(
      '.jp-LauncherCard[data-category="Elyra"][title="Create a new R Editor"] svg[data-icon="elyra:rIcon"]'
    ).click();
    cy.get(
      '#filebrowser [title*="Name: untitled.r"] svg[data-icon="elyra:rIcon"]'
    );
    cy.closeTab(-1);
  });

  it('opens blank R file from menu', () => {
    cy.get('.jp-MenuBar-item[data-command="filemenu:open"]').click();
    cy.get('[data-command="filemenu:new"] .lm-Menu-itemLabel').click();

    cy.get(
      '[data-command="script-editor:create-new-r-editor"] > .lm-Menu-itemLabel'
    ).click();
    cy.closeTab(-1);
  });

  it('check toolbar and its content for R file', () => {
    cy.createNewScriptEditor('R');
    cy.checkScriptEditorToolbarContent();
    cy.closeTab(-1);
  });
});
