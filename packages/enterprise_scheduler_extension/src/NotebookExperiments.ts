import {Message} from '@phosphor/messaging';
import {Widget} from '@phosphor/widgets'; //Panel, StackedPanel,
import {JSONObject} from "@phosphor/coreutils";
import {URLExt} from "@jupyterlab/coreutils";

import {ServerConnection} from "@jupyterlab/services";

export class NotebookExperimentWidget extends Widget {
  readonly div: HTMLDivElement;

  constructor() {
    super();

    this.id = "dlw-notebook-experiments";
    this.title.label = "Notebook Experiments";
    this.title.closable = true;
    this.addClass("dlw-notebookExperimentWidget");

    this.div = <HTMLDivElement> document.createElement('div');
    this.div.className = 'dlw-experiments';
    this.div.id = 'div-experiments';
    this.node.appendChild(this.div);
  }

  createResultTable() : HTMLTableElement {
    let table = <HTMLTableElement> document.createElement('table');
    table.className = "dlw-Table-experiments";

    let tableHead = table.createTHead();
    tableHead.className = "dlw-Table-experiments";

    let tableHeadRow = tableHead.insertRow();
    tableHeadRow.insertCell(0).innerText = "Model ID";
    tableHeadRow.insertCell(1).innerText = "Name";
    tableHeadRow.insertCell(2).innerText = "Description";
    tableHeadRow.insertCell(3).innerText = "Status";

    return table;
  }

  /**
   * Handle update requests for the widget.
   */
  onUpdateRequest(msg: Message): void {
    let settings = ServerConnection.makeSettings();
    let url = URLExt.join(settings.baseUrl, 'experiments');

    console.log('Updating experiments list');
    ServerConnection.makeRequest(url, { method: 'GET' }, settings)
      .then(response => {
        if (response.status !== 200) {
          console.log('Error retrieving list of experiments from server.');

          let table = this.createResultTable()

          let errorMessage = <HTMLParagraphElement> document.createElement('p');
          errorMessage.innerText = 'Error retrieving list of experiments from server.';

          this.div.innerHTML = "";
          this.div.appendChild(table);
          this.div.appendChild(errorMessage);

          throw new ServerConnection.ResponseError(response);
        }
        return response.json()
      }).then(data => {
        /*
        Response example:
        {
          "models": [{
            "model_id": "training-CNqvCZ_mR",
            "location": "/v1/models/training-CNqvCZ_mR",
            "description": "Train Jupyter Notebook: ---",
            "framework": {
              "name": "tensorflow",
              "version": "1.5.0-py3"
            },
            "name": "manifest-c6e066fc",
            "training": {
              "command": "./start.sh",
              "cpus": 1,
              "input_data": ["sl-internal-os-input"],
              "learners": 1,
              "memory": 1,
              "memory_unit": "GB",
              "output_data": ["sl-internal-os-output"],
              "training_status": {
                "completed": "1548374771756",
                "status": "COMPLETED",
                "status_description": "COMPLETED",
                "submitted": "1548374562256"
              }
            }
          }]
        }`;
         */

        let json = data;

        let table = this.createResultTable();

        // populate the header
        for(var i=0; i < json.models.length; i++) {
          var model:JSONObject = json.models[i];
          var training: JSONObject = <JSONObject> model.training;
          var training_status: JSONObject = <JSONObject> training.training_status;

          var tableRow = table.insertRow();
          tableRow.className = "dlw-Table-experiments";
          tableRow.insertCell(0).innerText = model.model_id.toString();
          tableRow.insertCell(1).innerText = model.name.toString();
          tableRow.insertCell(2).innerText = model.description.toString();
          tableRow.insertCell(3).innerText = training_status.status.toString();
        }

        this.div.innerHTML = ""
        this.div.appendChild(table);
      });
  }
}
