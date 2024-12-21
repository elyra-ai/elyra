/*
 * Copyright 2018-2023 Elyra Authors
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

import { IRuntimeData } from './runtime-utils';

const RUN_LOCALLY_ID = '__elyra_local__';

interface IProps {
  runtimeData: IRuntimeData;
  pipelineType?: string;
  children?(platform: string): JSX.Element;
}

const RuntimeConfigSelect: React.FC<IProps> = ({
  runtimeData: { platforms, allowLocal },
  pipelineType,
  children,
}) => {
  const filteredPlatforms = platforms.filter((p) => p.configs.length > 0);
  if (allowLocal) {
    filteredPlatforms.unshift({
      id: RUN_LOCALLY_ID,
      displayName: 'Run in-place locally',
      configs: [],
    });
  }

  // NOTE: platform is only selectable if pipelineType is undefined
  const [platform, setPlatform] = React.useState(
    pipelineType ?? filteredPlatforms[0]?.id,
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setPlatform(e.target.value);
  };

  const configs =
    filteredPlatforms.find((p) => p.id === platform)?.configs ?? [];
  configs.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <>
      {!pipelineType && (
        <div>
          <label htmlFor="runtime_platform">Runtime Platform:</label>
          <br />
          <select
            id="runtime_platform"
            name="runtime_platform"
            className="elyra-form-runtime-platform"
            value={platform}
            onChange={handleChange}
          >
            {filteredPlatforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* must be present in dom at initial render */}
      <div style={{ display: platform === RUN_LOCALLY_ID ? 'none' : 'block' }}>
        <label htmlFor="runtime_config">Runtime Configuration:</label>
        <br />
        <select
          id="runtime_config"
          name="runtime_config"
          className="elyra-form-runtime-config"
        >
          {configs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </select>
      </div>
      {children?.(platform)}
    </>
  );
};

export default RuntimeConfigSelect;
