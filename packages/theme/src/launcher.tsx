/*
 * Copyright 2018-2022 Elyra Authors
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

import { elyraIcon } from '@elyra/ui-components';

import {
  Launcher as JupyterlabLauncher,
  ILauncher
} from '@jupyterlab/launcher';
import { TranslationBundle } from '@jupyterlab/translation';
import { LabIcon } from '@jupyterlab/ui-components';

import { each } from '@lumino/algorithm';

import * as React from 'react';

/**
 * The known categories of launcher items and their default ordering.
 */
const ELYRA_CATEGORY = 'Elyra';

export class Launcher extends JupyterlabLauncher {
  /**
   * Construct a new launcher widget.
   */
  constructor(options: ILauncher.IOptions) {
    super(options);
    this._translator = this.translator.load('jupyterlab');
  }

  private replaceCategoryIcon(
    category: React.ReactElement,
    icon: LabIcon
  ): React.ReactElement {
    const children = React.Children.map(category.props.children, child => {
      if (child.props.className === 'jp-Launcher-sectionHeader') {
        const grandchildren = React.Children.map(
          child.props.children,
          grandchild => {
            if (grandchild.props.className !== 'jp-Launcher-sectionTitle') {
              return <icon.react stylesheet="launcherSection" />;
            } else {
              return grandchild;
            }
          }
        );

        return React.cloneElement(child, child.props, grandchildren);
      } else {
        return child;
      }
    });

    return React.cloneElement(category, category.props, children);
  }

  /**
   * Render the launcher to virtual DOM nodes.
   */
  protected render(): React.ReactElement<any> | null {
    // Bail if there is no model.
    if (!this.model) {
      return null;
    }

    // get the rendering from JupyterLab Launcher
    // and resort the categories
    const launcherBody = super.render();
    const launcherContent = launcherBody?.props.children;
    const launcherCategories = launcherContent.props.children;

    const categories: React.ReactElement<any>[] = [];

    const knownCategories = [
      this._translator.__('Notebook'),
      this._translator.__('Console'),
      ELYRA_CATEGORY,
      this._translator.__('Other')
    ];

    // Assemble the final ordered list of categories
    // based on knownCategories.
    each(knownCategories, (category, index) => {
      React.Children.forEach(launcherCategories, cat => {
        if (cat.key === category) {
          if (cat.key === ELYRA_CATEGORY) {
            cat = this.replaceCategoryIcon(cat, elyraIcon);
          }
          categories.push(cat);
        }
      });
    });

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

  private _translator: TranslationBundle;
}
