/*
 * Copyright 2018-2019 IBM Corporation
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
import {Dialog, showDialog, ToolbarButton} from "@jupyterlab/apputils";
import {DocumentRegistry} from "@jupyterlab/docregistry";
import {INotebookModel, NotebookPanel} from "@jupyterlab/notebook";
import {JupyterFrontEnd} from "@jupyterlab/application";
import {JSONObject, JSONValue} from "@lumino/coreutils";
import {PanelLayout, Widget} from '@lumino/widgets';
import {IDisposable} from "@lumino/disposable";

import {NotebookParser, SubmissionHandler} from "@elyra/application";

import Utils from './utils'

/**
 * Details about notebook submission configuration, including
 * details about the remote runtime and any other
 * user details required to access/start the job
 */
export interface ISubmitNotebookConfiguration extends JSONObject {
  runtime_config: string,
  framework: string,
  //cpus: number,
  //gpus: number,
  //memory: string,
  dependencies: string[],

  env: string[]
}

/**
 * Details about notebook submission task, includes the submission
 * configuration plus the notebook contents that is being submitted
 */
export interface ISubmitNotebookOptions extends ISubmitNotebookConfiguration {
  kernelspec: string,
  notebook_name: string,
  notebook_path: string,
  notebook: JSONValue,
}

/**
 * Submit notebook button extension
 *  - Attach button to notebook toolbar and launch a dialog requesting
 *  information about the remote location to where submit the notebook
 *  for execution
 */
export class SubmitNotebookButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  private panel: NotebookPanel;

  constructor(app: JupyterFrontEnd) {
    this.app = app;
  }

  readonly app: JupyterFrontEnd;

  showWidget = () => {

    // @ts-ignore
    let envVars = NotebookParser.getEnvVars(this.panel.content.model.toString());


    SubmissionHandler.makeGetRequest('metadata/runtime', 'pipeline', (runtimes: any) =>
      showDialog({
        title: 'Submit notebook',
        body: new SubmitNotebook(envVars, runtimes) as unknown as Dialog.IBodyWidget<ISubmitNotebookConfiguration>,
        buttons: [Dialog.cancelButton(), Dialog.okButton()]
      }).then(result => {
        if (result.value == null) {
          // When Cancel is clicked on the dialog, just return
          return;
        }

        // prepare notebook submission details
        let notebookOptions: ISubmitNotebookOptions = <ISubmitNotebookOptions>result.value;
        let pipeline = Utils.generateNotebookPipeline(this.panel.context.path, notebookOptions);

        SubmissionHandler.submitPipeline(pipeline, result.value.runtime_config, 'notebook');
      })
    );
  };

  createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
    this.panel = panel;

    // Create the toolbar button
    let submitNotebookButton = new ToolbarButton({
      label: 'Submit Notebook ...',
      onClick: this.showWidget,
      tooltip: 'Submit Notebook ...'
    });

    // Add the toolbar button to the notebook
    panel.toolbar.insertItem(9, 'submitNotebook', submitNotebookButton);

    // The ToolbarButton class implements `IDisposable`, so the
    // button *is* the extension for the purposes of this method.
    return submitNotebookButton;
  }
}

/**
 * Submit notebook dialog extension
 * - Request information about the remote location to where submit the
 * notebook for execution
 */
export class SubmitNotebook extends Widget {
  private _htmlDialogElement: HTMLElement;
  _envVars: string[];
  _runtimes: any;

  constructor(envVars: string[], runtimes: any) {
    super();

    this._envVars = envVars;
    this._runtimes = runtimes;

    this._htmlDialogElement = this.renderHtml();
    // Set default config to kfp, since list is dynamically generated
    (this._htmlDialogElement.getElementsByClassName("elyra-form-runtime-config")[0] as HTMLSelectElement).value = "kfp";

    let layout = (this.layout = new PanelLayout());

    layout.addWidget(new Widget( {node: <HTMLElement> this._htmlDialogElement.firstElementChild }))
  }

  /**
   * Render the dialog widget used to gather configuration information
   * required to submit/run the notebook remotely
   */
  renderHtml() {
    var tr = '<tr>'; //'<tr style="padding: 1px;">';
    var td = '<td>'; //'<td style="padding: 1px;">';
    var td_colspan2 = '<td colspan=2>'; //'<td style="padding: 1px;" colspan=2>';
    var td_colspan3 = '<td colspan=3>'; //'<td style="padding: 1px;" colspan=3>';
    //var td_colspan4 = '<td colspan=4>'; //'<td style="padding: 1px;" colspan=4>';

    let htmlContent = document.createElement('div');
    let runtime_options = '';

    for (let key in this._runtimes) {
      runtime_options = runtime_options + `<option value="${this._runtimes[key]['name']}">${this._runtimes[key]['display_name']}</option>`;
    }

    var content = ''
      +'<table id="table-submit-dialog" class="elyra-table"><tbody>'

      + tr
      + td_colspan2
      +'<label for="runtime_config">Runtime Config:</label>'
      +'<br/>'
      +'<select id="runtime_config" class="elyra-form-runtime-config">'
      + runtime_options
      +'</select>'
      +'</td>'
      + td_colspan2
      +'<label for="framework">Deep Learning Framework:</label>'
      +'<br/>'
      +'<select id="framework"><option value="tensorflow" selected>Tensorflow</option><option value="caffe">Caffe</option><option value="pytorch">PyTorch</option><option value="caffe2">Caffe2</option></select>'
      +'</td>'
      +'</tr>'

      // + tr
      // + td
      // +'<label for="cpus">CPUs:</label>'
      // +'<br/>'
      // +'<input type="text" id="cpus" name="cpus" placeholder="1" value="1"/>'
      // +'</td>'
      //
      // + td
      // +'<label for="gpus">GPUs:</label>'
      // +'<br/>'
      // +'<input type="text" id="gpus" name="gpus" placeholder="0" value="0"/>'
      // +'</td>'
      //
      // + td
      // +'<label for="memory">Memory:</label>'
      // +'<br/>'
      // +'<input type="text" id="memory" name="memory" placeholder="1Gb" value="1Gb"/>'
      // +'</td>'
      // +'</tr>'

      + tr
      + td
      +'<br/>'
      +'<input type="checkbox" id="dependency_include" name="dependency_include" size="20" checked /> Include dependencies<br/>'
      +'</td>'

      + td_colspan3
      +'<br/>'
      +'<input type="text" id="dependencies" name="dependencies" placeholder="*.py" value="*.py" size="20"/>'
      +'</td>'

      +'</tr>'

      + this.getEnvHtml()

      +'</tbody></table>';
    htmlContent.innerHTML = content;

    return htmlContent;
  }

  getEnvHtml(): string {
    let tr = '<tr>';
    let td = '<td>';
    let td_colspan4 = '<td colspan=4>';
    let subtitle = '<div style="font-size: var(--jp-ui-font-size3)">Environmental Variables</div>'

    if (this._envVars.length > 0) {
      let html =  '' + tr + td_colspan4 + '</td>' + '</tr>';
      html = html + tr + td_colspan4 + subtitle + '</td>' + '</tr>';

      for (let i = 0; i < this._envVars.length; i++) {

        if (i % 4 === 0) {
          html = html + tr;
        }

        html = html + td
          +`<label for="envVar${i}">${this._envVars[i]}:</label>`
          +'<br/>'
          +`<input type="text" id="envVar${i}" class="envVar" name="envVar${i}" placeholder="" value="" size="20"/>`
          +'</td>';

        if (i % 4 === 3) {
          html = html + '</tr>';
        }
      }

      return html;

    } else {
      return '';
    }
  }

  getValue(): ISubmitNotebookConfiguration {

    let dependency_list: string[] = [];
    if ((<HTMLInputElement> document.getElementById('dependency_include')).checked) {
      dependency_list = (<HTMLInputElement>document.getElementById('dependencies')).value.split(',')
    }

    let envVars: string[] = [];

    let envElements = document.getElementsByClassName('envVar');

    for (let i = 0; i < envElements.length; i++) {
      let index: number  = parseInt(envElements[i].id.match(/\d+/)[0], 10);
      envVars.push(`${this._envVars[index]}=${(<HTMLInputElement>envElements[i]).value}`);
    }

    let returnData: ISubmitNotebookConfiguration = {
      runtime_config: (<HTMLSelectElement> document.getElementById('runtime_config')).value,
      framework: (<HTMLSelectElement> document.getElementById('framework')).value,
      //cpus: Number((<HTMLInputElement>document.getElementById('cpus')).value),
      //gpus: Number((<HTMLInputElement>document.getElementById('gpus')).value),
      //memory: (<HTMLInputElement>document.getElementById('memory')).value,
      dependencies: dependency_list,

      env: envVars,
    };

    return returnData;
  }
}
