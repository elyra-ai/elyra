/*
 * Copyright 2018-2022 Elyra Authors
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

describe('Script Runner tests', () => {
  before(() => {
    cy.resetJupyterLab();
    cy.bootstrapFile('helloworld.py'); // load python file used to check existing contents
  });

  after(() => {
    // delete files created for testing
    cy.deleteFile('helloworld.py'); // delete python file used for testing

    // Delete runtime configuration used for testing
    cy.exec('elyra-metadata remove runtimes --name=test_runtime', {
      failOnNonZeroExit: false
    });
  });

  // Python Tests
  it('opens new output console', () => {
    cy.get('button[title="Run"]').click();
    cy.get('[id=tab-ScriptEditor-output]').should(
      'have.text',
      'Python Console Output'
    );
  });

  it('opens new output console', () => {
    cy.get('button[title="Run"]').click();
    cy.get('button[title="Top"]').should('be.visible');
    cy.get('button[title="Bottom"]').should('be.visible');
  });
});
