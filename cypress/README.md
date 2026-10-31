<!--
{% comment %}
Copyright 2018-2026 Elyra Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
{% endcomment %}
-->

# Testing
## Frontend Test Development
The frontend of Elyra utilizes a testing framework called [Cypress](cypress.io).
Cypress includes a useful UI for developing and debugging tests, which can be used by
running `npm test-debug` from the root directory of this project. To run tests that output
a detailed log instead of opening the Cypress UI, run `npm test`. Tests can also be run
from the makefile by running `make test`. The spec code for tests is located in
the `cypress/tests/` directory.

## Test server configuration
`yarn start` (used by `make test-integration`) launches JupyterLab with
`cypress/test-config.py` and prepends `cypress/jupyter-config` to
`JUPYTER_CONFIG_PATH`. Its `labconfig/page_config.json` disables two plugins.
`@jupyterlab/application-extension:dirty` cancels page unloads while a document
has unsaved changes. Once the page has had a real user gesture (for example a
cypress-real-events command such as `realClick` or `realMouseDown`), Electron
honours that cancel silently, so without disabling it a test that fails
mid-edit makes the next `cy.visit()` hang until `pageLoadTimeout`.
`@jupyterlab/apputils-extension:announcements` is disabled so its news/update
notification does not pop up over the UI under test. The settings apply only to
the test server, not to your own JupyterLab.
