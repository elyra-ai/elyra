/*
 * Copyright 2018-2022 Elyra Authors
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

/*
 * Copyright 2018-2022 Elyra Authors
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

import { IMetadata } from '@elyra/metadata-common';
import { MetadataService } from '@elyra/services';

import { Dialog, showDialog } from '@jupyterlab/apputils';

export const TEMPLATE_SCHEMASPACE = 'templates';
export const TEMPLATE_SCHEMA = 'template';

export class TemplateService {
  static async findAll(): Promise<IMetadata[]> {
    return MetadataService.getMetadata(TEMPLATE_SCHEMASPACE);
  }

  // TODO: Test this function
  static async findByLanguage(language: string): Promise<IMetadata[]> {
    try {
      const allTemplates: IMetadata[] = await this.findAll();
      const templatesByLanguage: IMetadata[] = [];

      for (const template of allTemplates) {
        if (template.metadata.language === language) {
          templatesByLanguage.push(template);
        }
      }

      return templatesByLanguage;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Opens a dialog to confirm that the given template
   * should be deleted, then sends a delete request to the metadata server.
   *
   * @param template: template to be deleted
   *
   * @returns A boolean promise that is true if the dialog confirmed
   * the deletion, and false if the deletion was cancelled.
   */
  static deleteTemplate(template: IMetadata): Promise<boolean> {
    return showDialog({
      title: `Delete temp '${template.display_name}'?`,
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    }).then((result: any) => {
      // Do nothing if the cancel button is pressed
      if (result.button.accept) {
        return MetadataService.deleteMetadata(
          TEMPLATE_SCHEMASPACE,
          template.name
        ).then(() => true);
      } else {
        return false;
      }
    });
  }
}
