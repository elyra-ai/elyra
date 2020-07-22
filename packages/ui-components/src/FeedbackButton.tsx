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
 * The CSS class for feedback buttons.
 */
const ELYRA_FEEDBACKBUTTON_CLASS = 'elyra-feedbackButton';

export interface IFeedbackButtonProps {
  feedback?: string;
  onClick: () => string | void;
}

export class FeedbackButton extends React.Component<
  React.HTMLProps<HTMLButtonElement> & IFeedbackButtonProps
> {
  node: React.RefObject<HTMLButtonElement>;

  constructor(props: any) {
    super(props);
    this.node = React.createRef();
  }

  handleClick(): void {
    let feedback = this.props.onClick();
    if (typeof feedback !== 'string') {
      feedback = this.props.feedback;
    }
    if (feedback) {
      this.node.current.setAttribute('data-feedback', feedback);
      setTimeout(() => {
        this.node.current.removeAttribute('data-feedback');
      }, 750);
    }
  }

  render(): React.ReactElement {
    const { children, className } = this.props;
    const classes = `${ELYRA_FEEDBACKBUTTON_CLASS} ${className}`;

    return (
      <button
        title={this.props.title}
        ref={this.node}
        className={classes}
        onClick={(): void => {
          this.handleClick();
        }}
      >
        {children}
      </button>
    );
  }
}
