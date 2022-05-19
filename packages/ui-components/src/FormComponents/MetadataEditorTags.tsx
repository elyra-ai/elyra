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
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { checkIcon, addIcon } from '@jupyterlab/ui-components';
import { Field } from '@rjsf/core';

import React from 'react';

interface IMetadataEditorTagProps {
  selectedTags: string[];
  tags: string[];
  handleChange: (selectedTags: string[], allTags: string[]) => void;
}

interface IMetadataEditorTagState {
  selectedTags: string[];
  tags: string[];
  addingNewTag: boolean;
}

/**
 * CSS STYLING
 */
const METADATA_EDITOR_TAG = 'elyra-editor-tag';
const METADATA_EDITOR_TAG_PLUS_ICON = 'elyra-editor-tag-plusIcon';
const METADATA_EDITOR_TAG_LIST = 'elyra-editor-tagList';
const METADATA_EDITOR_INPUT_TAG = 'elyra-inputTag';

export const MetadataEditorTags: React.FC<IMetadataEditorTagProps> = props => {
  const [selectedTags, setSelectedTags] = React.useState<string[]>(
    props.selectedTags ?? []
  );
  const [tags, setTags] = React.useState<string[]>(props.tags ?? []);
  const [addingNewTag, setAddingNewTag] = React.useState<boolean>(false);

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ): void => {
    const target = event.target as HTMLElement;
    const clickedTag = target.innerText;

    setSelectedTags(updateTagsCss(target, selectedTags ?? [], clickedTag));
    handleOnChange();
  };

  const handleOnChange = (): void => {
    props.handleChange(selectedTags, tags);
  };

  const updateTagsCss = (
    target: HTMLElement,
    tags: string[],
    clickedTag: string
  ): string[] => {
    const currentTags = tags.slice();
    if (target.classList.contains('unapplied-tag')) {
      target.classList.replace('unapplied-tag', 'applied-tag');
      currentTags.splice(-1, 0, clickedTag);
    } else if (target.classList.contains('applied-tag')) {
      target.classList.replace('applied-tag', 'unapplied-tag');

      const idx = currentTags.indexOf(clickedTag);
      currentTags.splice(idx, 1);
    }
    return currentTags;
  };

  const addTagOnClick = (event: React.MouseEvent<HTMLInputElement>): void => {
    setAddingNewTag(true);
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.value === 'Add Tag') {
      inputElement.value = '';
      inputElement.style.width = '62px';
      inputElement.style.minWidth = '62px';
    }
  };

  const addTagOnKeyDown = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ): Promise<void> => {
    const inputElement = event.target as HTMLInputElement;

    if (inputElement.value !== '' && event.keyCode === 13) {
      if (tags.includes(inputElement.value)) {
        event.preventDefault();
        await showDialog({
          title: 'A tag with this label already exists.',
          buttons: [Dialog.okButton()]
        });
        return;
      }

      const newTag = inputElement.value;

      // update state all tag and selected tag
      setSelectedTags([...selectedTags, newTag]);
      setTags([...tags, newTag]);
      setAddingNewTag(false);
      handleOnChange();
    }
  };

  const addTagOnBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    const inputElement = event.target as HTMLInputElement;
    inputElement.value = 'Add Tag';
    inputElement.style.width = '50px';
    inputElement.style.minWidth = '50px';
    inputElement.blur();
    setAddingNewTag(false);
  };

  const hasTags = tags;
  const inputBox =
    addingNewTag === true ? (
      <ul
        className={`${METADATA_EDITOR_TAG} tag unapplied-tag`}
        key={'editor-new-tag'}
      >
        <input
          className={`${METADATA_EDITOR_INPUT_TAG}`}
          onClick={(
            event: React.MouseEvent<HTMLInputElement, MouseEvent>
          ): void => addTagOnClick(event)}
          onKeyDown={async (
            event: React.KeyboardEvent<HTMLInputElement>
          ): Promise<void> => {
            await addTagOnKeyDown(event);
          }}
          onBlur={(event: React.FocusEvent<HTMLInputElement>): void =>
            addTagOnBlur(event)
          }
          autoFocus
        />
      </ul>
    ) : (
      <button
        onClick={(): void => setAddingNewTag(true)}
        className={`${METADATA_EDITOR_TAG} tag unapplied-tag`}
      >
        Add Tag
        <addIcon.react
          tag="span"
          className={METADATA_EDITOR_TAG_PLUS_ICON}
          elementPosition="center"
          height="16px"
          width="16px"
          marginLeft="2px"
        />
      </button>
    );

  return (
    <div>
      <label className="control-label"> Tags </label>
      <li className={METADATA_EDITOR_TAG_LIST}>
        {hasTags
          ? tags.map((tag: string, index: number) =>
              ((): JSX.Element => {
                if (!selectedTags) {
                  return (
                    <button
                      onClick={handleClick}
                      className={`${METADATA_EDITOR_TAG} tag unapplied-tag`}
                      id={'editor' + '-' + tag + '-' + index}
                      key={'editor' + '-' + tag + '-' + index}
                    >
                      {tag}
                    </button>
                  );
                }

                if (selectedTags.includes(tag)) {
                  return (
                    <button
                      onClick={handleClick}
                      className={`${METADATA_EDITOR_TAG} tag applied-tag`}
                      id={'editor' + '-' + tag + '-' + index}
                      key={'editor' + '-' + tag + '-' + index}
                    >
                      {tag}
                      <checkIcon.react
                        tag="span"
                        elementPosition="center"
                        height="18px"
                        width="18px"
                        marginLeft="5px"
                        marginRight="-3px"
                      />
                    </button>
                  );
                } else {
                  return (
                    <button
                      onClick={handleClick}
                      className={`${METADATA_EDITOR_TAG} tag unapplied-tag`}
                      id={'editor' + '-' + tag + '-' + index}
                      key={'editor' + '-' + tag + '-' + index}
                    >
                      {tag}
                    </button>
                  );
                }
              })()
            )
          : null}
        {inputBox}
      </li>
    </div>
  );
};

export const MetadataEditorTagsField: Field = props => {
  return (
    <MetadataEditorTags
      selectedTags={props.formData ?? []}
      tags={props.formContext.allTags ?? []}
      handleChange={(selectedTags: string[], allTags: string[]): void => {
        props.onChange(selectedTags);
        props.formContext.updateAllTags?.(allTags);
      }}
    />
  );
};
