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

describe('Elyra launcher is in use', () => {
  beforeEach(() => {
    cy.resetJupyterLab();
  });

  it('should have Elyra extensions', () => {
    // cy.get('.jp-ToolbarButtonComponent[title="New Launcher"]').click({
    //   force: true
    // });
    // Jupyter notebook default kernel is available
    cy.get(
      '.jp-LauncherCard[data-category="Notebook"][title*="Python 3"]:visible'
    );
    // Generic Pipeline editor extension is available
    cy.get(
      '.jp-LauncherCard[data-category="Elyra"][title="Generic Pipeline Editor"]:visible'
    );
    // Two specific runtime pipeline editor extension is available
    cy.get(
      '.jp-LauncherCard[data-category="Elyra"][title="Apache Airflow Pipeline Editor"]:visible'
    );
    cy.get(
      '.jp-LauncherCard[data-category="Elyra"][title="Kubeflow Pipelines Pipeline Editor"]:visible'
    );
    // Script editor extension is available
    cy.get(
      '.jp-LauncherCard[data-category="Elyra"][title="Create a new Python file"]:visible'
    );
    cy.get(
      '.jp-LauncherCard[data-category="Elyra"][title="Create a new R file"]:visible'
    );
    // Documentation link is available
    cy.get(
      '.jp-LauncherCard[data-category="Elyra"][title="Documentation"]:visible'
    );
  });
});
