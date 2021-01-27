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
    openJupyterLab(): Cypress.Chainable<void>;
    closeCurrentTab(): Cypress.Chainable<void>;
    getFileByType(type: string): Cypress.Chainable<JQuery<HTMLElement>>;
  }
}

Cypress.Commands.add('openJupyterLab', (): void => {
  // open jupyterlab with a clean workspace
  cy.visit('?token=test&reset').wait(15000);
});

Cypress.Commands.add('closeCurrentTab', (): void => {
  cy.get('.jp-mod-current > .lm-TabBar-tabCloseIcon:visible').click();
});

Cypress.Commands.add(
  'getFileByType',
  (type: string): Cypress.Chainable<JQuery<HTMLElement>> => {
    return cy.get(`.jp-DirListing-content > [data-file-type="${type}"]`);
  }
);
