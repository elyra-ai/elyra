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

import { DialogSelector } from './DialogSelector';

import {
  KFP_SCHEMA,
  IRuntime,
  ISchema,
  PipelineService
} from './PipelineService';

const KFP_FILE_TYPES = [
  { label: 'KFP domain-specific language Python code', key: 'py' },
  { label: 'KFP static configuration file (YAML formatted)', key: 'yaml' }
];

const AIRFLOW_FILE_TYPES = [
  { label: 'Airflow domain-specific language Python code', key: 'py' }
];

interface IProps {
  runtimes: IRuntime[];
  schema: ISchema[];
  runtime?: string;
}

const getFileTypes = (platformSelection: string): Record<string, string>[] => {
  if (!platformSelection) {
    return new Array<Record<string, string>>();
  } else if (platformSelection === KFP_SCHEMA) {
    return KFP_FILE_TYPES;
  }
  return AIRFLOW_FILE_TYPES;
};

export const PipelineExportDialog: React.FC<IProps> = ({
  runtimes,
  schema,
  runtime
}) => {
  const [runtimeOptions, setRuntimeOptions] = React.useState(
    new Array<IRuntime>()
  );
  const [fileTypes, setFileTypes] = React.useState(
    new Array<Record<string, string>>()
  );
  const [validSchemas, setValidSchemas] = React.useState(new Array<ISchema>());

  const handleUpdate = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      const selectedPlatform = event.target.value;
      const filteredRuntimes = PipelineService.filterRuntimes(
        runtimes,
        selectedPlatform
      );
      setRuntimeOptions(filteredRuntimes);
      setFileTypes(getFileTypes(selectedPlatform));
    },
    [runtimes]
  );

  React.useEffect((): void => {
    const schemas = PipelineService.filterValidSchema(runtimes, schema);
    const selectedPlatform = runtime ?? (schemas[0] && schemas[0].name);
    const filteredRuntimes = PipelineService.filterRuntimes(
      runtimes,
      selectedPlatform
    );
    setValidSchemas(schemas);
    setRuntimeOptions(filteredRuntimes);
    setFileTypes(getFileTypes(selectedPlatform));
  }, [runtimes, schema, runtime]);

  return (
    <form className="elyra-dialog-form">
      {!runtime && (
        <DialogSelector
          className="elyra-form-runtime-platform"
          handleUpdate={handleUpdate}
          id="runtime_platform"
          label="Runtime Platform"
          optionList={validSchemas.map(schema => (
            <option key={schema.name} value={schema.name}>
              {schema.display_name}
            </option>
          ))}
        ></DialogSelector>
      )}
      <DialogSelector
        className="elyra-form-runtime-config"
        id="runtime_config"
        label="Runtime Configuration"
        optionList={runtimeOptions.map(runtimeOption => (
          <option key={runtimeOption.name} value={runtimeOption.name}>
            {runtimeOption.display_name}
          </option>
        ))}
      ></DialogSelector>
      <DialogSelector
        className="elyra-form-export-filetype"
        id="pipeline_filetype"
        label="Export Pipeline as"
        optionList={fileTypes.map(filetype => (
          <option key={filetype['key']} value={filetype['key']}>
            {filetype['label']}
          </option>
        ))}
      ></DialogSelector>
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
