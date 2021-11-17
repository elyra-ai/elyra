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

import { componentCatalogIcon, dragDropIcon } from '@elyra/ui-components';

import React from 'react';

const HEADER_CLASS = 'empty-pipeline-header';

const COMPONENT_EXAMPLES_URLl =
  'https://github.com/elyra-ai/examples#custom-pipeline-component-examples';

export interface IEmptyPipelineContentProps {
  openComponentCatalog: () => void;
}

export const EmptyPipelineContent: React.FC<IEmptyPipelineContentProps> = ({
  openComponentCatalog
}) => {
  return (
    <div>
      <dragDropIcon.react
        className="drag-drop-icon"
        tag="div"
        elementPosition="center"
        height="120px"
      />
      <div className={HEADER_CLASS}>
        <h3>
          Start your new pipeline by dragging files from the file browser pane
          or by adding a custom component clicking the{' '}
          <button
            className={'open-component-catalog-button'}
            onClick={openComponentCatalog}
          >
            <componentCatalogIcon.react
              className="component-catalog-icon"
              tag="div"
              height="24px"
            />
          </button>{' '}
          button.
          <br />
          <br />
        </h3>
        <h4>
          Refer to
          <a
            href={COMPONENT_EXAMPLES_URLl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {' '}
            component examples{' '}
          </a>
          for more details about adding custom components.
        </h4>
      </div>
    </div>
  );
};
