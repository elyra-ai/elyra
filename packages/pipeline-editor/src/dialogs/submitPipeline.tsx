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

import React, { FC, useState } from "react";

import { Dialog } from "@jupyterlab/apputils";

import { createFormBody } from "./utils";

interface Runtime {
  name: string;
  display_name: string;
  schema_name: string;
}

interface Props {
  name: string;
  runtimes: Runtime[];
  platform?: string;
}

const PipelineSubmissionDialog: FC<Props> = ({ name, runtimes, platform }) => {
  // TODO: WHAT DOES THIS DO?@?@@?@?@?@?!!!!?!? CONFUSION!
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
      {/* If a platform is provided, it cannot be changed. */}
      {platform === undefined && (
        <div>
          <label htmlFor="runtime_platform">Runtime Platform:</label>
          <br />
          <select
            id="runtime_platform"
            name="runtime_platform"
            className="elyra-form-runtime-platform"
            data-form-required
            value={selectedPlatform}
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
    </form>
  );
};

export const submitPipeline = ({ name, runtimes, platform }: Props) => ({
  title: "Run pipeline",
  body: createFormBody(
    <PipelineSubmissionDialog
      name={name}
      runtimes={runtimes}
      platform={platform}
    />
  ),
  buttons: [Dialog.cancelButton(), Dialog.okButton()],
  defaultButton: 1,
  focusNodeSelector: "#pipeline_name",
});
