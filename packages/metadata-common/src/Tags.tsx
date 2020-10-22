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
import { checkIcon, addIcon } from '@jupyterlab/ui-components';

import React from 'react';

interface IMetadataEditorTagProps {
  selectedTags: string[];
  tags: string[];
  handleChange: (selectedTags: string[], allTags: string[]) => void;
}

interface IMetadataEditorTagState {
  selectedTags: string[];
  tags: string[];
  plusIconShouldHide: boolean;
  addingNewTag: boolean;
}

/**
 * CSS STYLING
 */
const METADATA_EDITOR_TAG = 'jp-codeSnippet-editor-tag';
const METADATA_EDITOR_TAG_PLUS_ICON = 'jp-codeSnippet-editor-tag-plusIcon';
const METADATA_EDITOR_TAG_LIST = 'jp-codeSnippet-editor-tagList';

export class MetadataEditorTags extends React.Component<
  IMetadataEditorTagProps,
  IMetadataEditorTagState
> {
  constructor(props: IMetadataEditorTagProps) {
    super(props);
    console.log('HELLIOO');
    this.state = {
      selectedTags: [],
      tags: [],
      plusIconShouldHide: false,
      addingNewTag: false
    };
    this.renderTags = this.renderTags.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  componentDidMount(): void {
    this.setState({
      selectedTags: this.props.selectedTags ? this.props.selectedTags : [],
      tags: this.props.tags ? this.props.tags : [],
      plusIconShouldHide: false,
      addingNewTag: false
    });
  }

  componentDidUpdate(prevProps: IMetadataEditorTagProps): void {
    if (prevProps !== this.props) {
      this.setState({
        selectedTags: this.props.selectedTags ? this.props.selectedTags : [],
        tags: this.props.tags ? this.props.tags : []
      });
    }
  }

  handleClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    const target = event.target as HTMLElement;
    const clickedTag = target.innerText;
    const parent = target.parentElement;

    this.setState(
      state => ({
        selectedTags: this.handleClickHelper(
          parent,
          state.selectedTags ? state.selectedTags : [],
          clickedTag
        )
      }),
      this.handleOnChange
    );
  }

  handleOnChange(): void {
    this.props.handleChange(this.state.selectedTags, this.state.tags);
  }

  handleClickHelper(
    parent: HTMLElement,
    tags: string[],
    clickedTag: string
  ): string[] {
    const currentTags = tags.slice();
    if (parent.classList.contains('unapplied-tag')) {
      parent.classList.replace('unapplied-tag', 'applied-tag');
      currentTags.splice(-1, 0, clickedTag);
    } else if (parent.classList.contains('applied-tag')) {
      parent.classList.replace('applied-tag', 'unapplied-tag');

      const idx = currentTags.indexOf(clickedTag);
      currentTags.splice(idx, 1);
    }
    return currentTags;
  }

  addTagOnClick(event: React.MouseEvent<HTMLInputElement>): void {
    this.setState({ plusIconShouldHide: true, addingNewTag: true });
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.value === 'Add Tag') {
      inputElement.value = '';
      inputElement.style.width = '62px';
      inputElement.style.minWidth = '62px';
    }
  }

  addTagOnKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    const inputElement = event.target as HTMLInputElement;

    if (inputElement.value !== '' && event.keyCode === 13) {
      if (this.state.tags.includes(inputElement.value)) {
        alert('Duplicate Tag Name!');
        return;
      }

      const newTag = inputElement.value;

      // update state all tag and selected tag
      this.setState(
        state => ({
          selectedTags: [...state.selectedTags, newTag],
          tags: [...state.tags, newTag],
          plusIconShouldHide: false,
          addingNewTag: false
        }),
        this.handleOnChange
      );
    }
  }

  addTagOnBlur(event: React.FocusEvent<HTMLInputElement>): void {
    const inputElement = event.target as HTMLInputElement;
    inputElement.value = 'Add Tag';
    inputElement.style.width = '50px';
    inputElement.style.minWidth = '50px';
    inputElement.blur();
    this.setState({ plusIconShouldHide: false, addingNewTag: false });
  }

  renderTags(): JSX.Element {
    const hasTags = this.state.tags;
    const inputBox =
      this.state.addingNewTag === true ? (
        <ul
          className={`${METADATA_EDITOR_TAG} tag unapplied-tag`}
          key={'editor-new-tag'}
        >
          <input
            onClick={(
              event: React.MouseEvent<HTMLInputElement, MouseEvent>
            ): void => this.addTagOnClick(event)}
            onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>): void =>
              this.addTagOnKeyDown(event)
            }
            onBlur={(event: React.FocusEvent<HTMLInputElement>): void =>
              this.addTagOnBlur(event)
            }
            autoFocus
          />
        </ul>
      ) : (
        <ul className={`${METADATA_EDITOR_TAG} tag unapplied-tag`}>
          <button onClick={(): void => this.setState({ addingNewTag: true })}>
            Add Tag
          </button>
          <addIcon.react
            tag="span"
            className={METADATA_EDITOR_TAG_PLUS_ICON}
            elementPosition="center"
            height="16px"
            width="16px"
            marginLeft="2px"
          />
        </ul>
      );
    return (
      <li className={METADATA_EDITOR_TAG_LIST}>
        {hasTags
          ? this.state.tags.map((tag: string, index: number) =>
              ((): JSX.Element => {
                if (!this.state.selectedTags) {
                  return (
                    <ul
                      className={`${METADATA_EDITOR_TAG} tag unapplied-tag`}
                      id={'editor' + '-' + tag + '-' + index}
                      key={'editor' + '-' + tag + '-' + index}
                    >
                      <button onClick={this.handleClick}>{tag}</button>
                    </ul>
                  );
                }

                if (this.state.selectedTags.includes(tag)) {
                  return (
                    <ul
                      className={`${METADATA_EDITOR_TAG} tag applied-tag`}
                      id={'editor' + '-' + tag + '-' + index}
                      key={'editor' + '-' + tag + '-' + index}
                    >
                      <button onClick={this.handleClick}>{tag}</button>
                      <checkIcon.react
                        tag="span"
                        elementPosition="center"
                        height="18px"
                        width="18px"
                        marginLeft="5px"
                        marginRight="-3px"
                      />
                    </ul>
                  );
                } else {
                  return (
                    <ul
                      className={`${METADATA_EDITOR_TAG} tag unapplied-tag`}
                      id={'editor' + '-' + tag + '-' + index}
                      key={'editor' + '-' + tag + '-' + index}
                    >
                      <button onClick={this.handleClick}>{tag}</button>
                    </ul>
                  );
                }
              })()
            )
          : null}
        {inputBox}
      </li>
    );
  }

  render(): JSX.Element {
    return <div>{this.renderTags()}</div>;
  }
}
