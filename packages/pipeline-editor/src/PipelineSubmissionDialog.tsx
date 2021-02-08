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

import { IRuntime, ISchema, PipelineService } from './PipelineService';

interface IProps {
  name: string;
  runtimes: IRuntime[];
  schema: ISchema[];
}

interface IState {
  runtimePlatform: string;
  runtimes: IRuntime[];
}

const LOCAL = 'local';

const updateRuntimeOptions = (
  allRuntimes: IRuntime[],
  platformSelection: string
): IRuntime[] => {
  const filteredRuntimes =
    platformSelection === LOCAL
      ? [allRuntimes[0]]
      : PipelineService.filterRuntimes(allRuntimes, platformSelection);

  sortRuntimesByDisplayName(filteredRuntimes);

  return filteredRuntimes;
};

const sortRuntimesByDisplayName = (runtimes: IRuntime[]): void => {
  runtimes.sort((r1, r2) => r1.display_name.localeCompare(r2.display_name));
};

export class PipelineSubmissionDialog extends React.Component<IProps, IState> {
  state = {
    runtimePlatform: LOCAL,
    runtimes: updateRuntimeOptions(this.props.runtimes, LOCAL)
  };

  handleUpdate = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedPlatform = event.target.value;
    const runtimeOptions = updateRuntimeOptions(
      this.props.runtimes,
      selectedPlatform
    );
    this.setState({
      runtimePlatform: selectedPlatform,
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
    const localRuntime = this.props.runtimes[0];

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
          <option key={localRuntime.name} value={localRuntime.name}>
            Local Runtime
          </option>
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
