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
# Troubleshooting

This page identifies scenarios we've encountered when building/running Elyra.

- **Elyra build fails with: error An unexpected error occurred: "ENOTDIR: not a directory, scandir..."**

This happens due to yarn not being happy with additional `@` in the path structure. We have seen this when the
OS user has that symbol in its name (e.g. `user@domain.com`)
