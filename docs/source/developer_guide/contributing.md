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
# Conventions for contributing to Elyra Extensions
## File Naming and File Creation
 Elyra extensions use a separate file for each widget, and keep helper functions and classes in the file with that widget. A file containing a widget is named after the widget (i.e. `PythonFileEditor.tsx` contains the class `PythonFileEditor`).

Files containing util functions are named generically after the utils functionality (i.e. if a util function returned a custom dialog, the file that contained that function would be called `dialog.tsx`).

The index file contains only the definition of the extension class and any other exports that the extension creates.
## Import sections
Elyra extensions create separate sections for imports from different categories (i.e. all imports from `@jupyterlab` would be in a separate section from imports from `@lumino`). Sections are separated by a blank line. Each section is alphabetized by the name of packages.
