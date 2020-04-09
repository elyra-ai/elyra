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

import '../style/index.css';

import * as React from 'react';

/**
 * The CSS class for expandable containers.
 */
const DETAILS_VISIBLE_CLASS = 'elyra-expandableContainer-details-visible';
const DETAILS_HIDDEN_CLASS = 'elyra-expandableContainer-details-hidden';
const DISPLAY_NAME_CLASS = 'elyra-expandableContainer-name';
const BUTTON_CLASS = 'elyra-button';
const DOWN_ICON_CLASS = 'elyra-downArrow-icon';
const UP_ICON_CLASS = 'elyra-upArrow-icon';
const ACTION_BUTTON_CLASS = 'elyra-expandableContainer-button';
const TITLE_CLASS = 'elyra-expandableContainer-title';
const ACTION_BUTTONS_WRAPPER_CLASS = 'elyra-expandableContainer-action-buttons';

/**
 * Expandable container props.
 */
export interface IExpandableActionButton {
  title: string;
  iconClass: string;
  onClick: Function;
}

export interface IExpandableComponentProps {
  displayName: string;
  tooltip: string;
  actionButtons: IExpandableActionButton[];
}

export interface IExpandableComponentState {
  expanded: boolean;
}

/**
 * A React component for expandable containers.
 */
export class ExpandableComponent extends React.Component<
  IExpandableComponentProps,
  IExpandableComponentState
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
    const buttonClasses = [BUTTON_CLASS, ACTION_BUTTON_CLASS].join(' ');

    return (
      <div>
        <div key={this.props.displayName} className={TITLE_CLASS}>
          <button
            className={
              buttonClasses +
              ' ' +
              (this.state.expanded ? UP_ICON_CLASS : DOWN_ICON_CLASS)
            }
            onClick={(): void => {
              this.toggleDetailsDisplay();
            }}
          ></button>
          <span
            title={this.props.tooltip}
            className={DISPLAY_NAME_CLASS}
            onClick={(): void => {
              this.toggleDetailsDisplay();
            }}
          >
            {this.props.displayName}
          </span>

          <div className={ACTION_BUTTONS_WRAPPER_CLASS}>
            {this.props.actionButtons.map((btn: IExpandableActionButton) => {
              return (
                <button
                  key={btn.title}
                  title={btn.title}
                  className={buttonClasses + ' ' + btn.iconClass}
                  onClick={(): void => {
                    btn.onClick();
                  }}
                ></button>
              );
            })}
          </div>
        </div>
        <div
          className={
            this.state.expanded ? DETAILS_VISIBLE_CLASS : DETAILS_HIDDEN_CLASS
          }
        >
          {this.props.children ? this.props.children : null}
        </div>
      </div>
    );
  }
}
