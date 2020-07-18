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

  it('opens blank pipeline editor', () => {
    cy.get(
      '.lm-TabBar-tab[data-id="launcher-0"] > .lm-TabBar-tabCloseIcon:visible'
    ).click({ multiple: true });
    cy.get('.jp-ToolbarButtonComponent[title="New Launcher"]').click();
    cy.get('.jp-Launcher-cardContainer > [title="Pipeline Editor"]')
      .scrollIntoView()
      .click();
  });

  it('checks for disabled buttons', () => {
    cy.get('#canvas-toolbar').then(($toolbar: any) => {
      // Test disabled svg tags
      expect(
        $toolbar.find('svg.canvas-icon[disabled=""][type="run"]')
      ).to.have.length(1);
      expect(
        $toolbar.find('svg.canvas-icon[disabled=""][type="undo"]')
      ).to.have.length(1);
      expect(
        $toolbar.find('svg.canvas-icon[disabled=""][type="redo"]')
      ).to.have.length(1);
      expect(
        $toolbar.find('svg.canvas-icon[disabled=""][type="cut"]')
      ).to.have.length(1);
      expect(
        $toolbar.find('svg.canvas-icon[disabled=""][type="copy"]')
      ).to.have.length(1);
      expect(
        $toolbar.find('svg.canvas-icon[disabled=""][type="paste"]')
      ).to.have.length(1);
      expect(
        $toolbar.find('svg.canvas-icon[disabled=""][type="delete"]')
      ).to.have.length(1);
      expect(
        $toolbar.find(
          'svg.canvas-icon[disabled=""][type="arrangeHorizontally"]'
        )
      ).to.have.length(1);
      expect(
        $toolbar.find('svg.canvas-icon[disabled=""][type="arrangeVertically"]')
      ).to.have.length(1);

      // Test disabled img tags
      expect(
        $toolbar.find('img.toolbar-icons[disabled=""]#toolbar-icon-export')
      ).to.have.length(1);
      expect(
        $toolbar.find('img.toolbar-icons[disabled=""]#toolbar-icon-clear')
      ).to.have.length(1);
    });
  });

  it('checks save and addComment buttons are enabled', () => {
    cy.get('#toolbar-icon-save');
    cy.get('#toolbar-icon-save[disabled=""]').should('not.exist');

    cy.get('svg.canvas-icon[type="addComment"]');
    cy.get('svg.canvas-icon[type="addComment"][disabled=""]').should(
      'not.exist'
    );
  });

  // TODO:
  // - Drag and drop a notebook to pipeline editor
  // - Test expected buttons are enabled: run,save,export, clear, undo, cut,copy,delete, arrangeHorizontally, arrangeVertivally
});
