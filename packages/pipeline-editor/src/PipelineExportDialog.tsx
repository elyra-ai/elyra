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

import * as React from 'react';

import { IRuntimeData } from './runtime-utils';
import RuntimeConfigSelect from './RuntimeConfigSelect';

// TODO - these (xxx_FILE_TYPES) should eventually come from platform implementations
const FILE_TYPE_MAP: Record<string, { displayName: string; id: string }[]> = {
  KUBEFLOW_PIPELINES: [
    {
      displayName: 'KFP domain-specific language Python code',
      id: 'py'
    },
    {
      displayName: 'KFP static configuration file (YAML formatted)',
      id: 'yaml'
    }
  ],
  APACHE_AIRFLOW: [
    {
      displayName: 'Airflow domain-specific language Python code',
      id: 'py'
    }
  ]
};

interface IFileTypeSelectProps {
  platform: string;
  // TODO: remove this prop
  temporarilyDissablePythonDSLForKFPSpecificPipelines?: boolean;
}

const FileTypeSelect: React.FC<IFileTypeSelectProps> = ({
  platform,
  temporarilyDissablePythonDSLForKFPSpecificPipelines
}) => {
  // TODO: remove temporary workaround for KFP Python DSL export option
  // See https://github.com/elyra-ai/elyra/issues/1760 for context.
  const fileTypes = FILE_TYPE_MAP[platform].filter(t => {
    if (temporarilyDissablePythonDSLForKFPSpecificPipelines && t.id === 'py') {
      return false;
    }
    return true;
  });

  return (
    <>
      <label htmlFor="pipeline_filetype">Export Pipeline as:</label>
      <br />
      <select
        id="pipeline_filetype"
        name="pipeline_filetype"
        className="elyra-form-export-filetype"
        data-form-required
      >
        {fileTypes.map(f => (
          <option key={f.id} value={f.id}>
            {f.displayName}
          </option>
        ))}
      </select>
    </>
  );
};

interface IProps {
  runtimeData: IRuntimeData;
  pipelineType?: string;
}

export const PipelineExportDialog: React.FC<IProps> = ({
  runtimeData,
  pipelineType
}) => {
  return (
    <form className="elyra-dialog-form">
      <RuntimeConfigSelect
        runtimeData={runtimeData}
        pipelineType={pipelineType}
      >
        {(platform): JSX.Element => (
          <FileTypeSelect
            platform={platform}
            temporarilyDissablePythonDSLForKFPSpecificPipelines={!!pipelineType}
          />
        )}
      </RuntimeConfigSelect>
      <input
        type="checkbox"
        className="elyra-Dialog-checkbox"
        id="overwrite"
        name="overwrite"
      />
      <label htmlFor="overwrite">Replace if file already exists</label>
      <br />
    </form>
  );
};
