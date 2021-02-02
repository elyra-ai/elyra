/*
 * Copyright 2018-2021 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const jupyterSVG: any = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <g transform="translate(-1638,-1844)">
    <path d="m1788 1886a108.02 108.02 0 0 0 -104.92 82.828 114.07 64.249 0 0 1 104.92 -39.053 114.07 64.249 0 0 1 104.96 39.261 108.02 108.02 0 0 0 -104.96 -83.037zm-104.96 133.01a108.02 108.02 0 0 0 104.96 83.037 108.02 108.02 0 0 0 104.92 -82.828 114.07 64.249 0 0 1 -104.92 39.053 114.07 64.249 0 0 1 -104.96 -39.261z" style="fill:#f57c00;paint-order:fill markers stroke"/>
    <circle cx="1699.5" cy="2110.8" r="22.627" style="fill:#9e9e9e;paint-order:fill markers stroke"/><circle cx="1684.3" cy="1892.6" r="16.617" style="fill:#616161;mix-blend-mode:normal;paint-order:fill markers stroke"/><circle cx="1879.8" cy="1877.4" r="21.213" style="fill:#757575;mix-blend-mode:normal;paint-order:fill markers stroke"/>
  </g>
</svg>
`;

const notebook: any = {
  op: 'execute-notebook-node',
  description: 'Notebook file',
  label: 'Notebook',
  labelField: 'filename',
  fileField: 'filename',
  fileBased: true,
  extension: '.ipynb',
  image: 'data:image/svg+xml;utf8,' + encodeURIComponent(jupyterSVG),
  properties: {
    current_parameters: {
      filename: '',
      runtime_image: '',
      dependencies: '',
      include_subdirectories: false,
      env_vars: [],
      outputs: []
    },
    parameters: [
      { id: 'filename', type: 'string', required: true },
      {
        id: 'runtime_image',
        enum: ['continuumio/anaconda3:2020.07', 'amancevice/pandas:1.0.3'],
        required: true
      },
      { id: 'dependencies', type: 'array[string]', required: false },
      { id: 'include_subdirectories', type: 'cboolean', required: false },
      { id: 'env_vars', type: 'array[string]', required: false },
      { id: 'outputs', type: 'array[string]', required: false }
    ],
    uihints: {
      id: 'nodeProperties',
      parameter_info: [
        {
          parameter_ref: 'filename',
          label: { default: 'File' },
          description: {
            default: 'The path to the notebook file.',
            placement: 'on_panel'
          }
        },
        {
          parameter_ref: 'runtime_image',
          label: { default: 'Runtime Image' },
          control: 'oneofselect',
          description: {
            default: 'Docker image used as execution environment.',
            placement: 'on_panel'
          }
        },
        {
          control: 'custom',
          custom_control_id: 'pipeline-editor-string-array-control',
          parameter_ref: 'dependencies',
          label: { default: 'File Dependencies' },
          description: {
            default:
              'Local file dependencies that need to be copied to remote execution environment.',
            placement: 'on_panel'
          },
          data: { placeholder: '*.py', fileBrowser: true }
        },
        {
          control: 'custom',
          custom_control_id: 'pipeline-editor-boolean-control',
          parameter_ref: 'include_subdirectories',
          label: { default: 'Include Subdirectories' },
          data: {
            helperText:
              'Whether or not to include recursively include subdirectories when submitting a pipeline (This may increase submission time).'
          }
        },
        {
          control: 'custom',
          custom_control_id: 'pipeline-editor-string-array-control',
          parameter_ref: 'env_vars',
          label: { default: 'Environment Variables' },
          description: {
            default:
              'Environment variables to be set on the execution environment.',
            placement: 'on_panel'
          },
          data: { placeholder: 'ENV_VAR=value' }
        },
        {
          control: 'custom',
          custom_control_id: 'pipeline-editor-string-array-control',
          parameter_ref: 'outputs',
          label: { default: 'Output Files' },
          description: {
            default:
              'Files generated during execution that will become available to all subsequent pipeline steps.',
            placement: 'on_panel'
          },
          data: { placeholder: '*.csv' }
        }
      ],
      action_info: [
        {
          id: 'browse_file',
          label: {
            default: 'Browse'
          },
          control: 'button',
          data: {
            parameter_ref: 'filename'
          }
        }
      ],
      group_info: [
        {
          id: 'nodeGroupInfo',
          type: 'panels',
          group_info: [
            { id: 'filename', type: 'controls', parameter_refs: ['filename'] },
            {
              id: 'nodeBrowseFileAction',
              type: 'actionPanel',
              action_refs: ['browse_file']
            },
            {
              id: 'runtime_image',
              type: 'controls',
              parameter_refs: ['runtime_image']
            },
            {
              id: 'dependencies',
              type: 'controls',
              parameter_refs: ['dependencies']
            },
            {
              id: 'include_subdirectories',
              type: 'controls',
              parameter_refs: ['include_subdirectories']
            },
            { id: 'env_vars', type: 'controls', parameter_refs: ['env_vars'] },
            { id: 'outputs', type: 'controls', parameter_refs: ['outputs'] }
          ]
        }
      ]
    },
    resources: {}
  }
};

export default notebook;
