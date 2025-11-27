"use strict";
(self["webpackChunk_jupyterlab_application_top"] = self["webpackChunk_jupyterlab_application_top"] || []).push([[1991],{

/***/ 91991:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   diff: () => (/* binding */ diff)
/* harmony export */ });
var TOKEN_NAMES = {
  '+': 'inserted',
  '-': 'deleted',
  '@': 'meta'
};

const diff = {
  name: "diff",
  token: function(stream) {
    var tw_pos = stream.string.search(/[\t ]+?$/);

    if (!stream.sol() || tw_pos === 0) {
      stream.skipToEnd();
      return ("error " + (
        TOKEN_NAMES[stream.string.charAt(0)] || '')).replace(/ $/, '');
    }

    var token_name = TOKEN_NAMES[stream.peek()] || stream.skipToEnd();

    if (tw_pos === -1) {
      stream.skipToEnd();
    } else {
      stream.pos = tw_pos;
    }

    return token_name;
  }
};



/***/ })

}]);
//# sourceMappingURL=1991.184807e12319dcf7f85c.js.map?v=184807e12319dcf7f85c