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

import { kebabCase } from 'lodash';

import { ISnapshotResults } from './plugin';

let snapshotIndexTracker: { [key: string]: number } = {};

beforeEach(() => {
  // reset tracker before each test, otherwise test retries will act as if there
  // are multiple snapshots in one test case.
  snapshotIndexTracker = {};
});

const getSnapshotPath = (test: any): string => {
  const names = [];
  for (let k = test; k; k = k.parent) {
    names.push(k.title);
  }

  const filename = names
    .filter((x) => x)
    .map((x) => kebabCase(x))
    .reverse()
    .join('/');

  if (snapshotIndexTracker[filename] !== undefined) {
    snapshotIndexTracker[filename] += 1;
  } else {
    snapshotIndexTracker[filename] = 1;
  }

  const index = snapshotIndexTracker[filename];

  const snapshotsFolder = Cypress.config('snapshotsFolder');

  return `${snapshotsFolder}/${filename}.${index}.snap`;
};

Cypress.Commands.add('matchesSnapshot', { prevSubject: true }, (value) => {
  const test = (Cypress as any).mocha.getRunner().suite.ctx.test;

  const path = getSnapshotPath(test);

  cy.task<ISnapshotResults>('matchesSnapshot', { path, value }).then((res) => {
    if (res.status === 'fail') {
      const error = new Error(res.message);
      error.name = res.name;
      throw error;
    }

    if (res.status === 'new') {
      Cypress.log({ message: 'Generating new snapshot...' });
    }
  });
});
