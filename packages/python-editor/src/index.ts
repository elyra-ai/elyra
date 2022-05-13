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
import { ScriptEditorWidgetFactory, ScriptEditor } from '@elyra/script-editor';
import { pyIcon } from '@elyra/ui-components';
import {
  ILabShell,
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILayoutRestorer
} from '@jupyterlab/application';
import {
  IThemeManager,
  MainAreaWidget,
  WidgetTracker,
  ICommandPalette
} from '@jupyterlab/apputils';
import { CodeEditor, IEditorServices } from '@jupyterlab/codeeditor';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { PageConfig, PathExt } from '@jupyterlab/coreutils';
import {
  Debugger,
  IDebugger,
  IDebuggerConfig,
  IDebuggerHandler,
  IDebuggerSidebar,
  IDebuggerSources
} from '@jupyterlab/debugger';
import {
  IDocumentWidget,
  DocumentRegistry,
  DocumentWidget
} from '@jupyterlab/docregistry';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { FileEditor, IEditorTracker } from '@jupyterlab/fileeditor';
import { ILauncher } from '@jupyterlab/launcher';
import { ILoggerRegistry } from '@jupyterlab/logconsole';
import { IMainMenu } from '@jupyterlab/mainmenu';
import {
  standardRendererFactories as initialFactories,
  IRenderMimeRegistry,
  RenderMimeRegistry
} from '@jupyterlab/rendermime';
import { Session } from '@jupyterlab/services';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ITranslator } from '@jupyterlab/translation';

import { JSONObject } from '@lumino/coreutils';

import { PythonEditor } from './PythonEditor';

const PYTHON_FACTORY = 'Python Editor';
const PYTHON = 'python';
const PYTHON_EDITOR_NAMESPACE = 'elyra-python-editor-extension';

const commandIDs = {
  createNewPythonEditor: 'script-editor:create-new-python-editor',
  openDocManager: 'docmanager:open',
  newDocManager: 'docmanager:new-untitled'
};

/**
 * Initialization data for the python-editor-extension extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: PYTHON_EDITOR_NAMESPACE,
  autoStart: true,
  requires: [
    IEditorServices,
    IEditorTracker,
    ICommandPalette,
    ISettingRegistry,
    IFileBrowserFactory
  ],
  optional: [ILayoutRestorer, IMainMenu, ILauncher],
  activate: (
    app: JupyterFrontEnd,
    editorServices: IEditorServices,
    editorTracker: IEditorTracker,
    palette: ICommandPalette,
    settingRegistry: ISettingRegistry,
    browserFactory: IFileBrowserFactory,
    restorer: ILayoutRestorer | null,
    menu: IMainMenu | null,
    launcher: ILauncher | null
  ) => {
    console.log('Elyra - python-editor extension is activated!');

    const factory = new ScriptEditorWidgetFactory({
      editorServices,
      factoryOptions: {
        name: PYTHON_FACTORY,
        fileTypes: [PYTHON],
        defaultFor: [PYTHON]
      },
      instanceCreator: (
        options: DocumentWidget.IOptions<
          FileEditor,
          DocumentRegistry.ICodeModel
        >
      ): ScriptEditor => new PythonEditor(options)
    });

    app.docRegistry.addFileType({
      name: PYTHON,
      displayName: 'Python File',
      extensions: ['.py'],
      pattern: '.*\\.py$',
      mimeTypes: ['text/x-python'],
      icon: pyIcon
    });

    const { restored } = app;

    /**
     * Track PythonEditor widget on page refresh
     */
    const tracker = new WidgetTracker<ScriptEditor>({
      namespace: PYTHON_EDITOR_NAMESPACE
    });

    let config: CodeEditor.IConfig = { ...CodeEditor.defaultConfig };

    if (restorer) {
      // Handle state restoration
      void restorer.restore(tracker, {
        command: commandIDs.openDocManager,
        args: widget => ({
          path: widget.context.path,
          factory: PYTHON_FACTORY
        }),
        name: widget => widget.context.path
      });
    }

    /**
     * Update the setting values. Adapted from fileeditor-extension.
     */
    const updateSettings = (settings: ISettingRegistry.ISettings): void => {
      config = {
        ...CodeEditor.defaultConfig,
        ...(settings.get('editorConfig').composite as JSONObject)
      };

      // Trigger a refresh of the rendered commands
      app.commands.notifyCommandChanged();
    };

    /**
     * Update the settings of the current tracker instances. Adapted from fileeditor-extension.
     */
    const updateTracker = (): void => {
      tracker.forEach(widget => {
        updateWidget(widget);
      });
    };

    /**
     * Update the settings of a widget. Adapted from fileeditor-extension.
     */
    const updateWidget = (widget: ScriptEditor): void => {
      if (!editorTracker.has(widget)) {
        (editorTracker as WidgetTracker<IDocumentWidget<FileEditor>>).add(
          widget
        );
      }

      const editor = widget.content.editor;
      Object.keys(config).forEach((keyStr: string) => {
        const key = keyStr as keyof CodeEditor.IConfig;
        editor.setOption(key, config[key]);
      });
    };

    // Fetch the initial state of the settings. Adapted from fileeditor-extension.
    Promise.all([
      settingRegistry.load('@jupyterlab/fileeditor-extension:plugin'),
      restored
    ])
      .then(([settings]) => {
        console.log(settings);
        updateSettings(settings);
        updateTracker();
        settings.changed.connect(() => {
          updateSettings(settings);
          updateTracker();
        });
      })
      .catch((reason: Error) => {
        console.error(reason.message);
        updateTracker();
      });

    app.docRegistry.addWidgetFactory(factory);

    factory.widgetCreated.connect((sender, widget) => {
      void tracker.add(widget);

      // Notify the widget tracker if restore data needs to update
      widget.context.pathChanged.connect(() => {
        void tracker.save(widget);
      });
      updateWidget(widget);
    });

    // Handle the settings of new widgets. Adapted from fileeditor-extension.
    tracker.widgetAdded.connect((sender, widget) => {
      updateWidget(widget);
    });

    /**
     * Create new python editor from launcher and file menu
     */

    // Add a python launcher
    if (launcher) {
      launcher.add({
        command: commandIDs.createNewPythonEditor,
        category: 'Elyra',
        rank: 4
      });
    }

    if (menu) {
      // Add new python editor creation to the file menu
      menu.fileMenu.newMenu.addGroup(
        [{ command: commandIDs.createNewPythonEditor, args: { isMenu: true } }],
        92
      );
    }

    // Function to create a new untitled python file, given the current working directory
    const createNew = (cwd: string): Promise<any> => {
      return app.commands
        .execute(commandIDs.newDocManager, {
          path: cwd,
          type: 'file',
          ext: '.py'
        })
        .then(model => {
          return app.commands.execute(commandIDs.openDocManager, {
            path: model.path,
            factory: PYTHON_FACTORY
          });
        });
    };

    // Add a command to create new Python editor
    app.commands.addCommand(commandIDs.createNewPythonEditor, {
      label: args =>
        args['isPalette'] ? 'New Python Editor' : 'Python Editor',
      caption: 'Create a new Python Editor',
      icon: args => (args['isPalette'] ? undefined : pyIcon),
      execute: args => {
        const cwd = args['cwd'] || browserFactory.defaultBrowser.model.path;
        return createNew(cwd as string);
      }
    });

    palette.addItem({
      command: commandIDs.createNewPythonEditor,
      args: { isPalette: true },
      category: 'Elyra'
    });
  }
};

/**
 * Debugger plugins.
 * Adapted from JupyterLab debugger extension
 */

/**
 * A plugin that provides visual debugging support for file editors.
 */
const files: JupyterFrontEndPlugin<void> = {
  id: '@elyra/python-editor-extension:files',
  autoStart: true,
  requires: [IDebugger, IEditorTracker],
  optional: [ILabShell],
  activate: (
    app: JupyterFrontEnd,
    debug: IDebugger,
    editorTracker: IEditorTracker,
    labShell: ILabShell | null
  ) => {
    const handler = new Debugger.Handler({
      type: 'file',
      shell: app.shell,
      service: debug
    });

    const activeSessions: {
      [id: string]: Session.ISessionConnection;
    } = {};

    const updateHandlerAndCommands = async (widget: any): Promise<void> => {
      const sessions = app.serviceManager.sessions;
      try {
        const model = await sessions.findByPath(widget.context.path);
        if (!model) {
          return;
        }
        let session = activeSessions[model.id];
        if (!session) {
          // Use `connectTo` only if the session does not exist.
          // `connectTo` sends a kernel_info_request on the shell
          // channel, which blocks the debug session restore when waiting
          // for the kernel to be ready
          session = sessions.connectTo({ model });
          activeSessions[model.id] = session;
        }
        await handler.update(widget, session);
        app.commands.notifyCommandChanged();
      } catch {
        return;
      }
    };

    if (labShell) {
      labShell.currentChanged.connect((_, update) => {
        const widget = update.newValue;
        if (widget instanceof DocumentWidget) {
          const { content } = widget;
          if (content instanceof FileEditor) {
            void updateHandlerAndCommands(widget);
          }
        }
      });
    } else {
      editorTracker.currentChanged.connect((_, documentWidget) => {
        if (documentWidget) {
          void updateHandlerAndCommands(
            (documentWidget as unknown) as DocumentWidget
          );
        }
      });
    }
  }
};

/**
 * A plugin that provides a debugger service.
 */
const service: JupyterFrontEndPlugin<IDebugger> = {
  id: '@elyra/python-editor-extension:service',
  autoStart: true,
  provides: IDebugger,
  requires: [IDebuggerConfig],
  optional: [IDebuggerSources, ITranslator],
  activate: (
    app: JupyterFrontEnd,
    config: IDebugger.IConfig,
    debuggerSources: IDebugger.ISources | null
  ) =>
    new Debugger.Service({
      config,
      debuggerSources,
      specsManager: app.serviceManager.kernelspecs
    })
};

/**
 * A plugin that provides a configuration with hash method.
 */
const configuration: JupyterFrontEndPlugin<IDebugger.IConfig> = {
  id: '@elyra/python-editor-extension:config',
  provides: IDebuggerConfig,
  autoStart: true,
  activate: () => new Debugger.Config()
};

/**
 * A plugin that provides source/editor functionality for debugging.
 */
const sources: JupyterFrontEndPlugin<IDebugger.ISources> = {
  id: '@elyra/python-editor-extension:sources',
  autoStart: true,
  provides: IDebuggerSources,
  requires: [IDebuggerConfig, IEditorServices],
  optional: [IEditorTracker],
  activate: (
    app: JupyterFrontEnd,
    config: IDebugger.IConfig,
    editorServices: IEditorServices,
    editorTracker: IEditorTracker
  ): IDebugger.ISources => {
    return new Debugger.Sources({
      config,
      shell: app.shell,
      editorServices,
      editorTracker
    });
  }
};
/*
 * A plugin to open detailed views for variables.
 */
const variables: JupyterFrontEndPlugin<void> = {
  id: '@elyra/python-editor-extension:variables',
  autoStart: true,
  requires: [IDebugger, IDebuggerHandler, ITranslator],
  optional: [IThemeManager, IRenderMimeRegistry],
  activate: (
    app: JupyterFrontEnd,
    service: IDebugger,
    handler: Debugger.Handler,
    translator: ITranslator,
    themeManager: IThemeManager | null,
    rendermime: IRenderMimeRegistry | null
  ) => {
    const trans = translator.load('jupyterlab');
    const { commands, shell } = app;
    const tracker = new WidgetTracker<MainAreaWidget<Debugger.VariablesGrid>>({
      namespace: 'debugger/inspect-variable'
    });
    const trackerMime = new WidgetTracker<Debugger.VariableRenderer>({
      namespace: 'debugger/render-variable'
    });
    const DebuggerCommandIDs = Debugger.CommandIDs;

    // Add commands
    commands.addCommand(DebuggerCommandIDs.inspectVariable, {
      label: trans.__('Inspect Variable'),
      caption: trans.__('Inspect Variable'),
      isEnabled: args =>
        !!service.session?.isStarted &&
        (args.variableReference ??
          service.model.variables.selectedVariable?.variablesReference ??
          0) > 0,
      execute: async args => {
        let { variableReference, name } = args as {
          variableReference?: number;
          name?: string;
        };

        if (!variableReference) {
          variableReference =
            service.model.variables.selectedVariable?.variablesReference;
        }
        if (!name) {
          name = service.model.variables.selectedVariable?.name;
        }

        const id = `jp-debugger-variable-${name}`;
        if (
          !name ||
          !variableReference ||
          tracker.find(widget => widget.id === id)
        ) {
          return;
        }

        const variables = await service.inspectVariable(
          variableReference as number
        );
        if (!variables || variables.length === 0) {
          return;
        }

        const model = service.model.variables;
        const widget = new MainAreaWidget<Debugger.VariablesGrid>({
          content: new Debugger.VariablesGrid({
            model,
            commands,
            scopes: [{ name, variables }],
            themeManager
          })
        });
        widget.addClass('jp-DebuggerVariables');
        widget.id = id;
        widget.title.icon = Debugger.Icons.variableIcon;
        widget.title.label = `${service.session?.connection?.name} - ${name}`;
        void tracker.add(widget);
        const disposeWidget = (): void => {
          widget.dispose();
          model.changed.disconnect(disposeWidget);
        };
        model.changed.connect(disposeWidget);
        shell.add(widget, 'main', {
          mode: tracker.currentWidget ? 'split-right' : 'split-bottom',
          activate: false
        });
      }
    });

    commands.addCommand(DebuggerCommandIDs.renderMimeVariable, {
      label: trans.__('Render Variable'),
      caption: trans.__('Render variable according to its mime type'),
      isEnabled: () => !!service.session?.isStarted,
      isVisible: () =>
        service.model.hasRichVariableRendering && rendermime !== null,
      execute: args => {
        let { name, frameId } = args as {
          frameId?: number;
          name?: string;
        };

        if (!name) {
          name = service.model.variables.selectedVariable?.name;
        }
        if (!frameId) {
          frameId = service.model.callstack.frame?.id;
        }

        const activeWidget = handler.activeWidget;
        const activeRendermime =
          activeWidget instanceof ScriptEditor ? rendermime : null;

        if (!activeRendermime) {
          return;
        }

        const id = `jp-debugger-variable-mime-${name}-${service.session?.connection?.path.replace(
          '/',
          '-'
        )}`;
        if (
          !name || // Name is mandatory
          trackerMime.find(widget => widget.id === id) || // Widget already exists
          (!frameId && service.hasStoppedThreads()) // frame id missing on breakpoint
        ) {
          return;
        }

        const variablesModel = service.model.variables;

        const widget = new Debugger.VariableRenderer({
          dataLoader: (): any => service.inspectRichVariable(name!, frameId),
          rendermime: activeRendermime,
          translator
        });
        widget.addClass('jp-DebuggerRichVariable');
        widget.id = id;
        widget.title.icon = Debugger.Icons.variableIcon;
        widget.title.label = `${name} - ${service.session?.connection?.name}`;
        widget.title.caption = `${name} - ${service.session?.connection?.path}`;
        void trackerMime.add(widget);
        const disposeWidget = (): void => {
          widget.dispose();
          variablesModel.changed.disconnect(refreshWidget);
          activeWidget?.disposed.disconnect(disposeWidget);
        };
        const refreshWidget = (): void => {
          // Refresh the widget only if the active element is the same.
          if (handler.activeWidget === activeWidget) {
            void widget.refresh();
          }
        };
        widget.disposed.connect(disposeWidget);
        variablesModel.changed.connect(refreshWidget);
        activeWidget?.disposed.connect(disposeWidget);

        shell.add(widget, 'main', {
          mode: trackerMime.currentWidget ? 'split-right' : 'split-bottom',
          activate: false
        });
      }
    });
  }
};

/**
 * Debugger sidebar provider plugin.
 */
const sidebar: JupyterFrontEndPlugin<IDebugger.ISidebar> = {
  id: '@elyra/python-editor-extension:sidebar',
  provides: IDebuggerSidebar,
  requires: [IDebugger, IEditorServices, ITranslator],
  optional: [IThemeManager, ISettingRegistry],
  autoStart: true,
  activate: async (
    app: JupyterFrontEnd,
    service: IDebugger,
    editorServices: IEditorServices,
    translator: ITranslator,
    themeManager: IThemeManager | null,
    settingRegistry: ISettingRegistry | null
  ): Promise<IDebugger.ISidebar> => {
    const { commands } = app;
    const DebuggerCommandIDs = Debugger.CommandIDs;

    const callstackCommands = {
      registry: commands,
      continue: DebuggerCommandIDs.debugContinue,
      terminate: DebuggerCommandIDs.terminate,
      next: DebuggerCommandIDs.next,
      stepIn: DebuggerCommandIDs.stepIn,
      stepOut: DebuggerCommandIDs.stepOut,
      evaluate: DebuggerCommandIDs.evaluate
    };

    const breakpointsCommands = {
      registry: commands,
      pause: DebuggerCommandIDs.pause
    };

    const sidebar = new Debugger.Sidebar({
      service,
      callstackCommands,
      breakpointsCommands,
      editorServices,
      themeManager,
      translator
    });

    if (settingRegistry) {
      const setting = await settingRegistry.load(main.id);
      const updateSettings = (): void => {
        const filters = setting.get('variableFilters').composite as {
          [key: string]: string[];
        };
        const kernel = service.session?.connection?.kernel?.name ?? '';
        if (kernel && filters[kernel]) {
          sidebar.variables.filter = new Set<string>(filters[kernel]);
        }
        const kernelSourcesFilter = setting.get('defaultKernelSourcesFilter')
          .composite as string;
        sidebar.kernelSources.filter = kernelSourcesFilter;
      };
      updateSettings();
      setting.changed.connect(updateSettings);
      service.sessionChanged.connect(updateSettings);
    }

    return sidebar;
  }
};

/**
 * The main debugger UI plugin.
 */
const main: JupyterFrontEndPlugin<void> = {
  id: '@elyra/python-editor-extension:main',
  requires: [IDebugger, IDebuggerSidebar, IEditorServices, ITranslator],
  optional: [
    ICommandPalette,
    IDebuggerSources,
    ILabShell,
    ILayoutRestorer,
    ILoggerRegistry
  ],
  autoStart: true,
  activate: async (
    app: JupyterFrontEnd,
    service: IDebugger,
    sidebar: IDebugger.ISidebar,
    editorServices: IEditorServices,
    translator: ITranslator,
    palette: ICommandPalette | null,
    debuggerSources: IDebugger.ISources | null,
    labShell: ILabShell | null,
    restorer: ILayoutRestorer | null,
    loggerRegistry: ILoggerRegistry | null
  ): Promise<void> => {
    const trans = translator.load('jupyterlab');
    const { commands, shell, serviceManager } = app;
    const { kernelspecs } = serviceManager;
    const DebuggerCommandIDs = Debugger.CommandIDs;

    // First check if there is a PageConfig override for the extension visibility
    const alwaysShowDebuggerExtension =
      PageConfig.getOption('alwaysShowDebuggerExtension').toLowerCase() ===
      'true';
    if (!alwaysShowDebuggerExtension) {
      // hide the debugger sidebar if no kernel with support for debugging is available
      await kernelspecs.ready;
      const specs = kernelspecs.specs?.kernelspecs;
      if (!specs) {
        return;
      }
      const enabled = Object.keys(specs).some(
        name => !!(specs[name]?.metadata?.['debugger'] ?? false)
      );
      if (!enabled) {
        return;
      }
    }

    // get the mime type of the kernel language for the current debug session
    const getMimeType = async (): Promise<string> => {
      const kernel = service.session?.connection?.kernel;
      if (!kernel) {
        return '';
      }
      const info = (await kernel.info).language_info;
      const name = info.name;
      const mimeType =
        editorServices?.mimeTypeService.getMimeTypeByLanguage({ name }) ?? '';
      return mimeType;
    };

    const rendermime = new RenderMimeRegistry({ initialFactories });

    commands.addCommand(DebuggerCommandIDs.evaluate, {
      label: trans.__('Evaluate Code'),
      caption: trans.__('Evaluate Code'),
      icon: Debugger.Icons.evaluateIcon,
      isEnabled: () => service.hasStoppedThreads(),
      execute: async () => {
        const mimeType = await getMimeType();
        const result = await Debugger.Dialogs.getCode({
          title: trans.__('Evaluate Code'),
          okLabel: trans.__('Evaluate'),
          cancelLabel: trans.__('Cancel'),
          mimeType,
          rendermime
        });
        const code = result.value;
        if (!result.button.accept || !code) {
          return;
        }
        const reply = await service.evaluate(code);
        if (reply) {
          const data = reply.result;
          const path = service?.session?.connection?.path;
          const logger = path ? loggerRegistry?.getLogger?.(path) : undefined;

          if (logger) {
            // print to log console of the notebook currently being debugged
            logger.log({ type: 'text', data, level: logger.level });
          } else {
            // fallback to printing to devtools console
            console.debug(data);
          }
        }
      }
    });

    commands.addCommand(DebuggerCommandIDs.debugContinue, {
      label: trans.__('Continue'),
      caption: trans.__('Continue'),
      icon: Debugger.Icons.continueIcon,
      isEnabled: () => service.hasStoppedThreads(),
      execute: async () => {
        await service.continue();
        commands.notifyCommandChanged();
      }
    });

    commands.addCommand(DebuggerCommandIDs.terminate, {
      label: trans.__('Terminate'),
      caption: trans.__('Terminate'),
      icon: Debugger.Icons.terminateIcon,
      isEnabled: () => service.hasStoppedThreads(),
      execute: async () => {
        await service.restart();
        commands.notifyCommandChanged();
      }
    });

    commands.addCommand(DebuggerCommandIDs.next, {
      label: trans.__('Next'),
      caption: trans.__('Next'),
      icon: Debugger.Icons.stepOverIcon,
      isEnabled: () => service.hasStoppedThreads(),
      execute: async () => {
        await service.next();
      }
    });

    commands.addCommand(DebuggerCommandIDs.stepIn, {
      label: trans.__('Step In'),
      caption: trans.__('Step In'),
      icon: Debugger.Icons.stepIntoIcon,
      isEnabled: () => service.hasStoppedThreads(),
      execute: async () => {
        await service.stepIn();
      }
    });

    commands.addCommand(DebuggerCommandIDs.stepOut, {
      label: trans.__('Step Out'),
      caption: trans.__('Step Out'),
      icon: Debugger.Icons.stepOutIcon,
      isEnabled: () => service.hasStoppedThreads(),
      execute: async () => {
        await service.stepOut();
      }
    });

    commands.addCommand(DebuggerCommandIDs.pause, {
      label: trans.__('Enable / Disable pausing on exceptions'),
      caption: () =>
        service.isStarted
          ? service.pauseOnExceptionsIsValid()
            ? service.isPausingOnExceptions
              ? trans.__('Disable pausing on exceptions')
              : trans.__('Enable pausing on exceptions')
            : trans.__('Kernel does not support pausing on exceptions.')
          : trans.__('Enable / Disable pausing on exceptions'),
      className: 'jp-PauseOnExceptions',
      icon: Debugger.Icons.pauseOnExceptionsIcon,
      isToggled: () => {
        return service.isPausingOnExceptions;
      },
      isEnabled: () => service.pauseOnExceptionsIsValid(),
      execute: async () => {
        await service.pauseOnExceptions(!service.isPausingOnExceptions);
        commands.notifyCommandChanged();
      }
    });

    service.eventMessage.connect((_, event): void => {
      commands.notifyCommandChanged();
      if (labShell && event.event === 'initialized') {
        labShell.activateById(sidebar.id);
      }
    });

    service.sessionChanged.connect(_ => {
      commands.notifyCommandChanged();
    });

    if (restorer) {
      restorer.add(sidebar, 'debugger-sidebar');
    }

    sidebar.node.setAttribute('role', 'region');
    sidebar.node.setAttribute('aria-label', trans.__('Debugger section'));

    shell.add(sidebar, 'right');

    if (palette) {
      const category = trans.__('Debugger');
      [
        DebuggerCommandIDs.debugContinue,
        DebuggerCommandIDs.terminate,
        DebuggerCommandIDs.next,
        DebuggerCommandIDs.stepIn,
        DebuggerCommandIDs.stepOut,
        DebuggerCommandIDs.evaluate,
        DebuggerCommandIDs.pause
      ].forEach(command => {
        palette.addItem({ command, category });
      });
    }

    if (debuggerSources) {
      const { model } = service;
      const readOnlyEditorFactory = new Debugger.ReadOnlyEditorFactory({
        editorServices
      });

      const onCurrentFrameChanged = (
        _: IDebugger.Model.ICallstack,
        frame: IDebugger.IStackFrame
      ): void => {
        debuggerSources
          .find({
            focus: true,
            kernel: service.session?.connection?.kernel?.name ?? '',
            path: service.session?.connection?.path ?? '',
            source: frame?.source?.path ?? ''
          })
          .forEach(editor => {
            requestAnimationFrame(() => {
              Debugger.EditorHandler.showCurrentLine(editor, frame.line);
            });
          });
      };

      const onKernelSourceOpened = (
        _: IDebugger.Model.IKernelSources | null,
        source: IDebugger.Source,
        breakpoint?: IDebugger.IBreakpoint
      ): void => {
        if (!source) {
          return;
        }
        onCurrentSourceOpened(null, source, breakpoint);
      };

      const onCurrentSourceOpened = (
        _: IDebugger.Model.ISources | null,
        source: IDebugger.Source,
        breakpoint?: IDebugger.IBreakpoint
      ): void => {
        if (!source) {
          return;
        }
        const { content, mimeType, path } = source;
        const results = debuggerSources.find({
          focus: true,
          kernel: service.session?.connection?.kernel?.name ?? '',
          path: service.session?.connection?.path ?? '',
          source: path
        });
        if (results.length > 0) {
          if (breakpoint && typeof breakpoint.line !== 'undefined') {
            results.forEach(editor => {
              if (editor instanceof CodeMirrorEditor) {
                (editor as CodeMirrorEditor).scrollIntoViewCentered({
                  line: (breakpoint.line as number) - 1,
                  ch: breakpoint.column || 0
                });
              } else {
                editor.revealPosition({
                  line: (breakpoint.line as number) - 1,
                  column: breakpoint.column || 0
                });
              }
            });
          }
          return;
        }
        const editorWrapper = readOnlyEditorFactory.createNewEditor({
          content,
          mimeType,
          path
        });
        const editor = editorWrapper.editor;
        const editorHandler = new Debugger.EditorHandler({
          debuggerService: service,
          editor,
          path
        });
        editorWrapper.disposed.connect(() => editorHandler.dispose());

        debuggerSources.open({
          label: PathExt.basename(path),
          caption: path,
          editorWrapper
        });

        const frame = service.model.callstack.frame;
        if (frame) {
          Debugger.EditorHandler.showCurrentLine(editor, frame.line);
        }
      };

      // model.callstack.currentFrameChanged.connect(onCurrentFrameChanged);
      model.callstack.currentFrameChanged.connect(async (_, frame) => {
        frame && onCurrentFrameChanged(_, frame);
      });

      // model.sources.currentSourceOpened.connect(onCurrentSourceOpened);
      model.sources.currentSourceOpened.connect(async (_, source) => {
        source && onCurrentSourceOpened(_, source);
      });

      // model.kernelSources.kernelSourceOpened.connect(onKernelSourceOpened);
      model.kernelSources.kernelSourceOpened.connect(
        async (_, kernelSource) => {
          kernelSource && onKernelSourceOpened(_, kernelSource);
        }
      );

      model.breakpoints.clicked.connect(async (_, breakpoint) => {
        const path = breakpoint.source?.path;
        const source = await service.getSource({
          sourceReference: 0,
          path
        });
        onCurrentSourceOpened(null, source, breakpoint);
      });
    }
  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [
  extension,
  service,
  files,
  variables,
  sidebar,
  main,
  sources,
  configuration
];

export default plugins;
