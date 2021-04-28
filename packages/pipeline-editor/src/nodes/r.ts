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

import { rIcon } from '@elyra/ui-components';

const rSVG = rIcon.svgstr;

const r = {
  op: 'execute-r-node',
  description: 'R file',
  label: 'R Script',
  labelField: 'filename',
  fileField: 'filename',
  fileBased: true,
  extension: '.r',
  image: 'data:image/svg+xml;utf8,' + encodeURIComponent(rSVG),
  properties: {
    current_parameters: {
      filename: '',
      runtime_image: '',
      cpu: '',
      gpu: '',
      memory: '',
      dependencies: [],
      include_subdirectories: false,
      env_vars: [],
      outputs: []
    },
    parameters: [
      { id: 'filename' },
      { id: 'runtime_image' },
      { id: 'cpu' },
      { id: 'gpu' },
      { id: 'memory' },
      { id: 'dependencies' },
      { id: 'include_subdirectories' },
      { id: 'env_vars' },
      { id: 'outputs' }
    ],
    uihints: {
      id: 'nodeProperties',
      parameter_info: [
        {
          parameter_ref: 'filename',
          control: 'custom',
          custom_control_id: 'StringControl',
          label: { default: 'File' },
          description: {
            default: 'The path to the R file.',
            placement: 'on_panel'
          },
          data: {
            format: 'file',
            required: true,
            extensions: ['.r']
          }
        },
        {
          parameter_ref: 'runtime_image',
          label: { default: 'Runtime Image' },
          control: 'custom',
          custom_control_id: 'EnumControl',
          description: {
            default: 'Docker image used as execution environment.',
            placement: 'on_panel'
          },
          data: {
            items: [],
            required: true
          }
        },
        {
          parameter_ref: 'cpu',
          label: {
            default: 'CPU'
          },
          control: 'custom',
          custom_control_id: 'NumberControl',
          data: {
            minimum: 0,
            maximum: 99
          },
          description: {
            default:
              'For CPU-intensive workloads, you can choose more than 1 CPU (e.g. 1.5).',
            placement: 'on_panel'
          }
        },
        {
          parameter_ref: 'gpu',
          label: {
            default: 'GPU'
          },
          control: 'custom',
          custom_control_id: 'NumberControl',
          data: {
            minimum: 0,
            maximum: 99
          },
          description: {
            default:
              'For GPU-intensive workloads, you can choose more than 1 GPU. Must be an integer.',
            placement: 'on_panel'
          }
        },
        {
          parameter_ref: 'memory',
          label: {
            default: 'RAM(GB)'
          },
          control: 'custom',
          custom_control_id: 'NumberControl',
          data: {
            minimum: 0,
            maximum: 99
          },
          description: {
            default: 'The total amount of RAM specified.',
            placement: 'on_panel'
          }
        },
        {
          control: 'custom',
          custom_control_id: 'StringArrayControl',
          parameter_ref: 'dependencies',
          label: { default: 'File Dependencies' },
          description: {
            default:
              'Local file dependencies that need to be copied to remote execution environment.',
            placement: 'on_panel'
          },
          data: { placeholder: '*.py', format: 'file' }
        },
        {
          control: 'custom',
          custom_control_id: 'BooleanControl',
          parameter_ref: 'include_subdirectories',
          label: { default: 'Include Subdirectories' },
          data: {
            description:
              'Recursively include subdirectories when submitting a pipeline (This may increase submission time).'
          }
        },
        {
          control: 'custom',
          custom_control_id: 'StringArrayControl',
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
          custom_control_id: 'StringArrayControl',
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
              id: 'resources',
              type: 'controls',
              parameter_refs: ['cpu', 'gpu', 'memory']
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

export default r;
