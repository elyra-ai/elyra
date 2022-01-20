/*
 * Copyright 2018-2022 Elyra Authors
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

const pipelineProperties = {
  current_parameters: {
    name: '',
    runtime: '',
    description: ''
  },
  parameters: [{ id: 'name' }, { id: 'runtime' }, { id: 'description' }],
  uihints: {
    id: 'nodeProperties',
    parameter_info: [
      {
        control: 'custom',
        custom_control_id: 'DisplayControl',
        parameter_ref: 'name',
        label: { default: 'Pipeline Name' }
      },
      {
        control: 'custom',
        custom_control_id: 'DisplayControl',
        parameter_ref: 'runtime',
        label: { default: 'Pipeline Runtime' }
      },
      {
        control: 'custom',
        custom_control_id: 'StringControl',
        parameter_ref: 'description',
        label: { default: 'Pipeline Description' },
        data: {
          placeholder: 'Pipeline description',
          format: 'multiline'
        }
      }
    ],
    group_info: [
      {
        id: 'nodeGroupInfo',
        type: 'panels',
        group_info: [
          {
            id: 'name',
            type: 'controls',
            parameter_refs: ['name']
          },
          {
            id: 'runtime',
            type: 'controls',
            parameter_refs: ['runtime']
          },
          {
            id: 'description',
            type: 'controls',
            parameter_refs: ['description']
          }
        ]
      }
    ]
  }
};

export default pipelineProperties;
