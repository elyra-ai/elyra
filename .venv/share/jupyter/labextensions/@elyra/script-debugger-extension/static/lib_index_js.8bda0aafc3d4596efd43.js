"use strict";
(self["webpackChunk_elyra_script_debugger_extension"] = self["webpackChunk_elyra_script_debugger_extension"] || []).push([["lib_index_js"],{

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const script_editor_1 = __webpack_require__(/*! @elyra/script-editor */ "webpack/sharing/consume/default/@elyra/script-editor/@elyra/script-editor");
const application_1 = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
const debugger_1 = __webpack_require__(/*! @jupyterlab/debugger */ "webpack/sharing/consume/default/@jupyterlab/debugger");
const fileeditor_1 = __webpack_require__(/*! @jupyterlab/fileeditor */ "webpack/sharing/consume/default/@jupyterlab/fileeditor");
const services_1 = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/**
 * Debugger plugin.
 * Adapted from JupyterLab debugger extension.
 * A plugin that provides visual debugging support for script editors.
 */
const scriptEditorDebuggerExtension = {
    id: 'elyra-script-debugger',
    autoStart: true,
    requires: [debugger_1.IDebugger, fileeditor_1.IEditorTracker],
    optional: [application_1.ILabShell],
    activate: (app, debug, editorTracker, labShell) => {
        console.log('Elyra - script-debugger extension is activated!');
        const handler = new debugger_1.Debugger.Handler({
            type: 'file',
            shell: app.shell,
            service: debug
        });
        const activeSessions = {};
        const kernelManager = new services_1.KernelManager();
        const sessionManager = new services_1.SessionManager({
            kernelManager: kernelManager
        });
        const updateDebugger = (widget) => __awaiter(void 0, void 0, void 0, function* () {
            const widgetInFocus = app.shell.currentWidget;
            if (widget !== widgetInFocus) {
                return;
            }
            const kernelSelection = widget.kernelSelection;
            const sessions = app.serviceManager.sessions;
            try {
                const path = widget.context.path;
                let sessionModel = yield sessions.findByPath(path);
                if (!sessionModel) {
                    // Start a kernel session for the selected kernel supporting debug
                    const sessionConnection = yield startSession(kernelSelection, path);
                    sessionModel = yield sessions.findByPath(path);
                    if (sessionConnection && sessionModel) {
                        activeSessions[sessionModel.id] = sessionConnection;
                    }
                }
                if (sessionModel) {
                    let sessionConnection = activeSessions[sessionModel.id];
                    if (!sessionConnection) {
                        // Use `connectTo` only if the session does not exist.
                        // `connectTo` sends a kernel_info_request on the shell
                        // channel, which blocks the debug session restore when waiting
                        // for the kernel to be ready
                        sessionConnection = sessions.connectTo({ model: sessionModel });
                        activeSessions[sessionModel.id] = sessionConnection;
                    }
                    yield updateKernel(sessionConnection, kernelSelection);
                    // Temporary solution to give enough time for the handler to update the UI on page reload.
                    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                        yield handler.update(widget, sessionConnection);
                        app.commands.notifyCommandChanged();
                    }), 500);
                }
            }
            catch (error) {
                console.warn('Exception: session connection = ' + JSON.stringify(error));
            }
        });
        // Use a weakmap to track the callback function used by signal listeners
        // The object is cleared by garbabe collector when no longer in use avoiding memory leaks
        // Key: ScriptEditor widget
        // Value: instance of updateDebugger function
        const callbackControl = new WeakMap();
        const update = (widget) => __awaiter(void 0, void 0, void 0, function* () {
            if (widget instanceof script_editor_1.ScriptEditor) {
                let callbackFn = callbackControl.get(widget);
                if (!callbackFn) {
                    callbackFn = () => updateDebugger(widget);
                    callbackControl.set(widget, callbackFn);
                }
                updateDebugger(widget);
                // Listen to possible kernel selection changes
                widget.kernelSelectionChanged.disconnect(callbackFn);
                widget.kernelSelectionChanged.connect(callbackFn);
            }
        });
        if (labShell) {
            // Listen to main area's current focus changes.
            labShell.currentChanged.connect((_, widget) => {
                return update(widget.newValue);
            });
        }
        if (editorTracker) {
            // Listen to script editor's current instance changes.
            editorTracker.currentChanged.connect((_, widget) => {
                return update(widget);
            });
        }
        const startSession = (kernelSelection, path) => __awaiter(void 0, void 0, void 0, function* () {
            const options = {
                kernel: {
                    name: kernelSelection
                },
                path: path,
                type: 'file',
                name: path
            };
            let sessionConnection = null;
            try {
                if (kernelSelection) {
                    sessionConnection = yield sessionManager.startNew(options);
                    sessionConnection.setPath(path);
                    console.log(`Kernel session started for ${kernelSelection} kernel`);
                }
            }
            catch (error) {
                console.warn('Exception: start session = ' + JSON.stringify(error));
            }
            return sessionConnection;
        });
        const updateKernel = (sessionConnection, kernelSelection) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            try {
                const prev = (_a = sessionConnection.kernel) === null || _a === void 0 ? void 0 : _a.name;
                if (kernelSelection && prev !== kernelSelection) {
                    yield sessionConnection.changeKernel({ name: kernelSelection });
                    console.log(`Kernel change from ${prev} to ${kernelSelection}`);
                }
            }
            catch (error) {
                console.warn('Exception: change kernel = ' + JSON.stringify(error));
            }
        });
    }
};
exports["default"] = scriptEditorDebuggerExtension;


/***/ })

}]);
//# sourceMappingURL=lib_index_js.8bda0aafc3d4596efd43.js.map