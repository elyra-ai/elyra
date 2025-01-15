/*
 * Copyright 2018-2025 Elyra Authors
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

import { IDictionary } from './parsing';

// Types extracted from `elyra/api/elyra.yaml`

export interface IElyraResource {}

export interface IMetadataResourceBody {
  display_name: string;
  schema_name: string;
  metadata: IDictionary<unknown>;
}

export interface IMetadataResource
  extends IElyraResource,
    IMetadataResourceBody {
  name: string;
}

export interface ISchemaspaceResource extends IElyraResource {
  name: string;
  id: string;
  display_name: string;
  description: string;
}

export interface ISchemaResource extends IElyraResource {
  schemaspace: string;
  name: string;
  title?: string;
  properties?: IDictionary<unknown>;
  uihints?: {
    title: string;
    icon: string;
    reference_url: string;
  };
}

export interface IMetadataSchemaspaceResource extends IElyraResource {
  [schemaspace: string]: IMetadataResource[];
}

export interface ISchemaSchemaspaceResource extends IElyraResource {
  [schemaspace: string]: ISchemaResource[];
}

export interface ISchemaspacesResource extends IElyraResource {
  schemaspaces: string[];
}

export interface IComponentCacheResource extends IElyraResource {
  action: 'refresh';
}

export interface IContentsPropertiesResource extends IElyraResource {
  env_vars: Record<string, string | null>;
  inputs: Array<string>;
  outputs: Array<string>;
}
