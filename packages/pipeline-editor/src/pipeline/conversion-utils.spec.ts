/*
 * Copyright 2018-2021 Elyra Authors
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

import {
  preparePipelineForDisplay,
  preparePipelineForStorage
} from './conversion-utils';

describe('preparePipelineForStorage', () => {
  it('converts display names to IDs', () => {
    const pipeline = {
      pipelines: [
        {
          nodes: [
            {
              app_data: {
                component_parameters: { runtime_image: 'Example Name' }
              }
            }
          ]
        }
      ]
    };

    const images = [
      {
        display_name: 'Example Name',
        metadata: {
          image_name: 'example-id'
        }
      }
    ];

    const actual = preparePipelineForStorage(pipeline, images);

    const expected = JSON.stringify(
      {
        pipelines: [
          {
            nodes: [
              {
                app_data: {
                  component_parameters: { runtime_image: 'example-id' }
                }
              }
            ]
          }
        ]
      },
      null,
      2
    );

    expect(actual).toStrictEqual(expected);
  });

  it('handles supernodes', () => {
    const pipeline = {
      pipelines: [
        {
          nodes: []
        },
        {
          nodes: [
            {
              app_data: {
                component_parameters: { runtime_image: 'Example Name' }
              }
            }
          ]
        }
      ]
    };

    const images = [
      {
        display_name: 'Example Name',
        metadata: {
          image_name: 'example-id'
        }
      }
    ];

    const actual = preparePipelineForStorage(pipeline, images);

    const expected = JSON.stringify(
      {
        pipelines: [
          { nodes: [] },
          {
            nodes: [
              {
                app_data: {
                  component_parameters: { runtime_image: 'example-id' }
                }
              }
            ]
          }
        ]
      },
      null,
      2
    );

    expect(actual).toStrictEqual(expected);
  });
});

describe('preparePipelineForDisplay', () => {
  it('uses Generic runtime when undefined', () => {
    const pipeline = {
      pipelines: [
        {
          nodes: [],
          app_data: {}
        }
      ]
    };

    const actual = preparePipelineForDisplay(
      pipeline,
      [],
      'pipeline-name.pipeline',
      undefined
    );

    const expected = {
      pipelines: [
        {
          nodes: [],
          app_data: {
            properties: {
              name: 'pipeline-name.pipeline',
              runtime: 'Generic'
            }
          }
        }
      ]
    };

    expect(actual).toStrictEqual(expected);
  });

  it('uses runtime when not undefined', () => {
    const pipeline = {
      pipelines: [
        {
          nodes: [],
          app_data: {}
        }
      ]
    };

    const actual = preparePipelineForDisplay(
      pipeline,
      [],
      'pipeline-name.pipeline',
      'My Runtime'
    );

    const expected = {
      pipelines: [
        {
          nodes: [],
          app_data: {
            properties: {
              name: 'pipeline-name.pipeline',
              runtime: 'My Runtime'
            }
          }
        }
      ]
    };

    expect(actual).toStrictEqual(expected);
  });

  it('sets null keys to undefined', () => {
    const pipeline = {
      pipelines: [
        {
          nodes: [
            {
              app_data: {
                component_parameters: {
                  empty: null,
                  keys: null,
                  should: null,
                  be: undefined,
                  string: '',
                  bool: false
                }
              }
            }
          ]
        }
      ]
    };

    const actual = preparePipelineForDisplay(
      pipeline,
      [],
      'pipeline-name.pipeline',
      undefined
    );

    const expected = {
      pipelines: [
        {
          nodes: [
            {
              app_data: {
                component_parameters: {
                  empty: undefined,
                  keys: undefined,
                  should: undefined,
                  be: undefined,
                  string: '',
                  bool: false
                }
              }
            }
          ]
        }
      ]
    };

    expect(actual).toStrictEqual(expected);
  });

  it('converts IDs to display names', () => {
    const pipeline = {
      pipelines: [
        {
          nodes: [
            {
              app_data: {
                component_parameters: {
                  runtime_image: 'example-id'
                }
              }
            }
          ]
        }
      ]
    };

    const images = [
      {
        display_name: 'Example Name',
        metadata: {
          image_name: 'example-id'
        }
      }
    ];

    const actual = preparePipelineForDisplay(
      pipeline,
      images,
      'pipeline-name.pipeline',
      undefined
    );

    const expected = {
      pipelines: [
        {
          nodes: [
            {
              app_data: {
                component_parameters: {
                  runtime_image: 'Example Name'
                }
              }
            }
          ]
        }
      ]
    };

    expect(actual).toStrictEqual(expected);
  });

  it('handles supernodes', () => {
    const pipeline = {
      pipelines: [
        {
          nodes: []
        },
        {
          nodes: [
            {
              app_data: {
                component_parameters: {
                  runtime_image: 'example-id',
                  empty: null,
                  keys: null,
                  should: null,
                  be: undefined,
                  string: '',
                  bool: false
                }
              }
            }
          ]
        }
      ]
    };

    const images = [
      {
        display_name: 'Example Name',
        metadata: {
          image_name: 'example-id'
        }
      }
    ];

    const actual = preparePipelineForDisplay(
      pipeline,
      images,
      'pipeline-name.pipeline',
      undefined
    );

    const expected = {
      pipelines: [
        {
          nodes: []
        },
        {
          nodes: [
            {
              app_data: {
                component_parameters: {
                  runtime_image: 'Example Name',
                  empty: undefined,
                  keys: undefined,
                  should: undefined,
                  be: undefined,
                  string: '',
                  bool: false
                }
              }
            }
          ]
        }
      ]
    };

    expect(actual).toStrictEqual(expected);
  });
});
