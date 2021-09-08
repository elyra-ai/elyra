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

import './../utils/snapshots/add-commands';

// TODO: we shouldn't have to fill out the form for any test that isn't specifically
// testing filling out forms.
Cypress.Commands.add('createRuntimeConfig', ({ type } = {}): void => {
  cy.findByRole('tab', { name: /runtimes/i }).click();
  cy.findByRole('button', { name: /create new runtime/i }).click();

  if (type === 'kfp') {
    cy.findByRole('menuitem', { name: /kubeflow pipelines/i }).click();
  } else {
    cy.findByRole('menuitem', { name: /apache airflow/i }).click();
  }

  cy.findByLabelText(/^name/i).type('Test Runtime');

  if (type === 'kfp') {
    cy.findByLabelText(/kubeflow .* endpoint \*/i).type(
      'https://kubernetes-service.ibm.com/pipeline'
    );
  } else {
    cy.findByLabelText(/airflow .* endpoint/i).type(
      'https://kubernetes-service.ibm.com/pipeline'
    );
    cy.findByLabelText(/github .* repository \*/i).type('akchinstc/test-repo');
    cy.findByLabelText(/github .* branch/i).type('main');
    cy.findByLabelText(/github .* token/i).type('xxxxxxxx');
    // Check the default value is displayed on github api endpoint field
    cy.findByLabelText(/github .* endpoint/i).should(
      'have.value',
      'https://api.github.com'
    );
  }

  cy.findByLabelText(/object storage endpoint/i).type('http://0.0.0.0:9000');
  cy.findByLabelText(/object storage username/i).type('minioadmin');
  cy.findByLabelText(/object storage password/i).type('minioadmin');
  cy.findByLabelText(/object storage bucket/i).type('test-bucket');

  // save it
  cy.findByRole('button', { name: /save/i }).click();
});

Cypress.Commands.add('deleteFile', (name: string): void => {
  cy.exec(`find build/cypress-tests/ -name "${name}" -delete`, {
    failOnNonZeroExit: false
  });
});

Cypress.Commands.add('createPipeline', ({ name, type } = {}): void => {
  if (name === undefined) {
    switch (type) {
      case 'kfp':
        cy.get(
          '.jp-LauncherCard[data-category="Elyra"][title="Kubeflow Pipelines Pipeline Editor"]'
        ).click();
        break;
      case 'airflow':
        cy.get(
          '.jp-LauncherCard[data-category="Elyra"][title="Apache Airflow Pipeline Editor"]'
        ).click();
        break;
      default:
        cy.get(
          '.jp-LauncherCard[data-category="Elyra"][title="Generic Pipeline Editor"]'
        ).click();
        break;
    }
  } else {
    cy.writeFile(`build/cypress-tests/${name}`, '');
    cy.openFile(name);
  }

  cy.get('.common-canvas-drop-div');
  // wait an additional 300ms for the list of items to settle
  cy.wait(300);
});

Cypress.Commands.add('openDirectory', (name: string): void => {
  cy.findByRole('listitem', {
    name: (n, _el) => n.includes(name)
  }).dblclick();
});

Cypress.Commands.add('addFileToPipeline', (name: string): void => {
  cy.findByRole('listitem', {
    name: (n, _el) => n.includes(name)
  }).rightclick();
  cy.findByRole('menuitem', { name: /add file to pipeline/i }).click();
});

Cypress.Commands.add('dragAndDropFileToPipeline', (name: string): void => {
  const dragItem = cy.findByRole('listitem', {
    name: (n, _el) => n.includes(name)
  });

  dragItem.trigger('mousedown', { button: 0 });

  // drop item into canvas
  cy.get('.d3-svg-background')
    .trigger('mousemove')
    .trigger('mouseup', { button: 0, force: true })
    .wait(100);
});

Cypress.Commands.add('savePipeline', (): void => {
  cy.findByRole('button', { name: /save pipeline/i }).click();
  // can take a moment to register as saved in ci
  cy.wait(1000);
});

Cypress.Commands.add('openFile', (name: string): void => {
  cy.findByRole('listitem', {
    name: (n, _el) => n.includes(name),
    timeout: 50000
  }).dblclick();
});

Cypress.Commands.add('bootstrapFile', (name: string): void => {
  cy.readFile(`tests/assets/${name}`).then((file: any) => {
    cy.writeFile(`build/cypress-tests/${name}`, file);
  });
});

Cypress.Commands.add('resetJupyterLab', (): void => {
  // open jupyterlab with a clean workspace
  cy.visit('?token=test&reset');
  cy.findByRole('tab', { name: /file browser/i, timeout: 25000 }).should(
    'exist'
  );
});

Cypress.Commands.add('checkTabMenuOptions', (fileType: string): void => {
  cy.findByRole('tab', { name: /\.pipeline/i }).rightclick();
  cy.findAllByRole('menuitem', { name: new RegExp(fileType, 'i') }).should(
    'exist'
  );
  //dismiss menu
  cy.get('[aria-label="Canvas"]').click({ force: true });
});

Cypress.Commands.add('expandPaletteCategory', ({ type } = {}): void => {
  switch (type) {
    case 'kfp':
      cy.get('.palette-flyout-category[value="Preloaded KFP"]').click();
      break;
    case 'airflow':
      cy.get('.palette-flyout-category[value="Preloaded Airflow"]').click();
      break;
    default:
      cy.get('.palette-flyout-category[value="Elyra"]').click();
      break;
  }
});

Cypress.Commands.add('closeTab', (index: number): void => {
  cy.get('.lm-TabBar-tabCloseIcon:visible')
    .eq(index)
    .click();
});
