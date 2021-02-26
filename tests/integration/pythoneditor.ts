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
describe('Python Editor tests', () => {
  before(() => {
    cy.openJupyterLab();
  });

  after(() => {
    cy.deleteFileByName('untitled.py');
  });

  it('opens blank python from launcher', () => {
    cy.get('[title="Create a new python file"][tabindex="100"]').click();
    cy.get('.lm-TabBar-tab[data-type="document-title"]');
  });

  it('close python editor', () => {
    cy.get('.lm-TabBar-tabCloseIcon:visible').click();
    cy.deleteFileByName('untitled.py');
  });

  it('opens blank python from new menu', () => {
    cy.get(':nth-child(1) > .lm-MenuBar-itemLabel').click();
    cy.get(
      ':nth-child(2) > .lm-Menu-itemSubmenuIcon > svg > .jp-icon3 > path'
    ).click();
    cy.get(
      '[data-command="python-editor:create-new-file"] > .lm-Menu-itemLabel'
    ).click();
  });

  it('check toolbar exists', () => {
    cy.get('.elyra-PythonEditor .jp-Toolbar');
  });

  it('check save button exists and icon', () => {
    cy.get('button[title="Save file contents"]');
    cy.get('svg[data-icon="ui-components:save"]');
  });

  it('check run button exists and icon', () => {
    cy.get('button[title="Run"]');
    cy.get('svg[data-icon="ui-components:run"]');
  });

  it('check stop button exists and icon', () => {
    cy.get('button[title="Stop"]');
    cy.get('svg[data-icon="ui-components:stop"]');
  });

  it('check select kernel dropdown exists and has python', () => {
    cy.get('.elyra-PythonEditor .jp-Toolbar select > option[value*=python]');
  });

  it('check submit script buttton exists', () => {
    cy.contains('Submit Script');
  });

  it('click the submit script buttton should display dialog', () => {
    cy.contains('Submit Script').click();
    cy.get('.jp-Dialog-header').should('have.text', 'Submit script');
    // dismiss  dialog
    cy.get('button.jp-mod-reject').click();
  });
});
