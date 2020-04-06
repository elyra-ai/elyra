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
import { Widget, PanelLayout } from '@phosphor/widgets';

/**
 * Class for dialog that pops up for pipeline submission
 */
export class PipelineSubmissionDialog extends Widget
  implements Dialog.IBodyWidget<any> {
  constructor(props: any) {
    super(props);

    const layout = (this.layout = new PanelLayout());
    const htmlContent = this.getHtml(props);
    // Set default runtime to kfp, since list is dynamically generated
    (htmlContent.getElementsByClassName(
      'elyra-form-runtime-config'
    )[0] as HTMLSelectElement).value = 'kfp';

    layout.addWidget(new Widget({ node: htmlContent }));
  }

  getValue(): any {
    return {
      pipeline_name: (document.getElementById(
        'pipeline_name'
      ) as HTMLInputElement).value,
      runtime_config: (document.getElementById(
        'runtime_config'
      ) as HTMLInputElement).value
    };
  }

  getHtml(props: any): HTMLElement {
    const htmlContent = document.createElement('div');
    const br = '<br/>';
    let runtime_options = '';
    const runtimes = props['runtimes'];

    for (const key in runtimes) {
      runtime_options =
        runtime_options +
        `<option value="${runtimes[key]['name']}">${runtimes[key]['display_name']}</option>`;
    }

    const content =
      '' +
      '<label for="pipeline_name">Pipeline Name:</label>' +
      br +
      '<input type="text" id="pipeline_name" name="pipeline_name" placeholder="Pipeline Name"/>' +
      br +
      br +
      '<label for="runtime_config">Runtime Config:</label>' +
      br +
      '<select id="runtime_config" name="runtime_config" class="elyra-form-runtime-config">' +
      runtime_options +
      '</select>';

    htmlContent.innerHTML = content;

    return htmlContent;
  }
}
