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
  runtime?: string;
}

interface IState {
  displayedRuntimeOptions: IRuntime[];
  validSchemas: ISchema[];
  selectedRuntimePlatform?: string;
}

export class PipelineSubmissionDialog extends React.Component<IProps, IState> {
  state: IState = {
    displayedRuntimeOptions: new Array<IRuntime>(),
    validSchemas: new Array<ISchema>()
  };

  handleUpdate = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedPlatform = event.target.value;
    const runtimeOptions = this.updateRuntimeOptions(selectedPlatform);

    this.setState({
      displayedRuntimeOptions: runtimeOptions,
      selectedRuntimePlatform: selectedPlatform
    });
  };

  updateRuntimeOptions = (platformSelection?: string): IRuntime[] => {
    const filteredRuntimeOptions = PipelineService.filterRuntimes(
      this.props.runtimes,
      platformSelection ??
        this.props.runtime ??
        (this.props.schema[0] && this.props.schema[0].name)
    );
    PipelineService.sortRuntimesByDisplayName(filteredRuntimeOptions);
    return filteredRuntimeOptions;
  };

  componentDidMount(): void {
    const { schema, runtimes } = this.props;

    this.setState({
      displayedRuntimeOptions: this.updateRuntimeOptions(
        this.state.selectedRuntimePlatform
      ),
      validSchemas: PipelineService.filterValidSchema(runtimes, schema)
    });
  }

  render(): React.ReactNode {
    const { name } = this.props;
    const {
      displayedRuntimeOptions,
      selectedRuntimePlatform,
      validSchemas
    } = this.state;

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
        {!this.props.runtime && (
          <div>
            <label htmlFor="runtime_platform">Runtime Platform:</label>
            <br />
            <select
              id="runtime_platform"
              name="runtime_platform"
              className="elyra-form-runtime-platform"
              data-form-required
              value={
                selectedRuntimePlatform ??
                this.props.runtime ??
                (this.props.schema[0] && this.props.schema[0].name)
              }
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
      </form>
    );
  }
}
