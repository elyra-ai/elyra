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

import Field from '@rjsf/core';

import * as React from 'react';

const DROPDOWN_ITEM_CLASS = 'elyra-form-DropDown-item';

interface IDropDownProps {
  defaultValue: string;
  formContext: {
    languageOptions: string[];
  };
  schema: {
    title?: string;
  };
  name: string;
  required: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  formData: string;
  id: string;
}

export const DropDown: React.FC<IDropDownProps> = ({
  defaultValue,
  formContext,
  schema,
  name,
  required,
  onChange,
  placeholder,
  formData,
  id,
}) => {
  const label = schema.title ?? name;
  const [current, setValue] = React.useState(formData ?? defaultValue);

  React.useEffect(() => {
    setValue(formData);
  }, [formData]);

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
        className="form-control"
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
