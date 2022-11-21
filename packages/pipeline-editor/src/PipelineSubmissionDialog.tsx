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

import * as React from 'react';

import { IRuntimeData } from './runtime-utils';
import RuntimeConfigSelect from './RuntimeConfigSelect';

interface IProps {
  name: string;
  runtimeData: IRuntimeData;
  pipelineType?: string;
  parameters?: {
    name: string;
    default_value?: {
      type: 'str' | 'int' | 'float' | 'bool' | 'list' | 'dict';
      value: any;
    };
    type?: string;
    required?: boolean;
  }[];
}

export const PipelineSubmissionDialog: React.FC<IProps> = ({
  name,
  runtimeData,
  pipelineType,
  parameters
}) => {
  return (
    <form className="elyra-dialog-form">
      <label htmlFor="pipeline_name">Pipeline Name:</label>
      <br />
      <input
        type="text"
        id="pipeline_name"
        name="pipeline_name"
        defaultValue={name}
        data-form-required
      />
      <br />
      <br />
      <RuntimeConfigSelect
        runtimeData={runtimeData}
        pipelineType={pipelineType}
      />
      {parameters ? (
        <div>
          <label
            style={{
              fontWeight: '600',
              fontSize: 'var(--jp-content-font-size1)'
            }}
          >
            Parameters
          </label>
          {parameters.map(param => {
            if (!param.name) {
              return undefined;
            }
            return (
              <div key={param.name}>
                <label htmlFor={`${param.name}-paramInput`}>
                  {param.name}:
                </label>
                <br />
                <input
                  id={`${param.name}-paramInput`}
                  name={`${param.name}-paramInput`}
                  defaultValue={param.default_value?.value}
                  data-form-required={param.required}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div />
      )}
    </form>
  );
};
