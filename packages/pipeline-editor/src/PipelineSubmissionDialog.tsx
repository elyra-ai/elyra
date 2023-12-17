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

import { IParameterProps, ParameterInputForm } from './ParameterInputForm';

import { IRuntimeData } from './runtime-utils';
import RuntimeConfigSelect from './RuntimeConfigSelect';

interface IProps extends IParameterProps {
  name: string;
  runtimeData: IRuntimeData;
  pipelineType?: string;
}

export const PipelineSubmissionDialog: React.FC<IProps> = ({
  name,
  runtimeData,
  pipelineType,
  parameters,
}) => {
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
      <RuntimeConfigSelect
        runtimeData={runtimeData}
        pipelineType={pipelineType}
      />
      <ParameterInputForm parameters={parameters} />
    </form>
  );
};
