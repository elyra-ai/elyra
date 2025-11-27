"use strict";
(self["webpackChunk_elyra_python_editor_extension"] = self["webpackChunk_elyra_python_editor_extension"] || []).push([["lib_index_js"],{

/***/ "./lib/PythonEditor.js":
/*!*****************************!*\
  !*** ./lib/PythonEditor.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PythonEditor = void 0;
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
const ui_components_1 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
class PythonEditor extends script_editor_1.ScriptEditor {
    /**
     * Construct a new Python Editor widget.
     */
    constructor(options) {
        super(options);
    }
    getLanguage() {
        return 'python';
    }
    getIcon() {
        return ui_components_1.pythonIcon;
    }
}
exports.PythonEditor = PythonEditor;


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
const application_1 = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const codeeditor_1 = __webpack_require__(/*! @jupyterlab/codeeditor */ "webpack/sharing/consume/default/@jupyterlab/codeeditor");
const filebrowser_1 = __webpack_require__(/*! @jupyterlab/filebrowser */ "webpack/sharing/consume/default/@jupyterlab/filebrowser");
const fileeditor_1 = __webpack_require__(/*! @jupyterlab/fileeditor */ "webpack/sharing/consume/default/@jupyterlab/fileeditor");
const launcher_1 = __webpack_require__(/*! @jupyterlab/launcher */ "webpack/sharing/consume/default/@jupyterlab/launcher");
const mainmenu_1 = __webpack_require__(/*! @jupyterlab/mainmenu */ "webpack/sharing/consume/default/@jupyterlab/mainmenu");
const settingregistry_1 = __webpack_require__(/*! @jupyterlab/settingregistry */ "webpack/sharing/consume/default/@jupyterlab/settingregistry");
const ui_components_1 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
//import IDisposable from '@lumino/signaling';
const PythonEditor_1 = __webpack_require__(/*! ./PythonEditor */ "./lib/PythonEditor.js");
// import { default } from '../../../tests/plugins/index';
const PYTHON_FACTORY = 'Python Editor';
const PYTHON = 'python';
const PYTHON_EDITOR_NAMESPACE = 'elyra-python-editor-extension';
const commandIDs = {
    createNewPythonEditor: 'script-editor:create-new-python-editor',
    openDocManager: 'docmanager:open',
    newDocManager: 'docmanager:new-untitled'
};
const defaultConfig = {
    fontFamily: null,
    fontSize: null,
    lineHeight: null,
    lineNumbers: false,
    lineWrap: 'on',
    wordWrapColumn: 80,
    readOnly: false,
    tabSize: 4,
    insertSpaces: true,
    matchBrackets: true,
    autoClosingBrackets: true,
    handlePaste: true,
    rulers: [],
    codeFolding: false
};
/**
 * Initialization data for the python-editor-extension extension.
 */
const extension = {
    id: PYTHON_EDITOR_NAMESPACE,
    autoStart: true,
    requires: [
        codeeditor_1.IEditorServices,
        fileeditor_1.IEditorTracker,
        apputils_1.ICommandPalette,
        settingregistry_1.ISettingRegistry,
        filebrowser_1.IDefaultFileBrowser
    ],
    optional: [application_1.ILayoutRestorer, mainmenu_1.IMainMenu, launcher_1.ILauncher],
    activate: (app, editorServices, editorTracker, palette, settingRegistry, browserFactory, restorer, menu, launcher) => {
        console.log('Elyra - python-editor extension is activated!');
        const factory = new script_editor_1.ScriptEditorWidgetFactory({
            editorServices,
            factoryOptions: {
                name: PYTHON_FACTORY,
                fileTypes: [PYTHON],
                defaultFor: [PYTHON]
            },
            instanceCreator: (options) => new PythonEditor_1.PythonEditor(options)
        });
        app.docRegistry.addFileType({
            name: PYTHON,
            displayName: 'Python File',
            extensions: ['.py'],
            pattern: '.*\\.py$',
            mimeTypes: ['text/x-python'],
            icon: ui_components_1.pythonIcon
        });
        const { restored } = app;
        /**
         * Track PythonEditor widget on page refresh
         */
        const tracker = new apputils_1.WidgetTracker({
            namespace: PYTHON_EDITOR_NAMESPACE
        });
        let config = Object.assign({}, defaultConfig);
        if (restorer) {
            // Handle state restoration
            void restorer.restore(tracker, {
                command: commandIDs.openDocManager,
                args: (widget) => ({
                    path: widget.context.path,
                    factory: PYTHON_FACTORY
                }),
                name: (widget) => widget.context.path
            });
        }
        /**
         * Update the setting values. Adapted from fileeditor-extension.
         */
        const updateSettings = (settings) => {
            config = Object.assign(Object.assign({}, defaultConfig), settings.get('editorConfig').composite);
            // Trigger a refresh of the rendered commands
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
            Object.keys(config).forEach((keyStr) => {
                const key = keyStr;
                editor.setOption(key, config[key]);
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
        factory.widgetCreated.connect((_sender, widget) => {
            void tracker.add(widget);
            // Notify the widget tracker if restore data needs to update
            widget.context.pathChanged.connect(() => {
                void tracker.save(widget);
            });
            updateWidget(widget);
        });
        // Handle the settings of new widgets. Adapted from fileeditor-extension.
        tracker.widgetAdded.connect((_sender, widget) => {
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
            menu.fileMenu.newMenu.addGroup([{ command: commandIDs.createNewPythonEditor, args: { isMenu: true } }], 92);
        }
        // Function to create a new untitled python file, given the current working directory
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `app.commands.execute` returns a Promise<any>
        const createNew = (cwd) => {
            return app.commands
                .execute(commandIDs.newDocManager, {
                path: cwd,
                type: 'file',
                ext: '.py'
            })
                .then((model) => {
                return app.commands.execute(commandIDs.openDocManager, {
                    path: model.path,
                    factory: PYTHON_FACTORY
                });
            });
        };
        // Add a command to create new Python editor
        app.commands.addCommand(commandIDs.createNewPythonEditor, {
            label: (args) => args['isPalette'] || args['isContextMenu']
                ? 'New Python Editor'
                : 'Python Editor',
            caption: 'Create a new Python Editor',
            icon: (args) => (args['isPalette'] ? undefined : ui_components_1.pythonIcon),
            execute: (args) => {
                const cwd = args['cwd'] || browserFactory.model.path;
                return createNew(cwd);
            }
        });
        palette.addItem({
            command: commandIDs.createNewPythonEditor,
            args: { isPalette: true },
            category: 'Elyra'
        });
        app.contextMenu.addItem({
            command: commandIDs.createNewPythonEditor,
            args: { isContextMenu: true },
            selector: '.jp-DirListing-content',
            rank: 200
        });
    }
};
exports["default"] = extension;


/***/ })

}]);
//# sourceMappingURL=lib_index_js.d53f4d07027e2a7650ca.js.map