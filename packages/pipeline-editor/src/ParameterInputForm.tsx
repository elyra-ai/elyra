/*
 * Copyright 2018-2023 Elyra Authors
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

const DIALOG_WIDTH = 27;

export interface IParameterProps {
  parameters?: {
    name: string;
    default_value?: {
      type: 'String' | 'Integer' | 'Float' | 'Bool';
      value: any;
    };
    type?: string;
    required?: boolean;
    description?: string;
  }[];
}

export const ParameterInputForm: React.FC<IParameterProps> = ({
  parameters
}) => {
  return parameters && parameters.length > 0 ? (
    <div>
      <label
        style={{
          fontWeight: '600',
          fontSize: 'var(--jp-content-font-size1)'
        }}
      >
        Parameters
      </label>
      {parameters.map((param) => {
        if (!param.name) {
          return undefined;
        }
        const required =
          param.required === true && param.default_value?.value === ''
            ? true
            : undefined;
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
                defaultChecked={param.default_value?.value}
                type="checkbox"
              />
              <label htmlFor={`${param.name}-paramInput`}>{`${param.name}${
                required ? '*' : ''
              }`}</label>
              <br />
              <br />
            </div>
          );
        }
        return (
          <div key={param.name}>
            <div className="label-header">
              <label
                className="control-label"
                htmlFor={`${param.name}-paramInput`}
              >{`${param.name}${param.required ? '*' : ''}`}</label>
              {param.description && (
                <div className="description-wrapper">
                  <div className="description-button">?</div>
                  <p
                    style={{
                      transform: `translate(0px, -10%)`,
                      left: `-${
                        Math.min(
                          param.name.length,
                          Math.min(DIALOG_WIDTH, param.description.length)
                        ) - 4
                      }ch`
                    }}
                    className={'field-description'}
                  >
                    {param.description}
                  </p>
                </div>
              )}
            </div>
            <input
              id={`${param.name}-paramInput`}
              name={`${param.name}-paramInput`}
              type={type}
              placeholder={param.default_value?.value}
              data-form-required={required}
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
