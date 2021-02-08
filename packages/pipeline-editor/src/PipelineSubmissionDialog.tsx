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

interface IProps {
  name: string;
  runtimes: IRuntime[];
  schema: ISchema[];
}

interface IState {
  runtimePlatform: string;
  runtimes: IRuntime[];
}

const updateRuntimeOptions = (
  allRuntimes: IRuntime[],
  platformSelection: string
): IRuntime[] => {
  const filteredRuntimes = PipelineService.filterRuntimes(
    allRuntimes,
    platformSelection
  );

  sortRuntimesByDisplayName(filteredRuntimes);
  addLocal(allRuntimes, filteredRuntimes);

  return filteredRuntimes;
};

const sortRuntimesByDisplayName = (runtimes: IRuntime[]): void => {
  runtimes.sort((r1, r2) => r1.display_name.localeCompare(r2.display_name));
};

const addLocal = (
  allRuntimes: IRuntime[],
  filteredRuntimes: IRuntime[]
): void => {
  allRuntimes.forEach(runtime => {
    runtime.name === 'local' && filteredRuntimes.unshift(runtime);
  });
};

export class PipelineSubmissionDialog extends React.Component<IProps, IState> {
  state = {
    runtimePlatform: KFP_SCHEMA,
    runtimes: updateRuntimeOptions(this.props.runtimes, KFP_SCHEMA)
  };

  handleUpdate = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedPlatform = event.target.value;
    const runtimeOptions = updateRuntimeOptions(
      this.props.runtimes,
      selectedPlatform
    );

    this.setState({
      runtimes: runtimeOptions
    });
  };

  componentDidMount(): void {
    {
      this.setState({
        runtimes: updateRuntimeOptions(
          this.props.runtimes,
          this.state.runtimePlatform
        )
      });
    }
  }

  render(): React.ReactNode {
    const { name, schema } = this.props;
    const { runtimes } = this.state;

    return (
      <form>
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
        <label htmlFor="runtime_platform">Runtime:</label>
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
      </form>
    );
  }
}
