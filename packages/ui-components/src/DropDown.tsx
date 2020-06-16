/*
 * Copyright 2018-2020 IBM Corporation
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

import { FormGroup, MenuItem } from '@blueprintjs/core';
import { ItemPredicate } from '@blueprintjs/select';
import { Select, Button } from '@jupyterlab/ui-components';
import * as React from 'react';

const DROPDOWN_ITEM_CLASS = 'elyra-form-DropDown-item';

export interface IDropDownProps {
  field: any;
  handleDropdownChange: any;
}

export class DropDown extends React.Component<IDropDownProps> {
  itemRenderer(value: string, options: any): React.ReactElement {
    return (
      <Button
        className={DROPDOWN_ITEM_CLASS}
        onClick={options.handleClick}
        key={value}
        text={value}
      ></Button>
    );
  }

  renderCreateOption = (
    query: string,
    active: boolean,
    handleClick: React.MouseEventHandler<HTMLElement>
  ): React.ReactElement => (
    <MenuItem
      icon="add"
      text={`Create "${query}"`}
      active={active}
      onClick={handleClick}
      shouldDismissPopover={false}
    />
  );

  filterDropdown: ItemPredicate<string> = (
    query,
    value,
    _index,
    exactMatch
  ) => {
    const normalizedTitle = value.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    if (normalizedQuery === normalizedTitle) {
      return normalizedTitle === normalizedQuery;
    } else {
      return `${normalizedTitle}`.indexOf(normalizedQuery) >= 0;
    }
  };

  render(): React.ReactElement {
    return (
      <FormGroup
        key={this.props.field.label}
        label={this.props.field.label}
        labelInfo="(required)"
        helperText={this.props.field.description}
      >
        <Select
          items={this.props.field.value.defaultChoices}
          itemPredicate={this.filterDropdown}
          createNewItemFromQuery={(newValue: any): void => {
            return newValue;
          }}
          createNewItemRenderer={this.renderCreateOption}
          onItemSelect={(value: string): void => {
            this.props.handleDropdownChange(this.props.field.label, value);
          }}
          itemRenderer={this.itemRenderer}
        >
          <Button
            rightIcon="caret-down"
            text={
              this.props.field.value.choice
                ? this.props.field.value.choice
                : '(No selection)'
            }
          />
        </Select>
      </FormGroup>
    );
  }
}
