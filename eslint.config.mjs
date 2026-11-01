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

import path from 'node:path';

import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier/flat';
import cypressPlugin from 'eslint-plugin-cypress/flat';
import headerPlugin from 'eslint-plugin-header';
import importPlugin from 'eslint-plugin-import';
import mochaPlugin from 'eslint-plugin-mocha';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// eslint-plugin-header 3.1.1 declares no option schema, and ESLint 9 rejects
// options passed to schema-less rules. Opt the rule out of option validation.
headerPlugin.rules.header.meta.schema = false;

const gitignorePath = path.join(import.meta.dirname, '.gitignore');

const licenseHeader = [
  '',
  ' * Copyright 2018-2026 Elyra Authors',
  ' *',
  ' * Licensed under the Apache License, Version 2.0 (the "License");',
  ' * you may not use this file except in compliance with the License.',
  ' * You may obtain a copy of the License at',
  ' *',
  ' * http://www.apache.org/licenses/LICENSE-2.0',
  ' *',
  ' * Unless required by applicable law or agreed to in writing, software',
  ' * distributed under the License is distributed on an "AS IS" BASIS,',
  ' * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.',
  ' * See the License for the specific language governing permissions and',
  ' * limitations under the License.',
  ' '
];

export default defineConfig([
  includeIgnoreFile(gitignorePath, 'elyra/gitignore'),
  globalIgnores(['.yarn/'], 'elyra/yarn-release'),
  {
    name: 'elyra/base',
    files: ['**/*.{js,mjs,ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactPlugin.configs.flat.recommended,
      reactHooksPlugin.configs['recommended-latest'],
      prettierConfig
    ],
    plugins: {
      header: headerPlugin,
      import: importPlugin
    },
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      'react/prop-types': 'off',
      'func-style': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: true }
        }
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-namespace': 'off',
      'header/header': ['error', 'block', licenseHeader],
      'import/order': [
        'error',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always-and-inside-groups'
        }
      ],
      eqeqeq: ['warn', 'always']
    }
  },
  {
    name: 'elyra/commonjs',
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    name: 'elyra/cypress',
    files: ['cypress/**/*.ts'],
    extends: [cypressPlugin.configs.globals],
    plugins: {
      mocha: mochaPlugin
    },
    languageOptions: {
      globals: globals.node
    },
    rules: {
      'mocha/no-exclusive-tests': 'warn',
      // Chai property assertions such as `expect(x).to.be.null` are
      // expressions by design.
      '@typescript-eslint/no-unused-expressions': 'off'
    }
  }
]);
