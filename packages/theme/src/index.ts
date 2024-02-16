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

import { elyraIcon, helpIcon, whatsNewIcon } from '@elyra/ui-components';
import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { ITranslator } from '@jupyterlab/translation';
import { launcherIcon } from '@jupyterlab/ui-components';

import { toArray } from '@lumino/algorithm';
import { DockPanel, TabBar, Widget } from '@lumino/widgets';

import { Launcher, LauncherModel } from './launcher';
import '../style/index.css';

const ELYRA_THEME_NAMESPACE = 'elyra-theme-extension';

/**
 * The command IDs used by the launcher plugin.
 */
const CommandIDs = {
  create: 'launcher:create',
  openHelp: 'elyra:open-help',
  releases: 'elyra:releases',
};

export interface IProps {
  justify?: string;
}

/**
 * Initialization data for the theme extension.
 */
const extension: JupyterFrontEndPlugin<ILauncher> = {
  
  id: ELYRA_THEME_NAMESPACE,
  autoStart: true,
  requires: [ITranslator, ILabShell, IMainMenu],
  optional: [ICommandPalette],
  provides: ILauncher,
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    labShell: ILabShell,
    mainMenu: IMainMenu,
    palette: ICommandPalette | null,
  ): 
  ILauncher => {
    console.log('Elyra - theme extension is activated!');

    // Find the MainLogo widget in the shell and replace it with the Elyra Logo
    const widgets = app.shell.widgets('top');
    let next = widgets.next();

    
    while (!next.done) {
      let widget = next.value;
      if (widget.id === 'jp-MainLogo') {
        
        // Object literal may only specify known properties, and 'justify' does not exist in type 'IProps'.ts(2353)

        const propsWithJustify: { container: HTMLElement, justify?: string, margin: string, height: string, width: string } = 
        {
          container: widget.node,
          justify: 'center',
          margin: '2px 5px 2px 5px',
          height: 'auto',
          width: '20px',
        };
    
        elyraIcon.element(propsWithJustify);
    
        break;

      }
    }

    // Use custom Elyra launcher
    const { commands, shell } = app;
    const trans = translator.load('jupyterlab');
    const model = new LauncherModel();

    commands.addCommand(CommandIDs.create, {
      label: trans.__('New Launcher'),
      execute: (args: any) => {
        const cwd = args['cwd'] ? String(args['cwd']) : '';
        const id = `launcher-${Private.id++}`;
        const callback = (item: Widget): void => {
          labShell.add(item, 'main', { ref: id });
        };

        const launcher = new Launcher({
          model,
          cwd,
          callback,
          commands,
          translator,
        });

        launcher.model = model;
        launcher.title.icon = launcherIcon;
        launcher.title.label = trans.__('Launcher');

        const main = new MainAreaWidget({ content: launcher });

        // If there are any other widgets open, remove the launcher close icon.
        main.title.closable = !!toArray(labShell.widgets('main')).length;
        main.id = id;

        shell.add(main, 'main', {
          activate: args['activate'] as boolean,
          ref: args['ref'] as string,
        });

        labShell.layoutModified.connect(() => {
          // If there is only a launcher open, remove the close icon.
          main.title.closable = toArray(labShell.widgets('main')).length > 1;
        }, main);

        return main;
      },
    });

    if (palette) {
      palette.addItem({
        command: CommandIDs.create,
        category: trans.__('Launcher'),
      });
    }

    if (labShell) {
      labShell.addButtonEnabled = true;
      labShell.addRequested.connect(
        (sender: DockPanel, arg: TabBar<Widget>) => {
          // Get the ref for the current tab of the tabbar which the add button was clicked
          const ref =
            arg.currentTitle?.owner.id ||
            arg.titles[arg.titles.length - 1].owner.id;
          if (commands.hasCommand('filebrowser:create-main-launcher')) {
            // If a file browser is defined connect the launcher to it
            return commands.execute('filebrowser:create-main-launcher', {
              ref,
            });
          }
          return commands.execute(CommandIDs.create, { ref });
        },
      );
    }

    commands.addCommand(CommandIDs.openHelp, {
      label: 'Documentation',
      icon: helpIcon,
      execute: (args: any) => {
        window.open('https://elyra.readthedocs.io/en/latest/', '_blank');
      },
    });

    commands.addCommand(CommandIDs.releases, {
      label: "What's new in latest",
      caption: "What's new in this release",
      icon: whatsNewIcon,
      execute: (args: any) => {
        window.open(
          'https://github.com/elyra-ai/elyra/releases/latest/',
          '_blank',
        );
      },
    });

    model.add({
      command: CommandIDs.openHelp,
      category: 'Elyra',
      rank: 10,
    });

    model.add({
      command: CommandIDs.releases,
      category: 'Elyra',
      rank: 11,
    });

    return model;
  },
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
