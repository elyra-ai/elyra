"use strict";
(self["webpackChunk_elyra_r_editor_extension"] = self["webpackChunk_elyra_r_editor_extension"] || []).push([["lib_index_js"],{

/***/ "./lib/REditor.js":
/*!************************!*\
  !*** ./lib/REditor.js ***!
  \************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.REditor = void 0;
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
class REditor extends script_editor_1.ScriptEditor {
    /**
     * Construct a new R Editor widget.
     */
    constructor(options) {
        super(options);
    }
    getLanguage() {
        return 'R';
    }
    getIcon() {
        return ui_components_1.rIcon;
    }
}
exports.REditor = REditor;


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
const REditor_1 = __webpack_require__(/*! ./REditor */ "./lib/REditor.js");
const R_FACTORY = 'R Editor';
const R = 'r';
const R_EDITOR_NAMESPACE = 'elyra-r-script-editor-extension';
const commandIDs = {
    createNewREditor: 'script-editor:create-new-r-editor',
    openDocManager: 'docmanager:open',
    newDocManager: 'docmanager:new-untitled'
};
/**
 * Initialization data for the r-editor-extension extension.
 */
const extension = {
    id: R_EDITOR_NAMESPACE,
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
        console.log('Elyra - r-editor extension is activated!');
        const factory = new script_editor_1.ScriptEditorWidgetFactory({
            editorServices,
            factoryOptions: {
                name: R_FACTORY,
                fileTypes: [R],
                defaultFor: [R]
            },
            instanceCreator: (options) => new REditor_1.REditor(options)
        });
        app.docRegistry.addFileType({
            name: R,
            displayName: 'R File',
            extensions: ['.r'],
            pattern: '.*\\.r$',
            mimeTypes: ['text/x-rsrc'],
            icon: ui_components_1.rIcon
        });
        const { restored } = app;
        /**
         * Track REditor widget on page refresh
         */
        const tracker = new apputils_1.WidgetTracker({
            namespace: R_EDITOR_NAMESPACE
        });
        let config = {};
        if (restorer) {
            // Handle state restoration
            void restorer.restore(tracker, {
                command: commandIDs.openDocManager,
                args: (widget) => ({
                    path: widget.context.path,
                    factory: R_FACTORY
                }),
                name: (widget) => widget.context.path
            });
        }
        /**
         * Update the setting values. Adapted from fileeditor-extension.
         */
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
         * Create new r editor from launcher and file menu
         */
        // Add a r launcher
        if (launcher) {
            launcher.add({
                command: commandIDs.createNewREditor,
                category: 'Elyra',
                rank: 5
            });
        }
        if (menu) {
            // Add new r file creation to the file menu
            menu.fileMenu.newMenu.addGroup([{ command: commandIDs.createNewREditor, args: { isMenu: true } }], 93);
        }
        // Function to create a new untitled r file, given the current working directory
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `app.commands.execute` returns a Promise<any>
        const createNew = (cwd) => {
            return app.commands
                .execute(commandIDs.newDocManager, {
                path: cwd,
                type: 'file',
                ext: '.r'
            })
                .then((model) => {
                return app.commands.execute(commandIDs.openDocManager, {
                    path: model.path,
                    factory: R_FACTORY
                });
            });
        };
        // Add a command to create new R editor
        app.commands.addCommand(commandIDs.createNewREditor, {
            label: (args) => (args['isPalette'] ? 'New R Editor' : 'R Editor'),
            caption: 'Create a new R Editor',
            icon: (args) => (args['isPalette'] ? undefined : ui_components_1.rIcon),
            execute: (args) => {
                //Use file browser's current path instead of defaultBrowser.model.path
                const fileBrowser = browserFactory.createFileBrowser('myFileBrowser');
                const cwd = args['cwd'] ? String(args['cwd']) : fileBrowser.model.path;
                return createNew(cwd);
            }
        });
        palette.addItem({
            command: commandIDs.createNewREditor,
            args: { isPalette: true },
            category: 'Elyra'
        });
    }
};
exports["default"] = extension;


/***/ })

}]);
//# sourceMappingURL=lib_index_js.b3ad3701469dd4486250.js.map