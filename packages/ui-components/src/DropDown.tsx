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
  return (
    <div className={`elyra-metadataEditor-formInput ${DROPDOWN_ITEM_CLASS}`}>
      <Autocomplete
        id="combo-box-demo"
        freeSolo
        key="elyra-DropDown"
        options={props.defaultChoices}
        style={{ width: 300 }}
        defaultValue={props.choice}
        onChange={(event: any, newValue: any): void => {
          props.handleDropdownChange(props.schemaField, newValue);
        }}
        renderInput={params => (
          <TextField
            {...params}
            label={props.label}
            error={props.error}
            required={props.required}
            helperText={props.description}
            placeholder={`Create or select ${props.label}`}
            variant="outlined"
          />
        )}
      />
      {errorText}
    </div>
  );
}

// export class DropDown extends React.Component<IDropDownProps> {
//   itemRenderer(value: string, options: any): React.ReactElement {
//     return (
//       <Button
//         className={DROPDOWN_ITEM_CLASS}
//         onClick={options.handleClick}
//         key={value}
//         text={value}
//       ></Button>
//     );
//   }

//   renderCreateOption = (
//     query: string,
//     active: boolean,
//     handleClick: React.MouseEventHandler<HTMLElement>
//   ): React.ReactElement => (
//     <MenuItem
//       icon="add"
//       key="createOption"
//       text={`Create "${query}"`}
//       active={active}
//       onClick={handleClick}
//       shouldDismissPopover={false}
//     />
//   );

//   filterDropdown: ItemPredicate<string> = (
//     query,
//     value,
//     _index,
//     exactMatch
//   ) => {
//     const normalizedTitle = value.toLowerCase();
//     const normalizedQuery = query.toLowerCase();

//     if (normalizedQuery === normalizedTitle) {
//       return normalizedTitle === normalizedQuery;
//     } else {
//       return `${normalizedTitle}`.indexOf(normalizedQuery) >= 0;
//     }
//   };

//   render(): React.ReactElement {
//     let helperText = this.props.description ? this.props.description : '';
//     if (this.props.intent == Intent.DANGER) {
//       helperText += '\nThis field is required.';
//     }
//     return (
//       <FormGroup
//         key={this.props.label}
//         label={this.props.label}
//         labelInfo={this.props.required}
//         helperText={helperText}
//         intent={this.props.intent}
//       >
//         <Select
//           items={this.props.defaultChoices}
//           itemPredicate={this.filterDropdown}
//           createNewItemFromQuery={
//             this.props.allowCreate
//               ? (newValue: any): void => {
//                   return newValue;
//                 }
//               : undefined
//           }
//           createNewItemRenderer={
//             this.props.allowCreate ? this.renderCreateOption : undefined
//           }
//           onItemSelect={(value: string): void => {
//             this.props.handleDropdownChange(this.props.schemaField, value);
//           }}
//           itemRenderer={this.itemRenderer}
//         >
//           <Button
//             rightIcon="caret-down"
//             text={this.props.choice ? this.props.choice : '(No selection)'}
//           />
//         </Select>
//       </FormGroup>
//     );
//   }
// }
