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

import * as React from 'react';
import '../style/index.css';

/**
 * The CSS class added to code snippet widget.
 */

// TODO: USE CLASS NAMES BELOW
// const DETAILS_VISIBLE_CLASS = 'elyra-expandableContainer-details-visible';
// const DETAILS_HIDDEN_CLASS = 'elyra-expandableContainer-details-hidden';
// const DISPLAY_NAME_CLASS = 'elyra-expandableContainer-name';
// const BUTTON_CLASS = 'elyra-expandableContainer-button';

const CODE_DISPLAY_VISIBLE_CLASS = 'elyra-codeSnippet-codeDisplay-visible';
const CODE_DISPLAY_HIDDEN_CLASS = 'elyra-codeSnippet-codeDisplay-hidden';
const CODE_SNIPPETS_NAME_CLASS = 'elyra-codeSnippet-name';
const ROW_BUTTON_CLASS = 'elyra-codeSnippet-rowButton';

const DOWN_ICON_CLASS = 'elyra-downArrow-icon';
const UP_ICON_CLASS = 'elyra-upArrow-icon';

/**
 * A React component for expandable containers.
 */
export interface IExpandableComponentProps {
  displayName: string;
}

export class ExpandableComponent extends React.Component<
  IExpandableComponentProps,
  any
> {
  constructor(props: any) {
    super(props);
    this.state = { expanded: false };
  }

  toggleDetailsDisplay(): void {
    // Switch expanded flag
    const newExpandFlag = !this.state.expanded;
    this.setState({ expanded: newExpandFlag });
  }

  render(): React.ReactElement {
    return (
      <div>
        <div>
          <span>
            <button
              className={
                ROW_BUTTON_CLASS +
                ' ' +
                (this.state.expanded ? UP_ICON_CLASS : DOWN_ICON_CLASS)
              }
              onClick={(): void => {
                this.toggleDetailsDisplay();
              }}
            ></button>
          </span>
          <span
            className={CODE_SNIPPETS_NAME_CLASS}
            onClick={(): void => {
              this.toggleDetailsDisplay();
            }}
          >
            {this.props.displayName}
          </span>
        </div>
        <div
          className={
            this.state.expanded
              ? CODE_DISPLAY_VISIBLE_CLASS
              : CODE_DISPLAY_HIDDEN_CLASS
          }
        >
          {this.props.children ? this.props.children : null}
        </div>
      </div>
    );
  }
}
