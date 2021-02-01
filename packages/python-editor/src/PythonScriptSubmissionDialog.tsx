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

interface IRuntime {
  name: string;
  display_name: string;
}

interface IProps {
  runtimes: IRuntime[];
  images: IDictionary<string>;
}

export class PythonScriptSubmissionDialog extends React.Component<IProps> {
  render(): React.ReactNode {
    const { runtimes, images } = this.props;

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
          {runtimes.map(runtime => (
            <option key={runtime.name} value={runtime.name}>
              {runtime.display_name}
            </option>
          ))}
        </select>
        <label htmlFor="framework">Runtime Images:</label>
        <br />
        <select
          id="framework"
          name="framework"
          className="elyra-form-framework"
          data-form-required
        >
          {Object.entries(images).map(([key, val]) => (
            <option key={key} value={key}>
              {val}
            </option>
          ))}
        </select>
      </form>
    );
  }
}
