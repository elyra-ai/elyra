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

  it('test for debugger button to be enabled for default Python kernel', () => {
    cy.createNewScriptEditor('Python');
    cy.wait(1000);
    checkDefaultKernelSelection();
    checkDebuggerButtonEnabled(true);
  });

  it('test for debugger button state persistance on page reload', () => {
    cy.createNewScriptEditor('Python');
    cy.wait(1000);
    checkDefaultKernelSelection();
    checkDebuggerButtonEnabled(true);
    cy.reload();
    cy.wait(1000);
    checkDebuggerButtonEnabled(true);
  });

  it('test for debugger button state persistance on reopening editor tab', () => {
    cy.createNewScriptEditor('Python');
    cy.wait(1000);
    checkDefaultKernelSelection();
    checkDebuggerButtonEnabled(true);
    cy.closeTab(-1);
    openFile('untitled.py');
    cy.wait(1000);
    checkDebuggerButtonEnabled(true);
  });

  //  TODO: Open new bug report for the failing test below
  // it('test for debugger button disabled for default kernel without debug support', () => {
  //   cy.createNewScriptEditor('R');
  //   cy.wait(1000);
  //   cy.get(
  //     '.elyra-ScriptEditor .jp-Toolbar select > option[value*=python]'
  //   ).should('not.exist');
  //   checkDebuggerButtonEnabled(false); // No debug button rendered on first load
  // });
});

// ------------------------------
// ----- Utility Functions
// ------------------------------

const checkDefaultKernelSelection = (): void => {
  cy.get('.elyra-ScriptEditor .jp-Toolbar select > option[value=python3]');
};

const checkDebuggerButtonEnabled = (enabled: boolean): void => {
  enabled
    ? cy
        .get('button.jp-DebuggerBugButton[title="Enable Debugger"]')
        .should('not.be.disabled')
    : cy
        .get(
          'button.jp-DebuggerBugButton[title="Select a kernel that supports debugging to enable debugger"]'
        )
        .should('be.disabled');
};

const openFile = (fileName: string) => {
  cy.findByRole('menuitem', { name: /file/i }).click();
  cy.findByText(/^open from path$/i).click({ force: true });
  cy.get('input#jp-dialog-input-id').type(`/${fileName}`);
  cy.get('.p-Panel .jp-mod-accept').click();
};
