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

const wmlSVG: any = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 40 40" fill="#8a3ffc">
  <path d="M22,26H20V17.76l-3.23,3.88a1,1,0,0,1-1.54,0L12,17.76V26H10V15a1,1,0,0,1,.66-.94,1,1,0,0,1,1.11.3L16,19.44l4.23-5.08a1,1,0,0,1,1.11-.3A1,1,0,0,1,22,15Z" />
  <path d="M4.16,14.65l-3-1.75a.76.76,0,1,0-.76,1.32L3.4,16a.76.76,0,1,0,.76-1.31Z" />
  <path d="M8.29,10.52a.73.73,0,0,0,1,.27.75.75,0,0,0,.28-1l-1.74-3a.76.76,0,1,0-1.32.76Z" />
  <path d="M16,9a.76.76,0,0,0,.76-.76V4.76a.76.76,0,1,0-1.52,0V8.25A.76.76,0,0,0,16,9Z" />
  <path d="M22.68,10.79a.75.75,0,0,0,.37.11.76.76,0,0,0,.66-.38l1.75-3a.76.76,0,0,0-1.32-.76l-1.74,3A.75.75,0,0,0,22.68,10.79Z" />
  <path d="M31.9,13.18a.76.76,0,0,0-1-.28l-3,1.75A.76.76,0,0,0,28.6,16l3-1.74A.77.77,0,0,0,31.9,13.18Z" />
</svg>
`;

const wmlDeploy: any = {
  op: 'execute-deploy-wml-node',
  description:
    'Deploy stored model on Watson Machine Learning as a web service.',
  label: 'Deploy Model',
  image: 'data:image/svg+xml;utf8,' + encodeURIComponent(wmlSVG),
  properties: {
    current_parameters: {
      model_uid: '',
      model_name: '',
      scoring_payload: '',
      deployment_name: ''
    },
    parameters: [
      { id: 'model_uid', type: 'string', required: true },
      { id: 'model_name', type: 'string', required: true },
      { id: 'scoring_payload', type: 'string', required: false },
      { id: 'deployment_name', type: 'string', required: false }
    ],
    uihints: {
      id: 'nodeProperties',
      parameter_info: [
        {
          parameter_ref: 'model_uid',
          label: { default: 'Model Unique ID' },
          description: {
            default: 'UID for the stored model on Watson Machine Learning',
            placement: 'on_panel'
          }
        },
        {
          parameter_ref: 'model_name',
          label: { default: 'Model Name' },
          description: {
            default: 'Model Name on Watson Machine Learning',
            placement: 'on_panel'
          }
        },
        {
          parameter_ref: 'scoring_payload',
          label: { default: 'Scoring Payload' },
          description: {
            default: 'Sample Payload file name in the object storage',
            placement: 'on_panel'
          }
        },
        {
          parameter_ref: 'deployment_name',
          label: { default: 'Deployment Name' },
          description: {
            default: 'Deployment Name on Watson Machine Learning',
            placement: 'on_panel'
          }
        }
      ],
      action_info: [],
      group_info: [
        {
          id: 'nodeGroupInfo',
          type: 'panels',
          group_info: [
            {
              id: 'model_uid',
              type: 'controls',
              parameter_refs: ['model_uid']
            },
            {
              id: 'model_name',
              type: 'controls',
              parameter_refs: ['model_name']
            },
            {
              id: 'scoring_payload',
              type: 'controls',
              parameter_refs: ['scoring_payload']
            },
            {
              id: 'deployment_name',
              type: 'controls',
              parameter_refs: ['deployment_name']
            }
          ]
        }
      ]
    },
    resources: {}
  }
};

export default wmlDeploy;
