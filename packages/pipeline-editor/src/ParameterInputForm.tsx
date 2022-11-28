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
import React from 'react';

export interface IParameterProps {
  parameters?: {
    name: string;
    default_value?: {
      type: 'String' | 'Integer' | 'Float' | 'Bool';
      value: any;
    };
    type?: string;
    required?: boolean;
  }[];
}

export const ParameterInputForm: React.FC<IParameterProps> = ({
  parameters
}) => {
  return parameters ? (
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
        let type = 'text';
        switch (param.default_value?.type) {
          case 'Bool':
            type = 'checkbox';
            break;
          case 'Float':
          case 'Integer':
            type = 'number';
            break;
        }
        if (type === 'checkbox') {
          return (
            <div key={param.name}>
              <input
                id={`${param.name}-paramInput`}
                name={`${param.name}-paramInput`}
                defaultValue={param.default_value?.value}
                data-form-required={param.required}
                type="checkbox"
              />
              <label htmlFor={`${param.name}-paramInput`}>{`${param.name}${
                param.required ? '*' : ''
              }`}</label>
              <br />
              <br />
            </div>
          );
        }
        return (
          <div key={param.name}>
            <label htmlFor={`${param.name}-paramInput`}>{`${param.name}${
              param.required ? '*' : ''
            }:`}</label>
            <br />
            <input
              id={`${param.name}-paramInput`}
              name={`${param.name}-paramInput`}
              type={type}
              defaultValue={param.default_value?.value}
              data-form-required={param.required === true ? true : undefined}
            />
            <br />
            <br />
          </div>
        );
      })}
    </div>
  ) : (
    <div />
  );
};
