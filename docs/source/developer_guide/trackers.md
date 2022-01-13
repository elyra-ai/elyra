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
## Extension Trackers

This section will go over how extension trackers in Elyra are created and how they can be used.

JupyterLab is designed to follow a modular architecture, where every component is built to be extended. Extensions interact with each other through [token objects](https://jupyterlab.readthedocs.io/en/stable/extension/extension_points.html?#core-tokens), such as [widget trackers](https://jupyterlab.readthedocs.io/en/stable/extension/extension_points.html?token#widget-tracker). Widget trackers keep track of widget instances on an application shell, also commonly used to restore their state.

Since Elyra is a collection of JupyterLab extensions, every extension in Elyra requires core extension tokens in order to interact with them and implement its own usage. Elyra also exposes their own trackers to the application, which are currently being used for restoring state upon page reload, but could also be used by further extensions to add their own widgets.

### Script Editor Trackers
The Python Editor and R Editor extensions in Elyra extends [JupyterLab File Editor](https://jupyterlab.readthedocs.io/en/stable/api/classes/fileeditor.fileeditor-2.html).
They are implemented by a common `ScriptEditor` class.

When the Python and R Editor extensions are activated, they request a File Editor Tracker. This is how the extensions are able to track the editor widget it extends.
In order to File Editors to recognize Python and R script editor widgets as File Editors, which they are, the script editor widgets are added to the File Editor Tracker, therefore both can properly inherit all default components and behaviors of a File Editor.

Both Python Editor and R Editor widgets have their own trackers, which are used by the ILayoutRestorer to track their state and allow activity restoration on page refresh.
The Python Editor [WidgetTracker](https://jupyterlab.readthedocs.io/en/stable/api/classes/apputils.widgettracker-1.html) is defined as:
```
const tracker = new WidgetTracker<ScriptEditor>({
  namespace: PYTHON_EDITOR_NAMESPACE
});
```
where
```
PYTHON_EDITOR_NAMESPACE = 'elyra-python-editor-extension'
```
Similarly, the R Editor tracker is defined as:
```
const tracker = new WidgetTracker<ScriptEditor>({
  namespace: R_EDITOR_NAMESPACE
});
```
where
```
R_EDITOR_NAMESPACE = 'elyra-r-editor-extension'
```

### Pipeline Editor Trackers
The Pipeline Editor extension in Elyra extends [JupyterLab Document Widget](https://jupyterlab.readthedocs.io/en/latest/extension/documents.html). Similar to the Script Editor widget trackers, the Pipeline Editor tracker is used by a restorer, and it is defined as below
```
const tracker = new WidgetTracker<DocumentWidget>({
  namespace: PIPELINE_EDITOR_NAMESPACE
});
```
where `PIPELINE_EDITOR_NAMESPACE = 'elyra-pipeline-editor-extension'`

In this case, Pipeline Editor tracker has a broader scope when compared to the Script Editor tracker, as it allows other Document Widget instances to be added to it. For instance, if Pipeline Editor is further extended, its API would allow it to have a new File Editor widget, which actually is a `DocumentWidget<FileEditor>` type.

More information about the architecture of Document Widgets can be found in [JupyterLab documentation](https://jupyterlab.readthedocs.io/en/stable/index.html).
