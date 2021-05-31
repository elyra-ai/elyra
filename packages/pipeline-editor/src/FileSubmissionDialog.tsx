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

import { IDictionary } from '@elyra/services';
import * as React from 'react';

import { IRuntime, ISchema, PipelineService } from './PipelineService';
import Utils from './utils';

interface IProps {
  env: string[];
  dependencyFileExtension: string;
  images: IDictionary<string>;
  runtimes: IRuntime[];
  schema: ISchema[];
}

export const FileSubmissionDialog: React.FC<IProps> = ({
  env,
  dependencyFileExtension,
  images,
  runtimes,
  schema
}) => {
  const [includeDependency, setIncludeDependency] = React.useState(true);
  const [runtimeOptions, setRuntimeOptions] = React.useState(
    new Array<IRuntime>()
  );
  const [validSchemas, setValidSchemas] = React.useState(new Array<ISchema>());

  const handleDependency = (): void => {
    setIncludeDependency(!includeDependency);
  };

  const handleUpdateRuntime = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const platformSelection = event.target.value;
    setRuntimeOptions(filterRuntimeOptions(platformSelection));
  };

  const filterRuntimeOptions = React.useCallback(
    (platformSelection: string): IRuntime[] => {
      const filteredRuntimeOptions = PipelineService.filterRuntimes(
        runtimes,
        platformSelection
      );
      PipelineService.sortRuntimesByDisplayName(filteredRuntimeOptions);
      return filteredRuntimeOptions;
    },
    [runtimes]
  );

  React.useEffect((): void => {
    const schemas = PipelineService.filterValidSchema(runtimes, schema);
    if (schemas) {
      const platformSelection = schemas[0] && schemas[0].name;
      const filteredRuntimeOptions = filterRuntimeOptions(platformSelection);
      setRuntimeOptions(filteredRuntimeOptions);
      setValidSchemas(schemas);
    }
  }, [filterRuntimeOptions, runtimes, schema]);

  return (
    <form className="elyra-dialog-form">
      <label htmlFor="runtime_platform">Runtime Platform:</label>
      <br />
      <select
        id="runtime_platform"
        name="runtime_platform"
        className="elyra-form-runtime-platform"
        onChange={handleUpdateRuntime}
      >
        {validSchemas.map(schema => (
          <option key={schema.name} value={schema.name}>
            {schema.display_name}
          </option>
        ))}
      </select>
      <label htmlFor="runtime_config">Runtime Configuration:</label>
      <br />
      <select
        id="runtime_config"
        name="runtime_config"
        className="elyra-form-runtime-config"
      >
        {runtimeOptions.map(runtime => (
          <option key={runtime.name} value={runtime.name}>
            {runtime.display_name}
          </option>
        ))}
      </select>
      <label htmlFor="framework">Runtime Image:</label>
      <br />
      <select id="framework" name="framework" className="elyra-form-framework">
        {Object.entries(images).map(([key, val]) => (
          <option key={key} value={key}>
            {val}
          </option>
        ))}
      </select>
      <br />
      <div className="elyra-resourcesWrapper">
        <div className="elyra-resourceInput">
          <label htmlFor="cpu"> CPU:</label>
          <input id="cpu" type="number" name="cpu" />
        </div>
        <div className="elyra-resourceInput">
          <label htmlFor="gpu"> GPU:</label>
          <input id="gpu" type="number" name="gpu" />
        </div>
        <div className="elyra-resourceInput">
          <label htmlFor="memory"> RAM (GB):</label>
          <input id="memory" type="number" name="memory" />
        </div>
      </div>
      <br />
      <input
        type="checkbox"
        className="elyra-Dialog-checkbox"
        id="dependency_include"
        name="dependency_include"
        size={20}
        checked={includeDependency}
        onChange={handleDependency}
      />
      <label htmlFor="dependency_include">Include File Dependencies:</label>
      <br />
      {includeDependency && (
        <div key="dependencies">
          <br />
          <input
            type="text"
            id="dependencies"
            className="jp-mod-styled"
            name="dependencies"
            placeholder={`*${dependencyFileExtension}`}
            defaultValue={`*${dependencyFileExtension}`}
            size={30}
          />
        </div>
      )}
      {env.length > 0 ? (
        <div>
          <br />
          <br />
          <div>Environment Variables:</div>
          <br />
          {Utils.chunkArray(env, 4).map((col, i) => (
            <div key={i}>
              {col.map(envVar => (
                <div key={envVar}>
                  <label htmlFor={envVar}>{envVar}:</label>
                  <br />
                  <input
                    type="text"
                    id={envVar}
                    className="envVar"
                    name={envVar}
                    size={30}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </form>
  );
};
