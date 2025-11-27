"use strict";
(self["webpackChunk_elyra_scala_editor_extension"] = self["webpackChunk_elyra_scala_editor_extension"] || []).push([["lib_index_js"],{

/***/ "./lib/ScalaEditor.js":
/*!****************************!*\
  !*** ./lib/ScalaEditor.js ***!
  \****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScalaEditor = void 0;
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
const script_editor_1 = __webpack_require__(/*! @elyra/script-editor */ "webpack/sharing/consume/default/@elyra/script-editor/@elyra/script-editor");
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
class ScalaEditor extends script_editor_1.ScriptEditor {
    /**
     * Construct a new Scala Editor widget.
     */
    constructor(options) {
        super(options);
    }
    getLanguage() {
        return 'scala';
    }
    getIcon() {
        return ui_components_1.scalaIcon;
    }
}
exports.ScalaEditor = ScalaEditor;


/***/ }),

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
const script_editor_1 = __webpack_require__(/*! @elyra/script-editor */ "webpack/sharing/consume/default/@elyra/script-editor/@elyra/script-editor");
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const application_1 = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const codeeditor_1 = __webpack_require__(/*! @jupyterlab/codeeditor */ "webpack/sharing/consume/default/@jupyterlab/codeeditor");
const filebrowser_1 = __webpack_require__(/*! @jupyterlab/filebrowser */ "webpack/sharing/consume/default/@jupyterlab/filebrowser");
const fileeditor_1 = __webpack_require__(/*! @jupyterlab/fileeditor */ "webpack/sharing/consume/default/@jupyterlab/fileeditor");
const launcher_1 = __webpack_require__(/*! @jupyterlab/launcher */ "webpack/sharing/consume/default/@jupyterlab/launcher");
const mainmenu_1 = __webpack_require__(/*! @jupyterlab/mainmenu */ "webpack/sharing/consume/default/@jupyterlab/mainmenu");
const settingregistry_1 = __webpack_require__(/*! @jupyterlab/settingregistry */ "webpack/sharing/consume/default/@jupyterlab/settingregistry");
const ScalaEditor_1 = __webpack_require__(/*! ./ScalaEditor */ "./lib/ScalaEditor.js");
const SCALA_FACTORY = 'Scala Editor';
const SCALA = 'scala';
const SCALA_EDITOR_NAMESPACE = 'elyra-scala-editor-extension';
const commandIDs = {
    createNewScalaEditor: 'script-editor:create-new-scala-editor',
    openDocManager: 'docmanager:open',
    newDocManager: 'docmanager:new-untitled'
};
/**
 * Initialization data for the scala-editor-extension extension.
 */
const extension = {
    id: SCALA_EDITOR_NAMESPACE,
    autoStart: true,
    requires: [
        codeeditor_1.IEditorServices,
        fileeditor_1.IEditorTracker,
        apputils_1.ICommandPalette,
        settingregistry_1.ISettingRegistry,
        filebrowser_1.IFileBrowserFactory
    ],
    optional: [application_1.ILayoutRestorer, mainmenu_1.IMainMenu, launcher_1.ILauncher],
    activate: (app, editorServices, editorTracker, palette, settingRegistry, browserFactory, restorer, menu, launcher) => {
        console.log('Elyra - scala-editor extension is activated!');
        const factory = new script_editor_1.ScriptEditorWidgetFactory({
            editorServices,
            factoryOptions: {
                name: SCALA_FACTORY,
                fileTypes: [SCALA],
                defaultFor: [SCALA]
            },
            instanceCreator: (options) => new ScalaEditor_1.ScalaEditor(options)
        });
        app.docRegistry.addFileType({
            name: SCALA,
            displayName: 'Scala File',
            extensions: ['.scala'],
            pattern: '.*\\.scala$',
            mimeTypes: ['text/x-scala'],
            icon: ui_components_1.scalaIcon
        });
        const { restored } = app;
        /**
         * Track ScalaEditor widget on page refresh
         */
        const tracker = new apputils_1.WidgetTracker({
            namespace: SCALA_EDITOR_NAMESPACE
        });
        //no default config so we set it to an empty object
        let config = {};
        if (restorer) {
            // Handle state restoration
            void restorer.restore(tracker, {
                command: commandIDs.openDocManager,
                args: (widget) => ({
                    path: widget.context.path,
                    factory: SCALA_FACTORY
                }),
                name: (widget) => widget.context.path
            });
        }
        /**
         * Update the setting values. Adapted from fileeditor-extension.
         */
        //replaced default Config
        const updateSettings = (settings) => {
            config = Object.assign({}, settings.get('editorConfig').composite);
            app.commands.notifyCommandChanged();
        };
        /**
         * Update the settings of the current tracker instances. Adapted from fileeditor-extension.
         */
        const updateTracker = () => {
            tracker.forEach((widget) => {
                updateWidget(widget);
            });
        };
        /**
         * Update the settings of a widget. Adapted from fileeditor-extension.
         */
        const updateWidget = (widget) => {
            if (!editorTracker.has(widget)) {
                editorTracker.add(widget);
            }
            const editor = widget.content.editor;
            const editorConfigOptions = config || {};
            Object.keys(editorConfigOptions).forEach((key) => {
                const optionValue = editorConfigOptions[key];
                if (optionValue !== undefined) {
                    editor.setOption(key, optionValue);
                }
            });
        };
        // Fetch the initial state of the settings. Adapted from fileeditor-extension.
        Promise.all([
            settingRegistry.load('@jupyterlab/fileeditor-extension:plugin'),
            restored
        ])
            .then(([settings]) => {
            updateSettings(settings);
            updateTracker();
            settings.changed.connect(() => {
                updateSettings(settings);
                updateTracker();
            });
        })
            .catch((reason) => {
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
         * Create new scala editor from launcher and file menu
         */
        // Add an scala launcher
        if (launcher) {
            launcher.add({
                command: commandIDs.createNewScalaEditor,
                category: 'Elyra',
                rank: 4
            });
        }
        if (menu) {
            // Add new scala editor creation to the file menu
            menu.fileMenu.newMenu.addGroup([{ command: commandIDs.createNewScalaEditor, args: { isMenu: true } }], 92);
        }
        // Function to create a new untitled scala file, given the current working directory
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `app.commands.execute` returns a Promise<any>
        const createNew = (cwd) => {
            return app.commands
                .execute(commandIDs.newDocManager, {
                path: cwd,
                type: 'file',
                ext: '.scala'
            })
                .then((model) => {
                return app.commands.execute(commandIDs.openDocManager, {
                    path: model.path,
                    factory: SCALA_FACTORY
                });
            });
        };
        // Add a command to create new scala editor
        app.commands.addCommand(commandIDs.createNewScalaEditor, {
            label: (args) => args['isPalette'] ? 'New Scala Editor' : 'Scala Editor',
            caption: 'Create a new Scala Editor',
            icon: (args) => (args['isPalette'] ? undefined : ui_components_1.scalaIcon),
            execute: (args) => {
                //Use file browser's current path instead of defaultBrowser.model.path
                const fileBrowser = browserFactory.createFileBrowser('myFileBrowser');
                const cwd = args['cwd'] ? String(args['cwd']) : fileBrowser.model.path;
                return createNew(cwd);
            }
        });
        palette.addItem({
            command: commandIDs.createNewScalaEditor,
            args: { isPalette: true },
            category: 'Elyra'
        });
    }
};
exports["default"] = extension;


/***/ })

}]);
//# sourceMappingURL=lib_index_js.db62213feeb33560e6ae.js.map