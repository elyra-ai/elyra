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
import { IDragEvent } from '@lumino/dragdrop';
import React, { useCallback, useEffect, useRef } from 'react';

declare global {
  // eslint-disable-next-line @typescript-eslint/interface-name-prefix
  interface HTMLElementEventMap {
    'lm-dragenter': IDragEvent;
    'lm-dragleave': IDragEvent;
    'lm-dragover': IDragEvent;
    'lm-drop': IDragEvent;
  }
}

interface IRootProps {
  ref: React.MutableRefObject<HTMLDivElement>;
}

interface IProps {
  onDragEnter?: (e: IDragEvent) => any;
  onDragLeave?: (e: IDragEvent) => any;
  onDragOver?: (e: IDragEvent) => any;
  onDrop?: (e: IDragEvent) => any;
}

interface IReturn {
  getRootProps: () => IRootProps;
}

export const useDropzone = (props: IProps): IReturn => {
  const rootRef = useRef<HTMLDivElement>(null);

  const handleEvent = useCallback(
    (e: IDragEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      switch (e.type) {
        case 'lm-dragenter':
          props.onDragEnter?.(e);
          break;
        case 'lm-dragleave':
          props.onDragLeave?.(e);
          break;
        case 'lm-dragover':
          e.dropAction = e.proposedAction;
          props.onDragOver?.(e);
          break;
        case 'lm-drop':
          props.onDrop?.(e);
          break;
      }
    },
    [props]
  );

  useEffect(() => {
    const node = rootRef.current;
    node?.addEventListener('lm-dragenter', handleEvent);
    node?.addEventListener('lm-dragleave', handleEvent);
    node?.addEventListener('lm-dragover', handleEvent);
    node?.addEventListener('lm-drop', handleEvent);

    return (): void => {
      node?.removeEventListener('lm-dragenter', handleEvent);
      node?.removeEventListener('lm-dragleave', handleEvent);
      node?.removeEventListener('lm-dragover', handleEvent);
      node?.removeEventListener('lm-drop', handleEvent);
    };
  }, [handleEvent]);

  return {
    getRootProps: (): IRootProps => ({
      ref: rootRef
    })
  };
};

export const Dropzone: React.FC<IProps> = ({ children, ...rest }) => {
  const { getRootProps } = useDropzone(rest);

  return (
    <div style={{ height: '100%' }} {...getRootProps()}>
      {children}
    </div>
  );
};
