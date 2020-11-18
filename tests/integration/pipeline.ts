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

const cancelPipelineActionDialog = (): void => {
  cy.get('button.jp-mod-reject').click();
  cy.get('.jp-Dialog-content').should('not.be.visible');
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
      '.paste-action',
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
      '.paste-action',
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

  // Add a runtime config (a placeholder for now, can't be used to run or export yet)
  it('creates a runtime', () => {
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

    cy.get(
      '.elyra-metadataEditor-saveButton > .bp3-form-content > button'
    ).click();
  });

  it('checks new runtime is displayed', () => {
    cy.get('#elyra-metadata span.elyra-expandableContainer-name').contains(
      'Test Runtime'
    );
  });

  it('runs invalid pipeline', () => {
    cy.get('.run-action button').click();
    cy.get('.MuiAlert-message').should('be.visible');
    cy.get('.d3-node-dec-image').should('exist');

    // closes alert message
    cy.get('.MuiAlert-action > button[aria-label="close"]').click();
  });

  it('exports invalid pipeline', () => {
    cy.wait(1000);
    cy.get('.export-action button').click();
    cy.get('.MuiAlert-message').should('be.visible');
    cy.get('.d3-node-dec-image').should('exist');

    // closes alert message
    cy.get('.MuiAlert-action > button[aria-label="close"]').click();
  });

  it('adds runtime image to node properties', () => {
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
  });

  it('checks node is now valid', () => {
    cy.get('image[data-id="node_dec_image_2_error"]').should('not.exist');
  });

  it('tests valid run form dialog', () => {
    cy.get('.run-action button').click();
    cy.get('.jp-Dialog-content').should('be.visible');

    // Input name should match pipeline name
    cy.get('input#pipeline_name[data-form-required="true"]')
      .should('exist')
      .should('have.value', 'untitled');

    // Runtime option should be pre-populated with local config
    cy.get('select#runtime_config[data-form-required="true"]')
      .should('exist')
      .select('Run in-place locally')
      .should('have.value', 'local');

    cy.get('button.jp-mod-accept').should('not.be.disabled');
    cancelPipelineActionDialog();
  });

  // NOTE: Pipeline name input cannot be edited
  // Issue: https://github.com/elyra-ai/elyra/issues/944
  // Uncomment the test below when adding a fix PR for the issue above

  // it('tests invalid run pipeline form dialog', () => {
  //   cy.get('.run-action button').click();
  //   cy.get('.jp-Dialog-content').should('be.visible');
  //
  //   // clear input name
  //   cy.get('input#pipeline_name').type(' ');
  //   // ok button should be disabled
  //   cy.get('button.jp-mod-accept').should('be.disabled');
  //
  //   cancelPipelineActionDialog();
  // });

  it('tests valid export form dialog', () => {
    cy.get('.export-action button').click();
    cy.get('.jp-Dialog-content').should('be.visible');

    cy.get('select#runtime_config[data-form-required="true"]').should('exist');
    cy.get('select#pipeline_filetype[data-form-required="true"]').should(
      'exist'
    );

    cy.get('button.jp-mod-accept').should('not.be.disabled');

    cancelPipelineActionDialog();
  });

  // TODO:
  // - Drag and drop a notebook to pipeline editor
  // - Add a valid runtime image for testing run and export (complete end to end tests)
});
