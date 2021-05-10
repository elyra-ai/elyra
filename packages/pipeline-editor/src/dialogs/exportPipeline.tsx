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

import { FC, useState } from "react";

import { Dialog } from "@jupyterlab/apputils";

import { Runtime } from "../types";
import { createFormBody } from "./utils";

const FILE_TYPES: { [key: string]: { label: string; key: string }[] } = {
  kfp: [
    { label: "KFP domain-specific language Python code", key: "py" },
    { label: "KFP static configuration file (YAML formatted)", key: "yaml" },
  ],
  airflow: [
    { label: "Airflow domain-specific language Python code", key: "py" },
  ],
};

interface Props {
  runtimes: Runtime[];
  platform?: string;
}

const PipelineExportDialog: FC<Props> = ({ runtimes, platform }) => {
  const validSchemas = runtimes.filter((r) =>
    runtimes.some((rr) => rr.schema_name === r.name)
  );

  const [selectedPlatform, setSelectedPlatform] = useState(
    validSchemas[0]?.name
  );

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlatform(e.target.value);
  };

  const filteredRuntimeOptions = runtimes.filter(
    (r) => r.schema_name === platform ?? selectedPlatform
  );

  // TODO: Doesn't this happen when fetched?
  filteredRuntimeOptions.sort((r1, r2) =>
    r1.display_name.localeCompare(r2.display_name)
  );

  const fileTypes = FILE_TYPES[platform ?? selectedPlatform] ?? [];

  return (
    <form className="elyra-dialog-form">
      {platform === undefined && (
        <div>
          <label htmlFor="runtime_platform">Runtime Platform:</label>
          <br />
          <select
            id="runtime_platform"
            name="runtime_platform"
            className="elyra-form-runtime-platform"
            data-form-required
            onChange={handlePlatformChange}
          >
            {validSchemas.map((schema) => (
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
        {filteredRuntimeOptions.map((runtime) => (
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
        {fileTypes.map((filetype) => (
          <option key={filetype.key} value={filetype.key}>
            {filetype["label"]}
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
};

export const exportPipeline = ({ runtimes }: Props) => ({
  title: "Export pipeline",
  body: createFormBody(<PipelineExportDialog runtimes={runtimes} />),
  buttons: [Dialog.cancelButton(), Dialog.okButton()],
  defaultButton: 1,
  focusNodeSelector: "#runtime_config",
});
