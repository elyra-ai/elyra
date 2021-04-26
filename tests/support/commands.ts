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

import '@testing-library/cypress/add-commands';

Cypress.Commands.add('closeCurrentTab', (): void => {
  cy.get('.jp-mod-current > .lm-TabBar-tabCloseIcon:visible').click();
});

// TODO: we shouldn't have to fill out the form for any test that isn't specifically
// testing filling out forms.
Cypress.Commands.add('createRuntimeConfig', (): void => {
  cy.findByRole('button', { name: /create new runtime/i }).click();

  cy.findByRole('menuitem', { name: /apache airflow/i }).click();

  cy.findByLabelText(/^name/i).type('Test Runtime');
  cy.findByLabelText(/airflow .* endpoint/i).type(
    'https://kubernetes-service.ibm.com/pipeline'
  );
  cy.findByLabelText(/github .* repository \*/i).type('akchinstc/test-repo');
  cy.findByLabelText(/github .* branch/i).type('main');
  cy.findByLabelText(/github .* token/i).type('xxxxxxxx');

  cy.findByLabelText(/object storage endpoint/i).type('http://0.0.0.0:9000');
  cy.findByLabelText(/object storage username/i).type('minioadmin');
  cy.findByLabelText(/object storage password/i).type('minioadmin');
  cy.findByLabelText(/object storage bucket/i).type('test-bucket');

  // Check the default value is displayed on github api endpoint field
  cy.findByLabelText(/github .* endpoint/i).should(
    'have.value',
    'https://api.github.com'
  );

  // save it
  cy.findByRole('button', { name: /save/i }).click();
});

Cypress.Commands.add('deleteFileByName', (fileName: string): void => {
  cy.get(`.jp-DirListing-itemText:contains(${fileName})`).rightclick();
  cy.get('.p-Menu-content > [data-command="filebrowser:delete"]').click();
  cy.get('.jp-mod-accept > .jp-Dialog-buttonLabel')
    .should('be.visible')
    .click();
});

Cypress.Commands.add(
  'getFileByType',
  (type: string): Cypress.Chainable<JQuery<HTMLElement>> => {
    return cy.get(`.jp-DirListing-content > [data-file-type="${type}"]`);
  }
);

Cypress.Commands.add('execDeleteFile', (name: string): void => {
  cy.exec(`find build/cypress-tests/ -name ${name} -delete`, {
    failOnNonZeroExit: false
  });
});

Cypress.Commands.add('addFileToPipeline', (name: string): void => {
  cy.findByRole('listitem', {
    name: (n, _el) => n.includes(name)
  }).rightclick();
  cy.findByRole('menuitem', { name: /add file to pipeline/i }).click();
});

Cypress.Commands.add('openFile', (name: string): void => {
  cy.findByRole('listitem', {
    name: (n, _el) => n.includes(name)
  }).dblclick();
});

Cypress.Commands.add('resetJupyterLab', (): void => {
  // open jupyterlab with a clean workspace
  cy.visit('?token=test&reset');
  cy.findByRole('tab', { name: /file browser/i, timeout: 25000 }).should(
    'exist'
  );
});
