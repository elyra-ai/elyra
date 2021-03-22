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
}

interface IState {
  runtimePlatform: string;
  runtimes: IRuntime[];
  fileTypes: Record<string, string>[];
}

export class PipelineExportDialog extends React.Component<IProps, IState> {
  state = {
    runtimePlatform: KFP_SCHEMA,
    runtimes: this.props.runtimes,
    fileTypes: KFP_FILE_TYPES
  };

  handleUpdate = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedPlatform = event.target.value;
    this.updateDisplayOptions(selectedPlatform);
  };

  updateDisplayOptions = (platformSelection: string): void => {
    const runtimes = PipelineService.filterRuntimes(
      this.props.runtimes,
      platformSelection
    );
    this.setState({
      runtimes: runtimes,
      fileTypes:
        platformSelection === KFP_SCHEMA ? KFP_FILE_TYPES : AIRFLOW_FILE_TYPES
    });
  };

  componentDidMount(): void {
    this.updateDisplayOptions(this.state.runtimePlatform);
  }

  render(): React.ReactNode {
    const { fileTypes, runtimes } = this.state;
    const { schema } = this.props;
    PipelineService.sortRuntimesByDisplayName(runtimes);

    return (
      <form>
        <label htmlFor="runtime_platform">Runtime Platform:</label>
        <br />
        <select
          id="runtime_platform"
          name="runtime_platform"
          className="elyra-form-runtime-platform"
          data-form-required
          defaultValue={this.state.runtimePlatform}
          onChange={this.handleUpdate}
        >
          {schema.map(schema => (
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
          data-form-required
        >
          {runtimes.map(runtime => (
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
