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
/* global module */

const esModules = [
  '@microsoft',
  '@jupyter/react-components',
  '@jupyter/web-components',
  '@jupyter/ydoc',
  'exenv-es6',
  'lib0',
  '@rjsf',
  'nanoid',
  'y\\-protocols',
  'y\\-websocket',
  'yjs',
  '(@jupyterlab/.*)/'
].join('|');

module.exports = {
  automock: false,
  testEnvironment: 'jsdom',
  testRegex: `.*.spec.tsx?$`,
  transformIgnorePatterns: [`/node_modules/(?!${esModules}).+`],
  transform: {
    '^.+\\.(j|t)sx?$': [
      'ts-jest',
      {
        tsConfig: '../../tests/tsconfig.json'
      }
    ],
    '\\.svg$': '@glen/jest-raw-loader'
  },
  moduleFileExtensions: [
    'cjs',
    'js',
    'json',
    'jsx',
    'mjs',
    'node',
    'ts',
    'tsx'
  ],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot)$': '@jupyterlab/testutils/lib/jest-file-mock.js'
  },
  setupFilesAfterEnv: ['../../testutils/jest.setup.js'],
  setupFiles: ['@jupyterlab/testing/lib/jest-shim.js']
};
