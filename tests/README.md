<!--
{% comment %}
Copyright 2017-2020 IBM Corporation

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
The frontend of Elyra utilizes a testing framework called [Cypress](cypress.io). Cypress includes a useful UI for developing and debugging tests, which can be used by running `npm test-debug` from the root directory of this project. To run tests that output a detailed log instead of opening the Cypress UI, run `npm test`. Tests can also be run from the makefile by running `make test`. The spec code for tests is located in the `integration/` directory.
