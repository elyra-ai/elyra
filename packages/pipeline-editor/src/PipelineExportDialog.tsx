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
 * Pipeline export dialog widget
 */
export class PipelineExportDialog extends Widget
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
      runtime_config: (document.getElementById(
        'runtime_config'
      ) as HTMLInputElement).value,

      pipeline_filetype: (document.getElementById(
        'pipeline_filetype'
      ) as HTMLInputElement).value,

      overwrite: (document.getElementById('overwrite') as HTMLInputElement)
        .checked
    };
  }

  getHtml(props: any): HTMLElement {
    const htmlContent = document.createElement('div');
    const br = '<br/>';
    let runtime_options = '';
    let filetype_options = '';
    const runtimes = props['runtimes'];
    const filetypes = ['yaml', 'py'];

    for (const key in runtimes) {
      runtime_options =
        runtime_options +
        `<option value="${runtimes[key]['name']}">${runtimes[key]['display_name']}</option>`;
    }

    filetypes.forEach(filetype => {
      filetype_options =
        filetype_options + `<option value="${filetype}">${filetype}</option>`;
    });

    const content =
      '<label for="runtime_config">Runtime Config:</label>' +
      br +
      '<select id="runtime_config" name="runtime_config" class="elyra-form-runtime-config">' +
      runtime_options +
      '</select>' +
      '<label for="pipeline_filetype">Export Pipeline as:</label>' +
      br +
      '<select id="pipeline_filetype" name="pipeline_filetype" class="elyra-form-export-filetype">' +
      filetype_options +
      '</select>' +
      '<input type="checkbox" id="overwrite"/>' +
      '<label for="overwrite">Replace if file already exists</label>' +
      br;

    htmlContent.innerHTML = content;

    return htmlContent;
  }
}
