"use strict";
(self["webpackChunk_elyra_ui_components"] = self["webpackChunk_elyra_ui_components"] || []).push([["style_index_css"],{

/***/ "../../node_modules/css-loader/dist/cjs.js!./style/formeditor.css":
/*!************************************************************************!*\
  !*** ../../node_modules/css-loader/dist/cjs.js!./style/formeditor.css ***!
  \************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "../../node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "../../node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/getUrl.js */ "../../node_modules/css-loader/dist/runtime/getUrl.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
// Imports



var ___CSS_LOADER_URL_IMPORT_0___ = new URL(/* asset import */ __webpack_require__(/*! data:image/svg+xml;utf8,<svg fill=%27black%27 height=%2724%27 viewBox=%270 0 24 24%27 width=%2724%27 xmlns=%27http://www.w3.org/2000/svg%27><path d=%27M7 10l5 5 5-5z%27/><path d=%27M0 0h24v24H0z%27 fill=%27none%27/></svg> */ "data:image/svg+xml;utf8,<svg fill=%27black%27 height=%2724%27 viewBox=%270 0 24 24%27 width=%2724%27 xmlns=%27http://www.w3.org/2000/svg%27><path d=%27M7 10l5 5 5-5z%27/><path d=%27M0 0h24v24H0z%27 fill=%27none%27/></svg>"), __webpack_require__.b);
var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_0___);
// Module
___CSS_LOADER_EXPORT___.push([module.id, `/*
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

.elyra-tags {
  margin-top: 8px;
}

.elyra-formEditor-form-tags input {
  margin: 0;
}

.rjsf > .form-group.field,
.form-group.field.tagsField,
.form-group.field.languageField {
  width: 100%;
}

.panel.panel-danger.errors,
p#root__description,
button.btn[type='submit'] {
  display: none;
}

li.text-danger {
  color: var(--jp-error-color1);
  padding: 5px 0 0 9px;
}

form.rjsf {
  width: 100%;
}

fieldset#root > div > fieldset {
  display: flex;
  flex-wrap: wrap;
  min-inline-size: auto;
}

label.control-label {
  font-size: var(--jp-content-font-size1);
  font-weight: 500;
}

fieldset#root {
  display: contents;
}

.form-group.field {
  padding: 0px 30px 15px 0;
  display: flex;
  flex-direction: column;
  width: 50%;
  position: relative;
  height: fit-content;
  min-width: 400px;
}

.elyra-formEditor datalist {
  display: none;
}

.elyra-inputTagList {
  list-style: none;
}

.elyra-inputTag {
  margin-left: 8px;
  margin-right: 8px;
}

button.elyra-inputTag {
  cursor: pointer;
  background: none;
  border: none;
  color: var(--jp-ui-font-color2);
  padding: 0;
  font-size: var(--jp-ui-font-size1);
}

.field-object > fieldset > legend {
  font-size: var(--jp-content-font-size3);
  padding-bottom: 15px;
  font-weight: 600;
}

legend#root__noCategory__title {
  display: none;
}

.form-group input[readonly] {
  background: var(--jp-border-color3);
}

.form-group.field.field-object {
  width: 100%;
  padding: 0;
}

.jp-ArrayOperations button:disabled {
  cursor: not-allowed;
}

.elyra-passwordFieldButton {
  border: none;
  border-radius: 5px;
  background: var(--jp-input-active-background);
  position: absolute;
  right: 6px;
  bottom: 5px;
}

.elyra-passwordFieldButton > div {
  display: grid;
}

.elyra-passwordField {
  position: relative;
  display: flex;
}

.elyra-passwordFieldButton:hover {
  background-color: var(--jp-border-color2);
}

.elyra-passwordFieldButton svg {
  width: 25px;
  display: flex;
  color: var(--jp-content-font-color0);
}

input.elyra-inputTag {
  font-size: var(--jp-ui-font-size1);
  background: none;
  border: none;
  color: var(--jp-ui-font-color2);
  font-size: var(--jp-ui-font-size1);
  width: 80px;
  height: 15px;
}

.form-group .form-control {
  padding: 8px;
  border: 1px solid var(--jp-border-color1);
  border-radius: 4px;
  font-size: var(--jp-content-font-size1);
  margin-top: 10px;
  width: 100%;
  background-color: var(--jp-input-active-background);
  color: var(--jp-content-font-color0);
}

.elyra-editor-tagList {
  list-style: none;
  margin-left: -3px;
  margin-top: 4px;
}

.elyra-editor-tag {
  margin-left: 3px;
  margin-right: 3px;
  padding: 0 12px;
  height: 24px;
}

button.elyra-editor-tag {
  cursor: pointer;
  color: var(--jp-ui-font-color2);
  font-size: var(--jp-ui-font-size1);
}

button.elyra-editor-tag.applied-tag {
  color: var(--jp-ui-font-color1);
}

button.elyra-editor-tag.unapplied-tag {
  color: var(--jp-ui-font-color2);
  white-space: nowrap;
}

.elyra-editor-tag.tag.unapplied-tag input {
  border: none;
}

.elyra-formEditor h3 {
  flex-basis: 100%;
  margin-bottom: 15px;
  color: var(--jp-ui-font-color1);
}

.elyra-formEditor .elyra-form-code.jp-CodeMirrorEditor {
  background-color: var(--jp-cell-editor-background);
  border: var(--jp-border-width) solid var(--jp-input-border-color);
  overflow-y: auto;
  resize: vertical;
  min-height: 150px;
  height: 150px;
  padding-bottom: 10px;
  cursor: initial;
  margin-top: 5px;
}

.elyra-formEditor .CodeMirror.cm-s-jupyter {
  background-color: inherit;
  height: 100%;
}

.elyra-formEditor .elyra-formEditor-code {
  height: auto;
  flex-basis: 100%;
  display: flex;
  flex-direction: column;
}

.elyra-formEditor-formInput {
  margin: 10px;
  flex-basis: 45%;
}

.elyra-formEditor .elyra-formEditor-saveButton {
  flex-basis: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 15px;
}

.elyra-formEditor .form-group.field.elyra-formEditor-form-code,
.elyra-formEditor .form-group.field.elyra-formEditor-form-tags {
  width: 80%;
}

.field-description {
  display: none;
}

.description-wrapper:hover .field-description {
  color: var(--jp-content-font-color1);
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translate(-50%, -10%);
  background-color: var(--jp-border-color3);
  border: 1px solid var(--jp-border-color2);
  padding: 5px;
  border-radius: 5px;
  display: initial;
  max-width: 22ch;
  width: max-content;
  word-wrap: break-word;
  z-index: 1;
}

.elyra-formEditor select.form-control {
  -moz-appearance: none !important;
  -webkit-appearance: none;
  background-image: url(${___CSS_LOADER_URL_REPLACEMENT_0___});
  background-repeat: no-repeat;
  background-position-x: calc(100% - 4px);
  background-position-y: 50%;
}

.elyra-formEditor .checkbox label > span {
  display: flex;
  align-items: center;
  padding: 3px;
  width: fit-content;
}

.elyra-formEditor#pipeline-parameters .field-boolean .checkbox label {
  margin: 0;
}

.elyra-formEditor .field-boolean .checkbox label > span {
  display: none;
}

.elyra-formEditor .field-boolean {
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
  align-items: center;
}

.elyra-formEditor .checkboxes {
  height: 6em;
  overflow: scroll;
  border: 1px solid var(--jp-border-color2);
  border-radius: 0.5em;
  padding: 3px;
  resize: vertical;
}

.elyra-formEditor .checkboxes::-webkit-scrollbar {
  -webkit-appearance: none;
  width: 7px;
  height: 7px;
}

.elyra-formEditor .checkboxes::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 1px rgba(255, 255, 255, 0.5);
}

.elyra-formEditor
  .label-header
  .description-wrapper
  p.field-description.short-title {
  transform: translate(-20%, -10%);
}

.elyra-formEditor .form-group.field-array .label-header {
  margin-bottom: 10px;
}

.description-wrapper {
  width: fit-content;
  position: relative;
}

.description-button {
  border-radius: 100%;
  margin-left: 6px;
  border: 1px solid var(--jp-border-color1);
  background: none;
  color: var(--jp-border-color0);
  padding: 2px 5px;
}

.label-header {
  display: flex;
  align-items: center;
}

.elyra-formEditor .array-item {
  display: flex;
  margin-bottom: 15px;
}

.elyra-formEditor .field-array button {
  border-radius: 3px;
  margin-top: 4px;
}

.elyra-formEditor .array-item .form-group.field {
  padding-bottom: 0;
  padding-right: 10px;
}

.elyra-formEditor .array-item .form-group.field input,
.elyra-formEditor .array-item .form-group.field select {
  margin-top: 0;
}

.elyra-formEditor .jp-ArrayOperations {
  display: flex;
}

.elyra-formEditor .jp-ArrayOperations button {
  width: max-content;
}

.elyra-formEditor .field.field-array {
  width: 100%;
}
`, "",{"version":3,"sources":["webpack://./style/formeditor.css"],"names":[],"mappings":"AAAA;;;;;;;;;;;;;;EAcE;;AAEF;EACE,eAAe;AACjB;;AAEA;EACE,SAAS;AACX;;AAEA;;;EAGE,WAAW;AACb;;AAEA;;;EAGE,aAAa;AACf;;AAEA;EACE,6BAA6B;EAC7B,oBAAoB;AACtB;;AAEA;EACE,WAAW;AACb;;AAEA;EACE,aAAa;EACb,eAAe;EACf,qBAAqB;AACvB;;AAEA;EACE,uCAAuC;EACvC,gBAAgB;AAClB;;AAEA;EACE,iBAAiB;AACnB;;AAEA;EACE,wBAAwB;EACxB,aAAa;EACb,sBAAsB;EACtB,UAAU;EACV,kBAAkB;EAClB,mBAAmB;EACnB,gBAAgB;AAClB;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,gBAAgB;AAClB;;AAEA;EACE,gBAAgB;EAChB,iBAAiB;AACnB;;AAEA;EACE,eAAe;EACf,gBAAgB;EAChB,YAAY;EACZ,+BAA+B;EAC/B,UAAU;EACV,kCAAkC;AACpC;;AAEA;EACE,uCAAuC;EACvC,oBAAoB;EACpB,gBAAgB;AAClB;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,mCAAmC;AACrC;;AAEA;EACE,WAAW;EACX,UAAU;AACZ;;AAEA;EACE,mBAAmB;AACrB;;AAEA;EACE,YAAY;EACZ,kBAAkB;EAClB,6CAA6C;EAC7C,kBAAkB;EAClB,UAAU;EACV,WAAW;AACb;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,kBAAkB;EAClB,aAAa;AACf;;AAEA;EACE,yCAAyC;AAC3C;;AAEA;EACE,WAAW;EACX,aAAa;EACb,oCAAoC;AACtC;;AAEA;EACE,kCAAkC;EAClC,gBAAgB;EAChB,YAAY;EACZ,+BAA+B;EAC/B,kCAAkC;EAClC,WAAW;EACX,YAAY;AACd;;AAEA;EACE,YAAY;EACZ,yCAAyC;EACzC,kBAAkB;EAClB,uCAAuC;EACvC,gBAAgB;EAChB,WAAW;EACX,mDAAmD;EACnD,oCAAoC;AACtC;;AAEA;EACE,gBAAgB;EAChB,iBAAiB;EACjB,eAAe;AACjB;;AAEA;EACE,gBAAgB;EAChB,iBAAiB;EACjB,eAAe;EACf,YAAY;AACd;;AAEA;EACE,eAAe;EACf,+BAA+B;EAC/B,kCAAkC;AACpC;;AAEA;EACE,+BAA+B;AACjC;;AAEA;EACE,+BAA+B;EAC/B,mBAAmB;AACrB;;AAEA;EACE,YAAY;AACd;;AAEA;EACE,gBAAgB;EAChB,mBAAmB;EACnB,+BAA+B;AACjC;;AAEA;EACE,kDAAkD;EAClD,iEAAiE;EACjE,gBAAgB;EAChB,gBAAgB;EAChB,iBAAiB;EACjB,aAAa;EACb,oBAAoB;EACpB,eAAe;EACf,eAAe;AACjB;;AAEA;EACE,yBAAyB;EACzB,YAAY;AACd;;AAEA;EACE,YAAY;EACZ,gBAAgB;EAChB,aAAa;EACb,sBAAsB;AACxB;;AAEA;EACE,YAAY;EACZ,eAAe;AACjB;;AAEA;EACE,gBAAgB;EAChB,aAAa;EACb,sBAAsB;EACtB,oBAAoB;AACtB;;AAEA;;EAEE,UAAU;AACZ;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,oCAAoC;EACpC,kBAAkB;EAClB,YAAY;EACZ,SAAS;EACT,gCAAgC;EAChC,yCAAyC;EACzC,yCAAyC;EACzC,YAAY;EACZ,kBAAkB;EAClB,gBAAgB;EAChB,eAAe;EACf,kBAAkB;EAClB,qBAAqB;EACrB,UAAU;AACZ;;AAEA;EACE,gCAAgC;EAChC,wBAAwB;EACxB,yDAAsN;EACtN,4BAA4B;EAC5B,uCAAuC;EACvC,0BAA0B;AAC5B;;AAEA;EACE,aAAa;EACb,mBAAmB;EACnB,YAAY;EACZ,kBAAkB;AACpB;;AAEA;EACE,SAAS;AACX;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,aAAa;EACb,2BAA2B;EAC3B,yBAAyB;EACzB,mBAAmB;AACrB;;AAEA;EACE,WAAW;EACX,gBAAgB;EAChB,yCAAyC;EACzC,oBAAoB;EACpB,YAAY;EACZ,gBAAgB;AAClB;;AAEA;EACE,wBAAwB;EACxB,UAAU;EACV,WAAW;AACb;;AAEA;EACE,kBAAkB;EAClB,oCAAoC;EACpC,4CAA4C;AAC9C;;AAEA;;;;EAIE,gCAAgC;AAClC;;AAEA;EACE,mBAAmB;AACrB;;AAEA;EACE,kBAAkB;EAClB,kBAAkB;AACpB;;AAEA;EACE,mBAAmB;EACnB,gBAAgB;EAChB,yCAAyC;EACzC,gBAAgB;EAChB,8BAA8B;EAC9B,gBAAgB;AAClB;;AAEA;EACE,aAAa;EACb,mBAAmB;AACrB;;AAEA;EACE,aAAa;EACb,mBAAmB;AACrB;;AAEA;EACE,kBAAkB;EAClB,eAAe;AACjB;;AAEA;EACE,iBAAiB;EACjB,mBAAmB;AACrB;;AAEA;;EAEE,aAAa;AACf;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,kBAAkB;AACpB;;AAEA;EACE,WAAW;AACb","sourcesContent":["/*\r\n * Copyright 2018-2025 Elyra Authors\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the \"License\");\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n * http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an \"AS IS\" BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\n.elyra-tags {\r\n  margin-top: 8px;\r\n}\r\n\r\n.elyra-formEditor-form-tags input {\r\n  margin: 0;\r\n}\r\n\r\n.rjsf > .form-group.field,\r\n.form-group.field.tagsField,\r\n.form-group.field.languageField {\r\n  width: 100%;\r\n}\r\n\r\n.panel.panel-danger.errors,\r\np#root__description,\r\nbutton.btn[type='submit'] {\r\n  display: none;\r\n}\r\n\r\nli.text-danger {\r\n  color: var(--jp-error-color1);\r\n  padding: 5px 0 0 9px;\r\n}\r\n\r\nform.rjsf {\r\n  width: 100%;\r\n}\r\n\r\nfieldset#root > div > fieldset {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  min-inline-size: auto;\r\n}\r\n\r\nlabel.control-label {\r\n  font-size: var(--jp-content-font-size1);\r\n  font-weight: 500;\r\n}\r\n\r\nfieldset#root {\r\n  display: contents;\r\n}\r\n\r\n.form-group.field {\r\n  padding: 0px 30px 15px 0;\r\n  display: flex;\r\n  flex-direction: column;\r\n  width: 50%;\r\n  position: relative;\r\n  height: fit-content;\r\n  min-width: 400px;\r\n}\r\n\r\n.elyra-formEditor datalist {\r\n  display: none;\r\n}\r\n\r\n.elyra-inputTagList {\r\n  list-style: none;\r\n}\r\n\r\n.elyra-inputTag {\r\n  margin-left: 8px;\r\n  margin-right: 8px;\r\n}\r\n\r\nbutton.elyra-inputTag {\r\n  cursor: pointer;\r\n  background: none;\r\n  border: none;\r\n  color: var(--jp-ui-font-color2);\r\n  padding: 0;\r\n  font-size: var(--jp-ui-font-size1);\r\n}\r\n\r\n.field-object > fieldset > legend {\r\n  font-size: var(--jp-content-font-size3);\r\n  padding-bottom: 15px;\r\n  font-weight: 600;\r\n}\r\n\r\nlegend#root__noCategory__title {\r\n  display: none;\r\n}\r\n\r\n.form-group input[readonly] {\r\n  background: var(--jp-border-color3);\r\n}\r\n\r\n.form-group.field.field-object {\r\n  width: 100%;\r\n  padding: 0;\r\n}\r\n\r\n.jp-ArrayOperations button:disabled {\r\n  cursor: not-allowed;\r\n}\r\n\r\n.elyra-passwordFieldButton {\r\n  border: none;\r\n  border-radius: 5px;\r\n  background: var(--jp-input-active-background);\r\n  position: absolute;\r\n  right: 6px;\r\n  bottom: 5px;\r\n}\r\n\r\n.elyra-passwordFieldButton > div {\r\n  display: grid;\r\n}\r\n\r\n.elyra-passwordField {\r\n  position: relative;\r\n  display: flex;\r\n}\r\n\r\n.elyra-passwordFieldButton:hover {\r\n  background-color: var(--jp-border-color2);\r\n}\r\n\r\n.elyra-passwordFieldButton svg {\r\n  width: 25px;\r\n  display: flex;\r\n  color: var(--jp-content-font-color0);\r\n}\r\n\r\ninput.elyra-inputTag {\r\n  font-size: var(--jp-ui-font-size1);\r\n  background: none;\r\n  border: none;\r\n  color: var(--jp-ui-font-color2);\r\n  font-size: var(--jp-ui-font-size1);\r\n  width: 80px;\r\n  height: 15px;\r\n}\r\n\r\n.form-group .form-control {\r\n  padding: 8px;\r\n  border: 1px solid var(--jp-border-color1);\r\n  border-radius: 4px;\r\n  font-size: var(--jp-content-font-size1);\r\n  margin-top: 10px;\r\n  width: 100%;\r\n  background-color: var(--jp-input-active-background);\r\n  color: var(--jp-content-font-color0);\r\n}\r\n\r\n.elyra-editor-tagList {\r\n  list-style: none;\r\n  margin-left: -3px;\r\n  margin-top: 4px;\r\n}\r\n\r\n.elyra-editor-tag {\r\n  margin-left: 3px;\r\n  margin-right: 3px;\r\n  padding: 0 12px;\r\n  height: 24px;\r\n}\r\n\r\nbutton.elyra-editor-tag {\r\n  cursor: pointer;\r\n  color: var(--jp-ui-font-color2);\r\n  font-size: var(--jp-ui-font-size1);\r\n}\r\n\r\nbutton.elyra-editor-tag.applied-tag {\r\n  color: var(--jp-ui-font-color1);\r\n}\r\n\r\nbutton.elyra-editor-tag.unapplied-tag {\r\n  color: var(--jp-ui-font-color2);\r\n  white-space: nowrap;\r\n}\r\n\r\n.elyra-editor-tag.tag.unapplied-tag input {\r\n  border: none;\r\n}\r\n\r\n.elyra-formEditor h3 {\r\n  flex-basis: 100%;\r\n  margin-bottom: 15px;\r\n  color: var(--jp-ui-font-color1);\r\n}\r\n\r\n.elyra-formEditor .elyra-form-code.jp-CodeMirrorEditor {\r\n  background-color: var(--jp-cell-editor-background);\r\n  border: var(--jp-border-width) solid var(--jp-input-border-color);\r\n  overflow-y: auto;\r\n  resize: vertical;\r\n  min-height: 150px;\r\n  height: 150px;\r\n  padding-bottom: 10px;\r\n  cursor: initial;\r\n  margin-top: 5px;\r\n}\r\n\r\n.elyra-formEditor .CodeMirror.cm-s-jupyter {\r\n  background-color: inherit;\r\n  height: 100%;\r\n}\r\n\r\n.elyra-formEditor .elyra-formEditor-code {\r\n  height: auto;\r\n  flex-basis: 100%;\r\n  display: flex;\r\n  flex-direction: column;\r\n}\r\n\r\n.elyra-formEditor-formInput {\r\n  margin: 10px;\r\n  flex-basis: 45%;\r\n}\r\n\r\n.elyra-formEditor .elyra-formEditor-saveButton {\r\n  flex-basis: 100%;\r\n  display: flex;\r\n  flex-direction: column;\r\n  padding-bottom: 15px;\r\n}\r\n\r\n.elyra-formEditor .form-group.field.elyra-formEditor-form-code,\r\n.elyra-formEditor .form-group.field.elyra-formEditor-form-tags {\r\n  width: 80%;\r\n}\r\n\r\n.field-description {\r\n  display: none;\r\n}\r\n\r\n.description-wrapper:hover .field-description {\r\n  color: var(--jp-content-font-color1);\r\n  position: absolute;\r\n  bottom: 110%;\r\n  left: 50%;\r\n  transform: translate(-50%, -10%);\r\n  background-color: var(--jp-border-color3);\r\n  border: 1px solid var(--jp-border-color2);\r\n  padding: 5px;\r\n  border-radius: 5px;\r\n  display: initial;\r\n  max-width: 22ch;\r\n  width: max-content;\r\n  word-wrap: break-word;\r\n  z-index: 1;\r\n}\r\n\r\n.elyra-formEditor select.form-control {\r\n  -moz-appearance: none !important;\r\n  -webkit-appearance: none;\r\n  background-image: url(\"data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>\");\r\n  background-repeat: no-repeat;\r\n  background-position-x: calc(100% - 4px);\r\n  background-position-y: 50%;\r\n}\r\n\r\n.elyra-formEditor .checkbox label > span {\r\n  display: flex;\r\n  align-items: center;\r\n  padding: 3px;\r\n  width: fit-content;\r\n}\r\n\r\n.elyra-formEditor#pipeline-parameters .field-boolean .checkbox label {\r\n  margin: 0;\r\n}\r\n\r\n.elyra-formEditor .field-boolean .checkbox label > span {\r\n  display: none;\r\n}\r\n\r\n.elyra-formEditor .field-boolean {\r\n  display: flex;\r\n  flex-direction: row-reverse;\r\n  justify-content: flex-end;\r\n  align-items: center;\r\n}\r\n\r\n.elyra-formEditor .checkboxes {\r\n  height: 6em;\r\n  overflow: scroll;\r\n  border: 1px solid var(--jp-border-color2);\r\n  border-radius: 0.5em;\r\n  padding: 3px;\r\n  resize: vertical;\r\n}\r\n\r\n.elyra-formEditor .checkboxes::-webkit-scrollbar {\r\n  -webkit-appearance: none;\r\n  width: 7px;\r\n  height: 7px;\r\n}\r\n\r\n.elyra-formEditor .checkboxes::-webkit-scrollbar-thumb {\r\n  border-radius: 4px;\r\n  background-color: rgba(0, 0, 0, 0.5);\r\n  box-shadow: 0 0 1px rgba(255, 255, 255, 0.5);\r\n}\r\n\r\n.elyra-formEditor\r\n  .label-header\r\n  .description-wrapper\r\n  p.field-description.short-title {\r\n  transform: translate(-20%, -10%);\r\n}\r\n\r\n.elyra-formEditor .form-group.field-array .label-header {\r\n  margin-bottom: 10px;\r\n}\r\n\r\n.description-wrapper {\r\n  width: fit-content;\r\n  position: relative;\r\n}\r\n\r\n.description-button {\r\n  border-radius: 100%;\r\n  margin-left: 6px;\r\n  border: 1px solid var(--jp-border-color1);\r\n  background: none;\r\n  color: var(--jp-border-color0);\r\n  padding: 2px 5px;\r\n}\r\n\r\n.label-header {\r\n  display: flex;\r\n  align-items: center;\r\n}\r\n\r\n.elyra-formEditor .array-item {\r\n  display: flex;\r\n  margin-bottom: 15px;\r\n}\r\n\r\n.elyra-formEditor .field-array button {\r\n  border-radius: 3px;\r\n  margin-top: 4px;\r\n}\r\n\r\n.elyra-formEditor .array-item .form-group.field {\r\n  padding-bottom: 0;\r\n  padding-right: 10px;\r\n}\r\n\r\n.elyra-formEditor .array-item .form-group.field input,\r\n.elyra-formEditor .array-item .form-group.field select {\r\n  margin-top: 0;\r\n}\r\n\r\n.elyra-formEditor .jp-ArrayOperations {\r\n  display: flex;\r\n}\r\n\r\n.elyra-formEditor .jp-ArrayOperations button {\r\n  width: max-content;\r\n}\r\n\r\n.elyra-formEditor .field.field-array {\r\n  width: 100%;\r\n}\r\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "../../node_modules/css-loader/dist/cjs.js!./style/index.css":
/*!*******************************************************************!*\
  !*** ../../node_modules/css-loader/dist/cjs.js!./style/index.css ***!
  \*******************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "../../node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "../../node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_formeditor_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! -!../../../node_modules/css-loader/dist/cjs.js!./formeditor.css */ "../../node_modules/css-loader/dist/cjs.js!./style/formeditor.css");
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/getUrl.js */ "../../node_modules/css-loader/dist/runtime/getUrl.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_3__);
// Imports




var ___CSS_LOADER_URL_IMPORT_0___ = new URL(/* asset import */ __webpack_require__(/*! ./icons/r-logo.svg */ "./style/icons/r-logo.svg?f25c"), __webpack_require__.b);
var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
___CSS_LOADER_EXPORT___.i(_node_modules_css_loader_dist_cjs_js_formeditor_css__WEBPACK_IMPORTED_MODULE_2__["default"]);
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_3___default()(___CSS_LOADER_URL_IMPORT_0___);
// Module
___CSS_LOADER_EXPORT___.push([module.id, `/*
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

.elyra-expandableContainer-button,
.elyra-expandableContainer-button.jp-mod-styled {
  background-color: transparent;
  vertical-align: middle;
  padding: 0;
  width: 20px;
}

.elyra-expandableContainer-button:hover {
  cursor: pointer;
}

.elyra-expandableContainer-actionButton:hover {
  background-color: var(--jp-layout-color1);
}

.elyra-expandableContainer-actionButton:active {
  background-color: var(--jp-layout-color2);
}

.elyra-expandableContainer-title {
  align-items: center;
  display: flex;
  flex-direction: row;
  padding: 0px 4px;
  height: 36px;
}

.elyra-expandableContainer-title:hover {
  background: var(--jp-layout-color2);
}

.elyra-expandableContainer-name {
  flex-grow: 1;
  font-size: var(--jp-ui-font-size1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 4px 0 4px 2px;
  line-height: 28px;
}

.elyra-expandableContainer-name:hover {
  cursor: pointer;
}

.elyra-button {
  background-repeat: no-repeat;
  background-position: center;
  border: none;
  height: 100%;
}

.elyra-expandableContainer-details-visible {
  overflow-x: auto;
  overflow-y: auto;
  display: block;
  padding: 5px;
  margin: 5px;
  border: 1px solid var(--jp-border-color2);
  border-radius: 2px;
  color: var(--jp-ui-font-color1);
  background-color: var(--jp-layout-color1);
}

.elyra-expandableContainer-details-visible textarea {
  color: var(--jp-ui-font-color1);
}

.elyra-expandableContainer-details-hidden {
  display: none;
}

.elyra-expandableContainer-action-buttons {
  display: inline-flex;
  align-self: flex-end;
  height: 100%;
}

.elyra-errorDialog-messageDisplay pre {
  min-height: 125px;
  height: 100%;
  width: 100%;
  resize: none;
  overflow-x: scroll;
}

.elyra-errorDialog-messageDisplay {
  padding-bottom: 5px;
  display: flex;
  flex-direction: column;
  height: 100%;
  white-space: pre-line;
}

.elyra-errorDialog-messageDisplay > div:nth-child(2) {
  margin: 15px 0;
  display: flex;
  flex: 1;
  min-height: 0px;
  flex-direction: column;
}

/* temporary fix until this is addressed in jupyterlab */
.lm-TabBar-tabIcon svg {
  height: auto;
}

.jp-Dialog-content {
  resize: both;
}

.elyra-DialogDefaultButton.jp-mod-styled:hover:disabled,
.elyra-DialogDefaultButton.jp-mod-styled:active:disabled,
.elyra-DialogDefaultButton.jp-mod-styled:focus:disabled,
.elyra-DialogDefaultButton.jp-mod-styled:disabled {
  background-color: var(--jp-layout-color3);
  opacity: 0.3;
  pointer-events: none;
}

/* icons */

[data-jp-theme-light='false'] .elyra-pieBrain-icon rect.st1,
[data-jp-theme-light='false'] .elyra-pieBrain-icon rect.st2 {
  fill: var(--jp-inverse-layout-color3);
}

.elyra-feedbackButton {
  display: inline;
  position: relative;
}

.elyra-feedbackButton[data-feedback]:not([data-feedback='']):before {
  border: solid;
  border-color: var(--jp-inverse-layout-color2) transparent;
  border-width: 0 6px 6px 6px;
  bottom: 0;
  content: '';
  left: 5px;
  position: absolute;
  z-index: 999;
}

.elyra-feedbackButton[data-feedback]:not([data-feedback='']):after {
  background: var(--jp-inverse-layout-color2);
  border-radius: 2px;
  bottom: -20px;
  color: var(--jp-ui-inverse-font-color1);
  content: attr(data-feedback);
  font-size: 0.75rem;
  font-weight: 400;
  padding: 3px 5px;
  pointer-events: none;
  position: absolute;
  right: -10px;
  text-align: center;
  width: max-content;
  word-wrap: break-word;
  z-index: 999;
}

.elyra-formEditor#pipeline-parameters
  .array-item
  .form-group.field
  .label-header {
  margin-top: 10px;
}

.elyra-browseFileDialog .jp-Dialog-content {
  height: 400px;
  width: 600px;
}

.elyra-expandableContainer-draggable:hover {
  cursor: grab;
}

.rIcon {
  content: url(${___CSS_LOADER_URL_REPLACEMENT_0___});
  height: 24px;
  width: 14px;
}
`, "",{"version":3,"sources":["webpack://./style/index.css"],"names":[],"mappings":"AAAA;;;;;;;;;;;;;;EAcE;;AAIF;;EAEE,6BAA6B;EAC7B,sBAAsB;EACtB,UAAU;EACV,WAAW;AACb;;AAEA;EACE,eAAe;AACjB;;AAEA;EACE,yCAAyC;AAC3C;;AAEA;EACE,yCAAyC;AAC3C;;AAEA;EACE,mBAAmB;EACnB,aAAa;EACb,mBAAmB;EACnB,gBAAgB;EAChB,YAAY;AACd;;AAEA;EACE,mCAAmC;AACrC;;AAEA;EACE,YAAY;EACZ,kCAAkC;EAClC,mBAAmB;EACnB,gBAAgB;EAChB,uBAAuB;EACvB,sBAAsB;EACtB,iBAAiB;AACnB;;AAEA;EACE,eAAe;AACjB;;AAEA;EACE,4BAA4B;EAC5B,2BAA2B;EAC3B,YAAY;EACZ,YAAY;AACd;;AAEA;EACE,gBAAgB;EAChB,gBAAgB;EAChB,cAAc;EACd,YAAY;EACZ,WAAW;EACX,yCAAyC;EACzC,kBAAkB;EAClB,+BAA+B;EAC/B,yCAAyC;AAC3C;;AAEA;EACE,+BAA+B;AACjC;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,oBAAoB;EACpB,oBAAoB;EACpB,YAAY;AACd;;AAEA;EACE,iBAAiB;EACjB,YAAY;EACZ,WAAW;EACX,YAAY;EACZ,kBAAkB;AACpB;;AAEA;EACE,mBAAmB;EACnB,aAAa;EACb,sBAAsB;EACtB,YAAY;EACZ,qBAAqB;AACvB;;AAEA;EACE,cAAc;EACd,aAAa;EACb,OAAO;EACP,eAAe;EACf,sBAAsB;AACxB;;AAEA,wDAAwD;AACxD;EACE,YAAY;AACd;;AAEA;EACE,YAAY;AACd;;AAEA;;;;EAIE,yCAAyC;EACzC,YAAY;EACZ,oBAAoB;AACtB;;AAEA,UAAU;;AAEV;;EAEE,qCAAqC;AACvC;;AAEA;EACE,eAAe;EACf,kBAAkB;AACpB;;AAEA;EACE,aAAa;EACb,yDAAyD;EACzD,2BAA2B;EAC3B,SAAS;EACT,WAAW;EACX,SAAS;EACT,kBAAkB;EAClB,YAAY;AACd;;AAEA;EACE,2CAA2C;EAC3C,kBAAkB;EAClB,aAAa;EACb,uCAAuC;EACvC,4BAA4B;EAC5B,kBAAkB;EAClB,gBAAgB;EAChB,gBAAgB;EAChB,oBAAoB;EACpB,kBAAkB;EAClB,YAAY;EACZ,kBAAkB;EAClB,kBAAkB;EAClB,qBAAqB;EACrB,YAAY;AACd;;AAEA;;;;EAIE,gBAAgB;AAClB;;AAEA;EACE,aAAa;EACb,YAAY;AACd;;AAEA;EACE,YAAY;AACd;;AAEA;EACE,gDAAkC;EAClC,YAAY;EACZ,WAAW;AACb","sourcesContent":["/*\r\n * Copyright 2018-2025 Elyra Authors\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the \"License\");\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n * http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an \"AS IS\" BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\n@import url('./formeditor.css');\r\n\r\n.elyra-expandableContainer-button,\r\n.elyra-expandableContainer-button.jp-mod-styled {\r\n  background-color: transparent;\r\n  vertical-align: middle;\r\n  padding: 0;\r\n  width: 20px;\r\n}\r\n\r\n.elyra-expandableContainer-button:hover {\r\n  cursor: pointer;\r\n}\r\n\r\n.elyra-expandableContainer-actionButton:hover {\r\n  background-color: var(--jp-layout-color1);\r\n}\r\n\r\n.elyra-expandableContainer-actionButton:active {\r\n  background-color: var(--jp-layout-color2);\r\n}\r\n\r\n.elyra-expandableContainer-title {\r\n  align-items: center;\r\n  display: flex;\r\n  flex-direction: row;\r\n  padding: 0px 4px;\r\n  height: 36px;\r\n}\r\n\r\n.elyra-expandableContainer-title:hover {\r\n  background: var(--jp-layout-color2);\r\n}\r\n\r\n.elyra-expandableContainer-name {\r\n  flex-grow: 1;\r\n  font-size: var(--jp-ui-font-size1);\r\n  white-space: nowrap;\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  padding: 4px 0 4px 2px;\r\n  line-height: 28px;\r\n}\r\n\r\n.elyra-expandableContainer-name:hover {\r\n  cursor: pointer;\r\n}\r\n\r\n.elyra-button {\r\n  background-repeat: no-repeat;\r\n  background-position: center;\r\n  border: none;\r\n  height: 100%;\r\n}\r\n\r\n.elyra-expandableContainer-details-visible {\r\n  overflow-x: auto;\r\n  overflow-y: auto;\r\n  display: block;\r\n  padding: 5px;\r\n  margin: 5px;\r\n  border: 1px solid var(--jp-border-color2);\r\n  border-radius: 2px;\r\n  color: var(--jp-ui-font-color1);\r\n  background-color: var(--jp-layout-color1);\r\n}\r\n\r\n.elyra-expandableContainer-details-visible textarea {\r\n  color: var(--jp-ui-font-color1);\r\n}\r\n\r\n.elyra-expandableContainer-details-hidden {\r\n  display: none;\r\n}\r\n\r\n.elyra-expandableContainer-action-buttons {\r\n  display: inline-flex;\r\n  align-self: flex-end;\r\n  height: 100%;\r\n}\r\n\r\n.elyra-errorDialog-messageDisplay pre {\r\n  min-height: 125px;\r\n  height: 100%;\r\n  width: 100%;\r\n  resize: none;\r\n  overflow-x: scroll;\r\n}\r\n\r\n.elyra-errorDialog-messageDisplay {\r\n  padding-bottom: 5px;\r\n  display: flex;\r\n  flex-direction: column;\r\n  height: 100%;\r\n  white-space: pre-line;\r\n}\r\n\r\n.elyra-errorDialog-messageDisplay > div:nth-child(2) {\r\n  margin: 15px 0;\r\n  display: flex;\r\n  flex: 1;\r\n  min-height: 0px;\r\n  flex-direction: column;\r\n}\r\n\r\n/* temporary fix until this is addressed in jupyterlab */\r\n.lm-TabBar-tabIcon svg {\r\n  height: auto;\r\n}\r\n\r\n.jp-Dialog-content {\r\n  resize: both;\r\n}\r\n\r\n.elyra-DialogDefaultButton.jp-mod-styled:hover:disabled,\r\n.elyra-DialogDefaultButton.jp-mod-styled:active:disabled,\r\n.elyra-DialogDefaultButton.jp-mod-styled:focus:disabled,\r\n.elyra-DialogDefaultButton.jp-mod-styled:disabled {\r\n  background-color: var(--jp-layout-color3);\r\n  opacity: 0.3;\r\n  pointer-events: none;\r\n}\r\n\r\n/* icons */\r\n\r\n[data-jp-theme-light='false'] .elyra-pieBrain-icon rect.st1,\r\n[data-jp-theme-light='false'] .elyra-pieBrain-icon rect.st2 {\r\n  fill: var(--jp-inverse-layout-color3);\r\n}\r\n\r\n.elyra-feedbackButton {\r\n  display: inline;\r\n  position: relative;\r\n}\r\n\r\n.elyra-feedbackButton[data-feedback]:not([data-feedback='']):before {\r\n  border: solid;\r\n  border-color: var(--jp-inverse-layout-color2) transparent;\r\n  border-width: 0 6px 6px 6px;\r\n  bottom: 0;\r\n  content: '';\r\n  left: 5px;\r\n  position: absolute;\r\n  z-index: 999;\r\n}\r\n\r\n.elyra-feedbackButton[data-feedback]:not([data-feedback='']):after {\r\n  background: var(--jp-inverse-layout-color2);\r\n  border-radius: 2px;\r\n  bottom: -20px;\r\n  color: var(--jp-ui-inverse-font-color1);\r\n  content: attr(data-feedback);\r\n  font-size: 0.75rem;\r\n  font-weight: 400;\r\n  padding: 3px 5px;\r\n  pointer-events: none;\r\n  position: absolute;\r\n  right: -10px;\r\n  text-align: center;\r\n  width: max-content;\r\n  word-wrap: break-word;\r\n  z-index: 999;\r\n}\r\n\r\n.elyra-formEditor#pipeline-parameters\r\n  .array-item\r\n  .form-group.field\r\n  .label-header {\r\n  margin-top: 10px;\r\n}\r\n\r\n.elyra-browseFileDialog .jp-Dialog-content {\r\n  height: 400px;\r\n  width: 600px;\r\n}\r\n\r\n.elyra-expandableContainer-draggable:hover {\r\n  cursor: grab;\r\n}\r\n\r\n.rIcon {\r\n  content: url('./icons/r-logo.svg');\r\n  height: 24px;\r\n  width: 14px;\r\n}\r\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "../../node_modules/css-loader/dist/runtime/api.js":
/*!*********************************************************!*\
  !*** ../../node_modules/css-loader/dist/runtime/api.js ***!
  \*********************************************************/
/***/ ((module) => {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ }),

/***/ "../../node_modules/css-loader/dist/runtime/getUrl.js":
/*!************************************************************!*\
  !*** ../../node_modules/css-loader/dist/runtime/getUrl.js ***!
  \************************************************************/
/***/ ((module) => {



module.exports = function (url, options) {
  if (!options) {
    options = {};
  }
  if (!url) {
    return url;
  }
  url = String(url.__esModule ? url.default : url);

  // If url is already wrapped in quotes, remove them
  if (/^['"].*['"]$/.test(url)) {
    url = url.slice(1, -1);
  }
  if (options.hash) {
    url += options.hash;
  }

  // Should url be wrapped?
  // See https://drafts.csswg.org/css-values-3/#urls
  if (/["'() \t\n]|(%20)/.test(url) || options.needQuotes) {
    return "\"".concat(url.replace(/"/g, '\\"').replace(/\n/g, "\\n"), "\"");
  }
  return url;
};

/***/ }),

/***/ "../../node_modules/css-loader/dist/runtime/sourceMaps.js":
/*!****************************************************************!*\
  !*** ../../node_modules/css-loader/dist/runtime/sourceMaps.js ***!
  \****************************************************************/
/***/ ((module) => {



module.exports = function (item) {
  var content = item[1];
  var cssMapping = item[3];
  if (!cssMapping) {
    return content;
  }
  if (typeof btoa === "function") {
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    return [content].concat([sourceMapping]).join("\n");
  }
  return [content].join("\n");
};

/***/ }),

/***/ "../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!********************************************************************************!*\
  !*** ../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \********************************************************************************/
/***/ ((module) => {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "../../node_modules/style-loader/dist/runtime/insertBySelector.js":
/*!************************************************************************!*\
  !*** ../../node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \************************************************************************/
/***/ ((module) => {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ }),

/***/ "../../node_modules/style-loader/dist/runtime/insertStyleElement.js":
/*!**************************************************************************!*\
  !*** ../../node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**************************************************************************/
/***/ ((module) => {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ }),

/***/ "../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js":
/*!**************************************************************************************!*\
  !*** ../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ "../../node_modules/style-loader/dist/runtime/styleDomAPI.js":
/*!*******************************************************************!*\
  !*** ../../node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \*******************************************************************/
/***/ ((module) => {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ }),

/***/ "../../node_modules/style-loader/dist/runtime/styleTagTransform.js":
/*!*************************************************************************!*\
  !*** ../../node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*************************************************************************/
/***/ ((module) => {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }),

/***/ "./style/index.css":
/*!*************************!*\
  !*** ./style/index.css ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "../../node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "../../node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "../../node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "../../node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!./index.css */ "../../node_modules/css-loader/dist/cjs.js!./style/index.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "data:image/svg+xml;utf8,<svg fill=%27black%27 height=%2724%27 viewBox=%270 0 24 24%27 width=%2724%27 xmlns=%27http://www.w3.org/2000/svg%27><path d=%27M7 10l5 5 5-5z%27/><path d=%27M0 0h24v24H0z%27 fill=%27none%27/></svg>":
/*!*************************************************************************************************************************************************************************************************************************************!*\
  !*** data:image/svg+xml;utf8,<svg fill=%27black%27 height=%2724%27 viewBox=%270 0 24 24%27 width=%2724%27 xmlns=%27http://www.w3.org/2000/svg%27><path d=%27M7 10l5 5 5-5z%27/><path d=%27M0 0h24v24H0z%27 fill=%27none%27/></svg> ***!
  \*************************************************************************************************************************************************************************************************************************************/
/***/ ((module) => {

module.exports = "data:image/svg+xml;utf8,<svg fill=%27black%27 height=%2724%27 viewBox=%270 0 24 24%27 width=%2724%27 xmlns=%27http://www.w3.org/2000/svg%27><path d=%27M7 10l5 5 5-5z%27/><path d=%27M0 0h24v24H0z%27 fill=%27none%27/></svg>";

/***/ }),

/***/ "./style/icons/r-logo.svg?f25c":
/*!********************************!*\
  !*** ./style/icons/r-logo.svg ***!
  \********************************/
/***/ ((module) => {

module.exports = "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' preserveAspectRatio='xMidYMid' width='32' height='32' viewBox='0 0 724 561'%3e %3cpath class='jp-icon-selectable' d='M361.453%2c485.937 C162.329%2c485.937 0.906%2c377.828 0.906%2c244.469 C0.906%2c111.109 162.329%2c3.000 361.453%2c3.000 C560.578%2c3.000 722.000%2c111.109 722.000%2c244.469 C722.000%2c377.828 560.578%2c485.937 361.453%2c485.937 ZM416.641%2c97.406 C265.289%2c97.406 142.594%2c171.314 142.594%2c262.484 C142.594%2c353.654 265.289%2c427.562 416.641%2c427.562 C567.992%2c427.562 679.687%2c377.033 679.687%2c262.484 C679.687%2c147.971 567.992%2c97.406 416.641%2c97.406 Z' fill='rgb(179%2c179%2c179)' fill-rule='evenodd'/%3e %3cpath class='jp-icon-selectable' d='M550.000%2c377.000 C550.000%2c377.000 571.822%2c383.585 584.500%2c390.000 C588.899%2c392.226 596.510%2c396.668 602.000%2c402.500 C607.378%2c408.212 610.000%2c414.000 610.000%2c414.000 L696.000%2c559.000 L557.000%2c559.062 L492.000%2c437.000 C492.000%2c437.000 478.690%2c414.131 470.500%2c407.500 C463.668%2c401.969 460.755%2c400.000 454.000%2c400.000 C449.298%2c400.000 420.974%2c400.000 420.974%2c400.000 L421.000%2c558.974 L298.000%2c559.026 L298.000%2c152.938 L545.000%2c152.938 C545.000%2c152.938 657.500%2c154.967 657.500%2c262.000 C657.500%2c369.033 550.000%2c377.000 550.000%2c377.000 ZM496.500%2c241.024 L422.037%2c240.976 L422.000%2c310.026 L496.500%2c310.002 C496.500%2c310.002 531.000%2c309.895 531.000%2c274.877 C531.000%2c239.155 496.500%2c241.024 496.500%2c241.024 Z' fill='rgb(52%2c101%2c176)' fill-rule='evenodd'/%3e %3c/svg%3e";

/***/ })

}]);
//# sourceMappingURL=style_index_css.c1b9764e99811f0d7282.js.map