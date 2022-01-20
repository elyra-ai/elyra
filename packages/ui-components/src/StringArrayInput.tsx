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
import { editIcon } from '@jupyterlab/ui-components';
import {
  Button,
  ButtonGroup,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  TextField,
  Tooltip,
  withStyles
} from '@material-ui/core';
import { FormHelperText } from '@material-ui/core';
import produce from 'immer';
import * as React from 'react';

import { trashIcon } from './icons';

export interface IArrayInputProps {
  label: string;
  defaultValues: string[];
  description?: string;
  fieldName?: string;
  required?: boolean;
  defaultError?: boolean;
  placeholder?: string;
  onChange: (values: string[]) => any;
}

interface IListItemProps {
  value?: any;
  isEditing?: boolean;
  placeholder?: string;
  onSubmit?: (value: string) => any;
  onCancel?: () => any;
  onDelete?: () => any;
  onEdit?: () => any;
}

const CustomTooltip = withStyles(_theme => ({
  tooltip: {
    fontSize: 13
  }
}))(Tooltip);

export const reducer = produce((draft: string[], action) => {
  const { type, payload } = action;
  switch (type) {
    case 'DELETE_ITEM': {
      const { index } = payload;
      if (index !== undefined && index < draft.length) {
        draft.splice(index, 1);
      }
      break;
    }
    case 'UPSERT_ITEM': {
      const { index } = payload;
      if (index !== undefined && index < draft.length) {
        // If the item is empty remove it.
        if (payload.value.trim() === '') {
          draft.splice(index, 1);
        } else {
          draft[index] = payload.value;
        }
      } else if (payload.value.trim() !== '') {
        draft.push(payload.value);
      }
      break;
    }
    case 'UPSERT_ITEMS': {
      const { index } = payload;
      if (
        index !== undefined &&
        index < draft.length &&
        payload.items.length > 0
      ) {
        // Update value of the selected input with the first value in the array.
        draft[index] = payload.items[0];

        // Insert the remaining items.
        draft.splice(index + 1, 0, ...payload.items.slice(1));
      } else {
        draft.push(...payload.items);
      }
      break;
    }
  }
});

export const ArrayListItem: React.FC<IListItemProps> = ({
  value,
  isEditing,
  placeholder,
  onSubmit,
  onCancel,
  onDelete,
  onEdit
}: IListItemProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // We want this to be called anytime isEditing becomes true.
    if (isEditing) {
      inputRef.current!.focus();
      inputRef.current!.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className="elyra-metadataEditor-arrayItemEditor">
        <TextField
          inputProps={{ ref: inputRef }}
          defaultValue={value}
          multiline={typeof value !== 'string'}
          maxRows={15}
          placeholder={placeholder}
          variant="outlined"
          onKeyDown={(e: any): void => {
            if (e.code === 'Enter') {
              onSubmit?.(inputRef.current!.value);
              return;
            }
            if (e.code === 'Escape') {
              onCancel?.();
              return;
            }
          }}
        />
        <ButtonGroup>
          <Button
            onClick={(): void => {
              onSubmit?.(inputRef.current!.value);
            }}
          >
            OK
          </Button>
          <Button
            onClick={(): void => {
              onCancel?.();
            }}
          >
            Cancel
          </Button>
        </ButtonGroup>
      </div>
    );
  }
  return (
    <ListItem
      onDoubleClick={(): void => {
        onEdit?.();
      }}
    >
      <TextField
        style={{ whiteSpace: 'pre' }}
        variant="outlined"
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="edit button"
                onClick={(): void => {
                  onEdit?.();
                }}
                edge="end"
              >
                {<editIcon.react />}
              </IconButton>
              <IconButton
                aria-label="delete button"
                onClick={(): void => {
                  onDelete?.();
                }}
                edge="end"
              >
                {<trashIcon.react />}
              </IconButton>
            </InputAdornment>
          )
        }}
        value={value}
      />
    </ListItem>
  );
};

export const ArrayInput: React.FC<IArrayInputProps> = ({
  label,
  defaultValues,
  description,
  fieldName,
  required,
  defaultError,
  placeholder,
  onChange
}: IArrayInputProps) => {
  const [items, setItems] = React.useState(defaultValues ?? []);
  const [error, setError] = React.useState(defaultError);

  const [editingIndex, setEditingIndex] = React.useState<number | 'new'>();

  const handleAction = React.useCallback(
    action => {
      const newItems = reducer(items, action);
      setItems(newItems);
      onChange(newItems);
    },
    // eslint-disable-next-line
    [items, setItems]
  );

  // This is necessary to rerender with error when clicking the save button.
  React.useEffect(() => {
    setError(defaultError);
  }, [defaultError]);

  return (
    <div
      id={fieldName}
      className="elyra-metadataEditor-formInput elyra-metadataEditor-arrayInput"
    >
      <CustomTooltip title={description ?? ''}>
        <InputLabel error={error} required={required}>
          {label}
        </InputLabel>
      </CustomTooltip>
      <List>
        {items?.map?.((item: string, index: number) => (
          <ArrayListItem
            key={index}
            value={item}
            placeholder={placeholder}
            isEditing={index === editingIndex}
            onSubmit={(value: string): void => {
              setEditingIndex(undefined);
              handleAction({
                type: 'UPSERT_ITEM',
                payload: { index, value }
              });
            }}
            onCancel={(): void => {
              setEditingIndex(undefined);
            }}
            onDelete={(): void => {
              handleAction({
                type: 'DELETE_ITEM',
                payload: { index }
              });
            }}
            onEdit={(): void => {
              setEditingIndex(index);
            }}
          />
        ))}
        {editingIndex === 'new' && (
          <ArrayListItem
            placeholder={placeholder}
            isEditing
            onSubmit={(value: string): void => {
              setEditingIndex(undefined);
              handleAction({
                type: 'UPSERT_ITEM',
                payload: { value }
              });
            }}
            onCancel={(): void => {
              setEditingIndex(undefined);
            }}
          />
        )}
      </List>

      {editingIndex !== 'new' && (
        <Button
          className="elyra-metadataEditor-addItemButton"
          onClick={(): void => {
            setEditingIndex('new');
          }}
        >
          Add Item
        </Button>
      )}
      {error === true && (
        <FormHelperText error>This field is required.</FormHelperText>
      )}
    </div>
  );
};
