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

import { spawn } from 'child_process';
import path from 'path';

const config = path.join(__dirname, '..', 'tests', 'test-config.py');
spawn('jupyter', ['lab', '--config', config]);

const CONTAINER_NAME = 'minio_test';

spawn('docker', [
  'run',
  '--rm',
  '--name',
  CONTAINER_NAME,
  '-p',
  '9000:9000',
  'minio/minio',
  'server',
  '/data'
]);

const handleTeardown = (): void => {
  spawn('docker', ['kill', CONTAINER_NAME]);
  process.exit();
};

process.on('SIGINT', handleTeardown);
process.on('SIGTERM', handleTeardown);
