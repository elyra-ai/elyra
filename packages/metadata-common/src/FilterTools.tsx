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
import { tagIcon } from '@elyra/ui-components';
import { InputGroup, checkIcon } from '@jupyterlab/ui-components';

import React from 'react';

interface ITagProps {
  value: string;
  selected: boolean;
  id?: string;
  onToggle: (value: string) => any;
}

const Tag: React.FC<ITagProps> = ({ value, selected, onToggle, ...rest }) => {
  const selectedSelector = selected ? 'applied-tag' : 'unapplied-tag';

  return (
    <button
      className={`elyra-filter-tag tag ${selectedSelector}`}
      title={value}
      onClick={(): void => {
        onToggle(value);
      }}
      {...rest}
    >
      <span className="elyra-filter-tag-label">{value}</span>
      {selected && (
        <checkIcon.react
          className="elyra-filter-check"
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
};

interface ITagsProps {
  tags: string[];
  selected: string[];
  onToggle: (value: string) => any;
}

const TagFilter: React.FC<ITagsProps> = ({ tags, selected, ...rest }) => {
  if (!tags.length) {
    return <p className="elyra-filter-empty">No tags defined</p>;
  }

  // make sure:
  // - there aren't any duplicate tags
  // - if a selected tag is deleted, it is still de-selectable
  const cleanedTags = [...new Set([...tags, ...selected])].sort();

  return (
    <React.Fragment>
      {cleanedTags.map(tag => {
        return (
          <Tag
            id={tag}
            key={tag}
            value={tag}
            selected={selected.includes(tag)}
            {...rest}
          />
        );
      })}
    </React.Fragment>
  );
};

interface IProps {
  tags: string[];
  namespaceId: string;
  onFilter: (searchValue: string, filterTags: string[]) => void;
}

// TODO
// we should hoist the query outside of the component so we have a single source
// of truth for selected tags and search
export const FilterTools: React.FC<IProps> = ({
  tags,
  namespaceId,
  onFilter
}) => {
  const [show, setShow] = React.useState(false);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [searchValue, setSearchValue] = React.useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchValue(value);
    onFilter(value, selectedTags);
  };

  const handleToggleTag = (value: string): void => {
    let newSelected;
    if (selectedTags.includes(value)) {
      // remove tag from selected list if it's already there
      newSelected = selectedTags.filter(t => t !== value);
    } else {
      // otherwise add the tag to the selected list
      newSelected = [...selectedTags];
      newSelected.push(value);
    }

    onFilter(searchValue, newSelected);

    setSelectedTags(newSelected);
  };

  return (
    <div className="elyra-filterTools">
      <div className="elyra-searchbar">
        <InputGroup
          className="elyra-searchwrapper"
          type="text"
          placeholder="Search..."
          onChange={handleSearch}
          rightIcon="ui-components:search"
          value={searchValue}
        />
      </div>
      <div className="elyra-filter" id={namespaceId}>
        <button
          title="Filter by tag"
          className="elyra-filter-btn"
          onClick={(): void => {
            setShow(s => !s);
          }}
        >
          <tagIcon.react />
        </button>
        <div className={`elyra-filter-option ${show ? '' : 'idle'}`}>
          <div className="elyra-filter-tag">
            <TagFilter
              tags={tags}
              selected={selectedTags}
              onToggle={handleToggleTag}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
