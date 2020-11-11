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

# Visualizing output from your notebooks or Python scripts in the Kubeflow Pipelines UI

If you are running a pipeline on Kubeflow Pipelines your notebooks and Python scripts can produce output that is visualized in the Kubeflow Pipelines UI, such as a confusion matrix, ROC curve, or generic markdown.

To produce output add code to your notebook or Python script that creates a file named `mlpipeline-ui-metadata.json` in the current working directory. Refer to [Visualize Results in the Pipelines UI](https://www.kubeflow.org/docs/pipelines/sdk/output-viewer/#introduction) in the Kubeflow Pipelines documentation to learn about supported visualizations and the format of the `mlpipeline-ui-metadata.json` file. 

> The output is not displayed in the Kubeflow Pipelines UI while the notebook or Python script is still running.

## Example code

If you include this example code 

```
import json

metadata = {
    'outputs': [
        {
            'storage': 'inline',
            'source': 'This output was produced by a notebook or script.',
            'type': 'markdown'
        }
    ]
}

with open('mlpipeline-ui-metadata.json', 'w') as f:
    json.dump(metadata, f)
```

in your notebook or Python script, the value of the `source` property is rendered in the Kubeflow Pipelines UI when you select it's node in the graph and open the `Artifacts` tab:

![Example notebook output](../images/kfp_ui_node_metadata.png)