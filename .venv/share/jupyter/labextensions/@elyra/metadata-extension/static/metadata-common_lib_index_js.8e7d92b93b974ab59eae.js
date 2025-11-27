"use strict";
(self["webpackChunk_elyra_metadata_extension"] = self["webpackChunk_elyra_metadata_extension"] || []).push([["metadata-common_lib_index_js"],{

/***/ "../../node_modules/css-loader/dist/cjs.js!../metadata-common/style/index.css":
/*!************************************************************************************!*\
  !*** ../../node_modules/css-loader/dist/cjs.js!../metadata-common/style/index.css ***!
  \************************************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "../../node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../../node_modules/css-loader/dist/runtime/api.js */ "../../node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
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

/* MetadataWidget CSS */
.elyra-metadata {
  color: var(--jp-ui-font-color1);
  background: var(--jp-layout-color1);
}

.elyra-metadata a,
.elyra-metadataEditor a {
  color: var(--jp-content-link-color);
}

.elyra-metadataHeader {
  font-weight: bold;
  padding: 2px 6px 2px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.elyra-metadataHeader p {
  font-weight: bold;
}

button.elyra-metadataHeader-button {
  border: none;
  margin: 5px 0;
  padding: 5px;
  background: none;
}

.elyra-metadataHeader-buttons {
  display: flex;
  align-items: center;
}

.elyra-metadataHeader-buttonDivider {
  width: 0.05em;
  height: 1.5em;
  position: relative;
  background-color: var(--jp-border-color1);
}

.elyra-metadataHeader-popper button {
  border: none;
  width: max-content;
  padding: 7px 9px;
  background: none;
  cursor: pointer;
}

.elyra-metadataHeader-popper button:hover {
  background-color: var(--jp-border-color3);
}

.elyra-metadataHeader-popper {
  z-index: 100;
  background-color: var(--jp-cell-editor-active-background);
  border-radius: 10%;
  border-radius: 8px;
  border: 1px solid var(--jp-border-color2);
}

.elyra-metadataHeader-button:hover {
  background-color: var(--jp-layout-color2);
  cursor: pointer;
}

.elyra-metadataHeader [fill] {
  fill: var(--jp-ui-font-color1);
}

.elyra-metadataHeader + div:first-of-type {
  overflow-y: auto;
  height: calc(100vh - 95px);
}

.elyra-metadata-item {
  border-bottom: var(--jp-border-width) solid var(--jp-border-color2);
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

.elyra-metadata-item .elyra-expandableContainer-details-visible {
  background-color: var(--jp-cell-editor-background);
  resize: vertical;
}

.elyra-metadata-item .CodeMirror.cm-s-jupyter {
  background-color: inherit;
  border: none;
  font-family: var(--jp-code-font-family);
  font-size: var(--jp-code-font-size);
  line-height: var(--jp-code-line-height);
}

.elyra-metadata-item .cm-s-jupyter li .cm-string {
  word-break: normal;
}

/* Metadata Editor CSS (a lot of the style for the metadata editor is in
 * the ui-components package under formeditor.css
 */
.elyra-metadataEditor {
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  height: 100%;
  align-content: flex-start;
  align-items: flex-start;
  justify-content: flex-start;
  color: var(--jp-ui-font-color1);
}

/* Code Snippet Filter CSS */
.elyra-searchbar {
  margin: 0px 8px;
}

.elyra-filterTools {
  border-bottom: var(--jp-border-width) solid var(--jp-border-color1);
}

mark.elyra-search-bolding {
  background-color: transparent;
  font-weight: bold;
  color: var(--jp-ui-font-color0);
}

.elyra-filter {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 10px 0 10px;
}

.elyra-filter .elyra-filter-btn {
  align-self: flex-end;
  padding: 0px;
  margin-bottom: 5px;
  border-radius: 5px;
  border: none;
  background: none;
  cursor: pointer;
}

.elyra-filter .elyra-filter-btn:hover {
  background-color: var(--jp-layout-color2);
}

.elyra-filter-btn svg {
  display: block;
  width: 30px;
  height: 22px;
}

.elyra-filter-arrow-up.idle,
.elyra-filter-option.idle {
  display: none;
}

.elyra-filter-arrow-up {
  position: absolute;
  margin-top: 16px;
  margin-right: 38px;
  align-self: flex-end;
  background-color: var(--jp-layout-color0);
}

.elyra-filter-option {
  border: var(--jp-border-width) solid var(--jp-border-color1);
  height: 140px;
  width: 100%;
  margin-bottom: 10px;
  padding-top: 5px;
  padding-bottom: 5px;
  overflow: auto;
}

.elyra-filter-tags {
  margin: 8px 8px;
}

.elyra-filter-tag {
  margin-left: 3px;
  margin-right: 3px;
}

button.elyra-filter-tag {
  height: 24px;
  padding: 0 12px;
  cursor: pointer;
  color: var(--jp-ui-font-color2);
  font-size: var(--jp-ui-font-size1);
}

button.elyra-filter-tag .elyra-filter-tag-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

button.elyra-filter-tag span,
button.elyra-filter-tag svg {
  pointer-events: none;
}

.elyra-filter-empty {
  font-size: var(--jp-ui-font-size1);
}

.elyra-tools {
  border-bottom: var(--jp-border-width) solid var(--jp-border-color1);
}

.elyra-metadataEditor-saveButton button {
  background: none;
  border: 1px solid var(--jp-border-color1);
  border-radius: 3px;
  padding: 10px;
  font-size: var(--jp-content-font-size2);
  width: fit-content;
  color: var(--jp-content-font-color0);
  cursor: pointer;
}

.elyra-metadataEditor-saveButton button:hover {
  background: var(--jp-border-color3);
}

.elyra-metadataEditor-saveButton.errorForm {
  color: var(--jp-content-font-color3);
}

.elyra-metadataEditor-saveButton.errorForm button {
  border-color: var(--jp-content-font-color3);
  cursor: not-allowed;
}

.elyra-no-metadata-msg {
  padding-left: 8px;
}
`, "",{"version":3,"sources":["webpack://./../metadata-common/style/index.css"],"names":[],"mappings":"AAAA;;;;;;;;;;;;;;EAcE;;AAEF,uBAAuB;AACvB;EACE,+BAA+B;EAC/B,mCAAmC;AACrC;;AAEA;;EAEE,mCAAmC;AACrC;;AAEA;EACE,iBAAiB;EACjB,yBAAyB;EACzB,aAAa;EACb,8BAA8B;EAC9B,mBAAmB;AACrB;;AAEA;EACE,iBAAiB;AACnB;;AAEA;EACE,YAAY;EACZ,aAAa;EACb,YAAY;EACZ,gBAAgB;AAClB;;AAEA;EACE,aAAa;EACb,mBAAmB;AACrB;;AAEA;EACE,aAAa;EACb,aAAa;EACb,kBAAkB;EAClB,yCAAyC;AAC3C;;AAEA;EACE,YAAY;EACZ,kBAAkB;EAClB,gBAAgB;EAChB,gBAAgB;EAChB,eAAe;AACjB;;AAEA;EACE,yCAAyC;AAC3C;;AAEA;EACE,YAAY;EACZ,yDAAyD;EACzD,kBAAkB;EAClB,kBAAkB;EAClB,yCAAyC;AAC3C;;AAEA;EACE,yCAAyC;EACzC,eAAe;AACjB;;AAEA;EACE,8BAA8B;AAChC;;AAEA;EACE,gBAAgB;EAChB,0BAA0B;AAC5B;;AAEA;EACE,mEAAmE;EACnE,aAAa;EACb,sBAAsB;EACtB,SAAS;EACT,UAAU;AACZ;;AAEA;EACE,kDAAkD;EAClD,gBAAgB;AAClB;;AAEA;EACE,yBAAyB;EACzB,YAAY;EACZ,uCAAuC;EACvC,mCAAmC;EACnC,uCAAuC;AACzC;;AAEA;EACE,kBAAkB;AACpB;;AAEA;;EAEE;AACF;EACE,aAAa;EACb,aAAa;EACb,eAAe;EACf,YAAY;EACZ,yBAAyB;EACzB,uBAAuB;EACvB,2BAA2B;EAC3B,+BAA+B;AACjC;;AAEA,4BAA4B;AAC5B;EACE,eAAe;AACjB;;AAEA;EACE,mEAAmE;AACrE;;AAEA;EACE,6BAA6B;EAC7B,iBAAiB;EACjB,+BAA+B;AACjC;;AAEA;EACE,aAAa;EACb,sBAAsB;EACtB,mBAAmB;EACnB,wBAAwB;AAC1B;;AAEA;EACE,oBAAoB;EACpB,YAAY;EACZ,kBAAkB;EAClB,kBAAkB;EAClB,YAAY;EACZ,gBAAgB;EAChB,eAAe;AACjB;;AAEA;EACE,yCAAyC;AAC3C;;AAEA;EACE,cAAc;EACd,WAAW;EACX,YAAY;AACd;;AAEA;;EAEE,aAAa;AACf;;AAEA;EACE,kBAAkB;EAClB,gBAAgB;EAChB,kBAAkB;EAClB,oBAAoB;EACpB,yCAAyC;AAC3C;;AAEA;EACE,4DAA4D;EAC5D,aAAa;EACb,WAAW;EACX,mBAAmB;EACnB,gBAAgB;EAChB,mBAAmB;EACnB,cAAc;AAChB;;AAEA;EACE,eAAe;AACjB;;AAEA;EACE,gBAAgB;EAChB,iBAAiB;AACnB;;AAEA;EACE,YAAY;EACZ,eAAe;EACf,eAAe;EACf,+BAA+B;EAC/B,kCAAkC;AACpC;;AAEA;EACE,gBAAgB;EAChB,uBAAuB;EACvB,mBAAmB;AACrB;;AAEA;;EAEE,oBAAoB;AACtB;;AAEA;EACE,kCAAkC;AACpC;;AAEA;EACE,mEAAmE;AACrE;;AAEA;EACE,gBAAgB;EAChB,yCAAyC;EACzC,kBAAkB;EAClB,aAAa;EACb,uCAAuC;EACvC,kBAAkB;EAClB,oCAAoC;EACpC,eAAe;AACjB;;AAEA;EACE,mCAAmC;AACrC;;AAEA;EACE,oCAAoC;AACtC;;AAEA;EACE,2CAA2C;EAC3C,mBAAmB;AACrB;;AAEA;EACE,iBAAiB;AACnB","sourcesContent":["/*\r\n * Copyright 2018-2025 Elyra Authors\r\n *\r\n * Licensed under the Apache License, Version 2.0 (the \"License\");\r\n * you may not use this file except in compliance with the License.\r\n * You may obtain a copy of the License at\r\n *\r\n * http://www.apache.org/licenses/LICENSE-2.0\r\n *\r\n * Unless required by applicable law or agreed to in writing, software\r\n * distributed under the License is distributed on an \"AS IS\" BASIS,\r\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\r\n * See the License for the specific language governing permissions and\r\n * limitations under the License.\r\n */\r\n\r\n/* MetadataWidget CSS */\r\n.elyra-metadata {\r\n  color: var(--jp-ui-font-color1);\r\n  background: var(--jp-layout-color1);\r\n}\r\n\r\n.elyra-metadata a,\r\n.elyra-metadataEditor a {\r\n  color: var(--jp-content-link-color);\r\n}\r\n\r\n.elyra-metadataHeader {\r\n  font-weight: bold;\r\n  padding: 2px 6px 2px 12px;\r\n  display: flex;\r\n  justify-content: space-between;\r\n  align-items: center;\r\n}\r\n\r\n.elyra-metadataHeader p {\r\n  font-weight: bold;\r\n}\r\n\r\nbutton.elyra-metadataHeader-button {\r\n  border: none;\r\n  margin: 5px 0;\r\n  padding: 5px;\r\n  background: none;\r\n}\r\n\r\n.elyra-metadataHeader-buttons {\r\n  display: flex;\r\n  align-items: center;\r\n}\r\n\r\n.elyra-metadataHeader-buttonDivider {\r\n  width: 0.05em;\r\n  height: 1.5em;\r\n  position: relative;\r\n  background-color: var(--jp-border-color1);\r\n}\r\n\r\n.elyra-metadataHeader-popper button {\r\n  border: none;\r\n  width: max-content;\r\n  padding: 7px 9px;\r\n  background: none;\r\n  cursor: pointer;\r\n}\r\n\r\n.elyra-metadataHeader-popper button:hover {\r\n  background-color: var(--jp-border-color3);\r\n}\r\n\r\n.elyra-metadataHeader-popper {\r\n  z-index: 100;\r\n  background-color: var(--jp-cell-editor-active-background);\r\n  border-radius: 10%;\r\n  border-radius: 8px;\r\n  border: 1px solid var(--jp-border-color2);\r\n}\r\n\r\n.elyra-metadataHeader-button:hover {\r\n  background-color: var(--jp-layout-color2);\r\n  cursor: pointer;\r\n}\r\n\r\n.elyra-metadataHeader [fill] {\r\n  fill: var(--jp-ui-font-color1);\r\n}\r\n\r\n.elyra-metadataHeader + div:first-of-type {\r\n  overflow-y: auto;\r\n  height: calc(100vh - 95px);\r\n}\r\n\r\n.elyra-metadata-item {\r\n  border-bottom: var(--jp-border-width) solid var(--jp-border-color2);\r\n  display: flex;\r\n  flex-direction: column;\r\n  margin: 0;\r\n  padding: 0;\r\n}\r\n\r\n.elyra-metadata-item .elyra-expandableContainer-details-visible {\r\n  background-color: var(--jp-cell-editor-background);\r\n  resize: vertical;\r\n}\r\n\r\n.elyra-metadata-item .CodeMirror.cm-s-jupyter {\r\n  background-color: inherit;\r\n  border: none;\r\n  font-family: var(--jp-code-font-family);\r\n  font-size: var(--jp-code-font-size);\r\n  line-height: var(--jp-code-line-height);\r\n}\r\n\r\n.elyra-metadata-item .cm-s-jupyter li .cm-string {\r\n  word-break: normal;\r\n}\r\n\r\n/* Metadata Editor CSS (a lot of the style for the metadata editor is in\r\n * the ui-components package under formeditor.css\r\n */\r\n.elyra-metadataEditor {\r\n  padding: 20px;\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  height: 100%;\r\n  align-content: flex-start;\r\n  align-items: flex-start;\r\n  justify-content: flex-start;\r\n  color: var(--jp-ui-font-color1);\r\n}\r\n\r\n/* Code Snippet Filter CSS */\r\n.elyra-searchbar {\r\n  margin: 0px 8px;\r\n}\r\n\r\n.elyra-filterTools {\r\n  border-bottom: var(--jp-border-width) solid var(--jp-border-color1);\r\n}\r\n\r\nmark.elyra-search-bolding {\r\n  background-color: transparent;\r\n  font-weight: bold;\r\n  color: var(--jp-ui-font-color0);\r\n}\r\n\r\n.elyra-filter {\r\n  display: flex;\r\n  flex-direction: column;\r\n  align-items: center;\r\n  margin: 10px 10px 0 10px;\r\n}\r\n\r\n.elyra-filter .elyra-filter-btn {\r\n  align-self: flex-end;\r\n  padding: 0px;\r\n  margin-bottom: 5px;\r\n  border-radius: 5px;\r\n  border: none;\r\n  background: none;\r\n  cursor: pointer;\r\n}\r\n\r\n.elyra-filter .elyra-filter-btn:hover {\r\n  background-color: var(--jp-layout-color2);\r\n}\r\n\r\n.elyra-filter-btn svg {\r\n  display: block;\r\n  width: 30px;\r\n  height: 22px;\r\n}\r\n\r\n.elyra-filter-arrow-up.idle,\r\n.elyra-filter-option.idle {\r\n  display: none;\r\n}\r\n\r\n.elyra-filter-arrow-up {\r\n  position: absolute;\r\n  margin-top: 16px;\r\n  margin-right: 38px;\r\n  align-self: flex-end;\r\n  background-color: var(--jp-layout-color0);\r\n}\r\n\r\n.elyra-filter-option {\r\n  border: var(--jp-border-width) solid var(--jp-border-color1);\r\n  height: 140px;\r\n  width: 100%;\r\n  margin-bottom: 10px;\r\n  padding-top: 5px;\r\n  padding-bottom: 5px;\r\n  overflow: auto;\r\n}\r\n\r\n.elyra-filter-tags {\r\n  margin: 8px 8px;\r\n}\r\n\r\n.elyra-filter-tag {\r\n  margin-left: 3px;\r\n  margin-right: 3px;\r\n}\r\n\r\nbutton.elyra-filter-tag {\r\n  height: 24px;\r\n  padding: 0 12px;\r\n  cursor: pointer;\r\n  color: var(--jp-ui-font-color2);\r\n  font-size: var(--jp-ui-font-size1);\r\n}\r\n\r\nbutton.elyra-filter-tag .elyra-filter-tag-label {\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n}\r\n\r\nbutton.elyra-filter-tag span,\r\nbutton.elyra-filter-tag svg {\r\n  pointer-events: none;\r\n}\r\n\r\n.elyra-filter-empty {\r\n  font-size: var(--jp-ui-font-size1);\r\n}\r\n\r\n.elyra-tools {\r\n  border-bottom: var(--jp-border-width) solid var(--jp-border-color1);\r\n}\r\n\r\n.elyra-metadataEditor-saveButton button {\r\n  background: none;\r\n  border: 1px solid var(--jp-border-color1);\r\n  border-radius: 3px;\r\n  padding: 10px;\r\n  font-size: var(--jp-content-font-size2);\r\n  width: fit-content;\r\n  color: var(--jp-content-font-color0);\r\n  cursor: pointer;\r\n}\r\n\r\n.elyra-metadataEditor-saveButton button:hover {\r\n  background: var(--jp-border-color3);\r\n}\r\n\r\n.elyra-metadataEditor-saveButton.errorForm {\r\n  color: var(--jp-content-font-color3);\r\n}\r\n\r\n.elyra-metadataEditor-saveButton.errorForm button {\r\n  border-color: var(--jp-content-font-color3);\r\n  cursor: not-allowed;\r\n}\r\n\r\n.elyra-no-metadata-msg {\r\n  padding-left: 8px;\r\n}\r\n"],"sourceRoot":""}]);
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

/***/ "../metadata-common/lib/FilterTools.js":
/*!*********************************************!*\
  !*** ../metadata-common/lib/FilterTools.js ***!
  \*********************************************/
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

/***/ "../metadata-common/lib/MetadataCommonService.js":
/*!*******************************************************!*\
  !*** ../metadata-common/lib/MetadataCommonService.js ***!
  \*******************************************************/
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

/***/ "../metadata-common/lib/MetadataEditor.js":
/*!************************************************!*\
  !*** ../metadata-common/lib/MetadataEditor.js ***!
  \************************************************/
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

/***/ "../metadata-common/lib/MetadataEditorWidget.js":
/*!******************************************************!*\
  !*** ../metadata-common/lib/MetadataEditorWidget.js ***!
  \******************************************************/
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
const MetadataEditor_1 = __webpack_require__(/*! ./MetadataEditor */ "../metadata-common/lib/MetadataEditor.js");
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

/***/ "../metadata-common/lib/MetadataWidget.js":
/*!************************************************!*\
  !*** ../metadata-common/lib/MetadataWidget.js ***!
  \************************************************/
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
const FilterTools_1 = __webpack_require__(/*! ./FilterTools */ "../metadata-common/lib/FilterTools.js");
const MetadataCommonService_1 = __webpack_require__(/*! ./MetadataCommonService */ "../metadata-common/lib/MetadataCommonService.js");
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

/***/ "../metadata-common/lib/index.js":
/*!***************************************!*\
  !*** ../metadata-common/lib/index.js ***!
  \***************************************/
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
__webpack_require__(/*! ../style/index.css */ "../metadata-common/style/index.css");
__exportStar(__webpack_require__(/*! ./MetadataEditor */ "../metadata-common/lib/MetadataEditor.js"), exports);
__exportStar(__webpack_require__(/*! ./MetadataWidget */ "../metadata-common/lib/MetadataWidget.js"), exports);
__exportStar(__webpack_require__(/*! ./MetadataCommonService */ "../metadata-common/lib/MetadataCommonService.js"), exports);
__exportStar(__webpack_require__(/*! ./MetadataEditorWidget */ "../metadata-common/lib/MetadataEditorWidget.js"), exports);


/***/ }),

/***/ "../metadata-common/style/index.css":
/*!******************************************!*\
  !*** ../metadata-common/style/index.css ***!
  \******************************************/
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
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../../node_modules/css-loader/dist/cjs.js!./index.css */ "../../node_modules/css-loader/dist/cjs.js!../metadata-common/style/index.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_index_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ })

}]);
//# sourceMappingURL=metadata-common_lib_index_js.8e7d92b93b974ab59eae.js.map