/*
 * Copyright 2018-2020 IBM Corporation
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

import { Launcher, ILauncher } from '@jupyterlab/launcher';

import { each } from '@lumino/algorithm';

import * as React from 'react';

/**
 * The known categories of launcher items and their default ordering.
 */
const KNOWN_CATEGORIES = ['Notebook', 'Console', 'Elyra', 'Other'];

/**
 * These launcher item categories are known to have kernels, so the kernel icons
 * are used.
 */
// const KERNEL_CATEGORIES = ['Notebook', 'Console'];

export class CustomLauncher extends Launcher {
  /**
   * Construct a new launcher widget.
   */
  constructor(options: ILauncher.IOptions) {
    super(options);
    console.log('>>> Elyra CustomLauncher');
  }

  /**
   * Render the launcher to virtual DOM nodes.
   */
  protected render(): React.ReactElement<any> | null {
    // Bail if there is no model.
    if (!this.model) {
      return null;
    }

    // console.log('>>>');
    // console.log(this);
    // console.log('<<<');
    // console.log(super.render());

    // get the rendering from JupyterLab Launcher
    // and resort the categories

    const launcherBody = super.render();
    const launcherContent = launcherBody.props.children;
    const launcherCategories = launcherContent.props.children;

    console.log('>>> each body');
    React.Children.forEach(launcherBody, child => {
      console.log(child);
    });

    console.log('>>> each content');
    React.Children.forEach(launcherContent, child => {
      console.log(child);
    });

    console.log('>>> each category');
    React.Children.forEach(launcherCategories, child => {
      console.log(child);
      if (child.key === 'Elyra') {
        // change the icon here...
      }
    });

    const categories: React.ReactElement<any>[] = [];

    // Assemble the final ordered list of categories
    // based on KNOWN_CATEGORIES.
    each(KNOWN_CATEGORIES, (category, index) => {
      React.Children.forEach(launcherCategories, cat => {
        if (cat.key === category) {
          categories.push(cat);
        }
      });
    });

    // return launcherBody;

    // Wrap the sections in body and content divs.
    return (
      <div className="jp-Launcher-body">
        <div className="jp-Launcher-content">
          <div className="jp-Launcher-cwd">
            <h3>{this.cwd}</h3>
          </div>
          {categories}
        </div>
      </div>
    );
  }
}
