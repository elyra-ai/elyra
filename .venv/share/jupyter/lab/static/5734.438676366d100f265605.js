"use strict";
(self["webpackChunk_jupyterlab_application_top"] = self["webpackChunk_jupyterlab_application_top"] || []).push([[5734],{

/***/ 15734:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   diagram: () => (/* binding */ diagram)
/* harmony export */ });
/* harmony import */ var _chunk_2IKCX54M_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(31398);
/* harmony import */ var _chunk_T57MJCP2_mjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(84222);
/* harmony import */ var _chunk_VIW5F6AA_mjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(6047);
/* harmony import */ var _mermaid_js_parser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(24010);




// src/diagrams/info/infoParser.ts

var parser = {
  parse: /* @__PURE__ */ (0,_chunk_VIW5F6AA_mjs__WEBPACK_IMPORTED_MODULE_2__/* .__name */ .K2)(async (input) => {
    const ast = await (0,_mermaid_js_parser__WEBPACK_IMPORTED_MODULE_3__/* .parse */ .qg)("info", input);
    _chunk_VIW5F6AA_mjs__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm.debug(ast);
  }, "parse")
};

// src/diagrams/info/infoDb.ts
var DEFAULT_INFO_DB = {
  version: _chunk_2IKCX54M_mjs__WEBPACK_IMPORTED_MODULE_0__/* .package_default */ .n.version + ( true ? "" : 0)
};
var getVersion = /* @__PURE__ */ (0,_chunk_VIW5F6AA_mjs__WEBPACK_IMPORTED_MODULE_2__/* .__name */ .K2)(() => DEFAULT_INFO_DB.version, "getVersion");
var db = {
  getVersion
};

// src/diagrams/info/infoRenderer.ts
var draw = /* @__PURE__ */ (0,_chunk_VIW5F6AA_mjs__WEBPACK_IMPORTED_MODULE_2__/* .__name */ .K2)((text, id, version) => {
  _chunk_VIW5F6AA_mjs__WEBPACK_IMPORTED_MODULE_2__/* .log */ .Rm.debug("rendering info diagram\n" + text);
  const svg = (0,_chunk_T57MJCP2_mjs__WEBPACK_IMPORTED_MODULE_1__/* .selectSvgElement */ .D)(id);
  (0,_chunk_VIW5F6AA_mjs__WEBPACK_IMPORTED_MODULE_2__/* .configureSvgSize */ .a$)(svg, 100, 400, true);
  const group = svg.append("g");
  group.append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${version}`);
}, "draw");
var renderer = { draw };

// src/diagrams/info/infoDiagram.ts
var diagram = {
  parser,
  db,
  renderer
};



/***/ })

}]);
//# sourceMappingURL=5734.438676366d100f265605.js.map?v=438676366d100f265605