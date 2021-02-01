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

import { IRuntime } from './PipelineService';

const FILE_TYPES = [
  { label: 'KFP static configuration file (YAML formatted)', key: 'yaml' },
  { label: 'KFP domain-specific language Python code', key: 'py' }
];

interface IProps {
  runtimes: IRuntime[];
}

export class PipelineExportDialog extends React.Component<IProps> {
  render(): React.ReactNode {
    const { runtimes } = this.props;
    return (
      <form>
        <label htmlFor="runtime_config">Runtime Config:</label>
        <br />
        <select
          id="runtime_config"
          name="runtime_config"
          className="elyra-form-runtime-config"
          data-form-required
        >
          {runtimes.map((runtime: any) => (
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
          {FILE_TYPES.map(filetype => (
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
