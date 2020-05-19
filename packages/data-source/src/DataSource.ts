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

import { SubmissionHandler } from '@elyra/application';

export interface IDataSource {
  name: string;
  displayName: string;
  description: string;
  source: string;
  language: string;
  code: string[];
}

export class DataSourceManager {
  readonly dataSourceEndpoint = 'api/metadata/data-sources';

  async findAll(): Promise<IDataSource[]> {
    const getDataSources: Promise<IDataSource[]> = new Promise(
      (resolve, reject) => {
        const allDataSources: IDataSource[] = [];
        SubmissionHandler.makeGetRequest(
          this.dataSourceEndpoint,
          'data sources',
          (response: any) => {
            const dataSourcesResponse = response['data-sources'];

            for (const dataSourceKey in dataSourcesResponse) {
              const jsonDataSource = dataSourcesResponse[dataSourceKey];
              const dataSource: IDataSource = {
                name: jsonDataSource.name,
                displayName: jsonDataSource.display_name,
                description: jsonDataSource.metadata.description,
                source: jsonDataSource.metadata.source,
                language: jsonDataSource.metadata.language,
                code: jsonDataSource.metadata.code
              };
              allDataSources.push(dataSource);
            }
            resolve(allDataSources);
          }
        );
      }
    );
    const dataSources = await getDataSources;

    return dataSources;
  }

  // TODO: Test this function
  async findByLanguage(language: string): Promise<IDataSource[]> {
    const allDataSources: IDataSource[] = await this.findAll();
    const dataSourcesByLanguage: IDataSource[] = [];

    for (const dataSource of allDataSources) {
      if (dataSource.language === language) {
        dataSourcesByLanguage.push(dataSource);
      }
    }

    return dataSourcesByLanguage;
  }
}
