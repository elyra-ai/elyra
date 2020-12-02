/*
 * Copyright 2018-2020 Elyra Authors
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

import { ControlGroup, FormGroup, Button, InputGroup } from '@blueprintjs/core';
import React from 'react';

export class StringArrayInput {
  parameters: any;
  controller: any;
  values: string[][];

  static id() {
    return 'elyra-string-array-input';
  }

  constructor(parameters: any, controller: any) {
    this.parameters = parameters;
    this.controller = controller;
  }

  renderPanel() {
    console.log('StringArrayInput');
    const forms: any[] = [];
    this.values = [];
    this.parameters.forEach((parameter: string, paramIndex: number) => {
      let curValues = this.controller.getPropertyValue(parameter);
      if (!curValues) {
        curValues = [];
      }
      this.values.push(curValues);
      forms.push(
        <FormGroup
          key={parameter}
          label={parameter}
          labelFor={parameter}
          labelInfo={this.parameters.required && '(required)'}
          helperText={this.parameters.helperText}
        >
          <div id={this.parameters}>
            {curValues.map((value: any, index: number) => (
              <ControlGroup key={value} style={{ marginBottom: 4 }}>
                <InputGroup
                  fill
                  readOnly={this.parameters.includes('dependencies')}
                  className="jp-InputGroup"
                  placeholder={this.parameters.placeholder}
                  defaultValue={value}
                  onSubmit={(event: any) => {
                    curValues[index] = event.target.value;
                    this.controller.updatePropertyValue(parameter, curValues);
                  }}
                />
                <Button
                  className="jp-Button"
                  icon="cross"
                  onClick={() => {
                    delete this.values[paramIndex][index];
                    this.controller.updatePropertyValue(
                      parameter,
                      this.values[paramIndex]
                    );
                  }}
                />
              </ControlGroup>
            ))}
          </div>
          {this.parameters.includes('dependencies') ? (
            <div />
          ) : (
            <Button
              className="jp-Button"
              onClick={() => {
                curValues.push('');
                this.controller.updatePropertyValue(parameter, curValues);
              }}
              style={{ marginTop: 8 }}
            >
              Add item
            </Button>
          )}
        </FormGroup>
      );
    });
    return forms;
  }
}
