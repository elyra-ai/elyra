/*
 * Copyright 2018-2025 Elyra Authors
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

import { defineConfig } from 'cypress';

import { register } from './cypress/utils/snapshots/plugin';

export default defineConfig({
  e2e: {
    env: {
      snapshotsFolder: './cypress/snapshots'
    },
    baseUrl: 'http://localhost:58888/lab',
    supportFile: './cypress/support/commands.ts',
    specPattern: './cypress/tests/**/*.cy.ts',
    fixturesFolder: './cypress/fixtures',
    screenshotsFolder: './build/cypress/screenshots',
    videosFolder: './build/cypress/videos',
    video: false,
    testIsolation: false,
    setupNodeEvents(on, config) {
      register(on, config);
      return config;
    },
    retries: {
      runMode: 1,
      openMode: 1
    },
    defaultCommandTimeout: 8000,
    execTimeout: 120000,
    pageLoadTimeout: 120000,
    responseTimeout: 60000,
    viewportWidth: 1400,
    viewportHeight: 800
  },
  numTestsKeptInMemory: 10
});
