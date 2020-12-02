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

import { ControlGroup, FormGroup, InputGroup } from '@blueprintjs/core';
import React from 'react';

export class StringInput {
  parameters: any;
  controller: any;

  static id() {
    return 'elyra-string-input';
  }

  constructor(parameters: any, controller: any) {
    this.parameters = parameters;
    this.controller = controller;
  }

  renderPanel() {
    console.log('StringInput');
    const value = this.controller.getPropertyValue('filename');
    return (
      <FormGroup
        key={this.parameters.id}
        label={'File Dependencies'}
        labelFor={this.parameters.id}
        labelInfo={this.parameters.required && '(required)'}
        helperText={this.parameters.helperText}
      >
        <div id={this.parameters.id}>
          <ControlGroup key={value} style={{ marginBottom: 4 }}>
            <InputGroup
              fill
              readOnly={true}
              className="jp-InputGroup"
              placeholder={this.parameters.placeholder}
              defaultValue={value}
            />
          </ControlGroup>
        </div>
      </FormGroup>
    );
  }
}
