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

interface IState {
  displayedRuntimeOptions: IRuntime[];
  fileTypes: Record<string, string>[];
  validSchemas: ISchema[];
}

export class PipelineExportDialog extends React.Component<IProps, IState> {
  state = {
    displayedRuntimeOptions: new Array<IRuntime>(),
    fileTypes: new Array<Record<string, string>>(),
    validSchemas: new Array<ISchema>()
  };

  handleUpdate = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedPlatform = event.target.value;
    this.setState({
      displayedRuntimeOptions: this.updateRuntimeOptions(selectedPlatform),
      fileTypes: this.updateFileTypeOptions(selectedPlatform)
    });
  };

  updateRuntimeOptions = (platformSelection: string): IRuntime[] => {
    const filteredRuntimeOptions = PipelineService.filterRuntimes(
      this.props.runtimes,
      platformSelection
    );
    PipelineService.sortRuntimesByDisplayName(filteredRuntimeOptions);
    return filteredRuntimeOptions;
  };

  updateFileTypeOptions = (
    platformSelection: string
  ): Record<string, string>[] => {
    if (!platformSelection) {
      return new Array<Record<string, string>>();
    } else if (platformSelection === KFP_SCHEMA) {
      // TODO: remove temporary workaround for KFP Python DSL export option
      // See https://github.com/elyra-ai/elyra/issues/1760 for context.
      if (this.props.runtime === KFP_SCHEMA) {
        return [KFP_FILE_TYPES[1]];
      }
      return KFP_FILE_TYPES;
    }
    return AIRFLOW_FILE_TYPES;
  };

  componentDidMount(): void {
    const { schema, runtimes } = this.props;

    const validSchemas = PipelineService.filterValidSchema(runtimes, schema);
    const selectedRuntimePlatform =
      this.props.runtime ?? (validSchemas[0] && validSchemas[0].name);
    const displayedRuntimeOptions = this.updateRuntimeOptions(
      selectedRuntimePlatform
    );
    const fileTypes = this.updateFileTypeOptions(selectedRuntimePlatform);

    this.setState({
      displayedRuntimeOptions: displayedRuntimeOptions,
      fileTypes: fileTypes,
      validSchemas: validSchemas
    });
  }

  render(): React.ReactNode {
    const { displayedRuntimeOptions, fileTypes, validSchemas } = this.state;

    return (
      <form className="elyra-dialog-form">
        {!this.props.runtime && (
          <div>
            <label htmlFor="runtime_platform">Runtime Platform:</label>
            <br />
            <select
              id="runtime_platform"
              name="runtime_platform"
              className="elyra-form-runtime-platform"
              data-form-required
              onChange={this.handleUpdate}
            >
              {validSchemas.map(schema => (
                <option key={schema.name} value={schema.name}>
                  {schema.display_name}
                </option>
              ))}
            </select>
          </div>
        )}
        <label htmlFor="runtime_config">Runtime Configuration:</label>
        <br />
        <select
          id="runtime_config"
          name="runtime_config"
          className="elyra-form-runtime-config"
          data-form-required
        >
          {displayedRuntimeOptions.map(runtime => (
            <option key={runtime.name} value={runtime.name}>
              {runtime.display_name}
            </option>
          ))}
        </select>
        <label htmlFor="pipeline_filetype">Export Pipeline as:</label>
        <br />
        <select
          id="pipeline_filetype"
          name="pipeline_filetype"
          className="elyra-form-export-filetype"
          data-form-required
        >
          {fileTypes.map(filetype => (
            <option key={filetype['key']} value={filetype['key']}>
              {filetype['label']}
            </option>
          ))}
        </select>
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
  }
}
