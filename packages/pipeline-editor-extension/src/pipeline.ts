/*
 * Copyright 2018-2020 Elyra Authors
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

const pipeline: any = {
  doc_type: 'pipeline',
  version: '3.0',
  json_schema:
    'http://api.dataplatform.ibm.com/schemas/common-pipeline/pipeline-flow/pipeline-flow-v3-schema.json',
  id: 'f667f909-35de-468d-a87d-be030ed4998f',
  primary_pipeline: '405ee603-c87e-4658-bf72-9b5afa0b7dfc',
  pipelines: [
    {
      id: '405ee603-c87e-4658-bf72-9b5afa0b7dfc',
      nodes: [
        {
          id: 'c88d9c0b-a5d5-45ab-88d6-eb6ce24ffdbb',
          type: 'execution_node',
          op: 'execute-notebook-node',
          app_data: {
            filename: 'load_data.ipynb',
            runtime_image: 'amancevice/pandas:1.0.3',
            env_vars: [
              'DATASET_URL=https://dax-cdn.cdn.appdomain.cloud/dax-noaa-weather-data-jfk-airport/1.1.4/noaa-weather-data-jfk-airport.tar.gz'
            ],
            include_subdirectories: false,
            outputs: ['data/noaa-weather-data-jfk-airport/jfk_weather.csv'],
            ui_data: {
              label: 'load_data.ipynb',
              image:
                'data:image/svg+xml;utf8,%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%3E%0A%20%20%3Cg%20transform%3D%22translate(-1638%2C-1844)%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22m1788%201886a108.02%20108.02%200%200%200%20-104.92%2082.828%20114.07%2064.249%200%200%201%20104.92%20-39.053%20114.07%2064.249%200%200%201%20104.96%2039.261%20108.02%20108.02%200%200%200%20-104.96%20-83.037zm-104.96%20133.01a108.02%20108.02%200%200%200%20104.96%2083.037%20108.02%20108.02%200%200%200%20104.92%20-82.828%20114.07%2064.249%200%200%201%20-104.92%2039.053%20114.07%2064.249%200%200%201%20-104.96%20-39.261z%22%20style%3D%22fill%3A%23f57c00%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%221699.5%22%20cy%3D%222110.8%22%20r%3D%2222.627%22%20style%3D%22fill%3A%239e9e9e%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3Ccircle%20cx%3D%221684.3%22%20cy%3D%221892.6%22%20r%3D%2216.617%22%20style%3D%22fill%3A%23616161%3Bmix-blend-mode%3Anormal%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3Ccircle%20cx%3D%221879.8%22%20cy%3D%221877.4%22%20r%3D%2221.213%22%20style%3D%22fill%3A%23757575%3Bmix-blend-mode%3Anormal%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A',
              x_pos: 84.70574951171875,
              y_pos: 316.0490417480469,
              description: 'Notebook file'
            }
          },
          inputs: [
            {
              id: 'inPort',
              app_data: {
                ui_data: {
                  cardinality: {
                    min: 0,
                    max: 1
                  },
                  label: 'Input Port'
                }
              }
            }
          ],
          outputs: [
            {
              id: 'outPort',
              app_data: {
                ui_data: {
                  cardinality: {
                    min: 0,
                    max: -1
                  },
                  label: 'Output Port'
                }
              }
            }
          ]
        },
        {
          id: 'e07e1b7f-568b-4bc3-9fc6-da372fd58daf',
          type: 'execution_node',
          op: 'execute-python-node',
          app_data: {
            filename: 'Part 1 - Data Cleaning.ipynb',
            runtime_image: 'amancevice/pandas:1.0.3',
            env_vars: [],
            include_subdirectories: false,
            outputs: [
              'data/noaa-weather-data-jfk-airport/jfk_weather_cleaned.csv'
            ],
            dependencies: [],
            ui_data: {
              label: 'Python',
              image:
                'data:image/svg+xml;utf8,%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%3E%0A%20%20%3Cg%20transform%3D%22translate(-1.5418e-7%20-.00046865)%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22m9.8594%202.0009c-1.58%200-2.8594%201.2794-2.8594%202.8594v1.6797h4.2891c.39%200%20.71094.57094.71094.96094h-7.1406c-1.58%200-2.8594%201.2794-2.8594%202.8594v3.7812c0%201.58%201.2794%202.8594%202.8594%202.8594h1.1797v-2.6797c0-1.58%201.2716-2.8594%202.8516-2.8594h5.25c1.58%200%202.8594-1.2716%202.8594-2.8516v-3.75c0-1.58-1.2794-2.8594-2.8594-2.8594zm-.71875%201.6094c.4%200%20.71875.12094.71875.71094s-.31875.89062-.71875.89062c-.39%200-.71094-.30062-.71094-.89062s.32094-.71094.71094-.71094z%22%20fill%3D%22%233c78aa%22%2F%3E%0A%20%20%20%20%3Cpath%20d%3D%22m17.959%207v2.6797c0%201.58-1.2696%202.8594-2.8496%202.8594h-5.25c-1.58%200-2.8594%201.2696-2.8594%202.8496v3.75a2.86%202.86%200%200%200%202.8594%202.8613h4.2812a2.86%202.86%200%200%200%202.8594%20-2.8613v-1.6797h-4.291c-.39%200-.70898-.56898-.70898-.95898h7.1406a2.86%202.86%200%200%200%202.8594%20-2.8613v-3.7793a2.86%202.86%200%200%200%20-2.8594%20-2.8594zm-9.6387%204.5137-.0039.0039c.01198-.0024.02507-.0016.03711-.0039zm6.5391%207.2754c.39%200%20.71094.30062.71094.89062a.71%20.71%200%200%201%20-.71094%20.70898c-.4%200-.71875-.11898-.71875-.70898s.31875-.89062.71875-.89062z%22%20fill%3D%22%23fdd835%22%2F%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A',
              x_pos: 372.4868469238281,
              y_pos: 318.0490417480469,
              description: 'Python file'
            }
          },
          inputs: [
            {
              id: 'inPort',
              app_data: {
                ui_data: {
                  label: ''
                }
              },
              links: [
                {
                  id: '7V7Z_SeSMosviKDKlASG3',
                  node_id_ref: 'c88d9c0b-a5d5-45ab-88d6-eb6ce24ffdbb',
                  port_id_ref: 'outPort',
                  app_data: {
                    ui_data: {
                      class_name: 'd3-data-link'
                    }
                  }
                }
              ]
            }
          ],
          outputs: [
            {
              id: 'outPort',
              app_data: {
                ui_data: {
                  label: ''
                }
              }
            }
          ]
        },
        {
          id: '982e672a-4ae5-4608-bcb0-ce309868415a',
          type: 'execution_node',
          op: 'execute-deploy-wml-node',
          app_data: {
            filename: 'Part 2 - Data Analysis.ipynb',
            runtime_image: 'amancevice/pandas:1.0.3',
            env_vars: [],
            include_subdirectories: false,
            dependencies: [],
            invalidNodeError:
              'property "Model Unique ID" is required\nproperty "Model Name" is required',
            ui_data: {
              label: 'Deploy Model',
              image:
                'data:image/svg+xml;utf8,%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%22-4%20-4%2040%2040%22%20fill%3D%22%238a3ffc%22%3E%0A%20%20%3Cpath%20d%3D%22M22%2C26H20V17.76l-3.23%2C3.88a1%2C1%2C0%2C0%2C1-1.54%2C0L12%2C17.76V26H10V15a1%2C1%2C0%2C0%2C1%2C.66-.94%2C1%2C1%2C0%2C0%2C1%2C1.11.3L16%2C19.44l4.23-5.08a1%2C1%2C0%2C0%2C1%2C1.11-.3A1%2C1%2C0%2C0%2C1%2C22%2C15Z%22%20%2F%3E%0A%20%20%3Cpath%20d%3D%22M4.16%2C14.65l-3-1.75a.76.76%2C0%2C1%2C0-.76%2C1.32L3.4%2C16a.76.76%2C0%2C1%2C0%2C.76-1.31Z%22%20%2F%3E%0A%20%20%3Cpath%20d%3D%22M8.29%2C10.52a.73.73%2C0%2C0%2C0%2C1%2C.27.75.75%2C0%2C0%2C0%2C.28-1l-1.74-3a.76.76%2C0%2C1%2C0-1.32.76Z%22%20%2F%3E%0A%20%20%3Cpath%20d%3D%22M16%2C9a.76.76%2C0%2C0%2C0%2C.76-.76V4.76a.76.76%2C0%2C1%2C0-1.52%2C0V8.25A.76.76%2C0%2C0%2C0%2C16%2C9Z%22%20%2F%3E%0A%20%20%3Cpath%20d%3D%22M22.68%2C10.79a.75.75%2C0%2C0%2C0%2C.37.11.76.76%2C0%2C0%2C0%2C.66-.38l1.75-3a.76.76%2C0%2C0%2C0-1.32-.76l-1.74%2C3A.75.75%2C0%2C0%2C0%2C22.68%2C10.79Z%22%20%2F%3E%0A%20%20%3Cpath%20d%3D%22M31.9%2C13.18a.76.76%2C0%2C0%2C0-1-.28l-3%2C1.75A.76.76%2C0%2C0%2C0%2C28.6%2C16l3-1.74A.77.77%2C0%2C0%2C0%2C31.9%2C13.18Z%22%20%2F%3E%0A%3C%2Fsvg%3E%0A',
              x_pos: 667,
              y_pos: 232.78109741210938,
              description:
                'Deploy stored model on Watson Machine Learning as a web service.',
              decorations: [
                {
                  id: 'error',
                  image:
                    'data:image/svg+xml;utf8,%3Csvg%20focusable%3D%22false%22%20preserveAspectRatio%3D%22xMidYMid%20meet%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22%23da1e28%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%20aria-hidden%3D%22true%22%3E%3Ccircle%20cx%3D%228%22%20cy%3D%228%22%20r%3D%228%22%20fill%3D%22%23ffffff%22%3E%3C%2Fcircle%3E%3Cpath%20d%3D%22M8%2C1C4.2%2C1%2C1%2C4.2%2C1%2C8s3.2%2C7%2C7%2C7s7-3.1%2C7-7S11.9%2C1%2C8%2C1z%20M7.5%2C4h1v5h-1C7.5%2C9%2C7.5%2C4%2C7.5%2C4z%20M8%2C12.2%09c-0.4%2C0-0.8-0.4-0.8-0.8s0.3-0.8%2C0.8-0.8c0.4%2C0%2C0.8%2C0.4%2C0.8%2C0.8S8.4%2C12.2%2C8%2C12.2z%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M7.5%2C4h1v5h-1C7.5%2C9%2C7.5%2C4%2C7.5%2C4z%20M8%2C12.2c-0.4%2C0-0.8-0.4-0.8-0.8s0.3-0.8%2C0.8-0.8%09c0.4%2C0%2C0.8%2C0.4%2C0.8%2C0.8S8.4%2C12.2%2C8%2C12.2z%22%20data-icon-path%3D%22inner-path%22%20opacity%3D%220%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E',
                  outline: false,
                  position: 'topRight',
                  x_pos: -24,
                  y_pos: -8
                }
              ]
            }
          },
          inputs: [
            {
              id: 'inPort',
              app_data: {
                ui_data: {
                  label: ''
                }
              },
              links: [
                {
                  id: 'xt74AYx_V7rK4aqYdi3qE',
                  node_id_ref: 'e07e1b7f-568b-4bc3-9fc6-da372fd58daf',
                  port_id_ref: 'outPort',
                  app_data: {
                    ui_data: {
                      class_name: 'd3-data-link'
                    }
                  }
                }
              ]
            }
          ],
          outputs: [
            {
              id: 'outPort',
              app_data: {
                ui_data: {
                  label: ''
                }
              }
            }
          ]
        },
        {
          id: 'b00e4654-a2b0-417c-8f93-8a03bec95945',
          type: 'execution_node',
          op: 'execute-notebook-node',
          app_data: {
            filename: 'Part 3 - Time Series Forecasting.ipynb',
            runtime_image: 'amancevice/pandas:1.0.3',
            env_vars: [],
            include_subdirectories: false,
            dependencies: [],
            ui_data: {
              label: 'Part 3 - Time Series Forecasting.ipynb',
              image:
                'data:image/svg+xml;utf8,%0A%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20300%20300%22%3E%0A%20%20%3Cg%20transform%3D%22translate(-1638%2C-1844)%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22m1788%201886a108.02%20108.02%200%200%200%20-104.92%2082.828%20114.07%2064.249%200%200%201%20104.92%20-39.053%20114.07%2064.249%200%200%201%20104.96%2039.261%20108.02%20108.02%200%200%200%20-104.96%20-83.037zm-104.96%20133.01a108.02%20108.02%200%200%200%20104.96%2083.037%20108.02%20108.02%200%200%200%20104.92%20-82.828%20114.07%2064.249%200%200%201%20-104.92%2039.053%20114.07%2064.249%200%200%201%20-104.96%20-39.261z%22%20style%3D%22fill%3A%23f57c00%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%0A%20%20%20%20%3Ccircle%20cx%3D%221699.5%22%20cy%3D%222110.8%22%20r%3D%2222.627%22%20style%3D%22fill%3A%239e9e9e%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3Ccircle%20cx%3D%221684.3%22%20cy%3D%221892.6%22%20r%3D%2216.617%22%20style%3D%22fill%3A%23616161%3Bmix-blend-mode%3Anormal%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%3Ccircle%20cx%3D%221879.8%22%20cy%3D%221877.4%22%20r%3D%2221.213%22%20style%3D%22fill%3A%23757575%3Bmix-blend-mode%3Anormal%3Bpaint-order%3Afill%20markers%20stroke%22%2F%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E%0A',
              x_pos: 662.7548217773438,
              y_pos: 371.5849304199219,
              description: 'Notebook file'
            }
          },
          inputs: [
            {
              id: 'inPort',
              app_data: {
                ui_data: {
                  label: ''
                }
              },
              links: [
                {
                  id: 'LaN6rmhdGnuE_srRhvXdc',
                  node_id_ref: 'e07e1b7f-568b-4bc3-9fc6-da372fd58daf',
                  port_id_ref: 'outPort',
                  app_data: {
                    ui_data: {
                      class_name: 'd3-data-link'
                    }
                  }
                }
              ]
            }
          ],
          outputs: [
            {
              id: 'outPort',
              app_data: {
                ui_data: {
                  label: ''
                }
              }
            }
          ]
        }
      ],
      app_data: {
        ui_data: {
          comments: [
            {
              id: '3dbedb9d-0dc2-438d-aefe-08819755d00f',
              x_pos: 47,
              y_pos: 130,
              width: 245,
              height: 51,
              class_name: 'd3-comment-rect',
              content:
                'Download the JFK Weather dataset archive and extract it',
              associated_id_refs: [
                {
                  node_ref: 'c88d9c0b-a5d5-45ab-88d6-eb6ce24ffdbb',
                  class_name: 'd3-comment-link'
                }
              ]
            },
            {
              id: '74f3d44b-fef4-4d8c-98ef-6c24876c61ef',
              x_pos: 354,
              y_pos: 125,
              width: 153,
              height: 49,
              class_name: 'd3-comment-rect',
              content: 'Clean the dataset',
              associated_id_refs: [
                {
                  node_ref: 'e07e1b7f-568b-4bc3-9fc6-da372fd58daf',
                  class_name: 'd3-comment-link'
                }
              ]
            },
            {
              id: '2fcbdf51-2462-4866-96f5-5275b4d0ada1',
              x_pos: 654,
              y_pos: 120,
              width: 175,
              height: 42,
              class_name: 'd3-comment-rect',
              content: ' Analyze the dataset',
              associated_id_refs: [
                {
                  node_ref: '982e672a-4ae5-4608-bcb0-ce309868415a',
                  class_name: 'd3-comment-link'
                }
              ]
            },
            {
              id: '1682fab5-137e-40d2-a841-27f91692ae48',
              x_pos: 643,
              y_pos: 478,
              width: 252,
              height: 61,
              class_name: 'd3-comment-rect',
              content: 'Explore approaches to predicting future temperatures ',
              associated_id_refs: [
                {
                  node_ref: 'b00e4654-a2b0-417c-8f93-8a03bec95945',
                  class_name: 'd3-comment-link'
                }
              ]
            }
          ]
        },
        version: 3
      },
      runtime_ref: ''
    }
  ],
  schemas: []
};

export default pipeline;
