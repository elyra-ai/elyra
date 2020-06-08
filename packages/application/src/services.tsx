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

import { Dialog, showDialog } from '@jupyterlab/apputils';
import * as React from 'react';

import { RequestHandler } from './requests';

/**
 * A utility class for handling elyra metadata calls.
 */
export class FrontendServices {
  static noMetadataError(metadataName: string): Promise<Dialog.IResult<any>> {
    return showDialog({
      title: 'Error retrieving metadata',
      body: <p>No {metadataName} metadata has been configured.</p>,
      buttons: [Dialog.okButton()]
    });
  }

  static async getMetadata(namespace: string): Promise<any> {
    const metadataResponse: any = await RequestHandler.makeGetRequest(
      'elyra/metadata/' + namespace,
      false
    );

    return metadataResponse[namespace];
  }
}
