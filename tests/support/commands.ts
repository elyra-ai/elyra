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

declare namespace Cypress {
  interface IChainable {
    closeCurrentTab(): Cypress.Chainable<void>;
    createRuntimeConfig(): Cypress.Chainable<void>;
    deleteFileByName(fileName: string): Cypress.Chainable<void>;
    getFileByType(type: string): Cypress.Chainable<JQuery<HTMLElement>>;
    openJupyterLab(): Cypress.Chainable<void>;
  }
}

Cypress.Commands.add('closeCurrentTab', (): void => {
  cy.get('.jp-mod-current > .lm-TabBar-tabCloseIcon:visible').click();
});

Cypress.Commands.add('createRuntimeConfig', (): void => {
  // Check if Runtimes sidebar is active
  cy.get('.elyra-metadata .elyra-metadataHeader').contains('Runtimes');
  // Add a runtime config
  cy.get(
    'button.elyra-metadataHeader-button[title="Create new runtimes"]'
  ).click();
  cy.get('li.MuiListItem-button[title="New Apache Airflow runtime"]').click();
  cy.get('.elyra-metadataEditor-form-display_name').type('Test Runtime');
  cy.get('.elyra-metadataEditor-form-api_endpoint').type(
    'https://kubernetes-service.ibm.com/pipeline'
  );
  cy.get('.elyra-metadataEditor-form-github_repo').type('akchinstc/test-repo');
  cy.get('.elyra-metadataEditor-form-github_branch').type('main');
  cy.get('.elyra-metadataEditor-form-github_repo_token').type('xxxxxxxx');
  cy.get('.elyra-metadataEditor-form-cos_endpoint').type('http://0.0.0.0:9000');
  cy.get('.elyra-metadataEditor-form-cos_username').type('minioadmin');
  cy.get('.elyra-metadataEditor-form-cos_password').type('minioadmin');
  cy.get('.elyra-metadataEditor-form-cos_bucket').type('test-bucket');
  // Check the default value is displayed on github api endpoint field
  cy.get('.elyra-metadataEditor-form-github_api_endpoint >> input').should(
    'have.value',
    'https://api.github.com'
  );
  // save it
  cy.get('.elyra-metadataEditor-saveButton > button')
    .click()
    .wait(100);
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

Cypress.Commands.add('openJupyterLab', (): void => {
  // open jupyterlab with a clean workspace
  cy.visit('?token=test&reset').wait(15000);
});
