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

import fs from 'fs';

import { diffStringsUnified } from 'jest-diff';
import { utils } from 'jest-snapshot';

const createSnapshot = (value: any): string => {
  let obj = value;

  try {
    obj = JSON.parse(value);
  } catch {
    // no-op
  }

  const serializedObj = utils.serialize(obj);

  // replace UUIDs with something generic
  return serializedObj.replace(
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  );
};

interface ISnapshotOptions {
  path: string;
  value: any;
}

export type ISnapshotResults =
  | IPassSnapshotResults
  | IFailSnapshotResults
  | INewSnapshotResults;

interface IPassSnapshotResults {
  status: 'pass';
}

interface IFailSnapshotResults {
  status: 'fail';
  name: string;
  message: string;
}

interface INewSnapshotResults {
  status: 'new';
}

export const register = (on: any, _config: any): void => {
  on('task', {
    matchesSnapshot({ path, value }: ISnapshotOptions): ISnapshotResults {
      const newSnap = createSnapshot(value);

      if (fs.existsSync(path)) {
        const snap = fs.readFileSync(path, { encoding: 'utf-8' });

        if (snap !== newSnap) {
          const noColor = (string: string): string => string;
          const diff = diffStringsUnified(snap, newSnap, {
            aColor: noColor,
            bColor: noColor,
            changeColor: noColor,
            commonColor: noColor,
            patchColor: noColor,
          });

          return {
            status: 'fail',
            name: 'Snapshot Match Error',
            message: `Value does not match stored snapshot:\n${diff}`,
          };
        }

        return { status: 'pass' };
      }

      if (process.env.CI === 'true') {
        return {
          status: 'fail',
          name: 'Snapshot Not Found',
          message: `${path} does not exist.`,
        };
      }

      fs.writeFileSync(path, newSnap);
      return { status: 'new' };
    },
  });
};
