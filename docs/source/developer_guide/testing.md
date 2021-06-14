# Contributing to frontend tests
Elyra uses two types of frontend tests: integration tests (which use [cypress](https://docs.cypress.io/)) and unit tests (which use [jest](https://jestjs.io/docs/en/getting-started)). 
## Integration tests
Before running integration tests, docker needs to be installed and running on your machine. There are two ways to run the integration tests: to only see the output logs from all of the integration tests, run `make test-integration` from the root directory. To debug tests that are going wrong or develop new tests, run `make test-integration-debug` - this will open an interactive tool for writing and debugging tests.

Elyra's integration tests automatically start JupyterLab and visit / interact with pages through cypress API calls. The tests use the cypress API to check for the existence of various buttons and visual elements. Refer to the [cypress API](https://docs.cypress.io/api/api/table-of-contents.html) for more details.

New integration tests can be added to `tests/integration`. 

## Unit tests
To run all of the unit tests, use `make test-ui-unit` from the root directory. To run the unit tests for a specific Elyra package, simply run `jest` from that package's directory (under `packages/`). For writing tests, `jest` has a watch mode option: just run `jest --watch`. 

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
"@jupyterlab/testutils": "^1.0.0",
"@types/enzyme": "^3.10.5",
"@types/enzyme-adapter-react-16": "^1.0.6",
"@types/jest": "^23.3.11",
"enzyme": "^3.11.0",
"enzyme-adapter-react-16": "^1.15.3",
"install": "^0.13.0",
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
