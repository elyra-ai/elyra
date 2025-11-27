"use strict";
(self["webpackChunk_jupyterlab_application_top"] = self["webpackChunk_jupyterlab_application_top"] || []).push([[1737],{

/***/ 71737:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   brainfuck: () => (/* binding */ brainfuck)
/* harmony export */ });
var reserve = "><+-.,[]".split("");
/*
  comments can be either:
  placed behind lines

  +++    this is a comment

  where reserved characters cannot be used
  or in a loop
  [
  this is ok to use [ ] and stuff
  ]
  or preceded by #
*/
const brainfuck = {
  name: "brainfuck",
  startState: function() {
    return {
      commentLine: false,
      left: 0,
      right: 0,
      commentLoop: false
    }
  },
  token: function(stream, state) {
    if (stream.eatSpace()) return null
    if(stream.sol()){
      state.commentLine = false;
    }
    var ch = stream.next().toString();
    if(reserve.indexOf(ch) !== -1){
      if(state.commentLine === true){
        if(stream.eol()){
          state.commentLine = false;
        }
        return "comment";
      }
      if(ch === "]" || ch === "["){
        if(ch === "["){
          state.left++;
        }
        else{
          state.right++;
        }
        return "bracket";
      }
      else if(ch === "+" || ch === "-"){
        return "keyword";
      }
      else if(ch === "<" || ch === ">"){
        return "atom";
      }
      else if(ch === "." || ch === ","){
        return "def";
      }
    }
    else{
      state.commentLine = true;
      if(stream.eol()){
        state.commentLine = false;
      }
      return "comment";
    }
    if(stream.eol()){
      state.commentLine = false;
    }
  }
};


/***/ })

}]);
//# sourceMappingURL=1737.e287dbeb54d25fb76602.js.map?v=e287dbeb54d25fb76602