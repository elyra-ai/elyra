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

import { IRuntime } from './PipelineService';
import Utils from './utils';

interface IProps {
  runtimes: IRuntime[];
  images: IDictionary<string>;
  env: string[];
}

interface IState {
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

export class FileSubmissionDialog extends React.Component<IProps, IState> {
  state = {
    includeDependency: true
  };

  handleCheck = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({
      includeDependency: !this.state.includeDependency
    });
  };

  render(): React.ReactNode {
    const { runtimes, images, env } = this.props;
    const { includeDependency } = this.state;
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

    return (
      <form>
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
        <label htmlFor="dependency_include">Include file dependencies</label>
        <br />
        {fileDependencyContent}
        <EnvForm env={env} />
      </form>
    );
  }
}
