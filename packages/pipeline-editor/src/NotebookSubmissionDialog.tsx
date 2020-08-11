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

import { IDictionary } from '@elyra/application';
import * as React from 'react';

import { IRuntime } from './PipelineEditorWidget';

type Props = {
  runtimes: IRuntime[];
  images: IDictionary<string>;
  env: string[];
};

const chunkArray = <T extends {}>(arr: T[], n: number): T[][] => {
  return Array.from(Array(Math.ceil(arr.length / n)), (_, i) =>
    arr.slice(i * n, i * n + n)
  );
};

const EnvForm = ({ env }: { env: string[] }): JSX.Element => {
  if (env.length > 0) {
    return (
      <>
        <tr>
          <td colSpan={4}></td>
        </tr>
        <tr>
          <td colSpan={4}>
            <div style={{ fontSize: 'var(--jp-ui-font-size3)' }}>
              Environmental Variables
            </div>
          </td>
        </tr>
        {chunkArray(env, 4).map((col, i) => (
          <tr key={i}>
            {col.map(envVar => (
              <td key={envVar}>
                <label htmlFor={envVar}>{envVar}:</label>
                <br />
                <input
                  type="text"
                  id={envVar}
                  className="envVar"
                  name={envVar}
                  size={20}
                />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }
  return null;
};

const NotebookSubmissionDialog = ({
  runtimes,
  images,
  env
}: Props): JSX.Element => {
  return (
    <form>
      <table id="table-submit-dialog" className="elyra-table">
        <tbody>
          <tr>
            <td colSpan={2}>
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
            </td>
            <td colSpan={2}>
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
            </td>
          </tr>
          <tr>
            <td>
              <br />
              <input
                type="checkbox"
                id="dependency_include"
                name="dependency_include"
                size={20}
                defaultChecked
              />
              <label htmlFor="dependency_include">Include dependencies</label>
              <br />
            </td>
            <td colSpan={3}>
              <br />
              <input
                type="text"
                id="dependencies"
                name="dependencies"
                placeholder="*.py"
                defaultValue="*.py"
                size={20}
              />
            </td>
          </tr>
          <EnvForm env={env} />
        </tbody>
      </table>
    </form>
  );
};

export default NotebookSubmissionDialog;
