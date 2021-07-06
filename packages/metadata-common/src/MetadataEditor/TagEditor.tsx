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

import { Dialog, showDialog } from '@jupyterlab/apputils';
import { checkIcon, addIcon } from '@jupyterlab/ui-components';

import * as React from 'react';

interface IInputBoxProps {
  onCreateTag(tag: string): any;
}

const InputBox: React.FC<IInputBoxProps> = ({ onCreateTag }) => {
  const [width, setWidth] = React.useState<string>();
  const [value, setValue] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);

  const handleTagClick: React.MouseEventHandler = () => {
    setIsEditing(false);
    if (value === 'Add Tag') {
      setValue('');
      setWidth('62px');
    }
  };

  const handleKeyDown: React.KeyboardEventHandler = e => {
    const newTag = (e.target as HTMLInputElement).value.trim();
    // TODO: Nick
    // setValue?

    if (newTag !== '' && e.key === 'Enter') {
      setIsEditing(false);
      onCreateTag(newTag);
    }
  };

  const handleTagBlur: React.FocusEventHandler = () => {
    setWidth('50px');
    // TODO: Nick
    // Why do they blur onBlur?
    // inputElement.blur();
    setValue('Add Tag');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <ul className="elyra-editor-tag tag unapplied-tag">
        <input
          className="elyra-inputTag"
          value={value}
          style={{
            width,
            minWidth: width
          }}
          onClick={handleTagClick}
          onKeyDown={handleKeyDown}
          onBlur={handleTagBlur}
          autoFocus
        />
      </ul>
    );
  }

  return (
    <button
      onClick={(): void => {
        setIsEditing(true);
      }}
      className="elyra-editor-tag tag unapplied-tag"
    >
      Add Tag
      <addIcon.react
        tag="span"
        className="elyra-editor-tag-plusIcon"
        elementPosition="center"
        height="16px"
        width="16px"
        marginLeft="2px"
      />
    </button>
  );
};

interface IProps {
  selectedTags: string[];
  tags: string[];
  handleChange: (selectedTags: string[], allTags: string[]) => void;
}

export const TagEditor: React.FC<IProps> = ({
  tags,
  selectedTags,
  handleChange
}) => {
  const handleCreateTag = (tag: string): void => {
    // TODO: Nick
    // This should probably be hoisted into the editor
    if (tags.includes(tag)) {
      // TODO: Nick
      // Make sure this still works when not awaited
      // e.preventDefault();
      showDialog({
        title: 'A tag with this label already exists.',
        buttons: [Dialog.okButton()]
      });
      return;
    }
    // TODO: Nick
    // broadcast changes
    // handleChange(selectedTags, allTags);
  };

  const handleToggle = (): void => {
    // TODO
  };

  return (
    <div>
      <li className="elyra-editor-tagList">
        {tags !== undefined &&
          tags.map((tag: string, index: number) => {
            const isSelected = selectedTags.includes(tag);

            return (
              <button
                onClick={handleToggle}
                className={`elyra-editor-tag tag ${
                  isSelected ? 'applied-tag' : 'unapplied-tag'
                }`}
                id={'editor' + '-' + tag + '-' + index}
                key={'editor' + '-' + tag + '-' + index}
              >
                {tag}
                {isSelected && (
                  <checkIcon.react
                    tag="span"
                    elementPosition="center"
                    height="18px"
                    width="18px"
                    marginLeft="5px"
                    marginRight="-3px"
                  />
                )}
              </button>
            );
          })}
        <InputBox onCreateTag={handleCreateTag} />
      </li>
    </div>
  );
};
