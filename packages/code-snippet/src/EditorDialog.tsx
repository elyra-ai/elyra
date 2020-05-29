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

import { Dialog } from '@jupyterlab/apputils';
import { Widget, PanelLayout } from '@lumino/widgets';

/**
 * Code snippet editor dialog widget
 */
export class EditorDialog extends Widget implements Dialog.IBodyWidget<any> {
  constructor(props: any) {
    super(props);

    const layout = (this.layout = new PanelLayout());
    const htmlContent = this.getHtml(props);

    layout.addWidget(new Widget({ node: htmlContent }));
  }

  getValue(): any {
    return {
      display_name: (document.getElementById(
        'display_name'
      ) as HTMLInputElement).value,

      description: (document.getElementById('description') as HTMLInputElement)
        .value,

      language: (document.getElementById('language') as HTMLInputElement).value,

      code: (document.getElementById('code') as HTMLTextAreaElement).value
    };
  }

  getHtml(props: any): HTMLElement {
    const htmlContent = document.createElement('div');
    const br = '<br/>';

    const content =
      '<label for="display_name">Name:</label>' +
      br +
      '<input id="display_name" name="display_name" class="elyra-form-inputtext" value="' +
      props.display_name +
      '"/>' +
      br +
      '<label for="description">Description (optional):</label>' +
      br +
      '<input id="description" name="description" class="elyra-form-inputtext" value="' +
      props.description +
      '"/>' +
      br +
      '<label for="language">Coding language:</label>' +
      br +
      '<input id="language" name="language" class="elyra-form-inputtext" value="' +
      props.language +
      '"/>' +
      br +
      '<label for="code">Code snippet:</label>' +
      br +
      '<textarea id="code" name="code"' +
      // {this.onSubmitHandler()} +
      // br +
      ' class="elyra-form-code">' +
      props.code +
      '</textarea>' +
      br;

    htmlContent.innerHTML = content;

    return htmlContent;
  }
}
