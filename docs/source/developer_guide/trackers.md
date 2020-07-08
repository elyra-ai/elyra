<!--
{% comment %}
Copyright 2018-2020 IBM Corporation

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

JupyterLab is designed to follow a modular architecture, where every component is built to be extended. Extensions interact with each other through [token objects](https://jupyterlab.readthedocs.io/en/stable/developer/extension_dev.html#core-tokens), such as [widget trackers](https://jupyterlab.readthedocs.io/en/stable/developer/extension_points.html#widget-tracker). Widget trackers keep track of widget instances on an application shell, also commonly used to restore their state.

Since Elyra is a collection of JupyterLab extensions, every extension in Elyra requires core extension tokens in order to interact with them and implement its own usage. Elyra also exposes their own trackers to the application, which are currently being used for restoring state upon page reload, but could also be used by further extensions to add their own widgets.

### Python File Editor Trackers
The Python Editor extension in Elyra extends [JupyterLab File Editor](https://jupyterlab.github.io/jupyterlab/fileeditor/classes/fileeditor.html).

When Python File Editor extension is activated, it requests an [File Editor Tracker](https://jupyterlab.github.io/jupyterlab/fileeditor/interfaces/ieditortracker.html). This is how the extension is able to track the editor widget it extends.
In order to File Editors to recognize Python File Editor widgets as File Editors, which they are, the Python Editor widget is then added to the File Editor Tracker, therefore it can properly inherit all default components and behaviors of a File Editor.

Python File Editor widget has its own tracker, which is used by the [restorer](https://jupyterlab.github.io/jupyterlab/application/interfaces/ilayoutrestorer.html) to track the widget state and allow activity restoration on page refresh.
```
const tracker = new WidgetTracker<PythonFileEditor>({
  namespace: PYTHON_EDITOR_NAMESPACE
});
```
where `PYTHON_EDITOR_NAMESPACE = 'elyra-python-editor-extension'`


### Pipeline Editor Trackers
The Pipeline Editor extension in Elyra extends [JupyterLab Document Widget](https://jupyterlab.github.io/jupyterlab/docregistry/classes/documentwidget.html). Similar to the Python Editor widget tracker, the Pipeline Editor tracker is used by a restorer, and it is defined as below
```
const tracker = new WidgetTracker<DocumentWidget>({
  namespace: PIPELINE_EDITOR_NAMESPACE
});
```
where `PIPELINE_EDITOR_NAMESPACE = 'elyra-pipeline-editor-extension'`

In this case, Pipeline Editor tracker has a broader scope when compared to the Python Editor tracker, as it allows other Document Widget instances to be added to it. For instance, if Pipeline Editor is further extended, its API would allow it to have a new File Editor widget, which actually is a `DocumentWidget<FileEditor>` type.

More information about the architecture of Document Widgets can be found in [JupyterLab documentation](https://jupyterlab.readthedocs.io/en/stable/developer/documents.html#overview-of-document-architecture)
