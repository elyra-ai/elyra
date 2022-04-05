<!--
{% comment %}
Copyright 2018-2022 Elyra Authors

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
# Contributing to Elyra

Elyra is an open-source project and welcomes contributions from the community be it as code, documentation, scenarios, etc. 

Before you start, look at the project:
- [Code of Conduct](https://github.com/elyra-ai/community/blob/master/code-of-conduct.md)
- [Contribution Guidelines](https://github.com/elyra-ai/community/blob/master/contributing.md)

Also, for details on configuring your development environment, see:
- [Setting up your development environment](development-workflow.md)

## Elyra UI

Elyra runs as extensions to the Jupyter ecosystem, thus it's UI is currently implemented as
[JupyterLab widget extensions](https://jupyterlab.readthedocs.io/en/stable/user/extensions.html).

### Contributing to Elyra UI Extensions

#### Existing UI Extensions

The existing extensions are currently available as individual npm packages inside the
[packages](https://github.com/elyra-ai/elyra/tree/master/packages) folder.

```
elyra
 -- packages
    -- code-snippet
    -- metadata
    -- metadata-common
    -- pipeline-editor
    -- python-editor
    -- r-editor
    -- script-editor
    -- services
    -- theme
    -- ui-components
```

#### File Naming and File Creation conventions
Elyra extensions use a separate file for each widget, and keep helper functions and classes in the file with that widget.
A file containing a widget is named after the widget (i.e. `PipelineEditorWidget.tsx` contains the class `PipelineEditorWidget`).

Files containing util functions are named generically after the utils functionality
(i.e. if a util function returned a custom dialog, the file that contained that function would be called `dialog.tsx`).

The index file contains only the definition of the extension class and any other exports that the extension creates.

#### Import sections conventions
Elyra extensions create separate sections for imports from different categories
(i.e. all imports from `@jupyterlab` would be in a separate section from imports from `@lumino`).
Sections are separated by a blank line. Each section is alphabetized by the name of packages.


### UI Tests
Elyra uses two types of frontend tests: integration tests (which use [cypress](https://docs.cypress.io/))
and unit tests (which use [jest](https://jestjs.io/docs/en/getting-started)). 

#### UI Integration tests
Before running integration tests, docker needs to be installed and running on your machine.
There are two ways to run the integration tests:
* To only see the output logs from all of the integration tests,
run `make test-integration` from the root directory.
* To run or debug specific tests,
run `make test-integration-debug`. This will open an interactive UI tool for writing and debugging individual test files.

Elyra's integration tests automatically start JupyterLab and visit / interact with pages through cypress API calls.
The tests use the cypress API to check for the existence of various buttons and visual elements.
Refer to the [cypress API](https://docs.cypress.io/api/api/table-of-contents.html) for more details.

New integration tests can be added to `tests/integration`. 

#### UI Unit tests
To run all of the unit tests, use `make test-ui-unit` from the root directory. To run the unit tests for a specific Elyra package, simply run `jest` or `npm run test` from that package's directory (under `packages/`). To turn on the watch mode just run `jest --watch` or `npm run test --watch`.

Elyra's unit tests test the various classes and objects used by Elyra extensions. Refer to the [jest API](https://jestjs.io/docs/en/getting-started) for more details. 

To add unit tests for a package that doesn't have tests set up, some configuration files are required. In the directory for the package being tested, add a file titled `jest.config.js` that contains the following:
```
module.exports = require('../../testutils/jest.config');
```
Then, in the `package.json`, add the following under `'scripts'`:
```
"test": "jest",
"build:test": "tsc --build tsconfig.test.json",
```
And the following under `'dev_dependencies'`:
```
"@jupyterlab/testutils": "3.3.0",
"@types/jest": "^23.3.11",
"jest": "^24.7.1",
"jest-raw-loader": "^1.0.1",
"ts-jest": "^24.0.2",
```
Create a file `tsconfig.test.json` that contains:
```
{
  "extends": "../../tsconfigbase.test",
  "include": ["src/*", "test/*"],
  "references": []
}
```

Finally, create a folder called `test` in the `src` directory of the package being tested, and add tests using the file extension `.spec.ts`.

## Elyra Backend

Elyra runs as extensions to the Jupyter ecosystem, thus it's backend is currently implemented as
[JupyterServer server extensions](https://jupyter-server.readthedocs.io/en/latest/developers/extensions.html)
and exposed as REST APIs to frontend clients.


### Elyra backend services 

The existing services are currently available as individual python modules inside the
[elyra](https://github.com/elyra-ai/elyra/tree/master/elyra) folder.

```
elyra
 -- packages
    -- airflow
    -- api
    -- cli
    -- contents
    -- kfp
    -- metadata
    -- pipeline
    -- templates
    -- util
```

### Backend tests
To run all server tests, use `make test-server` from the root directory. There are also two ways to run only specific backend tests:

* To run all tests in a specific directory or file, run `pytest [resource]` where `resource` is the relative path to a directory or file inside the [server tests](https://github.com/elyra-ai/elyra/tree/master/elyra/tests) folder.
* To run specific tests by function name, run `pytest -k [test_function1 test_function2 ...]`


## Elyra documentation

The Elyra documentation's source is stored in the [Elyra repository](https://github.com/elyra-ai/elyra/tree/master/docs) and hosted at [Elyra's Read the Docs](https://elyra.readthedocs.io/). The documentation is written in [Markdown](https://www.sphinx-doc.org/en/master/usage/markdown.html) and built using [Sphinx](https://www.sphinx-doc.org/en/master/).


### Contributing to the Elyra documentation

To contribute content to the Elyra documentation follow these steps:

1. Fork the [repository](https://github.com/elyra-ai/elyra).

2. Clone your fork.

   ```
   git clone https://github.com/git-id-or-org/elyra
   ```

   The documentation assets are located in the `/docs` directory.

   - To add a new document create a new markdown file in the appropriate section subdirectory (e.g. `/docs/source/getting_started`) and add an entry to that section in `/docs/source/index.rst`.
   - To update an existing document edit the corresponding markdown file.
   - Place new or updated images in the `/docs/source/images` directory. For example, images for the _pipeline components_ topic in the _user guide_ are stored in `docs/source/images/user_guide/pipeline-components/`. `PNG` is the recommended format.

3. Build the documentation assets locally.

   In the repository's _root directory_ (not the `/docs` directory) run

   ```
   make docs
   ```

4. Review the build output and verify that your updates introduced no warnings or errors.

5. Review the updated documentation assets.
    1. Navigate to the `/docs/_build/html/` directory.
    1. Open `index.html` in a web browser.

6. Commit your updates to a new branch and open a pull request.
