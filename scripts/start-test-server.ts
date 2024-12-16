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

import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const config = path.join(__dirname, '..', 'tests', 'test-config.py');
const jupyter = exec(`jupyter lab --config ${config}`);

const CONTAINER_NAME = 'minio_test';

const docker = spawn('docker', [
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

const logDir = path.join(__dirname, '..', 'build', 'cypress-tests');

const jupyterLog = fs.createWriteStream(path.join(logDir, 'jupyter.log'));
jupyter.stderr?.pipe(jupyterLog);

const dockerLog = fs.createWriteStream(path.join(logDir, 'docker.log'));
docker.stderr.pipe(dockerLog);

const handleTeardown = (): void => {
  spawn('docker', ['kill', CONTAINER_NAME]);
  process.exit();
};

process.on('SIGINT', handleTeardown);
process.on('SIGTERM', handleTeardown);
