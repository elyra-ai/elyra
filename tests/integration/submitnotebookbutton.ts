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
describe('Submit Notebook Button tests', () => {
  before(() => {
    cy.openJupyterLab();
  });

  after(() => {
    cy.deleteFileByName('Untitled.ipynb');
  });

  it('presses the submit notebook buttton in the notebook toolbar', () => {
    openNewNotebookFile();
    clickSubmitNotebookButton();
  });

  it('should display Submit Notebook dialog', () => {
    cy.get('.jp-Dialog')
      .find('div.jp-Dialog-header')
      .should('have.text', 'Submit notebook');
    // dismiss  dialog
    cy.get('button.jp-mod-reject').click();
  });
});

// ------------------------------
// ----- Utility Functions
// ------------------------------

const openNewNotebookFile = (): void => {
  cy.get(
    '.jp-LauncherCard[data-category="Notebook"][title="Python 3"]:visible'
  ).click();
};

const clickSubmitNotebookButton = (): void => {
  cy.contains('Submit Notebook').click();
};
