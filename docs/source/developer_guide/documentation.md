<!--
{% comment %}
Copyright 2018-2021 Elyra Authors

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

## Elyra documentation

The Elyra documentation's source is stored in the https://github.com/elyra-ai/elyra repository and hosted at https://elyra.readthedocs.io/. The documentation is written in [markdown](https://www.sphinx-doc.org/en/master/usage/markdown.html) and built using [Sphinx](https://www.sphinx-doc.org/en/master/).


### Contributing to the Elyra documentation

To contribute content to the Elyra documentation follow these steps:

1. Fork the https://github.com/elyra-ai/elyra repository.

1. Clone your fork.

   ```
   git clone https://github.com/git-id-or-org/elyra
   ```

   The documentation assets are located in the `/docs` directory.

   - To add a new document create a new markdown file in the appropriate section subdirectory (e.g. `/docs/source/getting_started`) and add an entry to that section in `/docs/source/index.rst`.
   - To update an existing document edit the corresponding markdown file.
   - Place new or updated images in the `/docs/source/images` directory. `PNG` is the recommended format.

1. Build the documentation assets locally.

   In the repository's _root directory_ (not the `/docs` directory) run

   ```
   make docs
   ```

1. Review the build output and verify that your updates introduced no warnings or errors. 

1. Review the updated documentation assets.
    1. Navigate to the `/docs/_build/html/` directory.
    1. Open `index.html` in a web browser.

1. Commit your updates to a new branch and open a pull request.
