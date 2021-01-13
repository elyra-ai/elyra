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

import { ControlGroup, Button, InputGroup } from '@blueprintjs/core';
import React from 'react';

export class StringArrayInput extends React.Component {
  parameter: string;
  controller: any;
  values: string[];
  fileBrowser?: boolean;
  singleItemLabel?: string;
  placeholder?: string;

  static id(): string {
    return 'elyra-string-array-input';
  }

  constructor(parameters: any, controller: any, data: any) {
    super({});
    this.singleItemLabel = data.single_item_label;
    this.placeholder = data.placeholder;
    this.fileBrowser = data.filebrowser;
    this.parameter = parameters['name'];
    this.controller = controller;
  }

  renderControl() {
    const parameter = this.parameter;
    this.values = this.controller.getPropertyValue(parameter);
    return (
      <div>
        <div id={this.parameter}>
          {this.values.map((value: any, index: number) => (
            <ControlGroup
              key={parameter + index + 'ControlGroup'}
              style={{ marginBottom: 4 }}
            >
              <InputGroup
                fill
                key={parameter + index + 'InputGroup'}
                className="jp-InputGroup"
                defaultValue={value}
                placeholder={this.placeholder}
                onChange={(event: any): void => {
                  this.values[index] = event.target.value;
                  this.controller.updatePropertyValue(parameter, this.values);
                }}
              />
              {this.fileBrowser ? (
                <Button
                  className="jp-Button"
                  icon="folder-close"
                  onClick={(): void => {
                    const actionHandler = this.controller.getHandlers()
                      .actionHandler;
                    if (typeof actionHandler === 'function') {
                      actionHandler(
                        'add_dependencies',
                        this.controller.getAppData(),
                        { parameter_ref: 'dependencies', index: index }
                      );
                    }
                  }}
                ></Button>
              ) : (
                <div></div>
              )}
              <Button
                className="jp-Button"
                icon="cross"
                onClick={(): void => {
                  delete this.values[index];
                  this.controller.updatePropertyValue(parameter, this.values);
                }}
              />
            </ControlGroup>
          ))}
        </div>
        <Button
          className="jp-Button"
          onClick={(): void => {
            this.values.push('');
            this.controller.updatePropertyValue(parameter, this.values);
          }}
          style={{ marginTop: 8 }}
        >
          Add {this.singleItemLabel ? this.singleItemLabel : 'item'}
        </Button>
      </div>
    );
  }
}

export default StringArrayInput;
