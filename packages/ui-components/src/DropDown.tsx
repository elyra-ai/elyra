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

import { TextField, FormHelperText } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';

import * as React from 'react';

const DROPDOWN_ITEM_CLASS = 'elyra-form-DropDown-item';

export interface IDropDownProps {
  label: string;
  schemaField: string;
  description?: string;
  choice?: string;
  required?: boolean;
  defaultChoices?: string[];
  handleDropdownChange: any;
  error: boolean;
  allowCreate: boolean;
}

// eslint-disable-next-line func-style
export function DropDown(props: IDropDownProps): any {
  let errorText = null;
  if (props.error) {
    errorText = (
      <FormHelperText error> This field is required. </FormHelperText>
    );
  }

  const [choice, setChoice] = React.useState(props.choice);

  React.useEffect(() => {
    setChoice(props.choice);
  }, [props.choice]);

  return (
    <div className={`elyra-metadataEditor-formInput ${DROPDOWN_ITEM_CLASS}`}>
      <Autocomplete
        id="combo-box-demo"
        freeSolo
        key="elyra-DropDown"
        options={props.defaultChoices}
        style={{ width: 300 }}
        value={choice ?? ''}
        onChange={(event: any, newValue: any): void => {
          props.handleDropdownChange(props.schemaField, newValue);
          setChoice(newValue);
        }}
        renderInput={params => (
          <TextField
            {...params}
            label={props.label}
            required={props.required}
            error={props.error}
            helperText={props.description}
            placeholder={`Create or select ${props.label.toLocaleLowerCase()}`}
            variant="outlined"
          />
        )}
      />
      {errorText}
    </div>
  );
}
