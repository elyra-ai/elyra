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

export interface INode {
  op: string;
  label: string;
  description: string;
  labelField?: string;
  fileField?: string;
  fileBased?: boolean;
  extension?: string;
  image?: string;
  properties?: any[];
}

export interface IProperties {
  current_parameters: ICurrentParameters;
  parameters: IParameter[];
  uihints: IUIHints;
  resources: IResources;
}

export interface ICurrentParameters {
  [key: string]: any;
}

export interface IParameter {
  id: string;
  type: "string" | "array[string]" | "boolean";
  enum?: any[];
}

export interface IUIHints {
  id: string;
  parameter_info: IParameterInfo[];
  action_info: any[];
  group_info: any[];
}

export interface IResources {
  [key: string]: string;
}

export interface IParameterInfo {
  parameter_ref: string;
  label: {
    default: string;
  };
  control?: "readonly" | "oneofselect";
  place_holder_text?: {
    default: string;
  };
}

export interface IRuntime {
  name: string;
  schema_name?: string;
  display_name: string;
}
