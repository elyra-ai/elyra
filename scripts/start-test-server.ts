/*
 * Copyright 2018-2026 Elyra Authors
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

const config = path.join(__dirname, '..', 'cypress', 'test-config.py');

// Lab page config for this test server only. It turns off the plugin that
// cancels page unloads while a document has unsaved changes: Electron honours
// that cancel silently, so a test that fails mid-edit would leave every later
// cy.visit() waiting out pageLoadTimeout. Prepending to JUPYTER_CONFIG_PATH
// keeps it out of the developer's own Jupyter config dirs.
const jupyterConfigPath = [
  path.join(__dirname, '..', 'cypress', 'jupyter-config'),
  process.env.JUPYTER_CONFIG_PATH
]
  .filter(Boolean)
  .join(path.delimiter);

const jupyter = exec(`jupyter lab --config ${config}`, {
  env: { ...process.env, JUPYTER_CONFIG_PATH: jupyterConfigPath }
});

const CONTAINER_NAME = 'minio_test';

// S3-compatible object store for pipeline tests. SeaweedFS replaces MinIO,
// which no longer publishes container images; host port 9000 maps to its S3
// port so the endpoints used by the tests are unchanged.
const docker = spawn('docker', [
  'run',
  '--rm',
  '--name',
  CONTAINER_NAME,
  '-p',
  '9000:8333',
  '-e',
  'AWS_ACCESS_KEY_ID=minioadmin',
  '-e',
  'AWS_SECRET_ACCESS_KEY=minioadmin',
  'ghcr.io/chrislusf/seaweedfs:4.48',
  'mini',
  '-dir=/data'
]);

const logDir = path.join(__dirname, '..', 'build', 'cypress');

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
