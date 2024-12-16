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

import { MetadataService } from '@elyra/services';

import { IMetadata } from './MetadataWidget';

export class MetadataCommonService {
  /**
   * Duplicates an existing metadata instance, using
   * '<original-display-name>-Copy<unique-number>' as new display name.
   *
   * @param schemaSpace: schemaspace in which metadataInstance is defined
   * @param metadataInstance: metadata instance to be duplicated
   * @param existingInstances: list of existing metadata instances in schemaspace
   *
   * @returns A promise
   */
  static duplicateMetadataInstance(
    schemaSpace: string,
    metadataInstance: IMetadata,
    existingInstances: IMetadata[]
  ): Promise<boolean> {
    // iterate through the list of currently defined
    // instance names and find the next available one
    // using '<source-instance-name>-Copy<N>'
    let base_name = metadataInstance.display_name;
    const match = metadataInstance.display_name.match(/-Copy\d+$/);
    if (match !== null) {
      base_name = base_name.replace(/-Copy\d+$/, '');
    }
    let count = 1;

    while (
      existingInstances.find(
        (element) => element.display_name === `${base_name}-Copy${count}`
      ) !== undefined
    ) {
      count += 1;
    }

    // Create a duplicate metadata instance using the derived name
    const duplicated_metadata = JSON.parse(JSON.stringify(metadataInstance));
    duplicated_metadata.display_name = `${base_name}-Copy${count}`;
    delete duplicated_metadata.name;
    return MetadataService.postMetadata(
      schemaSpace,
      JSON.stringify(duplicated_metadata)
    );
  }
}
