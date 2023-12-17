/*
 * Copyright 2018-2023 Elyra Authors
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
import { settingsIcon } from '@jupyterlab/ui-components';

import React from 'react';

const HEADER_CLASS = 'empty-pipeline-header';
const BUTTON_CLASS = 'empty-pipeline-button';
const ICON_CLASS = 'empty-pipeline-icon';

export interface IEmptyGenericPipelineProps {
  onOpenSettings: () => void;
}

export const EmptyGenericPipeline: React.FC<IEmptyGenericPipelineProps> = ({
  onOpenSettings,
}) => {
  return (
    <div>
      <dragDropIcon.react
        className="drag-drop-icon"
        tag="div"
        elementPosition="center"
        height="120px"
      />
      <h3 className={HEADER_CLASS}>
        Start your new pipeline by dragging files from the file browser pane
      </h3>
      <br />
      <br />
      <h3 className={HEADER_CLASS}>
        Click{' '}
        <button
          title="Settings"
          className={BUTTON_CLASS}
          onClick={onOpenSettings}
        >
          <settingsIcon.react className={ICON_CLASS} tag="div" height="24px" />
        </button>{' '}
        to configure the pipeline editor.
      </h3>
    </div>
  );
};

export interface IEmptyPlatformSpecificPipelineProps {
  onOpenCatalog: () => void;
  onOpenSettings: () => void;
}

export const EmptyPlatformSpecificPipeline: React.FC<
  IEmptyPlatformSpecificPipelineProps
> = ({ onOpenCatalog, onOpenSettings }) => {
  // Note: the URL is rewritten by the release script by replacing `latest` with a
  // specific version number, e.g. https://.../en/v3.6.0/user_guide/pi...
  const customComponentsHelpTopicURL =
    'https://elyra.readthedocs.io/en/latest/user_guide/pipeline-components.html';

  return (
    <div>
      <dragDropIcon.react
        className="drag-drop-icon"
        tag="div"
        elementPosition="center"
        height="120px"
      />
      <h3 className={HEADER_CLASS}>
        Start your new pipeline by dragging files from the file browser pane or
        add custom components by clicking the{' '}
        <button className={BUTTON_CLASS} onClick={onOpenCatalog}>
          <componentCatalogIcon.react
            className={ICON_CLASS}
            tag="div"
            height="24px"
          />
        </button>{' '}
        button.
      </h3>
      <h4 className={HEADER_CLASS}>
        Refer to the
        <a
          href={customComponentsHelpTopicURL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {' '}
          &apos;pipeline components&apos; help topic{' '}
        </a>
        for details.
      </h4>
      <br />
      <br />
      <h3 className={HEADER_CLASS}>
        Click{' '}
        <button
          title="Settings"
          className={BUTTON_CLASS}
          onClick={onOpenSettings}
        >
          <settingsIcon.react className={ICON_CLASS} tag="div" height="24px" />
        </button>{' '}
        to configure the pipeline editor.
      </h3>
    </div>
  );
};
