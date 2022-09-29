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

describe('Script debugger tests', () => {
  before(() => {
    cy.resetJupyterLab();
  });

  afterEach(() => {
    cy.closeTab(-1);
  });

  after(() => {
    // delete files created for testing
    cy.deleteFile('untitled*.py');
    cy.deleteFile('untitled*.r');
  });

  it('checks for debugger button enabled for default ipython kernel', () => {
    cy.createNewScriptEditor('Python');
    cy.wait(1000);
    cy.get('.elyra-ScriptEditor .jp-Toolbar select > option[value=python3]');
    cy.get('button.jp-DebuggerBugButton[title="Enable Debugger"]').should(
      'not.be.disabled'
    );
  });

  it('checks for debugger button disabled for no kernel', () => {
    cy.createNewScriptEditor('R');
    cy.wait(1000);
    cy.get(
      '.elyra-ScriptEditor .jp-Toolbar select > option[value*=python]'
    ).should('not.exist');
    cy.get(
      'button.jp-DebuggerBugButton[title="Select a kernel that supports debugging to enable debugger"]'
    ).should('be.disabled');
  });
});
