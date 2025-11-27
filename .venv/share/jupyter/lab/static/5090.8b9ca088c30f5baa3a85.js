"use strict";
(self["webpackChunk_jupyterlab_application_top"] = self["webpackChunk_jupyterlab_application_top"] || []).push([[5090],{

/***/ 67002:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   t: () => (/* binding */ Orientation)
/* harmony export */ });
/**
 * Standard orientation values
 */
const Orientation = {
    horizontal: "horizontal",
    vertical: "vertical",
};


/***/ }),

/***/ 74291:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Ac: () => (/* binding */ keyFunction2),
/* harmony export */   De: () => (/* binding */ keyDelete),
/* harmony export */   F9: () => (/* binding */ keyEscape),
/* harmony export */   FM: () => (/* binding */ keyEnd),
/* harmony export */   HX: () => (/* binding */ keyArrowDown),
/* harmony export */   I5: () => (/* binding */ keyArrowUp),
/* harmony export */   Is: () => (/* binding */ ArrowKeys),
/* harmony export */   J9: () => (/* binding */ keyTab),
/* harmony export */   Mm: () => (/* binding */ keyEnter),
/* harmony export */   R9: () => (/* binding */ keyBackspace),
/* harmony export */   Tg: () => (/* binding */ keyHome),
/* harmony export */   bb: () => (/* binding */ keyArrowRight),
/* harmony export */   f_: () => (/* binding */ keyPageDown),
/* harmony export */   gG: () => (/* binding */ keySpace),
/* harmony export */   kT: () => (/* binding */ keyArrowLeft),
/* harmony export */   oK: () => (/* binding */ keyPageUp)
/* harmony export */ });
/* unused harmony exports KeyCodes, keyCodeAlt, keyCodeArrowDown, keyCodeArrowLeft, keyCodeArrowRight, keyCodeArrowUp, keyCodeBack, keyCodeBackSlash, keyCodeBreak, keyCodeCapsLock, keyCodeCloseBracket, keyCodeColon, keyCodeColon2, keyCodeComma, keyCodeCtrl, keyCodeDelete, keyCodeEnd, keyCodeEnter, keyCodeEquals, keyCodeEquals2, keyCodeEquals3, keyCodeEscape, keyCodeForwardSlash, keyCodeFunction1, keyCodeFunction10, keyCodeFunction11, keyCodeFunction12, keyCodeFunction2, keyCodeFunction3, keyCodeFunction4, keyCodeFunction5, keyCodeFunction6, keyCodeFunction7, keyCodeFunction8, keyCodeFunction9, keyCodeHome, keyCodeInsert, keyCodeMenu, keyCodeMinus, keyCodeMinus2, keyCodeNumLock, keyCodeNumPad0, keyCodeNumPad1, keyCodeNumPad2, keyCodeNumPad3, keyCodeNumPad4, keyCodeNumPad5, keyCodeNumPad6, keyCodeNumPad7, keyCodeNumPad8, keyCodeNumPad9, keyCodeNumPadDivide, keyCodeNumPadDot, keyCodeNumPadMinus, keyCodeNumPadMultiply, keyCodeNumPadPlus, keyCodeOpenBracket, keyCodePageDown, keyCodePageUp, keyCodePeriod, keyCodePrint, keyCodeQuote, keyCodeScrollLock, keyCodeShift, keyCodeSpace, keyCodeTab, keyCodeTilde, keyCodeWindowsLeft, keyCodeWindowsOpera, keyCodeWindowsRight */
/**
 * Key Code values
 * @deprecated - KeyCodes are deprecated, use individual string key exports
 */
var KeyCodes;
(function (KeyCodes) {
    KeyCodes[KeyCodes["alt"] = 18] = "alt";
    KeyCodes[KeyCodes["arrowDown"] = 40] = "arrowDown";
    KeyCodes[KeyCodes["arrowLeft"] = 37] = "arrowLeft";
    KeyCodes[KeyCodes["arrowRight"] = 39] = "arrowRight";
    KeyCodes[KeyCodes["arrowUp"] = 38] = "arrowUp";
    KeyCodes[KeyCodes["back"] = 8] = "back";
    KeyCodes[KeyCodes["backSlash"] = 220] = "backSlash";
    KeyCodes[KeyCodes["break"] = 19] = "break";
    KeyCodes[KeyCodes["capsLock"] = 20] = "capsLock";
    KeyCodes[KeyCodes["closeBracket"] = 221] = "closeBracket";
    KeyCodes[KeyCodes["colon"] = 186] = "colon";
    KeyCodes[KeyCodes["colon2"] = 59] = "colon2";
    KeyCodes[KeyCodes["comma"] = 188] = "comma";
    KeyCodes[KeyCodes["ctrl"] = 17] = "ctrl";
    KeyCodes[KeyCodes["delete"] = 46] = "delete";
    KeyCodes[KeyCodes["end"] = 35] = "end";
    KeyCodes[KeyCodes["enter"] = 13] = "enter";
    KeyCodes[KeyCodes["equals"] = 187] = "equals";
    KeyCodes[KeyCodes["equals2"] = 61] = "equals2";
    KeyCodes[KeyCodes["equals3"] = 107] = "equals3";
    KeyCodes[KeyCodes["escape"] = 27] = "escape";
    KeyCodes[KeyCodes["forwardSlash"] = 191] = "forwardSlash";
    KeyCodes[KeyCodes["function1"] = 112] = "function1";
    KeyCodes[KeyCodes["function10"] = 121] = "function10";
    KeyCodes[KeyCodes["function11"] = 122] = "function11";
    KeyCodes[KeyCodes["function12"] = 123] = "function12";
    KeyCodes[KeyCodes["function2"] = 113] = "function2";
    KeyCodes[KeyCodes["function3"] = 114] = "function3";
    KeyCodes[KeyCodes["function4"] = 115] = "function4";
    KeyCodes[KeyCodes["function5"] = 116] = "function5";
    KeyCodes[KeyCodes["function6"] = 117] = "function6";
    KeyCodes[KeyCodes["function7"] = 118] = "function7";
    KeyCodes[KeyCodes["function8"] = 119] = "function8";
    KeyCodes[KeyCodes["function9"] = 120] = "function9";
    KeyCodes[KeyCodes["home"] = 36] = "home";
    KeyCodes[KeyCodes["insert"] = 45] = "insert";
    KeyCodes[KeyCodes["menu"] = 93] = "menu";
    KeyCodes[KeyCodes["minus"] = 189] = "minus";
    KeyCodes[KeyCodes["minus2"] = 109] = "minus2";
    KeyCodes[KeyCodes["numLock"] = 144] = "numLock";
    KeyCodes[KeyCodes["numPad0"] = 96] = "numPad0";
    KeyCodes[KeyCodes["numPad1"] = 97] = "numPad1";
    KeyCodes[KeyCodes["numPad2"] = 98] = "numPad2";
    KeyCodes[KeyCodes["numPad3"] = 99] = "numPad3";
    KeyCodes[KeyCodes["numPad4"] = 100] = "numPad4";
    KeyCodes[KeyCodes["numPad5"] = 101] = "numPad5";
    KeyCodes[KeyCodes["numPad6"] = 102] = "numPad6";
    KeyCodes[KeyCodes["numPad7"] = 103] = "numPad7";
    KeyCodes[KeyCodes["numPad8"] = 104] = "numPad8";
    KeyCodes[KeyCodes["numPad9"] = 105] = "numPad9";
    KeyCodes[KeyCodes["numPadDivide"] = 111] = "numPadDivide";
    KeyCodes[KeyCodes["numPadDot"] = 110] = "numPadDot";
    KeyCodes[KeyCodes["numPadMinus"] = 109] = "numPadMinus";
    KeyCodes[KeyCodes["numPadMultiply"] = 106] = "numPadMultiply";
    KeyCodes[KeyCodes["numPadPlus"] = 107] = "numPadPlus";
    KeyCodes[KeyCodes["openBracket"] = 219] = "openBracket";
    KeyCodes[KeyCodes["pageDown"] = 34] = "pageDown";
    KeyCodes[KeyCodes["pageUp"] = 33] = "pageUp";
    KeyCodes[KeyCodes["period"] = 190] = "period";
    KeyCodes[KeyCodes["print"] = 44] = "print";
    KeyCodes[KeyCodes["quote"] = 222] = "quote";
    KeyCodes[KeyCodes["scrollLock"] = 145] = "scrollLock";
    KeyCodes[KeyCodes["shift"] = 16] = "shift";
    KeyCodes[KeyCodes["space"] = 32] = "space";
    KeyCodes[KeyCodes["tab"] = 9] = "tab";
    KeyCodes[KeyCodes["tilde"] = 192] = "tilde";
    KeyCodes[KeyCodes["windowsLeft"] = 91] = "windowsLeft";
    KeyCodes[KeyCodes["windowsOpera"] = 219] = "windowsOpera";
    KeyCodes[KeyCodes["windowsRight"] = 92] = "windowsRight";
})(KeyCodes || (KeyCodes = {}));
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeAlt = 18;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeArrowDown = 40;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeArrowLeft = 37;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeArrowRight = 39;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeArrowUp = 38;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeBack = 8;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeBackSlash = 220;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeBreak = 19;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeCapsLock = 20;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeCloseBracket = 221;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeColon = 186;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeColon2 = 59; // Opera and Firefox
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeComma = 188;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeCtrl = 17;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeDelete = 46;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeEnd = 35;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeEnter = 13;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeEquals = 187;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeEquals2 = 61; // Opera
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeEquals3 = 107; // Firefox
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeEscape = 27;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeForwardSlash = 191;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction1 = 112;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction10 = 121;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction11 = 122;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction12 = 123;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction2 = 113;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction3 = 114;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction4 = 115;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction5 = 116;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction6 = 117;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction7 = 118;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction8 = 119;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeFunction9 = 120;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeHome = 36;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeInsert = 45;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeMenu = 93;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeMinus = 189;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeMinus2 = 109; // Opera and Firefox
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumLock = 144;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPad0 = 96;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPad1 = 97;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPad2 = 98;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPad3 = 99;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPad4 = 100;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPad5 = 101;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPad6 = 102;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPad7 = 103;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPad8 = 104;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPad9 = 105;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPadDivide = 111;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPadDot = 110;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPadMinus = 109;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPadMultiply = 106;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeNumPadPlus = 107;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeOpenBracket = 219;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodePageDown = 34;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodePageUp = 33;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodePeriod = 190;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodePrint = 44;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeQuote = 222;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeScrollLock = 145;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeShift = 16;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeSpace = 32;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeTab = 9;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeTilde = 192;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeWindowsLeft = 91;
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeWindowsOpera = 219; // Opera
/**
 * @deprecated - KeyCodes are deprecated, use string key exports
 */
const keyCodeWindowsRight = 92;
/**
 * String values for use with KeyboardEvent.key
 */
const keyArrowDown = "ArrowDown";
const keyArrowLeft = "ArrowLeft";
const keyArrowRight = "ArrowRight";
const keyArrowUp = "ArrowUp";
const keyEnter = "Enter";
const keyEscape = "Escape";
const keyHome = "Home";
const keyEnd = "End";
const keyFunction2 = "F2";
const keyPageDown = "PageDown";
const keyPageUp = "PageUp";
const keySpace = " ";
const keyTab = "Tab";
const keyBackspace = "Backspace";
const keyDelete = "Delete";
const ArrowKeys = {
    ArrowDown: keyArrowDown,
    ArrowLeft: keyArrowLeft,
    ArrowRight: keyArrowRight,
    ArrowUp: keyArrowUp,
};


/***/ }),

/***/ 30086:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   O: () => (/* binding */ Direction)
/* harmony export */ });
/**
 * Expose ltr and rtl strings
 */
var Direction;
(function (Direction) {
    Direction["ltr"] = "ltr";
    Direction["rtl"] = "rtl";
})(Direction || (Direction = {}));


/***/ }),

/***/ 83021:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AB: () => (/* binding */ limit),
/* harmony export */   Vf: () => (/* binding */ wrapInBounds),
/* harmony export */   r4: () => (/* binding */ inRange)
/* harmony export */ });
/**
 * This method keeps a given value within the bounds of a min and max value. If the value
 * is larger than the max, the minimum value will be returned. If the value is smaller than the minimum,
 * the maximum will be returned. Otherwise, the value is returned un-changed.
 */
function wrapInBounds(min, max, value) {
    if (value < min) {
        return max;
    }
    else if (value > max) {
        return min;
    }
    return value;
}
/**
 * Ensures that a value is between a min and max value. If value is lower than min, min will be returned.
 * If value is greater than max, max will be returned.
 */
function limit(min, max, value) {
    return Math.min(Math.max(value, min), max);
}
/**
 * Determines if a number value is within a specified range.
 *
 * @param value - the value to check
 * @param min - the range start
 * @param max - the range end
 */
function inRange(value, min, max = 0) {
    [min, max] = [min, max].sort((a, b) => a - b);
    return min <= value && value < max;
}


/***/ }),

/***/ 49054:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AO: () => (/* binding */ isTabbable),
/* harmony export */   tp: () => (/* binding */ isFocusable)
/* harmony export */ });
/* unused harmony exports focusable, tabbable */
/*!
* tabbable 5.3.3
* @license MIT, https://github.com/focus-trap/tabbable/blob/master/LICENSE
*/
var candidateSelectors = ['input', 'select', 'textarea', 'a[href]', 'button', '[tabindex]:not(slot)', 'audio[controls]', 'video[controls]', '[contenteditable]:not([contenteditable="false"])', 'details>summary:first-of-type', 'details'];
var candidateSelector = /* #__PURE__ */candidateSelectors.join(',');
var NoElement = typeof Element === 'undefined';
var matches = NoElement ? function () {} : Element.prototype.matches || Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
var getRootNode = !NoElement && Element.prototype.getRootNode ? function (element) {
  return element.getRootNode();
} : function (element) {
  return element.ownerDocument;
};
/**
 * @param {Element} el container to check in
 * @param {boolean} includeContainer add container to check
 * @param {(node: Element) => boolean} filter filter candidates
 * @returns {Element[]}
 */

var getCandidates = function getCandidates(el, includeContainer, filter) {
  var candidates = Array.prototype.slice.apply(el.querySelectorAll(candidateSelector));

  if (includeContainer && matches.call(el, candidateSelector)) {
    candidates.unshift(el);
  }

  candidates = candidates.filter(filter);
  return candidates;
};
/**
 * @callback GetShadowRoot
 * @param {Element} element to check for shadow root
 * @returns {ShadowRoot|boolean} ShadowRoot if available or boolean indicating if a shadowRoot is attached but not available.
 */

/**
 * @callback ShadowRootFilter
 * @param {Element} shadowHostNode the element which contains shadow content
 * @returns {boolean} true if a shadow root could potentially contain valid candidates.
 */

/**
 * @typedef {Object} CandidatesScope
 * @property {Element} scope contains inner candidates
 * @property {Element[]} candidates
 */

/**
 * @typedef {Object} IterativeOptions
 * @property {GetShadowRoot|boolean} getShadowRoot true if shadow support is enabled; falsy if not;
 *  if a function, implies shadow support is enabled and either returns the shadow root of an element
 *  or a boolean stating if it has an undisclosed shadow root
 * @property {(node: Element) => boolean} filter filter candidates
 * @property {boolean} flatten if true then result will flatten any CandidatesScope into the returned list
 * @property {ShadowRootFilter} shadowRootFilter filter shadow roots;
 */

/**
 * @param {Element[]} elements list of element containers to match candidates from
 * @param {boolean} includeContainer add container list to check
 * @param {IterativeOptions} options
 * @returns {Array.<Element|CandidatesScope>}
 */


var getCandidatesIteratively = function getCandidatesIteratively(elements, includeContainer, options) {
  var candidates = [];
  var elementsToCheck = Array.from(elements);

  while (elementsToCheck.length) {
    var element = elementsToCheck.shift();

    if (element.tagName === 'SLOT') {
      // add shadow dom slot scope (slot itself cannot be focusable)
      var assigned = element.assignedElements();
      var content = assigned.length ? assigned : element.children;
      var nestedCandidates = getCandidatesIteratively(content, true, options);

      if (options.flatten) {
        candidates.push.apply(candidates, nestedCandidates);
      } else {
        candidates.push({
          scope: element,
          candidates: nestedCandidates
        });
      }
    } else {
      // check candidate element
      var validCandidate = matches.call(element, candidateSelector);

      if (validCandidate && options.filter(element) && (includeContainer || !elements.includes(element))) {
        candidates.push(element);
      } // iterate over shadow content if possible


      var shadowRoot = element.shadowRoot || // check for an undisclosed shadow
      typeof options.getShadowRoot === 'function' && options.getShadowRoot(element);
      var validShadowRoot = !options.shadowRootFilter || options.shadowRootFilter(element);

      if (shadowRoot && validShadowRoot) {
        // add shadow dom scope IIF a shadow root node was given; otherwise, an undisclosed
        //  shadow exists, so look at light dom children as fallback BUT create a scope for any
        //  child candidates found because they're likely slotted elements (elements that are
        //  children of the web component element (which has the shadow), in the light dom, but
        //  slotted somewhere _inside_ the undisclosed shadow) -- the scope is created below,
        //  _after_ we return from this recursive call
        var _nestedCandidates = getCandidatesIteratively(shadowRoot === true ? element.children : shadowRoot.children, true, options);

        if (options.flatten) {
          candidates.push.apply(candidates, _nestedCandidates);
        } else {
          candidates.push({
            scope: element,
            candidates: _nestedCandidates
          });
        }
      } else {
        // there's not shadow so just dig into the element's (light dom) children
        //  __without__ giving the element special scope treatment
        elementsToCheck.unshift.apply(elementsToCheck, element.children);
      }
    }
  }

  return candidates;
};

var getTabindex = function getTabindex(node, isScope) {
  if (node.tabIndex < 0) {
    // in Chrome, <details/>, <audio controls/> and <video controls/> elements get a default
    // `tabIndex` of -1 when the 'tabindex' attribute isn't specified in the DOM,
    // yet they are still part of the regular tab order; in FF, they get a default
    // `tabIndex` of 0; since Chrome still puts those elements in the regular tab
    // order, consider their tab index to be 0.
    // Also browsers do not return `tabIndex` correctly for contentEditable nodes;
    // so if they don't have a tabindex attribute specifically set, assume it's 0.
    //
    // isScope is positive for custom element with shadow root or slot that by default
    // have tabIndex -1, but need to be sorted by document order in order for their
    // content to be inserted in the correct position
    if ((isScope || /^(AUDIO|VIDEO|DETAILS)$/.test(node.tagName) || node.isContentEditable) && isNaN(parseInt(node.getAttribute('tabindex'), 10))) {
      return 0;
    }
  }

  return node.tabIndex;
};

var sortOrderedTabbables = function sortOrderedTabbables(a, b) {
  return a.tabIndex === b.tabIndex ? a.documentOrder - b.documentOrder : a.tabIndex - b.tabIndex;
};

var isInput = function isInput(node) {
  return node.tagName === 'INPUT';
};

var isHiddenInput = function isHiddenInput(node) {
  return isInput(node) && node.type === 'hidden';
};

var isDetailsWithSummary = function isDetailsWithSummary(node) {
  var r = node.tagName === 'DETAILS' && Array.prototype.slice.apply(node.children).some(function (child) {
    return child.tagName === 'SUMMARY';
  });
  return r;
};

var getCheckedRadio = function getCheckedRadio(nodes, form) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].checked && nodes[i].form === form) {
      return nodes[i];
    }
  }
};

var isTabbableRadio = function isTabbableRadio(node) {
  if (!node.name) {
    return true;
  }

  var radioScope = node.form || getRootNode(node);

  var queryRadios = function queryRadios(name) {
    return radioScope.querySelectorAll('input[type="radio"][name="' + name + '"]');
  };

  var radioSet;

  if (typeof window !== 'undefined' && typeof window.CSS !== 'undefined' && typeof window.CSS.escape === 'function') {
    radioSet = queryRadios(window.CSS.escape(node.name));
  } else {
    try {
      radioSet = queryRadios(node.name);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Looks like you have a radio button with a name attribute containing invalid CSS selector characters and need the CSS.escape polyfill: %s', err.message);
      return false;
    }
  }

  var checked = getCheckedRadio(radioSet, node.form);
  return !checked || checked === node;
};

var isRadio = function isRadio(node) {
  return isInput(node) && node.type === 'radio';
};

var isNonTabbableRadio = function isNonTabbableRadio(node) {
  return isRadio(node) && !isTabbableRadio(node);
};

var isZeroArea = function isZeroArea(node) {
  var _node$getBoundingClie = node.getBoundingClientRect(),
      width = _node$getBoundingClie.width,
      height = _node$getBoundingClie.height;

  return width === 0 && height === 0;
};

var isHidden = function isHidden(node, _ref) {
  var displayCheck = _ref.displayCheck,
      getShadowRoot = _ref.getShadowRoot;

  // NOTE: visibility will be `undefined` if node is detached from the document
  //  (see notes about this further down), which means we will consider it visible
  //  (this is legacy behavior from a very long way back)
  // NOTE: we check this regardless of `displayCheck="none"` because this is a
  //  _visibility_ check, not a _display_ check
  if (getComputedStyle(node).visibility === 'hidden') {
    return true;
  }

  var isDirectSummary = matches.call(node, 'details>summary:first-of-type');
  var nodeUnderDetails = isDirectSummary ? node.parentElement : node;

  if (matches.call(nodeUnderDetails, 'details:not([open]) *')) {
    return true;
  } // The root node is the shadow root if the node is in a shadow DOM; some document otherwise
  //  (but NOT _the_ document; see second 'If' comment below for more).
  // If rootNode is shadow root, it'll have a host, which is the element to which the shadow
  //  is attached, and the one we need to check if it's in the document or not (because the
  //  shadow, and all nodes it contains, is never considered in the document since shadows
  //  behave like self-contained DOMs; but if the shadow's HOST, which is part of the document,
  //  is hidden, or is not in the document itself but is detached, it will affect the shadow's
  //  visibility, including all the nodes it contains). The host could be any normal node,
  //  or a custom element (i.e. web component). Either way, that's the one that is considered
  //  part of the document, not the shadow root, nor any of its children (i.e. the node being
  //  tested).
  // If rootNode is not a shadow root, it won't have a host, and so rootNode should be the
  //  document (per the docs) and while it's a Document-type object, that document does not
  //  appear to be the same as the node's `ownerDocument` for some reason, so it's safer
  //  to ignore the rootNode at this point, and use `node.ownerDocument`. Otherwise,
  //  using `rootNode.contains(node)` will _always_ be true we'll get false-positives when
  //  node is actually detached.


  var nodeRootHost = getRootNode(node).host;
  var nodeIsAttached = (nodeRootHost === null || nodeRootHost === void 0 ? void 0 : nodeRootHost.ownerDocument.contains(nodeRootHost)) || node.ownerDocument.contains(node);

  if (!displayCheck || displayCheck === 'full') {
    if (typeof getShadowRoot === 'function') {
      // figure out if we should consider the node to be in an undisclosed shadow and use the
      //  'non-zero-area' fallback
      var originalNode = node;

      while (node) {
        var parentElement = node.parentElement;
        var rootNode = getRootNode(node);

        if (parentElement && !parentElement.shadowRoot && getShadowRoot(parentElement) === true // check if there's an undisclosed shadow
        ) {
          // node has an undisclosed shadow which means we can only treat it as a black box, so we
          //  fall back to a non-zero-area test
          return isZeroArea(node);
        } else if (node.assignedSlot) {
          // iterate up slot
          node = node.assignedSlot;
        } else if (!parentElement && rootNode !== node.ownerDocument) {
          // cross shadow boundary
          node = rootNode.host;
        } else {
          // iterate up normal dom
          node = parentElement;
        }
      }

      node = originalNode;
    } // else, `getShadowRoot` might be true, but all that does is enable shadow DOM support
    //  (i.e. it does not also presume that all nodes might have undisclosed shadows); or
    //  it might be a falsy value, which means shadow DOM support is disabled
    // Since we didn't find it sitting in an undisclosed shadow (or shadows are disabled)
    //  now we can just test to see if it would normally be visible or not, provided it's
    //  attached to the main document.
    // NOTE: We must consider case where node is inside a shadow DOM and given directly to
    //  `isTabbable()` or `isFocusable()` -- regardless of `getShadowRoot` option setting.


    if (nodeIsAttached) {
      // this works wherever the node is: if there's at least one client rect, it's
      //  somehow displayed; it also covers the CSS 'display: contents' case where the
      //  node itself is hidden in place of its contents; and there's no need to search
      //  up the hierarchy either
      return !node.getClientRects().length;
    } // Else, the node isn't attached to the document, which means the `getClientRects()`
    //  API will __always__ return zero rects (this can happen, for example, if React
    //  is used to render nodes onto a detached tree, as confirmed in this thread:
    //  https://github.com/facebook/react/issues/9117#issuecomment-284228870)
    //
    // It also means that even window.getComputedStyle(node).display will return `undefined`
    //  because styles are only computed for nodes that are in the document.
    //
    // NOTE: THIS HAS BEEN THE CASE FOR YEARS. It is not new, nor is it caused by tabbable
    //  somehow. Though it was never stated officially, anyone who has ever used tabbable
    //  APIs on nodes in detached containers has actually implicitly used tabbable in what
    //  was later (as of v5.2.0 on Apr 9, 2021) called `displayCheck="none"` mode -- essentially
    //  considering __everything__ to be visible because of the innability to determine styles.

  } else if (displayCheck === 'non-zero-area') {
    // NOTE: Even though this tests that the node's client rect is non-zero to determine
    //  whether it's displayed, and that a detached node will __always__ have a zero-area
    //  client rect, we don't special-case for whether the node is attached or not. In
    //  this mode, we do want to consider nodes that have a zero area to be hidden at all
    //  times, and that includes attached or not.
    return isZeroArea(node);
  } // visible, as far as we can tell, or per current `displayCheck` mode


  return false;
}; // form fields (nested) inside a disabled fieldset are not focusable/tabbable
//  unless they are in the _first_ <legend> element of the top-most disabled
//  fieldset


var isDisabledFromFieldset = function isDisabledFromFieldset(node) {
  if (/^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(node.tagName)) {
    var parentNode = node.parentElement; // check if `node` is contained in a disabled <fieldset>

    while (parentNode) {
      if (parentNode.tagName === 'FIELDSET' && parentNode.disabled) {
        // look for the first <legend> among the children of the disabled <fieldset>
        for (var i = 0; i < parentNode.children.length; i++) {
          var child = parentNode.children.item(i); // when the first <legend> (in document order) is found

          if (child.tagName === 'LEGEND') {
            // if its parent <fieldset> is not nested in another disabled <fieldset>,
            // return whether `node` is a descendant of its first <legend>
            return matches.call(parentNode, 'fieldset[disabled] *') ? true : !child.contains(node);
          }
        } // the disabled <fieldset> containing `node` has no <legend>


        return true;
      }

      parentNode = parentNode.parentElement;
    }
  } // else, node's tabbable/focusable state should not be affected by a fieldset's
  //  enabled/disabled state


  return false;
};

var isNodeMatchingSelectorFocusable = function isNodeMatchingSelectorFocusable(options, node) {
  if (node.disabled || isHiddenInput(node) || isHidden(node, options) || // For a details element with a summary, the summary element gets the focus
  isDetailsWithSummary(node) || isDisabledFromFieldset(node)) {
    return false;
  }

  return true;
};

var isNodeMatchingSelectorTabbable = function isNodeMatchingSelectorTabbable(options, node) {
  if (isNonTabbableRadio(node) || getTabindex(node) < 0 || !isNodeMatchingSelectorFocusable(options, node)) {
    return false;
  }

  return true;
};

var isValidShadowRootTabbable = function isValidShadowRootTabbable(shadowHostNode) {
  var tabIndex = parseInt(shadowHostNode.getAttribute('tabindex'), 10);

  if (isNaN(tabIndex) || tabIndex >= 0) {
    return true;
  } // If a custom element has an explicit negative tabindex,
  // browsers will not allow tab targeting said element's children.


  return false;
};
/**
 * @param {Array.<Element|CandidatesScope>} candidates
 * @returns Element[]
 */


var sortByOrder = function sortByOrder(candidates) {
  var regularTabbables = [];
  var orderedTabbables = [];
  candidates.forEach(function (item, i) {
    var isScope = !!item.scope;
    var element = isScope ? item.scope : item;
    var candidateTabindex = getTabindex(element, isScope);
    var elements = isScope ? sortByOrder(item.candidates) : element;

    if (candidateTabindex === 0) {
      isScope ? regularTabbables.push.apply(regularTabbables, elements) : regularTabbables.push(element);
    } else {
      orderedTabbables.push({
        documentOrder: i,
        tabIndex: candidateTabindex,
        item: item,
        isScope: isScope,
        content: elements
      });
    }
  });
  return orderedTabbables.sort(sortOrderedTabbables).reduce(function (acc, sortable) {
    sortable.isScope ? acc.push.apply(acc, sortable.content) : acc.push(sortable.content);
    return acc;
  }, []).concat(regularTabbables);
};

var tabbable = function tabbable(el, options) {
  options = options || {};
  var candidates;

  if (options.getShadowRoot) {
    candidates = getCandidatesIteratively([el], options.includeContainer, {
      filter: isNodeMatchingSelectorTabbable.bind(null, options),
      flatten: false,
      getShadowRoot: options.getShadowRoot,
      shadowRootFilter: isValidShadowRootTabbable
    });
  } else {
    candidates = getCandidates(el, options.includeContainer, isNodeMatchingSelectorTabbable.bind(null, options));
  }

  return sortByOrder(candidates);
};

var focusable = function focusable(el, options) {
  options = options || {};
  var candidates;

  if (options.getShadowRoot) {
    candidates = getCandidatesIteratively([el], options.includeContainer, {
      filter: isNodeMatchingSelectorFocusable.bind(null, options),
      flatten: true,
      getShadowRoot: options.getShadowRoot
    });
  } else {
    candidates = getCandidates(el, options.includeContainer, isNodeMatchingSelectorFocusable.bind(null, options));
  }

  return candidates;
};

var isTabbable = function isTabbable(node, options) {
  options = options || {};

  if (!node) {
    throw new Error('No node provided');
  }

  if (matches.call(node, candidateSelector) === false) {
    return false;
  }

  return isNodeMatchingSelectorTabbable(options, node);
};

var focusableCandidateSelector = /* #__PURE__ */candidateSelectors.concat('iframe').join(',');

var isFocusable = function isFocusable(node, options) {
  options = options || {};

  if (!node) {
    throw new Error('No node provided');
  }

  if (matches.call(node, focusableCandidateSelector) === false) {
    return false;
  }

  return isNodeMatchingSelectorFocusable(options, node);
};


//# sourceMappingURL=index.esm.js.map


/***/ })

}]);
//# sourceMappingURL=5090.8b9ca088c30f5baa3a85.js.map?v=8b9ca088c30f5baa3a85