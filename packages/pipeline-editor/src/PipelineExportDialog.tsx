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

import * as React from 'react';

import { IParameterProps, ParameterInputForm } from './ParameterInputForm';

import { IRuntimeType } from './PipelineService';
import { IRuntimeData } from './runtime-utils';
import RuntimeConfigSelect from './RuntimeConfigSelect';

interface IFileTypeSelectProps {
  fileTypes: { display_name: string; id: string }[];
}

const FileTypeSelect: React.FC<IFileTypeSelectProps> = ({ fileTypes }) => {
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
        {fileTypes.map((f) => (
          <option key={f.id} value={f.id}>
            {f.display_name}
          </option>
        ))}
      </select>
    </>
  );
};

interface IProps extends IParameterProps {
  runtimeData: IRuntimeData;
  runtimeTypeInfo: IRuntimeType[];
  pipelineType?: string;
  exportName: string;
}

export const PipelineExportDialog: React.FC<IProps> = ({
  runtimeData,
  runtimeTypeInfo,
  pipelineType,
  exportName,
  parameters
}) => {
  return (
    <form className="elyra-dialog-form">
      <RuntimeConfigSelect
        runtimeData={runtimeData}
        pipelineType={pipelineType}
      >
        {(platform): JSX.Element => {
          const info = runtimeTypeInfo.find((i) => i.id === platform);
          return <FileTypeSelect fileTypes={info?.export_file_types ?? []} />;
        }}
      </RuntimeConfigSelect>
      <label htmlFor="export_name">Export Filename:</label>
      <br />
      <input
        type="text"
        id="export_name"
        name="export_name"
        defaultValue={exportName}
        data-form-required
      />
      <br />
      <br />
      <input
        type="checkbox"
        className="elyra-Dialog-checkbox"
        id="overwrite"
        name="overwrite"
      />
      <label htmlFor="overwrite">Replace if file already exists</label>
      <br />
      <br />
      <ParameterInputForm parameters={parameters} />
    </form>
  );
};
