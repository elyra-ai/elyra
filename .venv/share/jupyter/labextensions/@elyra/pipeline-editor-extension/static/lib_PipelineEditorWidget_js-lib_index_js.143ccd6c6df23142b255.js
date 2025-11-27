"use strict";
(self["webpackChunk_elyra_pipeline_editor_extension"] = self["webpackChunk_elyra_pipeline_editor_extension"] || []).push([["lib_PipelineEditorWidget_js-lib_index_js"],{

/***/ "./lib/ComponentCatalogsWidget.js":
/*!****************************************!*\
  !*** ./lib/ComponentCatalogsWidget.js ***!
  \****************************************/
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
exports.ComponentCatalogsWidget = exports.COMPONENT_CATALOGS_SCHEMASPACE = void 0;
const metadata_common_1 = __webpack_require__(/*! @elyra/metadata-common */ "webpack/sharing/consume/default/@elyra/metadata-common/@elyra/metadata-common");
const services_1 = __webpack_require__(/*! @elyra/services */ "webpack/sharing/consume/default/@elyra/services/@elyra/services");
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const ui_components_2 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const react_1 = __importDefault(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const PipelineService_1 = __webpack_require__(/*! ./PipelineService */ "./lib/PipelineService.js");
exports.COMPONENT_CATALOGS_SCHEMASPACE = 'component-catalogs';
const COMPONENT_CATALOGS_CLASS = 'elyra-metadata-component-catalogs';
/**
 * A React Component for displaying the component catalogs list.
 */
class ComponentCatalogsDisplay extends metadata_common_1.MetadataDisplay {
    actionButtons(metadata) {
        return [
            {
                title: 'Reload components from catalog',
                icon: ui_components_2.refreshIcon,
                onClick: () => {
                    PipelineService_1.PipelineService.refreshComponentsCache(metadata.name)
                        .then(() => {
                        this.props.updateMetadata();
                    })
                        .catch((error) => console.error('An error occurred while refreshing components from catalog:', error));
                }
            },
            ...super.actionButtons(metadata)
        ];
    }
    //render catalog entries
    renderExpandableContent(metadata) {
        var _a;
        let category_output = [react_1.default.createElement("li", { key: "No category" }, "No category")];
        if (metadata.metadata.categories) {
            category_output = metadata.metadata.categories.map((category) => react_1.default.createElement("li", { key: category }, category));
        }
        return (react_1.default.createElement("div", null,
            react_1.default.createElement("h6", null, "Runtime Type"),
            metadata.metadata.runtime_type,
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("h6", null, "Description"), (_a = metadata.metadata.description) !== null && _a !== void 0 ? _a : 'No description',
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            react_1.default.createElement("h6", null, "Categories"),
            react_1.default.createElement("ul", null, category_output)));
    }
    // Allow for filtering by display_name, name, and description
    matchesSearch(searchValue, metadata) {
        searchValue = searchValue.toLowerCase();
        // True if search string is in name or display_name,
        // or if the search string is empty
        const description = (metadata.metadata.description || '').toLowerCase();
        return (metadata.name.toLowerCase().includes(searchValue) ||
            metadata.display_name.toLowerCase().includes(searchValue) ||
            description.includes(searchValue));
    }
}
/**
 * A widget for displaying component catalogs.
 */
class ComponentCatalogsWidget extends metadata_common_1.MetadataWidget {
    constructor(props) {
        super(props);
        this.runtimeTypes = [];
        // wrapper function that refreshes the palette after calling updateMetadata
        this.updateMetadataAndRefresh = () => {
            super.updateMetadata();
            if (this.refreshCallback) {
                this.refreshCallback();
            }
        };
        this.refreshCallback = props.refreshCallback;
        this.refreshButtonTooltip =
            'Refresh list and reload components from all catalogs';
    }
    getSchemas() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const schemas = yield services_1.MetadataService.getSchema(this.props.schemaspace);
                if (!schemas) {
                    return;
                }
                this.runtimeTypes = yield PipelineService_1.PipelineService.getRuntimeTypes();
                const sortedSchema = schemas.sort((a, b) => { var _a, _b; return ((_a = a.title) !== null && _a !== void 0 ? _a : '').localeCompare((_b = b.title) !== null && _b !== void 0 ? _b : ''); });
                this.schemas = sortedSchema.filter((schema) => {
                    return !!this.runtimeTypes.find((r) => {
                        var _a, _b, _c;
                        const metadata = (_a = schema.properties) === null || _a === void 0 ? void 0 : _a.metadata;
                        return (((_c = (_b = metadata === null || metadata === void 0 ? void 0 : metadata.properties.runtime_type) === null || _b === void 0 ? void 0 : _b.enum) === null || _c === void 0 ? void 0 : _c.includes(r.id)) &&
                            r.runtime_enabled);
                    });
                });
                if ((_b = (_a = this.schemas) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 > 1) {
                    for (const schema of (_c = this.schemas) !== null && _c !== void 0 ? _c : []) {
                        this.props.app.contextMenu.addItem({
                            selector: `#${this.props.schemaspace} .elyra-metadataHeader-addButton`,
                            command: 'elyra-metadata-editor:open',
                            args: {
                                onSave: this.updateMetadata,
                                schemaspace: this.props.schemaspace,
                                schema: schema.name,
                                title: schema.title,
                                titleContext: this.props.titleContext,
                                appendToTitle: this.props.appendToTitle
                            }
                        });
                    }
                }
                this.update();
            }
            catch (error) {
                yield ui_components_1.RequestErrors.serverError(error);
            }
        });
    }
    refreshMetadata() {
        PipelineService_1.PipelineService.refreshComponentsCache()
            .then(() => {
            this.updateMetadataAndRefresh();
        })
            .catch((error) => __awaiter(this, void 0, void 0, function* () {
            // silently eat a 409, the server will log in in the console
            if (error.status !== 409) {
                yield ui_components_1.RequestErrors.serverError(error);
            }
        }));
    }
    renderDisplay(metadata) {
        if (Array.isArray(metadata) && !metadata.length) {
            // Empty metadata
            return (react_1.default.createElement("div", null,
                react_1.default.createElement("br", null),
                react_1.default.createElement("h6", { className: "elyra-no-metadata-msg" },
                    "Click the + button to add ",
                    this.props.display_name.toLowerCase())));
        }
        const filteredMetadata = metadata.filter((m) => {
            return !!this.runtimeTypes.find((r) => { var _a; return ((_a = m.metadata) === null || _a === void 0 ? void 0 : _a.runtime_type) === r.id; });
        });
        return (react_1.default.createElement(ComponentCatalogsDisplay, { metadata: filteredMetadata, updateMetadata: this.updateMetadataAndRefresh, openMetadataEditor: this.openMetadataEditor, schemaspace: exports.COMPONENT_CATALOGS_SCHEMASPACE, sortMetadata: true, className: COMPONENT_CATALOGS_CLASS, omitTags: this.omitTags(), titleContext: this.props.titleContext }));
    }
}
exports.ComponentCatalogsWidget = ComponentCatalogsWidget;


/***/ }),

/***/ "./lib/EmptyPipelineContent.js":
/*!*************************************!*\
  !*** ./lib/EmptyPipelineContent.js ***!
  \*************************************/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmptyPlatformSpecificPipeline = exports.EmptyGenericPipeline = void 0;
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const ui_components_2 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const react_1 = __importDefault(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const HEADER_CLASS = 'empty-pipeline-header';
const BUTTON_CLASS = 'empty-pipeline-button';
const ICON_CLASS = 'empty-pipeline-icon';
const EmptyGenericPipeline = ({ onOpenSettings }) => {
    return (react_1.default.createElement("div", null,
        react_1.default.createElement(ui_components_1.dragDropIcon.react, { className: "drag-drop-icon", tag: "div", elementPosition: "center", height: "120px" }),
        react_1.default.createElement("h3", { className: HEADER_CLASS }, "Start your new pipeline by dragging files from the file browser pane"),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("h3", { className: HEADER_CLASS },
            "Click",
            ' ',
            react_1.default.createElement("button", { title: "Settings", className: BUTTON_CLASS, onClick: onOpenSettings },
                react_1.default.createElement(ui_components_2.settingsIcon.react, { className: ICON_CLASS, tag: "div", height: "24px" })),
            ' ',
            "to configure the pipeline editor.")));
};
exports.EmptyGenericPipeline = EmptyGenericPipeline;
const EmptyPlatformSpecificPipeline = ({ onOpenCatalog, onOpenSettings }) => {
    // Note: the URL is rewritten by the release script by replacing `latest` with a
    // specific version number, e.g. https://.../en/v3.6.0/user_guide/pi...
    const customComponentsHelpTopicURL = 'https://elyra.readthedocs.io/en/v4.0.0/user_guide/pipeline-components.html';
    return (react_1.default.createElement("div", null,
        react_1.default.createElement(ui_components_1.dragDropIcon.react, { className: "drag-drop-icon", tag: "div", elementPosition: "center", height: "120px" }),
        react_1.default.createElement("h3", { className: HEADER_CLASS },
            "Start your new pipeline by dragging files from the file browser pane or add custom components by clicking the",
            ' ',
            react_1.default.createElement("button", { className: BUTTON_CLASS, onClick: onOpenCatalog },
                react_1.default.createElement(ui_components_1.componentCatalogIcon.react, { className: ICON_CLASS, tag: "div", height: "24px" })),
            ' ',
            "button."),
        react_1.default.createElement("h4", { className: HEADER_CLASS },
            "Refer to the",
            react_1.default.createElement("a", { href: customComponentsHelpTopicURL, target: "_blank", rel: "noopener noreferrer" },
                ' ',
                "'pipeline components' help topic",
                ' '),
            "for details."),
        react_1.default.createElement("br", null),
        react_1.default.createElement("br", null),
        react_1.default.createElement("h3", { className: HEADER_CLASS },
            "Click",
            ' ',
            react_1.default.createElement("button", { title: "Settings", className: BUTTON_CLASS, onClick: onOpenSettings },
                react_1.default.createElement(ui_components_2.settingsIcon.react, { className: ICON_CLASS, tag: "div", height: "24px" })),
            ' ',
            "to configure the pipeline editor.")));
};
exports.EmptyPlatformSpecificPipeline = EmptyPlatformSpecificPipeline;


/***/ }),

/***/ "./lib/FileSubmissionDialog.js":
/*!*************************************!*\
  !*** ./lib/FileSubmissionDialog.js ***!
  \*************************************/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileSubmissionDialog = void 0;
const React = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const RuntimeConfigSelect_1 = __importDefault(__webpack_require__(/*! ./RuntimeConfigSelect */ "./lib/RuntimeConfigSelect.js"));
const utils_1 = __importDefault(__webpack_require__(/*! ./utils */ "./lib/utils.js"));
const EnvForm = ({ env }) => {
    if (env.length > 0) {
        return (React.createElement(React.Fragment, null,
            React.createElement("br", null),
            React.createElement("br", null),
            React.createElement("div", null, "Environment Variables:"),
            React.createElement("br", null),
            utils_1.default.chunkArray(env, 4).map((col, i) => (React.createElement("div", { key: i }, col.map((envVar) => (React.createElement("div", { key: envVar },
                React.createElement("label", { htmlFor: envVar },
                    envVar,
                    ":"),
                React.createElement("br", null),
                React.createElement("input", { type: "text", id: envVar, className: "envVar", name: envVar, size: 30 })))))))));
    }
    return null;
};
const FileSubmissionDialog = ({ env, images, dependencyFileExtension, runtimeData }) => {
    const [includeDependency, setIncludeDependency] = React.useState(true);
    const handleToggle = () => {
        setIncludeDependency((prev) => !prev);
    };
    return (React.createElement("form", { className: "elyra-dialog-form" },
        React.createElement(RuntimeConfigSelect_1.default, { runtimeData: runtimeData }),
        React.createElement("label", { htmlFor: "framework" }, "Runtime Image:"),
        React.createElement("br", null),
        React.createElement("select", { id: "framework", name: "framework", className: "elyra-form-framework" }, Object.entries(images).map(([key, val]) => (React.createElement("option", { key: key, value: key }, val)))),
        React.createElement("br", null),
        React.createElement("div", { className: "elyra-resourcesWrapper" },
            React.createElement("div", { className: "elyra-resourceInput" },
                React.createElement("label", { htmlFor: "cpu" }, " CPU request:"),
                React.createElement("div", { className: "elyra-resourceInputDescription", id: "cpu-description" }, "For CPU-intensive workloads, you can request more than 1 CPU (e.g. 1.5, this is optional)."),
                React.createElement("input", { id: "cpu", type: "number", name: "cpu" })),
            React.createElement("div", { className: "elyra-resourceInput" },
                React.createElement("label", { htmlFor: "cpu_limit" }, " CPU limit:"),
                React.createElement("div", { className: "elyra-resourceInputDescription", id: "cpu-limit-description" }, "The maximum CPU that can be allocated to this node. This should be equal or higher than the request"),
                React.createElement("input", { id: "cpu_limit", type: "number", name: "cpu_limit" })),
            React.createElement("div", { className: "elyra-resourceInput" },
                React.createElement("label", { htmlFor: "gpu" }, " GPU:"),
                React.createElement("div", { className: "elyra-resourceInputDescription", id: "gpu-description" }, "For GPU-intensive workloads, you can choose more than 1 GPU. Must be an integer."),
                React.createElement("input", { id: "gpu", type: "number", name: "gpu" })),
            React.createElement("div", { className: "elyra-resourceInput" },
                React.createElement("label", { htmlFor: "memory" }, " RAM request (GB):"),
                React.createElement("div", { className: "elyra-resourceInputDescription", id: "memory-description" }, "The total amount of RAM requested (optional)."),
                React.createElement("input", { id: "memory", type: "number", name: "memory" })),
            React.createElement("div", { className: "elyra-resourceInput" },
                React.createElement("label", { htmlFor: "memory_limit" }, " RAM limit (GB):"),
                React.createElement("div", { className: "elyra-resourceInputDescription", id: "memory-limit-description" }, "The maximum amount of RAM allowed. This should be equal or higher than the request"),
                React.createElement("input", { id: "memory_limit", type: "number", name: "memory_limit" }))),
        React.createElement("br", null),
        React.createElement("input", { type: "checkbox", className: "elyra-Dialog-checkbox", id: "dependency_include", name: "dependency_include", size: 20, checked: includeDependency, onChange: handleToggle }),
        React.createElement("label", { htmlFor: "dependency_include" }, "Include File Dependencies:"),
        React.createElement("br", null),
        includeDependency && (React.createElement("div", { key: "dependencies" },
            React.createElement("br", null),
            React.createElement("input", { type: "text", id: "dependencies", className: "jp-mod-styled", name: "dependencies", placeholder: `*${dependencyFileExtension}`, defaultValue: `*${dependencyFileExtension}`, size: 30 }))),
        React.createElement(EnvForm, { env: env })));
};
exports.FileSubmissionDialog = FileSubmissionDialog;


/***/ }),

/***/ "./lib/ParameterInputForm.js":
/*!***********************************!*\
  !*** ./lib/ParameterInputForm.js ***!
  \***********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ParameterInputForm = void 0;
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
const react_1 = __importDefault(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const DIALOG_WIDTH = 27;
const ParameterInputForm = ({ parameters }) => {
    return parameters && parameters.length > 0 ? (react_1.default.createElement("div", null,
        react_1.default.createElement("label", { style: {
                fontWeight: '600',
                fontSize: 'var(--jp-content-font-size1)'
            } }, "Parameters"),
        parameters.map((param) => {
            var _a, _b, _c, _d;
            if (!param.name) {
                return undefined;
            }
            const required = param.required === true && ((_a = param.default_value) === null || _a === void 0 ? void 0 : _a.value) === ''
                ? true
                : undefined;
            let type = 'text';
            switch ((_b = param.default_value) === null || _b === void 0 ? void 0 : _b.type) {
                case 'Bool':
                    type = 'checkbox';
                    break;
                case 'Float':
                case 'Integer':
                    type = 'number';
                    break;
            }
            if (type === 'checkbox') {
                return (react_1.default.createElement("div", { key: param.name },
                    react_1.default.createElement("input", { id: `${param.name}-paramInput`, name: `${param.name}-paramInput`, defaultChecked: (_c = param.default_value) === null || _c === void 0 ? void 0 : _c.value, type: "checkbox" }),
                    react_1.default.createElement("label", { htmlFor: `${param.name}-paramInput` }, `${param.name}${required ? '*' : ''}`),
                    react_1.default.createElement("br", null),
                    react_1.default.createElement("br", null)));
            }
            return (react_1.default.createElement("div", { key: param.name },
                react_1.default.createElement("div", { className: "label-header" },
                    react_1.default.createElement("label", { className: "control-label", htmlFor: `${param.name}-paramInput` }, `${param.name}${param.required ? '*' : ''}`),
                    param.description && (react_1.default.createElement("div", { className: "description-wrapper" },
                        react_1.default.createElement("div", { className: "description-button" }, "?"),
                        react_1.default.createElement("p", { style: {
                                transform: `translate(0px, -10%)`,
                                left: `-${Math.min(param.name.length, Math.min(DIALOG_WIDTH, param.description.length)) - 4}ch`
                            }, className: 'field-description' }, param.description)))),
                react_1.default.createElement("input", { id: `${param.name}-paramInput`, name: `${param.name}-paramInput`, type: type, placeholder: (_d = param.default_value) === null || _d === void 0 ? void 0 : _d.value, "data-form-required": required }),
                react_1.default.createElement("br", null),
                react_1.default.createElement("br", null)));
        }))) : (react_1.default.createElement("div", null));
};
exports.ParameterInputForm = ParameterInputForm;


/***/ }),

/***/ "./lib/PipelineEditorWidget.js":
/*!*************************************!*\
  !*** ./lib/PipelineEditorWidget.js ***!
  \*************************************/
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PipelineEditorFactory = exports.commandIDs = void 0;
const pipeline_editor_1 = __webpack_require__(/*! @elyra/pipeline-editor */ "webpack/sharing/consume/default/@elyra/pipeline-editor/@elyra/pipeline-editor");
const pipeline_services_1 = __webpack_require__(/*! @elyra/pipeline-services */ "webpack/sharing/consume/default/@elyra/pipeline-services/@elyra/pipeline-services?261f");
const services_1 = __webpack_require__(/*! @elyra/services */ "webpack/sharing/consume/default/@elyra/services/@elyra/services");
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const coreutils_1 = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
const docregistry_1 = __webpack_require__(/*! @jupyterlab/docregistry */ "webpack/sharing/consume/default/@jupyterlab/docregistry");
__webpack_require__(/*! carbon-components/css/carbon-components.min.css */ "../../node_modules/carbon-components/css/carbon-components.min.css");
const algorithm_1 = __webpack_require__(/*! @lumino/algorithm */ "webpack/sharing/consume/default/@lumino/algorithm");
const signaling_1 = __webpack_require__(/*! @lumino/signaling */ "webpack/sharing/consume/default/@lumino/signaling");
const react_1 = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const react_toastify_1 = __webpack_require__(/*! react-toastify */ "webpack/sharing/consume/default/react-toastify/react-toastify");
__webpack_require__(/*! react-toastify/dist/ReactToastify.css */ "../../node_modules/react-toastify/dist/ReactToastify.css");
const EmptyPipelineContent_1 = __webpack_require__(/*! ./EmptyPipelineContent */ "./lib/EmptyPipelineContent.js");
const formDialogWidget_1 = __webpack_require__(/*! ./formDialogWidget */ "./lib/formDialogWidget.js");
const pipeline_hooks_1 = __webpack_require__(/*! ./pipeline-hooks */ "./lib/pipeline-hooks.js");
const PipelineExportDialog_1 = __webpack_require__(/*! ./PipelineExportDialog */ "./lib/PipelineExportDialog.js");
const PipelineService_1 = __webpack_require__(/*! ./PipelineService */ "./lib/PipelineService.js");
const PipelineSubmissionDialog_1 = __webpack_require__(/*! ./PipelineSubmissionDialog */ "./lib/PipelineSubmissionDialog.js");
const runtime_utils_1 = __webpack_require__(/*! ./runtime-utils */ "./lib/runtime-utils.js");
const theme_1 = __webpack_require__(/*! ./theme */ "./lib/theme.js");
const index_1 = __webpack_require__(/*! ./index */ "./lib/index.js");
const PIPELINE_CLASS = 'elyra-PipelineEditor';
exports.commandIDs = {
    openPipelineEditor: 'pipeline-editor:open',
    openMetadata: 'elyra-metadata:open',
    openDocManager: 'docmanager:open',
    newDocManager: 'docmanager:new-untitled',
    saveDocManager: 'docmanager:save',
    submitScript: 'script-editor:submit',
    submitNotebook: 'notebook:submit',
    addFileToPipeline: 'pipeline-editor:add-node',
    refreshPalette: 'pipeline-editor:refresh-palette',
    openViewer: 'code-viewer:open'
};
//extend ThemeProvider to accept the same props as original but with children prop as one of them.
const ExtendedThemeProvider = (_a) => {
    var { children } = _a, props = __rest(_a, ["children"]);
    return react_1.default.createElement(pipeline_editor_1.ThemeProvider, Object.assign({}, props), children);
};
const getAllPaletteNodes = (palette) => {
    if ((palette === null || palette === void 0 ? void 0 : palette.categories) === undefined) {
        return [];
    }
    const nodes = [];
    for (const c of palette.categories) {
        if (c.node_types) {
            nodes.push(...c.node_types);
        }
    }
    return nodes;
};
const isRuntimeTypeAvailable = (data, type) => {
    for (const p of data.platforms) {
        if (type === undefined || p.id === type) {
            if (p.configs.length > 0) {
                return true;
            }
        }
    }
    return false;
};
const getDisplayName = (runtimesSchema, type) => {
    if (!type) {
        return undefined;
    }
    const schema = runtimesSchema === null || runtimesSchema === void 0 ? void 0 : runtimesSchema.find((s) => s.runtime_type === type);
    return schema === null || schema === void 0 ? void 0 : schema.title;
};
class PipelineEditorWidget extends apputils_1.ReactWidget {
    constructor(args) {
        super();
        this.args = args;
        let nullPipeline = this.args.context.model.toJSON() === null;
        this.addFileToPipelineSignal = new signaling_1.Signal(this);
        this.refreshPaletteSignal = new signaling_1.Signal(this);
        this.args.context.model.contentChanged.connect(() => {
            if (nullPipeline) {
                nullPipeline = false;
                this.update();
            }
        });
        this.args.context.fileChanged.connect(() => {
            if (this.args.context.model.toJSON() === null) {
                const pipelineJson = (0, index_1.getEmptyPipelineJson)(this.args.defaultRuntimeType);
                this.args.context.model.fromString(JSON.stringify(pipelineJson));
            }
        });
    }
    render() {
        var _a;
        if (this.args.context.model.toJSON() === null) {
            return react_1.default.createElement("div", { className: "elyra-loader" });
        }
        return (react_1.default.createElement(PipelineWrapper, { context: this.args.context, browserFactory: this.args.browserFactory, shell: this.args.shell, commands: this.args.commands, addFileToPipelineSignal: this.addFileToPipelineSignal, refreshPaletteSignal: this.refreshPaletteSignal, widgetId: (_a = this.parent) === null || _a === void 0 ? void 0 : _a.id, settings: this.args.settings, defaultRuntimeType: this.args.defaultRuntimeType, serviceManager: this.args.serviceManager }));
    }
}
const PipelineWrapper = ({ context, browserFactory, shell, commands, addFileToPipelineSignal, refreshPaletteSignal, settings, widgetId }) => {
    var _a, _b, _c, _d, _e;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PipelineEditor API not typed
    const ref = (0, react_1.useRef)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [pipeline, setPipeline] = (0, react_1.useState)(context.model.toJSON());
    const [panelOpen, setPanelOpen] = react_1.default.useState(false);
    const type = (_c = (_b = (_a = pipeline === null || pipeline === void 0 ? void 0 : pipeline.pipelines) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.app_data) === null || _c === void 0 ? void 0 : _c.runtime_type;
    const { data: runtimesSchema, error: runtimesSchemaError } = (0, pipeline_hooks_1.useRuntimesSchema)();
    const doubleClickToOpenProperties = (_d = settings === null || settings === void 0 ? void 0 : settings.composite['doubleClickToOpenProperties']) !== null && _d !== void 0 ? _d : true;
    const runtimeDisplayName = (_e = getDisplayName(runtimesSchema, type)) !== null && _e !== void 0 ? _e : 'Generic';
    const filePersistedRuntimeImages = (0, react_1.useMemo)(() => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const images = [];
        const pipelineDefaultRuntimeImage = (_e = (_d = (_c = (_b = (_a = pipeline === null || pipeline === void 0 ? void 0 : pipeline.pipelines) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.app_data) === null || _c === void 0 ? void 0 : _c.properties) === null || _d === void 0 ? void 0 : _d.pipeline_defaults) === null || _e === void 0 ? void 0 : _e.runtime_image;
        if ((pipelineDefaultRuntimeImage === null || pipelineDefaultRuntimeImage === void 0 ? void 0 : pipelineDefaultRuntimeImage.length) > 0) {
            images.push(pipelineDefaultRuntimeImage);
        }
        const nodes = (_g = (_f = pipeline === null || pipeline === void 0 ? void 0 : pipeline.pipelines) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.nodes;
        if ((nodes === null || nodes === void 0 ? void 0 : nodes.length) > 0) {
            for (const node of nodes) {
                const nodeRuntimeImage = (_j = (_h = node === null || node === void 0 ? void 0 : node.app_data) === null || _h === void 0 ? void 0 : _h.component_parameters) === null || _j === void 0 ? void 0 : _j.runtime_image;
                if ((nodeRuntimeImage === null || nodeRuntimeImage === void 0 ? void 0 : nodeRuntimeImage.length) > 0) {
                    images.push(nodeRuntimeImage);
                }
            }
        }
        return images.map((imageName) => {
            return {
                name: imageName,
                display_name: imageName,
                metadata: {
                    image_name: imageName
                }
            };
        });
    }, [pipeline]);
    const { data: palette, error: paletteError, mutate: mutatePalette } = (0, pipeline_hooks_1.usePalette)(type, filePersistedRuntimeImages);
    (0, react_1.useEffect)(() => {
        const handleMutateSignal = () => {
            mutatePalette === null || mutatePalette === void 0 ? void 0 : mutatePalette();
        };
        refreshPaletteSignal.connect(handleMutateSignal);
        return () => {
            refreshPaletteSignal.disconnect(handleMutateSignal);
        };
    }, [refreshPaletteSignal, mutatePalette]);
    const { data: runtimeImages, error: runtimeImagesError } = (0, pipeline_hooks_1.useRuntimeImages)();
    (0, react_1.useEffect)(() => {
        if ((runtimeImages === null || runtimeImages === void 0 ? void 0 : runtimeImages.length) === 0) {
            ui_components_1.RequestErrors.noMetadataError('runtime image');
        }
    }, [runtimeImages === null || runtimeImages === void 0 ? void 0 : runtimeImages.length]);
    (0, react_1.useEffect)(() => {
        if (paletteError) {
            ui_components_1.RequestErrors.serverError(paletteError).then(() => {
                var _a;
                (_a = shell.currentWidget) === null || _a === void 0 ? void 0 : _a.close();
            });
        }
    }, [paletteError, shell.currentWidget]);
    (0, react_1.useEffect)(() => {
        if (runtimeImagesError) {
            ui_components_1.RequestErrors.serverError(runtimeImagesError).then(() => {
                var _a;
                (_a = shell.currentWidget) === null || _a === void 0 ? void 0 : _a.close();
            });
        }
    }, [runtimeImagesError, shell.currentWidget]);
    (0, react_1.useEffect)(() => {
        if (runtimesSchemaError) {
            ui_components_1.RequestErrors.serverError(runtimesSchemaError).then(() => {
                var _a;
                (_a = shell.currentWidget) === null || _a === void 0 ? void 0 : _a.close();
            });
        }
    }, [runtimesSchemaError, shell.currentWidget]);
    const contextRef = (0, react_1.useRef)(context);
    (0, react_1.useEffect)(() => {
        const currentContext = contextRef.current;
        const changeHandler = () => {
            var _a, _b, _c, _d, _e, _f;
            const pipelineJson = currentContext.model.toJSON();
            // map IDs to display names
            const nodes = (_b = (_a = pipelineJson === null || pipelineJson === void 0 ? void 0 : pipelineJson.pipelines) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.nodes;
            if ((nodes === null || nodes === void 0 ? void 0 : nodes.length) > 0) {
                for (const node of nodes) {
                    if ((_c = node === null || node === void 0 ? void 0 : node.app_data) === null || _c === void 0 ? void 0 : _c.component_parameters) {
                        for (const [key, val] of Object.entries((_d = node === null || node === void 0 ? void 0 : node.app_data) === null || _d === void 0 ? void 0 : _d.component_parameters)) {
                            if (val === null) {
                                node.app_data.component_parameters[key] = undefined;
                            }
                        }
                    }
                }
            }
            // TODO: don't persist this, but this will break things right now
            if ((_f = (_e = pipelineJson === null || pipelineJson === void 0 ? void 0 : pipelineJson.pipelines) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.app_data) {
                if (!pipelineJson.pipelines[0].app_data.properties) {
                    pipelineJson.pipelines[0].app_data.properties = {};
                }
                const pipeline_path = contextRef.current.path;
                const pipeline_name = coreutils_1.PathExt.basename(pipeline_path, coreutils_1.PathExt.extname(pipeline_path));
                pipelineJson.pipelines[0].app_data.properties.name = pipeline_name;
                pipelineJson.pipelines[0].app_data.properties.runtime =
                    runtimeDisplayName;
            }
            setPipeline(pipelineJson);
            setLoading(false);
        };
        currentContext.ready.then(changeHandler);
        currentContext.model.contentChanged.connect(changeHandler);
        return () => {
            currentContext.model.contentChanged.disconnect(changeHandler);
        };
    }, [runtimeDisplayName]);
    const onChange = (0, react_1.useCallback)((pipelineJson) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const isNullOrEmpty = (value) => value === null || value === undefined || value === '';
        const cleanArray = (arr) => {
            const newArray = [];
            for (const item of arr) {
                if (isNullOrEmpty(item)) {
                    continue;
                }
                if (typeof item === 'object') {
                    const itemCopy = JSON.parse(JSON.stringify(item));
                    removeNullValues(itemCopy);
                    newArray.push(itemCopy);
                }
                else {
                    newArray.push(item);
                }
            }
            return newArray;
        };
        const removeNullValues = (data) => {
            if (!data) {
                return;
            }
            for (const key in data) {
                const value = data[key];
                if (isNullOrEmpty(value)) {
                    delete data[key];
                }
                else if (Array.isArray(value)) {
                    data[key] = cleanArray(value);
                }
                else if (typeof value === 'object') {
                    const objCopy = JSON.parse(JSON.stringify(value));
                    removeNullValues(objCopy);
                    data[key] = objCopy;
                }
            }
        };
        // Remove all null values from the pipeline
        for (const node of (_c = (_b = (_a = pipelineJson === null || pipelineJson === void 0 ? void 0 : pipelineJson.pipelines) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.nodes) !== null && _c !== void 0 ? _c : []) {
            removeNullValues((_d = node.app_data) !== null && _d !== void 0 ? _d : {});
        }
        removeNullValues((_j = (_h = (_g = (_f = (_e = pipelineJson === null || pipelineJson === void 0 ? void 0 : pipelineJson.pipelines) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.app_data) === null || _g === void 0 ? void 0 : _g.properties) === null || _h === void 0 ? void 0 : _h.pipeline_defaults) !== null && _j !== void 0 ? _j : {});
        if (contextRef.current.isReady) {
            contextRef.current.model.fromString(JSON.stringify(pipelineJson, null, 2));
        }
    }, []);
    const isDialogAlreadyShowing = (0, react_1.useRef)(false);
    const onError = (0, react_1.useCallback)((error) => {
        if (isDialogAlreadyShowing.current) {
            return; // bail, we are already showing a dialog.
        }
        isDialogAlreadyShowing.current = true;
        if (error instanceof pipeline_editor_1.PipelineOutOfDateError) {
            (0, apputils_1.showDialog)({
                title: 'Migrate pipeline?',
                body: (react_1.default.createElement("p", null,
                    "This pipeline corresponds to an older version of Elyra and needs to be migrated.",
                    react_1.default.createElement("br", null),
                    "Although the pipeline can be further edited and/or submitted after its update,",
                    react_1.default.createElement("br", null),
                    "the migration will not be completed until the pipeline has been saved within the editor.",
                    react_1.default.createElement("br", null),
                    react_1.default.createElement("br", null),
                    "Proceed with migration?")),
                buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.okButton()]
            }).then((result) => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                isDialogAlreadyShowing.current = false;
                if (result.button.accept) {
                    // proceed with migration
                    console.log('migrating pipeline');
                    const pipelineJSON = contextRef.current.model.toJSON();
                    try {
                        const migratedPipeline = (0, pipeline_services_1.migrate)(pipelineJSON, (pipeline) => {
                            // function for updating to relative paths in v2
                            // uses location of filename as expected in v1
                            for (const node of pipeline.nodes) {
                                node.app_data.filename =
                                    PipelineService_1.PipelineService.getPipelineRelativeNodePath(contextRef.current.path, node.app_data.filename);
                            }
                            return pipeline;
                        });
                        contextRef.current.model.fromString(JSON.stringify(migratedPipeline, null, 2));
                    }
                    catch (migrationError) {
                        if (migrationError instanceof pipeline_services_1.ComponentNotFoundError) {
                            (0, apputils_1.showDialog)({
                                title: 'Pipeline migration aborted!',
                                body: (react_1.default.createElement("p", null,
                                    ' ',
                                    "The pipeline you are trying to migrate uses example components, which are not ",
                                    react_1.default.createElement("br", null),
                                    "enabled in your environment. Complete the setup instructions in",
                                    ' ',
                                    react_1.default.createElement("a", { href: "https://elyra.readthedocs.io/en/v4.0.0/user_guide/pipeline-components.html#example-custom-components", target: "_blank", rel: "noreferrer" }, "Example Custom Components"),
                                    ' ',
                                    "and try again.")),
                                buttons: [apputils_1.Dialog.okButton({ label: 'Close' })]
                            }).then(() => {
                                var _a;
                                (_a = shell.currentWidget) === null || _a === void 0 ? void 0 : _a.close();
                            });
                        }
                        else {
                            (0, apputils_1.showDialog)({
                                title: 'Pipeline migration failed!',
                                body: react_1.default.createElement("p", null,
                                    " ",
                                    (migrationError === null || migrationError === void 0 ? void 0 : migrationError.message) || '',
                                    " "),
                                buttons: [apputils_1.Dialog.okButton()]
                            }).then(() => {
                                var _a;
                                (_a = shell.currentWidget) === null || _a === void 0 ? void 0 : _a.close();
                            });
                        }
                    }
                }
                else {
                    (_a = shell.currentWidget) === null || _a === void 0 ? void 0 : _a.close();
                }
            }));
        }
        else {
            (0, apputils_1.showDialog)({
                title: 'Load pipeline failed!',
                body: react_1.default.createElement("p", null,
                    " ",
                    (error === null || error === void 0 ? void 0 : error.message) || '',
                    " "),
                buttons: [apputils_1.Dialog.okButton()]
            }).then(() => {
                var _a;
                isDialogAlreadyShowing.current = false;
                (_a = shell.currentWidget) === null || _a === void 0 ? void 0 : _a.close();
            });
        }
    }, [shell.currentWidget]);
    const onFileRequested = (args) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const pipelineFilePath = contextRef.current.path;
        const contextFilePath = args.filename
            ? PipelineService_1.PipelineService.getWorkspaceRelativeNodePath(pipelineFilePath, args.filename)
            : pipelineFilePath;
        const contextFolderPath = coreutils_1.PathExt.dirname(contextFilePath);
        if ((_a = args.propertyID) === null || _a === void 0 ? void 0 : _a.includes('dependencies')) {
            const res = yield (0, ui_components_1.showBrowseFileDialog)({
                manager: browserFactory.model.manager,
                multiselect: true,
                includeDir: true,
                rootPath: contextFolderPath,
                filter: (model) => {
                    return model.path !== pipelineFilePath ? {} : null;
                }
            });
            if (res.button.accept && ((_b = res.value) === null || _b === void 0 ? void 0 : _b.length)) {
                return res.value;
            }
        }
        else {
            const res = yield (0, ui_components_1.showBrowseFileDialog)({
                manager: browserFactory.model.manager,
                startPath: contextFolderPath,
                filter: (model) => {
                    var _a;
                    if (((_a = args.filters) === null || _a === void 0 ? void 0 : _a.File) === undefined || model.type === 'directory') {
                        return {};
                    }
                    const ext = coreutils_1.PathExt.extname(model.path);
                    return args.filters.File.includes(ext) ? {} : null;
                }
            });
            if (res.button.accept && ((_c = res.value) === null || _c === void 0 ? void 0 : _c.length)) {
                const file = PipelineService_1.PipelineService.getPipelineRelativeNodePath(contextRef.current.path, res.value[0]);
                return [file];
            }
        }
        return undefined;
    });
    const onPropertiesUpdateRequested = (args) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        if (!contextRef.current.path || !((_a = args.component_parameters) === null || _a === void 0 ? void 0 : _a.filename)) {
            return args;
        }
        const path = PipelineService_1.PipelineService.getWorkspaceRelativeNodePath(contextRef.current.path, args.component_parameters.filename);
        const new_env_vars = yield services_1.ContentParser.getEnvVars(path).then((response) => response.map((str) => {
            return { env_var: str };
        }));
        const env_vars = (_c = (_b = args.component_parameters) === null || _b === void 0 ? void 0 : _b.env_vars) !== null && _c !== void 0 ? _c : [];
        const merged_env_vars = [
            ...env_vars,
            ...new_env_vars.filter((new_var) => !env_vars.some((old_var) => {
                return old_var.env_var === new_var.env_var;
            }))
        ];
        return Object.assign(Object.assign({}, args), { component_parameters: Object.assign(Object.assign({}, args.component_parameters), { env_vars: merged_env_vars.filter(Boolean) }) });
    });
    const handleOpenComponentDef = (0, react_1.useCallback)((componentId, componentSource) => {
        // Show error dialog if the component does not exist
        if (!componentId) {
            const dialogBody = [];
            try {
                const componentSourceJson = JSON.parse(componentSource);
                dialogBody.push(`catalog_type: ${componentSourceJson.catalog_type}`);
                for (const [key, value] of Object.entries(componentSourceJson.component_ref)) {
                    dialogBody.push(`${key}: ${value}`);
                }
            }
            catch (_a) {
                dialogBody.push(componentSource);
            }
            return (0, apputils_1.showDialog)({
                title: 'Component not found',
                body: (react_1.default.createElement("p", null,
                    "This node uses a component that is not stored in your component registry.",
                    dialogBody.map((line, i) => (react_1.default.createElement("span", { key: i },
                        react_1.default.createElement("br", null),
                        line))),
                    react_1.default.createElement("br", null),
                    react_1.default.createElement("br", null),
                    react_1.default.createElement("a", { href: "https://elyra.readthedocs.io/en/v4.0.0/user_guide/best-practices-custom-pipeline-components.html#troubleshooting-missing-pipeline-components", target: "_blank", rel: "noreferrer" }, "Learn more..."))),
                buttons: [apputils_1.Dialog.okButton()]
            });
        }
        return PipelineService_1.PipelineService.getComponentDef(type, componentId)
            .then((res) => {
            var _a;
            if (!res) {
                return;
            }
            const nodeDef = getAllPaletteNodes(palette).find((n) => n.id === componentId);
            commands.execute(exports.commandIDs.openViewer, {
                content: res.content,
                mimeType: res.mimeType,
                label: (_a = nodeDef === null || nodeDef === void 0 ? void 0 : nodeDef.label) !== null && _a !== void 0 ? _a : componentId
            });
        })
            .catch((e) => __awaiter(void 0, void 0, void 0, function* () { return yield ui_components_1.RequestErrors.serverError(e); }));
    }, [commands, palette, type]);
    const onDoubleClick = (data) => {
        var _a, _b, _c, _d, _e;
        for (let i = 0; i < data.selectedObjectIds.length; i++) {
            const node = pipeline.pipelines[0].nodes.find((node) => node.id === data.selectedObjectIds[i]);
            const nodeDef = getAllPaletteNodes(palette).find((n) => n.op === (node === null || node === void 0 ? void 0 : node.op));
            if ((_b = (_a = node === null || node === void 0 ? void 0 : node.app_data) === null || _a === void 0 ? void 0 : _a.component_parameters) === null || _b === void 0 ? void 0 : _b.filename) {
                commands.execute(exports.commandIDs.openDocManager, {
                    path: PipelineService_1.PipelineService.getWorkspaceRelativeNodePath(contextRef.current.path, node.app_data.component_parameters.filename)
                });
            }
            else if (nodeDef && !((_d = (_c = nodeDef.app_data) === null || _c === void 0 ? void 0 : _c.parameter_refs) === null || _d === void 0 ? void 0 : _d.filehandler)) {
                handleOpenComponentDef(nodeDef.id, (_e = node === null || node === void 0 ? void 0 : node.app_data) === null || _e === void 0 ? void 0 : _e.component_source);
            }
        }
    };
    const handleSubmission = (0, react_1.useCallback)((actionType) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const pipelineJson = context.model.toJSON();
        // Check that all nodes are valid
        const errorMessages = (0, pipeline_services_1.validate)(JSON.stringify(pipelineJson), getAllPaletteNodes(palette), palette === null || palette === void 0 ? void 0 : palette.properties);
        if (errorMessages && errorMessages.length > 0) {
            let errorMessage = '';
            for (const error of errorMessages) {
                errorMessage += (errorMessage ? '\n' : '') + error.message;
            }
            react_toastify_1.toast.error(`Failed ${actionType}: ${errorMessage}`);
            return;
        }
        if (contextRef.current.model.dirty) {
            const dialogResult = yield (0, apputils_1.showDialog)({
                title: 'This pipeline contains unsaved changes. To submit the pipeline the changes need to be saved.',
                buttons: [
                    apputils_1.Dialog.cancelButton(),
                    apputils_1.Dialog.okButton({ label: 'Save and Submit' })
                ]
            });
            if (dialogResult.button && dialogResult.button.accept === true) {
                yield contextRef.current.save();
            }
            else {
                // Don't proceed if cancel button pressed
                return;
            }
        }
        const pipelineName = coreutils_1.PathExt.basename(contextRef.current.path, coreutils_1.PathExt.extname(contextRef.current.path));
        // TODO: Parallelize this
        const runtimeTypes = yield PipelineService_1.PipelineService.getRuntimeTypes();
        const runtimes = yield PipelineService_1.PipelineService.getRuntimes()
            .then((runtimeList) => {
            return runtimeList === null || runtimeList === void 0 ? void 0 : runtimeList.filter((runtime) => {
                return (!runtime.metadata.runtime_enabled &&
                    !!runtimeTypes.find((r) => runtime.metadata.runtime_type === r.id));
            });
        })
            .catch((error) => __awaiter(void 0, void 0, void 0, function* () {
            yield ui_components_1.RequestErrors.serverError(error);
        }));
        const schema = yield PipelineService_1.PipelineService.getRuntimesSchema().catch((error) => __awaiter(void 0, void 0, void 0, function* () {
            yield ui_components_1.RequestErrors.serverError(error);
        }));
        if (!runtimes) {
            yield ui_components_1.RequestErrors.noMetadataError('runtime');
            return;
        }
        if (!schema) {
            yield ui_components_1.RequestErrors.noMetadataError('schema');
            return;
        }
        const runtimeData = (0, runtime_utils_1.createRuntimeData)({
            schema,
            runtimes,
            allowLocal: actionType === 'run'
        });
        let title = type !== undefined
            ? `${actionType} pipeline for ${runtimeDisplayName}`
            : `${actionType} pipeline`;
        if (actionType === 'export' || type !== undefined) {
            if (!isRuntimeTypeAvailable(runtimeData, type)) {
                const res = yield ui_components_1.RequestErrors.noMetadataError('runtime', `${actionType} pipeline.`, type !== undefined ? runtimeDisplayName : undefined);
                if (res.button.label.includes(PipelineService_1.RUNTIMES_SCHEMASPACE)) {
                    // Open the runtimes widget
                    shell.activateById(`elyra-metadata:${PipelineService_1.RUNTIMES_SCHEMASPACE}`);
                }
                return;
            }
        }
        // Capitalize
        title = title.charAt(0).toUpperCase() + title.slice(1);
        let dialogOptions;
        pipelineJson.pipelines[0].app_data.properties.pipeline_parameters =
            (_a = pipelineJson.pipelines[0].app_data.properties.pipeline_parameters) === null || _a === void 0 ? void 0 : _a.filter((param) => {
                return !!pipelineJson.pipelines[0].nodes.find((node) => {
                    var _a, _b;
                    return (param.name !== '' &&
                        (((_b = (_a = node.app_data.component_parameters) === null || _a === void 0 ? void 0 : _a.pipeline_parameters) === null || _b === void 0 ? void 0 : _b.includes(param.name)) ||
                            (node.app_data.component_parameters &&
                                Object.values(node.app_data.component_parameters).find((property) => property.widget === 'parameter' &&
                                    property.value === param.name))));
                });
            });
        const parameters = pipelineJson === null || pipelineJson === void 0 ? void 0 : pipelineJson.pipelines[0].app_data.properties.pipeline_parameters;
        switch (actionType) {
            case 'run':
                dialogOptions = {
                    title,
                    body: (0, formDialogWidget_1.formDialogWidget)(react_1.default.createElement(PipelineSubmissionDialog_1.PipelineSubmissionDialog, { name: pipelineName, runtimeData: runtimeData, pipelineType: type, parameters: parameters })),
                    buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.okButton()],
                    defaultButton: 1,
                    focusNodeSelector: '#pipeline_name'
                };
                break;
            case 'export':
                dialogOptions = {
                    title,
                    body: (0, formDialogWidget_1.formDialogWidget)(react_1.default.createElement(PipelineExportDialog_1.PipelineExportDialog, { runtimeData: runtimeData, runtimeTypeInfo: runtimeTypes, pipelineType: type, exportName: pipelineName, parameters: parameters })),
                    buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.okButton()],
                    defaultButton: 1,
                    focusNodeSelector: '#runtime_config'
                };
                break;
        }
        const dialogResult = yield (0, ui_components_1.showFormDialog)(dialogOptions);
        if (dialogResult.value === null) {
            // When Cancel is clicked on the dialog, just return
            return;
        }
        // Clean null properties
        for (const node of pipelineJson.pipelines[0].nodes) {
            if (node.app_data.component_parameters.cpu === null) {
                delete node.app_data.component_parameters.cpu;
            }
            if (node.app_data.component_parameters.cpu_limit === null) {
                delete node.app_data.component_parameters.cpu_limit;
            }
            if (node.app_data.component_parameters.memory === null) {
                delete node.app_data.component_parameters.memory;
            }
            if (node.app_data.component_parameters.memory_limit === null) {
                delete node.app_data.component_parameters.memory_limit;
            }
            if (node.app_data.component_parameters.gpu === null) {
                delete node.app_data.component_parameters.gpu;
            }
        }
        const configDetails = (0, runtime_utils_1.getConfigDetails)(runtimeData, dialogResult.value.runtime_config);
        PipelineService_1.PipelineService.setNodePathsRelativeToWorkspace(pipelineJson.pipelines[0], getAllPaletteNodes(palette), contextRef.current.path);
        // Metadata
        pipelineJson.pipelines[0].app_data.name =
            (_b = dialogResult.value.pipeline_name) !== null && _b !== void 0 ? _b : pipelineName;
        pipelineJson.pipelines[0].app_data.source = coreutils_1.PathExt.basename(contextRef.current.path);
        // Pipeline parameter overrides
        for (const paramIndex in parameters !== null && parameters !== void 0 ? parameters : []) {
            const param = parameters[paramIndex];
            if (param.name) {
                let paramOverride = dialogResult.value[`${param.name}-paramInput`];
                if ((((_c = param.default_value) === null || _c === void 0 ? void 0 : _c.type) === 'Integer' ||
                    ((_d = param.default_value) === null || _d === void 0 ? void 0 : _d.type) === 'Float') &&
                    paramOverride !== '') {
                    paramOverride = Number(paramOverride);
                }
                pipelineJson.pipelines[0].app_data.properties.pipeline_parameters[paramIndex].value =
                    paramOverride === '' ? (_e = param.default_value) === null || _e === void 0 ? void 0 : _e.value : paramOverride;
            }
        }
        // Pipeline name
        pipelineJson.pipelines[0].app_data.name =
            (_f = dialogResult.value.pipeline_name) !== null && _f !== void 0 ? _f : pipelineName;
        // Runtime info
        pipelineJson.pipelines[0].app_data.runtime_config =
            (_g = configDetails === null || configDetails === void 0 ? void 0 : configDetails.id) !== null && _g !== void 0 ? _g : null;
        // Export info
        const pipeline_dir = coreutils_1.PathExt.dirname(contextRef.current.path);
        const basePath = pipeline_dir ? `${pipeline_dir}/` : '';
        const exportType = dialogResult.value.pipeline_filetype;
        const exportName = dialogResult.value.export_name;
        const exportPath = `${basePath}${exportName}.${exportType}`;
        switch (actionType) {
            case 'run':
                PipelineService_1.PipelineService.submitPipeline(pipelineJson, (_h = configDetails === null || configDetails === void 0 ? void 0 : configDetails.platform.displayName) !== null && _h !== void 0 ? _h : '').catch((error) => __awaiter(void 0, void 0, void 0, function* () {
                    yield ui_components_1.RequestErrors.serverError(error);
                }));
                break;
            case 'export':
                PipelineService_1.PipelineService.exportPipeline(pipelineJson, exportType, exportPath, dialogResult.value.overwrite).catch((error) => __awaiter(void 0, void 0, void 0, function* () {
                    yield ui_components_1.RequestErrors.serverError(error);
                }));
                break;
        }
    }), [context.model, palette, runtimeDisplayName, type, shell]);
    const handleClearPipeline = (0, react_1.useCallback)(() => __awaiter(void 0, void 0, void 0, function* () {
        return (0, apputils_1.showDialog)({
            title: 'Clear Pipeline',
            body: 'Are you sure you want to clear the pipeline?',
            buttons: [
                apputils_1.Dialog.cancelButton(),
                apputils_1.Dialog.okButton({ label: 'Clear All' }),
                apputils_1.Dialog.okButton({ label: 'Clear Canvas' })
            ]
        }).then((result) => {
            var _a, _b, _c, _d, _e, _f;
            if (result.button.accept) {
                const newPipeline = contextRef.current.model.toJSON();
                if (((_c = (_b = (_a = newPipeline === null || newPipeline === void 0 ? void 0 : newPipeline.pipelines) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.nodes) === null || _c === void 0 ? void 0 : _c.length) > 0) {
                    newPipeline.pipelines[0].nodes = [];
                }
                // remove supernode pipelines
                newPipeline.pipelines = [newPipeline.pipelines[0]];
                // only clear pipeline properties when "Clear All" is selected
                if (result.button.label === 'Clear All') {
                    const pipelineProperties = (_f = (_e = (_d = newPipeline === null || newPipeline === void 0 ? void 0 : newPipeline.pipelines) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.app_data) === null || _f === void 0 ? void 0 : _f.properties;
                    if (pipelineProperties) {
                        // Remove all fields of pipeline properties except for the name/runtime (readonly)
                        newPipeline.pipelines[0].app_data.properties = {
                            name: pipelineProperties.name,
                            runtime: pipelineProperties.runtime
                        };
                    }
                }
                contextRef.current.model.fromJSON(newPipeline);
            }
        });
    }), []);
    const onAction = (0, react_1.useCallback)((args) => {
        switch (args.type) {
            case 'save':
                contextRef.current.save();
                break;
            case 'run':
            case 'export':
                handleSubmission(args.type);
                break;
            case 'clear':
                handleClearPipeline();
                break;
            case 'toggleOpenPanel':
                setPanelOpen(!panelOpen);
                break;
            case 'properties':
                setPanelOpen(true);
                break;
            case 'openRuntimes':
                shell.activateById(`elyra-metadata:${PipelineService_1.RUNTIMES_SCHEMASPACE}`);
                break;
            case 'openRuntimeImages':
                shell.activateById(`elyra-metadata:${PipelineService_1.RUNTIME_IMAGES_SCHEMASPACE}`);
                break;
            case 'openComponentCatalogs':
                shell.activateById(`elyra-metadata:${PipelineService_1.COMPONENT_CATALOGS_SCHEMASPACE}`);
                break;
            case 'openFile':
                if (typeof args.payload !== 'string') {
                    return;
                }
                commands.execute(exports.commandIDs.openDocManager, {
                    path: PipelineService_1.PipelineService.getWorkspaceRelativeNodePath(contextRef.current.path, args.payload)
                });
                break;
            case 'openComponentDef':
                if (!args.payload || typeof args.payload !== 'object') {
                    return;
                }
                handleOpenComponentDef(args.payload.componentId, args.payload.componentSource);
                break;
            default:
                break;
        }
    }, [
        handleSubmission,
        handleClearPipeline,
        panelOpen,
        shell,
        commands,
        handleOpenComponentDef
    ]);
    const toolbar = {
        leftBar: [
            {
                action: 'run',
                label: 'Run Pipeline',
                enable: true
            },
            {
                action: 'save',
                label: 'Save Pipeline',
                enable: true,
                iconEnabled: ui_components_1.IconUtil.encode(ui_components_1.savePipelineIcon),
                iconDisabled: ui_components_1.IconUtil.encode(ui_components_1.savePipelineIcon)
            },
            {
                action: 'export',
                label: 'Export Pipeline',
                enable: true,
                iconEnabled: ui_components_1.IconUtil.encode(ui_components_1.exportPipelineIcon),
                iconDisabled: ui_components_1.IconUtil.encode(ui_components_1.exportPipelineIcon)
            },
            {
                action: 'clear',
                label: 'Clear Pipeline',
                enable: true,
                iconEnabled: ui_components_1.IconUtil.encode(ui_components_1.clearPipelineIcon),
                iconDisabled: ui_components_1.IconUtil.encode(ui_components_1.clearPipelineIcon)
            },
            {
                action: 'openRuntimes',
                label: 'Open Runtimes',
                enable: true,
                iconEnabled: ui_components_1.IconUtil.encode(ui_components_1.runtimesIcon),
                iconDisabled: ui_components_1.IconUtil.encode(ui_components_1.runtimesIcon)
            },
            {
                action: 'openRuntimeImages',
                label: 'Open Runtime Images',
                enable: true,
                iconEnabled: ui_components_1.IconUtil.encode(ui_components_1.containerIcon),
                iconDisabled: ui_components_1.IconUtil.encode(ui_components_1.containerIcon)
            },
            {
                action: 'openComponentCatalogs',
                label: 'Open Component Catalogs',
                enable: true,
                iconEnabled: ui_components_1.IconUtil.encode(ui_components_1.componentCatalogIcon),
                iconDisabled: ui_components_1.IconUtil.encode(ui_components_1.componentCatalogIcon)
            },
            { action: 'undo', label: 'Undo' },
            { action: 'redo', label: 'Redo' },
            { action: 'cut', label: 'Cut' },
            { action: 'copy', label: 'Copy' },
            { action: 'paste', label: 'Paste' },
            { action: 'createAutoComment', label: 'Add Comment', enable: true },
            { action: 'deleteSelectedObjects', label: 'Delete' },
            {
                action: 'arrangeHorizontally',
                label: 'Arrange Horizontally',
                enable: true
            },
            {
                action: 'arrangeVertically',
                label: 'Arrange Vertically',
                enable: true
            }
        ],
        rightBar: [
            {
                action: '',
                label: `Runtime: ${runtimeDisplayName}`,
                incLabelWithIcon: 'before',
                enable: false,
                kind: 'tertiary'
                // TODO: re-add icon
                // iconEnabled: IconUtil.encode(ICON_MAP[type ?? ''] ?? pipelineIcon)
            },
            {
                action: 'toggleOpenPanel',
                label: panelOpen ? 'Close Panel' : 'Open Panel',
                enable: true,
                iconTypeOverride: panelOpen ? 'paletteOpen' : 'paletteClose'
            }
        ]
    };
    const [defaultPosition, setDefaultPosition] = (0, react_1.useState)(10);
    const handleAddFileToPipeline = (0, react_1.useCallback)((location) => {
        var _a;
        const fileBrowser = browserFactory;
        // Only add file to pipeline if it is currently in focus
        if (((_a = shell.currentWidget) === null || _a === void 0 ? void 0 : _a.id) !== widgetId) {
            return;
        }
        let failedAdd = 0;
        let position = 0;
        const missingXY = !location;
        // if either x or y is undefined use the default coordinates
        if (missingXY) {
            position = defaultPosition;
            location = {
                x: 75,
                y: 85
            };
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PipelineEditor API not typed
        (0, algorithm_1.toArray)(fileBrowser.selectedItems()).map((item) => {
            var _a, _b, _c;
            if (PipelineService_1.PipelineService.isSupportedNode(item)) {
                item.op = PipelineService_1.PipelineService.getNodeType(item.path);
                item.path = PipelineService_1.PipelineService.getPipelineRelativeNodePath(contextRef.current.path, item.path);
                item.x = ((_a = location === null || location === void 0 ? void 0 : location.x) !== null && _a !== void 0 ? _a : 0) + position;
                item.y = ((_b = location === null || location === void 0 ? void 0 : location.y) !== null && _b !== void 0 ? _b : 0) + position;
                const success = (_c = ref.current) === null || _c === void 0 ? void 0 : _c.addFile({
                    nodeTemplate: {
                        op: item.op
                    },
                    offsetX: item.x,
                    offsetY: item.y,
                    path: item.path
                });
                if (success) {
                    position += 20;
                }
                else {
                    // handle error
                }
            }
            else {
                failedAdd++;
            }
        });
        // update position if the default coordinates were used
        if (missingXY) {
            setDefaultPosition(position);
        }
        if (failedAdd) {
            return (0, apputils_1.showDialog)({
                title: 'Unsupported File(s)',
                body: 'Only supported files (Notebooks, Python scripts, and R scripts) can be added to a pipeline.',
                buttons: [apputils_1.Dialog.okButton()]
            });
        }
        return;
    }, [browserFactory, defaultPosition, shell, widgetId]);
    const handleDrop = (e) => __awaiter(void 0, void 0, void 0, function* () {
        handleAddFileToPipeline({ x: e.offsetX, y: e.offsetY });
    });
    (0, react_1.useEffect)(() => {
        const handleSignal = () => {
            handleAddFileToPipeline();
        };
        addFileToPipelineSignal.connect(handleSignal);
        return () => {
            addFileToPipelineSignal.disconnect(handleSignal);
        };
    }, [addFileToPipelineSignal, handleAddFileToPipeline]);
    if (loading || palette === undefined) {
        return react_1.default.createElement("div", { className: "elyra-loader" });
    }
    const handleOpenCatalog = () => {
        shell.activateById(`elyra-metadata:${PipelineService_1.COMPONENT_CATALOGS_SCHEMASPACE}`);
    };
    const handleOpenSettings = () => {
        commands.execute('settingeditor:open', { query: 'Pipeline Editor' });
    };
    return (react_1.default.createElement(ExtendedThemeProvider, { theme: theme_1.theme },
        react_1.default.createElement(react_toastify_1.ToastContainer, { position: "bottom-center", autoClose: 30000, hideProgressBar: true, closeOnClick: false, className: "elyra-PipelineEditor-toast", draggable: false, theme: "colored" }),
        react_1.default.createElement(ui_components_1.Dropzone, { onDrop: handleDrop },
            react_1.default.createElement(pipeline_editor_1.PipelineEditor, { ref: ref, palette: palette, pipelineProperties: palette.properties, pipelineParameters: palette.parameters, toolbar: toolbar, pipeline: pipeline, onAction: onAction, onChange: onChange, onDoubleClickNode: doubleClickToOpenProperties ? undefined : onDoubleClick, onError: onError, onFileRequested: onFileRequested, onPropertiesUpdateRequested: onPropertiesUpdateRequested, leftPalette: true }, type === undefined ? (react_1.default.createElement(EmptyPipelineContent_1.EmptyGenericPipeline, { onOpenSettings: handleOpenSettings })) : (react_1.default.createElement(EmptyPipelineContent_1.EmptyPlatformSpecificPipeline, { onOpenCatalog: handleOpenCatalog, onOpenSettings: handleOpenSettings }))))));
};
class PipelineEditorFactory extends docregistry_1.ABCWidgetFactory {
    constructor(options) {
        super(options);
        this.browserFactory = options.browserFactory;
        this.shell = options.shell;
        this.commands = options.commands;
        this.settings = options.settings;
        this.serviceManager = options.serviceManager;
        this.defaultRuntimeType = options.defaultRuntimeType;
    }
    get addFileToPipelineSignal() {
        var _a;
        return (_a = this.content) === null || _a === void 0 ? void 0 : _a.addFileToPipelineSignal;
    }
    get refreshPaletteSignal() {
        var _a;
        return (_a = this.content) === null || _a === void 0 ? void 0 : _a.refreshPaletteSignal;
    }
    createNewWidget(context) {
        // Creates a blank widget with a DocumentWidget wrapper
        const props = {
            shell: this.shell,
            commands: this.commands,
            browserFactory: this.browserFactory,
            context: context,
            settings: this.settings,
            defaultRuntimeType: this.defaultRuntimeType,
            serviceManager: this.serviceManager
        };
        this.content = new PipelineEditorWidget(props);
        const widget = new docregistry_1.DocumentWidget({ content: this.content, context });
        widget.addClass(PIPELINE_CLASS);
        widget.title.icon = ui_components_1.pipelineIcon;
        return widget;
    }
}
exports.PipelineEditorFactory = PipelineEditorFactory;


/***/ }),

/***/ "./lib/PipelineExportDialog.js":
/*!*************************************!*\
  !*** ./lib/PipelineExportDialog.js ***!
  \*************************************/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PipelineExportDialog = void 0;
const React = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const ParameterInputForm_1 = __webpack_require__(/*! ./ParameterInputForm */ "./lib/ParameterInputForm.js");
const RuntimeConfigSelect_1 = __importDefault(__webpack_require__(/*! ./RuntimeConfigSelect */ "./lib/RuntimeConfigSelect.js"));
const FileTypeSelect = ({ fileTypes }) => {
    return (React.createElement(React.Fragment, null,
        React.createElement("label", { htmlFor: "pipeline_filetype" }, "Export Pipeline as:"),
        React.createElement("br", null),
        React.createElement("select", { id: "pipeline_filetype", name: "pipeline_filetype", className: "elyra-form-export-filetype", "data-form-required": true }, fileTypes.map((f) => (React.createElement("option", { key: f.id, value: f.id }, f.display_name))))));
};
const PipelineExportDialog = ({ runtimeData, runtimeTypeInfo, pipelineType, exportName, parameters }) => {
    return (React.createElement("form", { className: "elyra-dialog-form" },
        React.createElement(RuntimeConfigSelect_1.default, { runtimeData: runtimeData, pipelineType: pipelineType }, (platform) => {
            var _a;
            const info = runtimeTypeInfo.find((i) => i.id === platform);
            return React.createElement(FileTypeSelect, { fileTypes: (_a = info === null || info === void 0 ? void 0 : info.export_file_types) !== null && _a !== void 0 ? _a : [] });
        }),
        React.createElement("label", { htmlFor: "export_name" }, "Export Filename:"),
        React.createElement("br", null),
        React.createElement("input", { type: "text", id: "export_name", name: "export_name", defaultValue: exportName, "data-form-required": true }),
        React.createElement("br", null),
        React.createElement("br", null),
        React.createElement("input", { type: "checkbox", className: "elyra-Dialog-checkbox", id: "overwrite", name: "overwrite" }),
        React.createElement("label", { htmlFor: "overwrite" }, "Replace if file already exists"),
        React.createElement("br", null),
        React.createElement("br", null),
        React.createElement(ParameterInputForm_1.ParameterInputForm, { parameters: parameters })));
};
exports.PipelineExportDialog = PipelineExportDialog;


/***/ }),

/***/ "./lib/PipelineService.js":
/*!********************************!*\
  !*** ./lib/PipelineService.js ***!
  \********************************/
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
exports.PipelineService = exports.COMPONENT_CATALOGS_SCHEMASPACE = exports.RUNTIME_IMAGES_SCHEMASPACE = exports.RUNTIMES_SCHEMASPACE = exports.KFP_SCHEMA = void 0;
const services_1 = __webpack_require__(/*! @elyra/services */ "webpack/sharing/consume/default/@elyra/services/@elyra/services");
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const coreutils_1 = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
const React = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
exports.KFP_SCHEMA = 'kfp';
exports.RUNTIMES_SCHEMASPACE = 'runtimes';
exports.RUNTIME_IMAGES_SCHEMASPACE = 'runtime-images';
exports.COMPONENT_CATALOGS_SCHEMASPACE = 'component-catalogs';
var ContentType;
(function (ContentType) {
    ContentType["notebook"] = "execute-notebook-node";
    ContentType["python"] = "execute-python-node";
    ContentType["r"] = "execute-r-node";
    ContentType["other"] = "other";
})(ContentType || (ContentType = {}));
const CONTENT_TYPE_MAPPER = new Map([
    ['.py', ContentType.python],
    ['.ipynb', ContentType.notebook],
    ['.r', ContentType.r]
]);
class PipelineService {
    /**
     * Returns a list of resources corresponding to each active runtime-type.
     */
    static getRuntimeTypes() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield services_1.RequestHandler.makeGetRequest('elyra/pipeline/runtimes/types');
            if (!res) {
                return [];
            }
            return res.runtime_types.sort((a, b) => a.id.localeCompare(b.id));
        });
    }
    /**
     * Returns a list of external runtime configurations available as
     * `runtimes metadata`. This is used to submit the pipeline to be
     * executed on these runtimes.
     */
    static getRuntimes() {
        return __awaiter(this, void 0, void 0, function* () {
            return services_1.MetadataService.getMetadata(exports.RUNTIMES_SCHEMASPACE);
        });
    }
    /**
     * Returns a list of runtime schema
     */
    static getRuntimesSchema() {
        return __awaiter(this, void 0, void 0, function* () {
            return services_1.MetadataService.getSchema(exports.RUNTIMES_SCHEMASPACE).then((schema) => {
                if (!schema) {
                    return;
                }
                return schema;
            });
        });
    }
    /**
     * Return a list of configured container images that are used as runtimes environments
     * to run the pipeline nodes.
     */
    static getRuntimeImages() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let runtimeImages = yield services_1.MetadataService.getMetadata('runtime-images');
                if (!(runtimeImages === null || runtimeImages === void 0 ? void 0 : runtimeImages.length)) {
                    yield ui_components_1.RequestErrors.noMetadataError('runtime image');
                    return;
                }
                runtimeImages = runtimeImages === null || runtimeImages === void 0 ? void 0 : runtimeImages.sort((a, b) => 0 - (a.name > b.name ? -1 : 1));
                const images = {};
                for (const image in runtimeImages) {
                    const imageName = runtimeImages[image].metadata.image_name;
                    images[imageName] = runtimeImages[image].display_name;
                }
                return images;
            }
            catch (error) {
                Promise.reject(error);
                return;
            }
        });
    }
    static getComponentDef() {
        return __awaiter(this, arguments, void 0, function* (type = 'local', componentID) {
            return yield services_1.RequestHandler.makeGetRequest(`elyra/pipeline/components/${type}/${componentID}`);
        });
    }
    /**
     * Submit a request to refresh the component cache. If catalogName is given
     * only refreshes the given catalog
     *
     * @param catalogName
     */
    static refreshComponentsCache(catalogName) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield services_1.RequestHandler.makePutRequest(`elyra/pipeline/components/cache${catalogName ? '/' + catalogName : ''}`, JSON.stringify({ action: 'refresh' }));
        });
    }
    /**
     * Creates a Dialog for passing to makeServerRequest
     */
    static getWaitDialog(title = 'Making server request...', body = 'This may take some time') {
        return new apputils_1.Dialog({
            title: title,
            body: body,
            buttons: [apputils_1.Dialog.okButton()]
        });
    }
    /**
     * Submit the pipeline to be executed on an external runtime (e.g. Kbeflow Pipelines)
     *
     * @param pipeline
     * @param runtimeName
     */
    static submitPipeline(pipeline, runtimeName) {
        return __awaiter(this, void 0, void 0, function* () {
            return services_1.RequestHandler.makePostRequest('elyra/pipeline/schedule', JSON.stringify(pipeline), this.getWaitDialog('Packaging and submitting pipeline ...')).then((response) => __awaiter(this, void 0, void 0, function* () {
                if (!response) {
                    return;
                }
                let dialogTitle;
                let dialogBody;
                if (response['run_url']) {
                    // pipeline executed remotely in a runtime of choice
                    dialogTitle = 'Job submission to ' + runtimeName + ' succeeded';
                    dialogBody = (React.createElement("p", null,
                        response['platform'] === 'APACHE_AIRFLOW' ? (React.createElement("p", null,
                            "Apache Airflow DAG has been pushed to the",
                            ' ',
                            React.createElement("a", { href: response['git_url'], target: "_blank", rel: "noopener noreferrer" }, "Git repository."),
                            React.createElement("br", null))) : null,
                        "Check the status of your job at",
                        ' ',
                        React.createElement("a", { href: response['run_url'], target: "_blank", rel: "noopener noreferrer" }, "Run Details."),
                        response['object_storage_path'] !== null ? (React.createElement("p", null,
                            "The results and outputs are in the",
                            ' ',
                            response['object_storage_path'],
                            " working directory in",
                            ' ',
                            React.createElement("a", { href: response['object_storage_url'], target: "_blank", rel: "noopener noreferrer" }, "object storage"),
                            ".")) : null,
                        React.createElement("br", null)));
                }
                else {
                    // pipeline executed in-place locally
                    dialogTitle = 'Job execution succeeded';
                    dialogBody = (React.createElement("p", null, "Your job has been executed in-place in your local environment."));
                }
                yield (0, apputils_1.showDialog)({
                    title: dialogTitle,
                    body: dialogBody,
                    buttons: [apputils_1.Dialog.okButton()]
                });
            }));
        });
    }
    /**
     * Export a pipeline to different formats (e.g. DSL, YAML, etc). These formats
     * are understood by a given runtime.
     *
     * @param pipeline
     * @param pipeline_export_format
     * @param pipeline_export_path
     * @param overwrite
     */
    static exportPipeline(pipeline, pipeline_export_format, pipeline_export_path, overwrite) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Exporting pipeline to [' + pipeline_export_format + '] format');
            console.log('Overwriting existing file: ' + overwrite);
            const body = {
                pipeline: pipeline,
                export_format: pipeline_export_format,
                export_path: pipeline_export_path,
                overwrite: overwrite
            };
            return services_1.RequestHandler.makePostRequest('elyra/pipeline/export', JSON.stringify(body), this.getWaitDialog('Generating pipeline artifacts ...')).then((response) => __awaiter(this, void 0, void 0, function* () {
                if (!response) {
                    return;
                }
                yield (0, apputils_1.showDialog)({
                    title: 'Pipeline export succeeded',
                    body: React.createElement("p", null,
                        "Exported file: ",
                        response.export_path,
                        " "),
                    buttons: [apputils_1.Dialog.okButton()]
                });
            }));
        });
    }
    static getNodeType(filepath) {
        const extension = coreutils_1.PathExt.extname(filepath);
        const type = CONTENT_TYPE_MAPPER.get(extension);
        // TODO: throw error when file extension is not supported?
        return type;
    }
    /**
     * Check if a given file is allowed to be added to the pipeline
     * @param item
     */
    static isSupportedNode(file) {
        if (PipelineService.getNodeType(file.path)) {
            return true;
        }
        else {
            return false;
        }
    }
    static getPipelineRelativeNodePath(pipelinePath, nodePath) {
        const relativePath = coreutils_1.PathExt.relative(coreutils_1.PathExt.dirname(pipelinePath), nodePath);
        return relativePath;
    }
    static getWorkspaceRelativeNodePath(pipelinePath, nodePath) {
        // since resolve returns an "absolute" path we need to strip off the leading '/'
        const workspacePath = coreutils_1.PathExt.resolve(coreutils_1.PathExt.dirname(pipelinePath), nodePath);
        return workspacePath;
    }
    static setNodePathsRelativeToWorkspace(pipeline, paletteNodes, pipelinePath) {
        var _a, _b, _c;
        for (const node of pipeline.nodes) {
            const nodeDef = paletteNodes.find((n) => {
                return n.op === node.op;
            });
            const parameters = (_a = nodeDef === null || nodeDef === void 0 ? void 0 : nodeDef.app_data.properties) === null || _a === void 0 ? void 0 : _a.properties.component_parameters.properties;
            for (const param in parameters) {
                if (((_b = parameters[param].uihints) === null || _b === void 0 ? void 0 : _b['ui:widget']) === 'file') {
                    node.app_data.component_parameters[param] =
                        this.getWorkspaceRelativeNodePath(pipelinePath, node.app_data.component_parameters[param]);
                }
                else if (((_c = node.app_data.component_parameters[param]) === null || _c === void 0 ? void 0 : _c.widget) === 'file') {
                    node.app_data.component_parameters[param].value =
                        this.getWorkspaceRelativeNodePath(pipelinePath, node.app_data.component_parameters[param].value);
                }
            }
        }
        return pipeline;
    }
}
exports.PipelineService = PipelineService;


/***/ }),

/***/ "./lib/PipelineSubmissionDialog.js":
/*!*****************************************!*\
  !*** ./lib/PipelineSubmissionDialog.js ***!
  \*****************************************/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PipelineSubmissionDialog = void 0;
const React = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const ParameterInputForm_1 = __webpack_require__(/*! ./ParameterInputForm */ "./lib/ParameterInputForm.js");
const RuntimeConfigSelect_1 = __importDefault(__webpack_require__(/*! ./RuntimeConfigSelect */ "./lib/RuntimeConfigSelect.js"));
const PipelineSubmissionDialog = ({ name, runtimeData, pipelineType, parameters }) => {
    return (React.createElement("form", { className: "elyra-dialog-form" },
        React.createElement("label", { htmlFor: "pipeline_name" }, "Pipeline Name:"),
        React.createElement("br", null),
        React.createElement("input", { type: "text", id: "pipeline_name", name: "pipeline_name", defaultValue: name, "data-form-required": true }),
        React.createElement("br", null),
        React.createElement("br", null),
        React.createElement(RuntimeConfigSelect_1.default, { runtimeData: runtimeData, pipelineType: pipelineType }),
        React.createElement(ParameterInputForm_1.ParameterInputForm, { parameters: parameters })));
};
exports.PipelineSubmissionDialog = PipelineSubmissionDialog;


/***/ }),

/***/ "./lib/RuntimeConfigSelect.js":
/*!************************************!*\
  !*** ./lib/RuntimeConfigSelect.js ***!
  \************************************/
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
const React = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const RUN_LOCALLY_ID = '__elyra_local__';
const RuntimeConfigSelect = ({ runtimeData: { platforms, allowLocal }, pipelineType, children }) => {
    var _a, _b, _c;
    const filteredPlatforms = platforms.filter((p) => p.configs.length > 0);
    if (allowLocal) {
        filteredPlatforms.unshift({
            id: RUN_LOCALLY_ID,
            displayName: 'Run in-place locally',
            configs: []
        });
    }
    // NOTE: platform is only selectable if pipelineType is undefined
    const [platform, setPlatform] = React.useState(pipelineType !== null && pipelineType !== void 0 ? pipelineType : (_a = filteredPlatforms[0]) === null || _a === void 0 ? void 0 : _a.id);
    const handleChange = (e) => {
        setPlatform(e.target.value);
    };
    const configs = (_c = (_b = filteredPlatforms.find((p) => p.id === platform)) === null || _b === void 0 ? void 0 : _b.configs) !== null && _c !== void 0 ? _c : [];
    configs.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return (React.createElement(React.Fragment, null,
        !pipelineType && (React.createElement("div", null,
            React.createElement("label", { htmlFor: "runtime_platform" }, "Runtime Platform:"),
            React.createElement("br", null),
            React.createElement("select", { id: "runtime_platform", name: "runtime_platform", className: "elyra-form-runtime-platform", value: platform, onChange: handleChange }, filteredPlatforms.map((p) => (React.createElement("option", { key: p.id, value: p.id }, p.displayName)))))),
        React.createElement("div", { style: { display: platform === RUN_LOCALLY_ID ? 'none' : 'block' } },
            React.createElement("label", { htmlFor: "runtime_config" }, "Runtime Configuration:"),
            React.createElement("br", null),
            React.createElement("select", { id: "runtime_config", name: "runtime_config", className: "elyra-form-runtime-config" }, configs.map((c) => (React.createElement("option", { key: c.id, value: c.id }, c.displayName))))), children === null || children === void 0 ? void 0 :
        children(platform)));
};
exports["default"] = RuntimeConfigSelect;


/***/ }),

/***/ "./lib/RuntimeImagesWidget.js":
/*!************************************!*\
  !*** ./lib/RuntimeImagesWidget.js ***!
  \************************************/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RuntimeImagesWidget = exports.RUNTIME_IMAGES_SCHEMASPACE = void 0;
const metadata_common_1 = __webpack_require__(/*! @elyra/metadata-common */ "webpack/sharing/consume/default/@elyra/metadata-common/@elyra/metadata-common");
const react_1 = __importDefault(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
exports.RUNTIME_IMAGES_SCHEMASPACE = 'runtime-images';
const RUNTIME_IMAGES_CLASS = 'elyra-metadata-runtime-images';
const getLinkFromImageName = (imageName) => {
    let hostname = '';
    const fqinParts = imageName.split('/');
    if (fqinParts[0].includes('.') ||
        fqinParts[0].includes(':') ||
        fqinParts[0].includes('localhost')) {
        hostname = fqinParts[0];
        imageName = fqinParts.slice(1).join('/');
    }
    if (!hostname || hostname.includes('docker.io')) {
        hostname = 'hub.docker.com/r';
    }
    const imageRepo = imageName.split(':')[0];
    return `https://${hostname}/${imageRepo}`;
};
/**
 * A React Component for displaying the runtime images list.
 */
class RuntimeImagesDisplay extends metadata_common_1.MetadataDisplay {
    renderExpandableContent(metadata) {
        const imageName = metadata.metadata.image_name;
        return (react_1.default.createElement("div", null,
            react_1.default.createElement("h6", null, "Container Image"),
            react_1.default.createElement("a", { href: getLinkFromImageName(imageName), target: "_blank", rel: "noreferrer noopener" }, imageName)));
    }
}
/**
 * A widget for displaying runtime images.
 */
class RuntimeImagesWidget extends metadata_common_1.MetadataWidget {
    constructor(props) {
        super(props);
    }
    renderDisplay(metadata) {
        if (Array.isArray(metadata) && !metadata.length) {
            // Empty metadata
            return (react_1.default.createElement("div", null,
                react_1.default.createElement("br", null),
                react_1.default.createElement("h6", { className: "elyra-no-metadata-msg" },
                    "Click the + button to add ",
                    this.props.display_name.toLowerCase())));
        }
        return (react_1.default.createElement(RuntimeImagesDisplay, { metadata: metadata, updateMetadata: this.updateMetadata, openMetadataEditor: this.openMetadataEditor, schemaspace: exports.RUNTIME_IMAGES_SCHEMASPACE, sortMetadata: true, className: RUNTIME_IMAGES_CLASS, labelName: () => {
                return 'runtime image';
            } }));
    }
}
exports.RuntimeImagesWidget = RuntimeImagesWidget;


/***/ }),

/***/ "./lib/RuntimesWidget.js":
/*!*******************************!*\
  !*** ./lib/RuntimesWidget.js ***!
  \*******************************/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RuntimesWidget = void 0;
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
const metadata_common_1 = __webpack_require__(/*! @elyra/metadata-common */ "webpack/sharing/consume/default/@elyra/metadata-common/@elyra/metadata-common");
const services_1 = __webpack_require__(/*! @elyra/services */ "webpack/sharing/consume/default/@elyra/services/@elyra/services");
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const react_1 = __importDefault(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const PipelineService_1 = __webpack_require__(/*! ./PipelineService */ "./lib/PipelineService.js");
const RUNTIMES_METADATA_CLASS = 'elyra-metadata-runtimes';
const addTrailingSlash = (url) => {
    return url.endsWith('/') ? url : url + '/';
};
const getGithubURLFromAPI = (apiEndpoint) => {
    // For Enterprise Server the api is located at <hostname>/api/
    let baseURL = new URL(apiEndpoint).origin;
    // For Github.com and Github AE the api is located at api.<hostname>
    baseURL = baseURL.replace('api.', '');
    return addTrailingSlash(baseURL);
};
/**
 * A React Component for displaying the runtimes list.
 */
class RuntimesDisplay extends metadata_common_1.MetadataDisplay {
    renderExpandableContent(metadata) {
        var _a, _b;
        let apiEndpoint = addTrailingSlash(metadata.metadata.api_endpoint);
        let cosEndpoint = addTrailingSlash(metadata.metadata.cos_endpoint);
        let githubRepoElement = null;
        let metadata_props = null;
        for (const schema of (_a = this.props.schemas) !== null && _a !== void 0 ? _a : []) {
            if (schema.name === metadata.schema_name) {
                const metadata = (_b = schema.properties) === null || _b === void 0 ? void 0 : _b.metadata;
                metadata_props = metadata === null || metadata === void 0 ? void 0 : metadata.properties;
            }
        }
        if (metadata.schema_name === 'airflow' && metadata_props) {
            const githubRepoUrl = getGithubURLFromAPI(metadata.metadata.github_api_endpoint) +
                metadata.metadata.github_repo +
                '/tree/' +
                metadata.metadata.github_branch +
                '/';
            githubRepoElement = (react_1.default.createElement("span", null,
                react_1.default.createElement("h6", null, metadata_props.github_repo.title),
                react_1.default.createElement("a", { href: githubRepoUrl, target: "_blank", rel: "noreferrer noopener" }, githubRepoUrl),
                react_1.default.createElement("br", null),
                react_1.default.createElement("br", null)));
        }
        if (metadata.schema_name === 'kfp') {
            if (metadata.metadata.public_api_endpoint) {
                // user specified a public API endpoint. use it instead of the API endpoint
                apiEndpoint = addTrailingSlash(metadata.metadata.public_api_endpoint);
            }
        }
        if (metadata.metadata.public_cos_endpoint) {
            // user specified a public COS endpoint. use it instead of the API endpoint
            cosEndpoint = addTrailingSlash(metadata.metadata.public_cos_endpoint);
        }
        return (react_1.default.createElement("div", null,
            react_1.default.createElement("h6", null, metadata_props ? metadata_props.api_endpoint.title : 'API Endpoint'),
            react_1.default.createElement("a", { href: apiEndpoint, target: "_blank", rel: "noreferrer noopener" }, apiEndpoint),
            react_1.default.createElement("br", null),
            react_1.default.createElement("br", null),
            githubRepoElement,
            react_1.default.createElement("h6", null, metadata_props
                ? metadata_props.cos_endpoint.title
                : 'Cloud Object Storage'),
            react_1.default.createElement("a", { href: cosEndpoint, target: "_blank", rel: "noreferrer noopener" }, cosEndpoint)));
    }
}
/**
 * A widget for displaying runtimes.
 */
class RuntimesWidget extends metadata_common_1.MetadataWidget {
    constructor(props) {
        super(props);
        this.runtimeTypes = [];
        this.getSchemaTitle = (metadata) => {
            var _a;
            if (this.schemas) {
                for (const schema of this.schemas) {
                    if (schema.name === metadata.schema_name) {
                        return (_a = schema.title) !== null && _a !== void 0 ? _a : '';
                    }
                }
            }
            return 'runtime configuration';
        };
    }
    fetchMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield PipelineService_1.PipelineService.getRuntimes().catch((error) => __awaiter(this, void 0, void 0, function* () {
                yield ui_components_1.RequestErrors.serverError(error);
                return [];
            }));
        });
    }
    getSchemas() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const schemas = yield services_1.MetadataService.getSchema(this.props.schemaspace);
                if (!schemas) {
                    return;
                }
                this.runtimeTypes = yield PipelineService_1.PipelineService.getRuntimeTypes();
                const sortedSchema = schemas.sort((a, b) => { var _a, _b; return ((_a = a.title) !== null && _a !== void 0 ? _a : '').localeCompare((_b = b.title) !== null && _b !== void 0 ? _b : ''); });
                this.schemas = sortedSchema.filter((schema) => {
                    const runtimeSchema = schema;
                    return !!this.runtimeTypes.find((r) => r.id === runtimeSchema.runtime_type && r.runtime_enabled);
                });
                if ((_b = (_a = this.schemas) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 > 1) {
                    for (const schema of (_c = this.schemas) !== null && _c !== void 0 ? _c : []) {
                        this.props.app.contextMenu.addItem({
                            selector: `#${this.props.schemaspace} .elyra-metadataHeader-addButton`,
                            command: 'elyra-metadata-editor:open',
                            args: {
                                onSave: this.updateMetadata,
                                schemaspace: this.props.schemaspace,
                                schema: schema.name,
                                title: schema.title,
                                titleContext: this.props.titleContext,
                                appendToTitle: this.props.appendToTitle
                            }
                        });
                    }
                }
                this.update();
            }
            catch (error) {
                yield ui_components_1.RequestErrors.serverError(error);
            }
        });
    }
    addMetadata(schema, titleContext) {
        this.openMetadataEditor({
            onSave: this.updateMetadata,
            schemaspace: this.props.schemaspace,
            schema: schema,
            titleContext: titleContext
        });
    }
    renderDisplay(metadata) {
        if (Array.isArray(metadata) && !metadata.length) {
            // Empty metadata
            return (react_1.default.createElement("div", null,
                react_1.default.createElement("br", null),
                react_1.default.createElement("h6", { className: "elyra-no-metadata-msg" },
                    "Click the + button to add ",
                    this.props.display_name.toLowerCase())));
        }
        const filteredMetadata = metadata.filter((m) => {
            return !!this.runtimeTypes.find((r) => { var _a; return ((_a = m.metadata) === null || _a === void 0 ? void 0 : _a.runtime_type) === r.id; });
        });
        return (react_1.default.createElement(RuntimesDisplay, { metadata: filteredMetadata, updateMetadata: this.updateMetadata, openMetadataEditor: this.openMetadataEditor, schemaspace: PipelineService_1.RUNTIMES_SCHEMASPACE, sortMetadata: true, schemas: this.schemas, className: RUNTIMES_METADATA_CLASS, labelName: this.getSchemaTitle, titleContext: this.props.titleContext, appendToTitle: this.props.appendToTitle }));
    }
}
exports.RuntimesWidget = RuntimesWidget;


/***/ }),

/***/ "./lib/SubmitFileButtonExtension.js":
/*!******************************************!*\
  !*** ./lib/SubmitFileButtonExtension.js ***!
  \******************************************/
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SubmitFileButtonExtension = void 0;
const services_1 = __webpack_require__(/*! @elyra/services */ "webpack/sharing/consume/default/@elyra/services/@elyra/services");
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const coreutils_1 = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
const ui_components_2 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const React = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const FileSubmissionDialog_1 = __webpack_require__(/*! ./FileSubmissionDialog */ "./lib/FileSubmissionDialog.js");
const formDialogWidget_1 = __webpack_require__(/*! ./formDialogWidget */ "./lib/formDialogWidget.js");
const PipelineService_1 = __webpack_require__(/*! ./PipelineService */ "./lib/PipelineService.js");
const runtime_utils_1 = __webpack_require__(/*! ./runtime-utils */ "./lib/runtime-utils.js");
const utils_1 = __importDefault(__webpack_require__(/*! ./utils */ "./lib/utils.js"));
/**
 * Submit file button extension
 *  - Attach button to editor toolbar and launch a dialog requesting
 *  information about the remote location to where submit the file
 *  for execution
 */
class SubmitFileButtonExtension {
    constructor() {
        this.showWidget = (document) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { context } = document;
            if (context.model.dirty) {
                const dialogResult = yield (0, apputils_1.showDialog)({
                    title: 'This file contains unsaved changes. To run the file as pipeline the changes need to be saved.',
                    buttons: [
                        apputils_1.Dialog.cancelButton(),
                        apputils_1.Dialog.okButton({ label: 'Save and Submit' })
                    ]
                });
                if (dialogResult.button.accept === false) {
                    return;
                }
                yield context.save();
            }
            try {
                const env = yield services_1.ContentParser.getEnvVars(context.path);
                const runtimeTypes = yield PipelineService_1.PipelineService.getRuntimeTypes();
                const runtimes = yield PipelineService_1.PipelineService.getRuntimes().then((runtimeList) => {
                    return runtimeList === null || runtimeList === void 0 ? void 0 : runtimeList.filter((runtime) => {
                        return (!runtime.metadata.runtime_enabled &&
                            !!runtimeTypes.find((r) => runtime.metadata.runtime_type === r.id));
                    });
                });
                if (!runtimes) {
                    yield ui_components_1.RequestErrors.noMetadataError('runtime');
                    return;
                }
                const images = yield PipelineService_1.PipelineService.getRuntimeImages();
                const schema = yield PipelineService_1.PipelineService.getRuntimesSchema();
                if (!schema) {
                    yield ui_components_1.RequestErrors.noMetadataError('schema');
                    return;
                }
                if (!images) {
                    yield ui_components_1.RequestErrors.noMetadataError('runtime images');
                    return;
                }
                const runtimeData = (0, runtime_utils_1.createRuntimeData)({ schema, runtimes });
                if (!runtimeData.platforms.find((p) => p.configs.length > 0)) {
                    const res = yield ui_components_1.RequestErrors.noMetadataError('runtime', `run file as pipeline.`);
                    if (res.button.label.includes(PipelineService_1.RUNTIMES_SCHEMASPACE)) {
                        // Open the runtimes widget
                        (_a = utils_1.default.getLabShell(document)) === null || _a === void 0 ? void 0 : _a.activateById(`elyra-metadata:${PipelineService_1.RUNTIMES_SCHEMASPACE}`);
                    }
                    return;
                }
                let dependencyFileExtension = coreutils_1.PathExt.extname(context.path);
                if (dependencyFileExtension === '.ipynb') {
                    dependencyFileExtension = '.py';
                }
                const dialogOptions = {
                    title: 'Run file as pipeline',
                    body: (0, formDialogWidget_1.formDialogWidget)(React.createElement(FileSubmissionDialog_1.FileSubmissionDialog, { env: env, dependencyFileExtension: dependencyFileExtension, images: images, runtimeData: runtimeData })),
                    buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.okButton()]
                };
                const dialogResult = yield (0, ui_components_1.showFormDialog)(dialogOptions);
                if (dialogResult.value === null) {
                    // When Cancel is clicked on the dialog, just return
                    return;
                }
                const _c = dialogResult.value, { runtime_config, framework, cpu, cpu_limit, gpu, memory, memory_limit, dependency_include, dependencies } = _c, envObject = __rest(_c, ["runtime_config", "framework", "cpu", "cpu_limit", "gpu", "memory", "memory_limit", "dependency_include", "dependencies"]);
                const configDetails = (0, runtime_utils_1.getConfigDetails)(runtimeData, runtime_config);
                // prepare file submission details
                const pipeline = utils_1.default.generateSingleFilePipeline(context.path, configDetails, framework, dependency_include ? dependencies.split(',') : undefined, envObject, cpu, cpu_limit, gpu, memory, memory_limit);
                PipelineService_1.PipelineService.submitPipeline(pipeline, (_b = configDetails === null || configDetails === void 0 ? void 0 : configDetails.platform.displayName) !== null && _b !== void 0 ? _b : '');
            }
            catch (error) {
                yield ui_components_1.RequestErrors.serverError(error);
            }
        });
    }
    createNew(editor) {
        // Create the toolbar button
        const submitFileButton = new ui_components_2.ToolbarButton({
            label: 'Run as Pipeline',
            onClick: () => this.showWidget(editor),
            tooltip: 'Run file as batch'
        });
        // Add the toolbar button to the editor
        editor.toolbar.insertItem(10, 'submitFile', submitFileButton);
        // The ToolbarButton class implements `IDisposable`, so the
        // button *is* the extension for the purposes of this method.
        return submitFileButton;
    }
}
exports.SubmitFileButtonExtension = SubmitFileButtonExtension;


/***/ }),

/***/ "./lib/formDialogWidget.js":
/*!*********************************!*\
  !*** ./lib/formDialogWidget.js ***!
  \*********************************/
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
exports.formDialogWidget = void 0;
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const messaging_1 = __webpack_require__(/*! @lumino/messaging */ "webpack/sharing/consume/default/@lumino/messaging");
const widgets_1 = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
const formDialogWidget = (dialogComponent) => {
    const widget = apputils_1.ReactWidget.create(dialogComponent);
    // Immediately update the body even though it has not yet attached in
    // order to trigger a render of the DOM nodes from the React element.
    messaging_1.MessageLoop.sendMessage(widget, widgets_1.Widget.Msg.UpdateRequest);
    widget.getValue = () => {
        var _a;
        const form = widget.node.querySelector('form');
        const formValues = {};
        for (const element of Object.values((_a = form === null || form === void 0 ? void 0 : form.elements) !== null && _a !== void 0 ? _a : [])) {
            switch (element.type) {
                case 'checkbox':
                    formValues[element.name] = element.checked;
                    break;
                default:
                    formValues[element.name] = element.value;
                    break;
            }
        }
        return formValues;
    };
    return widget;
};
exports.formDialogWidget = formDialogWidget;


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
exports.getEmptyPipelineJson = void 0;
const pipeline_editor_1 = __webpack_require__(/*! @elyra/pipeline-editor */ "webpack/sharing/consume/default/@elyra/pipeline-editor/@elyra/pipeline-editor");
const services_1 = __webpack_require__(/*! @elyra/services */ "webpack/sharing/consume/default/@elyra/services/@elyra/services");
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const application_1 = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const filebrowser_1 = __webpack_require__(/*! @jupyterlab/filebrowser */ "webpack/sharing/consume/default/@jupyterlab/filebrowser");
const launcher_1 = __webpack_require__(/*! @jupyterlab/launcher */ "webpack/sharing/consume/default/@jupyterlab/launcher");
const mainmenu_1 = __webpack_require__(/*! @jupyterlab/mainmenu */ "webpack/sharing/consume/default/@jupyterlab/mainmenu");
const settingregistry_1 = __webpack_require__(/*! @jupyterlab/settingregistry */ "webpack/sharing/consume/default/@jupyterlab/settingregistry");
const ui_components_2 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const ComponentCatalogsWidget_1 = __webpack_require__(/*! ./ComponentCatalogsWidget */ "./lib/ComponentCatalogsWidget.js");
const PipelineEditorWidget_1 = __webpack_require__(/*! ./PipelineEditorWidget */ "./lib/PipelineEditorWidget.js");
const PipelineService_1 = __webpack_require__(/*! ./PipelineService */ "./lib/PipelineService.js");
const RuntimeImagesWidget_1 = __webpack_require__(/*! ./RuntimeImagesWidget */ "./lib/RuntimeImagesWidget.js");
const RuntimesWidget_1 = __webpack_require__(/*! ./RuntimesWidget */ "./lib/RuntimesWidget.js");
const SubmitFileButtonExtension_1 = __webpack_require__(/*! ./SubmitFileButtonExtension */ "./lib/SubmitFileButtonExtension.js");
__webpack_require__(/*! ../style/index.css */ "./style/index.css");
const PIPELINE_EDITOR = 'Pipeline Editor';
const PIPELINE = 'pipeline';
const PIPELINE_EDITOR_NAMESPACE = 'elyra-pipeline-editor-extension';
const PLUGIN_ID = '@elyra/pipeline-editor-extension:plugin';
const createRemoteIcon = (_a) => __awaiter(void 0, [_a], void 0, function* ({ name, url }) {
    const svgstr = yield services_1.RequestHandler.makeServerRequest(url, {
        method: 'GET',
        type: 'text'
    });
    if (!svgstr) {
        throw new Error(`Failed to fetch icon from ${url}`);
    }
    return new ui_components_2.LabIcon({ name, svgstr });
});
const getEmptyPipelineJson = (runtime_type) => {
    return {
        doc_type: 'pipeline',
        version: '3.0',
        json_schema: 'http://api.dataplatform.ibm.com/schemas/common-pipeline/pipeline-flow/pipeline-flow-v3-schema.json',
        id: 'elyra-auto-generated-pipeline',
        primary_pipeline: 'primary',
        pipelines: [
            {
                id: 'primary',
                nodes: [],
                app_data: {
                    ui_data: {
                        comments: []
                    },
                    version: pipeline_editor_1.PIPELINE_CURRENT_VERSION,
                    runtime_type
                },
                runtime_ref: ''
            }
        ],
        schemas: []
    };
};
exports.getEmptyPipelineJson = getEmptyPipelineJson;
/**
 * Initialization data for the pipeline-editor-extension extension.
 */
const extension = {
    id: PIPELINE,
    autoStart: true,
    requires: [
        apputils_1.ICommandPalette,
        launcher_1.ILauncher,
        filebrowser_1.IDefaultFileBrowser,
        application_1.ILayoutRestorer,
        mainmenu_1.IMainMenu,
        settingregistry_1.ISettingRegistry
    ],
    activate: (app, palette, launcher, browserFactory, restorer, menu, registry) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Elyra - pipeline-editor extension is activated!');
        // Fetch the initial state of the settings.
        const settings = yield registry.load(PLUGIN_ID).catch((error) => {
            console.log(error);
            return undefined;
        });
        PipelineService_1.PipelineService.getRuntimeTypes()
            .then((types) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const filteredTypes = types.filter((t) => t.runtime_enabled);
            const promises = filteredTypes.map((t) => __awaiter(void 0, void 0, void 0, function* () {
                return Object.assign(Object.assign({}, t), { icon: yield createRemoteIcon({
                        name: `elyra:platform:${t.id}`,
                        url: t.icon
                    }) });
            }));
            const resolvedTypes = (yield Promise.all(promises));
            // Set up new widget Factory for .pipeline files
            const pipelineEditorFactory = new PipelineEditorWidget_1.PipelineEditorFactory({
                name: PIPELINE_EDITOR,
                fileTypes: [PIPELINE],
                defaultFor: [PIPELINE],
                shell: app.shell,
                commands: app.commands,
                browserFactory: browserFactory,
                serviceManager: app.serviceManager,
                settings: settings,
                defaultRuntimeType: (_a = resolvedTypes[0]) === null || _a === void 0 ? void 0 : _a.id
            });
            // Add the default behavior of opening the widget for .pipeline files
            app.docRegistry.addFileType({
                name: PIPELINE,
                displayName: 'Pipeline',
                extensions: ['.pipeline'],
                icon: ui_components_1.pipelineIcon
            }, ['JSON']);
            app.docRegistry.addWidgetFactory(pipelineEditorFactory);
            const tracker = new apputils_1.WidgetTracker({
                namespace: PIPELINE_EDITOR_NAMESPACE
            });
            pipelineEditorFactory.widgetCreated.connect((_sender, widget) => {
                void tracker.add(widget);
                // Notify the widget tracker if restore data needs to update
                widget.context.pathChanged.connect(() => {
                    void tracker.save(widget);
                });
            });
            // Handle state restoration
            void restorer.restore(tracker, {
                command: PipelineEditorWidget_1.commandIDs.openDocManager,
                args: (widget) => ({
                    path: widget.context.path,
                    factory: PIPELINE_EDITOR
                }),
                name: (widget) => widget.context.path
            });
            // Add command to add file to pipeline
            const addFileToPipelineCommand = PipelineEditorWidget_1.commandIDs.addFileToPipeline;
            app.commands.addCommand(addFileToPipelineCommand, {
                label: 'Add File to Pipeline',
                icon: ui_components_2.addIcon,
                execute: (args) => {
                    var _a;
                    (_a = pipelineEditorFactory.addFileToPipelineSignal) === null || _a === void 0 ? void 0 : _a.emit(args);
                }
            });
            const refreshPaletteCommand = PipelineEditorWidget_1.commandIDs.refreshPalette;
            app.commands.addCommand(refreshPaletteCommand, {
                label: 'Refresh Pipeline Palette',
                icon: ui_components_2.refreshIcon,
                execute: (args) => {
                    var _a;
                    (_a = pipelineEditorFactory.refreshPaletteSignal) === null || _a === void 0 ? void 0 : _a.emit(args);
                }
            });
            app.contextMenu.addItem({
                selector: '[data-file-type="notebook"]',
                command: addFileToPipelineCommand
            });
            app.contextMenu.addItem({
                selector: '[data-file-type="python"]',
                command: addFileToPipelineCommand
            });
            app.contextMenu.addItem({
                selector: '[data-file-type="r"]',
                command: addFileToPipelineCommand
            });
            // Add an application command
            const openPipelineEditorCommand = PipelineEditorWidget_1.commandIDs.openPipelineEditor;
            app.commands.addCommand(openPipelineEditorCommand, {
                label: (args) => {
                    var _a, _b, _c;
                    const commandArgs = args;
                    if (commandArgs.isPalette) {
                        return `New ${PIPELINE_EDITOR}`;
                    }
                    if (((_a = commandArgs.runtimeType) === null || _a === void 0 ? void 0 : _a.id) === 'LOCAL') {
                        const contextMenuPrefix = commandArgs.isContextMenu ? 'New ' : '';
                        return `${contextMenuPrefix}Generic ${PIPELINE_EDITOR}`;
                    }
                    if (commandArgs.isMenu) {
                        return `${(_b = commandArgs.runtimeType) === null || _b === void 0 ? void 0 : _b.display_name} ${PIPELINE_EDITOR}`;
                    }
                    if (commandArgs.isContextMenu) {
                        return `New ${(_c = commandArgs.runtimeType) === null || _c === void 0 ? void 0 : _c.display_name} ${PIPELINE_EDITOR}`;
                    }
                    return PIPELINE_EDITOR;
                },
                caption: (args) => {
                    var _a, _b;
                    const commandArgs = args;
                    if (((_a = commandArgs.runtimeType) === null || _a === void 0 ? void 0 : _a.id) === 'LOCAL') {
                        return `Generic ${PIPELINE_EDITOR}`;
                    }
                    return `${(_b = commandArgs.runtimeType) === null || _b === void 0 ? void 0 : _b.display_name} ${PIPELINE_EDITOR}`;
                },
                iconLabel: (args) => {
                    var _a, _b;
                    const commandArgs = args;
                    if (commandArgs.isPalette) {
                        return '';
                    }
                    if (((_a = commandArgs.runtimeType) === null || _a === void 0 ? void 0 : _a.id) === 'LOCAL') {
                        return `Generic ${PIPELINE_EDITOR}`;
                    }
                    return `${(_b = commandArgs.runtimeType) === null || _b === void 0 ? void 0 : _b.display_name} ${PIPELINE_EDITOR}`;
                },
                icon: (args) => {
                    var _a;
                    const commandArgs = args;
                    if (commandArgs.isPalette) {
                        return undefined;
                    }
                    return (_a = commandArgs.runtimeType) === null || _a === void 0 ? void 0 : _a.icon;
                },
                execute: (args) => {
                    const commandArgs = args;
                    // Creates blank file, then opens it in a new window
                    app.commands
                        .execute(PipelineEditorWidget_1.commandIDs.newDocManager, {
                        type: 'file',
                        path: browserFactory.model.path,
                        ext: '.pipeline'
                    })
                        .then((model) => __awaiter(void 0, void 0, void 0, function* () {
                        var _a;
                        const platformId = (_a = commandArgs.runtimeType) === null || _a === void 0 ? void 0 : _a.id;
                        const runtime_type = platformId === 'LOCAL' ? undefined : platformId;
                        const pipelineJson = (0, exports.getEmptyPipelineJson)(runtime_type);
                        const newWidget = yield app.commands.execute(PipelineEditorWidget_1.commandIDs.openDocManager, {
                            path: model.path,
                            factory: PIPELINE_EDITOR
                        });
                        newWidget.context.ready.then(() => {
                            newWidget.context.model.fromJSON(pipelineJson);
                            app.commands.execute(PipelineEditorWidget_1.commandIDs.saveDocManager, {
                                path: model.path
                            });
                        });
                    }));
                }
            });
            // Add the command to the palette.
            palette.addItem({
                command: openPipelineEditorCommand,
                args: { isPalette: true },
                category: 'Elyra'
            });
            // Add the command to the launcher
            if (launcher) {
                const fileMenuItems = [];
                let contextMenuRank = 100;
                app.contextMenu.addItem({
                    command: openPipelineEditorCommand,
                    type: 'separator',
                    selector: '.jp-DirListing-content',
                    rank: ++contextMenuRank
                });
                for (const t of resolvedTypes) {
                    launcher.add({
                        command: openPipelineEditorCommand,
                        category: 'Elyra',
                        args: { runtimeType: t },
                        rank: t.id === 'LOCAL' ? 1 : 2
                    });
                    fileMenuItems.push({
                        command: openPipelineEditorCommand,
                        args: {
                            runtimeType: t,
                            isMenu: true
                        },
                        rank: t.id === 'LOCAL' ? 90 : 91
                    });
                    app.contextMenu.addItem({
                        command: openPipelineEditorCommand,
                        args: {
                            runtimeType: t,
                            isContextMenu: true
                        },
                        selector: '.jp-DirListing-content',
                        rank: ++contextMenuRank
                    });
                }
                app.contextMenu.addItem({
                    command: openPipelineEditorCommand,
                    type: 'separator',
                    selector: '.jp-DirListing-content',
                    rank: ++contextMenuRank
                });
                menu.fileMenu.newMenu.addGroup(fileMenuItems);
            }
        }))
            .catch((error) => __awaiter(void 0, void 0, void 0, function* () {
            yield ui_components_1.RequestErrors.serverError(error);
        }));
        // SubmitNotebookButtonExtension initialization code
        const notebookButtonExtension = new SubmitFileButtonExtension_1.SubmitFileButtonExtension();
        app.docRegistry.addWidgetExtension('Notebook', notebookButtonExtension);
        app.contextMenu.addItem({
            selector: '.jp-Notebook',
            command: PipelineEditorWidget_1.commandIDs.submitNotebook,
            rank: -0.5
        });
        // SubmitScriptButtonExtension initialization code
        const scriptButtonExtension = new SubmitFileButtonExtension_1.SubmitFileButtonExtension();
        app.docRegistry.addWidgetExtension('Python Editor', scriptButtonExtension);
        app.contextMenu.addItem({
            selector: '.elyra-ScriptEditor',
            command: PipelineEditorWidget_1.commandIDs.submitScript,
            rank: -0.5
        });
        app.docRegistry.addWidgetExtension('R Editor', scriptButtonExtension);
        app.contextMenu.addItem({
            selector: '.elyra-ScriptEditor',
            command: PipelineEditorWidget_1.commandIDs.submitScript,
            rank: -0.5
        });
        const runtimesWidget = new RuntimesWidget_1.RuntimesWidget({
            app,
            display_name: 'Runtimes',
            schemaspace: PipelineService_1.RUNTIMES_SCHEMASPACE,
            icon: ui_components_1.runtimesIcon,
            titleContext: 'runtime configuration',
            addLabel: 'runtime configuration',
            appendToTitle: true
        });
        const runtimesWidgetID = `elyra-metadata:${PipelineService_1.RUNTIMES_SCHEMASPACE}`;
        runtimesWidget.id = runtimesWidgetID;
        runtimesWidget.title.icon = ui_components_1.runtimesIcon;
        runtimesWidget.title.caption = 'Runtimes';
        restorer.add(runtimesWidget, runtimesWidgetID);
        app.shell.add(runtimesWidget, 'left', { rank: 950 });
        const runtimeImagesWidget = new RuntimeImagesWidget_1.RuntimeImagesWidget({
            app,
            display_name: 'Runtime Images',
            schemaspace: RuntimeImagesWidget_1.RUNTIME_IMAGES_SCHEMASPACE,
            icon: ui_components_1.containerIcon,
            titleContext: '',
            addLabel: 'runtime image'
        });
        const runtimeImagesWidgetID = `elyra-metadata:${RuntimeImagesWidget_1.RUNTIME_IMAGES_SCHEMASPACE}`;
        runtimeImagesWidget.id = runtimeImagesWidgetID;
        runtimeImagesWidget.title.icon = ui_components_1.containerIcon;
        runtimeImagesWidget.title.caption = 'Runtime Images';
        restorer.add(runtimeImagesWidget, runtimeImagesWidgetID);
        app.shell.add(runtimeImagesWidget, 'left', { rank: 951 });
        const componentCatalogWidget = new ComponentCatalogsWidget_1.ComponentCatalogsWidget({
            app,
            display_name: 'Component Catalogs', // TODO: This info should come from the server for all schemaspaces
            schemaspace: ComponentCatalogsWidget_1.COMPONENT_CATALOGS_SCHEMASPACE,
            icon: ui_components_1.componentCatalogIcon,
            titleContext: '',
            addLabel: 'component catalog',
            refreshCallback: () => {
                app.commands.execute(PipelineEditorWidget_1.commandIDs.refreshPalette);
            }
        });
        const componentCatalogWidgetID = `elyra-metadata:${ComponentCatalogsWidget_1.COMPONENT_CATALOGS_SCHEMASPACE}`;
        componentCatalogWidget.id = componentCatalogWidgetID;
        componentCatalogWidget.title.icon = ui_components_1.componentCatalogIcon;
        componentCatalogWidget.title.caption = 'Component Catalogs';
        restorer.add(componentCatalogWidget, componentCatalogWidgetID);
        app.shell.add(componentCatalogWidget, 'left', { rank: 961 });
    })
};
exports["default"] = extension;


/***/ }),

/***/ "./lib/pipeline-hooks.js":
/*!*******************************!*\
  !*** ./lib/pipeline-hooks.js ***!
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
exports.usePalette = exports.componentFetcher = exports.sortPalette = exports.useRuntimesSchema = exports.useRuntimeImages = exports.GENERIC_CATEGORY_ID = void 0;
const services_1 = __webpack_require__(/*! @elyra/services */ "webpack/sharing/consume/default/@elyra/services/@elyra/services");
const coreutils_1 = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
const services_2 = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
const immer_1 = __importDefault(__webpack_require__(/*! immer */ "webpack/sharing/consume/default/immer/immer"));
const swr_1 = __importDefault(__webpack_require__(/*! swr */ "webpack/sharing/consume/default/swr/swr"));
const PipelineService_1 = __webpack_require__(/*! ./PipelineService */ "./lib/PipelineService.js");
exports.GENERIC_CATEGORY_ID = 'Elyra';
const metadataFetcher = (key) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield services_1.MetadataService.getMetadata(key));
});
const useRuntimeImages = (additionalRuntimeImages) => {
    const { data, error } = (0, swr_1.default)('runtime-images', metadataFetcher);
    let result = data;
    if (result && additionalRuntimeImages) {
        // Sort and remove duplicates from additionalRuntimeImages
        additionalRuntimeImages.sort((a, b) => 0 - (a.name > b.name ? -1 : 1));
        additionalRuntimeImages = additionalRuntimeImages.filter((image, index, self) => index ===
            self.findIndex((otherImage) => image.name === otherImage.name &&
                image.display_name === otherImage.display_name &&
                image.metadata.image_name === otherImage.metadata.image_name));
        // Remove previously added additionalRuntimeImages from result
        result = result.filter((runtimeImage) => !additionalRuntimeImages ||
            additionalRuntimeImages.findIndex((additionalRuntimeImage) => runtimeImage.name === additionalRuntimeImage.name &&
                runtimeImage.display_name === additionalRuntimeImage.display_name &&
                runtimeImage.metadata.image_name ===
                    additionalRuntimeImage.metadata.image_name) < 0);
        // Find out which additionalRuntimeImages are not yet in result
        const existingImageNames = result.map((runtimeImage) => runtimeImage.metadata.image_name);
        const runtimeImagesToAdd = additionalRuntimeImages.filter((additionalRuntimeImage) => !existingImageNames.includes(additionalRuntimeImage.metadata.image_name));
        // Sort and add missing images to result (at the end)
        result.sort((a, b) => 0 - (a.name > b.name ? -1 : 1));
        Array.prototype.push.apply(result, runtimeImagesToAdd);
    }
    return { data: result, error };
};
exports.useRuntimeImages = useRuntimeImages;
const schemaFetcher = (key) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield services_1.MetadataService.getSchema(key));
});
const useRuntimesSchema = () => {
    const { data, error } = (0, swr_1.default)('runtimes', schemaFetcher);
    return { data, error };
};
exports.useRuntimesSchema = useRuntimesSchema;
/**
 * Sort palette in place. Takes a list of categories each containing a list of
 * components.
 * - Categories: alphabetically by "label" (exception: "generic" always first)
 * - Components: alphabetically by "op" (where is component label stored?)
 */
const sortPalette = (palette) => {
    palette.categories.sort((a, b) => {
        if (a.id === exports.GENERIC_CATEGORY_ID) {
            return -1;
        }
        if (b.id === exports.GENERIC_CATEGORY_ID) {
            return 1;
        }
        return a.label.localeCompare(b.label, undefined, { numeric: true });
    });
    for (const components of palette.categories) {
        components.node_types.sort((a, b) => a.label.localeCompare(b.label, undefined, {
            numeric: true
        }));
    }
};
exports.sortPalette = sortPalette;
// TODO: This should be enabled through `extensions`
const NodeIcons = new Map([
    ['execute-notebook-node', 'static/elyra/notebook.svg'],
    ['execute-python-node', 'static/elyra/python.svg'],
    ['execute-r-node', 'static/elyra/r-logo.svg']
]);
// TODO: We should decouple components and properties to support lazy loading.
const componentFetcher = (type) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const palettePromise = services_1.RequestHandler.makeGetRequest(`elyra/pipeline/components/${type}`);
    const pipelinePropertiesPromise = services_1.RequestHandler.makeGetRequest(`elyra/pipeline/${type}/properties`);
    const pipelineParametersPromise = services_1.RequestHandler.makeGetRequest(`elyra/pipeline/${type}/parameters`);
    const typesPromise = PipelineService_1.PipelineService.getRuntimeTypes();
    const [palette, pipelineProperties, pipelineParameters, types] = yield Promise.all([
        palettePromise,
        pipelinePropertiesPromise,
        pipelineParametersPromise,
        typesPromise
    ]);
    if (!palette || !pipelineProperties || !types) {
        throw new Error('Failed to fetch palette data');
    }
    palette.properties = pipelineProperties;
    if (pipelineParameters) {
        palette.parameters = pipelineParameters;
    }
    // Gather list of component IDs to fetch properties for.
    const componentList = [];
    for (const category of palette.categories) {
        for (const node of category.node_types) {
            componentList.push(node.id);
        }
    }
    const propertiesPromises = componentList.map((componentID) => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield services_1.RequestHandler.makeGetRequest(`elyra/pipeline/components/${type}/${componentID}/properties`);
        return {
            id: componentID,
            properties: res
        };
    }));
    // load all of the properties in parallel instead of serially
    const properties = yield Promise.all(propertiesPromises);
    // inject properties
    for (const category of palette.categories) {
        // Use the runtime_type from the first node of the category to determine category
        // icon.
        // TODO: Ideally, this would be included in the category.
        const category_runtime_type = (_c = (_b = (_a = category.node_types) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.runtime_type) !== null && _c !== void 0 ? _c : 'LOCAL';
        const type = types.find((t) => t.id === category_runtime_type);
        const baseUrl = services_2.ServerConnection.makeSettings().baseUrl;
        const defaultIcon = coreutils_1.URLExt.parse(coreutils_1.URLExt.join(baseUrl, (type === null || type === void 0 ? void 0 : type.icon) || '')).pathname;
        category.image = defaultIcon;
        for (const node of category.node_types) {
            // update icon
            const genericNodeIcon = NodeIcons.get(node.op);
            const nodeIcon = genericNodeIcon
                ? coreutils_1.URLExt.parse(coreutils_1.URLExt.join(baseUrl, genericNodeIcon)).pathname
                : defaultIcon;
            // Not sure which is needed...
            node.image = nodeIcon;
            node.app_data.image = nodeIcon;
            node.app_data.ui_data.image = nodeIcon;
            const prop = properties.find((p) => p.id === node.id);
            node.app_data.properties = prop === null || prop === void 0 ? void 0 : prop.properties;
        }
    }
    (0, exports.sortPalette)(palette);
    return palette;
});
exports.componentFetcher = componentFetcher;
const updateRuntimeImages = (properties, runtimeImages) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const runtimeImageProperties = (_d = (_c = (_b = (_a = properties === null || properties === void 0 ? void 0 : properties.properties) === null || _a === void 0 ? void 0 : _a.component_parameters) === null || _b === void 0 ? void 0 : _b.properties) === null || _c === void 0 ? void 0 : _c.runtime_image) !== null && _d !== void 0 ? _d : (_g = (_f = (_e = properties === null || properties === void 0 ? void 0 : properties.properties) === null || _e === void 0 ? void 0 : _e.pipeline_defaults) === null || _f === void 0 ? void 0 : _f.properties) === null || _g === void 0 ? void 0 : _g.runtime_image;
    const imageNames = (runtimeImages !== null && runtimeImages !== void 0 ? runtimeImages : []).map((i) => i.metadata.image_name);
    const displayNames = {};
    (runtimeImages !== null && runtimeImages !== void 0 ? runtimeImages : []).forEach((i) => {
        displayNames[i.metadata.image_name] = i.display_name;
    });
    if (runtimeImageProperties) {
        runtimeImageProperties.enumNames = (runtimeImages !== null && runtimeImages !== void 0 ? runtimeImages : []).map((i) => i.display_name);
        runtimeImageProperties.enum = imageNames;
    }
};
const usePalette = (type = 'local', additionalRuntimeImages) => {
    const { data: runtimeImages, error: runtimeError } = (0, exports.useRuntimeImages)(additionalRuntimeImages);
    const { data: palette, error: paletteError, mutate: mutate } = (0, swr_1.default)(type, exports.componentFetcher);
    let updatedPalette;
    if (palette !== undefined) {
        updatedPalette = (0, immer_1.default)(palette, (draft) => {
            for (const category of draft.categories) {
                for (const node of category.node_types) {
                    // update runtime images
                    updateRuntimeImages(node.app_data.properties, runtimeImages);
                }
            }
            updateRuntimeImages(draft.properties, runtimeImages);
        });
    }
    return {
        data: updatedPalette,
        error: runtimeError !== null && runtimeError !== void 0 ? runtimeError : paletteError,
        mutate: mutate
    };
};
exports.usePalette = usePalette;


/***/ }),

/***/ "./lib/runtime-utils.js":
/*!******************************!*\
  !*** ./lib/runtime-utils.js ***!
  \******************************/
/***/ ((__unused_webpack_module, exports) => {


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
exports.getConfigDetails = exports.createRuntimeData = void 0;
const createRuntimeData = ({ runtimes, schema, allowLocal }) => {
    var _a;
    const platforms = [];
    for (const s of schema) {
        const found = platforms.find((p) => p.id === s.runtime_type);
        if (found) {
            continue;
        }
        platforms.push({
            id: s.runtime_type,
            displayName: (_a = s.title) !== null && _a !== void 0 ? _a : '',
            configs: runtimes
                .filter((r) => r.metadata.runtime_type === s.runtime_type)
                .map((r) => ({
                id: r.name,
                displayName: r.display_name,
                processor: {
                    id: r.schema_name
                }
            }))
        });
    }
    return { platforms, allowLocal: !!allowLocal };
};
exports.createRuntimeData = createRuntimeData;
const getConfigDetails = (runtimeData, configId) => {
    for (const platform of runtimeData.platforms) {
        for (const config of platform.configs) {
            if (config.id === configId) {
                return {
                    id: config.id,
                    displayName: config.displayName,
                    platform: {
                        id: platform.id,
                        displayName: platform.displayName
                    },
                    processor: {
                        id: config.processor.id
                    }
                };
            }
        }
    }
    return undefined;
};
exports.getConfigDetails = getConfigDetails;


/***/ }),

/***/ "./lib/theme.js":
/*!**********************!*\
  !*** ./lib/theme.js ***!
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
exports.theme = void 0;
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const ui_components_2 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const React = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const SvgIcon = ({ children }) => {
    return (React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", xmlns: "http://www.w3.org/2000/svg", fill: "currentColor" }, children));
};
const theme = {
    palette: {
        focus: 'var(--jp-brand-color0)',
        border: 'var(--jp-border-color0)',
        divider: 'var(--jp-border-color0)',
        hover: 'var(--jp-border-color1)',
        active: 'rgba(255, 255, 255, 0.18)',
        inputBorder: 'var(--jp-border-color0)',
        primary: {
            main: 'var(--jp-inverse-layout-color4)',
            hover: 'transparent',
            contrastText: 'var(--jp-layout-color1)'
        },
        secondary: {
            main: 'transparent',
            contrastText: 'var(--jp-content-font-color1)'
        },
        error: {
            main: 'var(--jp-error-color0)',
            contrastText: 'var(--jp-icon-contrast-color3)'
        },
        errorMessage: {
            main: 'var(--jp-error-color1)',
            contrastText: 'rgba(255, 255, 255, 0.9)',
            errorBorder: 'var(--jp-error-color0)'
        },
        text: {
            primary: 'var(--jp-content-font-color0)',
            secondary: 'var(--jp-ui-font-color1)',
            bold: 'var(--jp-inverse-layout-color2)',
            inactive: 'var(--jp-inverse-layout-color4)',
            disabled: 'var(--jp-content-font-color3)',
            link: 'var(--jp-content-link-color)',
            error: 'var(--jp-error-color0)',
            icon: 'var(--jp-inverse-layout-color2)'
        },
        background: {
            default: 'var(--jp-layout-color1)',
            secondary: 'var(--jp-border-color2)',
            input: 'transparent'
        },
        highlight: {
            border: 'transparent',
            hover: 'var(--jp-content-font-color0)',
            focus: 'transparent'
        }
    },
    shape: {
        borderRadius: '4px'
    },
    typography: {
        fontFamily: 'var(--jp-ui-font-family)',
        fontWeight: 'normal',
        fontSize: 'var(--jp-content-font-size1)'
    },
    overrides: {
        deleteIcon: ui_components_2.LabIcon.resolveReact({ icon: ui_components_1.trashIcon }),
        editIcon: ui_components_2.LabIcon.resolveReact({ icon: ui_components_2.editIcon }),
        folderIcon: ui_components_2.LabIcon.resolveReact({ icon: ui_components_2.folderIcon }),
        closeIcon: ui_components_2.LabIcon.resolveReact({ icon: ui_components_2.closeIcon }),
        propertiesIcon: (React.createElement(SvgIcon, null,
            React.createElement("path", { d: "M3.5 2h-1v5h1V2zm6.1 5H6.4L6 6.45v-1L6.4 5h3.2l.4.5v1l-.4.5zm-5 3H1.4L1 9.5v-1l.4-.5h3.2l.4.5v1l-.4.5zm3.9-8h-1v2h1V2zm-1 6h1v6h-1V8zm-4 3h-1v3h1v-3zm7.9 0h3.19l.4-.5v-.95l-.4-.5H11.4l-.4.5v.95l.4.5zm2.1-9h-1v6h1V2zm-1 10h1v2h-1v-2z" }))),
        paletteIcon: ui_components_2.LabIcon.resolveReact({ icon: ui_components_2.paletteIcon }),
        checkIcon: (React.createElement(SvgIcon, null,
            React.createElement("path", { d: "M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z" }))),
        chevronDownIcon: ui_components_2.LabIcon.resolveReact({ icon: ui_components_2.caretDownEmptyIcon })
    }
};
exports.theme = theme;


/***/ }),

/***/ "./lib/utils.js":
/*!**********************!*\
  !*** ./lib/utils.js ***!
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const pipeline_editor_1 = __webpack_require__(/*! @elyra/pipeline-editor */ "webpack/sharing/consume/default/@elyra/pipeline-editor/@elyra/pipeline-editor");
const application_1 = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
const coreutils_1 = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
const v4_1 = __importDefault(__webpack_require__(/*! uuid/v4 */ "../../node_modules/uuid/v4.js"));
/**
 * A utilities class for static functions.
 */
class Utils {
    /**
     * Utility to create a one node pipeline to submit a single file as a pipeline
     */
    static generateSingleFilePipeline(filename, configDetails, runtimeImage, dependencies, envObject, cpu, cpu_limit, gpu, memory, memory_limit) {
        const generated_uuid = (0, v4_1.default)();
        const artifactName = coreutils_1.PathExt.basename(filename, coreutils_1.PathExt.extname(filename));
        const envVars = Object.entries(envObject).map(([key, val]) => `${key}=${val}`);
        return {
            doc_type: 'pipeline',
            version: '3.0',
            json_schema: 'http://api.dataplatform.ibm.com/schemas/common-pipeline/pipeline-flow/pipeline-flow-v3-schema.json',
            id: generated_uuid,
            primary_pipeline: generated_uuid,
            pipelines: [
                {
                    id: generated_uuid,
                    nodes: [
                        {
                            id: generated_uuid,
                            type: 'execution_node',
                            op: 'execute-notebook-node',
                            app_data: {
                                component_parameters: {
                                    filename,
                                    runtime_image: runtimeImage,
                                    outputs: [],
                                    env_vars: envVars,
                                    dependencies,
                                    cpu,
                                    cpu_limit,
                                    gpu,
                                    memory,
                                    memory_limit,
                                    include_subdirectories: false
                                },
                                ui_data: {
                                    label: coreutils_1.PathExt.basename(filename)
                                }
                            }
                        }
                    ],
                    app_data: {
                        name: artifactName,
                        runtime_config: configDetails === null || configDetails === void 0 ? void 0 : configDetails.id,
                        version: pipeline_editor_1.PIPELINE_CURRENT_VERSION,
                        source: coreutils_1.PathExt.basename(filename),
                        properties: {
                            name: 'generic'
                        },
                        ui_data: {
                            comments: []
                        }
                    }
                }
            ],
            schemas: []
        };
    }
    /**
     * Break an array into an array of "chunks", each "chunk" having "n" elements.
     * The final "chuck" may have less than "n" elements.
     * Example:
     * chunkArray(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 4)
     * -> [['a', 'b', 'c', 'd'], ['e', 'f', 'g']]
     */
    static chunkArray(arr, n) {
        return Array.from(Array(Math.ceil(arr.length / n)), (_, i) => arr.slice(i * n, i * n + n));
    }
}
/**
 * From a given widget, find the application shell and return it
 */
Utils.getLabShell = (widget) => {
    while (widget !== null && !(widget instanceof application_1.LabShell)) {
        widget = widget.parent;
    }
    return widget;
};
exports["default"] = Utils;


/***/ })

}]);
//# sourceMappingURL=lib_PipelineEditorWidget_js-lib_index_js.143ccd6c6df23142b255.js.map