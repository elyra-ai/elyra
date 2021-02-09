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

import {
  KFP_SCHEMA,
  IRuntime,
  ISchema,
  PipelineService
} from './PipelineService';
import Utils from './utils';

interface IProps {
  env: string[];
  images: IDictionary<string>;
  runtimes: IRuntime[];
  schema: ISchema[];
}

interface IState {
  runtimePlatform: string;
  runtimes: IRuntime[];
  includeDependency: boolean;
}

const EnvForm = ({ env }: { env: string[] }): JSX.Element => {
  if (env.length > 0) {
    return (
      <>
        <br />
        <br />
        <div>Environmental Variables:</div>
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
      </>
    );
  }
  return null;
};

export class NotebookSubmissionDialog extends React.Component<IProps, IState> {
  state = {
    runtimePlatform: KFP_SCHEMA,
    runtimes: this.props.runtimes,
    includeDependency: true
  };

  handleCheck = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({
      includeDependency: !this.state.includeDependency
    });
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
      runtimes: runtimes
    });
  };

  componentDidMount(): void {
    this.updateDisplayOptions(this.state.runtimePlatform);
  }
  render(): React.ReactNode {
    const { includeDependency, runtimes } = this.state;
    const { env, images, schema } = this.props;
    const fileDependencyContent = includeDependency ? (
      <div key="dependencies">
        <br />
        <input
          type="text"
          id="dependencies"
          className="jp-mod-styled"
          name="dependencies"
          placeholder="*.py"
          defaultValue="*.py"
          size={30}
        />
      </div>
    ) : null;

    PipelineService.sortRuntimesByDisplayName(runtimes);

    return (
      <form>
        <label htmlFor="runtime_platform">Runtime Platform:</label>
        <br />
        <select
          id="runtime_platform"
          name="runtime_platform"
          className="elyra-form-runtime-platform"
          defaultValue={this.state.runtimePlatform}
          onChange={this.handleUpdate}
        >
          {schema.map(schema => (
            <option key={schema.name} value={schema.name}>
              {schema.display_name}
            </option>
          ))}
        </select>
        <label htmlFor="runtime_config">Runtime Config:</label>
        <br />
        <select
          id="runtime_config"
          name="runtime_config"
          className="elyra-form-runtime-config"
        >
          {runtimes.map(runtime => (
            <option key={runtime.name} value={runtime.name}>
              {runtime.display_name}
            </option>
          ))}
        </select>
        <label htmlFor="framework">Runtime images:</label>
        <br />
        <select
          id="framework"
          name="framework"
          className="elyra-form-framework"
        >
          {Object.entries(images).map(([key, val]) => (
            <option key={key} value={key}>
              {val}
            </option>
          ))}
        </select>
        <br />
        <input
          type="checkbox"
          className="elyra-Dialog-checkbox"
          id="dependency_include"
          name="dependency_include"
          size={20}
          checked={this.state.includeDependency}
          onChange={this.handleCheck}
        />
        <label htmlFor="dependency_include">Include file dependency</label>
        <br />
        {fileDependencyContent}
        <EnvForm env={env} />
      </form>
    );
  }
}
