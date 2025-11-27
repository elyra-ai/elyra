"use strict";
(self["webpackChunk_jupyterlab_application_top"] = self["webpackChunk_jupyterlab_application_top"] || []).push([[6986],{

/***/ 21148:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   K: () => (/* binding */ __name)
/* harmony export */ });
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });




/***/ }),

/***/ 96986:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ layouts_default)
/* harmony export */ });
/* harmony import */ var _chunks_mermaid_layout_elk_core_chunk_ZW26E7AF_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(21148);


// src/layouts.ts
var loader = /* @__PURE__ */ (0,_chunks_mermaid_layout_elk_core_chunk_ZW26E7AF_mjs__WEBPACK_IMPORTED_MODULE_0__/* .__name */ .K)(async () => await Promise.all(/* import() */[__webpack_require__.e(7975), __webpack_require__.e(1218), __webpack_require__.e(8891)]).then(__webpack_require__.bind(__webpack_require__, 78891)), "loader");
var algos = ["elk.stress", "elk.force", "elk.mrtree", "elk.sporeOverlap"];
var layouts = [
  {
    name: "elk",
    loader,
    algorithm: "elk.layered"
  },
  ...algos.map((algo) => ({
    name: algo,
    loader,
    algorithm: algo
  }))
];
var layouts_default = layouts;



/***/ })

}]);
//# sourceMappingURL=6986.7eacad67c2a34d05148f.js.map?v=7eacad67c2a34d05148f