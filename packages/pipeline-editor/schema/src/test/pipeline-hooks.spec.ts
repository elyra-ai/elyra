/*
 * Copyright 2018-2023 Elyra Authors
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
  IRuntimeComponent,
  GENERIC_CATEGORY_ID,
  sortPalette,
} from '../pipeline-hooks';

const GENERIC_CATEGORY = {
  label: 'ZZZZ should not matter',
  image: 'string',
  id: GENERIC_CATEGORY_ID,
  description: 'string',
  node_types: [],
};

type Category = IRuntimeComponent;
type Component = Category['node_types'][0];

const createMockCategory = (
  name: string,
  components: Component[] = [],
): Category => {
  return {
    label: name,
    image: 'string',
    id: 'string',
    description: 'string',
    node_types: components,
  };
};

const createMockComponent = (name: string): Component => {
  return {
    op: 'string',
    label: name,
    id: 'string',
    image: 'string',
    type: 'execution_node',
    inputs: [],
    outputs: [],
    app_data: {},
  };
};

describe('sortPalette', () => {
  it('should function with no categories', () => {
    const palette = { categories: [] };
    const expected = { categories: [] };
    sortPalette(palette);
    expect(palette).toStrictEqual(expected);
  });

  it('should sort categories alphabetically', () => {
    const palette = {
      categories: [
        createMockCategory('a'),
        createMockCategory('c'),
        createMockCategory('b'),
      ],
    };
    const expected = {
      categories: [
        createMockCategory('a'),
        createMockCategory('b'),
        createMockCategory('c'),
      ],
    };
    sortPalette(palette);
    expect(palette).toStrictEqual(expected);
  });

  it('should sort components alphabetically', () => {
    const palette = {
      categories: [
        createMockCategory('a', [
          createMockComponent('c'),
          createMockComponent('a'),
          createMockComponent('b'),
        ]),
      ],
    };
    const expected = {
      categories: [
        createMockCategory('a', [
          createMockComponent('a'),
          createMockComponent('b'),
          createMockComponent('c'),
        ]),
      ],
    };
    sortPalette(palette);
    expect(palette).toStrictEqual(expected);
  });

  it('should sort categories numerically', () => {
    const palette = {
      categories: [
        createMockCategory('c200'),
        createMockCategory('c2'),
        createMockCategory('c20'),
        createMockCategory('c100'),
        createMockCategory('c1'),
        createMockCategory('c10'),
      ],
    };
    const expected = {
      categories: [
        createMockCategory('c1'),
        createMockCategory('c2'),
        createMockCategory('c10'),
        createMockCategory('c20'),
        createMockCategory('c100'),
        createMockCategory('c200'),
      ],
    };
    sortPalette(palette);
    expect(palette).toStrictEqual(expected);
  });

  it('should sort components numerically', () => {
    const palette = {
      categories: [
        createMockCategory('a', [
          createMockComponent('c200'),
          createMockComponent('c2'),
          createMockComponent('c20'),
          createMockComponent('c100'),
          createMockComponent('c1'),
          createMockComponent('c10'),
        ]),
      ],
    };
    const expected = {
      categories: [
        createMockCategory('a', [
          createMockComponent('c1'),
          createMockComponent('c2'),
          createMockComponent('c10'),
          createMockComponent('c20'),
          createMockComponent('c100'),
          createMockComponent('c200'),
        ]),
      ],
    };
    sortPalette(palette);
    expect(palette).toStrictEqual(expected);
  });

  it('should sort generic category first', () => {
    const palette = {
      categories: [
        GENERIC_CATEGORY,
        createMockCategory('a'),
        createMockCategory('c'),
        createMockCategory('b'),
      ],
    };
    const expected = {
      categories: [
        GENERIC_CATEGORY,
        createMockCategory('a'),
        createMockCategory('b'),
        createMockCategory('c'),
      ],
    };
    sortPalette(palette);
    expect(palette).toStrictEqual(expected);
  });
});
