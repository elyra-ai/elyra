/*
 * Copyright 2018-2022 Elyra Authors
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
        {fileTypes.map(f => (
          <option key={f.id} value={f.id}>
            {f.display_name}
          </option>
        ))}
      </select>
    </>
  );
};

interface IProps {
  runtimeData: IRuntimeData;
  runtimeTypeInfo: IRuntimeType[];
  pipelineType?: string;
  parameters?: {
    name: string;
    default_value?: {
      type: 'String' | 'Integer' | 'Float' | 'Bool';
      value: any;
    };
    type?: string;
    required?: boolean;
  }[];
}

export const PipelineExportDialog: React.FC<IProps> = ({
  runtimeData,
  runtimeTypeInfo,
  pipelineType,
  parameters
}) => {
  return (
    <form className="elyra-dialog-form">
      <RuntimeConfigSelect
        runtimeData={runtimeData}
        pipelineType={pipelineType}
      >
        {(platform): JSX.Element => {
          const info = runtimeTypeInfo.find(i => i.id === platform);
          return <FileTypeSelect fileTypes={info?.export_file_types ?? []} />;
        }}
      </RuntimeConfigSelect>
      <input
        type="checkbox"
        className="elyra-Dialog-checkbox"
        id="overwrite"
        name="overwrite"
      />
      <label htmlFor="overwrite">Replace if file already exists</label>
      <br />
      <br />
      {parameters ? (
        <div>
          <label
            style={{
              fontWeight: '600',
              fontSize: 'var(--jp-content-font-size1)'
            }}
          >
            Parameters
          </label>
          {parameters.map(param => {
            if (!param.name) {
              return undefined;
            }
            let type = 'text';
            switch (param.default_value?.type) {
              case 'Bool':
                type = 'checkbox';
                break;
              case 'Float':
              case 'Integer':
                type = 'number';
                break;
            }
            return (
              <div key={param.name}>
                <label htmlFor={`${param.name}-paramInput`}>
                  {param.name}:
                </label>
                <br />
                <input
                  id={`${param.name}-paramInput`}
                  name={`${param.name}-paramInput`}
                  type={type}
                  defaultValue={param.default_value?.value}
                  data-form-required={param.required}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div />
      )}
    </form>
  );
};
