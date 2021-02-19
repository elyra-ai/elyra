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

import {
  TextField,
  InputAdornment,
  IconButton,
  FormHelperText
} from '@material-ui/core';
import { Visibility, VisibilityOff } from '@material-ui/icons';

import * as React from 'react';

export interface ITextFieldProps {
  label: string;
  description: string;
  fieldName: string;
  defaultValue: string;
  required: boolean;
  secure: boolean;
  error?: boolean;
  handleTextInputChange: (event: any, fieldName: string) => void;
}

// eslint-disable-next-line func-style
export function TextInput(props: ITextFieldProps): any {
  const [errorText, setErrorText] = React.useState(null);
  React.useEffect(() => {
    if (props.error) {
      setErrorText(
        <FormHelperText error> This field is required. </FormHelperText>
      );
    }
  }, [props.error]);

  const [showPassword, setShowPassword] = React.useState(false);

  const toggleShowPassword = (): void => {
    setShowPassword(!showPassword);
  };

  const [value, setValue] = React.useState(props.defaultValue);

  React.useEffect(() => {
    setValue(props.defaultValue);
  }, [props.defaultValue]);

  return (
    <div className="elyra-metadataEditor-formInput">
      <TextField
        key={props.fieldName}
        label={props.label}
        required={props.required}
        variant="outlined"
        error={props.error}
        onChange={(event: any): void => {
          props.handleTextInputChange(event, props.fieldName);
          setValue(event.nativeEvent.target.value);
        }}
        value={value ?? ''}
        type={showPassword || !props.secure ? 'text' : 'password'}
        InputProps={
          props.secure
            ? {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={toggleShowPassword}
                      onMouseDown={(event: any): void => {
                        event.preventDefault();
                      }}
                      edge="end"
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            : {}
        }
        className={`elyra-metadataEditor-form-${props.fieldName}`}
      />
      {errorText}
    </div>
  );
}
