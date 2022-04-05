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

## Issues Workflow
This section describes how Elyra issues are organized. 

### Labels used for tagging Issues and Pull Requests

| Keyword | Tags |
| --- | --- |
| Area | ![][backend] ![][community] ![][documentation] ![][front-end] |
| Impact | ![][blocker] ![][blocked]  ![][do not merge] ![][needs doc updates] ![][needs example updates] ![][needs release note] |
| Help Wanted | ![][good first issue] ![][good first project] ![][help wanted] |
| Mentoring Program | ![][jumpstart] ![][rcos] |
| Kind | ![][accessibility] ![][bug] ![][config] ![][enhancement] ![][investigate] ![][no functionality change] ![][question] ![][task] ![][user error] |
| Feedback | ![][isv] ![][proposal] ![][user] |
| External | ![][jupyter enterprise gateway] ![][jupyter server] ![][jupyter hub] ![][jupyter lab 1.x] ![][jupyter lab 2.x] ![][jupyter lab 3.x] ![][jupyter lab 4.x] ![][upstream] |
| Component | ![][application utils] ![][binder] ![][build] ![][cli tools] ![][code snippets] ![][component registry] ![][content parser] ![][docker] ![][git] ![][install] ![][lsp] ![][metadata editor] ![][metadata] ![][performance] ![][pipeline editor visual studio] ![][pipeline editor] ![][pipeline runtime] ![][pipeline validation] ![][python editor] ![][r editor] ![][resource usage] ![][s3] ![][submit notebook button] ![][submit script button] ![][test] ![][toc] ![][troubleshooting] |
| Platform | ![][open data hub] ![][OpenShift] ![][Pipeline Airflow] ![][Pipeline Kubeflow] ![][Pipeline Local] ![][Windows] |
| Browser | ![][chrome] ![][firefox] ![][safari] |
| Inactive | ![][cannot reproduce] ![][deferred] ![][duplicate] ![][invalid] ![][obsolete] ![][wontfix] |
| Status | ![][needs discussion] ![][needs triage] ![][needs update] ![][waiting for author] ![][work in progress] |
| Priority | ![][high] ![][low] ![][normal] ![][stretch] |


<!--Feedback-->
[isv]: https://img.shields.io/badge/-isv-d4c5F9?style=flat
[proposal]: https://img.shields.io/badge/-proposal-d4c5F9?style=flat
[user]: https://img.shields.io/badge/-user-d4c5F9?style=flat
<!--Area-->
[backend]: https://img.shields.io/badge/-backend-c5def5?style=flat
[community]: https://img.shields.io/badge/-community-c5def5?style=flat
[documentation]: https://img.shields.io/badge/-documentation-c5def5?style=flat
[front-end]: https://img.shields.io/badge/-front_end-c5def5?style=flat
<!--Impact-->
[blocked]: https://img.shields.io/badge/-blocked-d93f0b?style=flat
[blocker]: https://img.shields.io/badge/-blocker-d93f0b?style=flat
[do not merge]: https://img.shields.io/badge/-do_not_merge-d93f0b?style=flat
[needs doc updates]: https://img.shields.io/badge/-needs_doc_updates-d93f0b?style=flat
[needs example updates]: https://img.shields.io/badge/-needs_example_updates-d93f0b?style=flat
[needs release note]: https://img.shields.io/badge/-needs_release_note-d93f0b?style=flat
<!--Help Wanted-->
[good first issue]: https://img.shields.io/badge/-good_first_issue-84e251?style=flat
[good first project]: https://img.shields.io/badge/-good_first_project-84e251?style=flat
[help wanted]: https://img.shields.io/badge/-help_wanted-84e251?style=flat
<!--Mentoring-->
[jumpstart]: https://img.shields.io/badge/-jumpstart-84e251?style=flat
[rcos]: https://img.shields.io/badge/-rcos-84e251?style=flat
<!--Kind-->
[accessibility]: https://img.shields.io/badge/-accessibility-ea81a2?style=flat
[bug]: https://img.shields.io/badge/-bug-ea81a2?style=flat
[config]: https://img.shields.io/badge/-config-ea81a2?style=flat
[enhancement]: https://img.shields.io/badge/-enhancement-ea81a2?style=flat
[investigate]: https://img.shields.io/badge/-investigate-ea81a2?style=flat
[no functionality change]: https://img.shields.io/badge/-no_functionality_change-ea81a2?style=flat
[question]: https://img.shields.io/badge/-question-ea81a2?style=flat
[task]: https://img.shields.io/badge/-task-ea81a2?style=flat
[user error]: https://img.shields.io/badge/-user_error-ea81a2?style=flat
<!--External-->
[jupyter enterprise gateway]: https://img.shields.io/badge/-jupyter_enterprise_gateway-orange?style=flat
[jupyter server]: https://img.shields.io/badge/-jupyter_server-orange?style=flat
[jupyter hub]: https://img.shields.io/badge/-jupyter_hub-orange?style=flat
[jupyter lab 1.x]: https://img.shields.io/badge/-jupyter_lab_1x-orange?style=flat
[jupyter lab 2.x]: https://img.shields.io/badge/-jupyter_lab_2x-orange?style=flat
[jupyter lab 3.x]: https://img.shields.io/badge/-jupyter_lab_3x-orange?style=flat
[jupyter lab 4.x]: https://img.shields.io/badge/-jupyter_lab_4x-orange?style=flat
[upstream]: https://img.shields.io/badge/-upstream-orange?style=flat
<!--Component-->
[application utils]: https://img.shields.io/badge/-application_utils-blue?style=flat
[binder]: https://img.shields.io/badge/-binder-blue?style=flat
[build]: https://img.shields.io/badge/-build-blue?style=flat
[cli tools]: https://img.shields.io/badge/-cli_tools-blue?style=flat
[code snippets]: https://img.shields.io/badge/-code_snippets-blue?style=flat
[component registry]: https://img.shields.io/badge/-component_registry-blue?style=flat
[content parser]: https://img.shields.io/badge/-content_parser-blue?style=flat
[docker]: https://img.shields.io/badge/-docker-blue?style=flat
[git]: https://img.shields.io/badge/-git-blue?style=flat
[install]: https://img.shields.io/badge/-install-blue?style=flat
[lsp]: https://img.shields.io/badge/-lsp-blue?style=flat
[metadata editor]: https://img.shields.io/badge/-metadata_editor-blue?style=flat
[metadata]: https://img.shields.io/badge/-metadata-blue?style=flat
[performance]: https://img.shields.io/badge/-performance-blue?style=flat
[pipeline editor visual studio]: https://img.shields.io/badge/-pipeline_editor_visual_studio-blue?style=flat
[pipeline editor]: https://img.shields.io/badge/-pipeline_editor-blue?style=flat
[pipeline runtime]: https://img.shields.io/badge/-pipeline_runtime-blue?style=flat
[pipeline validation]: https://img.shields.io/badge/-pipeline_validation-blue?style=flat
[python editor]: https://img.shields.io/badge/-python_editor-blue?style=flat
[r editor]: https://img.shields.io/badge/-r_editor-blue?style=flat
[resource usage]: https://img.shields.io/badge/-resource_usage-blue?style=flat
[s3]: https://img.shields.io/badge/-s3-blue?style=flat
[submit notebook button]: https://img.shields.io/badge/-submit_notebook_button-blue?style=flat
[submit script button]: https://img.shields.io/badge/-submit_script_button-blue?style=flat
[test]: https://img.shields.io/badge/-test-blue?style=flat
[toc]: https://img.shields.io/badge/-toc-blue?style=flat
[troubleshooting]: https://img.shields.io/badge/-troubleshooting-blue?style=flat
<!--Platform-->
[Open Data Hub]: https://img.shields.io/badge/-open_data_hub-darkblue?style=flat
[OpenShift]: https://img.shields.io/badge/-openshift-darkblue?style=flat
[Pipeline Airflow]: https://img.shields.io/badge/-pipeline_airflow-darkblue?style=flat
[Pipeline Kubeflow]: https://img.shields.io/badge/-pipeline_kubeflow-darkblue?style=flat
[Pipeline Local]: https://img.shields.io/badge/-pipeline_local-darkblue?style=flat
[Windows]: https://img.shields.io/badge/-windows-darkblue?style=flat
<!--Browser-->
[chrome]: https://img.shields.io/badge/-chrome-006b75?style=flat
[firefox]: https://img.shields.io/badge/-firefox-006b75?style=flat
[safari]: https://img.shields.io/badge/-safari-006b75?style=flat
<!--Status-->
[needs discussion]: https://img.shields.io/badge/-needs_discussion-0e8a16?style=flat
[needs triage]: https://img.shields.io/badge/-needs_triage-0e8a16?style=flat
[needs update]: https://img.shields.io/badge/-needs_update-0e8a16?style=flat
[waiting for author]: https://img.shields.io/badge/-waiting_for_author-0e8a16?style=flat
[work in progress]: https://img.shields.io/badge/-work_in_progress-0e8a16?style=flat
<!--Inactive-->
[cannot reproduce]: https://img.shields.io/badge/-cannot_reproduce-grey?style=flat
[deferred]: https://img.shields.io/badge/-deferred-grey?style=flat
[duplicate]: https://img.shields.io/badge/-duplicate-grey?style=flat
[invalid]: https://img.shields.io/badge/-invalid-grey?style=flat
[obsolete]: https://img.shields.io/badge/-obsolete-grey?style=flat
[wontfix]: https://img.shields.io/badge/-wontfix-grey?style=flat
<!--Priority-->
[high]: https://img.shields.io/badge/-high-d73a4a?style=flat
[low]: https://img.shields.io/badge/-low-FEF2C0?style=flat
[normal]: https://img.shields.io/badge/-normal-00cc00?style=flat
[stretch]: https://img.shields.io/badge/-stretch-FEF2C0?style=flat
