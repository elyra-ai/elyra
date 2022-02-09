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

import { Widget } from '@rjsf/core';

import * as React from 'react';

const DROPDOWN_ITEM_CLASS = 'elyra-form-DropDown-item';

export const DropDown: Widget = props => {
  const {
    defaultValue,
    formContext,
    label,
    required,
    onChange,
    placeholder,
    value,
    id
  } = props;
  const [current, setValue] = React.useState(value ?? defaultValue);

  React.useEffect(() => {
    setValue(value);
  }, [value]);

  const handleChange = (newValue: string): void => {
    setValue(newValue);
    onChange(newValue);
  };

  return (
    <div>
      <input
        required={required}
        onChange={(event: any): void => {
          handleChange(event.target.value);
        }}
        value={current ?? ''}
        list={`${label}-dataList`}
        placeholder={
          placeholder || `Create or select ${label.toLocaleLowerCase()}`
        }
      />
      <datalist
        id={`${label}-dataList`}
        className={`elyra-metadataEditor-formInput ${DROPDOWN_ITEM_CLASS}`}
        key="elyra-DropDown"
        style={{ width: 300 }}
      >
        {formContext.languageOptions.map((language: string) => {
          return <option key={`${language}-${id}-option`} value={language} />;
        })}
      </datalist>
    </div>
  );
};
