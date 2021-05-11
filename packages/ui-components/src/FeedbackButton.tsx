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

export const FeedbackButton: React.FC<React.HTMLProps<HTMLButtonElement> &
  IFeedbackButtonProps> = props => {
  const node: React.RefObject<HTMLButtonElement> = React.createRef();

  const handleClick = (): void => {
    let feedback = props.onClick();
    if (typeof feedback !== 'string') {
      feedback = props.feedback;
    }
    if (feedback) {
      node.current.setAttribute('data-feedback', feedback);
      setTimeout(() => {
        node.current.removeAttribute('data-feedback');
      }, 750);
    }
  };

  const { children, className } = props;
  const classes = `${ELYRA_FEEDBACKBUTTON_CLASS} ${className}`;

  return (
    <button
      title={props.title}
      ref={node}
      className={classes}
      onClick={(): void => handleClick()}
    >
      {children}
    </button>
  );
};
