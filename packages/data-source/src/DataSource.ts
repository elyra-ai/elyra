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
  id: number;
  displayName: string;
  description: string;
  source: string;
  format: string;
}

export class DataSourceManager {
  readonly dataSourceEndpoint = 'api/metadata/data-sources';

  async findAll(): Promise<IDataSource[]> {
    const getDataSources: Promise<IDataSource[]> = new Promise(
      (resolve, reject) => {
        const allDataSources: IDataSource[] = [];
        let idNum = 0;
        SubmissionHandler.makeGetRequest(
          this.dataSourceEndpoint,
          'data sources',
          (response: any) => {
            const dataSourcesResponse = response['data-sources'];

            for (const dataSourceKey in dataSourcesResponse) {
              const jsonDataSource = dataSourcesResponse[dataSourceKey];
              idNum++;
              const dataSource: IDataSource = {
                name: jsonDataSource.name,
                id: idNum,
                displayName: jsonDataSource.display_name,
                description: jsonDataSource.metadata.description,
                format: jsonDataSource.metadata.format,
                source: jsonDataSource.metadata.source
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
}
