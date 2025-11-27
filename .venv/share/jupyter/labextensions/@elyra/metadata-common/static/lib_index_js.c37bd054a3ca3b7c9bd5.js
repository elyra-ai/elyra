"use strict";
(self["webpackChunk_elyra_metadata_common"] = self["webpackChunk_elyra_metadata_common"] || []).push([["lib_index_js"],{

/***/ "./lib/FilterTools.js":
/*!****************************!*\
  !*** ./lib/FilterTools.js ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FilterTools = void 0;
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
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const ui_components_2 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const react_1 = __importDefault(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const FILTER_OPTION = 'elyra-filter-option';
const FILTER_TAGS = 'elyra-filter-tags';
const FILTER_TAG = 'elyra-filter-tag';
const FILTER_TAG_LABEL = 'elyra-filter-tag-label';
const FILTER_CHECK = 'elyra-filter-check';
const FILTER_TOOLS = 'elyra-filterTools';
const FILTER_SEARCHBAR = 'elyra-searchbar';
const FILTER_SEARCHWRAPPER = 'elyra-searchwrapper';
const FILTER_CLASS = 'elyra-filter';
const FILTER_BUTTON = 'elyra-filter-btn';
const FILTER_EMPTY = 'elyra-filter-empty';
class FilterTools extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.handleSearch = (event) => {
            this.setState({ searchValue: event.target.value }, this.filterMetadata);
        };
        this.state = { selectedTags: [], searchValue: '' };
        this.createFilterBox = this.createFilterBox.bind(this);
        this.renderFilterOption = this.renderFilterOption.bind(this);
        this.renderTags = this.renderTags.bind(this);
        this.renderAppliedTag = this.renderAppliedTag.bind(this);
        this.renderUnappliedTag = this.renderUnappliedTag.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.filterMetadata = this.filterMetadata.bind(this);
    }
    componentDidMount() {
        this.setState({
            selectedTags: [],
            searchValue: ''
        });
    }
    componentDidUpdate(prevProps) {
        if (prevProps !== this.props) {
            this.setState((state) => ({
                selectedTags: state.selectedTags
                    .filter((tag) => this.props.tags.includes(tag))
                    .sort()
            }));
        }
    }
    createFilterBox() {
        const filterOption = document.querySelector(`#${this.props.schemaspace} .${FILTER_OPTION}`);
        filterOption === null || filterOption === void 0 ? void 0 : filterOption.classList.toggle('idle');
        this.filterMetadata();
    }
    renderTags() {
        if (!this.props.tags.length) {
            return (react_1.default.createElement("div", { className: FILTER_TAGS },
                react_1.default.createElement("p", { className: FILTER_EMPTY }, "No tags defined")));
        }
        return (react_1.default.createElement("div", { className: FILTER_TAGS }, this.props.tags.sort().map((tag, index) => {
            if (this.state.selectedTags.includes(tag)) {
                return this.renderAppliedTag(tag, index.toString());
            }
            else {
                return this.renderUnappliedTag(tag, index.toString());
            }
        })));
    }
    renderAppliedTag(tag, index) {
        return (react_1.default.createElement("button", { className: `${FILTER_TAG} jp-CellTags-Tag jp-CellTags-Applied`, id: 'filter' + '-' + tag + '-' + index, key: 'filter' + '-' + tag + '-' + index, title: tag, onClick: this.handleClick },
            react_1.default.createElement("span", { className: FILTER_TAG_LABEL }, tag),
            react_1.default.createElement(ui_components_2.checkIcon.react, { className: FILTER_CHECK, tag: "span", elementPosition: "center", height: "18px", width: "18px", marginLeft: "5px", marginRight: "-3px" })));
    }
    renderUnappliedTag(tag, index) {
        return (react_1.default.createElement("button", { className: `${FILTER_TAG} jp-CellTags-Tag jp-CellTags-Unapplied`, id: 'filter' + '-' + tag + '-' + index, key: 'filter' + '-' + tag + '-' + index, title: tag, onClick: this.handleClick },
            react_1.default.createElement("span", { className: FILTER_TAG_LABEL }, tag)));
    }
    handleClick(event) {
        var _a;
        const target = event.target;
        const clickedTag = (_a = target.textContent) !== null && _a !== void 0 ? _a : '';
        this.setState((state) => ({
            selectedTags: this.updateTagsCss(target, state.selectedTags, clickedTag)
        }), this.filterMetadata);
    }
    updateTagsCss(target, currentTags, clickedTag) {
        if (target.classList.contains('jp-CellTags-Unapplied')) {
            target.classList.replace('jp-CellTags-Unapplied', 'jp-CellTags-Applied');
            currentTags.splice(-1, 0, clickedTag);
        }
        else if (target.classList.contains('jp-CellTags-Applied')) {
            target.classList.replace('jp-CellTags-Applied', 'jp-CellTags-Unapplied');
            const idx = currentTags.indexOf(clickedTag);
            currentTags.splice(idx, 1);
        }
        return currentTags.sort();
    }
    filterMetadata() {
        var _a;
        const isTagFilterOpen = (_a = document
            .querySelector(`#${this.props.schemaspace} .${FILTER_OPTION}`)) === null || _a === void 0 ? void 0 : _a.classList.contains('idle');
        this.props.onFilter(this.state.searchValue, isTagFilterOpen ? [] : this.state.selectedTags);
    }
    renderFilterOption() {
        return react_1.default.createElement("div", { className: `${FILTER_OPTION} idle` }, this.renderTags());
    }
    render() {
        return (react_1.default.createElement("div", { className: FILTER_TOOLS },
            react_1.default.createElement("div", { className: FILTER_SEARCHBAR },
                react_1.default.createElement(ui_components_2.InputGroup, { className: FILTER_SEARCHWRAPPER, type: "text", placeholder: "Search...", onChange: this.handleSearch, rightIcon: "ui-components:search", value: this.state.searchValue })),
            this.props.omitTags ? (react_1.default.createElement("div", { style: { height: '4px' } })) : (react_1.default.createElement("div", { className: FILTER_CLASS, id: this.props.schemaspace },
                react_1.default.createElement("button", { title: "Filter by tag", className: FILTER_BUTTON, onClick: this.createFilterBox },
                    react_1.default.createElement(ui_components_1.tagIcon.react, null)),
                this.renderFilterOption()))));
    }
}
exports.FilterTools = FilterTools;


/***/ }),

/***/ "./lib/MetadataCommonService.js":
/*!**************************************!*\
  !*** ./lib/MetadataCommonService.js ***!
  \**************************************/
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
exports.MetadataCommonService = void 0;
const services_1 = __webpack_require__(/*! @elyra/services */ "webpack/sharing/consume/default/@elyra/services/@elyra/services");
class MetadataCommonService {
    /**
     * Duplicates an existing metadata instance, using
     * '<original-display-name>-Copy<unique-number>' as new display name.
     *
     * @param schemaSpace: schemaspace in which metadataInstance is defined
     * @param metadataInstance: metadata instance to be duplicated
     * @param existingInstances: list of existing metadata instances in schemaspace
     *
     * @returns A promise
     */
    static duplicateMetadataInstance(schemaSpace, metadataInstance, existingInstances) {
        // iterate through the list of currently defined
        // instance names and find the next available one
        // using '<source-instance-name>-Copy<N>'
        let base_name = metadataInstance.display_name;
        const match = metadataInstance.display_name.match(/-Copy\d+$/);
        if (match !== null) {
            base_name = base_name.replace(/-Copy\d+$/, '');
        }
        let count = 1;
        while (existingInstances.find((element) => element.display_name === `${base_name}-Copy${count}`) !== undefined) {
            count += 1;
        }
        // Create a duplicate metadata instance using the derived name
        const duplicated_metadata = JSON.parse(JSON.stringify(metadataInstance));
        duplicated_metadata.display_name = `${base_name}-Copy${count}`;
        delete duplicated_metadata.name;
        return services_1.MetadataService.postMetadata(schemaSpace, duplicated_metadata);
    }
}
exports.MetadataCommonService = MetadataCommonService;


/***/ }),

/***/ "./lib/MetadataEditor.js":
/*!*******************************!*\
  !*** ./lib/MetadataEditor.js ***!
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
exports.MetadataEditor = void 0;
const services_1 = __webpack_require__(/*! @elyra/services */ "webpack/sharing/consume/default/@elyra/services/@elyra/services");
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const React = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const ELYRA_METADATA_EDITOR_CLASS = 'elyra-metadataEditor';
/**
 * Metadata editor widget
 */
const MetadataEditor = ({ editorServices, schemaspace, onSave, schemaName, schemaTop, initialMetadata, translator, name, setDirty, close, allTags, componentRegistry, getDefaultChoices, titleContext }) => {
    var _a, _b, _c;
    const formRef = React.useRef(null);
    const [isSubmitted, setSubmitted] = React.useState(false);
    const [invalidForm, setInvalidForm] = React.useState(false);
    const schema = (_a = schemaTop.properties) === null || _a === void 0 ? void 0 : _a.metadata;
    const [metadata, setMetadata] = React.useState(initialMetadata);
    const displayName = (_b = initialMetadata === null || initialMetadata === void 0 ? void 0 : initialMetadata['_noCategory']) === null || _b === void 0 ? void 0 : _b['display_name'];
    const referenceURL = (_c = schemaTop.uihints) === null || _c === void 0 ? void 0 : _c.reference_url;
    const isFormDataValid = (data) => {
        const state = formRef.current.validateForm(data);
        return state.isValid;
    };
    /**
     * Saves metadata through either put or post request.
     */
    const saveMetadata = () => {
        var _a;
        const isValid = isFormDataValid(metadata);
        setInvalidForm(!isValid);
        setSubmitted(true);
        if (!isValid) {
            return;
        }
        const newMetadata = {
            schema_name: schemaName,
            display_name: (_a = metadata === null || metadata === void 0 ? void 0 : metadata['_noCategory']) === null || _a === void 0 ? void 0 : _a['display_name'],
            metadata: flattenFormData(metadata)
        };
        if (!name) {
            services_1.MetadataService.postMetadata(schemaspace, newMetadata)
                .then(() => {
                setDirty(false);
                onSave();
                close();
            })
                .catch((error) => __awaiter(void 0, void 0, void 0, function* () {
                yield ui_components_1.RequestErrors.serverError(error);
            }));
        }
        else {
            services_1.MetadataService.putMetadata(schemaspace, name, newMetadata)
                .then(() => {
                setDirty(false);
                onSave();
                close();
            })
                .catch((error) => __awaiter(void 0, void 0, void 0, function* () {
                yield ui_components_1.RequestErrors.serverError(error);
            }));
        }
    };
    let headerText = `Edit "${displayName}"`;
    if (!displayName) {
        headerText = `Add new ${schemaTop.title} ${titleContext !== null && titleContext !== void 0 ? titleContext : ''}`;
    }
    /**
     * Removes category wrappers in the data before sending to the server.
     * @param newFormData - Form data with category wrappers.
     * @returns - Form data as the server expects it.
     */
    const flattenFormData = (newFormData) => {
        const flattened = {};
        for (const category in newFormData) {
            for (const property in newFormData[category]) {
                flattened[property] = newFormData[category][property];
            }
        }
        return flattened;
    };
    /**
     * Triggers save and close on pressing enter key (outside of a text area)
     */
    const onKeyPress = (event) => {
        const targetElement = event.nativeEvent.target;
        if (event.key === 'Enter' && (targetElement === null || targetElement === void 0 ? void 0 : targetElement.tagName) !== 'TEXTAREA') {
            saveMetadata();
        }
    };
    return (React.createElement("div", { onKeyPress: onKeyPress, className: ELYRA_METADATA_EDITOR_CLASS },
        React.createElement("h3", null,
            " ",
            headerText,
            " "),
        React.createElement("p", { style: { width: '100%', marginBottom: '10px' } },
            translator.__('All fields marked with an asterisk are required.'),
            "\u00A0",
            referenceURL ? (React.createElement("a", { href: referenceURL, target: "_blank", rel: "noreferrer noopener" }, translator.__('[Learn more ...]'))) : null),
        React.createElement(ui_components_1.FormEditor, { ref: formRef, schema: schema, onChange: (formData) => {
                setMetadata(formData);
                if (isSubmitted) {
                    setInvalidForm(!isFormDataValid(formData));
                }
                setDirty(true);
            }, componentRegistry: componentRegistry, translator: translator, editorServices: editorServices, originalData: metadata, allTags: allTags, languageOptions: getDefaultChoices('language') }),
        React.createElement("div", { className: `elyra-metadataEditor-formInput elyra-metadataEditor-saveButton ${invalidForm ? 'errorForm' : ''}`, key: 'SaveButton' },
            invalidForm ? (React.createElement("p", { className: "formError" }, translator.__('Cannot save invalid form.'))) : (React.createElement("div", null)),
            React.createElement("button", { onClick: saveMetadata }, translator.__('Save & Close')))));
};
exports.MetadataEditor = MetadataEditor;


/***/ }),

/***/ "./lib/MetadataEditorWidget.js":
/*!*************************************!*\
  !*** ./lib/MetadataEditorWidget.js ***!
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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MetadataEditorWidget = void 0;
const services_1 = __webpack_require__(/*! @elyra/services */ "webpack/sharing/consume/default/@elyra/services/@elyra/services");
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const algorithm_1 = __webpack_require__(/*! @lumino/algorithm */ "webpack/sharing/consume/default/@lumino/algorithm");
const React = __importStar(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const MetadataEditor_1 = __webpack_require__(/*! ./MetadataEditor */ "./lib/MetadataEditor.js");
const DIRTY_CLASS = 'jp-mod-dirty';
/**
 * Widget wrapper around the metadata editor components. Handles preparing
 * the schema and metadata for the component.
 */
class MetadataEditorWidget extends apputils_1.ReactWidget {
    constructor(props) {
        var _a;
        super();
        this.loading = true;
        this.dirty = false;
        this.clearDirty = null;
        this.allTags = [];
        this.props = props;
        this.widgetClass = `elyra-metadataEditor-${(_a = props.name) !== null && _a !== void 0 ? _a : 'new'}`;
        this.addClass(this.widgetClass);
        this.getDefaultChoices = this.getDefaultChoices.bind(this);
        this.handleDirtyState = this.handleDirtyState.bind(this);
        this.close = this.close.bind(this);
        void this.loadSchemaAndMetadata();
    }
    /**
     * Loads schema and metadata and adds categories.
     */
    loadSchemaAndMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            try {
                // Load all schema and all metadata in schemaspace.
                const allSchema = yield services_1.MetadataService.getSchema(this.props.schemaspace);
                this.allMetadata = yield services_1.MetadataService.getMetadata(this.props.schemaspace);
                if (!this.allMetadata) {
                    throw new Error(`No metadata found for schemaspace ${this.props.schemaspace}`);
                }
                // Loads all tags to display as options in the editor.
                this.allTags = this.allMetadata.reduce((acc, metadata) => {
                    const tags = metadata.metadata.tags;
                    if (tags) {
                        acc.push(...tags.filter((tag) => {
                            return !acc.includes(tag);
                        }));
                    }
                    return acc;
                }, []);
                // Finds schema based on schemaName.
                const schema = allSchema === null || allSchema === void 0 ? void 0 : allSchema.find((s) => {
                    return s.name === this.props.schemaName;
                });
                if (!schema) {
                    throw new Error(`Schema not found for ${this.props.schemaName}`);
                }
                if (!((_a = schema.properties) === null || _a === void 0 ? void 0 : _a.metadata)) {
                    throw new Error('Metadata not found in schema');
                }
                // Sets const fields to readonly.
                const schemaMetadata = (_b = schema.properties) === null || _b === void 0 ? void 0 : _b.metadata;
                const properties = schemaMetadata === null || schemaMetadata === void 0 ? void 0 : schemaMetadata.properties;
                if (!properties) {
                    throw new Error('Metadata properties not found in schema');
                }
                for (const prop in properties) {
                    if ((_c = properties[prop].uihints) === null || _c === void 0 ? void 0 : _c.hidden) {
                        delete properties[prop];
                        continue;
                    }
                    if (properties[prop].const !== undefined) {
                        properties[prop].default = properties[prop].const;
                        properties[prop].uihints = {
                            'ui:readonly': true
                        };
                    }
                }
                const metadata = this.allMetadata.find((m) => m.name === this.props.name);
                // Adds categories as wrapper objects in the schema.
                const metadataWithCategories = {};
                const schemaPropertiesByCategory = {
                    _noCategory: {
                        type: 'object',
                        title: ' ',
                        properties: {
                            display_name: {
                                title: this.props.translator.__('Display Name'),
                                description: this.props.translator.__('Name used to identify an instance of metadata.'),
                                type: 'string'
                            }
                        },
                        required: ['display_name']
                    }
                };
                // Adds required fields to the wrapper required fields.
                const requiredCategories = [];
                for (const schemaProperty in schemaMetadata.properties) {
                    const properties = schemaMetadata.properties[schemaProperty];
                    const category = (_d = (properties.uihints && properties.uihints.category)) !== null && _d !== void 0 ? _d : '_noCategory';
                    if (!metadataWithCategories[category]) {
                        metadataWithCategories[category] = {};
                    }
                    metadataWithCategories[category][schemaProperty] =
                        (_f = (_e = metadata === null || metadata === void 0 ? void 0 : metadata.metadata) === null || _e === void 0 ? void 0 : _e[schemaProperty]) !== null && _f !== void 0 ? _f : properties.default;
                    if (schemaProperty === 'code' && this.props.code) {
                        metadataWithCategories[category][schemaProperty] = this.props.code;
                    }
                    if (!schemaPropertiesByCategory[category]) {
                        schemaPropertiesByCategory[category] = {
                            type: 'object',
                            properties: {},
                            required: []
                        };
                    }
                    if ((_g = schemaMetadata.required) === null || _g === void 0 ? void 0 : _g.includes(schemaProperty)) {
                        schemaPropertiesByCategory[category].required.push(schemaProperty);
                        if (!requiredCategories.includes(category)) {
                            requiredCategories.push(category);
                        }
                    }
                    schemaPropertiesByCategory[category]['properties'][schemaProperty] =
                        properties;
                }
                if (metadataWithCategories['_noCategory']) {
                    metadataWithCategories['_noCategory']['display_name'] =
                        metadata === null || metadata === void 0 ? void 0 : metadata['display_name'];
                }
                this.schema = schema;
                ((_h = this.schema.properties) === null || _h === void 0 ? void 0 : _h.metadata).properties =
                    schemaPropertiesByCategory;
                ((_j = this.schema.properties) === null || _j === void 0 ? void 0 : _j.metadata).required =
                    requiredCategories;
                this.metadata = metadataWithCategories;
                this.title.label = (_k = metadata === null || metadata === void 0 ? void 0 : metadata.display_name) !== null && _k !== void 0 ? _k : `New ${this.schema.title}`;
                this.loading = false;
                this.update();
            }
            catch (error) {
                yield ui_components_1.RequestErrors.serverError(error);
            }
        });
    }
    /**
     * Puts the display name field in focus.
     */
    setFormFocus() {
        var _a;
        const isFocused = (_a = document
            .querySelector(`.${this.widgetClass}`)) === null || _a === void 0 ? void 0 : _a.contains(document.activeElement);
        if (!isFocused) {
            const input = document.querySelector(`.${this.widgetClass} .display_nameField input`);
            if (input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }
    }
    onAfterShow(_msg) {
        this.setFormFocus();
    }
    onUpdateRequest(msg) {
        super.onUpdateRequest(msg);
        this.setFormFocus();
    }
    /**
     * Sets the state to dirty to enable changing the display and
     * add warnings when closing with unsaved changes.
     */
    handleDirtyState(dirty) {
        this.dirty = dirty;
        if (dirty && !this.clearDirty) {
            this.clearDirty = this.props.status.setDirty();
        }
        else if (!dirty && this.clearDirty) {
            this.clearDirty.dispose();
            this.clearDirty = null;
        }
        if (dirty && !this.title.className.includes(DIRTY_CLASS)) {
            this.title.className += DIRTY_CLASS;
        }
        else if (!dirty) {
            this.title.className = this.title.className.replace(DIRTY_CLASS, '');
        }
    }
    onCloseRequest(msg) {
        if (this.dirty) {
            (0, apputils_1.showDialog)({
                title: this.props.translator.__('Close without saving?'),
                body: React.createElement("p", null, "Metadata has unsaved changes, close without saving?"),
                buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.okButton()]
            }).then((response) => {
                if (response.button.accept) {
                    this.dispose();
                    super.onCloseRequest(msg);
                }
            });
        }
        else {
            this.dispose();
            super.onCloseRequest(msg);
        }
    }
    getDefaultChoices(fieldName) {
        var _a, _b;
        if (!this.schema || !this.allMetadata) {
            return [];
        }
        const schema = (_a = this.schema.properties) === null || _a === void 0 ? void 0 : _a.metadata;
        for (const category in schema.properties) {
            const properties = schema.properties[category].properties[fieldName];
            if (!properties) {
                continue;
            }
            const defaultChoices = Object.assign([], properties.uihints.default_choices) || [];
            for (const otherMetadata of this.allMetadata) {
                if (
                // Don't include the current metadata
                otherMetadata !== ((_b = this.metadata) === null || _b === void 0 ? void 0 : _b.metadata) &&
                    // Don't add if otherMetadata hasn't defined field
                    otherMetadata.metadata[fieldName] &&
                    !(0, algorithm_1.find)(defaultChoices, (choice) => {
                        return (choice.toLowerCase() ===
                            otherMetadata.metadata[fieldName].toLowerCase());
                    })) {
                    defaultChoices.push(otherMetadata.metadata[fieldName]);
                }
            }
            return defaultChoices;
        }
        return [];
    }
    render() {
        if (this.loading) {
            return React.createElement("p", null, "Loading...");
        }
        if (!this.schema || !this.metadata) {
            return React.createElement("p", null, "Error loading metadata");
        }
        return (React.createElement(MetadataEditor_1.MetadataEditor, Object.assign({}, this.props, { schemaTop: this.schema, initialMetadata: this.metadata, setDirty: this.handleDirtyState, close: this.close, allTags: this.allTags, getDefaultChoices: this.getDefaultChoices })));
    }
}
exports.MetadataEditorWidget = MetadataEditorWidget;


/***/ }),

/***/ "./lib/MetadataWidget.js":
/*!*******************************!*\
  !*** ./lib/MetadataWidget.js ***!
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
exports.MetadataWidget = exports.MetadataDisplay = exports.METADATA_ITEM = exports.METADATA_HEADER_CLASS = exports.METADATA_CLASS = void 0;
const services_1 = __webpack_require__(/*! @elyra/services */ "webpack/sharing/consume/default/@elyra/services/@elyra/services");
const ui_components_1 = __webpack_require__(/*! @elyra/ui-components */ "webpack/sharing/consume/default/@elyra/ui-components/@elyra/ui-components");
const apputils_1 = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
const ui_components_2 = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
const signaling_1 = __webpack_require__(/*! @lumino/signaling */ "webpack/sharing/consume/default/@lumino/signaling");
const react_1 = __importDefault(__webpack_require__(/*! react */ "webpack/sharing/consume/default/react"));
const FilterTools_1 = __webpack_require__(/*! ./FilterTools */ "./lib/FilterTools.js");
const MetadataCommonService_1 = __webpack_require__(/*! ./MetadataCommonService */ "./lib/MetadataCommonService.js");
/**
 * The CSS class added to metadata widgets.
 */
exports.METADATA_CLASS = 'elyra-metadata';
exports.METADATA_HEADER_CLASS = 'elyra-metadataHeader';
exports.METADATA_ITEM = 'elyra-metadata-item';
const METADATA_HEADER_BUTTON_CLASS = 'elyra-metadataHeader-button';
const METADATA_JSON_CLASS = 'jp-RenderedJSON CodeMirror cm-s-jupyter';
const commands = {
    OPEN_METADATA_EDITOR: 'elyra-metadata-editor:open'
};
/**
 * A React Component for displaying a list of metadata
 */
class MetadataDisplay extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.deleteMetadata = (metadata) => {
            return (0, apputils_1.showDialog)({
                title: `Delete ${this.props.labelName ? this.props.labelName(metadata) : ''} ${this.props.titleContext || ''} '${metadata.display_name}'?`,
                buttons: [apputils_1.Dialog.cancelButton(), apputils_1.Dialog.okButton()]
            }).then((result) => {
                // Do nothing if the cancel button is pressed
                if (result.button.accept) {
                    services_1.MetadataService.deleteMetadata(this.props.schemaspace, metadata.name).catch((error) => __awaiter(this, void 0, void 0, function* () {
                        yield ui_components_1.RequestErrors.serverError(error);
                    }));
                }
            });
        };
        // Render display of metadata list
        this.renderMetadata = (metadata) => {
            return (react_1.default.createElement("div", { key: metadata.name, className: exports.METADATA_ITEM, style: this.state.metadata.includes(metadata) ? {} : { display: 'none' } },
                react_1.default.createElement(ui_components_1.ExpandableComponent, { displayName: metadata.display_name, tooltip: metadata.metadata.description, actionButtons: this.actionButtons(metadata) },
                    react_1.default.createElement("div", { id: metadata.name }, this.renderExpandableContent(metadata)))));
        };
        this.filteredMetadata = (searchValue, filterTags) => {
            // filter with search
            let filteredMetadata = this.props.metadata.filter((metadata) => {
                return (metadata.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                    metadata.display_name
                        .toLowerCase()
                        .includes(searchValue.toLowerCase()));
            });
            // filter with tags
            if (filterTags.length !== 0) {
                filteredMetadata = filteredMetadata.filter((metadata) => {
                    return filterTags.some((tag) => {
                        const tags = metadata.metadata.tags;
                        if (tags) {
                            return tags.includes(tag);
                        }
                        return false;
                    });
                });
            }
            this.setState({
                metadata: filteredMetadata,
                searchValue: searchValue,
                filterTags: filterTags
            });
        };
        this.state = {
            metadata: props.metadata,
            searchValue: '',
            filterTags: [],
            matchesSearch: this.matchesSearch.bind(this),
            matchesTags: this.matchesTags.bind(this)
        };
    }
    actionButtons(metadata) {
        return [
            {
                title: 'Edit',
                icon: ui_components_2.editIcon,
                onClick: () => {
                    this.props.openMetadataEditor({
                        onSave: this.props.updateMetadata,
                        schemaspace: this.props.schemaspace,
                        schema: metadata.schema_name,
                        name: metadata.name
                    });
                }
            },
            {
                title: 'Duplicate',
                icon: ui_components_2.copyIcon,
                onClick: () => {
                    MetadataCommonService_1.MetadataCommonService.duplicateMetadataInstance(this.props.schemaspace, metadata, this.props.metadata)
                        .then(() => {
                        this.props.updateMetadata();
                    })
                        .catch((error) => __awaiter(this, void 0, void 0, function* () {
                        yield ui_components_1.RequestErrors.serverError(error);
                    }));
                }
            },
            {
                title: 'Delete',
                icon: ui_components_1.trashIcon,
                onClick: () => {
                    this.deleteMetadata(metadata).then(() => {
                        this.props.updateMetadata();
                    });
                }
            }
        ];
    }
    /**
     * Classes that extend MetadataWidget should override this
     */
    renderExpandableContent(metadata) {
        const metadataWithoutTags = metadata.metadata;
        delete metadataWithoutTags.tags;
        return (react_1.default.createElement("div", { className: METADATA_JSON_CLASS },
            react_1.default.createElement(ui_components_1.JSONComponent, { json: metadataWithoutTags })));
    }
    /**
     * A function called when the `sortMetadata` property is `true`, sorts the
     * `metadata` property alphabetically by `metadata.display_name` by default.
     * Can be overridden if a different or more intensive sorting is desired.
     */
    sortMetadata() {
        this.props.metadata.sort((a, b) => a.display_name.localeCompare(b.display_name));
    }
    getActiveTags() {
        const activeTags = [];
        for (const metadata of this.props.metadata) {
            const metadataTags = metadata.metadata.tags;
            if (metadataTags) {
                for (const tag of metadataTags) {
                    if (!activeTags.includes(tag)) {
                        activeTags.push(tag);
                    }
                }
            }
        }
        return activeTags;
    }
    matchesTags(filterTags, metadata) {
        // True if there are no tags selected or if there are tags that match
        // tags of metadata
        const tags = metadata.metadata.tags;
        return (filterTags.size === 0 || (tags === null || tags === void 0 ? void 0 : tags.some((tag) => filterTags.has(tag))));
    }
    matchesSearch(searchValue, metadata) {
        searchValue = searchValue.toLowerCase();
        // True if search string is in name or display_name,
        // or if the search string is empty
        return (metadata.name.toLowerCase().includes(searchValue) ||
            metadata.display_name.toLowerCase().includes(searchValue));
    }
    static getDerivedStateFromProps(props, state) {
        if (state.searchValue === '' && state.filterTags.length === 0) {
            return {
                metadata: props.metadata,
                searchValue: '',
                filterTags: [],
                matchesSearch: state.matchesSearch,
                matchesTags: state.matchesTags
            };
        }
        if (state.searchValue !== '' || state.filterTags.length !== 0) {
            const filterTags = new Set(state.filterTags);
            const searchValue = state.searchValue.toLowerCase().trim();
            const newMetadata = props.metadata.filter((metadata) => state.matchesSearch(searchValue, metadata) &&
                state.matchesTags(filterTags, metadata));
            return {
                metadata: newMetadata,
                searchValue: state.searchValue,
                filterTags: state.filterTags,
                matchesSearch: state.matchesSearch,
                matchesTags: state.matchesTags
            };
        }
        return state;
    }
    render() {
        if (this.props.sortMetadata) {
            this.sortMetadata();
        }
        return (react_1.default.createElement("div", { id: "elyra-metadata", className: this.props.className },
            react_1.default.createElement(FilterTools_1.FilterTools, { onFilter: this.filteredMetadata, tags: this.getActiveTags(), omitTags: this.props.omitTags, schemaspace: `${this.props.schemaspace}` }),
            react_1.default.createElement("div", null, this.props.metadata.map(this.renderMetadata))));
    }
}
exports.MetadataDisplay = MetadataDisplay;
/**
 * A abstract widget for viewing metadata.
 */
class MetadataWidget extends apputils_1.ReactWidget {
    constructor(props) {
        super();
        this.openMetadataEditor = (args) => {
            this.props.app.commands.execute(commands.OPEN_METADATA_EDITOR, args);
        };
        this.addClass('elyra-metadata');
        this.props = props;
        this.renderSignal = new signaling_1.Signal(this);
        this.titleContext = props.titleContext;
        this.addLabel = props.addLabel;
        this.fetchMetadata = this.fetchMetadata.bind(this);
        this.getSchemas = this.getSchemas.bind(this);
        this.updateMetadata = this.updateMetadata.bind(this);
        this.refreshMetadata = this.refreshMetadata.bind(this);
        this.openMetadataEditor = this.openMetadataEditor.bind(this);
        this.renderDisplay = this.renderDisplay.bind(this);
        this.addMetadata = this.addMetadata.bind(this);
        this.getSchemas();
    }
    getSchemas() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                this.schemas = yield services_1.MetadataService.getSchema(this.props.schemaspace);
                const sortedSchema = (_b = (_a = this.schemas) === null || _a === void 0 ? void 0 : _a.sort((a, b) => { var _a, _b; return ((_a = a.title) !== null && _a !== void 0 ? _a : '').localeCompare((_b = b.title) !== null && _b !== void 0 ? _b : ''); })) !== null && _b !== void 0 ? _b : [];
                if (sortedSchema.length > 1) {
                    for (const schema of sortedSchema) {
                        this.props.app.contextMenu.addItem({
                            selector: `#${this.props.schemaspace} .elyra-metadataHeader-addButton`,
                            command: 'elyra-metadata-editor:open',
                            args: {
                                onSave: this.updateMetadata,
                                schemaspace: this.props.schemaspace,
                                schema: schema.name,
                                title: schema.title,
                                titleContext: this.props.titleContext,
                                addLabel: this.props.addLabel,
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
            titleContext
        });
    }
    /**
     * Request metadata from server and format it as expected by the
     * instance of `MetadataDisplay` rendered in `renderDisplay`
     *
     * Classes that extend MetadataWidget should override this
     *
     * @returns metadata in the format expected by `renderDisplay`
     */
    fetchMetadata() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield services_1.MetadataService.getMetadata(this.props.schemaspace);
            }
            catch (error) {
                yield ui_components_1.RequestErrors.serverError(error);
                return;
            }
        });
    }
    updateMetadata() {
        this.fetchMetadata().then((metadata) => {
            if (!metadata) {
                return;
            }
            this.renderSignal.emit(metadata);
        });
    }
    refreshMetadata() {
        this.updateMetadata();
    }
    // Triggered when the widget button on side panel is clicked
    onAfterShow(_msg) {
        this.updateMetadata();
    }
    omitTags() {
        var _a, _b, _c;
        for (const schema of (_a = this.schemas) !== null && _a !== void 0 ? _a : []) {
            const metadata = (_b = schema.properties) === null || _b === void 0 ? void 0 : _b.metadata;
            if ((_c = metadata === null || metadata === void 0 ? void 0 : metadata.properties) === null || _c === void 0 ? void 0 : _c.tags) {
                return false;
            }
        }
        return true;
    }
    /**
     * Classes that extend MetadataWidget should override this
     *
     * @returns a rendered instance of `MetadataDisplay`
     */
    renderDisplay(metadata) {
        if (Array.isArray(metadata) && !metadata.length) {
            // Empty metadata
            return (react_1.default.createElement("div", null,
                react_1.default.createElement("br", null),
                react_1.default.createElement("h6", { className: "elyra-no-metadata-msg" },
                    "Click the + button to add ",
                    this.props.display_name.toLowerCase())));
        }
        return (react_1.default.createElement(MetadataDisplay, { metadata: metadata, updateMetadata: this.updateMetadata, openMetadataEditor: this.openMetadataEditor, schemaspace: this.props.schemaspace, sortMetadata: true, className: `${exports.METADATA_CLASS}-${this.props.schemaspace}`, omitTags: this.omitTags(), titleContext: this.props.titleContext }));
    }
    render() {
        var _a, _b;
        const singleSchema = ((_a = this.schemas) === null || _a === void 0 ? void 0 : _a.length) === 1;
        return (react_1.default.createElement("div", { id: this.props.schemaspace, className: exports.METADATA_CLASS },
            react_1.default.createElement("header", { className: exports.METADATA_HEADER_CLASS },
                react_1.default.createElement("div", { style: { display: 'flex' } },
                    react_1.default.createElement(this.props.icon.react, { tag: "span", width: "auto", height: "24px", verticalAlign: "middle", marginRight: "5px" }),
                    react_1.default.createElement("p", null,
                        " ",
                        this.props.display_name,
                        " ")),
                react_1.default.createElement("div", { className: "elyra-metadataHeader-buttons" },
                    react_1.default.createElement("button", { className: METADATA_HEADER_BUTTON_CLASS, onClick: () => {
                            this.refreshMetadata();
                        }, title: (_b = this.refreshButtonTooltip) !== null && _b !== void 0 ? _b : 'Refresh list' },
                        react_1.default.createElement(ui_components_2.refreshIcon.react, { tag: "span", elementPosition: "center", width: "16px" })),
                    react_1.default.createElement("div", { className: "elyra-metadataHeader-buttonDivider" }),
                    react_1.default.createElement("button", { className: `${METADATA_HEADER_BUTTON_CLASS} elyra-metadataHeader-addButton`, onClick: singleSchema
                            ? () => {
                                var _a, _b;
                                return this.addMetadata((_b = (_a = this.schemas) === null || _a === void 0 ? void 0 : _a[0].name) !== null && _b !== void 0 ? _b : '', this.titleContext);
                            }
                            : // eslint-disable-next-line @typescript-eslint/no-explicit-any -- types mismatch
                                (event) => {
                                    this.props.app.contextMenu.open(event);
                                }, title: `Create new ${this.addLabel}` },
                        react_1.default.createElement(ui_components_2.addIcon.react, { tag: "span", elementPosition: "center", width: "16px" })))),
            react_1.default.createElement(apputils_1.UseSignal, { signal: this.renderSignal, initialArgs: [] }, (_, metadata) => this.renderDisplay(metadata !== null && metadata !== void 0 ? metadata : []))));
    }
}
exports.MetadataWidget = MetadataWidget;


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
__webpack_require__(/*! ../style/index.css */ "./style/index.css");
__exportStar(__webpack_require__(/*! ./MetadataEditor */ "./lib/MetadataEditor.js"), exports);
__exportStar(__webpack_require__(/*! ./MetadataWidget */ "./lib/MetadataWidget.js"), exports);
__exportStar(__webpack_require__(/*! ./MetadataCommonService */ "./lib/MetadataCommonService.js"), exports);
__exportStar(__webpack_require__(/*! ./MetadataEditorWidget */ "./lib/MetadataEditorWidget.js"), exports);


/***/ })

}]);
//# sourceMappingURL=lib_index_js.c37bd054a3ca3b7c9bd5.js.map