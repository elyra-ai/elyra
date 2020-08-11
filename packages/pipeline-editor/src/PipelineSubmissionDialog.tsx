/*
 * Copyright 2018-2020 IBM Corporation
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

import { IRuntime } from './PipelineEditorWidget';

type Props = {
  runtimes: IRuntime[];
};

const PipelineSubmissionDialog = ({ runtimes }: Props): JSX.Element => {
  return (
    <form>
      <label htmlFor="pipeline_name">Pipeline Name:</label>
      <br />
      <input
        type="text"
        id="pipeline_name"
        name="pipeline_name"
        placeholder="Pipeline Name"
        data-form-required
      />
      <br />
      <br />
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
    </form>
  );
};

export default PipelineSubmissionDialog;
