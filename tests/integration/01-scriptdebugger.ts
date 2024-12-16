/*
 * Copyright 2018-2023 Elyra Authors
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

const TESTFILE = 'helloworld.py';
const TIMEOUT = 50000;

describe('Script debugger tests', () => {
  before(() => {
    cy.resetJupyterLab();
    cy.bootstrapFile(TESTFILE);
  });

  afterEach(() => {
    cy.closeTab(-1);
  });

  after(() => {
    cy.deleteFile(TESTFILE);
  });

  it(
    'test for debugger button to be enabled for default Python kernel',
    { defaultCommandTimeout: TIMEOUT },
    () => {
      openFile(TESTFILE);
      checkDefaultKernelSelection();
      checkDebuggerButtonEnabled(true);
    }
  );

  it(
    'test for debugger button state persistence on page reload',
    { defaultCommandTimeout: TIMEOUT },
    () => {
      openFile(TESTFILE);
      checkDefaultKernelSelection();
      checkDebuggerButtonEnabled(true);
      cy.reload();
      checkDebuggerButtonEnabled(true);
    }
  );

  it(
    'test for debugger button state persistence on reopening editor tab',
    { defaultCommandTimeout: TIMEOUT },
    () => {
      openFile(TESTFILE);
      checkDefaultKernelSelection();
      checkDebuggerButtonEnabled(true);
      cy.closeTab(-1);
      // Reopen editor
      openFile(TESTFILE);
      checkDebuggerButtonEnabled(true);
    }
  );

  it(
    'test for debugger button disabled for default kernel without debug support',
    { defaultCommandTimeout: TIMEOUT },
    () => {
      cy.resetJupyterLab();
      cy.createNewScriptEditor('Python');
      cy.get(
        '.elyra-ScriptEditor .jp-Toolbar select > option[value*=python]'
      ).should('not.exist');
      checkDebuggerButtonEnabled(false);
      cy.deleteFile('untitled.py');
    }
  );
});

// ------------------------------
// ----- Utility Functions
// ------------------------------

const checkDefaultKernelSelection = (): void => {
  cy.get('.elyra-ScriptEditor .jp-Toolbar select > option[value=python3]');
};

const checkDebuggerButtonEnabled = (enabled: boolean): void => {
  const buttonElem = cy.get(
    'jp-button.jp-DebuggerBugButton[title="Enable Debugger"]'
  );

  enabled
    ? buttonElem.should('not.be.disabled')
    : buttonElem.should('not.exist');
};

const openFile = (fileName: string): void => {
  cy.findByRole('menuitem', { name: /file/i }).click();
  cy.findByText(/^open from path$/i).click({ force: true });
  cy.get('input#jp-dialog-input-id')
    .clear()
    .type(`/${fileName}`, { force: true })
    .should('have.value', `/${fileName}`);

  cy.get('.lm-Panel .jp-mod-accept').click();
};
