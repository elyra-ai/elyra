## Code Snippets - Experimental

The ability to reuse pieces of code allows users to avoid doing repetitive work, 
making the programming workflow much more simple and productive.
Elyra supports custom code snippets that can be added to the file editor.

![Code Snippets](../images/code-snippets.png)

### Code Snippet data
This extension uses [Elyra Metadata Service](../developer_guide/metadata)
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

![Code Snippet Sample](../images/code-snippet-expanded.png)

Currently, the application does not support full integration of adding the code into the editor by
clicking the `+` button, although it does allow the user to manually copy the snippet and paste it
in the editor.