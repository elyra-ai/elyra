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

const pythonSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <g transform="translate(-1.5418e-7 -.00046865)">
    <path d="m9.8594 2.0009c-1.58 0-2.8594 1.2794-2.8594 2.8594v1.6797h4.2891c.39 0 .71094.57094.71094.96094h-7.1406c-1.58 0-2.8594 1.2794-2.8594 2.8594v3.7812c0 1.58 1.2794 2.8594 2.8594 2.8594h1.1797v-2.6797c0-1.58 1.2716-2.8594 2.8516-2.8594h5.25c1.58 0 2.8594-1.2716 2.8594-2.8516v-3.75c0-1.58-1.2794-2.8594-2.8594-2.8594zm-.71875 1.6094c.4 0 .71875.12094.71875.71094s-.31875.89062-.71875.89062c-.39 0-.71094-.30062-.71094-.89062s.32094-.71094.71094-.71094z" fill="#3c78aa"/>
    <path d="m17.959 7v2.6797c0 1.58-1.2696 2.8594-2.8496 2.8594h-5.25c-1.58 0-2.8594 1.2696-2.8594 2.8496v3.75a2.86 2.86 0 0 0 2.8594 2.8613h4.2812a2.86 2.86 0 0 0 2.8594 -2.8613v-1.6797h-4.291c-.39 0-.70898-.56898-.70898-.95898h7.1406a2.86 2.86 0 0 0 2.8594 -2.8613v-3.7793a2.86 2.86 0 0 0 -2.8594 -2.8594zm-9.6387 4.5137-.0039.0039c.01198-.0024.02507-.0016.03711-.0039zm6.5391 7.2754c.39 0 .71094.30062.71094.89062a.71 .71 0 0 1 -.71094 .70898c-.4 0-.71875-.11898-.71875-.70898s.31875-.89062.71875-.89062z" fill="#fdd835"/>
  </g>
</svg>
`;

const python = {
  op: 'execute-python-node',
  description: 'Python file',
  label: 'Python',
  labelField: 'filename',
  fileField: 'filename',
  fileBased: true,
  extension: '.py',
  image: 'data:image/svg+xml;utf8,' + encodeURIComponent(pythonSVG),
  properties: {
    current_parameters: {
      filename: '',
      runtime_image: '',
      dependencies: [],
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
          control: 'custom',
          custom_control_id: 'pipeline-editor-file-control',
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
          data: { placeholder: '*.py', canBrowseFiles: true }
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
      action_info: [],
      group_info: [
        {
          id: 'nodeGroupInfo',
          type: 'panels',
          group_info: [
            { id: 'filename', type: 'controls', parameter_refs: ['filename'] },
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

export default python;
