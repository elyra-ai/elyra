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

import * as React from 'react';

interface IProps extends React.HTMLProps<HTMLSelectElement> {
  handleUpdate?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  label: string;
  optionList: JSX.Element[];
}

export const DialogSelector: React.FC<React.HTMLProps<HTMLSelectElement> &
  IProps> = ({ handleUpdate, label, optionList, ...selectProps }) => {
  return (
    <div>
      <label htmlFor={selectProps.id}>{label}:</label>
      <br />
      <select
        name={selectProps.id}
        data-form-required
        onChange={handleUpdate}
        {...selectProps}
      >
        {optionList}
      </select>
    </div>
  );
};
