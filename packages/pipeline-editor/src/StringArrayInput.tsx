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

    this.deleteHandler = this.deleteHandler.bind(this);
    this.onTextAreaChange = this.onTextAreaChange.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.addHandler = this.addHandler.bind(this);
  }

  deleteHandler = (index: number): void => {
    delete this.values[index];
    this.controller.updatePropertyValue({ name: this.parameter }, this.values);
  };

  onTextAreaChange = (props: any): void => {
    this.values = props.value.split('\n');
  };

  onInputChange = (event: any, index: number): void => {
    event.target.value
      .split('\n')
      .forEach((element: string, valueIndex: number): void => {
        if (valueIndex === 0) {
          this.values[index] = element;
        } else {
          this.values.splice(index, 0, element);
        }
      });
    this.values[index] = event.target.value;
    this.controller.updatePropertyValue({ name: this.parameter }, this.values);
  };

  addHandler = (): void => {
    this.values.push('');
    this.controller.updatePropertyValue({ name: this.parameter }, this.values);
  };

  renderControl(): any {
    this.values = this.controller.getPropertyValue(this.parameter);
    return (
      <div>
        <div id={this.parameter}>
          {this.values.map((value: any, index: number) => (
            <ControlGroup
              key={this.parameter + index + 'ControlGroup'}
              style={{ marginBottom: 4 }}
            >
              <InputGroup
                fill
                key={this.parameter + index + 'InputGroup'}
                className="jp-InputGroup"
                defaultValue={value}
                placeholder={this.placeholder}
                onChange={(event: any): void => {
                  this.onInputChange(event, index);
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
                  this.deleteHandler(index);
                }}
              />
            </ControlGroup>
          ))}
        </div>
        <div style={{ display: 'flex' }}>
          <Button
            className="jp-Button"
            onClick={this.addHandler}
            style={{ marginTop: 8 }}
          >
            Add {this.singleItemLabel ? this.singleItemLabel : 'item'}
          </Button>
        </div>
      </div>
    );
  }
}

export default StringArrayInput;
