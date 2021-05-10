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

import { Runtime } from "../types";
import { createFormBody } from "./utils";

interface Props {
  env: string[];
  dependencyFileExtension: string;
  images: { [key: string]: string };
  runtimes: Runtime[];
}

interface EnvFormProps {
  env: string[];
}

function chunkArray<T>(arr: T[], n: number): T[][] {
  return Array.from(Array(Math.ceil(arr.length / n)), (_, i) =>
    arr.slice(i * n, i * n + n)
  );
}

const EnvForm: FC<EnvFormProps> = ({ env }) => {
  if (env.length > 0) {
    return (
      <React.Fragment>
        <br />
        <br />
        <div>Environment Variables:</div>
        <br />
        {chunkArray(env, 4).map((col, i) => (
          <div key={i}>
            {col.map((envVar) => (
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
      </React.Fragment>
    );
  }
  return null;
};

const FileSubmissionDialog: FC<Props> = ({
  env,
  images,
  runtimes,
  dependencyFileExtension,
}) => {
  const [includeDependency, setIncludeDependency] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState(runtimes[0]?.name);

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlatform(e.target.value);
  };

  const handleCheckboxChange = () => {
    setIncludeDependency((prev) => !prev);
  };

  // TODO: WHAT DOES THIS DO?@?@@?@?@?@?!!!!?!? CONFUSION!
  const validSchemas = runtimes.filter((r) =>
    runtimes.some((rr) => rr.schema_name === r.name)
  );

  const filteredRuntimeOptions = runtimes.filter(
    (r) => r.schema_name === selectedPlatform
  );

  // TODO: Doesn't this happen when fetched?
  filteredRuntimeOptions.sort((r1, r2) =>
    r1.display_name.localeCompare(r2.display_name)
  );

  const fileDependencyContent = includeDependency ? (
    <div key="dependencies">
      <br />
      <input
        type="text"
        id="dependencies"
        className="jp-mod-styled"
        name="dependencies"
        placeholder={`*${dependencyFileExtension}`}
        defaultValue={`*${dependencyFileExtension}`}
        size={30}
      />
    </div>
  ) : null;

  return (
    <form className="elyra-dialog-form">
      <label htmlFor="runtime_platform">Runtime Platform:</label>
      <br />
      <select
        id="runtime_platform"
        name="runtime_platform"
        className="elyra-form-runtime-platform"
        onChange={handlePlatformChange}
      >
        {validSchemas.map((schema) => (
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
      >
        {filteredRuntimeOptions.map((runtime) => (
          <option key={runtime.name} value={runtime.name}>
            {runtime.display_name}
          </option>
        ))}
      </select>
      <label htmlFor="framework">Runtime Image:</label>
      <br />
      <select id="framework" name="framework" className="elyra-form-framework">
        {Object.entries(images).map(([key, val]) => (
          <option key={key} value={key}>
            {val}
          </option>
        ))}
      </select>
      <br />
      <div className="elyra-resourcesWrapper">
        <div className="elyra-resourceInput">
          <label htmlFor="cpu"> CPU:</label>
          <input id="cpu" type="number" name="cpu" />
        </div>
        <div className="elyra-resourceInput">
          <label htmlFor="gpu"> GPU:</label>
          <input id="gpu" type="number" name="gpu" />
        </div>
        <div className="elyra-resourceInput">
          <label htmlFor="memory"> RAM (GB):</label>
          <input id="memory" type="number" name="memory" />
        </div>
      </div>
      <br />
      <input
        type="checkbox"
        className="elyra-Dialog-checkbox"
        id="dependency_include"
        name="dependency_include"
        size={20}
        checked={includeDependency}
        onChange={handleCheckboxChange}
      />
      <label htmlFor="dependency_include">Include File Dependencies:</label>
      <br />
      {fileDependencyContent}
      <EnvForm env={env} />
    </form>
  );
};

export const submitFile = ({
  type,
  env,
  dependencyFileExtension,
  runtimes,
  images,
}: Props & { type: "notebook" | "script" }) => ({
  title: `Run ${type} as pipeline`,
  body: createFormBody(
    <FileSubmissionDialog
      env={env}
      dependencyFileExtension={dependencyFileExtension}
      runtimes={runtimes}
      images={images}
    />
  ),
  buttons: [Dialog.cancelButton(), Dialog.okButton()],
});
