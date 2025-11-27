"use strict";
(self["webpackChunk_jupyterlab_application_top"] = self["webpackChunk_jupyterlab_application_top"] || []).push([[4735],{

/***/ 24735:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   mangle: () => (/* binding */ mangle)
/* harmony export */ });
function mangle() {
  return {
    mangle: false, // remove this once mangle option is removed
    walkTokens(token) {
      if (token.type !== 'link') {
        return;
      }

      if (!token.href.startsWith('mailto:')) {
        return;
      }

      const email = token.href.substring(7);
      const mangledEmail = mangleEmail(email);

      token.href = `mailto:${mangledEmail}`;

      if (token.tokens.length !== 1 || token.tokens[0].type !== 'text' || token.tokens[0].text !== email) {
        return;
      }

      token.text = mangledEmail;
      token.tokens[0].text = mangledEmail;
    },
  };
}

function mangleEmail(text) {
  let out = '',
    i,
    ch;

  const l = text.length;
  for (i = 0; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
}


/***/ })

}]);
//# sourceMappingURL=4735.439d65461fbceb3b0731.js.map?v=439d65461fbceb3b0731