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

import { IDictionary } from './parsing';
import { SubmissionHandler } from './submission';

/**
 * A utilities class for various elyra services.
 */
export class FrontendServices {
  static async getMetadata(name: string): Promise<any> {
    const getMetadataResponse: Promise<any> = new Promise((resolve, reject) => {
      SubmissionHandler.makeGetRequest(
        'api/metadata/' + name,
        'metadata',
        (response: any) => {
          if (Object.keys(response[name]).length === 0) {
            return SubmissionHandler.noMetadataError(name);
          }
          resolve(response[name]);
        }
      );
    });

    const metadataResponse: any = await getMetadataResponse;
    return metadataResponse;
  }

  static async getRuntimeImages(): Promise<IDictionary<string>> {
    const runtimeImages = await this.getMetadata('runtime-images');
    const images: IDictionary<string> = {};
    for (const image in runtimeImages) {
      const imageName: string = runtimeImages[image]['metadata']['image_name'];
      images[imageName] = runtimeImages[image]['display_name'];
    }
    return images;
  }
}
