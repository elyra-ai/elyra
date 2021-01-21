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
import React from "react";

import { hasValue, toPrettyString } from "./string-util";

export interface IProperty {
  label: string;
  value: any;
}

interface IProps {
  error?: string;
  properties: IProperty[];
}

export const NodeTooltip: React.FC<IProps> = ({ error, properties }) => {
  return (
    <dl className="elyra-PipelineNodeTooltip">
      {error && (
        <span className="elyra-tooltipError">
          <dd>Error</dd>
          <dt>{toPrettyString(error)}</dt>
        </span>
      )}
      {properties
        .filter(({ value }) => hasValue(value))
        .map(({ label, value }) => (
          <span key={label}>
            <dd>{label}</dd>
            <dt>{toPrettyString(value)}</dt>
          </span>
        ))}
    </dl>
  );
};
