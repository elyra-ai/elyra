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

import { MetadataService } from '@elyra/services';
import * as React from 'react';

export const useMetadata = (
  namespace: string,
  schemaName: string,
  name?: string
): any => {
  const [junk, setJunk] = React.useState<any>();
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    const that: any = {};
    const main = async (): Promise<void> => {
      try {
        const schemas = await MetadataService.getSchema(namespace);
        for (const schema of schemas) {
          if (schemaName === schema.name) {
            that.schema = schema.properties.metadata.properties;
            that.referenceURL = schema.uihints?.reference_url;
            that.schemaDisplayName = schema.title;
            that.requiredFields = schema.properties.metadata.required;
            if (!name) {
              that.title.label = `New ${that.schemaDisplayName}`;
            }
            // Find categories of all schema properties
            that.schemaPropertiesByCategory = { _noCategory: [] };
            for (const schemaProperty in that.schema) {
              const category =
                that.schema[schemaProperty].uihints &&
                that.schema[schemaProperty].uihints.category;
              if (!category) {
                that.schemaPropertiesByCategory['_noCategory'].push(
                  schemaProperty
                );
              } else if (that.schemaPropertiesByCategory[category]) {
                that.schemaPropertiesByCategory[category].push(schemaProperty);
              } else {
                that.schemaPropertiesByCategory[category] = [schemaProperty];
              }
            }
            break;
          }
        }
      } catch (error) {
        setError(error);
      }

      try {
        that.allMetadata = await MetadataService.getMetadata(namespace);
      } catch (error) {
        setError(error);
      }

      if (name) {
        for (const metadata of that.allMetadata) {
          if (metadata.metadata.tags) {
            for (const tag of metadata.metadata.tags) {
              if (!that.allTags.includes(tag)) {
                that.allTags.push(tag);
              }
            }
          } else {
            metadata.metadata.tags = [];
          }
          if (name === metadata.name) {
            that.metadata = metadata['metadata'];
            that.displayName = metadata['display_name'];
            that.title.label = that.displayName ?? '';
          }
        }
      } else {
        that.displayName = '';
      }

      setJunk(that);
    };
    main();
  }, [name, namespace, schemaName]);

  return [junk, error];
};
