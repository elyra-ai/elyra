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
import { RequestHandler } from './requests';
import {
  IMetadataResource,
  IMetadataResourceBody,
  IMetadataSchemaspaceResource,
  ISchemaResource,
  ISchemaSchemaspaceResource,
  ISchemaspacesResource
} from './types';

const ELYRA_METADATA_API_ENDPOINT = 'elyra/metadata/';
const ELYRA_SCHEMA_API_ENDPOINT = 'elyra/schema/';
const ELYRA_SCHEMASPACE_API_ENDPOINT = 'elyra/schemaspace';

/**
 * A service class for accessing the elyra api.
 */
export class MetadataService {
  /**
   * Service function for making GET calls to the elyra metadata API.
   *
   * @param schemaspace - the metadata schemaspace being accessed
   *
   * @returns a promise that resolves with the requested metadata or
   * an error dialog result
   */
  static async getMetadata(
    schemaspace: string
  ): Promise<IMetadataResource[] | undefined> {
    return RequestHandler.makeGetRequest<IMetadataSchemaspaceResource>(
      ELYRA_METADATA_API_ENDPOINT + schemaspace
    ).then((response) => response?.[schemaspace]);
  }

  /**
   * Service function for making POST calls to the elyra metadata API.
   *
   * @param schemaspace - the metadata schemaspace being accessed
   * @param requestBody - the body of the request
   *
   * @returns a promise that resolves with the newly created metadata or
   * an error dialog result
   */
  static async postMetadata(
    schemaspace: string,
    requestBody: IMetadataResourceBody
  ): Promise<IMetadataResource | undefined> {
    return RequestHandler.makePostRequest<IMetadataResource>(
      ELYRA_METADATA_API_ENDPOINT + schemaspace,
      JSON.stringify(requestBody)
    );
  }

  /**
   * Service function for making PUT calls to the elyra metadata API.
   *
   * @param schemaspace - the metadata schemaspace being accessed
   * @param name - the metadata name being updated
   * @param requestBody - the body of the request
   *
   * @returns a promise that resolves with the updated metadata or
   * an error dialog result
   */
  static async putMetadata(
    schemaspace: string,
    name: string,
    requestBody: IMetadataResourceBody
  ): Promise<IMetadataResource | undefined> {
    return RequestHandler.makePutRequest<IMetadataResource>(
      `${ELYRA_METADATA_API_ENDPOINT}${schemaspace}/${name}`,
      JSON.stringify(requestBody)
    );
  }

  /**
   * Service function for making DELETE calls to the elyra metadata API.
   *
   * @param schemaspace - the metadata schemaspace being accessed
   * @param name - the metadata name being updated
   *
   * @returns void or an error dialog result
   */
  static async deleteMetadata(
    schemaspace: string,
    name: string
  ): Promise<void> {
    await RequestHandler.makeDeleteRequest(
      `${ELYRA_METADATA_API_ENDPOINT}${schemaspace}/${name}`
    );
  }

  private static schemaCache: IDictionary<ISchemaResource[]> = {};

  /**
   * Service function for making GET calls to the elyra schema API.
   *
   * @param schemaspace - the schema schemaspace being requested
   *
   * @returns a promise that resolves with the requested schemas or
   * an error dialog result
   */
  static async getSchema(
    schemaspace: string
  ): Promise<ISchemaResource[] | undefined> {
    if (this.schemaCache[schemaspace]) {
      // Deep copy cached schema to mimic request call
      return JSON.parse(JSON.stringify(this.schemaCache[schemaspace]));
    }

    return RequestHandler.makeGetRequest<ISchemaSchemaspaceResource>(
      ELYRA_SCHEMA_API_ENDPOINT + schemaspace
    ).then((response) => {
      if (response?.[schemaspace]) {
        this.schemaCache[schemaspace] = response[schemaspace];
      }

      return response?.[schemaspace];
    });
  }

  /**
   * Service function for making GET calls to the elyra schema API.
   *
   * @returns a promise that resolves with the requested schemas or
   * an error dialog result
   */
  static async getAllSchema(): Promise<ISchemaResource[] | undefined> {
    try {
      const response =
        await RequestHandler.makeGetRequest<ISchemaspacesResource>(
          ELYRA_SCHEMASPACE_API_ENDPOINT
        );
      const schemas: ISchemaResource[] = [];

      for (const schemaspace of response?.schemaspaces ?? []) {
        const schema = await this.getSchema(schemaspace);
        if (schema) {
          schemas.push(...schema);
        }
      }
      return schemas;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
