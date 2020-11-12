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

import {
  caretDownIcon,
  caretRightIcon,
  LabIcon
} from '@jupyterlab/ui-components';
import * as React from 'react';

import { FeedbackButton } from './FeedbackButton';

/**
 * The CSS class for expandable containers.
 */
const DETAILS_VISIBLE_CLASS = 'elyra-expandableContainer-details-visible';
const DETAILS_HIDDEN_CLASS = 'elyra-expandableContainer-details-hidden';
const DISPLAY_NAME_CLASS = 'elyra-expandableContainer-name';
const ELYRA_BUTTON_CLASS = 'elyra-button';
const BUTTON_CLASS = 'elyra-expandableContainer-button';
const TITLE_CLASS = 'elyra-expandableContainer-title';
const ACTION_BUTTONS_WRAPPER_CLASS = 'elyra-expandableContainer-action-buttons';
const ACTION_BUTTON_CLASS = 'elyra-expandableContainer-actionButton';
const DRAGGABLE_CLASS = 'elyra-expandableContainer-draggable';

/**
 * Expandable container props.
 */
export interface IExpandableActionButton {
  title: string;
  icon: LabIcon;
  onClick: Function;
  feedback?: string;
}

export interface IExpandableComponentProps {
  displayName: string;
  tooltip: string;
  actionButtons?: IExpandableActionButton[];
  onExpand?: Function;
  onBeforeExpand?: Function;
  onMouseDown?: Function;
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
    if (this.props.onBeforeExpand) {
      this.props.onBeforeExpand(newExpandFlag);
    }
    this.setState({ expanded: newExpandFlag });
  }

  componentDidUpdate(): void {
    if (this.props.onExpand) {
      this.props.onExpand(this.state.expanded);
    }
  }

  render(): React.ReactElement {
    const buttonClasses = [ELYRA_BUTTON_CLASS, BUTTON_CLASS].join(' ');
    const actionButtons = this.props.actionButtons || [];

    return (
      <div>
        <div key={this.props.displayName} className={TITLE_CLASS}>
          <button
            className={buttonClasses}
            title={this.state.expanded ? 'Hide Details' : 'Show Details'}
            onClick={(): void => {
              this.toggleDetailsDisplay();
            }}
          >
            {this.state.expanded ? (
              <caretDownIcon.react
                tag="span"
                elementPosition="center"
                width="20px"
              />
            ) : (
              <caretRightIcon.react
                tag="span"
                elementPosition="center"
                width="20px"
              />
            )}
          </button>
          <span
            title={this.props.tooltip}
            className={
              this.props.onMouseDown
                ? DISPLAY_NAME_CLASS
                : DISPLAY_NAME_CLASS + ' ' + DRAGGABLE_CLASS
            }
            onClick={(): void => {
              this.toggleDetailsDisplay();
            }}
            onMouseDown={(event): void => {
              this.props.onMouseDown && this.props.onMouseDown(event);
            }}
          >
            {this.props.displayName}
          </span>

          <div className={ACTION_BUTTONS_WRAPPER_CLASS}>
            {actionButtons.map((btn: IExpandableActionButton) => {
              return (
                <FeedbackButton
                  key={btn.title}
                  title={btn.title}
                  feedback={btn.feedback || ''}
                  className={buttonClasses + ' ' + ACTION_BUTTON_CLASS}
                  onClick={(): void => {
                    btn.onClick();
                  }}
                >
                  <btn.icon.react
                    tag="span"
                    elementPosition="center"
                    width="16px"
                  />
                </FeedbackButton>
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
