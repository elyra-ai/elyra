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

import { elyraIcon, helpIcon } from '@elyra/ui-components';
import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { ILauncher, LauncherModel } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { launcherIcon } from '@jupyterlab/ui-components';

import { toArray } from '@lumino/algorithm';
import { Widget } from '@lumino/widgets';

import { Launcher } from './launcher';
import '../style/index.css';

const ELYRA_THEME_NAMESPACE = 'elyra-theme-extension';

/**
 * The command IDs used by the launcher plugin.
 */
const CommandIDs = {
  create: 'launcher:create',
  openHelp: 'elyra:open-help'
};

/**
 * Initialization data for the theme extension.
 */
const extension: JupyterFrontEndPlugin<ILauncher> = {
  id: ELYRA_THEME_NAMESPACE,
  autoStart: true,
  requires: [ILabShell, IMainMenu],
  optional: [ICommandPalette],
  provides: ILauncher,
  activate: (
    app: JupyterFrontEnd,
    labShell: ILabShell,
    mainMenu: IMainMenu,
    palette: ICommandPalette | null
  ): ILauncher => {
    console.log('Elyra - theme extension is activated!');

    // Find the MainLogo widget in the shell and replace it with the Elyra Logo
    const widgets = app.shell.widgets('top');
    let widget = widgets.next();

    while (widget !== undefined) {
      if (widget.id === 'jp-MainLogo') {
        elyraIcon.element({
          container: widget.node,
          justify: 'center',
          margin: '2px 5px 2px 5px',
          height: 'auto',
          width: '20px'
        });
        break;
      }

      widget = widgets.next();
    }

    // Use custom Elyra launcher
    const { commands } = app;
    const model = new LauncherModel();

    commands.addCommand(CommandIDs.create, {
      label: 'New Launcher',
      execute: (args: any) => {
        const cwd = args['cwd'] ? String(args['cwd']) : '';
        const id = `launcher-${Private.id++}`;
        const callback = (item: Widget): void => {
          labShell.add(item, 'main', { ref: id });
        };

        const launcher = new Launcher({ model, cwd, callback, commands });

        launcher.model = model;
        launcher.title.icon = launcherIcon;
        launcher.title.label = 'Launcher';

        const main = new MainAreaWidget({ content: launcher });

        // If there are any other widgets open, remove the launcher close icon.
        main.title.closable = !!toArray(labShell.widgets('main')).length;
        main.id = id;

        labShell.add(main, 'main', { activate: args['activate'] as boolean });

        labShell.layoutModified.connect(() => {
          // If there is only a launcher open, remove the close icon.
          main.title.closable = toArray(labShell.widgets('main')).length > 1;
        }, main);

        return main;
      }
    });

    if (palette) {
      palette.addItem({ command: CommandIDs.create, category: 'Launcher' });
    }

    commands.addCommand(CommandIDs.openHelp, {
      label: 'Documentation',
      icon: helpIcon,
      execute: (args: any) => {
        window.open('https://elyra.readthedocs.io/en/latest/', '_blank');
      }
    });

    model.add({
      command: CommandIDs.openHelp,
      category: 'Elyra',
      rank: 10
    });

    return model;
  }
};

/**
 * The namespace for module private data.
 */
namespace Private {
  /**
   * The incrementing id used for launcher widgets.
   */
  // eslint-disable-next-line
  export let id = 0;
}

export default extension;
