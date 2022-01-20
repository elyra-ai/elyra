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

import { Tooltip, withStyles, Checkbox, InputLabel } from '@material-ui/core';

import * as React from 'react';

export interface IBooleanFieldProps {
  label: string;
  defaultValue: boolean;
  description?: string;
  fieldName?: string;
  onChange: (value: boolean) => any;
}

// TODO: we seem to reuse this a lot, we should make a component for it.
const CustomTooltip = withStyles(_theme => ({
  tooltip: {
    fontSize: 13
  }
}))(Tooltip);

export const BooleanInput: React.FC<IBooleanFieldProps> = ({
  defaultValue,
  description,
  label,
  onChange,
  fieldName
}) => {
  const [value, setValue] = React.useState(defaultValue);

  return (
    <div
      style={{ flexBasis: '100%' }}
      className="elyra-metadataEditor-formInput"
    >
      <CustomTooltip title={description ?? ''}>
        <div className="elyra-metadataEditor-BooleanInput">
          <Checkbox
            id={fieldName}
            color="primary"
            onChange={(event): void => {
              const newValue = event.target.checked;
              setValue(newValue);
              onChange(newValue);
            }}
            checked={value ?? ''}
            className={`elyra-metadataEditor-form-${fieldName ?? ''}`}
          />
          <InputLabel> {label} </InputLabel>
        </div>
      </CustomTooltip>
    </div>
  );
};
