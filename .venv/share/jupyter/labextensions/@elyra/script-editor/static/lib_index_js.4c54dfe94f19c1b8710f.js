"use strict";
(self["webpackChunk_elyra_script_editor"] = self["webpackChunk_elyra_script_editor"] || []).push([["lib_index_js"],{

/***/ "./lib/KernelDropdown.js":
/*!*******************************!*\
  !*** ./lib/KernelDropdown.js ***!
  \*******************************/
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KernelDropdown = void 0;
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const ui_components_1 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const react_1 = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
/**
 * A toolbar dropdown component populated with available kernel specs.
 */
// eslint-disable-next-line react/display-name
const DropDown = (0, react_1.forwardRef)(({ specs, defaultKernel, callback }, select) => {
    const kernelspecs = (0, react_1.useMemo)(() => (Object.assign({}, specs.kernelspecs)), [specs]);
    const [selection, setSelection] = (0, react_1.useState)(defaultKernel || '');
    // Note: It's normally best to avoid using an imperative handle if possible.
    // The better option would be to track state in the parent component and handle
    // the change events there as well, but I know this isn't always possible
    // alongside jupyter.
    (0, react_1.useImperativeHandle)(select, () => ({
        getSelection: () => selection
    }));
    const kernelOptions = !Object.keys(kernelspecs).length ? (react_1.default.createElement("option", { key: "no-kernel", value: "no-kernel" }, "No Kernel")) : (Object.entries(kernelspecs).map(([key, val]) => {
        var _a;
        return (react_1.default.createElement("option", { key: key, value: key }, (_a = val === null || val === void 0 ? void 0 : val.display_name) !== null && _a !== void 0 ? _a : key));
    }));
    const handleSelection = (e) => {
        const selection = e.target.value;
        setSelection(selection);
        callback(selection);
    };
    return (react_1.default.createElement(ui_components_1.HTMLSelect, { onChange: handleSelection, value: selection }, kernelOptions));
});
/**
 * Wrap the dropDown into a React Widget in order to insert it into a Lab Toolbar Widget
 */
class KernelDropdown extends apputils_1.ReactWidget {
    /**
     * Construct a new CellTypeSwitcher widget.
     */
    constructor(specs, defaultKernel, ref, callback) {
        super();
        this.specs = specs;
        this.defaultKernel = defaultKernel;
        this.ref = ref;
        this.callback = callback;
        this.defaultKernel = defaultKernel;
    }
    render() {
        return (react_1.default.createElement(DropDown, { ref: this.ref, specs: this.specs, defaultKernel: this.defaultKernel, callback: this.callback }));
    }
}
exports.KernelDropdown = KernelDropdown;


/***/ }),

/***/ "./lib/ScriptEditor.js":
/*!*****************************!*\
  !*** ./lib/ScriptEditor.js ***!
  \*****************************/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ScriptEditor = void 0;
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const docregistry_1 = __webpack_require__(/*! @jupyterlab/docregistry */ "webpack/sharing/consume/default/@jupyterlab/docregistry");
const logconsole_1 = __webpack_require__(/*! @jupyterlab/logconsole */ "webpack/sharing/consume/default/@jupyterlab/logconsole");
const outputarea_1 = __webpack_require__(/*! @jupyterlab/outputarea */ "webpack/sharing/consume/default/@jupyterlab/outputarea");
const rendermime_1 = __webpack_require__(/*! @jupyterlab/rendermime */ "webpack/sharing/consume/default/@jupyterlab/rendermime");
const ui_components_1 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const ui_components_2 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const signaling_1 = __webpack_require__(/*! @lumino/signaling */ "webpack/sharing/consume/default/@lumino/signaling");
const widgets_1 = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
const react_1 = __importDefault(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const KernelDropdown_1 = __webpack_require__(/*! ./KernelDropdown */ "./lib/KernelDropdown.js");
const ScriptEditorController_1 = __webpack_require__(/*! ./ScriptEditorController */ "./lib/ScriptEditorController.js");
const ScriptRunner_1 = __webpack_require__(/*! ./ScriptRunner */ "./lib/ScriptRunner.js");
/**
 * ScriptEditor widget CSS classes.
 */
const SCRIPT_EDITOR_CLASS = 'elyra-ScriptEditor';
const OUTPUT_AREA_CLASS = 'elyra-ScriptEditor-OutputArea';
const OUTPUT_AREA_ERROR_CLASS = 'elyra-ScriptEditor-OutputArea-error';
const OUTPUT_AREA_CHILD_CLASS = 'elyra-ScriptEditor-OutputArea-child';
const OUTPUT_AREA_OUTPUT_CLASS = 'elyra-ScriptEditor-OutputArea-output';
const OUTPUT_AREA_PROMPT_CLASS = 'elyra-ScriptEditor-OutputArea-prompt';
const RUN_BUTTON_CLASS = 'elyra-ScriptEditor-Run';
const TOOLBAR_CLASS = 'elyra-ScriptEditor-Toolbar';
/**
 * A widget for script editors.
 */
class ScriptEditor extends docregistry_1.DocumentWidget {
    /**
     * Construct a new editor widget.
     */
    constructor(options) {
        super(options);
        this.debuggerAvailable = (kernelName) => __awaiter(this, void 0, void 0, function* () { return yield this.controller.debuggerAvailable(kernelName); });
        /**
         * Function: Fetches kernel specs filtered by editor language
         * and populates toolbar kernel selector.
         */
        this.initializeKernelSpecs = () => __awaiter(this, void 0, void 0, function* () {
            const language = this.getLanguage();
            const kernelSpecs = yield this.controller.getKernelSpecsByLanguage(language);
            this.defaultKernel = yield this.controller.getDefaultKernel(language);
            this.kernelName = this.defaultKernel;
            this.kernelSelectorRef = react_1.default.createRef();
            if (kernelSpecs !== null) {
                this.toolbar.insertItem(4, 'select', new KernelDropdown_1.KernelDropdown(kernelSpecs, this.defaultKernel, this.kernelSelectorRef, this.handleKernelSelectionUpdate));
            }
            this._kernelSelectionChanged.emit(this.kernelSelection);
        });
        this.handleKernelSelectionUpdate = (selectedKernel) => __awaiter(this, void 0, void 0, function* () {
            if (selectedKernel === this.kernelName) {
                return;
            }
            this.kernelName = selectedKernel;
            this._kernelSelectionChanged.emit(selectedKernel);
        });
        /**
         * Function: Creates an OutputArea widget wrapped in a DockPanel.
         */
        this.createOutputAreaWidget = () => {
            // Add dockpanel wrapper for output area
            this.dockPanel = new ui_components_2.DockPanelSvg({ tabsMovable: false });
            widgets_1.Widget.attach(this.dockPanel, document.body);
            window.addEventListener('resize', () => {
                var _a;
                (_a = this.dockPanel) === null || _a === void 0 ? void 0 : _a.fit();
            });
            // Create output area widget
            const model = new outputarea_1.OutputAreaModel();
            const renderMimeRegistry = new rendermime_1.RenderMimeRegistry({ initialFactories: rendermime_1.standardRendererFactories });
            this.outputAreaWidget = new outputarea_1.OutputArea({
                rendermime: renderMimeRegistry,
                model
            });
            this.outputAreaWidget.addClass(OUTPUT_AREA_CLASS);
            const layout = this.layout;
            // TODO: Investigate SplitLayout instead of BoxLayout, for layout resizing functionality
            // const layout = this.layout as SplitLayout;
            layout.addWidget(this.dockPanel);
        };
        /**
         * Function: Clears existing output area and runs script
         * code from file editor in the selected kernel context.
         */
        this.runScript = () => __awaiter(this, void 0, void 0, function* () {
            if (!this.runDisabled) {
                this.clearOutputArea();
                this.displayOutputArea();
                yield this.runner.runScript(this.kernelName, this.context.path, this.model.sharedModel.getSource(), this.handleKernelMsg);
            }
        });
        this.interruptRun = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            yield this.runner.interruptKernel();
            if (!((_a = this.dockPanel) === null || _a === void 0 ? void 0 : _a.isEmpty)) {
                this.updatePromptText(' ');
            }
        });
        this.disableRunButton = (disabled) => {
            this.runButton.enabled = !disabled;
            this.runDisabled = disabled;
        };
        /**
         * Function: Clears existing output area.
         */
        this.clearOutputArea = () => {
            var _a, _b, _c;
            // TODO: hide this.layout(), or set its height to 0
            (_a = this.dockPanel) === null || _a === void 0 ? void 0 : _a.hide();
            (_b = this.outputAreaWidget) === null || _b === void 0 ? void 0 : _b.model.clear();
            (_c = this.outputAreaWidget) === null || _c === void 0 ? void 0 : _c.removeClass(OUTPUT_AREA_ERROR_CLASS); // if no error class is found, command is ignored
        };
        /**
         * Function: Call back function passed to runner, that handles messages coming from the kernel.
         */
        this.handleKernelMsg = (msg) => {
            let output = '';
            if (msg.status) {
                this.displayKernelStatus(msg.status);
                return;
            }
            else if (msg.error) {
                output = 'Error : ' + msg.error.type + ' - ' + msg.error.output;
                this.displayOutput(output);
                this.getOutputAreaChildWidget().addClass(OUTPUT_AREA_ERROR_CLASS);
                return;
            }
            else if (msg.output) {
                output = msg.output;
            }
            this.displayOutput(output);
        };
        this.createScrollButtons = (scrollingWidget) => {
            var _a, _b;
            const scrollUpButton = document.createElement('button');
            const scrollDownButton = document.createElement('button');
            scrollUpButton.className = 'elyra-ScriptEditor-scrollTop';
            scrollDownButton.className = 'elyra-ScriptEditor-scrollBottom';
            scrollUpButton.onclick = function () {
                scrollingWidget.node.scrollTop = 0;
            };
            scrollDownButton.onclick = function () {
                scrollingWidget.node.scrollTop = scrollingWidget.node.scrollHeight;
            };
            ui_components_2.caretUpEmptyThinIcon.element({
                container: scrollUpButton,
                elementPosition: 'center',
                title: 'Top'
            });
            ui_components_2.caretDownEmptyThinIcon.element({
                container: scrollDownButton,
                elementPosition: 'center',
                title: 'Bottom'
            });
            (_a = this.dockPanel) === null || _a === void 0 ? void 0 : _a.node.appendChild(scrollUpButton);
            (_b = this.dockPanel) === null || _b === void 0 ? void 0 : _b.node.appendChild(scrollDownButton);
        };
        /**
         * Function: Displays output area widget.
         */
        this.displayOutputArea = () => {
            var _a, _b, _c, _d, _e, _f;
            if (this.outputAreaWidget === undefined ||
                !((_b = (_a = this.kernelSelectorRef) === null || _a === void 0 ? void 0 : _a.current) === null || _b === void 0 ? void 0 : _b.getSelection())) {
                return;
            }
            (_c = this.dockPanel) === null || _c === void 0 ? void 0 : _c.show();
            // TODO: Set layout height to be flexible
            if (this.dockPanel !== undefined) {
                widgets_1.BoxLayout.setStretch(this.dockPanel, 1);
            }
            if ((_d = this.dockPanel) === null || _d === void 0 ? void 0 : _d.isEmpty) {
                // Add a tab to dockPanel
                this.scrollingWidget = new logconsole_1.ScrollingWidget({
                    content: this.outputAreaWidget
                });
                this.createScrollButtons(this.scrollingWidget);
                (_e = this.dockPanel) === null || _e === void 0 ? void 0 : _e.addWidget(this.scrollingWidget, { mode: 'split-bottom' });
                const outputTab = (_f = this.dockPanel) === null || _f === void 0 ? void 0 : _f.tabBars().next().value;
                if (outputTab !== undefined) {
                    outputTab.id = 'tab-ScriptEditor-output';
                    if (outputTab.currentTitle !== null) {
                        outputTab.currentTitle.label = 'Console Output';
                        outputTab.currentTitle.closable = true;
                    }
                    outputTab.disposed.connect(() => {
                        this.interruptRun();
                        this.clearOutputArea();
                    }, this);
                }
            }
            const options = {
                name: 'stdout',
                output_type: 'stream',
                text: ['Waiting for kernel to start...']
            };
            this.outputAreaWidget.model.add(options);
            this.updatePromptText(' ');
            this.setOutputAreaClasses();
        };
        /**
         * Function: Displays kernel status, similar to notebook.
         */
        this.displayKernelStatus = (status) => {
            if (status === 'busy') {
                // TODO: Use a character that does not take any space, also not an empty string
                this.emptyOutput = true;
                this.displayOutput(' ');
                this.updatePromptText('*');
            }
            else if (status === 'idle') {
                this.updatePromptText(' ');
            }
        };
        /**
         * Function: Displays code in OutputArea widget.
         */
        this.displayOutput = (output) => {
            var _a, _b, _c, _d;
            if (output) {
                const options = {
                    name: 'stdout',
                    output_type: 'stream',
                    text: [output]
                };
                // Stream output doesn't instantiate correctly without an initial output string
                if (this.emptyOutput) {
                    // Clears the "Waiting for kernel" message immediately
                    (_a = this.outputAreaWidget) === null || _a === void 0 ? void 0 : _a.model.clear(false);
                    (_b = this.outputAreaWidget) === null || _b === void 0 ? void 0 : _b.model.add(options);
                    this.emptyOutput = false;
                    // Clear will wait until the first output from the kernel to clear the initial string
                    (_c = this.outputAreaWidget) === null || _c === void 0 ? void 0 : _c.model.clear(true);
                }
                else {
                    (_d = this.outputAreaWidget) === null || _d === void 0 ? void 0 : _d.model.add(options);
                }
                this.updatePromptText('*');
                this.setOutputAreaClasses();
            }
        };
        this.setOutputAreaClasses = () => {
            this.getOutputAreaChildWidget().addClass(OUTPUT_AREA_CHILD_CLASS);
            this.getOutputAreaOutputWidget().addClass(OUTPUT_AREA_OUTPUT_CLASS);
            this.getOutputAreaPromptWidget().addClass(OUTPUT_AREA_PROMPT_CLASS);
        };
        /**
         * Function: Gets OutputArea child widget, where output and kernel status are displayed.
         */
        this.getOutputAreaChildWidget = () => {
            var _a;
            const outputAreaChildLayout = (_a = this.outputAreaWidget) === null || _a === void 0 ? void 0 : _a.layout;
            return outputAreaChildLayout.widgets[0];
        };
        /**
         * Function: Gets OutputArea prompt widget, where kernel status is displayed.
         */
        this.getOutputAreaOutputWidget = () => {
            const outputAreaChildLayout = this.getOutputAreaChildWidget()
                .layout;
            return outputAreaChildLayout.widgets[1];
        };
        /**
         * Function: Gets OutputArea prompt widget, where kernel status is displayed.
         */
        this.getOutputAreaPromptWidget = () => {
            const outputAreaChildLayout = this.getOutputAreaChildWidget()
                .layout;
            return outputAreaChildLayout.widgets[0];
        };
        /**
         * Function: Updates OutputArea prompt widget to display kernel status.
         */
        this.updatePromptText = (kernelStatusFlag) => {
            this.getOutputAreaPromptWidget().node.innerText =
                '[' + kernelStatusFlag + ']:';
        };
        /**
         * Function: Saves file editor content.
         */
        this.saveFile = () => __awaiter(this, void 0, void 0, function* () {
            if (this.context.model.readOnly) {
                yield (0, apputils_1.showDialog)({
                    title: 'Cannot Save',
                    body: 'Document is read-only',
                    buttons: [apputils_1.Dialog.okButton()]
                });
                return;
            }
            this.context.save().then(() => __awaiter(this, void 0, void 0, function* () {
                if (!this.isDisposed) {
                    yield this.context.createCheckpoint();
                }
            }));
        });
        this.addClass(SCRIPT_EDITOR_CLASS);
        this.model = this.content.model;
        this.runner = new ScriptRunner_1.ScriptRunner(this.disableRunButton);
        this.kernelSelectorRef = null;
        this.emptyOutput = true;
        this.controller = new ScriptEditorController_1.ScriptEditorController();
        this.runDisabled = false;
        this.defaultKernel = null;
        this.kernelName = null;
        this._kernelSelectionChanged = new signaling_1.Signal(this);
        this.title.icon = this.getIcon();
        // Add toolbar widgets
        const saveButton = new ui_components_1.ToolbarButton({
            icon: ui_components_2.saveIcon,
            onClick: this.saveFile,
            tooltip: 'Save file contents'
        });
        const runButton = new ui_components_1.ToolbarButton({
            className: RUN_BUTTON_CLASS,
            icon: ui_components_2.runIcon,
            onClick: this.runScript,
            tooltip: 'Run',
            enabled: !this.runDisabled
        });
        const interruptButton = new ui_components_1.ToolbarButton({
            icon: ui_components_2.stopIcon,
            onClick: this.interruptRun,
            tooltip: 'Interrupt the kernel'
        });
        // Populate toolbar with button widgets
        const toolbar = this.toolbar;
        toolbar.addItem('save', saveButton);
        toolbar.addItem('run', runButton);
        toolbar.addItem('interrupt', interruptButton);
        this.toolbar.addClass(TOOLBAR_CLASS);
        this.runButton = runButton;
        // Create output area widget
        this.createOutputAreaWidget();
        this.context.ready.then(() => this.initializeKernelSpecs());
    }
    get kernelSelectionChanged() {
        return this._kernelSelectionChanged;
    }
    get kernelSelection() {
        var _a, _b;
        return (_b = (_a = this.kernelName) !== null && _a !== void 0 ? _a : this.defaultKernel) !== null && _b !== void 0 ? _b : '';
    }
}
exports.ScriptEditor = ScriptEditor;


/***/ }),

/***/ "./lib/ScriptEditorController.js":
/*!***************************************!*\
  !*** ./lib/ScriptEditorController.js ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
exports.ScriptEditorController = void 0;
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
const services_1 = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
class ScriptEditorController {
    constructor() {
        /**
         * Get available kernel specs.
         */
        this.getKernelSpecs = () => __awaiter(this, void 0, void 0, function* () {
            yield this.kernelSpecManager.ready;
            const specs = this.kernelSpecManager.specs;
            // return a deep copy of the object preserving the original type
            return JSON.parse(JSON.stringify(specs));
        });
        /**
         * Get available kernel specs by language.
         */
        this.getKernelSpecsByLanguage = (language) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const specs = yield this.getKernelSpecs();
            Object.entries((_a = specs === null || specs === void 0 ? void 0 : specs.kernelspecs) !== null && _a !== void 0 ? _a : [])
                .filter((entry) => { var _a; return ((_a = entry[1]) === null || _a === void 0 ? void 0 : _a.language.includes(language)) === false; })
                .forEach((entry) => specs === null || specs === void 0 ? true : delete specs.kernelspecs[entry[0]]);
            return specs;
        });
        /**
         * Get kernel specs by name.
         */
        this.getKernelSpecsByName = (kernelName) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const specs = yield this.getKernelSpecs();
            Object.entries((_a = specs === null || specs === void 0 ? void 0 : specs.kernelspecs) !== null && _a !== void 0 ? _a : [])
                .filter((entry) => { var _a, _b; return ((_b = (_a = entry[1]) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.includes(kernelName)) === false; })
                .forEach((entry) => specs === null || specs === void 0 ? true : delete specs.kernelspecs[entry[0]]);
            return specs;
        });
        /**
         * Get the default kernel name from a given language
         * or the name of the first kernel from the list of kernelspecs.
         */
        this.getDefaultKernel = (language) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const kernelSpecs = yield this.getKernelSpecs();
            if (!kernelSpecs) {
                return '';
            }
            if ((_a = kernelSpecs.default) === null || _a === void 0 ? void 0 : _a.includes(language)) {
                return kernelSpecs.default;
            }
            return this.getFirstKernelName(language);
        });
        this.getFirstKernelName = (language) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const specsByLang = yield this.getKernelSpecsByLanguage(language);
            const empty = '';
            if (specsByLang && Object.keys(specsByLang.kernelspecs).length !== 0) {
                const [key, value] = Object.entries(specsByLang.kernelspecs)[0];
                return (_a = value === null || value === void 0 ? void 0 : value.name) !== null && _a !== void 0 ? _a : key;
            }
            return empty;
        });
        /**
         * Return value of debugger boolean property from the kernel spec of a given name.
         */
        this.debuggerAvailable = (kernelName) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const specs = yield this.getKernelSpecsByName(kernelName);
            return !!((_c = (_b = (_a = specs === null || specs === void 0 ? void 0 : specs.kernelspecs[kernelName]) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b['debugger']) !== null && _c !== void 0 ? _c : false);
        });
        this.kernelSpecManager = new services_1.KernelSpecManager();
    }
}
exports.ScriptEditorController = ScriptEditorController;


/***/ }),

/***/ "./lib/ScriptEditorWidgetFactory.js":
/*!******************************************!*\
  !*** ./lib/ScriptEditorWidgetFactory.js ***!
  \******************************************/
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
exports.ScriptEditorWidgetFactory = void 0;
const docregistry_1 = __webpack_require__(/*! @jupyterlab/docregistry */ "webpack/sharing/consume/default/@jupyterlab/docregistry");
const fileeditor_1 = __webpack_require__(/*! @jupyterlab/fileeditor */ "webpack/sharing/consume/default/@jupyterlab/fileeditor");
/**
 * A widget factory for script editors.
 */
class ScriptEditorWidgetFactory extends docregistry_1.ABCWidgetFactory {
    /**
     * Construct a new editor widget factory.
     */
    constructor(options) {
        super(options.factoryOptions);
        this._services = options.editorServices;
        this.options = options;
    }
    /**
     * Create a new widget given a context.
     */
    createNewWidget(context) {
        const newDocumentEditor = this._services.factoryService.newDocumentEditor;
        const factory = (options) => {
            return newDocumentEditor(options);
        };
        const content = new fileeditor_1.FileEditor({
            factory,
            context,
            mimeTypeService: this._services.mimeTypeService
        });
        return this.options.instanceCreator({ content, context });
    }
}
exports.ScriptEditorWidgetFactory = ScriptEditorWidgetFactory;


/***/ }),

/***/ "./lib/ScriptRunner.js":
/*!*****************************!*\
  !*** ./lib/ScriptRunner.js ***!
  \*****************************/
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
exports.ScriptRunner = void 0;
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const services_1 = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
const KERNEL_ERROR_MSG = 'Could not run script because no supporting kernel is defined.';
const SESSION_ERROR_MSG = 'Could not start session to execute script.';
/**
 * Utility class to enable running scripts in the context of a Kernel environment
 */
class ScriptRunner {
    /**
     * Construct a new runner.
     */
    constructor(disableButton) {
        this.errorDialog = (errorMsg) => {
            this.disableButton(false);
            return (0, apputils_1.showDialog)({
                title: 'Error',
                body: errorMsg,
                buttons: [apputils_1.Dialog.okButton()]
            });
        };
        /**
         * Function: Starts a session with a proper kernel and executes code from file editor.
         */
        this.runScript = (kernelName, contextPath, code, handleKernelMsg) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.disableButton(true);
            if (!kernelName) {
                yield this.errorDialog(KERNEL_ERROR_MSG);
                return;
            }
            try {
                yield this.startSession(kernelName, contextPath);
            }
            catch (e) {
                yield this.errorDialog(SESSION_ERROR_MSG);
                return;
            }
            if (!((_a = this.sessionConnection) === null || _a === void 0 ? void 0 : _a.kernel)) {
                // session didn't get started
                yield this.errorDialog(SESSION_ERROR_MSG);
                return;
            }
            const future = this.sessionConnection.kernel.requestExecute({ code });
            future.onIOPub = (msg) => {
                const msgType = msg.header.msg_type;
                const msgOutput = {};
                if (msgType === 'error') {
                    const errorMsg = msg;
                    msgOutput.error = {
                        type: errorMsg.content.ename,
                        output: errorMsg.content.evalue
                    };
                }
                else if (msgType === 'execute_result' || msgType === 'display_data') {
                    const resultMsg = msg;
                    if ('text/plain' in resultMsg.content.data) {
                        msgOutput.output = resultMsg.content.data['text/plain'];
                    }
                    else {
                        console.log('Ignoring received message ' + JSON.stringify(msg));
                    }
                }
                else if (msgType === 'stream') {
                    const streamMsg = msg;
                    msgOutput.output = streamMsg.content.text;
                }
                else if (msgType === 'status') {
                    const statusMsg = msg;
                    msgOutput.status = statusMsg.content.execution_state;
                }
                else {
                    // ignore other message types
                }
                // Notify UI
                handleKernelMsg(msgOutput);
            };
            try {
                yield future.done;
                // TO DO: Keep session open but shut down kernel
                // this.interruptKernel(); // debugger is not triggered after this
                // this.shutdownKernel(); // also shuts down session for some reason
                this.disableButton(false);
            }
            catch (e) {
                console.log('Exception: done = ' + JSON.stringify(e));
            }
        });
        /**
         * Function: Starts new kernel session.
         */
        this.startSession = (kernelName, contextPath) => __awaiter(this, void 0, void 0, function* () {
            const options = {
                kernel: {
                    name: kernelName
                },
                path: contextPath,
                type: 'file',
                name: contextPath
            };
            if (!this.sessionConnection || !this.sessionConnection.kernel) {
                try {
                    this.sessionConnection = yield this.sessionManager.startNew(options);
                    this.sessionConnection.setPath(contextPath);
                }
                catch (e) {
                    console.log('Exception: kernel start = ' + JSON.stringify(e));
                }
            }
        });
        /**
         * Function: Shuts down kernel session.
         */
        this.shutdownSession = () => __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.sessionConnection) {
                const name = (_a = this.sessionConnection.kernel) === null || _a === void 0 ? void 0 : _a.name;
                try {
                    yield this.sessionConnection.shutdown();
                    this.sessionConnection = null;
                    console.log(name + ' kernel shut down');
                }
                catch (e) {
                    console.log('Exception: session shutdown = ' + JSON.stringify(e));
                }
            }
        });
        /**
         * Function: Shuts down kernel.
         */
        this.shutdownKernel = () => __awaiter(this, void 0, void 0, function* () {
            if (this.sessionConnection) {
                const kernel = this.sessionConnection.kernel;
                try {
                    kernel && (yield services_1.KernelAPI.shutdownKernel(kernel.id));
                    console.log((kernel === null || kernel === void 0 ? void 0 : kernel.name) + ' kernel shutdown');
                }
                catch (e) {
                    console.log('Exception: kernel shutdown = ' + JSON.stringify(e));
                }
            }
        });
        /**
         * Function: Interrupts kernel.
         * TO DO: Interrupting kernel does not notify debugger service. Same behavior debugging notebooks.
         */
        this.interruptKernel = () => __awaiter(this, void 0, void 0, function* () {
            if (this.sessionConnection) {
                const kernel = this.sessionConnection.kernel;
                try {
                    kernel &&
                        (yield services_1.KernelAPI.interruptKernel(kernel.id, kernel.serverSettings));
                    console.log((kernel === null || kernel === void 0 ? void 0 : kernel.name) + ' kernel interrupted.');
                    this.disableButton(false);
                }
                catch (e) {
                    console.log('Exception: kernel interrupt = ' + JSON.stringify(e));
                }
            }
        });
        this.disableButton = disableButton;
        this.kernelSpecManager = new services_1.KernelSpecManager();
        this.kernelManager = new services_1.KernelManager();
        this.sessionManager = new services_1.SessionManager({
            kernelManager: this.kernelManager
        });
        this.sessionConnection = null;
    }
}
exports.ScriptRunner = ScriptRunner;


/***/ }),

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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./KernelDropdown */ "./lib/KernelDropdown.js"), exports);
__exportStar(__webpack_require__(/*! ./ScriptEditor */ "./lib/ScriptEditor.js"), exports);
__exportStar(__webpack_require__(/*! ./ScriptEditorController */ "./lib/ScriptEditorController.js"), exports);
__exportStar(__webpack_require__(/*! ./ScriptRunner */ "./lib/ScriptRunner.js"), exports);
__exportStar(__webpack_require__(/*! ./ScriptEditorWidgetFactory */ "./lib/ScriptEditorWidgetFactory.js"), exports);


/***/ })

}]);
//# sourceMappingURL=lib_index_js.4c54dfe94f19c1b8710f.js.map