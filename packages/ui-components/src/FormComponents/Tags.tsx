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
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { checkIcon, addIcon } from '@jupyterlab/ui-components';

import React from 'react';

interface ITagProps {
  selectedTags: string[];
  tags: string[];
  handleChange: (selectedTags: string[], allTags: string[]) => void;
}

/**
 * CSS STYLING
 */
const FORM_EDITOR_TAG = 'elyra-editor-tag';
const FORM_EDITOR_TAG_PLUS_ICON = 'elyra-editor-tag-plusIcon';
const FORM_EDITOR_TAG_LIST = 'elyra-editor-tagList';
const FORM_EDITOR_INPUT_TAG = 'elyra-inputTag';

export const Tags: React.FC<ITagProps> = ({
  selectedTags,
  tags,
  handleChange,
}) => {
  const [selected, setSelectedTags] = React.useState<string[]>(
    selectedTags ?? [],
  );
  const [allTags, setTags] = React.useState<string[]>(tags ?? []);
  const [addingNewTag, setAddingNewTag] = React.useState<boolean>(false);

  React.useEffect(() => {
    handleChange(selected, allTags);
  }, [selected, allTags, handleChange]);

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ): void => {
    const target = event.currentTarget as HTMLElement;
    const clickedTag = target.innerText;
    const updatedTags: string[] = Object.assign([], selected);
    const tagIndex = selected.indexOf(clickedTag);
    if (tagIndex === -1) {
      updatedTags.push(clickedTag);
    } else {
      updatedTags.splice(tagIndex, 1);
    }
    setSelectedTags(updatedTags);
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
    event: React.KeyboardEvent<HTMLInputElement>,
  ): Promise<void> => {
    const inputElement = event.target as HTMLInputElement;

    const newTag = inputElement.value.trim();
    if (newTag !== '' && event.keyCode === 13) {
      if (allTags.includes(newTag)) {
        event.preventDefault();
        await showDialog({
          title: 'A tag with this label already exists.',
          buttons: [Dialog.okButton()],
        });
        return;
      }

      // update state all tag and selected tag
      setSelectedTags([...selected, newTag]);
      setTags([...allTags, newTag]);
      setAddingNewTag(false);
    } else if (event.keyCode === 13) {
      event.preventDefault();
      setAddingNewTag(false);
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
        className={`${FORM_EDITOR_TAG} tag unapplied-tag`}
        key={'editor-new-tag'}
      >
        <input
          className={`${FORM_EDITOR_INPUT_TAG}`}
          onClick={(
            event: React.MouseEvent<HTMLInputElement, MouseEvent>,
          ): void => addTagOnClick(event)}
          onKeyDown={async (
            event: React.KeyboardEvent<HTMLInputElement>,
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
        className={`${FORM_EDITOR_TAG} tag unapplied-tag`}
      >
        Add Tag
        <addIcon.react
          tag="span"
          className={FORM_EDITOR_TAG_PLUS_ICON}
          elementPosition="center"
          height="16px"
          width="16px"
          marginLeft="2px"
        />
      </button>
    );

  return (
    <li className={FORM_EDITOR_TAG_LIST}>
      {hasTags
        ? allTags.map((tag: string, index: number) =>
            ((): JSX.Element => {
              if (!selected) {
                return (
                  <button
                    onClick={handleClick}
                    className={`${FORM_EDITOR_TAG} tag unapplied-tag`}
                    id={`editor-${tag}-${index}`}
                    key={`editor-${tag}-${index}`}
                  >
                    {tag}
                  </button>
                );
              }

              if (selected.includes(tag)) {
                return (
                  <button
                    onClick={handleClick}
                    className={`${FORM_EDITOR_TAG} tag applied-tag`}
                    id={`editor-${tag}-${index}`}
                    key={`editor-${tag}-${index}`}
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
                    className={`${FORM_EDITOR_TAG} tag unapplied-tag`}
                    id={`editor-${tag}-${index}`}
                    key={`editor-${tag}-${index}`}
                  >
                    {tag}
                  </button>
                );
              }
            })(),
          )
        : null}
      {inputBox}
    </li>
  );
};

interface ITagsFieldProps {
  errorSchema: Record<string, any>;
  formData?: string[];
  formContext: {
    allTags?: string[];
    updateAllTags?: (tags: string[]) => void;
  };
  onChange: (selectedTags: string[]) => void;
}

export const TagsField: React.FC<ITagsFieldProps> = (
  props: ITagsFieldProps,
) => {
  const errors = [];
  if (Object.keys(props.errorSchema).length > 0) {
    for (const i in props.errorSchema) {
      for (const err of (props.errorSchema[i] as any)['__errors']) {
        errors.push(<li className="text-danger">{err}</li>);
      }
    }
  }
  return (
    <div>
      <Tags
        selectedTags={props.formData ?? []}
        tags={props.formContext.allTags ?? []}
        handleChange={(selectedTags: string[], allTags: string[]): void => {
          props.onChange(selectedTags);
          props.formContext.updateAllTags?.(allTags);
        }}
      />
      {Object.keys(props.errorSchema).length > 0 ? (
        <ul className="error-detail bs-callout bs-callout-info">{errors}</ul>
      ) : undefined}
    </div>
  );
};
