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

import { spawn } from 'child_process';

import path from 'path';

import chalk from 'chalk';

const makeDir = path.join(__dirname, '..', '..');

const cmd = process.argv[2];

const make = spawn('make', [cmd, '-Bnd'], { cwd: makeDir });

interface ITarget {
  type: 'target';
  name: string;
  depth: number;
}

interface ICode {
  type: 'code';
  value: string;
  depth: number;
}

interface IEnd {
  type: 'end';
  depth: number;
}

const graph: (ITarget | ICode | IEnd)[] = [];

let depth: number | undefined = undefined;

make.stdout.on('data', (data: Buffer) => {
  const msgs = data.toString().split('\n');
  for (const msg of msgs) {
    if (msg === '') {
      continue;
    }

    if (msg.includes('Considering target file')) {
      const [depthString, rest] = msg.split('Considering target file `');
      const [name] = rest.split("'.");
      if (name === 'Makefile') {
        continue;
      }
      graph.push({
        type: 'target',
        name,
        depth: depthString.length / 2,
      });
      continue;
    }

    if (msg.includes('Must remake target')) {
      const [depthString] = msg.split('Must remake target `');
      depth = depthString.length / 2;
      continue;
    }

    if (msg.includes('Successfully remade target file')) {
      const [depthString] = msg.split('Successfully remade target file `');
      depth = depthString.length / 2;
      graph.push({
        type: 'end',
        depth,
      });
      depth = undefined;
      continue;
    }

    if (depth !== undefined) {
      graph.push({
        type: 'code',
        value: msg.toString(),
        depth,
      });
      continue;
    }
  }
});

const MAX_WIDTH = 120;
const printGraph = (): void => {
  for (const g of graph) {
    const padLeft = '│ '.repeat(g.depth);
    const padRight = ' │'.repeat(g.depth);
    const cellWidth = MAX_WIDTH - (padLeft.length + padRight.length + 4);
    const bar = '─'.repeat(cellWidth);
    if (g.type === 'target') {
      const spacer = ' '.repeat(cellWidth - g.name.length - 2);
      console.log(`${padLeft}┌${bar}┐${padRight}`);
      console.log(
        `${padLeft}│ ${chalk.cyan.bold(g.name)}${spacer} |${padRight}`,
      );
      continue;
    }

    if (g.type === 'code') {
      let value = g.value;
      if (value.length > cellWidth + 2) {
        value = value.slice(0, cellWidth - 5) + '...';
      }
      const spacer = ' '.repeat(Math.max(0, cellWidth - value.length - 2));
      console.log(`${padLeft}│ ${value}${spacer} |${padRight}`);
      continue;
    }

    if (g.type === 'end') {
      console.log(`${padLeft}└${bar}┘${padRight}`);
      continue;
    }
  }
};

make.stdout.on('end', () => {
  printGraph();
});
