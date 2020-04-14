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

# Elyra Code Snippets - Experimental

The ability to reuse pieces of code allows users to avoid doing repetitive work, 
making the programming workflow much more simple and productive.
Elyra supports custom code snippets that can be added to the file editor.

![Code Snippet Sample](../source/images/code-snippet-expanded.png)

## Code Snippet data
This extension uses [Elyra Metadata Service](https://github.com/elyra-ai/elyra/blob/master/docs/dev/metadata.md)
and requires configuring code snippets metadata in order to retrieve and display snippets in the UI.
To configure metadata for code snippets, locate `[JUPYTER DATA DIR]/metadata/` folder and create the subdirectory `code-snippets/`.
This is where code snippet json files are stored, following a schema defined in 
[code snippets metadata](https://github.com/elyra-ai/elyra/blob/master/elyra/metadata/schemas/code-snippet.json)

This is a sample json file:
```json
{
	"schema_name": "code-snippet",
	"display_name": "is_even",
	"metadata": {
		"description": "Check if number is even",
		"language": "python",
		"code": [
			"def is_even(num):",
			"   return num % 2 == 0"
		]
	}
}
```
NOTE: `code` field content must be a string array split by line.

Once code snippet extension is in use, the application component retrieves the metadata from the server 
through a REST API, and displays each snippet by `display_name` in the extension UI.
Each snippet item can then be expanded on click, also displaying the `code` content.
Currently, the application does not support full integration of adding the code into the editor by
clicking the `+` button, although it does allow the user to manually copy the snippet and paste it
in the editor.