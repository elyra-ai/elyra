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

describe('Pipeline Editor tests', () => {
  beforeEach(() => {
    cy.readFile('tests/assets/helloworld.ipynb').then((file: any) => {
      cy.writeFile('build/cypress-tests/helloworld.ipynb', file);
    });
    cy.readFile('tests/assets/helloworld.py').then((file: any) => {
      cy.writeFile('build/cypress-tests/helloworld.py', file);
    });
    // open jupyterlab with a clean workspace
    cy.visit('?token=test&reset').wait(1000);
  });

  afterEach(() => {
    // delete runtime configuration used for testing
    cy.exec('find build/cypress-tests/ -name helloworld.ipynb -delete', {
      failOnNonZeroExit: false
    });
    // delete runtime configuration used for testing
    cy.exec('find build/cypress-tests/ -name helloworld.py -delete', {
      failOnNonZeroExit: false
    });
    // delete runtime configuration used for testing
    cy.exec('find build/cypress-tests/ -name *.pipeline -delete', {
      failOnNonZeroExit: false
    });
    // delete runtime configuration used for testing
    cy.exec('elyra-metadata remove runtimes --name=test_runtime', {
      failOnNonZeroExit: false
    });
  });

  it('empty editor should have disabled buttons', () => {
    openPipelineEditor();

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

    const enabledButtons = [
      '.save-action',
      '.openRuntimes-action',
      '.createAutoComment-action'
    ];
    checkEnabledToolbarButtons(enabledButtons);

    closePipelineEditor();
  });

  it('populated editor should have enabled buttons', () => {
    openPipelineEditor();
    // add Notebook
    getFileByName('helloworld.ipynb').click();
    getFileByName('helloworld.ipynb').rightclick();
    cy.get('[data-command="pipeline-editor:add-node"]').click();
    // add Python Script
    getFileByType('python').trigger('mousedown', { button: 0 });
    cy.get('.d3-svg-background')
      .trigger('mousemove')
      .trigger('mouseup', { button: 0, force: true })
      .wait(100);
    // check buttons
    const disabledButtons = [
      '.redo-action',
      '.cut-action',
      '.copy-action',
      '.deleteSelectedObjects-action'
    ];
    checkDisabledToolbarButtons(disabledButtons);

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

    closePipelineEditorWithoutSaving();
  });

  it('should save runtime configuration', () => {
    openPipelineEditor();
    // open runtimes sidebar
    cy.get('.openRuntimes-action button').click();
    cy.get('.jp-SideBar .lm-mod-current[title="Runtimes"]');
    cy.get('.elyra-metadata .elyra-metadataHeader').contains('Runtimes');
    // Add a runtime config (a placeholder for now, can't be used to run or export yet)
    cy.get(
      'button.elyra-metadataHeader-button[title="Create new Kubeflow Pipelines runtime"]'
    ).click();
    cy.get('.elyra-metadataEditor-form-display_name').type('Test Runtime');
    cy.get('.elyra-metadataEditor-form-api_endpoint').type(
      'https://kubernetes-service.ibm.com/pipeline'
    );
    cy.get('.elyra-metadataEditor-form-cos_endpoint').type(
      'http://minio-service.kubeflow:9000'
    );
    cy.get('.elyra-metadataEditor-form-cos_username').type('minio');
    cy.get('.elyra-metadataEditor-form-cos_password').type('minio123');
    cy.get('.elyra-metadataEditor-form-cos_bucket').type('test-bucket');
    // save it
    cy.get('.elyra-metadataEditor-saveButton > .bp3-form-content > button')
      .click()
      .wait(100);
    // validate it is now available
    cy.get('#elyra-metadata span.elyra-expandableContainer-name').contains(
      'Test Runtime'
    );
    closePipelineEditorWithoutSaving();
  });

  it('should fail to run invalid pipeline', () => {
    // Copy invalid pipeline
    cy.readFile('tests/assets/invalid.pipeline').then((file: any) => {
      cy.writeFile('build/cypress-tests/invalid.pipeline', file);
    });
    // opens pileine from the file browser
    cy.get('.jp-DirListing-content > [data-file-type="pipeline"]').dblclick();
    // try to run invalid pipeline
    cy.get('.run-action button').click();
    cy.get('.MuiAlert-message').should('be.visible');
    cy.get('.d3-node-dec-image').should('exist');

    // closes alert message
    // cy.get('.MuiAlert-action > button[aria-label="close"]').click();
  });

  it('should fail to export invalid pipeline', () => {
    // Copy invalid pipeline
    cy.readFile('tests/assets/invalid.pipeline').then((file: any) => {
      cy.writeFile('build/cypress-tests/invalid.pipeline', file);
    });
    // opens pileine from the file browser
    cy.get('.jp-DirListing-content > [data-file-type="pipeline"]').dblclick();
    // try to export invalid pipeline
    cy.get('.export-action button').click();
    cy.get('.MuiAlert-message').should('be.visible');
    cy.get('.d3-node-dec-image').should('exist');

    // closes alert message
    // cy.get('.MuiAlert-action > button[aria-label="close"]').click();
  });

  it('should run pipeline after adding runtime image', () => {
    openPipelineEditor();
    // add Notebook
    getFileByName('helloworld.ipynb').click();
    getFileByName('helloworld.ipynb').rightclick();
    cy.get('[data-command="pipeline-editor:add-node"]').click();
    // Adds runtime image to new node
    cy.get('.d3-node-label').rightclick();
    cy.get('.react-contextmenu-item:nth-child(9)')
      .contains('Properties')
      .click();
    cy.get('div.properties-dropdown').click();

    // selects the first item of the runtimes dropdown
    cy.get('#downshift-0-item-0').click();
    cy.get('.bx--btn--primary')
      .contains('Save')
      .click();
    // Checks that validation passed
    cy.get('image[data-id="node_dec_image_2_error"]').should('not.exist');
    // try to run pipeline
    cy.get('.run-action button').click();

    // Input name should match pipeline name
    cy.get('input#pipeline_name[data-form-required="true"]')
      .should('exist')
      .should('have.value', 'untitled');

    // Runtime option should be pre-populated with local config
    cy.get('select#runtime_config[data-form-required="true"]')
      .should('exist')
      .select('Run in-place locally')
      .should('have.value', 'local');

    // execute
    cy.get('button.jp-mod-accept').click();
    cy.wait(100);
    // dismiss 'Making request' dialog
    cy.get('button.jp-mod-accept').click();
    cy.wait(100);
    // validate job was executed successfully
    cy.get('.jp-Dialog-header').contains('Job execution succeeded');
    // dismiss 'Job Succeeded' dialog
    cy.get('button.jp-mod-accept').click();
  });
});

// ------------------------------
// ----- Utility Functions
// ------------------------------

const openPipelineEditor = (): void => {
  cy.get(
    '.jp-LauncherCard[data-category="Elyra"][title="Pipeline Editor"]'
  ).click();
  cy.get('.common-canvas-drop-div');
  // cy.wait(200);
};

const closePipelineEditor = (): void => {
  cy.get(
    '.lm-TabBar-tab.lm-mod-current > .lm-TabBar-tabCloseIcon:visible'
  ).click();
};

const closePipelineEditorWithoutSaving = (): void => {
  cy.get(
    '.lm-TabBar-tab.lm-mod-current > .lm-TabBar-tabCloseIcon:visible'
  ).click();
  cy.get('button.jp-mod-reject').click();
  cy.get('.jp-Dialog-content').should('not.be.visible');
};

const getFileByName = (name: string): any => {
  return cy.get(`.jp-DirListing-itemText:contains(${name})`);
};

const getFileByType = (type: string): any => {
  return cy.get(`.jp-DirListing-content > [data-file-type="${type}"]`);
};

const deleteFileByName = (name: string): any => {
  getFileByName(`${name}`).rightclick();
  cy.get('.p-Menu-content > [data-command="filebrowser:delete"]').click();
  cy.get('.jp-mod-accept > .jp-Dialog-buttonLabel')
    .should('be.visible')
    .click();
  cy.wait(100);
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
