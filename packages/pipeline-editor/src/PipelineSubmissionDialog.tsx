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
import { IRuntime, ISchema, PipelineService } from './PipelineService';

interface IProps {
  name: string;
  runtimes: IRuntime[];
  schema: ISchema[];
  runtime?: string;
}

export const PipelineSubmissionDialog: React.FC<IProps> = ({
  name,
  runtimes,
  schema,
  runtime
}) => {
  const [validSchemas, setValidSchemas] = React.useState(new Array<ISchema>());
  const [runtimePlatform, setRuntimePlatform] = React.useState('');

  const handleUpdatePlatform = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>): void => {
      const platformSelection = event.target.value;
      setRuntimePlatform(platformSelection);
    },
    [setRuntimePlatform]
  );

  const runtimeOptions = React.useMemo(
    (): IRuntime[] =>
      PipelineService.filterRuntimes(
        runtimes,
        runtimePlatform || (runtime ?? (schema[0] && schema[0].name))
      ),
    [runtime, runtimes, schema, runtimePlatform]
  );

  React.useEffect((): void => {
    const schemas = PipelineService.filterValidSchema(runtimes, schema);
    setValidSchemas(schemas);
  }, [runtimes, schema]);

  return (
    <form className="elyra-dialog-form">
      <label htmlFor="pipeline_name">Pipeline Name:</label>
      <br />
      <input
        type="text"
        id="pipeline_name"
        name="pipeline_name"
        defaultValue={name}
        data-form-required
      />
      <br />
      <br />
      {!runtime && (
        <DialogSelector
          className="elyra-form-runtime-platform"
          handleUpdate={handleUpdatePlatform}
          id="runtime_platform"
          label="Runtime Platform"
          optionList={validSchemas.map(schema => (
            <option key={schema.name} value={schema.name}>
              {schema.display_name}
            </option>
          ))}
          value={runtimePlatform || (runtime ?? (schema[0] && schema[0].name))}
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
    </form>
  );
};
