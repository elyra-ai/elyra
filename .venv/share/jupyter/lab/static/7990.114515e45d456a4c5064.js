(self["webpackChunk_jupyterlab_application_top"] = self["webpackChunk_jupyterlab_application_top"] || []).push([[7990,5606,6372,3991],{

/***/ 75086:
/***/ ((module) => {

"use strict";


// Note: This regex matches even invalid JSON strings, but since we’re
// working on the output of `JSON.stringify` we know that only valid strings
// are present (unless the user supplied a weird `options.indent` but in
// that case we don’t care since the output would be invalid anyway).
var stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g;

module.exports = function stringify(passedObj, options) {
  var indent, maxLength, replacer;

  options = options || {};
  indent = JSON.stringify(
    [1],
    undefined,
    options.indent === undefined ? 2 : options.indent
  ).slice(2, -3);
  maxLength =
    indent === ""
      ? Infinity
      : options.maxLength === undefined
      ? 80
      : options.maxLength;
  replacer = options.replacer;

  return (function _stringify(obj, currentIndent, reserved) {
    // prettier-ignore
    var end, index, items, key, keyPart, keys, length, nextIndent, prettified, start, string, value;

    if (obj && typeof obj.toJSON === "function") {
      obj = obj.toJSON();
    }

    string = JSON.stringify(obj, replacer);

    if (string === undefined) {
      return string;
    }

    length = maxLength - currentIndent.length - reserved;

    if (string.length <= length) {
      prettified = string.replace(
        stringOrChar,
        function (match, stringLiteral) {
          return stringLiteral || match + " ";
        }
      );
      if (prettified.length <= length) {
        return prettified;
      }
    }

    if (replacer != null) {
      obj = JSON.parse(string);
      replacer = undefined;
    }

    if (typeof obj === "object" && obj !== null) {
      nextIndent = currentIndent + indent;
      items = [];
      index = 0;

      if (Array.isArray(obj)) {
        start = "[";
        end = "]";
        length = obj.length;
        for (; index < length; index++) {
          items.push(
            _stringify(obj[index], nextIndent, index === length - 1 ? 0 : 1) ||
              "null"
          );
        }
      } else {
        start = "{";
        end = "}";
        keys = Object.keys(obj);
        length = keys.length;
        for (; index < length; index++) {
          key = keys[index];
          keyPart = JSON.stringify(key) + ": ";
          value = _stringify(
            obj[key],
            nextIndent,
            keyPart.length + (index === length - 1 ? 0 : 1)
          );
          if (value !== undefined) {
            items.push(keyPart + value);
          }
        }
      }

      if (items.length > 0) {
        return [start, indent + items.join(",\n" + nextIndent), end].join(
          "\n" + currentIndent
        );
      }
    }

    return string;
  })(passedObj, "", 0);
};


/***/ }),

/***/ 65606:
/***/ ((module) => {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),

/***/ 7990:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  DEFAULT_ACTIONS: () => (/* binding */ DEFAULT_ACTIONS),
  "default": () => (/* binding */ vega_embed_module_embed),
  guessMode: () => (/* binding */ guessMode),
  vega: () => (/* binding */ vega),
  vegaLite: () => (/* binding */ _vegaLite),
  version: () => (/* binding */ vega_embed_module_version)
});

// NAMESPACE OBJECT: ./node_modules/fast-json-patch/module/core.mjs
var core_namespaceObject = {};
__webpack_require__.r(core_namespaceObject);
__webpack_require__.d(core_namespaceObject, {
  JsonPatchError: () => (JsonPatchError),
  _areEquals: () => (_areEquals),
  applyOperation: () => (applyOperation),
  applyPatch: () => (applyPatch),
  applyReducer: () => (applyReducer),
  deepClone: () => (deepClone),
  getValueByPointer: () => (getValueByPointer),
  validate: () => (validate),
  validator: () => (validator)
});

// NAMESPACE OBJECT: ./node_modules/fast-json-patch/module/duplex.mjs
var duplex_namespaceObject = {};
__webpack_require__.r(duplex_namespaceObject);
__webpack_require__.d(duplex_namespaceObject, {
  compare: () => (compare),
  generate: () => (generate),
  observe: () => (observe),
  unobserve: () => (unobserve)
});

// NAMESPACE OBJECT: ./node_modules/vega-themes/build/vega-themes.module.js
var vega_themes_module_namespaceObject = {};
__webpack_require__.r(vega_themes_module_namespaceObject);
__webpack_require__.d(vega_themes_module_namespaceObject, {
  dark: () => (darkTheme),
  excel: () => (excelTheme),
  fivethirtyeight: () => (fiveThirtyEightTheme),
  ggplot2: () => (ggplot2Theme),
  googlecharts: () => (googlechartsTheme),
  latimes: () => (latimesTheme),
  powerbi: () => (powerbiTheme),
  quartz: () => (quartzTheme),
  urbaninstitute: () => (urbanInstituteTheme),
  version: () => (version),
  vox: () => (voxTheme)
});

;// CONCATENATED MODULE: ./node_modules/fast-json-patch/module/helpers.mjs
/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017-2022 Joachim Wester
 * MIT licensed
 */
var __extends = (undefined && undefined.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var _hasOwnProperty = Object.prototype.hasOwnProperty;
function helpers_hasOwnProperty(obj, key) {
    return _hasOwnProperty.call(obj, key);
}
function _objectKeys(obj) {
    if (Array.isArray(obj)) {
        var keys_1 = new Array(obj.length);
        for (var k = 0; k < keys_1.length; k++) {
            keys_1[k] = "" + k;
        }
        return keys_1;
    }
    if (Object.keys) {
        return Object.keys(obj);
    }
    var keys = [];
    for (var i in obj) {
        if (helpers_hasOwnProperty(obj, i)) {
            keys.push(i);
        }
    }
    return keys;
}
;
/**
* Deeply clone the object.
* https://jsperf.com/deep-copy-vs-json-stringify-json-parse/25 (recursiveDeepCopy)
* @param  {any} obj value to clone
* @return {any} cloned obj
*/
function _deepClone(obj) {
    switch (typeof obj) {
        case "object":
            return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5
        case "undefined":
            return null; //this is how JSON.stringify behaves for array items
        default:
            return obj; //no need to clone primitives
    }
}
//3x faster than cached /^\d+$/.test(str)
function isInteger(str) {
    var i = 0;
    var len = str.length;
    var charCode;
    while (i < len) {
        charCode = str.charCodeAt(i);
        if (charCode >= 48 && charCode <= 57) {
            i++;
            continue;
        }
        return false;
    }
    return true;
}
/**
* Escapes a json pointer path
* @param path The raw pointer
* @return the Escaped path
*/
function escapePathComponent(path) {
    if (path.indexOf('/') === -1 && path.indexOf('~') === -1)
        return path;
    return path.replace(/~/g, '~0').replace(/\//g, '~1');
}
/**
 * Unescapes a json pointer path
 * @param path The escaped pointer
 * @return The unescaped path
 */
function unescapePathComponent(path) {
    return path.replace(/~1/g, '/').replace(/~0/g, '~');
}
function _getPathRecursive(root, obj) {
    var found;
    for (var key in root) {
        if (helpers_hasOwnProperty(root, key)) {
            if (root[key] === obj) {
                return escapePathComponent(key) + '/';
            }
            else if (typeof root[key] === 'object') {
                found = _getPathRecursive(root[key], obj);
                if (found != '') {
                    return escapePathComponent(key) + '/' + found;
                }
            }
        }
    }
    return '';
}
function getPath(root, obj) {
    if (root === obj) {
        return '/';
    }
    var path = _getPathRecursive(root, obj);
    if (path === '') {
        throw new Error("Object not found in root");
    }
    return "/" + path;
}
/**
* Recursively checks whether an object has any undefined values inside.
*/
function hasUndefined(obj) {
    if (obj === undefined) {
        return true;
    }
    if (obj) {
        if (Array.isArray(obj)) {
            for (var i_1 = 0, len = obj.length; i_1 < len; i_1++) {
                if (hasUndefined(obj[i_1])) {
                    return true;
                }
            }
        }
        else if (typeof obj === "object") {
            var objKeys = _objectKeys(obj);
            var objKeysLength = objKeys.length;
            for (var i = 0; i < objKeysLength; i++) {
                if (hasUndefined(obj[objKeys[i]])) {
                    return true;
                }
            }
        }
    }
    return false;
}
function patchErrorMessageFormatter(message, args) {
    var messageParts = [message];
    for (var key in args) {
        var value = typeof args[key] === 'object' ? JSON.stringify(args[key], null, 2) : args[key]; // pretty print
        if (typeof value !== 'undefined') {
            messageParts.push(key + ": " + value);
        }
    }
    return messageParts.join('\n');
}
var PatchError = /** @class */ (function (_super) {
    __extends(PatchError, _super);
    function PatchError(message, name, index, operation, tree) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, patchErrorMessageFormatter(message, { name: name, index: index, operation: operation, tree: tree })) || this;
        _this.name = name;
        _this.index = index;
        _this.operation = operation;
        _this.tree = tree;
        Object.setPrototypeOf(_this, _newTarget.prototype); // restore prototype chain, see https://stackoverflow.com/a/48342359
        _this.message = patchErrorMessageFormatter(message, { name: name, index: index, operation: operation, tree: tree });
        return _this;
    }
    return PatchError;
}(Error));


;// CONCATENATED MODULE: ./node_modules/fast-json-patch/module/core.mjs

var JsonPatchError = PatchError;
var deepClone = _deepClone;
/* We use a Javascript hash to store each
 function. Each hash entry (property) uses
 the operation identifiers specified in rfc6902.
 In this way, we can map each patch operation
 to its dedicated function in efficient way.
 */
/* The operations applicable to an object */
var objOps = {
    add: function (obj, key, document) {
        obj[key] = this.value;
        return { newDocument: document };
    },
    remove: function (obj, key, document) {
        var removed = obj[key];
        delete obj[key];
        return { newDocument: document, removed: removed };
    },
    replace: function (obj, key, document) {
        var removed = obj[key];
        obj[key] = this.value;
        return { newDocument: document, removed: removed };
    },
    move: function (obj, key, document) {
        /* in case move target overwrites an existing value,
        return the removed value, this can be taxing performance-wise,
        and is potentially unneeded */
        var removed = getValueByPointer(document, this.path);
        if (removed) {
            removed = _deepClone(removed);
        }
        var originalValue = applyOperation(document, { op: "remove", path: this.from }).removed;
        applyOperation(document, { op: "add", path: this.path, value: originalValue });
        return { newDocument: document, removed: removed };
    },
    copy: function (obj, key, document) {
        var valueToCopy = getValueByPointer(document, this.from);
        // enforce copy by value so further operations don't affect source (see issue #177)
        applyOperation(document, { op: "add", path: this.path, value: _deepClone(valueToCopy) });
        return { newDocument: document };
    },
    test: function (obj, key, document) {
        return { newDocument: document, test: _areEquals(obj[key], this.value) };
    },
    _get: function (obj, key, document) {
        this.value = obj[key];
        return { newDocument: document };
    }
};
/* The operations applicable to an array. Many are the same as for the object */
var arrOps = {
    add: function (arr, i, document) {
        if (isInteger(i)) {
            arr.splice(i, 0, this.value);
        }
        else { // array props
            arr[i] = this.value;
        }
        // this may be needed when using '-' in an array
        return { newDocument: document, index: i };
    },
    remove: function (arr, i, document) {
        var removedList = arr.splice(i, 1);
        return { newDocument: document, removed: removedList[0] };
    },
    replace: function (arr, i, document) {
        var removed = arr[i];
        arr[i] = this.value;
        return { newDocument: document, removed: removed };
    },
    move: objOps.move,
    copy: objOps.copy,
    test: objOps.test,
    _get: objOps._get
};
/**
 * Retrieves a value from a JSON document by a JSON pointer.
 * Returns the value.
 *
 * @param document The document to get the value from
 * @param pointer an escaped JSON pointer
 * @return The retrieved value
 */
function getValueByPointer(document, pointer) {
    if (pointer == '') {
        return document;
    }
    var getOriginalDestination = { op: "_get", path: pointer };
    applyOperation(document, getOriginalDestination);
    return getOriginalDestination.value;
}
/**
 * Apply a single JSON Patch Operation on a JSON document.
 * Returns the {newDocument, result} of the operation.
 * It modifies the `document` and `operation` objects - it gets the values by reference.
 * If you would like to avoid touching your values, clone them:
 * `jsonpatch.applyOperation(document, jsonpatch._deepClone(operation))`.
 *
 * @param document The document to patch
 * @param operation The operation to apply
 * @param validateOperation `false` is without validation, `true` to use default jsonpatch's validation, or you can pass a `validateOperation` callback to be used for validation.
 * @param mutateDocument Whether to mutate the original document or clone it before applying
 * @param banPrototypeModifications Whether to ban modifications to `__proto__`, defaults to `true`.
 * @return `{newDocument, result}` after the operation
 */
function applyOperation(document, operation, validateOperation, mutateDocument, banPrototypeModifications, index) {
    if (validateOperation === void 0) { validateOperation = false; }
    if (mutateDocument === void 0) { mutateDocument = true; }
    if (banPrototypeModifications === void 0) { banPrototypeModifications = true; }
    if (index === void 0) { index = 0; }
    if (validateOperation) {
        if (typeof validateOperation == 'function') {
            validateOperation(operation, 0, document, operation.path);
        }
        else {
            validator(operation, 0);
        }
    }
    /* ROOT OPERATIONS */
    if (operation.path === "") {
        var returnValue = { newDocument: document };
        if (operation.op === 'add') {
            returnValue.newDocument = operation.value;
            return returnValue;
        }
        else if (operation.op === 'replace') {
            returnValue.newDocument = operation.value;
            returnValue.removed = document; //document we removed
            return returnValue;
        }
        else if (operation.op === 'move' || operation.op === 'copy') { // it's a move or copy to root
            returnValue.newDocument = getValueByPointer(document, operation.from); // get the value by json-pointer in `from` field
            if (operation.op === 'move') { // report removed item
                returnValue.removed = document;
            }
            return returnValue;
        }
        else if (operation.op === 'test') {
            returnValue.test = _areEquals(document, operation.value);
            if (returnValue.test === false) {
                throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
            }
            returnValue.newDocument = document;
            return returnValue;
        }
        else if (operation.op === 'remove') { // a remove on root
            returnValue.removed = document;
            returnValue.newDocument = null;
            return returnValue;
        }
        else if (operation.op === '_get') {
            operation.value = document;
            return returnValue;
        }
        else { /* bad operation */
            if (validateOperation) {
                throw new JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', index, operation, document);
            }
            else {
                return returnValue;
            }
        }
    } /* END ROOT OPERATIONS */
    else {
        if (!mutateDocument) {
            document = _deepClone(document);
        }
        var path = operation.path || "";
        var keys = path.split('/');
        var obj = document;
        var t = 1; //skip empty element - http://jsperf.com/to-shift-or-not-to-shift
        var len = keys.length;
        var existingPathFragment = undefined;
        var key = void 0;
        var validateFunction = void 0;
        if (typeof validateOperation == 'function') {
            validateFunction = validateOperation;
        }
        else {
            validateFunction = validator;
        }
        while (true) {
            key = keys[t];
            if (key && key.indexOf('~') != -1) {
                key = unescapePathComponent(key);
            }
            if (banPrototypeModifications &&
                (key == '__proto__' ||
                    (key == 'prototype' && t > 0 && keys[t - 1] == 'constructor'))) {
                throw new TypeError('JSON-Patch: modifying `__proto__` or `constructor/prototype` prop is banned for security reasons, if this was on purpose, please set `banPrototypeModifications` flag false and pass it to this function. More info in fast-json-patch README');
            }
            if (validateOperation) {
                if (existingPathFragment === undefined) {
                    if (obj[key] === undefined) {
                        existingPathFragment = keys.slice(0, t).join('/');
                    }
                    else if (t == len - 1) {
                        existingPathFragment = operation.path;
                    }
                    if (existingPathFragment !== undefined) {
                        validateFunction(operation, 0, document, existingPathFragment);
                    }
                }
            }
            t++;
            if (Array.isArray(obj)) {
                if (key === '-') {
                    key = obj.length;
                }
                else {
                    if (validateOperation && !isInteger(key)) {
                        throw new JsonPatchError("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", index, operation, document);
                    } // only parse key when it's an integer for `arr.prop` to work
                    else if (isInteger(key)) {
                        key = ~~key;
                    }
                }
                if (t >= len) {
                    if (validateOperation && operation.op === "add" && key > obj.length) {
                        throw new JsonPatchError("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", index, operation, document);
                    }
                    var returnValue = arrOps[operation.op].call(operation, obj, key, document); // Apply patch
                    if (returnValue.test === false) {
                        throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
                    }
                    return returnValue;
                }
            }
            else {
                if (t >= len) {
                    var returnValue = objOps[operation.op].call(operation, obj, key, document); // Apply patch
                    if (returnValue.test === false) {
                        throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
                    }
                    return returnValue;
                }
            }
            obj = obj[key];
            // If we have more keys in the path, but the next value isn't a non-null object,
            // throw an OPERATION_PATH_UNRESOLVABLE error instead of iterating again.
            if (validateOperation && t < len && (!obj || typeof obj !== "object")) {
                throw new JsonPatchError('Cannot perform operation at the desired path', 'OPERATION_PATH_UNRESOLVABLE', index, operation, document);
            }
        }
    }
}
/**
 * Apply a full JSON Patch array on a JSON document.
 * Returns the {newDocument, result} of the patch.
 * It modifies the `document` object and `patch` - it gets the values by reference.
 * If you would like to avoid touching your values, clone them:
 * `jsonpatch.applyPatch(document, jsonpatch._deepClone(patch))`.
 *
 * @param document The document to patch
 * @param patch The patch to apply
 * @param validateOperation `false` is without validation, `true` to use default jsonpatch's validation, or you can pass a `validateOperation` callback to be used for validation.
 * @param mutateDocument Whether to mutate the original document or clone it before applying
 * @param banPrototypeModifications Whether to ban modifications to `__proto__`, defaults to `true`.
 * @return An array of `{newDocument, result}` after the patch
 */
function applyPatch(document, patch, validateOperation, mutateDocument, banPrototypeModifications) {
    if (mutateDocument === void 0) { mutateDocument = true; }
    if (banPrototypeModifications === void 0) { banPrototypeModifications = true; }
    if (validateOperation) {
        if (!Array.isArray(patch)) {
            throw new JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
        }
    }
    if (!mutateDocument) {
        document = _deepClone(document);
    }
    var results = new Array(patch.length);
    for (var i = 0, length_1 = patch.length; i < length_1; i++) {
        // we don't need to pass mutateDocument argument because if it was true, we already deep cloned the object, we'll just pass `true`
        results[i] = applyOperation(document, patch[i], validateOperation, true, banPrototypeModifications, i);
        document = results[i].newDocument; // in case root was replaced
    }
    results.newDocument = document;
    return results;
}
/**
 * Apply a single JSON Patch Operation on a JSON document.
 * Returns the updated document.
 * Suitable as a reducer.
 *
 * @param document The document to patch
 * @param operation The operation to apply
 * @return The updated document
 */
function applyReducer(document, operation, index) {
    var operationResult = applyOperation(document, operation);
    if (operationResult.test === false) { // failed test
        throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', index, operation, document);
    }
    return operationResult.newDocument;
}
/**
 * Validates a single operation. Called from `jsonpatch.validate`. Throws `JsonPatchError` in case of an error.
 * @param {object} operation - operation object (patch)
 * @param {number} index - index of operation in the sequence
 * @param {object} [document] - object where the operation is supposed to be applied
 * @param {string} [existingPathFragment] - comes along with `document`
 */
function validator(operation, index, document, existingPathFragment) {
    if (typeof operation !== 'object' || operation === null || Array.isArray(operation)) {
        throw new JsonPatchError('Operation is not an object', 'OPERATION_NOT_AN_OBJECT', index, operation, document);
    }
    else if (!objOps[operation.op]) {
        throw new JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', index, operation, document);
    }
    else if (typeof operation.path !== 'string') {
        throw new JsonPatchError('Operation `path` property is not a string', 'OPERATION_PATH_INVALID', index, operation, document);
    }
    else if (operation.path.indexOf('/') !== 0 && operation.path.length > 0) {
        // paths that aren't empty string should start with "/"
        throw new JsonPatchError('Operation `path` property must start with "/"', 'OPERATION_PATH_INVALID', index, operation, document);
    }
    else if ((operation.op === 'move' || operation.op === 'copy') && typeof operation.from !== 'string') {
        throw new JsonPatchError('Operation `from` property is not present (applicable in `move` and `copy` operations)', 'OPERATION_FROM_REQUIRED', index, operation, document);
    }
    else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && operation.value === undefined) {
        throw new JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_REQUIRED', index, operation, document);
    }
    else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && hasUndefined(operation.value)) {
        throw new JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED', index, operation, document);
    }
    else if (document) {
        if (operation.op == "add") {
            var pathLen = operation.path.split("/").length;
            var existingPathLen = existingPathFragment.split("/").length;
            if (pathLen !== existingPathLen + 1 && pathLen !== existingPathLen) {
                throw new JsonPatchError('Cannot perform an `add` operation at the desired path', 'OPERATION_PATH_CANNOT_ADD', index, operation, document);
            }
        }
        else if (operation.op === 'replace' || operation.op === 'remove' || operation.op === '_get') {
            if (operation.path !== existingPathFragment) {
                throw new JsonPatchError('Cannot perform the operation at a path that does not exist', 'OPERATION_PATH_UNRESOLVABLE', index, operation, document);
            }
        }
        else if (operation.op === 'move' || operation.op === 'copy') {
            var existingValue = { op: "_get", path: operation.from, value: undefined };
            var error = validate([existingValue], document);
            if (error && error.name === 'OPERATION_PATH_UNRESOLVABLE') {
                throw new JsonPatchError('Cannot perform the operation from a path that does not exist', 'OPERATION_FROM_UNRESOLVABLE', index, operation, document);
            }
        }
    }
}
/**
 * Validates a sequence of operations. If `document` parameter is provided, the sequence is additionally validated against the object document.
 * If error is encountered, returns a JsonPatchError object
 * @param sequence
 * @param document
 * @returns {JsonPatchError|undefined}
 */
function validate(sequence, document, externalValidator) {
    try {
        if (!Array.isArray(sequence)) {
            throw new JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
        }
        if (document) {
            //clone document and sequence so that we can safely try applying operations
            applyPatch(_deepClone(document), _deepClone(sequence), externalValidator || true);
        }
        else {
            externalValidator = externalValidator || validator;
            for (var i = 0; i < sequence.length; i++) {
                externalValidator(sequence[i], i, document, undefined);
            }
        }
    }
    catch (e) {
        if (e instanceof JsonPatchError) {
            return e;
        }
        else {
            throw e;
        }
    }
}
// based on https://github.com/epoberezkin/fast-deep-equal
// MIT License
// Copyright (c) 2017 Evgeny Poberezkin
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
function _areEquals(a, b) {
    if (a === b)
        return true;
    if (a && b && typeof a == 'object' && typeof b == 'object') {
        var arrA = Array.isArray(a), arrB = Array.isArray(b), i, length, key;
        if (arrA && arrB) {
            length = a.length;
            if (length != b.length)
                return false;
            for (i = length; i-- !== 0;)
                if (!_areEquals(a[i], b[i]))
                    return false;
            return true;
        }
        if (arrA != arrB)
            return false;
        var keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length)
            return false;
        for (i = length; i-- !== 0;)
            if (!b.hasOwnProperty(keys[i]))
                return false;
        for (i = length; i-- !== 0;) {
            key = keys[i];
            if (!_areEquals(a[key], b[key]))
                return false;
        }
        return true;
    }
    return a !== a && b !== b;
}
;

;// CONCATENATED MODULE: ./node_modules/fast-json-patch/module/duplex.mjs
/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017-2021 Joachim Wester
 * MIT license
 */


var beforeDict = new WeakMap();
var Mirror = /** @class */ (function () {
    function Mirror(obj) {
        this.observers = new Map();
        this.obj = obj;
    }
    return Mirror;
}());
var ObserverInfo = /** @class */ (function () {
    function ObserverInfo(callback, observer) {
        this.callback = callback;
        this.observer = observer;
    }
    return ObserverInfo;
}());
function getMirror(obj) {
    return beforeDict.get(obj);
}
function getObserverFromMirror(mirror, callback) {
    return mirror.observers.get(callback);
}
function removeObserverFromMirror(mirror, observer) {
    mirror.observers.delete(observer.callback);
}
/**
 * Detach an observer from an object
 */
function unobserve(root, observer) {
    observer.unobserve();
}
/**
 * Observes changes made to an object, which can then be retrieved using generate
 */
function observe(obj, callback) {
    var patches = [];
    var observer;
    var mirror = getMirror(obj);
    if (!mirror) {
        mirror = new Mirror(obj);
        beforeDict.set(obj, mirror);
    }
    else {
        var observerInfo = getObserverFromMirror(mirror, callback);
        observer = observerInfo && observerInfo.observer;
    }
    if (observer) {
        return observer;
    }
    observer = {};
    mirror.value = _deepClone(obj);
    if (callback) {
        observer.callback = callback;
        observer.next = null;
        var dirtyCheck = function () {
            generate(observer);
        };
        var fastCheck = function () {
            clearTimeout(observer.next);
            observer.next = setTimeout(dirtyCheck);
        };
        if (typeof window !== 'undefined') { //not Node
            window.addEventListener('mouseup', fastCheck);
            window.addEventListener('keyup', fastCheck);
            window.addEventListener('mousedown', fastCheck);
            window.addEventListener('keydown', fastCheck);
            window.addEventListener('change', fastCheck);
        }
    }
    observer.patches = patches;
    observer.object = obj;
    observer.unobserve = function () {
        generate(observer);
        clearTimeout(observer.next);
        removeObserverFromMirror(mirror, observer);
        if (typeof window !== 'undefined') {
            window.removeEventListener('mouseup', fastCheck);
            window.removeEventListener('keyup', fastCheck);
            window.removeEventListener('mousedown', fastCheck);
            window.removeEventListener('keydown', fastCheck);
            window.removeEventListener('change', fastCheck);
        }
    };
    mirror.observers.set(callback, new ObserverInfo(callback, observer));
    return observer;
}
/**
 * Generate an array of patches from an observer
 */
function generate(observer, invertible) {
    if (invertible === void 0) { invertible = false; }
    var mirror = beforeDict.get(observer.object);
    _generate(mirror.value, observer.object, observer.patches, "", invertible);
    if (observer.patches.length) {
        applyPatch(mirror.value, observer.patches);
    }
    var temp = observer.patches;
    if (temp.length > 0) {
        observer.patches = [];
        if (observer.callback) {
            observer.callback(temp);
        }
    }
    return temp;
}
// Dirty check if obj is different from mirror, generate patches and update mirror
function _generate(mirror, obj, patches, path, invertible) {
    if (obj === mirror) {
        return;
    }
    if (typeof obj.toJSON === "function") {
        obj = obj.toJSON();
    }
    var newKeys = _objectKeys(obj);
    var oldKeys = _objectKeys(mirror);
    var changed = false;
    var deleted = false;
    //if ever "move" operation is implemented here, make sure this test runs OK: "should not generate the same patch twice (move)"
    for (var t = oldKeys.length - 1; t >= 0; t--) {
        var key = oldKeys[t];
        var oldVal = mirror[key];
        if (helpers_hasOwnProperty(obj, key) && !(obj[key] === undefined && oldVal !== undefined && Array.isArray(obj) === false)) {
            var newVal = obj[key];
            if (typeof oldVal == "object" && oldVal != null && typeof newVal == "object" && newVal != null && Array.isArray(oldVal) === Array.isArray(newVal)) {
                _generate(oldVal, newVal, patches, path + "/" + escapePathComponent(key), invertible);
            }
            else {
                if (oldVal !== newVal) {
                    changed = true;
                    if (invertible) {
                        patches.push({ op: "test", path: path + "/" + escapePathComponent(key), value: _deepClone(oldVal) });
                    }
                    patches.push({ op: "replace", path: path + "/" + escapePathComponent(key), value: _deepClone(newVal) });
                }
            }
        }
        else if (Array.isArray(mirror) === Array.isArray(obj)) {
            if (invertible) {
                patches.push({ op: "test", path: path + "/" + escapePathComponent(key), value: _deepClone(oldVal) });
            }
            patches.push({ op: "remove", path: path + "/" + escapePathComponent(key) });
            deleted = true; // property has been deleted
        }
        else {
            if (invertible) {
                patches.push({ op: "test", path: path, value: mirror });
            }
            patches.push({ op: "replace", path: path, value: obj });
            changed = true;
        }
    }
    if (!deleted && newKeys.length == oldKeys.length) {
        return;
    }
    for (var t = 0; t < newKeys.length; t++) {
        var key = newKeys[t];
        if (!helpers_hasOwnProperty(mirror, key) && obj[key] !== undefined) {
            patches.push({ op: "add", path: path + "/" + escapePathComponent(key), value: _deepClone(obj[key]) });
        }
    }
}
/**
 * Create an array of patches from the differences in two objects
 */
function compare(tree1, tree2, invertible) {
    if (invertible === void 0) { invertible = false; }
    var patches = [];
    _generate(tree1, tree2, patches, '', invertible);
    return patches;
}

;// CONCATENATED MODULE: ./node_modules/fast-json-patch/index.mjs





/**
 * Default export for backwards compat
 */





/* harmony default export */ const fast_json_patch = (Object.assign({}, core_namespaceObject, duplex_namespaceObject, {
    JsonPatchError: PatchError,
    deepClone: _deepClone,
    escapePathComponent: escapePathComponent,
    unescapePathComponent: unescapePathComponent
}));
// EXTERNAL MODULE: ./node_modules/json-stringify-pretty-compact/index.js
var json_stringify_pretty_compact = __webpack_require__(75086);
var json_stringify_pretty_compact_default = /*#__PURE__*/__webpack_require__.n(json_stringify_pretty_compact);
// EXTERNAL MODULE: consume shared module (default) vega@^5.20.0 (strict) (fallback: ./node_modules/vega/build/vega.module.js)
var vega_module_js_ = __webpack_require__(78352);
;// CONCATENATED MODULE: ./node_modules/vega-interpreter/build/vega-interpreter.module.js
function adjustSpatial (item, encode, swap) {
  let t;
  if (encode.x2) {
    if (encode.x) {
      if (swap && item.x > item.x2) {
        t = item.x;
        item.x = item.x2;
        item.x2 = t;
      }
      item.width = item.x2 - item.x;
    } else {
      item.x = item.x2 - (item.width || 0);
    }
  }
  if (encode.xc) {
    item.x = item.xc - (item.width || 0) / 2;
  }
  if (encode.y2) {
    if (encode.y) {
      if (swap && item.y > item.y2) {
        t = item.y;
        item.y = item.y2;
        item.y2 = t;
      }
      item.height = item.y2 - item.y;
    } else {
      item.y = item.y2 - (item.height || 0);
    }
  }
  if (encode.yc) {
    item.y = item.yc - (item.height || 0) / 2;
  }
}

var Constants = {
  NaN: NaN,
  E: Math.E,
  LN2: Math.LN2,
  LN10: Math.LN10,
  LOG2E: Math.LOG2E,
  LOG10E: Math.LOG10E,
  PI: Math.PI,
  SQRT1_2: Math.SQRT1_2,
  SQRT2: Math.SQRT2,
  MIN_VALUE: Number.MIN_VALUE,
  MAX_VALUE: Number.MAX_VALUE
};

var Ops = {
  '*': (a, b) => a * b,
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '/': (a, b) => a / b,
  '%': (a, b) => a % b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '>=': (a, b) => a >= b,
  '==': (a, b) => a == b,
  '!=': (a, b) => a != b,
  '===': (a, b) => a === b,
  '!==': (a, b) => a !== b,
  '&': (a, b) => a & b,
  '|': (a, b) => a | b,
  '^': (a, b) => a ^ b,
  '<<': (a, b) => a << b,
  '>>': (a, b) => a >> b,
  '>>>': (a, b) => a >>> b
};

var Unary = {
  '+': a => +a,
  '-': a => -a,
  '~': a => ~a,
  '!': a => !a
};

const slice = Array.prototype.slice;
const apply = (m, args, cast) => {
  const obj = cast ? cast(args[0]) : args[0];
  return obj[m].apply(obj, slice.call(args, 1));
};
const datetime = (y, m, d, H, M, S, ms) => new Date(y, m || 0, d != null ? d : 1, H || 0, M || 0, S || 0, ms || 0);
var Functions = {
  // math functions
  isNaN: Number.isNaN,
  isFinite: Number.isFinite,
  abs: Math.abs,
  acos: Math.acos,
  asin: Math.asin,
  atan: Math.atan,
  atan2: Math.atan2,
  ceil: Math.ceil,
  cos: Math.cos,
  exp: Math.exp,
  floor: Math.floor,
  log: Math.log,
  max: Math.max,
  min: Math.min,
  pow: Math.pow,
  random: Math.random,
  round: Math.round,
  sin: Math.sin,
  sqrt: Math.sqrt,
  tan: Math.tan,
  clamp: (a, b, c) => Math.max(b, Math.min(c, a)),
  // date functions
  now: Date.now,
  utc: Date.UTC,
  datetime: datetime,
  date: d => new Date(d).getDate(),
  day: d => new Date(d).getDay(),
  year: d => new Date(d).getFullYear(),
  month: d => new Date(d).getMonth(),
  hours: d => new Date(d).getHours(),
  minutes: d => new Date(d).getMinutes(),
  seconds: d => new Date(d).getSeconds(),
  milliseconds: d => new Date(d).getMilliseconds(),
  time: d => new Date(d).getTime(),
  timezoneoffset: d => new Date(d).getTimezoneOffset(),
  utcdate: d => new Date(d).getUTCDate(),
  utcday: d => new Date(d).getUTCDay(),
  utcyear: d => new Date(d).getUTCFullYear(),
  utcmonth: d => new Date(d).getUTCMonth(),
  utchours: d => new Date(d).getUTCHours(),
  utcminutes: d => new Date(d).getUTCMinutes(),
  utcseconds: d => new Date(d).getUTCSeconds(),
  utcmilliseconds: d => new Date(d).getUTCMilliseconds(),
  // sequence functions
  length: x => x.length,
  join: function () {
    return apply('join', arguments);
  },
  indexof: function () {
    return apply('indexOf', arguments);
  },
  lastindexof: function () {
    return apply('lastIndexOf', arguments);
  },
  slice: function () {
    return apply('slice', arguments);
  },
  reverse: x => x.slice().reverse(),
  // string functions
  parseFloat: parseFloat,
  parseInt: parseInt,
  upper: x => String(x).toUpperCase(),
  lower: x => String(x).toLowerCase(),
  substring: function () {
    return apply('substring', arguments, String);
  },
  split: function () {
    return apply('split', arguments, String);
  },
  replace: function () {
    return apply('replace', arguments, String);
  },
  trim: x => String(x).trim(),
  // regexp functions
  regexp: RegExp,
  test: (r, t) => RegExp(r).test(t)
};

const EventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'];
const DisallowedMethods = new Set([Function, eval, setTimeout, setInterval]);
if (typeof setImmediate === 'function') DisallowedMethods.add(setImmediate);
const Visitors = {
  Literal: ($, n) => n.value,
  Identifier: ($, n) => {
    const id = n.name;
    return $.memberDepth > 0 ? id : id === 'datum' ? $.datum : id === 'event' ? $.event : id === 'item' ? $.item : Constants[id] || $.params['$' + id];
  },
  MemberExpression: ($, n) => {
    const d = !n.computed,
      o = $(n.object);
    if (d) $.memberDepth += 1;
    const p = $(n.property);
    if (d) $.memberDepth -= 1;
    if (DisallowedMethods.has(o[p])) {
      // eslint-disable-next-line no-console
      console.error(`Prevented interpretation of member "${p}" which could lead to insecure code execution`);
      return;
    }
    return o[p];
  },
  CallExpression: ($, n) => {
    const args = n.arguments;
    let name = n.callee.name;

    // handle special internal functions used by encoders
    // re-route to corresponding standard function
    if (name.startsWith('_')) {
      name = name.slice(1);
    }

    // special case "if" due to conditional evaluation of branches
    return name === 'if' ? $(args[0]) ? $(args[1]) : $(args[2]) : ($.fn[name] || Functions[name]).apply($.fn, args.map($));
  },
  ArrayExpression: ($, n) => n.elements.map($),
  BinaryExpression: ($, n) => Ops[n.operator]($(n.left), $(n.right)),
  UnaryExpression: ($, n) => Unary[n.operator]($(n.argument)),
  ConditionalExpression: ($, n) => $(n.test) ? $(n.consequent) : $(n.alternate),
  LogicalExpression: ($, n) => n.operator === '&&' ? $(n.left) && $(n.right) : $(n.left) || $(n.right),
  ObjectExpression: ($, n) => n.properties.reduce((o, p) => {
    $.memberDepth += 1;
    const k = $(p.key);
    $.memberDepth -= 1;
    if (DisallowedMethods.has($(p.value))) {
      // eslint-disable-next-line no-console
      console.error(`Prevented interpretation of property "${k}" which could lead to insecure code execution`);
    } else {
      o[k] = $(p.value);
    }
    return o;
  }, {})
};
function interpret (ast, fn, params, datum, event, item) {
  const $ = n => Visitors[n.type]($, n);
  $.memberDepth = 0;
  $.fn = Object.create(fn);
  $.params = params;
  $.datum = datum;
  $.event = event;
  $.item = item;

  // route event functions to annotated vega event context
  EventFunctions.forEach(f => $.fn[f] = function () {
    return event.vega[f](...arguments);
  });
  return $(ast);
}

var expression = {
  /**
   * Parse an expression used to update an operator value.
   */
  operator(ctx, expr) {
    const ast = expr.ast,
      fn = ctx.functions;
    return _ => interpret(ast, fn, _);
  },
  /**
   * Parse an expression provided as an operator parameter value.
   */
  parameter(ctx, expr) {
    const ast = expr.ast,
      fn = ctx.functions;
    return (datum, _) => interpret(ast, fn, _, datum);
  },
  /**
   * Parse an expression applied to an event stream.
   */
  event(ctx, expr) {
    const ast = expr.ast,
      fn = ctx.functions;
    return event => interpret(ast, fn, undefined, undefined, event);
  },
  /**
   * Parse an expression used to handle an event-driven operator update.
   */
  handler(ctx, expr) {
    const ast = expr.ast,
      fn = ctx.functions;
    return (_, event) => {
      const datum = event.item && event.item.datum;
      return interpret(ast, fn, _, datum, event);
    };
  },
  /**
   * Parse an expression that performs visual encoding.
   */
  encode(ctx, encode) {
    const {
        marktype,
        channels
      } = encode,
      fn = ctx.functions,
      swap = marktype === 'group' || marktype === 'image' || marktype === 'rect';
    return (item, _) => {
      const datum = item.datum;
      let m = 0,
        v;
      for (const name in channels) {
        v = interpret(channels[name].ast, fn, _, datum, undefined, item);
        if (item[name] !== v) {
          item[name] = v;
          m = 1;
        }
      }
      if (marktype !== 'rule') {
        adjustSpatial(item, channels, swap);
      }
      return m;
    };
  }
};



// EXTERNAL MODULE: consume shared module (default) vega-lite@^5.6.1-next.1 (strict) (fallback: ./node_modules/vega-lite/build/src/index.js)
var index_js_ = __webpack_require__(17438);
;// CONCATENATED MODULE: ./node_modules/vega-schema-url-parser/dist/parser.module.js
function e(e){const[n,r]=/schema\/([\w-]+)\/([\w\.\-]+)\.json$/g.exec(e).slice(1,3);return{library:n,version:r}}/* harmony default export */ const parser_module = (e);
//# sourceMappingURL=parser.module.js.map

;// CONCATENATED MODULE: ./node_modules/vega-themes/build/vega-themes.module.js
var vega_themes_module_name = "vega-themes";
var version$1 = "2.12.1";
var description = "Themes for stylized Vega and Vega-Lite visualizations.";
var keywords = [
	"vega",
	"vega-lite",
	"themes",
	"style"
];
var license = "BSD-3-Clause";
var author = {
	name: "UW Interactive Data Lab",
	url: "https://idl.cs.washington.edu"
};
var contributors = [
	{
		name: "Emily Gu",
		url: "https://github.com/emilygu"
	},
	{
		name: "Arvind Satyanarayan",
		url: "http://arvindsatya.com"
	},
	{
		name: "Jeffrey Heer",
		url: "https://idl.cs.washington.edu"
	},
	{
		name: "Dominik Moritz",
		url: "https://www.domoritz.de"
	}
];
var main = "build/vega-themes.js";
var vega_themes_module_module = "build/vega-themes.module.js";
var unpkg = "build/vega-themes.min.js";
var jsdelivr = "build/vega-themes.min.js";
var types = "build/vega-themes.module.d.ts";
var repository = {
	type: "git",
	url: "https://github.com/vega/vega-themes.git"
};
var files = [
	"src",
	"build"
];
var scripts = {
	prebuild: "yarn clean",
	build: "rollup -c",
	clean: "rimraf build && rimraf examples/build",
	"copy:data": "rsync -r node_modules/vega-datasets/data/* examples/data",
	"copy:build": "rsync -r build/* examples/build",
	"deploy:gh": "yarn build && mkdir -p examples/build && rsync -r build/* examples/build && gh-pages -d examples",
	preversion: "yarn lint",
	serve: "browser-sync start -s -f build examples --serveStatic examples",
	start: "yarn build && concurrently --kill-others -n Server,Rollup 'yarn serve' 'rollup -c -w'",
	prepare: "beemo create-config",
	eslintbase: "beemo eslint .",
	format: "yarn eslintbase --fix",
	lint: "yarn eslintbase",
	release: "release-it"
};
var devDependencies = {
	"@release-it/conventional-changelog": "^5.1.1",
	"@rollup/plugin-json": "^6.0.0",
	"@rollup/plugin-node-resolve": "^15.0.1",
	"@rollup/plugin-terser": "^0.4.0",
	"browser-sync": "^2.27.10",
	concurrently: "^7.3.0",
	"gh-pages": "^5.0.0",
	"release-it": "^15.6.0",
	"rollup-plugin-bundle-size": "^1.0.3",
	"rollup-plugin-ts": "^3.0.2",
	rollup: "^3.15.0",
	typescript: "^4.7.4",
	"vega-lite-dev-config": "^0.21.0",
	"vega-lite": "^5.0.0",
	vega: "^5.19.1"
};
var peerDependencies = {
	vega: "*",
	"vega-lite": "*"
};
var dependencies = {
};
var pkg = {
	name: vega_themes_module_name,
	version: version$1,
	description: description,
	keywords: keywords,
	license: license,
	author: author,
	contributors: contributors,
	main: main,
	module: vega_themes_module_module,
	unpkg: unpkg,
	jsdelivr: jsdelivr,
	types: types,
	repository: repository,
	files: files,
	scripts: scripts,
	devDependencies: devDependencies,
	peerDependencies: peerDependencies,
	dependencies: dependencies
};

const lightColor = '#fff';
const medColor = '#888';
const darkTheme = {
    background: '#333',
    view: {
        stroke: medColor,
    },
    title: {
        color: lightColor,
        subtitleColor: lightColor,
    },
    style: {
        'guide-label': {
            fill: lightColor,
        },
        'guide-title': {
            fill: lightColor,
        },
    },
    axis: {
        domainColor: lightColor,
        gridColor: medColor,
        tickColor: lightColor,
    },
};

const markColor$7 = '#4572a7';
const excelTheme = {
    background: '#fff',
    arc: { fill: markColor$7 },
    area: { fill: markColor$7 },
    line: { stroke: markColor$7, strokeWidth: 2 },
    path: { stroke: markColor$7 },
    rect: { fill: markColor$7 },
    shape: { stroke: markColor$7 },
    symbol: { fill: markColor$7, strokeWidth: 1.5, size: 50 },
    axis: {
        bandPosition: 0.5,
        grid: true,
        gridColor: '#000000',
        gridOpacity: 1,
        gridWidth: 0.5,
        labelPadding: 10,
        tickSize: 5,
        tickWidth: 0.5,
    },
    axisBand: {
        grid: false,
        tickExtra: true,
    },
    legend: {
        labelBaseline: 'middle',
        labelFontSize: 11,
        symbolSize: 50,
        symbolType: 'square',
    },
    range: {
        category: [
            '#4572a7',
            '#aa4643',
            '#8aa453',
            '#71598e',
            '#4598ae',
            '#d98445',
            '#94aace',
            '#d09393',
            '#b9cc98',
            '#a99cbc',
        ],
    },
};

const markColor$6 = '#30a2da';
const axisColor$2 = '#cbcbcb';
const guideLabelColor = '#999';
const guideTitleColor = '#333';
const backgroundColor$2 = '#f0f0f0';
const blackTitle = '#333';
const fiveThirtyEightTheme = {
    arc: { fill: markColor$6 },
    area: { fill: markColor$6 },
    axis: {
        domainColor: axisColor$2,
        grid: true,
        gridColor: axisColor$2,
        gridWidth: 1,
        labelColor: guideLabelColor,
        labelFontSize: 10,
        titleColor: guideTitleColor,
        tickColor: axisColor$2,
        tickSize: 10,
        titleFontSize: 14,
        titlePadding: 10,
        labelPadding: 4,
    },
    axisBand: {
        grid: false,
    },
    background: backgroundColor$2,
    group: {
        fill: backgroundColor$2,
    },
    legend: {
        labelColor: blackTitle,
        labelFontSize: 11,
        padding: 1,
        symbolSize: 30,
        symbolType: 'square',
        titleColor: blackTitle,
        titleFontSize: 14,
        titlePadding: 10,
    },
    line: {
        stroke: markColor$6,
        strokeWidth: 2,
    },
    path: { stroke: markColor$6, strokeWidth: 0.5 },
    rect: { fill: markColor$6 },
    range: {
        category: [
            '#30a2da',
            '#fc4f30',
            '#e5ae38',
            '#6d904f',
            '#8b8b8b',
            '#b96db8',
            '#ff9e27',
            '#56cc60',
            '#52d2ca',
            '#52689e',
            '#545454',
            '#9fe4f8',
        ],
        diverging: ['#cc0020', '#e77866', '#f6e7e1', '#d6e8ed', '#91bfd9', '#1d78b5'],
        heatmap: ['#d6e8ed', '#cee0e5', '#91bfd9', '#549cc6', '#1d78b5'],
    },
    point: {
        filled: true,
        shape: 'circle',
    },
    shape: { stroke: markColor$6 },
    bar: {
        binSpacing: 2,
        fill: markColor$6,
        stroke: null,
    },
    title: {
        anchor: 'start',
        fontSize: 24,
        fontWeight: 600,
        offset: 20,
    },
};

const markColor$5 = '#000';
const ggplot2Theme = {
    group: {
        fill: '#e5e5e5',
    },
    arc: { fill: markColor$5 },
    area: { fill: markColor$5 },
    line: { stroke: markColor$5 },
    path: { stroke: markColor$5 },
    rect: { fill: markColor$5 },
    shape: { stroke: markColor$5 },
    symbol: { fill: markColor$5, size: 40 },
    axis: {
        domain: false,
        grid: true,
        gridColor: '#FFFFFF',
        gridOpacity: 1,
        labelColor: '#7F7F7F',
        labelPadding: 4,
        tickColor: '#7F7F7F',
        tickSize: 5.67,
        titleFontSize: 16,
        titleFontWeight: 'normal',
    },
    legend: {
        labelBaseline: 'middle',
        labelFontSize: 11,
        symbolSize: 40,
    },
    range: {
        category: [
            '#000000',
            '#7F7F7F',
            '#1A1A1A',
            '#999999',
            '#333333',
            '#B0B0B0',
            '#4D4D4D',
            '#C9C9C9',
            '#666666',
            '#DCDCDC',
        ],
    },
};

const headlineFontSize = 22;
const headlineFontWeight = 'normal';
const labelFont$1 = 'Benton Gothic, sans-serif';
const labelFontSize = 11.5;
const labelFontWeight = 'normal';
const markColor$4 = '#82c6df';
// const markHighlight = '#006d8f';
// const markDemocrat = '#5789b8';
// const markRepublican = '#d94f54';
const titleFont = 'Benton Gothic Bold, sans-serif';
const titleFontWeight = 'normal';
const titleFontSize$1 = 13;
const colorSchemes$1 = {
    'category-6': ['#ec8431', '#829eb1', '#c89d29', '#3580b1', '#adc839', '#ab7fb4'],
    'fire-7': ['#fbf2c7', '#f9e39c', '#f8d36e', '#f4bb6a', '#e68a4f', '#d15a40', '#ab4232'],
    'fireandice-6': ['#e68a4f', '#f4bb6a', '#f9e39c', '#dadfe2', '#a6b7c6', '#849eae'],
    'ice-7': ['#edefee', '#dadfe2', '#c4ccd2', '#a6b7c6', '#849eae', '#607785', '#47525d'],
};
const latimesTheme = {
    background: '#ffffff',
    title: {
        anchor: 'start',
        color: '#000000',
        font: titleFont,
        fontSize: headlineFontSize,
        fontWeight: headlineFontWeight,
    },
    arc: { fill: markColor$4 },
    area: { fill: markColor$4 },
    line: { stroke: markColor$4, strokeWidth: 2 },
    path: { stroke: markColor$4 },
    rect: { fill: markColor$4 },
    shape: { stroke: markColor$4 },
    symbol: { fill: markColor$4, size: 30 },
    axis: {
        labelFont: labelFont$1,
        labelFontSize,
        labelFontWeight,
        titleFont,
        titleFontSize: titleFontSize$1,
        titleFontWeight,
    },
    axisX: {
        labelAngle: 0,
        labelPadding: 4,
        tickSize: 3,
    },
    axisY: {
        labelBaseline: 'middle',
        maxExtent: 45,
        minExtent: 45,
        tickSize: 2,
        titleAlign: 'left',
        titleAngle: 0,
        titleX: -45,
        titleY: -11,
    },
    legend: {
        labelFont: labelFont$1,
        labelFontSize,
        symbolType: 'square',
        titleFont,
        titleFontSize: titleFontSize$1,
        titleFontWeight,
    },
    range: {
        category: colorSchemes$1['category-6'],
        diverging: colorSchemes$1['fireandice-6'],
        heatmap: colorSchemes$1['fire-7'],
        ordinal: colorSchemes$1['fire-7'],
        ramp: colorSchemes$1['fire-7'],
    },
};

const markColor$3 = '#ab5787';
const axisColor$1 = '#979797';
const quartzTheme = {
    background: '#f9f9f9',
    arc: { fill: markColor$3 },
    area: { fill: markColor$3 },
    line: { stroke: markColor$3 },
    path: { stroke: markColor$3 },
    rect: { fill: markColor$3 },
    shape: { stroke: markColor$3 },
    symbol: { fill: markColor$3, size: 30 },
    axis: {
        domainColor: axisColor$1,
        domainWidth: 0.5,
        gridWidth: 0.2,
        labelColor: axisColor$1,
        tickColor: axisColor$1,
        tickWidth: 0.2,
        titleColor: axisColor$1,
    },
    axisBand: {
        grid: false,
    },
    axisX: {
        grid: true,
        tickSize: 10,
    },
    axisY: {
        domain: false,
        grid: true,
        tickSize: 0,
    },
    legend: {
        labelFontSize: 11,
        padding: 1,
        symbolSize: 30,
        symbolType: 'square',
    },
    range: {
        category: [
            '#ab5787',
            '#51b2e5',
            '#703c5c',
            '#168dd9',
            '#d190b6',
            '#00609f',
            '#d365ba',
            '#154866',
            '#666666',
            '#c4c4c4',
        ],
    },
};

const markColor$2 = '#3e5c69';
const voxTheme = {
    background: '#fff',
    arc: { fill: markColor$2 },
    area: { fill: markColor$2 },
    line: { stroke: markColor$2 },
    path: { stroke: markColor$2 },
    rect: { fill: markColor$2 },
    shape: { stroke: markColor$2 },
    symbol: { fill: markColor$2 },
    axis: {
        domainWidth: 0.5,
        grid: true,
        labelPadding: 2,
        tickSize: 5,
        tickWidth: 0.5,
        titleFontWeight: 'normal',
    },
    axisBand: {
        grid: false,
    },
    axisX: {
        gridWidth: 0.2,
    },
    axisY: {
        gridDash: [3],
        gridWidth: 0.4,
    },
    legend: {
        labelFontSize: 11,
        padding: 1,
        symbolType: 'square',
    },
    range: {
        category: ['#3e5c69', '#6793a6', '#182429', '#0570b0', '#3690c0', '#74a9cf', '#a6bddb', '#e2ddf2'],
    },
};

const markColor$1 = '#1696d2';
const axisColor = '#000000';
const backgroundColor$1 = '#FFFFFF';
const font = 'Lato';
const labelFont = 'Lato';
const sourceFont = 'Lato';
const gridColor$1 = '#DEDDDD';
const titleFontSize = 18;
const colorSchemes = {
    'main-colors': ['#1696d2', '#d2d2d2', '#000000', '#fdbf11', '#ec008b', '#55b748', '#5c5859', '#db2b27'],
    'shades-blue': ['#CFE8F3', '#A2D4EC', '#73BFE2', '#46ABDB', '#1696D2', '#12719E', '#0A4C6A', '#062635'],
    'shades-gray': ['#F5F5F5', '#ECECEC', '#E3E3E3', '#DCDBDB', '#D2D2D2', '#9D9D9D', '#696969', '#353535'],
    'shades-yellow': ['#FFF2CF', '#FCE39E', '#FDD870', '#FCCB41', '#FDBF11', '#E88E2D', '#CA5800', '#843215'],
    'shades-magenta': ['#F5CBDF', '#EB99C2', '#E46AA7', '#E54096', '#EC008B', '#AF1F6B', '#761548', '#351123'],
    'shades-green': ['#DCEDD9', '#BCDEB4', '#98CF90', '#78C26D', '#55B748', '#408941', '#2C5C2D', '#1A2E19'],
    'shades-black': ['#D5D5D4', '#ADABAC', '#848081', '#5C5859', '#332D2F', '#262223', '#1A1717', '#0E0C0D'],
    'shades-red': ['#F8D5D4', '#F1AAA9', '#E9807D', '#E25552', '#DB2B27', '#A4201D', '#6E1614', '#370B0A'],
    'one-group': ['#1696d2', '#000000'],
    'two-groups-cat-1': ['#1696d2', '#000000'],
    'two-groups-cat-2': ['#1696d2', '#fdbf11'],
    'two-groups-cat-3': ['#1696d2', '#db2b27'],
    'two-groups-seq': ['#a2d4ec', '#1696d2'],
    'three-groups-cat': ['#1696d2', '#fdbf11', '#000000'],
    'three-groups-seq': ['#a2d4ec', '#1696d2', '#0a4c6a'],
    'four-groups-cat-1': ['#000000', '#d2d2d2', '#fdbf11', '#1696d2'],
    'four-groups-cat-2': ['#1696d2', '#ec0008b', '#fdbf11', '#5c5859'],
    'four-groups-seq': ['#cfe8f3', '#73bf42', '#1696d2', '#0a4c6a'],
    'five-groups-cat-1': ['#1696d2', '#fdbf11', '#d2d2d2', '#ec008b', '#000000'],
    'five-groups-cat-2': ['#1696d2', '#0a4c6a', '#d2d2d2', '#fdbf11', '#332d2f'],
    'five-groups-seq': ['#cfe8f3', '#73bf42', '#1696d2', '#0a4c6a', '#000000'],
    'six-groups-cat-1': ['#1696d2', '#ec008b', '#fdbf11', '#000000', '#d2d2d2', '#55b748'],
    'six-groups-cat-2': ['#1696d2', '#d2d2d2', '#ec008b', '#fdbf11', '#332d2f', '#0a4c6a'],
    'six-groups-seq': ['#cfe8f3', '#a2d4ec', '#73bfe2', '#46abdb', '#1696d2', '#12719e'],
    'diverging-colors': ['#ca5800', '#fdbf11', '#fdd870', '#fff2cf', '#cfe8f3', '#73bfe2', '#1696d2', '#0a4c6a'],
};
const urbanInstituteTheme = {
    background: backgroundColor$1,
    title: {
        anchor: 'start',
        fontSize: titleFontSize,
        font: font,
    },
    axisX: {
        domain: true,
        domainColor: axisColor,
        domainWidth: 1,
        grid: false,
        labelFontSize: 12,
        labelFont: labelFont,
        labelAngle: 0,
        tickColor: axisColor,
        tickSize: 5,
        titleFontSize: 12,
        titlePadding: 10,
        titleFont: font,
    },
    axisY: {
        domain: false,
        domainWidth: 1,
        grid: true,
        gridColor: gridColor$1,
        gridWidth: 1,
        labelFontSize: 12,
        labelFont: labelFont,
        labelPadding: 8,
        ticks: false,
        titleFontSize: 12,
        titlePadding: 10,
        titleFont: font,
        titleAngle: 0,
        titleY: -10,
        titleX: 18,
    },
    legend: {
        labelFontSize: 12,
        labelFont: labelFont,
        symbolSize: 100,
        titleFontSize: 12,
        titlePadding: 10,
        titleFont: font,
        orient: 'right',
        offset: 10,
    },
    view: {
        stroke: 'transparent',
    },
    range: {
        category: colorSchemes['six-groups-cat-1'],
        diverging: colorSchemes['diverging-colors'],
        heatmap: colorSchemes['diverging-colors'],
        ordinal: colorSchemes['six-groups-seq'],
        ramp: colorSchemes['shades-blue'],
    },
    area: {
        fill: markColor$1,
    },
    rect: {
        fill: markColor$1,
    },
    line: {
        color: markColor$1,
        stroke: markColor$1,
        strokeWidth: 5,
    },
    trail: {
        color: markColor$1,
        stroke: markColor$1,
        strokeWidth: 0,
        size: 1,
    },
    path: {
        stroke: markColor$1,
        strokeWidth: 0.5,
    },
    point: {
        filled: true,
    },
    text: {
        font: sourceFont,
        color: markColor$1,
        fontSize: 11,
        align: 'center',
        fontWeight: 400,
        size: 11,
    },
    style: {
        bar: {
            fill: markColor$1,
            stroke: null,
        },
    },
    arc: { fill: markColor$1 },
    shape: { stroke: markColor$1 },
    symbol: { fill: markColor$1, size: 30 },
};

/**
 * Copyright 2020 Google LLC.
 *
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file or at
 * https://developers.google.com/open-source/licenses/bsd
 */
const markColor = '#3366CC';
const gridColor = '#ccc';
const defaultFont = 'Arial, sans-serif';
const googlechartsTheme = {
    arc: { fill: markColor },
    area: { fill: markColor },
    path: { stroke: markColor },
    rect: { fill: markColor },
    shape: { stroke: markColor },
    symbol: { stroke: markColor },
    circle: { fill: markColor },
    background: '#fff',
    padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10,
    },
    style: {
        'guide-label': {
            font: defaultFont,
            fontSize: 12,
        },
        'guide-title': {
            font: defaultFont,
            fontSize: 12,
        },
        'group-title': {
            font: defaultFont,
            fontSize: 12,
        },
    },
    title: {
        font: defaultFont,
        fontSize: 14,
        fontWeight: 'bold',
        dy: -3,
        anchor: 'start',
    },
    axis: {
        gridColor: gridColor,
        tickColor: gridColor,
        domain: false,
        grid: true,
    },
    range: {
        category: [
            '#4285F4',
            '#DB4437',
            '#F4B400',
            '#0F9D58',
            '#AB47BC',
            '#00ACC1',
            '#FF7043',
            '#9E9D24',
            '#5C6BC0',
            '#F06292',
            '#00796B',
            '#C2185B',
        ],
        heatmap: ['#c6dafc', '#5e97f6', '#2a56c6'],
    },
};

const ptToPx = (value) => value * (1 / 3 + 1);
const fontSmallPx = ptToPx(9);
const legendFontPx = ptToPx(10);
const fontLargePx = ptToPx(12);
const fontStandard = 'Segoe UI';
const fontTitle = 'wf_standard-font, helvetica, arial, sans-serif';
const firstLevelElementColor = '#252423';
const secondLevelElementColor = '#605E5C';
const backgroundColor = 'transparent';
const backgroundSecondaryColor = '#C8C6C4';
const paletteColor1 = '#118DFF';
const paletteColor2 = '#12239E';
const paletteColor3 = '#E66C37';
const paletteColor4 = '#6B007B';
const paletteColor5 = '#E044A7';
const paletteColor6 = '#744EC2';
const paletteColor7 = '#D9B300';
const paletteColor8 = '#D64550';
const divergentColorMax = paletteColor1;
const divergentColorMin = '#DEEFFF';
const divergentPalette = [divergentColorMin, divergentColorMax];
const ordinalPalette = [
    divergentColorMin,
    '#c7e4ff',
    '#b0d9ff',
    '#9aceff',
    '#83c3ff',
    '#6cb9ff',
    '#55aeff',
    '#3fa3ff',
    '#2898ff',
    divergentColorMax,
];
const powerbiTheme = {
    view: { stroke: backgroundColor },
    background: backgroundColor,
    font: fontStandard,
    header: {
        titleFont: fontTitle,
        titleFontSize: fontLargePx,
        titleColor: firstLevelElementColor,
        labelFont: fontStandard,
        labelFontSize: legendFontPx,
        labelColor: secondLevelElementColor,
    },
    axis: {
        ticks: false,
        grid: false,
        domain: false,
        labelColor: secondLevelElementColor,
        labelFontSize: fontSmallPx,
        titleFont: fontTitle,
        titleColor: firstLevelElementColor,
        titleFontSize: fontLargePx,
        titleFontWeight: 'normal',
    },
    axisQuantitative: {
        tickCount: 3,
        grid: true,
        gridColor: backgroundSecondaryColor,
        gridDash: [1, 5],
        labelFlush: false,
    },
    axisBand: { tickExtra: true },
    axisX: { labelPadding: 5 },
    axisY: { labelPadding: 10 },
    bar: { fill: paletteColor1 },
    line: {
        stroke: paletteColor1,
        strokeWidth: 3,
        strokeCap: 'round',
        strokeJoin: 'round',
    },
    text: { font: fontStandard, fontSize: fontSmallPx, fill: secondLevelElementColor },
    arc: { fill: paletteColor1 },
    area: { fill: paletteColor1, line: true, opacity: 0.6 },
    path: { stroke: paletteColor1 },
    rect: { fill: paletteColor1 },
    point: { fill: paletteColor1, filled: true, size: 75 },
    shape: { stroke: paletteColor1 },
    symbol: { fill: paletteColor1, strokeWidth: 1.5, size: 50 },
    legend: {
        titleFont: fontStandard,
        titleFontWeight: 'bold',
        titleColor: secondLevelElementColor,
        labelFont: fontStandard,
        labelFontSize: legendFontPx,
        labelColor: secondLevelElementColor,
        symbolType: 'circle',
        symbolSize: 75,
    },
    range: {
        category: [
            paletteColor1,
            paletteColor2,
            paletteColor3,
            paletteColor4,
            paletteColor5,
            paletteColor6,
            paletteColor7,
            paletteColor8,
        ],
        diverging: divergentPalette,
        heatmap: divergentPalette,
        ordinal: ordinalPalette,
    },
};

const version = pkg.version;



// EXTERNAL MODULE: ./node_modules/vega-util/build/vega-util.module.js
var vega_util_module = __webpack_require__(26372);
;// CONCATENATED MODULE: ./node_modules/vega-tooltip/build/vega-tooltip.module.js


var vega_tooltip_module_name = "vega-tooltip";
var vega_tooltip_module_version$1 = "0.30.1";
var vega_tooltip_module_description = "A tooltip plugin for Vega-Lite and Vega visualizations.";
var vega_tooltip_module_keywords = [
	"vega-lite",
	"vega",
	"tooltip"
];
var vega_tooltip_module_repository = {
	type: "git",
	url: "https://github.com/vega/vega-tooltip.git"
};
var vega_tooltip_module_author = {
	name: "UW Interactive Data Lab",
	url: "https://idl.cs.washington.edu"
};
var collaborators = [
	"Dominik Moritz",
	"Sira Horradarn",
	"Zening Qu",
	"Kanit Wongsuphasawat",
	"Yuri Astrakhan",
	"Jeffrey Heer"
];
var vega_tooltip_module_license = "BSD-3-Clause";
var bugs = {
	url: "https://github.com/vega/vega-tooltip/issues"
};
var homepage = "https://github.com/vega/vega-tooltip#readme";
var vega_tooltip_module_main = "build/vega-tooltip.js";
var vega_tooltip_module_module = "build/vega-tooltip.module.js";
var vega_tooltip_module_unpkg = "build/vega-tooltip.min.js";
var vega_tooltip_module_jsdelivr = "build/vega-tooltip.min.js";
var vega_tooltip_module_types = "build/vega-tooltip.module.d.ts";
var vega_tooltip_module_files = [
	"src",
	"build",
	"types"
];
var vega_tooltip_module_scripts = {
	prebuild: "yarn clean && yarn build:style",
	build: "rollup -c",
	"build:style": "./build-style.sh",
	clean: "rimraf build && rimraf src/style.ts",
	"copy:data": "rsync -r node_modules/vega-datasets/data/* examples/data",
	"copy:build": "rsync -r build/* examples/build",
	"deploy:gh": "yarn build && yarn copy:build && gh-pages -d examples && yarn clean",
	prepublishOnly: "yarn clean && yarn build",
	preversion: "yarn lint && yarn test",
	serve: "browser-sync start -s -f build examples --serveStatic examples",
	start: "yarn build && concurrently --kill-others -n Server,Rollup 'yarn serve' 'rollup -c -w'",
	pretest: "yarn build:style",
	test: "beemo jest",
	"test:inspect": "node --inspect-brk ./node_modules/.bin/jest --runInBand",
	prepare: "beemo create-config && yarn copy:data",
	prettierbase: "beemo prettier '*.{css,scss,html}'",
	eslintbase: "beemo eslint .",
	format: "yarn eslintbase --fix && yarn prettierbase --write",
	lint: "yarn eslintbase && yarn prettierbase --check",
	release: "release-it"
};
var vega_tooltip_module_devDependencies = {
	"@release-it/conventional-changelog": "^5.1.1",
	"@rollup/plugin-json": "^6.0.0",
	"@rollup/plugin-node-resolve": "^15.0.1",
	"release-it": "^15.6.0",
	"browser-sync": "^2.27.11",
	concurrently: "^7.6.0",
	"gh-pages": "^5.0.0",
	"jest-environment-jsdom": "^29.4.2",
	path: "^0.12.7",
	rollup: "^3.15.0",
	"rollup-plugin-bundle-size": "^1.0.3",
	"@rollup/plugin-terser": "^0.4.0",
	"rollup-plugin-ts": "^3.2.0",
	sass: "^1.58.0",
	typescript: "~4.9.5",
	"vega-datasets": "^2.5.4",
	"vega-lite-dev-config": "^0.21.0",
	"vega-typings": "^0.22.3"
};
var vega_tooltip_module_dependencies = {
	"vega-util": "^1.17.0"
};
var vega_tooltip_module_pkg = {
	name: vega_tooltip_module_name,
	version: vega_tooltip_module_version$1,
	description: vega_tooltip_module_description,
	keywords: vega_tooltip_module_keywords,
	repository: vega_tooltip_module_repository,
	author: vega_tooltip_module_author,
	collaborators: collaborators,
	license: vega_tooltip_module_license,
	bugs: bugs,
	homepage: homepage,
	main: vega_tooltip_module_main,
	module: vega_tooltip_module_module,
	unpkg: vega_tooltip_module_unpkg,
	jsdelivr: vega_tooltip_module_jsdelivr,
	types: vega_tooltip_module_types,
	files: vega_tooltip_module_files,
	scripts: vega_tooltip_module_scripts,
	devDependencies: vega_tooltip_module_devDependencies,
	dependencies: vega_tooltip_module_dependencies
};

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

/**
 * Format the value to be shown in the tooltip.
 *
 * @param value The value to show in the tooltip.
 * @param valueToHtml Function to convert a single cell value to an HTML string
 */
function formatValue(value, valueToHtml, maxDepth) {
    if ((0,vega_util_module/* isArray */.cy)(value)) {
        return `[${value.map((v) => valueToHtml((0,vega_util_module/* isString */.Kg)(v) ? v : stringify(v, maxDepth))).join(', ')}]`;
    }
    if ((0,vega_util_module/* isObject */.Gv)(value)) {
        let content = '';
        const _a = value, { title, image } = _a, rest = __rest(_a, ["title", "image"]);
        if (title) {
            content += `<h2>${valueToHtml(title)}</h2>`;
        }
        if (image) {
            content += `<img src="${valueToHtml(image)}">`;
        }
        const keys = Object.keys(rest);
        if (keys.length > 0) {
            content += '<table>';
            for (const key of keys) {
                let val = rest[key];
                // ignore undefined properties
                if (val === undefined) {
                    continue;
                }
                if ((0,vega_util_module/* isObject */.Gv)(val)) {
                    val = stringify(val, maxDepth);
                }
                content += `<tr><td class="key">${valueToHtml(key)}:</td><td class="value">${valueToHtml(val)}</td></tr>`;
            }
            content += `</table>`;
        }
        return content || '{}'; // show empty object if there are no properties
    }
    return valueToHtml(value);
}
function replacer(maxDepth) {
    const stack = [];
    return function (key, value) {
        if (typeof value !== 'object' || value === null) {
            return value;
        }
        const pos = stack.indexOf(this) + 1;
        stack.length = pos;
        if (stack.length > maxDepth) {
            return '[Object]';
        }
        if (stack.indexOf(value) >= 0) {
            return '[Circular]';
        }
        stack.push(value);
        return value;
    };
}
/**
 * Stringify any JS object to valid JSON
 */
function stringify(obj, maxDepth) {
    return JSON.stringify(obj, replacer(maxDepth));
}

// generated with build-style.sh
var defaultStyle = `#vg-tooltip-element {
  visibility: hidden;
  padding: 8px;
  position: fixed;
  z-index: 1000;
  font-family: sans-serif;
  font-size: 11px;
  border-radius: 3px;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  /* The default theme is the light theme. */
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #d9d9d9;
  color: black;
}
#vg-tooltip-element.visible {
  visibility: visible;
}
#vg-tooltip-element h2 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 13px;
}
#vg-tooltip-element img {
  max-width: 200px;
  max-height: 200px;
}
#vg-tooltip-element table {
  border-spacing: 0;
}
#vg-tooltip-element table tr {
  border: none;
}
#vg-tooltip-element table tr td {
  overflow: hidden;
  text-overflow: ellipsis;
  padding-top: 2px;
  padding-bottom: 2px;
}
#vg-tooltip-element table tr td.key {
  color: #808080;
  max-width: 150px;
  text-align: right;
  padding-right: 4px;
}
#vg-tooltip-element table tr td.value {
  display: block;
  max-width: 300px;
  max-height: 7em;
  text-align: left;
}
#vg-tooltip-element.dark-theme {
  background-color: rgba(32, 32, 32, 0.9);
  border: 1px solid #f5f5f5;
  color: white;
}
#vg-tooltip-element.dark-theme td.key {
  color: #bfbfbf;
}
`;

const EL_ID = 'vg-tooltip-element';
const DEFAULT_OPTIONS = {
    /**
     * X offset.
     */
    offsetX: 10,
    /**
     * Y offset.
     */
    offsetY: 10,
    /**
     * ID of the tooltip element.
     */
    id: EL_ID,
    /**
     * ID of the tooltip CSS style.
     */
    styleId: 'vega-tooltip-style',
    /**
     * The name of the theme. You can use the CSS class called [THEME]-theme to style the tooltips.
     *
     * There are two predefined themes: "light" (default) and "dark".
     */
    theme: 'light',
    /**
     * Do not use the default styles provided by Vega Tooltip. If you enable this option, you need to use your own styles. It is not necessary to disable the default style when using a custom theme.
     */
    disableDefaultStyle: false,
    /**
     * HTML sanitizer function that removes dangerous HTML to prevent XSS.
     *
     * This should be a function from string to string. You may replace it with a formatter such as a markdown formatter.
     */
    sanitize: escapeHTML,
    /**
     * The maximum recursion depth when printing objects in the tooltip.
     */
    maxDepth: 2,
    /**
     * A function to customize the rendered HTML of the tooltip.
     * @param value A value string, or object of value strings keyed by field
     * @param sanitize The `sanitize` function from `options.sanitize`
     * @returns {string} The returned string will become the `innerHTML` of the tooltip element
     */
    formatTooltip: formatValue,
};
/**
 * Escape special HTML characters.
 *
 * @param value A value to convert to string and HTML-escape.
 */
function escapeHTML(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}
function createDefaultStyle(id) {
    // Just in case this id comes from a user, ensure these is no security issues
    if (!/^[A-Za-z]+[-:.\w]*$/.test(id)) {
        throw new Error('Invalid HTML ID');
    }
    return defaultStyle.toString().replace(EL_ID, id);
}

/**
 * Position the tooltip
 *
 * @param event The mouse event.
 * @param tooltipBox
 * @param offsetX Horizontal offset.
 * @param offsetY Vertical offset.
 */
function calculatePosition(event, tooltipBox, offsetX, offsetY) {
    let x = event.clientX + offsetX;
    if (x + tooltipBox.width > window.innerWidth) {
        x = +event.clientX - offsetX - tooltipBox.width;
    }
    let y = event.clientY + offsetY;
    if (y + tooltipBox.height > window.innerHeight) {
        y = +event.clientY - offsetY - tooltipBox.height;
    }
    return { x, y };
}

/**
 * The tooltip handler class.
 */
class Handler {
    /**
     * Create the tooltip handler and initialize the element and style.
     *
     * @param options Tooltip Options
     */
    constructor(options) {
        this.options = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options);
        const elementId = this.options.id;
        this.el = null;
        // bind this to call
        this.call = this.tooltipHandler.bind(this);
        // prepend a default stylesheet for tooltips to the head
        if (!this.options.disableDefaultStyle && !document.getElementById(this.options.styleId)) {
            const style = document.createElement('style');
            style.setAttribute('id', this.options.styleId);
            style.innerHTML = createDefaultStyle(elementId);
            const head = document.head;
            if (head.childNodes.length > 0) {
                head.insertBefore(style, head.childNodes[0]);
            }
            else {
                head.appendChild(style);
            }
        }
    }
    /**
     * The tooltip handler function.
     */
    tooltipHandler(handler, event, item, value) {
        // console.log(handler, event, item, value);
        var _a;
        // append a div element that we use as a tooltip unless it already exists
        this.el = document.getElementById(this.options.id);
        if (!this.el) {
            this.el = document.createElement('div');
            this.el.setAttribute('id', this.options.id);
            this.el.classList.add('vg-tooltip');
            const tooltipContainer = (_a = document.fullscreenElement) !== null && _a !== void 0 ? _a : document.body;
            tooltipContainer.appendChild(this.el);
        }
        // hide tooltip for null, undefined, or empty string values
        if (value == null || value === '') {
            this.el.classList.remove('visible', `${this.options.theme}-theme`);
            return;
        }
        // set the tooltip content
        this.el.innerHTML = this.options.formatTooltip(value, this.options.sanitize, this.options.maxDepth);
        // make the tooltip visible
        this.el.classList.add('visible', `${this.options.theme}-theme`);
        const { x, y } = calculatePosition(event, this.el.getBoundingClientRect(), this.options.offsetX, this.options.offsetY);
        this.el.style.top = `${y}px`;
        this.el.style.left = `${x}px`;
    }
}

const vega_tooltip_module_version = vega_tooltip_module_pkg.version;
/**
 * Create a tooltip handler and register it with the provided view.
 *
 * @param view The Vega view.
 * @param opt Tooltip options.
 */
function index (view, opt) {
    const handler = new Handler(opt);
    view.tooltip(handler.call).run();
    return handler;
}


//# sourceMappingURL=vega-tooltip.module.js.map

;// CONCATENATED MODULE: ./node_modules/vega-embed/build/vega-embed.module.js
/* provided dependency */ var process = __webpack_require__(65606);










function _typeof(obj) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
}

function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}

function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
}

function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _asyncToGenerator(fn) {
  return function () {
    var self = this,
      args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(undefined);
    });
  };
}

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var Op = Object.prototype;
var hasOwn = Op.hasOwnProperty;
var undefined$1; // More compressible than void 0.
var $Symbol = typeof Symbol === "function" ? Symbol : {};
var iteratorSymbol = $Symbol.iterator || "@@iterator";
var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
function wrap(innerFn, outerFn, self, tryLocsList) {
  // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
  var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
  var generator = Object.create(protoGenerator.prototype);
  var context = new Context(tryLocsList || []);

  // The ._invoke method unifies the implementations of the .next,
  // .throw, and .return methods.
  generator._invoke = makeInvokeMethod(innerFn, self, context);
  return generator;
}

// Try/catch helper to minimize deoptimizations. Returns a completion
// record like context.tryEntries[i].completion. This interface could
// have been (and was previously) designed to take a closure to be
// invoked without arguments, but in all the cases we care about we
// already have an existing method we want to call, so there's no need
// to create a new function object. We can even get away with assuming
// the method takes exactly one argument, since that happens to be true
// in every case, so we don't have to touch the arguments object. The
// only additional allocation required is the completion record, which
// has a stable shape and so hopefully should be cheap to allocate.
function tryCatch(fn, obj, arg) {
  try {
    return {
      type: "normal",
      arg: fn.call(obj, arg)
    };
  } catch (err) {
    return {
      type: "throw",
      arg: err
    };
  }
}
var GenStateSuspendedStart = "suspendedStart";
var GenStateSuspendedYield = "suspendedYield";
var GenStateExecuting = "executing";
var GenStateCompleted = "completed";

// Returning this object from the innerFn has the same effect as
// breaking out of the dispatch switch statement.
var ContinueSentinel = {};

// Dummy constructor functions that we use as the .constructor and
// .constructor.prototype properties for functions that return Generator
// objects. For full spec compliance, you may wish to configure your
// minifier not to mangle the names of these two functions.
function Generator() {}
function GeneratorFunction() {}
function GeneratorFunctionPrototype() {}

// This is a polyfill for %IteratorPrototype% for environments that
// don't natively support it.
var IteratorPrototype = {};
IteratorPrototype[iteratorSymbol] = function () {
  return this;
};
var getProto = Object.getPrototypeOf;
var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
if (NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
  // This environment has a native %IteratorPrototype%; use it instead
  // of the polyfill.
  IteratorPrototype = NativeIteratorPrototype;
}
var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
GeneratorFunctionPrototype.constructor = GeneratorFunction;
GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction";

// Helper for defining the .next, .throw, and .return methods of the
// Iterator interface in terms of a single ._invoke method.
function defineIteratorMethods(prototype) {
  ["next", "throw", "return"].forEach(function (method) {
    prototype[method] = function (arg) {
      return this._invoke(method, arg);
    };
  });
}
function isGeneratorFunction(genFun) {
  var ctor = typeof genFun === "function" && genFun.constructor;
  return ctor ? ctor === GeneratorFunction ||
  // For the native GeneratorFunction constructor, the best we can
  // do is to check its .name property.
  (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
}
function mark(genFun) {
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
  } else {
    genFun.__proto__ = GeneratorFunctionPrototype;
    if (!(toStringTagSymbol in genFun)) {
      genFun[toStringTagSymbol] = "GeneratorFunction";
    }
  }
  genFun.prototype = Object.create(Gp);
  return genFun;
}

// Within the body of any async function, `await x` is transformed to
// `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
// `hasOwn.call(value, "__await")` to determine if the yielded value is
// meant to be awaited.
function awrap(arg) {
  return {
    __await: arg
  };
}
function AsyncIterator(generator, PromiseImpl) {
  function invoke(method, arg, resolve, reject) {
    var record = tryCatch(generator[method], generator, arg);
    if (record.type === "throw") {
      reject(record.arg);
    } else {
      var result = record.arg;
      var value = result.value;
      if (value && typeof value === "object" && hasOwn.call(value, "__await")) {
        return PromiseImpl.resolve(value.__await).then(function (value) {
          invoke("next", value, resolve, reject);
        }, function (err) {
          invoke("throw", err, resolve, reject);
        });
      }
      return PromiseImpl.resolve(value).then(function (unwrapped) {
        // When a yielded Promise is resolved, its final value becomes
        // the .value of the Promise<{value,done}> result for the
        // current iteration.
        result.value = unwrapped;
        resolve(result);
      }, function (error) {
        // If a rejected Promise was yielded, throw the rejection back
        // into the async generator function so it can be handled there.
        return invoke("throw", error, resolve, reject);
      });
    }
  }
  var previousPromise;
  function enqueue(method, arg) {
    function callInvokeWithMethodAndArg() {
      return new PromiseImpl(function (resolve, reject) {
        invoke(method, arg, resolve, reject);
      });
    }
    return previousPromise =
    // If enqueue has been called before, then we want to wait until
    // all previous Promises have been resolved before calling invoke,
    // so that results are always delivered in the correct order. If
    // enqueue has not been called before, then it is important to
    // call invoke immediately, without waiting on a callback to fire,
    // so that the async generator function has the opportunity to do
    // any necessary setup in a predictable way. This predictability
    // is why the Promise constructor synchronously invokes its
    // executor callback, and why async functions synchronously
    // execute code before the first await. Since we implement simple
    // async functions in terms of async generators, it is especially
    // important to get this right, even though it requires care.
    previousPromise ? previousPromise.then(callInvokeWithMethodAndArg,
    // Avoid propagating failures to Promises returned by later
    // invocations of the iterator.
    callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
  }

  // Define the unified helper method that is used to implement .next,
  // .throw, and .return (see defineIteratorMethods).
  this._invoke = enqueue;
}
defineIteratorMethods(AsyncIterator.prototype);
AsyncIterator.prototype[asyncIteratorSymbol] = function () {
  return this;
};

// Note that simple async functions are implemented on top of
// AsyncIterator objects; they just return a Promise for the value of
// the final result produced by the iterator.
function vega_embed_module_async(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
  if (PromiseImpl === void 0) PromiseImpl = Promise;
  var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl);
  return isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
  : iter.next().then(function (result) {
    return result.done ? result.value : iter.next();
  });
}
function makeInvokeMethod(innerFn, self, context) {
  var state = GenStateSuspendedStart;
  return function invoke(method, arg) {
    if (state === GenStateExecuting) {
      throw new Error("Generator is already running");
    }
    if (state === GenStateCompleted) {
      if (method === "throw") {
        throw arg;
      }

      // Be forgiving, per 25.3.3.3.3 of the spec:
      // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
      return doneResult();
    }
    context.method = method;
    context.arg = arg;
    while (true) {
      var delegate = context.delegate;
      if (delegate) {
        var delegateResult = maybeInvokeDelegate(delegate, context);
        if (delegateResult) {
          if (delegateResult === ContinueSentinel) continue;
          return delegateResult;
        }
      }
      if (context.method === "next") {
        // Setting context._sent for legacy support of Babel's
        // function.sent implementation.
        context.sent = context._sent = context.arg;
      } else if (context.method === "throw") {
        if (state === GenStateSuspendedStart) {
          state = GenStateCompleted;
          throw context.arg;
        }
        context.dispatchException(context.arg);
      } else if (context.method === "return") {
        context.abrupt("return", context.arg);
      }
      state = GenStateExecuting;
      var record = tryCatch(innerFn, self, context);
      if (record.type === "normal") {
        // If an exception is thrown from innerFn, we leave state ===
        // GenStateExecuting and loop back for another invocation.
        state = context.done ? GenStateCompleted : GenStateSuspendedYield;
        if (record.arg === ContinueSentinel) {
          continue;
        }
        return {
          value: record.arg,
          done: context.done
        };
      } else if (record.type === "throw") {
        state = GenStateCompleted;
        // Dispatch the exception by looping back around to the
        // context.dispatchException(context.arg) call above.
        context.method = "throw";
        context.arg = record.arg;
      }
    }
  };
}

// Call delegate.iterator[context.method](context.arg) and handle the
// result, either by returning a { value, done } result from the
// delegate iterator, or by modifying context.method and context.arg,
// setting context.delegate to null, and returning the ContinueSentinel.
function maybeInvokeDelegate(delegate, context) {
  var method = delegate.iterator[context.method];
  if (method === undefined$1) {
    // A .throw or .return when the delegate iterator has no .throw
    // method always terminates the yield* loop.
    context.delegate = null;
    if (context.method === "throw") {
      // Note: ["return"] must be used for ES3 parsing compatibility.
      if (delegate.iterator["return"]) {
        // If the delegate iterator has a return method, give it a
        // chance to clean up.
        context.method = "return";
        context.arg = undefined$1;
        maybeInvokeDelegate(delegate, context);
        if (context.method === "throw") {
          // If maybeInvokeDelegate(context) changed context.method from
          // "return" to "throw", let that override the TypeError below.
          return ContinueSentinel;
        }
      }
      context.method = "throw";
      context.arg = new TypeError("The iterator does not provide a 'throw' method");
    }
    return ContinueSentinel;
  }
  var record = tryCatch(method, delegate.iterator, context.arg);
  if (record.type === "throw") {
    context.method = "throw";
    context.arg = record.arg;
    context.delegate = null;
    return ContinueSentinel;
  }
  var info = record.arg;
  if (!info) {
    context.method = "throw";
    context.arg = new TypeError("iterator result is not an object");
    context.delegate = null;
    return ContinueSentinel;
  }
  if (info.done) {
    // Assign the result of the finished delegate to the temporary
    // variable specified by delegate.resultName (see delegateYield).
    context[delegate.resultName] = info.value;

    // Resume execution at the desired location (see delegateYield).
    context.next = delegate.nextLoc;

    // If context.method was "throw" but the delegate handled the
    // exception, let the outer generator proceed normally. If
    // context.method was "next", forget context.arg since it has been
    // "consumed" by the delegate iterator. If context.method was
    // "return", allow the original .return call to continue in the
    // outer generator.
    if (context.method !== "return") {
      context.method = "next";
      context.arg = undefined$1;
    }
  } else {
    // Re-yield the result returned by the delegate method.
    return info;
  }

  // The delegate iterator is finished, so forget it and continue with
  // the outer generator.
  context.delegate = null;
  return ContinueSentinel;
}

// Define Generator.prototype.{next,throw,return} in terms of the
// unified ._invoke helper method.
defineIteratorMethods(Gp);
Gp[toStringTagSymbol] = "Generator";

// A Generator should always return itself as the iterator object when the
// @@iterator function is called on it. Some browsers' implementations of the
// iterator prototype chain incorrectly implement this, causing the Generator
// object to not be returned from this call. This ensures that doesn't happen.
// See https://github.com/facebook/regenerator/issues/274 for more details.
Gp[iteratorSymbol] = function () {
  return this;
};
Gp.toString = function () {
  return "[object Generator]";
};
function pushTryEntry(locs) {
  var entry = {
    tryLoc: locs[0]
  };
  if (1 in locs) {
    entry.catchLoc = locs[1];
  }
  if (2 in locs) {
    entry.finallyLoc = locs[2];
    entry.afterLoc = locs[3];
  }
  this.tryEntries.push(entry);
}
function resetTryEntry(entry) {
  var record = entry.completion || {};
  record.type = "normal";
  delete record.arg;
  entry.completion = record;
}
function Context(tryLocsList) {
  // The root entry object (effectively a try statement without a catch
  // or a finally block) gives us a place to store values thrown from
  // locations where there is no enclosing try statement.
  this.tryEntries = [{
    tryLoc: "root"
  }];
  tryLocsList.forEach(pushTryEntry, this);
  this.reset(true);
}
function keys(object) {
  var keys = [];
  for (var key in object) {
    keys.push(key);
  }
  keys.reverse();

  // Rather than returning an object with a next method, we keep
  // things simple and return the next function itself.
  return function next() {
    while (keys.length) {
      var key = keys.pop();
      if (key in object) {
        next.value = key;
        next.done = false;
        return next;
      }
    }

    // To avoid creating an additional object, we just hang the .value
    // and .done properties off the next function object itself. This
    // also ensures that the minifier will not anonymize the function.
    next.done = true;
    return next;
  };
}
function values(iterable) {
  if (iterable) {
    var iteratorMethod = iterable[iteratorSymbol];
    if (iteratorMethod) {
      return iteratorMethod.call(iterable);
    }
    if (typeof iterable.next === "function") {
      return iterable;
    }
    if (!isNaN(iterable.length)) {
      var i = -1,
        next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }
          next.value = undefined$1;
          next.done = true;
          return next;
        };
      return next.next = next;
    }
  }

  // Return an iterator with no values.
  return {
    next: doneResult
  };
}
function doneResult() {
  return {
    value: undefined$1,
    done: true
  };
}
Context.prototype = {
  constructor: Context,
  reset: function reset(skipTempReset) {
    this.prev = 0;
    this.next = 0;
    // Resetting context._sent for legacy support of Babel's
    // function.sent implementation.
    this.sent = this._sent = undefined$1;
    this.done = false;
    this.delegate = null;
    this.method = "next";
    this.arg = undefined$1;
    this.tryEntries.forEach(resetTryEntry);
    if (!skipTempReset) {
      for (var name in this) {
        // Not sure about the optimal order of these conditions:
        if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
          this[name] = undefined$1;
        }
      }
    }
  },
  stop: function stop() {
    this.done = true;
    var rootEntry = this.tryEntries[0];
    var rootRecord = rootEntry.completion;
    if (rootRecord.type === "throw") {
      throw rootRecord.arg;
    }
    return this.rval;
  },
  dispatchException: function dispatchException(exception) {
    if (this.done) {
      throw exception;
    }
    var context = this;
    function handle(loc, caught) {
      record.type = "throw";
      record.arg = exception;
      context.next = loc;
      if (caught) {
        // If the dispatched exception was caught by a catch block,
        // then let that catch block handle the exception normally.
        context.method = "next";
        context.arg = undefined$1;
      }
      return !!caught;
    }
    for (var i = this.tryEntries.length - 1; i >= 0; --i) {
      var entry = this.tryEntries[i];
      var record = entry.completion;
      if (entry.tryLoc === "root") {
        // Exception thrown outside of any try block that could handle
        // it, so set the completion value of the entire function to
        // throw the exception.
        return handle("end");
      }
      if (entry.tryLoc <= this.prev) {
        var hasCatch = hasOwn.call(entry, "catchLoc");
        var hasFinally = hasOwn.call(entry, "finallyLoc");
        if (hasCatch && hasFinally) {
          if (this.prev < entry.catchLoc) {
            return handle(entry.catchLoc, true);
          } else if (this.prev < entry.finallyLoc) {
            return handle(entry.finallyLoc);
          }
        } else if (hasCatch) {
          if (this.prev < entry.catchLoc) {
            return handle(entry.catchLoc, true);
          }
        } else if (hasFinally) {
          if (this.prev < entry.finallyLoc) {
            return handle(entry.finallyLoc);
          }
        } else {
          throw new Error("try statement without catch or finally");
        }
      }
    }
  },
  abrupt: function abrupt(type, arg) {
    for (var i = this.tryEntries.length - 1; i >= 0; --i) {
      var entry = this.tryEntries[i];
      if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
        var finallyEntry = entry;
        break;
      }
    }
    if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
      // Ignore the finally entry if control is not jumping to a
      // location outside the try/catch block.
      finallyEntry = null;
    }
    var record = finallyEntry ? finallyEntry.completion : {};
    record.type = type;
    record.arg = arg;
    if (finallyEntry) {
      this.method = "next";
      this.next = finallyEntry.finallyLoc;
      return ContinueSentinel;
    }
    return this.complete(record);
  },
  complete: function complete(record, afterLoc) {
    if (record.type === "throw") {
      throw record.arg;
    }
    if (record.type === "break" || record.type === "continue") {
      this.next = record.arg;
    } else if (record.type === "return") {
      this.rval = this.arg = record.arg;
      this.method = "return";
      this.next = "end";
    } else if (record.type === "normal" && afterLoc) {
      this.next = afterLoc;
    }
    return ContinueSentinel;
  },
  finish: function finish(finallyLoc) {
    for (var i = this.tryEntries.length - 1; i >= 0; --i) {
      var entry = this.tryEntries[i];
      if (entry.finallyLoc === finallyLoc) {
        this.complete(entry.completion, entry.afterLoc);
        resetTryEntry(entry);
        return ContinueSentinel;
      }
    }
  },
  "catch": function _catch(tryLoc) {
    for (var i = this.tryEntries.length - 1; i >= 0; --i) {
      var entry = this.tryEntries[i];
      if (entry.tryLoc === tryLoc) {
        var record = entry.completion;
        if (record.type === "throw") {
          var thrown = record.arg;
          resetTryEntry(entry);
        }
        return thrown;
      }
    }

    // The context.catch method must only be called with a location
    // argument that corresponds to a known catch block.
    throw new Error("illegal catch attempt");
  },
  delegateYield: function delegateYield(iterable, resultName, nextLoc) {
    this.delegate = {
      iterator: values(iterable),
      resultName: resultName,
      nextLoc: nextLoc
    };
    if (this.method === "next") {
      // Deliberately forget the last sent value so that we don't
      // accidentally pass it on to the delegate.
      this.arg = undefined$1;
    }
    return ContinueSentinel;
  }
};

// Export a default namespace that plays well with Rollup
var _regeneratorRuntime = {
  wrap,
  isGeneratorFunction,
  AsyncIterator,
  mark,
  awrap,
  async: vega_embed_module_async,
  keys,
  values
};

var iterator;
var hasRequiredIterator;
function requireIterator() {
  if (hasRequiredIterator) return iterator;
  hasRequiredIterator = 1;
  iterator = function iterator(Yallist) {
    Yallist.prototype[Symbol.iterator] = /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
      var walker;
      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            walker = this.head;
          case 1:
            if (!walker) {
              _context.next = 7;
              break;
            }
            _context.next = 4;
            return walker.value;
          case 4:
            walker = walker.next;
            _context.next = 1;
            break;
          case 7:
          case "end":
            return _context.stop();
        }
      }, _callee, this);
    });
  };
  return iterator;
}

var yallist = Yallist$1;
Yallist$1.Node = Node;
Yallist$1.create = Yallist$1;
function Yallist$1(list) {
  var self = this;
  if (!(self instanceof Yallist$1)) {
    self = new Yallist$1();
  }
  self.tail = null;
  self.head = null;
  self.length = 0;
  if (list && typeof list.forEach === 'function') {
    list.forEach(function (item) {
      self.push(item);
    });
  } else if (arguments.length > 0) {
    for (var i = 0, l = arguments.length; i < l; i++) {
      self.push(arguments[i]);
    }
  }
  return self;
}
Yallist$1.prototype.removeNode = function (node) {
  if (node.list !== this) {
    throw new Error('removing node which does not belong to this list');
  }
  var next = node.next;
  var prev = node.prev;
  if (next) {
    next.prev = prev;
  }
  if (prev) {
    prev.next = next;
  }
  if (node === this.head) {
    this.head = next;
  }
  if (node === this.tail) {
    this.tail = prev;
  }
  node.list.length--;
  node.next = null;
  node.prev = null;
  node.list = null;
  return next;
};
Yallist$1.prototype.unshiftNode = function (node) {
  if (node === this.head) {
    return;
  }
  if (node.list) {
    node.list.removeNode(node);
  }
  var head = this.head;
  node.list = this;
  node.next = head;
  if (head) {
    head.prev = node;
  }
  this.head = node;
  if (!this.tail) {
    this.tail = node;
  }
  this.length++;
};
Yallist$1.prototype.pushNode = function (node) {
  if (node === this.tail) {
    return;
  }
  if (node.list) {
    node.list.removeNode(node);
  }
  var tail = this.tail;
  node.list = this;
  node.prev = tail;
  if (tail) {
    tail.next = node;
  }
  this.tail = node;
  if (!this.head) {
    this.head = node;
  }
  this.length++;
};
Yallist$1.prototype.push = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    push(this, arguments[i]);
  }
  return this.length;
};
Yallist$1.prototype.unshift = function () {
  for (var i = 0, l = arguments.length; i < l; i++) {
    unshift(this, arguments[i]);
  }
  return this.length;
};
Yallist$1.prototype.pop = function () {
  if (!this.tail) {
    return undefined;
  }
  var res = this.tail.value;
  this.tail = this.tail.prev;
  if (this.tail) {
    this.tail.next = null;
  } else {
    this.head = null;
  }
  this.length--;
  return res;
};
Yallist$1.prototype.shift = function () {
  if (!this.head) {
    return undefined;
  }
  var res = this.head.value;
  this.head = this.head.next;
  if (this.head) {
    this.head.prev = null;
  } else {
    this.tail = null;
  }
  this.length--;
  return res;
};
Yallist$1.prototype.forEach = function (fn, thisp) {
  thisp = thisp || this;
  for (var walker = this.head, i = 0; walker !== null; i++) {
    fn.call(thisp, walker.value, i, this);
    walker = walker.next;
  }
};
Yallist$1.prototype.forEachReverse = function (fn, thisp) {
  thisp = thisp || this;
  for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
    fn.call(thisp, walker.value, i, this);
    walker = walker.prev;
  }
};
Yallist$1.prototype.get = function (n) {
  for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.next;
  }
  if (i === n && walker !== null) {
    return walker.value;
  }
};
Yallist$1.prototype.getReverse = function (n) {
  for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
    // abort out of the list early if we hit a cycle
    walker = walker.prev;
  }
  if (i === n && walker !== null) {
    return walker.value;
  }
};
Yallist$1.prototype.map = function (fn, thisp) {
  thisp = thisp || this;
  var res = new Yallist$1();
  for (var walker = this.head; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this));
    walker = walker.next;
  }
  return res;
};
Yallist$1.prototype.mapReverse = function (fn, thisp) {
  thisp = thisp || this;
  var res = new Yallist$1();
  for (var walker = this.tail; walker !== null;) {
    res.push(fn.call(thisp, walker.value, this));
    walker = walker.prev;
  }
  return res;
};
Yallist$1.prototype.reduce = function (fn, initial) {
  var acc;
  var walker = this.head;
  if (arguments.length > 1) {
    acc = initial;
  } else if (this.head) {
    walker = this.head.next;
    acc = this.head.value;
  } else {
    throw new TypeError('Reduce of empty list with no initial value');
  }
  for (var i = 0; walker !== null; i++) {
    acc = fn(acc, walker.value, i);
    walker = walker.next;
  }
  return acc;
};
Yallist$1.prototype.reduceReverse = function (fn, initial) {
  var acc;
  var walker = this.tail;
  if (arguments.length > 1) {
    acc = initial;
  } else if (this.tail) {
    walker = this.tail.prev;
    acc = this.tail.value;
  } else {
    throw new TypeError('Reduce of empty list with no initial value');
  }
  for (var i = this.length - 1; walker !== null; i--) {
    acc = fn(acc, walker.value, i);
    walker = walker.prev;
  }
  return acc;
};
Yallist$1.prototype.toArray = function () {
  var arr = new Array(this.length);
  for (var i = 0, walker = this.head; walker !== null; i++) {
    arr[i] = walker.value;
    walker = walker.next;
  }
  return arr;
};
Yallist$1.prototype.toArrayReverse = function () {
  var arr = new Array(this.length);
  for (var i = 0, walker = this.tail; walker !== null; i++) {
    arr[i] = walker.value;
    walker = walker.prev;
  }
  return arr;
};
Yallist$1.prototype.slice = function (from, to) {
  to = to || this.length;
  if (to < 0) {
    to += this.length;
  }
  from = from || 0;
  if (from < 0) {
    from += this.length;
  }
  var ret = new Yallist$1();
  if (to < from || to < 0) {
    return ret;
  }
  if (from < 0) {
    from = 0;
  }
  if (to > this.length) {
    to = this.length;
  }
  for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
    walker = walker.next;
  }
  for (; walker !== null && i < to; i++, walker = walker.next) {
    ret.push(walker.value);
  }
  return ret;
};
Yallist$1.prototype.sliceReverse = function (from, to) {
  to = to || this.length;
  if (to < 0) {
    to += this.length;
  }
  from = from || 0;
  if (from < 0) {
    from += this.length;
  }
  var ret = new Yallist$1();
  if (to < from || to < 0) {
    return ret;
  }
  if (from < 0) {
    from = 0;
  }
  if (to > this.length) {
    to = this.length;
  }
  for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
    walker = walker.prev;
  }
  for (; walker !== null && i > from; i--, walker = walker.prev) {
    ret.push(walker.value);
  }
  return ret;
};
Yallist$1.prototype.splice = function (start, deleteCount) {
  if (start > this.length) {
    start = this.length - 1;
  }
  if (start < 0) {
    start = this.length + start;
  }
  for (var i = 0, walker = this.head; walker !== null && i < start; i++) {
    walker = walker.next;
  }
  var ret = [];
  for (var i = 0; walker && i < deleteCount; i++) {
    ret.push(walker.value);
    walker = this.removeNode(walker);
  }
  if (walker === null) {
    walker = this.tail;
  }
  if (walker !== this.head && walker !== this.tail) {
    walker = walker.prev;
  }
  for (var i = 0; i < (arguments.length <= 2 ? 0 : arguments.length - 2); i++) {
    walker = insert(this, walker, i + 2 < 2 || arguments.length <= i + 2 ? undefined : arguments[i + 2]);
  }
  return ret;
};
Yallist$1.prototype.reverse = function () {
  var head = this.head;
  var tail = this.tail;
  for (var walker = head; walker !== null; walker = walker.prev) {
    var p = walker.prev;
    walker.prev = walker.next;
    walker.next = p;
  }
  this.head = tail;
  this.tail = head;
  return this;
};
function insert(self, node, value) {
  var inserted = node === self.head ? new Node(value, null, node, self) : new Node(value, node, node.next, self);
  if (inserted.next === null) {
    self.tail = inserted;
  }
  if (inserted.prev === null) {
    self.head = inserted;
  }
  self.length++;
  return inserted;
}
function push(self, item) {
  self.tail = new Node(item, self.tail, null, self);
  if (!self.head) {
    self.head = self.tail;
  }
  self.length++;
}
function unshift(self, item) {
  self.head = new Node(item, null, self.head, self);
  if (!self.tail) {
    self.tail = self.head;
  }
  self.length++;
}
function Node(value, prev, next, list) {
  if (!(this instanceof Node)) {
    return new Node(value, prev, next, list);
  }
  this.list = list;
  this.value = value;
  if (prev) {
    prev.next = this;
    this.prev = prev;
  } else {
    this.prev = null;
  }
  if (next) {
    next.prev = this;
    this.next = next;
  } else {
    this.next = null;
  }
}
try {
  // add if support for Symbol.iterator is present
  requireIterator()(Yallist$1);
} catch (er) {}

// A linked list to keep track of recently-used-ness
var Yallist = yallist;
var MAX = Symbol('max');
var LENGTH = Symbol('length');
var LENGTH_CALCULATOR = Symbol('lengthCalculator');
var ALLOW_STALE = Symbol('allowStale');
var MAX_AGE = Symbol('maxAge');
var DISPOSE = Symbol('dispose');
var NO_DISPOSE_ON_SET = Symbol('noDisposeOnSet');
var LRU_LIST = Symbol('lruList');
var CACHE = Symbol('cache');
var UPDATE_AGE_ON_GET = Symbol('updateAgeOnGet');
var naiveLength = () => 1;

// lruList is a yallist where the head is the youngest
// item, and the tail is the oldest.  the list contains the Hit
// objects as the entries.
// Each Hit object has a reference to its Yallist.Node.  This
// never changes.
//
// cache is a Map (or PseudoMap) that matches the keys to
// the Yallist.Node object.
class LRUCache {
  constructor(options) {
    if (typeof options === 'number') options = {
      max: options
    };
    if (!options) options = {};
    if (options.max && (typeof options.max !== 'number' || options.max < 0)) throw new TypeError('max must be a non-negative number');
    // Kind of weird to have a default max of Infinity, but oh well.
    this[MAX] = options.max || Infinity;
    var lc = options.length || naiveLength;
    this[LENGTH_CALCULATOR] = typeof lc !== 'function' ? naiveLength : lc;
    this[ALLOW_STALE] = options.stale || false;
    if (options.maxAge && typeof options.maxAge !== 'number') throw new TypeError('maxAge must be a number');
    this[MAX_AGE] = options.maxAge || 0;
    this[DISPOSE] = options.dispose;
    this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false;
    this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false;
    this.reset();
  }

  // resize the cache when the max changes.
  set max(mL) {
    if (typeof mL !== 'number' || mL < 0) throw new TypeError('max must be a non-negative number');
    this[MAX] = mL || Infinity;
    trim(this);
  }
  get max() {
    return this[MAX];
  }
  set allowStale(allowStale) {
    this[ALLOW_STALE] = !!allowStale;
  }
  get allowStale() {
    return this[ALLOW_STALE];
  }
  set maxAge(mA) {
    if (typeof mA !== 'number') throw new TypeError('maxAge must be a non-negative number');
    this[MAX_AGE] = mA;
    trim(this);
  }
  get maxAge() {
    return this[MAX_AGE];
  }

  // resize the cache when the lengthCalculator changes.
  set lengthCalculator(lC) {
    if (typeof lC !== 'function') lC = naiveLength;
    if (lC !== this[LENGTH_CALCULATOR]) {
      this[LENGTH_CALCULATOR] = lC;
      this[LENGTH] = 0;
      this[LRU_LIST].forEach(hit => {
        hit.length = this[LENGTH_CALCULATOR](hit.value, hit.key);
        this[LENGTH] += hit.length;
      });
    }
    trim(this);
  }
  get lengthCalculator() {
    return this[LENGTH_CALCULATOR];
  }
  get length() {
    return this[LENGTH];
  }
  get itemCount() {
    return this[LRU_LIST].length;
  }
  rforEach(fn, thisp) {
    thisp = thisp || this;
    for (var walker = this[LRU_LIST].tail; walker !== null;) {
      var prev = walker.prev;
      forEachStep(this, fn, walker, thisp);
      walker = prev;
    }
  }
  forEach(fn, thisp) {
    thisp = thisp || this;
    for (var walker = this[LRU_LIST].head; walker !== null;) {
      var next = walker.next;
      forEachStep(this, fn, walker, thisp);
      walker = next;
    }
  }
  keys() {
    return this[LRU_LIST].toArray().map(k => k.key);
  }
  values() {
    return this[LRU_LIST].toArray().map(k => k.value);
  }
  reset() {
    if (this[DISPOSE] && this[LRU_LIST] && this[LRU_LIST].length) {
      this[LRU_LIST].forEach(hit => this[DISPOSE](hit.key, hit.value));
    }
    this[CACHE] = new Map(); // hash of items by key
    this[LRU_LIST] = new Yallist(); // list of items in order of use recency
    this[LENGTH] = 0; // length of items in the list
  }

  dump() {
    return this[LRU_LIST].map(hit => isStale(this, hit) ? false : {
      k: hit.key,
      v: hit.value,
      e: hit.now + (hit.maxAge || 0)
    }).toArray().filter(h => h);
  }
  dumpLru() {
    return this[LRU_LIST];
  }
  set(key, value, maxAge) {
    maxAge = maxAge || this[MAX_AGE];
    if (maxAge && typeof maxAge !== 'number') throw new TypeError('maxAge must be a number');
    var now = maxAge ? Date.now() : 0;
    var len = this[LENGTH_CALCULATOR](value, key);
    if (this[CACHE].has(key)) {
      if (len > this[MAX]) {
        del(this, this[CACHE].get(key));
        return false;
      }
      var node = this[CACHE].get(key);
      var item = node.value;

      // dispose of the old one before overwriting
      // split out into 2 ifs for better coverage tracking
      if (this[DISPOSE]) {
        if (!this[NO_DISPOSE_ON_SET]) this[DISPOSE](key, item.value);
      }
      item.now = now;
      item.maxAge = maxAge;
      item.value = value;
      this[LENGTH] += len - item.length;
      item.length = len;
      this.get(key);
      trim(this);
      return true;
    }
    var hit = new Entry(key, value, len, now, maxAge);

    // oversized objects fall out of cache automatically.
    if (hit.length > this[MAX]) {
      if (this[DISPOSE]) this[DISPOSE](key, value);
      return false;
    }
    this[LENGTH] += hit.length;
    this[LRU_LIST].unshift(hit);
    this[CACHE].set(key, this[LRU_LIST].head);
    trim(this);
    return true;
  }
  has(key) {
    if (!this[CACHE].has(key)) return false;
    var hit = this[CACHE].get(key).value;
    return !isStale(this, hit);
  }
  get(key) {
    return get(this, key, true);
  }
  peek(key) {
    return get(this, key, false);
  }
  pop() {
    var node = this[LRU_LIST].tail;
    if (!node) return null;
    del(this, node);
    return node.value;
  }
  del(key) {
    del(this, this[CACHE].get(key));
  }
  load(arr) {
    // reset the cache
    this.reset();
    var now = Date.now();
    // A previous serialized cache has the most recent items first
    for (var l = arr.length - 1; l >= 0; l--) {
      var hit = arr[l];
      var expiresAt = hit.e || 0;
      if (expiresAt === 0)
        // the item was created without expiration in a non aged cache
        this.set(hit.k, hit.v);else {
        var maxAge = expiresAt - now;
        // dont add already expired items
        if (maxAge > 0) {
          this.set(hit.k, hit.v, maxAge);
        }
      }
    }
  }
  prune() {
    this[CACHE].forEach((value, key) => get(this, key, false));
  }
}
var get = (self, key, doUse) => {
  var node = self[CACHE].get(key);
  if (node) {
    var hit = node.value;
    if (isStale(self, hit)) {
      del(self, node);
      if (!self[ALLOW_STALE]) return undefined;
    } else {
      if (doUse) {
        if (self[UPDATE_AGE_ON_GET]) node.value.now = Date.now();
        self[LRU_LIST].unshiftNode(node);
      }
    }
    return hit.value;
  }
};
var isStale = (self, hit) => {
  if (!hit || !hit.maxAge && !self[MAX_AGE]) return false;
  var diff = Date.now() - hit.now;
  return hit.maxAge ? diff > hit.maxAge : self[MAX_AGE] && diff > self[MAX_AGE];
};
var trim = self => {
  if (self[LENGTH] > self[MAX]) {
    for (var walker = self[LRU_LIST].tail; self[LENGTH] > self[MAX] && walker !== null;) {
      // We know that we're about to delete this one, and also
      // what the next least recently used key will be, so just
      // go ahead and set it now.
      var prev = walker.prev;
      del(self, walker);
      walker = prev;
    }
  }
};
var del = (self, node) => {
  if (node) {
    var hit = node.value;
    if (self[DISPOSE]) self[DISPOSE](hit.key, hit.value);
    self[LENGTH] -= hit.length;
    self[CACHE].delete(hit.key);
    self[LRU_LIST].removeNode(node);
  }
};
class Entry {
  constructor(key, value, length, now, maxAge) {
    this.key = key;
    this.value = value;
    this.length = length;
    this.now = now;
    this.maxAge = maxAge || 0;
  }
}
var forEachStep = (self, fn, node, thisp) => {
  var hit = node.value;
  if (isStale(self, hit)) {
    del(self, node);
    if (!self[ALLOW_STALE]) hit = undefined;
  }
  if (hit) fn.call(thisp, hit.value, hit.key, self);
};
var lruCache = LRUCache;

// parse out just the options we care about so we always get a consistent
// obj with keys in a consistent order.
var opts = ['includePrerelease', 'loose', 'rtl'];
var parseOptions$1 = options => !options ? {} : typeof options !== 'object' ? {
  loose: true
} : opts.filter(k => options[k]).reduce((o, k) => {
  o[k] = true;
  return o;
}, {});
var parseOptions_1 = parseOptions$1;

var reExports = {};
var re$1 = {
  get exports(){ return reExports; },
  set exports(v){ reExports = v; },
};

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
var SEMVER_SPEC_VERSION = '2.0.0';
var MAX_LENGTH$1 = 256;
var MAX_SAFE_INTEGER$1 = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */9007199254740991;

// Max safe segment length for coercion.
var MAX_SAFE_COMPONENT_LENGTH = 16;
var constants = {
  SEMVER_SPEC_VERSION,
  MAX_LENGTH: MAX_LENGTH$1,
  MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$1,
  MAX_SAFE_COMPONENT_LENGTH
};

var debug$1 = typeof process === 'object' && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? function () {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  return console.error('SEMVER', ...args);
} : () => {};
var debug_1 = debug$1;

(function (module, exports) {
  var MAX_SAFE_COMPONENT_LENGTH = constants.MAX_SAFE_COMPONENT_LENGTH;
  var debug = debug_1;
  exports = module.exports = {};

  // The actual regexps go on exports.re
  var re = exports.re = [];
  var src = exports.src = [];
  var t = exports.t = {};
  var R = 0;
  var createToken = (name, value, isGlobal) => {
    var index = R++;
    debug(name, index, value);
    t[name] = index;
    src[index] = value;
    re[index] = new RegExp(value, isGlobal ? 'g' : undefined);
  };

  // The following Regular Expressions can be used for tokenizing,
  // validating, and parsing SemVer version strings.

  // ## Numeric Identifier
  // A single `0`, or a non-zero digit followed by zero or more digits.

  createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
  createToken('NUMERICIDENTIFIERLOOSE', '[0-9]+');

  // ## Non-numeric Identifier
  // Zero or more digits, followed by a letter or hyphen, and then zero or
  // more letters, digits, or hyphens.

  createToken('NONNUMERICIDENTIFIER', '\\d*[a-zA-Z-][a-zA-Z0-9-]*');

  // ## Main Version
  // Three dot-separated numeric identifiers.

  createToken('MAINVERSION', "(".concat(src[t.NUMERICIDENTIFIER], ")\\.") + "(".concat(src[t.NUMERICIDENTIFIER], ")\\.") + "(".concat(src[t.NUMERICIDENTIFIER], ")"));
  createToken('MAINVERSIONLOOSE', "(".concat(src[t.NUMERICIDENTIFIERLOOSE], ")\\.") + "(".concat(src[t.NUMERICIDENTIFIERLOOSE], ")\\.") + "(".concat(src[t.NUMERICIDENTIFIERLOOSE], ")"));

  // ## Pre-release Version Identifier
  // A numeric identifier, or a non-numeric identifier.

  createToken('PRERELEASEIDENTIFIER', "(?:".concat(src[t.NUMERICIDENTIFIER], "|").concat(src[t.NONNUMERICIDENTIFIER], ")"));
  createToken('PRERELEASEIDENTIFIERLOOSE', "(?:".concat(src[t.NUMERICIDENTIFIERLOOSE], "|").concat(src[t.NONNUMERICIDENTIFIER], ")"));

  // ## Pre-release Version
  // Hyphen, followed by one or more dot-separated pre-release version
  // identifiers.

  createToken('PRERELEASE', "(?:-(".concat(src[t.PRERELEASEIDENTIFIER], "(?:\\.").concat(src[t.PRERELEASEIDENTIFIER], ")*))"));
  createToken('PRERELEASELOOSE', "(?:-?(".concat(src[t.PRERELEASEIDENTIFIERLOOSE], "(?:\\.").concat(src[t.PRERELEASEIDENTIFIERLOOSE], ")*))"));

  // ## Build Metadata Identifier
  // Any combination of digits, letters, or hyphens.

  createToken('BUILDIDENTIFIER', '[0-9A-Za-z-]+');

  // ## Build Metadata
  // Plus sign, followed by one or more period-separated build metadata
  // identifiers.

  createToken('BUILD', "(?:\\+(".concat(src[t.BUILDIDENTIFIER], "(?:\\.").concat(src[t.BUILDIDENTIFIER], ")*))"));

  // ## Full Version String
  // A main version, followed optionally by a pre-release version and
  // build metadata.

  // Note that the only major, minor, patch, and pre-release sections of
  // the version string are capturing groups.  The build metadata is not a
  // capturing group, because it should not ever be used in version
  // comparison.

  createToken('FULLPLAIN', "v?".concat(src[t.MAINVERSION]).concat(src[t.PRERELEASE], "?").concat(src[t.BUILD], "?"));
  createToken('FULL', "^".concat(src[t.FULLPLAIN], "$"));

  // like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
  // also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
  // common in the npm registry.
  createToken('LOOSEPLAIN', "[v=\\s]*".concat(src[t.MAINVERSIONLOOSE]).concat(src[t.PRERELEASELOOSE], "?").concat(src[t.BUILD], "?"));
  createToken('LOOSE', "^".concat(src[t.LOOSEPLAIN], "$"));
  createToken('GTLT', '((?:<|>)?=?)');

  // Something like "2.*" or "1.2.x".
  // Note that "x.x" is a valid xRange identifer, meaning "any version"
  // Only the first item is strictly required.
  createToken('XRANGEIDENTIFIERLOOSE', "".concat(src[t.NUMERICIDENTIFIERLOOSE], "|x|X|\\*"));
  createToken('XRANGEIDENTIFIER', "".concat(src[t.NUMERICIDENTIFIER], "|x|X|\\*"));
  createToken('XRANGEPLAIN', "[v=\\s]*(".concat(src[t.XRANGEIDENTIFIER], ")") + "(?:\\.(".concat(src[t.XRANGEIDENTIFIER], ")") + "(?:\\.(".concat(src[t.XRANGEIDENTIFIER], ")") + "(?:".concat(src[t.PRERELEASE], ")?").concat(src[t.BUILD], "?") + ")?)?");
  createToken('XRANGEPLAINLOOSE', "[v=\\s]*(".concat(src[t.XRANGEIDENTIFIERLOOSE], ")") + "(?:\\.(".concat(src[t.XRANGEIDENTIFIERLOOSE], ")") + "(?:\\.(".concat(src[t.XRANGEIDENTIFIERLOOSE], ")") + "(?:".concat(src[t.PRERELEASELOOSE], ")?").concat(src[t.BUILD], "?") + ")?)?");
  createToken('XRANGE', "^".concat(src[t.GTLT], "\\s*").concat(src[t.XRANGEPLAIN], "$"));
  createToken('XRANGELOOSE', "^".concat(src[t.GTLT], "\\s*").concat(src[t.XRANGEPLAINLOOSE], "$"));

  // Coercion.
  // Extract anything that could conceivably be a part of a valid semver
  createToken('COERCE', "".concat('(^|[^\\d])' + '(\\d{1,').concat(MAX_SAFE_COMPONENT_LENGTH, "})") + "(?:\\.(\\d{1,".concat(MAX_SAFE_COMPONENT_LENGTH, "}))?") + "(?:\\.(\\d{1,".concat(MAX_SAFE_COMPONENT_LENGTH, "}))?") + "(?:$|[^\\d])");
  createToken('COERCERTL', src[t.COERCE], true);

  // Tilde ranges.
  // Meaning is "reasonably at or greater than"
  createToken('LONETILDE', '(?:~>?)');
  createToken('TILDETRIM', "(\\s*)".concat(src[t.LONETILDE], "\\s+"), true);
  exports.tildeTrimReplace = '$1~';
  createToken('TILDE', "^".concat(src[t.LONETILDE]).concat(src[t.XRANGEPLAIN], "$"));
  createToken('TILDELOOSE', "^".concat(src[t.LONETILDE]).concat(src[t.XRANGEPLAINLOOSE], "$"));

  // Caret ranges.
  // Meaning is "at least and backwards compatible with"
  createToken('LONECARET', '(?:\\^)');
  createToken('CARETTRIM', "(\\s*)".concat(src[t.LONECARET], "\\s+"), true);
  exports.caretTrimReplace = '$1^';
  createToken('CARET', "^".concat(src[t.LONECARET]).concat(src[t.XRANGEPLAIN], "$"));
  createToken('CARETLOOSE', "^".concat(src[t.LONECARET]).concat(src[t.XRANGEPLAINLOOSE], "$"));

  // A simple gt/lt/eq thing, or just "" to indicate "any version"
  createToken('COMPARATORLOOSE', "^".concat(src[t.GTLT], "\\s*(").concat(src[t.LOOSEPLAIN], ")$|^$"));
  createToken('COMPARATOR', "^".concat(src[t.GTLT], "\\s*(").concat(src[t.FULLPLAIN], ")$|^$"));

  // An expression to strip any whitespace between the gtlt and the thing
  // it modifies, so that `> 1.2.3` ==> `>1.2.3`
  createToken('COMPARATORTRIM', "(\\s*)".concat(src[t.GTLT], "\\s*(").concat(src[t.LOOSEPLAIN], "|").concat(src[t.XRANGEPLAIN], ")"), true);
  exports.comparatorTrimReplace = '$1$2$3';

  // Something like `1.2.3 - 1.2.4`
  // Note that these all use the loose form, because they'll be
  // checked against either the strict or loose comparator form
  // later.
  createToken('HYPHENRANGE', "^\\s*(".concat(src[t.XRANGEPLAIN], ")") + "\\s+-\\s+" + "(".concat(src[t.XRANGEPLAIN], ")") + "\\s*$");
  createToken('HYPHENRANGELOOSE', "^\\s*(".concat(src[t.XRANGEPLAINLOOSE], ")") + "\\s+-\\s+" + "(".concat(src[t.XRANGEPLAINLOOSE], ")") + "\\s*$");

  // Star ranges basically just allow anything at all.
  createToken('STAR', '(<|>)?=?\\s*\\*');
  // >=0.0.0 is like a star
  createToken('GTE0', '^\\s*>=\\s*0\\.0\\.0\\s*$');
  createToken('GTE0PRE', '^\\s*>=\\s*0\\.0\\.0-0\\s*$');
})(re$1, reExports);

var numeric = /^[0-9]+$/;
var compareIdentifiers$1 = (a, b) => {
  var anum = numeric.test(a);
  var bnum = numeric.test(b);
  if (anum && bnum) {
    a = +a;
    b = +b;
  }
  return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
};
var rcompareIdentifiers = (a, b) => compareIdentifiers$1(b, a);
var identifiers = {
  compareIdentifiers: compareIdentifiers$1,
  rcompareIdentifiers
};

var debug = debug_1;
var MAX_LENGTH = constants.MAX_LENGTH,
  MAX_SAFE_INTEGER = constants.MAX_SAFE_INTEGER;
var re = reExports.re,
  t = reExports.t;
var parseOptions = parseOptions_1;
var compareIdentifiers = identifiers.compareIdentifiers;
let SemVer$1 = class SemVer {
  constructor(version, options) {
    options = parseOptions(options);
    if (version instanceof SemVer) {
      if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
        return version;
      } else {
        version = version.version;
      }
    } else if (typeof version !== 'string') {
      throw new TypeError("Invalid Version: ".concat(version));
    }
    if (version.length > MAX_LENGTH) {
      throw new TypeError("version is longer than ".concat(MAX_LENGTH, " characters"));
    }
    debug('SemVer', version, options);
    this.options = options;
    this.loose = !!options.loose;
    // this isn't actually relevant for versions, but keep it so that we
    // don't run into trouble passing this.options around.
    this.includePrerelease = !!options.includePrerelease;
    var m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
    if (!m) {
      throw new TypeError("Invalid Version: ".concat(version));
    }
    this.raw = version;

    // these are actually numbers
    this.major = +m[1];
    this.minor = +m[2];
    this.patch = +m[3];
    if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
      throw new TypeError('Invalid major version');
    }
    if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
      throw new TypeError('Invalid minor version');
    }
    if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
      throw new TypeError('Invalid patch version');
    }

    // numberify any prerelease numeric ids
    if (!m[4]) {
      this.prerelease = [];
    } else {
      this.prerelease = m[4].split('.').map(id => {
        if (/^[0-9]+$/.test(id)) {
          var num = +id;
          if (num >= 0 && num < MAX_SAFE_INTEGER) {
            return num;
          }
        }
        return id;
      });
    }
    this.build = m[5] ? m[5].split('.') : [];
    this.format();
  }
  format() {
    this.version = "".concat(this.major, ".").concat(this.minor, ".").concat(this.patch);
    if (this.prerelease.length) {
      this.version += "-".concat(this.prerelease.join('.'));
    }
    return this.version;
  }
  toString() {
    return this.version;
  }
  compare(other) {
    debug('SemVer.compare', this.version, this.options, other);
    if (!(other instanceof SemVer)) {
      if (typeof other === 'string' && other === this.version) {
        return 0;
      }
      other = new SemVer(other, this.options);
    }
    if (other.version === this.version) {
      return 0;
    }
    return this.compareMain(other) || this.comparePre(other);
  }
  compareMain(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }
    return compareIdentifiers(this.major, other.major) || compareIdentifiers(this.minor, other.minor) || compareIdentifiers(this.patch, other.patch);
  }
  comparePre(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    // NOT having a prerelease is > having one
    if (this.prerelease.length && !other.prerelease.length) {
      return -1;
    } else if (!this.prerelease.length && other.prerelease.length) {
      return 1;
    } else if (!this.prerelease.length && !other.prerelease.length) {
      return 0;
    }
    var i = 0;
    do {
      var a = this.prerelease[i];
      var b = other.prerelease[i];
      debug('prerelease compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0;
      } else if (b === undefined) {
        return 1;
      } else if (a === undefined) {
        return -1;
      } else if (a === b) {
        continue;
      } else {
        return compareIdentifiers(a, b);
      }
    } while (++i);
  }
  compareBuild(other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }
    var i = 0;
    do {
      var a = this.build[i];
      var b = other.build[i];
      debug('prerelease compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0;
      } else if (b === undefined) {
        return 1;
      } else if (a === undefined) {
        return -1;
      } else if (a === b) {
        continue;
      } else {
        return compareIdentifiers(a, b);
      }
    } while (++i);
  }

  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc(release, identifier) {
    switch (release) {
      case 'premajor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor = 0;
        this.major++;
        this.inc('pre', identifier);
        break;
      case 'preminor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor++;
        this.inc('pre', identifier);
        break;
      case 'prepatch':
        // If this is already a prerelease, it will bump to the next version
        // drop any prereleases that might already exist, since they are not
        // relevant at this point.
        this.prerelease.length = 0;
        this.inc('patch', identifier);
        this.inc('pre', identifier);
        break;
      // If the input is a non-prerelease version, this acts the same as
      // prepatch.
      case 'prerelease':
        if (this.prerelease.length === 0) {
          this.inc('patch', identifier);
        }
        this.inc('pre', identifier);
        break;
      case 'major':
        // If this is a pre-major version, bump up to the same major version.
        // Otherwise increment major.
        // 1.0.0-5 bumps to 1.0.0
        // 1.1.0 bumps to 2.0.0
        if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
          this.major++;
        }
        this.minor = 0;
        this.patch = 0;
        this.prerelease = [];
        break;
      case 'minor':
        // If this is a pre-minor version, bump up to the same minor version.
        // Otherwise increment minor.
        // 1.2.0-5 bumps to 1.2.0
        // 1.2.1 bumps to 1.3.0
        if (this.patch !== 0 || this.prerelease.length === 0) {
          this.minor++;
        }
        this.patch = 0;
        this.prerelease = [];
        break;
      case 'patch':
        // If this is not a pre-release version, it will increment the patch.
        // If it is a pre-release it will bump up to the same patch version.
        // 1.2.0-5 patches to 1.2.0
        // 1.2.0 patches to 1.2.1
        if (this.prerelease.length === 0) {
          this.patch++;
        }
        this.prerelease = [];
        break;
      // This probably shouldn't be used publicly.
      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
      case 'pre':
        if (this.prerelease.length === 0) {
          this.prerelease = [0];
        } else {
          var i = this.prerelease.length;
          while (--i >= 0) {
            if (typeof this.prerelease[i] === 'number') {
              this.prerelease[i]++;
              i = -2;
            }
          }
          if (i === -1) {
            // didn't increment anything
            this.prerelease.push(0);
          }
        }
        if (identifier) {
          // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
          // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
          if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
            if (isNaN(this.prerelease[1])) {
              this.prerelease = [identifier, 0];
            }
          } else {
            this.prerelease = [identifier, 0];
          }
        }
        break;
      default:
        throw new Error("invalid increment argument: ".concat(release));
    }
    this.format();
    this.raw = this.version;
    return this;
  }
};
var semver = SemVer$1;

var SemVer = semver;
var compare$6 = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
var compare_1 = compare$6;

var compare$5 = compare_1;
var eq$1 = (a, b, loose) => compare$5(a, b, loose) === 0;
var eq_1 = eq$1;

var compare$4 = compare_1;
var neq$1 = (a, b, loose) => compare$4(a, b, loose) !== 0;
var neq_1 = neq$1;

var compare$3 = compare_1;
var gt$1 = (a, b, loose) => compare$3(a, b, loose) > 0;
var gt_1 = gt$1;

var compare$2 = compare_1;
var gte$1 = (a, b, loose) => compare$2(a, b, loose) >= 0;
var gte_1 = gte$1;

var compare$1 = compare_1;
var lt$1 = (a, b, loose) => compare$1(a, b, loose) < 0;
var lt_1 = lt$1;

var vega_embed_module_compare = compare_1;
var lte$1 = (a, b, loose) => vega_embed_module_compare(a, b, loose) <= 0;
var lte_1 = lte$1;

var eq = eq_1;
var neq = neq_1;
var gt = gt_1;
var gte = gte_1;
var lt = lt_1;
var lte = lte_1;
var cmp = (a, op, b, loose) => {
  switch (op) {
    case '===':
      if (typeof a === 'object') {
        a = a.version;
      }
      if (typeof b === 'object') {
        b = b.version;
      }
      return a === b;
    case '!==':
      if (typeof a === 'object') {
        a = a.version;
      }
      if (typeof b === 'object') {
        b = b.version;
      }
      return a !== b;
    case '':
    case '=':
    case '==':
      return eq(a, b, loose);
    case '!=':
      return neq(a, b, loose);
    case '>':
      return gt(a, b, loose);
    case '>=':
      return gte(a, b, loose);
    case '<':
      return lt(a, b, loose);
    case '<=':
      return lte(a, b, loose);
    default:
      throw new TypeError("Invalid operator: ".concat(op));
  }
};
var cmp_1 = cmp;

var comparator;
var hasRequiredComparator;
function requireComparator() {
  if (hasRequiredComparator) return comparator;
  hasRequiredComparator = 1;
  var ANY = Symbol('SemVer ANY');
  // hoisted class for cyclic dependency
  class Comparator {
    static get ANY() {
      return ANY;
    }
    constructor(comp, options) {
      options = parseOptions(options);
      if (comp instanceof Comparator) {
        if (comp.loose === !!options.loose) {
          return comp;
        } else {
          comp = comp.value;
        }
      }
      debug('comparator', comp, options);
      this.options = options;
      this.loose = !!options.loose;
      this.parse(comp);
      if (this.semver === ANY) {
        this.value = '';
      } else {
        this.value = this.operator + this.semver.version;
      }
      debug('comp', this);
    }
    parse(comp) {
      var r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
      var m = comp.match(r);
      if (!m) {
        throw new TypeError("Invalid comparator: ".concat(comp));
      }
      this.operator = m[1] !== undefined ? m[1] : '';
      if (this.operator === '=') {
        this.operator = '';
      }

      // if it literally is just '>' or '' then allow anything.
      if (!m[2]) {
        this.semver = ANY;
      } else {
        this.semver = new SemVer(m[2], this.options.loose);
      }
    }
    toString() {
      return this.value;
    }
    test(version) {
      debug('Comparator.test', version, this.options.loose);
      if (this.semver === ANY || version === ANY) {
        return true;
      }
      if (typeof version === 'string') {
        try {
          version = new SemVer(version, this.options);
        } catch (er) {
          return false;
        }
      }
      return cmp(version, this.operator, this.semver, this.options);
    }
    intersects(comp, options) {
      if (!(comp instanceof Comparator)) {
        throw new TypeError('a Comparator is required');
      }
      if (!options || typeof options !== 'object') {
        options = {
          loose: !!options,
          includePrerelease: false
        };
      }
      if (this.operator === '') {
        if (this.value === '') {
          return true;
        }
        return new Range(comp.value, options).test(this.value);
      } else if (comp.operator === '') {
        if (comp.value === '') {
          return true;
        }
        return new Range(this.value, options).test(comp.semver);
      }
      var sameDirectionIncreasing = (this.operator === '>=' || this.operator === '>') && (comp.operator === '>=' || comp.operator === '>');
      var sameDirectionDecreasing = (this.operator === '<=' || this.operator === '<') && (comp.operator === '<=' || comp.operator === '<');
      var sameSemVer = this.semver.version === comp.semver.version;
      var differentDirectionsInclusive = (this.operator === '>=' || this.operator === '<=') && (comp.operator === '>=' || comp.operator === '<=');
      var oppositeDirectionsLessThan = cmp(this.semver, '<', comp.semver, options) && (this.operator === '>=' || this.operator === '>') && (comp.operator === '<=' || comp.operator === '<');
      var oppositeDirectionsGreaterThan = cmp(this.semver, '>', comp.semver, options) && (this.operator === '<=' || this.operator === '<') && (comp.operator === '>=' || comp.operator === '>');
      return sameDirectionIncreasing || sameDirectionDecreasing || sameSemVer && differentDirectionsInclusive || oppositeDirectionsLessThan || oppositeDirectionsGreaterThan;
    }
  }
  comparator = Comparator;
  var parseOptions = parseOptions_1;
  var re = reExports.re,
    t = reExports.t;
  var cmp = cmp_1;
  var debug = debug_1;
  var SemVer = semver;
  var Range = requireRange();
  return comparator;
}

function _createForOfIteratorHelper$1(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$1(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray$1(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$1(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen); }
function _arrayLikeToArray$1(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
var range;
var hasRequiredRange;
function requireRange() {
  if (hasRequiredRange) return range;
  hasRequiredRange = 1;
  // hoisted class for cyclic dependency
  class Range {
    constructor(range, options) {
      options = parseOptions(options);
      if (range instanceof Range) {
        if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
          return range;
        } else {
          return new Range(range.raw, options);
        }
      }
      if (range instanceof Comparator) {
        // just put it in the set and return
        this.raw = range.value;
        this.set = [[range]];
        this.format();
        return this;
      }
      this.options = options;
      this.loose = !!options.loose;
      this.includePrerelease = !!options.includePrerelease;

      // First, split based on boolean or ||
      this.raw = range;
      this.set = range.split('||')
      // map the range to a 2d array of comparators
      .map(r => this.parseRange(r.trim()))
      // throw out any comparator lists that are empty
      // this generally means that it was not a valid range, which is allowed
      // in loose mode, but will still throw if the WHOLE range is invalid.
      .filter(c => c.length);
      if (!this.set.length) {
        throw new TypeError("Invalid SemVer Range: ".concat(range));
      }

      // if we have any that are not the null set, throw out null sets.
      if (this.set.length > 1) {
        // keep the first one, in case they're all null sets
        var first = this.set[0];
        this.set = this.set.filter(c => !isNullSet(c[0]));
        if (this.set.length === 0) {
          this.set = [first];
        } else if (this.set.length > 1) {
          // if we have any that are *, then the range is just *
          var _iterator = _createForOfIteratorHelper$1(this.set),
            _step;
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var c = _step.value;
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }
      }
      this.format();
    }
    format() {
      this.range = this.set.map(comps => {
        return comps.join(' ').trim();
      }).join('||').trim();
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(range) {
      range = range.trim();

      // memoize range parsing for performance.
      // this is a very hot path, and fully deterministic.
      var memoOpts = Object.keys(this.options).join(',');
      var memoKey = "parseRange:".concat(memoOpts, ":").concat(range);
      var cached = cache.get(memoKey);
      if (cached) {
        return cached;
      }
      var loose = this.options.loose;
      // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
      var hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
      range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
      debug('hyphen replace', range);
      // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
      range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
      debug('comparator trim', range);

      // `~ 1.2.3` => `~1.2.3`
      range = range.replace(re[t.TILDETRIM], tildeTrimReplace);

      // `^ 1.2.3` => `^1.2.3`
      range = range.replace(re[t.CARETTRIM], caretTrimReplace);

      // normalize spaces
      range = range.split(/\s+/).join(' ');

      // At this point, the range is completely trimmed and
      // ready to be split into comparators.

      var rangeList = range.split(' ').map(comp => parseComparator(comp, this.options)).join(' ').split(/\s+/)
      // >=0.0.0 is equivalent to *
      .map(comp => replaceGTE0(comp, this.options));
      if (loose) {
        // in loose mode, throw out any that are not valid comparators
        rangeList = rangeList.filter(comp => {
          debug('loose invalid filter', comp, this.options);
          return !!comp.match(re[t.COMPARATORLOOSE]);
        });
      }
      debug('range list', rangeList);

      // if any comparators are the null set, then replace with JUST null set
      // if more than one comparator, remove any * comparators
      // also, don't include the same comparator more than once
      var rangeMap = new Map();
      var comparators = rangeList.map(comp => new Comparator(comp, this.options));
      var _iterator2 = _createForOfIteratorHelper$1(comparators),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var comp = _step2.value;
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      if (rangeMap.size > 1 && rangeMap.has('')) {
        rangeMap.delete('');
      }
      var result = [...rangeMap.values()];
      cache.set(memoKey, result);
      return result;
    }
    intersects(range, options) {
      if (!(range instanceof Range)) {
        throw new TypeError('a Range is required');
      }
      return this.set.some(thisComparators => {
        return isSatisfiable(thisComparators, options) && range.set.some(rangeComparators => {
          return isSatisfiable(rangeComparators, options) && thisComparators.every(thisComparator => {
            return rangeComparators.every(rangeComparator => {
              return thisComparator.intersects(rangeComparator, options);
            });
          });
        });
      });
    }

    // if ANY of the sets match ALL of its comparators, then pass
    test(version) {
      if (!version) {
        return false;
      }
      if (typeof version === 'string') {
        try {
          version = new SemVer(version, this.options);
        } catch (er) {
          return false;
        }
      }
      for (var i = 0; i < this.set.length; i++) {
        if (testSet(this.set[i], version, this.options)) {
          return true;
        }
      }
      return false;
    }
  }
  range = Range;
  var LRU = lruCache;
  var cache = new LRU({
    max: 1000
  });
  var parseOptions = parseOptions_1;
  var Comparator = requireComparator();
  var debug = debug_1;
  var SemVer = semver;
  var re = reExports.re,
    t = reExports.t,
    comparatorTrimReplace = reExports.comparatorTrimReplace,
    tildeTrimReplace = reExports.tildeTrimReplace,
    caretTrimReplace = reExports.caretTrimReplace;
  var isNullSet = c => c.value === '<0.0.0-0';
  var isAny = c => c.value === '';

  // take a set of comparators and determine whether there
  // exists a version which can satisfy it
  var isSatisfiable = (comparators, options) => {
    var result = true;
    var remainingComparators = comparators.slice();
    var testComparator = remainingComparators.pop();
    while (result && remainingComparators.length) {
      result = remainingComparators.every(otherComparator => {
        return testComparator.intersects(otherComparator, options);
      });
      testComparator = remainingComparators.pop();
    }
    return result;
  };

  // comprised of xranges, tildes, stars, and gtlt's at this point.
  // already replaced the hyphen ranges
  // turn into a set of JUST comparators.
  var parseComparator = (comp, options) => {
    debug('comp', comp, options);
    comp = replaceCarets(comp, options);
    debug('caret', comp);
    comp = replaceTildes(comp, options);
    debug('tildes', comp);
    comp = replaceXRanges(comp, options);
    debug('xrange', comp);
    comp = replaceStars(comp, options);
    debug('stars', comp);
    return comp;
  };
  var isX = id => !id || id.toLowerCase() === 'x' || id === '*';

  // ~, ~> --> * (any, kinda silly)
  // ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
  // ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
  // ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
  // ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
  // ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
  // ~0.0.1 --> >=0.0.1 <0.1.0-0
  var replaceTildes = (comp, options) => comp.trim().split(/\s+/).map(c => {
    return replaceTilde(c, options);
  }).join(' ');
  var replaceTilde = (comp, options) => {
    var r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
    return comp.replace(r, (_, M, m, p, pr) => {
      debug('tilde', comp, _, M, m, p, pr);
      var ret;
      if (isX(M)) {
        ret = '';
      } else if (isX(m)) {
        ret = ">=".concat(M, ".0.0 <").concat(+M + 1, ".0.0-0");
      } else if (isX(p)) {
        // ~1.2 == >=1.2.0 <1.3.0-0
        ret = ">=".concat(M, ".").concat(m, ".0 <").concat(M, ".").concat(+m + 1, ".0-0");
      } else if (pr) {
        debug('replaceTilde pr', pr);
        ret = ">=".concat(M, ".").concat(m, ".").concat(p, "-").concat(pr, " <").concat(M, ".").concat(+m + 1, ".0-0");
      } else {
        // ~1.2.3 == >=1.2.3 <1.3.0-0
        ret = ">=".concat(M, ".").concat(m, ".").concat(p, " <").concat(M, ".").concat(+m + 1, ".0-0");
      }
      debug('tilde return', ret);
      return ret;
    });
  };

  // ^ --> * (any, kinda silly)
  // ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
  // ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
  // ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
  // ^1.2.3 --> >=1.2.3 <2.0.0-0
  // ^1.2.0 --> >=1.2.0 <2.0.0-0
  // ^0.0.1 --> >=0.0.1 <0.0.2-0
  // ^0.1.0 --> >=0.1.0 <0.2.0-0
  var replaceCarets = (comp, options) => comp.trim().split(/\s+/).map(c => {
    return replaceCaret(c, options);
  }).join(' ');
  var replaceCaret = (comp, options) => {
    debug('caret', comp, options);
    var r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
    var z = options.includePrerelease ? '-0' : '';
    return comp.replace(r, (_, M, m, p, pr) => {
      debug('caret', comp, _, M, m, p, pr);
      var ret;
      if (isX(M)) {
        ret = '';
      } else if (isX(m)) {
        ret = ">=".concat(M, ".0.0").concat(z, " <").concat(+M + 1, ".0.0-0");
      } else if (isX(p)) {
        if (M === '0') {
          ret = ">=".concat(M, ".").concat(m, ".0").concat(z, " <").concat(M, ".").concat(+m + 1, ".0-0");
        } else {
          ret = ">=".concat(M, ".").concat(m, ".0").concat(z, " <").concat(+M + 1, ".0.0-0");
        }
      } else if (pr) {
        debug('replaceCaret pr', pr);
        if (M === '0') {
          if (m === '0') {
            ret = ">=".concat(M, ".").concat(m, ".").concat(p, "-").concat(pr, " <").concat(M, ".").concat(m, ".").concat(+p + 1, "-0");
          } else {
            ret = ">=".concat(M, ".").concat(m, ".").concat(p, "-").concat(pr, " <").concat(M, ".").concat(+m + 1, ".0-0");
          }
        } else {
          ret = ">=".concat(M, ".").concat(m, ".").concat(p, "-").concat(pr, " <").concat(+M + 1, ".0.0-0");
        }
      } else {
        debug('no pr');
        if (M === '0') {
          if (m === '0') {
            ret = ">=".concat(M, ".").concat(m, ".").concat(p).concat(z, " <").concat(M, ".").concat(m, ".").concat(+p + 1, "-0");
          } else {
            ret = ">=".concat(M, ".").concat(m, ".").concat(p).concat(z, " <").concat(M, ".").concat(+m + 1, ".0-0");
          }
        } else {
          ret = ">=".concat(M, ".").concat(m, ".").concat(p, " <").concat(+M + 1, ".0.0-0");
        }
      }
      debug('caret return', ret);
      return ret;
    });
  };
  var replaceXRanges = (comp, options) => {
    debug('replaceXRanges', comp, options);
    return comp.split(/\s+/).map(c => {
      return replaceXRange(c, options);
    }).join(' ');
  };
  var replaceXRange = (comp, options) => {
    comp = comp.trim();
    var r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
    return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
      debug('xRange', comp, ret, gtlt, M, m, p, pr);
      var xM = isX(M);
      var xm = xM || isX(m);
      var xp = xm || isX(p);
      var anyX = xp;
      if (gtlt === '=' && anyX) {
        gtlt = '';
      }

      // if we're including prereleases in the match, then we need
      // to fix this to -0, the lowest possible prerelease value
      pr = options.includePrerelease ? '-0' : '';
      if (xM) {
        if (gtlt === '>' || gtlt === '<') {
          // nothing is allowed
          ret = '<0.0.0-0';
        } else {
          // nothing is forbidden
          ret = '*';
        }
      } else if (gtlt && anyX) {
        // we know patch is an x, because we have any x at all.
        // replace X with 0
        if (xm) {
          m = 0;
        }
        p = 0;
        if (gtlt === '>') {
          // >1 => >=2.0.0
          // >1.2 => >=1.3.0
          gtlt = '>=';
          if (xm) {
            M = +M + 1;
            m = 0;
            p = 0;
          } else {
            m = +m + 1;
            p = 0;
          }
        } else if (gtlt === '<=') {
          // <=0.7.x is actually <0.8.0, since any 0.7.x should
          // pass.  Similarly, <=7.x is actually <8.0.0, etc.
          gtlt = '<';
          if (xm) {
            M = +M + 1;
          } else {
            m = +m + 1;
          }
        }
        if (gtlt === '<') {
          pr = '-0';
        }
        ret = "".concat(gtlt + M, ".").concat(m, ".").concat(p).concat(pr);
      } else if (xm) {
        ret = ">=".concat(M, ".0.0").concat(pr, " <").concat(+M + 1, ".0.0-0");
      } else if (xp) {
        ret = ">=".concat(M, ".").concat(m, ".0").concat(pr, " <").concat(M, ".").concat(+m + 1, ".0-0");
      }
      debug('xRange return', ret);
      return ret;
    });
  };

  // Because * is AND-ed with everything else in the comparator,
  // and '' means "any version", just remove the *s entirely.
  var replaceStars = (comp, options) => {
    debug('replaceStars', comp, options);
    // Looseness is ignored here.  star is always as loose as it gets!
    return comp.trim().replace(re[t.STAR], '');
  };
  var replaceGTE0 = (comp, options) => {
    debug('replaceGTE0', comp, options);
    return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], '');
  };

  // This function is passed to string.replace(re[t.HYPHENRANGE])
  // M, m, patch, prerelease, build
  // 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
  // 1.2.3 - 3.4 => >=1.2.0 <3.5.0-0 Any 3.4.x will do
  // 1.2 - 3.4 => >=1.2.0 <3.5.0-0
  var hyphenReplace = incPr => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr, tb) => {
    if (isX(fM)) {
      from = '';
    } else if (isX(fm)) {
      from = ">=".concat(fM, ".0.0").concat(incPr ? '-0' : '');
    } else if (isX(fp)) {
      from = ">=".concat(fM, ".").concat(fm, ".0").concat(incPr ? '-0' : '');
    } else if (fpr) {
      from = ">=".concat(from);
    } else {
      from = ">=".concat(from).concat(incPr ? '-0' : '');
    }
    if (isX(tM)) {
      to = '';
    } else if (isX(tm)) {
      to = "<".concat(+tM + 1, ".0.0-0");
    } else if (isX(tp)) {
      to = "<".concat(tM, ".").concat(+tm + 1, ".0-0");
    } else if (tpr) {
      to = "<=".concat(tM, ".").concat(tm, ".").concat(tp, "-").concat(tpr);
    } else if (incPr) {
      to = "<".concat(tM, ".").concat(tm, ".").concat(+tp + 1, "-0");
    } else {
      to = "<=".concat(to);
    }
    return "".concat(from, " ").concat(to).trim();
  };
  var testSet = (set, version, options) => {
    for (var i = 0; i < set.length; i++) {
      if (!set[i].test(version)) {
        return false;
      }
    }
    if (version.prerelease.length && !options.includePrerelease) {
      // Find the set of versions that are allowed to have prereleases
      // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
      // That should allow `1.2.3-pr.2` to pass.
      // However, `1.2.4-alpha.notready` should NOT be allowed,
      // even though it's within the range set by the comparators.
      for (var _i = 0; _i < set.length; _i++) {
        debug(set[_i].semver);
        if (set[_i].semver === Comparator.ANY) {
          continue;
        }
        if (set[_i].semver.prerelease.length > 0) {
          var allowed = set[_i].semver;
          if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
            return true;
          }
        }
      }

      // Version has a -pre, but it's not one of the ones we like.
      return false;
    }
    return true;
  };
  return range;
}

var Range = requireRange();
var satisfies = (version, range, options) => {
  try {
    range = new Range(range, options);
  } catch (er) {
    return false;
  }
  return range.test(version);
};
var satisfies_1 = satisfies;

/**
 * Open editor url in a new window, and pass a message.
 */
function post (window, url, data) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  var editor = window.open(url);
  var wait = 10000;
  var step = 250;
  var _URL = new URL(url),
    origin = _URL.origin;
  // eslint-disable-next-line no-bitwise
  var count = ~~(wait / step);
  function listen(evt) {
    if (evt.source === editor) {
      count = 0;
      window.removeEventListener('message', listen, false);
    }
  }
  window.addEventListener('message', listen, false);

  // send message
  // periodically resend until ack received or timeout
  function send() {
    if (count <= 0) {
      return;
    }
    editor.postMessage(data, origin);
    setTimeout(send, step);
    count -= 1;
  }
  setTimeout(send, step);
}

// generated with build-style.sh
var embedStyle = ".vega-embed {\n  position: relative;\n  display: inline-block;\n  box-sizing: border-box;\n}\n.vega-embed.has-actions {\n  padding-right: 38px;\n}\n.vega-embed details:not([open]) > :not(summary) {\n  display: none !important;\n}\n.vega-embed summary {\n  list-style: none;\n  position: absolute;\n  top: 0;\n  right: 0;\n  padding: 6px;\n  z-index: 1000;\n  background: white;\n  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);\n  color: #1b1e23;\n  border: 1px solid #aaa;\n  border-radius: 999px;\n  opacity: 0.2;\n  transition: opacity 0.4s ease-in;\n  cursor: pointer;\n  line-height: 0px;\n}\n.vega-embed summary::-webkit-details-marker {\n  display: none;\n}\n.vega-embed summary:active {\n  box-shadow: #aaa 0px 0px 0px 1px inset;\n}\n.vega-embed summary svg {\n  width: 14px;\n  height: 14px;\n}\n.vega-embed details[open] summary {\n  opacity: 0.7;\n}\n.vega-embed:hover summary, .vega-embed:focus-within summary {\n  opacity: 1 !important;\n  transition: opacity 0.2s ease;\n}\n.vega-embed .vega-actions {\n  position: absolute;\n  z-index: 1001;\n  top: 35px;\n  right: -9px;\n  display: flex;\n  flex-direction: column;\n  padding-bottom: 8px;\n  padding-top: 8px;\n  border-radius: 4px;\n  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.2);\n  border: 1px solid #d9d9d9;\n  background: white;\n  animation-duration: 0.15s;\n  animation-name: scale-in;\n  animation-timing-function: cubic-bezier(0.2, 0, 0.13, 1.5);\n  text-align: left;\n}\n.vega-embed .vega-actions a {\n  padding: 8px 16px;\n  font-family: sans-serif;\n  font-size: 14px;\n  font-weight: 600;\n  white-space: nowrap;\n  color: #434a56;\n  text-decoration: none;\n}\n.vega-embed .vega-actions a:hover, .vega-embed .vega-actions a:focus {\n  background-color: #f7f7f9;\n  color: black;\n}\n.vega-embed .vega-actions::before, .vega-embed .vega-actions::after {\n  content: \"\";\n  display: inline-block;\n  position: absolute;\n}\n.vega-embed .vega-actions::before {\n  left: auto;\n  right: 14px;\n  top: -16px;\n  border: 8px solid rgba(0, 0, 0, 0);\n  border-bottom-color: #d9d9d9;\n}\n.vega-embed .vega-actions::after {\n  left: auto;\n  right: 15px;\n  top: -14px;\n  border: 7px solid rgba(0, 0, 0, 0);\n  border-bottom-color: #fff;\n}\n.vega-embed .chart-wrapper.fit-x {\n  width: 100%;\n}\n.vega-embed .chart-wrapper.fit-y {\n  height: 100%;\n}\n\n.vega-embed-wrapper {\n  max-width: 100%;\n  overflow: auto;\n  padding-right: 14px;\n}\n\n@keyframes scale-in {\n  from {\n    opacity: 0;\n    transform: scale(0.6);\n  }\n  to {\n    opacity: 1;\n    transform: scale(1);\n  }\n}\n";

// polyfill for IE
if (!String.prototype.startsWith) {
  // eslint-disable-next-line no-extend-native,func-names
  String.prototype.startsWith = function (search, pos) {
    return this.substr(!pos || pos < 0 ? 0 : +pos, search.length) === search;
  };
}
function mergeDeep(dest) {
  for (var _len = arguments.length, src = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    src[_key - 1] = arguments[_key];
  }
  for (var _i = 0, _src = src; _i < _src.length; _i++) {
    var s = _src[_i];
    deepMerge_(dest, s);
  }
  return dest;
}
function deepMerge_(dest, src) {
  for (var _i2 = 0, _Object$keys = Object.keys(src); _i2 < _Object$keys.length; _i2++) {
    var property = _Object$keys[_i2];
    (0,vega_module_js_.writeConfig)(dest, property, src[property], true);
  }
}

var vega_embed_module_name = "vega-embed";
var vega_embed_module_version$1 = "6.21.3";
var vega_embed_module_description = "Publish Vega visualizations as embedded web components.";
var vega_embed_module_keywords = ["vega", "data", "visualization", "component", "embed"];
var vega_embed_module_repository = {
  type: "git",
  url: "http://github.com/vega/vega-embed.git"
};
var vega_embed_module_author = {
  name: "UW Interactive Data Lab",
  url: "http://idl.cs.washington.edu"
};
var vega_embed_module_contributors = [{
  name: "Dominik Moritz",
  url: "https://www.domoritz.de"
}];
var vega_embed_module_bugs = {
  url: "https://github.com/vega/vega-embed/issues"
};
var vega_embed_module_homepage = "https://github.com/vega/vega-embed#readme";
var vega_embed_module_license = "BSD-3-Clause";
var vega_embed_module_main = "build/vega-embed.js";
var vega_embed_module_module = "build/vega-embed.module.js";
var vega_embed_module_unpkg = "build/vega-embed.min.js";
var vega_embed_module_jsdelivr = "build/vega-embed.min.js";
var vega_embed_module_types = "build/vega-embed.module.d.ts";
var vega_embed_module_files = ["src", "build", "build-es5", "patches"];
var vega_embed_module_devDependencies = {
  "@babel/plugin-transform-runtime": "^7.19.6",
  "@release-it/conventional-changelog": "^5.1.1",
  "@rollup/plugin-commonjs": "24.0.1",
  "@rollup/plugin-json": "^6.0.0",
  "@rollup/plugin-node-resolve": "^15.0.1",
  "@rollup/plugin-terser": "^0.4.0",
  "@types/semver": "^7.3.13",
  "browser-sync": "^2.27.11",
  concurrently: "^7.6.0",
  "del-cli": "^5.0.0",
  "jest-canvas-mock": "^2.4.0",
  "jest-environment-jsdom": "^29.4.3",
  "patch-package": "^6.5.1",
  "postinstall-postinstall": "^2.1.0",
  "release-it": "^15.6.0",
  "rollup-plugin-bundle-size": "^1.0.3",
  "rollup-plugin-ts": "^3.2.0",
  rollup: "3.15.0",
  sass: "^1.58.1",
  typescript: "^4.9.5",
  "vega-lite-dev-config": "^0.21.0",
  "vega-lite": "^5.2.0",
  vega: "^5.22.1"
};
var vega_embed_module_peerDependencies = {
  vega: "^5.21.0",
  "vega-lite": "*"
};
var vega_embed_module_dependencies = {
  "fast-json-patch": "^3.1.1",
  "json-stringify-pretty-compact": "^3.0.0",
  semver: "^7.3.8",
  tslib: "^2.5.0",
  "vega-interpreter": "^1.0.4",
  "vega-schema-url-parser": "^2.2.0",
  "vega-themes": "^2.12.1",
  "vega-tooltip": "^0.30.1"
};
var bundledDependencies = ["yallist"];
var vega_embed_module_scripts = {
  prebuild: "yarn clean && yarn build:style",
  build: "rollup -c",
  "build:style": "./build-style.sh",
  clean: "del-cli build build-es5 src/style.ts",
  prepublishOnly: "yarn clean && yarn build",
  preversion: "yarn lint && yarn test",
  serve: "browser-sync start --directory -s -f build *.html",
  start: "yarn build && concurrently --kill-others -n Server,Rollup 'yarn serve' 'rollup -c -w'",
  pretest: "yarn build:style",
  test: "beemo jest --stdio stream",
  "test:inspect": "node --inspect-brk ./node_modules/.bin/jest --runInBand",
  prepare: "beemo create-config && npx patch-package",
  prettierbase: "beemo prettier '*.{css,scss,html}'",
  eslintbase: "beemo eslint .",
  format: "yarn eslintbase --fix && yarn prettierbase --write",
  lint: "yarn eslintbase && yarn prettierbase --check",
  release: "release-it"
};
var vega_embed_module_pkg = {
  name: vega_embed_module_name,
  version: vega_embed_module_version$1,
  description: vega_embed_module_description,
  keywords: vega_embed_module_keywords,
  repository: vega_embed_module_repository,
  author: vega_embed_module_author,
  contributors: vega_embed_module_contributors,
  bugs: vega_embed_module_bugs,
  homepage: vega_embed_module_homepage,
  license: vega_embed_module_license,
  main: vega_embed_module_main,
  module: vega_embed_module_module,
  unpkg: vega_embed_module_unpkg,
  jsdelivr: vega_embed_module_jsdelivr,
  types: vega_embed_module_types,
  files: vega_embed_module_files,
  devDependencies: vega_embed_module_devDependencies,
  peerDependencies: vega_embed_module_peerDependencies,
  dependencies: vega_embed_module_dependencies,
  bundledDependencies: bundledDependencies,
  scripts: vega_embed_module_scripts
};

var _w$vl;
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
var vega_embed_module_version = vega_embed_module_pkg.version;
var vega = vega_module_js_;
var _vegaLite = index_js_;
var w = typeof window !== 'undefined' ? window : undefined;
if (_vegaLite === undefined && w !== null && w !== void 0 && (_w$vl = w.vl) !== null && _w$vl !== void 0 && _w$vl.compile) {
  _vegaLite = w.vl;
}
var DEFAULT_ACTIONS = {
  export: {
    svg: true,
    png: true
  },
  source: true,
  compiled: true,
  editor: true
};
var I18N = {
  CLICK_TO_VIEW_ACTIONS: 'Click to view actions',
  COMPILED_ACTION: 'View Compiled Vega',
  EDITOR_ACTION: 'Open in Vega Editor',
  PNG_ACTION: 'Save as PNG',
  SOURCE_ACTION: 'View Source',
  SVG_ACTION: 'Save as SVG'
};
var NAMES = {
  vega: 'Vega',
  'vega-lite': 'Vega-Lite'
};
var VERSION = {
  vega: vega.version,
  'vega-lite': _vegaLite ? _vegaLite.version : 'not available'
};
var PREPROCESSOR = {
  vega: vgSpec => vgSpec,
  'vega-lite': (vlSpec, config) => _vegaLite.compile(vlSpec, {
    config: config
  }).spec
};
var SVG_CIRCLES = "\n<svg viewBox=\"0 0 16 16\" fill=\"currentColor\" stroke=\"none\" stroke-width=\"1\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n  <circle r=\"2\" cy=\"8\" cx=\"2\"></circle>\n  <circle r=\"2\" cy=\"8\" cx=\"8\"></circle>\n  <circle r=\"2\" cy=\"8\" cx=\"14\"></circle>\n</svg>";
var CHART_WRAPPER_CLASS = 'chart-wrapper';
function isTooltipHandler(h) {
  return typeof h === 'function';
}
function viewSource(source, sourceHeader, sourceFooter, mode) {
  var header = "<html><head>".concat(sourceHeader, "</head><body><pre><code class=\"json\">");
  var footer = "</code></pre>".concat(sourceFooter, "</body></html>");
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  var win = window.open('');
  win.document.write(header + source + footer);
  win.document.title = "".concat(NAMES[mode], " JSON Source");
}

/**
 * Try to guess the type of spec.
 *
 * @param spec Vega or Vega-Lite spec.
 */
function guessMode(spec, providedMode) {
  // Decide mode
  if (spec.$schema) {
    var parsed = parser_module(spec.$schema);
    if (providedMode && providedMode !== parsed.library) {
      var _NAMES$providedMode;
      console.warn("The given visualization spec is written in ".concat(NAMES[parsed.library], ", but mode argument sets ").concat((_NAMES$providedMode = NAMES[providedMode]) !== null && _NAMES$providedMode !== void 0 ? _NAMES$providedMode : providedMode, "."));
    }
    var mode = parsed.library;
    if (!satisfies_1(VERSION[mode], "^".concat(parsed.version.slice(1)))) {
      console.warn("The input spec uses ".concat(NAMES[mode], " ").concat(parsed.version, ", but the current version of ").concat(NAMES[mode], " is v").concat(VERSION[mode], "."));
    }
    return mode;
  }

  // try to guess from the provided spec
  if ('mark' in spec || 'encoding' in spec || 'layer' in spec || 'hconcat' in spec || 'vconcat' in spec || 'facet' in spec || 'repeat' in spec) {
    return 'vega-lite';
  }
  if ('marks' in spec || 'signals' in spec || 'scales' in spec || 'axes' in spec) {
    return 'vega';
  }
  return providedMode !== null && providedMode !== void 0 ? providedMode : 'vega';
}
function isLoader(o) {
  return !!(o && 'load' in o);
}
function createLoader(opts) {
  return isLoader(opts) ? opts : vega.loader(opts);
}
function embedOptionsFromUsermeta(parsedSpec) {
  var _embedOptions, _parsedSpec$usermeta;
  var opts = (_embedOptions = (_parsedSpec$usermeta = parsedSpec.usermeta) === null || _parsedSpec$usermeta === void 0 ? void 0 : _parsedSpec$usermeta.embedOptions) !== null && _embedOptions !== void 0 ? _embedOptions : {};
  if ((0,vega_module_js_.isString)(opts.defaultStyle)) {
    // we don't allow styles set via usermeta since it would allow injection of logic (we set the style via innerHTML)
    opts.defaultStyle = false;
  }
  return opts;
}

/**
 * Embed a Vega visualization component in a web page. This function returns a promise.
 *
 * @param el        DOM element in which to place component (DOM node or CSS selector).
 * @param spec      String : A URL string from which to load the Vega specification.
 *                  Object : The Vega/Vega-Lite specification as a parsed JSON object.
 * @param opts       A JavaScript object containing options for embedding.
 */
function vega_embed_module_embed(_x, _x2) {
  return _embed2.apply(this, arguments);
}
function _embed2() {
  _embed2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(el, spec) {
    var _parsedOpts$config, _usermetaOpts$config;
    var opts,
      parsedSpec,
      loader,
      loadedEmbedOptions,
      usermetaLoader,
      _opts$loader,
      usermetaOpts,
      parsedOpts,
      mergedOpts,
      _args = arguments;
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          opts = _args.length > 2 && _args[2] !== undefined ? _args[2] : {};
          if (!(0,vega_module_js_.isString)(spec)) {
            _context.next = 10;
            break;
          }
          loader = createLoader(opts.loader);
          _context.t0 = JSON;
          _context.next = 6;
          return loader.load(spec);
        case 6:
          _context.t1 = _context.sent;
          parsedSpec = _context.t0.parse.call(_context.t0, _context.t1);
          _context.next = 11;
          break;
        case 10:
          parsedSpec = spec;
        case 11:
          loadedEmbedOptions = embedOptionsFromUsermeta(parsedSpec);
          usermetaLoader = loadedEmbedOptions.loader; // either create the loader for the first time or create a new loader if the spec has new loader options
          if (!loader || usermetaLoader) {
            loader = createLoader((_opts$loader = opts.loader) !== null && _opts$loader !== void 0 ? _opts$loader : usermetaLoader);
          }
          _context.next = 16;
          return loadOpts(loadedEmbedOptions, loader);
        case 16:
          usermetaOpts = _context.sent;
          _context.next = 19;
          return loadOpts(opts, loader);
        case 19:
          parsedOpts = _context.sent;
          mergedOpts = _objectSpread(_objectSpread({}, mergeDeep(parsedOpts, usermetaOpts)), {}, {
            config: (0,vega_module_js_.mergeConfig)((_parsedOpts$config = parsedOpts.config) !== null && _parsedOpts$config !== void 0 ? _parsedOpts$config : {}, (_usermetaOpts$config = usermetaOpts.config) !== null && _usermetaOpts$config !== void 0 ? _usermetaOpts$config : {})
          });
          _context.next = 23;
          return _embed(el, parsedSpec, mergedOpts, loader);
        case 23:
          return _context.abrupt("return", _context.sent);
        case 24:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _embed2.apply(this, arguments);
}
function loadOpts(_x3, _x4) {
  return _loadOpts.apply(this, arguments);
}
function _loadOpts() {
  _loadOpts = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(opt, loader) {
    var _opt$config;
    var config, patch;
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          if (!(0,vega_module_js_.isString)(opt.config)) {
            _context2.next = 8;
            break;
          }
          _context2.t1 = JSON;
          _context2.next = 4;
          return loader.load(opt.config);
        case 4:
          _context2.t2 = _context2.sent;
          _context2.t0 = _context2.t1.parse.call(_context2.t1, _context2.t2);
          _context2.next = 9;
          break;
        case 8:
          _context2.t0 = (_opt$config = opt.config) !== null && _opt$config !== void 0 ? _opt$config : {};
        case 9:
          config = _context2.t0;
          if (!(0,vega_module_js_.isString)(opt.patch)) {
            _context2.next = 18;
            break;
          }
          _context2.t4 = JSON;
          _context2.next = 14;
          return loader.load(opt.patch);
        case 14:
          _context2.t5 = _context2.sent;
          _context2.t3 = _context2.t4.parse.call(_context2.t4, _context2.t5);
          _context2.next = 19;
          break;
        case 18:
          _context2.t3 = opt.patch;
        case 19:
          patch = _context2.t3;
          return _context2.abrupt("return", _objectSpread(_objectSpread(_objectSpread({}, opt), patch ? {
            patch
          } : {}), config ? {
            config
          } : {}));
        case 21:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _loadOpts.apply(this, arguments);
}
function getRoot(el) {
  var _document$head;
  var possibleRoot = el.getRootNode ? el.getRootNode() : document;
  return possibleRoot instanceof ShadowRoot ? {
    root: possibleRoot,
    rootContainer: possibleRoot
  } : {
    root: document,
    rootContainer: (_document$head = document.head) !== null && _document$head !== void 0 ? _document$head : document.body
  };
}
function _embed(_x5, _x6) {
  return _embed3.apply(this, arguments);
}
function _embed3() {
  _embed3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(el, spec) {
    var _opts$config, _opts$actions, _opts$renderer, _opts$logLevel, _opts$downloadFileNam, _ref, _expressionInterprete;
    var opts,
      loader,
      config,
      actions,
      i18n,
      renderer,
      logLevel,
      downloadFileName,
      element,
      ID,
      _getRoot,
      root,
      rootContainer,
      style,
      mode,
      vgSpec,
      parsed,
      container,
      chartWrapper,
      patch,
      name,
      expressionFunction,
      ast,
      runtime,
      view,
      handler,
      hover,
      _ref2,
      hoverSet,
      updateSet,
      documentClickHandler,
      wrapper,
      details,
      summary,
      ctrl,
      _iterator,
      _step,
      _loop,
      viewSourceLink,
      compileLink,
      _opts$editorUrl,
      editorUrl,
      editorLink,
      finalize,
      _args5 = arguments;
    return _regeneratorRuntime.wrap(function _callee4$(_context5) {
      while (1) switch (_context5.prev = _context5.next) {
        case 0:
          finalize = function _finalize() {
            if (documentClickHandler) {
              document.removeEventListener('click', documentClickHandler);
            }
            view.finalize();
          };
          opts = _args5.length > 2 && _args5[2] !== undefined ? _args5[2] : {};
          loader = _args5.length > 3 ? _args5[3] : undefined;
          config = opts.theme ? (0,vega_module_js_.mergeConfig)(vega_themes_module_namespaceObject[opts.theme], (_opts$config = opts.config) !== null && _opts$config !== void 0 ? _opts$config : {}) : opts.config;
          actions = (0,vega_module_js_.isBoolean)(opts.actions) ? opts.actions : mergeDeep({}, DEFAULT_ACTIONS, (_opts$actions = opts.actions) !== null && _opts$actions !== void 0 ? _opts$actions : {});
          i18n = _objectSpread(_objectSpread({}, I18N), opts.i18n);
          renderer = (_opts$renderer = opts.renderer) !== null && _opts$renderer !== void 0 ? _opts$renderer : 'canvas';
          logLevel = (_opts$logLevel = opts.logLevel) !== null && _opts$logLevel !== void 0 ? _opts$logLevel : vega.Warn;
          downloadFileName = (_opts$downloadFileNam = opts.downloadFileName) !== null && _opts$downloadFileNam !== void 0 ? _opts$downloadFileNam : 'visualization';
          element = typeof el === 'string' ? document.querySelector(el) : el;
          if (element) {
            _context5.next = 12;
            break;
          }
          throw new Error("".concat(el, " does not exist"));
        case 12:
          if (opts.defaultStyle !== false) {
            ID = 'vega-embed-style';
            _getRoot = getRoot(element), root = _getRoot.root, rootContainer = _getRoot.rootContainer;
            if (!root.getElementById(ID)) {
              style = document.createElement('style');
              style.id = ID;
              style.innerHTML = opts.defaultStyle === undefined || opts.defaultStyle === true ? (embedStyle ).toString() : opts.defaultStyle;
              rootContainer.appendChild(style);
            }
          }
          mode = guessMode(spec, opts.mode);
          vgSpec = PREPROCESSOR[mode](spec, config);
          if (mode === 'vega-lite') {
            if (vgSpec.$schema) {
              parsed = parser_module(vgSpec.$schema);
              if (!satisfies_1(VERSION.vega, "^".concat(parsed.version.slice(1)))) {
                console.warn("The compiled spec uses Vega ".concat(parsed.version, ", but current version is v").concat(VERSION.vega, "."));
              }
            }
          }
          element.classList.add('vega-embed');
          if (actions) {
            element.classList.add('has-actions');
          }
          element.innerHTML = ''; // clear container
          container = element;
          if (actions) {
            chartWrapper = document.createElement('div');
            chartWrapper.classList.add(CHART_WRAPPER_CLASS);
            element.appendChild(chartWrapper);
            container = chartWrapper;
          }
          patch = opts.patch;
          if (patch) {
            vgSpec = patch instanceof Function ? patch(vgSpec) : applyPatch(vgSpec, patch, true, false).newDocument;
          }

          // Set locale. Note that this is a global setting.
          if (opts.formatLocale) {
            vega.formatLocale(opts.formatLocale);
          }
          if (opts.timeFormatLocale) {
            vega.timeFormatLocale(opts.timeFormatLocale);
          }

          // Set custom expression functions
          if (opts.expressionFunctions) {
            for (name in opts.expressionFunctions) {
              expressionFunction = opts.expressionFunctions[name];
              if ('fn' in expressionFunction) {
                vega.expressionFunction(name, expressionFunction.fn, expressionFunction['visitor']);
              } else if (expressionFunction instanceof Function) {
                vega.expressionFunction(name, expressionFunction);
              }
            }
          }
          ast = opts.ast; // Do not apply the config to Vega when we have already applied it to Vega-Lite.
          // This call may throw an Error if parsing fails.
          runtime = vega.parse(vgSpec, mode === 'vega-lite' ? {} : config, {
            ast
          });
          view = new (opts.viewClass || vega.View)(runtime, _objectSpread({
            loader,
            logLevel,
            renderer
          }, ast ? {
            expr: (_ref = (_expressionInterprete = vega.expressionInterpreter) !== null && _expressionInterprete !== void 0 ? _expressionInterprete : opts.expr) !== null && _ref !== void 0 ? _ref : expression
          } : {}));
          view.addSignalListener('autosize', (_, autosize) => {
            var type = autosize.type;
            if (type == 'fit-x') {
              container.classList.add('fit-x');
              container.classList.remove('fit-y');
            } else if (type == 'fit-y') {
              container.classList.remove('fit-x');
              container.classList.add('fit-y');
            } else if (type == 'fit') {
              container.classList.add('fit-x', 'fit-y');
            } else {
              container.classList.remove('fit-x', 'fit-y');
            }
          });
          if (opts.tooltip !== false) {
            handler = isTooltipHandler(opts.tooltip) ? opts.tooltip :
            // user provided boolean true or tooltip options
            new Handler(opts.tooltip === true ? {} : opts.tooltip).call;
            view.tooltip(handler);
          }
          hover = opts.hover;
          if (hover === undefined) {
            hover = mode === 'vega';
          }
          if (hover) {
            _ref2 = typeof hover === 'boolean' ? {} : hover, hoverSet = _ref2.hoverSet, updateSet = _ref2.updateSet;
            view.hover(hoverSet, updateSet);
          }
          if (opts) {
            if (opts.width != null) {
              view.width(opts.width);
            }
            if (opts.height != null) {
              view.height(opts.height);
            }
            if (opts.padding != null) {
              view.padding(opts.padding);
            }
          }
          _context5.next = 37;
          return view.initialize(container, opts.bind).runAsync();
        case 37:
          if (!(actions !== false)) {
            _context5.next = 63;
            break;
          }
          wrapper = element;
          if (opts.defaultStyle !== false) {
            details = document.createElement('details');
            details.title = i18n.CLICK_TO_VIEW_ACTIONS;
            element.append(details);
            wrapper = details;
            summary = document.createElement('summary');
            summary.innerHTML = SVG_CIRCLES;
            details.append(summary);
            documentClickHandler = ev => {
              if (!details.contains(ev.target)) {
                details.removeAttribute('open');
              }
            };
            document.addEventListener('click', documentClickHandler);
          }
          ctrl = document.createElement('div');
          wrapper.append(ctrl);
          ctrl.classList.add('vega-actions');

          // add 'Export' action
          if (!(actions === true || actions.export !== false)) {
            _context5.next = 60;
            break;
          }
          _iterator = _createForOfIteratorHelper(['svg', 'png']);
          _context5.prev = 45;
          _loop = /*#__PURE__*/_regeneratorRuntime.mark(function _loop() {
            var ext, i18nExportAction, exportLink, scaleFactor;
            return _regeneratorRuntime.wrap(function _loop$(_context4) {
              while (1) switch (_context4.prev = _context4.next) {
                case 0:
                  ext = _step.value;
                  if (actions === true || actions.export === true || actions.export[ext]) {
                    i18nExportAction = i18n["".concat(ext.toUpperCase(), "_ACTION")];
                    exportLink = document.createElement('a');
                    scaleFactor = (0,vega_module_js_.isObject)(opts.scaleFactor) ? opts.scaleFactor[ext] : opts.scaleFactor;
                    exportLink.text = i18nExportAction;
                    exportLink.href = '#';
                    exportLink.target = '_blank';
                    exportLink.download = "".concat(downloadFileName, ".").concat(ext);
                    // add link on mousedown so that it's correct when the click happens
                    exportLink.addEventListener('mousedown', /*#__PURE__*/function () {
                      var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(e) {
                        var url;
                        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
                          while (1) switch (_context3.prev = _context3.next) {
                            case 0:
                              e.preventDefault();
                              _context3.next = 3;
                              return view.toImageURL(ext, scaleFactor);
                            case 3:
                              url = _context3.sent;
                              this.href = url;
                            case 5:
                            case "end":
                              return _context3.stop();
                          }
                        }, _callee3, this);
                      }));
                      return function (_x7) {
                        return _ref3.apply(this, arguments);
                      };
                    }());
                    ctrl.append(exportLink);
                  }
                case 2:
                case "end":
                  return _context4.stop();
              }
            }, _loop);
          });
          _iterator.s();
        case 48:
          if ((_step = _iterator.n()).done) {
            _context5.next = 52;
            break;
          }
          return _context5.delegateYield(_loop(), "t0", 50);
        case 50:
          _context5.next = 48;
          break;
        case 52:
          _context5.next = 57;
          break;
        case 54:
          _context5.prev = 54;
          _context5.t1 = _context5["catch"](45);
          _iterator.e(_context5.t1);
        case 57:
          _context5.prev = 57;
          _iterator.f();
          return _context5.finish(57);
        case 60:
          // add 'View Source' action
          if (actions === true || actions.source !== false) {
            viewSourceLink = document.createElement('a');
            viewSourceLink.text = i18n.SOURCE_ACTION;
            viewSourceLink.href = '#';
            viewSourceLink.addEventListener('click', function (e) {
              var _opts$sourceHeader, _opts$sourceFooter;
              viewSource(json_stringify_pretty_compact_default()(spec), (_opts$sourceHeader = opts.sourceHeader) !== null && _opts$sourceHeader !== void 0 ? _opts$sourceHeader : '', (_opts$sourceFooter = opts.sourceFooter) !== null && _opts$sourceFooter !== void 0 ? _opts$sourceFooter : '', mode);
              e.preventDefault();
            });
            ctrl.append(viewSourceLink);
          }

          // add 'View Compiled' action
          if (mode === 'vega-lite' && (actions === true || actions.compiled !== false)) {
            compileLink = document.createElement('a');
            compileLink.text = i18n.COMPILED_ACTION;
            compileLink.href = '#';
            compileLink.addEventListener('click', function (e) {
              var _opts$sourceHeader2, _opts$sourceFooter2;
              viewSource(json_stringify_pretty_compact_default()(vgSpec), (_opts$sourceHeader2 = opts.sourceHeader) !== null && _opts$sourceHeader2 !== void 0 ? _opts$sourceHeader2 : '', (_opts$sourceFooter2 = opts.sourceFooter) !== null && _opts$sourceFooter2 !== void 0 ? _opts$sourceFooter2 : '', 'vega');
              e.preventDefault();
            });
            ctrl.append(compileLink);
          }

          // add 'Open in Vega Editor' action
          if (actions === true || actions.editor !== false) {
            editorUrl = (_opts$editorUrl = opts.editorUrl) !== null && _opts$editorUrl !== void 0 ? _opts$editorUrl : 'https://vega.github.io/editor/';
            editorLink = document.createElement('a');
            editorLink.text = i18n.EDITOR_ACTION;
            editorLink.href = '#';
            editorLink.addEventListener('click', function (e) {
              post(window, editorUrl, {
                config: config,
                mode,
                renderer,
                spec: json_stringify_pretty_compact_default()(spec)
              });
              e.preventDefault();
            });
            ctrl.append(editorLink);
          }
        case 63:
          return _context5.abrupt("return", {
            view,
            spec,
            vgSpec,
            finalize,
            embedOptions: opts
          });
        case 64:
        case "end":
          return _context5.stop();
      }
    }, _callee4, null, [[45, 54, 57, 60]]);
  }));
  return _embed3.apply(this, arguments);
}


//# sourceMappingURL=vega-embed.module.js.map


/***/ }),

/***/ 26372:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $D: () => (/* binding */ Error$1),
/* harmony export */   $G: () => (/* binding */ quarter),
/* harmony export */   $P: () => (/* binding */ isDate),
/* harmony export */   AU: () => (/* binding */ writeConfig),
/* harmony export */   B: () => (/* binding */ inherits),
/* harmony export */   B2: () => (/* binding */ zoomSymlog),
/* harmony export */   BS: () => (/* binding */ clampRange),
/* harmony export */   Cc: () => (/* binding */ lerp),
/* harmony export */   D_: () => (/* binding */ identity),
/* harmony export */   EV: () => (/* binding */ lruCache),
/* harmony export */   Eb: () => (/* binding */ key),
/* harmony export */   Et: () => (/* binding */ isNumber),
/* harmony export */   G4: () => (/* binding */ toBoolean),
/* harmony export */   Gv: () => (/* binding */ isObject),
/* harmony export */   KH: () => (/* binding */ panLog),
/* harmony export */   Kg: () => (/* binding */ isString),
/* harmony export */   Lm: () => (/* binding */ isBoolean),
/* harmony export */   Ln: () => (/* binding */ span),
/* harmony export */   M1: () => (/* binding */ toSet),
/* harmony export */   N6: () => (/* binding */ accessorName),
/* harmony export */   NV: () => (/* binding */ None),
/* harmony export */   P$: () => (/* binding */ Warn),
/* harmony export */   PK: () => (/* binding */ inrange),
/* harmony export */   R2: () => (/* binding */ Info),
/* harmony export */   Ro: () => (/* binding */ toNumber),
/* harmony export */   SW: () => (/* binding */ zoomPow),
/* harmony export */   Tn: () => (/* binding */ isFunction),
/* harmony export */   UD: () => (/* binding */ compare),
/* harmony export */   VC: () => (/* binding */ panLinear),
/* harmony export */   V_: () => (/* binding */ ascending),
/* harmony export */   X$: () => (/* binding */ extend),
/* harmony export */   Xx: () => (/* binding */ extent),
/* harmony export */   YO: () => (/* binding */ array),
/* harmony export */   ZZ: () => (/* binding */ field),
/* harmony export */   ay: () => (/* binding */ toDate),
/* harmony export */   bX: () => (/* binding */ flush),
/* harmony export */   co: () => (/* binding */ panPow),
/* harmony export */   cy: () => (/* binding */ isArray),
/* harmony export */   dI: () => (/* binding */ toString),
/* harmony export */   dY: () => (/* binding */ constant),
/* harmony export */   eV: () => (/* binding */ pad),
/* harmony export */   gd: () => (/* binding */ isRegExp),
/* harmony export */   h1: () => (/* binding */ merge),
/* harmony export */   id: () => (/* binding */ id),
/* harmony export */   io: () => (/* binding */ mergeConfig),
/* harmony export */   iv: () => (/* binding */ splitAccessPath),
/* harmony export */   lL: () => (/* binding */ zoomLinear),
/* harmony export */   mQ: () => (/* binding */ has),
/* harmony export */   me: () => (/* binding */ falsy),
/* harmony export */   n: () => (/* binding */ extentIndex),
/* harmony export */   nG: () => (/* binding */ fastmap),
/* harmony export */   nS: () => (/* binding */ accessorFields),
/* harmony export */   oV: () => (/* binding */ zoomLog),
/* harmony export */   r$: () => (/* binding */ $),
/* harmony export */   rt: () => (/* binding */ visitArray),
/* harmony export */   sY: () => (/* binding */ accessor),
/* harmony export */   se: () => (/* binding */ peek),
/* harmony export */   sg: () => (/* binding */ debounce),
/* harmony export */   ux: () => (/* binding */ repeat),
/* harmony export */   vF: () => (/* binding */ logger),
/* harmony export */   vN: () => (/* binding */ truthy),
/* harmony export */   v_: () => (/* binding */ zero),
/* harmony export */   vu: () => (/* binding */ utcquarter),
/* harmony export */   xH: () => (/* binding */ one),
/* harmony export */   xZ: () => (/* binding */ isIterable),
/* harmony export */   xv: () => (/* binding */ truncate),
/* harmony export */   y: () => (/* binding */ Debug),
/* harmony export */   z3: () => (/* binding */ error),
/* harmony export */   zy: () => (/* binding */ panSymlog)
/* harmony export */ });
function accessor (fn, fields, name) {
  fn.fields = fields || [];
  fn.fname = name;
  return fn;
}
function accessorName(fn) {
  return fn == null ? null : fn.fname;
}
function accessorFields(fn) {
  return fn == null ? null : fn.fields;
}

function getter (path) {
  return path.length === 1 ? get1(path[0]) : getN(path);
}
const get1 = field => function (obj) {
  return obj[field];
};
const getN = path => {
  const len = path.length;
  return function (obj) {
    for (let i = 0; i < len; ++i) {
      obj = obj[path[i]];
    }
    return obj;
  };
};

function error (message) {
  throw Error(message);
}

function splitAccessPath (p) {
  const path = [],
    n = p.length;
  let q = null,
    b = 0,
    s = '',
    i,
    j,
    c;
  p = p + '';
  function push() {
    path.push(s + p.substring(i, j));
    s = '';
    i = j + 1;
  }
  for (i = j = 0; j < n; ++j) {
    c = p[j];
    if (c === '\\') {
      s += p.substring(i, j++);
      i = j;
    } else if (c === q) {
      push();
      q = null;
      b = -1;
    } else if (q) {
      continue;
    } else if (i === b && c === '"') {
      i = j + 1;
      q = c;
    } else if (i === b && c === "'") {
      i = j + 1;
      q = c;
    } else if (c === '.' && !b) {
      if (j > i) {
        push();
      } else {
        i = j + 1;
      }
    } else if (c === '[') {
      if (j > i) push();
      b = i = j + 1;
    } else if (c === ']') {
      if (!b) error('Access path missing open bracket: ' + p);
      if (b > 0) push();
      b = 0;
      i = j + 1;
    }
  }
  if (b) error('Access path missing closing bracket: ' + p);
  if (q) error('Access path missing closing quote: ' + p);
  if (j > i) {
    j++;
    push();
  }
  return path;
}

function field (field, name, opt) {
  const path = splitAccessPath(field);
  field = path.length === 1 ? path[0] : field;
  return accessor((opt && opt.get || getter)(path), [field], name || field);
}

const id = field('id');
const identity = accessor(_ => _, [], 'identity');
const zero = accessor(() => 0, [], 'zero');
const one = accessor(() => 1, [], 'one');
const truthy = accessor(() => true, [], 'true');
const falsy = accessor(() => false, [], 'false');

function log$1(method, level, input) {
  const args = [level].concat([].slice.call(input));
  console[method].apply(console, args); // eslint-disable-line no-console
}
const None = 0;
const Error$1 = 1;
const Warn = 2;
const Info = 3;
const Debug = 4;
function logger (_, method) {
  let handler = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : log$1;
  let level = _ || None;
  return {
    level(_) {
      if (arguments.length) {
        level = +_;
        return this;
      } else {
        return level;
      }
    },
    error() {
      if (level >= Error$1) handler(method || 'error', 'ERROR', arguments);
      return this;
    },
    warn() {
      if (level >= Warn) handler(method || 'warn', 'WARN', arguments);
      return this;
    },
    info() {
      if (level >= Info) handler(method || 'log', 'INFO', arguments);
      return this;
    },
    debug() {
      if (level >= Debug) handler(method || 'log', 'DEBUG', arguments);
      return this;
    }
  };
}

var isArray = Array.isArray;

function isObject (_) {
  return _ === Object(_);
}

const isLegalKey = key => key !== '__proto__';
function mergeConfig() {
  for (var _len = arguments.length, configs = new Array(_len), _key = 0; _key < _len; _key++) {
    configs[_key] = arguments[_key];
  }
  return configs.reduce((out, source) => {
    for (const key in source) {
      if (key === 'signals') {
        // for signals, we merge the signals arrays
        // source signals take precedence over
        // existing signals with the same name
        out.signals = mergeNamed(out.signals, source.signals);
      } else {
        // otherwise, merge objects subject to recursion constraints
        // for legend block, recurse for the layout entry only
        // for style block, recurse for all properties
        // otherwise, no recursion: objects overwrite, no merging
        const r = key === 'legend' ? {
          layout: 1
        } : key === 'style' ? true : null;
        writeConfig(out, key, source[key], r);
      }
    }
    return out;
  }, {});
}
function writeConfig(output, key, value, recurse) {
  if (!isLegalKey(key)) return;
  let k, o;
  if (isObject(value) && !isArray(value)) {
    o = isObject(output[key]) ? output[key] : output[key] = {};
    for (k in value) {
      if (recurse && (recurse === true || recurse[k])) {
        writeConfig(o, k, value[k]);
      } else if (isLegalKey(k)) {
        o[k] = value[k];
      }
    }
  } else {
    output[key] = value;
  }
}
function mergeNamed(a, b) {
  if (a == null) return b;
  const map = {},
    out = [];
  function add(_) {
    if (!map[_.name]) {
      map[_.name] = 1;
      out.push(_);
    }
  }
  b.forEach(add);
  a.forEach(add);
  return out;
}

function peek (array) {
  return array[array.length - 1];
}

function toNumber (_) {
  return _ == null || _ === '' ? null : +_;
}

const exp = sign => x => sign * Math.exp(x);
const log = sign => x => Math.log(sign * x);
const symlog = c => x => Math.sign(x) * Math.log1p(Math.abs(x / c));
const symexp = c => x => Math.sign(x) * Math.expm1(Math.abs(x)) * c;
const pow = exponent => x => x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
function pan(domain, delta, lift, ground) {
  const d0 = lift(domain[0]),
    d1 = lift(peek(domain)),
    dd = (d1 - d0) * delta;
  return [ground(d0 - dd), ground(d1 - dd)];
}
function panLinear(domain, delta) {
  return pan(domain, delta, toNumber, identity);
}
function panLog(domain, delta) {
  var sign = Math.sign(domain[0]);
  return pan(domain, delta, log(sign), exp(sign));
}
function panPow(domain, delta, exponent) {
  return pan(domain, delta, pow(exponent), pow(1 / exponent));
}
function panSymlog(domain, delta, constant) {
  return pan(domain, delta, symlog(constant), symexp(constant));
}
function zoom(domain, anchor, scale, lift, ground) {
  const d0 = lift(domain[0]),
    d1 = lift(peek(domain)),
    da = anchor != null ? lift(anchor) : (d0 + d1) / 2;
  return [ground(da + (d0 - da) * scale), ground(da + (d1 - da) * scale)];
}
function zoomLinear(domain, anchor, scale) {
  return zoom(domain, anchor, scale, toNumber, identity);
}
function zoomLog(domain, anchor, scale) {
  const sign = Math.sign(domain[0]);
  return zoom(domain, anchor, scale, log(sign), exp(sign));
}
function zoomPow(domain, anchor, scale, exponent) {
  return zoom(domain, anchor, scale, pow(exponent), pow(1 / exponent));
}
function zoomSymlog(domain, anchor, scale, constant) {
  return zoom(domain, anchor, scale, symlog(constant), symexp(constant));
}

function quarter(date) {
  return 1 + ~~(new Date(date).getMonth() / 3);
}
function utcquarter(date) {
  return 1 + ~~(new Date(date).getUTCMonth() / 3);
}

function array (_) {
  return _ != null ? isArray(_) ? _ : [_] : [];
}

/**
 * Span-preserving range clamp. If the span of the input range is less
 * than (max - min) and an endpoint exceeds either the min or max value,
 * the range is translated such that the span is preserved and one
 * endpoint touches the boundary of the min/max range.
 * If the span exceeds (max - min), the range [min, max] is returned.
 */
function clampRange (range, min, max) {
  let lo = range[0],
    hi = range[1],
    span;
  if (hi < lo) {
    span = hi;
    hi = lo;
    lo = span;
  }
  span = hi - lo;
  return span >= max - min ? [min, max] : [lo = Math.min(Math.max(lo, min), max - span), lo + span];
}

function isFunction (_) {
  return typeof _ === 'function';
}

const DESCENDING = 'descending';
function compare (fields, orders, opt) {
  opt = opt || {};
  orders = array(orders) || [];
  const ord = [],
    get = [],
    fmap = {},
    gen = opt.comparator || comparator;
  array(fields).forEach((f, i) => {
    if (f == null) return;
    ord.push(orders[i] === DESCENDING ? -1 : 1);
    get.push(f = isFunction(f) ? f : field(f, null, opt));
    (accessorFields(f) || []).forEach(_ => fmap[_] = 1);
  });
  return get.length === 0 ? null : accessor(gen(get, ord), Object.keys(fmap));
}
const ascending = (u, v) => (u < v || u == null) && v != null ? -1 : (u > v || v == null) && u != null ? 1 : (v = v instanceof Date ? +v : v, u = u instanceof Date ? +u : u) !== u && v === v ? -1 : v !== v && u === u ? 1 : 0;
const comparator = (fields, orders) => fields.length === 1 ? compare1(fields[0], orders[0]) : compareN(fields, orders, fields.length);
const compare1 = (field, order) => function (a, b) {
  return ascending(field(a), field(b)) * order;
};
const compareN = (fields, orders, n) => {
  orders.push(0); // pad zero for convenient lookup
  return function (a, b) {
    let f,
      c = 0,
      i = -1;
    while (c === 0 && ++i < n) {
      f = fields[i];
      c = ascending(f(a), f(b));
    }
    return c * orders[i];
  };
};

function constant (_) {
  return isFunction(_) ? _ : () => _;
}

function debounce (delay, handler) {
  let tid;
  return e => {
    if (tid) clearTimeout(tid);
    tid = setTimeout(() => (handler(e), tid = null), delay);
  };
}

function extend (_) {
  for (let x, k, i = 1, len = arguments.length; i < len; ++i) {
    x = arguments[i];
    for (k in x) {
      _[k] = x[k];
    }
  }
  return _;
}

/**
 * Return an array with minimum and maximum values, in the
 * form [min, max]. Ignores null, undefined, and NaN values.
 */
function extent (array, f) {
  let i = 0,
    n,
    v,
    min,
    max;
  if (array && (n = array.length)) {
    if (f == null) {
      // find first valid value
      for (v = array[i]; i < n && (v == null || v !== v); v = array[++i]);
      min = max = v;

      // visit all other values
      for (; i < n; ++i) {
        v = array[i];
        // skip null/undefined; NaN will fail all comparisons
        if (v != null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    } else {
      // find first valid value
      for (v = f(array[i]); i < n && (v == null || v !== v); v = f(array[++i]));
      min = max = v;

      // visit all other values
      for (; i < n; ++i) {
        v = f(array[i]);
        // skip null/undefined; NaN will fail all comparisons
        if (v != null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
  }
  return [min, max];
}

function extentIndex (array, f) {
  const n = array.length;
  let i = -1,
    a,
    b,
    c,
    u,
    v;
  if (f == null) {
    while (++i < n) {
      b = array[i];
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    if (i === n) return [-1, -1];
    u = v = i;
    while (++i < n) {
      b = array[i];
      if (b != null) {
        if (a > b) {
          a = b;
          u = i;
        }
        if (c < b) {
          c = b;
          v = i;
        }
      }
    }
  } else {
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    if (i === n) return [-1, -1];
    u = v = i;
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null) {
        if (a > b) {
          a = b;
          u = i;
        }
        if (c < b) {
          c = b;
          v = i;
        }
      }
    }
  }
  return [u, v];
}

function has (object, property) {
  return Object.hasOwn(object, property);
}

const NULL = {};
function fastmap (input) {
  let obj = {},
    test;
  function has$1(key) {
    return has(obj, key) && obj[key] !== NULL;
  }
  const map = {
    size: 0,
    empty: 0,
    object: obj,
    has: has$1,
    get(key) {
      return has$1(key) ? obj[key] : undefined;
    },
    set(key, value) {
      if (!has$1(key)) {
        ++map.size;
        if (obj[key] === NULL) --map.empty;
      }
      obj[key] = value;
      return this;
    },
    delete(key) {
      if (has$1(key)) {
        --map.size;
        ++map.empty;
        obj[key] = NULL;
      }
      return this;
    },
    clear() {
      map.size = map.empty = 0;
      map.object = obj = {};
    },
    test(_) {
      if (arguments.length) {
        test = _;
        return map;
      } else {
        return test;
      }
    },
    clean() {
      const next = {};
      let size = 0;
      for (const key in obj) {
        const value = obj[key];
        if (value !== NULL && (!test || !test(value))) {
          next[key] = value;
          ++size;
        }
      }
      map.size = size;
      map.empty = 0;
      map.object = obj = next;
    }
  };
  if (input) Object.keys(input).forEach(key => {
    map.set(key, input[key]);
  });
  return map;
}

function flush (range, value, threshold, left, right, center) {
  if (!threshold && threshold !== 0) return center;
  const t = +threshold;
  let a = range[0],
    b = peek(range),
    l;

  // swap endpoints if range is reversed
  if (b < a) {
    l = a;
    a = b;
    b = l;
  }

  // compare value to endpoints
  l = Math.abs(value - a);
  const r = Math.abs(b - value);

  // adjust if value is within threshold distance of endpoint
  return l < r && l <= t ? left : r <= t ? right : center;
}

function inherits (child, parent, members) {
  const proto = child.prototype = Object.create(parent.prototype);
  Object.defineProperty(proto, 'constructor', {
    value: child,
    writable: true,
    enumerable: true,
    configurable: true
  });
  return extend(proto, members);
}

/**
 * Predicate that returns true if the value lies within the span
 * of the given range. The left and right flags control the use
 * of inclusive (true) or exclusive (false) comparisons.
 */
function inrange (value, range, left, right) {
  let r0 = range[0],
    r1 = range[range.length - 1],
    t;
  if (r0 > r1) {
    t = r0;
    r0 = r1;
    r1 = t;
  }
  left = left === undefined || left;
  right = right === undefined || right;
  return (left ? r0 <= value : r0 < value) && (right ? value <= r1 : value < r1);
}

function isBoolean (_) {
  return typeof _ === 'boolean';
}

function isDate (_) {
  return Object.prototype.toString.call(_) === '[object Date]';
}

function isIterable (_) {
  return _ && isFunction(_[Symbol.iterator]);
}

function isNumber (_) {
  return typeof _ === 'number';
}

function isRegExp (_) {
  return Object.prototype.toString.call(_) === '[object RegExp]';
}

function isString (_) {
  return typeof _ === 'string';
}

function key (fields, flat, opt) {
  if (fields) {
    fields = flat ? array(fields).map(f => f.replace(/\\(.)/g, '$1')) : array(fields);
  }
  const len = fields && fields.length,
    gen = opt && opt.get || getter,
    map = f => gen(flat ? [f] : splitAccessPath(f));
  let fn;
  if (!len) {
    fn = function () {
      return '';
    };
  } else if (len === 1) {
    const get = map(fields[0]);
    fn = function (_) {
      return '' + get(_);
    };
  } else {
    const get = fields.map(map);
    fn = function (_) {
      let s = '' + get[0](_),
        i = 0;
      while (++i < len) s += '|' + get[i](_);
      return s;
    };
  }
  return accessor(fn, fields, 'key');
}

function lerp (array, frac) {
  const lo = array[0],
    hi = peek(array),
    f = +frac;
  return !f ? lo : f === 1 ? hi : lo + f * (hi - lo);
}

const DEFAULT_MAX_SIZE = 10000;

// adapted from https://github.com/dominictarr/hashlru/ (MIT License)
function lruCache (maxsize) {
  maxsize = +maxsize || DEFAULT_MAX_SIZE;
  let curr, prev, size;
  const clear = () => {
    curr = {};
    prev = {};
    size = 0;
  };
  const update = (key, value) => {
    if (++size > maxsize) {
      prev = curr;
      curr = {};
      size = 1;
    }
    return curr[key] = value;
  };
  clear();
  return {
    clear,
    has: key => has(curr, key) || has(prev, key),
    get: key => has(curr, key) ? curr[key] : has(prev, key) ? update(key, prev[key]) : undefined,
    set: (key, value) => has(curr, key) ? curr[key] = value : update(key, value)
  };
}

function merge (compare, array0, array1, output) {
  const n0 = array0.length,
    n1 = array1.length;
  if (!n1) return array0;
  if (!n0) return array1;
  const merged = output || new array0.constructor(n0 + n1);
  let i0 = 0,
    i1 = 0,
    i = 0;
  for (; i0 < n0 && i1 < n1; ++i) {
    merged[i] = compare(array0[i0], array1[i1]) > 0 ? array1[i1++] : array0[i0++];
  }
  for (; i0 < n0; ++i0, ++i) {
    merged[i] = array0[i0];
  }
  for (; i1 < n1; ++i1, ++i) {
    merged[i] = array1[i1];
  }
  return merged;
}

function repeat (str, reps) {
  let s = '';
  while (--reps >= 0) s += str;
  return s;
}

function pad (str, length, padchar, align) {
  const c = padchar || ' ',
    s = str + '',
    n = length - s.length;
  return n <= 0 ? s : align === 'left' ? repeat(c, n) + s : align === 'center' ? repeat(c, ~~(n / 2)) + s + repeat(c, Math.ceil(n / 2)) : s + repeat(c, n);
}

/**
 * Return the numerical span of an array: the difference between
 * the last and first values.
 */
function span (array) {
  return array && peek(array) - array[0] || 0;
}

function $(x) {
  return isArray(x) ? '[' + x.map($) + ']' : isObject(x) || isString(x) ?
  // Output valid JSON and JS source strings.
  // See http://timelessrepo.com/json-isnt-a-javascript-subset
  JSON.stringify(x).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029') : x;
}

function toBoolean (_) {
  return _ == null || _ === '' ? null : !_ || _ === 'false' || _ === '0' ? false : !!_;
}

const defaultParser = _ => isNumber(_) ? _ : isDate(_) ? _ : Date.parse(_);
function toDate (_, parser) {
  parser = parser || defaultParser;
  return _ == null || _ === '' ? null : parser(_);
}

function toString (_) {
  return _ == null || _ === '' ? null : _ + '';
}

function toSet (_) {
  const s = {},
    n = _.length;
  for (let i = 0; i < n; ++i) s[_[i]] = true;
  return s;
}

function truncate (str, length, align, ellipsis) {
  const e = ellipsis != null ? ellipsis : '\u2026',
    s = str + '',
    n = s.length,
    l = Math.max(0, length - e.length);
  return n <= length ? s : align === 'left' ? e + s.slice(n - l) : align === 'center' ? s.slice(0, Math.ceil(l / 2)) + e + s.slice(n - ~~(l / 2)) : s.slice(0, l) + e;
}

function visitArray (array, filter, visitor) {
  if (array) {
    if (filter) {
      const n = array.length;
      for (let i = 0; i < n; ++i) {
        const t = filter(array[i]);
        if (t) visitor(t, i, array);
      }
    } else {
      array.forEach(visitor);
    }
  }
}




/***/ })

}]);
//# sourceMappingURL=7990.114515e45d456a4c5064.js.map?v=114515e45d456a4c5064