"use strict";
(self["webpackChunk_elyra_theme_extension"] = self["webpackChunk_elyra_theme_extension"] || []).push([["lib_index_js"],{

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
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const application_1 = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const launcher_1 = __webpack_require__(/*! @jupyterlab/launcher */ "webpack/sharing/consume/default/@jupyterlab/launcher");
const mainmenu_1 = __webpack_require__(/*! @jupyterlab/mainmenu */ "webpack/sharing/consume/default/@jupyterlab/mainmenu");
const translation_1 = __webpack_require__(/*! @jupyterlab/translation */ "webpack/sharing/consume/default/@jupyterlab/translation");
const ui_components_2 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const algorithm_1 = __webpack_require__(/*! @lumino/algorithm */ "webpack/sharing/consume/default/@lumino/algorithm");
const launcher_2 = __webpack_require__(/*! ./launcher */ "./lib/launcher.js");
__webpack_require__(/*! ../style/index.css */ "./style/index.css");
const ELYRA_THEME_NAMESPACE = 'elyra-theme-extension';
/**
 * The command IDs used by the launcher plugin.
 */
const CommandIDs = {
    create: 'launcher:create',
    openHelp: 'elyra:open-help',
    releases: 'elyra:releases'
};
/**
 * Initialization data for the theme extension.
 */
const extension = {
    id: ELYRA_THEME_NAMESPACE,
    autoStart: true,
    requires: [translation_1.ITranslator, application_1.ILabShell, mainmenu_1.IMainMenu],
    optional: [apputils_1.ICommandPalette],
    provides: launcher_1.ILauncher,
    activate: (app, translator, labShell, mainMenu, palette) => {
        console.log('Elyra - theme extension is activated!');
        // Find the MainLogo element and replace it with the Elyra Logo
        app.restored.then(() => {
            const logoElement = document.getElementById('jp-MainLogo');
            if (!logoElement) {
                return;
            }
            logoElement.innerHTML = '';
            const propsWithJustify = {
                container: logoElement,
                justify: 'center',
                margin: '2px 5px 2px 5px',
                height: 'auto',
                width: '20px'
            };
            ui_components_1.elyraIcon.element(propsWithJustify);
        });
        // Use custom Elyra launcher
        const { commands, shell } = app;
        const trans = translator.load('jupyterlab');
        const model = new launcher_2.LauncherModel();
        commands.addCommand(CommandIDs.create, {
            label: trans.__('New Launcher'),
            execute: (args) => {
                const cwd = args['cwd'] ? String(args['cwd']) : '';
                const id = `launcher-${Private.id++}`;
                const callback = (item) => {
                    labShell.add(item, 'main', { ref: id });
                };
                const launcher = new launcher_2.Launcher({
                    model,
                    cwd,
                    callback,
                    commands,
                    translator
                });
                launcher.model = model;
                launcher.title.icon = ui_components_2.launcherIcon;
                launcher.title.label = trans.__('Launcher');
                const main = new apputils_1.MainAreaWidget({ content: launcher });
                // If there are any other widgets open, remove the launcher close icon.
                main.title.closable = !!(0, algorithm_1.toArray)(labShell.widgets('main')).length;
                main.id = id;
                shell.add(main, 'main', {
                    activate: args['activate'],
                    ref: args['ref']
                });
                labShell.layoutModified.connect(() => {
                    // If there is only a launcher open, remove the close icon.
                    main.title.closable = (0, algorithm_1.toArray)(labShell.widgets('main')).length > 1;
                }, main);
                return main;
            }
        });
        if (palette) {
            palette.addItem({
                command: CommandIDs.create,
                category: trans.__('Launcher')
            });
        }
        if (labShell) {
            labShell.addButtonEnabled = true;
            labShell.addRequested.connect((sender, arg) => {
                var _a;
                // Get the ref for the current tab of the tabbar which the add button was clicked
                const ref = ((_a = arg.currentTitle) === null || _a === void 0 ? void 0 : _a.owner.id) ||
                    arg.titles[arg.titles.length - 1].owner.id;
                if (commands.hasCommand('filebrowser:create-main-launcher')) {
                    // If a file browser is defined connect the launcher to it
                    return commands.execute('filebrowser:create-main-launcher', {
                        ref
                    });
                }
                return commands.execute(CommandIDs.create, { ref });
            });
        }
        commands.addCommand(CommandIDs.openHelp, {
            label: 'Documentation',
            icon: ui_components_1.helpIcon,
            execute: () => {
                window.open('https://elyra.readthedocs.io/en/v4.0.0/', '_blank');
            }
        });
        commands.addCommand(CommandIDs.releases, {
            label: "What's new in v4.0.0",
            caption: "What's new in this release",
            icon: ui_components_1.whatsNewIcon,
            execute: () => {
                window.open('https://github.com/elyra-ai/elyra/releases/v4.0.0/', '_blank');
            }
        });
        model.add({
            command: CommandIDs.openHelp,
            category: 'Elyra',
            rank: 10
        });
        model.add({
            command: CommandIDs.releases,
            category: 'Elyra',
            rank: 11
        });
        return model;
    }
};
/**
 * The namespace for module private data.
 */
var Private;
(function (Private) {
    /**
     * The incrementing id used for launcher widgets.
     */
    // eslint-disable-next-line
    Private.id = 0;
})(Private || (Private = {}));
exports["default"] = extension;


/***/ }),

/***/ "./lib/launcher.js":
/*!*************************!*\
  !*** ./lib/launcher.js ***!
  \*************************/
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
exports.Launcher = exports.LauncherModel = void 0;
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const launcher_1 = __webpack_require__(/*! @jupyterlab/launcher */ "webpack/sharing/consume/default/@jupyterlab/launcher");
const algorithm_1 = __webpack_require__(/*! @lumino/algorithm */ "webpack/sharing/consume/default/@lumino/algorithm");
const React = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
/**
 * The known categories of launcher items and their default ordering.
 */
const ELYRA_CATEGORY = 'Elyra';
const CommandIDs = {
    newFile: 'fileeditor:create-new',
    createNewPythonEditor: 'script-editor:create-new-python-editor',
    createNewREditor: 'script-editor:create-new-r-editor'
};
class LauncherModel extends launcher_1.LauncherModel {
    /**
     * Return an iterator of launcher items, but remove unnecessary items.
     */
    *items() {
        const items = [];
        let pyEditorInstalled = false;
        let rEditorInstalled = false;
        this.itemsList.forEach((item) => {
            if (item.command === CommandIDs.createNewPythonEditor) {
                pyEditorInstalled = true;
            }
            else if (item.command === CommandIDs.createNewREditor) {
                rEditorInstalled = true;
            }
        });
        if (!pyEditorInstalled && !rEditorInstalled) {
            yield* this.itemsList;
        }
        // Dont add tiles for new py and r files if their script editor is installed
        this.itemsList.forEach((item) => {
            var _a, _b;
            if (!(item.command === CommandIDs.newFile &&
                ((pyEditorInstalled && ((_a = item.args) === null || _a === void 0 ? void 0 : _a.fileExt) === 'py') ||
                    (rEditorInstalled && ((_b = item.args) === null || _b === void 0 ? void 0 : _b.fileExt) === 'r')))) {
                items.push(item);
            }
        });
        yield* items;
    }
}
exports.LauncherModel = LauncherModel;
class Launcher extends launcher_1.Launcher {
    /**
     * Construct a new launcher widget.
     */
    constructor(options) {
        super(options);
        this._translator = this.translator.load('jupyterlab');
    }
    replaceCategoryIcon(category, icon) {
        const children = React.Children.map(category.props.children, (child) => {
            if (child.props.className === 'jp-Launcher-sectionHeader') {
                const grandchildren = React.Children.map(child.props.children, (grandchild) => {
                    if (grandchild.props.className !== 'jp-Launcher-sectionTitle') {
                        return React.createElement(icon.react, { stylesheet: "launcherSection" });
                    }
                    else {
                        return grandchild;
                    }
                });
                return React.cloneElement(child, child.props, grandchildren);
            }
            else {
                return child;
            }
        });
        return React.cloneElement(category, category.props, children);
    }
    /**
     * Render the launcher to virtual DOM nodes.
     */
    render() {
        // Bail if there is no model.
        if (!this.model) {
            return null;
        }
        // get the rendering from JupyterLab Launcher
        // and resort the categories
        const launcherBody = super.render();
        const launcherContent = launcherBody === null || launcherBody === void 0 ? void 0 : launcherBody.props.children;
        const launcherCategories = launcherContent.props.children;
        const categories = [];
        const knownCategories = [
            this._translator.__('Notebook'),
            this._translator.__('Console'),
            ELYRA_CATEGORY,
            this._translator.__('Other')
        ];
        // Assemble the final ordered list of categories
        // based on knownCategories.
        (0, algorithm_1.each)(knownCategories, (category) => {
            React.Children.forEach(launcherCategories, (cat) => {
                if (cat.key === category) {
                    if (cat.key === ELYRA_CATEGORY) {
                        cat = this.replaceCategoryIcon(cat, ui_components_1.elyraIcon);
                    }
                    categories.push(cat);
                }
            });
        });
        // Wrap the sections in body and content divs.
        return (React.createElement("div", { className: "jp-Launcher-body" },
            React.createElement("div", { className: "jp-Launcher-content" },
                React.createElement("div", { className: "jp-Launcher-cwd" },
                    React.createElement("h3", null, this.cwd)),
                categories)));
    }
}
exports.Launcher = Launcher;


/***/ })

}]);
//# sourceMappingURL=lib_index_js.b69ef00f981265aecd64.js.map