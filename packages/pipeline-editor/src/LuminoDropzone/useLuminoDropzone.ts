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
import { useCallback, useEffect, useRef } from 'react';

import { ILuminoElement } from './types';

interface IProps {
  onDrop: (x: number, y: number) => any;
}

interface IReturn {
  getRootProps: () => void;
}

interface IRootProps {
  ref: React.MutableRefObject<ILuminoElement>;
}

export const useLuminoDropzone = ({ onDrop }: IProps): IReturn => {
  const rootRef = useRef<ILuminoElement>(null);

  const handleEvent = useCallback((e: Event): void => {
    switch (e.type) {
      case 'dragenter':
      case 'dragover':
        e.preventDefault();
        break;
    }
  }, []);

  const handleLuminoEvent = useCallback(
    (e: IDragEvent): void => {
      switch (e.type) {
        case 'lm-dragenter':
          e.preventDefault();
          break;
        case 'lm-dragover':
          e.preventDefault();
          e.stopPropagation();
          e.dropAction = e.proposedAction;
          break;
        case 'lm-drop':
          e.preventDefault();
          e.stopPropagation();
          onDrop(e.offsetX, e.offsetY);
          break;
      }
    },
    [onDrop]
  );

  useEffect(() => {
    const node = rootRef.current;
    node?.addEventListener('dragenter', handleEvent);
    node?.addEventListener('dragover', handleEvent);

    node?.addEventListener('lm-dragenter', handleLuminoEvent);
    node?.addEventListener('lm-dragover', handleLuminoEvent);
    node?.addEventListener('lm-drop', handleLuminoEvent);

    return (): void => {
      node?.removeEventListener('dragenter', handleEvent);
      node?.removeEventListener('dragover', handleEvent);

      node?.removeEventListener('lm-dragenter', handleLuminoEvent);
      node?.removeEventListener('lm-dragover', handleLuminoEvent);
      node?.removeEventListener('lm-drop', handleLuminoEvent);
    };
  }, [handleEvent, handleLuminoEvent]);

  return {
    getRootProps: (): IRootProps => ({
      ref: rootRef
    })
  };
};
