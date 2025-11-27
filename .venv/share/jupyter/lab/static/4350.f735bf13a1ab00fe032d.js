(self["webpackChunk_jupyterlab_application_top"] = self["webpackChunk_jupyterlab_application_top"] || []).push([[4350],{

/***/ 32017:
/***/ ((module) => {

"use strict";


// do not edit .js files directly - edit src/index.jst



module.exports = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;

    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }



    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];

      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a!==a && b!==b;
};


/***/ }),

/***/ 72492:
/***/ ((module) => {

"use strict";


module.exports = function (data, opts) {
    if (!opts) opts = {};
    if (typeof opts === 'function') opts = { cmp: opts };
    var cycles = (typeof opts.cycles === 'boolean') ? opts.cycles : false;

    var cmp = opts.cmp && (function (f) {
        return function (node) {
            return function (a, b) {
                var aobj = { key: a, value: node[a] };
                var bobj = { key: b, value: node[b] };
                return f(aobj, bobj);
            };
        };
    })(opts.cmp);

    var seen = [];
    return (function stringify (node) {
        if (node && node.toJSON && typeof node.toJSON === 'function') {
            node = node.toJSON();
        }

        if (node === undefined) return;
        if (typeof node == 'number') return isFinite(node) ? '' + node : 'null';
        if (typeof node !== 'object') return JSON.stringify(node);

        var i, out;
        if (Array.isArray(node)) {
            out = '[';
            for (i = 0; i < node.length; i++) {
                if (i) out += ',';
                out += stringify(node[i]) || 'null';
            }
            return out + ']';
        }

        if (node === null) return 'null';

        if (seen.indexOf(node) !== -1) {
            if (cycles) return JSON.stringify('__cycle__');
            throw new TypeError('Converting circular structure to JSON');
        }

        var seenIndex = seen.push(node) - 1;
        var keys = Object.keys(node).sort(cmp && cmp(node));
        out = '';
        for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = stringify(node[key]);

            if (!value) continue;
            if (out) out += ',';
            out += JSON.stringify(key) + ':' + value;
        }
        seen.splice(seenIndex, 1);
        return '{' + out + '}';
    })(data);
};


/***/ }),

/***/ 45948:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   P: () => (/* binding */ eventSelector)
/* harmony export */ });
const VIEW = 'view',
  LBRACK = '[',
  RBRACK = ']',
  LBRACE = '{',
  RBRACE = '}',
  COLON = ':',
  COMMA = ',',
  NAME = '@',
  GT = '>',
  ILLEGAL = /[[\]{}]/,
  DEFAULT_MARKS = {
    '*': 1,
    arc: 1,
    area: 1,
    group: 1,
    image: 1,
    line: 1,
    path: 1,
    rect: 1,
    rule: 1,
    shape: 1,
    symbol: 1,
    text: 1,
    trail: 1
  };
let DEFAULT_SOURCE, MARKS;

/**
 * Parse an event selector string.
 * Returns an array of event stream definitions.
 */
function eventSelector (selector, source, marks) {
  DEFAULT_SOURCE = source || VIEW;
  MARKS = marks || DEFAULT_MARKS;
  return parseMerge(selector.trim()).map(parseSelector);
}
function isMarkType(type) {
  return MARKS[type];
}
function find(s, i, endChar, pushChar, popChar) {
  const n = s.length;
  let count = 0,
    c;
  for (; i < n; ++i) {
    c = s[i];
    if (!count && c === endChar) return i;else if (popChar && popChar.indexOf(c) >= 0) --count;else if (pushChar && pushChar.indexOf(c) >= 0) ++count;
  }
  return i;
}
function parseMerge(s) {
  const output = [],
    n = s.length;
  let start = 0,
    i = 0;
  while (i < n) {
    i = find(s, i, COMMA, LBRACK + LBRACE, RBRACK + RBRACE);
    output.push(s.substring(start, i).trim());
    start = ++i;
  }
  if (output.length === 0) {
    throw 'Empty event selector: ' + s;
  }
  return output;
}
function parseSelector(s) {
  return s[0] === '[' ? parseBetween(s) : parseStream(s);
}
function parseBetween(s) {
  const n = s.length;
  let i = 1,
    b;
  i = find(s, i, RBRACK, LBRACK, RBRACK);
  if (i === n) {
    throw 'Empty between selector: ' + s;
  }
  b = parseMerge(s.substring(1, i));
  if (b.length !== 2) {
    throw 'Between selector must have two elements: ' + s;
  }
  s = s.slice(i + 1).trim();
  if (s[0] !== GT) {
    throw 'Expected \'>\' after between selector: ' + s;
  }
  b = b.map(parseSelector);
  const stream = parseSelector(s.slice(1).trim());
  if (stream.between) {
    return {
      between: b,
      stream: stream
    };
  } else {
    stream.between = b;
  }
  return stream;
}
function parseStream(s) {
  const stream = {
      source: DEFAULT_SOURCE
    },
    source = [];
  let throttle = [0, 0],
    markname = 0,
    start = 0,
    n = s.length,
    i = 0,
    j,
    filter;

  // extract throttle from end
  if (s[n - 1] === RBRACE) {
    i = s.lastIndexOf(LBRACE);
    if (i >= 0) {
      try {
        throttle = parseThrottle(s.substring(i + 1, n - 1));
      } catch (e) {
        throw 'Invalid throttle specification: ' + s;
      }
      s = s.slice(0, i).trim();
      n = s.length;
    } else throw 'Unmatched right brace: ' + s;
    i = 0;
  }
  if (!n) throw s;

  // set name flag based on first char
  if (s[0] === NAME) markname = ++i;

  // extract first part of multi-part stream selector
  j = find(s, i, COLON);
  if (j < n) {
    source.push(s.substring(start, j).trim());
    start = i = ++j;
  }

  // extract remaining part of stream selector
  i = find(s, i, LBRACK);
  if (i === n) {
    source.push(s.substring(start, n).trim());
  } else {
    source.push(s.substring(start, i).trim());
    filter = [];
    start = ++i;
    if (start === n) throw 'Unmatched left bracket: ' + s;
  }

  // extract filters
  while (i < n) {
    i = find(s, i, RBRACK);
    if (i === n) throw 'Unmatched left bracket: ' + s;
    filter.push(s.substring(start, i).trim());
    if (i < n - 1 && s[++i] !== LBRACK) throw 'Expected left bracket: ' + s;
    start = ++i;
  }

  // marshall event stream specification
  if (!(n = source.length) || ILLEGAL.test(source[n - 1])) {
    throw 'Invalid event selector: ' + s;
  }
  if (n > 1) {
    stream.type = source[1];
    if (markname) {
      stream.markname = source[0].slice(1);
    } else if (isMarkType(source[0])) {
      stream.marktype = source[0];
    } else {
      stream.source = source[0];
    }
  } else {
    stream.type = source[0];
  }
  if (stream.type.slice(-1) === '!') {
    stream.consume = true;
    stream.type = stream.type.slice(0, -1);
  }
  if (filter != null) stream.filter = filter;
  if (throttle[0]) stream.throttle = throttle[0];
  if (throttle[1]) stream.debounce = throttle[1];
  return stream;
}
function parseThrottle(s) {
  const a = s.split(COMMA);
  if (!s.length || a.length > 2) throw s;
  return a.map(_ => {
    const x = +_;
    if (x !== x) throw s;
    return x;
  });
}




/***/ }),

/***/ 54350:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  accessPathDepth: () => (/* reexport */ accessPathDepth),
  accessPathWithDatum: () => (/* reexport */ accessPathWithDatum),
  compile: () => (/* reexport */ compile),
  contains: () => (/* reexport */ contains),
  deepEqual: () => (/* reexport */ deepEqual),
  deleteNestedProperty: () => (/* reexport */ deleteNestedProperty),
  duplicate: () => (/* reexport */ duplicate),
  entries: () => (/* reexport */ entries),
  every: () => (/* reexport */ every),
  fieldIntersection: () => (/* reexport */ fieldIntersection),
  flatAccessWithDatum: () => (/* reexport */ flatAccessWithDatum),
  getFirstDefined: () => (/* reexport */ getFirstDefined),
  hasIntersection: () => (/* reexport */ hasIntersection),
  hash: () => (/* reexport */ hash),
  internalField: () => (/* reexport */ internalField),
  isBoolean: () => (/* reexport */ isBoolean),
  isEmpty: () => (/* reexport */ isEmpty),
  isEqual: () => (/* reexport */ isEqual),
  isInternalField: () => (/* reexport */ isInternalField),
  isNullOrFalse: () => (/* reexport */ isNullOrFalse),
  isNumeric: () => (/* reexport */ isNumeric),
  keys: () => (/* reexport */ keys),
  logicalExpr: () => (/* reexport */ logicalExpr),
  mergeDeep: () => (/* reexport */ mergeDeep),
  never: () => (/* reexport */ never),
  normalize: () => (/* reexport */ normalize),
  normalizeAngle: () => (/* reexport */ normalizeAngle),
  omit: () => (/* reexport */ omit),
  pick: () => (/* reexport */ pick),
  prefixGenerator: () => (/* reexport */ prefixGenerator),
  removePathFromField: () => (/* reexport */ removePathFromField),
  replaceAll: () => (/* reexport */ replaceAll),
  replacePathInField: () => (/* reexport */ replacePathInField),
  resetIdCounter: () => (/* reexport */ resetIdCounter),
  setEqual: () => (/* reexport */ setEqual),
  some: () => (/* reexport */ some),
  stringify: () => (/* reexport */ stringify),
  titleCase: () => (/* reexport */ titleCase),
  unique: () => (/* reexport */ unique),
  uniqueId: () => (/* reexport */ uniqueId),
  vals: () => (/* reexport */ vals),
  varName: () => (/* reexport */ varName),
  version: () => (/* binding */ version)
});

;// CONCATENATED MODULE: ./node_modules/vega-lite/build/package.json
const package_namespaceObject = {"rE":"5.6.1"};
// EXTERNAL MODULE: ./node_modules/vega-util/build/vega-util.module.js
var vega_util_module = __webpack_require__(26372);
// EXTERNAL MODULE: ./node_modules/vega-lite/node_modules/clone/clone.js
var clone = __webpack_require__(18729);
var clone_default = /*#__PURE__*/__webpack_require__.n(clone);
// EXTERNAL MODULE: ./node_modules/fast-deep-equal/index.js
var fast_deep_equal = __webpack_require__(32017);
var fast_deep_equal_default = /*#__PURE__*/__webpack_require__.n(fast_deep_equal);
// EXTERNAL MODULE: ./node_modules/fast-json-stable-stringify/index.js
var fast_json_stable_stringify = __webpack_require__(72492);
var fast_json_stable_stringify_default = /*#__PURE__*/__webpack_require__.n(fast_json_stable_stringify);
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/logical.js
function isLogicalOr(op) {
    return !!op.or;
}
function isLogicalAnd(op) {
    return !!op.and;
}
function isLogicalNot(op) {
    return !!op.not;
}
function forEachLeaf(op, fn) {
    if (isLogicalNot(op)) {
        forEachLeaf(op.not, fn);
    }
    else if (isLogicalAnd(op)) {
        for (const subop of op.and) {
            forEachLeaf(subop, fn);
        }
    }
    else if (isLogicalOr(op)) {
        for (const subop of op.or) {
            forEachLeaf(subop, fn);
        }
    }
    else {
        fn(op);
    }
}
function normalizeLogicalComposition(op, normalizer) {
    if (isLogicalNot(op)) {
        return { not: normalizeLogicalComposition(op.not, normalizer) };
    }
    else if (isLogicalAnd(op)) {
        return { and: op.and.map(o => normalizeLogicalComposition(o, normalizer)) };
    }
    else if (isLogicalOr(op)) {
        return { or: op.or.map(o => normalizeLogicalComposition(o, normalizer)) };
    }
    else {
        return normalizer(op);
    }
}
//# sourceMappingURL=logical.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/util.js





const deepEqual = (fast_deep_equal_default());
const duplicate = (clone_default());
function never(message) {
    throw new Error(message);
}
/**
 * Creates an object composed of the picked object properties.
 *
 * var object = {'a': 1, 'b': '2', 'c': 3};
 * pick(object, ['a', 'c']);
 * // → {'a': 1, 'c': 3}
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function pick(obj, props) {
    const copy = {};
    for (const prop of props) {
        if ((0,vega_util_module/* hasOwnProperty */.mQ)(obj, prop)) {
            copy[prop] = obj[prop];
        }
    }
    return copy;
}
/**
 * The opposite of _.pick; this method creates an object composed of the own
 * and inherited enumerable string keyed properties of object that are not omitted.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function omit(obj, props) {
    const copy = Object.assign({}, obj);
    for (const prop of props) {
        delete copy[prop];
    }
    return copy;
}
/**
 * Monkey patch Set so that `stringify` produces a string representation of sets.
 */
Set.prototype['toJSON'] = function () {
    return `Set(${[...this].map(x => fast_json_stable_stringify_default()(x)).join(',')})`;
};
/**
 * Converts any object to a string representation that can be consumed by humans.
 */
const stringify = (fast_json_stable_stringify_default());
/**
 * Converts any object to a string of limited size, or a number.
 */
function hash(a) {
    if ((0,vega_util_module/* isNumber */.Et)(a)) {
        return a;
    }
    const str = (0,vega_util_module/* isString */.Kg)(a) ? a : fast_json_stable_stringify_default()(a);
    // short strings can be used as hash directly, longer strings are hashed to reduce memory usage
    if (str.length < 250) {
        return str;
    }
    // from http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        h = (h << 5) - h + char;
        h = h & h; // Convert to 32bit integer
    }
    return h;
}
function isNullOrFalse(x) {
    return x === false || x === null;
}
function contains(array, item) {
    return array.includes(item);
}
/**
 * Returns true if any item returns true.
 */
function some(arr, f) {
    let i = 0;
    for (const [k, a] of arr.entries()) {
        if (f(a, k, i++)) {
            return true;
        }
    }
    return false;
}
/**
 * Returns true if all items return true.
 */
function every(arr, f) {
    let i = 0;
    for (const [k, a] of arr.entries()) {
        if (!f(a, k, i++)) {
            return false;
        }
    }
    return true;
}
/**
 * recursively merges src into dest
 */
function mergeDeep(dest, ...src) {
    for (const s of src) {
        deepMerge_(dest, s !== null && s !== void 0 ? s : {});
    }
    return dest;
}
function deepMerge_(dest, src) {
    for (const property of keys(src)) {
        (0,vega_util_module/* writeConfig */.AU)(dest, property, src[property], true);
    }
}
function unique(values, f) {
    const results = [];
    const u = {};
    let v;
    for (const val of values) {
        v = f(val);
        if (v in u) {
            continue;
        }
        u[v] = 1;
        results.push(val);
    }
    return results;
}
/**
 * Returns true if the two dictionaries disagree. Applies only to defined values.
 */
function isEqual(dict, other) {
    const dictKeys = keys(dict);
    const otherKeys = keys(other);
    if (dictKeys.length !== otherKeys.length) {
        return false;
    }
    for (const key of dictKeys) {
        if (dict[key] !== other[key]) {
            return false;
        }
    }
    return true;
}
function setEqual(a, b) {
    if (a.size !== b.size) {
        return false;
    }
    for (const e of a) {
        if (!b.has(e)) {
            return false;
        }
    }
    return true;
}
function hasIntersection(a, b) {
    for (const key of a) {
        if (b.has(key)) {
            return true;
        }
    }
    return false;
}
function prefixGenerator(a) {
    const prefixes = new Set();
    for (const x of a) {
        const splitField = (0,vega_util_module/* splitAccessPath */.iv)(x);
        // Wrap every element other than the first in `[]`
        const wrappedWithAccessors = splitField.map((y, i) => (i === 0 ? y : `[${y}]`));
        const computedPrefixes = wrappedWithAccessors.map((_, i) => wrappedWithAccessors.slice(0, i + 1).join(''));
        for (const y of computedPrefixes) {
            prefixes.add(y);
        }
    }
    return prefixes;
}
/**
 * Returns true if a and b have an intersection. Also return true if a or b are undefined
 * since this means we don't know what fields a node produces or depends on.
 */
function fieldIntersection(a, b) {
    if (a === undefined || b === undefined) {
        return true;
    }
    return hasIntersection(prefixGenerator(a), prefixGenerator(b));
}
// eslint-disable-next-line @typescript-eslint/ban-types
function isEmpty(obj) {
    return keys(obj).length === 0;
}
// This is a stricter version of Object.keys but with better types. See https://github.com/Microsoft/TypeScript/pull/12253#issuecomment-263132208
const keys = Object.keys;
const vals = Object.values;
const entries = Object.entries;
function isBoolean(b) {
    return b === true || b === false;
}
/**
 * Convert a string into a valid variable name
 */
function varName(s) {
    // Replace non-alphanumeric characters (anything besides a-zA-Z0-9_) with _
    const alphanumericS = s.replace(/\W/g, '_');
    // Add _ if the string has leading numbers.
    return (s.match(/^\d+/) ? '_' : '') + alphanumericS;
}
function logicalExpr(op, cb) {
    if (isLogicalNot(op)) {
        return `!(${logicalExpr(op.not, cb)})`;
    }
    else if (isLogicalAnd(op)) {
        return `(${op.and.map((and) => logicalExpr(and, cb)).join(') && (')})`;
    }
    else if (isLogicalOr(op)) {
        return `(${op.or.map((or) => logicalExpr(or, cb)).join(') || (')})`;
    }
    else {
        return cb(op);
    }
}
/**
 * Delete nested property of an object, and delete the ancestors of the property if they become empty.
 */
function deleteNestedProperty(obj, orderedProps) {
    if (orderedProps.length === 0) {
        return true;
    }
    const prop = orderedProps.shift(); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    if (prop in obj && deleteNestedProperty(obj[prop], orderedProps)) {
        delete obj[prop];
    }
    return isEmpty(obj);
}
function titleCase(s) {
    return s.charAt(0).toUpperCase() + s.substr(1);
}
/**
 * Converts a path to an access path with datum.
 * @param path The field name.
 * @param datum The string to use for `datum`.
 */
function accessPathWithDatum(path, datum = 'datum') {
    const pieces = (0,vega_util_module/* splitAccessPath */.iv)(path);
    const prefixes = [];
    for (let i = 1; i <= pieces.length; i++) {
        const prefix = `[${pieces.slice(0, i).map(vega_util_module/* stringValue */.r$).join('][')}]`;
        prefixes.push(`${datum}${prefix}`);
    }
    return prefixes.join(' && ');
}
/**
 * Return access with datum to the flattened field.
 *
 * @param path The field name.
 * @param datum The string to use for `datum`.
 */
function flatAccessWithDatum(path, datum = 'datum') {
    return `${datum}[${(0,vega_util_module/* stringValue */.r$)((0,vega_util_module/* splitAccessPath */.iv)(path).join('.'))}]`;
}
function escapePathAccess(string) {
    return string.replace(/(\[|\]|\.|'|")/g, '\\$1');
}
/**
 * Replaces path accesses with access to non-nested field.
 * For example, `foo["bar"].baz` becomes `foo\\.bar\\.baz`.
 */
function replacePathInField(path) {
    return `${(0,vega_util_module/* splitAccessPath */.iv)(path).map(escapePathAccess).join('\\.')}`;
}
/**
 * Replace all occurrences of a string with another string.
 *
 * @param string the string to replace in
 * @param find the string to replace
 * @param replacement the replacement
 */
function replaceAll(string, find, replacement) {
    return string.replace(new RegExp(find.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replacement);
}
/**
 * Remove path accesses with access from field.
 * For example, `foo["bar"].baz` becomes `foo.bar.baz`.
 */
function removePathFromField(path) {
    return `${(0,vega_util_module/* splitAccessPath */.iv)(path).join('.')}`;
}
/**
 * Count the depth of the path. Returns 1 for fields that are not nested.
 */
function accessPathDepth(path) {
    if (!path) {
        return 0;
    }
    return (0,vega_util_module/* splitAccessPath */.iv)(path).length;
}
/**
 * This is a replacement for chained || for numeric properties or properties that respect null so that 0 will be included.
 */
function getFirstDefined(...args) {
    for (const arg of args) {
        if (arg !== undefined) {
            return arg;
        }
    }
    return undefined;
}
// variable used to generate id
let idCounter = 42;
/**
 * Returns a new random id every time it gets called.
 *
 * Has side effect!
 */
function uniqueId(prefix) {
    const id = ++idCounter;
    return prefix ? String(prefix) + id : id;
}
/**
 * Resets the id counter used in uniqueId. This can be useful for testing.
 */
function resetIdCounter() {
    idCounter = 42;
}
function internalField(name) {
    return isInternalField(name) ? name : `__${name}`;
}
function isInternalField(name) {
    return name.startsWith('__');
}
/**
 * Normalize angle to be within [0,360).
 */
function normalizeAngle(angle) {
    if (angle === undefined) {
        return undefined;
    }
    return ((angle % 360) + 360) % 360;
}
/**
 * Returns whether the passed in value is a valid number.
 */
function isNumeric(value) {
    if ((0,vega_util_module/* isNumber */.Et)(value)) {
        return true;
    }
    return !isNaN(value) && !isNaN(parseFloat(value));
}
//# sourceMappingURL=util.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/channel.js
/*
 * Constants and utilities for encoding channels (Visual variables)
 * such as 'x', 'y', 'color'.
 */
var __rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};

// Facet
const ROW = 'row';
const COLUMN = 'column';
const FACET = 'facet';
// Position
const X = 'x';
const Y = 'y';
const X2 = 'x2';
const Y2 = 'y2';
// Position Offset
const XOFFSET = 'xOffset';
const YOFFSET = 'yOffset';
// Arc-Position
const RADIUS = 'radius';
const RADIUS2 = 'radius2';
const THETA = 'theta';
const THETA2 = 'theta2';
// Geo Position
const LATITUDE = 'latitude';
const LONGITUDE = 'longitude';
const LATITUDE2 = 'latitude2';
const LONGITUDE2 = 'longitude2';
// Mark property with scale
const COLOR = 'color';
const FILL = 'fill';
const STROKE = 'stroke';
const SHAPE = 'shape';
const SIZE = 'size';
const ANGLE = 'angle';
const OPACITY = 'opacity';
const FILLOPACITY = 'fillOpacity';
const STROKEOPACITY = 'strokeOpacity';
const STROKEWIDTH = 'strokeWidth';
const STROKEDASH = 'strokeDash';
// Non-scale channel
const TEXT = 'text';
const ORDER = 'order';
const DETAIL = 'detail';
const KEY = 'key';
const TOOLTIP = 'tooltip';
const HREF = 'href';
const URL = 'url';
const DESCRIPTION = 'description';
const POSITION_CHANNEL_INDEX = {
    x: 1,
    y: 1,
    x2: 1,
    y2: 1
};
const POLAR_POSITION_CHANNEL_INDEX = {
    theta: 1,
    theta2: 1,
    radius: 1,
    radius2: 1
};
function isPolarPositionChannel(c) {
    return c in POLAR_POSITION_CHANNEL_INDEX;
}
const GEO_POSIITON_CHANNEL_INDEX = {
    longitude: 1,
    longitude2: 1,
    latitude: 1,
    latitude2: 1
};
function getPositionChannelFromLatLong(channel) {
    switch (channel) {
        case LATITUDE:
            return 'y';
        case LATITUDE2:
            return 'y2';
        case LONGITUDE:
            return 'x';
        case LONGITUDE2:
            return 'x2';
    }
}
function isGeoPositionChannel(c) {
    return c in GEO_POSIITON_CHANNEL_INDEX;
}
const GEOPOSITION_CHANNELS = keys(GEO_POSIITON_CHANNEL_INDEX);
const UNIT_CHANNEL_INDEX = Object.assign(Object.assign(Object.assign(Object.assign({}, POSITION_CHANNEL_INDEX), POLAR_POSITION_CHANNEL_INDEX), GEO_POSIITON_CHANNEL_INDEX), { xOffset: 1, yOffset: 1, 
    // color
    color: 1, fill: 1, stroke: 1, 
    // other non-position with scale
    opacity: 1, fillOpacity: 1, strokeOpacity: 1, strokeWidth: 1, strokeDash: 1, size: 1, angle: 1, shape: 1, 
    // channels without scales
    order: 1, text: 1, detail: 1, key: 1, tooltip: 1, href: 1, url: 1, description: 1 });
function isColorChannel(channel) {
    return channel === COLOR || channel === FILL || channel === STROKE;
}
const FACET_CHANNEL_INDEX = {
    row: 1,
    column: 1,
    facet: 1
};
const FACET_CHANNELS = keys(FACET_CHANNEL_INDEX);
const CHANNEL_INDEX = Object.assign(Object.assign({}, UNIT_CHANNEL_INDEX), FACET_CHANNEL_INDEX);
const CHANNELS = keys(CHANNEL_INDEX);
const { order: _o, detail: _d, tooltip: _tt1 } = CHANNEL_INDEX, SINGLE_DEF_CHANNEL_INDEX = __rest(CHANNEL_INDEX, ["order", "detail", "tooltip"]);
const { row: _r, column: _c, facet: _f } = SINGLE_DEF_CHANNEL_INDEX, SINGLE_DEF_UNIT_CHANNEL_INDEX = __rest(SINGLE_DEF_CHANNEL_INDEX, ["row", "column", "facet"]);
/**
 * Channels that cannot have an array of channelDef.
 * model.fieldDef, getFieldDef only work for these channels.
 *
 * (The only two channels that can have an array of channelDefs are "detail" and "order".
 * Since there can be multiple fieldDefs for detail and order, getFieldDef/model.fieldDef
 * are not applicable for them. Similarly, selection projection won't work with "detail" and "order".)
 */
const SINGLE_DEF_CHANNELS = keys(SINGLE_DEF_CHANNEL_INDEX);
const SINGLE_DEF_UNIT_CHANNELS = keys(SINGLE_DEF_UNIT_CHANNEL_INDEX);
function isSingleDefUnitChannel(str) {
    return !!SINGLE_DEF_UNIT_CHANNEL_INDEX[str];
}
function isChannel(str) {
    return !!CHANNEL_INDEX[str];
}
const SECONDARY_RANGE_CHANNEL = [X2, Y2, LATITUDE2, LONGITUDE2, THETA2, RADIUS2];
function isSecondaryRangeChannel(c) {
    const main = getMainRangeChannel(c);
    return main !== c;
}
/**
 * Get the main channel for a range channel. E.g. `x` for `x2`.
 */
function getMainRangeChannel(channel) {
    switch (channel) {
        case X2:
            return X;
        case Y2:
            return Y;
        case LATITUDE2:
            return LATITUDE;
        case LONGITUDE2:
            return LONGITUDE;
        case THETA2:
            return THETA;
        case RADIUS2:
            return RADIUS;
    }
    return channel;
}
function getVgPositionChannel(channel) {
    if (isPolarPositionChannel(channel)) {
        switch (channel) {
            case THETA:
                return 'startAngle';
            case THETA2:
                return 'endAngle';
            case RADIUS:
                return 'outerRadius';
            case RADIUS2:
                return 'innerRadius';
        }
    }
    return channel;
}
/**
 * Get the main channel for a range channel. E.g. `x` for `x2`.
 */
function getSecondaryRangeChannel(channel) {
    switch (channel) {
        case X:
            return X2;
        case Y:
            return Y2;
        case LATITUDE:
            return LATITUDE2;
        case LONGITUDE:
            return LONGITUDE2;
        case THETA:
            return THETA2;
        case RADIUS:
            return RADIUS2;
    }
    return undefined;
}
function getSizeChannel(channel) {
    switch (channel) {
        case X:
        case X2:
            return 'width';
        case Y:
        case Y2:
            return 'height';
    }
    return undefined;
}
/**
 * Get the main channel for a range channel. E.g. `x` for `x2`.
 */
function getOffsetChannel(channel) {
    switch (channel) {
        case X:
            return 'xOffset';
        case Y:
            return 'yOffset';
        case X2:
            return 'x2Offset';
        case Y2:
            return 'y2Offset';
        case THETA:
            return 'thetaOffset';
        case RADIUS:
            return 'radiusOffset';
        case THETA2:
            return 'theta2Offset';
        case RADIUS2:
            return 'radius2Offset';
    }
    return undefined;
}
/**
 * Get the main channel for a range channel. E.g. `x` for `x2`.
 */
function getOffsetScaleChannel(channel) {
    switch (channel) {
        case X:
            return 'xOffset';
        case Y:
            return 'yOffset';
    }
    return undefined;
}
function getMainChannelFromOffsetChannel(channel) {
    switch (channel) {
        case 'xOffset':
            return 'x';
        case 'yOffset':
            return 'y';
    }
}
// CHANNELS without COLUMN, ROW
const UNIT_CHANNELS = keys(UNIT_CHANNEL_INDEX);
// NONPOSITION_CHANNELS = UNIT_CHANNELS without X, Y, X2, Y2;
const { x: _x, y: _y, 
// x2 and y2 share the same scale as x and y
x2: _x2, y2: _y2, 
//
xOffset: _xo, yOffset: _yo, latitude: _latitude, longitude: _longitude, latitude2: _latitude2, longitude2: _longitude2, theta: _theta, theta2: _theta2, radius: _radius, radius2: _radius2 } = UNIT_CHANNEL_INDEX, 
// The rest of unit channels then have scale
NONPOSITION_CHANNEL_INDEX = __rest(UNIT_CHANNEL_INDEX, ["x", "y", "x2", "y2", "xOffset", "yOffset", "latitude", "longitude", "latitude2", "longitude2", "theta", "theta2", "radius", "radius2"]);
const NONPOSITION_CHANNELS = keys(NONPOSITION_CHANNEL_INDEX);
const POSITION_SCALE_CHANNEL_INDEX = {
    x: 1,
    y: 1
};
const POSITION_SCALE_CHANNELS = keys(POSITION_SCALE_CHANNEL_INDEX);
function isXorY(channel) {
    return channel in POSITION_SCALE_CHANNEL_INDEX;
}
const POLAR_POSITION_SCALE_CHANNEL_INDEX = {
    theta: 1,
    radius: 1
};
const POLAR_POSITION_SCALE_CHANNELS = keys(POLAR_POSITION_SCALE_CHANNEL_INDEX);
function getPositionScaleChannel(sizeType) {
    return sizeType === 'width' ? X : Y;
}
const OFFSET_SCALE_CHANNEL_INDEX = { xOffset: 1, yOffset: 1 };
const OFFSET_SCALE_CHANNELS = keys(OFFSET_SCALE_CHANNEL_INDEX);
function isXorYOffset(channel) {
    return channel in OFFSET_SCALE_CHANNEL_INDEX;
}
// NON_POSITION_SCALE_CHANNEL = SCALE_CHANNELS without position / offset
const { 
// x2 and y2 share the same scale as x and y
// text and tooltip have format instead of scale,
// href has neither format, nor scale
text: _t, tooltip: _tt, href: _hr, url: _u, description: _al, 
// detail and order have no scale
detail: _dd, key: _k, order: _oo } = NONPOSITION_CHANNEL_INDEX, NONPOSITION_SCALE_CHANNEL_INDEX = __rest(NONPOSITION_CHANNEL_INDEX, ["text", "tooltip", "href", "url", "description", "detail", "key", "order"]);
const NONPOSITION_SCALE_CHANNELS = keys(NONPOSITION_SCALE_CHANNEL_INDEX);
function isNonPositionScaleChannel(channel) {
    return !!NONPOSITION_CHANNEL_INDEX[channel];
}
/**
 * @returns whether Vega supports legends for a particular channel
 */
function supportLegend(channel) {
    switch (channel) {
        case COLOR:
        case FILL:
        case STROKE:
        case SIZE:
        case SHAPE:
        case OPACITY:
        case STROKEWIDTH:
        case STROKEDASH:
            return true;
        case FILLOPACITY:
        case STROKEOPACITY:
        case ANGLE:
            return false;
    }
}
// Declare SCALE_CHANNEL_INDEX
const SCALE_CHANNEL_INDEX = Object.assign(Object.assign(Object.assign(Object.assign({}, POSITION_SCALE_CHANNEL_INDEX), POLAR_POSITION_SCALE_CHANNEL_INDEX), OFFSET_SCALE_CHANNEL_INDEX), NONPOSITION_SCALE_CHANNEL_INDEX);
/** List of channels with scales */
const SCALE_CHANNELS = keys(SCALE_CHANNEL_INDEX);
function isScaleChannel(channel) {
    return !!SCALE_CHANNEL_INDEX[channel];
}
/**
 * Return whether a channel supports a particular mark type.
 * @param channel  channel name
 * @param mark the mark type
 * @return whether the mark supports the channel
 */
function supportMark(channel, mark) {
    return getSupportedMark(channel)[mark];
}
const ALL_MARKS = {
    // all marks
    arc: 'always',
    area: 'always',
    bar: 'always',
    circle: 'always',
    geoshape: 'always',
    image: 'always',
    line: 'always',
    rule: 'always',
    point: 'always',
    rect: 'always',
    square: 'always',
    trail: 'always',
    text: 'always',
    tick: 'always'
};
const { geoshape: _g } = ALL_MARKS, ALL_MARKS_EXCEPT_GEOSHAPE = __rest(ALL_MARKS, ["geoshape"]);
/**
 * Return a dictionary showing whether a channel supports mark type.
 * @param channel
 * @return A dictionary mapping mark types to 'always', 'binned', or undefined
 */
function getSupportedMark(channel) {
    switch (channel) {
        case COLOR:
        case FILL:
        case STROKE:
        // falls through
        case DESCRIPTION:
        case DETAIL:
        case KEY:
        case TOOLTIP:
        case HREF:
        case ORDER: // TODO: revise (order might not support rect, which is not stackable?)
        case OPACITY:
        case FILLOPACITY:
        case STROKEOPACITY:
        case STROKEWIDTH:
        // falls through
        case FACET:
        case ROW: // falls through
        case COLUMN:
            return ALL_MARKS;
        case X:
        case Y:
        case XOFFSET:
        case YOFFSET:
        case LATITUDE:
        case LONGITUDE:
            // all marks except geoshape. geoshape does not use X, Y -- it uses a projection
            return ALL_MARKS_EXCEPT_GEOSHAPE;
        case X2:
        case Y2:
        case LATITUDE2:
        case LONGITUDE2:
            return {
                area: 'always',
                bar: 'always',
                image: 'always',
                rect: 'always',
                rule: 'always',
                circle: 'binned',
                point: 'binned',
                square: 'binned',
                tick: 'binned',
                line: 'binned',
                trail: 'binned'
            };
        case SIZE:
            return {
                point: 'always',
                tick: 'always',
                rule: 'always',
                circle: 'always',
                square: 'always',
                bar: 'always',
                text: 'always',
                line: 'always',
                trail: 'always'
            };
        case STROKEDASH:
            return {
                line: 'always',
                point: 'always',
                tick: 'always',
                rule: 'always',
                circle: 'always',
                square: 'always',
                bar: 'always',
                geoshape: 'always'
            };
        case SHAPE:
            return { point: 'always', geoshape: 'always' };
        case TEXT:
            return { text: 'always' };
        case ANGLE:
            return { point: 'always', square: 'always', text: 'always' };
        case URL:
            return { image: 'always' };
        case THETA:
            return { text: 'always', arc: 'always' };
        case RADIUS:
            return { text: 'always', arc: 'always' };
        case THETA2:
        case RADIUS2:
            return { arc: 'always' };
    }
}
function rangeType(channel) {
    switch (channel) {
        case X:
        case Y:
        case THETA:
        case RADIUS:
        case XOFFSET:
        case YOFFSET:
        case SIZE:
        case ANGLE:
        case STROKEWIDTH:
        case OPACITY:
        case FILLOPACITY:
        case STROKEOPACITY:
        // X2 and Y2 use X and Y scales, so they similarly have continuous range. [falls through]
        case X2:
        case Y2:
        case THETA2:
        case RADIUS2:
            return undefined;
        case FACET:
        case ROW:
        case COLUMN:
        case SHAPE:
        case STROKEDASH:
        // TEXT, TOOLTIP, URL, and HREF have no scale but have discrete output [falls through]
        case TEXT:
        case TOOLTIP:
        case HREF:
        case URL:
        case DESCRIPTION:
            return 'discrete';
        // Color can be either continuous or discrete, depending on scale type.
        case COLOR:
        case FILL:
        case STROKE:
            return 'flexible';
        // No scale, no range type.
        case LATITUDE:
        case LONGITUDE:
        case LATITUDE2:
        case LONGITUDE2:
        case DETAIL:
        case KEY:
        case ORDER:
            return undefined;
    }
}
//# sourceMappingURL=channel.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/aggregate.js


const AGGREGATE_OP_INDEX = {
    argmax: 1,
    argmin: 1,
    average: 1,
    count: 1,
    distinct: 1,
    product: 1,
    max: 1,
    mean: 1,
    median: 1,
    min: 1,
    missing: 1,
    q1: 1,
    q3: 1,
    ci0: 1,
    ci1: 1,
    stderr: 1,
    stdev: 1,
    stdevp: 1,
    sum: 1,
    valid: 1,
    values: 1,
    variance: 1,
    variancep: 1
};
const MULTIDOMAIN_SORT_OP_INDEX = {
    count: 1,
    min: 1,
    max: 1
};
function isArgminDef(a) {
    return !!a && !!a['argmin'];
}
function isArgmaxDef(a) {
    return !!a && !!a['argmax'];
}
function isAggregateOp(a) {
    return (0,vega_util_module/* isString */.Kg)(a) && !!AGGREGATE_OP_INDEX[a];
}
const COUNTING_OPS = new Set([
    'count',
    'valid',
    'missing',
    'distinct'
]);
function isCountingAggregateOp(aggregate) {
    return (0,vega_util_module/* isString */.Kg)(aggregate) && COUNTING_OPS.has(aggregate);
}
function isMinMaxOp(aggregate) {
    return (0,vega_util_module/* isString */.Kg)(aggregate) && contains(['min', 'max'], aggregate);
}
/** Additive-based aggregation operations. These can be applied to stack. */
const SUM_OPS = new Set([
    'count',
    'sum',
    'distinct',
    'valid',
    'missing'
]);
/**
 * Aggregation operators that always produce values within the range [domainMin, domainMax].
 */
const SHARED_DOMAIN_OPS = new Set([
    'mean',
    'average',
    'median',
    'q1',
    'q3',
    'min',
    'max'
]);
//# sourceMappingURL=aggregate.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/bin.js




/**
 * Create a key for the bin configuration. Not for prebinned bin.
 */
function binToString(bin) {
    if ((0,vega_util_module/* isBoolean */.Lm)(bin)) {
        bin = normalizeBin(bin, undefined);
    }
    return ('bin' +
        keys(bin)
            .map(p => (isParameterExtent(bin[p]) ? varName(`_${p}_${entries(bin[p])}`) : varName(`_${p}_${bin[p]}`)))
            .join(''));
}
/**
 * Vega-Lite should bin the data.
 */
function isBinning(bin) {
    return bin === true || (isBinParams(bin) && !bin.binned);
}
/**
 * The data is already binned and so Vega-Lite should not bin it again.
 */
function isBinned(bin) {
    return bin === 'binned' || (isBinParams(bin) && bin.binned === true);
}
function isBinParams(bin) {
    return (0,vega_util_module/* isObject */.Gv)(bin);
}
function isParameterExtent(extent) {
    return extent === null || extent === void 0 ? void 0 : extent['param'];
}
function autoMaxBins(channel) {
    switch (channel) {
        case ROW:
        case COLUMN:
        case SIZE:
        case COLOR:
        case FILL:
        case STROKE:
        case STROKEWIDTH:
        case OPACITY:
        case FILLOPACITY:
        case STROKEOPACITY:
        // Facets and Size shouldn't have too many bins
        // We choose 6 like shape to simplify the rule [falls through]
        case SHAPE:
            return 6; // Vega's "shape" has 6 distinct values
        case STROKEDASH:
            return 4; // We only provide 5 different stroke dash values (but 4 is more effective)
        default:
            return 10;
    }
}
//# sourceMappingURL=bin.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/expr.js


function isExprRef(o) {
    return !!(o === null || o === void 0 ? void 0 : o.expr);
}
function replaceExprRef(index) {
    const props = keys(index || {});
    const newIndex = {};
    for (const prop of props) {
        newIndex[prop] = signalRefOrValue(index[prop]);
    }
    return newIndex;
}
//# sourceMappingURL=expr.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/title.js
var title_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};


function extractTitleConfig(titleConfig) {
    const { 
    // These are non-mark title config that need to be hardcoded
    anchor, frame, offset, orient, angle, limit, 
    // color needs to be redirect to fill
    color, 
    // subtitle properties
    subtitleColor, subtitleFont, subtitleFontSize, subtitleFontStyle, subtitleFontWeight, subtitleLineHeight, subtitlePadding } = titleConfig, 
    // The rest are mark config.
    rest = title_rest(titleConfig, ["anchor", "frame", "offset", "orient", "angle", "limit", "color", "subtitleColor", "subtitleFont", "subtitleFontSize", "subtitleFontStyle", "subtitleFontWeight", "subtitleLineHeight", "subtitlePadding"]);
    const titleMarkConfig = Object.assign(Object.assign({}, rest), (color ? { fill: color } : {}));
    // These are non-mark title config that need to be hardcoded
    const nonMarkTitleProperties = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (anchor ? { anchor } : {})), (frame ? { frame } : {})), (offset ? { offset } : {})), (orient ? { orient } : {})), (angle !== undefined ? { angle } : {})), (limit !== undefined ? { limit } : {}));
    // subtitle part can stay in config.title since header titles do not use subtitle
    const subtitle = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (subtitleColor ? { subtitleColor } : {})), (subtitleFont ? { subtitleFont } : {})), (subtitleFontSize ? { subtitleFontSize } : {})), (subtitleFontStyle ? { subtitleFontStyle } : {})), (subtitleFontWeight ? { subtitleFontWeight } : {})), (subtitleLineHeight ? { subtitleLineHeight } : {})), (subtitlePadding ? { subtitlePadding } : {}));
    const subtitleMarkConfig = pick(titleConfig, ['align', 'baseline', 'dx', 'dy', 'limit']);
    return { titleMarkConfig, subtitleMarkConfig, nonMarkTitleProperties, subtitle };
}
function isText(v) {
    return (0,vega_util_module/* isString */.Kg)(v) || ((0,vega_util_module/* isArray */.cy)(v) && (0,vega_util_module/* isString */.Kg)(v[0]));
}
//# sourceMappingURL=title.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/vega.schema.js


function isSignalRef(o) {
    return !!(o === null || o === void 0 ? void 0 : o.signal);
}
function isVgRangeStep(range) {
    return !!range['step'];
}
function isDataRefUnionedDomain(domain) {
    if (!(0,vega_util_module/* isArray */.cy)(domain)) {
        return 'fields' in domain && !('data' in domain);
    }
    return false;
}
function isFieldRefUnionDomain(domain) {
    if (!(0,vega_util_module/* isArray */.cy)(domain)) {
        return 'fields' in domain && 'data' in domain;
    }
    return false;
}
function isDataRefDomain(domain) {
    if (!(0,vega_util_module/* isArray */.cy)(domain)) {
        return 'field' in domain && 'data' in domain;
    }
    return false;
}
const VG_MARK_CONFIG_INDEX = {
    aria: 1,
    description: 1,
    ariaRole: 1,
    ariaRoleDescription: 1,
    blend: 1,
    opacity: 1,
    fill: 1,
    fillOpacity: 1,
    stroke: 1,
    strokeCap: 1,
    strokeWidth: 1,
    strokeOpacity: 1,
    strokeDash: 1,
    strokeDashOffset: 1,
    strokeJoin: 1,
    strokeOffset: 1,
    strokeMiterLimit: 1,
    startAngle: 1,
    endAngle: 1,
    padAngle: 1,
    innerRadius: 1,
    outerRadius: 1,
    size: 1,
    shape: 1,
    interpolate: 1,
    tension: 1,
    orient: 1,
    align: 1,
    baseline: 1,
    text: 1,
    dir: 1,
    dx: 1,
    dy: 1,
    ellipsis: 1,
    limit: 1,
    radius: 1,
    theta: 1,
    angle: 1,
    font: 1,
    fontSize: 1,
    fontWeight: 1,
    fontStyle: 1,
    lineBreak: 1,
    lineHeight: 1,
    cursor: 1,
    href: 1,
    tooltip: 1,
    cornerRadius: 1,
    cornerRadiusTopLeft: 1,
    cornerRadiusTopRight: 1,
    cornerRadiusBottomLeft: 1,
    cornerRadiusBottomRight: 1,
    aspect: 1,
    width: 1,
    height: 1,
    url: 1,
    smooth: 1
    // commented below are vg channel that do not have mark config.
    // x: 1,
    // y: 1,
    // x2: 1,
    // y2: 1,
    // xc'|'yc'
    // clip: 1,
    // path: 1,
    // url: 1,
};
const VG_MARK_CONFIGS = keys(VG_MARK_CONFIG_INDEX);
const VG_MARK_INDEX = {
    arc: 1,
    area: 1,
    group: 1,
    image: 1,
    line: 1,
    path: 1,
    rect: 1,
    rule: 1,
    shape: 1,
    symbol: 1,
    text: 1,
    trail: 1
};
// Vega's cornerRadius channels.
const VG_CORNERRADIUS_CHANNELS = [
    'cornerRadius',
    'cornerRadiusTopLeft',
    'cornerRadiusTopRight',
    'cornerRadiusBottomLeft',
    'cornerRadiusBottomRight'
];
//# sourceMappingURL=vega.schema.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/common.js
var common_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};






const BIN_RANGE_DELIMITER = ' \u2013 ';
function signalOrValueRefWithCondition(val) {
    const condition = (0,vega_util_module/* isArray */.cy)(val.condition)
        ? val.condition.map(conditionalSignalRefOrValue)
        : conditionalSignalRefOrValue(val.condition);
    return Object.assign(Object.assign({}, signalRefOrValue(val)), { condition });
}
function signalRefOrValue(value) {
    if (isExprRef(value)) {
        const { expr } = value, rest = common_rest(value, ["expr"]);
        return Object.assign({ signal: expr }, rest);
    }
    return value;
}
function conditionalSignalRefOrValue(value) {
    if (isExprRef(value)) {
        const { expr } = value, rest = common_rest(value, ["expr"]);
        return Object.assign({ signal: expr }, rest);
    }
    return value;
}
function signalOrValueRef(value) {
    if (isExprRef(value)) {
        const { expr } = value, rest = common_rest(value, ["expr"]);
        return Object.assign({ signal: expr }, rest);
    }
    if (isSignalRef(value)) {
        return value;
    }
    return value !== undefined ? { value } : undefined;
}
function exprFromSignalRefOrValue(ref) {
    if (isSignalRef(ref)) {
        return ref.signal;
    }
    return (0,vega_util_module/* stringValue */.r$)(ref);
}
function exprFromValueRefOrSignalRef(ref) {
    if (isSignalRef(ref)) {
        return ref.signal;
    }
    return (0,vega_util_module/* stringValue */.r$)(ref.value);
}
function signalOrStringValue(v) {
    if (isSignalRef(v)) {
        return v.signal;
    }
    return v == null ? null : (0,vega_util_module/* stringValue */.r$)(v);
}
function applyMarkConfig(e, model, propsList) {
    for (const property of propsList) {
        const value = getMarkConfig(property, model.markDef, model.config);
        if (value !== undefined) {
            e[property] = signalOrValueRef(value);
        }
    }
    return e;
}
function getStyles(mark) {
    var _a;
    return [].concat(mark.type, (_a = mark.style) !== null && _a !== void 0 ? _a : []);
}
function getMarkPropOrConfig(channel, mark, config, opt = {}) {
    const { vgChannel, ignoreVgConfig } = opt;
    if (vgChannel && mark[vgChannel] !== undefined) {
        return mark[vgChannel];
    }
    else if (mark[channel] !== undefined) {
        return mark[channel];
    }
    else if (ignoreVgConfig && (!vgChannel || vgChannel === channel)) {
        return undefined;
    }
    return getMarkConfig(channel, mark, config, opt);
}
/**
 * Return property value from style or mark specific config property if exists.
 * Otherwise, return general mark specific config.
 */
function getMarkConfig(channel, mark, config, { vgChannel } = {}) {
    return getFirstDefined(
    // style config has highest precedence
    vgChannel ? getMarkStyleConfig(channel, mark, config.style) : undefined, getMarkStyleConfig(channel, mark, config.style), 
    // then mark-specific config
    vgChannel ? config[mark.type][vgChannel] : undefined, config[mark.type][channel], // Need to cast because MarkDef doesn't perfectly match with AnyMarkConfig, but if the type isn't available, we'll get nothing here, which is fine
    // If there is vgChannel, skip vl channel.
    // For example, vl size for text is vg fontSize, but config.mark.size is only for point size.
    vgChannel ? config.mark[vgChannel] : config.mark[channel] // Need to cast for the same reason as above
    );
}
function getMarkStyleConfig(prop, mark, styleConfigIndex) {
    return getStyleConfig(prop, getStyles(mark), styleConfigIndex);
}
function getStyleConfig(p, styles, styleConfigIndex) {
    styles = (0,vega_util_module/* array */.YO)(styles);
    let value;
    for (const style of styles) {
        const styleConfig = styleConfigIndex[style];
        if (styleConfig && styleConfig[p] !== undefined) {
            value = styleConfig[p];
        }
    }
    return value;
}
/**
 * Return Vega sort parameters (tuple of field and order).
 */
function sortParams(orderDef, fieldRefOption) {
    return (0,vega_util_module/* array */.YO)(orderDef).reduce((s, orderChannelDef) => {
        var _a;
        s.field.push(vgField(orderChannelDef, fieldRefOption));
        s.order.push((_a = orderChannelDef.sort) !== null && _a !== void 0 ? _a : 'ascending');
        return s;
    }, { field: [], order: [] });
}
function mergeTitleFieldDefs(f1, f2) {
    const merged = [...f1];
    f2.forEach(fdToMerge => {
        for (const fieldDef1 of merged) {
            // If already exists, no need to append to merged array
            if (deepEqual(fieldDef1, fdToMerge)) {
                return;
            }
        }
        merged.push(fdToMerge);
    });
    return merged;
}
function mergeTitle(title1, title2) {
    if (deepEqual(title1, title2) || !title2) {
        // if titles are the same or title2 is falsy
        return title1;
    }
    else if (!title1) {
        // if title1 is falsy
        return title2;
    }
    else {
        return [...(0,vega_util_module/* array */.YO)(title1), ...(0,vega_util_module/* array */.YO)(title2)].join(', ');
    }
}
function mergeTitleComponent(v1, v2) {
    const v1Val = v1.value;
    const v2Val = v2.value;
    if (v1Val == null || v2Val === null) {
        return {
            explicit: v1.explicit,
            value: null
        };
    }
    else if ((isText(v1Val) || isSignalRef(v1Val)) && (isText(v2Val) || isSignalRef(v2Val))) {
        return {
            explicit: v1.explicit,
            value: mergeTitle(v1Val, v2Val)
        };
    }
    else if (isText(v1Val) || isSignalRef(v1Val)) {
        return {
            explicit: v1.explicit,
            value: v1Val
        };
    }
    else if (isText(v2Val) || isSignalRef(v2Val)) {
        return {
            explicit: v1.explicit,
            value: v2Val
        };
    }
    else if (!isText(v1Val) && !isSignalRef(v1Val) && !isText(v2Val) && !isSignalRef(v2Val)) {
        return {
            explicit: v1.explicit,
            value: mergeTitleFieldDefs(v1Val, v2Val)
        };
    }
    /* istanbul ignore next: Condition should not happen -- only for warning in development. */
    throw new Error('It should never reach here');
}
//# sourceMappingURL=common.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/log/message.js


function invalidSpec(spec) {
    return `Invalid specification ${stringify(spec)}. Make sure the specification includes at least one of the following properties: "mark", "layer", "facet", "hconcat", "vconcat", "concat", or "repeat".`;
}
// FIT
const FIT_NON_SINGLE = 'Autosize "fit" only works for single views and layered views.';
function containerSizeNonSingle(name) {
    const uName = name == 'width' ? 'Width' : 'Height';
    return `${uName} "container" only works for single views and layered views.`;
}
function containerSizeNotCompatibleWithAutosize(name) {
    const uName = name == 'width' ? 'Width' : 'Height';
    const fitDirection = name == 'width' ? 'x' : 'y';
    return `${uName} "container" only works well with autosize "fit" or "fit-${fitDirection}".`;
}
function droppingFit(channel) {
    return channel
        ? `Dropping "fit-${channel}" because spec has discrete ${getSizeChannel(channel)}.`
        : `Dropping "fit" because spec has discrete size.`;
}
// VIEW SIZE
function unknownField(channel) {
    return `Unknown field for ${channel}. Cannot calculate view size.`;
}
// SELECTION
function cannotProjectOnChannelWithoutField(channel) {
    return `Cannot project a selection on encoding channel "${channel}", which has no field.`;
}
function cannotProjectAggregate(channel, aggregate) {
    return `Cannot project a selection on encoding channel "${channel}" as it uses an aggregate function ("${aggregate}").`;
}
function nearestNotSupportForContinuous(mark) {
    return `The "nearest" transform is not supported for ${mark} marks.`;
}
function selectionNotSupported(mark) {
    return `Selection not supported for ${mark} yet.`;
}
function selectionNotFound(name) {
    return `Cannot find a selection named "${name}".`;
}
const SCALE_BINDINGS_CONTINUOUS = 'Scale bindings are currently only supported for scales with unbinned, continuous domains.';
const LEGEND_BINDINGS_MUST_HAVE_PROJECTION = 'Legend bindings are only supported for selections over an individual field or encoding channel.';
function cannotLookupVariableParameter(name) {
    return `Lookups can only be performed on selection parameters. "${name}" is a variable parameter.`;
}
function noSameUnitLookup(name) {
    return (`Cannot define and lookup the "${name}" selection in the same view. ` +
        `Try moving the lookup into a second, layered view?`);
}
const NEEDS_SAME_SELECTION = 'The same selection must be used to override scale domains in a layered view.';
const INTERVAL_INITIALIZED_WITH_X_Y = 'Interval selections should be initialized using "x" and/or "y" keys.';
// REPEAT
function noSuchRepeatedValue(field) {
    return `Unknown repeated value "${field}".`;
}
function columnsNotSupportByRowCol(type) {
    return `The "columns" property cannot be used when "${type}" has nested row/column.`;
}
// CONCAT / REPEAT
const CONCAT_CANNOT_SHARE_AXIS = 'Axes cannot be shared in concatenated or repeated views yet (https://github.com/vega/vega-lite/issues/2415).';
// DATA
function unrecognizedParse(p) {
    return `Unrecognized parse "${p}".`;
}
function differentParse(field, local, ancestor) {
    return `An ancestor parsed field "${field}" as ${ancestor} but a child wants to parse the field as ${local}.`;
}
const ADD_SAME_CHILD_TWICE = 'Attempt to add the same child twice.';
// TRANSFORMS
function invalidTransformIgnored(transform) {
    return `Ignoring an invalid transform: ${stringify(transform)}.`;
}
const NO_FIELDS_NEEDS_AS = 'If "from.fields" is not specified, "as" has to be a string that specifies the key to be used for the data from the secondary source.';
// ENCODING & FACET
function customFormatTypeNotAllowed(channel) {
    return `Config.customFormatTypes is not true, thus custom format type and format for channel ${channel} are dropped.`;
}
function projectionOverridden(opt) {
    const { parentProjection, projection } = opt;
    return `Layer's shared projection ${stringify(parentProjection)} is overridden by a child projection ${stringify(projection)}.`;
}
const REPLACE_ANGLE_WITH_THETA = 'Arc marks uses theta channel rather than angle, replacing angle with theta.';
function offsetNestedInsideContinuousPositionScaleDropped(mainChannel) {
    return `${mainChannel}Offset dropped because ${mainChannel} is continuous`;
}
function replaceOffsetWithMainChannel(mainChannel) {
    return `There is no ${mainChannel} encoding. Replacing ${mainChannel}Offset encoding as ${mainChannel}.`;
}
function primitiveChannelDef(channel, type, value) {
    return `Channel ${channel} is a ${type}. Converted to {value: ${stringify(value)}}.`;
}
function invalidFieldType(type) {
    return `Invalid field type "${type}".`;
}
function invalidFieldTypeForCountAggregate(type, aggregate) {
    return `Invalid field type "${type}" for aggregate: "${aggregate}", using "quantitative" instead.`;
}
function invalidAggregate(aggregate) {
    return `Invalid aggregation operator "${aggregate}".`;
}
function missingFieldType(channel, newType) {
    return `Missing type for channel "${channel}", using "${newType}" instead.`;
}
function droppingColor(type, opt) {
    const { fill, stroke } = opt;
    return `Dropping color ${type} as the plot also has ${fill && stroke ? 'fill and stroke' : fill ? 'fill' : 'stroke'}.`;
}
function relativeBandSizeNotSupported(sizeChannel) {
    return `Position range does not support relative band size for ${sizeChannel}.`;
}
function emptyFieldDef(fieldDef, channel) {
    return `Dropping ${stringify(fieldDef)} from channel "${channel}" since it does not contain any data field, datum, value, or signal.`;
}
const LINE_WITH_VARYING_SIZE = 'Line marks cannot encode size with a non-groupby field. You may want to use trail marks instead.';
function incompatibleChannel(channel, markOrFacet, when) {
    return `${channel} dropped as it is incompatible with "${markOrFacet}"${when ? ` when ${when}` : ''}.`;
}
function offsetEncodingScaleIgnored(channel) {
    return `${channel} encoding has no scale, so specified scale is ignored.`;
}
function invalidEncodingChannel(channel) {
    return `${channel}-encoding is dropped as ${channel} is not a valid encoding channel.`;
}
function channelShouldBeDiscrete(channel) {
    return `${channel} encoding should be discrete (ordinal / nominal / binned).`;
}
function channelShouldBeDiscreteOrDiscretizing(channel) {
    return `${channel} encoding should be discrete (ordinal / nominal / binned) or use a discretizing scale (e.g. threshold).`;
}
function facetChannelDropped(channels) {
    return `Facet encoding dropped as ${channels.join(' and ')} ${channels.length > 1 ? 'are' : 'is'} also specified.`;
}
function discreteChannelCannotEncode(channel, type) {
    return `Using discrete channel "${channel}" to encode "${type}" field can be misleading as it does not encode ${type === 'ordinal' ? 'order' : 'magnitude'}.`;
}
// MARK
function rangeMarkAlignmentCannotBeExpression(align) {
    return `The ${align} for range marks cannot be an expression`;
}
function lineWithRange(hasX2, hasY2) {
    const channels = hasX2 && hasY2 ? 'x2 and y2' : hasX2 ? 'x2' : 'y2';
    return `Line mark is for continuous lines and thus cannot be used with ${channels}. We will use the rule mark (line segments) instead.`;
}
function orientOverridden(original, actual) {
    return `Specified orient "${original}" overridden with "${actual}".`;
}
// SCALE
const CANNOT_UNION_CUSTOM_DOMAIN_WITH_FIELD_DOMAIN = 'Custom domain scale cannot be unioned with default field-based domain.';
function cannotUseScalePropertyWithNonColor(prop) {
    return `Cannot use the scale property "${prop}" with non-color channel.`;
}
function cannotUseRelativeBandSizeWithNonBandScale(scaleType) {
    return `Cannot use the relative band size with ${scaleType} scale.`;
}
function unaggregateDomainHasNoEffectForRawField(fieldDef) {
    return `Using unaggregated domain with raw field has no effect (${stringify(fieldDef)}).`;
}
function unaggregateDomainWithNonSharedDomainOp(aggregate) {
    return `Unaggregated domain not applicable for "${aggregate}" since it produces values outside the origin domain of the source data.`;
}
function unaggregatedDomainWithLogScale(fieldDef) {
    return `Unaggregated domain is currently unsupported for log scale (${stringify(fieldDef)}).`;
}
function cannotApplySizeToNonOrientedMark(mark) {
    return `Cannot apply size to non-oriented mark "${mark}".`;
}
function scaleTypeNotWorkWithChannel(channel, scaleType, defaultScaleType) {
    return `Channel "${channel}" does not work with "${scaleType}" scale. We are using "${defaultScaleType}" scale instead.`;
}
function scaleTypeNotWorkWithFieldDef(scaleType, defaultScaleType) {
    return `FieldDef does not work with "${scaleType}" scale. We are using "${defaultScaleType}" scale instead.`;
}
function scalePropertyNotWorkWithScaleType(scaleType, propName, channel) {
    return `${channel}-scale's "${propName}" is dropped as it does not work with ${scaleType} scale.`;
}
function scaleTypeNotWorkWithMark(mark, scaleType) {
    return `Scale type "${scaleType}" does not work with mark "${mark}".`;
}
function stepDropped(channel) {
    return `The step for "${channel}" is dropped because the ${channel === 'width' ? 'x' : 'y'} is continuous.`;
}
function mergeConflictingProperty(property, propertyOf, v1, v2) {
    return `Conflicting ${propertyOf.toString()} property "${property.toString()}" (${stringify(v1)} and ${stringify(v2)}). Using ${stringify(v1)}.`;
}
function mergeConflictingDomainProperty(property, propertyOf, v1, v2) {
    return `Conflicting ${propertyOf.toString()} property "${property.toString()}" (${stringify(v1)} and ${stringify(v2)}). Using the union of the two domains.`;
}
function independentScaleMeansIndependentGuide(channel) {
    return `Setting the scale to be independent for "${channel}" means we also have to set the guide (axis or legend) to be independent.`;
}
function domainSortDropped(sort) {
    return `Dropping sort property ${stringify(sort)} as unioned domains only support boolean or op "count", "min", and "max".`;
}
const MORE_THAN_ONE_SORT = 'Domains that should be unioned has conflicting sort properties. Sort will be set to true.';
const FACETED_INDEPENDENT_DIFFERENT_SOURCES = 'Detected faceted independent scales that union domain of multiple fields from different data sources. We will use the first field. The result view size may be incorrect.';
const FACETED_INDEPENDENT_SAME_FIELDS_DIFFERENT_SOURCES = 'Detected faceted independent scales that union domain of the same fields from different source. We will assume that this is the same field from a different fork of the same data source. However, if this is not the case, the result view size may be incorrect.';
const FACETED_INDEPENDENT_SAME_SOURCE = 'Detected faceted independent scales that union domain of multiple fields from the same data source. We will use the first field. The result view size may be incorrect.';
// AXIS
const INVALID_CHANNEL_FOR_AXIS = 'Invalid channel for axis.';
// STACK
function cannotStackRangedMark(channel) {
    return `Cannot stack "${channel}" if there is already "${channel}2".`;
}
function cannotStackNonLinearScale(scaleType) {
    return `Cannot stack non-linear scale (${scaleType}).`;
}
function stackNonSummativeAggregate(aggregate) {
    return `Stacking is applied even though the aggregate function is non-summative ("${aggregate}").`;
}
// TIMEUNIT
function invalidTimeUnit(unitName, value) {
    return `Invalid ${unitName}: ${stringify(value)}.`;
}
function droppedDay(d) {
    return `Dropping day from datetime ${stringify(d)} as day cannot be combined with other units.`;
}
function errorBarCenterAndExtentAreNotNeeded(center, extent) {
    return `${extent ? 'extent ' : ''}${extent && center ? 'and ' : ''}${center ? 'center ' : ''}${extent && center ? 'are ' : 'is '}not needed when data are aggregated.`;
}
function errorBarCenterIsUsedWithWrongExtent(center, extent, mark) {
    return `${center} is not usually used with ${extent} for ${mark}.`;
}
function errorBarContinuousAxisHasCustomizedAggregate(aggregate, compositeMark) {
    return `Continuous axis should not have customized aggregation function ${aggregate}; ${compositeMark} already agregates the axis.`;
}
function errorBand1DNotSupport(property) {
    return `1D error band does not support ${property}.`;
}
// CHANNEL
function channelRequiredForBinned(channel) {
    return `Channel ${channel} is required for "binned" bin.`;
}
function channelShouldNotBeUsedForBinned(channel) {
    return `Channel ${channel} should not be used with "binned" bin.`;
}
function domainRequiredForThresholdScale(channel) {
    return `Domain for ${channel} is required for threshold scale.`;
}
//# sourceMappingURL=message.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/log/index.js
/**
 * Vega-Lite's singleton logger utility.
 */
var __classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LocalLogger_level;



/**
 * Main (default) Vega Logger instance for Vega-Lite.
 */
const main = (0,vega_util_module/* logger */.vF)(vega_util_module/* Warn */.P$);
let current = main;
/**
 * Logger tool for checking if the code throws correct warning.
 */
class LocalLogger {
    constructor() {
        this.warns = [];
        this.infos = [];
        this.debugs = [];
        _LocalLogger_level.set(this, Warn);
    }
    level(_) {
        if (_) {
            __classPrivateFieldSet(this, _LocalLogger_level, _, "f");
            return this;
        }
        return __classPrivateFieldGet(this, _LocalLogger_level, "f");
    }
    warn(...args) {
        if (__classPrivateFieldGet(this, _LocalLogger_level, "f") >= Warn)
            this.warns.push(...args);
        return this;
    }
    info(...args) {
        if (__classPrivateFieldGet(this, _LocalLogger_level, "f") >= Info)
            this.infos.push(...args);
        return this;
    }
    debug(...args) {
        if (__classPrivateFieldGet(this, _LocalLogger_level, "f") >= Debug)
            this.debugs.push(...args);
        return this;
    }
    error(...args) {
        if (__classPrivateFieldGet(this, _LocalLogger_level, "f") >= ErrorLevel)
            throw Error(...args);
        return this;
    }
}
_LocalLogger_level = new WeakMap();
function wrap(f) {
    return () => {
        current = new LocalLogger();
        f(current);
        log_reset();
    };
}
/**
 * Set the singleton logger to be a custom logger.
 */
function set(newLogger) {
    current = newLogger;
    return current;
}
/**
 * Reset the main logger to use the default Vega Logger.
 */
function log_reset() {
    current = main;
    return current;
}
function log_error(...args) {
    current.error(...args);
}
function warn(...args) {
    current.warn(...args);
}
function info(...args) {
    current.info(...args);
}
function debug(...args) {
    current.debug(...args);
}
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/datetime.js
// DateTime definition object




function isDateTime(o) {
    if (o && (0,vega_util_module/* isObject */.Gv)(o)) {
        for (const part of TIMEUNIT_PARTS) {
            if (part in o) {
                return true;
            }
        }
    }
    return false;
}
const MONTHS = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december'
];
const SHORT_MONTHS = MONTHS.map(m => m.substr(0, 3));
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const SHORT_DAYS = DAYS.map(d => d.substr(0, 3));
function normalizeQuarter(q) {
    if (isNumeric(q)) {
        q = +q;
    }
    if ((0,vega_util_module/* isNumber */.Et)(q)) {
        if (q > 4) {
            warn(invalidTimeUnit('quarter', q));
        }
        // We accept 1-based quarter, so need to readjust to 0-based quarter
        return q - 1;
    }
    else {
        // Invalid quarter
        throw new Error(invalidTimeUnit('quarter', q));
    }
}
function normalizeMonth(m) {
    if (isNumeric(m)) {
        m = +m;
    }
    if ((0,vega_util_module/* isNumber */.Et)(m)) {
        // We accept 1-based month, so need to readjust to 0-based month
        return m - 1;
    }
    else {
        const lowerM = m.toLowerCase();
        const monthIndex = MONTHS.indexOf(lowerM);
        if (monthIndex !== -1) {
            return monthIndex; // 0 for january, ...
        }
        const shortM = lowerM.substr(0, 3);
        const shortMonthIndex = SHORT_MONTHS.indexOf(shortM);
        if (shortMonthIndex !== -1) {
            return shortMonthIndex;
        }
        // Invalid month
        throw new Error(invalidTimeUnit('month', m));
    }
}
function normalizeDay(d) {
    if (isNumeric(d)) {
        d = +d;
    }
    if ((0,vega_util_module/* isNumber */.Et)(d)) {
        // mod so that this can be both 0-based where 0 = sunday
        // and 1-based where 7=sunday
        return d % 7;
    }
    else {
        const lowerD = d.toLowerCase();
        const dayIndex = DAYS.indexOf(lowerD);
        if (dayIndex !== -1) {
            return dayIndex; // 0 for january, ...
        }
        const shortD = lowerD.substr(0, 3);
        const shortDayIndex = SHORT_DAYS.indexOf(shortD);
        if (shortDayIndex !== -1) {
            return shortDayIndex;
        }
        // Invalid day
        throw new Error(invalidTimeUnit('day', d));
    }
}
/**
 * @param d the date.
 * @param normalize whether to normalize quarter, month, day. This should probably be true if d is a DateTime.
 * @returns array of date time parts [year, month, day, hours, minutes, seconds, milliseconds]
 */
function dateTimeParts(d, normalize) {
    const parts = [];
    if (normalize && d.day !== undefined) {
        if (keys(d).length > 1) {
            warn(droppedDay(d));
            d = duplicate(d);
            delete d.day;
        }
    }
    if (d.year !== undefined) {
        parts.push(d.year);
    }
    else {
        // Just like Vega's timeunit transform, set default year to 2012, so domain conversion will be compatible with Vega
        // Note: 2012 is a leap year (and so the date February 29 is respected) that begins on a Sunday (and so days of the week will order properly at the beginning of the year).
        parts.push(2012);
    }
    if (d.month !== undefined) {
        const month = normalize ? normalizeMonth(d.month) : d.month;
        parts.push(month);
    }
    else if (d.quarter !== undefined) {
        const quarter = normalize ? normalizeQuarter(d.quarter) : d.quarter;
        parts.push((0,vega_util_module/* isNumber */.Et)(quarter) ? quarter * 3 : `${quarter}*3`);
    }
    else {
        parts.push(0); // months start at zero in JS
    }
    if (d.date !== undefined) {
        parts.push(d.date);
    }
    else if (d.day !== undefined) {
        // HACK: Day only works as a standalone unit
        // This is only correct because we always set year to 2006 for day
        const day = normalize ? normalizeDay(d.day) : d.day;
        parts.push((0,vega_util_module/* isNumber */.Et)(day) ? day + 1 : `${day}+1`);
    }
    else {
        parts.push(1); // Date starts at 1 in JS
    }
    // Note: can't use TimeUnit enum here as importing it will create
    // circular dependency problem!
    for (const timeUnit of ['hours', 'minutes', 'seconds', 'milliseconds']) {
        const unit = d[timeUnit];
        parts.push(typeof unit === 'undefined' ? 0 : unit);
    }
    return parts;
}
/**
 * Return Vega expression for a date time.
 *
 * @param d the date time.
 * @returns the Vega expression.
 */
function dateTimeToExpr(d) {
    const parts = dateTimeParts(d, true);
    const string = parts.join(', ');
    if (d.utc) {
        return `utc(${string})`;
    }
    else {
        return `datetime(${string})`;
    }
}
/**
 * Return Vega expression for a date time expression.
 *
 * @param d the internal date time object with expression.
 * @returns the Vega expression.
 */
function dateTimeExprToExpr(d) {
    const parts = dateTimeParts(d, false);
    const string = parts.join(', ');
    if (d.utc) {
        return `utc(${string})`;
    }
    else {
        return `datetime(${string})`;
    }
}
/**
 * @param d the date time.
 * @returns the timestamp.
 */
function dateTimeToTimestamp(d) {
    const parts = dateTimeParts(d, true);
    if (d.utc) {
        return +new Date(Date.UTC(...parts));
    }
    else {
        return +new Date(...parts);
    }
}
//# sourceMappingURL=datetime.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/timeunit.js
var timeunit_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};



/** Time Unit that only corresponds to only one part of Date objects. */
const LOCAL_SINGLE_TIMEUNIT_INDEX = {
    year: 1,
    quarter: 1,
    month: 1,
    week: 1,
    day: 1,
    dayofyear: 1,
    date: 1,
    hours: 1,
    minutes: 1,
    seconds: 1,
    milliseconds: 1
};
const TIMEUNIT_PARTS = keys(LOCAL_SINGLE_TIMEUNIT_INDEX);
function isLocalSingleTimeUnit(timeUnit) {
    return !!LOCAL_SINGLE_TIMEUNIT_INDEX[timeUnit];
}
const UTC_SINGLE_TIMEUNIT_INDEX = {
    utcyear: 1,
    utcquarter: 1,
    utcmonth: 1,
    utcweek: 1,
    utcday: 1,
    utcdayofyear: 1,
    utcdate: 1,
    utchours: 1,
    utcminutes: 1,
    utcseconds: 1,
    utcmilliseconds: 1
};
const LOCAL_MULTI_TIMEUNIT_INDEX = {
    yearquarter: 1,
    yearquartermonth: 1,
    yearmonth: 1,
    yearmonthdate: 1,
    yearmonthdatehours: 1,
    yearmonthdatehoursminutes: 1,
    yearmonthdatehoursminutesseconds: 1,
    yearweek: 1,
    yearweekday: 1,
    yearweekdayhours: 1,
    yearweekdayhoursminutes: 1,
    yearweekdayhoursminutesseconds: 1,
    yeardayofyear: 1,
    quartermonth: 1,
    monthdate: 1,
    monthdatehours: 1,
    monthdatehoursminutes: 1,
    monthdatehoursminutesseconds: 1,
    weekday: 1,
    weeksdayhours: 1,
    weekdayhoursminutes: 1,
    weekdayhoursminutesseconds: 1,
    dayhours: 1,
    dayhoursminutes: 1,
    dayhoursminutesseconds: 1,
    hoursminutes: 1,
    hoursminutesseconds: 1,
    minutesseconds: 1,
    secondsmilliseconds: 1
};
const UTC_MULTI_TIMEUNIT_INDEX = {
    utcyearquarter: 1,
    utcyearquartermonth: 1,
    utcyearmonth: 1,
    utcyearmonthdate: 1,
    utcyearmonthdatehours: 1,
    utcyearmonthdatehoursminutes: 1,
    utcyearmonthdatehoursminutesseconds: 1,
    utcyearweek: 1,
    utcyearweekday: 1,
    utcyearweekdayhours: 1,
    utcyearweekdayhoursminutes: 1,
    utcyearweekdayhoursminutesseconds: 1,
    utcyeardayofyear: 1,
    utcquartermonth: 1,
    utcmonthdate: 1,
    utcmonthdatehours: 1,
    utcmonthdatehoursminutes: 1,
    utcmonthdatehoursminutesseconds: 1,
    utcweekday: 1,
    utcweeksdayhours: 1,
    utcweekdayhoursminutes: 1,
    utcweekdayhoursminutesseconds: 1,
    utcdayhours: 1,
    utcdayhoursminutes: 1,
    utcdayhoursminutesseconds: 1,
    utchoursminutes: 1,
    utchoursminutesseconds: 1,
    utcminutesseconds: 1,
    utcsecondsmilliseconds: 1
};
function isUTCTimeUnit(t) {
    return t.startsWith('utc');
}
function getLocalTimeUnit(t) {
    return t.substr(3);
}
// In order of increasing specificity
const VEGALITE_TIMEFORMAT = {
    'year-month': '%b %Y ',
    'year-month-date': '%b %d, %Y '
};
function getTimeUnitParts(timeUnit) {
    return TIMEUNIT_PARTS.filter(part => containsTimeUnit(timeUnit, part));
}
/** Returns true if fullTimeUnit contains the timeUnit, false otherwise. */
function containsTimeUnit(fullTimeUnit, timeUnit) {
    const index = fullTimeUnit.indexOf(timeUnit);
    if (index < 0) {
        return false;
    }
    // exclude milliseconds
    if (index > 0 && timeUnit === 'seconds' && fullTimeUnit.charAt(index - 1) === 'i') {
        return false;
    }
    // exclude dayofyear
    if (fullTimeUnit.length > index + 3 && timeUnit === 'day' && fullTimeUnit.charAt(index + 3) === 'o') {
        return false;
    }
    if (index > 0 && timeUnit === 'year' && fullTimeUnit.charAt(index - 1) === 'f') {
        return false;
    }
    return true;
}
/**
 * Returns Vega expression for a given timeUnit and fieldRef
 */
function timeunit_fieldExpr(fullTimeUnit, field, { end } = { end: false }) {
    const fieldRef = accessPathWithDatum(field);
    const utc = isUTCTimeUnit(fullTimeUnit) ? 'utc' : '';
    function func(timeUnit) {
        if (timeUnit === 'quarter') {
            // quarter starting at 0 (0,3,6,9).
            return `(${utc}quarter(${fieldRef})-1)`;
        }
        else {
            return `${utc}${timeUnit}(${fieldRef})`;
        }
    }
    let lastTimeUnit;
    const dateExpr = {};
    for (const part of TIMEUNIT_PARTS) {
        if (containsTimeUnit(fullTimeUnit, part)) {
            dateExpr[part] = func(part);
            lastTimeUnit = part;
        }
    }
    if (end) {
        dateExpr[lastTimeUnit] += '+1';
    }
    return dateTimeExprToExpr(dateExpr);
}
function timeUnitSpecifierExpression(timeUnit) {
    if (!timeUnit) {
        return undefined;
    }
    const timeUnitParts = getTimeUnitParts(timeUnit);
    return `timeUnitSpecifier(${stringify(timeUnitParts)}, ${stringify(VEGALITE_TIMEFORMAT)})`;
}
/**
 * Returns the signal expression used for axis labels for a time unit.
 */
function formatExpression(timeUnit, field, isUTCScale) {
    if (!timeUnit) {
        return undefined;
    }
    const expr = timeUnitSpecifierExpression(timeUnit);
    // We only use utcFormat for utc scale
    // For utc time units, the data is already converted as a part of timeUnit transform.
    // Thus, utc time units should use timeFormat to avoid shifting the time twice.
    const utc = isUTCScale || isUTCTimeUnit(timeUnit);
    return `${utc ? 'utc' : 'time'}Format(${field}, ${expr})`;
}
function normalizeTimeUnit(timeUnit) {
    if (!timeUnit) {
        return undefined;
    }
    let params;
    if ((0,vega_util_module/* isString */.Kg)(timeUnit)) {
        params = {
            unit: timeUnit
        };
    }
    else if ((0,vega_util_module/* isObject */.Gv)(timeUnit)) {
        params = Object.assign(Object.assign({}, timeUnit), (timeUnit.unit ? { unit: timeUnit.unit } : {}));
    }
    if (isUTCTimeUnit(params.unit)) {
        params.utc = true;
        params.unit = getLocalTimeUnit(params.unit);
    }
    return params;
}
function timeUnitToString(tu) {
    const _a = normalizeTimeUnit(tu), { utc } = _a, rest = timeunit_rest(_a, ["utc"]);
    if (rest.unit) {
        return ((utc ? 'utc' : '') +
            keys(rest)
                .map(p => varName(`${p === 'unit' ? '' : `_${p}_`}${rest[p]}`))
                .join(''));
    }
    else {
        // when maxbins is specified instead of units
        return ((utc ? 'utc' : '') +
            'timeunit' +
            keys(rest)
                .map(p => varName(`_${p}_${rest[p]}`))
                .join(''));
    }
}
//# sourceMappingURL=timeunit.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/predicate.js





function isSelectionPredicate(predicate) {
    return predicate === null || predicate === void 0 ? void 0 : predicate['param'];
}
function isFieldEqualPredicate(predicate) {
    return !!(predicate === null || predicate === void 0 ? void 0 : predicate.field) && predicate.equal !== undefined;
}
function isFieldLTPredicate(predicate) {
    return !!(predicate === null || predicate === void 0 ? void 0 : predicate.field) && predicate.lt !== undefined;
}
function isFieldLTEPredicate(predicate) {
    return !!(predicate === null || predicate === void 0 ? void 0 : predicate.field) && predicate.lte !== undefined;
}
function isFieldGTPredicate(predicate) {
    return !!(predicate === null || predicate === void 0 ? void 0 : predicate.field) && predicate.gt !== undefined;
}
function isFieldGTEPredicate(predicate) {
    return !!(predicate === null || predicate === void 0 ? void 0 : predicate.field) && predicate.gte !== undefined;
}
function isFieldRangePredicate(predicate) {
    if (predicate === null || predicate === void 0 ? void 0 : predicate.field) {
        if ((0,vega_util_module/* isArray */.cy)(predicate.range) && predicate.range.length === 2) {
            return true;
        }
        else if (isSignalRef(predicate.range)) {
            return true;
        }
    }
    return false;
}
function isFieldOneOfPredicate(predicate) {
    return (!!(predicate === null || predicate === void 0 ? void 0 : predicate.field) && ((0,vega_util_module/* isArray */.cy)(predicate.oneOf) || (0,vega_util_module/* isArray */.cy)(predicate.in)) // backward compatibility
    );
}
function isFieldValidPredicate(predicate) {
    return !!(predicate === null || predicate === void 0 ? void 0 : predicate.field) && predicate.valid !== undefined;
}
function isFieldPredicate(predicate) {
    return (isFieldOneOfPredicate(predicate) ||
        isFieldEqualPredicate(predicate) ||
        isFieldRangePredicate(predicate) ||
        isFieldLTPredicate(predicate) ||
        isFieldGTPredicate(predicate) ||
        isFieldLTEPredicate(predicate) ||
        isFieldGTEPredicate(predicate));
}
function predicateValueExpr(v, timeUnit) {
    return valueExpr(v, { timeUnit, wrapTime: true });
}
function predicateValuesExpr(vals, timeUnit) {
    return vals.map(v => predicateValueExpr(v, timeUnit));
}
// This method is used by Voyager. Do not change its behavior without changing Voyager.
function fieldFilterExpression(predicate, useInRange = true) {
    var _a;
    const { field } = predicate;
    const timeUnit = (_a = normalizeTimeUnit(predicate.timeUnit)) === null || _a === void 0 ? void 0 : _a.unit;
    const fieldExpr = timeUnit
        ? // For timeUnit, cast into integer with time() so we can use ===, inrange, indexOf to compare values directly.
            // TODO: We calculate timeUnit on the fly here. Consider if we would like to consolidate this with timeUnit pipeline
            // TODO: support utc
            `time(${timeunit_fieldExpr(timeUnit, field)})`
        : vgField(predicate, { expr: 'datum' });
    if (isFieldEqualPredicate(predicate)) {
        return `${fieldExpr}===${predicateValueExpr(predicate.equal, timeUnit)}`;
    }
    else if (isFieldLTPredicate(predicate)) {
        const upper = predicate.lt;
        return `${fieldExpr}<${predicateValueExpr(upper, timeUnit)}`;
    }
    else if (isFieldGTPredicate(predicate)) {
        const lower = predicate.gt;
        return `${fieldExpr}>${predicateValueExpr(lower, timeUnit)}`;
    }
    else if (isFieldLTEPredicate(predicate)) {
        const upper = predicate.lte;
        return `${fieldExpr}<=${predicateValueExpr(upper, timeUnit)}`;
    }
    else if (isFieldGTEPredicate(predicate)) {
        const lower = predicate.gte;
        return `${fieldExpr}>=${predicateValueExpr(lower, timeUnit)}`;
    }
    else if (isFieldOneOfPredicate(predicate)) {
        return `indexof([${predicateValuesExpr(predicate.oneOf, timeUnit).join(',')}], ${fieldExpr}) !== -1`;
    }
    else if (isFieldValidPredicate(predicate)) {
        return fieldValidPredicate(fieldExpr, predicate.valid);
    }
    else if (isFieldRangePredicate(predicate)) {
        const { range } = predicate;
        const lower = isSignalRef(range) ? { signal: `${range.signal}[0]` } : range[0];
        const upper = isSignalRef(range) ? { signal: `${range.signal}[1]` } : range[1];
        if (lower !== null && upper !== null && useInRange) {
            return ('inrange(' +
                fieldExpr +
                ', [' +
                predicateValueExpr(lower, timeUnit) +
                ', ' +
                predicateValueExpr(upper, timeUnit) +
                '])');
        }
        const exprs = [];
        if (lower !== null) {
            exprs.push(`${fieldExpr} >= ${predicateValueExpr(lower, timeUnit)}`);
        }
        if (upper !== null) {
            exprs.push(`${fieldExpr} <= ${predicateValueExpr(upper, timeUnit)}`);
        }
        return exprs.length > 0 ? exprs.join(' && ') : 'true';
    }
    /* istanbul ignore next: it should never reach here */
    throw new Error(`Invalid field predicate: ${stringify(predicate)}`);
}
function fieldValidPredicate(fieldExpr, valid = true) {
    if (valid) {
        return `isValid(${fieldExpr}) && isFinite(+${fieldExpr})`;
    }
    else {
        return `!isValid(${fieldExpr}) || !isFinite(+${fieldExpr})`;
    }
}
function normalizePredicate(f) {
    var _a;
    if (isFieldPredicate(f) && f.timeUnit) {
        return Object.assign(Object.assign({}, f), { timeUnit: (_a = normalizeTimeUnit(f.timeUnit)) === null || _a === void 0 ? void 0 : _a.unit });
    }
    return f;
}
//# sourceMappingURL=predicate.js.map
// EXTERNAL MODULE: consume shared module (default) vega@^5.20.0 (strict) (fallback: ./node_modules/vega/build/vega.module.js)
var vega_module_js_ = __webpack_require__(78352);
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/type.js

/**
 * Data type based on level of measurement
 */
const Type = {
    quantitative: 'quantitative',
    ordinal: 'ordinal',
    temporal: 'temporal',
    nominal: 'nominal',
    geojson: 'geojson'
};
function isType(t) {
    return t in Type;
}
function isContinuous(type) {
    return type === 'quantitative' || type === 'temporal';
}
function isDiscrete(type) {
    return type === 'ordinal' || type === 'nominal';
}
const QUANTITATIVE = Type.quantitative;
const ORDINAL = Type.ordinal;
const TEMPORAL = Type.temporal;
const NOMINAL = Type.nominal;
const GEOJSON = Type.geojson;
const TYPES = keys(Type);
/**
 * Get full, lowercase type name for a given type.
 * @param  type
 * @return Full type name.
 */
function getFullName(type) {
    if (type) {
        type = type.toLowerCase();
        switch (type) {
            case 'q':
            case QUANTITATIVE:
                return 'quantitative';
            case 't':
            case TEMPORAL:
                return 'temporal';
            case 'o':
            case ORDINAL:
                return 'ordinal';
            case 'n':
            case NOMINAL:
                return 'nominal';
            case GEOJSON:
                return 'geojson';
        }
    }
    // If we get invalid input, return undefined type.
    return undefined;
}
//# sourceMappingURL=type.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/scale.js
var scale_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};







const ScaleType = {
    // Continuous - Quantitative
    LINEAR: 'linear',
    LOG: 'log',
    POW: 'pow',
    SQRT: 'sqrt',
    SYMLOG: 'symlog',
    IDENTITY: 'identity',
    SEQUENTIAL: 'sequential',
    // Continuous - Time
    TIME: 'time',
    UTC: 'utc',
    // Discretizing scales
    QUANTILE: 'quantile',
    QUANTIZE: 'quantize',
    THRESHOLD: 'threshold',
    BIN_ORDINAL: 'bin-ordinal',
    // Discrete scales
    ORDINAL: 'ordinal',
    POINT: 'point',
    BAND: 'band'
};
/**
 * Index for scale categories -- only scale of the same categories can be merged together.
 * Current implementation is trying to be conservative and avoid merging scale type that might not work together
 */
const SCALE_CATEGORY_INDEX = {
    linear: 'numeric',
    log: 'numeric',
    pow: 'numeric',
    sqrt: 'numeric',
    symlog: 'numeric',
    identity: 'numeric',
    sequential: 'numeric',
    time: 'time',
    utc: 'time',
    ordinal: 'ordinal',
    'bin-ordinal': 'bin-ordinal',
    point: 'ordinal-position',
    band: 'ordinal-position',
    quantile: 'discretizing',
    quantize: 'discretizing',
    threshold: 'discretizing'
};
const SCALE_TYPES = keys(SCALE_CATEGORY_INDEX);
/**
 * Whether the two given scale types can be merged together.
 */
function scaleCompatible(scaleType1, scaleType2) {
    const scaleCategory1 = SCALE_CATEGORY_INDEX[scaleType1];
    const scaleCategory2 = SCALE_CATEGORY_INDEX[scaleType2];
    return (scaleCategory1 === scaleCategory2 ||
        (scaleCategory1 === 'ordinal-position' && scaleCategory2 === 'time') ||
        (scaleCategory2 === 'ordinal-position' && scaleCategory1 === 'time'));
}
/**
 * Index for scale precedence -- high score = higher priority for merging.
 */
const SCALE_PRECEDENCE_INDEX = {
    // numeric
    linear: 0,
    log: 1,
    pow: 1,
    sqrt: 1,
    symlog: 1,
    identity: 1,
    sequential: 1,
    // time
    time: 0,
    utc: 0,
    // ordinal-position -- these have higher precedence than continuous scales as they support more types of data
    point: 10,
    band: 11,
    // non grouped types
    ordinal: 0,
    'bin-ordinal': 0,
    quantile: 0,
    quantize: 0,
    threshold: 0
};
/**
 * Return scale categories -- only scale of the same categories can be merged together.
 */
function scaleTypePrecedence(scaleType) {
    return SCALE_PRECEDENCE_INDEX[scaleType];
}
const QUANTITATIVE_SCALES = new Set([
    'linear',
    'log',
    'pow',
    'sqrt',
    'symlog'
]);
const CONTINUOUS_TO_CONTINUOUS_SCALES = new Set([
    ...QUANTITATIVE_SCALES,
    'time',
    'utc'
]);
function isQuantitative(type) {
    return QUANTITATIVE_SCALES.has(type);
}
const CONTINUOUS_TO_DISCRETE_SCALES = new Set([
    'quantile',
    'quantize',
    'threshold'
]);
const CONTINUOUS_DOMAIN_SCALES = new Set([
    ...CONTINUOUS_TO_CONTINUOUS_SCALES,
    ...CONTINUOUS_TO_DISCRETE_SCALES,
    'sequential',
    'identity'
]);
const DISCRETE_DOMAIN_SCALES = new Set([
    'ordinal',
    'bin-ordinal',
    'point',
    'band'
]);
const TIME_SCALE_TYPES = new Set(['time', 'utc']);
function hasDiscreteDomain(type) {
    return DISCRETE_DOMAIN_SCALES.has(type);
}
function hasContinuousDomain(type) {
    return CONTINUOUS_DOMAIN_SCALES.has(type);
}
function isContinuousToContinuous(type) {
    return CONTINUOUS_TO_CONTINUOUS_SCALES.has(type);
}
function isContinuousToDiscrete(type) {
    return CONTINUOUS_TO_DISCRETE_SCALES.has(type);
}
const defaultScaleConfig = {
    pointPadding: 0.5,
    barBandPaddingInner: 0.1,
    rectBandPaddingInner: 0,
    bandWithNestedOffsetPaddingInner: 0.2,
    bandWithNestedOffsetPaddingOuter: 0.2,
    minBandSize: 2,
    minFontSize: 8,
    maxFontSize: 40,
    minOpacity: 0.3,
    maxOpacity: 0.8,
    // FIXME: revise if these *can* become ratios of width/height step
    minSize: 9,
    minStrokeWidth: 1,
    maxStrokeWidth: 4,
    quantileCount: 4,
    quantizeCount: 4,
    zero: true
};
function isExtendedScheme(scheme) {
    return !(0,vega_util_module/* isString */.Kg)(scheme) && !!scheme['name'];
}
function isParameterDomain(domain) {
    return domain === null || domain === void 0 ? void 0 : domain['param'];
}
function isDomainUnionWith(domain) {
    return domain === null || domain === void 0 ? void 0 : domain['unionWith'];
}
function isFieldRange(range) {
    return (0,vega_module_js_.isObject)(range) && 'field' in range;
}
const SCALE_PROPERTY_INDEX = {
    type: 1,
    domain: 1,
    domainMax: 1,
    domainMin: 1,
    domainMid: 1,
    align: 1,
    range: 1,
    rangeMax: 1,
    rangeMin: 1,
    scheme: 1,
    bins: 1,
    // Other properties
    reverse: 1,
    round: 1,
    // quantitative / time
    clamp: 1,
    nice: 1,
    // quantitative
    base: 1,
    exponent: 1,
    constant: 1,
    interpolate: 1,
    zero: 1,
    // band/point
    padding: 1,
    paddingInner: 1,
    paddingOuter: 1
};
const SCALE_PROPERTIES = keys(SCALE_PROPERTY_INDEX);
const { type, domain, range, rangeMax, rangeMin, scheme } = SCALE_PROPERTY_INDEX, NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTY_INDEX = scale_rest(SCALE_PROPERTY_INDEX, ["type", "domain", "range", "rangeMax", "rangeMin", "scheme"]);
const NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES = keys(NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTY_INDEX);
function scaleTypeSupportProperty(scaleType, propName) {
    switch (propName) {
        case 'type':
        case 'domain':
        case 'reverse':
        case 'range':
            return true;
        case 'scheme':
        case 'interpolate':
            return !['point', 'band', 'identity'].includes(scaleType);
        case 'bins':
            return !['point', 'band', 'identity', 'ordinal'].includes(scaleType);
        case 'round':
            return isContinuousToContinuous(scaleType) || scaleType === 'band' || scaleType === 'point';
        case 'padding':
        case 'rangeMin':
        case 'rangeMax':
            return isContinuousToContinuous(scaleType) || ['point', 'band'].includes(scaleType);
        case 'paddingOuter':
        case 'align':
            return ['point', 'band'].includes(scaleType);
        case 'paddingInner':
            return scaleType === 'band';
        case 'domainMax':
        case 'domainMid':
        case 'domainMin':
        case 'clamp':
            return isContinuousToContinuous(scaleType);
        case 'nice':
            return isContinuousToContinuous(scaleType) || scaleType === 'quantize' || scaleType === 'threshold';
        case 'exponent':
            return scaleType === 'pow';
        case 'base':
            return scaleType === 'log';
        case 'constant':
            return scaleType === 'symlog';
        case 'zero':
            return (hasContinuousDomain(scaleType) &&
                !contains([
                    'log',
                    'time',
                    'utc',
                    'threshold',
                    'quantile' // quantile depends on distribution so zero does not matter
                ], scaleType));
    }
}
/**
 * Returns undefined if the input channel supports the input scale property name
 */
function channelScalePropertyIncompatability(channel, propName) {
    switch (propName) {
        case 'interpolate':
        case 'scheme':
        case 'domainMid':
            if (!isColorChannel(channel)) {
                return cannotUseScalePropertyWithNonColor(propName);
            }
            return undefined;
        case 'align':
        case 'type':
        case 'bins':
        case 'domain':
        case 'domainMax':
        case 'domainMin':
        case 'range':
        case 'base':
        case 'exponent':
        case 'constant':
        case 'nice':
        case 'padding':
        case 'paddingInner':
        case 'paddingOuter':
        case 'rangeMax':
        case 'rangeMin':
        case 'reverse':
        case 'round':
        case 'clamp':
        case 'zero':
            return undefined; // GOOD!
    }
}
function scaleTypeSupportDataType(specifiedType, fieldDefType) {
    if (contains([ORDINAL, NOMINAL], fieldDefType)) {
        return specifiedType === undefined || hasDiscreteDomain(specifiedType);
    }
    else if (fieldDefType === TEMPORAL) {
        return contains([ScaleType.TIME, ScaleType.UTC, undefined], specifiedType);
    }
    else if (fieldDefType === QUANTITATIVE) {
        return isQuantitative(specifiedType) || isContinuousToDiscrete(specifiedType) || specifiedType === undefined;
    }
    return true;
}
function channelSupportScaleType(channel, scaleType, hasNestedOffsetScale = false) {
    if (!isScaleChannel(channel)) {
        return false;
    }
    switch (channel) {
        case X:
        case Y:
        case XOFFSET:
        case YOFFSET:
        case THETA:
        case RADIUS:
            if (isContinuousToContinuous(scaleType)) {
                return true;
            }
            else if (scaleType === 'band') {
                return true;
            }
            else if (scaleType === 'point') {
                /*
                  Point scale can't be use if the position has a nested offset scale
                  because if there is a nested scale, then it's band.
                */
                return !hasNestedOffsetScale;
            }
            return false;
        case SIZE: // TODO: size and opacity can support ordinal with more modification
        case STROKEWIDTH:
        case OPACITY:
        case FILLOPACITY:
        case STROKEOPACITY:
        case ANGLE:
            // Although it generally doesn't make sense to use band with size and opacity,
            // it can also work since we use band: 0.5 to get midpoint.
            return (isContinuousToContinuous(scaleType) ||
                isContinuousToDiscrete(scaleType) ||
                contains(['band', 'point', 'ordinal'], scaleType));
        case COLOR:
        case FILL:
        case STROKE:
            return scaleType !== 'band'; // band does not make sense with color
        case STROKEDASH:
        case SHAPE:
            return scaleType === 'ordinal' || isContinuousToDiscrete(scaleType);
    }
}
//# sourceMappingURL=scale.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/mark.js

/**
 * All types of primitive marks.
 */
const Mark = {
    arc: 'arc',
    area: 'area',
    bar: 'bar',
    image: 'image',
    line: 'line',
    point: 'point',
    rect: 'rect',
    rule: 'rule',
    text: 'text',
    tick: 'tick',
    trail: 'trail',
    circle: 'circle',
    square: 'square',
    geoshape: 'geoshape'
};
const ARC = Mark.arc;
const AREA = Mark.area;
const BAR = Mark.bar;
const IMAGE = Mark.image;
const LINE = Mark.line;
const POINT = Mark.point;
const RECT = Mark.rect;
const RULE = Mark.rule;
const mark_TEXT = Mark.text;
const TICK = Mark.tick;
const TRAIL = Mark.trail;
const CIRCLE = Mark.circle;
const SQUARE = Mark.square;
const GEOSHAPE = Mark.geoshape;
function isMark(m) {
    return m in Mark;
}
function isPathMark(m) {
    return ['line', 'area', 'trail'].includes(m);
}
function isRectBasedMark(m) {
    return ['rect', 'bar', 'image', 'arc' /* arc is rect/interval in polar coordinate */].includes(m);
}
const PRIMITIVE_MARKS = new Set(keys(Mark));
function isMarkDef(mark) {
    return mark['type'];
}
function isPrimitiveMark(mark) {
    const markType = isMarkDef(mark) ? mark.type : mark;
    return PRIMITIVE_MARKS.has(markType);
}
const STROKE_CONFIG = [
    'stroke',
    'strokeWidth',
    'strokeDash',
    'strokeDashOffset',
    'strokeOpacity',
    'strokeJoin',
    'strokeMiterLimit'
];
const FILL_CONFIG = ['fill', 'fillOpacity'];
const FILL_STROKE_CONFIG = [...STROKE_CONFIG, ...FILL_CONFIG];
const VL_ONLY_MARK_CONFIG_INDEX = {
    color: 1,
    filled: 1,
    invalid: 1,
    order: 1,
    radius2: 1,
    theta2: 1,
    timeUnitBandSize: 1,
    timeUnitBandPosition: 1
};
const VL_ONLY_MARK_CONFIG_PROPERTIES = keys(VL_ONLY_MARK_CONFIG_INDEX);
const VL_ONLY_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX = {
    area: ['line', 'point'],
    bar: ['binSpacing', 'continuousBandSize', 'discreteBandSize'],
    rect: ['binSpacing', 'continuousBandSize', 'discreteBandSize'],
    line: ['point'],
    tick: ['bandSize', 'thickness']
};
const defaultMarkConfig = {
    color: '#4c78a8',
    invalid: 'filter',
    timeUnitBandSize: 1
};
const MARK_CONFIG_INDEX = {
    mark: 1,
    arc: 1,
    area: 1,
    bar: 1,
    circle: 1,
    image: 1,
    line: 1,
    point: 1,
    rect: 1,
    rule: 1,
    square: 1,
    text: 1,
    tick: 1,
    trail: 1,
    geoshape: 1
};
const MARK_CONFIGS = keys(MARK_CONFIG_INDEX);
function isRelativeBandSize(o) {
    return o && o['band'] != undefined;
}
const BAR_CORNER_RADIUS_INDEX = {
    horizontal: ['cornerRadiusTopRight', 'cornerRadiusBottomRight'],
    vertical: ['cornerRadiusTopLeft', 'cornerRadiusTopRight']
};
const DEFAULT_RECT_BAND_SIZE = 5;
const defaultBarConfig = {
    binSpacing: 1,
    continuousBandSize: DEFAULT_RECT_BAND_SIZE,
    timeUnitBandPosition: 0.5
};
const defaultRectConfig = {
    binSpacing: 0,
    continuousBandSize: DEFAULT_RECT_BAND_SIZE,
    timeUnitBandPosition: 0.5
};
const defaultTickConfig = {
    thickness: 1
};
function getMarkType(m) {
    return isMarkDef(m) ? m.type : m;
}
//# sourceMappingURL=mark.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/valueref.js















function midPointRefWithPositionInvalidTest(params) {
    const { channel, channelDef, markDef, scale, config } = params;
    const ref = midPoint(params);
    // Wrap to check if the positional value is invalid, if so, plot the point on the min value
    if (
    // Only this for field def without counting aggregate (as count wouldn't be null)
    isFieldDef(channelDef) &&
        !isCountingAggregateOp(channelDef.aggregate) &&
        // and only for continuous scale
        scale &&
        isContinuousToContinuous(scale.get('type'))) {
        return wrapPositionInvalidTest({
            fieldDef: channelDef,
            channel,
            markDef,
            ref,
            config
        });
    }
    return ref;
}
function wrapPositionInvalidTest({ fieldDef, channel, markDef, ref, config }) {
    if (isPathMark(markDef.type)) {
        // path mark already use defined to skip points, no need to do it here.
        return ref;
    }
    const invalid = getMarkPropOrConfig('invalid', markDef, config);
    if (invalid === null) {
        // if there is no invalid filter, don't do the invalid test
        return [fieldInvalidTestValueRef(fieldDef, channel), ref];
    }
    return ref;
}
function fieldInvalidTestValueRef(fieldDef, channel) {
    const test = fieldInvalidPredicate(fieldDef, true);
    const mainChannel = getMainRangeChannel(channel); // we can cast here as the output can't be other things.
    const zeroValueRef = mainChannel === 'y'
        ? { field: { group: 'height' } }
        : // x / angle / radius can all use 0
            { value: 0 };
    return Object.assign({ test }, zeroValueRef);
}
function fieldInvalidPredicate(field, invalid = true) {
    return fieldValidPredicate((0,vega_util_module/* isString */.Kg)(field) ? field : vgField(field, { expr: 'datum' }), !invalid);
}
function datumDefToExpr(datumDef) {
    const { datum } = datumDef;
    if (isDateTime(datum)) {
        return dateTimeToExpr(datum);
    }
    return `${stringify(datum)}`;
}
function valueRefForFieldOrDatumDef(fieldDef, scaleName, opt, encode) {
    const ref = {};
    if (scaleName) {
        ref.scale = scaleName;
    }
    if (isDatumDef(fieldDef)) {
        const { datum } = fieldDef;
        if (isDateTime(datum)) {
            ref.signal = dateTimeToExpr(datum);
        }
        else if (isSignalRef(datum)) {
            ref.signal = datum.signal;
        }
        else if (isExprRef(datum)) {
            ref.signal = datum.expr;
        }
        else {
            ref.value = datum;
        }
    }
    else {
        ref.field = vgField(fieldDef, opt);
    }
    if (encode) {
        const { offset, band } = encode;
        if (offset) {
            ref.offset = offset;
        }
        if (band) {
            ref.band = band;
        }
    }
    return ref;
}
/**
 * Signal that returns the middle of a bin from start and end field. Should only be used with x and y.
 */
function interpolatedSignalRef({ scaleName, fieldOrDatumDef, fieldOrDatumDef2, offset, startSuffix, bandPosition = 0.5 }) {
    const expr = 0 < bandPosition && bandPosition < 1 ? 'datum' : undefined;
    const start = vgField(fieldOrDatumDef, { expr, suffix: startSuffix });
    const end = fieldOrDatumDef2 !== undefined
        ? vgField(fieldOrDatumDef2, { expr })
        : vgField(fieldOrDatumDef, { suffix: 'end', expr });
    const ref = {};
    if (bandPosition === 0 || bandPosition === 1) {
        ref.scale = scaleName;
        const val = bandPosition === 0 ? start : end;
        ref.field = val;
    }
    else {
        const datum = isSignalRef(bandPosition)
            ? `${bandPosition.signal} * ${start} + (1-${bandPosition.signal}) * ${end}`
            : `${bandPosition} * ${start} + ${1 - bandPosition} * ${end}`;
        ref.signal = `scale("${scaleName}", ${datum})`;
    }
    if (offset) {
        ref.offset = offset;
    }
    return ref;
}
/**
 * @returns {VgValueRef} Value Ref for xc / yc or mid point for other channels.
 */
function midPoint({ channel, channelDef, channel2Def, markDef, config, scaleName, scale, stack, offset, defaultRef, bandPosition }) {
    var _a;
    // TODO: datum support
    if (channelDef) {
        /* istanbul ignore else */
        if (isFieldOrDatumDef(channelDef)) {
            const scaleType = scale === null || scale === void 0 ? void 0 : scale.get('type');
            if (isTypedFieldDef(channelDef)) {
                bandPosition !== null && bandPosition !== void 0 ? bandPosition : (bandPosition = getBandPosition({
                    fieldDef: channelDef,
                    fieldDef2: channel2Def,
                    markDef,
                    config
                }));
                const { bin, timeUnit, type } = channelDef;
                if (isBinning(bin) || (bandPosition && timeUnit && type === TEMPORAL)) {
                    // Use middle only for x an y to place marks in the center between start and end of the bin range.
                    // We do not use the mid point for other channels (e.g. size) so that properties of legends and marks match.
                    if (stack === null || stack === void 0 ? void 0 : stack.impute) {
                        // For stack, we computed bin_mid so we can impute.
                        return valueRefForFieldOrDatumDef(channelDef, scaleName, { binSuffix: 'mid' }, { offset });
                    }
                    if (bandPosition && !hasDiscreteDomain(scaleType)) {
                        // if band = 0, no need to call interpolation
                        // For non-stack, we can just calculate bin mid on the fly using signal.
                        return interpolatedSignalRef({ scaleName, fieldOrDatumDef: channelDef, bandPosition, offset });
                    }
                    return valueRefForFieldOrDatumDef(channelDef, scaleName, binRequiresRange(channelDef, channel) ? { binSuffix: 'range' } : {}, {
                        offset
                    });
                }
                else if (isBinned(bin)) {
                    if (isFieldDef(channel2Def)) {
                        return interpolatedSignalRef({
                            scaleName,
                            fieldOrDatumDef: channelDef,
                            fieldOrDatumDef2: channel2Def,
                            bandPosition,
                            offset
                        });
                    }
                    else {
                        const channel2 = channel === X ? X2 : Y2;
                        warn(channelRequiredForBinned(channel2));
                    }
                }
            }
            return valueRefForFieldOrDatumDef(channelDef, scaleName, hasDiscreteDomain(scaleType) ? { binSuffix: 'range' } : {}, // no need for bin suffix if there is no scale
            {
                offset,
                // For band, to get mid point, need to offset by half of the band
                band: scaleType === 'band' ? (_a = bandPosition !== null && bandPosition !== void 0 ? bandPosition : channelDef.bandPosition) !== null && _a !== void 0 ? _a : 0.5 : undefined
            });
        }
        else if (isValueDef(channelDef)) {
            const value = channelDef.value;
            const offsetMixins = offset ? { offset } : {};
            return Object.assign(Object.assign({}, widthHeightValueOrSignalRef(channel, value)), offsetMixins);
        }
        // If channelDef is neither field def or value def, it's a condition-only def.
        // In such case, we will use default ref.
    }
    if ((0,vega_util_module/* isFunction */.Tn)(defaultRef)) {
        defaultRef = defaultRef();
    }
    if (defaultRef) {
        // for non-position, ref could be undefined.
        return Object.assign(Object.assign({}, defaultRef), (offset ? { offset } : {}));
    }
    return defaultRef;
}
/**
 * Convert special "width" and "height" values in Vega-Lite into Vega value ref.
 */
function widthHeightValueOrSignalRef(channel, value) {
    if (contains(['x', 'x2'], channel) && value === 'width') {
        return { field: { group: 'width' } };
    }
    else if (contains(['y', 'y2'], channel) && value === 'height') {
        return { field: { group: 'height' } };
    }
    return signalOrValueRef(value);
}
//# sourceMappingURL=valueref.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/format.js










function isCustomFormatType(formatType) {
    return formatType && formatType !== 'number' && formatType !== 'time';
}
function customFormatExpr(formatType, field, format) {
    return `${formatType}(${field}${format ? `, ${stringify(format)}` : ''})`;
}
const format_BIN_RANGE_DELIMITER = ' \u2013 ';
function formatSignalRef({ fieldOrDatumDef, format, formatType, expr, normalizeStack, config }) {
    var _a, _b;
    if (isCustomFormatType(formatType)) {
        return formatCustomType({
            fieldOrDatumDef,
            format,
            formatType,
            expr,
            config
        });
    }
    const field = fieldToFormat(fieldOrDatumDef, expr, normalizeStack);
    const type = channelDefType(fieldOrDatumDef);
    if (format === undefined && formatType === undefined && config.customFormatTypes) {
        if (type === 'quantitative') {
            if (normalizeStack && config.normalizedNumberFormatType)
                return formatCustomType({
                    fieldOrDatumDef,
                    format: config.normalizedNumberFormat,
                    formatType: config.normalizedNumberFormatType,
                    expr,
                    config
                });
            if (config.numberFormatType) {
                return formatCustomType({
                    fieldOrDatumDef,
                    format: config.numberFormat,
                    formatType: config.numberFormatType,
                    expr,
                    config
                });
            }
        }
        if (type === 'temporal' &&
            config.timeFormatType &&
            isFieldDef(fieldOrDatumDef) &&
            fieldOrDatumDef.timeUnit === undefined) {
            return formatCustomType({
                fieldOrDatumDef,
                format: config.timeFormat,
                formatType: config.timeFormatType,
                expr,
                config
            });
        }
    }
    if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef)) {
        const signal = timeFormatExpression({
            field,
            timeUnit: isFieldDef(fieldOrDatumDef) ? (_a = normalizeTimeUnit(fieldOrDatumDef.timeUnit)) === null || _a === void 0 ? void 0 : _a.unit : undefined,
            format,
            formatType: config.timeFormatType,
            rawTimeFormat: config.timeFormat,
            isUTCScale: isScaleFieldDef(fieldOrDatumDef) && ((_b = fieldOrDatumDef.scale) === null || _b === void 0 ? void 0 : _b.type) === ScaleType.UTC
        });
        return signal ? { signal } : undefined;
    }
    format = numberFormat({ type, specifiedFormat: format, config, normalizeStack });
    if (isFieldDef(fieldOrDatumDef) && isBinning(fieldOrDatumDef.bin)) {
        const endField = vgField(fieldOrDatumDef, { expr, binSuffix: 'end' });
        return {
            signal: binFormatExpression(field, endField, format, formatType, config)
        };
    }
    else if (format || channelDefType(fieldOrDatumDef) === 'quantitative') {
        return {
            signal: `${formatExpr(field, format)}`
        };
    }
    else {
        return { signal: `isValid(${field}) ? ${field} : ""+${field}` };
    }
}
function fieldToFormat(fieldOrDatumDef, expr, normalizeStack) {
    if (isFieldDef(fieldOrDatumDef)) {
        if (normalizeStack) {
            return `${vgField(fieldOrDatumDef, { expr, suffix: 'end' })}-${vgField(fieldOrDatumDef, {
                expr,
                suffix: 'start'
            })}`;
        }
        else {
            return vgField(fieldOrDatumDef, { expr });
        }
    }
    else {
        return datumDefToExpr(fieldOrDatumDef);
    }
}
function formatCustomType({ fieldOrDatumDef, format, formatType, expr, normalizeStack, config, field }) {
    field !== null && field !== void 0 ? field : (field = fieldToFormat(fieldOrDatumDef, expr, normalizeStack));
    if (field !== 'datum.value' && // For axis/legend, we can't correctly know the end of the bin from `datum`
        isFieldDef(fieldOrDatumDef) &&
        isBinning(fieldOrDatumDef.bin)) {
        const endField = vgField(fieldOrDatumDef, { expr, binSuffix: 'end' });
        return {
            signal: binFormatExpression(field, endField, format, formatType, config)
        };
    }
    return { signal: customFormatExpr(formatType, field, format) };
}
function guideFormat(fieldOrDatumDef, type, format, formatType, config, omitTimeFormatConfig // axis doesn't use config.timeFormat
) {
    var _a;
    if (isCustomFormatType(formatType)) {
        return undefined; // handled in encode block
    }
    else if (format === undefined && formatType === undefined && config.customFormatTypes) {
        if (channelDefType(fieldOrDatumDef) === 'quantitative') {
            if (config.normalizedNumberFormatType &&
                isPositionFieldOrDatumDef(fieldOrDatumDef) &&
                fieldOrDatumDef.stack === 'normalize') {
                return undefined; // handled in encode block
            }
            if (config.numberFormatType) {
                return undefined; // handled in encode block
            }
        }
    }
    if (isPositionFieldOrDatumDef(fieldOrDatumDef) &&
        fieldOrDatumDef.stack === 'normalize' &&
        config.normalizedNumberFormat) {
        return numberFormat({
            type: 'quantitative',
            config,
            normalizeStack: true
        });
    }
    if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef)) {
        const timeUnit = isFieldDef(fieldOrDatumDef) ? (_a = normalizeTimeUnit(fieldOrDatumDef.timeUnit)) === null || _a === void 0 ? void 0 : _a.unit : undefined;
        if (timeUnit === undefined && config.customFormatTypes && config.timeFormatType) {
            return undefined; // hanlded in encode block
        }
        return timeFormat({ specifiedFormat: format, timeUnit, config, omitTimeFormatConfig });
    }
    return numberFormat({ type, specifiedFormat: format, config });
}
function guideFormatType(formatType, fieldOrDatumDef, scaleType) {
    var _a;
    if (formatType && (isSignalRef(formatType) || formatType === 'number' || formatType === 'time')) {
        return formatType;
    }
    if (isFieldOrDatumDefForTimeFormat(fieldOrDatumDef) && scaleType !== 'time' && scaleType !== 'utc') {
        return isFieldDef(fieldOrDatumDef) && ((_a = normalizeTimeUnit(fieldOrDatumDef === null || fieldOrDatumDef === void 0 ? void 0 : fieldOrDatumDef.timeUnit)) === null || _a === void 0 ? void 0 : _a.utc) ? 'utc' : 'time';
    }
    return undefined;
}
/**
 * Returns number format for a fieldDef.
 */
function numberFormat({ type, specifiedFormat, config, normalizeStack }) {
    // Specified format in axis/legend has higher precedence than fieldDef.format
    if ((0,vega_util_module/* isString */.Kg)(specifiedFormat)) {
        return specifiedFormat;
    }
    if (type === QUANTITATIVE) {
        // we only apply the default if the field is quantitative
        return normalizeStack ? config.normalizedNumberFormat : config.numberFormat;
    }
    return undefined;
}
/**
 * Returns time format for a fieldDef for use in guides.
 */
function timeFormat({ specifiedFormat, timeUnit, config, omitTimeFormatConfig }) {
    if (specifiedFormat) {
        return specifiedFormat;
    }
    if (timeUnit) {
        return {
            signal: timeUnitSpecifierExpression(timeUnit)
        };
    }
    return omitTimeFormatConfig ? undefined : config.timeFormat;
}
function formatExpr(field, format) {
    return `format(${field}, "${format || ''}")`;
}
function binNumberFormatExpr(field, format, formatType, config) {
    var _a;
    if (isCustomFormatType(formatType)) {
        return customFormatExpr(formatType, field, format);
    }
    return formatExpr(field, (_a = ((0,vega_util_module/* isString */.Kg)(format) ? format : undefined)) !== null && _a !== void 0 ? _a : config.numberFormat);
}
function binFormatExpression(startField, endField, format, formatType, config) {
    if (format === undefined && formatType === undefined && config.customFormatTypes && config.numberFormatType) {
        return binFormatExpression(startField, endField, config.numberFormat, config.numberFormatType, config);
    }
    const start = binNumberFormatExpr(startField, format, formatType, config);
    const end = binNumberFormatExpr(endField, format, formatType, config);
    return `${fieldValidPredicate(startField, false)} ? "null" : ${start} + "${format_BIN_RANGE_DELIMITER}" + ${end}`;
}
/**
 * Returns the time expression used for axis/legend labels or text mark for a temporal field
 */
function timeFormatExpression({ field, timeUnit, format, formatType, rawTimeFormat, isUTCScale }) {
    if (!timeUnit || format) {
        // If there is no time unit, or if user explicitly specifies format for axis/legend/text.
        if (!timeUnit && formatType) {
            return `${formatType}(${field}, '${format}')`;
        }
        format = (0,vega_util_module/* isString */.Kg)(format) ? format : rawTimeFormat; // only use provided timeFormat if there is no timeUnit.
        return `${isUTCScale ? 'utc' : 'time'}Format(${field}, '${format}')`;
    }
    else {
        return formatExpression(timeUnit, field, isUTCScale);
    }
}
//# sourceMappingURL=format.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/sort.js

const DEFAULT_SORT_OP = 'min';
const SORT_BY_CHANNEL_INDEX = {
    x: 1,
    y: 1,
    color: 1,
    fill: 1,
    stroke: 1,
    strokeWidth: 1,
    size: 1,
    shape: 1,
    fillOpacity: 1,
    strokeOpacity: 1,
    opacity: 1,
    text: 1
};
function isSortByChannel(c) {
    return c in SORT_BY_CHANNEL_INDEX;
}
function isSortByEncoding(sort) {
    return !!(sort === null || sort === void 0 ? void 0 : sort['encoding']);
}
function isSortField(sort) {
    return sort && (sort['op'] === 'count' || !!sort['field']);
}
function isSortArray(sort) {
    return sort && (0,vega_util_module/* isArray */.cy)(sort);
}
//# sourceMappingURL=sort.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/spec/facet.js
function isFacetMapping(f) {
    return 'row' in f || 'column' in f;
}
function isFacetFieldDef(channelDef) {
    return !!channelDef && 'header' in channelDef;
}
function isFacetSpec(spec) {
    return 'facet' in spec;
}
//# sourceMappingURL=facet.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/channeldef.js
var channeldef_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};

















function isConditionalParameter(c) {
    return c['param'];
}
function isRepeatRef(field) {
    return field && !(0,vega_util_module/* isString */.Kg)(field) && 'repeat' in field;
}
function toFieldDefBase(fieldDef) {
    const { field, timeUnit, bin, aggregate } = fieldDef;
    return Object.assign(Object.assign(Object.assign(Object.assign({}, (timeUnit ? { timeUnit } : {})), (bin ? { bin } : {})), (aggregate ? { aggregate } : {})), { field });
}
function isSortableFieldDef(fieldDef) {
    return 'sort' in fieldDef;
}
function getBandPosition({ fieldDef, fieldDef2, markDef: mark, config }) {
    if (isFieldOrDatumDef(fieldDef) && fieldDef.bandPosition !== undefined) {
        return fieldDef.bandPosition;
    }
    if (isFieldDef(fieldDef)) {
        const { timeUnit, bin } = fieldDef;
        if (timeUnit && !fieldDef2) {
            return isRectBasedMark(mark.type) ? 0 : getMarkConfig('timeUnitBandPosition', mark, config);
        }
        else if (isBinning(bin)) {
            return 0.5;
        }
    }
    return undefined;
}
function getBandSize({ channel, fieldDef, fieldDef2, markDef: mark, config, scaleType, useVlSizeChannel }) {
    var _a, _b, _c;
    const sizeChannel = getSizeChannel(channel);
    const size = getMarkPropOrConfig(useVlSizeChannel ? 'size' : sizeChannel, mark, config, {
        vgChannel: sizeChannel
    });
    if (size !== undefined) {
        return size;
    }
    if (isFieldDef(fieldDef)) {
        const { timeUnit, bin } = fieldDef;
        if (timeUnit && !fieldDef2) {
            return { band: getMarkConfig('timeUnitBandSize', mark, config) };
        }
        else if (isBinning(bin) && !hasDiscreteDomain(scaleType)) {
            return { band: 1 };
        }
    }
    if (isRectBasedMark(mark.type)) {
        if (scaleType) {
            if (hasDiscreteDomain(scaleType)) {
                return ((_a = config[mark.type]) === null || _a === void 0 ? void 0 : _a.discreteBandSize) || { band: 1 };
            }
            else {
                return (_b = config[mark.type]) === null || _b === void 0 ? void 0 : _b.continuousBandSize;
            }
        }
        return (_c = config[mark.type]) === null || _c === void 0 ? void 0 : _c.discreteBandSize;
    }
    return undefined;
}
function hasBandEnd(fieldDef, fieldDef2, markDef, config) {
    if (isBinning(fieldDef.bin) || (fieldDef.timeUnit && isTypedFieldDef(fieldDef) && fieldDef.type === 'temporal')) {
        // Need to check bandPosition because non-rect marks (e.g., point) with timeUnit
        // doesn't have to use bandEnd if there is no bandPosition.
        return getBandPosition({ fieldDef, fieldDef2, markDef, config }) !== undefined;
    }
    return false;
}
function isConditionalDef(channelDef) {
    return channelDef && 'condition' in channelDef;
}
/**
 * Return if a channelDef is a ConditionalValueDef with ConditionFieldDef
 */
function hasConditionalFieldDef(channelDef) {
    const condition = channelDef === null || channelDef === void 0 ? void 0 : channelDef['condition'];
    return !!condition && !(0,vega_util_module/* isArray */.cy)(condition) && isFieldDef(condition);
}
function hasConditionalFieldOrDatumDef(channelDef) {
    const condition = channelDef === null || channelDef === void 0 ? void 0 : channelDef['condition'];
    return !!condition && !(0,vega_util_module/* isArray */.cy)(condition) && isFieldOrDatumDef(condition);
}
function hasConditionalValueDef(channelDef) {
    const condition = channelDef === null || channelDef === void 0 ? void 0 : channelDef['condition'];
    return !!condition && ((0,vega_util_module/* isArray */.cy)(condition) || isValueDef(condition));
}
function isFieldDef(channelDef) {
    // TODO: we can't use field in channelDef here as it's somehow failing runtime test
    return channelDef && (!!channelDef['field'] || channelDef['aggregate'] === 'count');
}
function channelDefType(channelDef) {
    return channelDef === null || channelDef === void 0 ? void 0 : channelDef['type'];
}
function isDatumDef(channelDef) {
    return channelDef && 'datum' in channelDef;
}
function isContinuousFieldOrDatumDef(cd) {
    // TODO: make datum support DateTime object
    return (isTypedFieldDef(cd) && !channeldef_isDiscrete(cd)) || isNumericDataDef(cd);
}
function isQuantitativeFieldOrDatumDef(cd) {
    // TODO: make datum support DateTime object
    return channelDefType(cd) === 'quantitative' || isNumericDataDef(cd);
}
function isNumericDataDef(cd) {
    return isDatumDef(cd) && (0,vega_util_module/* isNumber */.Et)(cd.datum);
}
function isFieldOrDatumDef(channelDef) {
    return isFieldDef(channelDef) || isDatumDef(channelDef);
}
function isTypedFieldDef(channelDef) {
    return channelDef && ('field' in channelDef || channelDef['aggregate'] === 'count') && 'type' in channelDef;
}
function isValueDef(channelDef) {
    return channelDef && 'value' in channelDef && 'value' in channelDef;
}
function isScaleFieldDef(channelDef) {
    return channelDef && ('scale' in channelDef || 'sort' in channelDef);
}
function isPositionFieldOrDatumDef(channelDef) {
    return channelDef && ('axis' in channelDef || 'stack' in channelDef || 'impute' in channelDef);
}
function isMarkPropFieldOrDatumDef(channelDef) {
    return channelDef && 'legend' in channelDef;
}
function isStringFieldOrDatumDef(channelDef) {
    return channelDef && ('format' in channelDef || 'formatType' in channelDef);
}
function toStringFieldDef(fieldDef) {
    // omit properties that don't exist in string field defs
    return omit(fieldDef, ['legend', 'axis', 'header', 'scale']);
}
function isOpFieldDef(fieldDef) {
    return 'op' in fieldDef;
}
/**
 * Get a Vega field reference from a Vega-Lite field def.
 */
function vgField(fieldDef, opt = {}) {
    var _a, _b, _c;
    let field = fieldDef.field;
    const prefix = opt.prefix;
    let suffix = opt.suffix;
    let argAccessor = ''; // for accessing argmin/argmax field at the end without getting escaped
    if (isCount(fieldDef)) {
        field = internalField('count');
    }
    else {
        let fn;
        if (!opt.nofn) {
            if (isOpFieldDef(fieldDef)) {
                fn = fieldDef.op;
            }
            else {
                const { bin, aggregate, timeUnit } = fieldDef;
                if (isBinning(bin)) {
                    fn = binToString(bin);
                    suffix = ((_a = opt.binSuffix) !== null && _a !== void 0 ? _a : '') + ((_b = opt.suffix) !== null && _b !== void 0 ? _b : '');
                }
                else if (aggregate) {
                    if (isArgmaxDef(aggregate)) {
                        argAccessor = `["${field}"]`;
                        field = `argmax_${aggregate.argmax}`;
                    }
                    else if (isArgminDef(aggregate)) {
                        argAccessor = `["${field}"]`;
                        field = `argmin_${aggregate.argmin}`;
                    }
                    else {
                        fn = String(aggregate);
                    }
                }
                else if (timeUnit) {
                    fn = timeUnitToString(timeUnit);
                    suffix = ((!['range', 'mid'].includes(opt.binSuffix) && opt.binSuffix) || '') + ((_c = opt.suffix) !== null && _c !== void 0 ? _c : '');
                }
            }
        }
        if (fn) {
            field = field ? `${fn}_${field}` : fn;
        }
    }
    if (suffix) {
        field = `${field}_${suffix}`;
    }
    if (prefix) {
        field = `${prefix}_${field}`;
    }
    if (opt.forAs) {
        return removePathFromField(field);
    }
    else if (opt.expr) {
        // Expression to access flattened field. No need to escape dots.
        return flatAccessWithDatum(field, opt.expr) + argAccessor;
    }
    else {
        // We flattened all fields so paths should have become dot.
        return replacePathInField(field) + argAccessor;
    }
}
function channeldef_isDiscrete(def) {
    switch (def.type) {
        case 'nominal':
        case 'ordinal':
        case 'geojson':
            return true;
        case 'quantitative':
            return isFieldDef(def) && !!def.bin;
        case 'temporal':
            return false;
    }
    throw new Error(invalidFieldType(def.type));
}
function isDiscretizing(def) {
    var _a;
    return isScaleFieldDef(def) && isContinuousToDiscrete((_a = def.scale) === null || _a === void 0 ? void 0 : _a.type);
}
function isCount(fieldDef) {
    return fieldDef.aggregate === 'count';
}
function verbalTitleFormatter(fieldDef, config) {
    var _a;
    const { field, bin, timeUnit, aggregate } = fieldDef;
    if (aggregate === 'count') {
        return config.countTitle;
    }
    else if (isBinning(bin)) {
        return `${field} (binned)`;
    }
    else if (timeUnit) {
        const unit = (_a = normalizeTimeUnit(timeUnit)) === null || _a === void 0 ? void 0 : _a.unit;
        if (unit) {
            return `${field} (${getTimeUnitParts(unit).join('-')})`;
        }
    }
    else if (aggregate) {
        if (isArgmaxDef(aggregate)) {
            return `${field} for max ${aggregate.argmax}`;
        }
        else if (isArgminDef(aggregate)) {
            return `${field} for min ${aggregate.argmin}`;
        }
        else {
            return `${titleCase(aggregate)} of ${field}`;
        }
    }
    return field;
}
function functionalTitleFormatter(fieldDef) {
    const { aggregate, bin, timeUnit, field } = fieldDef;
    if (isArgmaxDef(aggregate)) {
        return `${field} for argmax(${aggregate.argmax})`;
    }
    else if (isArgminDef(aggregate)) {
        return `${field} for argmin(${aggregate.argmin})`;
    }
    const timeUnitParams = normalizeTimeUnit(timeUnit);
    const fn = aggregate || (timeUnitParams === null || timeUnitParams === void 0 ? void 0 : timeUnitParams.unit) || ((timeUnitParams === null || timeUnitParams === void 0 ? void 0 : timeUnitParams.maxbins) && 'timeunit') || (isBinning(bin) && 'bin');
    if (fn) {
        return `${fn.toUpperCase()}(${field})`;
    }
    else {
        return field;
    }
}
const defaultTitleFormatter = (fieldDef, config) => {
    switch (config.fieldTitle) {
        case 'plain':
            return fieldDef.field;
        case 'functional':
            return functionalTitleFormatter(fieldDef);
        default:
            return verbalTitleFormatter(fieldDef, config);
    }
};
let titleFormatter = defaultTitleFormatter;
function setTitleFormatter(formatter) {
    titleFormatter = formatter;
}
function resetTitleFormatter() {
    setTitleFormatter(defaultTitleFormatter);
}
function channeldef_title(fieldOrDatumDef, config, { allowDisabling, includeDefault = true }) {
    var _a, _b;
    const guideTitle = (_a = getGuide(fieldOrDatumDef)) === null || _a === void 0 ? void 0 : _a.title;
    if (!isFieldDef(fieldOrDatumDef)) {
        return guideTitle !== null && guideTitle !== void 0 ? guideTitle : fieldOrDatumDef.title;
    }
    const fieldDef = fieldOrDatumDef;
    const def = includeDefault ? defaultTitle(fieldDef, config) : undefined;
    if (allowDisabling) {
        return getFirstDefined(guideTitle, fieldDef.title, def);
    }
    else {
        return (_b = guideTitle !== null && guideTitle !== void 0 ? guideTitle : fieldDef.title) !== null && _b !== void 0 ? _b : def;
    }
}
function getGuide(fieldDef) {
    if (isPositionFieldOrDatumDef(fieldDef) && fieldDef.axis) {
        return fieldDef.axis;
    }
    else if (isMarkPropFieldOrDatumDef(fieldDef) && fieldDef.legend) {
        return fieldDef.legend;
    }
    else if (isFacetFieldDef(fieldDef) && fieldDef.header) {
        return fieldDef.header;
    }
    return undefined;
}
function defaultTitle(fieldDef, config) {
    return titleFormatter(fieldDef, config);
}
function getFormatMixins(fieldDef) {
    var _a;
    if (isStringFieldOrDatumDef(fieldDef)) {
        const { format, formatType } = fieldDef;
        return { format, formatType };
    }
    else {
        const guide = (_a = getGuide(fieldDef)) !== null && _a !== void 0 ? _a : {};
        const { format, formatType } = guide;
        return { format, formatType };
    }
}
function defaultType(fieldDef, channel) {
    var _a;
    switch (channel) {
        case 'latitude':
        case 'longitude':
            return 'quantitative';
        case 'row':
        case 'column':
        case 'facet':
        case 'shape':
        case 'strokeDash':
            return 'nominal';
        case 'order':
            return 'ordinal';
    }
    if (isSortableFieldDef(fieldDef) && (0,vega_util_module/* isArray */.cy)(fieldDef.sort)) {
        return 'ordinal';
    }
    const { aggregate, bin, timeUnit } = fieldDef;
    if (timeUnit) {
        return 'temporal';
    }
    if (bin || (aggregate && !isArgmaxDef(aggregate) && !isArgminDef(aggregate))) {
        return 'quantitative';
    }
    if (isScaleFieldDef(fieldDef) && ((_a = fieldDef.scale) === null || _a === void 0 ? void 0 : _a.type)) {
        switch (SCALE_CATEGORY_INDEX[fieldDef.scale.type]) {
            case 'numeric':
            case 'discretizing':
                return 'quantitative';
            case 'time':
                return 'temporal';
        }
    }
    return 'nominal';
}
/**
 * Returns the fieldDef -- either from the outer channelDef or from the condition of channelDef.
 * @param channelDef
 */
function getFieldDef(channelDef) {
    if (isFieldDef(channelDef)) {
        return channelDef;
    }
    else if (hasConditionalFieldDef(channelDef)) {
        return channelDef.condition;
    }
    return undefined;
}
function getFieldOrDatumDef(channelDef) {
    if (isFieldOrDatumDef(channelDef)) {
        return channelDef;
    }
    else if (hasConditionalFieldOrDatumDef(channelDef)) {
        return channelDef.condition;
    }
    return undefined;
}
/**
 * Convert type to full, lowercase type, or augment the fieldDef with a default type if missing.
 */
function initChannelDef(channelDef, channel, config, opt = {}) {
    if ((0,vega_util_module/* isString */.Kg)(channelDef) || (0,vega_util_module/* isNumber */.Et)(channelDef) || (0,vega_util_module/* isBoolean */.Lm)(channelDef)) {
        const primitiveType = (0,vega_util_module/* isString */.Kg)(channelDef) ? 'string' : (0,vega_util_module/* isNumber */.Et)(channelDef) ? 'number' : 'boolean';
        warn(primitiveChannelDef(channel, primitiveType, channelDef));
        return { value: channelDef };
    }
    // If a fieldDef contains a field, we need type.
    if (isFieldOrDatumDef(channelDef)) {
        return initFieldOrDatumDef(channelDef, channel, config, opt);
    }
    else if (hasConditionalFieldOrDatumDef(channelDef)) {
        return Object.assign(Object.assign({}, channelDef), { 
            // Need to cast as normalizeFieldDef normally return FieldDef, but here we know that it is definitely Condition<FieldDef>
            condition: initFieldOrDatumDef(channelDef.condition, channel, config, opt) });
    }
    return channelDef;
}
function initFieldOrDatumDef(fd, channel, config, opt) {
    if (isStringFieldOrDatumDef(fd)) {
        const { format, formatType } = fd, rest = channeldef_rest(fd, ["format", "formatType"]);
        if (isCustomFormatType(formatType) && !config.customFormatTypes) {
            warn(customFormatTypeNotAllowed(channel));
            return initFieldOrDatumDef(rest, channel, config, opt);
        }
    }
    else {
        const guideType = isPositionFieldOrDatumDef(fd)
            ? 'axis'
            : isMarkPropFieldOrDatumDef(fd)
                ? 'legend'
                : isFacetFieldDef(fd)
                    ? 'header'
                    : null;
        if (guideType && fd[guideType]) {
            const _a = fd[guideType], { format, formatType } = _a, newGuide = channeldef_rest(_a, ["format", "formatType"]);
            if (isCustomFormatType(formatType) && !config.customFormatTypes) {
                warn(customFormatTypeNotAllowed(channel));
                return initFieldOrDatumDef(Object.assign(Object.assign({}, fd), { [guideType]: newGuide }), channel, config, opt);
            }
        }
    }
    if (isFieldDef(fd)) {
        return initFieldDef(fd, channel, opt);
    }
    return initDatumDef(fd);
}
function initDatumDef(datumDef) {
    let type = datumDef['type'];
    if (type) {
        return datumDef;
    }
    const { datum } = datumDef;
    type = (0,vega_util_module/* isNumber */.Et)(datum) ? 'quantitative' : (0,vega_util_module/* isString */.Kg)(datum) ? 'nominal' : isDateTime(datum) ? 'temporal' : undefined;
    return Object.assign(Object.assign({}, datumDef), { type });
}
function initFieldDef(fd, channel, { compositeMark = false } = {}) {
    const { aggregate, timeUnit, bin, field } = fd;
    const fieldDef = Object.assign({}, fd);
    // Drop invalid aggregate
    if (!compositeMark && aggregate && !isAggregateOp(aggregate) && !isArgmaxDef(aggregate) && !isArgminDef(aggregate)) {
        warn(invalidAggregate(aggregate));
        delete fieldDef.aggregate;
    }
    // Normalize Time Unit
    if (timeUnit) {
        fieldDef.timeUnit = normalizeTimeUnit(timeUnit);
    }
    if (field) {
        fieldDef.field = `${field}`;
    }
    // Normalize bin
    if (isBinning(bin)) {
        fieldDef.bin = normalizeBin(bin, channel);
    }
    if (isBinned(bin) && !isXorY(channel)) {
        warn(channelShouldNotBeUsedForBinned(channel));
    }
    // Normalize Type
    if (isTypedFieldDef(fieldDef)) {
        const { type } = fieldDef;
        const fullType = getFullName(type);
        if (type !== fullType) {
            // convert short type to full type
            fieldDef.type = fullType;
        }
        if (type !== 'quantitative') {
            if (isCountingAggregateOp(aggregate)) {
                warn(invalidFieldTypeForCountAggregate(type, aggregate));
                fieldDef.type = 'quantitative';
            }
        }
    }
    else if (!isSecondaryRangeChannel(channel)) {
        // If type is empty / invalid, then augment with default type
        const newType = defaultType(fieldDef, channel);
        fieldDef['type'] = newType;
    }
    if (isTypedFieldDef(fieldDef)) {
        const { compatible, warning } = channelCompatibility(fieldDef, channel) || {};
        if (compatible === false) {
            warn(warning);
        }
    }
    if (isSortableFieldDef(fieldDef) && (0,vega_util_module/* isString */.Kg)(fieldDef.sort)) {
        const { sort } = fieldDef;
        if (isSortByChannel(sort)) {
            return Object.assign(Object.assign({}, fieldDef), { sort: { encoding: sort } });
        }
        const sub = sort.substr(1);
        if (sort.charAt(0) === '-' && isSortByChannel(sub)) {
            return Object.assign(Object.assign({}, fieldDef), { sort: { encoding: sub, order: 'descending' } });
        }
    }
    if (isFacetFieldDef(fieldDef)) {
        const { header } = fieldDef;
        if (header) {
            const { orient } = header, rest = channeldef_rest(header, ["orient"]);
            if (orient) {
                return Object.assign(Object.assign({}, fieldDef), { header: Object.assign(Object.assign({}, rest), { labelOrient: header.labelOrient || orient, titleOrient: header.titleOrient || orient }) });
            }
        }
    }
    return fieldDef;
}
function normalizeBin(bin, channel) {
    if ((0,vega_util_module/* isBoolean */.Lm)(bin)) {
        return { maxbins: autoMaxBins(channel) };
    }
    else if (bin === 'binned') {
        return {
            binned: true
        };
    }
    else if (!bin.maxbins && !bin.step) {
        return Object.assign(Object.assign({}, bin), { maxbins: autoMaxBins(channel) });
    }
    else {
        return bin;
    }
}
const COMPATIBLE = { compatible: true };
function channelCompatibility(fieldDef, channel) {
    const type = fieldDef.type;
    if (type === 'geojson' && channel !== 'shape') {
        return {
            compatible: false,
            warning: `Channel ${channel} should not be used with a geojson data.`
        };
    }
    switch (channel) {
        case ROW:
        case COLUMN:
        case FACET:
            if (!channeldef_isDiscrete(fieldDef)) {
                return {
                    compatible: false,
                    warning: channelShouldBeDiscrete(channel)
                };
            }
            return COMPATIBLE;
        case X:
        case Y:
        case XOFFSET:
        case YOFFSET:
        case COLOR:
        case FILL:
        case STROKE:
        case TEXT:
        case DETAIL:
        case KEY:
        case TOOLTIP:
        case HREF:
        case URL:
        case ANGLE:
        case THETA:
        case RADIUS:
        case DESCRIPTION:
            return COMPATIBLE;
        case LONGITUDE:
        case LONGITUDE2:
        case LATITUDE:
        case LATITUDE2:
            if (type !== QUANTITATIVE) {
                return {
                    compatible: false,
                    warning: `Channel ${channel} should be used with a quantitative field only, not ${fieldDef.type} field.`
                };
            }
            return COMPATIBLE;
        case OPACITY:
        case FILLOPACITY:
        case STROKEOPACITY:
        case STROKEWIDTH:
        case SIZE:
        case THETA2:
        case RADIUS2:
        case X2:
        case Y2:
            if (type === 'nominal' && !fieldDef['sort']) {
                return {
                    compatible: false,
                    warning: `Channel ${channel} should not be used with an unsorted discrete field.`
                };
            }
            return COMPATIBLE;
        case SHAPE:
        case STROKEDASH:
            if (!channeldef_isDiscrete(fieldDef) && !isDiscretizing(fieldDef)) {
                return {
                    compatible: false,
                    warning: channelShouldBeDiscreteOrDiscretizing(channel)
                };
            }
            return COMPATIBLE;
        case ORDER:
            if (fieldDef.type === 'nominal' && !('sort' in fieldDef)) {
                return {
                    compatible: false,
                    warning: `Channel order is inappropriate for nominal field, which has no inherent order.`
                };
            }
            return COMPATIBLE;
    }
}
/**
 * Check if the field def uses a time format or does not use any format but is temporal
 * (this does not cover field defs that are temporal but use a number format).
 */
function isFieldOrDatumDefForTimeFormat(fieldOrDatumDef) {
    const { formatType } = getFormatMixins(fieldOrDatumDef);
    return formatType === 'time' || (!formatType && isTimeFieldDef(fieldOrDatumDef));
}
/**
 * Check if field def has type `temporal`. If you want to also cover field defs that use a time format, use `isTimeFormatFieldDef`.
 */
function isTimeFieldDef(def) {
    return def && (def['type'] === 'temporal' || (isFieldDef(def) && !!def.timeUnit));
}
/**
 * Getting a value associated with a fielddef.
 * Convert the value to Vega expression if applicable (for datetime object, or string if the field def is temporal or has timeUnit)
 */
function valueExpr(v, { timeUnit, type, wrapTime, undefinedIfExprNotRequired }) {
    var _a;
    const unit = timeUnit && ((_a = normalizeTimeUnit(timeUnit)) === null || _a === void 0 ? void 0 : _a.unit);
    let isTime = unit || type === 'temporal';
    let expr;
    if (isExprRef(v)) {
        expr = v.expr;
    }
    else if (isSignalRef(v)) {
        expr = v.signal;
    }
    else if (isDateTime(v)) {
        isTime = true;
        expr = dateTimeToExpr(v);
    }
    else if ((0,vega_util_module/* isString */.Kg)(v) || (0,vega_util_module/* isNumber */.Et)(v)) {
        if (isTime) {
            expr = `datetime(${stringify(v)})`;
            if (isLocalSingleTimeUnit(unit)) {
                // for single timeUnit, we will use dateTimeToExpr to convert number/string to match the timeUnit
                if (((0,vega_util_module/* isNumber */.Et)(v) && v < 10000) || ((0,vega_util_module/* isString */.Kg)(v) && isNaN(Date.parse(v)))) {
                    expr = dateTimeToExpr({ [unit]: v });
                }
            }
        }
    }
    if (expr) {
        return wrapTime && isTime ? `time(${expr})` : expr;
    }
    // number or boolean or normal string
    return undefinedIfExprNotRequired ? undefined : stringify(v);
}
/**
 * Standardize value array -- convert each value to Vega expression if applicable
 */
function valueArray(fieldOrDatumDef, values) {
    const { type } = fieldOrDatumDef;
    return values.map(v => {
        const expr = valueExpr(v, {
            timeUnit: isFieldDef(fieldOrDatumDef) ? fieldOrDatumDef.timeUnit : undefined,
            type,
            undefinedIfExprNotRequired: true
        });
        // return signal for the expression if we need an expression
        if (expr !== undefined) {
            return { signal: expr };
        }
        // otherwise just return the original value
        return v;
    });
}
/**
 * Checks whether a fieldDef for a particular channel requires a computed bin range.
 */
function binRequiresRange(fieldDef, channel) {
    if (!isBinning(fieldDef.bin)) {
        console.warn('Only call this method for binned field defs.');
        return false;
    }
    // We need the range only when the user explicitly forces a binned field to be use discrete scale. In this case, bin range is used in axis and legend labels.
    // We could check whether the axis or legend exists (not disabled) but that seems overkill.
    return isScaleChannel(channel) && ['ordinal', 'nominal'].includes(fieldDef.type);
}
//# sourceMappingURL=channeldef.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/axis.js

const CONDITIONAL_AXIS_PROP_INDEX = {
    labelAlign: {
        part: 'labels',
        vgProp: 'align'
    },
    labelBaseline: {
        part: 'labels',
        vgProp: 'baseline'
    },
    labelColor: {
        part: 'labels',
        vgProp: 'fill'
    },
    labelFont: {
        part: 'labels',
        vgProp: 'font'
    },
    labelFontSize: {
        part: 'labels',
        vgProp: 'fontSize'
    },
    labelFontStyle: {
        part: 'labels',
        vgProp: 'fontStyle'
    },
    labelFontWeight: {
        part: 'labels',
        vgProp: 'fontWeight'
    },
    labelOpacity: {
        part: 'labels',
        vgProp: 'opacity'
    },
    labelOffset: null,
    labelPadding: null,
    gridColor: {
        part: 'grid',
        vgProp: 'stroke'
    },
    gridDash: {
        part: 'grid',
        vgProp: 'strokeDash'
    },
    gridDashOffset: {
        part: 'grid',
        vgProp: 'strokeDashOffset'
    },
    gridOpacity: {
        part: 'grid',
        vgProp: 'opacity'
    },
    gridWidth: {
        part: 'grid',
        vgProp: 'strokeWidth'
    },
    tickColor: {
        part: 'ticks',
        vgProp: 'stroke'
    },
    tickDash: {
        part: 'ticks',
        vgProp: 'strokeDash'
    },
    tickDashOffset: {
        part: 'ticks',
        vgProp: 'strokeDashOffset'
    },
    tickOpacity: {
        part: 'ticks',
        vgProp: 'opacity'
    },
    tickSize: null,
    tickWidth: {
        part: 'ticks',
        vgProp: 'strokeWidth'
    }
};
function isConditionalAxisValue(v) {
    return v === null || v === void 0 ? void 0 : v.condition;
}
const AXIS_PARTS = ['domain', 'grid', 'labels', 'ticks', 'title'];
/**
 * A dictionary listing whether a certain axis property is applicable for only main axes or only grid axes.
 */
const AXIS_PROPERTY_TYPE = {
    grid: 'grid',
    gridCap: 'grid',
    gridColor: 'grid',
    gridDash: 'grid',
    gridDashOffset: 'grid',
    gridOpacity: 'grid',
    gridScale: 'grid',
    gridWidth: 'grid',
    orient: 'main',
    bandPosition: 'both',
    aria: 'main',
    description: 'main',
    domain: 'main',
    domainCap: 'main',
    domainColor: 'main',
    domainDash: 'main',
    domainDashOffset: 'main',
    domainOpacity: 'main',
    domainWidth: 'main',
    format: 'main',
    formatType: 'main',
    labelAlign: 'main',
    labelAngle: 'main',
    labelBaseline: 'main',
    labelBound: 'main',
    labelColor: 'main',
    labelFlush: 'main',
    labelFlushOffset: 'main',
    labelFont: 'main',
    labelFontSize: 'main',
    labelFontStyle: 'main',
    labelFontWeight: 'main',
    labelLimit: 'main',
    labelLineHeight: 'main',
    labelOffset: 'main',
    labelOpacity: 'main',
    labelOverlap: 'main',
    labelPadding: 'main',
    labels: 'main',
    labelSeparation: 'main',
    maxExtent: 'main',
    minExtent: 'main',
    offset: 'both',
    position: 'main',
    tickCap: 'main',
    tickColor: 'main',
    tickDash: 'main',
    tickDashOffset: 'main',
    tickMinStep: 'both',
    tickOffset: 'both',
    tickOpacity: 'main',
    tickRound: 'both',
    ticks: 'main',
    tickSize: 'main',
    tickWidth: 'both',
    title: 'main',
    titleAlign: 'main',
    titleAnchor: 'main',
    titleAngle: 'main',
    titleBaseline: 'main',
    titleColor: 'main',
    titleFont: 'main',
    titleFontSize: 'main',
    titleFontStyle: 'main',
    titleFontWeight: 'main',
    titleLimit: 'main',
    titleLineHeight: 'main',
    titleOpacity: 'main',
    titlePadding: 'main',
    titleX: 'main',
    titleY: 'main',
    encode: 'both',
    scale: 'both',
    tickBand: 'both',
    tickCount: 'both',
    tickExtra: 'both',
    translate: 'both',
    values: 'both',
    zindex: 'both' // this is actually set afterward, so it doesn't matter
};
const COMMON_AXIS_PROPERTIES_INDEX = {
    orient: 1,
    aria: 1,
    bandPosition: 1,
    description: 1,
    domain: 1,
    domainCap: 1,
    domainColor: 1,
    domainDash: 1,
    domainDashOffset: 1,
    domainOpacity: 1,
    domainWidth: 1,
    format: 1,
    formatType: 1,
    grid: 1,
    gridCap: 1,
    gridColor: 1,
    gridDash: 1,
    gridDashOffset: 1,
    gridOpacity: 1,
    gridWidth: 1,
    labelAlign: 1,
    labelAngle: 1,
    labelBaseline: 1,
    labelBound: 1,
    labelColor: 1,
    labelFlush: 1,
    labelFlushOffset: 1,
    labelFont: 1,
    labelFontSize: 1,
    labelFontStyle: 1,
    labelFontWeight: 1,
    labelLimit: 1,
    labelLineHeight: 1,
    labelOffset: 1,
    labelOpacity: 1,
    labelOverlap: 1,
    labelPadding: 1,
    labels: 1,
    labelSeparation: 1,
    maxExtent: 1,
    minExtent: 1,
    offset: 1,
    position: 1,
    tickBand: 1,
    tickCap: 1,
    tickColor: 1,
    tickCount: 1,
    tickDash: 1,
    tickDashOffset: 1,
    tickExtra: 1,
    tickMinStep: 1,
    tickOffset: 1,
    tickOpacity: 1,
    tickRound: 1,
    ticks: 1,
    tickSize: 1,
    tickWidth: 1,
    title: 1,
    titleAlign: 1,
    titleAnchor: 1,
    titleAngle: 1,
    titleBaseline: 1,
    titleColor: 1,
    titleFont: 1,
    titleFontSize: 1,
    titleFontStyle: 1,
    titleFontWeight: 1,
    titleLimit: 1,
    titleLineHeight: 1,
    titleOpacity: 1,
    titlePadding: 1,
    titleX: 1,
    titleY: 1,
    translate: 1,
    values: 1,
    zindex: 1
};
const AXIS_PROPERTIES_INDEX = Object.assign(Object.assign({}, COMMON_AXIS_PROPERTIES_INDEX), { style: 1, labelExpr: 1, encoding: 1 });
function isAxisProperty(prop) {
    return !!AXIS_PROPERTIES_INDEX[prop];
}
// Export for dependent projects
const AXIS_PROPERTIES = keys(AXIS_PROPERTIES_INDEX);
const AXIS_CONFIGS_INDEX = {
    axis: 1,
    axisBand: 1,
    axisBottom: 1,
    axisDiscrete: 1,
    axisLeft: 1,
    axisPoint: 1,
    axisQuantitative: 1,
    axisRight: 1,
    axisTemporal: 1,
    axisTop: 1,
    axisX: 1,
    axisXBand: 1,
    axisXDiscrete: 1,
    axisXPoint: 1,
    axisXQuantitative: 1,
    axisXTemporal: 1,
    axisY: 1,
    axisYBand: 1,
    axisYDiscrete: 1,
    axisYPoint: 1,
    axisYQuantitative: 1,
    axisYTemporal: 1
};
const AXIS_CONFIGS = keys(AXIS_CONFIGS_INDEX);
//# sourceMappingURL=axis.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/spec/unit.js
function isUnitSpec(spec) {
    return 'mark' in spec;
}
//# sourceMappingURL=unit.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compositemark/base.js


class CompositeMarkNormalizer {
    constructor(name, run) {
        this.name = name;
        this.run = run;
    }
    hasMatchingType(spec) {
        if (isUnitSpec(spec)) {
            return getMarkType(spec.mark) === this.name;
        }
        return false;
    }
}
//# sourceMappingURL=base.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/encoding.js
var encoding_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};









function channelHasField(encoding, channel) {
    const channelDef = encoding && encoding[channel];
    if (channelDef) {
        if ((0,vega_util_module/* isArray */.cy)(channelDef)) {
            return some(channelDef, fieldDef => !!fieldDef.field);
        }
        else {
            return isFieldDef(channelDef) || hasConditionalFieldDef(channelDef);
        }
    }
    return false;
}
function channelHasFieldOrDatum(encoding, channel) {
    const channelDef = encoding && encoding[channel];
    if (channelDef) {
        if ((0,vega_util_module/* isArray */.cy)(channelDef)) {
            return some(channelDef, fieldDef => !!fieldDef.field);
        }
        else {
            return isFieldDef(channelDef) || isDatumDef(channelDef) || hasConditionalFieldOrDatumDef(channelDef);
        }
    }
    return false;
}
function channelHasNestedOffsetScale(encoding, channel) {
    if (isXorY(channel)) {
        const fieldDef = encoding[channel];
        if ((isFieldDef(fieldDef) || isDatumDef(fieldDef)) && isDiscrete(fieldDef.type)) {
            const offsetChannel = getOffsetScaleChannel(channel);
            return channelHasFieldOrDatum(encoding, offsetChannel);
        }
    }
    return false;
}
function isAggregate(encoding) {
    return some(CHANNELS, channel => {
        if (channelHasField(encoding, channel)) {
            const channelDef = encoding[channel];
            if ((0,vega_util_module/* isArray */.cy)(channelDef)) {
                return some(channelDef, fieldDef => !!fieldDef.aggregate);
            }
            else {
                const fieldDef = getFieldDef(channelDef);
                return fieldDef && !!fieldDef.aggregate;
            }
        }
        return false;
    });
}
function extractTransformsFromEncoding(oldEncoding, config) {
    const groupby = [];
    const bins = [];
    const timeUnits = [];
    const aggregate = [];
    const encoding = {};
    forEach(oldEncoding, (channelDef, channel) => {
        // Extract potential embedded transformations along with remaining properties
        if (isFieldDef(channelDef)) {
            const { field, aggregate: aggOp, bin, timeUnit } = channelDef, remaining = encoding_rest(channelDef, ["field", "aggregate", "bin", "timeUnit"]);
            if (aggOp || timeUnit || bin) {
                const guide = getGuide(channelDef);
                const isTitleDefined = guide === null || guide === void 0 ? void 0 : guide.title;
                let newField = vgField(channelDef, { forAs: true });
                const newFieldDef = Object.assign(Object.assign(Object.assign({}, (isTitleDefined ? [] : { title: channeldef_title(channelDef, config, { allowDisabling: true }) })), remaining), { 
                    // Always overwrite field
                    field: newField });
                if (aggOp) {
                    let op;
                    if (isArgmaxDef(aggOp)) {
                        op = 'argmax';
                        newField = vgField({ op: 'argmax', field: aggOp.argmax }, { forAs: true });
                        newFieldDef.field = `${newField}.${field}`;
                    }
                    else if (isArgminDef(aggOp)) {
                        op = 'argmin';
                        newField = vgField({ op: 'argmin', field: aggOp.argmin }, { forAs: true });
                        newFieldDef.field = `${newField}.${field}`;
                    }
                    else if (aggOp !== 'boxplot' && aggOp !== 'errorbar' && aggOp !== 'errorband') {
                        op = aggOp;
                    }
                    if (op) {
                        const aggregateEntry = {
                            op,
                            as: newField
                        };
                        if (field) {
                            aggregateEntry.field = field;
                        }
                        aggregate.push(aggregateEntry);
                    }
                }
                else {
                    groupby.push(newField);
                    if (isTypedFieldDef(channelDef) && isBinning(bin)) {
                        bins.push({ bin, field, as: newField });
                        // Add additional groupbys for range and end of bins
                        groupby.push(vgField(channelDef, { binSuffix: 'end' }));
                        if (binRequiresRange(channelDef, channel)) {
                            groupby.push(vgField(channelDef, { binSuffix: 'range' }));
                        }
                        // Create accompanying 'x2' or 'y2' field if channel is 'x' or 'y' respectively
                        if (isXorY(channel)) {
                            const secondaryChannel = {
                                field: `${newField}_end`
                            };
                            encoding[`${channel}2`] = secondaryChannel;
                        }
                        newFieldDef.bin = 'binned';
                        if (!isSecondaryRangeChannel(channel)) {
                            newFieldDef['type'] = QUANTITATIVE;
                        }
                    }
                    else if (timeUnit) {
                        timeUnits.push({
                            timeUnit,
                            field,
                            as: newField
                        });
                        // define the format type for later compilation
                        const formatType = isTypedFieldDef(channelDef) && channelDef.type !== TEMPORAL && 'time';
                        if (formatType) {
                            if (channel === TEXT || channel === TOOLTIP) {
                                newFieldDef['formatType'] = formatType;
                            }
                            else if (isNonPositionScaleChannel(channel)) {
                                newFieldDef['legend'] = Object.assign({ formatType }, newFieldDef['legend']);
                            }
                            else if (isXorY(channel)) {
                                newFieldDef['axis'] = Object.assign({ formatType }, newFieldDef['axis']);
                            }
                        }
                    }
                }
                // now the field should refer to post-transformed field instead
                encoding[channel] = newFieldDef;
            }
            else {
                groupby.push(field);
                encoding[channel] = oldEncoding[channel];
            }
        }
        else {
            // For value def / signal ref / datum def, just copy
            encoding[channel] = oldEncoding[channel];
        }
    });
    return {
        bins,
        timeUnits,
        aggregate,
        groupby,
        encoding
    };
}
function markChannelCompatible(encoding, channel, mark) {
    const markSupported = supportMark(channel, mark);
    if (!markSupported) {
        return false;
    }
    else if (markSupported === 'binned') {
        const primaryFieldDef = encoding[channel === X2 ? X : Y];
        // circle, point, square and tick only support x2/y2 when their corresponding x/y fieldDef
        // has "binned" data and thus need x2/y2 to specify the bin-end field.
        if (isFieldDef(primaryFieldDef) && isFieldDef(encoding[channel]) && isBinned(primaryFieldDef.bin)) {
            return true;
        }
        else {
            return false;
        }
    }
    return true;
}
function initEncoding(encoding, mark, filled, config) {
    const normalizedEncoding = {};
    for (const key of keys(encoding)) {
        if (!isChannel(key)) {
            // Drop invalid channel
            warn(invalidEncodingChannel(key));
        }
    }
    for (let channel of UNIT_CHANNELS) {
        if (!encoding[channel]) {
            continue;
        }
        const channelDef = encoding[channel];
        if (isXorYOffset(channel)) {
            const mainChannel = getMainChannelFromOffsetChannel(channel);
            const positionDef = normalizedEncoding[mainChannel];
            if (isFieldDef(positionDef)) {
                if (isContinuous(positionDef.type)) {
                    if (isFieldDef(channelDef)) {
                        // TODO: nesting continuous field instead continuous field should
                        // behave like offsetting the data in data domain
                        warn(offsetNestedInsideContinuousPositionScaleDropped(mainChannel));
                        continue;
                    }
                }
            }
            else {
                // no x/y, replace it with main channel
                channel = mainChannel;
                warn(replaceOffsetWithMainChannel(mainChannel));
            }
        }
        if (channel === 'angle' && mark === 'arc' && !encoding.theta) {
            warn(REPLACE_ANGLE_WITH_THETA);
            channel = THETA;
        }
        if (!markChannelCompatible(encoding, channel, mark)) {
            // Drop unsupported channel
            warn(incompatibleChannel(channel, mark));
            continue;
        }
        // Drop line's size if the field is aggregated.
        if (channel === SIZE && mark === 'line') {
            const fieldDef = getFieldDef(encoding[channel]);
            if (fieldDef === null || fieldDef === void 0 ? void 0 : fieldDef.aggregate) {
                warn(LINE_WITH_VARYING_SIZE);
                continue;
            }
        }
        // Drop color if either fill or stroke is specified
        if (channel === COLOR && (filled ? 'fill' in encoding : 'stroke' in encoding)) {
            warn(droppingColor('encoding', { fill: 'fill' in encoding, stroke: 'stroke' in encoding }));
            continue;
        }
        if (channel === DETAIL ||
            (channel === ORDER && !(0,vega_util_module/* isArray */.cy)(channelDef) && !isValueDef(channelDef)) ||
            (channel === TOOLTIP && (0,vega_util_module/* isArray */.cy)(channelDef))) {
            if (channelDef) {
                // Array of fieldDefs for detail channel (or production rule)
                normalizedEncoding[channel] = (0,vega_util_module/* array */.YO)(channelDef).reduce((defs, fieldDef) => {
                    if (!isFieldDef(fieldDef)) {
                        warn(emptyFieldDef(fieldDef, channel));
                    }
                    else {
                        defs.push(initFieldDef(fieldDef, channel));
                    }
                    return defs;
                }, []);
            }
        }
        else {
            if (channel === TOOLTIP && channelDef === null) {
                // Preserve null so we can use it to disable tooltip
                normalizedEncoding[channel] = null;
            }
            else if (!isFieldDef(channelDef) &&
                !isDatumDef(channelDef) &&
                !isValueDef(channelDef) &&
                !isConditionalDef(channelDef) &&
                !isSignalRef(channelDef)) {
                warn(emptyFieldDef(channelDef, channel));
                continue;
            }
            normalizedEncoding[channel] = initChannelDef(channelDef, channel, config);
        }
    }
    return normalizedEncoding;
}
/**
 * For composite marks, we have to call initChannelDef during init so we can infer types earlier.
 */
function normalizeEncoding(encoding, config) {
    const normalizedEncoding = {};
    for (const channel of keys(encoding)) {
        const newChannelDef = initChannelDef(encoding[channel], channel, config, { compositeMark: true });
        normalizedEncoding[channel] = newChannelDef;
    }
    return normalizedEncoding;
}
function fieldDefs(encoding) {
    const arr = [];
    for (const channel of keys(encoding)) {
        if (channelHasField(encoding, channel)) {
            const channelDef = encoding[channel];
            const channelDefArray = (0,vega_util_module/* array */.YO)(channelDef);
            for (const def of channelDefArray) {
                if (isFieldDef(def)) {
                    arr.push(def);
                }
                else if (hasConditionalFieldDef(def)) {
                    arr.push(def.condition);
                }
            }
        }
    }
    return arr;
}
function forEach(mapping, f, thisArg) {
    if (!mapping) {
        return;
    }
    for (const channel of keys(mapping)) {
        const el = mapping[channel];
        if ((0,vega_util_module/* isArray */.cy)(el)) {
            for (const channelDef of el) {
                f.call(thisArg, channelDef, channel);
            }
        }
        else {
            f.call(thisArg, el, channel);
        }
    }
}
function reduce(mapping, f, init, thisArg) {
    if (!mapping) {
        return init;
    }
    return keys(mapping).reduce((r, channel) => {
        const map = mapping[channel];
        if ((0,vega_util_module/* isArray */.cy)(map)) {
            return map.reduce((r1, channelDef) => {
                return f.call(thisArg, r1, channelDef, channel);
            }, r);
        }
        else {
            return f.call(thisArg, r, map, channel);
        }
    }, init);
}
/**
 * Returns list of path grouping fields for the given encoding
 */
function pathGroupingFields(mark, encoding) {
    return keys(encoding).reduce((details, channel) => {
        switch (channel) {
            // x, y, x2, y2, lat, long, lat1, long2, order, tooltip, href, aria label, cursor should not cause lines to group
            case X:
            case Y:
            case HREF:
            case DESCRIPTION:
            case URL:
            case X2:
            case Y2:
            case XOFFSET:
            case YOFFSET:
            case THETA:
            case THETA2:
            case RADIUS:
            case RADIUS2:
            // falls through
            case LATITUDE:
            case LONGITUDE:
            case LATITUDE2:
            case LONGITUDE2:
            // TODO: case 'cursor':
            // text, shape, shouldn't be a part of line/trail/area [falls through]
            case TEXT:
            case SHAPE:
            case ANGLE:
            // falls through
            // tooltip fields should not be added to group by [falls through]
            case TOOLTIP:
                return details;
            case ORDER:
                // order should not group line / trail
                if (mark === 'line' || mark === 'trail') {
                    return details;
                }
            // but order should group area for stacking (falls through)
            case DETAIL:
            case KEY: {
                const channelDef = encoding[channel];
                if ((0,vega_util_module/* isArray */.cy)(channelDef) || isFieldDef(channelDef)) {
                    for (const fieldDef of (0,vega_util_module/* array */.YO)(channelDef)) {
                        if (!fieldDef.aggregate) {
                            details.push(vgField(fieldDef, {}));
                        }
                    }
                }
                return details;
            }
            case SIZE:
                if (mark === 'trail') {
                    // For trail, size should not group trail lines.
                    return details;
                }
            // For line, size should group lines.
            // falls through
            case COLOR:
            case FILL:
            case STROKE:
            case OPACITY:
            case FILLOPACITY:
            case STROKEOPACITY:
            case STROKEDASH:
            case STROKEWIDTH: {
                // TODO strokeDashOffset:
                // falls through
                const fieldDef = getFieldDef(encoding[channel]);
                if (fieldDef && !fieldDef.aggregate) {
                    details.push(vgField(fieldDef, {}));
                }
                return details;
            }
        }
    }, []);
}
//# sourceMappingURL=encoding.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compositemark/common.js
var compositemark_common_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};








function filterTooltipWithAggregatedField(oldEncoding) {
    const { tooltip } = oldEncoding, filteredEncoding = compositemark_common_rest(oldEncoding, ["tooltip"]);
    if (!tooltip) {
        return { filteredEncoding };
    }
    let customTooltipWithAggregatedField;
    let customTooltipWithoutAggregatedField;
    if ((0,vega_util_module/* isArray */.cy)(tooltip)) {
        for (const t of tooltip) {
            if (t.aggregate) {
                if (!customTooltipWithAggregatedField) {
                    customTooltipWithAggregatedField = [];
                }
                customTooltipWithAggregatedField.push(t);
            }
            else {
                if (!customTooltipWithoutAggregatedField) {
                    customTooltipWithoutAggregatedField = [];
                }
                customTooltipWithoutAggregatedField.push(t);
            }
        }
        if (customTooltipWithAggregatedField) {
            filteredEncoding.tooltip = customTooltipWithAggregatedField;
        }
    }
    else {
        if (tooltip['aggregate']) {
            filteredEncoding.tooltip = tooltip;
        }
        else {
            customTooltipWithoutAggregatedField = tooltip;
        }
    }
    if ((0,vega_util_module/* isArray */.cy)(customTooltipWithoutAggregatedField) && customTooltipWithoutAggregatedField.length === 1) {
        customTooltipWithoutAggregatedField = customTooltipWithoutAggregatedField[0];
    }
    return { customTooltipWithoutAggregatedField, filteredEncoding };
}
function getCompositeMarkTooltip(tooltipSummary, continuousAxisChannelDef, encodingWithoutContinuousAxis, withFieldName = true) {
    if ('tooltip' in encodingWithoutContinuousAxis) {
        return { tooltip: encodingWithoutContinuousAxis.tooltip };
    }
    const fiveSummaryTooltip = tooltipSummary.map(({ fieldPrefix, titlePrefix }) => {
        const mainTitle = withFieldName ? ` of ${getTitle(continuousAxisChannelDef)}` : '';
        return {
            field: fieldPrefix + continuousAxisChannelDef.field,
            type: continuousAxisChannelDef.type,
            title: isSignalRef(titlePrefix) ? { signal: `${titlePrefix}"${escape(mainTitle)}"` } : titlePrefix + mainTitle
        };
    });
    const tooltipFieldDefs = fieldDefs(encodingWithoutContinuousAxis).map(toStringFieldDef);
    return {
        tooltip: [
            ...fiveSummaryTooltip,
            // need to cast because TextFieldDef supports fewer types of bin
            ...unique(tooltipFieldDefs, hash)
        ]
    };
}
function getTitle(continuousAxisChannelDef) {
    const { title, field } = continuousAxisChannelDef;
    return getFirstDefined(title, field);
}
function makeCompositeAggregatePartFactory(compositeMarkDef, continuousAxis, continuousAxisChannelDef, sharedEncoding, compositeMarkConfig) {
    const { scale, axis } = continuousAxisChannelDef;
    return ({ partName, mark, positionPrefix, endPositionPrefix = undefined, extraEncoding = {} }) => {
        const title = getTitle(continuousAxisChannelDef);
        return partLayerMixins(compositeMarkDef, partName, compositeMarkConfig, {
            mark,
            encoding: Object.assign(Object.assign(Object.assign({ [continuousAxis]: Object.assign(Object.assign(Object.assign({ field: `${positionPrefix}_${continuousAxisChannelDef.field}`, type: continuousAxisChannelDef.type }, (title !== undefined ? { title } : {})), (scale !== undefined ? { scale } : {})), (axis !== undefined ? { axis } : {})) }, ((0,vega_util_module/* isString */.Kg)(endPositionPrefix)
                ? {
                    [`${continuousAxis}2`]: {
                        field: `${endPositionPrefix}_${continuousAxisChannelDef.field}`
                    }
                }
                : {})), sharedEncoding), extraEncoding)
        });
    };
}
function partLayerMixins(markDef, part, compositeMarkConfig, partBaseSpec) {
    const { clip, color, opacity } = markDef;
    const mark = markDef.type;
    if (markDef[part] || (markDef[part] === undefined && compositeMarkConfig[part])) {
        return [
            Object.assign(Object.assign({}, partBaseSpec), { mark: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, compositeMarkConfig[part]), (clip ? { clip } : {})), (color ? { color } : {})), (opacity ? { opacity } : {})), (isMarkDef(partBaseSpec.mark) ? partBaseSpec.mark : { type: partBaseSpec.mark })), { style: `${mark}-${String(part)}` }), ((0,vega_util_module/* isBoolean */.Lm)(markDef[part]) ? {} : markDef[part])) })
        ];
    }
    return [];
}
function compositeMarkContinuousAxis(spec, orient, compositeMark) {
    const { encoding } = spec;
    const continuousAxis = orient === 'vertical' ? 'y' : 'x';
    const continuousAxisChannelDef = encoding[continuousAxis]; // Safe to cast because if x is not continuous fielddef, the orient would not be horizontal.
    const continuousAxisChannelDef2 = encoding[`${continuousAxis}2`];
    const continuousAxisChannelDefError = encoding[`${continuousAxis}Error`];
    const continuousAxisChannelDefError2 = encoding[`${continuousAxis}Error2`];
    return {
        continuousAxisChannelDef: filterAggregateFromChannelDef(continuousAxisChannelDef, compositeMark),
        continuousAxisChannelDef2: filterAggregateFromChannelDef(continuousAxisChannelDef2, compositeMark),
        continuousAxisChannelDefError: filterAggregateFromChannelDef(continuousAxisChannelDefError, compositeMark),
        continuousAxisChannelDefError2: filterAggregateFromChannelDef(continuousAxisChannelDefError2, compositeMark),
        continuousAxis
    };
}
function filterAggregateFromChannelDef(continuousAxisChannelDef, compositeMark) {
    if (continuousAxisChannelDef === null || continuousAxisChannelDef === void 0 ? void 0 : continuousAxisChannelDef.aggregate) {
        const { aggregate } = continuousAxisChannelDef, continuousAxisWithoutAggregate = compositemark_common_rest(continuousAxisChannelDef, ["aggregate"]);
        if (aggregate !== compositeMark) {
            warn(errorBarContinuousAxisHasCustomizedAggregate(aggregate, compositeMark));
        }
        return continuousAxisWithoutAggregate;
    }
    else {
        return continuousAxisChannelDef;
    }
}
function compositeMarkOrient(spec, compositeMark) {
    const { mark, encoding } = spec;
    const { x, y } = encoding;
    if (isMarkDef(mark) && mark.orient) {
        return mark.orient;
    }
    if (isContinuousFieldOrDatumDef(x)) {
        // x is continuous
        if (isContinuousFieldOrDatumDef(y)) {
            // both x and y are continuous
            const xAggregate = isFieldDef(x) && x.aggregate;
            const yAggregate = isFieldDef(y) && y.aggregate;
            if (!xAggregate && yAggregate === compositeMark) {
                return 'vertical';
            }
            else if (!yAggregate && xAggregate === compositeMark) {
                return 'horizontal';
            }
            else if (xAggregate === compositeMark && yAggregate === compositeMark) {
                throw new Error('Both x and y cannot have aggregate');
            }
            else {
                if (isFieldOrDatumDefForTimeFormat(y) && !isFieldOrDatumDefForTimeFormat(x)) {
                    // y is temporal but x is not
                    return 'horizontal';
                }
                // default orientation for two continuous
                return 'vertical';
            }
        }
        return 'horizontal';
    }
    else if (isContinuousFieldOrDatumDef(y)) {
        // y is continuous but x is not
        return 'vertical';
    }
    else {
        // Neither x nor y is continuous.
        throw new Error(`Need a valid continuous axis for ${compositeMark}s`);
    }
}
//# sourceMappingURL=common.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compositemark/boxplot.js
var boxplot_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};








const BOXPLOT = 'boxplot';
const BOXPLOT_PARTS = ['box', 'median', 'outliers', 'rule', 'ticks'];
const boxPlotNormalizer = new CompositeMarkNormalizer(BOXPLOT, normalizeBoxPlot);
function getBoxPlotType(extent) {
    if ((0,vega_util_module/* isNumber */.Et)(extent)) {
        return 'tukey';
    }
    // Ham: If we ever want to, we could add another extent syntax `{kIQR: number}` for the original [Q1-k*IQR, Q3+k*IQR] whisker and call this boxPlotType = `kIQR`. However, I'm not exposing this for now.
    return extent;
}
function normalizeBoxPlot(spec, { config }) {
    var _a, _b;
    // Need to initEncoding first so we can infer type
    spec = Object.assign(Object.assign({}, spec), { encoding: normalizeEncoding(spec.encoding, config) });
    const { mark, encoding: _encoding, params, projection: _p } = spec, outerSpec = boxplot_rest(spec, ["mark", "encoding", "params", "projection"]);
    const markDef = isMarkDef(mark) ? mark : { type: mark };
    // TODO(https://github.com/vega/vega-lite/issues/3702): add selection support
    if (params) {
        warn(selectionNotSupported('boxplot'));
    }
    const extent = (_a = markDef.extent) !== null && _a !== void 0 ? _a : config.boxplot.extent;
    const sizeValue = getMarkPropOrConfig('size', markDef, // TODO: https://github.com/vega/vega-lite/issues/6245
    config);
    const invalid = markDef.invalid;
    const boxPlotType = getBoxPlotType(extent);
    const { bins, timeUnits, transform, continuousAxisChannelDef, continuousAxis, groupby, aggregate, encodingWithoutContinuousAxis, ticksOrient, boxOrient, customTooltipWithoutAggregatedField } = boxParams(spec, extent, config);
    const { color, size } = encodingWithoutContinuousAxis, encodingWithoutSizeColorAndContinuousAxis = boxplot_rest(encodingWithoutContinuousAxis, ["color", "size"]);
    const makeBoxPlotPart = (sharedEncoding) => {
        return makeCompositeAggregatePartFactory(markDef, continuousAxis, continuousAxisChannelDef, sharedEncoding, config.boxplot);
    };
    const makeBoxPlotExtent = makeBoxPlotPart(encodingWithoutSizeColorAndContinuousAxis);
    const makeBoxPlotBox = makeBoxPlotPart(encodingWithoutContinuousAxis);
    const makeBoxPlotMidTick = makeBoxPlotPart(Object.assign(Object.assign({}, encodingWithoutSizeColorAndContinuousAxis), (size ? { size } : {})));
    const fiveSummaryTooltipEncoding = getCompositeMarkTooltip([
        { fieldPrefix: boxPlotType === 'min-max' ? 'upper_whisker_' : 'max_', titlePrefix: 'Max' },
        { fieldPrefix: 'upper_box_', titlePrefix: 'Q3' },
        { fieldPrefix: 'mid_box_', titlePrefix: 'Median' },
        { fieldPrefix: 'lower_box_', titlePrefix: 'Q1' },
        { fieldPrefix: boxPlotType === 'min-max' ? 'lower_whisker_' : 'min_', titlePrefix: 'Min' }
    ], continuousAxisChannelDef, encodingWithoutContinuousAxis);
    // ## Whisker Layers
    const endTick = { type: 'tick', color: 'black', opacity: 1, orient: ticksOrient, invalid, aria: false };
    const whiskerTooltipEncoding = boxPlotType === 'min-max'
        ? fiveSummaryTooltipEncoding // for min-max, show five-summary tooltip for whisker
        : // for tukey / k-IQR, just show upper/lower-whisker
            getCompositeMarkTooltip([
                { fieldPrefix: 'upper_whisker_', titlePrefix: 'Upper Whisker' },
                { fieldPrefix: 'lower_whisker_', titlePrefix: 'Lower Whisker' }
            ], continuousAxisChannelDef, encodingWithoutContinuousAxis);
    const whiskerLayers = [
        ...makeBoxPlotExtent({
            partName: 'rule',
            mark: { type: 'rule', invalid, aria: false },
            positionPrefix: 'lower_whisker',
            endPositionPrefix: 'lower_box',
            extraEncoding: whiskerTooltipEncoding
        }),
        ...makeBoxPlotExtent({
            partName: 'rule',
            mark: { type: 'rule', invalid, aria: false },
            positionPrefix: 'upper_box',
            endPositionPrefix: 'upper_whisker',
            extraEncoding: whiskerTooltipEncoding
        }),
        ...makeBoxPlotExtent({
            partName: 'ticks',
            mark: endTick,
            positionPrefix: 'lower_whisker',
            extraEncoding: whiskerTooltipEncoding
        }),
        ...makeBoxPlotExtent({
            partName: 'ticks',
            mark: endTick,
            positionPrefix: 'upper_whisker',
            extraEncoding: whiskerTooltipEncoding
        })
    ];
    // ## Box Layers
    // TODO: support hiding certain mark parts
    const boxLayers = [
        ...(boxPlotType !== 'tukey' ? whiskerLayers : []),
        ...makeBoxPlotBox({
            partName: 'box',
            mark: Object.assign(Object.assign({ type: 'bar' }, (sizeValue ? { size: sizeValue } : {})), { orient: boxOrient, invalid, ariaRoleDescription: 'box' }),
            positionPrefix: 'lower_box',
            endPositionPrefix: 'upper_box',
            extraEncoding: fiveSummaryTooltipEncoding
        }),
        ...makeBoxPlotMidTick({
            partName: 'median',
            mark: Object.assign(Object.assign(Object.assign({ type: 'tick', invalid }, ((0,vega_util_module/* isObject */.Gv)(config.boxplot.median) && config.boxplot.median.color ? { color: config.boxplot.median.color } : {})), (sizeValue ? { size: sizeValue } : {})), { orient: ticksOrient, aria: false }),
            positionPrefix: 'mid_box',
            extraEncoding: fiveSummaryTooltipEncoding
        })
    ];
    if (boxPlotType === 'min-max') {
        return Object.assign(Object.assign({}, outerSpec), { transform: ((_b = outerSpec.transform) !== null && _b !== void 0 ? _b : []).concat(transform), layer: boxLayers });
    }
    // Tukey Box Plot
    const lowerBoxExpr = `datum["lower_box_${continuousAxisChannelDef.field}"]`;
    const upperBoxExpr = `datum["upper_box_${continuousAxisChannelDef.field}"]`;
    const iqrExpr = `(${upperBoxExpr} - ${lowerBoxExpr})`;
    const lowerWhiskerExpr = `${lowerBoxExpr} - ${extent} * ${iqrExpr}`;
    const upperWhiskerExpr = `${upperBoxExpr} + ${extent} * ${iqrExpr}`;
    const fieldExpr = `datum["${continuousAxisChannelDef.field}"]`;
    const joinaggregateTransform = {
        joinaggregate: boxParamsQuartiles(continuousAxisChannelDef.field),
        groupby
    };
    const filteredWhiskerSpec = {
        transform: [
            {
                filter: `(${lowerWhiskerExpr} <= ${fieldExpr}) && (${fieldExpr} <= ${upperWhiskerExpr})`
            },
            {
                aggregate: [
                    {
                        op: 'min',
                        field: continuousAxisChannelDef.field,
                        as: `lower_whisker_${continuousAxisChannelDef.field}`
                    },
                    {
                        op: 'max',
                        field: continuousAxisChannelDef.field,
                        as: `upper_whisker_${continuousAxisChannelDef.field}`
                    },
                    // preserve lower_box / upper_box
                    {
                        op: 'min',
                        field: `lower_box_${continuousAxisChannelDef.field}`,
                        as: `lower_box_${continuousAxisChannelDef.field}`
                    },
                    {
                        op: 'max',
                        field: `upper_box_${continuousAxisChannelDef.field}`,
                        as: `upper_box_${continuousAxisChannelDef.field}`
                    },
                    ...aggregate
                ],
                groupby
            }
        ],
        layer: whiskerLayers
    };
    const { tooltip } = encodingWithoutSizeColorAndContinuousAxis, encodingWithoutSizeColorContinuousAxisAndTooltip = boxplot_rest(encodingWithoutSizeColorAndContinuousAxis, ["tooltip"]);
    const { scale, axis } = continuousAxisChannelDef;
    const title = getTitle(continuousAxisChannelDef);
    const axisWithoutTitle = omit(axis, ['title']);
    const outlierLayersMixins = partLayerMixins(markDef, 'outliers', config.boxplot, {
        transform: [{ filter: `(${fieldExpr} < ${lowerWhiskerExpr}) || (${fieldExpr} > ${upperWhiskerExpr})` }],
        mark: 'point',
        encoding: Object.assign(Object.assign(Object.assign({ [continuousAxis]: Object.assign(Object.assign(Object.assign({ field: continuousAxisChannelDef.field, type: continuousAxisChannelDef.type }, (title !== undefined ? { title } : {})), (scale !== undefined ? { scale } : {})), (isEmpty(axisWithoutTitle) ? {} : { axis: axisWithoutTitle })) }, encodingWithoutSizeColorContinuousAxisAndTooltip), (color ? { color } : {})), (customTooltipWithoutAggregatedField ? { tooltip: customTooltipWithoutAggregatedField } : {}))
    })[0];
    let filteredLayersMixins;
    const filteredLayersMixinsTransforms = [...bins, ...timeUnits, joinaggregateTransform];
    if (outlierLayersMixins) {
        filteredLayersMixins = {
            transform: filteredLayersMixinsTransforms,
            layer: [outlierLayersMixins, filteredWhiskerSpec]
        };
    }
    else {
        filteredLayersMixins = filteredWhiskerSpec;
        filteredLayersMixins.transform.unshift(...filteredLayersMixinsTransforms);
    }
    return Object.assign(Object.assign({}, outerSpec), { layer: [
            filteredLayersMixins,
            {
                // boxplot
                transform,
                layer: boxLayers
            }
        ] });
}
function boxParamsQuartiles(continousAxisField) {
    return [
        {
            op: 'q1',
            field: continousAxisField,
            as: `lower_box_${continousAxisField}`
        },
        {
            op: 'q3',
            field: continousAxisField,
            as: `upper_box_${continousAxisField}`
        }
    ];
}
function boxParams(spec, extent, config) {
    const orient = compositeMarkOrient(spec, BOXPLOT);
    const { continuousAxisChannelDef, continuousAxis } = compositeMarkContinuousAxis(spec, orient, BOXPLOT);
    const continuousFieldName = continuousAxisChannelDef.field;
    const boxPlotType = getBoxPlotType(extent);
    const boxplotSpecificAggregate = [
        ...boxParamsQuartiles(continuousFieldName),
        {
            op: 'median',
            field: continuousFieldName,
            as: `mid_box_${continuousFieldName}`
        },
        {
            op: 'min',
            field: continuousFieldName,
            as: (boxPlotType === 'min-max' ? 'lower_whisker_' : 'min_') + continuousFieldName
        },
        {
            op: 'max',
            field: continuousFieldName,
            as: (boxPlotType === 'min-max' ? 'upper_whisker_' : 'max_') + continuousFieldName
        }
    ];
    const postAggregateCalculates = boxPlotType === 'min-max' || boxPlotType === 'tukey'
        ? []
        : [
            // This is for the  original k-IQR, which we do not expose
            {
                calculate: `datum["upper_box_${continuousFieldName}"] - datum["lower_box_${continuousFieldName}"]`,
                as: `iqr_${continuousFieldName}`
            },
            {
                calculate: `min(datum["upper_box_${continuousFieldName}"] + datum["iqr_${continuousFieldName}"] * ${extent}, datum["max_${continuousFieldName}"])`,
                as: `upper_whisker_${continuousFieldName}`
            },
            {
                calculate: `max(datum["lower_box_${continuousFieldName}"] - datum["iqr_${continuousFieldName}"] * ${extent}, datum["min_${continuousFieldName}"])`,
                as: `lower_whisker_${continuousFieldName}`
            }
        ];
    const _a = spec.encoding, _b = continuousAxis, oldContinuousAxisChannelDef = _a[_b], oldEncodingWithoutContinuousAxis = boxplot_rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
    const { customTooltipWithoutAggregatedField, filteredEncoding } = filterTooltipWithAggregatedField(oldEncodingWithoutContinuousAxis);
    const { bins, timeUnits, aggregate, groupby, encoding: encodingWithoutContinuousAxis } = extractTransformsFromEncoding(filteredEncoding, config);
    const ticksOrient = orient === 'vertical' ? 'horizontal' : 'vertical';
    const boxOrient = orient;
    const transform = [
        ...bins,
        ...timeUnits,
        {
            aggregate: [...aggregate, ...boxplotSpecificAggregate],
            groupby
        },
        ...postAggregateCalculates
    ];
    return {
        bins,
        timeUnits,
        transform,
        groupby,
        aggregate,
        continuousAxisChannelDef,
        continuousAxis,
        encodingWithoutContinuousAxis,
        ticksOrient,
        boxOrient,
        customTooltipWithoutAggregatedField
    };
}
//# sourceMappingURL=boxplot.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compositemark/errorbar.js
var errorbar_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};







const ERRORBAR = 'errorbar';
const ERRORBAR_PARTS = ['ticks', 'rule'];
const errorBarNormalizer = new CompositeMarkNormalizer(ERRORBAR, normalizeErrorBar);
function normalizeErrorBar(spec, { config }) {
    // Need to initEncoding first so we can infer type
    spec = Object.assign(Object.assign({}, spec), { encoding: normalizeEncoding(spec.encoding, config) });
    const { transform, continuousAxisChannelDef, continuousAxis, encodingWithoutContinuousAxis, ticksOrient, markDef, outerSpec, tooltipEncoding } = errorBarParams(spec, ERRORBAR, config);
    delete encodingWithoutContinuousAxis['size'];
    const makeErrorBarPart = makeCompositeAggregatePartFactory(markDef, continuousAxis, continuousAxisChannelDef, encodingWithoutContinuousAxis, config.errorbar);
    const thickness = markDef.thickness;
    const size = markDef.size;
    const tick = Object.assign(Object.assign({ type: 'tick', orient: ticksOrient, aria: false }, (thickness !== undefined ? { thickness } : {})), (size !== undefined ? { size } : {}));
    const layer = [
        ...makeErrorBarPart({
            partName: 'ticks',
            mark: tick,
            positionPrefix: 'lower',
            extraEncoding: tooltipEncoding
        }),
        ...makeErrorBarPart({
            partName: 'ticks',
            mark: tick,
            positionPrefix: 'upper',
            extraEncoding: tooltipEncoding
        }),
        ...makeErrorBarPart({
            partName: 'rule',
            mark: Object.assign({ type: 'rule', ariaRoleDescription: 'errorbar' }, (thickness !== undefined ? { size: thickness } : {})),
            positionPrefix: 'lower',
            endPositionPrefix: 'upper',
            extraEncoding: tooltipEncoding
        })
    ];
    return Object.assign(Object.assign(Object.assign({}, outerSpec), { transform }), (layer.length > 1 ? { layer } : Object.assign({}, layer[0])));
}
function errorBarOrientAndInputType(spec, compositeMark) {
    const { encoding } = spec;
    if (errorBarIsInputTypeRaw(encoding)) {
        return {
            orient: compositeMarkOrient(spec, compositeMark),
            inputType: 'raw'
        };
    }
    const isTypeAggregatedUpperLower = errorBarIsInputTypeAggregatedUpperLower(encoding);
    const isTypeAggregatedError = errorBarIsInputTypeAggregatedError(encoding);
    const x = encoding.x;
    const y = encoding.y;
    if (isTypeAggregatedUpperLower) {
        // type is aggregated-upper-lower
        if (isTypeAggregatedError) {
            throw new Error(`${compositeMark} cannot be both type aggregated-upper-lower and aggregated-error`);
        }
        const x2 = encoding.x2;
        const y2 = encoding.y2;
        if (isFieldOrDatumDef(x2) && isFieldOrDatumDef(y2)) {
            // having both x, x2 and y, y2
            throw new Error(`${compositeMark} cannot have both x2 and y2`);
        }
        else if (isFieldOrDatumDef(x2)) {
            if (isContinuousFieldOrDatumDef(x)) {
                // having x, x2 quantitative and field y, y2 are not specified
                return { orient: 'horizontal', inputType: 'aggregated-upper-lower' };
            }
            else {
                // having x, x2 that are not both quantitative
                throw new Error(`Both x and x2 have to be quantitative in ${compositeMark}`);
            }
        }
        else if (isFieldOrDatumDef(y2)) {
            // y2 is a FieldDef
            if (isContinuousFieldOrDatumDef(y)) {
                // having y, y2 quantitative and field x, x2 are not specified
                return { orient: 'vertical', inputType: 'aggregated-upper-lower' };
            }
            else {
                // having y, y2 that are not both quantitative
                throw new Error(`Both y and y2 have to be quantitative in ${compositeMark}`);
            }
        }
        throw new Error('No ranged axis');
    }
    else {
        // type is aggregated-error
        const xError = encoding.xError;
        const xError2 = encoding.xError2;
        const yError = encoding.yError;
        const yError2 = encoding.yError2;
        if (isFieldOrDatumDef(xError2) && !isFieldOrDatumDef(xError)) {
            // having xError2 without xError
            throw new Error(`${compositeMark} cannot have xError2 without xError`);
        }
        if (isFieldOrDatumDef(yError2) && !isFieldOrDatumDef(yError)) {
            // having yError2 without yError
            throw new Error(`${compositeMark} cannot have yError2 without yError`);
        }
        if (isFieldOrDatumDef(xError) && isFieldOrDatumDef(yError)) {
            // having both xError and yError
            throw new Error(`${compositeMark} cannot have both xError and yError with both are quantiative`);
        }
        else if (isFieldOrDatumDef(xError)) {
            if (isContinuousFieldOrDatumDef(x)) {
                // having x and xError that are all quantitative
                return { orient: 'horizontal', inputType: 'aggregated-error' };
            }
            else {
                // having x, xError, and xError2 that are not all quantitative
                throw new Error('All x, xError, and xError2 (if exist) have to be quantitative');
            }
        }
        else if (isFieldOrDatumDef(yError)) {
            if (isContinuousFieldOrDatumDef(y)) {
                // having y and yError that are all quantitative
                return { orient: 'vertical', inputType: 'aggregated-error' };
            }
            else {
                // having y, yError, and yError2 that are not all quantitative
                throw new Error('All y, yError, and yError2 (if exist) have to be quantitative');
            }
        }
        throw new Error('No ranged axis');
    }
}
function errorBarIsInputTypeRaw(encoding) {
    return ((isFieldOrDatumDef(encoding.x) || isFieldOrDatumDef(encoding.y)) &&
        !isFieldOrDatumDef(encoding.x2) &&
        !isFieldOrDatumDef(encoding.y2) &&
        !isFieldOrDatumDef(encoding.xError) &&
        !isFieldOrDatumDef(encoding.xError2) &&
        !isFieldOrDatumDef(encoding.yError) &&
        !isFieldOrDatumDef(encoding.yError2));
}
function errorBarIsInputTypeAggregatedUpperLower(encoding) {
    return isFieldOrDatumDef(encoding.x2) || isFieldOrDatumDef(encoding.y2);
}
function errorBarIsInputTypeAggregatedError(encoding) {
    return (isFieldOrDatumDef(encoding.xError) ||
        isFieldOrDatumDef(encoding.xError2) ||
        isFieldOrDatumDef(encoding.yError) ||
        isFieldOrDatumDef(encoding.yError2));
}
function errorBarParams(spec, compositeMark, config) {
    var _a;
    // TODO: use selection
    const { mark, encoding, params, projection: _p } = spec, outerSpec = errorbar_rest(spec, ["mark", "encoding", "params", "projection"]);
    const markDef = isMarkDef(mark) ? mark : { type: mark };
    // TODO(https://github.com/vega/vega-lite/issues/3702): add selection support
    if (params) {
        warn(selectionNotSupported(compositeMark));
    }
    const { orient, inputType } = errorBarOrientAndInputType(spec, compositeMark);
    const { continuousAxisChannelDef, continuousAxisChannelDef2, continuousAxisChannelDefError, continuousAxisChannelDefError2, continuousAxis } = compositeMarkContinuousAxis(spec, orient, compositeMark);
    const { errorBarSpecificAggregate, postAggregateCalculates, tooltipSummary, tooltipTitleWithFieldName } = errorBarAggregationAndCalculation(markDef, continuousAxisChannelDef, continuousAxisChannelDef2, continuousAxisChannelDefError, continuousAxisChannelDefError2, inputType, compositeMark, config);
    const _b = encoding, _c = continuousAxis, oldContinuousAxisChannelDef = _b[_c], _d = continuousAxis === 'x' ? 'x2' : 'y2', oldContinuousAxisChannelDef2 = _b[_d], _e = continuousAxis === 'x' ? 'xError' : 'yError', oldContinuousAxisChannelDefError = _b[_e], _f = continuousAxis === 'x' ? 'xError2' : 'yError2', oldContinuousAxisChannelDefError2 = _b[_f], oldEncodingWithoutContinuousAxis = errorbar_rest(_b, [typeof _c === "symbol" ? _c : _c + "", typeof _d === "symbol" ? _d : _d + "", typeof _e === "symbol" ? _e : _e + "", typeof _f === "symbol" ? _f : _f + ""]);
    const { bins, timeUnits, aggregate: oldAggregate, groupby: oldGroupBy, encoding: encodingWithoutContinuousAxis } = extractTransformsFromEncoding(oldEncodingWithoutContinuousAxis, config);
    const aggregate = [...oldAggregate, ...errorBarSpecificAggregate];
    const groupby = inputType !== 'raw' ? [] : oldGroupBy;
    const tooltipEncoding = getCompositeMarkTooltip(tooltipSummary, continuousAxisChannelDef, encodingWithoutContinuousAxis, tooltipTitleWithFieldName);
    return {
        transform: [
            ...((_a = outerSpec.transform) !== null && _a !== void 0 ? _a : []),
            ...bins,
            ...timeUnits,
            ...(aggregate.length === 0 ? [] : [{ aggregate, groupby }]),
            ...postAggregateCalculates
        ],
        groupby,
        continuousAxisChannelDef,
        continuousAxis,
        encodingWithoutContinuousAxis,
        ticksOrient: orient === 'vertical' ? 'horizontal' : 'vertical',
        markDef,
        outerSpec,
        tooltipEncoding
    };
}
function errorBarAggregationAndCalculation(markDef, continuousAxisChannelDef, continuousAxisChannelDef2, continuousAxisChannelDefError, continuousAxisChannelDefError2, inputType, compositeMark, config) {
    let errorBarSpecificAggregate = [];
    let postAggregateCalculates = [];
    const continuousFieldName = continuousAxisChannelDef.field;
    let tooltipSummary;
    let tooltipTitleWithFieldName = false;
    if (inputType === 'raw') {
        const center = markDef.center
            ? markDef.center
            : markDef.extent
                ? markDef.extent === 'iqr'
                    ? 'median'
                    : 'mean'
                : config.errorbar.center;
        const extent = markDef.extent ? markDef.extent : center === 'mean' ? 'stderr' : 'iqr';
        if ((center === 'median') !== (extent === 'iqr')) {
            warn(errorBarCenterIsUsedWithWrongExtent(center, extent, compositeMark));
        }
        if (extent === 'stderr' || extent === 'stdev') {
            errorBarSpecificAggregate = [
                { op: extent, field: continuousFieldName, as: `extent_${continuousFieldName}` },
                { op: center, field: continuousFieldName, as: `center_${continuousFieldName}` }
            ];
            postAggregateCalculates = [
                {
                    calculate: `datum["center_${continuousFieldName}"] + datum["extent_${continuousFieldName}"]`,
                    as: `upper_${continuousFieldName}`
                },
                {
                    calculate: `datum["center_${continuousFieldName}"] - datum["extent_${continuousFieldName}"]`,
                    as: `lower_${continuousFieldName}`
                }
            ];
            tooltipSummary = [
                { fieldPrefix: 'center_', titlePrefix: titleCase(center) },
                { fieldPrefix: 'upper_', titlePrefix: getTitlePrefix(center, extent, '+') },
                { fieldPrefix: 'lower_', titlePrefix: getTitlePrefix(center, extent, '-') }
            ];
            tooltipTitleWithFieldName = true;
        }
        else {
            let centerOp;
            let lowerExtentOp;
            let upperExtentOp;
            if (extent === 'ci') {
                centerOp = 'mean';
                lowerExtentOp = 'ci0';
                upperExtentOp = 'ci1';
            }
            else {
                centerOp = 'median';
                lowerExtentOp = 'q1';
                upperExtentOp = 'q3';
            }
            errorBarSpecificAggregate = [
                { op: lowerExtentOp, field: continuousFieldName, as: `lower_${continuousFieldName}` },
                { op: upperExtentOp, field: continuousFieldName, as: `upper_${continuousFieldName}` },
                { op: centerOp, field: continuousFieldName, as: `center_${continuousFieldName}` }
            ];
            tooltipSummary = [
                {
                    fieldPrefix: 'upper_',
                    titlePrefix: channeldef_title({ field: continuousFieldName, aggregate: upperExtentOp, type: 'quantitative' }, config, {
                        allowDisabling: false
                    })
                },
                {
                    fieldPrefix: 'lower_',
                    titlePrefix: channeldef_title({ field: continuousFieldName, aggregate: lowerExtentOp, type: 'quantitative' }, config, {
                        allowDisabling: false
                    })
                },
                {
                    fieldPrefix: 'center_',
                    titlePrefix: channeldef_title({ field: continuousFieldName, aggregate: centerOp, type: 'quantitative' }, config, {
                        allowDisabling: false
                    })
                }
            ];
        }
    }
    else {
        if (markDef.center || markDef.extent) {
            warn(errorBarCenterAndExtentAreNotNeeded(markDef.center, markDef.extent));
        }
        if (inputType === 'aggregated-upper-lower') {
            tooltipSummary = [];
            postAggregateCalculates = [
                { calculate: `datum["${continuousAxisChannelDef2.field}"]`, as: `upper_${continuousFieldName}` },
                { calculate: `datum["${continuousFieldName}"]`, as: `lower_${continuousFieldName}` }
            ];
        }
        else if (inputType === 'aggregated-error') {
            tooltipSummary = [{ fieldPrefix: '', titlePrefix: continuousFieldName }];
            postAggregateCalculates = [
                {
                    calculate: `datum["${continuousFieldName}"] + datum["${continuousAxisChannelDefError.field}"]`,
                    as: `upper_${continuousFieldName}`
                }
            ];
            if (continuousAxisChannelDefError2) {
                postAggregateCalculates.push({
                    calculate: `datum["${continuousFieldName}"] + datum["${continuousAxisChannelDefError2.field}"]`,
                    as: `lower_${continuousFieldName}`
                });
            }
            else {
                postAggregateCalculates.push({
                    calculate: `datum["${continuousFieldName}"] - datum["${continuousAxisChannelDefError.field}"]`,
                    as: `lower_${continuousFieldName}`
                });
            }
        }
        for (const postAggregateCalculate of postAggregateCalculates) {
            tooltipSummary.push({
                fieldPrefix: postAggregateCalculate.as.substring(0, 6),
                titlePrefix: replaceAll(replaceAll(postAggregateCalculate.calculate, 'datum["', ''), '"]', '')
            });
        }
    }
    return { postAggregateCalculates, errorBarSpecificAggregate, tooltipSummary, tooltipTitleWithFieldName };
}
function getTitlePrefix(center, extent, operation) {
    return `${titleCase(center)} ${operation} ${extent}`;
}
//# sourceMappingURL=errorbar.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compositemark/errorband.js





const ERRORBAND = 'errorband';
const ERRORBAND_PARTS = ['band', 'borders'];
const errorBandNormalizer = new CompositeMarkNormalizer(ERRORBAND, normalizeErrorBand);
function normalizeErrorBand(spec, { config }) {
    // Need to initEncoding first so we can infer type
    spec = Object.assign(Object.assign({}, spec), { encoding: normalizeEncoding(spec.encoding, config) });
    const { transform, continuousAxisChannelDef, continuousAxis, encodingWithoutContinuousAxis, markDef, outerSpec, tooltipEncoding } = errorBarParams(spec, ERRORBAND, config);
    const errorBandDef = markDef;
    const makeErrorBandPart = makeCompositeAggregatePartFactory(errorBandDef, continuousAxis, continuousAxisChannelDef, encodingWithoutContinuousAxis, config.errorband);
    const is2D = spec.encoding.x !== undefined && spec.encoding.y !== undefined;
    let bandMark = { type: is2D ? 'area' : 'rect' };
    let bordersMark = { type: is2D ? 'line' : 'rule' };
    const interpolate = Object.assign(Object.assign({}, (errorBandDef.interpolate ? { interpolate: errorBandDef.interpolate } : {})), (errorBandDef.tension && errorBandDef.interpolate ? { tension: errorBandDef.tension } : {}));
    if (is2D) {
        bandMark = Object.assign(Object.assign(Object.assign({}, bandMark), interpolate), { ariaRoleDescription: 'errorband' });
        bordersMark = Object.assign(Object.assign(Object.assign({}, bordersMark), interpolate), { aria: false });
    }
    else if (errorBandDef.interpolate) {
        warn(errorBand1DNotSupport('interpolate'));
    }
    else if (errorBandDef.tension) {
        warn(errorBand1DNotSupport('tension'));
    }
    return Object.assign(Object.assign({}, outerSpec), { transform, layer: [
            ...makeErrorBandPart({
                partName: 'band',
                mark: bandMark,
                positionPrefix: 'lower',
                endPositionPrefix: 'upper',
                extraEncoding: tooltipEncoding
            }),
            ...makeErrorBandPart({
                partName: 'borders',
                mark: bordersMark,
                positionPrefix: 'lower',
                extraEncoding: tooltipEncoding
            }),
            ...makeErrorBandPart({
                partName: 'borders',
                mark: bordersMark,
                positionPrefix: 'upper',
                extraEncoding: tooltipEncoding
            })
        ] });
}
//# sourceMappingURL=errorband.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compositemark/index.js





/**
 * Registry index for all composite mark's normalizer
 */
const compositeMarkRegistry = {};
function add(mark, run, parts) {
    const normalizer = new CompositeMarkNormalizer(mark, run);
    compositeMarkRegistry[mark] = { normalizer, parts };
}
function remove(mark) {
    delete compositeMarkRegistry[mark];
}
function getAllCompositeMarks() {
    return keys(compositeMarkRegistry);
}
add(BOXPLOT, normalizeBoxPlot, BOXPLOT_PARTS);
add(ERRORBAR, normalizeErrorBar, ERRORBAR_PARTS);
add(ERRORBAND, normalizeErrorBand, ERRORBAND_PARTS);
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/guide.js
const VL_ONLY_LEGEND_CONFIG = [
    'gradientHorizontalMaxLength',
    'gradientHorizontalMinLength',
    'gradientVerticalMaxLength',
    'gradientVerticalMinLength',
    'unselectedOpacity'
];
//# sourceMappingURL=guide.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/header.js

const HEADER_TITLE_PROPERTIES_MAP = {
    titleAlign: 'align',
    titleAnchor: 'anchor',
    titleAngle: 'angle',
    titleBaseline: 'baseline',
    titleColor: 'color',
    titleFont: 'font',
    titleFontSize: 'fontSize',
    titleFontStyle: 'fontStyle',
    titleFontWeight: 'fontWeight',
    titleLimit: 'limit',
    titleLineHeight: 'lineHeight',
    titleOrient: 'orient',
    titlePadding: 'offset'
};
const HEADER_LABEL_PROPERTIES_MAP = {
    labelAlign: 'align',
    labelAnchor: 'anchor',
    labelAngle: 'angle',
    labelBaseline: 'baseline',
    labelColor: 'color',
    labelFont: 'font',
    labelFontSize: 'fontSize',
    labelFontStyle: 'fontStyle',
    labelFontWeight: 'fontWeight',
    labelLimit: 'limit',
    labelLineHeight: 'lineHeight',
    labelOrient: 'orient',
    labelPadding: 'offset'
};
const HEADER_TITLE_PROPERTIES = keys(HEADER_TITLE_PROPERTIES_MAP);
const HEADER_LABEL_PROPERTIES = keys(HEADER_LABEL_PROPERTIES_MAP);
const HEADER_CONFIGS_INDEX = {
    header: 1,
    headerRow: 1,
    headerColumn: 1,
    headerFacet: 1
};
const HEADER_CONFIGS = keys(HEADER_CONFIGS_INDEX);
//# sourceMappingURL=header.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/legend.js

const LEGEND_SCALE_CHANNELS = [
    'size',
    'shape',
    'fill',
    'stroke',
    'strokeDash',
    'strokeWidth',
    'opacity'
];
const defaultLegendConfig = {
    gradientHorizontalMaxLength: 200,
    gradientHorizontalMinLength: 100,
    gradientVerticalMaxLength: 200,
    gradientVerticalMinLength: 64,
    unselectedOpacity: 0.35
};
const COMMON_LEGEND_PROPERTY_INDEX = {
    aria: 1,
    clipHeight: 1,
    columnPadding: 1,
    columns: 1,
    cornerRadius: 1,
    description: 1,
    direction: 1,
    fillColor: 1,
    format: 1,
    formatType: 1,
    gradientLength: 1,
    gradientOpacity: 1,
    gradientStrokeColor: 1,
    gradientStrokeWidth: 1,
    gradientThickness: 1,
    gridAlign: 1,
    labelAlign: 1,
    labelBaseline: 1,
    labelColor: 1,
    labelFont: 1,
    labelFontSize: 1,
    labelFontStyle: 1,
    labelFontWeight: 1,
    labelLimit: 1,
    labelOffset: 1,
    labelOpacity: 1,
    labelOverlap: 1,
    labelPadding: 1,
    labelSeparation: 1,
    legendX: 1,
    legendY: 1,
    offset: 1,
    orient: 1,
    padding: 1,
    rowPadding: 1,
    strokeColor: 1,
    symbolDash: 1,
    symbolDashOffset: 1,
    symbolFillColor: 1,
    symbolLimit: 1,
    symbolOffset: 1,
    symbolOpacity: 1,
    symbolSize: 1,
    symbolStrokeColor: 1,
    symbolStrokeWidth: 1,
    symbolType: 1,
    tickCount: 1,
    tickMinStep: 1,
    title: 1,
    titleAlign: 1,
    titleAnchor: 1,
    titleBaseline: 1,
    titleColor: 1,
    titleFont: 1,
    titleFontSize: 1,
    titleFontStyle: 1,
    titleFontWeight: 1,
    titleLimit: 1,
    titleLineHeight: 1,
    titleOpacity: 1,
    titleOrient: 1,
    titlePadding: 1,
    type: 1,
    values: 1,
    zindex: 1
};
const LEGEND_PROPERTIES = keys(COMMON_LEGEND_PROPERTY_INDEX);
//# sourceMappingURL=legend.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/selection.js

const SELECTION_ID = '_vgsid_';
const defaultConfig = {
    point: {
        on: 'click',
        fields: [SELECTION_ID],
        toggle: 'event.shiftKey',
        resolve: 'global',
        clear: 'dblclick'
    },
    interval: {
        on: '[mousedown, window:mouseup] > window:mousemove!',
        encodings: ['x', 'y'],
        translate: '[mousedown, window:mouseup] > window:mousemove!',
        zoom: 'wheel!',
        mark: { fill: '#333', fillOpacity: 0.125, stroke: 'white' },
        resolve: 'global',
        clear: 'dblclick'
    }
};
function isLegendBinding(bind) {
    return bind === 'legend' || !!(bind === null || bind === void 0 ? void 0 : bind.legend);
}
function isLegendStreamBinding(bind) {
    return isLegendBinding(bind) && (0,vega_util_module/* isObject */.Gv)(bind);
}
function isSelectionParameter(param) {
    return !!(param === null || param === void 0 ? void 0 : param['select']);
}
//# sourceMappingURL=selection.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/parameter.js
var parameter_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};

function assembleParameterSignals(params) {
    const signals = [];
    for (const param of params || []) {
        // Selection parameters are handled separately via assembleSelectionTopLevelSignals
        // and assembleSignals methods registered on the Model.
        if (isSelectionParameter(param))
            continue;
        const { expr, bind } = param, rest = parameter_rest(param, ["expr", "bind"]);
        if (bind && expr) {
            // Vega's InitSignal -- apply expr to "init"
            const signal = Object.assign(Object.assign({}, rest), { bind, init: expr });
            signals.push(signal);
        }
        else {
            const signal = Object.assign(Object.assign(Object.assign({}, rest), (expr ? { update: expr } : {})), (bind ? { bind } : {}));
            signals.push(signal);
        }
    }
    return signals;
}
//# sourceMappingURL=parameter.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/spec/concat.js
function isAnyConcatSpec(spec) {
    return isVConcatSpec(spec) || isHConcatSpec(spec) || isConcatSpec(spec);
}
function isConcatSpec(spec) {
    return 'concat' in spec;
}
function isVConcatSpec(spec) {
    return 'vconcat' in spec;
}
function isHConcatSpec(spec) {
    return 'hconcat' in spec;
}
//# sourceMappingURL=concat.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/spec/base.js




function getStepFor({ step, offsetIsDiscrete }) {
    var _a;
    if (offsetIsDiscrete) {
        return (_a = step.for) !== null && _a !== void 0 ? _a : 'offset';
    }
    else {
        return 'position';
    }
}
function isStep(size) {
    return (0,vega_util_module/* isObject */.Gv)(size) && size['step'] !== undefined;
}
function isFrameMixins(o) {
    return o['view'] || o['width'] || o['height'];
}
const DEFAULT_SPACING = 20;
const COMPOSITION_LAYOUT_INDEX = {
    align: 1,
    bounds: 1,
    center: 1,
    columns: 1,
    spacing: 1
};
const COMPOSITION_LAYOUT_PROPERTIES = keys(COMPOSITION_LAYOUT_INDEX);
function extractCompositionLayout(spec, specType, config) {
    var _a, _b;
    const compositionConfig = config[specType];
    const layout = {};
    // Apply config first
    const { spacing: spacingConfig, columns } = compositionConfig;
    if (spacingConfig !== undefined) {
        layout.spacing = spacingConfig;
    }
    if (columns !== undefined) {
        if ((isFacetSpec(spec) && !isFacetMapping(spec.facet)) || isConcatSpec(spec)) {
            layout.columns = columns;
        }
    }
    if (isVConcatSpec(spec)) {
        layout.columns = 1;
    }
    // Then copy properties from the spec
    for (const prop of COMPOSITION_LAYOUT_PROPERTIES) {
        if (spec[prop] !== undefined) {
            if (prop === 'spacing') {
                const spacing = spec[prop];
                layout[prop] = (0,vega_util_module/* isNumber */.Et)(spacing)
                    ? spacing
                    : {
                        row: (_a = spacing.row) !== null && _a !== void 0 ? _a : spacingConfig,
                        column: (_b = spacing.column) !== null && _b !== void 0 ? _b : spacingConfig
                    };
            }
            else {
                layout[prop] = spec[prop];
            }
        }
    }
    return layout;
}
//# sourceMappingURL=base.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/config.js
var config_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};

















function getViewConfigContinuousSize(viewConfig, channel) {
    var _a;
    return (_a = viewConfig[channel]) !== null && _a !== void 0 ? _a : viewConfig[channel === 'width' ? 'continuousWidth' : 'continuousHeight']; // get width/height for backwards compatibility
}
function getViewConfigDiscreteStep(viewConfig, channel) {
    const size = getViewConfigDiscreteSize(viewConfig, channel);
    return isStep(size) ? size.step : DEFAULT_STEP;
}
function getViewConfigDiscreteSize(viewConfig, channel) {
    var _a;
    const size = (_a = viewConfig[channel]) !== null && _a !== void 0 ? _a : viewConfig[channel === 'width' ? 'discreteWidth' : 'discreteHeight']; // get width/height for backwards compatibility
    return getFirstDefined(size, { step: viewConfig.step });
}
const DEFAULT_STEP = 20;
const defaultViewConfig = {
    continuousWidth: 200,
    continuousHeight: 200,
    step: DEFAULT_STEP
};
function isVgScheme(rangeScheme) {
    return rangeScheme && !!rangeScheme['scheme'];
}
const config_defaultConfig = {
    background: 'white',
    padding: 5,
    timeFormat: '%b %d, %Y',
    countTitle: 'Count of Records',
    view: defaultViewConfig,
    mark: defaultMarkConfig,
    arc: {},
    area: {},
    bar: defaultBarConfig,
    circle: {},
    geoshape: {},
    image: {},
    line: {},
    point: {},
    rect: defaultRectConfig,
    rule: { color: 'black' },
    square: {},
    text: { color: 'black' },
    tick: defaultTickConfig,
    trail: {},
    boxplot: {
        size: 14,
        extent: 1.5,
        box: {},
        median: { color: 'white' },
        outliers: {},
        rule: {},
        ticks: null
    },
    errorbar: {
        center: 'mean',
        rule: true,
        ticks: false
    },
    errorband: {
        band: {
            opacity: 0.3
        },
        borders: false
    },
    scale: defaultScaleConfig,
    projection: {},
    legend: defaultLegendConfig,
    header: { titlePadding: 10, labelPadding: 10 },
    headerColumn: {},
    headerRow: {},
    headerFacet: {},
    selection: defaultConfig,
    style: {},
    title: {},
    facet: { spacing: DEFAULT_SPACING },
    concat: { spacing: DEFAULT_SPACING },
    normalizedNumberFormat: '.0%'
};
// Tableau10 color palette, copied from `vegaScale.scheme('tableau10')`
const tab10 = [
    '#4c78a8',
    '#f58518',
    '#e45756',
    '#72b7b2',
    '#54a24b',
    '#eeca3b',
    '#b279a2',
    '#ff9da6',
    '#9d755d',
    '#bab0ac'
];
const DEFAULT_FONT_SIZE = {
    text: 11,
    guideLabel: 10,
    guideTitle: 11,
    groupTitle: 13,
    groupSubtitle: 12
};
const DEFAULT_COLOR = {
    blue: tab10[0],
    orange: tab10[1],
    red: tab10[2],
    teal: tab10[3],
    green: tab10[4],
    yellow: tab10[5],
    purple: tab10[6],
    pink: tab10[7],
    brown: tab10[8],
    gray0: '#000',
    gray1: '#111',
    gray2: '#222',
    gray3: '#333',
    gray4: '#444',
    gray5: '#555',
    gray6: '#666',
    gray7: '#777',
    gray8: '#888',
    gray9: '#999',
    gray10: '#aaa',
    gray11: '#bbb',
    gray12: '#ccc',
    gray13: '#ddd',
    gray14: '#eee',
    gray15: '#fff'
};
function colorSignalConfig(color = {}) {
    return {
        signals: [
            {
                name: 'color',
                value: (0,vega_util_module/* isObject */.Gv)(color) ? Object.assign(Object.assign({}, DEFAULT_COLOR), color) : DEFAULT_COLOR
            }
        ],
        mark: { color: { signal: 'color.blue' } },
        rule: { color: { signal: 'color.gray0' } },
        text: {
            color: { signal: 'color.gray0' }
        },
        style: {
            'guide-label': {
                fill: { signal: 'color.gray0' }
            },
            'guide-title': {
                fill: { signal: 'color.gray0' }
            },
            'group-title': {
                fill: { signal: 'color.gray0' }
            },
            'group-subtitle': {
                fill: { signal: 'color.gray0' }
            },
            cell: {
                stroke: { signal: 'color.gray8' }
            }
        },
        axis: {
            domainColor: { signal: 'color.gray13' },
            gridColor: { signal: 'color.gray8' },
            tickColor: { signal: 'color.gray13' }
        },
        range: {
            category: [
                { signal: 'color.blue' },
                { signal: 'color.orange' },
                { signal: 'color.red' },
                { signal: 'color.teal' },
                { signal: 'color.green' },
                { signal: 'color.yellow' },
                { signal: 'color.purple' },
                { signal: 'color.pink' },
                { signal: 'color.brown' },
                { signal: 'color.grey8' }
            ]
        }
    };
}
function fontSizeSignalConfig(fontSize) {
    return {
        signals: [
            {
                name: 'fontSize',
                value: (0,vega_util_module/* isObject */.Gv)(fontSize) ? Object.assign(Object.assign({}, DEFAULT_FONT_SIZE), fontSize) : DEFAULT_FONT_SIZE
            }
        ],
        text: {
            fontSize: { signal: 'fontSize.text' }
        },
        style: {
            'guide-label': {
                fontSize: { signal: 'fontSize.guideLabel' }
            },
            'guide-title': {
                fontSize: { signal: 'fontSize.guideTitle' }
            },
            'group-title': {
                fontSize: { signal: 'fontSize.groupTitle' }
            },
            'group-subtitle': {
                fontSize: { signal: 'fontSize.groupSubtitle' }
            }
        }
    };
}
function fontConfig(font) {
    return {
        text: { font },
        style: {
            'guide-label': { font },
            'guide-title': { font },
            'group-title': { font },
            'group-subtitle': { font }
        }
    };
}
function getAxisConfigInternal(axisConfig) {
    const props = keys(axisConfig || {});
    const axisConfigInternal = {};
    for (const prop of props) {
        const val = axisConfig[prop];
        axisConfigInternal[prop] = isConditionalAxisValue(val)
            ? signalOrValueRefWithCondition(val)
            : signalRefOrValue(val);
    }
    return axisConfigInternal;
}
function getStyleConfigInternal(styleConfig) {
    const props = keys(styleConfig);
    const styleConfigInternal = {};
    for (const prop of props) {
        // We need to cast to cheat a bit here since styleConfig can be either mark config or axis config
        styleConfigInternal[prop] = getAxisConfigInternal(styleConfig[prop]);
    }
    return styleConfigInternal;
}
const configPropsWithExpr = [
    ...MARK_CONFIGS,
    ...AXIS_CONFIGS,
    ...HEADER_CONFIGS,
    'background',
    'padding',
    'legend',
    'lineBreak',
    'scale',
    'style',
    'title',
    'view'
];
/**
 * Merge specified config with default config and config for the `color` flag,
 * then replace all expressions with signals
 */
function initConfig(specifiedConfig = {}) {
    const { color, font, fontSize, selection } = specifiedConfig, restConfig = config_rest(specifiedConfig, ["color", "font", "fontSize", "selection"]);
    const mergedConfig = (0,vega_util_module/* mergeConfig */.io)({}, duplicate(config_defaultConfig), font ? fontConfig(font) : {}, color ? colorSignalConfig(color) : {}, fontSize ? fontSizeSignalConfig(fontSize) : {}, restConfig || {});
    // mergeConfig doesn't recurse and overrides object values.
    if (selection) {
        (0,vega_module_js_.writeConfig)(mergedConfig, 'selection', selection, true);
    }
    const outputConfig = omit(mergedConfig, configPropsWithExpr);
    for (const prop of ['background', 'lineBreak', 'padding']) {
        if (mergedConfig[prop]) {
            outputConfig[prop] = signalRefOrValue(mergedConfig[prop]);
        }
    }
    for (const markConfigType of MARK_CONFIGS) {
        if (mergedConfig[markConfigType]) {
            // FIXME: outputConfig[markConfigType] expects that types are replaced recursively but replaceExprRef only replaces one level deep
            outputConfig[markConfigType] = replaceExprRef(mergedConfig[markConfigType]);
        }
    }
    for (const axisConfigType of AXIS_CONFIGS) {
        if (mergedConfig[axisConfigType]) {
            outputConfig[axisConfigType] = getAxisConfigInternal(mergedConfig[axisConfigType]);
        }
    }
    for (const headerConfigType of HEADER_CONFIGS) {
        if (mergedConfig[headerConfigType]) {
            outputConfig[headerConfigType] = replaceExprRef(mergedConfig[headerConfigType]);
        }
    }
    if (mergedConfig.legend) {
        outputConfig.legend = replaceExprRef(mergedConfig.legend);
    }
    if (mergedConfig.scale) {
        outputConfig.scale = replaceExprRef(mergedConfig.scale);
    }
    if (mergedConfig.style) {
        outputConfig.style = getStyleConfigInternal(mergedConfig.style);
    }
    if (mergedConfig.title) {
        outputConfig.title = replaceExprRef(mergedConfig.title);
    }
    if (mergedConfig.view) {
        outputConfig.view = replaceExprRef(mergedConfig.view);
    }
    return outputConfig;
}
const MARK_STYLES = new Set(['view', ...PRIMITIVE_MARKS]);
const VL_ONLY_CONFIG_PROPERTIES = [
    'color',
    'fontSize',
    'background',
    'padding',
    'facet',
    'concat',
    'numberFormat',
    'numberFormatType',
    'normalizedNumberFormat',
    'normalizedNumberFormatType',
    'timeFormat',
    'countTitle',
    'header',
    'axisQuantitative',
    'axisTemporal',
    'axisDiscrete',
    'axisPoint',
    'axisXBand',
    'axisXPoint',
    'axisXDiscrete',
    'axisXQuantitative',
    'axisXTemporal',
    'axisYBand',
    'axisYPoint',
    'axisYDiscrete',
    'axisYQuantitative',
    'axisYTemporal',
    'scale',
    'selection',
    'overlay' // FIXME: Redesign and unhide this
];
const VL_ONLY_ALL_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX = Object.assign({ view: ['continuousWidth', 'continuousHeight', 'discreteWidth', 'discreteHeight', 'step'] }, VL_ONLY_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX);
function stripAndRedirectConfig(config) {
    config = duplicate(config);
    for (const prop of VL_ONLY_CONFIG_PROPERTIES) {
        delete config[prop];
    }
    if (config.axis) {
        // delete condition axis config
        for (const prop in config.axis) {
            if (isConditionalAxisValue(config.axis[prop])) {
                delete config.axis[prop];
            }
        }
    }
    if (config.legend) {
        for (const prop of VL_ONLY_LEGEND_CONFIG) {
            delete config.legend[prop];
        }
    }
    // Remove Vega-Lite only generic mark config
    if (config.mark) {
        for (const prop of VL_ONLY_MARK_CONFIG_PROPERTIES) {
            delete config.mark[prop];
        }
        if (config.mark.tooltip && (0,vega_util_module/* isObject */.Gv)(config.mark.tooltip)) {
            delete config.mark.tooltip;
        }
    }
    if (config.params) {
        config.signals = (config.signals || []).concat(assembleParameterSignals(config.params));
        delete config.params;
    }
    for (const markType of MARK_STYLES) {
        // Remove Vega-Lite-only mark config
        for (const prop of VL_ONLY_MARK_CONFIG_PROPERTIES) {
            delete config[markType][prop];
        }
        // Remove Vega-Lite only mark-specific config
        const vlOnlyMarkSpecificConfigs = VL_ONLY_ALL_MARK_SPECIFIC_CONFIG_PROPERTY_INDEX[markType];
        if (vlOnlyMarkSpecificConfigs) {
            for (const prop of vlOnlyMarkSpecificConfigs) {
                delete config[markType][prop];
            }
        }
        // Redirect mark config to config.style so that mark config only affect its own mark type
        // without affecting other marks that share the same underlying Vega marks.
        // For example, config.rect should not affect bar marks.
        redirectConfigToStyleConfig(config, markType);
    }
    for (const m of getAllCompositeMarks()) {
        // Clean up the composite mark config as we don't need them in the output specs anymore
        delete config[m];
    }
    redirectTitleConfig(config);
    // Remove empty config objects.
    for (const prop in config) {
        if ((0,vega_util_module/* isObject */.Gv)(config[prop]) && isEmpty(config[prop])) {
            delete config[prop];
        }
    }
    return isEmpty(config) ? undefined : config;
}
/**
 *
 * Redirect config.title -- so that title config do not affect header labels,
 * which also uses `title` directive to implement.
 *
 * For subtitle configs in config.title, keep them in config.title as header titles never have subtitles.
 */
function redirectTitleConfig(config) {
    const { titleMarkConfig, subtitleMarkConfig, subtitle } = extractTitleConfig(config.title);
    // set config.style if title/subtitleMarkConfig is not an empty object
    if (!isEmpty(titleMarkConfig)) {
        config.style['group-title'] = Object.assign(Object.assign({}, config.style['group-title']), titleMarkConfig // config.title has higher precedence than config.style.group-title in Vega
        );
    }
    if (!isEmpty(subtitleMarkConfig)) {
        config.style['group-subtitle'] = Object.assign(Object.assign({}, config.style['group-subtitle']), subtitleMarkConfig);
    }
    // subtitle part can stay in config.title since header titles do not use subtitle
    if (!isEmpty(subtitle)) {
        config.title = subtitle;
    }
    else {
        delete config.title;
    }
}
function redirectConfigToStyleConfig(config, prop, // string = composite mark
toProp, compositeMarkPart) {
    const propConfig = compositeMarkPart ? config[prop][compositeMarkPart] : config[prop];
    if (prop === 'view') {
        toProp = 'cell'; // View's default style is "cell"
    }
    const style = Object.assign(Object.assign({}, propConfig), config.style[toProp !== null && toProp !== void 0 ? toProp : prop]);
    // set config.style if it is not an empty object
    if (!isEmpty(style)) {
        config.style[toProp !== null && toProp !== void 0 ? toProp : prop] = style;
    }
    if (!compositeMarkPart) {
        // For composite mark, so don't delete the whole config yet as we have to do multiple redirections.
        delete config[prop];
    }
}
//# sourceMappingURL=config.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/spec/layer.js
function isLayerSpec(spec) {
    return 'layer' in spec;
}
//# sourceMappingURL=layer.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/spec/repeat.js

function isRepeatSpec(spec) {
    return 'repeat' in spec;
}
function isLayerRepeatSpec(spec) {
    return !(0,vega_util_module/* isArray */.cy)(spec.repeat) && spec.repeat['layer'];
}
//# sourceMappingURL=repeat.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/spec/index.js





//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/spec/map.js
var map_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};






class SpecMapper {
    map(spec, params) {
        if (isFacetSpec(spec)) {
            return this.mapFacet(spec, params);
        }
        else if (isRepeatSpec(spec)) {
            return this.mapRepeat(spec, params);
        }
        else if (isHConcatSpec(spec)) {
            return this.mapHConcat(spec, params);
        }
        else if (isVConcatSpec(spec)) {
            return this.mapVConcat(spec, params);
        }
        else if (isConcatSpec(spec)) {
            return this.mapConcat(spec, params);
        }
        else {
            return this.mapLayerOrUnit(spec, params);
        }
    }
    mapLayerOrUnit(spec, params) {
        if (isLayerSpec(spec)) {
            return this.mapLayer(spec, params);
        }
        else if (isUnitSpec(spec)) {
            return this.mapUnit(spec, params);
        }
        throw new Error(invalidSpec(spec));
    }
    mapLayer(spec, params) {
        return Object.assign(Object.assign({}, spec), { layer: spec.layer.map(subspec => this.mapLayerOrUnit(subspec, params)) });
    }
    mapHConcat(spec, params) {
        return Object.assign(Object.assign({}, spec), { hconcat: spec.hconcat.map(subspec => this.map(subspec, params)) });
    }
    mapVConcat(spec, params) {
        return Object.assign(Object.assign({}, spec), { vconcat: spec.vconcat.map(subspec => this.map(subspec, params)) });
    }
    mapConcat(spec, params) {
        const { concat } = spec, rest = map_rest(spec, ["concat"]);
        return Object.assign(Object.assign({}, rest), { concat: concat.map(subspec => this.map(subspec, params)) });
    }
    mapFacet(spec, params) {
        return Object.assign(Object.assign({}, spec), { 
            // TODO: remove "any" once we support all facet listed in https://github.com/vega/vega-lite/issues/2760
            spec: this.map(spec.spec, params) });
    }
    mapRepeat(spec, params) {
        return Object.assign(Object.assign({}, spec), { 
            // as any is required here since TS cannot infer that the output type satisfies the input type
            spec: this.map(spec.spec, params) });
    }
}
//# sourceMappingURL=map.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/stack.js








const STACK_OFFSET_INDEX = {
    zero: 1,
    center: 1,
    normalize: 1
};
function isStackOffset(s) {
    return s in STACK_OFFSET_INDEX;
}
const STACKABLE_MARKS = new Set([ARC, BAR, AREA, RULE, POINT, CIRCLE, SQUARE, LINE, mark_TEXT, TICK]);
const STACK_BY_DEFAULT_MARKS = new Set([BAR, AREA, ARC]);
function isUnbinnedQuantitative(channelDef) {
    return isFieldDef(channelDef) && channelDefType(channelDef) === 'quantitative' && !channelDef.bin;
}
function potentialStackedChannel(encoding, x) {
    var _a, _b;
    const y = x === 'x' ? 'y' : 'radius';
    const xDef = encoding[x];
    const yDef = encoding[y];
    if (isFieldDef(xDef) && isFieldDef(yDef)) {
        if (isUnbinnedQuantitative(xDef) && isUnbinnedQuantitative(yDef)) {
            if (xDef.stack) {
                return x;
            }
            else if (yDef.stack) {
                return y;
            }
            const xAggregate = isFieldDef(xDef) && !!xDef.aggregate;
            const yAggregate = isFieldDef(yDef) && !!yDef.aggregate;
            // if there is no explicit stacking, only apply stack if there is only one aggregate for x or y
            if (xAggregate !== yAggregate) {
                return xAggregate ? x : y;
            }
            else {
                const xScale = (_a = xDef.scale) === null || _a === void 0 ? void 0 : _a.type;
                const yScale = (_b = yDef.scale) === null || _b === void 0 ? void 0 : _b.type;
                if (xScale && xScale !== 'linear') {
                    return y;
                }
                else if (yScale && yScale !== 'linear') {
                    return x;
                }
            }
        }
        else if (isUnbinnedQuantitative(xDef)) {
            return x;
        }
        else if (isUnbinnedQuantitative(yDef)) {
            return y;
        }
    }
    else if (isUnbinnedQuantitative(xDef)) {
        return x;
    }
    else if (isUnbinnedQuantitative(yDef)) {
        return y;
    }
    return undefined;
}
function getDimensionChannel(channel) {
    switch (channel) {
        case 'x':
            return 'y';
        case 'y':
            return 'x';
        case 'theta':
            return 'radius';
        case 'radius':
            return 'theta';
    }
}
function stack(m, encoding) {
    var _a, _b;
    const mark = isMarkDef(m) ? m.type : m;
    // Should have stackable mark
    if (!STACKABLE_MARKS.has(mark)) {
        return null;
    }
    // Run potential stacked twice, one for Cartesian and another for Polar,
    // so text marks can be stacked in any of the coordinates.
    // Note: The logic here is not perfectly correct.  If we want to support stacked dot plots where each dot is a pie chart with label, we have to change the stack logic here to separate Cartesian stacking for polar stacking.
    // However, since we probably never want to do that, let's just note the limitation here.
    const fieldChannel = potentialStackedChannel(encoding, 'x') || potentialStackedChannel(encoding, 'theta');
    if (!fieldChannel) {
        return null;
    }
    const stackedFieldDef = encoding[fieldChannel];
    const stackedField = isFieldDef(stackedFieldDef) ? vgField(stackedFieldDef, {}) : undefined;
    const dimensionChannel = getDimensionChannel(fieldChannel);
    const groupbyChannels = [];
    const groupbyFields = new Set();
    if (encoding[dimensionChannel]) {
        const dimensionDef = encoding[dimensionChannel];
        const dimensionField = isFieldDef(dimensionDef) ? vgField(dimensionDef, {}) : undefined;
        if (dimensionField && dimensionField !== stackedField) {
            // avoid grouping by the stacked field
            groupbyChannels.push(dimensionChannel);
            groupbyFields.add(dimensionField);
        }
        const dimensionOffsetChannel = dimensionChannel === 'x' ? 'xOffset' : 'yOffset';
        const dimensionOffsetDef = encoding[dimensionOffsetChannel];
        const dimensionOffsetField = isFieldDef(dimensionOffsetDef) ? vgField(dimensionOffsetDef, {}) : undefined;
        if (dimensionOffsetField && dimensionOffsetField !== stackedField) {
            // avoid grouping by the stacked field
            groupbyChannels.push(dimensionOffsetChannel);
            groupbyFields.add(dimensionOffsetField);
        }
    }
    // If the dimension has offset, don't stack anymore
    // Should have grouping level of detail that is different from the dimension field
    const stackBy = NONPOSITION_CHANNELS.reduce((sc, channel) => {
        // Ignore tooltip in stackBy (https://github.com/vega/vega-lite/issues/4001)
        if (channel !== 'tooltip' && channelHasField(encoding, channel)) {
            const channelDef = encoding[channel];
            for (const cDef of (0,vega_util_module/* array */.YO)(channelDef)) {
                const fieldDef = getFieldDef(cDef);
                if (fieldDef.aggregate) {
                    continue;
                }
                // Check whether the channel's field is identical to x/y's field or if the channel is a repeat
                const f = vgField(fieldDef, {});
                if (
                // if fielddef is a repeat, just include it in the stack by
                !f ||
                    // otherwise, the field must be different from the groupBy fields.
                    !groupbyFields.has(f)) {
                    sc.push({ channel, fieldDef });
                }
            }
        }
        return sc;
    }, []);
    // Automatically determine offset
    let offset;
    if (stackedFieldDef.stack !== undefined) {
        if ((0,vega_util_module/* isBoolean */.Lm)(stackedFieldDef.stack)) {
            offset = stackedFieldDef.stack ? 'zero' : null;
        }
        else {
            offset = stackedFieldDef.stack;
        }
    }
    else if (STACK_BY_DEFAULT_MARKS.has(mark)) {
        offset = 'zero';
    }
    if (!offset || !isStackOffset(offset)) {
        return null;
    }
    if (isAggregate(encoding) && stackBy.length === 0) {
        return null;
    }
    // warn when stacking non-linear
    if (((_a = stackedFieldDef === null || stackedFieldDef === void 0 ? void 0 : stackedFieldDef.scale) === null || _a === void 0 ? void 0 : _a.type) && ((_b = stackedFieldDef === null || stackedFieldDef === void 0 ? void 0 : stackedFieldDef.scale) === null || _b === void 0 ? void 0 : _b.type) !== ScaleType.LINEAR) {
        warn(cannotStackNonLinearScale(stackedFieldDef.scale.type));
        return null;
    }
    // Check if it is a ranged mark
    if (isFieldOrDatumDef(encoding[getSecondaryRangeChannel(fieldChannel)])) {
        if (stackedFieldDef.stack !== undefined) {
            warn(cannotStackRangedMark(fieldChannel));
        }
        return null;
    }
    // Warn if stacking non-summative aggregate
    if (isFieldDef(stackedFieldDef) &&
        stackedFieldDef.aggregate &&
        !SUM_OPS.has(stackedFieldDef.aggregate)) {
        warn(stackNonSummativeAggregate(stackedFieldDef.aggregate));
    }
    return {
        groupbyChannels,
        groupbyFields,
        fieldChannel,
        impute: stackedFieldDef.impute === null ? false : isPathMark(mark),
        stackBy,
        offset
    };
}
//# sourceMappingURL=stack.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/normalize/pathoverlay.js
var pathoverlay_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};






function dropLineAndPoint(markDef) {
    const { point: _point, line: _line } = markDef, mark = pathoverlay_rest(markDef, ["point", "line"]);
    return keys(mark).length > 1 ? mark : mark.type;
}
function dropLineAndPointFromConfig(config) {
    for (const mark of ['line', 'area', 'rule', 'trail']) {
        if (config[mark]) {
            config = Object.assign(Object.assign({}, config), { 
                // TODO: remove as any
                [mark]: omit(config[mark], ['point', 'line']) });
        }
    }
    return config;
}
function getPointOverlay(markDef, markConfig = {}, encoding) {
    if (markDef.point === 'transparent') {
        return { opacity: 0 };
    }
    else if (markDef.point) {
        // truthy : true or object
        return (0,vega_util_module/* isObject */.Gv)(markDef.point) ? markDef.point : {};
    }
    else if (markDef.point !== undefined) {
        // false or null
        return null;
    }
    else {
        // undefined (not disabled)
        if (markConfig.point || encoding.shape) {
            // enable point overlay if config[mark].point is truthy or if encoding.shape is provided
            return (0,vega_util_module/* isObject */.Gv)(markConfig.point) ? markConfig.point : {};
        }
        // markDef.point is defined as falsy
        return undefined;
    }
}
function getLineOverlay(markDef, markConfig = {}) {
    if (markDef.line) {
        // true or object
        return markDef.line === true ? {} : markDef.line;
    }
    else if (markDef.line !== undefined) {
        // false or null
        return null;
    }
    else {
        // undefined (not disabled)
        if (markConfig.line) {
            // enable line overlay if config[mark].line is truthy
            return markConfig.line === true ? {} : markConfig.line;
        }
        // markDef.point is defined as falsy
        return undefined;
    }
}
class PathOverlayNormalizer {
    constructor() {
        this.name = 'path-overlay';
    }
    hasMatchingType(spec, config) {
        if (isUnitSpec(spec)) {
            const { mark, encoding } = spec;
            const markDef = isMarkDef(mark) ? mark : { type: mark };
            switch (markDef.type) {
                case 'line':
                case 'rule':
                case 'trail':
                    return !!getPointOverlay(markDef, config[markDef.type], encoding);
                case 'area':
                    return (
                    // false / null are also included as we want to remove the properties
                    !!getPointOverlay(markDef, config[markDef.type], encoding) ||
                        !!getLineOverlay(markDef, config[markDef.type]));
            }
        }
        return false;
    }
    run(spec, normParams, normalize) {
        const { config } = normParams;
        const { params, projection, mark, encoding: e } = spec, outerSpec = pathoverlay_rest(spec, ["params", "projection", "mark", "encoding"]);
        // Need to call normalizeEncoding because we need the inferred types to correctly determine stack
        const encoding = normalizeEncoding(e, config);
        const markDef = isMarkDef(mark) ? mark : { type: mark };
        const pointOverlay = getPointOverlay(markDef, config[markDef.type], encoding);
        const lineOverlay = markDef.type === 'area' && getLineOverlay(markDef, config[markDef.type]);
        const layer = [
            Object.assign(Object.assign({}, (params ? { params } : {})), { mark: dropLineAndPoint(Object.assign(Object.assign({}, (markDef.type === 'area' && markDef.opacity === undefined && markDef.fillOpacity === undefined
                    ? { opacity: 0.7 }
                    : {})), markDef)), 
                // drop shape from encoding as this might be used to trigger point overlay
                encoding: omit(encoding, ['shape']) })
        ];
        // FIXME: determine rules for applying selections.
        // Need to copy stack config to overlayed layer
        const stackProps = stack(markDef, encoding);
        let overlayEncoding = encoding;
        if (stackProps) {
            const { fieldChannel: stackFieldChannel, offset } = stackProps;
            overlayEncoding = Object.assign(Object.assign({}, encoding), { [stackFieldChannel]: Object.assign(Object.assign({}, encoding[stackFieldChannel]), (offset ? { stack: offset } : {})) });
        }
        // overlay line layer should be on the edge of area but passing y2/x2 makes
        // it as "rule" mark so that it draws unwanted vertical/horizontal lines.
        // point overlay also should not have y2/x2 as it does not support.
        overlayEncoding = omit(overlayEncoding, ['y2', 'x2']);
        if (lineOverlay) {
            layer.push(Object.assign(Object.assign({}, (projection ? { projection } : {})), { mark: Object.assign(Object.assign({ type: 'line' }, pick(markDef, ['clip', 'interpolate', 'tension', 'tooltip'])), lineOverlay), encoding: overlayEncoding }));
        }
        if (pointOverlay) {
            layer.push(Object.assign(Object.assign({}, (projection ? { projection } : {})), { mark: Object.assign(Object.assign({ type: 'point', opacity: 1, filled: true }, pick(markDef, ['clip', 'tooltip'])), pointOverlay), encoding: overlayEncoding }));
        }
        return normalize(Object.assign(Object.assign({}, outerSpec), { layer }), Object.assign(Object.assign({}, normParams), { config: dropLineAndPointFromConfig(config) }));
    }
}
//# sourceMappingURL=pathoverlay.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/normalize/repeater.js
var repeater_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};





function replaceRepeaterInFacet(facet, repeater) {
    if (!repeater) {
        return facet;
    }
    if (isFacetMapping(facet)) {
        return replaceRepeaterInMapping(facet, repeater);
    }
    return replaceRepeaterInFieldDef(facet, repeater);
}
function replaceRepeaterInEncoding(encoding, repeater) {
    if (!repeater) {
        return encoding;
    }
    return replaceRepeaterInMapping(encoding, repeater);
}
/**
 * Replaces repeated value and returns if the repeated value is valid.
 */
function replaceRepeatInProp(prop, o, repeater) {
    const val = o[prop];
    if (isRepeatRef(val)) {
        if (val.repeat in repeater) {
            return Object.assign(Object.assign({}, o), { [prop]: repeater[val.repeat] });
        }
        else {
            warn(noSuchRepeatedValue(val.repeat));
            return undefined;
        }
    }
    return o;
}
/**
 * Replace repeater values in a field def with the concrete field name.
 */
function replaceRepeaterInFieldDef(fieldDef, repeater) {
    fieldDef = replaceRepeatInProp('field', fieldDef, repeater);
    if (fieldDef === undefined) {
        // the field def should be ignored
        return undefined;
    }
    else if (fieldDef === null) {
        return null;
    }
    if (isSortableFieldDef(fieldDef) && isSortField(fieldDef.sort)) {
        const sort = replaceRepeatInProp('field', fieldDef.sort, repeater);
        fieldDef = Object.assign(Object.assign({}, fieldDef), (sort ? { sort } : {}));
    }
    return fieldDef;
}
function replaceRepeaterInFieldOrDatumDef(def, repeater) {
    if (isFieldDef(def)) {
        return replaceRepeaterInFieldDef(def, repeater);
    }
    else {
        const datumDef = replaceRepeatInProp('datum', def, repeater);
        if (datumDef !== def && !datumDef.type) {
            datumDef.type = 'nominal';
        }
        return datumDef;
    }
}
function replaceRepeaterInChannelDef(channelDef, repeater) {
    if (isFieldOrDatumDef(channelDef)) {
        const fd = replaceRepeaterInFieldOrDatumDef(channelDef, repeater);
        if (fd) {
            return fd;
        }
        else if (isConditionalDef(channelDef)) {
            return { condition: channelDef.condition };
        }
    }
    else {
        if (hasConditionalFieldOrDatumDef(channelDef)) {
            const fd = replaceRepeaterInFieldOrDatumDef(channelDef.condition, repeater);
            if (fd) {
                return Object.assign(Object.assign({}, channelDef), { condition: fd });
            }
            else {
                const { condition } = channelDef, channelDefWithoutCondition = repeater_rest(channelDef, ["condition"]);
                return channelDefWithoutCondition;
            }
        }
        return channelDef;
    }
    return undefined;
}
function replaceRepeaterInMapping(mapping, repeater) {
    const out = {};
    for (const channel in mapping) {
        if ((0,vega_util_module/* hasOwnProperty */.mQ)(mapping, channel)) {
            const channelDef = mapping[channel];
            if ((0,vega_util_module/* isArray */.cy)(channelDef)) {
                // array cannot have condition
                out[channel] = channelDef // somehow we need to cast it here
                    .map(cd => replaceRepeaterInChannelDef(cd, repeater))
                    .filter(cd => cd);
            }
            else {
                const cd = replaceRepeaterInChannelDef(channelDef, repeater);
                if (cd !== undefined) {
                    out[channel] = cd;
                }
            }
        }
    }
    return out;
}
//# sourceMappingURL=repeater.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/normalize/ruleforrangedline.js







class RuleForRangedLineNormalizer {
    constructor() {
        this.name = 'RuleForRangedLine';
    }
    hasMatchingType(spec) {
        if (isUnitSpec(spec)) {
            const { encoding, mark } = spec;
            if (mark === 'line' || (isMarkDef(mark) && mark.type === 'line')) {
                for (const channel of SECONDARY_RANGE_CHANNEL) {
                    const mainChannel = getMainRangeChannel(channel);
                    const mainChannelDef = encoding[mainChannel];
                    if (encoding[channel]) {
                        if ((isFieldDef(mainChannelDef) && !isBinned(mainChannelDef.bin)) || isDatumDef(mainChannelDef)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
    run(spec, params, normalize) {
        const { encoding, mark } = spec;
        warn(lineWithRange(!!encoding.x2, !!encoding.y2));
        return normalize(Object.assign(Object.assign({}, spec), { mark: (0,vega_util_module/* isObject */.Gv)(mark) ? Object.assign(Object.assign({}, mark), { type: 'rule' }) : 'rule' }), params);
    }
}
//# sourceMappingURL=ruleforrangedline.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/normalize/core.js
var core_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};

















class CoreNormalizer extends SpecMapper {
    constructor() {
        super(...arguments);
        this.nonFacetUnitNormalizers = [
            boxPlotNormalizer,
            errorBarNormalizer,
            errorBandNormalizer,
            new PathOverlayNormalizer(),
            new RuleForRangedLineNormalizer()
        ];
    }
    map(spec, params) {
        // Special handling for a faceted unit spec as it can return a facet spec, not just a layer or unit spec like a normal unit spec.
        if (isUnitSpec(spec)) {
            const hasRow = channelHasField(spec.encoding, ROW);
            const hasColumn = channelHasField(spec.encoding, COLUMN);
            const hasFacet = channelHasField(spec.encoding, FACET);
            if (hasRow || hasColumn || hasFacet) {
                return this.mapFacetedUnit(spec, params);
            }
        }
        return super.map(spec, params);
    }
    // This is for normalizing non-facet unit
    mapUnit(spec, params) {
        const { parentEncoding, parentProjection } = params;
        const encoding = replaceRepeaterInEncoding(spec.encoding, params.repeater);
        const specWithReplacedEncoding = Object.assign(Object.assign({}, spec), (encoding ? { encoding } : {}));
        if (parentEncoding || parentProjection) {
            return this.mapUnitWithParentEncodingOrProjection(specWithReplacedEncoding, params);
        }
        const normalizeLayerOrUnit = this.mapLayerOrUnit.bind(this);
        for (const unitNormalizer of this.nonFacetUnitNormalizers) {
            if (unitNormalizer.hasMatchingType(specWithReplacedEncoding, params.config)) {
                return unitNormalizer.run(specWithReplacedEncoding, params, normalizeLayerOrUnit);
            }
        }
        return specWithReplacedEncoding;
    }
    mapRepeat(spec, params) {
        if (isLayerRepeatSpec(spec)) {
            return this.mapLayerRepeat(spec, params);
        }
        else {
            return this.mapNonLayerRepeat(spec, params);
        }
    }
    mapLayerRepeat(spec, params) {
        const { repeat, spec: childSpec } = spec, rest = core_rest(spec, ["repeat", "spec"]);
        const { row, column, layer } = repeat;
        const { repeater = {}, repeaterPrefix = '' } = params;
        if (row || column) {
            return this.mapRepeat(Object.assign(Object.assign({}, spec), { repeat: Object.assign(Object.assign({}, (row ? { row } : {})), (column ? { column } : {})), spec: {
                    repeat: { layer },
                    spec: childSpec
                } }), params);
        }
        else {
            return Object.assign(Object.assign({}, rest), { layer: layer.map(layerValue => {
                    const childRepeater = Object.assign(Object.assign({}, repeater), { layer: layerValue });
                    const childName = `${(childSpec.name || '') + repeaterPrefix}child__layer_${varName(layerValue)}`;
                    const child = this.mapLayerOrUnit(childSpec, Object.assign(Object.assign({}, params), { repeater: childRepeater, repeaterPrefix: childName }));
                    child.name = childName;
                    return child;
                }) });
        }
    }
    mapNonLayerRepeat(spec, params) {
        var _a;
        const { repeat, spec: childSpec, data } = spec, remainingProperties = core_rest(spec, ["repeat", "spec", "data"]);
        if (!(0,vega_util_module/* isArray */.cy)(repeat) && spec.columns) {
            // is repeat with row/column
            spec = omit(spec, ['columns']);
            warn(columnsNotSupportByRowCol('repeat'));
        }
        const concat = [];
        const { repeater = {}, repeaterPrefix = '' } = params;
        const row = (!(0,vega_util_module/* isArray */.cy)(repeat) && repeat.row) || [repeater ? repeater.row : null];
        const column = (!(0,vega_util_module/* isArray */.cy)(repeat) && repeat.column) || [repeater ? repeater.column : null];
        const repeatValues = ((0,vega_util_module/* isArray */.cy)(repeat) && repeat) || [repeater ? repeater.repeat : null];
        // cross product
        for (const repeatValue of repeatValues) {
            for (const rowValue of row) {
                for (const columnValue of column) {
                    const childRepeater = {
                        repeat: repeatValue,
                        row: rowValue,
                        column: columnValue,
                        layer: repeater.layer
                    };
                    const childName = (childSpec.name || '') +
                        repeaterPrefix +
                        'child__' +
                        ((0,vega_util_module/* isArray */.cy)(repeat)
                            ? `${varName(repeatValue)}`
                            : (repeat.row ? `row_${varName(rowValue)}` : '') +
                                (repeat.column ? `column_${varName(columnValue)}` : ''));
                    const child = this.map(childSpec, Object.assign(Object.assign({}, params), { repeater: childRepeater, repeaterPrefix: childName }));
                    child.name = childName;
                    // we move data up
                    concat.push(omit(child, ['data']));
                }
            }
        }
        const columns = (0,vega_util_module/* isArray */.cy)(repeat) ? spec.columns : repeat.column ? repeat.column.length : 1;
        return Object.assign(Object.assign({ data: (_a = childSpec.data) !== null && _a !== void 0 ? _a : data, align: 'all' }, remainingProperties), { columns,
            concat });
    }
    mapFacet(spec, params) {
        const { facet } = spec;
        if (isFacetMapping(facet) && spec.columns) {
            // is facet with row/column
            spec = omit(spec, ['columns']);
            warn(columnsNotSupportByRowCol('facet'));
        }
        return super.mapFacet(spec, params);
    }
    mapUnitWithParentEncodingOrProjection(spec, params) {
        const { encoding, projection } = spec;
        const { parentEncoding, parentProjection, config } = params;
        const mergedProjection = mergeProjection({ parentProjection, projection });
        const mergedEncoding = mergeEncoding({
            parentEncoding,
            encoding: replaceRepeaterInEncoding(encoding, params.repeater)
        });
        return this.mapUnit(Object.assign(Object.assign(Object.assign({}, spec), (mergedProjection ? { projection: mergedProjection } : {})), (mergedEncoding ? { encoding: mergedEncoding } : {})), { config });
    }
    mapFacetedUnit(spec, normParams) {
        // New encoding in the inside spec should not contain row / column
        // as row/column should be moved to facet
        const _a = spec.encoding, { row, column, facet } = _a, encoding = core_rest(_a, ["row", "column", "facet"]);
        // Mark and encoding should be moved into the inner spec
        const { mark, width, projection, height, view, params, encoding: _ } = spec, outerSpec = core_rest(spec, ["mark", "width", "projection", "height", "view", "params", "encoding"]);
        const { facetMapping, layout } = this.getFacetMappingAndLayout({ row, column, facet }, normParams);
        const newEncoding = replaceRepeaterInEncoding(encoding, normParams.repeater);
        return this.mapFacet(Object.assign(Object.assign(Object.assign({}, outerSpec), layout), { 
            // row / column has higher precedence than facet
            facet: facetMapping, spec: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (width ? { width } : {})), (height ? { height } : {})), (view ? { view } : {})), (projection ? { projection } : {})), { mark, encoding: newEncoding }), (params ? { params } : {})) }), normParams);
    }
    getFacetMappingAndLayout(facets, params) {
        var _a;
        const { row, column, facet } = facets;
        if (row || column) {
            if (facet) {
                warn(facetChannelDropped([...(row ? [ROW] : []), ...(column ? [COLUMN] : [])]));
            }
            const facetMapping = {};
            const layout = {};
            for (const channel of [ROW, COLUMN]) {
                const def = facets[channel];
                if (def) {
                    const { align, center, spacing, columns } = def, defWithoutLayout = core_rest(def, ["align", "center", "spacing", "columns"]);
                    facetMapping[channel] = defWithoutLayout;
                    for (const prop of ['align', 'center', 'spacing']) {
                        if (def[prop] !== undefined) {
                            (_a = layout[prop]) !== null && _a !== void 0 ? _a : (layout[prop] = {});
                            layout[prop][channel] = def[prop];
                        }
                    }
                }
            }
            return { facetMapping, layout };
        }
        else {
            const { align, center, spacing, columns } = facet, facetMapping = core_rest(facet, ["align", "center", "spacing", "columns"]);
            return {
                facetMapping: replaceRepeaterInFacet(facetMapping, params.repeater),
                layout: Object.assign(Object.assign(Object.assign(Object.assign({}, (align ? { align } : {})), (center ? { center } : {})), (spacing ? { spacing } : {})), (columns ? { columns } : {}))
            };
        }
    }
    mapLayer(spec, _a) {
        // Special handling for extended layer spec
        var { parentEncoding, parentProjection } = _a, otherParams = core_rest(_a, ["parentEncoding", "parentProjection"]);
        const { encoding, projection } = spec, rest = core_rest(spec, ["encoding", "projection"]);
        const params = Object.assign(Object.assign({}, otherParams), { parentEncoding: mergeEncoding({ parentEncoding, encoding, layer: true }), parentProjection: mergeProjection({ parentProjection, projection }) });
        return super.mapLayer(rest, params);
    }
}
function mergeEncoding({ parentEncoding, encoding = {}, layer }) {
    let merged = {};
    if (parentEncoding) {
        const channels = new Set([...keys(parentEncoding), ...keys(encoding)]);
        for (const channel of channels) {
            const channelDef = encoding[channel];
            const parentChannelDef = parentEncoding[channel];
            if (isFieldOrDatumDef(channelDef)) {
                // Field/Datum Def can inherit properties from its parent
                // Note that parentChannelDef doesn't have to be a field/datum def if the channelDef is already one.
                const mergedChannelDef = Object.assign(Object.assign({}, parentChannelDef), channelDef);
                merged[channel] = mergedChannelDef;
            }
            else if (hasConditionalFieldOrDatumDef(channelDef)) {
                merged[channel] = Object.assign(Object.assign({}, channelDef), { condition: Object.assign(Object.assign({}, parentChannelDef), channelDef.condition) });
            }
            else if (channelDef || channelDef === null) {
                merged[channel] = channelDef;
            }
            else if (layer ||
                isValueDef(parentChannelDef) ||
                isSignalRef(parentChannelDef) ||
                isFieldOrDatumDef(parentChannelDef) ||
                (0,vega_util_module/* isArray */.cy)(parentChannelDef)) {
                merged[channel] = parentChannelDef;
            }
        }
    }
    else {
        merged = encoding;
    }
    return !merged || isEmpty(merged) ? undefined : merged;
}
function mergeProjection(opt) {
    const { parentProjection, projection } = opt;
    if (parentProjection && projection) {
        warn(projectionOverridden({ parentProjection, projection }));
    }
    return projection !== null && projection !== void 0 ? projection : parentProjection;
}
//# sourceMappingURL=core.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/transform.js


function isFilter(t) {
    return 'filter' in t;
}
function isImputeSequence(t) {
    return (t === null || t === void 0 ? void 0 : t['stop']) !== undefined;
}
function isLookup(t) {
    return 'lookup' in t;
}
function isLookupData(from) {
    return 'data' in from;
}
function isLookupSelection(from) {
    return 'param' in from;
}
function isPivot(t) {
    return 'pivot' in t;
}
function isDensity(t) {
    return 'density' in t;
}
function isQuantile(t) {
    return 'quantile' in t;
}
function isRegression(t) {
    return 'regression' in t;
}
function isLoess(t) {
    return 'loess' in t;
}
function isSample(t) {
    return 'sample' in t;
}
function isWindow(t) {
    return 'window' in t;
}
function isJoinAggregate(t) {
    return 'joinaggregate' in t;
}
function isFlatten(t) {
    return 'flatten' in t;
}
function isCalculate(t) {
    return 'calculate' in t;
}
function isBin(t) {
    return 'bin' in t;
}
function isImpute(t) {
    return 'impute' in t;
}
function isTimeUnit(t) {
    return 'timeUnit' in t;
}
function transform_isAggregate(t) {
    return 'aggregate' in t;
}
function isStack(t) {
    return 'stack' in t;
}
function isFold(t) {
    return 'fold' in t;
}
function normalizeTransform(transform) {
    return transform.map(t => {
        if (isFilter(t)) {
            return {
                filter: normalizeLogicalComposition(t.filter, normalizePredicate)
            };
        }
        return t;
    });
}
//# sourceMappingURL=transform.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/normalize/selectioncompat.js
var selectioncompat_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};







class SelectionCompatibilityNormalizer extends SpecMapper {
    map(spec, normParams) {
        var _a, _b;
        (_a = normParams.emptySelections) !== null && _a !== void 0 ? _a : (normParams.emptySelections = {});
        (_b = normParams.selectionPredicates) !== null && _b !== void 0 ? _b : (normParams.selectionPredicates = {});
        spec = normalizeTransforms(spec, normParams);
        return super.map(spec, normParams);
    }
    mapLayerOrUnit(spec, normParams) {
        spec = normalizeTransforms(spec, normParams);
        if (spec.encoding) {
            const encoding = {};
            for (const [channel, enc] of entries(spec.encoding)) {
                encoding[channel] = normalizeChannelDef(enc, normParams);
            }
            spec = Object.assign(Object.assign({}, spec), { encoding });
        }
        return super.mapLayerOrUnit(spec, normParams);
    }
    mapUnit(spec, normParams) {
        const _a = spec, { selection } = _a, rest = selectioncompat_rest(_a, ["selection"]);
        if (selection) {
            return Object.assign(Object.assign({}, rest), { params: entries(selection).map(([name, selDef]) => {
                    var _a;
                    const _b = selDef, { init: value, bind, empty } = _b, select = selectioncompat_rest(_b, ["init", "bind", "empty"]);
                    if (select.type === 'single') {
                        select.type = 'point';
                        select.toggle = false;
                    }
                    else if (select.type === 'multi') {
                        select.type = 'point';
                    }
                    // Propagate emptiness forwards and backwards
                    normParams.emptySelections[name] = empty !== 'none';
                    for (const pred of vals((_a = normParams.selectionPredicates[name]) !== null && _a !== void 0 ? _a : {})) {
                        pred.empty = empty !== 'none';
                    }
                    return { name, value, select, bind };
                }) });
        }
        return spec;
    }
}
function normalizeTransforms(spec, normParams) {
    const { transform: tx } = spec, rest = selectioncompat_rest(spec, ["transform"]);
    if (tx) {
        const transform = tx.map((t) => {
            if (isFilter(t)) {
                return { filter: selectioncompat_normalizePredicate(t, normParams) };
            }
            else if (isBin(t) && isBinParams(t.bin)) {
                return Object.assign(Object.assign({}, t), { bin: normalizeBinExtent(t.bin) });
            }
            else if (isLookup(t)) {
                const _a = t.from, { selection: param } = _a, from = selectioncompat_rest(_a, ["selection"]);
                return param
                    ? Object.assign(Object.assign({}, t), { from: Object.assign({ param }, from) }) : t;
            }
            return t;
        });
        return Object.assign(Object.assign({}, rest), { transform });
    }
    return spec;
}
function normalizeChannelDef(obj, normParams) {
    var _a, _b;
    const enc = duplicate(obj);
    if (isFieldDef(enc) && isBinParams(enc.bin)) {
        enc.bin = normalizeBinExtent(enc.bin);
    }
    if (isScaleFieldDef(enc) && ((_b = (_a = enc.scale) === null || _a === void 0 ? void 0 : _a.domain) === null || _b === void 0 ? void 0 : _b.selection)) {
        const _c = enc.scale.domain, { selection: param } = _c, domain = selectioncompat_rest(_c, ["selection"]);
        enc.scale.domain = Object.assign(Object.assign({}, domain), (param ? { param } : {}));
    }
    if (isConditionalDef(enc)) {
        if ((0,vega_module_js_.isArray)(enc.condition)) {
            enc.condition = enc.condition.map((c) => {
                const { selection, param, test } = c, cond = selectioncompat_rest(c, ["selection", "param", "test"]);
                return param ? c : Object.assign(Object.assign({}, cond), { test: selectioncompat_normalizePredicate(c, normParams) });
            });
        }
        else {
            const _d = normalizeChannelDef(enc.condition, normParams), { selection, param, test } = _d, cond = selectioncompat_rest(_d, ["selection", "param", "test"]);
            enc.condition = param
                ? enc.condition
                : Object.assign(Object.assign({}, cond), { test: selectioncompat_normalizePredicate(enc.condition, normParams) });
        }
    }
    return enc;
}
function normalizeBinExtent(bin) {
    const ext = bin.extent;
    if (ext === null || ext === void 0 ? void 0 : ext.selection) {
        const { selection: param } = ext, rest = selectioncompat_rest(ext, ["selection"]);
        return Object.assign(Object.assign({}, bin), { extent: Object.assign(Object.assign({}, rest), { param }) });
    }
    return bin;
}
function selectioncompat_normalizePredicate(op, normParams) {
    // Normalize old compositions of selection names (e.g., selection: {and: ["one", "two"]})
    const normalizeSelectionComposition = (o) => {
        return normalizeLogicalComposition(o, param => {
            var _a, _b;
            var _c;
            const empty = (_a = normParams.emptySelections[param]) !== null && _a !== void 0 ? _a : true;
            const pred = { param, empty };
            (_b = (_c = normParams.selectionPredicates)[param]) !== null && _b !== void 0 ? _b : (_c[param] = []);
            normParams.selectionPredicates[param].push(pred);
            return pred;
        });
    };
    return op.selection
        ? normalizeSelectionComposition(op.selection)
        : normalizeLogicalComposition(op.test || op.filter, o => o.selection ? normalizeSelectionComposition(o.selection) : o);
}
//# sourceMappingURL=selectioncompat.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/normalize/toplevelselection.js




class TopLevelSelectionsNormalizer extends SpecMapper {
    map(spec, normParams) {
        var _a;
        const selections = (_a = normParams.selections) !== null && _a !== void 0 ? _a : [];
        if (spec.params && !isUnitSpec(spec)) {
            const params = [];
            for (const param of spec.params) {
                if (isSelectionParameter(param)) {
                    selections.push(param);
                }
                else {
                    params.push(param);
                }
            }
            spec.params = params;
        }
        normParams.selections = selections;
        return super.map(spec, addSpecNameToParams(spec, normParams));
    }
    mapUnit(spec, normParams) {
        var _a;
        const selections = normParams.selections;
        if (!selections || !selections.length)
            return spec;
        const path = ((_a = normParams.path) !== null && _a !== void 0 ? _a : []).concat(spec.name);
        const params = [];
        for (const selection of selections) {
            // By default, apply selections to all unit views.
            if (!selection.views || !selection.views.length) {
                params.push(selection);
            }
            else {
                for (const view of selection.views) {
                    // view is either a specific unit name, or a partial path through the spec tree.
                    if (((0,vega_module_js_.isString)(view) && (view === spec.name || path.indexOf(view) >= 0)) ||
                        ((0,vega_module_js_.isArray)(view) &&
                            view.map(v => path.indexOf(v)).every((v, i, arr) => v !== -1 && (i === 0 || v > arr[i - 1])))) {
                        params.push(selection);
                    }
                }
            }
        }
        if (params.length)
            spec.params = params;
        return spec;
    }
}
for (const method of ['mapFacet', 'mapRepeat', 'mapHConcat', 'mapVConcat', 'mapLayer']) {
    const proto = TopLevelSelectionsNormalizer.prototype[method];
    TopLevelSelectionsNormalizer.prototype[method] = function (spec, params) {
        return proto.call(this, spec, addSpecNameToParams(spec, params));
    };
}
function addSpecNameToParams(spec, params) {
    var _a;
    return spec.name
        ? Object.assign(Object.assign({}, params), { path: ((_a = params.path) !== null && _a !== void 0 ? _a : []).concat(spec.name) }) : params;
}
//# sourceMappingURL=toplevelselection.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/normalize/index.js








function normalize(spec, config) {
    if (config === undefined) {
        config = initConfig(spec.config);
    }
    const normalizedSpec = normalizeGenericSpec(spec, config);
    const { width, height } = spec;
    const autosize = normalizeAutoSize(normalizedSpec, { width, height, autosize: spec.autosize }, config);
    return Object.assign(Object.assign({}, normalizedSpec), (autosize ? { autosize } : {}));
}
const coreNormalizer = new CoreNormalizer();
const selectionCompatNormalizer = new SelectionCompatibilityNormalizer();
const topLevelSelectionNormalizer = new TopLevelSelectionsNormalizer();
/**
 * Decompose extended unit specs into composition of pure unit specs.
 * And push top-level selection definitions down to unit specs.
 */
function normalizeGenericSpec(spec, config = {}) {
    const normParams = { config };
    return topLevelSelectionNormalizer.map(coreNormalizer.map(selectionCompatNormalizer.map(spec, normParams), normParams), normParams);
}
function _normalizeAutoSize(autosize) {
    return (0,vega_util_module/* isString */.Kg)(autosize) ? { type: autosize } : autosize !== null && autosize !== void 0 ? autosize : {};
}
/**
 * Normalize autosize and deal with width or height == "container".
 */
function normalizeAutoSize(spec, sizeInfo, config) {
    let { width, height } = sizeInfo;
    const isFitCompatible = isUnitSpec(spec) || isLayerSpec(spec);
    const autosizeDefault = {};
    if (!isFitCompatible) {
        // If spec is not compatible with autosize == "fit", discard width/height == container
        if (width == 'container') {
            warn(containerSizeNonSingle('width'));
            width = undefined;
        }
        if (height == 'container') {
            warn(containerSizeNonSingle('height'));
            height = undefined;
        }
    }
    else {
        // Default autosize parameters to fit when width/height is "container"
        if (width == 'container' && height == 'container') {
            autosizeDefault.type = 'fit';
            autosizeDefault.contains = 'padding';
        }
        else if (width == 'container') {
            autosizeDefault.type = 'fit-x';
            autosizeDefault.contains = 'padding';
        }
        else if (height == 'container') {
            autosizeDefault.type = 'fit-y';
            autosizeDefault.contains = 'padding';
        }
    }
    const autosize = Object.assign(Object.assign(Object.assign({ type: 'pad' }, autosizeDefault), (config ? _normalizeAutoSize(config.autosize) : {})), _normalizeAutoSize(spec.autosize));
    if (autosize.type === 'fit' && !isFitCompatible) {
        warn(FIT_NON_SINGLE);
        autosize.type = 'pad';
    }
    if (width == 'container' && !(autosize.type == 'fit' || autosize.type == 'fit-x')) {
        warn(containerSizeNotCompatibleWithAutosize('width'));
    }
    if (height == 'container' && !(autosize.type == 'fit' || autosize.type == 'fit-y')) {
        warn(containerSizeNotCompatibleWithAutosize('height'));
    }
    // Delete autosize property if it's Vega's default
    if (deepEqual(autosize, { type: 'pad' })) {
        return undefined;
    }
    return autosize;
}
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/spec/toplevel.js


function isFitType(autoSizeType) {
    return autoSizeType === 'fit' || autoSizeType === 'fit-x' || autoSizeType === 'fit-y';
}
function getFitType(sizeType) {
    return sizeType ? `fit-${getPositionScaleChannel(sizeType)}` : 'fit';
}
const TOP_LEVEL_PROPERTIES = [
    'background',
    'padding'
    // We do not include "autosize" here as it is supported by only unit and layer specs and thus need to be normalized
];
function extractTopLevelProperties(t, includeParams) {
    const o = {};
    for (const p of TOP_LEVEL_PROPERTIES) {
        if (t && t[p] !== undefined) {
            o[p] = signalRefOrValue(t[p]);
        }
    }
    if (includeParams) {
        o.params = t.params;
    }
    return o;
}
//# sourceMappingURL=toplevel.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/split.js


/**
 * Generic class for storing properties that are explicitly specified
 * and implicitly determined by the compiler.
 * This is important for scale/axis/legend merging as
 * we want to prioritize properties that users explicitly specified.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
class Split {
    constructor(explicit = {}, implicit = {}) {
        this.explicit = explicit;
        this.implicit = implicit;
    }
    clone() {
        return new Split(duplicate(this.explicit), duplicate(this.implicit));
    }
    combine() {
        return Object.assign(Object.assign({}, this.explicit), this.implicit);
    }
    get(key) {
        // Explicit has higher precedence
        return getFirstDefined(this.explicit[key], this.implicit[key]);
    }
    getWithExplicit(key) {
        // Explicit has higher precedence
        if (this.explicit[key] !== undefined) {
            return { explicit: true, value: this.explicit[key] };
        }
        else if (this.implicit[key] !== undefined) {
            return { explicit: false, value: this.implicit[key] };
        }
        return { explicit: false, value: undefined };
    }
    setWithExplicit(key, { value, explicit }) {
        if (value !== undefined) {
            this.set(key, value, explicit);
        }
    }
    set(key, value, explicit) {
        delete this[explicit ? 'implicit' : 'explicit'][key];
        this[explicit ? 'explicit' : 'implicit'][key] = value;
        return this;
    }
    copyKeyFromSplit(key, { explicit, implicit }) {
        // Explicit has higher precedence
        if (explicit[key] !== undefined) {
            this.set(key, explicit[key], true);
        }
        else if (implicit[key] !== undefined) {
            this.set(key, implicit[key], false);
        }
    }
    copyKeyFromObject(key, s) {
        // Explicit has higher precedence
        if (s[key] !== undefined) {
            this.set(key, s[key], true);
        }
    }
    /**
     * Merge split object into this split object. Properties from the other split
     * overwrite properties from this split.
     */
    copyAll(other) {
        for (const key of keys(other.combine())) {
            const val = other.getWithExplicit(key);
            this.setWithExplicit(key, val);
        }
    }
}
function makeExplicit(value) {
    return {
        explicit: true,
        value
    };
}
function makeImplicit(value) {
    return {
        explicit: false,
        value
    };
}
function tieBreakByComparing(compare) {
    return (v1, v2, property, propertyOf) => {
        const diff = compare(v1.value, v2.value);
        if (diff > 0) {
            return v1;
        }
        else if (diff < 0) {
            return v2;
        }
        return defaultTieBreaker(v1, v2, property, propertyOf);
    };
}
function defaultTieBreaker(v1, v2, property, propertyOf) {
    if (v1.explicit && v2.explicit) {
        warn(mergeConflictingProperty(property, propertyOf, v1.value, v2.value));
    }
    // If equal score, prefer v1.
    return v1;
}
function mergeValuesWithExplicit(v1, v2, property, propertyOf, tieBreaker = defaultTieBreaker) {
    if (v1 === undefined || v1.value === undefined) {
        // For first run
        return v2;
    }
    if (v1.explicit && !v2.explicit) {
        return v1;
    }
    else if (v2.explicit && !v1.explicit) {
        return v2;
    }
    else if (deepEqual(v1.value, v2.value)) {
        return v1;
    }
    else {
        return tieBreaker(v1, v2, property, propertyOf);
    }
}
//# sourceMappingURL=split.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/index.js

/**
 * Class to track interesting properties (see https://15721.courses.cs.cmu.edu/spring2016/papers/graefe-ieee1995.pdf)
 * about how fields have been parsed or whether they have been derived in a transform. We use this to not parse the
 * same field again (or differently).
 */
class AncestorParse extends Split {
    constructor(explicit = {}, implicit = {}, parseNothing = false) {
        super(explicit, implicit);
        this.explicit = explicit;
        this.implicit = implicit;
        this.parseNothing = parseNothing;
    }
    clone() {
        const clone = super.clone();
        clone.parseNothing = this.parseNothing;
        return clone;
    }
}
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/data.js
function isUrlData(data) {
    return 'url' in data;
}
function isInlineData(data) {
    return 'values' in data;
}
function isNamedData(data) {
    return 'name' in data && !isUrlData(data) && !isInlineData(data) && !isGenerator(data);
}
function isGenerator(data) {
    return data && (isSequenceGenerator(data) || isSphereGenerator(data) || isGraticuleGenerator(data));
}
function isSequenceGenerator(data) {
    return 'sequence' in data;
}
function isSphereGenerator(data) {
    return 'sphere' in data;
}
function isGraticuleGenerator(data) {
    return 'graticule' in data;
}
var DataSourceType;
(function (DataSourceType) {
    DataSourceType[DataSourceType["Raw"] = 0] = "Raw";
    DataSourceType[DataSourceType["Main"] = 1] = "Main";
    DataSourceType[DataSourceType["Row"] = 2] = "Row";
    DataSourceType[DataSourceType["Column"] = 3] = "Column";
    DataSourceType[DataSourceType["Lookup"] = 4] = "Lookup";
})(DataSourceType || (DataSourceType = {}));
//# sourceMappingURL=data.js.map
// EXTERNAL MODULE: ./node_modules/vega-event-selector/build/vega-event-selector.module.js
var vega_event_selector_module = __webpack_require__(45948);
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/assemble.js
var assemble_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};









function assembleInit(init, isExpr = true, wrap = vega_util_module/* identity */.D_) {
    if ((0,vega_util_module/* isArray */.cy)(init)) {
        const assembled = init.map(v => assembleInit(v, isExpr, wrap));
        return isExpr ? `[${assembled.join(', ')}]` : assembled;
    }
    else if (isDateTime(init)) {
        if (isExpr) {
            return wrap(dateTimeToExpr(init));
        }
        else {
            return wrap(dateTimeToTimestamp(init));
        }
    }
    return isExpr ? wrap(stringify(init)) : init;
}
function assembleUnitSelectionSignals(model, signals) {
    var _a;
    for (const selCmpt of vals((_a = model.component.selection) !== null && _a !== void 0 ? _a : {})) {
        const name = selCmpt.name;
        let modifyExpr = `${name}${TUPLE}, ${selCmpt.resolve === 'global' ? 'true' : `{unit: ${unitName(model)}}`}`;
        for (const c of selectionCompilers) {
            if (!c.defined(selCmpt))
                continue;
            if (c.signals)
                signals = c.signals(model, selCmpt, signals);
            if (c.modifyExpr)
                modifyExpr = c.modifyExpr(model, selCmpt, modifyExpr);
        }
        signals.push({
            name: name + MODIFY,
            on: [
                {
                    events: { signal: selCmpt.name + TUPLE },
                    update: `modify(${(0,vega_util_module/* stringValue */.r$)(selCmpt.name + STORE)}, ${modifyExpr})`
                }
            ]
        });
    }
    return cleanupEmptyOnArray(signals);
}
function assembleFacetSignals(model, signals) {
    if (model.component.selection && keys(model.component.selection).length) {
        const name = (0,vega_util_module/* stringValue */.r$)(model.getName('cell'));
        signals.unshift({
            name: 'facet',
            value: {},
            on: [
                {
                    events: (0,vega_event_selector_module/* parseSelector */.P)('mousemove', 'scope'),
                    update: `isTuple(facet) ? facet : group(${name}).datum`
                }
            ]
        });
    }
    return cleanupEmptyOnArray(signals);
}
function assembleTopLevelSignals(model, signals) {
    var _a;
    let hasSelections = false;
    for (const selCmpt of vals((_a = model.component.selection) !== null && _a !== void 0 ? _a : {})) {
        const name = selCmpt.name;
        const store = (0,vega_util_module/* stringValue */.r$)(name + STORE);
        const hasSg = signals.filter(s => s.name === name);
        if (hasSg.length === 0) {
            const resolve = selCmpt.resolve === 'global' ? 'union' : selCmpt.resolve;
            const isPoint = selCmpt.type === 'point' ? ', true, true)' : ')';
            signals.push({
                name: selCmpt.name,
                update: `${VL_SELECTION_RESOLVE}(${store}, ${(0,vega_util_module/* stringValue */.r$)(resolve)}${isPoint}`
            });
        }
        hasSelections = true;
        for (const c of selectionCompilers) {
            if (c.defined(selCmpt) && c.topLevelSignals) {
                signals = c.topLevelSignals(model, selCmpt, signals);
            }
        }
    }
    if (hasSelections) {
        const hasUnit = signals.filter(s => s.name === 'unit');
        if (hasUnit.length === 0) {
            signals.unshift({
                name: 'unit',
                value: {},
                on: [{ events: 'mousemove', update: 'isTuple(group()) ? group() : unit' }]
            });
        }
    }
    return cleanupEmptyOnArray(signals);
}
function assembleUnitSelectionData(model, data) {
    var _a;
    const dataCopy = [...data];
    const unit = unitName(model, { escape: false });
    for (const selCmpt of vals((_a = model.component.selection) !== null && _a !== void 0 ? _a : {})) {
        const store = { name: selCmpt.name + STORE };
        if (selCmpt.project.hasSelectionId) {
            store.transform = [{ type: 'collect', sort: { field: SELECTION_ID } }];
        }
        if (selCmpt.init) {
            const fields = selCmpt.project.items.map(proj => {
                const { signals } = proj, rest = assemble_rest(proj, ["signals"]);
                return rest;
            });
            store.values = selCmpt.project.hasSelectionId
                ? selCmpt.init.map(i => ({ unit, [SELECTION_ID]: assembleInit(i, false)[0] }))
                : selCmpt.init.map(i => ({ unit, fields, values: assembleInit(i, false) }));
        }
        const contains = dataCopy.filter(d => d.name === selCmpt.name + STORE);
        if (!contains.length) {
            dataCopy.push(store);
        }
    }
    return dataCopy;
}
function assembleUnitSelectionMarks(model, marks) {
    var _a;
    for (const selCmpt of vals((_a = model.component.selection) !== null && _a !== void 0 ? _a : {})) {
        for (const c of selectionCompilers) {
            if (c.defined(selCmpt) && c.marks) {
                marks = c.marks(model, selCmpt, marks);
            }
        }
    }
    return marks;
}
function assembleLayerSelectionMarks(model, marks) {
    for (const child of model.children) {
        if (isUnitModel(child)) {
            marks = assembleUnitSelectionMarks(child, marks);
        }
    }
    return marks;
}
function assembleSelectionScaleDomain(model, extent, scaleCmpt, domain) {
    const parsedExtent = parseSelectionExtent(model, extent.param, extent);
    return {
        signal: hasContinuousDomain(scaleCmpt.get('type')) && (0,vega_util_module/* isArray */.cy)(domain) && domain[0] > domain[1]
            ? `isValid(${parsedExtent}) && reverse(${parsedExtent})`
            : parsedExtent
    };
}
function cleanupEmptyOnArray(signals) {
    return signals.map(s => {
        if (s.on && !s.on.length)
            delete s.on;
        return s;
    });
}
//# sourceMappingURL=assemble.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/dataflow.js


/**
 * A node in the dataflow tree.
 */
class DataFlowNode {
    constructor(parent, debugName) {
        this.debugName = debugName;
        this._children = [];
        this._parent = null;
        if (parent) {
            this.parent = parent;
        }
    }
    /**
     * Clone this node with a deep copy but don't clone links to children or parents.
     */
    clone() {
        throw new Error('Cannot clone node');
    }
    get parent() {
        return this._parent;
    }
    /**
     * Set the parent of the node and also add this node to the parent's children.
     */
    set parent(parent) {
        this._parent = parent;
        if (parent) {
            parent.addChild(this);
        }
    }
    get children() {
        return this._children;
    }
    numChildren() {
        return this._children.length;
    }
    addChild(child, loc) {
        // do not add the same child twice
        if (this._children.includes(child)) {
            warn(ADD_SAME_CHILD_TWICE);
            return;
        }
        if (loc !== undefined) {
            this._children.splice(loc, 0, child);
        }
        else {
            this._children.push(child);
        }
    }
    removeChild(oldChild) {
        const loc = this._children.indexOf(oldChild);
        this._children.splice(loc, 1);
        return loc;
    }
    /**
     * Remove node from the dataflow.
     */
    remove() {
        let loc = this._parent.removeChild(this);
        for (const child of this._children) {
            // do not use the set method because we want to insert at a particular location
            child._parent = this._parent;
            this._parent.addChild(child, loc++);
        }
    }
    /**
     * Insert another node as a parent of this node.
     */
    insertAsParentOf(other) {
        const parent = other.parent;
        parent.removeChild(this);
        this.parent = parent;
        other.parent = this;
    }
    swapWithParent() {
        const parent = this._parent;
        const newParent = parent.parent;
        // reconnect the children
        for (const child of this._children) {
            child.parent = parent;
        }
        // remove old links
        this._children = []; // equivalent to removing every child link one by one
        parent.removeChild(this);
        const loc = parent.parent.removeChild(parent);
        // swap two nodes but maintain order in children
        this._parent = newParent;
        newParent.addChild(this, loc);
        parent.parent = this;
    }
}
class OutputNode extends DataFlowNode {
    clone() {
        const cloneObj = new this.constructor();
        cloneObj.debugName = `clone_${this.debugName}`;
        cloneObj._source = this._source;
        cloneObj._name = `clone_${this._name}`;
        cloneObj.type = this.type;
        cloneObj.refCounts = this.refCounts;
        cloneObj.refCounts[cloneObj._name] = 0;
        return cloneObj;
    }
    /**
     * @param source The name of the source. Will change in assemble.
     * @param type The type of the output node.
     * @param refCounts A global ref counter map.
     */
    constructor(parent, source, type, refCounts) {
        super(parent, source);
        this.type = type;
        this.refCounts = refCounts;
        this._source = this._name = source;
        if (this.refCounts && !(this._name in this.refCounts)) {
            this.refCounts[this._name] = 0;
        }
    }
    dependentFields() {
        return new Set();
    }
    producedFields() {
        return new Set();
    }
    hash() {
        if (this._hash === undefined) {
            this._hash = `Output ${uniqueId()}`;
        }
        return this._hash;
    }
    /**
     * Request the datasource name and increase the ref counter.
     *
     * During the parsing phase, this will return the simple name such as 'main' or 'raw'.
     * It is crucial to request the name from an output node to mark it as a required node.
     * If nobody ever requests the name, this datasource will not be instantiated in the assemble phase.
     *
     * In the assemble phase, this will return the correct name.
     */
    getSource() {
        this.refCounts[this._name]++;
        return this._source;
    }
    isRequired() {
        return !!this.refCounts[this._name];
    }
    setSource(source) {
        this._source = source;
    }
}
//# sourceMappingURL=dataflow.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/timeunit.js
var data_timeunit_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};




class TimeUnitNode extends DataFlowNode {
    clone() {
        return new TimeUnitNode(null, duplicate(this.formula));
    }
    constructor(parent, formula) {
        super(parent);
        this.formula = formula;
    }
    static makeFromEncoding(parent, model) {
        const formula = model.reduceFieldDef((timeUnitComponent, fieldDef) => {
            const { field, timeUnit } = fieldDef;
            if (timeUnit) {
                const as = vgField(fieldDef, { forAs: true });
                timeUnitComponent[hash({
                    as,
                    field,
                    timeUnit
                })] = {
                    as,
                    field,
                    timeUnit
                };
            }
            return timeUnitComponent;
        }, {});
        if (isEmpty(formula)) {
            return null;
        }
        return new TimeUnitNode(parent, formula);
    }
    static makeFromTransform(parent, t) {
        const _a = Object.assign({}, t), { timeUnit } = _a, other = data_timeunit_rest(_a, ["timeUnit"]);
        const normalizedTimeUnit = normalizeTimeUnit(timeUnit);
        const component = Object.assign(Object.assign({}, other), { timeUnit: normalizedTimeUnit });
        return new TimeUnitNode(parent, {
            [hash(component)]: component
        });
    }
    /**
     * Merge together TimeUnitNodes assigning the children of `other` to `this`
     * and removing `other`.
     */
    merge(other) {
        this.formula = Object.assign({}, this.formula);
        // if the same hash happen twice, merge
        for (const key in other.formula) {
            if (!this.formula[key]) {
                // copy if it's not a duplicate
                this.formula[key] = other.formula[key];
            }
        }
        for (const child of other.children) {
            other.removeChild(child);
            child.parent = this;
        }
        other.remove();
    }
    /**
     * Remove time units coming from the other node.
     */
    removeFormulas(fields) {
        const newFormula = {};
        for (const [key, timeUnit] of entries(this.formula)) {
            if (!fields.has(timeUnit.as)) {
                newFormula[key] = timeUnit;
            }
        }
        this.formula = newFormula;
    }
    producedFields() {
        return new Set(vals(this.formula).map(f => f.as));
    }
    dependentFields() {
        return new Set(vals(this.formula).map(f => f.field));
    }
    hash() {
        return `TimeUnit ${hash(this.formula)}`;
    }
    assemble() {
        const transforms = [];
        for (const f of vals(this.formula)) {
            const { field, as, timeUnit } = f;
            const _a = normalizeTimeUnit(timeUnit), { unit, utc } = _a, params = data_timeunit_rest(_a, ["unit", "utc"]);
            transforms.push(Object.assign(Object.assign(Object.assign(Object.assign({ field: replacePathInField(field), type: 'timeunit' }, (unit ? { units: getTimeUnitParts(unit) } : {})), (utc ? { timezone: 'utc' } : {})), params), { as: [as, `${as}_end`] }));
        }
        return transforms;
    }
}
//# sourceMappingURL=timeunit.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/project.js
var project_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};







const TUPLE_FIELDS = '_tuple_fields';
class SelectionProjectionComponent {
    constructor(...items) {
        this.items = items;
        this.hasChannel = {};
        this.hasField = {};
        this.hasSelectionId = false;
    }
}
const project = {
    defined: () => {
        return true; // This transform handles its own defaults, so always run parse.
    },
    parse: (model, selCmpt, selDef) => {
        var _a;
        const name = selCmpt.name;
        const proj = ((_a = selCmpt.project) !== null && _a !== void 0 ? _a : (selCmpt.project = new SelectionProjectionComponent()));
        const parsed = {};
        const timeUnits = {};
        const signals = new Set();
        const signalName = (p, range) => {
            const suffix = range === 'visual' ? p.channel : p.field;
            let sg = varName(`${name}_${suffix}`);
            for (let counter = 1; signals.has(sg); counter++) {
                sg = varName(`${name}_${suffix}_${counter}`);
            }
            signals.add(sg);
            return { [range]: sg };
        };
        const type = selCmpt.type;
        const cfg = model.config.selection[type];
        const init = selDef.value !== undefined
            ? (0,vega_util_module/* array */.YO)(selDef.value)
            : null;
        // If no explicit projection (either fields or encodings) is specified, set some defaults.
        // If an initial value is set, try to infer projections.
        let { fields, encodings } = ((0,vega_util_module/* isObject */.Gv)(selDef.select) ? selDef.select : {});
        if (!fields && !encodings && init) {
            for (const initVal of init) {
                // initVal may be a scalar value to smoothen varParam -> pointSelection gradient.
                if (!(0,vega_util_module/* isObject */.Gv)(initVal)) {
                    continue;
                }
                for (const key of keys(initVal)) {
                    if (isSingleDefUnitChannel(key)) {
                        (encodings || (encodings = [])).push(key);
                    }
                    else {
                        if (type === 'interval') {
                            warn(INTERVAL_INITIALIZED_WITH_X_Y);
                            encodings = cfg.encodings;
                        }
                        else {
                            (fields || (fields = [])).push(key);
                        }
                    }
                }
            }
        }
        // If no initial value is specified, use the default configuration.
        // We break this out as a separate if block (instead of an else condition)
        // to account for unprojected point selections that have scalar initial values
        if (!fields && !encodings) {
            encodings = cfg.encodings;
            if ('fields' in cfg) {
                fields = cfg.fields;
            }
        }
        for (const channel of encodings !== null && encodings !== void 0 ? encodings : []) {
            const fieldDef = model.fieldDef(channel);
            if (fieldDef) {
                let field = fieldDef.field;
                if (fieldDef.aggregate) {
                    warn(cannotProjectAggregate(channel, fieldDef.aggregate));
                    continue;
                }
                else if (!field) {
                    warn(cannotProjectOnChannelWithoutField(channel));
                    continue;
                }
                if (fieldDef.timeUnit) {
                    field = model.vgField(channel);
                    // Construct TimeUnitComponents which will be combined into a
                    // TimeUnitNode. This node may need to be inserted into the
                    // dataflow if the selection is used across views that do not
                    // have these time units defined.
                    const component = {
                        timeUnit: fieldDef.timeUnit,
                        as: field,
                        field: fieldDef.field
                    };
                    timeUnits[hash(component)] = component;
                }
                // Prevent duplicate projections on the same field.
                // TODO: what if the same field is bound to multiple channels (e.g., SPLOM diag).
                if (!parsed[field]) {
                    // Determine whether the tuple will store enumerated or ranged values.
                    // Interval selections store ranges for continuous scales, and enumerations otherwise.
                    // Single/multi selections store ranges for binned fields, and enumerations otherwise.
                    let tplType = 'E';
                    if (type === 'interval') {
                        const scaleType = model.getScaleComponent(channel).get('type');
                        if (hasContinuousDomain(scaleType)) {
                            tplType = 'R';
                        }
                    }
                    else if (fieldDef.bin) {
                        tplType = 'R-RE';
                    }
                    const p = { field, channel, type: tplType };
                    p.signals = Object.assign(Object.assign({}, signalName(p, 'data')), signalName(p, 'visual'));
                    proj.items.push((parsed[field] = p));
                    proj.hasField[field] = proj.hasChannel[channel] = parsed[field];
                    proj.hasSelectionId = proj.hasSelectionId || field === SELECTION_ID;
                }
            }
            else {
                warn(cannotProjectOnChannelWithoutField(channel));
            }
        }
        for (const field of fields !== null && fields !== void 0 ? fields : []) {
            if (proj.hasField[field])
                continue;
            const p = { type: 'E', field };
            p.signals = Object.assign({}, signalName(p, 'data'));
            proj.items.push(p);
            proj.hasField[field] = p;
            proj.hasSelectionId = proj.hasSelectionId || field === SELECTION_ID;
        }
        if (init) {
            selCmpt.init = init.map((v) => {
                // Selections can be initialized either with a full object that maps projections to values
                // or scalar values to smoothen the abstraction gradient from variable params to point selections.
                return proj.items.map(p => ((0,vega_util_module/* isObject */.Gv)(v) ? (v[p.channel] !== undefined ? v[p.channel] : v[p.field]) : v));
            });
        }
        if (!isEmpty(timeUnits)) {
            proj.timeUnit = new TimeUnitNode(null, timeUnits);
        }
    },
    signals: (model, selCmpt, allSignals) => {
        const name = selCmpt.name + TUPLE_FIELDS;
        const hasSignal = allSignals.filter(s => s.name === name);
        return hasSignal.length > 0 || selCmpt.project.hasSelectionId
            ? allSignals
            : allSignals.concat({
                name,
                value: selCmpt.project.items.map(proj => {
                    const { signals, hasLegend } = proj, rest = project_rest(proj, ["signals", "hasLegend"]);
                    rest.field = replacePathInField(rest.field);
                    return rest;
                })
            });
    }
};
/* harmony default export */ const selection_project = (project);
//# sourceMappingURL=project.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/scales.js







const scaleBindings = {
    defined: selCmpt => {
        return selCmpt.type === 'interval' && selCmpt.resolve === 'global' && selCmpt.bind && selCmpt.bind === 'scales';
    },
    parse: (model, selCmpt) => {
        const bound = (selCmpt.scales = []);
        for (const proj of selCmpt.project.items) {
            const channel = proj.channel;
            if (!isScaleChannel(channel)) {
                continue;
            }
            const scale = model.getScaleComponent(channel);
            const scaleType = scale ? scale.get('type') : undefined;
            if (!scale || !hasContinuousDomain(scaleType)) {
                warn(SCALE_BINDINGS_CONTINUOUS);
                continue;
            }
            scale.set('selectionExtent', { param: selCmpt.name, field: proj.field }, true);
            bound.push(proj);
        }
    },
    topLevelSignals: (model, selCmpt, signals) => {
        const bound = selCmpt.scales.filter(proj => signals.filter(s => s.name === proj.signals.data).length === 0);
        // Top-level signals are only needed for multiview displays and if this
        // view's top-level signals haven't already been generated.
        if (!model.parent || isTopLevelLayer(model) || bound.length === 0) {
            return signals;
        }
        // vlSelectionResolve does not account for the behavior of bound scales in
        // multiview displays. Each unit view adds a tuple to the store, but the
        // state of the selection is the unit selection most recently updated. This
        // state is captured by the top-level signals that we insert and "push
        // outer" to from within the units. We need to reassemble this state into
        // the top-level named signal, except no single selCmpt has a global view.
        const namedSg = signals.filter(s => s.name === selCmpt.name)[0];
        let update = namedSg.update;
        if (update.indexOf(VL_SELECTION_RESOLVE) >= 0) {
            namedSg.update = `{${bound
                .map(proj => `${(0,vega_util_module/* stringValue */.r$)(replacePathInField(proj.field))}: ${proj.signals.data}`)
                .join(', ')}}`;
        }
        else {
            for (const proj of bound) {
                const mapping = `${(0,vega_util_module/* stringValue */.r$)(replacePathInField(proj.field))}: ${proj.signals.data}`;
                if (!update.includes(mapping)) {
                    update = `${update.substring(0, update.length - 1)}, ${mapping}}`;
                }
            }
            namedSg.update = update;
        }
        return signals.concat(bound.map(proj => ({ name: proj.signals.data })));
    },
    signals: (model, selCmpt, signals) => {
        // Nested signals need only push to top-level signals with multiview displays.
        if (model.parent && !isTopLevelLayer(model)) {
            for (const proj of selCmpt.scales) {
                const signal = signals.filter(s => s.name === proj.signals.data)[0];
                signal.push = 'outer';
                delete signal.value;
                delete signal.update;
            }
        }
        return signals;
    }
};
/* harmony default export */ const scales = (scaleBindings);
function scales_domain(model, channel) {
    const scale = (0,vega_util_module/* stringValue */.r$)(model.scaleName(channel));
    return `domain(${scale})`;
}
function isTopLevelLayer(model) {
    var _a;
    return model.parent && isLayerModel(model.parent) && ((_a = !model.parent.parent) !== null && _a !== void 0 ? _a : isTopLevelLayer(model.parent.parent));
}
//# sourceMappingURL=scales.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/interval.js
var interval_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};









const BRUSH = '_brush';
const SCALE_TRIGGER = '_scale_trigger';
const interval = {
    defined: selCmpt => selCmpt.type === 'interval',
    signals: (model, selCmpt, signals) => {
        const name = selCmpt.name;
        const fieldsSg = name + TUPLE_FIELDS;
        const hasScales = scales.defined(selCmpt);
        const init = selCmpt.init ? selCmpt.init[0] : null;
        const dataSignals = [];
        const scaleTriggers = [];
        if (selCmpt.translate && !hasScales) {
            const filterExpr = `!event.item || event.item.mark.name !== ${(0,vega_util_module/* stringValue */.r$)(name + BRUSH)}`;
            events(selCmpt, (on, evt) => {
                var _a;
                var _b;
                const filters = (0,vega_util_module/* array */.YO)(((_a = (_b = evt.between[0]).filter) !== null && _a !== void 0 ? _a : (_b.filter = [])));
                if (!filters.includes(filterExpr)) {
                    filters.push(filterExpr);
                }
                return on;
            });
        }
        selCmpt.project.items.forEach((proj, i) => {
            const channel = proj.channel;
            if (channel !== X && channel !== Y) {
                warn('Interval selections only support x and y encoding channels.');
                return;
            }
            const val = init ? init[i] : null;
            const cs = channelSignals(model, selCmpt, proj, val);
            const dname = proj.signals.data;
            const vname = proj.signals.visual;
            const scaleName = (0,vega_util_module/* stringValue */.r$)(model.scaleName(channel));
            const scaleType = model.getScaleComponent(channel).get('type');
            const toNum = hasContinuousDomain(scaleType) ? '+' : '';
            signals.push(...cs);
            dataSignals.push(dname);
            scaleTriggers.push({
                scaleName: model.scaleName(channel),
                expr: `(!isArray(${dname}) || ` +
                    `(${toNum}invert(${scaleName}, ${vname})[0] === ${toNum}${dname}[0] && ` +
                    `${toNum}invert(${scaleName}, ${vname})[1] === ${toNum}${dname}[1]))`
            });
        });
        // Proxy scale reactions to ensure that an infinite loop doesn't occur
        // when an interval selection filter touches the scale.
        if (!hasScales && scaleTriggers.length) {
            signals.push({
                name: name + SCALE_TRIGGER,
                value: {},
                on: [
                    {
                        events: scaleTriggers.map(t => ({ scale: t.scaleName })),
                        update: `${scaleTriggers.map(t => t.expr).join(' && ')} ? ${name + SCALE_TRIGGER} : {}`
                    }
                ]
            });
        }
        // Only add an interval to the store if it has valid data extents. Data extents
        // are set to null if pixel extents are equal to account for intervals over
        // ordinal/nominal domains which, when inverted, will still produce a valid datum.
        const update = `unit: ${unitName(model)}, fields: ${fieldsSg}, values`;
        return signals.concat(Object.assign(Object.assign({ name: name + TUPLE }, (init ? { init: `{${update}: ${assembleInit(init)}}` } : {})), (dataSignals.length
            ? {
                on: [
                    {
                        events: [{ signal: dataSignals.join(' || ') }],
                        update: `${dataSignals.join(' && ')} ? {${update}: [${dataSignals}]} : null`
                    }
                ]
            }
            : {})));
    },
    marks: (model, selCmpt, marks) => {
        const name = selCmpt.name;
        const { x, y } = selCmpt.project.hasChannel;
        const xvname = x === null || x === void 0 ? void 0 : x.signals.visual;
        const yvname = y === null || y === void 0 ? void 0 : y.signals.visual;
        const store = `data(${(0,vega_util_module/* stringValue */.r$)(selCmpt.name + STORE)})`;
        // Do not add a brush if we're binding to scales
        // or we don't have a valid interval projection
        if (scales.defined(selCmpt) || (!x && !y)) {
            return marks;
        }
        const update = {
            x: x !== undefined ? { signal: `${xvname}[0]` } : { value: 0 },
            y: y !== undefined ? { signal: `${yvname}[0]` } : { value: 0 },
            x2: x !== undefined ? { signal: `${xvname}[1]` } : { field: { group: 'width' } },
            y2: y !== undefined ? { signal: `${yvname}[1]` } : { field: { group: 'height' } }
        };
        // If the selection is resolved to global, only a single interval is in
        // the store. Wrap brush mark's encodings with a production rule to test
        // this based on the `unit` property. Hide the brush mark if it corresponds
        // to a unit different from the one in the store.
        if (selCmpt.resolve === 'global') {
            for (const key of keys(update)) {
                update[key] = [
                    Object.assign({ test: `${store}.length && ${store}[0].unit === ${unitName(model)}` }, update[key]),
                    { value: 0 }
                ];
            }
        }
        // Two brush marks ensure that fill colors and other aesthetic choices do
        // not interefere with the core marks, but that the brushed region can still
        // be interacted with (e.g., dragging it around).
        const _a = selCmpt.mark, { fill, fillOpacity, cursor } = _a, stroke = interval_rest(_a, ["fill", "fillOpacity", "cursor"]);
        const vgStroke = keys(stroke).reduce((def, k) => {
            def[k] = [
                {
                    test: [x !== undefined && `${xvname}[0] !== ${xvname}[1]`, y !== undefined && `${yvname}[0] !== ${yvname}[1]`]
                        .filter(t => t)
                        .join(' && '),
                    value: stroke[k]
                },
                { value: null }
            ];
            return def;
        }, {});
        return [
            {
                name: `${name + BRUSH}_bg`,
                type: 'rect',
                clip: true,
                encode: {
                    enter: {
                        fill: { value: fill },
                        fillOpacity: { value: fillOpacity }
                    },
                    update
                }
            },
            ...marks,
            {
                name: name + BRUSH,
                type: 'rect',
                clip: true,
                encode: {
                    enter: Object.assign(Object.assign({}, (cursor ? { cursor: { value: cursor } } : {})), { fill: { value: 'transparent' } }),
                    update: Object.assign(Object.assign({}, update), vgStroke)
                }
            }
        ];
    }
};
/* harmony default export */ const selection_interval = (interval);
/**
 * Returns the visual and data signals for an interval selection.
 */
function channelSignals(model, selCmpt, proj, init) {
    const channel = proj.channel;
    const vname = proj.signals.visual;
    const dname = proj.signals.data;
    const hasScales = scales.defined(selCmpt);
    const scaleName = (0,vega_util_module/* stringValue */.r$)(model.scaleName(channel));
    const scale = model.getScaleComponent(channel);
    const scaleType = scale ? scale.get('type') : undefined;
    const scaled = (str) => `scale(${scaleName}, ${str})`;
    const size = model.getSizeSignalRef(channel === X ? 'width' : 'height').signal;
    const coord = `${channel}(unit)`;
    const on = events(selCmpt, (def, evt) => {
        return [
            ...def,
            { events: evt.between[0], update: `[${coord}, ${coord}]` },
            { events: evt, update: `[${vname}[0], clamp(${coord}, 0, ${size})]` } // Brush End
        ];
    });
    // React to pan/zooms of continuous scales. Non-continuous scales
    // (band, point) cannot be pan/zoomed and any other changes
    // to their domains (e.g., filtering) should clear the brushes.
    on.push({
        events: { signal: selCmpt.name + SCALE_TRIGGER },
        update: hasContinuousDomain(scaleType) ? `[${scaled(`${dname}[0]`)}, ${scaled(`${dname}[1]`)}]` : `[0, 0]`
    });
    return hasScales
        ? [{ name: dname, on: [] }]
        : [
            Object.assign(Object.assign({ name: vname }, (init ? { init: assembleInit(init, true, scaled) } : { value: [] })), { on }),
            Object.assign(Object.assign({ name: dname }, (init ? { init: assembleInit(init) } : {})), { on: [
                    {
                        events: { signal: vname },
                        update: `${vname}[0] === ${vname}[1] ? null : invert(${scaleName}, ${vname})`
                    }
                ] })
        ];
}
function events(selCmpt, cb) {
    return selCmpt.events.reduce((on, evt) => {
        if (!evt.between) {
            warn(`${evt} is not an ordered event stream for interval selections.`);
            return on;
        }
        return cb(on, evt);
    }, []);
}
//# sourceMappingURL=interval.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/point.js






const point = {
    defined: selCmpt => selCmpt.type === 'point',
    signals: (model, selCmpt, signals) => {
        var _a;
        const name = selCmpt.name;
        const fieldsSg = name + TUPLE_FIELDS;
        const project = selCmpt.project;
        const datum = '(item().isVoronoi ? datum.datum : datum)';
        // Only add a discrete selection to the store if a datum is present _and_
        // the interaction isn't occurring on a group mark. This guards against
        // polluting interactive state with invalid values in faceted displays
        // as the group marks are also data-driven. We force the update to account
        // for constant null states but varying toggles (e.g., shift-click in
        // whitespace followed by a click in whitespace; the store should only
        // be cleared on the second click).
        const brushes = vals((_a = model.component.selection) !== null && _a !== void 0 ? _a : {})
            .reduce((acc, cmpt) => {
            return cmpt.type === 'interval' ? acc.concat(cmpt.name + BRUSH) : acc;
        }, [])
            .map(b => `indexof(item().mark.name, '${b}') < 0`)
            .join(' && ');
        const test = `datum && item().mark.marktype !== 'group' && indexof(item().mark.role, 'legend') < 0${brushes ? ` && ${brushes}` : ''}`;
        let update = `unit: ${unitName(model)}, `;
        if (selCmpt.project.hasSelectionId) {
            update += `${SELECTION_ID}: ${datum}[${(0,vega_util_module/* stringValue */.r$)(SELECTION_ID)}]`;
        }
        else {
            const values = project.items
                .map(p => {
                const fieldDef = model.fieldDef(p.channel);
                // Binned fields should capture extents, for a range test against the raw field.
                return (fieldDef === null || fieldDef === void 0 ? void 0 : fieldDef.bin)
                    ? `[${datum}[${(0,vega_util_module/* stringValue */.r$)(model.vgField(p.channel, {}))}], ` +
                        `${datum}[${(0,vega_util_module/* stringValue */.r$)(model.vgField(p.channel, { binSuffix: 'end' }))}]]`
                    : `${datum}[${(0,vega_util_module/* stringValue */.r$)(p.field)}]`;
            })
                .join(', ');
            update += `fields: ${fieldsSg}, values: [${values}]`;
        }
        const events = selCmpt.events;
        return signals.concat([
            {
                name: name + TUPLE,
                on: events
                    ? [
                        {
                            events,
                            update: `${test} ? {${update}} : null`,
                            force: true
                        }
                    ]
                    : []
            }
        ]);
    }
};
/* harmony default export */ const selection_point = (point);
//# sourceMappingURL=point.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/conditional.js




/**
 * Return a mixin that includes a Vega production rule for a Vega-Lite conditional channel definition
 * or a simple mixin if channel def has no condition.
 */
function wrapCondition(model, channelDef, vgChannel, refFn) {
    const condition = isConditionalDef(channelDef) && channelDef.condition;
    const valueRef = refFn(channelDef);
    if (condition) {
        const conditions = (0,vega_util_module/* array */.YO)(condition);
        const vgConditions = conditions.map(c => {
            const conditionValueRef = refFn(c);
            if (isConditionalParameter(c)) {
                const { param, empty } = c;
                const test = parseSelectionPredicate(model, { param, empty });
                return Object.assign({ test }, conditionValueRef);
            }
            else {
                const test = expression(model, c.test); // FIXME: remove casting once TS is no longer dumb about it
                return Object.assign({ test }, conditionValueRef);
            }
        });
        return {
            [vgChannel]: [...vgConditions, ...(valueRef !== undefined ? [valueRef] : [])]
        };
    }
    else {
        return valueRef !== undefined ? { [vgChannel]: valueRef } : {};
    }
}
//# sourceMappingURL=conditional.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/text.js




function text_text(model, channel = 'text') {
    const channelDef = model.encoding[channel];
    return wrapCondition(model, channelDef, channel, cDef => textRef(cDef, model.config));
}
function textRef(channelDef, config, expr = 'datum') {
    // text
    if (channelDef) {
        if (isValueDef(channelDef)) {
            return signalOrValueRef(channelDef.value);
        }
        if (isFieldOrDatumDef(channelDef)) {
            const { format, formatType } = getFormatMixins(channelDef);
            return formatSignalRef({ fieldOrDatumDef: channelDef, format, formatType, expr, config });
        }
    }
    return undefined;
}
//# sourceMappingURL=text.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/tooltip.js











function tooltip(model, opt = {}) {
    const { encoding, markDef, config, stack } = model;
    const channelDef = encoding.tooltip;
    if ((0,vega_util_module/* isArray */.cy)(channelDef)) {
        return { tooltip: tooltipRefForEncoding({ tooltip: channelDef }, stack, config, opt) };
    }
    else {
        const datum = opt.reactiveGeom ? 'datum.datum' : 'datum';
        return wrapCondition(model, channelDef, 'tooltip', cDef => {
            // use valueRef based on channelDef first
            const tooltipRefFromChannelDef = textRef(cDef, config, datum);
            if (tooltipRefFromChannelDef) {
                return tooltipRefFromChannelDef;
            }
            if (cDef === null) {
                // Allow using encoding.tooltip = null to disable tooltip
                return undefined;
            }
            let markTooltip = getMarkPropOrConfig('tooltip', markDef, config);
            if (markTooltip === true) {
                markTooltip = { content: 'encoding' };
            }
            if ((0,vega_util_module/* isString */.Kg)(markTooltip)) {
                return { value: markTooltip };
            }
            else if ((0,vega_util_module/* isObject */.Gv)(markTooltip)) {
                // `tooltip` is `{fields: 'encodings' | 'fields'}`
                if (isSignalRef(markTooltip)) {
                    return markTooltip;
                }
                else if (markTooltip.content === 'encoding') {
                    return tooltipRefForEncoding(encoding, stack, config, opt);
                }
                else {
                    return { signal: datum };
                }
            }
            return undefined;
        });
    }
}
function tooltipData(encoding, stack, config, { reactiveGeom } = {}) {
    const toSkip = {};
    const expr = reactiveGeom ? 'datum.datum' : 'datum';
    const tuples = [];
    function add(fDef, channel) {
        const mainChannel = getMainRangeChannel(channel);
        const fieldDef = isTypedFieldDef(fDef)
            ? fDef
            : Object.assign(Object.assign({}, fDef), { type: encoding[mainChannel].type // for secondary field def, copy type from main channel
             });
        const title = fieldDef.title || defaultTitle(fieldDef, config);
        const key = (0,vega_util_module/* array */.YO)(title).join(', ');
        let value;
        if (isXorY(channel)) {
            const channel2 = channel === 'x' ? 'x2' : 'y2';
            const fieldDef2 = getFieldDef(encoding[channel2]);
            if (isBinned(fieldDef.bin) && fieldDef2) {
                const startField = vgField(fieldDef, { expr });
                const endField = vgField(fieldDef2, { expr });
                const { format, formatType } = getFormatMixins(fieldDef);
                value = binFormatExpression(startField, endField, format, formatType, config);
                toSkip[channel2] = true;
            }
        }
        if ((isXorY(channel) || channel === THETA || channel === RADIUS) &&
            stack &&
            stack.fieldChannel === channel &&
            stack.offset === 'normalize') {
            const { format, formatType } = getFormatMixins(fieldDef);
            value = formatSignalRef({
                fieldOrDatumDef: fieldDef,
                format,
                formatType,
                expr,
                config,
                normalizeStack: true
            }).signal;
        }
        value !== null && value !== void 0 ? value : (value = textRef(fieldDef, config, expr).signal);
        tuples.push({ channel, key, value });
    }
    forEach(encoding, (channelDef, channel) => {
        if (isFieldDef(channelDef)) {
            add(channelDef, channel);
        }
        else if (hasConditionalFieldDef(channelDef)) {
            add(channelDef.condition, channel);
        }
    });
    const out = {};
    for (const { channel, key, value } of tuples) {
        if (!toSkip[channel] && !out[key]) {
            out[key] = value;
        }
    }
    return out;
}
function tooltipRefForEncoding(encoding, stack, config, { reactiveGeom } = {}) {
    const data = tooltipData(encoding, stack, config, { reactiveGeom });
    const keyValues = entries(data).map(([key, value]) => `"${key}": ${value}`);
    return keyValues.length > 0 ? { signal: `{${keyValues.join(', ')}}` } : undefined;
}
//# sourceMappingURL=tooltip.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/aria.js






function aria(model) {
    const { markDef, config } = model;
    const enableAria = getMarkPropOrConfig('aria', markDef, config);
    // We can ignore other aria properties if ariaHidden is true.
    if (enableAria === false) {
        // getMarkGroups sets aria to false already so we don't have to set it in the encode block
        return {};
    }
    return Object.assign(Object.assign(Object.assign({}, (enableAria ? { aria: enableAria } : {})), ariaRoleDescription(model)), description(model));
}
function ariaRoleDescription(model) {
    const { mark, markDef, config } = model;
    if (config.aria === false) {
        return {};
    }
    const ariaRoleDesc = getMarkPropOrConfig('ariaRoleDescription', markDef, config);
    if (ariaRoleDesc != null) {
        return { ariaRoleDescription: { value: ariaRoleDesc } };
    }
    return mark in VG_MARK_INDEX ? {} : { ariaRoleDescription: { value: mark } };
}
function description(model) {
    const { encoding, markDef, config, stack } = model;
    const channelDef = encoding.description;
    if (channelDef) {
        return wrapCondition(model, channelDef, 'description', cDef => textRef(cDef, model.config));
    }
    // Use default from mark def or config if defined.
    // Functions in encode usually just return undefined but since we are defining a default below, we need to check the default here.
    const descriptionValue = getMarkPropOrConfig('description', markDef, config);
    if (descriptionValue != null) {
        return {
            description: signalOrValueRef(descriptionValue)
        };
    }
    if (config.aria === false) {
        return {};
    }
    const data = tooltipData(encoding, stack, config);
    if (isEmpty(data)) {
        return undefined;
    }
    return {
        description: {
            signal: entries(data)
                .map(([key, value], index) => `"${index > 0 ? '; ' : ''}${key}: " + (${value})`)
                .join(' + ')
        }
    };
}
//# sourceMappingURL=aria.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/nonposition.js



/**
 * Return encode for non-positional channels with scales. (Text doesn't have scale.)
 */
function nonPosition(channel, model, opt = {}) {
    const { markDef, encoding, config } = model;
    const { vgChannel } = opt;
    let { defaultRef, defaultValue } = opt;
    if (defaultRef === undefined) {
        // prettier-ignore
        defaultValue !== null && defaultValue !== void 0 ? defaultValue : (defaultValue = getMarkPropOrConfig(channel, markDef, config, { vgChannel, ignoreVgConfig: true }));
        if (defaultValue !== undefined) {
            defaultRef = signalOrValueRef(defaultValue);
        }
    }
    const channelDef = encoding[channel];
    return wrapCondition(model, channelDef, vgChannel !== null && vgChannel !== void 0 ? vgChannel : channel, cDef => {
        return midPoint({
            channel,
            channelDef: cDef,
            markDef,
            config,
            scaleName: model.scaleName(channel),
            scale: model.getScaleComponent(channel),
            stack: null,
            defaultRef
        });
    });
}
//# sourceMappingURL=nonposition.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/color.js




function color(model, opt = { filled: undefined }) {
    var _a, _b, _c, _d;
    const { markDef, encoding, config } = model;
    const { type: markType } = markDef;
    // Allow filled to be overridden (for trail's "filled")
    const filled = (_a = opt.filled) !== null && _a !== void 0 ? _a : getMarkPropOrConfig('filled', markDef, config);
    const transparentIfNeeded = contains(['bar', 'point', 'circle', 'square', 'geoshape'], markType)
        ? 'transparent'
        : undefined;
    const defaultFill = (_c = (_b = getMarkPropOrConfig(filled === true ? 'color' : undefined, markDef, config, { vgChannel: 'fill' })) !== null && _b !== void 0 ? _b : 
    // need to add this manually as getMarkConfig normally drops config.mark[channel] if vgChannel is specified
    config.mark[filled === true && 'color']) !== null && _c !== void 0 ? _c : 
    // If there is no fill, always fill symbols, bar, geoshape
    // with transparent fills https://github.com/vega/vega-lite/issues/1316
    transparentIfNeeded;
    const defaultStroke = (_d = getMarkPropOrConfig(filled === false ? 'color' : undefined, markDef, config, { vgChannel: 'stroke' })) !== null && _d !== void 0 ? _d : 
    // need to add this manually as getMarkConfig normally drops config.mark[channel] if vgChannel is specified
    config.mark[filled === false && 'color'];
    const colorVgChannel = filled ? 'fill' : 'stroke';
    const fillStrokeMarkDefAndConfig = Object.assign(Object.assign({}, (defaultFill ? { fill: signalOrValueRef(defaultFill) } : {})), (defaultStroke ? { stroke: signalOrValueRef(defaultStroke) } : {}));
    if (markDef.color && (filled ? markDef.fill : markDef.stroke)) {
        warn(droppingColor('property', { fill: 'fill' in markDef, stroke: 'stroke' in markDef }));
    }
    return Object.assign(Object.assign(Object.assign(Object.assign({}, fillStrokeMarkDefAndConfig), nonPosition('color', model, {
        vgChannel: colorVgChannel,
        defaultValue: filled ? defaultFill : defaultStroke
    })), nonPosition('fill', model, {
        // if there is encoding.fill, include default fill just in case we have conditional-only fill encoding
        defaultValue: encoding.fill ? defaultFill : undefined
    })), nonPosition('stroke', model, {
        // if there is encoding.stroke, include default fill just in case we have conditional-only stroke encoding
        defaultValue: encoding.stroke ? defaultStroke : undefined
    }));
}
//# sourceMappingURL=color.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/zindex.js




function zindex(model) {
    const { encoding, mark } = model;
    const order = encoding.order;
    if (!isPathMark(mark) && isValueDef(order)) {
        return wrapCondition(model, order, 'zindex', cd => signalOrValueRef(cd.value));
    }
    return {};
}
//# sourceMappingURL=zindex.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/offset.js


function positionOffset({ channel: baseChannel, markDef, encoding = {}, model, bandPosition }) {
    const channel = `${baseChannel}Offset`; // Need to cast as the type can't be inferred automatically
    const defaultValue = markDef[channel];
    const channelDef = encoding[channel];
    if ((channel === 'xOffset' || channel === 'yOffset') && channelDef) {
        const ref = midPoint({
            channel: channel,
            channelDef,
            markDef,
            config: model === null || model === void 0 ? void 0 : model.config,
            scaleName: model.scaleName(channel),
            scale: model.getScaleComponent(channel),
            stack: null,
            defaultRef: signalOrValueRef(defaultValue),
            bandPosition
        });
        return { offsetType: 'encoding', offset: ref };
    }
    const markDefOffsetValue = markDef[channel];
    if (markDefOffsetValue) {
        return { offsetType: 'visual', offset: markDefOffsetValue };
    }
    return {};
}
//# sourceMappingURL=offset.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/position-point.js







/**
 * Return encode for point (non-band) position channels.
 */
function pointPosition(channel, model, { defaultPos, vgChannel }) {
    const { encoding, markDef, config, stack } = model;
    const channelDef = encoding[channel];
    const channel2Def = encoding[getSecondaryRangeChannel(channel)];
    const scaleName = model.scaleName(channel);
    const scale = model.getScaleComponent(channel);
    const { offset, offsetType } = positionOffset({
        channel,
        markDef,
        encoding,
        model,
        bandPosition: 0.5
    });
    // Get default position or position from mark def
    const defaultRef = pointPositionDefaultRef({
        model,
        defaultPos,
        channel,
        scaleName,
        scale
    });
    const valueRef = !channelDef && isXorY(channel) && (encoding.latitude || encoding.longitude)
        ? // use geopoint output if there are lat/long and there is no point position overriding lat/long.
            { field: model.getName(channel) }
        : positionRef({
            channel,
            channelDef,
            channel2Def,
            markDef,
            config,
            scaleName,
            scale,
            stack,
            offset,
            defaultRef,
            bandPosition: offsetType === 'encoding' ? 0 : undefined
        });
    return valueRef ? { [vgChannel || channel]: valueRef } : undefined;
}
// TODO: we need to find a way to refactor these so that scaleName is a part of scale
// but that's complicated. For now, this is a huge step moving forward.
/**
 * @return Vega ValueRef for normal x- or y-position without projection
 */
function positionRef(params) {
    const { channel, channelDef, scaleName, stack, offset, markDef } = params;
    // This isn't a part of midPoint because we use midPoint for non-position too
    if (isFieldOrDatumDef(channelDef) && stack && channel === stack.fieldChannel) {
        if (isFieldDef(channelDef)) {
            let bandPosition = channelDef.bandPosition;
            if (bandPosition === undefined && markDef.type === 'text' && (channel === 'radius' || channel === 'theta')) {
                // theta and radius of text mark should use bandPosition = 0.5 by default
                // so that labels for arc marks are centered automatically
                bandPosition = 0.5;
            }
            if (bandPosition !== undefined) {
                return interpolatedSignalRef({
                    scaleName,
                    fieldOrDatumDef: channelDef,
                    startSuffix: 'start',
                    bandPosition,
                    offset
                });
            }
        }
        // x or y use stack_end so that stacked line's point mark use stack_end too.
        return valueRefForFieldOrDatumDef(channelDef, scaleName, { suffix: 'end' }, { offset });
    }
    return midPointRefWithPositionInvalidTest(params);
}
function pointPositionDefaultRef({ model, defaultPos, channel, scaleName, scale }) {
    const { markDef, config } = model;
    return () => {
        const mainChannel = getMainRangeChannel(channel);
        const vgChannel = getVgPositionChannel(channel);
        const definedValueOrConfig = getMarkPropOrConfig(channel, markDef, config, { vgChannel });
        if (definedValueOrConfig !== undefined) {
            return widthHeightValueOrSignalRef(channel, definedValueOrConfig);
        }
        switch (defaultPos) {
            case 'zeroOrMin':
            case 'zeroOrMax':
                if (scaleName) {
                    const scaleType = scale.get('type');
                    if (contains([ScaleType.LOG, ScaleType.TIME, ScaleType.UTC], scaleType)) {
                        // Log scales cannot have zero.
                        // Zero in time scale is arbitrary, and does not affect ratio.
                        // (Time is an interval level of measurement, not ratio).
                        // See https://en.wikipedia.org/wiki/Level_of_measurement for more info.
                    }
                    else {
                        if (scale.domainDefinitelyIncludesZero()) {
                            return {
                                scale: scaleName,
                                value: 0
                            };
                        }
                    }
                }
                if (defaultPos === 'zeroOrMin') {
                    return mainChannel === 'y' ? { field: { group: 'height' } } : { value: 0 };
                }
                else {
                    // zeroOrMax
                    switch (mainChannel) {
                        case 'radius':
                            // max of radius is min(width, height) / 2
                            return {
                                signal: `min(${model.width.signal},${model.height.signal})/2`
                            };
                        case 'theta':
                            return { signal: '2*PI' };
                        case 'x':
                            return { field: { group: 'width' } };
                        case 'y':
                            return { value: 0 };
                    }
                }
                break;
            case 'mid': {
                const sizeRef = model[getSizeChannel(channel)];
                return Object.assign(Object.assign({}, sizeRef), { mult: 0.5 });
            }
        }
        // defaultPos === null
        return undefined;
    };
}
//# sourceMappingURL=position-point.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/position-align.js




const ALIGNED_X_CHANNEL = {
    left: 'x',
    center: 'xc',
    right: 'x2'
};
const BASELINED_Y_CHANNEL = {
    top: 'y',
    middle: 'yc',
    bottom: 'y2'
};
function vgAlignedPositionChannel(channel, markDef, config, defaultAlign = 'middle') {
    if (channel === 'radius' || channel === 'theta') {
        return getVgPositionChannel(channel);
    }
    const alignChannel = channel === 'x' ? 'align' : 'baseline';
    const align = getMarkPropOrConfig(alignChannel, markDef, config);
    let alignExcludingSignal;
    if (isSignalRef(align)) {
        warn(rangeMarkAlignmentCannotBeExpression(alignChannel));
        alignExcludingSignal = undefined;
    }
    else {
        alignExcludingSignal = align;
    }
    if (channel === 'x') {
        return ALIGNED_X_CHANNEL[alignExcludingSignal || (defaultAlign === 'top' ? 'left' : 'center')];
    }
    else {
        return BASELINED_Y_CHANNEL[alignExcludingSignal || defaultAlign];
    }
}
//# sourceMappingURL=position-align.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/position-range.js









/**
 * Utility for area/rule position, which can be either point or range.
 * (One of the axes should be point and the other should be range.)
 */
function pointOrRangePosition(channel, model, { defaultPos, defaultPos2, range }) {
    if (range) {
        return rangePosition(channel, model, { defaultPos, defaultPos2 });
    }
    return pointPosition(channel, model, { defaultPos });
}
function rangePosition(channel, model, { defaultPos, defaultPos2 }) {
    const { markDef, config } = model;
    const channel2 = getSecondaryRangeChannel(channel);
    const sizeChannel = getSizeChannel(channel);
    const pos2Mixins = pointPosition2OrSize(model, defaultPos2, channel2);
    const vgChannel = pos2Mixins[sizeChannel]
        ? // If there is width/height, we need to position the marks based on the alignment.
            vgAlignedPositionChannel(channel, markDef, config)
        : // Otherwise, make sure to apply to the right Vg Channel (for arc mark)
            getVgPositionChannel(channel);
    return Object.assign(Object.assign({}, pointPosition(channel, model, { defaultPos, vgChannel })), pos2Mixins);
}
/**
 * Return encode for x2, y2.
 * If channel is not specified, return one channel based on orientation.
 */
function pointPosition2OrSize(model, defaultPos, channel) {
    const { encoding, mark, markDef, stack, config } = model;
    const baseChannel = getMainRangeChannel(channel);
    const sizeChannel = getSizeChannel(channel);
    const vgChannel = getVgPositionChannel(channel);
    const channelDef = encoding[baseChannel];
    const scaleName = model.scaleName(baseChannel);
    const scale = model.getScaleComponent(baseChannel);
    const { offset } = channel in encoding || channel in markDef
        ? positionOffset({ channel, markDef, encoding, model })
        : positionOffset({ channel: baseChannel, markDef, encoding, model });
    if (!channelDef && (channel === 'x2' || channel === 'y2') && (encoding.latitude || encoding.longitude)) {
        const vgSizeChannel = getSizeChannel(channel);
        const size = model.markDef[vgSizeChannel];
        if (size != null) {
            return {
                [vgSizeChannel]: { value: size }
            };
        }
        else {
            return {
                [vgChannel]: { field: model.getName(channel) }
            };
        }
    }
    const valueRef = position2Ref({
        channel,
        channelDef,
        channel2Def: encoding[channel],
        markDef,
        config,
        scaleName,
        scale,
        stack,
        offset,
        defaultRef: undefined
    });
    if (valueRef !== undefined) {
        return { [vgChannel]: valueRef };
    }
    // TODO: check width/height encoding here once we add them
    // no x2/y2 encoding, then try to read x2/y2 or width/height based on precedence:
    // markDef > config.style > mark-specific config (config[mark]) > general mark config (config.mark)
    return (position2orSize(channel, markDef) ||
        position2orSize(channel, {
            [channel]: getMarkStyleConfig(channel, markDef, config.style),
            [sizeChannel]: getMarkStyleConfig(sizeChannel, markDef, config.style)
        }) ||
        position2orSize(channel, config[mark]) ||
        position2orSize(channel, config.mark) || {
        [vgChannel]: pointPositionDefaultRef({
            model,
            defaultPos,
            channel,
            scaleName,
            scale
        })()
    });
}
function position2Ref({ channel, channelDef, channel2Def, markDef, config, scaleName, scale, stack, offset, defaultRef }) {
    if (isFieldOrDatumDef(channelDef) &&
        stack &&
        // If fieldChannel is X and channel is X2 (or Y and Y2)
        channel.charAt(0) === stack.fieldChannel.charAt(0)) {
        return valueRefForFieldOrDatumDef(channelDef, scaleName, { suffix: 'start' }, { offset });
    }
    return midPointRefWithPositionInvalidTest({
        channel,
        channelDef: channel2Def,
        scaleName,
        scale,
        stack,
        markDef,
        config,
        offset,
        defaultRef
    });
}
function position2orSize(channel, markDef) {
    const sizeChannel = getSizeChannel(channel);
    const vgChannel = getVgPositionChannel(channel);
    if (markDef[vgChannel] !== undefined) {
        return { [vgChannel]: widthHeightValueOrSignalRef(channel, markDef[vgChannel]) };
    }
    else if (markDef[channel] !== undefined) {
        return { [vgChannel]: widthHeightValueOrSignalRef(channel, markDef[channel]) };
    }
    else if (markDef[sizeChannel]) {
        const dimensionSize = markDef[sizeChannel];
        if (isRelativeBandSize(dimensionSize)) {
            warn(relativeBandSizeNotSupported(sizeChannel));
        }
        else {
            return { [sizeChannel]: widthHeightValueOrSignalRef(channel, dimensionSize) };
        }
    }
    return undefined;
}
//# sourceMappingURL=position-range.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/position-rect.js
















function rectPosition(model, channel) {
    var _a, _b;
    const { config, encoding, markDef } = model;
    const mark = markDef.type;
    const channel2 = getSecondaryRangeChannel(channel);
    const sizeChannel = getSizeChannel(channel);
    const channelDef = encoding[channel];
    const channelDef2 = encoding[channel2];
    const scale = model.getScaleComponent(channel);
    const scaleType = scale ? scale.get('type') : undefined;
    const orient = markDef.orient;
    const hasSizeDef = (_b = (_a = encoding[sizeChannel]) !== null && _a !== void 0 ? _a : encoding.size) !== null && _b !== void 0 ? _b : getMarkPropOrConfig('size', markDef, config, { vgChannel: sizeChannel });
    const isBarBand = mark === 'bar' && (channel === 'x' ? orient === 'vertical' : orient === 'horizontal');
    // x, x2, and width -- we must specify two of these in all conditions
    if (isFieldDef(channelDef) &&
        (isBinning(channelDef.bin) || isBinned(channelDef.bin) || (channelDef.timeUnit && !channelDef2)) &&
        !(hasSizeDef && !isRelativeBandSize(hasSizeDef)) &&
        !hasDiscreteDomain(scaleType)) {
        return rectBinPosition({
            fieldDef: channelDef,
            fieldDef2: channelDef2,
            channel,
            model
        });
    }
    else if (((isFieldOrDatumDef(channelDef) && hasDiscreteDomain(scaleType)) || isBarBand) && !channelDef2) {
        return positionAndSize(channelDef, channel, model);
    }
    else {
        return rangePosition(channel, model, { defaultPos: 'zeroOrMax', defaultPos2: 'zeroOrMin' });
    }
}
function defaultSizeRef(sizeChannel, scaleName, scale, config, bandSize) {
    if (isRelativeBandSize(bandSize)) {
        if (scale) {
            const scaleType = scale.get('type');
            if (scaleType === 'band') {
                let bandWidth = `bandwidth('${scaleName}')`;
                if (bandSize.band !== 1) {
                    bandWidth = `${bandSize.band} * ${bandWidth}`;
                }
                // TODO(#8351): make 0.25 here configurable
                return { signal: `max(0.25, ${bandWidth})` };
            }
            else if (bandSize.band !== 1) {
                warn(cannotUseRelativeBandSizeWithNonBandScale(scaleType));
                bandSize = undefined;
            }
        }
        else {
            return {
                mult: bandSize.band,
                field: { group: sizeChannel }
            };
        }
    }
    else if (isSignalRef(bandSize)) {
        return bandSize;
    }
    else if (bandSize) {
        return { value: bandSize };
    }
    // no valid band size
    if (scale) {
        const scaleRange = scale.get('range');
        if (isVgRangeStep(scaleRange) && (0,vega_util_module/* isNumber */.Et)(scaleRange.step)) {
            return { value: scaleRange.step - 2 };
        }
    }
    const defaultStep = getViewConfigDiscreteStep(config.view, sizeChannel);
    return { value: defaultStep - 2 };
}
/**
 * Output position encoding and its size encoding for continuous, point, and band scales.
 */
function positionAndSize(fieldDef, channel, model) {
    const { markDef, encoding, config, stack } = model;
    const orient = markDef.orient;
    const scaleName = model.scaleName(channel);
    const scale = model.getScaleComponent(channel);
    const vgSizeChannel = getSizeChannel(channel);
    const channel2 = getSecondaryRangeChannel(channel);
    const offsetScaleChannel = getOffsetChannel(channel);
    const offsetScaleName = model.scaleName(offsetScaleChannel);
    // use "size" channel for bars, if there is orient and the channel matches the right orientation
    const useVlSizeChannel = (orient === 'horizontal' && channel === 'y') || (orient === 'vertical' && channel === 'x');
    // Use size encoding / mark property / config if it exists
    let sizeMixins;
    if (encoding.size || markDef.size) {
        if (useVlSizeChannel) {
            sizeMixins = nonPosition('size', model, {
                vgChannel: vgSizeChannel,
                defaultRef: signalOrValueRef(markDef.size)
            });
        }
        else {
            warn(cannotApplySizeToNonOrientedMark(markDef.type));
        }
    }
    const hasSizeFromMarkOrEncoding = !!sizeMixins;
    // Otherwise, apply default value
    const bandSize = getBandSize({ channel, fieldDef, markDef, config, scaleType: scale === null || scale === void 0 ? void 0 : scale.get('type'), useVlSizeChannel });
    sizeMixins = sizeMixins || {
        [vgSizeChannel]: defaultSizeRef(vgSizeChannel, offsetScaleName || scaleName, scale, config, bandSize)
    };
    /*
      Band scales with size value and all point scales, use xc/yc + band=0.5
  
      Otherwise (band scales that has size based on a band ref), use x/y with position band = (1 - size_band) / 2.
      In this case, size_band is the band specified in the x/y-encoding.
      By default band is 1, so `(1 - band) / 2` = 0.
      If band is 0.6, the the x/y position in such case should be `(1 - band) / 2` = 0.2
     */
    const defaultBandAlign = (scale === null || scale === void 0 ? void 0 : scale.get('type')) === 'band' && isRelativeBandSize(bandSize) && !hasSizeFromMarkOrEncoding ? 'top' : 'middle';
    const vgChannel = vgAlignedPositionChannel(channel, markDef, config, defaultBandAlign);
    const center = vgChannel === 'xc' || vgChannel === 'yc';
    const { offset, offsetType } = positionOffset({ channel, markDef, encoding, model, bandPosition: center ? 0.5 : 0 });
    const posRef = midPointRefWithPositionInvalidTest({
        channel,
        channelDef: fieldDef,
        markDef,
        config,
        scaleName,
        scale,
        stack,
        offset,
        defaultRef: pointPositionDefaultRef({ model, defaultPos: 'mid', channel, scaleName, scale }),
        bandPosition: center
            ? offsetType === 'encoding'
                ? 0
                : 0.5
            : isSignalRef(bandSize)
                ? { signal: `(1-${bandSize})/2` }
                : isRelativeBandSize(bandSize)
                    ? (1 - bandSize.band) / 2
                    : 0
    });
    if (vgSizeChannel) {
        return Object.assign({ [vgChannel]: posRef }, sizeMixins);
    }
    else {
        // otherwise, we must simulate size by setting position2 = position + size
        // (for theta/radius since Vega doesn't have thetaWidth/radiusWidth)
        const vgChannel2 = getVgPositionChannel(channel2);
        const sizeRef = sizeMixins[vgSizeChannel];
        const sizeOffset = offset ? Object.assign(Object.assign({}, sizeRef), { offset }) : sizeRef;
        return {
            [vgChannel]: posRef,
            // posRef might be an array that wraps position invalid test
            [vgChannel2]: (0,vega_util_module/* isArray */.cy)(posRef)
                ? [posRef[0], Object.assign(Object.assign({}, posRef[1]), { offset: sizeOffset })]
                : Object.assign(Object.assign({}, posRef), { offset: sizeOffset })
        };
    }
}
function getBinSpacing(channel, spacing, reverse, translate, offset) {
    if (isPolarPositionChannel(channel)) {
        return 0;
    }
    const spacingOffset = channel === 'x' || channel === 'y2' ? -spacing / 2 : spacing / 2;
    if (isSignalRef(reverse) || isSignalRef(offset) || isSignalRef(translate)) {
        const reverseExpr = signalOrStringValue(reverse);
        const offsetExpr = signalOrStringValue(offset);
        const translateExpr = signalOrStringValue(translate);
        const t = translateExpr ? `${translateExpr} + ` : '';
        const r = reverseExpr ? `(${reverseExpr} ? -1 : 1) * ` : '';
        const o = offsetExpr ? `(${offsetExpr} + ${spacingOffset})` : spacingOffset;
        return {
            signal: t + r + o
        };
    }
    else {
        offset = offset || 0;
        return translate + (reverse ? -offset - spacingOffset : +offset + spacingOffset);
    }
}
function rectBinPosition({ fieldDef, fieldDef2, channel, model }) {
    var _a, _b, _c;
    const { config, markDef, encoding } = model;
    const scale = model.getScaleComponent(channel);
    const scaleName = model.scaleName(channel);
    const scaleType = scale ? scale.get('type') : undefined;
    const reverse = scale.get('reverse');
    const bandSize = getBandSize({ channel, fieldDef, markDef, config, scaleType });
    const axis = (_a = model.component.axes[channel]) === null || _a === void 0 ? void 0 : _a[0];
    const axisTranslate = (_b = axis === null || axis === void 0 ? void 0 : axis.get('translate')) !== null && _b !== void 0 ? _b : 0.5; // vega default is 0.5
    const spacing = isXorY(channel) ? (_c = getMarkPropOrConfig('binSpacing', markDef, config)) !== null && _c !== void 0 ? _c : 0 : 0;
    const channel2 = getSecondaryRangeChannel(channel);
    const vgChannel = getVgPositionChannel(channel);
    const vgChannel2 = getVgPositionChannel(channel2);
    const { offset } = positionOffset({ channel, markDef, encoding, model, bandPosition: 0 });
    const bandPosition = isSignalRef(bandSize)
        ? { signal: `(1-${bandSize.signal})/2` }
        : isRelativeBandSize(bandSize)
            ? (1 - bandSize.band) / 2
            : 0.5;
    if (isBinning(fieldDef.bin) || fieldDef.timeUnit) {
        return {
            [vgChannel2]: rectBinRef({
                fieldDef,
                scaleName,
                bandPosition,
                offset: getBinSpacing(channel2, spacing, reverse, axisTranslate, offset)
            }),
            [vgChannel]: rectBinRef({
                fieldDef,
                scaleName,
                bandPosition: isSignalRef(bandPosition) ? { signal: `1-${bandPosition.signal}` } : 1 - bandPosition,
                offset: getBinSpacing(channel, spacing, reverse, axisTranslate, offset)
            })
        };
    }
    else if (isBinned(fieldDef.bin)) {
        const startRef = valueRefForFieldOrDatumDef(fieldDef, scaleName, {}, { offset: getBinSpacing(channel2, spacing, reverse, axisTranslate, offset) });
        if (isFieldDef(fieldDef2)) {
            return {
                [vgChannel2]: startRef,
                [vgChannel]: valueRefForFieldOrDatumDef(fieldDef2, scaleName, {}, { offset: getBinSpacing(channel, spacing, reverse, axisTranslate, offset) })
            };
        }
        else if (isBinParams(fieldDef.bin) && fieldDef.bin.step) {
            return {
                [vgChannel2]: startRef,
                [vgChannel]: {
                    signal: `scale("${scaleName}", ${vgField(fieldDef, { expr: 'datum' })} + ${fieldDef.bin.step})`,
                    offset: getBinSpacing(channel, spacing, reverse, axisTranslate, offset)
                }
            };
        }
    }
    warn(channelRequiredForBinned(channel2));
    return undefined;
}
/**
 * Value Ref for binned fields
 */
function rectBinRef({ fieldDef, scaleName, bandPosition, offset }) {
    return interpolatedSignalRef({
        scaleName,
        fieldOrDatumDef: fieldDef,
        bandPosition,
        offset
    });
}
//# sourceMappingURL=position-rect.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/base.js






















const ALWAYS_IGNORE = new Set(['aria', 'width', 'height']);
function baseEncodeEntry(model, ignore) {
    const { fill = undefined, stroke = undefined } = ignore.color === 'include' ? color(model) : {};
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, markDefProperties(model.markDef, ignore)), wrapAllFieldsInvalid(model, 'fill', fill)), wrapAllFieldsInvalid(model, 'stroke', stroke)), nonPosition('opacity', model)), nonPosition('fillOpacity', model)), nonPosition('strokeOpacity', model)), nonPosition('strokeWidth', model)), nonPosition('strokeDash', model)), zindex(model)), tooltip(model)), text_text(model, 'href')), aria(model));
}
// TODO: mark VgValueRef[] as readonly after https://github.com/vega/vega/pull/1987
function wrapAllFieldsInvalid(model, channel, valueRef) {
    const { config, mark, markDef } = model;
    const invalid = getMarkPropOrConfig('invalid', markDef, config);
    if (invalid === 'hide' && valueRef && !isPathMark(mark)) {
        // For non-path marks, we have to exclude invalid values (null and NaN) for scales with continuous domains.
        // For path marks, we will use "defined" property and skip these values instead.
        const test = allFieldsInvalidPredicate(model, { invalid: true, channels: SCALE_CHANNELS });
        if (test) {
            return {
                [channel]: [
                    // prepend the invalid case
                    // TODO: support custom value
                    { test, value: null },
                    ...(0,vega_util_module/* array */.YO)(valueRef)
                ]
            };
        }
    }
    return valueRef ? { [channel]: valueRef } : {};
}
function markDefProperties(mark, ignore) {
    return VG_MARK_CONFIGS.reduce((m, prop) => {
        if (!ALWAYS_IGNORE.has(prop) && mark[prop] !== undefined && ignore[prop] !== 'ignore') {
            m[prop] = signalOrValueRef(mark[prop]);
        }
        return m;
    }, {});
}
function allFieldsInvalidPredicate(model, { invalid = false, channels }) {
    const filterIndex = channels.reduce((aggregator, channel) => {
        const scaleComponent = model.getScaleComponent(channel);
        if (scaleComponent) {
            const scaleType = scaleComponent.get('type');
            const field = model.vgField(channel, { expr: 'datum' });
            // While discrete domain scales can handle invalid values, continuous scales can't.
            if (field && hasContinuousDomain(scaleType)) {
                aggregator[field] = true;
            }
        }
        return aggregator;
    }, {});
    const fields = keys(filterIndex);
    if (fields.length > 0) {
        const op = invalid ? '||' : '&&';
        return fields.map(field => fieldInvalidPredicate(field, invalid)).join(` ${op} `);
    }
    return undefined;
}
//# sourceMappingURL=base.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/defined.js





function defined(model) {
    const { config, markDef } = model;
    const invalid = getMarkPropOrConfig('invalid', markDef, config);
    if (invalid) {
        const signal = defined_allFieldsInvalidPredicate(model, { channels: POSITION_SCALE_CHANNELS });
        if (signal) {
            return { defined: { signal } };
        }
    }
    return {};
}
function defined_allFieldsInvalidPredicate(model, { invalid = false, channels }) {
    const filterIndex = channels.reduce((aggregator, channel) => {
        var _a;
        const scaleComponent = model.getScaleComponent(channel);
        if (scaleComponent) {
            const scaleType = scaleComponent.get('type');
            const field = model.vgField(channel, { expr: 'datum', binSuffix: ((_a = model.stack) === null || _a === void 0 ? void 0 : _a.impute) ? 'mid' : undefined });
            // While discrete domain scales can handle invalid values, continuous scales can't.
            if (field && hasContinuousDomain(scaleType)) {
                aggregator[field] = true;
            }
        }
        return aggregator;
    }, {});
    const fields = keys(filterIndex);
    if (fields.length > 0) {
        const op = invalid ? '||' : '&&';
        return fields.map(field => fieldInvalidPredicate(field, invalid)).join(` ${op} `);
    }
    return undefined;
}
function valueIfDefined(prop, value) {
    if (value !== undefined) {
        return { [prop]: signalOrValueRef(value) };
    }
    return undefined;
}
//# sourceMappingURL=defined.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/encode/index.js











//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/nearest.js



const VORONOI = 'voronoi';
const nearest = {
    defined: selCmpt => {
        return selCmpt.type === 'point' && selCmpt.nearest;
    },
    parse: (model, selCmpt) => {
        // Scope selection events to the voronoi mark to prevent capturing
        // events that occur on the group mark (https://github.com/vega/vega/issues/2112).
        if (selCmpt.events) {
            for (const s of selCmpt.events) {
                s.markname = model.getName(VORONOI);
            }
        }
    },
    marks: (model, selCmpt, marks) => {
        const { x, y } = selCmpt.project.hasChannel;
        const markType = model.mark;
        if (isPathMark(markType)) {
            warn(nearestNotSupportForContinuous(markType));
            return marks;
        }
        const cellDef = {
            name: model.getName(VORONOI),
            type: 'path',
            interactive: true,
            from: { data: model.getName('marks') },
            encode: {
                update: Object.assign({ fill: { value: 'transparent' }, strokeWidth: { value: 0.35 }, stroke: { value: 'transparent' }, isVoronoi: { value: true } }, tooltip(model, { reactiveGeom: true }))
            },
            transform: [
                {
                    type: 'voronoi',
                    x: { expr: x || !y ? 'datum.datum.x || 0' : '0' },
                    y: { expr: y || !x ? 'datum.datum.y || 0' : '0' },
                    size: [model.getSizeSignalRef('width'), model.getSizeSignalRef('height')]
                }
            ]
        };
        let index = 0;
        let exists = false;
        marks.forEach((mark, i) => {
            var _a;
            const name = (_a = mark.name) !== null && _a !== void 0 ? _a : '';
            if (name === model.component.mark[0].name) {
                index = i;
            }
            else if (name.indexOf(VORONOI) >= 0) {
                exists = true;
            }
        });
        if (!exists) {
            marks.splice(index + 1, 0, cellDef);
        }
        return marks;
    }
};
/* harmony default export */ const selection_nearest = (nearest);
//# sourceMappingURL=nearest.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/inputs.js







const inputBindings = {
    defined: selCmpt => {
        return (selCmpt.type === 'point' &&
            selCmpt.resolve === 'global' &&
            selCmpt.bind &&
            selCmpt.bind !== 'scales' &&
            !isLegendBinding(selCmpt.bind));
    },
    parse: (model, selCmpt, selDef) => disableDirectManipulation(selCmpt, selDef),
    topLevelSignals: (model, selCmpt, signals) => {
        const name = selCmpt.name;
        const proj = selCmpt.project;
        const bind = selCmpt.bind;
        const init = selCmpt.init && selCmpt.init[0]; // Can only exist on single selections (one initial value).
        const datum = selection_nearest.defined(selCmpt) ? '(item().isVoronoi ? datum.datum : datum)' : 'datum';
        proj.items.forEach((p, i) => {
            var _a, _b;
            const sgname = varName(`${name}_${p.field}`);
            const hasSignal = signals.filter(s => s.name === sgname);
            if (!hasSignal.length) {
                signals.unshift(Object.assign(Object.assign({ name: sgname }, (init ? { init: assembleInit(init[i]) } : { value: null })), { on: selCmpt.events
                        ? [
                            {
                                events: selCmpt.events,
                                update: `datum && item().mark.marktype !== 'group' ? ${datum}[${(0,vega_util_module/* stringValue */.r$)(p.field)}] : null`
                            }
                        ]
                        : [], bind: (_b = (_a = bind[p.field]) !== null && _a !== void 0 ? _a : bind[p.channel]) !== null && _b !== void 0 ? _b : bind }));
            }
        });
        return signals;
    },
    signals: (model, selCmpt, signals) => {
        const name = selCmpt.name;
        const proj = selCmpt.project;
        const signal = signals.filter(s => s.name === name + TUPLE)[0];
        const fields = name + TUPLE_FIELDS;
        const values = proj.items.map(p => varName(`${name}_${p.field}`));
        const valid = values.map(v => `${v} !== null`).join(' && ');
        if (values.length) {
            signal.update = `${valid} ? {fields: ${fields}, values: [${values.join(', ')}]} : null`;
        }
        delete signal.value;
        delete signal.on;
        return signals;
    }
};
/* harmony default export */ const inputs = (inputBindings);
//# sourceMappingURL=inputs.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/toggle.js

const TOGGLE = '_toggle';
const toggle = {
    defined: selCmpt => {
        return selCmpt.type === 'point' && !!selCmpt.toggle;
    },
    signals: (model, selCmpt, signals) => {
        return signals.concat({
            name: selCmpt.name + TOGGLE,
            value: false,
            on: [{ events: selCmpt.events, update: selCmpt.toggle }]
        });
    },
    modifyExpr: (model, selCmpt) => {
        const tpl = selCmpt.name + TUPLE;
        const signal = selCmpt.name + TOGGLE;
        return (`${signal} ? null : ${tpl}, ` +
            (selCmpt.resolve === 'global' ? `${signal} ? null : true, ` : `${signal} ? null : {unit: ${unitName(model)}}, `) +
            `${signal} ? ${tpl} : null`);
    }
};
/* harmony default export */ const selection_toggle = (toggle);
//# sourceMappingURL=toggle.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/clear.js






const clear = {
    defined: selCmpt => {
        return selCmpt.clear !== undefined && selCmpt.clear !== false;
    },
    parse: (model, selCmpt) => {
        if (selCmpt.clear) {
            selCmpt.clear = (0,vega_util_module/* isString */.Kg)(selCmpt.clear) ? (0,vega_event_selector_module/* parseSelector */.P)(selCmpt.clear, 'view') : selCmpt.clear;
        }
    },
    topLevelSignals: (model, selCmpt, signals) => {
        if (inputs.defined(selCmpt)) {
            for (const proj of selCmpt.project.items) {
                const idx = signals.findIndex(n => n.name === varName(`${selCmpt.name}_${proj.field}`));
                if (idx !== -1) {
                    signals[idx].on.push({ events: selCmpt.clear, update: 'null' });
                }
            }
        }
        return signals;
    },
    signals: (model, selCmpt, signals) => {
        function addClear(idx, update) {
            if (idx !== -1 && signals[idx].on) {
                signals[idx].on.push({ events: selCmpt.clear, update });
            }
        }
        // Be as minimalist as possible when adding clear triggers to minimize dataflow execution.
        if (selCmpt.type === 'interval') {
            for (const proj of selCmpt.project.items) {
                const vIdx = signals.findIndex(n => n.name === proj.signals.visual);
                addClear(vIdx, '[0, 0]');
                if (vIdx === -1) {
                    const dIdx = signals.findIndex(n => n.name === proj.signals.data);
                    addClear(dIdx, 'null');
                }
            }
        }
        else {
            let tIdx = signals.findIndex(n => n.name === selCmpt.name + TUPLE);
            addClear(tIdx, 'null');
            if (selection_toggle.defined(selCmpt)) {
                tIdx = signals.findIndex(n => n.name === selCmpt.name + TOGGLE);
                addClear(tIdx, 'false');
            }
        }
        return signals;
    }
};
/* harmony default export */ const selection_clear = (clear);
//# sourceMappingURL=clear.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/legends.js









const legendBindings = {
    defined: selCmpt => {
        const spec = selCmpt.resolve === 'global' && selCmpt.bind && isLegendBinding(selCmpt.bind);
        const projLen = selCmpt.project.items.length === 1 && selCmpt.project.items[0].field !== SELECTION_ID;
        if (spec && !projLen) {
            warn(LEGEND_BINDINGS_MUST_HAVE_PROJECTION);
        }
        return spec && projLen;
    },
    parse: (model, selCmpt, selDef) => {
        var _a;
        // Allow legend items to be toggleable by default even though direct manipulation is disabled.
        const selDef_ = duplicate(selDef);
        selDef_.select = (0,vega_util_module/* isString */.Kg)(selDef_.select)
            ? { type: selDef_.select, toggle: selCmpt.toggle }
            : Object.assign(Object.assign({}, selDef_.select), { toggle: selCmpt.toggle });
        disableDirectManipulation(selCmpt, selDef_);
        if ((0,vega_module_js_.isObject)(selDef.select) && (selDef.select.on || selDef.select.clear)) {
            const legendFilter = 'event.item && indexof(event.item.mark.role, "legend") < 0';
            for (const evt of selCmpt.events) {
                evt.filter = (0,vega_util_module/* array */.YO)((_a = evt.filter) !== null && _a !== void 0 ? _a : []);
                if (!evt.filter.includes(legendFilter)) {
                    evt.filter.push(legendFilter);
                }
            }
        }
        const evt = isLegendStreamBinding(selCmpt.bind) ? selCmpt.bind.legend : 'click';
        const stream = (0,vega_util_module/* isString */.Kg)(evt) ? (0,vega_event_selector_module/* parseSelector */.P)(evt, 'view') : (0,vega_util_module/* array */.YO)(evt);
        selCmpt.bind = { legend: { merge: stream } };
    },
    topLevelSignals: (model, selCmpt, signals) => {
        const selName = selCmpt.name;
        const stream = isLegendStreamBinding(selCmpt.bind) && selCmpt.bind.legend;
        const markName = (name) => (s) => {
            const ds = duplicate(s);
            ds.markname = name;
            return ds;
        };
        for (const proj of selCmpt.project.items) {
            if (!proj.hasLegend)
                continue;
            const prefix = `${varName(proj.field)}_legend`;
            const sgName = `${selName}_${prefix}`;
            const hasSignal = signals.filter(s => s.name === sgName);
            if (hasSignal.length === 0) {
                const events = stream.merge
                    .map(markName(`${prefix}_symbols`))
                    .concat(stream.merge.map(markName(`${prefix}_labels`)))
                    .concat(stream.merge.map(markName(`${prefix}_entries`)));
                signals.unshift(Object.assign(Object.assign({ name: sgName }, (!selCmpt.init ? { value: null } : {})), { on: [
                        // Legend entries do not store values, so we need to walk the scenegraph to the symbol datum.
                        { events, update: 'datum.value || item().items[0].items[0].datum.value', force: true },
                        { events: stream.merge, update: `!event.item || !datum ? null : ${sgName}`, force: true }
                    ] }));
            }
        }
        return signals;
    },
    signals: (model, selCmpt, signals) => {
        const name = selCmpt.name;
        const proj = selCmpt.project;
        const tuple = signals.find(s => s.name === name + TUPLE);
        const fields = name + TUPLE_FIELDS;
        const values = proj.items.filter(p => p.hasLegend).map(p => varName(`${name}_${varName(p.field)}_legend`));
        const valid = values.map(v => `${v} !== null`).join(' && ');
        const update = `${valid} ? {fields: ${fields}, values: [${values.join(', ')}]} : null`;
        if (selCmpt.events && values.length > 0) {
            tuple.on.push({
                events: values.map(signal => ({ signal })),
                update
            });
        }
        else if (values.length > 0) {
            tuple.update = update;
            delete tuple.value;
            delete tuple.on;
        }
        const toggle = signals.find(s => s.name === name + TOGGLE);
        const events = isLegendStreamBinding(selCmpt.bind) && selCmpt.bind.legend;
        if (toggle) {
            if (!selCmpt.events)
                toggle.on[0].events = events;
            else
                toggle.on.push(Object.assign(Object.assign({}, toggle.on[0]), { events }));
        }
        return signals;
    }
};
/* harmony default export */ const legends = (legendBindings);
function parseInteractiveLegend(model, channel, legendCmpt) {
    var _a, _b, _c, _d;
    const field = (_a = model.fieldDef(channel)) === null || _a === void 0 ? void 0 : _a.field;
    for (const selCmpt of vals((_b = model.component.selection) !== null && _b !== void 0 ? _b : {})) {
        const proj = (_c = selCmpt.project.hasField[field]) !== null && _c !== void 0 ? _c : selCmpt.project.hasChannel[channel];
        if (proj && legendBindings.defined(selCmpt)) {
            const legendSelections = (_d = legendCmpt.get('selections')) !== null && _d !== void 0 ? _d : [];
            legendSelections.push(selCmpt.name);
            legendCmpt.set('selections', legendSelections, false);
            proj.hasLegend = true;
        }
    }
}
//# sourceMappingURL=legends.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/translate.js




const ANCHOR = '_translate_anchor';
const DELTA = '_translate_delta';
const translate = {
    defined: selCmpt => {
        return selCmpt.type === 'interval' && selCmpt.translate;
    },
    signals: (model, selCmpt, signals) => {
        const name = selCmpt.name;
        const hasScales = scales.defined(selCmpt);
        const anchor = name + ANCHOR;
        const { x, y } = selCmpt.project.hasChannel;
        let events = (0,vega_event_selector_module/* parseSelector */.P)(selCmpt.translate, 'scope');
        if (!hasScales) {
            events = events.map(e => ((e.between[0].markname = name + BRUSH), e));
        }
        signals.push({
            name: anchor,
            value: {},
            on: [
                {
                    events: events.map(e => e.between[0]),
                    update: '{x: x(unit), y: y(unit)' +
                        (x !== undefined ? `, extent_x: ${hasScales ? scales_domain(model, X) : `slice(${x.signals.visual})`}` : '') +
                        (y !== undefined ? `, extent_y: ${hasScales ? scales_domain(model, Y) : `slice(${y.signals.visual})`}` : '') +
                        '}'
                }
            ]
        }, {
            name: name + DELTA,
            value: {},
            on: [
                {
                    events,
                    update: `{x: ${anchor}.x - x(unit), y: ${anchor}.y - y(unit)}`
                }
            ]
        });
        if (x !== undefined) {
            onDelta(model, selCmpt, x, 'width', signals);
        }
        if (y !== undefined) {
            onDelta(model, selCmpt, y, 'height', signals);
        }
        return signals;
    }
};
/* harmony default export */ const selection_translate = (translate);
function onDelta(model, selCmpt, proj, size, signals) {
    var _a, _b;
    const name = selCmpt.name;
    const anchor = name + ANCHOR;
    const delta = name + DELTA;
    const channel = proj.channel;
    const hasScales = scales.defined(selCmpt);
    const signal = signals.filter(s => s.name === proj.signals[hasScales ? 'data' : 'visual'])[0];
    const sizeSg = model.getSizeSignalRef(size).signal;
    const scaleCmpt = model.getScaleComponent(channel);
    const scaleType = scaleCmpt.get('type');
    const reversed = scaleCmpt.get('reverse'); // scale parsing sets this flag for fieldDef.sort
    const sign = !hasScales ? '' : channel === X ? (reversed ? '' : '-') : reversed ? '-' : '';
    const extent = `${anchor}.extent_${channel}`;
    const offset = `${sign}${delta}.${channel} / ${hasScales ? `${sizeSg}` : `span(${extent})`}`;
    const panFn = !hasScales
        ? 'panLinear'
        : scaleType === 'log'
            ? 'panLog'
            : scaleType === 'symlog'
                ? 'panSymlog'
                : scaleType === 'pow'
                    ? 'panPow'
                    : 'panLinear';
    const arg = !hasScales
        ? ''
        : scaleType === 'pow'
            ? `, ${(_a = scaleCmpt.get('exponent')) !== null && _a !== void 0 ? _a : 1}`
            : scaleType === 'symlog'
                ? `, ${(_b = scaleCmpt.get('constant')) !== null && _b !== void 0 ? _b : 1}`
                : '';
    const update = `${panFn}(${extent}, ${offset}${arg})`;
    signal.on.push({
        events: { signal: delta },
        update: hasScales ? update : `clampRange(${update}, 0, ${sizeSg})`
    });
}
//# sourceMappingURL=translate.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/zoom.js





const zoom_ANCHOR = '_zoom_anchor';
const zoom_DELTA = '_zoom_delta';
const zoom = {
    defined: selCmpt => {
        return selCmpt.type === 'interval' && selCmpt.zoom;
    },
    signals: (model, selCmpt, signals) => {
        const name = selCmpt.name;
        const hasScales = scales.defined(selCmpt);
        const delta = name + zoom_DELTA;
        const { x, y } = selCmpt.project.hasChannel;
        const sx = (0,vega_util_module/* stringValue */.r$)(model.scaleName(X));
        const sy = (0,vega_util_module/* stringValue */.r$)(model.scaleName(Y));
        let events = (0,vega_event_selector_module/* parseSelector */.P)(selCmpt.zoom, 'scope');
        if (!hasScales) {
            events = events.map(e => ((e.markname = name + BRUSH), e));
        }
        signals.push({
            name: name + zoom_ANCHOR,
            on: [
                {
                    events,
                    update: !hasScales
                        ? `{x: x(unit), y: y(unit)}`
                        : '{' +
                            [sx ? `x: invert(${sx}, x(unit))` : '', sy ? `y: invert(${sy}, y(unit))` : '']
                                .filter(expr => !!expr)
                                .join(', ') +
                            '}'
                }
            ]
        }, {
            name: delta,
            on: [
                {
                    events,
                    force: true,
                    update: 'pow(1.001, event.deltaY * pow(16, event.deltaMode))'
                }
            ]
        });
        if (x !== undefined) {
            zoom_onDelta(model, selCmpt, x, 'width', signals);
        }
        if (y !== undefined) {
            zoom_onDelta(model, selCmpt, y, 'height', signals);
        }
        return signals;
    }
};
/* harmony default export */ const selection_zoom = (zoom);
function zoom_onDelta(model, selCmpt, proj, size, signals) {
    var _a, _b;
    const name = selCmpt.name;
    const channel = proj.channel;
    const hasScales = scales.defined(selCmpt);
    const signal = signals.filter(s => s.name === proj.signals[hasScales ? 'data' : 'visual'])[0];
    const sizeSg = model.getSizeSignalRef(size).signal;
    const scaleCmpt = model.getScaleComponent(channel);
    const scaleType = scaleCmpt.get('type');
    const base = hasScales ? scales_domain(model, channel) : signal.name;
    const delta = name + zoom_DELTA;
    const anchor = `${name}${zoom_ANCHOR}.${channel}`;
    const zoomFn = !hasScales
        ? 'zoomLinear'
        : scaleType === 'log'
            ? 'zoomLog'
            : scaleType === 'symlog'
                ? 'zoomSymlog'
                : scaleType === 'pow'
                    ? 'zoomPow'
                    : 'zoomLinear';
    const arg = !hasScales
        ? ''
        : scaleType === 'pow'
            ? `, ${(_a = scaleCmpt.get('exponent')) !== null && _a !== void 0 ? _a : 1}`
            : scaleType === 'symlog'
                ? `, ${(_b = scaleCmpt.get('constant')) !== null && _b !== void 0 ? _b : 1}`
                : '';
    const update = `${zoomFn}(${base}, ${anchor}, ${delta}${arg})`;
    signal.on.push({
        events: { signal: delta },
        update: hasScales ? update : `clampRange(${update}, 0, ${sizeSg})`
    });
}
//# sourceMappingURL=zoom.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/index.js
















const STORE = '_store';
const TUPLE = '_tuple';
const MODIFY = '_modify';
const SELECTION_DOMAIN = '_selection_domain_';
const VL_SELECTION_RESOLVE = 'vlSelectionResolve';
// Order matters for parsing and assembly.
const selectionCompilers = [
    selection_point,
    selection_interval,
    selection_project,
    selection_toggle,
    // Bindings may disable direct manipulation.
    inputs,
    scales,
    legends,
    selection_clear,
    selection_translate,
    selection_zoom,
    selection_nearest
];
function getFacetModel(model) {
    let parent = model.parent;
    while (parent) {
        if (isFacetModel(parent))
            break;
        parent = parent.parent;
    }
    return parent;
}
function unitName(model, { escape } = { escape: true }) {
    let name = escape ? (0,vega_util_module/* stringValue */.r$)(model.name) : model.name;
    const facetModel = getFacetModel(model);
    if (facetModel) {
        const { facet } = facetModel;
        for (const channel of FACET_CHANNELS) {
            if (facet[channel]) {
                name += ` + '__facet_${channel}_' + (facet[${(0,vega_util_module/* stringValue */.r$)(facetModel.vgField(channel))}])`;
            }
        }
    }
    return name;
}
function requiresSelectionId(model) {
    var _a;
    return vals((_a = model.component.selection) !== null && _a !== void 0 ? _a : {}).reduce((identifier, selCmpt) => {
        return identifier || selCmpt.project.hasSelectionId;
    }, false);
}
// Binding a point selection to query widgets or legends disables default direct manipulation interaction.
// A user can choose to re-enable it by explicitly specifying triggering input events.
function disableDirectManipulation(selCmpt, selDef) {
    if ((0,vega_module_js_.isString)(selDef.select) || !selDef.select.on)
        delete selCmpt.events;
    if ((0,vega_module_js_.isString)(selDef.select) || !selDef.select.clear)
        delete selCmpt.clear;
    if ((0,vega_module_js_.isString)(selDef.select) || !selDef.select.toggle)
        delete selCmpt.toggle;
}
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/node_modules/vega-expression/build/vega-expression.module.js


const RawCode = 'RawCode';
const Literal = 'Literal';
const Property = 'Property';
const Identifier = 'Identifier';
const ArrayExpression = 'ArrayExpression';
const BinaryExpression = 'BinaryExpression';
const CallExpression = 'CallExpression';
const ConditionalExpression = 'ConditionalExpression';
const LogicalExpression = 'LogicalExpression';
const MemberExpression = 'MemberExpression';
const ObjectExpression = 'ObjectExpression';
const UnaryExpression = 'UnaryExpression';
function ASTNode(type) {
  this.type = type;
}
ASTNode.prototype.visit = function (visitor) {
  let c, i, n;
  if (visitor(this)) return 1;
  for (c = children(this), i = 0, n = c.length; i < n; ++i) {
    if (c[i].visit(visitor)) return 1;
  }
};
function children(node) {
  switch (node.type) {
    case ArrayExpression:
      return node.elements;
    case BinaryExpression:
    case LogicalExpression:
      return [node.left, node.right];
    case CallExpression:
      return [node.callee].concat(node.arguments);
    case ConditionalExpression:
      return [node.test, node.consequent, node.alternate];
    case MemberExpression:
      return [node.object, node.property];
    case ObjectExpression:
      return node.properties;
    case Property:
      return [node.key, node.value];
    case UnaryExpression:
      return [node.argument];
    case Identifier:
    case Literal:
    case RawCode:
    default:
      return [];
  }
}

/*
  The following expression parser is based on Esprima (http://esprima.org/).
  Original header comment and license for Esprima is included here:

  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
  Copyright (C) 2013 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
var TokenName, source, index, vega_expression_module_length, lookahead;
var TokenBooleanLiteral = 1,
  TokenEOF = 2,
  TokenIdentifier = 3,
  TokenKeyword = 4,
  TokenNullLiteral = 5,
  TokenNumericLiteral = 6,
  TokenPunctuator = 7,
  TokenStringLiteral = 8,
  TokenRegularExpression = 9;
TokenName = {};
TokenName[TokenBooleanLiteral] = 'Boolean';
TokenName[TokenEOF] = '<end>';
TokenName[TokenIdentifier] = 'Identifier';
TokenName[TokenKeyword] = 'Keyword';
TokenName[TokenNullLiteral] = 'Null';
TokenName[TokenNumericLiteral] = 'Numeric';
TokenName[TokenPunctuator] = 'Punctuator';
TokenName[TokenStringLiteral] = 'String';
TokenName[TokenRegularExpression] = 'RegularExpression';
var SyntaxArrayExpression = 'ArrayExpression',
  SyntaxBinaryExpression = 'BinaryExpression',
  SyntaxCallExpression = 'CallExpression',
  SyntaxConditionalExpression = 'ConditionalExpression',
  SyntaxIdentifier = 'Identifier',
  SyntaxLiteral = 'Literal',
  SyntaxLogicalExpression = 'LogicalExpression',
  SyntaxMemberExpression = 'MemberExpression',
  SyntaxObjectExpression = 'ObjectExpression',
  SyntaxProperty = 'Property',
  SyntaxUnaryExpression = 'UnaryExpression';

// Error messages should be identical to V8.
var MessageUnexpectedToken = 'Unexpected token %0',
  MessageUnexpectedNumber = 'Unexpected number',
  MessageUnexpectedString = 'Unexpected string',
  MessageUnexpectedIdentifier = 'Unexpected identifier',
  MessageUnexpectedReserved = 'Unexpected reserved word',
  MessageUnexpectedEOS = 'Unexpected end of input',
  MessageInvalidRegExp = 'Invalid regular expression',
  MessageUnterminatedRegExp = 'Invalid regular expression: missing /',
  MessageStrictOctalLiteral = 'Octal literals are not allowed in strict mode.',
  MessageStrictDuplicateProperty = 'Duplicate data property in object literal not allowed in strict mode';
var ILLEGAL = 'ILLEGAL',
  DISABLED = 'Disabled.';

// See also tools/generate-unicode-regex.py.
var RegexNonAsciiIdentifierStart = new RegExp('[\\xAA\\xB5\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u08A0-\\u08B2\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58\\u0C59\\u0C60\\u0C61\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D60\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19C1-\\u19C7\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5\\u1CF6\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2E2F\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA69D\\uA6A0-\\uA6EF\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA7AD\\uA7B0\\uA7B1\\uA7F7-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uA9E0-\\uA9E4\\uA9E6-\\uA9EF\\uA9FA-\\uA9FE\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA76\\uAA7A\\uAA7E-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB5F\\uAB64\\uAB65\\uABC0-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]'),
  // eslint-disable-next-line no-misleading-character-class
  RegexNonAsciiIdentifierPart = new RegExp('[\\xAA\\xB5\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0300-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u0483-\\u0487\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0610-\\u061A\\u0620-\\u0669\\u066E-\\u06D3\\u06D5-\\u06DC\\u06DF-\\u06E8\\u06EA-\\u06FC\\u06FF\\u0710-\\u074A\\u074D-\\u07B1\\u07C0-\\u07F5\\u07FA\\u0800-\\u082D\\u0840-\\u085B\\u08A0-\\u08B2\\u08E4-\\u0963\\u0966-\\u096F\\u0971-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CE\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A01-\\u0A03\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A75\\u0A81-\\u0A83\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AD0\\u0AE0-\\u0AE3\\u0AE6-\\u0AEF\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3C-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B63\\u0B66-\\u0B6F\\u0B71\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD0\\u0BD7\\u0BE6-\\u0BEF\\u0C00-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C58\\u0C59\\u0C60-\\u0C63\\u0C66-\\u0C6F\\u0C81-\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBC-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0-\\u0CE3\\u0CE6-\\u0CEF\\u0CF1\\u0CF2\\u0D01-\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4E\\u0D57\\u0D60-\\u0D63\\u0D66-\\u0D6F\\u0D7A-\\u0D7F\\u0D82\\u0D83\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DE6-\\u0DEF\\u0DF2\\u0DF3\\u0E01-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0EDC-\\u0EDF\\u0F00\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F6C\\u0F71-\\u0F84\\u0F86-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u1000-\\u1049\\u1050-\\u109D\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u135D-\\u135F\\u1380-\\u138F\\u13A0-\\u13F4\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1714\\u1720-\\u1734\\u1740-\\u1753\\u1760-\\u176C\\u176E-\\u1770\\u1772\\u1773\\u1780-\\u17D3\\u17D7\\u17DC\\u17DD\\u17E0-\\u17E9\\u180B-\\u180D\\u1810-\\u1819\\u1820-\\u1877\\u1880-\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1920-\\u192B\\u1930-\\u193B\\u1946-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19B0-\\u19C9\\u19D0-\\u19D9\\u1A00-\\u1A1B\\u1A20-\\u1A5E\\u1A60-\\u1A7C\\u1A7F-\\u1A89\\u1A90-\\u1A99\\u1AA7\\u1AB0-\\u1ABD\\u1B00-\\u1B4B\\u1B50-\\u1B59\\u1B6B-\\u1B73\\u1B80-\\u1BF3\\u1C00-\\u1C37\\u1C40-\\u1C49\\u1C4D-\\u1C7D\\u1CD0-\\u1CD2\\u1CD4-\\u1CF6\\u1CF8\\u1CF9\\u1D00-\\u1DF5\\u1DFC-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u200C\\u200D\\u203F\\u2040\\u2054\\u2071\\u207F\\u2090-\\u209C\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2119-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u212D\\u212F-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D7F-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2DE0-\\u2DFF\\u2E2F\\u3005-\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u3099\\u309A\\u309D-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FCC\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA62B\\uA640-\\uA66F\\uA674-\\uA67D\\uA67F-\\uA69D\\uA69F-\\uA6F1\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA78E\\uA790-\\uA7AD\\uA7B0\\uA7B1\\uA7F7-\\uA827\\uA840-\\uA873\\uA880-\\uA8C4\\uA8D0-\\uA8D9\\uA8E0-\\uA8F7\\uA8FB\\uA900-\\uA92D\\uA930-\\uA953\\uA960-\\uA97C\\uA980-\\uA9C0\\uA9CF-\\uA9D9\\uA9E0-\\uA9FE\\uAA00-\\uAA36\\uAA40-\\uAA4D\\uAA50-\\uAA59\\uAA60-\\uAA76\\uAA7A-\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEF\\uAAF2-\\uAAF6\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB5F\\uAB64\\uAB65\\uABC0-\\uABEA\\uABEC\\uABED\\uABF0-\\uABF9\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE00-\\uFE0F\\uFE20-\\uFE2D\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF3F\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]');

// Ensure the condition is true, otherwise throw an error.
// This is only to have a better contract semantic, i.e. another safety net
// to catch a logic error. The condition shall be fulfilled in normal case.
// Do NOT use this to enforce a certain condition on any user input.

function assert(condition, message) {
  /* istanbul ignore next */
  if (!condition) {
    throw new Error('ASSERT: ' + message);
  }
}
function isDecimalDigit(ch) {
  return ch >= 0x30 && ch <= 0x39; // 0..9
}

function isHexDigit(ch) {
  return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
}
function isOctalDigit(ch) {
  return '01234567'.indexOf(ch) >= 0;
}

// 7.2 White Space

function isWhiteSpace(ch) {
  return ch === 0x20 || ch === 0x09 || ch === 0x0B || ch === 0x0C || ch === 0xA0 || ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0;
}

// 7.3 Line Terminators

function isLineTerminator(ch) {
  return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
}

// 7.6 Identifier Names and Identifiers

function isIdentifierStart(ch) {
  return ch === 0x24 || ch === 0x5F ||
  // $ (dollar) and _ (underscore)
  ch >= 0x41 && ch <= 0x5A ||
  // A..Z
  ch >= 0x61 && ch <= 0x7A ||
  // a..z
  ch === 0x5C ||
  // \ (backslash)
  ch >= 0x80 && RegexNonAsciiIdentifierStart.test(String.fromCharCode(ch));
}
function isIdentifierPart(ch) {
  return ch === 0x24 || ch === 0x5F ||
  // $ (dollar) and _ (underscore)
  ch >= 0x41 && ch <= 0x5A ||
  // A..Z
  ch >= 0x61 && ch <= 0x7A ||
  // a..z
  ch >= 0x30 && ch <= 0x39 ||
  // 0..9
  ch === 0x5C ||
  // \ (backslash)
  ch >= 0x80 && RegexNonAsciiIdentifierPart.test(String.fromCharCode(ch));
}

// 7.6.1.1 Keywords

const keywords = {
  'if': 1,
  'in': 1,
  'do': 1,
  'var': 1,
  'for': 1,
  'new': 1,
  'try': 1,
  'let': 1,
  'this': 1,
  'else': 1,
  'case': 1,
  'void': 1,
  'with': 1,
  'enum': 1,
  'while': 1,
  'break': 1,
  'catch': 1,
  'throw': 1,
  'const': 1,
  'yield': 1,
  'class': 1,
  'super': 1,
  'return': 1,
  'typeof': 1,
  'delete': 1,
  'switch': 1,
  'export': 1,
  'import': 1,
  'public': 1,
  'static': 1,
  'default': 1,
  'finally': 1,
  'extends': 1,
  'package': 1,
  'private': 1,
  'function': 1,
  'continue': 1,
  'debugger': 1,
  'interface': 1,
  'protected': 1,
  'instanceof': 1,
  'implements': 1
};
function skipComment() {
  while (index < vega_expression_module_length) {
    const ch = source.charCodeAt(index);
    if (isWhiteSpace(ch) || isLineTerminator(ch)) {
      ++index;
    } else {
      break;
    }
  }
}
function scanHexEscape(prefix) {
  var i,
    len,
    ch,
    code = 0;
  len = prefix === 'u' ? 4 : 2;
  for (i = 0; i < len; ++i) {
    if (index < vega_expression_module_length && isHexDigit(source[index])) {
      ch = source[index++];
      code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }
  return String.fromCharCode(code);
}
function scanUnicodeCodePointEscape() {
  var ch, code, cu1, cu2;
  ch = source[index];
  code = 0;

  // At least, one hex digit is required.
  if (ch === '}') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  while (index < vega_expression_module_length) {
    ch = source[index++];
    if (!isHexDigit(ch)) {
      break;
    }
    code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
  }
  if (code > 0x10FFFF || ch !== '}') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  // UTF-16 Encoding
  if (code <= 0xFFFF) {
    return String.fromCharCode(code);
  }
  cu1 = (code - 0x10000 >> 10) + 0xD800;
  cu2 = (code - 0x10000 & 1023) + 0xDC00;
  return String.fromCharCode(cu1, cu2);
}
function getEscapedIdentifier() {
  var ch, id;
  ch = source.charCodeAt(index++);
  id = String.fromCharCode(ch);

  // '\u' (U+005C, U+0075) denotes an escaped character.
  if (ch === 0x5C) {
    if (source.charCodeAt(index) !== 0x75) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    ++index;
    ch = scanHexEscape('u');
    if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    id = ch;
  }
  while (index < vega_expression_module_length) {
    ch = source.charCodeAt(index);
    if (!isIdentifierPart(ch)) {
      break;
    }
    ++index;
    id += String.fromCharCode(ch);

    // '\u' (U+005C, U+0075) denotes an escaped character.
    if (ch === 0x5C) {
      id = id.substr(0, id.length - 1);
      if (source.charCodeAt(index) !== 0x75) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
      ++index;
      ch = scanHexEscape('u');
      if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
      id += ch;
    }
  }
  return id;
}
function getIdentifier() {
  var start, ch;
  start = index++;
  while (index < vega_expression_module_length) {
    ch = source.charCodeAt(index);
    if (ch === 0x5C) {
      // Blackslash (U+005C) marks Unicode escape sequence.
      index = start;
      return getEscapedIdentifier();
    }
    if (isIdentifierPart(ch)) {
      ++index;
    } else {
      break;
    }
  }
  return source.slice(start, index);
}
function scanIdentifier() {
  var start, id, type;
  start = index;

  // Backslash (U+005C) starts an escaped character.
  id = source.charCodeAt(index) === 0x5C ? getEscapedIdentifier() : getIdentifier();

  // There is no keyword or literal with only one character.
  // Thus, it must be an identifier.
  if (id.length === 1) {
    type = TokenIdentifier;
  } else if (keywords.hasOwnProperty(id)) {
    // eslint-disable-line no-prototype-builtins
    type = TokenKeyword;
  } else if (id === 'null') {
    type = TokenNullLiteral;
  } else if (id === 'true' || id === 'false') {
    type = TokenBooleanLiteral;
  } else {
    type = TokenIdentifier;
  }
  return {
    type: type,
    value: id,
    start: start,
    end: index
  };
}

// 7.7 Punctuators

function scanPunctuator() {
  var start = index,
    code = source.charCodeAt(index),
    code2,
    ch1 = source[index],
    ch2,
    ch3,
    ch4;
  switch (code) {
    // Check for most common single-character punctuators.
    case 0x2E: // . dot
    case 0x28: // ( open bracket
    case 0x29: // ) close bracket
    case 0x3B: // ; semicolon
    case 0x2C: // , comma
    case 0x7B: // { open curly brace
    case 0x7D: // } close curly brace
    case 0x5B: // [
    case 0x5D: // ]
    case 0x3A: // :
    case 0x3F: // ?
    case 0x7E:
      // ~
      ++index;
      return {
        type: TokenPunctuator,
        value: String.fromCharCode(code),
        start: start,
        end: index
      };
    default:
      code2 = source.charCodeAt(index + 1);

      // '=' (U+003D) marks an assignment or comparison operator.
      if (code2 === 0x3D) {
        switch (code) {
          case 0x2B: // +
          case 0x2D: // -
          case 0x2F: // /
          case 0x3C: // <
          case 0x3E: // >
          case 0x5E: // ^
          case 0x7C: // |
          case 0x25: // %
          case 0x26: // &
          case 0x2A:
            // *
            index += 2;
            return {
              type: TokenPunctuator,
              value: String.fromCharCode(code) + String.fromCharCode(code2),
              start: start,
              end: index
            };
          case 0x21: // !
          case 0x3D:
            // =
            index += 2;

            // !== and ===
            if (source.charCodeAt(index) === 0x3D) {
              ++index;
            }
            return {
              type: TokenPunctuator,
              value: source.slice(start, index),
              start: start,
              end: index
            };
        }
      }
  }

  // 4-character punctuator: >>>=

  ch4 = source.substr(index, 4);
  if (ch4 === '>>>=') {
    index += 4;
    return {
      type: TokenPunctuator,
      value: ch4,
      start: start,
      end: index
    };
  }

  // 3-character punctuators: === !== >>> <<= >>=

  ch3 = ch4.substr(0, 3);
  if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
    index += 3;
    return {
      type: TokenPunctuator,
      value: ch3,
      start: start,
      end: index
    };
  }

  // Other 2-character punctuators: ++ -- << >> && ||
  ch2 = ch3.substr(0, 2);
  if (ch1 === ch2[1] && '+-<>&|'.indexOf(ch1) >= 0 || ch2 === '=>') {
    index += 2;
    return {
      type: TokenPunctuator,
      value: ch2,
      start: start,
      end: index
    };
  }
  if (ch2 === '//') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  // 1-character punctuators: < > = ! + - * % & | ^ /

  if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
    ++index;
    return {
      type: TokenPunctuator,
      value: ch1,
      start: start,
      end: index
    };
  }
  throwError({}, MessageUnexpectedToken, ILLEGAL);
}

// 7.8.3 Numeric Literals

function scanHexLiteral(start) {
  let number = '';
  while (index < vega_expression_module_length) {
    if (!isHexDigit(source[index])) {
      break;
    }
    number += source[index++];
  }
  if (number.length === 0) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  if (isIdentifierStart(source.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  return {
    type: TokenNumericLiteral,
    value: parseInt('0x' + number, 16),
    start: start,
    end: index
  };
}
function scanOctalLiteral(start) {
  let number = '0' + source[index++];
  while (index < vega_expression_module_length) {
    if (!isOctalDigit(source[index])) {
      break;
    }
    number += source[index++];
  }
  if (isIdentifierStart(source.charCodeAt(index)) || isDecimalDigit(source.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  return {
    type: TokenNumericLiteral,
    value: parseInt(number, 8),
    octal: true,
    start: start,
    end: index
  };
}
function scanNumericLiteral() {
  var number, start, ch;
  ch = source[index];
  assert(isDecimalDigit(ch.charCodeAt(0)) || ch === '.', 'Numeric literal must start with a decimal digit or a decimal point');
  start = index;
  number = '';
  if (ch !== '.') {
    number = source[index++];
    ch = source[index];

    // Hex number starts with '0x'.
    // Octal number starts with '0'.
    if (number === '0') {
      if (ch === 'x' || ch === 'X') {
        ++index;
        return scanHexLiteral(start);
      }
      if (isOctalDigit(ch)) {
        return scanOctalLiteral(start);
      }

      // decimal number starts with '0' such as '09' is illegal.
      if (ch && isDecimalDigit(ch.charCodeAt(0))) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
    }
    while (isDecimalDigit(source.charCodeAt(index))) {
      number += source[index++];
    }
    ch = source[index];
  }
  if (ch === '.') {
    number += source[index++];
    while (isDecimalDigit(source.charCodeAt(index))) {
      number += source[index++];
    }
    ch = source[index];
  }
  if (ch === 'e' || ch === 'E') {
    number += source[index++];
    ch = source[index];
    if (ch === '+' || ch === '-') {
      number += source[index++];
    }
    if (isDecimalDigit(source.charCodeAt(index))) {
      while (isDecimalDigit(source.charCodeAt(index))) {
        number += source[index++];
      }
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }
  if (isIdentifierStart(source.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  return {
    type: TokenNumericLiteral,
    value: parseFloat(number),
    start: start,
    end: index
  };
}

// 7.8.4 String Literals

function scanStringLiteral() {
  var str = '',
    quote,
    start,
    ch,
    code,
    octal = false;
  quote = source[index];
  assert(quote === '\'' || quote === '"', 'String literal must starts with a quote');
  start = index;
  ++index;
  while (index < vega_expression_module_length) {
    ch = source[index++];
    if (ch === quote) {
      quote = '';
      break;
    } else if (ch === '\\') {
      ch = source[index++];
      if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
        switch (ch) {
          case 'u':
          case 'x':
            if (source[index] === '{') {
              ++index;
              str += scanUnicodeCodePointEscape();
            } else {
              str += scanHexEscape(ch);
            }
            break;
          case 'n':
            str += '\n';
            break;
          case 'r':
            str += '\r';
            break;
          case 't':
            str += '\t';
            break;
          case 'b':
            str += '\b';
            break;
          case 'f':
            str += '\f';
            break;
          case 'v':
            str += '\x0B';
            break;
          default:
            if (isOctalDigit(ch)) {
              code = '01234567'.indexOf(ch);

              // \0 is not octal escape sequence
              if (code !== 0) {
                octal = true;
              }
              if (index < vega_expression_module_length && isOctalDigit(source[index])) {
                octal = true;
                code = code * 8 + '01234567'.indexOf(source[index++]);

                // 3 digits are only allowed when string starts
                // with 0, 1, 2, 3
                if ('0123'.indexOf(ch) >= 0 && index < vega_expression_module_length && isOctalDigit(source[index])) {
                  code = code * 8 + '01234567'.indexOf(source[index++]);
                }
              }
              str += String.fromCharCode(code);
            } else {
              str += ch;
            }
            break;
        }
      } else {
        if (ch === '\r' && source[index] === '\n') {
          ++index;
        }
      }
    } else if (isLineTerminator(ch.charCodeAt(0))) {
      break;
    } else {
      str += ch;
    }
  }
  if (quote !== '') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }
  return {
    type: TokenStringLiteral,
    value: str,
    octal: octal,
    start: start,
    end: index
  };
}
function testRegExp(pattern, flags) {
  let tmp = pattern;
  if (flags.indexOf('u') >= 0) {
    // Replace each astral symbol and every Unicode code point
    // escape sequence with a single ASCII symbol to avoid throwing on
    // regular expressions that are only valid in combination with the
    // `/u` flag.
    // Note: replacing with the ASCII symbol `x` might cause false
    // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
    // perfectly valid pattern that is equivalent to `[a-b]`, but it
    // would be replaced by `[x-b]` which throws an error.
    tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, ($0, $1) => {
      if (parseInt($1, 16) <= 0x10FFFF) {
        return 'x';
      }
      throwError({}, MessageInvalidRegExp);
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
  }

  // First, detect invalid regular expressions.
  try {
    new RegExp(tmp);
  } catch (e) {
    throwError({}, MessageInvalidRegExp);
  }

  // Return a regular expression object for this pattern-flag pair, or
  // `null` in case the current environment doesn't support the flags it
  // uses.
  try {
    return new RegExp(pattern, flags);
  } catch (exception) {
    return null;
  }
}
function scanRegExpBody() {
  var ch, str, classMarker, terminated, body;
  ch = source[index];
  assert(ch === '/', 'Regular expression literal must start with a slash');
  str = source[index++];
  classMarker = false;
  terminated = false;
  while (index < vega_expression_module_length) {
    ch = source[index++];
    str += ch;
    if (ch === '\\') {
      ch = source[index++];
      // ECMA-262 7.8.5
      if (isLineTerminator(ch.charCodeAt(0))) {
        throwError({}, MessageUnterminatedRegExp);
      }
      str += ch;
    } else if (isLineTerminator(ch.charCodeAt(0))) {
      throwError({}, MessageUnterminatedRegExp);
    } else if (classMarker) {
      if (ch === ']') {
        classMarker = false;
      }
    } else {
      if (ch === '/') {
        terminated = true;
        break;
      } else if (ch === '[') {
        classMarker = true;
      }
    }
  }
  if (!terminated) {
    throwError({}, MessageUnterminatedRegExp);
  }

  // Exclude leading and trailing slash.
  body = str.substr(1, str.length - 2);
  return {
    value: body,
    literal: str
  };
}
function scanRegExpFlags() {
  var ch, str, flags;
  str = '';
  flags = '';
  while (index < vega_expression_module_length) {
    ch = source[index];
    if (!isIdentifierPart(ch.charCodeAt(0))) {
      break;
    }
    ++index;
    if (ch === '\\' && index < vega_expression_module_length) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    } else {
      flags += ch;
      str += ch;
    }
  }
  if (flags.search(/[^gimuy]/g) >= 0) {
    throwError({}, MessageInvalidRegExp, flags);
  }
  return {
    value: flags,
    literal: str
  };
}
function scanRegExp() {
  var start, body, flags, value;
  lookahead = null;
  skipComment();
  start = index;
  body = scanRegExpBody();
  flags = scanRegExpFlags();
  value = testRegExp(body.value, flags.value);
  return {
    literal: body.literal + flags.literal,
    value: value,
    regex: {
      pattern: body.value,
      flags: flags.value
    },
    start: start,
    end: index
  };
}
function isIdentifierName(token) {
  return token.type === TokenIdentifier || token.type === TokenKeyword || token.type === TokenBooleanLiteral || token.type === TokenNullLiteral;
}
function advance() {
  skipComment();
  if (index >= vega_expression_module_length) {
    return {
      type: TokenEOF,
      start: index,
      end: index
    };
  }
  const ch = source.charCodeAt(index);
  if (isIdentifierStart(ch)) {
    return scanIdentifier();
  }

  // Very common: ( and ) and ;
  if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
    return scanPunctuator();
  }

  // String literal starts with single quote (U+0027) or double quote (U+0022).
  if (ch === 0x27 || ch === 0x22) {
    return scanStringLiteral();
  }

  // Dot (.) U+002E can also start a floating-point number, hence the need
  // to check the next character.
  if (ch === 0x2E) {
    if (isDecimalDigit(source.charCodeAt(index + 1))) {
      return scanNumericLiteral();
    }
    return scanPunctuator();
  }
  if (isDecimalDigit(ch)) {
    return scanNumericLiteral();
  }
  return scanPunctuator();
}
function lex() {
  const token = lookahead;
  index = token.end;
  lookahead = advance();
  index = token.end;
  return token;
}
function peek() {
  const pos = index;
  lookahead = advance();
  index = pos;
}
function finishArrayExpression(elements) {
  const node = new ASTNode(SyntaxArrayExpression);
  node.elements = elements;
  return node;
}
function finishBinaryExpression(operator, left, right) {
  const node = new ASTNode(operator === '||' || operator === '&&' ? SyntaxLogicalExpression : SyntaxBinaryExpression);
  node.operator = operator;
  node.left = left;
  node.right = right;
  return node;
}
function finishCallExpression(callee, args) {
  const node = new ASTNode(SyntaxCallExpression);
  node.callee = callee;
  node.arguments = args;
  return node;
}
function finishConditionalExpression(test, consequent, alternate) {
  const node = new ASTNode(SyntaxConditionalExpression);
  node.test = test;
  node.consequent = consequent;
  node.alternate = alternate;
  return node;
}
function finishIdentifier(name) {
  const node = new ASTNode(SyntaxIdentifier);
  node.name = name;
  return node;
}
function finishLiteral(token) {
  const node = new ASTNode(SyntaxLiteral);
  node.value = token.value;
  node.raw = source.slice(token.start, token.end);
  if (token.regex) {
    if (node.raw === '//') {
      node.raw = '/(?:)/';
    }
    node.regex = token.regex;
  }
  return node;
}
function finishMemberExpression(accessor, object, property) {
  const node = new ASTNode(SyntaxMemberExpression);
  node.computed = accessor === '[';
  node.object = object;
  node.property = property;
  if (!node.computed) property.member = true;
  return node;
}
function finishObjectExpression(properties) {
  const node = new ASTNode(SyntaxObjectExpression);
  node.properties = properties;
  return node;
}
function finishProperty(kind, key, value) {
  const node = new ASTNode(SyntaxProperty);
  node.key = key;
  node.value = value;
  node.kind = kind;
  return node;
}
function finishUnaryExpression(operator, argument) {
  const node = new ASTNode(SyntaxUnaryExpression);
  node.operator = operator;
  node.argument = argument;
  node.prefix = true;
  return node;
}

// Throw an exception

function throwError(token, messageFormat) {
  var error,
    args = Array.prototype.slice.call(arguments, 2),
    msg = messageFormat.replace(/%(\d)/g, (whole, index) => {
      assert(index < args.length, 'Message reference must be in range');
      return args[index];
    });
  error = new Error(msg);
  error.index = index;
  error.description = msg;
  throw error;
}

// Throw an exception because of the token.

function throwUnexpected(token) {
  if (token.type === TokenEOF) {
    throwError(token, MessageUnexpectedEOS);
  }
  if (token.type === TokenNumericLiteral) {
    throwError(token, MessageUnexpectedNumber);
  }
  if (token.type === TokenStringLiteral) {
    throwError(token, MessageUnexpectedString);
  }
  if (token.type === TokenIdentifier) {
    throwError(token, MessageUnexpectedIdentifier);
  }
  if (token.type === TokenKeyword) {
    throwError(token, MessageUnexpectedReserved);
  }

  // BooleanLiteral, NullLiteral, or Punctuator.
  throwError(token, MessageUnexpectedToken, token.value);
}

// Expect the next token to match the specified punctuator.
// If not, an exception will be thrown.

function expect(value) {
  const token = lex();
  if (token.type !== TokenPunctuator || token.value !== value) {
    throwUnexpected(token);
  }
}

// Return true if the next token matches the specified punctuator.

function match(value) {
  return lookahead.type === TokenPunctuator && lookahead.value === value;
}

// Return true if the next token matches the specified keyword

function matchKeyword(keyword) {
  return lookahead.type === TokenKeyword && lookahead.value === keyword;
}

// 11.1.4 Array Initialiser

function parseArrayInitialiser() {
  const elements = [];
  index = lookahead.start;
  expect('[');
  while (!match(']')) {
    if (match(',')) {
      lex();
      elements.push(null);
    } else {
      elements.push(parseConditionalExpression());
      if (!match(']')) {
        expect(',');
      }
    }
  }
  lex();
  return finishArrayExpression(elements);
}

// 11.1.5 Object Initialiser

function parseObjectPropertyKey() {
  index = lookahead.start;
  const token = lex();

  // Note: This function is called only from parseObjectProperty(), where
  // EOF and Punctuator tokens are already filtered out.

  if (token.type === TokenStringLiteral || token.type === TokenNumericLiteral) {
    if (token.octal) {
      throwError(token, MessageStrictOctalLiteral);
    }
    return finishLiteral(token);
  }
  return finishIdentifier(token.value);
}
function parseObjectProperty() {
  var token, key, id, value;
  index = lookahead.start;
  token = lookahead;
  if (token.type === TokenIdentifier) {
    id = parseObjectPropertyKey();
    expect(':');
    value = parseConditionalExpression();
    return finishProperty('init', id, value);
  }
  if (token.type === TokenEOF || token.type === TokenPunctuator) {
    throwUnexpected(token);
  } else {
    key = parseObjectPropertyKey();
    expect(':');
    value = parseConditionalExpression();
    return finishProperty('init', key, value);
  }
}
function parseObjectInitialiser() {
  var properties = [],
    property,
    name,
    key,
    map = {},
    toString = String;
  index = lookahead.start;
  expect('{');
  while (!match('}')) {
    property = parseObjectProperty();
    if (property.key.type === SyntaxIdentifier) {
      name = property.key.name;
    } else {
      name = toString(property.key.value);
    }
    key = '$' + name;
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      throwError({}, MessageStrictDuplicateProperty);
    } else {
      map[key] = true;
    }
    properties.push(property);
    if (!match('}')) {
      expect(',');
    }
  }
  expect('}');
  return finishObjectExpression(properties);
}

// 11.1.6 The Grouping Operator

function parseGroupExpression() {
  expect('(');
  const expr = parseExpression();
  expect(')');
  return expr;
}

// 11.1 Primary Expressions

const legalKeywords = {
  'if': 1
};
function parsePrimaryExpression() {
  var type, token, expr;
  if (match('(')) {
    return parseGroupExpression();
  }
  if (match('[')) {
    return parseArrayInitialiser();
  }
  if (match('{')) {
    return parseObjectInitialiser();
  }
  type = lookahead.type;
  index = lookahead.start;
  if (type === TokenIdentifier || legalKeywords[lookahead.value]) {
    expr = finishIdentifier(lex().value);
  } else if (type === TokenStringLiteral || type === TokenNumericLiteral) {
    if (lookahead.octal) {
      throwError(lookahead, MessageStrictOctalLiteral);
    }
    expr = finishLiteral(lex());
  } else if (type === TokenKeyword) {
    throw new Error(DISABLED);
  } else if (type === TokenBooleanLiteral) {
    token = lex();
    token.value = token.value === 'true';
    expr = finishLiteral(token);
  } else if (type === TokenNullLiteral) {
    token = lex();
    token.value = null;
    expr = finishLiteral(token);
  } else if (match('/') || match('/=')) {
    expr = finishLiteral(scanRegExp());
    peek();
  } else {
    throwUnexpected(lex());
  }
  return expr;
}

// 11.2 Left-Hand-Side Expressions

function parseArguments() {
  const args = [];
  expect('(');
  if (!match(')')) {
    while (index < vega_expression_module_length) {
      args.push(parseConditionalExpression());
      if (match(')')) {
        break;
      }
      expect(',');
    }
  }
  expect(')');
  return args;
}
function parseNonComputedProperty() {
  index = lookahead.start;
  const token = lex();
  if (!isIdentifierName(token)) {
    throwUnexpected(token);
  }
  return finishIdentifier(token.value);
}
function parseNonComputedMember() {
  expect('.');
  return parseNonComputedProperty();
}
function parseComputedMember() {
  expect('[');
  const expr = parseExpression();
  expect(']');
  return expr;
}
function parseLeftHandSideExpressionAllowCall() {
  var expr, args, property;
  expr = parsePrimaryExpression();
  for (;;) {
    if (match('.')) {
      property = parseNonComputedMember();
      expr = finishMemberExpression('.', expr, property);
    } else if (match('(')) {
      args = parseArguments();
      expr = finishCallExpression(expr, args);
    } else if (match('[')) {
      property = parseComputedMember();
      expr = finishMemberExpression('[', expr, property);
    } else {
      break;
    }
  }
  return expr;
}

// 11.3 Postfix Expressions

function parsePostfixExpression() {
  const expr = parseLeftHandSideExpressionAllowCall();
  if (lookahead.type === TokenPunctuator) {
    if (match('++') || match('--')) {
      throw new Error(DISABLED);
    }
  }
  return expr;
}

// 11.4 Unary Operators

function parseUnaryExpression() {
  var token, expr;
  if (lookahead.type !== TokenPunctuator && lookahead.type !== TokenKeyword) {
    expr = parsePostfixExpression();
  } else if (match('++') || match('--')) {
    throw new Error(DISABLED);
  } else if (match('+') || match('-') || match('~') || match('!')) {
    token = lex();
    expr = parseUnaryExpression();
    expr = finishUnaryExpression(token.value, expr);
  } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
    throw new Error(DISABLED);
  } else {
    expr = parsePostfixExpression();
  }
  return expr;
}
function binaryPrecedence(token) {
  let prec = 0;
  if (token.type !== TokenPunctuator && token.type !== TokenKeyword) {
    return 0;
  }
  switch (token.value) {
    case '||':
      prec = 1;
      break;
    case '&&':
      prec = 2;
      break;
    case '|':
      prec = 3;
      break;
    case '^':
      prec = 4;
      break;
    case '&':
      prec = 5;
      break;
    case '==':
    case '!=':
    case '===':
    case '!==':
      prec = 6;
      break;
    case '<':
    case '>':
    case '<=':
    case '>=':
    case 'instanceof':
    case 'in':
      prec = 7;
      break;
    case '<<':
    case '>>':
    case '>>>':
      prec = 8;
      break;
    case '+':
    case '-':
      prec = 9;
      break;
    case '*':
    case '/':
    case '%':
      prec = 11;
      break;
  }
  return prec;
}

// 11.5 Multiplicative Operators
// 11.6 Additive Operators
// 11.7 Bitwise Shift Operators
// 11.8 Relational Operators
// 11.9 Equality Operators
// 11.10 Binary Bitwise Operators
// 11.11 Binary Logical Operators

function parseBinaryExpression() {
  var marker, markers, expr, token, prec, stack, right, operator, left, i;
  marker = lookahead;
  left = parseUnaryExpression();
  token = lookahead;
  prec = binaryPrecedence(token);
  if (prec === 0) {
    return left;
  }
  token.prec = prec;
  lex();
  markers = [marker, lookahead];
  right = parseUnaryExpression();
  stack = [left, token, right];
  while ((prec = binaryPrecedence(lookahead)) > 0) {
    // Reduce: make a binary expression from the three topmost entries.
    while (stack.length > 2 && prec <= stack[stack.length - 2].prec) {
      right = stack.pop();
      operator = stack.pop().value;
      left = stack.pop();
      markers.pop();
      expr = finishBinaryExpression(operator, left, right);
      stack.push(expr);
    }

    // Shift.
    token = lex();
    token.prec = prec;
    stack.push(token);
    markers.push(lookahead);
    expr = parseUnaryExpression();
    stack.push(expr);
  }

  // Final reduce to clean-up the stack.
  i = stack.length - 1;
  expr = stack[i];
  markers.pop();
  while (i > 1) {
    markers.pop();
    expr = finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
    i -= 2;
  }
  return expr;
}

// 11.12 Conditional Operator

function parseConditionalExpression() {
  var expr, consequent, alternate;
  expr = parseBinaryExpression();
  if (match('?')) {
    lex();
    consequent = parseConditionalExpression();
    expect(':');
    alternate = parseConditionalExpression();
    expr = finishConditionalExpression(expr, consequent, alternate);
  }
  return expr;
}

// 11.14 Comma Operator

function parseExpression() {
  const expr = parseConditionalExpression();
  if (match(',')) {
    throw new Error(DISABLED); // no sequence expressions
  }

  return expr;
}
function parser (code) {
  source = code;
  index = 0;
  vega_expression_module_length = source.length;
  lookahead = null;
  peek();
  const expr = parseExpression();
  if (lookahead.type !== TokenEOF) {
    throw new Error('Unexpect token after expression.');
  }
  return expr;
}

var Constants = {
  NaN: 'NaN',
  E: 'Math.E',
  LN2: 'Math.LN2',
  LN10: 'Math.LN10',
  LOG2E: 'Math.LOG2E',
  LOG10E: 'Math.LOG10E',
  PI: 'Math.PI',
  SQRT1_2: 'Math.SQRT1_2',
  SQRT2: 'Math.SQRT2',
  MIN_VALUE: 'Number.MIN_VALUE',
  MAX_VALUE: 'Number.MAX_VALUE'
};

function Functions (codegen) {
  function fncall(name, args, cast, type) {
    let obj = codegen(args[0]);
    if (cast) {
      obj = cast + '(' + obj + ')';
      if (cast.lastIndexOf('new ', 0) === 0) obj = '(' + obj + ')';
    }
    return obj + '.' + name + (type < 0 ? '' : type === 0 ? '()' : '(' + args.slice(1).map(codegen).join(',') + ')');
  }
  function fn(name, cast, type) {
    return args => fncall(name, args, cast, type);
  }
  const DATE = 'new Date',
    STRING = 'String',
    REGEXP = 'RegExp';
  return {
    // MATH functions
    isNaN: 'Number.isNaN',
    isFinite: 'Number.isFinite',
    abs: 'Math.abs',
    acos: 'Math.acos',
    asin: 'Math.asin',
    atan: 'Math.atan',
    atan2: 'Math.atan2',
    ceil: 'Math.ceil',
    cos: 'Math.cos',
    exp: 'Math.exp',
    floor: 'Math.floor',
    log: 'Math.log',
    max: 'Math.max',
    min: 'Math.min',
    pow: 'Math.pow',
    random: 'Math.random',
    round: 'Math.round',
    sin: 'Math.sin',
    sqrt: 'Math.sqrt',
    tan: 'Math.tan',
    clamp: function (args) {
      if (args.length < 3) error('Missing arguments to clamp function.');
      if (args.length > 3) error('Too many arguments to clamp function.');
      const a = args.map(codegen);
      return 'Math.max(' + a[1] + ', Math.min(' + a[2] + ',' + a[0] + '))';
    },
    // DATE functions
    now: 'Date.now',
    utc: 'Date.UTC',
    datetime: DATE,
    date: fn('getDate', DATE, 0),
    day: fn('getDay', DATE, 0),
    year: fn('getFullYear', DATE, 0),
    month: fn('getMonth', DATE, 0),
    hours: fn('getHours', DATE, 0),
    minutes: fn('getMinutes', DATE, 0),
    seconds: fn('getSeconds', DATE, 0),
    milliseconds: fn('getMilliseconds', DATE, 0),
    time: fn('getTime', DATE, 0),
    timezoneoffset: fn('getTimezoneOffset', DATE, 0),
    utcdate: fn('getUTCDate', DATE, 0),
    utcday: fn('getUTCDay', DATE, 0),
    utcyear: fn('getUTCFullYear', DATE, 0),
    utcmonth: fn('getUTCMonth', DATE, 0),
    utchours: fn('getUTCHours', DATE, 0),
    utcminutes: fn('getUTCMinutes', DATE, 0),
    utcseconds: fn('getUTCSeconds', DATE, 0),
    utcmilliseconds: fn('getUTCMilliseconds', DATE, 0),
    // sequence functions
    length: fn('length', null, -1),
    // STRING functions
    parseFloat: 'parseFloat',
    parseInt: 'parseInt',
    upper: fn('toUpperCase', STRING, 0),
    lower: fn('toLowerCase', STRING, 0),
    substring: fn('substring', STRING),
    split: fn('split', STRING),
    trim: fn('trim', STRING, 0),
    // REGEXP functions
    regexp: REGEXP,
    test: fn('test', REGEXP),
    // Control Flow functions
    if: function (args) {
      if (args.length < 3) error('Missing arguments to if function.');
      if (args.length > 3) error('Too many arguments to if function.');
      const a = args.map(codegen);
      return '(' + a[0] + '?' + a[1] + ':' + a[2] + ')';
    }
  };
}

function stripQuotes(s) {
  const n = s && s.length - 1;
  return n && (s[0] === '"' && s[n] === '"' || s[0] === '\'' && s[n] === '\'') ? s.slice(1, -1) : s;
}
function codegen (opt) {
  opt = opt || {};
  const allowed = opt.allowed ? toSet(opt.allowed) : {},
    forbidden = opt.forbidden ? toSet(opt.forbidden) : {},
    constants = opt.constants || Constants,
    functions = (opt.functions || Functions)(visit),
    globalvar = opt.globalvar,
    fieldvar = opt.fieldvar,
    outputGlobal = isFunction(globalvar) ? globalvar : id => `${globalvar}["${id}"]`;
  let globals = {},
    fields = {},
    memberDepth = 0;
  function visit(ast) {
    if (isString(ast)) return ast;
    const generator = Generators[ast.type];
    if (generator == null) error('Unsupported type: ' + ast.type);
    return generator(ast);
  }
  const Generators = {
    Literal: n => n.raw,
    Identifier: n => {
      const id = n.name;
      if (memberDepth > 0) {
        return id;
      } else if (hasOwnProperty(forbidden, id)) {
        return error('Illegal identifier: ' + id);
      } else if (hasOwnProperty(constants, id)) {
        return constants[id];
      } else if (hasOwnProperty(allowed, id)) {
        return id;
      } else {
        globals[id] = 1;
        return outputGlobal(id);
      }
    },
    MemberExpression: n => {
      const d = !n.computed,
        o = visit(n.object);
      if (d) memberDepth += 1;
      const p = visit(n.property);
      if (o === fieldvar) {
        // strip quotes to sanitize field name (#1653)
        fields[stripQuotes(p)] = 1;
      }
      if (d) memberDepth -= 1;
      return o + (d ? '.' + p : '[' + p + ']');
    },
    CallExpression: n => {
      if (n.callee.type !== 'Identifier') {
        error('Illegal callee type: ' + n.callee.type);
      }
      const callee = n.callee.name,
        args = n.arguments,
        fn = hasOwnProperty(functions, callee) && functions[callee];
      if (!fn) error('Unrecognized function: ' + callee);
      return isFunction(fn) ? fn(args) : fn + '(' + args.map(visit).join(',') + ')';
    },
    ArrayExpression: n => '[' + n.elements.map(visit).join(',') + ']',
    BinaryExpression: n => '(' + visit(n.left) + ' ' + n.operator + ' ' + visit(n.right) + ')',
    UnaryExpression: n => '(' + n.operator + visit(n.argument) + ')',
    ConditionalExpression: n => '(' + visit(n.test) + '?' + visit(n.consequent) + ':' + visit(n.alternate) + ')',
    LogicalExpression: n => '(' + visit(n.left) + n.operator + visit(n.right) + ')',
    ObjectExpression: n => '{' + n.properties.map(visit).join(',') + '}',
    Property: n => {
      memberDepth += 1;
      const k = visit(n.key);
      memberDepth -= 1;
      return k + ':' + visit(n.value);
    }
  };
  function codegen(ast) {
    const result = {
      code: visit(ast),
      globals: Object.keys(globals),
      fields: Object.keys(fields)
    };
    globals = {};
    fields = {};
    return result;
  }
  codegen.functions = functions;
  codegen.constants = constants;
  return codegen;
}



;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/expressions.js

function getName(node) {
    const name = [];
    if (node.type === 'Identifier') {
        return [node.name];
    }
    if (node.type === 'Literal') {
        return [node.value];
    }
    if (node.type === 'MemberExpression') {
        name.push(...getName(node.object));
        name.push(...getName(node.property));
    }
    return name;
}
function startsWithDatum(node) {
    if (node.object.type === 'MemberExpression') {
        return startsWithDatum(node.object);
    }
    return node.object.name === 'datum';
}
function getDependentFields(expression) {
    const ast = parser(expression);
    const dependents = new Set();
    // visit is missing in types https://github.com/vega/vega/issues/3298
    ast.visit((node) => {
        if (node.type === 'MemberExpression' && startsWithDatum(node)) {
            dependents.add(getName(node).slice(1).join('.'));
        }
    });
    return dependents;
}
//# sourceMappingURL=expressions.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/filter.js




class FilterNode extends DataFlowNode {
    clone() {
        return new FilterNode(null, this.model, duplicate(this.filter));
    }
    constructor(parent, model, filter) {
        super(parent);
        this.model = model;
        this.filter = filter;
        // TODO: refactor this to not take a node and
        // then add a static function makeFromOperand and make the constructor take only an expression
        this.expr = expression(this.model, this.filter, this);
        this._dependentFields = getDependentFields(this.expr);
    }
    dependentFields() {
        return this._dependentFields;
    }
    producedFields() {
        return new Set(); // filter does not produce any new fields
    }
    assemble() {
        return {
            type: 'filter',
            expr: this.expr
        };
    }
    hash() {
        return `Filter ${this.expr}`;
    }
}
//# sourceMappingURL=filter.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/selection/parse.js








function parseUnitSelection(model, selDefs) {
    var _a;
    const selCmpts = {};
    const selectionConfig = model.config.selection;
    if (!selDefs || !selDefs.length)
        return selCmpts;
    for (const def of selDefs) {
        const name = varName(def.name);
        const selDef = def.select;
        const type = (0,vega_util_module/* isString */.Kg)(selDef) ? selDef : selDef.type;
        const defaults = (0,vega_util_module/* isObject */.Gv)(selDef) ? duplicate(selDef) : { type };
        // Set default values from config if a property hasn't been specified,
        // or if it is true. E.g., "translate": true should use the default
        // event handlers for translate. However, true may be a valid value for
        // a property (e.g., "nearest": true).
        const cfg = selectionConfig[type];
        for (const key in cfg) {
            // Project transform applies its defaults.
            if (key === 'fields' || key === 'encodings') {
                continue;
            }
            if (key === 'mark') {
                defaults[key] = Object.assign(Object.assign({}, cfg[key]), defaults[key]);
            }
            if (defaults[key] === undefined || defaults[key] === true) {
                defaults[key] = (_a = cfg[key]) !== null && _a !== void 0 ? _a : defaults[key];
            }
        }
        const selCmpt = (selCmpts[name] = Object.assign(Object.assign({}, defaults), { name,
            type, init: def.value, bind: def.bind, events: (0,vega_util_module/* isString */.Kg)(defaults.on) ? (0,vega_event_selector_module/* parseSelector */.P)(defaults.on, 'scope') : (0,vega_util_module/* array */.YO)(duplicate(defaults.on)) }));
        for (const c of selectionCompilers) {
            if (c.defined(selCmpt) && c.parse) {
                c.parse(model, selCmpt, def);
            }
        }
    }
    return selCmpts;
}
function parseSelectionPredicate(model, pred, dfnode, datum = 'datum') {
    const name = (0,vega_util_module/* isString */.Kg)(pred) ? pred : pred.param;
    const vname = varName(name);
    const store = (0,vega_util_module/* stringValue */.r$)(vname + STORE);
    let selCmpt;
    try {
        selCmpt = model.getSelectionComponent(vname, name);
    }
    catch (e) {
        // If a selection isn't found, treat as a variable parameter and coerce to boolean.
        return `!!${vname}`;
    }
    if (selCmpt.project.timeUnit) {
        const child = dfnode !== null && dfnode !== void 0 ? dfnode : model.component.data.raw;
        const tunode = selCmpt.project.timeUnit.clone();
        if (child.parent) {
            tunode.insertAsParentOf(child);
        }
        else {
            child.parent = tunode;
        }
    }
    const fn = selCmpt.project.hasSelectionId ? 'vlSelectionIdTest(' : 'vlSelectionTest(';
    const resolve = selCmpt.resolve === 'global' ? ')' : `, ${(0,vega_util_module/* stringValue */.r$)(selCmpt.resolve)})`;
    const test = `${fn}${store}, ${datum}${resolve}`;
    const length = `length(data(${store}))`;
    return pred.empty === false ? `${length} && ${test}` : `!${length} || ${test}`;
}
function parseSelectionExtent(model, name, extent) {
    const vname = varName(name);
    const encoding = extent['encoding'];
    let field = extent['field'];
    let selCmpt;
    try {
        selCmpt = model.getSelectionComponent(vname, name);
    }
    catch (e) {
        // If a selection isn't found, treat it as a variable parameter.
        return vname;
    }
    if (!encoding && !field) {
        field = selCmpt.project.items[0].field;
        if (selCmpt.project.items.length > 1) {
            warn('A "field" or "encoding" must be specified when using a selection as a scale domain. ' +
                `Using "field": ${(0,vega_util_module/* stringValue */.r$)(field)}.`);
        }
    }
    else if (encoding && !field) {
        const encodings = selCmpt.project.items.filter(p => p.channel === encoding);
        if (!encodings.length || encodings.length > 1) {
            field = selCmpt.project.items[0].field;
            warn((!encodings.length ? 'No ' : 'Multiple ') +
                `matching ${(0,vega_util_module/* stringValue */.r$)(encoding)} encoding found for selection ${(0,vega_util_module/* stringValue */.r$)(extent.param)}. ` +
                `Using "field": ${(0,vega_util_module/* stringValue */.r$)(field)}.`);
        }
        else {
            field = encodings[0].field;
        }
    }
    return `${selCmpt.name}[${(0,vega_util_module/* stringValue */.r$)(replacePathInField(field))}]`;
}
function materializeSelections(model, main) {
    var _a;
    for (const [selection, selCmpt] of entries((_a = model.component.selection) !== null && _a !== void 0 ? _a : {})) {
        const lookupName = model.getName(`lookup_${selection}`);
        model.component.data.outputNodes[lookupName] = selCmpt.materialized = new OutputNode(new FilterNode(main, model, { param: selection }), lookupName, DataSourceType.Lookup, model.component.data.outputNodeRefCounts);
    }
}
//# sourceMappingURL=parse.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/predicate.js




/**
 * Converts a predicate into an expression.
 */
// model is only used for selection filters.
function expression(model, filterOp, node) {
    return logicalExpr(filterOp, (predicate) => {
        if ((0,vega_util_module/* isString */.Kg)(predicate)) {
            return predicate;
        }
        else if (isSelectionPredicate(predicate)) {
            return parseSelectionPredicate(model, predicate, node);
        }
        else {
            // Filter Object
            return fieldFilterExpression(predicate);
        }
    });
}
//# sourceMappingURL=predicate.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/axis/assemble.js
var axis_assemble_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};









function assembleTitle(title, config) {
    if (!title) {
        return undefined;
    }
    if ((0,vega_util_module/* isArray */.cy)(title) && !isText(title)) {
        return title.map(fieldDef => defaultTitle(fieldDef, config)).join(', ');
    }
    return title;
}
function setAxisEncode(axis, part, vgProp, vgRef) {
    var _a, _b, _c;
    var _d, _e;
    (_a = axis.encode) !== null && _a !== void 0 ? _a : (axis.encode = {});
    (_b = (_d = axis.encode)[part]) !== null && _b !== void 0 ? _b : (_d[part] = {});
    (_c = (_e = axis.encode[part]).update) !== null && _c !== void 0 ? _c : (_e.update = {});
    // TODO: remove as any after https://github.com/prisma/nexus-prisma/issues/291
    axis.encode[part].update[vgProp] = vgRef;
}
function assembleAxis(axisCmpt, kind, config, opt = { header: false }) {
    var _a, _b;
    const _c = axisCmpt.combine(), { disable, orient, scale, labelExpr, title, zindex } = _c, axis = axis_assemble_rest(_c, ["disable", "orient", "scale", "labelExpr", "title", "zindex"]);
    if (disable) {
        return undefined;
    }
    for (const prop in axis) {
        const propType = AXIS_PROPERTY_TYPE[prop];
        const propValue = axis[prop];
        if (propType && propType !== kind && propType !== 'both') {
            // Remove properties that are not valid for this kind of axis
            delete axis[prop];
        }
        else if (isConditionalAxisValue(propValue)) {
            // deal with conditional axis value
            const { condition } = propValue, valueOrSignalRef = axis_assemble_rest(propValue, ["condition"]);
            const conditions = (0,vega_util_module/* array */.YO)(condition);
            const propIndex = CONDITIONAL_AXIS_PROP_INDEX[prop];
            if (propIndex) {
                const { vgProp, part } = propIndex;
                // If there is a corresponding Vega property for the channel,
                // use Vega's custom axis encoding and delete the original axis property to avoid conflicts
                const vgRef = [
                    ...conditions.map(c => {
                        const { test } = c, valueOrSignalCRef = axis_assemble_rest(c, ["test"]);
                        return Object.assign({ test: expression(null, test) }, valueOrSignalCRef);
                    }),
                    valueOrSignalRef
                ];
                setAxisEncode(axis, part, vgProp, vgRef);
                delete axis[prop];
            }
            else if (propIndex === null) {
                // If propIndex is null, this means we support conditional axis property by converting the condition to signal instead.
                const signalRef = {
                    signal: conditions
                        .map(c => {
                        const { test } = c, valueOrSignalCRef = axis_assemble_rest(c, ["test"]);
                        return `${expression(null, test)} ? ${exprFromValueRefOrSignalRef(valueOrSignalCRef)} : `;
                    })
                        .join('') + exprFromValueRefOrSignalRef(valueOrSignalRef)
                };
                axis[prop] = signalRef;
            }
        }
        else if (isSignalRef(propValue)) {
            const propIndex = CONDITIONAL_AXIS_PROP_INDEX[prop];
            if (propIndex) {
                const { vgProp, part } = propIndex;
                setAxisEncode(axis, part, vgProp, propValue);
                delete axis[prop];
            } // else do nothing since the property already supports signal
        }
        // Do not pass labelAlign/Baseline = null to Vega since it won't pass the schema
        // Note that we need to use null so the default labelAlign is preserved.
        if (contains(['labelAlign', 'labelBaseline'], prop) && axis[prop] === null) {
            delete axis[prop];
        }
    }
    if (kind === 'grid') {
        if (!axis.grid) {
            return undefined;
        }
        // Remove unnecessary encode block
        if (axis.encode) {
            // Only need to keep encode block for grid
            const { grid } = axis.encode;
            axis.encode = Object.assign({}, (grid ? { grid } : {}));
            if (isEmpty(axis.encode)) {
                delete axis.encode;
            }
        }
        return Object.assign(Object.assign({ scale,
            orient }, axis), { domain: false, labels: false, aria: false, 
            // Always set min/maxExtent to 0 to ensure that `config.axis*.minExtent` and `config.axis*.maxExtent`
            // would not affect gridAxis
            maxExtent: 0, minExtent: 0, ticks: false, zindex: getFirstDefined(zindex, 0) // put grid behind marks by default
         });
    }
    else {
        // kind === 'main'
        if (!opt.header && axisCmpt.mainExtracted) {
            // if mainExtracted has been extracted to a separate facet
            return undefined;
        }
        if (labelExpr !== undefined) {
            let expr = labelExpr;
            if (((_b = (_a = axis.encode) === null || _a === void 0 ? void 0 : _a.labels) === null || _b === void 0 ? void 0 : _b.update) && isSignalRef(axis.encode.labels.update.text)) {
                expr = replaceAll(labelExpr, 'datum.label', axis.encode.labels.update.text.signal);
            }
            setAxisEncode(axis, 'labels', 'text', { signal: expr });
        }
        if (axis.labelAlign === null) {
            delete axis.labelAlign;
        }
        // Remove unnecessary encode block
        if (axis.encode) {
            for (const part of AXIS_PARTS) {
                if (!axisCmpt.hasAxisPart(part)) {
                    delete axis.encode[part];
                }
            }
            if (isEmpty(axis.encode)) {
                delete axis.encode;
            }
        }
        const titleString = assembleTitle(title, config);
        return Object.assign(Object.assign(Object.assign(Object.assign({ scale,
            orient, grid: false }, (titleString ? { title: titleString } : {})), axis), (config.aria === false ? { aria: false } : {})), { zindex: getFirstDefined(zindex, 0) // put axis line above marks by default
         });
    }
}
/**
 * Add axis signals so grid line works correctly
 * (Fix https://github.com/vega/vega-lite/issues/4226)
 */
function assembleAxisSignals(model) {
    const { axes } = model.component;
    const signals = [];
    for (const channel of POSITION_SCALE_CHANNELS) {
        if (axes[channel]) {
            for (const axis of axes[channel]) {
                if (!axis.get('disable') && !axis.get('gridScale')) {
                    // If there is x-axis but no y-scale for gridScale, need to set height/width so x-axis can draw the grid with the right height. Same for y-axis and width.
                    const sizeType = channel === 'x' ? 'height' : 'width';
                    const update = model.getSizeSignalRef(sizeType).signal;
                    if (sizeType !== update) {
                        signals.push({
                            name: sizeType,
                            update
                        });
                    }
                }
            }
        }
    }
    return signals;
}
function assembleAxes(axisComponents, config) {
    const { x = [], y = [] } = axisComponents;
    return [
        ...x.map(a => assembleAxis(a, 'grid', config)),
        ...y.map(a => assembleAxis(a, 'grid', config)),
        ...x.map(a => assembleAxis(a, 'main', config)),
        ...y.map(a => assembleAxis(a, 'main', config))
    ].filter(a => a); // filter undefined
}
//# sourceMappingURL=assemble.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/axis/config.js





function getAxisConfigFromConfigTypes(configTypes, config, channel, orient) {
    // TODO: add special casing to add conditional value based on orient signal
    return Object.assign.apply(null, [
        {},
        ...configTypes.map(configType => {
            if (configType === 'axisOrient') {
                const orient1 = channel === 'x' ? 'bottom' : 'left';
                const orientConfig1 = config[channel === 'x' ? 'axisBottom' : 'axisLeft'] || {};
                const orientConfig2 = config[channel === 'x' ? 'axisTop' : 'axisRight'] || {};
                const props = new Set([...keys(orientConfig1), ...keys(orientConfig2)]);
                const conditionalOrientAxisConfig = {};
                for (const prop of props.values()) {
                    conditionalOrientAxisConfig[prop] = {
                        // orient is surely signal in this case
                        signal: `${orient['signal']} === "${orient1}" ? ${signalOrStringValue(orientConfig1[prop])} : ${signalOrStringValue(orientConfig2[prop])}`
                    };
                }
                return conditionalOrientAxisConfig;
            }
            return config[configType];
        })
    ]);
}
function getAxisConfigs(channel, scaleType, orient, config) {
    const typeBasedConfigTypes = scaleType === 'band'
        ? ['axisDiscrete', 'axisBand']
        : scaleType === 'point'
            ? ['axisDiscrete', 'axisPoint']
            : isQuantitative(scaleType)
                ? ['axisQuantitative']
                : scaleType === 'time' || scaleType === 'utc'
                    ? ['axisTemporal']
                    : [];
    const axisChannel = channel === 'x' ? 'axisX' : 'axisY';
    const axisOrient = isSignalRef(orient) ? 'axisOrient' : `axis${titleCase(orient)}`; // axisTop, axisBottom, ...
    const vlOnlyConfigTypes = [
        // technically Vega does have axisBand, but if we make another separation here,
        // it will further introduce complexity in the code
        ...typeBasedConfigTypes,
        ...typeBasedConfigTypes.map(c => axisChannel + c.substr(4))
    ];
    const vgConfigTypes = ['axis', axisOrient, axisChannel];
    return {
        vlOnlyAxisConfig: getAxisConfigFromConfigTypes(vlOnlyConfigTypes, config, channel, orient),
        vgAxisConfig: getAxisConfigFromConfigTypes(vgConfigTypes, config, channel, orient),
        axisConfigStyle: getAxisConfigStyle([...vgConfigTypes, ...vlOnlyConfigTypes], config)
    };
}
function getAxisConfigStyle(axisConfigTypes, config) {
    var _a;
    const toMerge = [{}];
    for (const configType of axisConfigTypes) {
        // TODO: add special casing to add conditional value based on orient signal
        let style = (_a = config[configType]) === null || _a === void 0 ? void 0 : _a.style;
        if (style) {
            style = (0,vega_util_module/* array */.YO)(style);
            for (const s of style) {
                toMerge.push(config.style[s]);
            }
        }
    }
    return Object.assign.apply(null, toMerge);
}
function getAxisConfig(property, styleConfigIndex, style, axisConfigs = {}) {
    var _a;
    const styleConfig = getStyleConfig(property, style, styleConfigIndex);
    if (styleConfig !== undefined) {
        return {
            configFrom: 'style',
            configValue: styleConfig
        };
    }
    for (const configFrom of ['vlOnlyAxisConfig', 'vgAxisConfig', 'axisConfigStyle']) {
        if (((_a = axisConfigs[configFrom]) === null || _a === void 0 ? void 0 : _a[property]) !== undefined) {
            return { configFrom, configValue: axisConfigs[configFrom][property] };
        }
    }
    return {};
}
//# sourceMappingURL=config.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/axis/properties.js












const axisRules = {
    scale: ({ model, channel }) => model.scaleName(channel),
    format: ({ fieldOrDatumDef, config, axis }) => {
        const { format, formatType } = axis;
        return guideFormat(fieldOrDatumDef, fieldOrDatumDef.type, format, formatType, config, true);
    },
    formatType: ({ axis, fieldOrDatumDef, scaleType }) => {
        const { formatType } = axis;
        return guideFormatType(formatType, fieldOrDatumDef, scaleType);
    },
    grid: ({ fieldOrDatumDef, axis, scaleType }) => { var _a; return (_a = axis.grid) !== null && _a !== void 0 ? _a : defaultGrid(scaleType, fieldOrDatumDef); },
    gridScale: ({ model, channel }) => gridScale(model, channel),
    labelAlign: ({ axis, labelAngle, orient, channel }) => axis.labelAlign || defaultLabelAlign(labelAngle, orient, channel),
    labelAngle: ({ labelAngle }) => labelAngle,
    labelBaseline: ({ axis, labelAngle, orient, channel }) => axis.labelBaseline || defaultLabelBaseline(labelAngle, orient, channel),
    labelFlush: ({ axis, fieldOrDatumDef, channel }) => { var _a; return (_a = axis.labelFlush) !== null && _a !== void 0 ? _a : defaultLabelFlush(fieldOrDatumDef.type, channel); },
    labelOverlap: ({ axis, fieldOrDatumDef, scaleType }) => {
        var _a;
        return (_a = axis.labelOverlap) !== null && _a !== void 0 ? _a : defaultLabelOverlap(fieldOrDatumDef.type, scaleType, isFieldDef(fieldOrDatumDef) && !!fieldOrDatumDef.timeUnit, isFieldDef(fieldOrDatumDef) ? fieldOrDatumDef.sort : undefined);
    },
    // we already calculate orient in parse
    orient: ({ orient }) => orient,
    tickCount: ({ channel, model, axis, fieldOrDatumDef, scaleType }) => {
        var _a;
        const sizeType = channel === 'x' ? 'width' : channel === 'y' ? 'height' : undefined;
        const size = sizeType ? model.getSizeSignalRef(sizeType) : undefined;
        return (_a = axis.tickCount) !== null && _a !== void 0 ? _a : defaultTickCount({ fieldOrDatumDef, scaleType, size, values: axis.values });
    },
    title: ({ axis, model, channel }) => {
        if (axis.title !== undefined) {
            return axis.title;
        }
        const fieldDefTitle = getFieldDefTitle(model, channel);
        if (fieldDefTitle !== undefined) {
            return fieldDefTitle;
        }
        const fieldDef = model.typedFieldDef(channel);
        const channel2 = channel === 'x' ? 'x2' : 'y2';
        const fieldDef2 = model.fieldDef(channel2);
        // If title not specified, store base parts of fieldDef (and fieldDef2 if exists)
        return mergeTitleFieldDefs(fieldDef ? [toFieldDefBase(fieldDef)] : [], isFieldDef(fieldDef2) ? [toFieldDefBase(fieldDef2)] : []);
    },
    values: ({ axis, fieldOrDatumDef }) => values(axis, fieldOrDatumDef),
    zindex: ({ axis, fieldOrDatumDef, mark }) => { var _a; return (_a = axis.zindex) !== null && _a !== void 0 ? _a : defaultZindex(mark, fieldOrDatumDef); }
};
// TODO: we need to refactor this method after we take care of config refactoring
/**
 * Default rules for whether to show a grid should be shown for a channel.
 * If `grid` is unspecified, the default value is `true` for ordinal scales that are not binned
 */
function defaultGrid(scaleType, fieldDef) {
    return !hasDiscreteDomain(scaleType) && isFieldDef(fieldDef) && !isBinning(fieldDef === null || fieldDef === void 0 ? void 0 : fieldDef.bin) && !isBinned(fieldDef === null || fieldDef === void 0 ? void 0 : fieldDef.bin);
}
function gridScale(model, channel) {
    const gridChannel = channel === 'x' ? 'y' : 'x';
    if (model.getScaleComponent(gridChannel)) {
        return model.scaleName(gridChannel);
    }
    return undefined;
}
function getLabelAngle(fieldOrDatumDef, axis, channel, styleConfig, axisConfigs) {
    const labelAngle = axis === null || axis === void 0 ? void 0 : axis.labelAngle;
    // try axis value
    if (labelAngle !== undefined) {
        return isSignalRef(labelAngle) ? labelAngle : normalizeAngle(labelAngle);
    }
    else {
        // try axis config value
        const { configValue: angle } = getAxisConfig('labelAngle', styleConfig, axis === null || axis === void 0 ? void 0 : axis.style, axisConfigs);
        if (angle !== undefined) {
            return normalizeAngle(angle);
        }
        else {
            // get default value
            if (channel === X &&
                contains([NOMINAL, ORDINAL], fieldOrDatumDef.type) &&
                !(isFieldDef(fieldOrDatumDef) && fieldOrDatumDef.timeUnit)) {
                return 270;
            }
            // no default
            return undefined;
        }
    }
}
function normalizeAngleExpr(angle) {
    return `(((${angle.signal} % 360) + 360) % 360)`;
}
function defaultLabelBaseline(angle, orient, channel, alwaysIncludeMiddle) {
    if (angle !== undefined) {
        if (channel === 'x') {
            if (isSignalRef(angle)) {
                const a = normalizeAngleExpr(angle);
                const orientIsTop = isSignalRef(orient) ? `(${orient.signal} === "top")` : orient === 'top';
                return {
                    signal: `(45 < ${a} && ${a} < 135) || (225 < ${a} && ${a} < 315) ? "middle" :` +
                        `(${a} <= 45 || 315 <= ${a}) === ${orientIsTop} ? "bottom" : "top"`
                };
            }
            if ((45 < angle && angle < 135) || (225 < angle && angle < 315)) {
                return 'middle';
            }
            if (isSignalRef(orient)) {
                const op = angle <= 45 || 315 <= angle ? '===' : '!==';
                return { signal: `${orient.signal} ${op} "top" ? "bottom" : "top"` };
            }
            return (angle <= 45 || 315 <= angle) === (orient === 'top') ? 'bottom' : 'top';
        }
        else {
            if (isSignalRef(angle)) {
                const a = normalizeAngleExpr(angle);
                const orientIsLeft = isSignalRef(orient) ? `(${orient.signal} === "left")` : orient === 'left';
                const middle = alwaysIncludeMiddle ? '"middle"' : 'null';
                return {
                    signal: `${a} <= 45 || 315 <= ${a} || (135 <= ${a} && ${a} <= 225) ? ${middle} : (45 <= ${a} && ${a} <= 135) === ${orientIsLeft} ? "top" : "bottom"`
                };
            }
            if (angle <= 45 || 315 <= angle || (135 <= angle && angle <= 225)) {
                return alwaysIncludeMiddle ? 'middle' : null;
            }
            if (isSignalRef(orient)) {
                const op = 45 <= angle && angle <= 135 ? '===' : '!==';
                return { signal: `${orient.signal} ${op} "left" ? "top" : "bottom"` };
            }
            return (45 <= angle && angle <= 135) === (orient === 'left') ? 'top' : 'bottom';
        }
    }
    return undefined;
}
function defaultLabelAlign(angle, orient, channel) {
    if (angle === undefined) {
        return undefined;
    }
    const isX = channel === 'x';
    const startAngle = isX ? 0 : 90;
    const mainOrient = isX ? 'bottom' : 'left';
    if (isSignalRef(angle)) {
        const a = normalizeAngleExpr(angle);
        const orientIsMain = isSignalRef(orient) ? `(${orient.signal} === "${mainOrient}")` : orient === mainOrient;
        return {
            signal: `(${startAngle ? `(${a} + 90)` : a} % 180 === 0) ? ${isX ? null : '"center"'} :` +
                `(${startAngle} < ${a} && ${a} < ${180 + startAngle}) === ${orientIsMain} ? "left" : "right"`
        };
    }
    if ((angle + startAngle) % 180 === 0) {
        // For bottom, use default label align so label flush still works
        return isX ? null : 'center';
    }
    if (isSignalRef(orient)) {
        const op = startAngle < angle && angle < 180 + startAngle ? '===' : '!==';
        const orientIsMain = `${orient.signal} ${op} "${mainOrient}"`;
        return {
            signal: `${orientIsMain} ? "left" : "right"`
        };
    }
    if ((startAngle < angle && angle < 180 + startAngle) === (orient === mainOrient)) {
        return 'left';
    }
    return 'right';
}
function defaultLabelFlush(type, channel) {
    if (channel === 'x' && contains(['quantitative', 'temporal'], type)) {
        return true;
    }
    return undefined;
}
function defaultLabelOverlap(type, scaleType, hasTimeUnit, sort) {
    // do not prevent overlap for nominal data because there is no way to infer what the missing labels are
    if ((hasTimeUnit && !(0,vega_util_module/* isObject */.Gv)(sort)) || (type !== 'nominal' && type !== 'ordinal')) {
        if (scaleType === 'log' || scaleType === 'symlog') {
            return 'greedy';
        }
        return true;
    }
    return undefined;
}
function defaultOrient(channel) {
    return channel === 'x' ? 'bottom' : 'left';
}
function defaultTickCount({ fieldOrDatumDef, scaleType, size, values: vals }) {
    var _a;
    if (!vals && !hasDiscreteDomain(scaleType) && scaleType !== 'log') {
        if (isFieldDef(fieldOrDatumDef)) {
            if (isBinning(fieldOrDatumDef.bin)) {
                // for binned data, we don't want more ticks than maxbins
                return { signal: `ceil(${size.signal}/10)` };
            }
            if (fieldOrDatumDef.timeUnit &&
                contains(['month', 'hours', 'day', 'quarter'], (_a = normalizeTimeUnit(fieldOrDatumDef.timeUnit)) === null || _a === void 0 ? void 0 : _a.unit)) {
                return undefined;
            }
        }
        return { signal: `ceil(${size.signal}/40)` };
    }
    return undefined;
}
function getFieldDefTitle(model, channel) {
    const channel2 = channel === 'x' ? 'x2' : 'y2';
    const fieldDef = model.fieldDef(channel);
    const fieldDef2 = model.fieldDef(channel2);
    const title1 = fieldDef ? fieldDef.title : undefined;
    const title2 = fieldDef2 ? fieldDef2.title : undefined;
    if (title1 && title2) {
        return mergeTitle(title1, title2);
    }
    else if (title1) {
        return title1;
    }
    else if (title2) {
        return title2;
    }
    else if (title1 !== undefined) {
        // falsy value to disable config
        return title1;
    }
    else if (title2 !== undefined) {
        // falsy value to disable config
        return title2;
    }
    return undefined;
}
function values(axis, fieldOrDatumDef) {
    const vals = axis.values;
    if ((0,vega_util_module/* isArray */.cy)(vals)) {
        return valueArray(fieldOrDatumDef, vals);
    }
    else if (isSignalRef(vals)) {
        return vals;
    }
    return undefined;
}
function defaultZindex(mark, fieldDef) {
    if (mark === 'rect' && channeldef_isDiscrete(fieldDef)) {
        return 1;
    }
    return 0;
}
//# sourceMappingURL=properties.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/calculate.js






class CalculateNode extends DataFlowNode {
    clone() {
        return new CalculateNode(null, duplicate(this.transform));
    }
    constructor(parent, transform) {
        super(parent);
        this.transform = transform;
        this._dependentFields = getDependentFields(this.transform.calculate);
    }
    static parseAllForSortIndex(parent, model) {
        // get all the encoding with sort fields from model
        model.forEachFieldDef((fieldDef, channel) => {
            if (!isScaleFieldDef(fieldDef)) {
                return;
            }
            if (isSortArray(fieldDef.sort)) {
                const { field, timeUnit } = fieldDef;
                const sort = fieldDef.sort;
                // generate `datum["a"] === val0 ? 0 : datum["a"] === val1 ? 1 : ... : n` via FieldEqualPredicate
                const calculate = sort
                    .map((sortValue, i) => {
                    return `${fieldFilterExpression({ field, timeUnit, equal: sortValue })} ? ${i} : `;
                })
                    .join('') + sort.length;
                parent = new CalculateNode(parent, {
                    calculate,
                    as: sortArrayIndexField(fieldDef, channel, { forAs: true })
                });
            }
        });
        return parent;
    }
    producedFields() {
        return new Set([this.transform.as]);
    }
    dependentFields() {
        return this._dependentFields;
    }
    assemble() {
        return {
            type: 'formula',
            expr: this.transform.calculate,
            as: this.transform.as
        };
    }
    hash() {
        return `Calculate ${hash(this.transform)}`;
    }
}
function sortArrayIndexField(fieldDef, channel, opt) {
    return vgField(fieldDef, Object.assign({ prefix: channel, suffix: 'sort_index' }, (opt !== null && opt !== void 0 ? opt : {})));
}
//# sourceMappingURL=calculate.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/header/common.js

/**
 * Get header channel, which can be different from facet channel when orient is specified or when the facet channel is facet.
 */
function getHeaderChannel(channel, orient) {
    if (contains(['top', 'bottom'], orient)) {
        return 'column';
    }
    else if (contains(['left', 'right'], orient)) {
        return 'row';
    }
    return channel === 'row' ? 'row' : 'column';
}
function getHeaderProperty(prop, header, config, channel) {
    const headerSpecificConfig = channel === 'row' ? config.headerRow : channel === 'column' ? config.headerColumn : config.headerFacet;
    return getFirstDefined((header || {})[prop], headerSpecificConfig[prop], config.header[prop]);
}
function getHeaderProperties(properties, header, config, channel) {
    const props = {};
    for (const prop of properties) {
        const value = getHeaderProperty(prop, header || {}, config, channel);
        if (value !== undefined) {
            props[prop] = value;
        }
    }
    return props;
}
//# sourceMappingURL=common.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/header/component.js
const HEADER_CHANNELS = ['row', 'column'];
const HEADER_TYPES = ['header', 'footer'];
//# sourceMappingURL=component.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/header/assemble.js
/**
 * Utility for generating row / column headers
 */













// TODO: rename to assembleHeaderTitleGroup
function assembleTitleGroup(model, channel) {
    const title = model.component.layoutHeaders[channel].title;
    const config = model.config ? model.config : undefined;
    const facetFieldDef = model.component.layoutHeaders[channel].facetFieldDef
        ? model.component.layoutHeaders[channel].facetFieldDef
        : undefined;
    const { titleAnchor, titleAngle: ta, titleOrient } = getHeaderProperties(['titleAnchor', 'titleAngle', 'titleOrient'], facetFieldDef.header, config, channel);
    const headerChannel = getHeaderChannel(channel, titleOrient);
    const titleAngle = normalizeAngle(ta);
    return {
        name: `${channel}-title`,
        type: 'group',
        role: `${headerChannel}-title`,
        title: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ text: title }, (channel === 'row' ? { orient: 'left' } : {})), { style: 'guide-title' }), defaultHeaderGuideBaseline(titleAngle, headerChannel)), defaultHeaderGuideAlign(headerChannel, titleAngle, titleAnchor)), assembleHeaderProperties(config, facetFieldDef, channel, HEADER_TITLE_PROPERTIES, HEADER_TITLE_PROPERTIES_MAP))
    };
}
function defaultHeaderGuideAlign(headerChannel, angle, anchor = 'middle') {
    switch (anchor) {
        case 'start':
            return { align: 'left' };
        case 'end':
            return { align: 'right' };
    }
    const align = defaultLabelAlign(angle, headerChannel === 'row' ? 'left' : 'top', headerChannel === 'row' ? 'y' : 'x');
    return align ? { align } : {};
}
function defaultHeaderGuideBaseline(angle, channel) {
    const baseline = defaultLabelBaseline(angle, channel === 'row' ? 'left' : 'top', channel === 'row' ? 'y' : 'x', true);
    return baseline ? { baseline } : {};
}
function assembleHeaderGroups(model, channel) {
    const layoutHeader = model.component.layoutHeaders[channel];
    const groups = [];
    for (const headerType of HEADER_TYPES) {
        if (layoutHeader[headerType]) {
            for (const headerComponent of layoutHeader[headerType]) {
                const group = assembleHeaderGroup(model, channel, headerType, layoutHeader, headerComponent);
                if (group != null) {
                    groups.push(group);
                }
            }
        }
    }
    return groups;
}
function getSort(facetFieldDef, channel) {
    var _a;
    const { sort } = facetFieldDef;
    if (isSortField(sort)) {
        return {
            field: vgField(sort, { expr: 'datum' }),
            order: (_a = sort.order) !== null && _a !== void 0 ? _a : 'ascending'
        };
    }
    else if ((0,vega_util_module/* isArray */.cy)(sort)) {
        return {
            field: sortArrayIndexField(facetFieldDef, channel, { expr: 'datum' }),
            order: 'ascending'
        };
    }
    else {
        return {
            field: vgField(facetFieldDef, { expr: 'datum' }),
            order: sort !== null && sort !== void 0 ? sort : 'ascending'
        };
    }
}
function assembleLabelTitle(facetFieldDef, channel, config) {
    const { format, formatType, labelAngle, labelAnchor, labelOrient, labelExpr } = getHeaderProperties(['format', 'formatType', 'labelAngle', 'labelAnchor', 'labelOrient', 'labelExpr'], facetFieldDef.header, config, channel);
    const titleTextExpr = formatSignalRef({
        fieldOrDatumDef: facetFieldDef,
        format,
        formatType,
        expr: 'parent',
        config
    }).signal;
    const headerChannel = getHeaderChannel(channel, labelOrient);
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ text: {
            signal: labelExpr
                ? replaceAll(replaceAll(labelExpr, 'datum.label', titleTextExpr), 'datum.value', vgField(facetFieldDef, { expr: 'parent' }))
                : titleTextExpr
        } }, (channel === 'row' ? { orient: 'left' } : {})), { style: 'guide-label', frame: 'group' }), defaultHeaderGuideBaseline(labelAngle, headerChannel)), defaultHeaderGuideAlign(headerChannel, labelAngle, labelAnchor)), assembleHeaderProperties(config, facetFieldDef, channel, HEADER_LABEL_PROPERTIES, HEADER_LABEL_PROPERTIES_MAP));
}
function assembleHeaderGroup(model, channel, headerType, layoutHeader, headerComponent) {
    if (headerComponent) {
        let title = null;
        const { facetFieldDef } = layoutHeader;
        const config = model.config ? model.config : undefined;
        if (facetFieldDef && headerComponent.labels) {
            const { labelOrient } = getHeaderProperties(['labelOrient'], facetFieldDef.header, config, channel);
            // Include label title in the header if orient aligns with the channel
            if ((channel === 'row' && !contains(['top', 'bottom'], labelOrient)) ||
                (channel === 'column' && !contains(['left', 'right'], labelOrient))) {
                title = assembleLabelTitle(facetFieldDef, channel, config);
            }
        }
        const isFacetWithoutRowCol = isFacetModel(model) && !isFacetMapping(model.facet);
        const axes = headerComponent.axes;
        const hasAxes = (axes === null || axes === void 0 ? void 0 : axes.length) > 0;
        if (title || hasAxes) {
            const sizeChannel = channel === 'row' ? 'height' : 'width';
            return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ name: model.getName(`${channel}_${headerType}`), type: 'group', role: `${channel}-${headerType}` }, (layoutHeader.facetFieldDef
                ? {
                    from: { data: model.getName(`${channel}_domain`) },
                    sort: getSort(facetFieldDef, channel)
                }
                : {})), (hasAxes && isFacetWithoutRowCol
                ? {
                    from: { data: model.getName(`facet_domain_${channel}`) }
                }
                : {})), (title ? { title } : {})), (headerComponent.sizeSignal
                ? {
                    encode: {
                        update: {
                            [sizeChannel]: headerComponent.sizeSignal
                        }
                    }
                }
                : {})), (hasAxes ? { axes } : {}));
        }
    }
    return null;
}
const LAYOUT_TITLE_BAND = {
    column: {
        start: 0,
        end: 1
    },
    row: {
        start: 1,
        end: 0
    }
};
function getLayoutTitleBand(titleAnchor, headerChannel) {
    return LAYOUT_TITLE_BAND[headerChannel][titleAnchor];
}
function assembleLayoutTitleBand(headerComponentIndex, config) {
    const titleBand = {};
    for (const channel of FACET_CHANNELS) {
        const headerComponent = headerComponentIndex[channel];
        if (headerComponent === null || headerComponent === void 0 ? void 0 : headerComponent.facetFieldDef) {
            const { titleAnchor, titleOrient } = getHeaderProperties(['titleAnchor', 'titleOrient'], headerComponent.facetFieldDef.header, config, channel);
            const headerChannel = getHeaderChannel(channel, titleOrient);
            const band = getLayoutTitleBand(titleAnchor, headerChannel);
            if (band !== undefined) {
                titleBand[headerChannel] = band;
            }
        }
    }
    return isEmpty(titleBand) ? undefined : titleBand;
}
function assembleHeaderProperties(config, facetFieldDef, channel, properties, propertiesMap) {
    const props = {};
    for (const prop of properties) {
        if (!propertiesMap[prop]) {
            continue;
        }
        const value = getHeaderProperty(prop, facetFieldDef === null || facetFieldDef === void 0 ? void 0 : facetFieldDef.header, config, channel);
        if (value !== undefined) {
            props[propertiesMap[prop]] = value;
        }
    }
    return props;
}
//# sourceMappingURL=assemble.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/layoutsize/assemble.js






function assembleLayoutSignals(model) {
    return [
        ...sizeSignals(model, 'width'),
        ...sizeSignals(model, 'height'),
        ...sizeSignals(model, 'childWidth'),
        ...sizeSignals(model, 'childHeight')
    ];
}
function sizeSignals(model, sizeType) {
    const channel = sizeType === 'width' ? 'x' : 'y';
    const size = model.component.layoutSize.get(sizeType);
    if (!size || size === 'merged') {
        return [];
    }
    // Read size signal name from name map, just in case it is the top-level size signal that got renamed.
    const name = model.getSizeSignalRef(sizeType).signal;
    if (size === 'step') {
        const scaleComponent = model.getScaleComponent(channel);
        if (scaleComponent) {
            const type = scaleComponent.get('type');
            const range = scaleComponent.get('range');
            if (hasDiscreteDomain(type) && isVgRangeStep(range)) {
                const scaleName = model.scaleName(channel);
                if (isFacetModel(model.parent)) {
                    // If parent is facet and this is an independent scale, return only signal signal
                    // as the width/height will be calculated using the cardinality from
                    // facet's aggregate rather than reading from scale domain
                    const parentResolve = model.parent.component.resolve;
                    if (parentResolve.scale[channel] === 'independent') {
                        return [stepSignal(scaleName, range)];
                    }
                }
                return [
                    stepSignal(scaleName, range),
                    {
                        name,
                        update: sizeExpr(scaleName, scaleComponent, `domain('${scaleName}').length`)
                    }
                ];
            }
        }
        /* istanbul ignore next: Condition should not happen -- only for warning in development. */
        throw new Error('layout size is step although width/height is not step.');
    }
    else if (size == 'container') {
        const isWidth = name.endsWith('width');
        const expr = isWidth ? 'containerSize()[0]' : 'containerSize()[1]';
        const defaultValue = getViewConfigContinuousSize(model.config.view, isWidth ? 'width' : 'height');
        const safeExpr = `isFinite(${expr}) ? ${expr} : ${defaultValue}`;
        return [{ name, init: safeExpr, on: [{ update: safeExpr, events: 'window:resize' }] }];
    }
    else {
        return [
            {
                name,
                value: size
            }
        ];
    }
}
function stepSignal(scaleName, range) {
    const name = `${scaleName}_step`;
    if (isSignalRef(range.step)) {
        return { name, update: range.step.signal };
    }
    else {
        return { name, value: range.step };
    }
}
function sizeExpr(scaleName, scaleComponent, cardinality) {
    const type = scaleComponent.get('type');
    const padding = scaleComponent.get('padding');
    const paddingOuter = getFirstDefined(scaleComponent.get('paddingOuter'), padding);
    let paddingInner = scaleComponent.get('paddingInner');
    paddingInner =
        type === 'band'
            ? // only band has real paddingInner
                paddingInner !== undefined
                    ? paddingInner
                    : padding
            : // For point, as calculated in https://github.com/vega/vega-scale/blob/master/src/band.js#L128,
                // it's equivalent to have paddingInner = 1 since there is only n-1 steps between n points.
                1;
    return `bandspace(${cardinality}, ${signalOrStringValue(paddingInner)}, ${signalOrStringValue(paddingOuter)}) * ${scaleName}_step`;
}
//# sourceMappingURL=assemble.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/layoutsize/component.js
function getSizeTypeFromLayoutSizeType(layoutSizeType) {
    return layoutSizeType === 'childWidth' ? 'width' : layoutSizeType === 'childHeight' ? 'height' : layoutSizeType;
}
//# sourceMappingURL=component.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/guide.js



function guideEncodeEntry(encoding, model) {
    return keys(encoding).reduce((encode, channel) => {
        const valueDef = encoding[channel];
        return Object.assign(Object.assign({}, encode), wrapCondition(model, valueDef, channel, def => signalOrValueRef(def.value)));
    }, {});
}
//# sourceMappingURL=guide.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/resolve.js



function defaultScaleResolve(channel, model) {
    if (isFacetModel(model)) {
        return channel === 'theta' ? 'independent' : 'shared';
    }
    else if (isLayerModel(model)) {
        return 'shared';
    }
    else if (isConcatModel(model)) {
        return isXorY(channel) || channel === 'theta' || channel === 'radius' ? 'independent' : 'shared';
    }
    /* istanbul ignore next: should never reach here. */
    throw new Error('invalid model type for resolve');
}
function parseGuideResolve(resolve, channel) {
    const channelScaleResolve = resolve.scale[channel];
    const guide = isXorY(channel) ? 'axis' : 'legend';
    if (channelScaleResolve === 'independent') {
        if (resolve[guide][channel] === 'shared') {
            warn(independentScaleMeansIndependentGuide(channel));
        }
        return 'independent';
    }
    return resolve[guide][channel] || 'shared';
}
//# sourceMappingURL=resolve.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/legend/component.js



const LEGEND_COMPONENT_PROPERTY_INDEX = Object.assign(Object.assign({}, COMMON_LEGEND_PROPERTY_INDEX), { disable: 1, labelExpr: 1, selections: 1, 
    // channel scales
    opacity: 1, shape: 1, stroke: 1, fill: 1, size: 1, strokeWidth: 1, strokeDash: 1, 
    // encode
    encode: 1 });
const LEGEND_COMPONENT_PROPERTIES = keys(LEGEND_COMPONENT_PROPERTY_INDEX);
class LegendComponent extends Split {
}
//# sourceMappingURL=component.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/legend/encode.js









const legendEncodeRules = {
    symbols,
    gradient,
    labels,
    entries: encode_entries
};
function symbols(symbolsSpec, { fieldOrDatumDef, model, channel, legendCmpt, legendType }) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (legendType !== 'symbol') {
        return undefined;
    }
    const { markDef, encoding, config, mark } = model;
    const filled = markDef.filled && mark !== 'trail';
    let out = Object.assign(Object.assign({}, applyMarkConfig({}, model, FILL_STROKE_CONFIG)), color(model, { filled })); // FIXME: remove this when VgEncodeEntry is compatible with SymbolEncodeEntry
    const symbolOpacity = (_a = legendCmpt.get('symbolOpacity')) !== null && _a !== void 0 ? _a : config.legend.symbolOpacity;
    const symbolFillColor = (_b = legendCmpt.get('symbolFillColor')) !== null && _b !== void 0 ? _b : config.legend.symbolFillColor;
    const symbolStrokeColor = (_c = legendCmpt.get('symbolStrokeColor')) !== null && _c !== void 0 ? _c : config.legend.symbolStrokeColor;
    const opacity = symbolOpacity === undefined ? (_d = getMaxValue(encoding.opacity)) !== null && _d !== void 0 ? _d : markDef.opacity : undefined;
    if (out.fill) {
        // for fill legend, we don't want any fill in symbol
        if (channel === 'fill' || (filled && channel === COLOR)) {
            delete out.fill;
        }
        else {
            if (out.fill['field']) {
                // For others, set fill to some opaque value (or nothing if a color is already set)
                if (symbolFillColor) {
                    delete out.fill;
                }
                else {
                    out.fill = signalOrValueRef((_e = config.legend.symbolBaseFillColor) !== null && _e !== void 0 ? _e : 'black');
                    out.fillOpacity = signalOrValueRef(opacity !== null && opacity !== void 0 ? opacity : 1);
                }
            }
            else if ((0,vega_util_module/* isArray */.cy)(out.fill)) {
                const fill = (_h = (_g = getFirstConditionValue((_f = encoding.fill) !== null && _f !== void 0 ? _f : encoding.color)) !== null && _g !== void 0 ? _g : markDef.fill) !== null && _h !== void 0 ? _h : (filled && markDef.color);
                if (fill) {
                    out.fill = signalOrValueRef(fill);
                }
            }
        }
    }
    if (out.stroke) {
        if (channel === 'stroke' || (!filled && channel === COLOR)) {
            delete out.stroke;
        }
        else {
            if (out.stroke['field'] || symbolStrokeColor) {
                // For others, remove stroke field
                delete out.stroke;
            }
            else if ((0,vega_util_module/* isArray */.cy)(out.stroke)) {
                const stroke = getFirstDefined(getFirstConditionValue(encoding.stroke || encoding.color), markDef.stroke, filled ? markDef.color : undefined);
                if (stroke) {
                    out.stroke = { value: stroke };
                }
            }
        }
    }
    if (channel !== OPACITY) {
        const condition = isFieldDef(fieldOrDatumDef) && selectedCondition(model, legendCmpt, fieldOrDatumDef);
        if (condition) {
            out.opacity = [
                Object.assign({ test: condition }, signalOrValueRef(opacity !== null && opacity !== void 0 ? opacity : 1)),
                signalOrValueRef(config.legend.unselectedOpacity)
            ];
        }
        else if (opacity) {
            out.opacity = signalOrValueRef(opacity);
        }
    }
    out = Object.assign(Object.assign({}, out), symbolsSpec);
    return isEmpty(out) ? undefined : out;
}
function gradient(gradientSpec, { model, legendType, legendCmpt }) {
    var _a;
    if (legendType !== 'gradient') {
        return undefined;
    }
    const { config, markDef, encoding } = model;
    let out = {};
    const gradientOpacity = (_a = legendCmpt.get('gradientOpacity')) !== null && _a !== void 0 ? _a : config.legend.gradientOpacity;
    const opacity = gradientOpacity === undefined ? getMaxValue(encoding.opacity) || markDef.opacity : undefined;
    if (opacity) {
        // only apply opacity if it is neither zero or undefined
        out.opacity = signalOrValueRef(opacity);
    }
    out = Object.assign(Object.assign({}, out), gradientSpec);
    return isEmpty(out) ? undefined : out;
}
function labels(specifiedlabelsSpec, { fieldOrDatumDef, model, channel, legendCmpt }) {
    const legend = model.legend(channel) || {};
    const config = model.config;
    const condition = isFieldDef(fieldOrDatumDef) ? selectedCondition(model, legendCmpt, fieldOrDatumDef) : undefined;
    const opacity = condition ? [{ test: condition, value: 1 }, { value: config.legend.unselectedOpacity }] : undefined;
    const { format, formatType } = legend;
    let text = undefined;
    if (isCustomFormatType(formatType)) {
        text = formatCustomType({
            fieldOrDatumDef,
            field: 'datum.value',
            format,
            formatType,
            config
        });
    }
    else if (format === undefined && formatType === undefined && config.customFormatTypes) {
        if (fieldOrDatumDef.type === 'quantitative' && config.numberFormatType) {
            text = formatCustomType({
                fieldOrDatumDef,
                field: 'datum.value',
                format: config.numberFormat,
                formatType: config.numberFormatType,
                config
            });
        }
        else if (fieldOrDatumDef.type === 'temporal' &&
            config.timeFormatType &&
            isFieldDef(fieldOrDatumDef) &&
            fieldOrDatumDef.timeUnit === undefined) {
            text = formatCustomType({
                fieldOrDatumDef,
                field: 'datum.value',
                format: config.timeFormat,
                formatType: config.timeFormatType,
                config
            });
        }
    }
    const labelsSpec = Object.assign(Object.assign(Object.assign({}, (opacity ? { opacity } : {})), (text ? { text } : {})), specifiedlabelsSpec);
    return isEmpty(labelsSpec) ? undefined : labelsSpec;
}
function encode_entries(entriesSpec, { legendCmpt }) {
    const selections = legendCmpt.get('selections');
    return (selections === null || selections === void 0 ? void 0 : selections.length) ? Object.assign(Object.assign({}, entriesSpec), { fill: { value: 'transparent' } }) : entriesSpec;
}
function getMaxValue(channelDef) {
    return getConditionValue(channelDef, (v, conditionalDef) => Math.max(v, conditionalDef.value));
}
function getFirstConditionValue(channelDef) {
    return getConditionValue(channelDef, (v, conditionalDef) => {
        return getFirstDefined(v, conditionalDef.value);
    });
}
function getConditionValue(channelDef, reducer) {
    if (hasConditionalValueDef(channelDef)) {
        return (0,vega_util_module/* array */.YO)(channelDef.condition).reduce(reducer, channelDef.value);
    }
    else if (isValueDef(channelDef)) {
        return channelDef.value;
    }
    return undefined;
}
function selectedCondition(model, legendCmpt, fieldDef) {
    const selections = legendCmpt.get('selections');
    if (!(selections === null || selections === void 0 ? void 0 : selections.length))
        return undefined;
    const field = (0,vega_util_module/* stringValue */.r$)(fieldDef.field);
    return selections
        .map(name => {
        const store = (0,vega_util_module/* stringValue */.r$)(varName(name) + STORE);
        return `(!length(data(${store})) || (${name}[${field}] && indexof(${name}[${field}], datum.value) >= 0))`;
    })
        .join(' || ');
}
//# sourceMappingURL=encode.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/legend/properties.js








const legendRules = {
    direction: ({ direction }) => direction,
    format: ({ fieldOrDatumDef, legend, config }) => {
        const { format, formatType } = legend;
        return guideFormat(fieldOrDatumDef, fieldOrDatumDef.type, format, formatType, config, false);
    },
    formatType: ({ legend, fieldOrDatumDef, scaleType }) => {
        const { formatType } = legend;
        return guideFormatType(formatType, fieldOrDatumDef, scaleType);
    },
    gradientLength: params => {
        var _a, _b;
        const { legend, legendConfig } = params;
        return (_b = (_a = legend.gradientLength) !== null && _a !== void 0 ? _a : legendConfig.gradientLength) !== null && _b !== void 0 ? _b : defaultGradientLength(params);
    },
    labelOverlap: ({ legend, legendConfig, scaleType }) => { var _a, _b; return (_b = (_a = legend.labelOverlap) !== null && _a !== void 0 ? _a : legendConfig.labelOverlap) !== null && _b !== void 0 ? _b : properties_defaultLabelOverlap(scaleType); },
    symbolType: ({ legend, markDef, channel, encoding }) => { var _a; return (_a = legend.symbolType) !== null && _a !== void 0 ? _a : defaultSymbolType(markDef.type, channel, encoding.shape, markDef.shape); },
    title: ({ fieldOrDatumDef, config }) => channeldef_title(fieldOrDatumDef, config, { allowDisabling: true }),
    type: ({ legendType, scaleType, channel }) => {
        if (isColorChannel(channel) && isContinuousToContinuous(scaleType)) {
            if (legendType === 'gradient') {
                return undefined;
            }
        }
        else if (legendType === 'symbol') {
            return undefined;
        }
        return legendType;
    },
    values: ({ fieldOrDatumDef, legend }) => properties_values(legend, fieldOrDatumDef)
};
function properties_values(legend, fieldOrDatumDef) {
    const vals = legend.values;
    if ((0,vega_util_module/* isArray */.cy)(vals)) {
        return valueArray(fieldOrDatumDef, vals);
    }
    else if (isSignalRef(vals)) {
        return vals;
    }
    return undefined;
}
function defaultSymbolType(mark, channel, shapeChannelDef, markShape) {
    var _a;
    if (channel !== 'shape') {
        // use the value from the shape encoding or the mark config if they exist
        const shape = (_a = getFirstConditionValue(shapeChannelDef)) !== null && _a !== void 0 ? _a : markShape;
        if (shape) {
            return shape;
        }
    }
    switch (mark) {
        case 'bar':
        case 'rect':
        case 'image':
        case 'square':
            return 'square';
        case 'line':
        case 'trail':
        case 'rule':
            return 'stroke';
        case 'arc':
        case 'point':
        case 'circle':
        case 'tick':
        case 'geoshape':
        case 'area':
        case 'text':
            return 'circle';
    }
}
function clipHeight(legendType) {
    if (legendType === 'gradient') {
        return 20;
    }
    return undefined;
}
function getLegendType(params) {
    const { legend } = params;
    return getFirstDefined(legend.type, properties_defaultType(params));
}
function properties_defaultType({ channel, timeUnit, scaleType }) {
    // Following the logic in https://github.com/vega/vega-parser/blob/master/src/parsers/legend.js
    if (isColorChannel(channel)) {
        if (contains(['quarter', 'month', 'day'], timeUnit)) {
            return 'symbol';
        }
        if (isContinuousToContinuous(scaleType)) {
            return 'gradient';
        }
    }
    return 'symbol';
}
function getDirection({ legendConfig, legendType, orient, legend }) {
    var _a, _b;
    return ((_b = (_a = legend.direction) !== null && _a !== void 0 ? _a : legendConfig[legendType ? 'gradientDirection' : 'symbolDirection']) !== null && _b !== void 0 ? _b : defaultDirection(orient, legendType));
}
function defaultDirection(orient, legendType) {
    switch (orient) {
        case 'top':
        case 'bottom':
            return 'horizontal';
        case 'left':
        case 'right':
        case 'none':
        case undefined: // undefined = "right" in Vega
            return undefined; // vertical is Vega's default
        default:
            // top-left / ...
            // For inner legend, uses compact layout like Tableau
            return legendType === 'gradient' ? 'horizontal' : undefined;
    }
}
function defaultGradientLength({ legendConfig, model, direction, orient, scaleType }) {
    const { gradientHorizontalMaxLength, gradientHorizontalMinLength, gradientVerticalMaxLength, gradientVerticalMinLength } = legendConfig;
    if (isContinuousToContinuous(scaleType)) {
        if (direction === 'horizontal') {
            if (orient === 'top' || orient === 'bottom') {
                return gradientLengthSignal(model, 'width', gradientHorizontalMinLength, gradientHorizontalMaxLength);
            }
            else {
                return gradientHorizontalMinLength;
            }
        }
        else {
            // vertical / undefined (Vega uses vertical by default)
            return gradientLengthSignal(model, 'height', gradientVerticalMinLength, gradientVerticalMaxLength);
        }
    }
    return undefined;
}
function gradientLengthSignal(model, sizeType, min, max) {
    const sizeSignal = model.getSizeSignalRef(sizeType).signal;
    return { signal: `clamp(${sizeSignal}, ${min}, ${max})` };
}
function properties_defaultLabelOverlap(scaleType) {
    if (contains(['quantile', 'threshold', 'log', 'symlog'], scaleType)) {
        return 'greedy';
    }
    return undefined;
}
//# sourceMappingURL=properties.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/legend/parse.js















function parseLegend(model) {
    const legendComponent = isUnitModel(model) ? parseUnitLegend(model) : parseNonUnitLegend(model);
    model.component.legends = legendComponent;
    return legendComponent;
}
function parseUnitLegend(model) {
    const { encoding } = model;
    const legendComponent = {};
    for (const channel of [COLOR, ...LEGEND_SCALE_CHANNELS]) {
        const def = getFieldOrDatumDef(encoding[channel]);
        if (!def || !model.getScaleComponent(channel)) {
            continue;
        }
        if (channel === SHAPE && isFieldDef(def) && def.type === GEOJSON) {
            continue;
        }
        legendComponent[channel] = parseLegendForChannel(model, channel);
    }
    return legendComponent;
}
function getLegendDefWithScale(model, channel) {
    const scale = model.scaleName(channel);
    if (model.mark === 'trail') {
        if (channel === 'color') {
            // trail is a filled mark, but its default symbolType ("stroke") should use "stroke"
            return { stroke: scale };
        }
        else if (channel === 'size') {
            return { strokeWidth: scale };
        }
    }
    if (channel === 'color') {
        return model.markDef.filled ? { fill: scale } : { stroke: scale };
    }
    return { [channel]: scale };
}
// eslint-disable-next-line @typescript-eslint/ban-types
function isExplicit(value, property, legend, fieldDef) {
    switch (property) {
        case 'disable':
            return legend !== undefined; // if axis is specified or null/false, then its enable/disable state is explicit
        case 'values':
            // specified legend.values is already respected, but may get transformed.
            return !!(legend === null || legend === void 0 ? void 0 : legend.values);
        case 'title':
            // title can be explicit if fieldDef.title is set
            if (property === 'title' && value === (fieldDef === null || fieldDef === void 0 ? void 0 : fieldDef.title)) {
                return true;
            }
    }
    // Otherwise, things are explicit if the returned value matches the specified property
    return value === (legend || {})[property];
}
function parseLegendForChannel(model, channel) {
    var _a, _b, _c;
    let legend = model.legend(channel);
    const { markDef, encoding, config } = model;
    const legendConfig = config.legend;
    const legendCmpt = new LegendComponent({}, getLegendDefWithScale(model, channel));
    parseInteractiveLegend(model, channel, legendCmpt);
    const disable = legend !== undefined ? !legend : legendConfig.disable;
    legendCmpt.set('disable', disable, legend !== undefined);
    if (disable) {
        return legendCmpt;
    }
    legend = legend || {};
    const scaleType = model.getScaleComponent(channel).get('type');
    const fieldOrDatumDef = getFieldOrDatumDef(encoding[channel]);
    const timeUnit = isFieldDef(fieldOrDatumDef) ? (_a = normalizeTimeUnit(fieldOrDatumDef.timeUnit)) === null || _a === void 0 ? void 0 : _a.unit : undefined;
    const orient = legend.orient || config.legend.orient || 'right';
    const legendType = getLegendType({ legend, channel, timeUnit, scaleType });
    const direction = getDirection({ legend, legendType, orient, legendConfig });
    const ruleParams = {
        legend,
        channel,
        model,
        markDef,
        encoding,
        fieldOrDatumDef,
        legendConfig,
        config,
        scaleType,
        orient,
        legendType,
        direction
    };
    for (const property of LEGEND_COMPONENT_PROPERTIES) {
        if ((legendType === 'gradient' && property.startsWith('symbol')) ||
            (legendType === 'symbol' && property.startsWith('gradient'))) {
            continue;
        }
        const value = property in legendRules ? legendRules[property](ruleParams) : legend[property];
        if (value !== undefined) {
            const explicit = isExplicit(value, property, legend, model.fieldDef(channel));
            if (explicit || config.legend[property] === undefined) {
                legendCmpt.set(property, value, explicit);
            }
        }
    }
    const legendEncoding = (_b = legend === null || legend === void 0 ? void 0 : legend.encoding) !== null && _b !== void 0 ? _b : {};
    const selections = legendCmpt.get('selections');
    const legendEncode = {};
    const legendEncodeParams = { fieldOrDatumDef, model, channel, legendCmpt, legendType };
    for (const part of ['labels', 'legend', 'title', 'symbols', 'gradient', 'entries']) {
        const legendEncodingPart = guideEncodeEntry((_c = legendEncoding[part]) !== null && _c !== void 0 ? _c : {}, model);
        const value = part in legendEncodeRules
            ? legendEncodeRules[part](legendEncodingPart, legendEncodeParams) // apply rule
            : legendEncodingPart; // no rule -- just default values
        if (value !== undefined && !isEmpty(value)) {
            legendEncode[part] = Object.assign(Object.assign(Object.assign({}, ((selections === null || selections === void 0 ? void 0 : selections.length) && isFieldDef(fieldOrDatumDef)
                ? { name: `${varName(fieldOrDatumDef.field)}_legend_${part}` }
                : {})), ((selections === null || selections === void 0 ? void 0 : selections.length) ? { interactive: !!selections } : {})), { update: value });
        }
    }
    if (!isEmpty(legendEncode)) {
        legendCmpt.set('encode', legendEncode, !!(legend === null || legend === void 0 ? void 0 : legend.encoding));
    }
    return legendCmpt;
}
function parseNonUnitLegend(model) {
    const { legends, resolve } = model.component;
    for (const child of model.children) {
        parseLegend(child);
        for (const channel of keys(child.component.legends)) {
            resolve.legend[channel] = parseGuideResolve(model.component.resolve, channel);
            if (resolve.legend[channel] === 'shared') {
                // If the resolve says shared (and has not been overridden)
                // We will try to merge and see if there is a conflict
                legends[channel] = mergeLegendComponent(legends[channel], child.component.legends[channel]);
                if (!legends[channel]) {
                    // If merge returns nothing, there is a conflict so we cannot make the legend shared.
                    // Thus, mark legend as independent and remove the legend component.
                    resolve.legend[channel] = 'independent';
                    delete legends[channel];
                }
            }
        }
    }
    for (const channel of keys(legends)) {
        for (const child of model.children) {
            if (!child.component.legends[channel]) {
                // skip if the child does not have a particular legend
                continue;
            }
            if (resolve.legend[channel] === 'shared') {
                // After merging shared legend, make sure to remove legend from child
                delete child.component.legends[channel];
            }
        }
    }
    return legends;
}
function mergeLegendComponent(mergedLegend, childLegend) {
    var _a, _b, _c, _d;
    if (!mergedLegend) {
        return childLegend.clone();
    }
    const mergedOrient = mergedLegend.getWithExplicit('orient');
    const childOrient = childLegend.getWithExplicit('orient');
    if (mergedOrient.explicit && childOrient.explicit && mergedOrient.value !== childOrient.value) {
        // TODO: throw warning if resolve is explicit (We don't have info about explicit/implicit resolve yet.)
        // Cannot merge due to inconsistent orient
        return undefined;
    }
    let typeMerged = false;
    // Otherwise, let's merge
    for (const prop of LEGEND_COMPONENT_PROPERTIES) {
        const mergedValueWithExplicit = mergeValuesWithExplicit(mergedLegend.getWithExplicit(prop), childLegend.getWithExplicit(prop), prop, 'legend', 
        // Tie breaker function
        (v1, v2) => {
            switch (prop) {
                case 'symbolType':
                    return mergeSymbolType(v1, v2);
                case 'title':
                    return mergeTitleComponent(v1, v2);
                case 'type':
                    // There are only two types. If we have different types, then prefer symbol over gradient.
                    typeMerged = true;
                    return makeImplicit('symbol');
            }
            return defaultTieBreaker(v1, v2, prop, 'legend');
        });
        mergedLegend.setWithExplicit(prop, mergedValueWithExplicit);
    }
    if (typeMerged) {
        if ((_b = (_a = mergedLegend.implicit) === null || _a === void 0 ? void 0 : _a.encode) === null || _b === void 0 ? void 0 : _b.gradient) {
            deleteNestedProperty(mergedLegend.implicit, ['encode', 'gradient']);
        }
        if ((_d = (_c = mergedLegend.explicit) === null || _c === void 0 ? void 0 : _c.encode) === null || _d === void 0 ? void 0 : _d.gradient) {
            deleteNestedProperty(mergedLegend.explicit, ['encode', 'gradient']);
        }
    }
    return mergedLegend;
}
function mergeSymbolType(st1, st2) {
    if (st2.value === 'circle') {
        // prefer "circle" over "stroke"
        return st2;
    }
    return st1;
}
//# sourceMappingURL=parse.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/legend/assemble.js
var legend_assemble_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};




function setLegendEncode(legend, part, vgProp, vgRef) {
    var _a, _b, _c;
    var _d, _e;
    (_a = legend.encode) !== null && _a !== void 0 ? _a : (legend.encode = {});
    (_b = (_d = legend.encode)[part]) !== null && _b !== void 0 ? _b : (_d[part] = {});
    (_c = (_e = legend.encode[part]).update) !== null && _c !== void 0 ? _c : (_e.update = {});
    // TODO: remove as any after https://github.com/prisma/nexus-prisma/issues/291
    legend.encode[part].update[vgProp] = vgRef;
}
function assembleLegends(model) {
    const legendComponentIndex = model.component.legends;
    const legendByDomain = {};
    for (const channel of keys(legendComponentIndex)) {
        const scaleComponent = model.getScaleComponent(channel);
        const domainHash = stringify(scaleComponent.get('domains'));
        if (legendByDomain[domainHash]) {
            for (const mergedLegendComponent of legendByDomain[domainHash]) {
                const merged = mergeLegendComponent(mergedLegendComponent, legendComponentIndex[channel]);
                if (!merged) {
                    // If cannot merge, need to add this legend separately
                    legendByDomain[domainHash].push(legendComponentIndex[channel]);
                }
            }
        }
        else {
            legendByDomain[domainHash] = [legendComponentIndex[channel].clone()];
        }
    }
    const legends = vals(legendByDomain)
        .flat()
        .map(l => assembleLegend(l, model.config))
        .filter(l => l !== undefined);
    return legends;
}
function assembleLegend(legendCmpt, config) {
    var _a, _b, _c;
    const _d = legendCmpt.combine(), { disable, labelExpr, selections } = _d, legend = legend_assemble_rest(_d, ["disable", "labelExpr", "selections"]);
    if (disable) {
        return undefined;
    }
    if (config.aria === false && legend.aria == undefined) {
        legend.aria = false;
    }
    if ((_a = legend.encode) === null || _a === void 0 ? void 0 : _a.symbols) {
        const out = legend.encode.symbols.update;
        if (out.fill && out.fill['value'] !== 'transparent' && !out.stroke && !legend.stroke) {
            // For non color channel's legend, we need to override symbol stroke config from Vega config if stroke channel is not used.
            out.stroke = { value: 'transparent' };
        }
        // Remove properties that the legend is encoding.
        for (const property of LEGEND_SCALE_CHANNELS) {
            if (legend[property]) {
                delete out[property];
            }
        }
    }
    if (!legend.title) {
        // title schema doesn't include null, ''
        delete legend.title;
    }
    if (labelExpr !== undefined) {
        let expr = labelExpr;
        if (((_c = (_b = legend.encode) === null || _b === void 0 ? void 0 : _b.labels) === null || _c === void 0 ? void 0 : _c.update) && isSignalRef(legend.encode.labels.update.text)) {
            expr = replaceAll(labelExpr, 'datum.label', legend.encode.labels.update.text.signal);
        }
        setLegendEncode(legend, 'labels', 'text', { signal: expr });
    }
    return legend;
}
//# sourceMappingURL=assemble.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/projection/assemble.js



function assembleProjections(model) {
    if (isLayerModel(model) || isConcatModel(model)) {
        return assembleProjectionsForModelAndChildren(model);
    }
    else {
        return assembleProjectionForModel(model);
    }
}
function assembleProjectionsForModelAndChildren(model) {
    return model.children.reduce((projections, child) => {
        return projections.concat(child.assembleProjections());
    }, assembleProjectionForModel(model));
}
function assembleProjectionForModel(model) {
    const component = model.component.projection;
    if (!component || component.merged) {
        return [];
    }
    const projection = component.combine();
    const { name } = projection; // we need to extract name so that it is always present in the output and pass TS type validation
    if (!component.data) {
        // generate custom projection, no automatic fitting
        return [
            Object.assign(Object.assign({ name }, { translate: { signal: '[width / 2, height / 2]' } }), projection)
        ];
    }
    else {
        // generate projection that uses extent fitting
        const size = {
            signal: `[${component.size.map(ref => ref.signal).join(', ')}]`
        };
        const fits = component.data.reduce((sources, data) => {
            const source = isSignalRef(data) ? data.signal : `data('${model.lookupDataSource(data)}')`;
            if (!contains(sources, source)) {
                // build a unique list of sources
                sources.push(source);
            }
            return sources;
        }, []);
        if (fits.length <= 0) {
            throw new Error("Projection's fit didn't find any data sources");
        }
        return [
            Object.assign({ name,
                size, fit: {
                    signal: fits.length > 1 ? `[${fits.join(', ')}]` : fits[0]
                } }, projection)
        ];
    }
}
//# sourceMappingURL=assemble.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/projection.js
const PROJECTION_PROPERTIES = [
    'type',
    'clipAngle',
    'clipExtent',
    'center',
    'rotate',
    'precision',
    'reflectX',
    'reflectY',
    'coefficient',
    'distance',
    'fraction',
    'lobes',
    'parallel',
    'radius',
    'ratio',
    'spacing',
    'tilt'
];
//# sourceMappingURL=projection.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/projection/component.js

class ProjectionComponent extends Split {
    constructor(name, specifiedProjection, size, data) {
        super(Object.assign({}, specifiedProjection), // all explicit properties of projection
        { name } // name as initial implicit property
        );
        this.specifiedProjection = specifiedProjection;
        this.size = size;
        this.data = data;
        this.merged = false;
    }
    /**
     * Whether the projection parameters should fit provided data.
     */
    get isFit() {
        return !!this.data;
    }
}
//# sourceMappingURL=component.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/projection/parse.js










function parseProjection(model) {
    model.component.projection = isUnitModel(model) ? parseUnitProjection(model) : parseNonUnitProjections(model);
}
function parseUnitProjection(model) {
    var _a;
    if (model.hasProjection) {
        const proj = replaceExprRef(model.specifiedProjection);
        const fit = !(proj && (proj.scale != null || proj.translate != null));
        const size = fit ? [model.getSizeSignalRef('width'), model.getSizeSignalRef('height')] : undefined;
        const data = fit ? gatherFitData(model) : undefined;
        const projComp = new ProjectionComponent(model.projectionName(true), Object.assign(Object.assign({}, ((_a = replaceExprRef(model.config.projection)) !== null && _a !== void 0 ? _a : {})), (proj !== null && proj !== void 0 ? proj : {})), size, data);
        if (!projComp.get('type')) {
            projComp.set('type', 'equalEarth', false);
        }
        return projComp;
    }
    return undefined;
}
function gatherFitData(model) {
    const data = [];
    const { encoding } = model;
    for (const posssiblePair of [
        [LONGITUDE, LATITUDE],
        [LONGITUDE2, LATITUDE2]
    ]) {
        if (getFieldOrDatumDef(encoding[posssiblePair[0]]) || getFieldOrDatumDef(encoding[posssiblePair[1]])) {
            data.push({
                signal: model.getName(`geojson_${data.length}`)
            });
        }
    }
    if (model.channelHasField(SHAPE) && model.typedFieldDef(SHAPE).type === GEOJSON) {
        data.push({
            signal: model.getName(`geojson_${data.length}`)
        });
    }
    if (data.length === 0) {
        // main source is geojson, so we can just use that
        data.push(model.requestDataName(DataSourceType.Main));
    }
    return data;
}
function mergeIfNoConflict(first, second) {
    const allPropertiesShared = every(PROJECTION_PROPERTIES, prop => {
        // neither has the property
        if (!(0,vega_util_module/* hasOwnProperty */.mQ)(first.explicit, prop) && !(0,vega_util_module/* hasOwnProperty */.mQ)(second.explicit, prop)) {
            return true;
        }
        // both have property and an equal value for property
        if ((0,vega_util_module/* hasOwnProperty */.mQ)(first.explicit, prop) &&
            (0,vega_util_module/* hasOwnProperty */.mQ)(second.explicit, prop) &&
            // some properties might be signals or objects and require hashing for comparison
            deepEqual(first.get(prop), second.get(prop))) {
            return true;
        }
        return false;
    });
    const size = deepEqual(first.size, second.size);
    if (size) {
        if (allPropertiesShared) {
            return first;
        }
        else if (deepEqual(first.explicit, {})) {
            return second;
        }
        else if (deepEqual(second.explicit, {})) {
            return first;
        }
    }
    // if all properties don't match, let each unit spec have its own projection
    return null;
}
function parseNonUnitProjections(model) {
    if (model.children.length === 0) {
        return undefined;
    }
    let nonUnitProjection;
    // parse all children first
    for (const child of model.children) {
        parseProjection(child);
    }
    // analyze parsed projections, attempt to merge
    const mergable = every(model.children, child => {
        const projection = child.component.projection;
        if (!projection) {
            // child layer does not use a projection
            return true;
        }
        else if (!nonUnitProjection) {
            // cached 'projection' is null, cache this one
            nonUnitProjection = projection;
            return true;
        }
        else {
            const merge = mergeIfNoConflict(nonUnitProjection, projection);
            if (merge) {
                nonUnitProjection = merge;
            }
            return !!merge;
        }
    });
    // if cached one and all other children share the same projection,
    if (nonUnitProjection && mergable) {
        // so we can elevate it to the layer level
        const name = model.projectionName(true);
        const modelProjection = new ProjectionComponent(name, nonUnitProjection.specifiedProjection, nonUnitProjection.size, duplicate(nonUnitProjection.data));
        // rename and assign all others as merged
        for (const child of model.children) {
            const projection = child.component.projection;
            if (projection) {
                if (projection.isFit) {
                    modelProjection.data.push(...child.component.projection.data);
                }
                child.renameProjection(projection.get('name'), name);
                projection.merged = true;
            }
        }
        return modelProjection;
    }
    return undefined;
}
//# sourceMappingURL=parse.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/bin.js
var bin_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};








function rangeFormula(model, fieldDef, channel, config) {
    var _a, _b;
    if (binRequiresRange(fieldDef, channel)) {
        // read format from axis or legend, if there is no format then use config.numberFormat
        const guide = isUnitModel(model)
            ? (_b = (_a = model.axis(channel)) !== null && _a !== void 0 ? _a : model.legend(channel)) !== null && _b !== void 0 ? _b : {}
            : {};
        const startField = vgField(fieldDef, { expr: 'datum' });
        const endField = vgField(fieldDef, { expr: 'datum', binSuffix: 'end' });
        return {
            formulaAs: vgField(fieldDef, { binSuffix: 'range', forAs: true }),
            formula: binFormatExpression(startField, endField, guide.format, guide.formatType, config)
        };
    }
    return {};
}
function binKey(bin, field) {
    return `${binToString(bin)}_${field}`;
}
function getSignalsFromModel(model, key) {
    return {
        signal: model.getName(`${key}_bins`),
        extentSignal: model.getName(`${key}_extent`)
    };
}
function getBinSignalName(model, field, bin) {
    var _a;
    const normalizedBin = (_a = normalizeBin(bin, undefined)) !== null && _a !== void 0 ? _a : {};
    const key = binKey(normalizedBin, field);
    return model.getName(`${key}_bins`);
}
function isBinTransform(t) {
    return 'as' in t;
}
function createBinComponent(t, bin, model) {
    let as;
    let span;
    if (isBinTransform(t)) {
        as = (0,vega_util_module/* isString */.Kg)(t.as) ? [t.as, `${t.as}_end`] : [t.as[0], t.as[1]];
    }
    else {
        as = [vgField(t, { forAs: true }), vgField(t, { binSuffix: 'end', forAs: true })];
    }
    const normalizedBin = Object.assign({}, normalizeBin(bin, undefined));
    const key = binKey(normalizedBin, t.field);
    const { signal, extentSignal } = getSignalsFromModel(model, key);
    if (isParameterExtent(normalizedBin.extent)) {
        const ext = normalizedBin.extent;
        span = parseSelectionExtent(model, ext.param, ext);
        delete normalizedBin.extent; // Vega-Lite selection extent map to Vega's span property.
    }
    const binComponent = Object.assign(Object.assign(Object.assign({ bin: normalizedBin, field: t.field, as: [as] }, (signal ? { signal } : {})), (extentSignal ? { extentSignal } : {})), (span ? { span } : {}));
    return { key, binComponent };
}
class BinNode extends DataFlowNode {
    clone() {
        return new BinNode(null, duplicate(this.bins));
    }
    constructor(parent, bins) {
        super(parent);
        this.bins = bins;
    }
    static makeFromEncoding(parent, model) {
        const bins = model.reduceFieldDef((binComponentIndex, fieldDef, channel) => {
            if (isTypedFieldDef(fieldDef) && isBinning(fieldDef.bin)) {
                const { key, binComponent } = createBinComponent(fieldDef, fieldDef.bin, model);
                binComponentIndex[key] = Object.assign(Object.assign(Object.assign({}, binComponent), binComponentIndex[key]), rangeFormula(model, fieldDef, channel, model.config));
            }
            return binComponentIndex;
        }, {});
        if (isEmpty(bins)) {
            return null;
        }
        return new BinNode(parent, bins);
    }
    /**
     * Creates a bin node from BinTransform.
     * The optional parameter should provide
     */
    static makeFromTransform(parent, t, model) {
        const { key, binComponent } = createBinComponent(t, t.bin, model);
        return new BinNode(parent, {
            [key]: binComponent
        });
    }
    /**
     * Merge bin nodes. This method either integrates the bin config from the other node
     * or if this node already has a bin config, renames the corresponding signal in the model.
     */
    merge(other, renameSignal) {
        for (const key of keys(other.bins)) {
            if (key in this.bins) {
                renameSignal(other.bins[key].signal, this.bins[key].signal);
                // Ensure that we don't have duplicate names for signal pairs
                this.bins[key].as = unique([...this.bins[key].as, ...other.bins[key].as], hash);
            }
            else {
                this.bins[key] = other.bins[key];
            }
        }
        for (const child of other.children) {
            other.removeChild(child);
            child.parent = this;
        }
        other.remove();
    }
    producedFields() {
        return new Set(vals(this.bins)
            .map(c => c.as)
            .flat(2));
    }
    dependentFields() {
        return new Set(vals(this.bins).map(c => c.field));
    }
    hash() {
        return `Bin ${hash(this.bins)}`;
    }
    assemble() {
        return vals(this.bins).flatMap(bin => {
            const transform = [];
            const [binAs, ...remainingAs] = bin.as;
            const _a = bin.bin, { extent } = _a, params = bin_rest(_a, ["extent"]);
            const binTrans = Object.assign(Object.assign(Object.assign({ type: 'bin', field: replacePathInField(bin.field), as: binAs, signal: bin.signal }, (!isParameterExtent(extent) ? { extent } : { extent: null })), (bin.span ? { span: { signal: `span(${bin.span})` } } : {})), params);
            if (!extent && bin.extentSignal) {
                transform.push({
                    type: 'extent',
                    field: replacePathInField(bin.field),
                    signal: bin.extentSignal
                });
                binTrans.extent = { signal: bin.extentSignal };
            }
            transform.push(binTrans);
            for (const as of remainingAs) {
                for (let i = 0; i < 2; i++) {
                    transform.push({
                        type: 'formula',
                        expr: vgField({ field: binAs[i] }, { expr: 'datum' }),
                        as: as[i]
                    });
                }
            }
            if (bin.formula) {
                transform.push({
                    type: 'formula',
                    expr: bin.formula,
                    as: bin.formulaAs
                });
            }
            return transform;
        });
    }
}
//# sourceMappingURL=bin.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/aggregate.js








function addDimension(dims, channel, fieldDef, model) {
    var _a;
    const channelDef2 = isUnitModel(model) ? model.encoding[getSecondaryRangeChannel(channel)] : undefined;
    if (isTypedFieldDef(fieldDef) &&
        isUnitModel(model) &&
        hasBandEnd(fieldDef, channelDef2, model.markDef, model.config)) {
        dims.add(vgField(fieldDef, {}));
        dims.add(vgField(fieldDef, { suffix: 'end' }));
        if (fieldDef.bin && binRequiresRange(fieldDef, channel)) {
            dims.add(vgField(fieldDef, { binSuffix: 'range' }));
        }
    }
    else if (isGeoPositionChannel(channel)) {
        const posChannel = getPositionChannelFromLatLong(channel);
        dims.add(model.getName(posChannel));
    }
    else {
        dims.add(vgField(fieldDef));
    }
    if (isScaleFieldDef(fieldDef) && isFieldRange((_a = fieldDef.scale) === null || _a === void 0 ? void 0 : _a.range)) {
        dims.add(fieldDef.scale.range.field);
    }
    return dims;
}
function mergeMeasures(parentMeasures, childMeasures) {
    var _a;
    for (const field of keys(childMeasures)) {
        // when we merge a measure, we either have to add an aggregation operator or even a new field
        const ops = childMeasures[field];
        for (const op of keys(ops)) {
            if (field in parentMeasures) {
                // add operator to existing measure field
                parentMeasures[field][op] = new Set([...((_a = parentMeasures[field][op]) !== null && _a !== void 0 ? _a : []), ...ops[op]]);
            }
            else {
                parentMeasures[field] = { [op]: ops[op] };
            }
        }
    }
}
class AggregateNode extends DataFlowNode {
    clone() {
        return new AggregateNode(null, new Set(this.dimensions), duplicate(this.measures));
    }
    /**
     * @param dimensions string set for dimensions
     * @param measures dictionary mapping field name => dict of aggregation functions and names to use
     */
    constructor(parent, dimensions, measures) {
        super(parent);
        this.dimensions = dimensions;
        this.measures = measures;
    }
    get groupBy() {
        return this.dimensions;
    }
    static makeFromEncoding(parent, model) {
        let isAggregate = false;
        model.forEachFieldDef(fd => {
            if (fd.aggregate) {
                isAggregate = true;
            }
        });
        const meas = {};
        const dims = new Set();
        if (!isAggregate) {
            // no need to create this node if the model has no aggregation
            return null;
        }
        model.forEachFieldDef((fieldDef, channel) => {
            var _a, _b, _c, _d;
            const { aggregate, field } = fieldDef;
            if (aggregate) {
                if (aggregate === 'count') {
                    (_a = meas['*']) !== null && _a !== void 0 ? _a : (meas['*'] = {});
                    meas['*']['count'] = new Set([vgField(fieldDef, { forAs: true })]);
                }
                else {
                    if (isArgminDef(aggregate) || isArgmaxDef(aggregate)) {
                        const op = isArgminDef(aggregate) ? 'argmin' : 'argmax';
                        const argField = aggregate[op];
                        (_b = meas[argField]) !== null && _b !== void 0 ? _b : (meas[argField] = {});
                        meas[argField][op] = new Set([vgField({ op, field: argField }, { forAs: true })]);
                    }
                    else {
                        (_c = meas[field]) !== null && _c !== void 0 ? _c : (meas[field] = {});
                        meas[field][aggregate] = new Set([vgField(fieldDef, { forAs: true })]);
                    }
                    // For scale channel with domain === 'unaggregated', add min/max so we can use their union as unaggregated domain
                    if (isScaleChannel(channel) && model.scaleDomain(channel) === 'unaggregated') {
                        (_d = meas[field]) !== null && _d !== void 0 ? _d : (meas[field] = {});
                        meas[field]['min'] = new Set([vgField({ field, aggregate: 'min' }, { forAs: true })]);
                        meas[field]['max'] = new Set([vgField({ field, aggregate: 'max' }, { forAs: true })]);
                    }
                }
            }
            else {
                addDimension(dims, channel, fieldDef, model);
            }
        });
        if (dims.size + keys(meas).length === 0) {
            return null;
        }
        return new AggregateNode(parent, dims, meas);
    }
    static makeFromTransform(parent, t) {
        var _a, _b, _c;
        const dims = new Set();
        const meas = {};
        for (const s of t.aggregate) {
            const { op, field, as } = s;
            if (op) {
                if (op === 'count') {
                    (_a = meas['*']) !== null && _a !== void 0 ? _a : (meas['*'] = {});
                    meas['*']['count'] = new Set([as ? as : vgField(s, { forAs: true })]);
                }
                else {
                    (_b = meas[field]) !== null && _b !== void 0 ? _b : (meas[field] = {});
                    meas[field][op] = new Set([as ? as : vgField(s, { forAs: true })]);
                }
            }
        }
        for (const s of (_c = t.groupby) !== null && _c !== void 0 ? _c : []) {
            dims.add(s);
        }
        if (dims.size + keys(meas).length === 0) {
            return null;
        }
        return new AggregateNode(parent, dims, meas);
    }
    merge(other) {
        if (setEqual(this.dimensions, other.dimensions)) {
            mergeMeasures(this.measures, other.measures);
            return true;
        }
        debug('different dimensions, cannot merge');
        return false;
    }
    addDimensions(fields) {
        fields.forEach(this.dimensions.add, this.dimensions);
    }
    dependentFields() {
        return new Set([...this.dimensions, ...keys(this.measures)]);
    }
    producedFields() {
        const out = new Set();
        for (const field of keys(this.measures)) {
            for (const op of keys(this.measures[field])) {
                const m = this.measures[field][op];
                if (m.size === 0) {
                    out.add(`${op}_${field}`);
                }
                else {
                    m.forEach(out.add, out);
                }
            }
        }
        return out;
    }
    hash() {
        return `Aggregate ${hash({ dimensions: this.dimensions, measures: this.measures })}`;
    }
    assemble() {
        const ops = [];
        const fields = [];
        const as = [];
        for (const field of keys(this.measures)) {
            for (const op of keys(this.measures[field])) {
                for (const alias of this.measures[field][op]) {
                    as.push(alias);
                    ops.push(op);
                    fields.push(field === '*' ? null : replacePathInField(field));
                }
            }
        }
        const result = {
            type: 'aggregate',
            groupby: [...this.dimensions].map(replacePathInField),
            ops,
            fields,
            as
        };
        return result;
    }
}
//# sourceMappingURL=aggregate.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/facet.js













/**
 * A node that helps us track what fields we are faceting by.
 */
class FacetNode extends DataFlowNode {
    /**
     * @param model The facet model.
     * @param name The name that this facet source will have.
     * @param data The source data for this facet data.
     */
    constructor(parent, model, name, data) {
        super(parent);
        this.model = model;
        this.name = name;
        this.data = data;
        for (const channel of FACET_CHANNELS) {
            const fieldDef = model.facet[channel];
            if (fieldDef) {
                const { bin, sort } = fieldDef;
                this[channel] = Object.assign({ name: model.getName(`${channel}_domain`), fields: [vgField(fieldDef), ...(isBinning(bin) ? [vgField(fieldDef, { binSuffix: 'end' })] : [])] }, (isSortField(sort)
                    ? { sortField: sort }
                    : (0,vega_util_module/* isArray */.cy)(sort)
                        ? { sortIndexField: sortArrayIndexField(fieldDef, channel) }
                        : {}));
            }
        }
        this.childModel = model.child;
    }
    hash() {
        let out = `Facet`;
        for (const channel of FACET_CHANNELS) {
            if (this[channel]) {
                out += ` ${channel.charAt(0)}:${hash(this[channel])}`;
            }
        }
        return out;
    }
    get fields() {
        var _a;
        const f = [];
        for (const channel of FACET_CHANNELS) {
            if ((_a = this[channel]) === null || _a === void 0 ? void 0 : _a.fields) {
                f.push(...this[channel].fields);
            }
        }
        return f;
    }
    dependentFields() {
        const depFields = new Set(this.fields);
        for (const channel of FACET_CHANNELS) {
            if (this[channel]) {
                if (this[channel].sortField) {
                    depFields.add(this[channel].sortField.field);
                }
                if (this[channel].sortIndexField) {
                    depFields.add(this[channel].sortIndexField);
                }
            }
        }
        return depFields;
    }
    producedFields() {
        return new Set(); // facet does not produce any new fields
    }
    /**
     * The name to reference this source is its name.
     */
    getSource() {
        return this.name;
    }
    getChildIndependentFieldsWithStep() {
        const childIndependentFieldsWithStep = {};
        for (const channel of POSITION_SCALE_CHANNELS) {
            const childScaleComponent = this.childModel.component.scales[channel];
            if (childScaleComponent && !childScaleComponent.merged) {
                // independent scale
                const type = childScaleComponent.get('type');
                const range = childScaleComponent.get('range');
                if (hasDiscreteDomain(type) && isVgRangeStep(range)) {
                    const domain = assembleDomain(this.childModel, channel);
                    const field = getFieldFromDomain(domain);
                    if (field) {
                        childIndependentFieldsWithStep[channel] = field;
                    }
                    else {
                        warn(unknownField(channel));
                    }
                }
            }
        }
        return childIndependentFieldsWithStep;
    }
    assembleRowColumnHeaderData(channel, crossedDataName, childIndependentFieldsWithStep) {
        const childChannel = { row: 'y', column: 'x', facet: undefined }[channel];
        const fields = [];
        const ops = [];
        const as = [];
        if (childChannel && childIndependentFieldsWithStep && childIndependentFieldsWithStep[childChannel]) {
            if (crossedDataName) {
                // If there is a crossed data, calculate max
                fields.push(`distinct_${childIndependentFieldsWithStep[childChannel]}`);
                ops.push('max');
            }
            else {
                // If there is no crossed data, just calculate distinct
                fields.push(childIndependentFieldsWithStep[childChannel]);
                ops.push('distinct');
            }
            // Although it is technically a max, just name it distinct so it's easier to refer to it
            as.push(`distinct_${childIndependentFieldsWithStep[childChannel]}`);
        }
        const { sortField, sortIndexField } = this[channel];
        if (sortField) {
            const { op = DEFAULT_SORT_OP, field } = sortField;
            fields.push(field);
            ops.push(op);
            as.push(vgField(sortField, { forAs: true }));
        }
        else if (sortIndexField) {
            fields.push(sortIndexField);
            ops.push('max');
            as.push(sortIndexField);
        }
        return {
            name: this[channel].name,
            // Use data from the crossed one if it exist
            source: crossedDataName !== null && crossedDataName !== void 0 ? crossedDataName : this.data,
            transform: [
                Object.assign({ type: 'aggregate', groupby: this[channel].fields }, (fields.length
                    ? {
                        fields,
                        ops,
                        as
                    }
                    : {}))
            ]
        };
    }
    assembleFacetHeaderData(childIndependentFieldsWithStep) {
        var _a, _b;
        const { columns } = this.model.layout;
        const { layoutHeaders } = this.model.component;
        const data = [];
        const hasSharedAxis = {};
        for (const headerChannel of HEADER_CHANNELS) {
            for (const headerType of HEADER_TYPES) {
                const headers = (_a = (layoutHeaders[headerChannel] && layoutHeaders[headerChannel][headerType])) !== null && _a !== void 0 ? _a : [];
                for (const header of headers) {
                    if (((_b = header.axes) === null || _b === void 0 ? void 0 : _b.length) > 0) {
                        hasSharedAxis[headerChannel] = true;
                        break;
                    }
                }
            }
            if (hasSharedAxis[headerChannel]) {
                const cardinality = `length(data("${this.facet.name}"))`;
                const stop = headerChannel === 'row'
                    ? columns
                        ? { signal: `ceil(${cardinality} / ${columns})` }
                        : 1
                    : columns
                        ? { signal: `min(${cardinality}, ${columns})` }
                        : { signal: cardinality };
                data.push({
                    name: `${this.facet.name}_${headerChannel}`,
                    transform: [
                        {
                            type: 'sequence',
                            start: 0,
                            stop
                        }
                    ]
                });
            }
        }
        const { row, column } = hasSharedAxis;
        if (row || column) {
            data.unshift(this.assembleRowColumnHeaderData('facet', null, childIndependentFieldsWithStep));
        }
        return data;
    }
    assemble() {
        var _a, _b;
        const data = [];
        let crossedDataName = null;
        const childIndependentFieldsWithStep = this.getChildIndependentFieldsWithStep();
        const { column, row, facet } = this;
        if (column && row && (childIndependentFieldsWithStep.x || childIndependentFieldsWithStep.y)) {
            // Need to create a cross dataset to correctly calculate cardinality
            crossedDataName = `cross_${this.column.name}_${this.row.name}`;
            const fields = [].concat((_a = childIndependentFieldsWithStep.x) !== null && _a !== void 0 ? _a : [], (_b = childIndependentFieldsWithStep.y) !== null && _b !== void 0 ? _b : []);
            const ops = fields.map(() => 'distinct');
            data.push({
                name: crossedDataName,
                source: this.data,
                transform: [
                    {
                        type: 'aggregate',
                        groupby: this.fields,
                        fields,
                        ops
                    }
                ]
            });
        }
        for (const channel of [COLUMN, ROW]) {
            if (this[channel]) {
                data.push(this.assembleRowColumnHeaderData(channel, crossedDataName, childIndependentFieldsWithStep));
            }
        }
        if (facet) {
            const facetData = this.assembleFacetHeaderData(childIndependentFieldsWithStep);
            if (facetData) {
                data.push(...facetData);
            }
        }
        return data;
    }
}
//# sourceMappingURL=facet.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/formatparse.js
















/**
 * Remove quotes from a string.
 */
function unquote(pattern) {
    if ((pattern.startsWith("'") && pattern.endsWith("'")) || (pattern.startsWith('"') && pattern.endsWith('"'))) {
        return pattern.slice(1, -1);
    }
    return pattern;
}
/**
 * @param field The field.
 * @param parse What to parse the field as.
 */
function formatparse_parseExpression(field, parse) {
    const f = accessPathWithDatum(field);
    if (parse === 'number') {
        return `toNumber(${f})`;
    }
    else if (parse === 'boolean') {
        return `toBoolean(${f})`;
    }
    else if (parse === 'string') {
        return `toString(${f})`;
    }
    else if (parse === 'date') {
        return `toDate(${f})`;
    }
    else if (parse === 'flatten') {
        return f;
    }
    else if (parse.startsWith('date:')) {
        const specifier = unquote(parse.slice(5, parse.length));
        return `timeParse(${f},'${specifier}')`;
    }
    else if (parse.startsWith('utc:')) {
        const specifier = unquote(parse.slice(4, parse.length));
        return `utcParse(${f},'${specifier}')`;
    }
    else {
        warn(unrecognizedParse(parse));
        return null;
    }
}
function getImplicitFromFilterTransform(transform) {
    const implicit = {};
    forEachLeaf(transform.filter, filter => {
        var _a;
        if (isFieldPredicate(filter)) {
            // Automatically add a parse node for filters with filter objects
            let val = null;
            // For EqualFilter, just use the equal property.
            // For RangeFilter and OneOfFilter, all array members should have
            // the same type, so we only use the first one.
            if (isFieldEqualPredicate(filter)) {
                val = signalRefOrValue(filter.equal);
            }
            else if (isFieldLTEPredicate(filter)) {
                val = signalRefOrValue(filter.lte);
            }
            else if (isFieldLTPredicate(filter)) {
                val = signalRefOrValue(filter.lt);
            }
            else if (isFieldGTPredicate(filter)) {
                val = signalRefOrValue(filter.gt);
            }
            else if (isFieldGTEPredicate(filter)) {
                val = signalRefOrValue(filter.gte);
            }
            else if (isFieldRangePredicate(filter)) {
                val = filter.range[0];
            }
            else if (isFieldOneOfPredicate(filter)) {
                val = ((_a = filter.oneOf) !== null && _a !== void 0 ? _a : filter['in'])[0];
            } // else -- for filter expression, we can't infer anything
            if (val) {
                if (isDateTime(val)) {
                    implicit[filter.field] = 'date';
                }
                else if ((0,vega_util_module/* isNumber */.Et)(val)) {
                    implicit[filter.field] = 'number';
                }
                else if ((0,vega_util_module/* isString */.Kg)(val)) {
                    implicit[filter.field] = 'string';
                }
            }
            if (filter.timeUnit) {
                implicit[filter.field] = 'date';
            }
        }
    });
    return implicit;
}
/**
 * Creates a parse node for implicit parsing from a model and updates ancestorParse.
 */
function getImplicitFromEncoding(model) {
    const implicit = {};
    function add(fieldDef) {
        if (isFieldOrDatumDefForTimeFormat(fieldDef)) {
            implicit[fieldDef.field] = 'date';
        }
        else if (fieldDef.type === 'quantitative' &&
            isMinMaxOp(fieldDef.aggregate) // we need to parse numbers to support correct min and max
        ) {
            implicit[fieldDef.field] = 'number';
        }
        else if (accessPathDepth(fieldDef.field) > 1) {
            // For non-date/non-number (strings and booleans), derive a flattened field for a referenced nested field.
            // (Parsing numbers / dates already flattens numeric and temporal fields.)
            if (!(fieldDef.field in implicit)) {
                implicit[fieldDef.field] = 'flatten';
            }
        }
        else if (isScaleFieldDef(fieldDef) && isSortField(fieldDef.sort) && accessPathDepth(fieldDef.sort.field) > 1) {
            // Flatten fields that we sort by but that are not otherwise flattened.
            if (!(fieldDef.sort.field in implicit)) {
                implicit[fieldDef.sort.field] = 'flatten';
            }
        }
    }
    if (isUnitModel(model) || isFacetModel(model)) {
        // Parse encoded fields
        model.forEachFieldDef((fieldDef, channel) => {
            if (isTypedFieldDef(fieldDef)) {
                add(fieldDef);
            }
            else {
                const mainChannel = getMainRangeChannel(channel);
                const mainFieldDef = model.fieldDef(mainChannel);
                add(Object.assign(Object.assign({}, fieldDef), { type: mainFieldDef.type }));
            }
        });
    }
    // Parse quantitative dimension fields of path marks as numbers so that we sort them correctly.
    if (isUnitModel(model)) {
        const { mark, markDef, encoding } = model;
        if (isPathMark(mark) &&
            // No need to sort by dimension if we have a connected scatterplot (order channel is present)
            !model.encoding.order) {
            const dimensionChannel = markDef.orient === 'horizontal' ? 'y' : 'x';
            const dimensionChannelDef = encoding[dimensionChannel];
            if (isFieldDef(dimensionChannelDef) &&
                dimensionChannelDef.type === 'quantitative' &&
                !(dimensionChannelDef.field in implicit)) {
                implicit[dimensionChannelDef.field] = 'number';
            }
        }
    }
    return implicit;
}
/**
 * Creates a parse node for implicit parsing from a model and updates ancestorParse.
 */
function getImplicitFromSelection(model) {
    const implicit = {};
    if (isUnitModel(model) && model.component.selection) {
        for (const name of keys(model.component.selection)) {
            const selCmpt = model.component.selection[name];
            for (const proj of selCmpt.project.items) {
                if (!proj.channel && accessPathDepth(proj.field) > 1) {
                    implicit[proj.field] = 'flatten';
                }
            }
        }
    }
    return implicit;
}
class ParseNode extends DataFlowNode {
    clone() {
        return new ParseNode(null, duplicate(this._parse));
    }
    constructor(parent, parse) {
        super(parent);
        this._parse = parse;
    }
    hash() {
        return `Parse ${hash(this._parse)}`;
    }
    /**
     * Creates a parse node from a data.format.parse and updates ancestorParse.
     */
    static makeExplicit(parent, model, ancestorParse) {
        var _a;
        // Custom parse
        let explicit = {};
        const data = model.data;
        if (!isGenerator(data) && ((_a = data === null || data === void 0 ? void 0 : data.format) === null || _a === void 0 ? void 0 : _a.parse)) {
            explicit = data.format.parse;
        }
        return this.makeWithAncestors(parent, explicit, {}, ancestorParse);
    }
    /**
     * Creates a parse node from "explicit" parse and "implicit" parse and updates ancestorParse.
     */
    static makeWithAncestors(parent, explicit, implicit, ancestorParse) {
        // We should not parse what has already been parsed in a parent (explicitly or implicitly) or what has been derived (maked as "derived"). We also don't need to flatten a field that has already been parsed.
        for (const field of keys(implicit)) {
            const parsedAs = ancestorParse.getWithExplicit(field);
            if (parsedAs.value !== undefined) {
                // We always ignore derived fields even if they are implicitly defined because we expect users to create the right types.
                if (parsedAs.explicit ||
                    parsedAs.value === implicit[field] ||
                    parsedAs.value === 'derived' ||
                    implicit[field] === 'flatten') {
                    delete implicit[field];
                }
                else {
                    warn(differentParse(field, implicit[field], parsedAs.value));
                }
            }
        }
        for (const field of keys(explicit)) {
            const parsedAs = ancestorParse.get(field);
            if (parsedAs !== undefined) {
                // Don't parse a field again if it has been parsed with the same type already.
                if (parsedAs === explicit[field]) {
                    delete explicit[field];
                }
                else {
                    warn(differentParse(field, explicit[field], parsedAs));
                }
            }
        }
        const parse = new Split(explicit, implicit);
        // add the format parse from this model so that children don't parse the same field again
        ancestorParse.copyAll(parse);
        // copy only non-null parses
        const p = {};
        for (const key of keys(parse.combine())) {
            const val = parse.get(key);
            if (val !== null) {
                p[key] = val;
            }
        }
        if (keys(p).length === 0 || ancestorParse.parseNothing) {
            return null;
        }
        return new ParseNode(parent, p);
    }
    get parse() {
        return this._parse;
    }
    merge(other) {
        this._parse = Object.assign(Object.assign({}, this._parse), other.parse);
        other.remove();
    }
    /**
     * Assemble an object for Vega's format.parse property.
     */
    assembleFormatParse() {
        const formatParse = {};
        for (const field of keys(this._parse)) {
            const p = this._parse[field];
            if (accessPathDepth(field) === 1) {
                formatParse[field] = p;
            }
        }
        return formatParse;
    }
    // format parse depends and produces all fields in its parse
    producedFields() {
        return new Set(keys(this._parse));
    }
    dependentFields() {
        return new Set(keys(this._parse));
    }
    assembleTransforms(onlyNested = false) {
        return keys(this._parse)
            .filter(field => (onlyNested ? accessPathDepth(field) > 1 : true))
            .map(field => {
            const expr = formatparse_parseExpression(field, this._parse[field]);
            if (!expr) {
                return null;
            }
            const formula = {
                type: 'formula',
                expr,
                as: removePathFromField(field) // Vega output is always flattened
            };
            return formula;
        })
            .filter(t => t !== null);
    }
}
//# sourceMappingURL=formatparse.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/identifier.js


class IdentifierNode extends DataFlowNode {
    clone() {
        return new IdentifierNode(null);
    }
    constructor(parent) {
        super(parent);
    }
    dependentFields() {
        return new Set();
    }
    producedFields() {
        return new Set([SELECTION_ID]);
    }
    hash() {
        return 'Identifier';
    }
    assemble() {
        return { type: 'identifier', as: SELECTION_ID };
    }
}
//# sourceMappingURL=identifier.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/graticule.js


class GraticuleNode extends DataFlowNode {
    clone() {
        return new GraticuleNode(null, this.params);
    }
    constructor(parent, params) {
        super(parent);
        this.params = params;
    }
    dependentFields() {
        return new Set();
    }
    producedFields() {
        return undefined; // there should never be a node before graticule
    }
    hash() {
        return `Graticule ${hash(this.params)}`;
    }
    assemble() {
        return Object.assign({ type: 'graticule' }, (this.params === true ? {} : this.params));
    }
}
//# sourceMappingURL=graticule.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/sequence.js


class SequenceNode extends DataFlowNode {
    clone() {
        return new SequenceNode(null, this.params);
    }
    constructor(parent, params) {
        super(parent);
        this.params = params;
    }
    dependentFields() {
        return new Set();
    }
    producedFields() {
        var _a;
        return new Set([(_a = this.params.as) !== null && _a !== void 0 ? _a : 'data']);
    }
    hash() {
        return `Hash ${hash(this.params)}`;
    }
    assemble() {
        return Object.assign({ type: 'sequence' }, this.params);
    }
}
//# sourceMappingURL=sequence.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/source.js



class SourceNode extends DataFlowNode {
    constructor(data) {
        super(null); // source cannot have parent
        data !== null && data !== void 0 ? data : (data = { name: 'source' });
        let format;
        if (!isGenerator(data)) {
            format = data.format ? Object.assign({}, omit(data.format, ['parse'])) : {};
        }
        if (isInlineData(data)) {
            this._data = { values: data.values };
        }
        else if (isUrlData(data)) {
            this._data = { url: data.url };
            if (!format.type) {
                // Extract extension from URL using snippet from
                // http://stackoverflow.com/questions/680929/how-to-extract-extension-from-filename-string-in-javascript
                let defaultExtension = /(?:\.([^.]+))?$/.exec(data.url)[1];
                if (!contains(['json', 'csv', 'tsv', 'dsv', 'topojson'], defaultExtension)) {
                    defaultExtension = 'json';
                }
                // defaultExtension has type string but we ensure that it is DataFormatType above
                format.type = defaultExtension;
            }
        }
        else if (isSphereGenerator(data)) {
            // hardwire GeoJSON sphere data into output specification
            this._data = { values: [{ type: 'Sphere' }] };
        }
        else if (isNamedData(data) || isGenerator(data)) {
            this._data = {};
        }
        // set flag to check if generator
        this._generator = isGenerator(data);
        // any dataset can be named
        if (data.name) {
            this._name = data.name;
        }
        if (format && !isEmpty(format)) {
            this._data.format = format;
        }
    }
    dependentFields() {
        return new Set();
    }
    producedFields() {
        return undefined; // we don't know what this source produces
    }
    get data() {
        return this._data;
    }
    hasName() {
        return !!this._name;
    }
    get isGenerator() {
        return this._generator;
    }
    get dataName() {
        return this._name;
    }
    set dataName(name) {
        this._name = name;
    }
    set parent(parent) {
        throw new Error('Source nodes have to be roots.');
    }
    remove() {
        throw new Error('Source nodes are roots and cannot be removed.');
    }
    hash() {
        throw new Error('Cannot hash sources');
    }
    assemble() {
        return Object.assign(Object.assign({ name: this._name }, this._data), { transform: [] });
    }
}
//# sourceMappingURL=source.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/optimizer.js
var optimizer_classPrivateFieldSet = (undefined && undefined.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var optimizer_classPrivateFieldGet = (undefined && undefined.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Optimizer_modified;



/**
 * Whether this dataflow node is the source of the dataflow that produces data i.e. a source or a generator.
 */
function isDataSourceNode(node) {
    return node instanceof SourceNode || node instanceof GraticuleNode || node instanceof SequenceNode;
}
/**
 * Abstract base class for Dataflow optimizers.
 * Contains only mutation handling logic. Subclasses need to implement iteration logic.
 */
class Optimizer {
    constructor() {
        _Optimizer_modified.set(this, void 0);
        optimizer_classPrivateFieldSet(this, _Optimizer_modified, false, "f");
    }
    // Once true, #modified is never set to false
    setModified() {
        optimizer_classPrivateFieldSet(this, _Optimizer_modified, true, "f");
    }
    get modifiedFlag() {
        return optimizer_classPrivateFieldGet(this, _Optimizer_modified, "f");
    }
}
_Optimizer_modified = new WeakMap();
/**
 * Starts from a node and runs the optimization function (the "run" method) upwards to the root,
 * depending on the continue and modified flag values returned by the optimization function.
 */
class BottomUpOptimizer extends Optimizer {
    /**
     * Compute a map of node depths that we can use to determine a topological sort order.
     */
    getNodeDepths(node, depth, depths) {
        depths.set(node, depth);
        for (const child of node.children) {
            this.getNodeDepths(child, depth + 1, depths);
        }
        return depths;
    }
    /**
     * Run the optimizer on all nodes starting from the leaves.
     */
    optimize(node) {
        const depths = this.getNodeDepths(node, 0, new Map());
        const topologicalSort = [...depths.entries()].sort((a, b) => b[1] - a[1]);
        for (const tuple of topologicalSort) {
            this.run(tuple[0]);
        }
        return this.modifiedFlag;
    }
}
/**
 * The optimizer function (the "run" method), is invoked on the given node and then continues recursively.
 */
class TopDownOptimizer extends Optimizer {
    /**
     * Run the optimizer depth first on all nodes starting from the roots.
     */
    optimize(node) {
        this.run(node);
        for (const child of node.children) {
            this.optimize(child);
        }
        return this.modifiedFlag;
    }
}
//# sourceMappingURL=optimizer.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/optimizers.js












/**
 * Merge identical nodes at forks by comparing hashes.
 *
 * Does not need to iterate from leaves so we implement this with recursion as it's a bit simpler.
 */
class MergeIdenticalNodes extends TopDownOptimizer {
    mergeNodes(parent, nodes) {
        const mergedNode = nodes.shift();
        for (const node of nodes) {
            parent.removeChild(node);
            node.parent = mergedNode;
            node.remove();
        }
    }
    run(node) {
        const hashes = node.children.map(x => x.hash());
        const buckets = {};
        for (let i = 0; i < hashes.length; i++) {
            if (buckets[hashes[i]] === undefined) {
                buckets[hashes[i]] = [node.children[i]];
            }
            else {
                buckets[hashes[i]].push(node.children[i]);
            }
        }
        for (const k of keys(buckets)) {
            if (buckets[k].length > 1) {
                this.setModified();
                this.mergeNodes(node, buckets[k]);
            }
        }
    }
}
/**
 * Optimizer that removes identifier nodes that are not needed for selections.
 */
class RemoveUnnecessaryIdentifierNodes extends TopDownOptimizer {
    constructor(model) {
        super();
        this.requiresSelectionId = model && requiresSelectionId(model);
    }
    run(node) {
        if (node instanceof IdentifierNode) {
            // Only preserve IdentifierNodes if we have default discrete selections
            // in our model tree, and if the nodes come after tuple producing nodes.
            if (!(this.requiresSelectionId &&
                (isDataSourceNode(node.parent) || node.parent instanceof AggregateNode || node.parent instanceof ParseNode))) {
                this.setModified();
                node.remove();
            }
        }
    }
}
/**
 * Removes duplicate time unit nodes (as determined by the name of the output field) that may be generated due to
 * selections projected over time units. Only keeps the first time unit in any branch.
 *
 * This optimizer is a custom top down optimizer that keep track of produced fields in a branch.
 */
class RemoveDuplicateTimeUnits extends Optimizer {
    optimize(node) {
        this.run(node, new Set());
        return this.modifiedFlag;
    }
    run(node, timeUnitFields) {
        let producedFields = new Set();
        if (node instanceof TimeUnitNode) {
            producedFields = node.producedFields();
            if (hasIntersection(producedFields, timeUnitFields)) {
                this.setModified();
                node.removeFormulas(timeUnitFields);
                if (node.producedFields.length === 0) {
                    node.remove();
                }
            }
        }
        for (const child of node.children) {
            this.run(child, new Set([...timeUnitFields, ...producedFields]));
        }
    }
}
/**
 * Remove output nodes that are not required.
 */
class RemoveUnnecessaryOutputNodes extends TopDownOptimizer {
    constructor() {
        super();
    }
    run(node) {
        if (node instanceof OutputNode && !node.isRequired()) {
            this.setModified();
            node.remove();
        }
    }
}
/**
 * Move parse nodes up to forks and merges them if possible.
 */
class MoveParseUp extends BottomUpOptimizer {
    run(node) {
        if (isDataSourceNode(node)) {
            return;
        }
        if (node.numChildren() > 1) {
            // Don't move parse further up but continue with parent.
            return;
        }
        for (const child of node.children) {
            if (child instanceof ParseNode) {
                if (node instanceof ParseNode) {
                    this.setModified();
                    node.merge(child);
                }
                else {
                    // Don't swap with nodes that produce something that the parse node depends on (e.g. lookup).
                    if (fieldIntersection(node.producedFields(), child.dependentFields())) {
                        continue;
                    }
                    this.setModified();
                    child.swapWithParent();
                }
            }
        }
        return;
    }
}
/**
 * Inserts an intermediate ParseNode containing all non-conflicting parse fields and removes the empty ParseNodes.
 *
 * We assume that dependent paths that do not have a parse node can be just merged.
 */
class MergeParse extends BottomUpOptimizer {
    run(node) {
        const originalChildren = [...node.children];
        const parseChildren = node.children.filter((child) => child instanceof ParseNode);
        if (node.numChildren() > 1 && parseChildren.length >= 1) {
            const commonParse = {};
            const conflictingParse = new Set();
            for (const parseNode of parseChildren) {
                const parse = parseNode.parse;
                for (const k of keys(parse)) {
                    if (!(k in commonParse)) {
                        commonParse[k] = parse[k];
                    }
                    else if (commonParse[k] !== parse[k]) {
                        conflictingParse.add(k);
                    }
                }
            }
            for (const field of conflictingParse) {
                delete commonParse[field];
            }
            if (!isEmpty(commonParse)) {
                this.setModified();
                const mergedParseNode = new ParseNode(node, commonParse);
                for (const childNode of originalChildren) {
                    if (childNode instanceof ParseNode) {
                        for (const key of keys(commonParse)) {
                            delete childNode.parse[key];
                        }
                    }
                    node.removeChild(childNode);
                    childNode.parent = mergedParseNode;
                    // remove empty parse nodes
                    if (childNode instanceof ParseNode && keys(childNode.parse).length === 0) {
                        childNode.remove();
                    }
                }
            }
        }
    }
}
/**
 * Repeatedly remove leaf nodes that are not output or facet nodes.
 * The reason is that we don't need subtrees that don't have any output nodes.
 * Facet nodes are needed for the row or column domains.
 */
class RemoveUnusedSubtrees extends BottomUpOptimizer {
    run(node) {
        if (node instanceof OutputNode || node.numChildren() > 0 || node instanceof FacetNode) {
            // no need to continue with parent because it is output node or will have children (there was a fork)
        }
        else if (node instanceof SourceNode) {
            // ignore empty unused sources as they will be removed in optimizationDataflowHelper
        }
        else {
            this.setModified();
            node.remove();
        }
    }
}
/**
 * Merge adjacent time unit nodes.
 */
class MergeTimeUnits extends BottomUpOptimizer {
    run(node) {
        const timeUnitChildren = node.children.filter((x) => x instanceof TimeUnitNode);
        const combination = timeUnitChildren.pop();
        for (const timeUnit of timeUnitChildren) {
            this.setModified();
            combination.merge(timeUnit);
        }
    }
}
class MergeAggregates extends BottomUpOptimizer {
    run(node) {
        const aggChildren = node.children.filter((child) => child instanceof AggregateNode);
        // Object which we'll use to map the fields which an aggregate is grouped by to
        // the set of aggregates with that grouping. This is useful as only aggregates
        // with the same group by can be merged
        const groupedAggregates = {};
        // Build groupedAggregates
        for (const agg of aggChildren) {
            const groupBys = hash(agg.groupBy);
            if (!(groupBys in groupedAggregates)) {
                groupedAggregates[groupBys] = [];
            }
            groupedAggregates[groupBys].push(agg);
        }
        // Merge aggregateNodes with same key in groupedAggregates
        for (const group of keys(groupedAggregates)) {
            const mergeableAggs = groupedAggregates[group];
            if (mergeableAggs.length > 1) {
                const mergedAggs = mergeableAggs.pop();
                for (const agg of mergeableAggs) {
                    if (mergedAggs.merge(agg)) {
                        node.removeChild(agg);
                        agg.parent = mergedAggs;
                        agg.remove();
                        this.setModified();
                    }
                }
            }
        }
    }
}
/**
 * Merge bin nodes and move them up through forks. Stop at filters, parse, identifier as we want them to stay before the bin node.
 */
class MergeBins extends BottomUpOptimizer {
    constructor(model) {
        super();
        this.model = model;
    }
    run(node) {
        const moveBinsUp = !(isDataSourceNode(node) ||
            node instanceof FilterNode ||
            node instanceof ParseNode ||
            node instanceof IdentifierNode);
        const promotableBins = [];
        const remainingBins = [];
        for (const child of node.children) {
            if (child instanceof BinNode) {
                if (moveBinsUp && !fieldIntersection(node.producedFields(), child.dependentFields())) {
                    promotableBins.push(child);
                }
                else {
                    remainingBins.push(child);
                }
            }
        }
        if (promotableBins.length > 0) {
            const promotedBin = promotableBins.pop();
            for (const bin of promotableBins) {
                promotedBin.merge(bin, this.model.renameSignal.bind(this.model));
            }
            this.setModified();
            if (node instanceof BinNode) {
                node.merge(promotedBin, this.model.renameSignal.bind(this.model));
            }
            else {
                promotedBin.swapWithParent();
            }
        }
        if (remainingBins.length > 1) {
            const remainingBin = remainingBins.pop();
            for (const bin of remainingBins) {
                remainingBin.merge(bin, this.model.renameSignal.bind(this.model));
            }
            this.setModified();
        }
    }
}
/**
 * This optimizer takes output nodes that are at a fork and moves them before the fork.
 *
 * The algorithm iterates over the children and tries to find the last output node in a chain of output nodes.
 * It then moves all output nodes before that main output node. All other children (and the children of the output nodes)
 * are inserted after the main output node.
 */
class MergeOutputs extends BottomUpOptimizer {
    run(node) {
        const children = [...node.children];
        const hasOutputChild = some(children, child => child instanceof OutputNode);
        if (!hasOutputChild || node.numChildren() <= 1) {
            return;
        }
        const otherChildren = [];
        // The output node we will connect all other nodes to.
        // Output nodes will be added before the new node, other nodes after.
        let mainOutput;
        for (const child of children) {
            if (child instanceof OutputNode) {
                let lastOutput = child;
                while (lastOutput.numChildren() === 1) {
                    const [theChild] = lastOutput.children;
                    if (theChild instanceof OutputNode) {
                        lastOutput = theChild;
                    }
                    else {
                        break;
                    }
                }
                otherChildren.push(...lastOutput.children);
                if (mainOutput) {
                    // Move the output nodes before the mainOutput. We do this by setting
                    // the parent of the first not to the parent of the main output and
                    // the main output's parent to the last output.
                    // note: the child is the first output
                    node.removeChild(child);
                    child.parent = mainOutput.parent;
                    mainOutput.parent.removeChild(mainOutput);
                    mainOutput.parent = lastOutput;
                    this.setModified();
                }
                else {
                    mainOutput = lastOutput;
                }
            }
            else {
                otherChildren.push(child);
            }
        }
        if (otherChildren.length) {
            this.setModified();
            for (const child of otherChildren) {
                child.parent.removeChild(child);
                child.parent = mainOutput;
            }
        }
    }
}
//# sourceMappingURL=optimizers.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/joinaggregate.js




/**
 * A class for the join aggregate transform nodes.
 */
class JoinAggregateTransformNode extends DataFlowNode {
    clone() {
        return new JoinAggregateTransformNode(null, duplicate(this.transform));
    }
    constructor(parent, transform) {
        super(parent);
        this.transform = transform;
    }
    addDimensions(fields) {
        this.transform.groupby = unique(this.transform.groupby.concat(fields), d => d);
    }
    dependentFields() {
        const out = new Set();
        if (this.transform.groupby) {
            this.transform.groupby.forEach(out.add, out);
        }
        this.transform.joinaggregate
            .map(w => w.field)
            .filter(f => f !== undefined)
            .forEach(out.add, out);
        return out;
    }
    producedFields() {
        return new Set(this.transform.joinaggregate.map(this.getDefaultName));
    }
    getDefaultName(joinAggregateFieldDef) {
        var _a;
        return (_a = joinAggregateFieldDef.as) !== null && _a !== void 0 ? _a : vgField(joinAggregateFieldDef);
    }
    hash() {
        return `JoinAggregateTransform ${hash(this.transform)}`;
    }
    assemble() {
        const fields = [];
        const ops = [];
        const as = [];
        for (const joinaggregate of this.transform.joinaggregate) {
            ops.push(joinaggregate.op);
            as.push(this.getDefaultName(joinaggregate));
            fields.push(joinaggregate.field === undefined ? null : joinaggregate.field);
        }
        const groupby = this.transform.groupby;
        return Object.assign({ type: 'joinaggregate', as,
            ops,
            fields }, (groupby !== undefined ? { groupby } : {}));
    }
}
//# sourceMappingURL=joinaggregate.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/stack.js





function getStackByFields(model) {
    return model.stack.stackBy.reduce((fields, by) => {
        const fieldDef = by.fieldDef;
        const _field = vgField(fieldDef);
        if (_field) {
            fields.push(_field);
        }
        return fields;
    }, []);
}
function isValidAsArray(as) {
    return (0,vega_util_module/* isArray */.cy)(as) && as.every(s => (0,vega_util_module/* isString */.Kg)(s)) && as.length > 1;
}
class StackNode extends DataFlowNode {
    clone() {
        return new StackNode(null, duplicate(this._stack));
    }
    constructor(parent, stack) {
        super(parent);
        this._stack = stack;
    }
    static makeFromTransform(parent, stackTransform) {
        const { stack, groupby, as, offset = 'zero' } = stackTransform;
        const sortFields = [];
        const sortOrder = [];
        if (stackTransform.sort !== undefined) {
            for (const sortField of stackTransform.sort) {
                sortFields.push(sortField.field);
                sortOrder.push(getFirstDefined(sortField.order, 'ascending'));
            }
        }
        const sort = {
            field: sortFields,
            order: sortOrder
        };
        let normalizedAs;
        if (isValidAsArray(as)) {
            normalizedAs = as;
        }
        else if ((0,vega_util_module/* isString */.Kg)(as)) {
            normalizedAs = [as, `${as}_end`];
        }
        else {
            normalizedAs = [`${stackTransform.stack}_start`, `${stackTransform.stack}_end`];
        }
        return new StackNode(parent, {
            dimensionFieldDefs: [],
            stackField: stack,
            groupby,
            offset,
            sort,
            facetby: [],
            as: normalizedAs
        });
    }
    static makeFromEncoding(parent, model) {
        const stackProperties = model.stack;
        const { encoding } = model;
        if (!stackProperties) {
            return null;
        }
        const { groupbyChannels, fieldChannel, offset, impute } = stackProperties;
        const dimensionFieldDefs = groupbyChannels
            .map(groupbyChannel => {
            const cDef = encoding[groupbyChannel];
            return getFieldDef(cDef);
        })
            .filter(def => !!def);
        const stackby = getStackByFields(model);
        const orderDef = model.encoding.order;
        let sort;
        if ((0,vega_util_module/* isArray */.cy)(orderDef) || isFieldDef(orderDef)) {
            sort = sortParams(orderDef);
        }
        else {
            // default = descending by stackFields
            // FIXME is the default here correct for binned fields?
            sort = stackby.reduce((s, field) => {
                s.field.push(field);
                s.order.push(fieldChannel === 'y' ? 'descending' : 'ascending');
                return s;
            }, { field: [], order: [] });
        }
        return new StackNode(parent, {
            dimensionFieldDefs,
            stackField: model.vgField(fieldChannel),
            facetby: [],
            stackby,
            sort,
            offset,
            impute,
            as: [
                model.vgField(fieldChannel, { suffix: 'start', forAs: true }),
                model.vgField(fieldChannel, { suffix: 'end', forAs: true })
            ]
        });
    }
    get stack() {
        return this._stack;
    }
    addDimensions(fields) {
        this._stack.facetby.push(...fields);
    }
    dependentFields() {
        const out = new Set();
        out.add(this._stack.stackField);
        this.getGroupbyFields().forEach(out.add, out);
        this._stack.facetby.forEach(out.add, out);
        this._stack.sort.field.forEach(out.add, out);
        return out;
    }
    producedFields() {
        return new Set(this._stack.as);
    }
    hash() {
        return `Stack ${hash(this._stack)}`;
    }
    getGroupbyFields() {
        const { dimensionFieldDefs, impute, groupby } = this._stack;
        if (dimensionFieldDefs.length > 0) {
            return dimensionFieldDefs
                .map(dimensionFieldDef => {
                if (dimensionFieldDef.bin) {
                    if (impute) {
                        // For binned group by field with impute, we calculate bin_mid
                        // as we cannot impute two fields simultaneously
                        return [vgField(dimensionFieldDef, { binSuffix: 'mid' })];
                    }
                    return [
                        // For binned group by field without impute, we need both bin (start) and bin_end
                        vgField(dimensionFieldDef, {}),
                        vgField(dimensionFieldDef, { binSuffix: 'end' })
                    ];
                }
                return [vgField(dimensionFieldDef)];
            })
                .flat();
        }
        return groupby !== null && groupby !== void 0 ? groupby : [];
    }
    assemble() {
        const transform = [];
        const { facetby, dimensionFieldDefs, stackField: field, stackby, sort, offset, impute, as } = this._stack;
        // Impute
        if (impute) {
            for (const dimensionFieldDef of dimensionFieldDefs) {
                const { bandPosition = 0.5, bin } = dimensionFieldDef;
                if (bin) {
                    // As we can only impute one field at a time, we need to calculate
                    // mid point for a binned field
                    const binStart = vgField(dimensionFieldDef, { expr: 'datum' });
                    const binEnd = vgField(dimensionFieldDef, { expr: 'datum', binSuffix: 'end' });
                    transform.push({
                        type: 'formula',
                        expr: `${bandPosition}*${binStart}+${1 - bandPosition}*${binEnd}`,
                        as: vgField(dimensionFieldDef, { binSuffix: 'mid', forAs: true })
                    });
                }
                transform.push({
                    type: 'impute',
                    field,
                    groupby: [...stackby, ...facetby],
                    key: vgField(dimensionFieldDef, { binSuffix: 'mid' }),
                    method: 'value',
                    value: 0
                });
            }
        }
        // Stack
        transform.push({
            type: 'stack',
            groupby: [...this.getGroupbyFields(), ...facetby],
            field,
            sort,
            as,
            offset
        });
        return transform;
    }
}
//# sourceMappingURL=stack.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/window.js





/**
 * A class for the window transform nodes
 */
class WindowTransformNode extends DataFlowNode {
    clone() {
        return new WindowTransformNode(null, duplicate(this.transform));
    }
    constructor(parent, transform) {
        super(parent);
        this.transform = transform;
    }
    addDimensions(fields) {
        this.transform.groupby = unique(this.transform.groupby.concat(fields), d => d);
    }
    dependentFields() {
        var _a, _b;
        const out = new Set();
        ((_a = this.transform.groupby) !== null && _a !== void 0 ? _a : []).forEach(out.add, out);
        ((_b = this.transform.sort) !== null && _b !== void 0 ? _b : []).forEach(m => out.add(m.field));
        this.transform.window
            .map(w => w.field)
            .filter(f => f !== undefined)
            .forEach(out.add, out);
        return out;
    }
    producedFields() {
        return new Set(this.transform.window.map(this.getDefaultName));
    }
    getDefaultName(windowFieldDef) {
        var _a;
        return (_a = windowFieldDef.as) !== null && _a !== void 0 ? _a : vgField(windowFieldDef);
    }
    hash() {
        return `WindowTransform ${hash(this.transform)}`;
    }
    assemble() {
        var _a;
        const fields = [];
        const ops = [];
        const as = [];
        const params = [];
        for (const window of this.transform.window) {
            ops.push(window.op);
            as.push(this.getDefaultName(window));
            params.push(window.param === undefined ? null : window.param);
            fields.push(window.field === undefined ? null : window.field);
        }
        const frame = this.transform.frame;
        const groupby = this.transform.groupby;
        if (frame && frame[0] === null && frame[1] === null && ops.every(o => isAggregateOp(o))) {
            // when the window does not rely on any particular window ops or frame, switch to a simpler and more efficient joinaggregate
            return Object.assign({ type: 'joinaggregate', as, ops: ops, fields }, (groupby !== undefined ? { groupby } : {}));
        }
        const sortFields = [];
        const sortOrder = [];
        if (this.transform.sort !== undefined) {
            for (const sortField of this.transform.sort) {
                sortFields.push(sortField.field);
                sortOrder.push((_a = sortField.order) !== null && _a !== void 0 ? _a : 'ascending');
            }
        }
        const sort = {
            field: sortFields,
            order: sortOrder
        };
        const ignorePeers = this.transform.ignorePeers;
        return Object.assign(Object.assign(Object.assign({ type: 'window', params,
            as,
            ops,
            fields,
            sort }, (ignorePeers !== undefined ? { ignorePeers } : {})), (groupby !== undefined ? { groupby } : {})), (frame !== undefined ? { frame } : {}));
    }
}
//# sourceMappingURL=window.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/subtree.js








/**
 * Clones the subtree and ignores output nodes except for the leaves, which are renamed.
 */
function cloneSubtree(facet) {
    function clone(node) {
        if (!(node instanceof FacetNode)) {
            const copy = node.clone();
            if (copy instanceof OutputNode) {
                const newName = FACET_SCALE_PREFIX + copy.getSource();
                copy.setSource(newName);
                facet.model.component.data.outputNodes[newName] = copy;
            }
            else if (copy instanceof AggregateNode ||
                copy instanceof StackNode ||
                copy instanceof WindowTransformNode ||
                copy instanceof JoinAggregateTransformNode) {
                copy.addDimensions(facet.fields);
            }
            for (const n of node.children.flatMap(clone)) {
                n.parent = copy;
            }
            return [copy];
        }
        return node.children.flatMap(clone);
    }
    return clone;
}
/**
 * Move facet nodes down to the next fork or output node. Also pull the main output with the facet node.
 * After moving down the facet node, make a copy of the subtree and make it a child of the main output.
 */
function moveFacetDown(node) {
    if (node instanceof FacetNode) {
        if (node.numChildren() === 1 && !(node.children[0] instanceof OutputNode)) {
            // move down until we hit a fork or output node
            const child = node.children[0];
            if (child instanceof AggregateNode ||
                child instanceof StackNode ||
                child instanceof WindowTransformNode ||
                child instanceof JoinAggregateTransformNode) {
                child.addDimensions(node.fields);
            }
            child.swapWithParent();
            moveFacetDown(node);
        }
        else {
            // move main to facet
            const facetMain = node.model.component.data.main;
            moveMainDownToFacet(facetMain);
            // replicate the subtree and place it before the facet's main node
            const cloner = cloneSubtree(node);
            const copy = node.children.map(cloner).flat();
            for (const c of copy) {
                c.parent = facetMain;
            }
        }
    }
    else {
        node.children.map(moveFacetDown);
    }
}
function moveMainDownToFacet(node) {
    if (node instanceof OutputNode && node.type === DataSourceType.Main) {
        if (node.numChildren() === 1) {
            const child = node.children[0];
            if (!(child instanceof FacetNode)) {
                child.swapWithParent();
                moveMainDownToFacet(node);
            }
        }
    }
}
//# sourceMappingURL=subtree.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/optimize.js



const FACET_SCALE_PREFIX = 'scale_';
const MAX_OPTIMIZATION_RUNS = 5;
/**
 * Iterates over a dataflow graph and checks whether all links are consistent.
 */
function checkLinks(nodes) {
    for (const node of nodes) {
        for (const child of node.children) {
            if (child.parent !== node) {
                // log.error('Dataflow graph is inconsistent.', node, child);
                return false;
            }
        }
        if (!checkLinks(node.children)) {
            return false;
        }
    }
    return true;
}
/**
 * Run the specified optimizer on the provided nodes.
 *
 * @param optimizer The optimizer instance to run.
 * @param nodes A set of nodes to optimize.
 */
function runOptimizer(optimizer, nodes) {
    let modified = false;
    for (const node of nodes) {
        modified = optimizer.optimize(node) || modified;
    }
    return modified;
}
function optimizationDataflowHelper(dataComponent, model, firstPass) {
    let roots = dataComponent.sources;
    let modified = false;
    modified = runOptimizer(new RemoveUnnecessaryOutputNodes(), roots) || modified;
    modified = runOptimizer(new RemoveUnnecessaryIdentifierNodes(model), roots) || modified;
    // remove source nodes that don't have any children because they also don't have output nodes
    roots = roots.filter(r => r.numChildren() > 0);
    modified = runOptimizer(new RemoveUnusedSubtrees(), roots) || modified;
    roots = roots.filter(r => r.numChildren() > 0);
    if (!firstPass) {
        // Only run these optimizations after the optimizer has moved down the facet node.
        // With this change, we can be more aggressive in the optimizations.
        modified = runOptimizer(new MoveParseUp(), roots) || modified;
        modified = runOptimizer(new MergeBins(model), roots) || modified;
        modified = runOptimizer(new RemoveDuplicateTimeUnits(), roots) || modified;
        modified = runOptimizer(new MergeParse(), roots) || modified;
        modified = runOptimizer(new MergeAggregates(), roots) || modified;
        modified = runOptimizer(new MergeTimeUnits(), roots) || modified;
        modified = runOptimizer(new MergeIdenticalNodes(), roots) || modified;
        modified = runOptimizer(new MergeOutputs(), roots) || modified;
    }
    dataComponent.sources = roots;
    return modified;
}
/**
 * Optimizes the dataflow of the passed in data component.
 */
function optimizeDataflow(data, model) {
    // check before optimizations
    checkLinks(data.sources);
    let firstPassCounter = 0;
    let secondPassCounter = 0;
    for (let i = 0; i < MAX_OPTIMIZATION_RUNS; i++) {
        if (!optimizationDataflowHelper(data, model, true)) {
            break;
        }
        firstPassCounter++;
    }
    // move facets down and make a copy of the subtree so that we can have scales at the top level
    data.sources.map(moveFacetDown);
    for (let i = 0; i < MAX_OPTIMIZATION_RUNS; i++) {
        if (!optimizationDataflowHelper(data, model, false)) {
            break;
        }
        secondPassCounter++;
    }
    // check after optimizations
    checkLinks(data.sources);
    if (Math.max(firstPassCounter, secondPassCounter) === MAX_OPTIMIZATION_RUNS) {
        warn(`Maximum optimization runs(${MAX_OPTIMIZATION_RUNS}) reached.`);
    }
}
//# sourceMappingURL=optimize.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/signal.js
/**
 * A class that behaves like a SignalRef but lazily generates the signal.
 * The provided generator function should use `Model.getSignalName` to use the correct signal name.
 */
class SignalRefWrapper {
    constructor(exprGenerator) {
        Object.defineProperty(this, 'signal', {
            enumerable: true,
            get: exprGenerator
        });
    }
    static fromName(rename, signalName) {
        return new SignalRefWrapper(() => rename(signalName));
    }
}
//# sourceMappingURL=signal.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/scale/domain.js
var domain_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};


















function parseScaleDomain(model) {
    if (isUnitModel(model)) {
        parseUnitScaleDomain(model);
    }
    else {
        parseNonUnitScaleDomain(model);
    }
}
function parseUnitScaleDomain(model) {
    const localScaleComponents = model.component.scales;
    for (const channel of keys(localScaleComponents)) {
        const domains = parseDomainForChannel(model, channel);
        const localScaleCmpt = localScaleComponents[channel];
        localScaleCmpt.setWithExplicit('domains', domains);
        parseSelectionDomain(model, channel);
        if (model.component.data.isFaceted) {
            // get resolve from closest facet parent as this decides whether we need to refer to cloned subtree or not
            let facetParent = model;
            while (!isFacetModel(facetParent) && facetParent.parent) {
                facetParent = facetParent.parent;
            }
            const resolve = facetParent.component.resolve.scale[channel];
            if (resolve === 'shared') {
                for (const domain of domains.value) {
                    // Replace the scale domain with data output from a cloned subtree after the facet.
                    if (isDataRefDomain(domain)) {
                        // use data from cloned subtree (which is the same as data but with a prefix added once)
                        domain.data = FACET_SCALE_PREFIX + domain.data.replace(FACET_SCALE_PREFIX, '');
                    }
                }
            }
        }
    }
}
function parseNonUnitScaleDomain(model) {
    for (const child of model.children) {
        parseScaleDomain(child);
    }
    const localScaleComponents = model.component.scales;
    for (const channel of keys(localScaleComponents)) {
        let domains;
        let selectionExtent = null;
        for (const child of model.children) {
            const childComponent = child.component.scales[channel];
            if (childComponent) {
                if (domains === undefined) {
                    domains = childComponent.getWithExplicit('domains');
                }
                else {
                    domains = mergeValuesWithExplicit(domains, childComponent.getWithExplicit('domains'), 'domains', 'scale', domainsTieBreaker);
                }
                const se = childComponent.get('selectionExtent');
                if (selectionExtent && se && selectionExtent.param !== se.param) {
                    warn(NEEDS_SAME_SELECTION);
                }
                selectionExtent = se;
            }
        }
        localScaleComponents[channel].setWithExplicit('domains', domains);
        if (selectionExtent) {
            localScaleComponents[channel].set('selectionExtent', selectionExtent, true);
        }
    }
}
/**
 * Remove unaggregated domain if it is not applicable
 * Add unaggregated domain if domain is not specified and config.scale.useUnaggregatedDomain is true.
 */
function normalizeUnaggregatedDomain(domain, fieldDef, scaleType, scaleConfig) {
    if (domain === 'unaggregated') {
        const { valid, reason } = canUseUnaggregatedDomain(fieldDef, scaleType);
        if (!valid) {
            warn(reason);
            return undefined;
        }
    }
    else if (domain === undefined && scaleConfig.useUnaggregatedDomain) {
        // Apply config if domain is not specified.
        const { valid } = canUseUnaggregatedDomain(fieldDef, scaleType);
        if (valid) {
            return 'unaggregated';
        }
    }
    return domain;
}
function parseDomainForChannel(model, channel) {
    const scaleType = model.getScaleComponent(channel).get('type');
    const { encoding } = model;
    const domain = normalizeUnaggregatedDomain(model.scaleDomain(channel), model.typedFieldDef(channel), scaleType, model.config.scale);
    if (domain !== model.scaleDomain(channel)) {
        model.specifiedScales[channel] = Object.assign(Object.assign({}, model.specifiedScales[channel]), { domain });
    }
    // If channel is either X or Y then union them with X2 & Y2 if they exist
    if (channel === 'x' && getFieldOrDatumDef(encoding.x2)) {
        if (getFieldOrDatumDef(encoding.x)) {
            return mergeValuesWithExplicit(parseSingleChannelDomain(scaleType, domain, model, 'x'), parseSingleChannelDomain(scaleType, domain, model, 'x2'), 'domain', 'scale', domainsTieBreaker);
        }
        else {
            return parseSingleChannelDomain(scaleType, domain, model, 'x2');
        }
    }
    else if (channel === 'y' && getFieldOrDatumDef(encoding.y2)) {
        if (getFieldOrDatumDef(encoding.y)) {
            return mergeValuesWithExplicit(parseSingleChannelDomain(scaleType, domain, model, 'y'), parseSingleChannelDomain(scaleType, domain, model, 'y2'), 'domain', 'scale', domainsTieBreaker);
        }
        else {
            return parseSingleChannelDomain(scaleType, domain, model, 'y2');
        }
    }
    return parseSingleChannelDomain(scaleType, domain, model, channel);
}
function mapDomainToDataSignal(domain, type, timeUnit) {
    return domain.map(v => {
        const data = valueExpr(v, { timeUnit, type });
        return { signal: `{data: ${data}}` };
    });
}
function convertDomainIfItIsDateTime(domain, type, timeUnit) {
    var _a;
    // explicit value
    const normalizedTimeUnit = (_a = normalizeTimeUnit(timeUnit)) === null || _a === void 0 ? void 0 : _a.unit;
    if (type === 'temporal' || normalizedTimeUnit) {
        return mapDomainToDataSignal(domain, type, normalizedTimeUnit);
    }
    return [domain]; // Date time won't make sense
}
function parseSingleChannelDomain(scaleType, domain, model, channel) {
    const { encoding } = model;
    const fieldOrDatumDef = getFieldOrDatumDef(encoding[channel]);
    const { type } = fieldOrDatumDef;
    const timeUnit = fieldOrDatumDef['timeUnit'];
    if (isDomainUnionWith(domain)) {
        const defaultDomain = parseSingleChannelDomain(scaleType, undefined, model, channel);
        const unionWith = convertDomainIfItIsDateTime(domain.unionWith, type, timeUnit);
        return makeExplicit([...unionWith, ...defaultDomain.value]);
    }
    else if (isSignalRef(domain)) {
        return makeExplicit([domain]);
    }
    else if (domain && domain !== 'unaggregated' && !isParameterDomain(domain)) {
        return makeExplicit(convertDomainIfItIsDateTime(domain, type, timeUnit));
    }
    const stack = model.stack;
    if (stack && channel === stack.fieldChannel) {
        if (stack.offset === 'normalize') {
            return makeImplicit([[0, 1]]);
        }
        const data = model.requestDataName(DataSourceType.Main);
        return makeImplicit([
            {
                data,
                field: model.vgField(channel, { suffix: 'start' })
            },
            {
                data,
                field: model.vgField(channel, { suffix: 'end' })
            }
        ]);
    }
    const sort = isScaleChannel(channel) && isFieldDef(fieldOrDatumDef) ? domainSort(model, channel, scaleType) : undefined;
    if (isDatumDef(fieldOrDatumDef)) {
        const d = convertDomainIfItIsDateTime([fieldOrDatumDef.datum], type, timeUnit);
        return makeImplicit(d);
    }
    const fieldDef = fieldOrDatumDef; // now we can be sure it's a fieldDef
    if (domain === 'unaggregated') {
        const data = model.requestDataName(DataSourceType.Main);
        const { field } = fieldOrDatumDef;
        return makeImplicit([
            {
                data,
                field: vgField({ field, aggregate: 'min' })
            },
            {
                data,
                field: vgField({ field, aggregate: 'max' })
            }
        ]);
    }
    else if (isBinning(fieldDef.bin)) {
        if (hasDiscreteDomain(scaleType)) {
            if (scaleType === 'bin-ordinal') {
                // we can omit the domain as it is inferred from the `bins` property
                return makeImplicit([]);
            }
            // ordinal bin scale takes domain from bin_range, ordered by bin start
            // This is useful for both axis-based scale (x/y) and legend-based scale (other channels).
            return makeImplicit([
                {
                    // If sort by aggregation of a specified sort field, we need to use RAW table,
                    // so we can aggregate values for the scale independently from the main aggregation.
                    data: isBoolean(sort)
                        ? model.requestDataName(DataSourceType.Main)
                        : model.requestDataName(DataSourceType.Raw),
                    // Use range if we added it and the scale does not support computing a range as a signal.
                    field: model.vgField(channel, binRequiresRange(fieldDef, channel) ? { binSuffix: 'range' } : {}),
                    // we have to use a sort object if sort = true to make the sort correct by bin start
                    sort: sort === true || !(0,vega_util_module/* isObject */.Gv)(sort)
                        ? {
                            field: model.vgField(channel, {}),
                            op: 'min' // min or max doesn't matter since we sort by the start of the bin range
                        }
                        : sort
                }
            ]);
        }
        else {
            // continuous scales
            const { bin } = fieldDef;
            if (isBinning(bin)) {
                const binSignal = getBinSignalName(model, fieldDef.field, bin);
                return makeImplicit([
                    new SignalRefWrapper(() => {
                        const signal = model.getSignalName(binSignal);
                        return `[${signal}.start, ${signal}.stop]`;
                    })
                ]);
            }
            else {
                return makeImplicit([
                    {
                        data: model.requestDataName(DataSourceType.Main),
                        field: model.vgField(channel, {})
                    }
                ]);
            }
        }
    }
    else if (fieldDef.timeUnit &&
        contains(['time', 'utc'], scaleType) &&
        hasBandEnd(fieldDef, isUnitModel(model) ? model.encoding[getSecondaryRangeChannel(channel)] : undefined, model.markDef, model.config)) {
        const data = model.requestDataName(DataSourceType.Main);
        return makeImplicit([
            {
                data,
                field: model.vgField(channel)
            },
            {
                data,
                field: model.vgField(channel, { suffix: 'end' })
            }
        ]);
    }
    else if (sort) {
        return makeImplicit([
            {
                // If sort by aggregation of a specified sort field, we need to use RAW table,
                // so we can aggregate values for the scale independently from the main aggregation.
                data: isBoolean(sort)
                    ? model.requestDataName(DataSourceType.Main)
                    : model.requestDataName(DataSourceType.Raw),
                field: model.vgField(channel),
                sort
            }
        ]);
    }
    else {
        return makeImplicit([
            {
                data: model.requestDataName(DataSourceType.Main),
                field: model.vgField(channel)
            }
        ]);
    }
}
function normalizeSortField(sort, isStackedMeasure) {
    const { op, field, order } = sort;
    return Object.assign(Object.assign({ 
        // Apply default op
        op: op !== null && op !== void 0 ? op : (isStackedMeasure ? 'sum' : DEFAULT_SORT_OP) }, (field ? { field: replacePathInField(field) } : {})), (order ? { order } : {}));
}
function parseSelectionDomain(model, channel) {
    var _a;
    const scale = model.component.scales[channel];
    const spec = model.specifiedScales[channel].domain;
    const bin = (_a = model.fieldDef(channel)) === null || _a === void 0 ? void 0 : _a.bin;
    const domain = isParameterDomain(spec) && spec;
    const extent = isBinParams(bin) && isParameterExtent(bin.extent) && bin.extent;
    if (domain || extent) {
        // As scale parsing occurs before selection parsing, we cannot set
        // domainRaw directly. So instead, we store the selectionExtent on
        // the scale component, and then add domainRaw during scale assembly.
        scale.set('selectionExtent', domain !== null && domain !== void 0 ? domain : extent, true);
    }
}
function domainSort(model, channel, scaleType) {
    if (!hasDiscreteDomain(scaleType)) {
        return undefined;
    }
    // save to cast as the only exception is the geojson type for shape, which would not generate a scale
    const fieldDef = model.fieldDef(channel);
    const sort = fieldDef.sort;
    // if the sort is specified with array, use the derived sort index field
    if (isSortArray(sort)) {
        return {
            op: 'min',
            field: sortArrayIndexField(fieldDef, channel),
            order: 'ascending'
        };
    }
    const { stack } = model;
    const stackDimensions = stack
        ? new Set([...stack.groupbyFields, ...stack.stackBy.map(s => s.fieldDef.field)])
        : undefined;
    // Sorted based on an aggregate calculation over a specified sort field (only for ordinal scale)
    if (isSortField(sort)) {
        const isStackedMeasure = stack && !stackDimensions.has(sort.field);
        return normalizeSortField(sort, isStackedMeasure);
    }
    else if (isSortByEncoding(sort)) {
        const { encoding, order } = sort;
        const fieldDefToSortBy = model.fieldDef(encoding);
        const { aggregate, field } = fieldDefToSortBy;
        const isStackedMeasure = stack && !stackDimensions.has(field);
        if (isArgminDef(aggregate) || isArgmaxDef(aggregate)) {
            return normalizeSortField({
                field: vgField(fieldDefToSortBy),
                order
            }, isStackedMeasure);
        }
        else if (isAggregateOp(aggregate) || !aggregate) {
            return normalizeSortField({
                op: aggregate,
                field,
                order
            }, isStackedMeasure);
        }
    }
    else if (sort === 'descending') {
        return {
            op: 'min',
            field: model.vgField(channel),
            order: 'descending'
        };
    }
    else if (contains(['ascending', undefined /* default =ascending*/], sort)) {
        return true;
    }
    // sort == null
    return undefined;
}
/**
 * Determine if a scale can use unaggregated domain.
 * @return {Boolean} Returns true if all of the following conditions apply:
 * 1. `scale.domain` is `unaggregated`
 * 2. Aggregation function is not `count` or `sum`
 * 3. The scale is quantitative or time scale.
 */
function canUseUnaggregatedDomain(fieldDef, scaleType) {
    const { aggregate, type } = fieldDef;
    if (!aggregate) {
        return {
            valid: false,
            reason: unaggregateDomainHasNoEffectForRawField(fieldDef)
        };
    }
    if ((0,vega_util_module/* isString */.Kg)(aggregate) && !SHARED_DOMAIN_OPS.has(aggregate)) {
        return {
            valid: false,
            reason: unaggregateDomainWithNonSharedDomainOp(aggregate)
        };
    }
    if (type === 'quantitative') {
        if (scaleType === 'log') {
            return {
                valid: false,
                reason: unaggregatedDomainWithLogScale(fieldDef)
            };
        }
    }
    return { valid: true };
}
/**
 * Tie breaker for mergeValuesWithExplicit for domains. We concat the specified values.
 */
function domainsTieBreaker(v1, v2, property, propertyOf) {
    if (v1.explicit && v2.explicit) {
        warn(mergeConflictingDomainProperty(property, propertyOf, v1.value, v2.value));
    }
    // If equal score, concat the domains so that we union them later.
    return { explicit: v1.explicit, value: [...v1.value, ...v2.value] };
}
/**
 * Converts an array of domains to a single Vega scale domain.
 */
function mergeDomains(domains) {
    const uniqueDomains = unique(domains.map(domain => {
        // ignore sort property when computing the unique domains
        if (isDataRefDomain(domain)) {
            const { sort: _s } = domain, domainWithoutSort = domain_rest(domain, ["sort"]);
            return domainWithoutSort;
        }
        return domain;
    }), hash);
    const sorts = unique(domains
        .map(d => {
        if (isDataRefDomain(d)) {
            const s = d.sort;
            if (s !== undefined && !isBoolean(s)) {
                if ('op' in s && s.op === 'count') {
                    // let's make sure that if op is count, we don't use a field
                    delete s.field;
                }
                if (s.order === 'ascending') {
                    // drop order: ascending as it is the default
                    delete s.order;
                }
            }
            return s;
        }
        return undefined;
    })
        .filter(s => s !== undefined), hash);
    if (uniqueDomains.length === 0) {
        return undefined;
    }
    else if (uniqueDomains.length === 1) {
        const domain = domains[0];
        if (isDataRefDomain(domain) && sorts.length > 0) {
            let sort = sorts[0];
            if (sorts.length > 1) {
                warn(MORE_THAN_ONE_SORT);
                sort = true;
            }
            else {
                // Simplify domain sort by removing field and op when the field is the same as the domain field.
                if ((0,vega_util_module/* isObject */.Gv)(sort) && 'field' in sort) {
                    const sortField = sort.field;
                    if (domain.field === sortField) {
                        sort = sort.order ? { order: sort.order } : true;
                    }
                }
            }
            return Object.assign(Object.assign({}, domain), { sort });
        }
        return domain;
    }
    // only keep sort properties that work with unioned domains
    const unionDomainSorts = unique(sorts.map(s => {
        if (isBoolean(s) || !('op' in s) || ((0,vega_util_module/* isString */.Kg)(s.op) && s.op in MULTIDOMAIN_SORT_OP_INDEX)) {
            return s;
        }
        warn(domainSortDropped(s));
        return true;
    }), hash);
    let sort;
    if (unionDomainSorts.length === 1) {
        sort = unionDomainSorts[0];
    }
    else if (unionDomainSorts.length > 1) {
        warn(MORE_THAN_ONE_SORT);
        sort = true;
    }
    const allData = unique(domains.map(d => {
        if (isDataRefDomain(d)) {
            return d.data;
        }
        return null;
    }), x => x);
    if (allData.length === 1 && allData[0] !== null) {
        // create a union domain of different fields with a single data source
        const domain = Object.assign({ data: allData[0], fields: uniqueDomains.map(d => d.field) }, (sort ? { sort } : {}));
        return domain;
    }
    return Object.assign({ fields: uniqueDomains }, (sort ? { sort } : {}));
}
/**
 * Return a field if a scale uses a single field.
 * Return `undefined` otherwise.
 */
function getFieldFromDomain(domain) {
    if (isDataRefDomain(domain) && (0,vega_util_module/* isString */.Kg)(domain.field)) {
        return domain.field;
    }
    else if (isDataRefUnionedDomain(domain)) {
        let field;
        for (const nonUnionDomain of domain.fields) {
            if (isDataRefDomain(nonUnionDomain) && (0,vega_util_module/* isString */.Kg)(nonUnionDomain.field)) {
                if (!field) {
                    field = nonUnionDomain.field;
                }
                else if (field !== nonUnionDomain.field) {
                    warn(FACETED_INDEPENDENT_DIFFERENT_SOURCES);
                    return field;
                }
            }
        }
        warn(FACETED_INDEPENDENT_SAME_FIELDS_DIFFERENT_SOURCES);
        return field;
    }
    else if (isFieldRefUnionDomain(domain)) {
        warn(FACETED_INDEPENDENT_SAME_SOURCE);
        const field = domain.fields[0];
        return (0,vega_util_module/* isString */.Kg)(field) ? field : undefined;
    }
    return undefined;
}
function assembleDomain(model, channel) {
    const scaleComponent = model.component.scales[channel];
    const domains = scaleComponent.get('domains').map((domain) => {
        // Correct references to data as the original domain's data was determined
        // in parseScale, which happens before parseData. Thus the original data
        // reference can be incorrect.
        if (isDataRefDomain(domain)) {
            domain.data = model.lookupDataSource(domain.data);
        }
        return domain;
    });
    // domains is an array that has to be merged into a single vega domain
    return mergeDomains(domains);
}
//# sourceMappingURL=domain.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/scale/assemble.js
var scale_assemble_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};







function assembleScales(model) {
    if (isLayerModel(model) || isConcatModel(model)) {
        // For concat and layer, include scales of children too
        return model.children.reduce((scales, child) => {
            return scales.concat(assembleScales(child));
        }, assembleScalesForModel(model));
    }
    else {
        // For facet, child scales would not be included in the parent's scope.
        // For unit, there is no child.
        return assembleScalesForModel(model);
    }
}
function assembleScalesForModel(model) {
    return keys(model.component.scales).reduce((scales, channel) => {
        const scaleComponent = model.component.scales[channel];
        if (scaleComponent.merged) {
            // Skipped merged scales
            return scales;
        }
        const scale = scaleComponent.combine();
        const { name, type, selectionExtent, domains: _d, range: _r, reverse } = scale, otherScaleProps = scale_assemble_rest(scale, ["name", "type", "selectionExtent", "domains", "range", "reverse"]);
        const range = assembleScaleRange(scale.range, name, channel, model);
        const domain = assembleDomain(model, channel);
        const domainRaw = selectionExtent
            ? assembleSelectionScaleDomain(model, selectionExtent, scaleComponent, domain)
            : null;
        scales.push(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ name,
            type }, (domain ? { domain } : {})), (domainRaw ? { domainRaw } : {})), { range }), (reverse !== undefined ? { reverse: reverse } : {})), otherScaleProps));
        return scales;
    }, []);
}
function assembleScaleRange(scaleRange, scaleName, channel, model) {
    // add signals to x/y range
    if (isXorY(channel)) {
        if (isVgRangeStep(scaleRange)) {
            // For width/height step, use a signal created in layout assemble instead of a constant step.
            return {
                step: { signal: `${scaleName}_step` }
            };
        }
    }
    else if ((0,vega_util_module/* isObject */.Gv)(scaleRange) && isDataRefDomain(scaleRange)) {
        return Object.assign(Object.assign({}, scaleRange), { data: model.lookupDataSource(scaleRange.data) });
    }
    return scaleRange;
}
//# sourceMappingURL=assemble.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/scale/component.js



class ScaleComponent extends Split {
    constructor(name, typeWithExplicit) {
        super({}, // no initial explicit property
        { name } // name as initial implicit property
        );
        this.merged = false;
        this.setWithExplicit('type', typeWithExplicit);
    }
    /**
     * Whether the scale definitely includes zero in the domain
     */
    domainDefinitelyIncludesZero() {
        if (this.get('zero') !== false) {
            return true;
        }
        return some(this.get('domains'), d => (0,vega_util_module/* isArray */.cy)(d) && d.length === 2 && d[0] <= 0 && d[1] >= 0);
    }
}
//# sourceMappingURL=component.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/scale/range.js

















const RANGE_PROPERTIES = ['range', 'scheme'];
function parseUnitScaleRange(model) {
    const localScaleComponents = model.component.scales;
    // use SCALE_CHANNELS instead of scales[channel] to ensure that x, y come first!
    for (const channel of SCALE_CHANNELS) {
        const localScaleCmpt = localScaleComponents[channel];
        if (!localScaleCmpt) {
            continue;
        }
        const rangeWithExplicit = parseRangeForChannel(channel, model);
        localScaleCmpt.setWithExplicit('range', rangeWithExplicit);
    }
}
function getBinStepSignal(model, channel) {
    const fieldDef = model.fieldDef(channel);
    if (fieldDef === null || fieldDef === void 0 ? void 0 : fieldDef.bin) {
        const { bin, field } = fieldDef;
        const sizeType = getSizeChannel(channel);
        const sizeSignal = model.getName(sizeType);
        if ((0,vega_util_module/* isObject */.Gv)(bin) && bin.binned && bin.step !== undefined) {
            return new SignalRefWrapper(() => {
                const scaleName = model.scaleName(channel);
                const binCount = `(domain("${scaleName}")[1] - domain("${scaleName}")[0]) / ${bin.step}`;
                return `${model.getSignalName(sizeSignal)} / (${binCount})`;
            });
        }
        else if (isBinning(bin)) {
            const binSignal = getBinSignalName(model, field, bin);
            // TODO: extract this to be range step signal
            return new SignalRefWrapper(() => {
                const updatedName = model.getSignalName(binSignal);
                const binCount = `(${updatedName}.stop - ${updatedName}.start) / ${updatedName}.step`;
                return `${model.getSignalName(sizeSignal)} / (${binCount})`;
            });
        }
    }
    return undefined;
}
/**
 * Return mixins that includes one of the Vega range types (explicit range, range.step, range.scheme).
 */
function parseRangeForChannel(channel, model) {
    const specifiedScale = model.specifiedScales[channel];
    const { size } = model;
    const mergedScaleCmpt = model.getScaleComponent(channel);
    const scaleType = mergedScaleCmpt.get('type');
    // Check if any of the range properties is specified.
    // If so, check if it is compatible and make sure that we only output one of the properties
    for (const property of RANGE_PROPERTIES) {
        if (specifiedScale[property] !== undefined) {
            const supportedByScaleType = scaleTypeSupportProperty(scaleType, property);
            const channelIncompatability = channelScalePropertyIncompatability(channel, property);
            if (!supportedByScaleType) {
                warn(scalePropertyNotWorkWithScaleType(scaleType, property, channel));
            }
            else if (channelIncompatability) {
                // channel
                warn(channelIncompatability);
            }
            else {
                switch (property) {
                    case 'range': {
                        const range = specifiedScale.range;
                        if ((0,vega_util_module/* isArray */.cy)(range)) {
                            if (isXorY(channel)) {
                                return makeExplicit(range.map(v => {
                                    if (v === 'width' || v === 'height') {
                                        // get signal for width/height
                                        // Just like default range logic below, we use SignalRefWrapper to account for potential merges and renames.
                                        const sizeSignal = model.getName(v);
                                        const getSignalName = model.getSignalName.bind(model);
                                        return SignalRefWrapper.fromName(getSignalName, sizeSignal);
                                    }
                                    return v;
                                }));
                            }
                        }
                        else if ((0,vega_util_module/* isObject */.Gv)(range)) {
                            return makeExplicit({
                                data: model.requestDataName(DataSourceType.Main),
                                field: range.field,
                                sort: { op: 'min', field: model.vgField(channel) }
                            });
                        }
                        return makeExplicit(range);
                    }
                    case 'scheme':
                        return makeExplicit(parseScheme(specifiedScale[property]));
                }
            }
        }
    }
    const sizeChannel = channel === X || channel === 'xOffset' ? 'width' : 'height';
    const sizeValue = size[sizeChannel];
    if (isStep(sizeValue)) {
        if (isXorY(channel)) {
            if (hasDiscreteDomain(scaleType)) {
                const step = getPositionStep(sizeValue, model, channel);
                // Need to be explicit so layer with step wins over layer without step
                if (step) {
                    return makeExplicit({ step });
                }
            }
            else {
                warn(stepDropped(sizeChannel));
            }
        }
        else if (isXorYOffset(channel)) {
            const positionChannel = channel === XOFFSET ? 'x' : 'y';
            const positionScaleCmpt = model.getScaleComponent(positionChannel);
            const positionScaleType = positionScaleCmpt.get('type');
            if (positionScaleType === 'band') {
                const step = getOffsetStep(sizeValue, scaleType);
                if (step) {
                    return makeExplicit(step);
                }
            }
        }
    }
    const { rangeMin, rangeMax } = specifiedScale;
    const d = defaultRange(channel, model);
    if ((rangeMin !== undefined || rangeMax !== undefined) &&
        // it's ok to check just rangeMin's compatibility since rangeMin/rangeMax are the same
        scaleTypeSupportProperty(scaleType, 'rangeMin') &&
        (0,vega_util_module/* isArray */.cy)(d) &&
        d.length === 2) {
        return makeExplicit([rangeMin !== null && rangeMin !== void 0 ? rangeMin : d[0], rangeMax !== null && rangeMax !== void 0 ? rangeMax : d[1]]);
    }
    return makeImplicit(d);
}
function parseScheme(scheme) {
    if (isExtendedScheme(scheme)) {
        return Object.assign({ scheme: scheme.name }, omit(scheme, ['name']));
    }
    return { scheme };
}
function defaultRange(channel, model) {
    const { size, config, mark, encoding } = model;
    const getSignalName = model.getSignalName.bind(model);
    const { type } = getFieldOrDatumDef(encoding[channel]);
    const mergedScaleCmpt = model.getScaleComponent(channel);
    const scaleType = mergedScaleCmpt.get('type');
    const { domain, domainMid } = model.specifiedScales[channel];
    switch (channel) {
        case X:
        case Y: {
            // If there is no explicit width/height for discrete x/y scales
            if (contains(['point', 'band'], scaleType)) {
                const positionSize = getDiscretePositionSize(channel, size, config.view);
                if (isStep(positionSize)) {
                    const step = getPositionStep(positionSize, model, channel);
                    return { step };
                }
            }
            // If step is null, use zero to width or height.
            // Note that we use SignalRefWrapper to account for potential merges and renames.
            const sizeType = getSizeChannel(channel);
            const sizeSignal = model.getName(sizeType);
            if (channel === Y && hasContinuousDomain(scaleType)) {
                // For y continuous scale, we have to start from the height as the bottom part has the max value.
                return [SignalRefWrapper.fromName(getSignalName, sizeSignal), 0];
            }
            else {
                return [0, SignalRefWrapper.fromName(getSignalName, sizeSignal)];
            }
        }
        case XOFFSET:
        case YOFFSET:
            return getOffsetRange(channel, model, scaleType);
        case SIZE: {
            // TODO: support custom rangeMin, rangeMax
            const zero = model.component.scales[channel].get('zero');
            const rangeMin = sizeRangeMin(mark, zero, config);
            const rangeMax = sizeRangeMax(mark, size, model, config);
            if (isContinuousToDiscrete(scaleType)) {
                return interpolateRange(rangeMin, rangeMax, defaultContinuousToDiscreteCount(scaleType, config, domain, channel));
            }
            else {
                return [rangeMin, rangeMax];
            }
        }
        case THETA:
            return [0, Math.PI * 2];
        case ANGLE:
            // TODO: add config.scale.min/maxAngleDegree (for point and text) and config.scale.min/maxAngleRadian (for arc) once we add arc marks.
            // (It's weird to add just config.scale.min/maxAngleDegree for now)
            return [0, 360];
        case RADIUS: {
            // max radius = half od min(width,height)
            return [
                0,
                new SignalRefWrapper(() => {
                    const w = model.getSignalName('width');
                    const h = model.getSignalName('height');
                    return `min(${w},${h})/2`;
                })
            ];
        }
        case STROKEWIDTH:
            // TODO: support custom rangeMin, rangeMax
            return [config.scale.minStrokeWidth, config.scale.maxStrokeWidth];
        case STROKEDASH:
            return [
                // TODO: add this to Vega's config.range?
                [1, 0],
                [4, 2],
                [2, 1],
                [1, 1],
                [1, 2, 4, 2]
            ];
        case SHAPE:
            return 'symbol';
        case COLOR:
        case FILL:
        case STROKE:
            if (scaleType === 'ordinal') {
                // Only nominal data uses ordinal scale by default
                return type === 'nominal' ? 'category' : 'ordinal';
            }
            else {
                if (domainMid !== undefined) {
                    return 'diverging';
                }
                else {
                    return mark === 'rect' || mark === 'geoshape' ? 'heatmap' : 'ramp';
                }
            }
        case OPACITY:
        case FILLOPACITY:
        case STROKEOPACITY:
            // TODO: support custom rangeMin, rangeMax
            return [config.scale.minOpacity, config.scale.maxOpacity];
    }
}
function getPositionStep(step, model, channel) {
    var _a, _b, _c, _d, _e;
    const { encoding } = model;
    const mergedScaleCmpt = model.getScaleComponent(channel);
    const offsetChannel = getOffsetScaleChannel(channel);
    const offsetDef = encoding[offsetChannel];
    const stepFor = getStepFor({ step, offsetIsDiscrete: isFieldOrDatumDef(offsetDef) && isDiscrete(offsetDef.type) });
    if (stepFor === 'offset' && channelHasFieldOrDatum(encoding, offsetChannel)) {
        const offsetScaleCmpt = model.getScaleComponent(offsetChannel);
        const offsetScaleName = model.scaleName(offsetChannel);
        let stepCount = `domain('${offsetScaleName}').length`;
        if (offsetScaleCmpt.get('type') === 'band') {
            const offsetPaddingInner = (_b = (_a = offsetScaleCmpt.get('paddingInner')) !== null && _a !== void 0 ? _a : offsetScaleCmpt.get('padding')) !== null && _b !== void 0 ? _b : 0;
            const offsetPaddingOuter = (_d = (_c = offsetScaleCmpt.get('paddingOuter')) !== null && _c !== void 0 ? _c : offsetScaleCmpt.get('padding')) !== null && _d !== void 0 ? _d : 0;
            stepCount = `bandspace(${stepCount}, ${offsetPaddingInner}, ${offsetPaddingOuter})`;
        }
        const paddingInner = (_e = mergedScaleCmpt.get('paddingInner')) !== null && _e !== void 0 ? _e : mergedScaleCmpt.get('padding');
        return {
            signal: `${step.step} * ${stepCount} / (1-${exprFromSignalRefOrValue(paddingInner)})`
        };
    }
    else {
        return step.step;
    }
}
function getOffsetStep(step, offsetScaleType) {
    const stepFor = getStepFor({ step, offsetIsDiscrete: hasDiscreteDomain(offsetScaleType) });
    if (stepFor === 'offset') {
        return { step: step.step };
    }
    return undefined;
}
function getOffsetRange(channel, model, offsetScaleType) {
    const positionChannel = channel === XOFFSET ? 'x' : 'y';
    const positionScaleCmpt = model.getScaleComponent(positionChannel);
    const positionScaleType = positionScaleCmpt.get('type');
    const positionScaleName = model.scaleName(positionChannel);
    if (positionScaleType === 'band') {
        const size = getDiscretePositionSize(positionChannel, model.size, model.config.view);
        if (isStep(size)) {
            // step is for offset
            const step = getOffsetStep(size, offsetScaleType);
            if (step) {
                return step;
            }
        }
        // otherwise use the position
        return [0, { signal: `bandwidth('${positionScaleName}')` }];
    }
    else {
        // continuous scale
        return never(`Cannot use ${channel} scale if ${positionChannel} scale is not discrete.`);
    }
}
function getDiscretePositionSize(channel, size, viewConfig) {
    const sizeChannel = channel === X ? 'width' : 'height';
    const sizeValue = size[sizeChannel];
    if (sizeValue) {
        return sizeValue;
    }
    return getViewConfigDiscreteSize(viewConfig, sizeChannel);
}
function defaultContinuousToDiscreteCount(scaleType, config, domain, channel) {
    switch (scaleType) {
        case 'quantile':
            return config.scale.quantileCount;
        case 'quantize':
            return config.scale.quantizeCount;
        case 'threshold':
            if (domain !== undefined && (0,vega_util_module/* isArray */.cy)(domain)) {
                return domain.length + 1;
            }
            else {
                warn(domainRequiredForThresholdScale(channel));
                // default threshold boundaries for threshold scale since domain has cardinality of 2
                return 3;
            }
    }
}
/**
 * Returns the linear interpolation of the range according to the cardinality
 *
 * @param rangeMin start of the range
 * @param rangeMax end of the range
 * @param cardinality number of values in the output range
 */
function interpolateRange(rangeMin, rangeMax, cardinality) {
    // always return a signal since it's better to compute the sequence in Vega later
    const f = () => {
        const rMax = signalOrStringValue(rangeMax);
        const rMin = signalOrStringValue(rangeMin);
        const step = `(${rMax} - ${rMin}) / (${cardinality} - 1)`;
        return `sequence(${rMin}, ${rMax} + ${step}, ${step})`;
    };
    if (isSignalRef(rangeMax)) {
        return new SignalRefWrapper(f);
    }
    else {
        return { signal: f() };
    }
}
function sizeRangeMin(mark, zero, config) {
    if (zero) {
        if (isSignalRef(zero)) {
            return { signal: `${zero.signal} ? 0 : ${sizeRangeMin(mark, false, config)}` };
        }
        else {
            return 0;
        }
    }
    switch (mark) {
        case 'bar':
        case 'tick':
            return config.scale.minBandSize;
        case 'line':
        case 'trail':
        case 'rule':
            return config.scale.minStrokeWidth;
        case 'text':
            return config.scale.minFontSize;
        case 'point':
        case 'square':
        case 'circle':
            return config.scale.minSize;
    }
    /* istanbul ignore next: should never reach here */
    // sizeRangeMin not implemented for the mark
    throw new Error(incompatibleChannel('size', mark));
}
const MAX_SIZE_RANGE_STEP_RATIO = 0.95;
function sizeRangeMax(mark, size, model, config) {
    const xyStepSignals = {
        x: getBinStepSignal(model, 'x'),
        y: getBinStepSignal(model, 'y')
    };
    switch (mark) {
        case 'bar':
        case 'tick': {
            if (config.scale.maxBandSize !== undefined) {
                return config.scale.maxBandSize;
            }
            const min = minXYStep(size, xyStepSignals, config.view);
            if ((0,vega_util_module/* isNumber */.Et)(min)) {
                return min - 1;
            }
            else {
                return new SignalRefWrapper(() => `${min.signal} - 1`);
            }
        }
        case 'line':
        case 'trail':
        case 'rule':
            return config.scale.maxStrokeWidth;
        case 'text':
            return config.scale.maxFontSize;
        case 'point':
        case 'square':
        case 'circle': {
            if (config.scale.maxSize) {
                return config.scale.maxSize;
            }
            const pointStep = minXYStep(size, xyStepSignals, config.view);
            if ((0,vega_util_module/* isNumber */.Et)(pointStep)) {
                return Math.pow(MAX_SIZE_RANGE_STEP_RATIO * pointStep, 2);
            }
            else {
                return new SignalRefWrapper(() => `pow(${MAX_SIZE_RANGE_STEP_RATIO} * ${pointStep.signal}, 2)`);
            }
        }
    }
    /* istanbul ignore next: should never reach here */
    // sizeRangeMax not implemented for the mark
    throw new Error(incompatibleChannel('size', mark));
}
/**
 * @returns {number} Range step of x or y or minimum between the two if both are ordinal scale.
 */
function minXYStep(size, xyStepSignals, viewConfig) {
    const widthStep = isStep(size.width) ? size.width.step : getViewConfigDiscreteStep(viewConfig, 'width');
    const heightStep = isStep(size.height) ? size.height.step : getViewConfigDiscreteStep(viewConfig, 'height');
    if (xyStepSignals.x || xyStepSignals.y) {
        return new SignalRefWrapper(() => {
            const exprs = [
                xyStepSignals.x ? xyStepSignals.x.signal : widthStep,
                xyStepSignals.y ? xyStepSignals.y.signal : heightStep
            ];
            return `min(${exprs.join(', ')})`;
        });
    }
    return Math.min(widthStep, heightStep);
}
//# sourceMappingURL=range.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/scale/properties.js
















function parseScaleProperty(model, property) {
    if (isUnitModel(model)) {
        parseUnitScaleProperty(model, property);
    }
    else {
        parseNonUnitScaleProperty(model, property);
    }
}
function parseUnitScaleProperty(model, property) {
    const localScaleComponents = model.component.scales;
    const { config, encoding, markDef, specifiedScales } = model;
    for (const channel of keys(localScaleComponents)) {
        const specifiedScale = specifiedScales[channel];
        const localScaleCmpt = localScaleComponents[channel];
        const mergedScaleCmpt = model.getScaleComponent(channel);
        const fieldOrDatumDef = getFieldOrDatumDef(encoding[channel]);
        const specifiedValue = specifiedScale[property];
        const scaleType = mergedScaleCmpt.get('type');
        const scalePadding = mergedScaleCmpt.get('padding');
        const scalePaddingInner = mergedScaleCmpt.get('paddingInner');
        const supportedByScaleType = scaleTypeSupportProperty(scaleType, property);
        const channelIncompatability = channelScalePropertyIncompatability(channel, property);
        if (specifiedValue !== undefined) {
            // If there is a specified value, check if it is compatible with scale type and channel
            if (!supportedByScaleType) {
                warn(scalePropertyNotWorkWithScaleType(scaleType, property, channel));
            }
            else if (channelIncompatability) {
                // channel
                warn(channelIncompatability);
            }
        }
        if (supportedByScaleType && channelIncompatability === undefined) {
            if (specifiedValue !== undefined) {
                const timeUnit = fieldOrDatumDef['timeUnit'];
                const type = fieldOrDatumDef.type;
                switch (property) {
                    // domainMax/Min to signal if the value is a datetime object
                    case 'domainMax':
                    case 'domainMin':
                        if (isDateTime(specifiedScale[property]) || type === 'temporal' || timeUnit) {
                            localScaleCmpt.set(property, { signal: valueExpr(specifiedScale[property], { type, timeUnit }) }, true);
                        }
                        else {
                            localScaleCmpt.set(property, specifiedScale[property], true);
                        }
                        break;
                    default:
                        localScaleCmpt.copyKeyFromObject(property, specifiedScale);
                }
            }
            else {
                const value = property in scaleRules
                    ? scaleRules[property]({
                        model,
                        channel,
                        fieldOrDatumDef,
                        scaleType,
                        scalePadding,
                        scalePaddingInner,
                        domain: specifiedScale.domain,
                        domainMin: specifiedScale.domainMin,
                        domainMax: specifiedScale.domainMax,
                        markDef,
                        config,
                        hasNestedOffsetScale: channelHasNestedOffsetScale(encoding, channel),
                        hasSecondaryRangeChannel: !!encoding[getSecondaryRangeChannel(channel)]
                    })
                    : config.scale[property];
                if (value !== undefined) {
                    localScaleCmpt.set(property, value, false);
                }
            }
        }
    }
}
const scaleRules = {
    bins: ({ model, fieldOrDatumDef }) => (isFieldDef(fieldOrDatumDef) ? bins(model, fieldOrDatumDef) : undefined),
    interpolate: ({ channel, fieldOrDatumDef }) => interpolate(channel, fieldOrDatumDef.type),
    nice: ({ scaleType, channel, domain, domainMin, domainMax, fieldOrDatumDef }) => nice(scaleType, channel, domain, domainMin, domainMax, fieldOrDatumDef),
    padding: ({ channel, scaleType, fieldOrDatumDef, markDef, config }) => padding(channel, scaleType, config.scale, fieldOrDatumDef, markDef, config.bar),
    paddingInner: ({ scalePadding, channel, markDef, scaleType, config, hasNestedOffsetScale }) => paddingInner(scalePadding, channel, markDef.type, scaleType, config.scale, hasNestedOffsetScale),
    paddingOuter: ({ scalePadding, channel, scaleType, scalePaddingInner, config, hasNestedOffsetScale }) => paddingOuter(scalePadding, channel, scaleType, scalePaddingInner, config.scale, hasNestedOffsetScale),
    reverse: ({ fieldOrDatumDef, scaleType, channel, config }) => {
        const sort = isFieldDef(fieldOrDatumDef) ? fieldOrDatumDef.sort : undefined;
        return reverse(scaleType, sort, channel, config.scale);
    },
    zero: ({ channel, fieldOrDatumDef, domain, markDef, scaleType, config, hasSecondaryRangeChannel }) => zero(channel, fieldOrDatumDef, domain, markDef, scaleType, config.scale, hasSecondaryRangeChannel)
};
// This method is here rather than in range.ts to avoid circular dependency.
function parseScaleRange(model) {
    if (isUnitModel(model)) {
        parseUnitScaleRange(model);
    }
    else {
        parseNonUnitScaleProperty(model, 'range');
    }
}
function parseNonUnitScaleProperty(model, property) {
    const localScaleComponents = model.component.scales;
    for (const child of model.children) {
        if (property === 'range') {
            parseScaleRange(child);
        }
        else {
            parseScaleProperty(child, property);
        }
    }
    for (const channel of keys(localScaleComponents)) {
        let valueWithExplicit;
        for (const child of model.children) {
            const childComponent = child.component.scales[channel];
            if (childComponent) {
                const childValueWithExplicit = childComponent.getWithExplicit(property);
                valueWithExplicit = mergeValuesWithExplicit(valueWithExplicit, childValueWithExplicit, property, 'scale', tieBreakByComparing((v1, v2) => {
                    switch (property) {
                        case 'range':
                            // For step, prefer larger step
                            if (v1.step && v2.step) {
                                return v1.step - v2.step;
                            }
                            return 0;
                        // TODO: precedence rule for other properties
                    }
                    return 0;
                }));
            }
        }
        localScaleComponents[channel].setWithExplicit(property, valueWithExplicit);
    }
}
function bins(model, fieldDef) {
    const bin = fieldDef.bin;
    if (isBinning(bin)) {
        const binSignal = getBinSignalName(model, fieldDef.field, bin);
        return new SignalRefWrapper(() => {
            return model.getSignalName(binSignal);
        });
    }
    else if (isBinned(bin) && isBinParams(bin) && bin.step !== undefined) {
        // start and stop will be determined from the scale domain
        return {
            step: bin.step
        };
    }
    return undefined;
}
function interpolate(channel, type) {
    if (contains([COLOR, FILL, STROKE], channel) && type !== 'nominal') {
        return 'hcl';
    }
    return undefined;
}
function nice(scaleType, channel, specifiedDomain, domainMin, domainMax, fieldOrDatumDef) {
    var _a;
    if (((_a = getFieldDef(fieldOrDatumDef)) === null || _a === void 0 ? void 0 : _a.bin) ||
        (0,vega_util_module/* isArray */.cy)(specifiedDomain) ||
        domainMax != null ||
        domainMin != null ||
        contains([ScaleType.TIME, ScaleType.UTC], scaleType)) {
        return undefined;
    }
    return isXorY(channel) ? true : undefined;
}
function padding(channel, scaleType, scaleConfig, fieldOrDatumDef, markDef, barConfig) {
    if (isXorY(channel)) {
        if (isContinuousToContinuous(scaleType)) {
            if (scaleConfig.continuousPadding !== undefined) {
                return scaleConfig.continuousPadding;
            }
            const { type, orient } = markDef;
            if (type === 'bar' && !(isFieldDef(fieldOrDatumDef) && (fieldOrDatumDef.bin || fieldOrDatumDef.timeUnit))) {
                if ((orient === 'vertical' && channel === 'x') || (orient === 'horizontal' && channel === 'y')) {
                    return barConfig.continuousBandSize;
                }
            }
        }
        if (scaleType === ScaleType.POINT) {
            return scaleConfig.pointPadding;
        }
    }
    return undefined;
}
function paddingInner(paddingValue, channel, mark, scaleType, scaleConfig, hasNestedOffsetScale = false) {
    if (paddingValue !== undefined) {
        // If user has already manually specified "padding", no need to add default paddingInner.
        return undefined;
    }
    if (isXorY(channel)) {
        // Padding is only set for X and Y by default.
        // Basically it doesn't make sense to add padding for color and size.
        // paddingOuter would only be called if it's a band scale, just return the default for bandScale.
        const { bandPaddingInner, barBandPaddingInner, rectBandPaddingInner, bandWithNestedOffsetPaddingInner } = scaleConfig;
        if (hasNestedOffsetScale) {
            return bandWithNestedOffsetPaddingInner;
        }
        return getFirstDefined(bandPaddingInner, mark === 'bar' ? barBandPaddingInner : rectBandPaddingInner);
    }
    else if (isXorYOffset(channel)) {
        if (scaleType === ScaleType.BAND) {
            return scaleConfig.offsetBandPaddingInner;
        }
    }
    return undefined;
}
function paddingOuter(paddingValue, channel, scaleType, paddingInnerValue, scaleConfig, hasNestedOffsetScale = false) {
    if (paddingValue !== undefined) {
        // If user has already manually specified "padding", no need to add default paddingOuter.
        return undefined;
    }
    if (isXorY(channel)) {
        const { bandPaddingOuter, bandWithNestedOffsetPaddingOuter } = scaleConfig;
        if (hasNestedOffsetScale) {
            return bandWithNestedOffsetPaddingOuter;
        }
        // Padding is only set for X and Y by default.
        // Basically it doesn't make sense to add padding for color and size.
        if (scaleType === ScaleType.BAND) {
            return getFirstDefined(bandPaddingOuter, 
            /* By default, paddingOuter is paddingInner / 2. The reason is that
              size (width/height) = step * (cardinality - paddingInner + 2 * paddingOuter).
              and we want the width/height to be integer by default.
              Note that step (by default) and cardinality are integers.) */
            isSignalRef(paddingInnerValue) ? { signal: `${paddingInnerValue.signal}/2` } : paddingInnerValue / 2);
        }
    }
    else if (isXorYOffset(channel)) {
        if (scaleType === ScaleType.POINT) {
            return 0.5; // so the point positions align with centers of band scales.
        }
        else if (scaleType === ScaleType.BAND) {
            return scaleConfig.offsetBandPaddingOuter;
        }
    }
    return undefined;
}
function reverse(scaleType, sort, channel, scaleConfig) {
    if (channel === 'x' && scaleConfig.xReverse !== undefined) {
        if (hasContinuousDomain(scaleType) && sort === 'descending') {
            if (isSignalRef(scaleConfig.xReverse)) {
                return { signal: `!${scaleConfig.xReverse.signal}` };
            }
            else {
                return !scaleConfig.xReverse;
            }
        }
        return scaleConfig.xReverse;
    }
    if (hasContinuousDomain(scaleType) && sort === 'descending') {
        // For continuous domain scales, Vega does not support domain sort.
        // Thus, we reverse range instead if sort is descending
        return true;
    }
    return undefined;
}
function zero(channel, fieldDef, specifiedDomain, markDef, scaleType, scaleConfig, hasSecondaryRangeChannel) {
    // If users explicitly provide a domain, we should not augment zero as that will be unexpected.
    const hasCustomDomain = !!specifiedDomain && specifiedDomain !== 'unaggregated';
    if (hasCustomDomain) {
        if (hasContinuousDomain(scaleType)) {
            if ((0,vega_util_module/* isArray */.cy)(specifiedDomain)) {
                const first = specifiedDomain[0];
                const last = specifiedDomain[specifiedDomain.length - 1];
                if (first <= 0 && last >= 0) {
                    // if the domain includes zero, make zero remains true
                    return true;
                }
            }
            return false;
        }
    }
    // If there is no custom domain, return configZero value (=`true` as default) only for the following cases:
    // 1) using quantitative field with size
    // While this can be either ratio or interval fields, our assumption is that
    // ratio are more common. However, if the scaleType is discretizing scale, we want to return
    // false so that range doesn't start at zero
    if (channel === 'size' && fieldDef.type === 'quantitative' && !isContinuousToDiscrete(scaleType)) {
        return true;
    }
    // 2) non-binned, quantitative x-scale or y-scale
    // (For binning, we should not include zero by default because binning are calculated without zero.)
    // (For area/bar charts with ratio scale chart, we should always include zero.)
    if (!(isFieldDef(fieldDef) && fieldDef.bin) &&
        contains([...POSITION_SCALE_CHANNELS, ...POLAR_POSITION_SCALE_CHANNELS], channel)) {
        const { orient, type } = markDef;
        if (contains(['bar', 'area', 'line', 'trail'], type)) {
            if ((orient === 'horizontal' && channel === 'y') || (orient === 'vertical' && channel === 'x')) {
                return false;
            }
        }
        if (contains(['bar', 'area'], type) && !hasSecondaryRangeChannel) {
            return true;
        }
        return scaleConfig === null || scaleConfig === void 0 ? void 0 : scaleConfig.zero;
    }
    return false;
}
//# sourceMappingURL=properties.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/scale/type.js









/**
 * Determine if there is a specified scale type and if it is appropriate,
 * or determine default type if type is unspecified or inappropriate.
 */
// NOTE: CompassQL uses this method.
function scaleType(specifiedScale, channel, fieldDef, mark, hasNestedOffsetScale = false) {
    const defaultScaleType = type_defaultType(channel, fieldDef, mark, hasNestedOffsetScale);
    const { type } = specifiedScale;
    if (!isScaleChannel(channel)) {
        // There is no scale for these channels
        return null;
    }
    if (type !== undefined) {
        // Check if explicitly specified scale type is supported by the channel
        if (!channelSupportScaleType(channel, type)) {
            warn(scaleTypeNotWorkWithChannel(channel, type, defaultScaleType));
            return defaultScaleType;
        }
        // Check if explicitly specified scale type is supported by the data type
        if (isFieldDef(fieldDef) && !scaleTypeSupportDataType(type, fieldDef.type)) {
            warn(scaleTypeNotWorkWithFieldDef(type, defaultScaleType));
            return defaultScaleType;
        }
        return type;
    }
    return defaultScaleType;
}
/**
 * Determine appropriate default scale type.
 */
// NOTE: Voyager uses this method.
function type_defaultType(channel, fieldDef, mark, hasNestedOffsetScale) {
    var _a;
    switch (fieldDef.type) {
        case 'nominal':
        case 'ordinal': {
            if (isColorChannel(channel) || rangeType(channel) === 'discrete') {
                if (channel === 'shape' && fieldDef.type === 'ordinal') {
                    warn(discreteChannelCannotEncode(channel, 'ordinal'));
                }
                return 'ordinal';
            }
            if (isXorY(channel) || isXorYOffset(channel)) {
                if (contains(['rect', 'bar', 'image', 'rule'], mark.type)) {
                    // The rect/bar mark should fit into a band.
                    // For rule, using band scale to make rule align with axis ticks better https://github.com/vega/vega-lite/issues/3429
                    return 'band';
                }
                if (hasNestedOffsetScale) {
                    // If there is a nested offset scale, then there is a "band" for the span of the nested scale.
                    return 'band';
                }
            }
            else if (mark.type === 'arc' && channel in POLAR_POSITION_SCALE_CHANNEL_INDEX) {
                return 'band';
            }
            const dimensionSize = mark[getSizeChannel(channel)];
            if (isRelativeBandSize(dimensionSize)) {
                return 'band';
            }
            if (isPositionFieldOrDatumDef(fieldDef) && ((_a = fieldDef.axis) === null || _a === void 0 ? void 0 : _a.tickBand)) {
                return 'band';
            }
            // Otherwise, use ordinal point scale so we can easily get center positions of the marks.
            return 'point';
        }
        case 'temporal':
            if (isColorChannel(channel)) {
                return 'time';
            }
            else if (rangeType(channel) === 'discrete') {
                warn(discreteChannelCannotEncode(channel, 'temporal'));
                // TODO: consider using quantize (equivalent to binning) once we have it
                return 'ordinal';
            }
            else if (isFieldDef(fieldDef) && fieldDef.timeUnit && normalizeTimeUnit(fieldDef.timeUnit).utc) {
                return 'utc';
            }
            return 'time';
        case 'quantitative':
            if (isColorChannel(channel)) {
                if (isFieldDef(fieldDef) && isBinning(fieldDef.bin)) {
                    return 'bin-ordinal';
                }
                return 'linear';
            }
            else if (rangeType(channel) === 'discrete') {
                warn(discreteChannelCannotEncode(channel, 'quantitative'));
                // TODO: consider using quantize (equivalent to binning) once we have it
                return 'ordinal';
            }
            return 'linear';
        case 'geojson':
            return undefined;
    }
    /* istanbul ignore next: should never reach this */
    throw new Error(invalidFieldType(fieldDef.type));
}
//# sourceMappingURL=type.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/scale/parse.js















function parseScales(model, { ignoreRange } = {}) {
    parseScaleCore(model);
    parseScaleDomain(model);
    for (const prop of NON_TYPE_DOMAIN_RANGE_VEGA_SCALE_PROPERTIES) {
        parseScaleProperty(model, prop);
    }
    if (!ignoreRange) {
        // range depends on zero
        parseScaleRange(model);
    }
}
function parseScaleCore(model) {
    if (isUnitModel(model)) {
        model.component.scales = parseUnitScaleCore(model);
    }
    else {
        model.component.scales = parseNonUnitScaleCore(model);
    }
}
/**
 * Parse scales for all channels of a model.
 */
function parseUnitScaleCore(model) {
    const { encoding, mark, markDef } = model;
    const scaleComponents = {};
    for (const channel of SCALE_CHANNELS) {
        const fieldOrDatumDef = getFieldOrDatumDef(encoding[channel]); // must be typed def to have scale
        // Don't generate scale for shape of geoshape
        if (fieldOrDatumDef && mark === GEOSHAPE && channel === SHAPE && fieldOrDatumDef.type === GEOJSON) {
            continue;
        }
        let specifiedScale = fieldOrDatumDef && fieldOrDatumDef['scale'];
        if (isXorYOffset(channel)) {
            const mainChannel = getMainChannelFromOffsetChannel(channel);
            if (!channelHasNestedOffsetScale(encoding, mainChannel)) {
                // Don't generate scale when the offset encoding shouldn't yield a nested scale
                if (specifiedScale) {
                    warn(offsetEncodingScaleIgnored(channel));
                }
                continue;
            }
        }
        if (fieldOrDatumDef && specifiedScale !== null && specifiedScale !== false) {
            specifiedScale !== null && specifiedScale !== void 0 ? specifiedScale : (specifiedScale = {});
            const hasNestedOffsetScale = channelHasNestedOffsetScale(encoding, channel);
            const sType = scaleType(specifiedScale, channel, fieldOrDatumDef, markDef, hasNestedOffsetScale);
            scaleComponents[channel] = new ScaleComponent(model.scaleName(`${channel}`, true), {
                value: sType,
                explicit: specifiedScale.type === sType
            });
        }
    }
    return scaleComponents;
}
const scaleTypeTieBreaker = tieBreakByComparing((st1, st2) => scaleTypePrecedence(st1) - scaleTypePrecedence(st2));
function parseNonUnitScaleCore(model) {
    var _a;
    var _b;
    const scaleComponents = (model.component.scales = {});
    const scaleTypeWithExplicitIndex = {};
    const resolve = model.component.resolve;
    // Parse each child scale and determine if a particular channel can be merged.
    for (const child of model.children) {
        parseScaleCore(child);
        // Instead of always merging right away -- check if it is compatible to merge first!
        for (const channel of keys(child.component.scales)) {
            // if resolve is undefined, set default first
            (_a = (_b = resolve.scale)[channel]) !== null && _a !== void 0 ? _a : (_b[channel] = defaultScaleResolve(channel, model));
            if (resolve.scale[channel] === 'shared') {
                const explicitScaleType = scaleTypeWithExplicitIndex[channel];
                const childScaleType = child.component.scales[channel].getWithExplicit('type');
                if (explicitScaleType) {
                    if (scaleCompatible(explicitScaleType.value, childScaleType.value)) {
                        // merge scale component if type are compatible
                        scaleTypeWithExplicitIndex[channel] = mergeValuesWithExplicit(explicitScaleType, childScaleType, 'type', 'scale', scaleTypeTieBreaker);
                    }
                    else {
                        // Otherwise, update conflicting channel to be independent
                        resolve.scale[channel] = 'independent';
                        // Remove from the index so they don't get merged
                        delete scaleTypeWithExplicitIndex[channel];
                    }
                }
                else {
                    scaleTypeWithExplicitIndex[channel] = childScaleType;
                }
            }
        }
    }
    // Merge each channel listed in the index
    for (const channel of keys(scaleTypeWithExplicitIndex)) {
        // Create new merged scale component
        const name = model.scaleName(channel, true);
        const typeWithExplicit = scaleTypeWithExplicitIndex[channel];
        scaleComponents[channel] = new ScaleComponent(name, typeWithExplicit);
        // rename each child and mark them as merged
        for (const child of model.children) {
            const childScale = child.component.scales[channel];
            if (childScale) {
                child.renameScale(childScale.get('name'), name);
                childScale.merged = true;
            }
        }
    }
    return scaleComponents;
}
//# sourceMappingURL=parse.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/model.js
var model_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};



























class NameMap {
    constructor() {
        this.nameMap = {};
    }
    rename(oldName, newName) {
        this.nameMap[oldName] = newName;
    }
    has(name) {
        return this.nameMap[name] !== undefined;
    }
    get(name) {
        // If the name appears in the _nameMap, we need to read its new name.
        // We have to loop over the dict just in case the new name also gets renamed.
        while (this.nameMap[name] && name !== this.nameMap[name]) {
            name = this.nameMap[name];
        }
        return name;
    }
}
/*
  We use type guards instead of `instanceof` as `instanceof` makes
  different parts of the compiler depend on the actual implementation of
  the model classes, which in turn depend on different parts of the compiler.
  Thus, `instanceof` leads to circular dependency problems.

  On the other hand, type guards only make different parts of the compiler
  depend on the type of the model classes, but not the actual implementation.
*/
function isUnitModel(model) {
    return (model === null || model === void 0 ? void 0 : model.type) === 'unit';
}
function isFacetModel(model) {
    return (model === null || model === void 0 ? void 0 : model.type) === 'facet';
}
function isConcatModel(model) {
    return (model === null || model === void 0 ? void 0 : model.type) === 'concat';
}
function isLayerModel(model) {
    return (model === null || model === void 0 ? void 0 : model.type) === 'layer';
}
class Model {
    constructor(spec, type, parent, parentGivenName, config, resolve, view) {
        var _a, _b;
        this.type = type;
        this.parent = parent;
        this.config = config;
        /**
         * Corrects the data references in marks after assemble.
         */
        this.correctDataNames = (mark) => {
            // TODO: make this correct
            var _a, _b, _c;
            // for normal data references
            if ((_a = mark.from) === null || _a === void 0 ? void 0 : _a.data) {
                mark.from.data = this.lookupDataSource(mark.from.data);
            }
            // for access to facet data
            if ((_c = (_b = mark.from) === null || _b === void 0 ? void 0 : _b.facet) === null || _c === void 0 ? void 0 : _c.data) {
                mark.from.facet.data = this.lookupDataSource(mark.from.facet.data);
            }
            return mark;
        };
        this.parent = parent;
        this.config = config;
        this.view = replaceExprRef(view);
        // If name is not provided, always use parent's givenName to avoid name conflicts.
        this.name = (_a = spec.name) !== null && _a !== void 0 ? _a : parentGivenName;
        this.title = isText(spec.title) ? { text: spec.title } : spec.title ? replaceExprRef(spec.title) : undefined;
        // Shared name maps
        this.scaleNameMap = parent ? parent.scaleNameMap : new NameMap();
        this.projectionNameMap = parent ? parent.projectionNameMap : new NameMap();
        this.signalNameMap = parent ? parent.signalNameMap : new NameMap();
        this.data = spec.data;
        this.description = spec.description;
        this.transforms = normalizeTransform((_b = spec.transform) !== null && _b !== void 0 ? _b : []);
        this.layout = type === 'layer' || type === 'unit' ? {} : extractCompositionLayout(spec, type, config);
        this.component = {
            data: {
                sources: parent ? parent.component.data.sources : [],
                outputNodes: parent ? parent.component.data.outputNodes : {},
                outputNodeRefCounts: parent ? parent.component.data.outputNodeRefCounts : {},
                // data is faceted if the spec is a facet spec or the parent has faceted data and data is undefined
                isFaceted: isFacetSpec(spec) || ((parent === null || parent === void 0 ? void 0 : parent.component.data.isFaceted) && spec.data === undefined)
            },
            layoutSize: new Split(),
            layoutHeaders: { row: {}, column: {}, facet: {} },
            mark: null,
            resolve: Object.assign({ scale: {}, axis: {}, legend: {} }, (resolve ? duplicate(resolve) : {})),
            selection: null,
            scales: null,
            projection: null,
            axes: {},
            legends: {}
        };
    }
    get width() {
        return this.getSizeSignalRef('width');
    }
    get height() {
        return this.getSizeSignalRef('height');
    }
    parse() {
        this.parseScale();
        this.parseLayoutSize(); // depends on scale
        this.renameTopLevelLayoutSizeSignal();
        this.parseSelections();
        this.parseProjection();
        this.parseData(); // (pathorder) depends on markDef; selection filters depend on parsed selections; depends on projection because some transforms require the finalized projection name.
        this.parseAxesAndHeaders(); // depends on scale and layout size
        this.parseLegends(); // depends on scale, markDef
        this.parseMarkGroup(); // depends on data name, scale, layout size, axisGroup, and children's scale, axis, legend and mark.
    }
    parseScale() {
        parseScales(this);
    }
    parseProjection() {
        parseProjection(this);
    }
    /**
     * Rename top-level spec's size to be just width / height, ignoring model name.
     * This essentially merges the top-level spec's width/height signals with the width/height signals
     * to help us reduce redundant signals declaration.
     */
    renameTopLevelLayoutSizeSignal() {
        if (this.getName('width') !== 'width') {
            this.renameSignal(this.getName('width'), 'width');
        }
        if (this.getName('height') !== 'height') {
            this.renameSignal(this.getName('height'), 'height');
        }
    }
    parseLegends() {
        parseLegend(this);
    }
    assembleEncodeFromView(view) {
        // Exclude "style"
        const { style: _ } = view, baseView = model_rest(view, ["style"]);
        const e = {};
        for (const property of keys(baseView)) {
            const value = baseView[property];
            if (value !== undefined) {
                e[property] = signalOrValueRef(value);
            }
        }
        return e;
    }
    assembleGroupEncodeEntry(isTopLevel) {
        let encodeEntry = {};
        if (this.view) {
            encodeEntry = this.assembleEncodeFromView(this.view);
        }
        if (!isTopLevel) {
            // Descriptions are already added to the top-level description so we only need to add them to the inner views.
            if (this.description) {
                encodeEntry['description'] = signalOrValueRef(this.description);
            }
            // For top-level spec, we can set the global width and height signal to adjust the group size.
            // For other child specs, we have to manually set width and height in the encode entry.
            if (this.type === 'unit' || this.type === 'layer') {
                return Object.assign({ width: this.getSizeSignalRef('width'), height: this.getSizeSignalRef('height') }, (encodeEntry !== null && encodeEntry !== void 0 ? encodeEntry : {}));
            }
        }
        return isEmpty(encodeEntry) ? undefined : encodeEntry;
    }
    assembleLayout() {
        if (!this.layout) {
            return undefined;
        }
        const _a = this.layout, { spacing } = _a, layout = model_rest(_a, ["spacing"]);
        const { component, config } = this;
        const titleBand = assembleLayoutTitleBand(component.layoutHeaders, config);
        return Object.assign(Object.assign(Object.assign({ padding: spacing }, this.assembleDefaultLayout()), layout), (titleBand ? { titleBand } : {}));
    }
    assembleDefaultLayout() {
        return {};
    }
    assembleHeaderMarks() {
        const { layoutHeaders } = this.component;
        let headerMarks = [];
        for (const channel of FACET_CHANNELS) {
            if (layoutHeaders[channel].title) {
                headerMarks.push(assembleTitleGroup(this, channel));
            }
        }
        for (const channel of HEADER_CHANNELS) {
            headerMarks = headerMarks.concat(assembleHeaderGroups(this, channel));
        }
        return headerMarks;
    }
    assembleAxes() {
        return assembleAxes(this.component.axes, this.config);
    }
    assembleLegends() {
        return assembleLegends(this);
    }
    assembleProjections() {
        return assembleProjections(this);
    }
    assembleTitle() {
        var _a, _b, _c;
        const _d = (_a = this.title) !== null && _a !== void 0 ? _a : {}, { encoding } = _d, titleNoEncoding = model_rest(_d, ["encoding"]);
        const title = Object.assign(Object.assign(Object.assign({}, extractTitleConfig(this.config.title).nonMarkTitleProperties), titleNoEncoding), (encoding ? { encode: { update: encoding } } : {}));
        if (title.text) {
            if (contains(['unit', 'layer'], this.type)) {
                // Unit/Layer
                if (contains(['middle', undefined], title.anchor)) {
                    (_b = title.frame) !== null && _b !== void 0 ? _b : (title.frame = 'group');
                }
            }
            else {
                // composition with Vega layout
                // Set title = "start" by default for composition as "middle" does not look nice
                // https://github.com/vega/vega/issues/960#issuecomment-471360328
                (_c = title.anchor) !== null && _c !== void 0 ? _c : (title.anchor = 'start');
            }
            return isEmpty(title) ? undefined : title;
        }
        return undefined;
    }
    /**
     * Assemble the mark group for this model. We accept optional `signals` so that we can include concat top-level signals with the top-level model's local signals.
     */
    assembleGroup(signals = []) {
        const group = {};
        signals = signals.concat(this.assembleSignals());
        if (signals.length > 0) {
            group.signals = signals;
        }
        const layout = this.assembleLayout();
        if (layout) {
            group.layout = layout;
        }
        group.marks = [].concat(this.assembleHeaderMarks(), this.assembleMarks());
        // Only include scales if this spec is top-level or if parent is facet.
        // (Otherwise, it will be merged with upper-level's scope.)
        const scales = !this.parent || isFacetModel(this.parent) ? assembleScales(this) : [];
        if (scales.length > 0) {
            group.scales = scales;
        }
        const axes = this.assembleAxes();
        if (axes.length > 0) {
            group.axes = axes;
        }
        const legends = this.assembleLegends();
        if (legends.length > 0) {
            group.legends = legends;
        }
        return group;
    }
    getName(text) {
        return varName((this.name ? `${this.name}_` : '') + text);
    }
    getDataName(type) {
        return this.getName(DataSourceType[type].toLowerCase());
    }
    /**
     * Request a data source name for the given data source type and mark that data source as required.
     * This method should be called in parse, so that all used data source can be correctly instantiated in assembleData().
     * You can lookup the correct dataset name in assemble with `lookupDataSource`.
     */
    requestDataName(name) {
        const fullName = this.getDataName(name);
        // Increase ref count. This is critical because otherwise we won't create a data source.
        // We also increase the ref counts on OutputNode.getSource() calls.
        const refCounts = this.component.data.outputNodeRefCounts;
        refCounts[fullName] = (refCounts[fullName] || 0) + 1;
        return fullName;
    }
    getSizeSignalRef(layoutSizeType) {
        if (isFacetModel(this.parent)) {
            const sizeType = getSizeTypeFromLayoutSizeType(layoutSizeType);
            const channel = getPositionScaleChannel(sizeType);
            const scaleComponent = this.component.scales[channel];
            if (scaleComponent && !scaleComponent.merged) {
                // independent scale
                const type = scaleComponent.get('type');
                const range = scaleComponent.get('range');
                if (hasDiscreteDomain(type) && isVgRangeStep(range)) {
                    const scaleName = scaleComponent.get('name');
                    const domain = assembleDomain(this, channel);
                    const field = getFieldFromDomain(domain);
                    if (field) {
                        const fieldRef = vgField({ aggregate: 'distinct', field }, { expr: 'datum' });
                        return {
                            signal: sizeExpr(scaleName, scaleComponent, fieldRef)
                        };
                    }
                    else {
                        warn(unknownField(channel));
                        return null;
                    }
                }
            }
        }
        return {
            signal: this.signalNameMap.get(this.getName(layoutSizeType))
        };
    }
    /**
     * Lookup the name of the datasource for an output node. You probably want to call this in assemble.
     */
    lookupDataSource(name) {
        const node = this.component.data.outputNodes[name];
        if (!node) {
            // Name not found in map so let's just return what we got.
            // This can happen if we already have the correct name.
            return name;
        }
        return node.getSource();
    }
    getSignalName(oldSignalName) {
        return this.signalNameMap.get(oldSignalName);
    }
    renameSignal(oldName, newName) {
        this.signalNameMap.rename(oldName, newName);
    }
    renameScale(oldName, newName) {
        this.scaleNameMap.rename(oldName, newName);
    }
    renameProjection(oldName, newName) {
        this.projectionNameMap.rename(oldName, newName);
    }
    /**
     * @return scale name for a given channel after the scale has been parsed and named.
     */
    scaleName(originalScaleName, parse) {
        if (parse) {
            // During the parse phase always return a value
            // No need to refer to rename map because a scale can't be renamed
            // before it has the original name.
            return this.getName(originalScaleName);
        }
        // If there is a scale for the channel, it should either
        // be in the scale component or exist in the name map
        if (
        // If there is a scale for the channel, there should be a local scale component for it
        (isChannel(originalScaleName) && isScaleChannel(originalScaleName) && this.component.scales[originalScaleName]) ||
            // in the scale name map (the scale get merged by its parent)
            this.scaleNameMap.has(this.getName(originalScaleName))) {
            return this.scaleNameMap.get(this.getName(originalScaleName));
        }
        return undefined;
    }
    /**
     * @return projection name after the projection has been parsed and named.
     */
    projectionName(parse) {
        if (parse) {
            // During the parse phase always return a value
            // No need to refer to rename map because a projection can't be renamed
            // before it has the original name.
            return this.getName('projection');
        }
        if ((this.component.projection && !this.component.projection.merged) ||
            this.projectionNameMap.has(this.getName('projection'))) {
            return this.projectionNameMap.get(this.getName('projection'));
        }
        return undefined;
    }
    /**
     * Traverse a model's hierarchy to get the scale component for a particular channel.
     */
    getScaleComponent(channel) {
        /* istanbul ignore next: This is warning for debugging test */
        if (!this.component.scales) {
            throw new Error('getScaleComponent cannot be called before parseScale(). Make sure you have called parseScale or use parseUnitModelWithScale().');
        }
        const localScaleComponent = this.component.scales[channel];
        if (localScaleComponent && !localScaleComponent.merged) {
            return localScaleComponent;
        }
        return this.parent ? this.parent.getScaleComponent(channel) : undefined;
    }
    /**
     * Traverse a model's hierarchy to get a particular selection component.
     */
    getSelectionComponent(variableName, origName) {
        let sel = this.component.selection[variableName];
        if (!sel && this.parent) {
            sel = this.parent.getSelectionComponent(variableName, origName);
        }
        if (!sel) {
            throw new Error(selectionNotFound(origName));
        }
        return sel;
    }
    /**
     * Returns true if the model has a signalRef for an axis orient.
     */
    hasAxisOrientSignalRef() {
        var _a, _b;
        return (((_a = this.component.axes.x) === null || _a === void 0 ? void 0 : _a.some(a => a.hasOrientSignalRef())) ||
            ((_b = this.component.axes.y) === null || _b === void 0 ? void 0 : _b.some(a => a.hasOrientSignalRef())));
    }
}
/** Abstract class for UnitModel and FacetModel. Both of which can contain fieldDefs as a part of its own specification. */
class ModelWithField extends Model {
    /** Get "field" reference for Vega */
    vgField(channel, opt = {}) {
        const fieldDef = this.fieldDef(channel);
        if (!fieldDef) {
            return undefined;
        }
        return vgField(fieldDef, opt);
    }
    reduceFieldDef(f, init) {
        return reduce(this.getMapping(), (acc, cd, c) => {
            const fieldDef = getFieldDef(cd);
            if (fieldDef) {
                return f(acc, fieldDef, c);
            }
            return acc;
        }, init);
    }
    forEachFieldDef(f, t) {
        forEach(this.getMapping(), (cd, c) => {
            const fieldDef = getFieldDef(cd);
            if (fieldDef) {
                f(fieldDef, c);
            }
        }, t);
    }
}
//# sourceMappingURL=model.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/density.js
var density_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};


/**
 * A class for density transform nodes
 */
class DensityTransformNode extends DataFlowNode {
    clone() {
        return new DensityTransformNode(null, duplicate(this.transform));
    }
    constructor(parent, transform) {
        var _a, _b, _c;
        super(parent);
        this.transform = transform;
        this.transform = duplicate(transform); // duplicate to prevent side effects
        const specifiedAs = (_a = this.transform.as) !== null && _a !== void 0 ? _a : [undefined, undefined];
        this.transform.as = [(_b = specifiedAs[0]) !== null && _b !== void 0 ? _b : 'value', (_c = specifiedAs[1]) !== null && _c !== void 0 ? _c : 'density'];
        // set steps when we are grouping so that we get consitent sampling points for imputing and grouping
        if (transform.groupby && transform.minsteps == null && transform.maxsteps == null && transform.steps == null) {
            this.transform.steps = 200;
        }
    }
    dependentFields() {
        var _a;
        return new Set([this.transform.density, ...((_a = this.transform.groupby) !== null && _a !== void 0 ? _a : [])]);
    }
    producedFields() {
        return new Set(this.transform.as);
    }
    hash() {
        return `DensityTransform ${hash(this.transform)}`;
    }
    assemble() {
        const _a = this.transform, { density } = _a, rest = density_rest(_a, ["density"]);
        const result = Object.assign({ type: 'kde', field: density }, rest);
        return result;
    }
}
//# sourceMappingURL=density.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/filterinvalid.js







class FilterInvalidNode extends DataFlowNode {
    clone() {
        return new FilterInvalidNode(null, Object.assign({}, this.filter));
    }
    constructor(parent, filter) {
        super(parent);
        this.filter = filter;
    }
    static make(parent, model) {
        const { config, mark, markDef } = model;
        const invalid = getMarkPropOrConfig('invalid', markDef, config);
        if (invalid !== 'filter') {
            return null;
        }
        const filter = model.reduceFieldDef((aggregator, fieldDef, channel) => {
            const scaleComponent = isScaleChannel(channel) && model.getScaleComponent(channel);
            if (scaleComponent) {
                const scaleType = scaleComponent.get('type');
                // While discrete domain scales can handle invalid values, continuous scales can't.
                // Thus, for non-path marks, we have to filter null for scales with continuous domains.
                // (For path marks, we will use "defined" property and skip these values instead.)
                if (hasContinuousDomain(scaleType) && fieldDef.aggregate !== 'count' && !isPathMark(mark)) {
                    aggregator[fieldDef.field] = fieldDef; // we know that the fieldDef is a typed field def
                }
            }
            return aggregator;
        }, {});
        if (!keys(filter).length) {
            return null;
        }
        return new FilterInvalidNode(parent, filter);
    }
    dependentFields() {
        return new Set(keys(this.filter));
    }
    producedFields() {
        return new Set(); // filter does not produce any new fields
    }
    hash() {
        return `FilterInvalid ${hash(this.filter)}`;
    }
    /**
     * Create the VgTransforms for each of the filtered fields.
     */
    assemble() {
        const filters = keys(this.filter).reduce((vegaFilters, field) => {
            const fieldDef = this.filter[field];
            const ref = vgField(fieldDef, { expr: 'datum' });
            if (fieldDef !== null) {
                if (fieldDef.type === 'temporal') {
                    vegaFilters.push(`(isDate(${ref}) || (isValid(${ref}) && isFinite(+${ref})))`);
                }
                else if (fieldDef.type === 'quantitative') {
                    vegaFilters.push(`isValid(${ref})`);
                    vegaFilters.push(`isFinite(+${ref})`);
                }
                else {
                    // should never get here
                }
            }
            return vegaFilters;
        }, []);
        return filters.length > 0
            ? {
                type: 'filter',
                expr: filters.join(' && ')
            }
            : null;
    }
}
//# sourceMappingURL=filterinvalid.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/flatten.js


/**
 * A class for flatten transform nodes
 */
class FlattenTransformNode extends DataFlowNode {
    clone() {
        return new FlattenTransformNode(this.parent, duplicate(this.transform));
    }
    constructor(parent, transform) {
        super(parent);
        this.transform = transform;
        this.transform = duplicate(transform); // duplicate to prevent side effects
        const { flatten, as = [] } = this.transform;
        this.transform.as = flatten.map((f, i) => { var _a; return (_a = as[i]) !== null && _a !== void 0 ? _a : f; });
    }
    dependentFields() {
        return new Set(this.transform.flatten);
    }
    producedFields() {
        return new Set(this.transform.as);
    }
    hash() {
        return `FlattenTransform ${hash(this.transform)}`;
    }
    assemble() {
        const { flatten: fields, as } = this.transform;
        const result = {
            type: 'flatten',
            fields,
            as
        };
        return result;
    }
}
//# sourceMappingURL=flatten.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/fold.js


/**
 * A class for flatten transform nodes
 */
class FoldTransformNode extends DataFlowNode {
    clone() {
        return new FoldTransformNode(null, duplicate(this.transform));
    }
    constructor(parent, transform) {
        var _a, _b, _c;
        super(parent);
        this.transform = transform;
        this.transform = duplicate(transform); // duplicate to prevent side effects
        const specifiedAs = (_a = this.transform.as) !== null && _a !== void 0 ? _a : [undefined, undefined];
        this.transform.as = [(_b = specifiedAs[0]) !== null && _b !== void 0 ? _b : 'key', (_c = specifiedAs[1]) !== null && _c !== void 0 ? _c : 'value'];
    }
    dependentFields() {
        return new Set(this.transform.fold);
    }
    producedFields() {
        return new Set(this.transform.as);
    }
    hash() {
        return `FoldTransform ${hash(this.transform)}`;
    }
    assemble() {
        const { fold, as } = this.transform;
        const result = {
            type: 'fold',
            fields: fold,
            as
        };
        return result;
    }
}
//# sourceMappingURL=fold.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/geojson.js






class GeoJSONNode extends DataFlowNode {
    clone() {
        return new GeoJSONNode(null, duplicate(this.fields), this.geojson, this.signal);
    }
    static parseAll(parent, model) {
        if (model.component.projection && !model.component.projection.isFit) {
            return parent;
        }
        let geoJsonCounter = 0;
        for (const coordinates of [
            [LONGITUDE, LATITUDE],
            [LONGITUDE2, LATITUDE2]
        ]) {
            const pair = coordinates.map(channel => {
                const def = getFieldOrDatumDef(model.encoding[channel]);
                return isFieldDef(def)
                    ? def.field
                    : isDatumDef(def)
                        ? { expr: `${def.datum}` }
                        : isValueDef(def)
                            ? { expr: `${def['value']}` }
                            : undefined;
            });
            if (pair[0] || pair[1]) {
                parent = new GeoJSONNode(parent, pair, null, model.getName(`geojson_${geoJsonCounter++}`));
            }
        }
        if (model.channelHasField(SHAPE)) {
            const fieldDef = model.typedFieldDef(SHAPE);
            if (fieldDef.type === GEOJSON) {
                parent = new GeoJSONNode(parent, null, fieldDef.field, model.getName(`geojson_${geoJsonCounter++}`));
            }
        }
        return parent;
    }
    constructor(parent, fields, geojson, signal) {
        super(parent);
        this.fields = fields;
        this.geojson = geojson;
        this.signal = signal;
    }
    dependentFields() {
        var _a;
        const fields = ((_a = this.fields) !== null && _a !== void 0 ? _a : []).filter(vega_util_module/* isString */.Kg);
        return new Set([...(this.geojson ? [this.geojson] : []), ...fields]);
    }
    producedFields() {
        return new Set();
    }
    hash() {
        return `GeoJSON ${this.geojson} ${this.signal} ${hash(this.fields)}`;
    }
    assemble() {
        return [
            ...(this.geojson
                ? [
                    {
                        type: 'filter',
                        expr: `isValid(datum["${this.geojson}"])`
                    }
                ]
                : []),
            Object.assign(Object.assign(Object.assign({ type: 'geojson' }, (this.fields ? { fields: this.fields } : {})), (this.geojson ? { geojson: this.geojson } : {})), { signal: this.signal })
        ];
    }
}
//# sourceMappingURL=geojson.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/geopoint.js





class GeoPointNode extends DataFlowNode {
    clone() {
        return new GeoPointNode(null, this.projection, duplicate(this.fields), duplicate(this.as));
    }
    constructor(parent, projection, fields, as) {
        super(parent);
        this.projection = projection;
        this.fields = fields;
        this.as = as;
    }
    static parseAll(parent, model) {
        if (!model.projectionName()) {
            return parent;
        }
        for (const coordinates of [
            [LONGITUDE, LATITUDE],
            [LONGITUDE2, LATITUDE2]
        ]) {
            const pair = coordinates.map(channel => {
                const def = getFieldOrDatumDef(model.encoding[channel]);
                return isFieldDef(def)
                    ? def.field
                    : isDatumDef(def)
                        ? { expr: `${def.datum}` }
                        : isValueDef(def)
                            ? { expr: `${def['value']}` }
                            : undefined;
            });
            const suffix = coordinates[0] === LONGITUDE2 ? '2' : '';
            if (pair[0] || pair[1]) {
                parent = new GeoPointNode(parent, model.projectionName(), pair, [
                    model.getName(`x${suffix}`),
                    model.getName(`y${suffix}`)
                ]);
            }
        }
        return parent;
    }
    dependentFields() {
        return new Set(this.fields.filter(vega_util_module/* isString */.Kg));
    }
    producedFields() {
        return new Set(this.as);
    }
    hash() {
        return `Geopoint ${this.projection} ${hash(this.fields)} ${hash(this.as)}`;
    }
    assemble() {
        return {
            type: 'geopoint',
            projection: this.projection,
            fields: this.fields,
            as: this.as
        };
    }
}
//# sourceMappingURL=geopoint.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/impute.js





class ImputeNode extends DataFlowNode {
    clone() {
        return new ImputeNode(null, duplicate(this.transform));
    }
    constructor(parent, transform) {
        super(parent);
        this.transform = transform;
    }
    dependentFields() {
        var _a;
        return new Set([this.transform.impute, this.transform.key, ...((_a = this.transform.groupby) !== null && _a !== void 0 ? _a : [])]);
    }
    producedFields() {
        return new Set([this.transform.impute]);
    }
    processSequence(keyvals) {
        const { start = 0, stop, step } = keyvals;
        const result = [start, stop, ...(step ? [step] : [])].join(',');
        return { signal: `sequence(${result})` };
    }
    static makeFromTransform(parent, imputeTransform) {
        return new ImputeNode(parent, imputeTransform);
    }
    static makeFromEncoding(parent, model) {
        const encoding = model.encoding;
        const xDef = encoding.x;
        const yDef = encoding.y;
        if (isFieldDef(xDef) && isFieldDef(yDef)) {
            const imputedChannel = xDef.impute ? xDef : yDef.impute ? yDef : undefined;
            if (imputedChannel === undefined) {
                return undefined;
            }
            const keyChannel = xDef.impute ? yDef : yDef.impute ? xDef : undefined;
            const { method, value, frame, keyvals } = imputedChannel.impute;
            const groupbyFields = pathGroupingFields(model.mark, encoding);
            return new ImputeNode(parent, Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ impute: imputedChannel.field, key: keyChannel.field }, (method ? { method } : {})), (value !== undefined ? { value } : {})), (frame ? { frame } : {})), (keyvals !== undefined ? { keyvals } : {})), (groupbyFields.length ? { groupby: groupbyFields } : {})));
        }
        return null;
    }
    hash() {
        return `Impute ${hash(this.transform)}`;
    }
    assemble() {
        const { impute, key, keyvals, method, groupby, value, frame = [null, null] } = this.transform;
        const imputeTransform = Object.assign(Object.assign(Object.assign(Object.assign({ type: 'impute', field: impute, key }, (keyvals ? { keyvals: isImputeSequence(keyvals) ? this.processSequence(keyvals) : keyvals } : {})), { method: 'value' }), (groupby ? { groupby } : {})), { value: !method || method === 'value' ? value : null });
        if (method && method !== 'value') {
            const deriveNewField = Object.assign({ type: 'window', as: [`imputed_${impute}_value`], ops: [method], fields: [impute], frame, ignorePeers: false }, (groupby ? { groupby } : {}));
            const replaceOriginal = {
                type: 'formula',
                expr: `datum.${impute} === null ? datum.imputed_${impute}_value : datum.${impute}`,
                as: impute
            };
            return [imputeTransform, deriveNewField, replaceOriginal];
        }
        else {
            return [imputeTransform];
        }
    }
}
//# sourceMappingURL=impute.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/loess.js
var loess_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};


/**
 * A class for loess transform nodes
 */
class LoessTransformNode extends DataFlowNode {
    clone() {
        return new LoessTransformNode(null, duplicate(this.transform));
    }
    constructor(parent, transform) {
        var _a, _b, _c;
        super(parent);
        this.transform = transform;
        this.transform = duplicate(transform); // duplicate to prevent side effects
        const specifiedAs = (_a = this.transform.as) !== null && _a !== void 0 ? _a : [undefined, undefined];
        this.transform.as = [(_b = specifiedAs[0]) !== null && _b !== void 0 ? _b : transform.on, (_c = specifiedAs[1]) !== null && _c !== void 0 ? _c : transform.loess];
    }
    dependentFields() {
        var _a;
        return new Set([this.transform.loess, this.transform.on, ...((_a = this.transform.groupby) !== null && _a !== void 0 ? _a : [])]);
    }
    producedFields() {
        return new Set(this.transform.as);
    }
    hash() {
        return `LoessTransform ${hash(this.transform)}`;
    }
    assemble() {
        const _a = this.transform, { loess, on } = _a, rest = loess_rest(_a, ["loess", "on"]);
        const result = Object.assign({ type: 'loess', x: on, y: loess }, rest);
        return result;
    }
}
//# sourceMappingURL=loess.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/lookup.js








class LookupNode extends DataFlowNode {
    clone() {
        return new LookupNode(null, duplicate(this.transform), this.secondary);
    }
    constructor(parent, transform, secondary) {
        super(parent);
        this.transform = transform;
        this.secondary = secondary;
    }
    static make(parent, model, transform, counter) {
        const sources = model.component.data.sources;
        const { from } = transform;
        let fromOutputNode = null;
        if (isLookupData(from)) {
            let fromSource = findSource(from.data, sources);
            if (!fromSource) {
                fromSource = new SourceNode(from.data);
                sources.push(fromSource);
            }
            const fromOutputName = model.getName(`lookup_${counter}`);
            fromOutputNode = new OutputNode(fromSource, fromOutputName, DataSourceType.Lookup, model.component.data.outputNodeRefCounts);
            model.component.data.outputNodes[fromOutputName] = fromOutputNode;
        }
        else if (isLookupSelection(from)) {
            const selName = from.param;
            transform = Object.assign({ as: selName }, transform);
            let selCmpt;
            try {
                selCmpt = model.getSelectionComponent(varName(selName), selName);
            }
            catch (e) {
                throw new Error(cannotLookupVariableParameter(selName));
            }
            fromOutputNode = selCmpt.materialized;
            if (!fromOutputNode) {
                throw new Error(noSameUnitLookup(selName));
            }
        }
        return new LookupNode(parent, transform, fromOutputNode.getSource());
    }
    dependentFields() {
        return new Set([this.transform.lookup]);
    }
    producedFields() {
        return new Set(this.transform.as ? (0,vega_util_module/* array */.YO)(this.transform.as) : this.transform.from.fields);
    }
    hash() {
        return `Lookup ${hash({ transform: this.transform, secondary: this.secondary })}`;
    }
    assemble() {
        let foreign;
        if (this.transform.from.fields) {
            // lookup a few fields and add create a flat output
            foreign = Object.assign({ values: this.transform.from.fields }, (this.transform.as ? { as: (0,vega_util_module/* array */.YO)(this.transform.as) } : {}));
        }
        else {
            // lookup full record and nest it
            let asName = this.transform.as;
            if (!(0,vega_util_module/* isString */.Kg)(asName)) {
                warn(NO_FIELDS_NEEDS_AS);
                asName = '_lookup';
            }
            foreign = {
                as: [asName]
            };
        }
        return Object.assign(Object.assign({ type: 'lookup', from: this.secondary, key: this.transform.from.key, fields: [this.transform.lookup] }, foreign), (this.transform.default ? { default: this.transform.default } : {}));
    }
}
//# sourceMappingURL=lookup.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/quantile.js
var quantile_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};


/**
 * A class for quantile transform nodes
 */
class QuantileTransformNode extends DataFlowNode {
    clone() {
        return new QuantileTransformNode(null, duplicate(this.transform));
    }
    constructor(parent, transform) {
        var _a, _b, _c;
        super(parent);
        this.transform = transform;
        this.transform = duplicate(transform); // duplicate to prevent side effects
        const specifiedAs = (_a = this.transform.as) !== null && _a !== void 0 ? _a : [undefined, undefined];
        this.transform.as = [(_b = specifiedAs[0]) !== null && _b !== void 0 ? _b : 'prob', (_c = specifiedAs[1]) !== null && _c !== void 0 ? _c : 'value'];
    }
    dependentFields() {
        var _a;
        return new Set([this.transform.quantile, ...((_a = this.transform.groupby) !== null && _a !== void 0 ? _a : [])]);
    }
    producedFields() {
        return new Set(this.transform.as);
    }
    hash() {
        return `QuantileTransform ${hash(this.transform)}`;
    }
    assemble() {
        const _a = this.transform, { quantile } = _a, rest = quantile_rest(_a, ["quantile"]);
        const result = Object.assign({ type: 'quantile', field: quantile }, rest);
        return result;
    }
}
//# sourceMappingURL=quantile.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/regression.js
var regression_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};


/**
 * A class for regression transform nodes
 */
class RegressionTransformNode extends DataFlowNode {
    clone() {
        return new RegressionTransformNode(null, duplicate(this.transform));
    }
    constructor(parent, transform) {
        var _a, _b, _c;
        super(parent);
        this.transform = transform;
        this.transform = duplicate(transform); // duplicate to prevent side effects
        const specifiedAs = (_a = this.transform.as) !== null && _a !== void 0 ? _a : [undefined, undefined];
        this.transform.as = [(_b = specifiedAs[0]) !== null && _b !== void 0 ? _b : transform.on, (_c = specifiedAs[1]) !== null && _c !== void 0 ? _c : transform.regression];
    }
    dependentFields() {
        var _a;
        return new Set([this.transform.regression, this.transform.on, ...((_a = this.transform.groupby) !== null && _a !== void 0 ? _a : [])]);
    }
    producedFields() {
        return new Set(this.transform.as);
    }
    hash() {
        return `RegressionTransform ${hash(this.transform)}`;
    }
    assemble() {
        const _a = this.transform, { regression, on } = _a, rest = regression_rest(_a, ["regression", "on"]);
        const result = Object.assign({ type: 'regression', x: on, y: regression }, rest);
        return result;
    }
}
//# sourceMappingURL=regression.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/pivot.js


/**
 * A class for pivot transform nodes.
 */
class PivotTransformNode extends DataFlowNode {
    clone() {
        return new PivotTransformNode(null, duplicate(this.transform));
    }
    constructor(parent, transform) {
        super(parent);
        this.transform = transform;
    }
    addDimensions(fields) {
        var _a;
        this.transform.groupby = unique(((_a = this.transform.groupby) !== null && _a !== void 0 ? _a : []).concat(fields), d => d);
    }
    producedFields() {
        return undefined; // return undefined so that potentially everything can depend on the pivot
    }
    dependentFields() {
        var _a;
        return new Set([this.transform.pivot, this.transform.value, ...((_a = this.transform.groupby) !== null && _a !== void 0 ? _a : [])]);
    }
    hash() {
        return `PivotTransform ${hash(this.transform)}`;
    }
    assemble() {
        const { pivot, value, groupby, limit, op } = this.transform;
        return Object.assign(Object.assign(Object.assign({ type: 'pivot', field: pivot, value }, (limit !== undefined ? { limit } : {})), (op !== undefined ? { op } : {})), (groupby !== undefined ? { groupby } : {}));
    }
}
//# sourceMappingURL=pivot.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/sample.js


/**
 * A class for the sample transform nodes
 */
class SampleTransformNode extends DataFlowNode {
    clone() {
        return new SampleTransformNode(null, duplicate(this.transform));
    }
    constructor(parent, transform) {
        super(parent);
        this.transform = transform;
    }
    dependentFields() {
        return new Set();
    }
    producedFields() {
        return new Set();
    }
    hash() {
        return `SampleTransform ${hash(this.transform)}`;
    }
    assemble() {
        return {
            type: 'sample',
            size: this.transform.sample
        };
    }
}
//# sourceMappingURL=sample.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/assemble.js





























function makeWalkTree(data) {
    // to name datasources
    let datasetIndex = 0;
    /**
     * Recursively walk down the tree.
     */
    function walkTree(node, dataSource) {
        var _a;
        if (node instanceof SourceNode) {
            // If the source is a named data source or a data source with values, we need
            // to put it in a different data source. Otherwise, Vega may override the data.
            if (!node.isGenerator && !isUrlData(node.data)) {
                data.push(dataSource);
                const newData = {
                    name: null,
                    source: dataSource.name,
                    transform: []
                };
                dataSource = newData;
            }
        }
        if (node instanceof ParseNode) {
            if (node.parent instanceof SourceNode && !dataSource.source) {
                // If node's parent is a root source and the data source does not refer to another data source, use normal format parse
                dataSource.format = Object.assign(Object.assign({}, ((_a = dataSource.format) !== null && _a !== void 0 ? _a : {})), { parse: node.assembleFormatParse() });
                // add calculates for all nested fields
                dataSource.transform.push(...node.assembleTransforms(true));
            }
            else {
                // Otherwise use Vega expression to parse
                dataSource.transform.push(...node.assembleTransforms());
            }
        }
        if (node instanceof FacetNode) {
            if (!dataSource.name) {
                dataSource.name = `data_${datasetIndex++}`;
            }
            if (!dataSource.source || dataSource.transform.length > 0) {
                data.push(dataSource);
                node.data = dataSource.name;
            }
            else {
                node.data = dataSource.source;
            }
            data.push(...node.assemble());
            // break here because the rest of the tree has to be taken care of by the facet.
            return;
        }
        if (node instanceof GraticuleNode ||
            node instanceof SequenceNode ||
            node instanceof FilterInvalidNode ||
            node instanceof FilterNode ||
            node instanceof CalculateNode ||
            node instanceof GeoPointNode ||
            node instanceof AggregateNode ||
            node instanceof LookupNode ||
            node instanceof WindowTransformNode ||
            node instanceof JoinAggregateTransformNode ||
            node instanceof FoldTransformNode ||
            node instanceof FlattenTransformNode ||
            node instanceof DensityTransformNode ||
            node instanceof LoessTransformNode ||
            node instanceof QuantileTransformNode ||
            node instanceof RegressionTransformNode ||
            node instanceof IdentifierNode ||
            node instanceof SampleTransformNode ||
            node instanceof PivotTransformNode) {
            dataSource.transform.push(node.assemble());
        }
        if (node instanceof BinNode ||
            node instanceof TimeUnitNode ||
            node instanceof ImputeNode ||
            node instanceof StackNode ||
            node instanceof GeoJSONNode) {
            dataSource.transform.push(...node.assemble());
        }
        if (node instanceof OutputNode) {
            if (dataSource.source && dataSource.transform.length === 0) {
                node.setSource(dataSource.source);
            }
            else if (node.parent instanceof OutputNode) {
                // Note that an output node may be required but we still do not assemble a
                // separate data source for it.
                node.setSource(dataSource.name);
            }
            else {
                if (!dataSource.name) {
                    dataSource.name = `data_${datasetIndex++}`;
                }
                // Here we set the name of the datasource we generated. From now on
                // other assemblers can use it.
                node.setSource(dataSource.name);
                // if this node has more than one child, we will add a datasource automatically
                if (node.numChildren() === 1) {
                    data.push(dataSource);
                    const newData = {
                        name: null,
                        source: dataSource.name,
                        transform: []
                    };
                    dataSource = newData;
                }
            }
        }
        switch (node.numChildren()) {
            case 0:
                // done
                if (node instanceof OutputNode && (!dataSource.source || dataSource.transform.length > 0)) {
                    // do not push empty datasources that are simply references
                    data.push(dataSource);
                }
                break;
            case 1:
                walkTree(node.children[0], dataSource);
                break;
            default: {
                if (!dataSource.name) {
                    dataSource.name = `data_${datasetIndex++}`;
                }
                let source = dataSource.name;
                if (!dataSource.source || dataSource.transform.length > 0) {
                    data.push(dataSource);
                }
                else {
                    source = dataSource.source;
                }
                for (const child of node.children) {
                    const newData = {
                        name: null,
                        source,
                        transform: []
                    };
                    walkTree(child, newData);
                }
                break;
            }
        }
    }
    return walkTree;
}
/**
 * Assemble data sources that are derived from faceted data.
 */
function assembleFacetData(root) {
    const data = [];
    const walkTree = makeWalkTree(data);
    for (const child of root.children) {
        walkTree(child, {
            source: root.name,
            name: null,
            transform: []
        });
    }
    return data;
}
/**
 * Create Vega data array from a given compiled model and append all of them to the given array
 *
 * @param  model
 * @param  data array
 * @return modified data array
 */
function assembleRootData(dataComponent, datasets) {
    var _a, _b;
    const data = [];
    // dataComponent.sources.forEach(debug);
    // draw(dataComponent.sources);
    const walkTree = makeWalkTree(data);
    let sourceIndex = 0;
    for (const root of dataComponent.sources) {
        // assign a name if the source does not have a name yet
        if (!root.hasName()) {
            root.dataName = `source_${sourceIndex++}`;
        }
        const newData = root.assemble();
        walkTree(root, newData);
    }
    // remove empty transform arrays for cleaner output
    for (const d of data) {
        if (d.transform.length === 0) {
            delete d.transform;
        }
    }
    // move sources without transforms (the ones that are potentially used in lookups) to the beginning
    let whereTo = 0;
    for (const [i, d] of data.entries()) {
        if (((_a = d.transform) !== null && _a !== void 0 ? _a : []).length === 0 && !d.source) {
            data.splice(whereTo++, 0, data.splice(i, 1)[0]);
        }
    }
    // now fix the from references in lookup transforms
    for (const d of data) {
        for (const t of (_b = d.transform) !== null && _b !== void 0 ? _b : []) {
            if (t.type === 'lookup') {
                t.from = dataComponent.outputNodes[t.from].getSource();
            }
        }
    }
    // inline values for datasets that are in the datastore
    for (const d of data) {
        if (d.name in datasets) {
            d.values = datasets[d.name];
        }
    }
    return data;
}
//# sourceMappingURL=assemble.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/header/parse.js








function getHeaderType(orient) {
    if (orient === 'top' || orient === 'left' || isSignalRef(orient)) {
        // we always use header for orient signal since we can't dynamically make header becomes footer
        return 'header';
    }
    return 'footer';
}
function parseFacetHeaders(model) {
    for (const channel of FACET_CHANNELS) {
        parseFacetHeader(model, channel);
    }
    mergeChildAxis(model, 'x');
    mergeChildAxis(model, 'y');
}
function parseFacetHeader(model, channel) {
    var _a;
    const { facet, config, child, component } = model;
    if (model.channelHasField(channel)) {
        const fieldDef = facet[channel];
        const titleConfig = getHeaderProperty('title', null, config, channel);
        let title = channeldef_title(fieldDef, config, {
            allowDisabling: true,
            includeDefault: titleConfig === undefined || !!titleConfig
        });
        if (child.component.layoutHeaders[channel].title) {
            // TODO: better handle multiline titles
            title = (0,vega_util_module/* isArray */.cy)(title) ? title.join(', ') : title;
            // merge title with child to produce "Title / Subtitle / Sub-subtitle"
            title += ` / ${child.component.layoutHeaders[channel].title}`;
            child.component.layoutHeaders[channel].title = null;
        }
        const labelOrient = getHeaderProperty('labelOrient', fieldDef.header, config, channel);
        const labels = fieldDef.header !== null ? getFirstDefined((_a = fieldDef.header) === null || _a === void 0 ? void 0 : _a.labels, config.header.labels, true) : false;
        const headerType = contains(['bottom', 'right'], labelOrient) ? 'footer' : 'header';
        component.layoutHeaders[channel] = {
            title: fieldDef.header !== null ? title : null,
            facetFieldDef: fieldDef,
            [headerType]: channel === 'facet' ? [] : [makeHeaderComponent(model, channel, labels)]
        };
    }
}
function makeHeaderComponent(model, channel, labels) {
    const sizeType = channel === 'row' ? 'height' : 'width';
    return {
        labels,
        sizeSignal: model.child.component.layoutSize.get(sizeType) ? model.child.getSizeSignalRef(sizeType) : undefined,
        axes: []
    };
}
function mergeChildAxis(model, channel) {
    var _a;
    const { child } = model;
    if (child.component.axes[channel]) {
        const { layoutHeaders, resolve } = model.component;
        resolve.axis[channel] = parseGuideResolve(resolve, channel);
        if (resolve.axis[channel] === 'shared') {
            // For shared axis, move the axes to facet's header or footer
            const headerChannel = channel === 'x' ? 'column' : 'row';
            const layoutHeader = layoutHeaders[headerChannel];
            for (const axisComponent of child.component.axes[channel]) {
                const headerType = getHeaderType(axisComponent.get('orient'));
                (_a = layoutHeader[headerType]) !== null && _a !== void 0 ? _a : (layoutHeader[headerType] = [makeHeaderComponent(model, headerChannel, false)]);
                // FIXME: assemble shouldn't be called here, but we do it this way so we only extract the main part of the axes
                const mainAxis = assembleAxis(axisComponent, 'main', model.config, { header: true });
                if (mainAxis) {
                    // LayoutHeader no longer keep track of property precedence, thus let's combine.
                    layoutHeader[headerType][0].axes.push(mainAxis);
                }
                axisComponent.mainExtracted = true;
            }
        }
        else {
            // Otherwise do nothing for independent axes
        }
    }
}
//# sourceMappingURL=parse.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/layoutsize/parse.js








function parseLayerLayoutSize(model) {
    parseChildrenLayoutSize(model);
    parseNonUnitLayoutSizeForChannel(model, 'width');
    parseNonUnitLayoutSizeForChannel(model, 'height');
}
function parseConcatLayoutSize(model) {
    parseChildrenLayoutSize(model);
    // for columns === 1 (vconcat), we can completely merge width. Otherwise, we can treat merged width as childWidth.
    const widthType = model.layout.columns === 1 ? 'width' : 'childWidth';
    // for columns === undefined (hconcat), we can completely merge height. Otherwise, we can treat merged height as childHeight.
    const heightType = model.layout.columns === undefined ? 'height' : 'childHeight';
    parseNonUnitLayoutSizeForChannel(model, widthType);
    parseNonUnitLayoutSizeForChannel(model, heightType);
}
function parseChildrenLayoutSize(model) {
    for (const child of model.children) {
        child.parseLayoutSize();
    }
}
/**
 * Merge child layout size (width or height).
 */
function parseNonUnitLayoutSizeForChannel(model, layoutSizeType) {
    var _a;
    /*
     * For concat, the parent width or height might not be the same as the children's shared height.
     * For example, hconcat's subviews may share width, but the shared width is not the hconcat view's width.
     *
     * layoutSizeType represents the output of the view (could be childWidth/childHeight/width/height)
     * while the sizeType represents the properties of the child.
     */
    const sizeType = getSizeTypeFromLayoutSizeType(layoutSizeType);
    const channel = getPositionScaleChannel(sizeType);
    const resolve = model.component.resolve;
    const layoutSizeCmpt = model.component.layoutSize;
    let mergedSize;
    // Try to merge layout size
    for (const child of model.children) {
        const childSize = child.component.layoutSize.getWithExplicit(sizeType);
        const scaleResolve = (_a = resolve.scale[channel]) !== null && _a !== void 0 ? _a : defaultScaleResolve(channel, model);
        if (scaleResolve === 'independent' && childSize.value === 'step') {
            // Do not merge independent scales with range-step as their size depends
            // on the scale domains, which can be different between scales.
            mergedSize = undefined;
            break;
        }
        if (mergedSize) {
            if (scaleResolve === 'independent' && mergedSize.value !== childSize.value) {
                // For independent scale, only merge if all the sizes are the same.
                // If the values are different, abandon the merge!
                mergedSize = undefined;
                break;
            }
            mergedSize = mergeValuesWithExplicit(mergedSize, childSize, sizeType, '');
        }
        else {
            mergedSize = childSize;
        }
    }
    if (mergedSize) {
        // If merged, rename size and set size of all children.
        for (const child of model.children) {
            model.renameSignal(child.getName(sizeType), model.getName(layoutSizeType));
            child.component.layoutSize.set(sizeType, 'merged', false);
        }
        layoutSizeCmpt.setWithExplicit(layoutSizeType, mergedSize);
    }
    else {
        layoutSizeCmpt.setWithExplicit(layoutSizeType, {
            explicit: false,
            value: undefined
        });
    }
}
function parseUnitLayoutSize(model) {
    const { size, component } = model;
    for (const channel of POSITION_SCALE_CHANNELS) {
        const sizeType = getSizeChannel(channel);
        if (size[sizeType]) {
            const specifiedSize = size[sizeType];
            component.layoutSize.set(sizeType, isStep(specifiedSize) ? 'step' : specifiedSize, true);
        }
        else {
            const defaultSize = defaultUnitSize(model, sizeType);
            component.layoutSize.set(sizeType, defaultSize, false);
        }
    }
}
function defaultUnitSize(model, sizeType) {
    const channel = sizeType === 'width' ? 'x' : 'y';
    const config = model.config;
    const scaleComponent = model.getScaleComponent(channel);
    if (scaleComponent) {
        const scaleType = scaleComponent.get('type');
        const range = scaleComponent.get('range');
        if (hasDiscreteDomain(scaleType)) {
            const size = getViewConfigDiscreteSize(config.view, sizeType);
            if (isVgRangeStep(range) || isStep(size)) {
                // For discrete domain with range.step, use dynamic width/height
                return 'step';
            }
            else {
                return size;
            }
        }
        else {
            return getViewConfigContinuousSize(config.view, sizeType);
        }
    }
    else if (model.hasProjection || model.mark === 'arc') {
        // arc should use continuous size by default otherwise the pie is extremely small
        return getViewConfigContinuousSize(config.view, sizeType);
    }
    else {
        const size = getViewConfigDiscreteSize(config.view, sizeType);
        return isStep(size) ? size.step : size;
    }
}
//# sourceMappingURL=parse.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/facet.js























function facetSortFieldName(fieldDef, sort, opt) {
    return vgField(sort, Object.assign({ suffix: `by_${vgField(fieldDef)}` }, (opt !== null && opt !== void 0 ? opt : {})));
}
class FacetModel extends ModelWithField {
    constructor(spec, parent, parentGivenName, config) {
        super(spec, 'facet', parent, parentGivenName, config, spec.resolve);
        this.child = buildModel(spec.spec, this, this.getName('child'), undefined, config);
        this.children = [this.child];
        this.facet = this.initFacet(spec.facet);
    }
    initFacet(facet) {
        // clone to prevent side effect to the original spec
        if (!isFacetMapping(facet)) {
            return { facet: this.initFacetFieldDef(facet, 'facet') };
        }
        const channels = keys(facet);
        const normalizedFacet = {};
        for (const channel of channels) {
            if (![ROW, COLUMN].includes(channel)) {
                // Drop unsupported channel
                warn(incompatibleChannel(channel, 'facet'));
                break;
            }
            const fieldDef = facet[channel];
            if (fieldDef.field === undefined) {
                warn(emptyFieldDef(fieldDef, channel));
                break;
            }
            normalizedFacet[channel] = this.initFacetFieldDef(fieldDef, channel);
        }
        return normalizedFacet;
    }
    initFacetFieldDef(fieldDef, channel) {
        // Cast because we call initFieldDef, which assumes general FieldDef.
        // However, FacetFieldDef is a bit more constrained than the general FieldDef
        const facetFieldDef = initFieldDef(fieldDef, channel);
        if (facetFieldDef.header) {
            facetFieldDef.header = replaceExprRef(facetFieldDef.header);
        }
        else if (facetFieldDef.header === null) {
            facetFieldDef.header = null;
        }
        return facetFieldDef;
    }
    channelHasField(channel) {
        return !!this.facet[channel];
    }
    fieldDef(channel) {
        return this.facet[channel];
    }
    parseData() {
        this.component.data = parseData(this);
        this.child.parseData();
    }
    parseLayoutSize() {
        parseChildrenLayoutSize(this);
    }
    parseSelections() {
        // As a facet has a single child, the selection components are the same.
        // The child maintains its selections to assemble signals, which remain
        // within its unit.
        this.child.parseSelections();
        this.component.selection = this.child.component.selection;
    }
    parseMarkGroup() {
        this.child.parseMarkGroup();
    }
    parseAxesAndHeaders() {
        this.child.parseAxesAndHeaders();
        parseFacetHeaders(this);
    }
    assembleSelectionTopLevelSignals(signals) {
        return this.child.assembleSelectionTopLevelSignals(signals);
    }
    assembleSignals() {
        this.child.assembleSignals();
        return [];
    }
    assembleSelectionData(data) {
        return this.child.assembleSelectionData(data);
    }
    getHeaderLayoutMixins() {
        var _a, _b, _c;
        const layoutMixins = {};
        for (const channel of FACET_CHANNELS) {
            for (const headerType of HEADER_TYPES) {
                const layoutHeaderComponent = this.component.layoutHeaders[channel];
                const headerComponent = layoutHeaderComponent[headerType];
                const { facetFieldDef } = layoutHeaderComponent;
                if (facetFieldDef) {
                    const titleOrient = getHeaderProperty('titleOrient', facetFieldDef.header, this.config, channel);
                    if (['right', 'bottom'].includes(titleOrient)) {
                        const headerChannel = getHeaderChannel(channel, titleOrient);
                        (_a = layoutMixins.titleAnchor) !== null && _a !== void 0 ? _a : (layoutMixins.titleAnchor = {});
                        layoutMixins.titleAnchor[headerChannel] = 'end';
                    }
                }
                if (headerComponent === null || headerComponent === void 0 ? void 0 : headerComponent[0]) {
                    // set header/footerBand
                    const sizeType = channel === 'row' ? 'height' : 'width';
                    const bandType = headerType === 'header' ? 'headerBand' : 'footerBand';
                    if (channel !== 'facet' && !this.child.component.layoutSize.get(sizeType)) {
                        // If facet child does not have size signal, then apply headerBand
                        (_b = layoutMixins[bandType]) !== null && _b !== void 0 ? _b : (layoutMixins[bandType] = {});
                        layoutMixins[bandType][channel] = 0.5;
                    }
                    if (layoutHeaderComponent.title) {
                        (_c = layoutMixins.offset) !== null && _c !== void 0 ? _c : (layoutMixins.offset = {});
                        layoutMixins.offset[channel === 'row' ? 'rowTitle' : 'columnTitle'] = 10;
                    }
                }
            }
        }
        return layoutMixins;
    }
    assembleDefaultLayout() {
        const { column, row } = this.facet;
        const columns = column ? this.columnDistinctSignal() : row ? 1 : undefined;
        let align = 'all';
        // Do not align the cells if the scale corresponding to the direction is indepent.
        // We always align when we facet into both row and column.
        if (!row && this.component.resolve.scale.x === 'independent') {
            align = 'none';
        }
        else if (!column && this.component.resolve.scale.y === 'independent') {
            align = 'none';
        }
        return Object.assign(Object.assign(Object.assign({}, this.getHeaderLayoutMixins()), (columns ? { columns } : {})), { bounds: 'full', align });
    }
    assembleLayoutSignals() {
        // FIXME(https://github.com/vega/vega-lite/issues/1193): this can be incorrect if we have independent scales.
        return this.child.assembleLayoutSignals();
    }
    columnDistinctSignal() {
        if (this.parent && this.parent instanceof FacetModel) {
            // For nested facet, we will add columns to group mark instead
            // See discussion in https://github.com/vega/vega/issues/952
            // and https://github.com/vega/vega-view/releases/tag/v1.2.6
            return undefined;
        }
        else {
            // In facetNode.assemble(), the name is always this.getName('column') + '_layout'.
            const facetLayoutDataName = this.getName('column_domain');
            return { signal: `length(data('${facetLayoutDataName}'))` };
        }
    }
    assembleGroupStyle() {
        return undefined;
    }
    assembleGroup(signals) {
        if (this.parent && this.parent instanceof FacetModel) {
            // Provide number of columns for layout.
            // See discussion in https://github.com/vega/vega/issues/952
            // and https://github.com/vega/vega-view/releases/tag/v1.2.6
            return Object.assign(Object.assign({}, (this.channelHasField('column')
                ? {
                    encode: {
                        update: {
                            // TODO(https://github.com/vega/vega-lite/issues/2759):
                            // Correct the signal for facet of concat of facet_column
                            columns: { field: vgField(this.facet.column, { prefix: 'distinct' }) }
                        }
                    }
                }
                : {})), super.assembleGroup(signals));
        }
        return super.assembleGroup(signals);
    }
    /**
     * Aggregate cardinality for calculating size
     */
    getCardinalityAggregateForChild() {
        const fields = [];
        const ops = [];
        const as = [];
        if (this.child instanceof FacetModel) {
            if (this.child.channelHasField('column')) {
                const field = vgField(this.child.facet.column);
                fields.push(field);
                ops.push('distinct');
                as.push(`distinct_${field}`);
            }
        }
        else {
            for (const channel of POSITION_SCALE_CHANNELS) {
                const childScaleComponent = this.child.component.scales[channel];
                if (childScaleComponent && !childScaleComponent.merged) {
                    const type = childScaleComponent.get('type');
                    const range = childScaleComponent.get('range');
                    if (hasDiscreteDomain(type) && isVgRangeStep(range)) {
                        const domain = assembleDomain(this.child, channel);
                        const field = getFieldFromDomain(domain);
                        if (field) {
                            fields.push(field);
                            ops.push('distinct');
                            as.push(`distinct_${field}`);
                        }
                        else {
                            warn(unknownField(channel));
                        }
                    }
                }
            }
        }
        return { fields, ops, as };
    }
    assembleFacet() {
        const { name, data } = this.component.data.facetRoot;
        const { row, column } = this.facet;
        const { fields, ops, as } = this.getCardinalityAggregateForChild();
        const groupby = [];
        for (const channel of FACET_CHANNELS) {
            const fieldDef = this.facet[channel];
            if (fieldDef) {
                groupby.push(vgField(fieldDef));
                const { bin, sort } = fieldDef;
                if (isBinning(bin)) {
                    groupby.push(vgField(fieldDef, { binSuffix: 'end' }));
                }
                if (isSortField(sort)) {
                    const { field, op = DEFAULT_SORT_OP } = sort;
                    const outputName = facetSortFieldName(fieldDef, sort);
                    if (row && column) {
                        // For crossed facet, use pre-calculate field as it requires a different groupby
                        // For each calculated field, apply max and assign them to the same name as
                        // all values of the same group should be the same anyway.
                        fields.push(outputName);
                        ops.push('max');
                        as.push(outputName);
                    }
                    else {
                        fields.push(field);
                        ops.push(op);
                        as.push(outputName);
                    }
                }
                else if ((0,vega_util_module/* isArray */.cy)(sort)) {
                    const outputName = sortArrayIndexField(fieldDef, channel);
                    fields.push(outputName);
                    ops.push('max');
                    as.push(outputName);
                }
            }
        }
        const cross = !!row && !!column;
        return Object.assign({ name,
            data,
            groupby }, (cross || fields.length > 0
            ? {
                aggregate: Object.assign(Object.assign({}, (cross ? { cross } : {})), (fields.length ? { fields, ops, as } : {}))
            }
            : {}));
    }
    facetSortFields(channel) {
        const { facet } = this;
        const fieldDef = facet[channel];
        if (fieldDef) {
            if (isSortField(fieldDef.sort)) {
                return [facetSortFieldName(fieldDef, fieldDef.sort, { expr: 'datum' })];
            }
            else if ((0,vega_util_module/* isArray */.cy)(fieldDef.sort)) {
                return [sortArrayIndexField(fieldDef, channel, { expr: 'datum' })];
            }
            return [vgField(fieldDef, { expr: 'datum' })];
        }
        return [];
    }
    facetSortOrder(channel) {
        const { facet } = this;
        const fieldDef = facet[channel];
        if (fieldDef) {
            const { sort } = fieldDef;
            const order = (isSortField(sort) ? sort.order : !(0,vega_util_module/* isArray */.cy)(sort) && sort) || 'ascending';
            return [order];
        }
        return [];
    }
    assembleLabelTitle() {
        var _a;
        const { facet, config } = this;
        if (facet.facet) {
            // Facet always uses title to display labels
            return assembleLabelTitle(facet.facet, 'facet', config);
        }
        const ORTHOGONAL_ORIENT = {
            row: ['top', 'bottom'],
            column: ['left', 'right']
        };
        for (const channel of HEADER_CHANNELS) {
            if (facet[channel]) {
                const labelOrient = getHeaderProperty('labelOrient', (_a = facet[channel]) === null || _a === void 0 ? void 0 : _a.header, config, channel);
                if (ORTHOGONAL_ORIENT[channel].includes(labelOrient)) {
                    // Row/Column with orthogonal labelOrient must use title to display labels
                    return assembleLabelTitle(facet[channel], channel, config);
                }
            }
        }
        return undefined;
    }
    assembleMarks() {
        const { child } = this;
        // If we facet by two dimensions, we need to add a cross operator to the aggregation
        // so that we create all groups
        const facetRoot = this.component.data.facetRoot;
        const data = assembleFacetData(facetRoot);
        const encodeEntry = child.assembleGroupEncodeEntry(false);
        const title = this.assembleLabelTitle() || child.assembleTitle();
        const style = child.assembleGroupStyle();
        const markGroup = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ name: this.getName('cell'), type: 'group' }, (title ? { title } : {})), (style ? { style } : {})), { from: {
                facet: this.assembleFacet()
            }, 
            // TODO: move this to after data
            sort: {
                field: FACET_CHANNELS.map(c => this.facetSortFields(c)).flat(),
                order: FACET_CHANNELS.map(c => this.facetSortOrder(c)).flat()
            } }), (data.length > 0 ? { data } : {})), (encodeEntry ? { encode: { update: encodeEntry } } : {})), child.assembleGroup(assembleFacetSignals(this, [])));
        return [markGroup];
    }
    getMapping() {
        return this.facet;
    }
}
//# sourceMappingURL=facet.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/joinaggregatefacet.js




function makeJoinAggregateFromFacet(parent, facet) {
    const { row, column } = facet;
    if (row && column) {
        let newParent = null;
        // only need to make one for crossed facet
        for (const fieldDef of [row, column]) {
            if (isSortField(fieldDef.sort)) {
                const { field, op = DEFAULT_SORT_OP } = fieldDef.sort;
                parent = newParent = new JoinAggregateTransformNode(parent, {
                    joinaggregate: [
                        {
                            op,
                            field,
                            as: facetSortFieldName(fieldDef, fieldDef.sort, { forAs: true })
                        }
                    ],
                    groupby: [vgField(fieldDef)]
                });
            }
        }
        return newParent;
    }
    return null;
}
//# sourceMappingURL=joinaggregatefacet.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/data/parse.js





































function findSource(data, sources) {
    var _a, _b, _c, _d;
    for (const other of sources) {
        const otherData = other.data;
        // if both datasets have a name defined, we cannot merge
        if (data.name && other.hasName() && data.name !== other.dataName) {
            continue;
        }
        const formatMesh = (_a = data['format']) === null || _a === void 0 ? void 0 : _a.mesh;
        const otherFeature = (_b = otherData.format) === null || _b === void 0 ? void 0 : _b.feature;
        // feature and mesh are mutually exclusive
        if (formatMesh && otherFeature) {
            continue;
        }
        // we have to extract the same feature or mesh
        const formatFeature = (_c = data['format']) === null || _c === void 0 ? void 0 : _c.feature;
        if ((formatFeature || otherFeature) && formatFeature !== otherFeature) {
            continue;
        }
        const otherMesh = (_d = otherData.format) === null || _d === void 0 ? void 0 : _d.mesh;
        if ((formatMesh || otherMesh) && formatMesh !== otherMesh) {
            continue;
        }
        if (isInlineData(data) && isInlineData(otherData)) {
            if (deepEqual(data.values, otherData.values)) {
                return other;
            }
        }
        else if (isUrlData(data) && isUrlData(otherData)) {
            if (data.url === otherData.url) {
                return other;
            }
        }
        else if (isNamedData(data)) {
            if (data.name === other.dataName) {
                return other;
            }
        }
    }
    return null;
}
function parseRoot(model, sources) {
    if (model.data || !model.parent) {
        // if the model defines a data source or is the root, create a source node
        if (model.data === null) {
            // data: null means we should ignore the parent's data so we just create a new data source
            const source = new SourceNode({ values: [] });
            sources.push(source);
            return source;
        }
        const existingSource = findSource(model.data, sources);
        if (existingSource) {
            if (!isGenerator(model.data)) {
                existingSource.data.format = mergeDeep({}, model.data.format, existingSource.data.format);
            }
            // if the new source has a name but the existing one does not, we can set it
            if (!existingSource.hasName() && model.data.name) {
                existingSource.dataName = model.data.name;
            }
            return existingSource;
        }
        else {
            const source = new SourceNode(model.data);
            sources.push(source);
            return source;
        }
    }
    else {
        // If we don't have a source defined (overriding parent's data), use the parent's facet root or main.
        return model.parent.component.data.facetRoot
            ? model.parent.component.data.facetRoot
            : model.parent.component.data.main;
    }
}
/**
 * Parses a transform array into a chain of connected dataflow nodes.
 */
function parseTransformArray(head, model, ancestorParse) {
    var _a, _b;
    let lookupCounter = 0;
    for (const t of model.transforms) {
        let derivedType = undefined;
        let transformNode;
        if (isCalculate(t)) {
            transformNode = head = new CalculateNode(head, t);
            derivedType = 'derived';
        }
        else if (isFilter(t)) {
            const implicit = getImplicitFromFilterTransform(t);
            transformNode = head = (_a = ParseNode.makeWithAncestors(head, {}, implicit, ancestorParse)) !== null && _a !== void 0 ? _a : head;
            head = new FilterNode(head, model, t.filter);
        }
        else if (isBin(t)) {
            transformNode = head = BinNode.makeFromTransform(head, t, model);
            derivedType = 'number';
        }
        else if (isTimeUnit(t)) {
            derivedType = 'date';
            const parsedAs = ancestorParse.getWithExplicit(t.field);
            // Create parse node because the input to time unit is always date.
            if (parsedAs.value === undefined) {
                head = new ParseNode(head, { [t.field]: derivedType });
                ancestorParse.set(t.field, derivedType, false);
            }
            transformNode = head = TimeUnitNode.makeFromTransform(head, t);
        }
        else if (transform_isAggregate(t)) {
            transformNode = head = AggregateNode.makeFromTransform(head, t);
            derivedType = 'number';
            if (requiresSelectionId(model)) {
                head = new IdentifierNode(head);
            }
        }
        else if (isLookup(t)) {
            transformNode = head = LookupNode.make(head, model, t, lookupCounter++);
            derivedType = 'derived';
        }
        else if (isWindow(t)) {
            transformNode = head = new WindowTransformNode(head, t);
            derivedType = 'number';
        }
        else if (isJoinAggregate(t)) {
            transformNode = head = new JoinAggregateTransformNode(head, t);
            derivedType = 'number';
        }
        else if (isStack(t)) {
            transformNode = head = StackNode.makeFromTransform(head, t);
            derivedType = 'derived';
        }
        else if (isFold(t)) {
            transformNode = head = new FoldTransformNode(head, t);
            derivedType = 'derived';
        }
        else if (isFlatten(t)) {
            transformNode = head = new FlattenTransformNode(head, t);
            derivedType = 'derived';
        }
        else if (isPivot(t)) {
            transformNode = head = new PivotTransformNode(head, t);
            derivedType = 'derived';
        }
        else if (isSample(t)) {
            head = new SampleTransformNode(head, t);
        }
        else if (isImpute(t)) {
            transformNode = head = ImputeNode.makeFromTransform(head, t);
            derivedType = 'derived';
        }
        else if (isDensity(t)) {
            transformNode = head = new DensityTransformNode(head, t);
            derivedType = 'derived';
        }
        else if (isQuantile(t)) {
            transformNode = head = new QuantileTransformNode(head, t);
            derivedType = 'derived';
        }
        else if (isRegression(t)) {
            transformNode = head = new RegressionTransformNode(head, t);
            derivedType = 'derived';
        }
        else if (isLoess(t)) {
            transformNode = head = new LoessTransformNode(head, t);
            derivedType = 'derived';
        }
        else {
            warn(invalidTransformIgnored(t));
            continue;
        }
        if (transformNode && derivedType !== undefined) {
            for (const field of (_b = transformNode.producedFields()) !== null && _b !== void 0 ? _b : []) {
                ancestorParse.set(field, derivedType, false);
            }
        }
    }
    return head;
}
/*
Description of the dataflow (http://asciiflow.com/):
     +--------+
     | Source |
     +---+----+
         |
         v
     FormatParse
     (explicit)
         |
         v
     Transforms
(Filter, Calculate, Binning, TimeUnit, Aggregate, Window, ...)
         |
         v
     FormatParse
     (implicit)
         |
         v
 Binning (in `encoding`)
         |
         v
 Timeunit (in `encoding`)
         |
         v
Formula From Sort Array
         |
         v
      +--+--+
      | Raw |
      +-----+
         |
         v
  Aggregate (in `encoding`)
         |
         v
  Stack (in `encoding`)
         |
         v
  Invalid Filter
         |
         v
   +----------+
   |   Main   |
   +----------+
         |
         v
     +-------+
     | Facet |----> "column", "column-layout", and "row"
     +-------+
         |
         v
  ...Child data...
*/
function parseData(model) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    let head = parseRoot(model, model.component.data.sources);
    const { outputNodes, outputNodeRefCounts } = model.component.data;
    const data = model.data;
    const newData = data && (isGenerator(data) || isUrlData(data) || isInlineData(data));
    const ancestorParse = !newData && model.parent ? model.parent.component.data.ancestorParse.clone() : new AncestorParse();
    if (isGenerator(data)) {
        // insert generator transform
        if (isSequenceGenerator(data)) {
            head = new SequenceNode(head, data.sequence);
        }
        else if (isGraticuleGenerator(data)) {
            head = new GraticuleNode(head, data.graticule);
        }
        // no parsing necessary for generator
        ancestorParse.parseNothing = true;
    }
    else if (((_a = data === null || data === void 0 ? void 0 : data.format) === null || _a === void 0 ? void 0 : _a.parse) === null) {
        // format.parse: null means disable parsing
        ancestorParse.parseNothing = true;
    }
    head = (_b = ParseNode.makeExplicit(head, model, ancestorParse)) !== null && _b !== void 0 ? _b : head;
    // Default discrete selections require an identifer transform to
    // uniquely identify data points. Add this transform at the head of
    // the pipeline such that the identifier field is available for all
    // subsequent datasets. During optimization, we will remove this
    // transform if it proves to be unnecessary. Additional identifier
    // transforms will be necessary when new tuples are constructed
    // (e.g., post-aggregation).
    head = new IdentifierNode(head);
    // HACK: This is equivalent for merging bin extent for union scale.
    // FIXME(https://github.com/vega/vega-lite/issues/2270): Correctly merge extent / bin node for shared bin scale
    const parentIsLayer = model.parent && isLayerModel(model.parent);
    if (isUnitModel(model) || isFacetModel(model)) {
        if (parentIsLayer) {
            head = (_c = BinNode.makeFromEncoding(head, model)) !== null && _c !== void 0 ? _c : head;
        }
    }
    if (model.transforms.length > 0) {
        head = parseTransformArray(head, model, ancestorParse);
    }
    // create parse nodes for fields that need to be parsed (or flattened) implicitly
    const implicitSelection = getImplicitFromSelection(model);
    const implicitEncoding = getImplicitFromEncoding(model);
    head = (_d = ParseNode.makeWithAncestors(head, {}, Object.assign(Object.assign({}, implicitSelection), implicitEncoding), ancestorParse)) !== null && _d !== void 0 ? _d : head;
    if (isUnitModel(model)) {
        head = GeoJSONNode.parseAll(head, model);
        head = GeoPointNode.parseAll(head, model);
    }
    if (isUnitModel(model) || isFacetModel(model)) {
        if (!parentIsLayer) {
            head = (_e = BinNode.makeFromEncoding(head, model)) !== null && _e !== void 0 ? _e : head;
        }
        head = (_f = TimeUnitNode.makeFromEncoding(head, model)) !== null && _f !== void 0 ? _f : head;
        head = CalculateNode.parseAllForSortIndex(head, model);
    }
    // add an output node pre aggregation
    const rawName = model.getDataName(DataSourceType.Raw);
    const raw = new OutputNode(head, rawName, DataSourceType.Raw, outputNodeRefCounts);
    outputNodes[rawName] = raw;
    head = raw;
    if (isUnitModel(model)) {
        const agg = AggregateNode.makeFromEncoding(head, model);
        if (agg) {
            head = agg;
            if (requiresSelectionId(model)) {
                head = new IdentifierNode(head);
            }
        }
        head = (_g = ImputeNode.makeFromEncoding(head, model)) !== null && _g !== void 0 ? _g : head;
        head = (_h = StackNode.makeFromEncoding(head, model)) !== null && _h !== void 0 ? _h : head;
    }
    if (isUnitModel(model)) {
        head = (_j = FilterInvalidNode.make(head, model)) !== null && _j !== void 0 ? _j : head;
    }
    // output node for marks
    const mainName = model.getDataName(DataSourceType.Main);
    const main = new OutputNode(head, mainName, DataSourceType.Main, outputNodeRefCounts);
    outputNodes[mainName] = main;
    head = main;
    if (isUnitModel(model)) {
        materializeSelections(model, main);
    }
    // add facet marker
    let facetRoot = null;
    if (isFacetModel(model)) {
        const facetName = model.getName('facet');
        // Derive new aggregate for facet's sort field
        // augment data source with new fields for crossed facet
        head = (_k = makeJoinAggregateFromFacet(head, model.facet)) !== null && _k !== void 0 ? _k : head;
        facetRoot = new FacetNode(head, model, facetName, main.getSource());
        outputNodes[facetName] = facetRoot;
    }
    return Object.assign(Object.assign({}, model.component.data), { outputNodes,
        outputNodeRefCounts,
        raw,
        main,
        facetRoot,
        ancestorParse });
}
//# sourceMappingURL=parse.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/concat.js








class ConcatModel extends Model {
    constructor(spec, parent, parentGivenName, config) {
        var _a, _b, _c, _d;
        super(spec, 'concat', parent, parentGivenName, config, spec.resolve);
        if (((_b = (_a = spec.resolve) === null || _a === void 0 ? void 0 : _a.axis) === null || _b === void 0 ? void 0 : _b.x) === 'shared' || ((_d = (_c = spec.resolve) === null || _c === void 0 ? void 0 : _c.axis) === null || _d === void 0 ? void 0 : _d.y) === 'shared') {
            warn(CONCAT_CANNOT_SHARE_AXIS);
        }
        this.children = this.getChildren(spec).map((child, i) => {
            return buildModel(child, this, this.getName(`concat_${i}`), undefined, config);
        });
    }
    parseData() {
        this.component.data = parseData(this);
        for (const child of this.children) {
            child.parseData();
        }
    }
    parseSelections() {
        // Merge selections up the hierarchy so that they may be referenced
        // across unit specs. Persist their definitions within each child
        // to assemble signals which remain within output Vega unit groups.
        this.component.selection = {};
        for (const child of this.children) {
            child.parseSelections();
            for (const key of keys(child.component.selection)) {
                this.component.selection[key] = child.component.selection[key];
            }
        }
    }
    parseMarkGroup() {
        for (const child of this.children) {
            child.parseMarkGroup();
        }
    }
    parseAxesAndHeaders() {
        for (const child of this.children) {
            child.parseAxesAndHeaders();
        }
        // TODO(#2415): support shared axes
    }
    getChildren(spec) {
        if (isVConcatSpec(spec)) {
            return spec.vconcat;
        }
        else if (isHConcatSpec(spec)) {
            return spec.hconcat;
        }
        return spec.concat;
    }
    parseLayoutSize() {
        parseConcatLayoutSize(this);
    }
    parseAxisGroup() {
        return null;
    }
    assembleSelectionTopLevelSignals(signals) {
        return this.children.reduce((sg, child) => child.assembleSelectionTopLevelSignals(sg), signals);
    }
    assembleSignals() {
        this.children.forEach(child => child.assembleSignals());
        return [];
    }
    assembleLayoutSignals() {
        const layoutSignals = assembleLayoutSignals(this);
        for (const child of this.children) {
            layoutSignals.push(...child.assembleLayoutSignals());
        }
        return layoutSignals;
    }
    assembleSelectionData(data) {
        return this.children.reduce((db, child) => child.assembleSelectionData(db), data);
    }
    assembleMarks() {
        // only children have marks
        return this.children.map(child => {
            const title = child.assembleTitle();
            const style = child.assembleGroupStyle();
            const encodeEntry = child.assembleGroupEncodeEntry(false);
            return Object.assign(Object.assign(Object.assign(Object.assign({ type: 'group', name: child.getName('group') }, (title ? { title } : {})), (style ? { style } : {})), (encodeEntry ? { encode: { update: encodeEntry } } : {})), child.assembleGroup());
        });
    }
    assembleGroupStyle() {
        return undefined;
    }
    assembleDefaultLayout() {
        const columns = this.layout.columns;
        return Object.assign(Object.assign({}, (columns != null ? { columns } : {})), { bounds: 'full', 
            // Use align each so it can work with multiple plots with different size
            align: 'each' });
    }
}
//# sourceMappingURL=concat.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/axis/component.js




function isFalseOrNull(v) {
    return v === false || v === null;
}
const AXIS_COMPONENT_PROPERTIES_INDEX = Object.assign(Object.assign({ disable: 1, gridScale: 1, scale: 1 }, COMMON_AXIS_PROPERTIES_INDEX), { labelExpr: 1, encode: 1 });
const AXIS_COMPONENT_PROPERTIES = keys(AXIS_COMPONENT_PROPERTIES_INDEX);
class AxisComponent extends Split {
    constructor(explicit = {}, implicit = {}, mainExtracted = false) {
        super();
        this.explicit = explicit;
        this.implicit = implicit;
        this.mainExtracted = mainExtracted;
    }
    clone() {
        return new AxisComponent(duplicate(this.explicit), duplicate(this.implicit), this.mainExtracted);
    }
    hasAxisPart(part) {
        // FIXME(https://github.com/vega/vega-lite/issues/2552) this method can be wrong if users use a Vega theme.
        if (part === 'axis') {
            // always has the axis container part
            return true;
        }
        if (part === 'grid' || part === 'title') {
            return !!this.get(part);
        }
        // Other parts are enabled by default, so they should not be false or null.
        return !isFalseOrNull(this.get(part));
    }
    hasOrientSignalRef() {
        return isSignalRef(this.explicit.orient);
    }
}
//# sourceMappingURL=component.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/axis/encode.js



function encode_labels(model, channel, specifiedLabelsSpec) {
    var _a;
    const { encoding, config } = model;
    const fieldOrDatumDef = (_a = getFieldOrDatumDef(encoding[channel])) !== null && _a !== void 0 ? _a : getFieldOrDatumDef(encoding[getSecondaryRangeChannel(channel)]);
    const axis = model.axis(channel) || {};
    const { format, formatType } = axis;
    if (isCustomFormatType(formatType)) {
        return Object.assign({ text: formatCustomType({
                fieldOrDatumDef,
                field: 'datum.value',
                format,
                formatType,
                config
            }) }, specifiedLabelsSpec);
    }
    else if (format === undefined && formatType === undefined && config.customFormatTypes) {
        if (channelDefType(fieldOrDatumDef) === 'quantitative') {
            if (isPositionFieldOrDatumDef(fieldOrDatumDef) &&
                fieldOrDatumDef.stack === 'normalize' &&
                config.normalizedNumberFormatType) {
                return Object.assign({ text: formatCustomType({
                        fieldOrDatumDef,
                        field: 'datum.value',
                        format: config.normalizedNumberFormat,
                        formatType: config.normalizedNumberFormatType,
                        config
                    }) }, specifiedLabelsSpec);
            }
            else if (config.numberFormatType) {
                return Object.assign({ text: formatCustomType({
                        fieldOrDatumDef,
                        field: 'datum.value',
                        format: config.numberFormat,
                        formatType: config.numberFormatType,
                        config
                    }) }, specifiedLabelsSpec);
            }
        }
        if (channelDefType(fieldOrDatumDef) === 'temporal' &&
            config.timeFormatType &&
            isFieldDef(fieldOrDatumDef) &&
            !fieldOrDatumDef.timeUnit) {
            return Object.assign({ text: formatCustomType({
                    fieldOrDatumDef,
                    field: 'datum.value',
                    format: config.timeFormat,
                    formatType: config.timeFormatType,
                    config
                }) }, specifiedLabelsSpec);
        }
    }
    return specifiedLabelsSpec;
}
//# sourceMappingURL=encode.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/axis/parse.js













function parseUnitAxes(model) {
    return POSITION_SCALE_CHANNELS.reduce((axis, channel) => {
        if (model.component.scales[channel]) {
            axis[channel] = [parseAxis(channel, model)];
        }
        return axis;
    }, {});
}
const OPPOSITE_ORIENT = {
    bottom: 'top',
    top: 'bottom',
    left: 'right',
    right: 'left'
};
function parseLayerAxes(model) {
    var _a;
    const { axes, resolve } = model.component;
    const axisCount = { top: 0, bottom: 0, right: 0, left: 0 };
    for (const child of model.children) {
        child.parseAxesAndHeaders();
        for (const channel of keys(child.component.axes)) {
            resolve.axis[channel] = parseGuideResolve(model.component.resolve, channel);
            if (resolve.axis[channel] === 'shared') {
                // If the resolve says shared (and has not been overridden)
                // We will try to merge and see if there is a conflict
                axes[channel] = mergeAxisComponents(axes[channel], child.component.axes[channel]);
                if (!axes[channel]) {
                    // If merge returns nothing, there is a conflict so we cannot make the axis shared.
                    // Thus, mark axis as independent and remove the axis component.
                    resolve.axis[channel] = 'independent';
                    delete axes[channel];
                }
            }
        }
    }
    // Move axes to layer's axis component and merge shared axes
    for (const channel of POSITION_SCALE_CHANNELS) {
        for (const child of model.children) {
            if (!child.component.axes[channel]) {
                // skip if the child does not have a particular axis
                continue;
            }
            if (resolve.axis[channel] === 'independent') {
                // If axes are independent, concat the axisComponent array.
                axes[channel] = ((_a = axes[channel]) !== null && _a !== void 0 ? _a : []).concat(child.component.axes[channel]);
                // Automatically adjust orient
                for (const axisComponent of child.component.axes[channel]) {
                    const { value: orient, explicit } = axisComponent.getWithExplicit('orient');
                    if (isSignalRef(orient)) {
                        continue;
                    }
                    if (axisCount[orient] > 0 && !explicit) {
                        // Change axis orient if the number do not match
                        const oppositeOrient = OPPOSITE_ORIENT[orient];
                        if (axisCount[orient] > axisCount[oppositeOrient]) {
                            axisComponent.set('orient', oppositeOrient, false);
                        }
                    }
                    axisCount[orient]++;
                    // TODO(https://github.com/vega/vega-lite/issues/2634): automatically add extra offset?
                }
            }
            // After merging, make sure to remove axes from child
            delete child.component.axes[channel];
        }
        // Suppress grid lines for dual axis charts (https://github.com/vega/vega-lite/issues/4676)
        if (resolve.axis[channel] === 'independent' && axes[channel] && axes[channel].length > 1) {
            for (const axisCmpt of axes[channel]) {
                if (!!axisCmpt.get('grid') && !axisCmpt.explicit.grid) {
                    axisCmpt.implicit.grid = false;
                }
            }
        }
    }
}
function mergeAxisComponents(mergedAxisCmpts, childAxisCmpts) {
    if (mergedAxisCmpts) {
        // FIXME: this is a bit wrong once we support multiple axes
        if (mergedAxisCmpts.length !== childAxisCmpts.length) {
            return undefined; // Cannot merge axis component with different number of axes.
        }
        const length = mergedAxisCmpts.length;
        for (let i = 0; i < length; i++) {
            const merged = mergedAxisCmpts[i];
            const child = childAxisCmpts[i];
            if (!!merged !== !!child) {
                return undefined;
            }
            else if (merged && child) {
                const mergedOrient = merged.getWithExplicit('orient');
                const childOrient = child.getWithExplicit('orient');
                if (mergedOrient.explicit && childOrient.explicit && mergedOrient.value !== childOrient.value) {
                    // TODO: throw warning if resolve is explicit (We don't have info about explicit/implicit resolve yet.)
                    // Cannot merge due to inconsistent orient
                    return undefined;
                }
                else {
                    mergedAxisCmpts[i] = mergeAxisComponent(merged, child);
                }
            }
        }
    }
    else {
        // For first one, return a copy of the child
        return childAxisCmpts.map(axisComponent => axisComponent.clone());
    }
    return mergedAxisCmpts;
}
function mergeAxisComponent(merged, child) {
    for (const prop of AXIS_COMPONENT_PROPERTIES) {
        const mergedValueWithExplicit = mergeValuesWithExplicit(merged.getWithExplicit(prop), child.getWithExplicit(prop), prop, 'axis', 
        // Tie breaker function
        (v1, v2) => {
            switch (prop) {
                case 'title':
                    return mergeTitleComponent(v1, v2);
                case 'gridScale':
                    return {
                        explicit: v1.explicit,
                        value: getFirstDefined(v1.value, v2.value)
                    };
            }
            return defaultTieBreaker(v1, v2, prop, 'axis');
        });
        merged.setWithExplicit(prop, mergedValueWithExplicit);
    }
    return merged;
}
function parse_isExplicit(value, property, axis, model, channel) {
    if (property === 'disable') {
        return axis !== undefined; // if axis is specified or null/false, then its enable/disable state is explicit
    }
    axis = axis || {};
    switch (property) {
        case 'titleAngle':
        case 'labelAngle':
            return value === (isSignalRef(axis.labelAngle) ? axis.labelAngle : normalizeAngle(axis.labelAngle));
        case 'values':
            return !!axis.values;
        // specified axis.values is already respected, but may get transformed.
        case 'encode':
            // both VL axis.encoding and axis.labelAngle affect VG axis.encode
            return !!axis.encoding || !!axis.labelAngle;
        case 'title':
            // title can be explicit if fieldDef.title is set
            if (value === getFieldDefTitle(model, channel)) {
                return true;
            }
    }
    // Otherwise, things are explicit if the returned value matches the specified property
    return value === axis[property];
}
/**
 * Properties to always include values from config
 */
const propsToAlwaysIncludeConfig = new Set([
    'grid',
    'translate',
    // the rest are not axis configs in Vega, but are in VL, so we need to set too.
    'format',
    'formatType',
    'orient',
    'labelExpr',
    'tickCount',
    'position',
    'tickMinStep'
]);
function parseAxis(channel, model) {
    var _a, _b, _c;
    let axis = model.axis(channel);
    const axisComponent = new AxisComponent();
    const fieldOrDatumDef = getFieldOrDatumDef(model.encoding[channel]);
    const { mark, config } = model;
    const orient = (axis === null || axis === void 0 ? void 0 : axis.orient) ||
        ((_a = config[channel === 'x' ? 'axisX' : 'axisY']) === null || _a === void 0 ? void 0 : _a.orient) ||
        ((_b = config.axis) === null || _b === void 0 ? void 0 : _b.orient) ||
        defaultOrient(channel);
    const scaleType = model.getScaleComponent(channel).get('type');
    const axisConfigs = getAxisConfigs(channel, scaleType, orient, model.config);
    const disable = axis !== undefined ? !axis : getAxisConfig('disable', config.style, axis === null || axis === void 0 ? void 0 : axis.style, axisConfigs).configValue;
    axisComponent.set('disable', disable, axis !== undefined);
    if (disable) {
        return axisComponent;
    }
    axis = axis || {};
    const labelAngle = getLabelAngle(fieldOrDatumDef, axis, channel, config.style, axisConfigs);
    const ruleParams = {
        fieldOrDatumDef,
        axis,
        channel,
        model,
        scaleType,
        orient,
        labelAngle,
        mark,
        config
    };
    // 1.2. Add properties
    for (const property of AXIS_COMPONENT_PROPERTIES) {
        const value = property in axisRules ? axisRules[property](ruleParams) : isAxisProperty(property) ? axis[property] : undefined;
        const hasValue = value !== undefined;
        const explicit = parse_isExplicit(value, property, axis, model, channel);
        if (hasValue && explicit) {
            axisComponent.set(property, value, explicit);
        }
        else {
            const { configValue = undefined, configFrom = undefined } = isAxisProperty(property) && property !== 'values'
                ? getAxisConfig(property, config.style, axis.style, axisConfigs)
                : {};
            const hasConfigValue = configValue !== undefined;
            if (hasValue && !hasConfigValue) {
                // only set property if it is explicitly set or has no config value (otherwise we will accidentally override config)
                axisComponent.set(property, value, explicit);
            }
            else if (
            // Cases need implicit values
            // 1. Axis config that aren't available in Vega
            !(configFrom === 'vgAxisConfig') ||
                // 2. Certain properties are always included (see `propsToAlwaysIncludeConfig`'s declaration for more details)
                (propsToAlwaysIncludeConfig.has(property) && hasConfigValue) ||
                // 3. Conditional axis values and signals
                isConditionalAxisValue(configValue) ||
                isSignalRef(configValue)) {
                // If a config is specified and is conditional, copy conditional value from axis config
                axisComponent.set(property, configValue, false);
            }
        }
    }
    // 2) Add guide encode definition groups
    const axisEncoding = (_c = axis.encoding) !== null && _c !== void 0 ? _c : {};
    const axisEncode = AXIS_PARTS.reduce((e, part) => {
        var _a;
        if (!axisComponent.hasAxisPart(part)) {
            // No need to create encode for a disabled part.
            return e;
        }
        const axisEncodingPart = guideEncodeEntry((_a = axisEncoding[part]) !== null && _a !== void 0 ? _a : {}, model);
        const value = part === 'labels' ? encode_labels(model, channel, axisEncodingPart) : axisEncodingPart;
        if (value !== undefined && !isEmpty(value)) {
            e[part] = { update: value };
        }
        return e;
    }, {});
    // FIXME: By having encode as one property, we won't have fine grained encode merging.
    if (!isEmpty(axisEncode)) {
        axisComponent.set('encode', axisEncode, !!axis.encoding || axis.labelAngle !== undefined);
    }
    return axisComponent;
}
//# sourceMappingURL=parse.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/layoutsize/init.js




function initLayoutSize({ encoding, size }) {
    for (const channel of POSITION_SCALE_CHANNELS) {
        const sizeType = getSizeChannel(channel);
        if (isStep(size[sizeType])) {
            if (isContinuousFieldOrDatumDef(encoding[channel])) {
                delete size[sizeType];
                warn(stepDropped(sizeType));
            }
        }
    }
    return size;
}
//# sourceMappingURL=init.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/init.js









function initMarkdef(originalMarkDef, encoding, config) {
    // FIXME: markDef expects that exprRefs are replaced recursively but replaceExprRef only replaces the top level
    const markDef = replaceExprRef(originalMarkDef);
    // set orient, which can be overridden by rules as sometimes the specified orient is invalid.
    const specifiedOrient = getMarkPropOrConfig('orient', markDef, config);
    markDef.orient = orient(markDef.type, encoding, specifiedOrient);
    if (specifiedOrient !== undefined && specifiedOrient !== markDef.orient) {
        warn(orientOverridden(markDef.orient, specifiedOrient));
    }
    if (markDef.type === 'bar' && markDef.orient) {
        const cornerRadiusEnd = getMarkPropOrConfig('cornerRadiusEnd', markDef, config);
        if (cornerRadiusEnd !== undefined) {
            const newProps = (markDef.orient === 'horizontal' && encoding.x2) || (markDef.orient === 'vertical' && encoding.y2)
                ? ['cornerRadius']
                : BAR_CORNER_RADIUS_INDEX[markDef.orient];
            for (const newProp of newProps) {
                markDef[newProp] = cornerRadiusEnd;
            }
            if (markDef.cornerRadiusEnd !== undefined) {
                delete markDef.cornerRadiusEnd; // no need to keep the original cap cornerRadius
            }
        }
    }
    // set opacity and filled if not specified in mark config
    const specifiedOpacity = getMarkPropOrConfig('opacity', markDef, config);
    if (specifiedOpacity === undefined) {
        markDef.opacity = opacity(markDef.type, encoding);
    }
    // set cursor, which should be pointer if href channel is present unless otherwise specified
    const specifiedCursor = getMarkPropOrConfig('cursor', markDef, config);
    if (specifiedCursor === undefined) {
        markDef.cursor = cursor(markDef, encoding, config);
    }
    return markDef;
}
function cursor(markDef, encoding, config) {
    if (encoding.href || markDef.href || getMarkPropOrConfig('href', markDef, config)) {
        return 'pointer';
    }
    return markDef.cursor;
}
function opacity(mark, encoding) {
    if (contains([POINT, TICK, CIRCLE, SQUARE], mark)) {
        // point-based marks
        if (!isAggregate(encoding)) {
            return 0.7;
        }
    }
    return undefined;
}
function defaultFilled(markDef, config, { graticule }) {
    if (graticule) {
        return false;
    }
    const filledConfig = getMarkConfig('filled', markDef, config);
    const mark = markDef.type;
    return getFirstDefined(filledConfig, mark !== POINT && mark !== LINE && mark !== RULE);
}
function orient(mark, encoding, specifiedOrient) {
    switch (mark) {
        case POINT:
        case CIRCLE:
        case SQUARE:
        case mark_TEXT:
        case RECT:
        case IMAGE:
            // orient is meaningless for these marks.
            return undefined;
    }
    const { x, y, x2, y2 } = encoding;
    switch (mark) {
        case BAR:
            if (isFieldDef(x) && (isBinned(x.bin) || (isFieldDef(y) && y.aggregate && !x.aggregate))) {
                return 'vertical';
            }
            if (isFieldDef(y) && (isBinned(y.bin) || (isFieldDef(x) && x.aggregate && !y.aggregate))) {
                return 'horizontal';
            }
            if (y2 || x2) {
                // Ranged bar does not always have clear orientation, so we allow overriding
                if (specifiedOrient) {
                    return specifiedOrient;
                }
                // If y is range and x is non-range, non-bin Q
                if (!x2) {
                    if ((isFieldDef(x) && x.type === QUANTITATIVE && !isBinning(x.bin)) || isNumericDataDef(x)) {
                        if (isFieldDef(y) && isBinned(y.bin)) {
                            return 'horizontal';
                        }
                    }
                    return 'vertical';
                }
                // If x is range and y is non-range, non-bin Q
                if (!y2) {
                    if ((isFieldDef(y) && y.type === QUANTITATIVE && !isBinning(y.bin)) || isNumericDataDef(y)) {
                        if (isFieldDef(x) && isBinned(x.bin)) {
                            return 'vertical';
                        }
                    }
                    return 'horizontal';
                }
            }
        // falls through
        case RULE:
            // return undefined for line segment rule and bar with both axis ranged
            // we have to ignore the case that the data are already binned
            if (x2 && !(isFieldDef(x) && isBinned(x.bin)) && y2 && !(isFieldDef(y) && isBinned(y.bin))) {
                return undefined;
            }
        // falls through
        case AREA:
            // If there are range for both x and y, y (vertical) has higher precedence.
            if (y2) {
                if (isFieldDef(y) && isBinned(y.bin)) {
                    return 'horizontal';
                }
                else {
                    return 'vertical';
                }
            }
            else if (x2) {
                if (isFieldDef(x) && isBinned(x.bin)) {
                    return 'vertical';
                }
                else {
                    return 'horizontal';
                }
            }
            else if (mark === RULE) {
                if (x && !y) {
                    return 'vertical';
                }
                else if (y && !x) {
                    return 'horizontal';
                }
            }
        // falls through
        case LINE:
        case TICK: {
            // Tick is opposite to bar, line, area and never have ranged mark.
            const xIsContinuous = isContinuousFieldOrDatumDef(x);
            const yIsContinuous = isContinuousFieldOrDatumDef(y);
            if (specifiedOrient) {
                return specifiedOrient;
            }
            else if (xIsContinuous && !yIsContinuous) {
                return mark !== 'tick' ? 'horizontal' : 'vertical';
            }
            else if (!xIsContinuous && yIsContinuous) {
                return mark !== 'tick' ? 'vertical' : 'horizontal';
            }
            else if (xIsContinuous && yIsContinuous) {
                const xDef = x; // we can cast here since they are surely fieldDef
                const yDef = y;
                const xIsTemporal = xDef.type === TEMPORAL;
                const yIsTemporal = yDef.type === TEMPORAL;
                // temporal without timeUnit is considered continuous, but better serves as dimension
                if (xIsTemporal && !yIsTemporal) {
                    return mark !== 'tick' ? 'vertical' : 'horizontal';
                }
                else if (!xIsTemporal && yIsTemporal) {
                    return mark !== 'tick' ? 'horizontal' : 'vertical';
                }
                if (!xDef.aggregate && yDef.aggregate) {
                    return mark !== 'tick' ? 'vertical' : 'horizontal';
                }
                else if (xDef.aggregate && !yDef.aggregate) {
                    return mark !== 'tick' ? 'horizontal' : 'vertical';
                }
                return 'vertical';
            }
            else {
                return undefined;
            }
        }
    }
    return 'vertical';
}
//# sourceMappingURL=init.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/arc.js

const arc = {
    vgMark: 'arc',
    encodeEntry: (model) => {
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, baseEncodeEntry(model, {
            align: 'ignore',
            baseline: 'ignore',
            color: 'include',
            size: 'ignore',
            orient: 'ignore',
            theta: 'ignore'
        })), pointPosition('x', model, { defaultPos: 'mid' })), pointPosition('y', model, { defaultPos: 'mid' })), rectPosition(model, 'radius')), rectPosition(model, 'theta'));
    }
};
//# sourceMappingURL=arc.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/area.js

const area_area = {
    vgMark: 'area',
    encodeEntry: (model) => {
        return Object.assign(Object.assign(Object.assign(Object.assign({}, baseEncodeEntry(model, {
            align: 'ignore',
            baseline: 'ignore',
            color: 'include',
            orient: 'include',
            size: 'ignore',
            theta: 'ignore'
        })), pointOrRangePosition('x', model, {
            defaultPos: 'zeroOrMin',
            defaultPos2: 'zeroOrMin',
            range: model.markDef.orient === 'horizontal'
        })), pointOrRangePosition('y', model, {
            defaultPos: 'zeroOrMin',
            defaultPos2: 'zeroOrMin',
            range: model.markDef.orient === 'vertical'
        })), defined(model));
    }
};
//# sourceMappingURL=area.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/bar.js

const bar = {
    vgMark: 'rect',
    encodeEntry: (model) => {
        return Object.assign(Object.assign(Object.assign({}, baseEncodeEntry(model, {
            align: 'ignore',
            baseline: 'ignore',
            color: 'include',
            orient: 'ignore',
            size: 'ignore',
            theta: 'ignore'
        })), rectPosition(model, 'x')), rectPosition(model, 'y'));
    }
};
//# sourceMappingURL=bar.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/geoshape.js



const geoshape = {
    vgMark: 'shape',
    encodeEntry: (model) => {
        return Object.assign({}, baseEncodeEntry(model, {
            align: 'ignore',
            baseline: 'ignore',
            color: 'include',
            size: 'ignore',
            orient: 'ignore',
            theta: 'ignore'
        }));
    },
    postEncodingTransform: (model) => {
        const { encoding } = model;
        const shapeDef = encoding.shape;
        const transform = Object.assign({ type: 'geoshape', projection: model.projectionName() }, (shapeDef && isFieldDef(shapeDef) && shapeDef.type === GEOJSON
            ? { field: vgField(shapeDef, { expr: 'datum' }) }
            : {}));
        return [transform];
    }
};
//# sourceMappingURL=geoshape.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/image.js

const image_image = {
    vgMark: 'image',
    encodeEntry: (model) => {
        return Object.assign(Object.assign(Object.assign(Object.assign({}, baseEncodeEntry(model, {
            align: 'ignore',
            baseline: 'ignore',
            color: 'ignore',
            orient: 'ignore',
            size: 'ignore',
            theta: 'ignore'
        })), rectPosition(model, 'x')), rectPosition(model, 'y')), text_text(model, 'url'));
    }
};
//# sourceMappingURL=image.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/line.js

const line = {
    vgMark: 'line',
    encodeEntry: (model) => {
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, baseEncodeEntry(model, {
            align: 'ignore',
            baseline: 'ignore',
            color: 'include',
            size: 'ignore',
            orient: 'ignore',
            theta: 'ignore'
        })), pointPosition('x', model, { defaultPos: 'mid' })), pointPosition('y', model, { defaultPos: 'mid' })), nonPosition('size', model, {
            vgChannel: 'strokeWidth' // VL's line size is strokeWidth
        })), defined(model));
    }
};
const trail = {
    vgMark: 'trail',
    encodeEntry: (model) => {
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, baseEncodeEntry(model, {
            align: 'ignore',
            baseline: 'ignore',
            color: 'include',
            size: 'include',
            orient: 'ignore',
            theta: 'ignore'
        })), pointPosition('x', model, { defaultPos: 'mid' })), pointPosition('y', model, { defaultPos: 'mid' })), nonPosition('size', model)), defined(model));
    }
};
//# sourceMappingURL=line.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/point.js

function encodeEntry(model, fixedShape) {
    const { config } = model;
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, baseEncodeEntry(model, {
        align: 'ignore',
        baseline: 'ignore',
        color: 'include',
        size: 'include',
        orient: 'ignore',
        theta: 'ignore'
    })), pointPosition('x', model, { defaultPos: 'mid' })), pointPosition('y', model, { defaultPos: 'mid' })), nonPosition('size', model)), nonPosition('angle', model)), shapeMixins(model, config, fixedShape));
}
function shapeMixins(model, config, fixedShape) {
    if (fixedShape) {
        return { shape: { value: fixedShape } };
    }
    return nonPosition('shape', model);
}
const point_point = {
    vgMark: 'symbol',
    encodeEntry: (model) => {
        return encodeEntry(model);
    }
};
const circle = {
    vgMark: 'symbol',
    encodeEntry: (model) => {
        return encodeEntry(model, 'circle');
    }
};
const square = {
    vgMark: 'symbol',
    encodeEntry: (model) => {
        return encodeEntry(model, 'square');
    }
};
//# sourceMappingURL=point.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/rect.js

const rect = {
    vgMark: 'rect',
    encodeEntry: (model) => {
        return Object.assign(Object.assign(Object.assign({}, baseEncodeEntry(model, {
            align: 'ignore',
            baseline: 'ignore',
            color: 'include',
            orient: 'ignore',
            size: 'ignore',
            theta: 'ignore'
        })), rectPosition(model, 'x')), rectPosition(model, 'y'));
    }
};
//# sourceMappingURL=rect.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/rule.js

const rule = {
    vgMark: 'rule',
    encodeEntry: (model) => {
        const { markDef } = model;
        const orient = markDef.orient;
        if (!model.encoding.x && !model.encoding.y && !model.encoding.latitude && !model.encoding.longitude) {
            // Show nothing if we have none of x, y, lat, and long.
            return {};
        }
        return Object.assign(Object.assign(Object.assign(Object.assign({}, baseEncodeEntry(model, {
            align: 'ignore',
            baseline: 'ignore',
            color: 'include',
            orient: 'ignore',
            size: 'ignore',
            theta: 'ignore'
        })), pointOrRangePosition('x', model, {
            defaultPos: orient === 'horizontal' ? 'zeroOrMax' : 'mid',
            defaultPos2: 'zeroOrMin',
            range: orient !== 'vertical' // include x2 for horizontal or line segment rule
        })), pointOrRangePosition('y', model, {
            defaultPos: orient === 'vertical' ? 'zeroOrMax' : 'mid',
            defaultPos2: 'zeroOrMin',
            range: orient !== 'horizontal' // include y2 for vertical or line segment rule
        })), nonPosition('size', model, {
            vgChannel: 'strokeWidth' // VL's rule size is strokeWidth
        }));
    }
};
//# sourceMappingURL=rule.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/text.js


const mark_text_text = {
    vgMark: 'text',
    encodeEntry: (model) => {
        const { config, encoding } = model;
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, baseEncodeEntry(model, {
            align: 'include',
            baseline: 'include',
            color: 'include',
            size: 'ignore',
            orient: 'ignore',
            theta: 'include'
        })), pointPosition('x', model, { defaultPos: 'mid' })), pointPosition('y', model, { defaultPos: 'mid' })), text_text(model)), nonPosition('size', model, {
            vgChannel: 'fontSize' // VL's text size is fontSize
        })), nonPosition('angle', model)), valueIfDefined('align', align(model.markDef, encoding, config))), valueIfDefined('baseline', baseline(model.markDef, encoding, config))), pointPosition('radius', model, { defaultPos: null })), pointPosition('theta', model, { defaultPos: null }));
    }
};
function align(markDef, encoding, config) {
    const a = getMarkPropOrConfig('align', markDef, config);
    if (a === undefined) {
        return 'center';
    }
    // If there is a config, Vega-parser will process this already.
    return undefined;
}
function baseline(markDef, encoding, config) {
    const b = getMarkPropOrConfig('baseline', markDef, config);
    if (b === undefined) {
        return 'middle';
    }
    // If there is a config, Vega-parser will process this already.
    return undefined;
}
//# sourceMappingURL=text.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/tick.js





const tick = {
    vgMark: 'rect',
    encodeEntry: (model) => {
        const { config, markDef } = model;
        const orient = markDef.orient;
        const vgSizeChannel = orient === 'horizontal' ? 'width' : 'height';
        const vgThicknessChannel = orient === 'horizontal' ? 'height' : 'width';
        return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, baseEncodeEntry(model, {
            align: 'ignore',
            baseline: 'ignore',
            color: 'include',
            orient: 'ignore',
            size: 'ignore',
            theta: 'ignore'
        })), pointPosition('x', model, { defaultPos: 'mid', vgChannel: 'xc' })), pointPosition('y', model, { defaultPos: 'mid', vgChannel: 'yc' })), nonPosition('size', model, {
            defaultValue: defaultSize(model),
            vgChannel: vgSizeChannel
        })), { [vgThicknessChannel]: signalOrValueRef(getMarkPropOrConfig('thickness', markDef, config)) });
    }
};
function defaultSize(model) {
    var _a;
    const { config, markDef } = model;
    const { orient } = markDef;
    const vgSizeChannel = orient === 'horizontal' ? 'width' : 'height';
    const scale = model.getScaleComponent(orient === 'horizontal' ? 'x' : 'y');
    const markPropOrConfig = (_a = getMarkPropOrConfig('size', markDef, config, { vgChannel: vgSizeChannel })) !== null && _a !== void 0 ? _a : config.tick.bandSize;
    if (markPropOrConfig !== undefined) {
        return markPropOrConfig;
    }
    else {
        const scaleRange = scale ? scale.get('range') : undefined;
        if (scaleRange && isVgRangeStep(scaleRange) && (0,vega_util_module/* isNumber */.Et)(scaleRange.step)) {
            return (scaleRange.step * 3) / 4;
        }
        const defaultViewStep = getViewConfigDiscreteStep(config.view, vgSizeChannel);
        return (defaultViewStep * 3) / 4;
    }
}
//# sourceMappingURL=tick.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/mark/mark.js




















const markCompiler = {
    arc: arc,
    area: area_area,
    bar: bar,
    circle: circle,
    geoshape: geoshape,
    image: image_image,
    line: line,
    point: point_point,
    rect: rect,
    rule: rule,
    square: square,
    text: mark_text_text,
    tick: tick,
    trail: trail
};
function parseMarkGroups(model) {
    if (contains([LINE, AREA, TRAIL], model.mark)) {
        const details = pathGroupingFields(model.mark, model.encoding);
        if (details.length > 0) {
            return getPathGroups(model, details);
        }
        // otherwise use standard mark groups
    }
    else if (model.mark === BAR) {
        const hasCornerRadius = VG_CORNERRADIUS_CHANNELS.some(prop => getMarkPropOrConfig(prop, model.markDef, model.config));
        if (model.stack && !model.fieldDef('size') && hasCornerRadius) {
            return getGroupsForStackedBarWithCornerRadius(model);
        }
    }
    return getMarkGroup(model);
}
const FACETED_PATH_PREFIX = 'faceted_path_';
function getPathGroups(model, details) {
    // TODO: for non-stacked plot, map order to zindex. (Maybe rename order for layer to zindex?)
    return [
        {
            name: model.getName('pathgroup'),
            type: 'group',
            from: {
                facet: {
                    name: FACETED_PATH_PREFIX + model.requestDataName(DataSourceType.Main),
                    data: model.requestDataName(DataSourceType.Main),
                    groupby: details
                }
            },
            encode: {
                update: {
                    width: { field: { group: 'width' } },
                    height: { field: { group: 'height' } }
                }
            },
            // With subfacet for line/area group, need to use faceted data from above.
            marks: getMarkGroup(model, { fromPrefix: FACETED_PATH_PREFIX })
        }
    ];
}
const STACK_GROUP_PREFIX = 'stack_group_';
/**
 * We need to put stacked bars into groups in order to enable cornerRadius for stacks.
 * If stack is used and the model doesn't have size encoding, we put the mark into groups,
 * and apply cornerRadius properties at the group.
 */
function getGroupsForStackedBarWithCornerRadius(model) {
    var _a;
    // Generate the mark
    const [mark] = getMarkGroup(model, { fromPrefix: STACK_GROUP_PREFIX });
    // Get the scale for the stacked field
    const fieldScale = model.scaleName(model.stack.fieldChannel);
    const stackField = (opt = {}) => model.vgField(model.stack.fieldChannel, opt);
    // Find the min/max of the pixel value on the stacked direction
    const stackFieldGroup = (func, expr) => {
        const vgFieldMinMax = [
            stackField({ prefix: 'min', suffix: 'start', expr }),
            stackField({ prefix: 'max', suffix: 'start', expr }),
            stackField({ prefix: 'min', suffix: 'end', expr }),
            stackField({ prefix: 'max', suffix: 'end', expr })
        ];
        return `${func}(${vgFieldMinMax.map(field => `scale('${fieldScale}',${field})`).join(',')})`;
    };
    let groupUpdate;
    let innerGroupUpdate;
    // Build the encoding for group and an inner group
    if (model.stack.fieldChannel === 'x') {
        // Move cornerRadius, y/yc/y2/height properties to group
        // Group x/x2 should be the min/max of the marks within
        groupUpdate = Object.assign(Object.assign({}, pick(mark.encode.update, ['y', 'yc', 'y2', 'height', ...VG_CORNERRADIUS_CHANNELS])), { x: { signal: stackFieldGroup('min', 'datum') }, x2: { signal: stackFieldGroup('max', 'datum') }, clip: { value: true } });
        // Inner group should revert the x translation, and pass height through
        innerGroupUpdate = {
            x: { field: { group: 'x' }, mult: -1 },
            height: { field: { group: 'height' } }
        };
        // The marks should use the same height as group, without y/yc/y2 properties (because it's already done by group)
        // This is why size encoding is not supported yet
        mark.encode.update = Object.assign(Object.assign({}, omit(mark.encode.update, ['y', 'yc', 'y2'])), { height: { field: { group: 'height' } } });
    }
    else {
        groupUpdate = Object.assign(Object.assign({}, pick(mark.encode.update, ['x', 'xc', 'x2', 'width'])), { y: { signal: stackFieldGroup('min', 'datum') }, y2: { signal: stackFieldGroup('max', 'datum') }, clip: { value: true } });
        innerGroupUpdate = {
            y: { field: { group: 'y' }, mult: -1 },
            width: { field: { group: 'width' } }
        };
        mark.encode.update = Object.assign(Object.assign({}, omit(mark.encode.update, ['x', 'xc', 'x2'])), { width: { field: { group: 'width' } } });
    }
    // Deal with cornerRadius properties
    for (const key of VG_CORNERRADIUS_CHANNELS) {
        const configValue = getMarkConfig(key, model.markDef, model.config);
        // Move from mark to group
        if (mark.encode.update[key]) {
            groupUpdate[key] = mark.encode.update[key];
            delete mark.encode.update[key];
        }
        else if (configValue) {
            groupUpdate[key] = signalOrValueRef(configValue);
        }
        // Overwrite any cornerRadius on mark set by config --- they are already moved to the group
        if (configValue) {
            mark.encode.update[key] = { value: 0 };
        }
    }
    const groupby = [];
    if (((_a = model.stack.groupbyChannels) === null || _a === void 0 ? void 0 : _a.length) > 0) {
        for (const groupbyChannel of model.stack.groupbyChannels) {
            // For bin and time unit, we have to add bin/timeunit -end channels.
            const groupByField = model.fieldDef(groupbyChannel);
            const field = vgField(groupByField);
            if (field) {
                groupby.push(field);
            }
            if ((groupByField === null || groupByField === void 0 ? void 0 : groupByField.bin) || (groupByField === null || groupByField === void 0 ? void 0 : groupByField.timeUnit)) {
                groupby.push(vgField(groupByField, { binSuffix: 'end' }));
            }
        }
    }
    const strokeProperties = [
        'stroke',
        'strokeWidth',
        'strokeJoin',
        'strokeCap',
        'strokeDash',
        'strokeDashOffset',
        'strokeMiterLimit',
        'strokeOpacity'
    ];
    // Generate stroke properties for the group
    groupUpdate = strokeProperties.reduce((encode, prop) => {
        if (mark.encode.update[prop]) {
            return Object.assign(Object.assign({}, encode), { [prop]: mark.encode.update[prop] });
        }
        else {
            const configValue = getMarkConfig(prop, model.markDef, model.config);
            if (configValue !== undefined) {
                return Object.assign(Object.assign({}, encode), { [prop]: signalOrValueRef(configValue) });
            }
            else {
                return encode;
            }
        }
    }, groupUpdate);
    // Apply strokeForeground and strokeOffset if stroke is used
    if (groupUpdate.stroke) {
        groupUpdate.strokeForeground = { value: true };
        groupUpdate.strokeOffset = { value: 0 };
    }
    return [
        {
            type: 'group',
            from: {
                facet: {
                    data: model.requestDataName(DataSourceType.Main),
                    name: STACK_GROUP_PREFIX + model.requestDataName(DataSourceType.Main),
                    groupby,
                    aggregate: {
                        fields: [
                            stackField({ suffix: 'start' }),
                            stackField({ suffix: 'start' }),
                            stackField({ suffix: 'end' }),
                            stackField({ suffix: 'end' })
                        ],
                        ops: ['min', 'max', 'min', 'max']
                    }
                }
            },
            encode: {
                update: groupUpdate
            },
            marks: [
                {
                    type: 'group',
                    encode: { update: innerGroupUpdate },
                    marks: [mark]
                }
            ]
        }
    ];
}
function mark_getSort(model) {
    var _a;
    const { encoding, stack, mark, markDef, config } = model;
    const order = encoding.order;
    if ((!(0,vega_util_module/* isArray */.cy)(order) && isValueDef(order) && isNullOrFalse(order.value)) ||
        (!order && isNullOrFalse(getMarkPropOrConfig('order', markDef, config)))) {
        return undefined;
    }
    else if (((0,vega_util_module/* isArray */.cy)(order) || isFieldDef(order)) && !stack) {
        // Sort by the order field if it is specified and the field is not stacked. (For stacked field, order specify stack order.)
        return sortParams(order, { expr: 'datum' });
    }
    else if (isPathMark(mark)) {
        // For both line and area, we sort values based on dimension by default
        const dimensionChannel = markDef.orient === 'horizontal' ? 'y' : 'x';
        const dimensionChannelDef = encoding[dimensionChannel];
        if (isFieldDef(dimensionChannelDef)) {
            const s = dimensionChannelDef.sort;
            if ((0,vega_util_module/* isArray */.cy)(s)) {
                return {
                    field: vgField(dimensionChannelDef, { prefix: dimensionChannel, suffix: 'sort_index', expr: 'datum' })
                };
            }
            else if (isSortField(s)) {
                return {
                    field: vgField({
                        // FIXME: this op might not already exist?
                        // FIXME: what if dimensionChannel (x or y) contains custom domain?
                        aggregate: isAggregate(model.encoding) ? s.op : undefined,
                        field: s.field
                    }, { expr: 'datum' })
                };
            }
            else if (isSortByEncoding(s)) {
                const fieldDefToSort = model.fieldDef(s.encoding);
                return {
                    field: vgField(fieldDefToSort, { expr: 'datum' }),
                    order: s.order
                };
            }
            else if (s === null) {
                return undefined;
            }
            else {
                return {
                    field: vgField(dimensionChannelDef, {
                        // For stack with imputation, we only have bin_mid
                        binSuffix: ((_a = model.stack) === null || _a === void 0 ? void 0 : _a.impute) ? 'mid' : undefined,
                        expr: 'datum'
                    })
                };
            }
        }
        return undefined;
    }
    return undefined;
}
function getMarkGroup(model, opt = { fromPrefix: '' }) {
    const { mark, markDef, encoding, config } = model;
    const clip = getFirstDefined(markDef.clip, scaleClip(model), projectionClip(model));
    const style = getStyles(markDef);
    const key = encoding.key;
    const sort = mark_getSort(model);
    const interactive = interactiveFlag(model);
    const aria = getMarkPropOrConfig('aria', markDef, config);
    const postEncodingTransform = markCompiler[mark].postEncodingTransform
        ? markCompiler[mark].postEncodingTransform(model)
        : null;
    return [
        Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ name: model.getName('marks'), type: markCompiler[mark].vgMark }, (clip ? { clip: true } : {})), (style ? { style } : {})), (key ? { key: key.field } : {})), (sort ? { sort } : {})), (interactive ? interactive : {})), (aria === false ? { aria } : {})), { from: { data: opt.fromPrefix + model.requestDataName(DataSourceType.Main) }, encode: {
                update: markCompiler[mark].encodeEntry(model)
            } }), (postEncodingTransform
            ? {
                transform: postEncodingTransform
            }
            : {}))
    ];
}
/**
 * If scales are bound to interval selections, we want to automatically clip
 * marks to account for panning/zooming interactions. We identify bound scales
 * by the selectionExtent property, which gets added during scale parsing.
 */
function scaleClip(model) {
    const xScale = model.getScaleComponent('x');
    const yScale = model.getScaleComponent('y');
    return (xScale === null || xScale === void 0 ? void 0 : xScale.get('selectionExtent')) || (yScale === null || yScale === void 0 ? void 0 : yScale.get('selectionExtent')) ? true : undefined;
}
/**
 * If we use a custom projection with auto-fitting to the geodata extent,
 * we need to clip to ensure the chart size doesn't explode.
 */
function projectionClip(model) {
    const projection = model.component.projection;
    return projection && !projection.isFit ? true : undefined;
}
/**
 * Only output interactive flags if we have selections defined somewhere in our model hierarchy.
 */
function interactiveFlag(model) {
    if (!model.component.selection)
        return null;
    const unitCount = keys(model.component.selection).length;
    let parentCount = unitCount;
    let parent = model.parent;
    while (parent && parentCount === 0) {
        parentCount = keys(parent.component.selection).length;
        parent = parent.parent;
    }
    return parentCount
        ? {
            interactive: unitCount > 0 || !!model.encoding.tooltip
        }
        : null;
}
//# sourceMappingURL=mark.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/unit.js

























/**
 * Internal model of Vega-Lite specification for the compiler.
 */
class UnitModel extends ModelWithField {
    constructor(spec, parent, parentGivenName, parentGivenSize = {}, config) {
        var _a;
        super(spec, 'unit', parent, parentGivenName, config, undefined, isFrameMixins(spec) ? spec.view : undefined);
        this.specifiedScales = {};
        this.specifiedAxes = {};
        this.specifiedLegends = {};
        this.specifiedProjection = {};
        this.selection = [];
        this.children = [];
        const markDef = isMarkDef(spec.mark) ? Object.assign({}, spec.mark) : { type: spec.mark };
        const mark = markDef.type;
        // Need to init filled before other mark properties because encoding depends on filled but other mark properties depend on types inside encoding
        if (markDef.filled === undefined) {
            markDef.filled = defaultFilled(markDef, config, {
                graticule: spec.data && isGraticuleGenerator(spec.data)
            });
        }
        const encoding = (this.encoding = initEncoding(spec.encoding || {}, mark, markDef.filled, config));
        this.markDef = initMarkdef(markDef, encoding, config);
        this.size = initLayoutSize({
            encoding,
            size: isFrameMixins(spec)
                ? Object.assign(Object.assign(Object.assign({}, parentGivenSize), (spec.width ? { width: spec.width } : {})), (spec.height ? { height: spec.height } : {})) : parentGivenSize
        });
        // calculate stack properties
        this.stack = stack(mark, encoding);
        this.specifiedScales = this.initScales(mark, encoding);
        this.specifiedAxes = this.initAxes(encoding);
        this.specifiedLegends = this.initLegends(encoding);
        this.specifiedProjection = spec.projection;
        // Selections will be initialized upon parse.
        this.selection = ((_a = spec.params) !== null && _a !== void 0 ? _a : []).filter(p => isSelectionParameter(p));
    }
    get hasProjection() {
        const { encoding } = this;
        const isGeoShapeMark = this.mark === GEOSHAPE;
        const hasGeoPosition = encoding && GEOPOSITION_CHANNELS.some(channel => isFieldOrDatumDef(encoding[channel]));
        return isGeoShapeMark || hasGeoPosition;
    }
    /**
     * Return specified Vega-Lite scale domain for a particular channel
     * @param channel
     */
    scaleDomain(channel) {
        const scale = this.specifiedScales[channel];
        return scale ? scale.domain : undefined;
    }
    axis(channel) {
        return this.specifiedAxes[channel];
    }
    legend(channel) {
        return this.specifiedLegends[channel];
    }
    initScales(mark, encoding) {
        return SCALE_CHANNELS.reduce((scales, channel) => {
            var _a;
            const fieldOrDatumDef = getFieldOrDatumDef(encoding[channel]);
            if (fieldOrDatumDef) {
                scales[channel] = this.initScale((_a = fieldOrDatumDef.scale) !== null && _a !== void 0 ? _a : {});
            }
            return scales;
        }, {});
    }
    initScale(scale) {
        const { domain, range } = scale;
        // TODO: we could simplify this function if we had a recursive replace function
        const scaleInternal = replaceExprRef(scale);
        if ((0,vega_util_module/* isArray */.cy)(domain)) {
            scaleInternal.domain = domain.map(signalRefOrValue);
        }
        if ((0,vega_util_module/* isArray */.cy)(range)) {
            scaleInternal.range = range.map(signalRefOrValue);
        }
        return scaleInternal;
    }
    initAxes(encoding) {
        return POSITION_SCALE_CHANNELS.reduce((_axis, channel) => {
            // Position Axis
            // TODO: handle ConditionFieldDef
            const channelDef = encoding[channel];
            if (isFieldOrDatumDef(channelDef) ||
                (channel === X && isFieldOrDatumDef(encoding.x2)) ||
                (channel === Y && isFieldOrDatumDef(encoding.y2))) {
                const axisSpec = isFieldOrDatumDef(channelDef) ? channelDef.axis : undefined;
                _axis[channel] = axisSpec
                    ? this.initAxis(Object.assign({}, axisSpec)) // convert truthy value to object
                    : axisSpec;
            }
            return _axis;
        }, {});
    }
    initAxis(axis) {
        const props = keys(axis);
        const axisInternal = {};
        for (const prop of props) {
            const val = axis[prop];
            axisInternal[prop] = isConditionalAxisValue(val)
                ? signalOrValueRefWithCondition(val)
                : signalRefOrValue(val);
        }
        return axisInternal;
    }
    initLegends(encoding) {
        return NONPOSITION_SCALE_CHANNELS.reduce((_legend, channel) => {
            const fieldOrDatumDef = getFieldOrDatumDef(encoding[channel]);
            if (fieldOrDatumDef && supportLegend(channel)) {
                const legend = fieldOrDatumDef.legend;
                _legend[channel] = legend
                    ? replaceExprRef(legend) // convert truthy value to object
                    : legend;
            }
            return _legend;
        }, {});
    }
    parseData() {
        this.component.data = parseData(this);
    }
    parseLayoutSize() {
        parseUnitLayoutSize(this);
    }
    parseSelections() {
        this.component.selection = parseUnitSelection(this, this.selection);
    }
    parseMarkGroup() {
        this.component.mark = parseMarkGroups(this);
    }
    parseAxesAndHeaders() {
        this.component.axes = parseUnitAxes(this);
    }
    assembleSelectionTopLevelSignals(signals) {
        return assembleTopLevelSignals(this, signals);
    }
    assembleSignals() {
        return [...assembleAxisSignals(this), ...assembleUnitSelectionSignals(this, [])];
    }
    assembleSelectionData(data) {
        return assembleUnitSelectionData(this, data);
    }
    assembleLayout() {
        return null;
    }
    assembleLayoutSignals() {
        return assembleLayoutSignals(this);
    }
    assembleMarks() {
        var _a;
        let marks = (_a = this.component.mark) !== null && _a !== void 0 ? _a : [];
        // If this unit is part of a layer, selections should augment
        // all in concert rather than each unit individually. This
        // ensures correct interleaving of clipping and brushed marks.
        if (!this.parent || !isLayerModel(this.parent)) {
            marks = assembleUnitSelectionMarks(this, marks);
        }
        return marks.map(this.correctDataNames);
    }
    assembleGroupStyle() {
        const { style } = this.view || {};
        if (style !== undefined) {
            return style;
        }
        if (this.encoding.x || this.encoding.y) {
            return 'cell';
        }
        else {
            return undefined;
        }
    }
    getMapping() {
        return this.encoding;
    }
    get mark() {
        return this.markDef.type;
    }
    channelHasField(channel) {
        return channelHasField(this.encoding, channel);
    }
    fieldDef(channel) {
        const channelDef = this.encoding[channel];
        return getFieldDef(channelDef);
    }
    typedFieldDef(channel) {
        const fieldDef = this.fieldDef(channel);
        if (isTypedFieldDef(fieldDef)) {
            return fieldDef;
        }
        return null;
    }
}
//# sourceMappingURL=unit.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/layer.js













class LayerModel extends Model {
    constructor(spec, parent, parentGivenName, parentGivenSize, config) {
        super(spec, 'layer', parent, parentGivenName, config, spec.resolve, spec.view);
        const layoutSize = Object.assign(Object.assign(Object.assign({}, parentGivenSize), (spec.width ? { width: spec.width } : {})), (spec.height ? { height: spec.height } : {}));
        this.children = spec.layer.map((layer, i) => {
            if (isLayerSpec(layer)) {
                return new LayerModel(layer, this, this.getName(`layer_${i}`), layoutSize, config);
            }
            else if (isUnitSpec(layer)) {
                return new UnitModel(layer, this, this.getName(`layer_${i}`), layoutSize, config);
            }
            throw new Error(invalidSpec(layer));
        });
    }
    parseData() {
        this.component.data = parseData(this);
        for (const child of this.children) {
            child.parseData();
        }
    }
    parseLayoutSize() {
        parseLayerLayoutSize(this);
    }
    parseSelections() {
        // Merge selections up the hierarchy so that they may be referenced
        // across unit specs. Persist their definitions within each child
        // to assemble signals which remain within output Vega unit groups.
        this.component.selection = {};
        for (const child of this.children) {
            child.parseSelections();
            for (const key of keys(child.component.selection)) {
                this.component.selection[key] = child.component.selection[key];
            }
        }
    }
    parseMarkGroup() {
        for (const child of this.children) {
            child.parseMarkGroup();
        }
    }
    parseAxesAndHeaders() {
        parseLayerAxes(this);
    }
    assembleSelectionTopLevelSignals(signals) {
        return this.children.reduce((sg, child) => child.assembleSelectionTopLevelSignals(sg), signals);
    }
    // TODO: Support same named selections across children.
    assembleSignals() {
        return this.children.reduce((signals, child) => {
            return signals.concat(child.assembleSignals());
        }, assembleAxisSignals(this));
    }
    assembleLayoutSignals() {
        return this.children.reduce((signals, child) => {
            return signals.concat(child.assembleLayoutSignals());
        }, assembleLayoutSignals(this));
    }
    assembleSelectionData(data) {
        return this.children.reduce((db, child) => child.assembleSelectionData(db), data);
    }
    assembleGroupStyle() {
        const uniqueStyles = new Set();
        for (const child of this.children) {
            for (const style of (0,vega_util_module/* array */.YO)(child.assembleGroupStyle())) {
                uniqueStyles.add(style);
            }
        }
        const styles = Array.from(uniqueStyles);
        return styles.length > 1 ? styles : styles.length === 1 ? styles[0] : undefined;
    }
    assembleTitle() {
        let title = super.assembleTitle();
        if (title) {
            return title;
        }
        // If title does not provide layer, look into children
        for (const child of this.children) {
            title = child.assembleTitle();
            if (title) {
                return title;
            }
        }
        return undefined;
    }
    assembleLayout() {
        return null;
    }
    assembleMarks() {
        return assembleLayerSelectionMarks(this, this.children.flatMap(child => {
            return child.assembleMarks();
        }));
    }
    assembleLegends() {
        return this.children.reduce((legends, child) => {
            return legends.concat(child.assembleLegends());
        }, assembleLegends(this));
    }
}
//# sourceMappingURL=layer.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/buildmodel.js






function buildModel(spec, parent, parentGivenName, unitSize, config) {
    if (isFacetSpec(spec)) {
        return new FacetModel(spec, parent, parentGivenName, config);
    }
    else if (isLayerSpec(spec)) {
        return new LayerModel(spec, parent, parentGivenName, unitSize, config);
    }
    else if (isUnitSpec(spec)) {
        return new UnitModel(spec, parent, parentGivenName, unitSize, config);
    }
    else if (isAnyConcatSpec(spec)) {
        return new ConcatModel(spec, parent, parentGivenName, config);
    }
    throw new Error(invalidSpec(spec));
}
//# sourceMappingURL=buildmodel.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/compile/compile.js
var compile_rest = (undefined && undefined.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};












/**
 * Vega-Lite's main function, for compiling Vega-Lite spec into Vega spec.
 *
 * At a high-level, we make the following transformations in different phases:
 *
 * Input spec
 *     |
 *     |  (Normalization)
 *     v
 * Normalized Spec (Row/Column channels in single-view specs becomes faceted specs, composite marks becomes layered specs.)
 *     |
 *     |  (Build Model)
 *     v
 * A model tree of the spec
 *     |
 *     |  (Parse)
 *     v
 * A model tree with parsed components (intermediate structure of visualization primitives in a format that can be easily merged)
 *     |
 *     | (Optimize)
 *     v
 * A model tree with parsed components with the data component optimized
 *     |
 *     | (Assemble)
 *     v
 * Vega spec
 *
 * @param inputSpec The Vega-Lite specification.
 * @param opt       Optional arguments passed to the Vega-Lite compiler.
 * @returns         An object containing the compiled Vega spec and normalized Vega-Lite spec.
 */
function compile(inputSpec, opt = {}) {
    // 0. Augment opt with default opts
    if (opt.logger) {
        // set the singleton logger to the provided logger
        set(opt.logger);
    }
    if (opt.fieldTitle) {
        // set the singleton field title formatter
        setTitleFormatter(opt.fieldTitle);
    }
    try {
        // 1. Initialize config by deep merging default config with the config provided via option and the input spec.
        const config = initConfig((0,vega_util_module/* mergeConfig */.io)(opt.config, inputSpec.config));
        // 2. Normalize: Convert input spec -> normalized spec
        // - Decompose all extended unit specs into composition of unit spec. For example, a box plot get expanded into multiple layers of bars, ticks, and rules. The shorthand row/column channel is also expanded to a facet spec.
        // - Normalize autosize and width or height spec
        const spec = normalize(inputSpec, config);
        // 3. Build Model: normalized spec -> Model (a tree structure)
        // This phases instantiates the models with default config by doing a top-down traversal. This allows us to pass properties that child models derive from their parents via their constructors.
        // See the abstract `Model` class and its children (UnitModel, LayerModel, FacetModel, ConcatModel) for different types of models.
        const model = buildModel(spec, null, '', undefined, config);
        // 4 Parse: Model --> Model with components
        // Note that components = intermediate representations that are equivalent to Vega specs.
        // We need these intermediate representation because we need to merge many visualization "components" like projections, scales, axes, and legends.
        // We will later convert these components into actual Vega specs in the assemble phase.
        // In this phase, we do a bottom-up traversal over the whole tree to
        // parse for each type of components once (e.g., data, layout, mark, scale).
        // By doing bottom-up traversal, we start parsing components of unit specs and
        // then merge child components of parent composite specs.
        //
        // Please see inside model.parse() for order of different components parsed.
        model.parse();
        // drawDataflow(model.component.data.sources);
        // 5. Optimize the dataflow. This will modify the data component of the model.
        optimizeDataflow(model.component.data, model);
        // drawDataflow(model.component.data.sources);
        // 6. Assemble: convert model components --> Vega Spec.
        const vgSpec = assembleTopLevelModel(model, getTopLevelProperties(inputSpec, spec.autosize, config, model), inputSpec.datasets, inputSpec.usermeta);
        return {
            spec: vgSpec,
            normalized: spec
        };
    }
    finally {
        // Reset the singleton logger if a logger is provided
        if (opt.logger) {
            log_reset();
        }
        // Reset the singleton field title formatter if provided
        if (opt.fieldTitle) {
            resetTitleFormatter();
        }
    }
}
function getTopLevelProperties(inputSpec, autosize, config, model) {
    const width = model.component.layoutSize.get('width');
    const height = model.component.layoutSize.get('height');
    if (autosize === undefined) {
        autosize = { type: 'pad' };
        if (model.hasAxisOrientSignalRef()) {
            autosize.resize = true;
        }
    }
    else if ((0,vega_util_module/* isString */.Kg)(autosize)) {
        autosize = { type: autosize };
    }
    if (width && height && isFitType(autosize.type)) {
        if (width === 'step' && height === 'step') {
            warn(droppingFit());
            autosize.type = 'pad';
        }
        else if (width === 'step' || height === 'step') {
            // effectively XOR, because else if
            // get step dimension
            const sizeType = width === 'step' ? 'width' : 'height';
            // log that we're dropping fit for respective channel
            warn(droppingFit(getPositionScaleChannel(sizeType)));
            // setting type to inverse fit (so if we dropped fit-x, type is now fit-y)
            const inverseSizeType = sizeType === 'width' ? 'height' : 'width';
            autosize.type = getFitType(inverseSizeType);
        }
    }
    return Object.assign(Object.assign(Object.assign({}, (keys(autosize).length === 1 && autosize.type
        ? autosize.type === 'pad'
            ? {}
            : { autosize: autosize.type }
        : { autosize })), extractTopLevelProperties(config, false)), extractTopLevelProperties(inputSpec, true));
}
/*
 * Assemble the top-level model to a Vega spec.
 *
 * Note: this couldn't be `model.assemble()` since the top-level model
 * needs some special treatment to generate top-level properties.
 */
function assembleTopLevelModel(model, topLevelProperties, datasets = {}, usermeta) {
    // Config with Vega-Lite only config removed.
    const vgConfig = model.config ? stripAndRedirectConfig(model.config) : undefined;
    const data = [].concat(model.assembleSelectionData([]), 
    // only assemble data in the root
    assembleRootData(model.component.data, datasets));
    const projections = model.assembleProjections();
    const title = model.assembleTitle();
    const style = model.assembleGroupStyle();
    const encodeEntry = model.assembleGroupEncodeEntry(true);
    let layoutSignals = model.assembleLayoutSignals();
    // move width and height signals with values to top level
    layoutSignals = layoutSignals.filter(signal => {
        if ((signal.name === 'width' || signal.name === 'height') && signal.value !== undefined) {
            topLevelProperties[signal.name] = +signal.value;
            return false;
        }
        return true;
    });
    const { params } = topLevelProperties, otherTopLevelProps = compile_rest(topLevelProperties, ["params"]);
    return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ $schema: 'https://vega.github.io/schema/vega/v5.json' }, (model.description ? { description: model.description } : {})), otherTopLevelProps), (title ? { title } : {})), (style ? { style } : {})), (encodeEntry ? { encode: { update: encodeEntry } } : {})), { data }), (projections.length > 0 ? { projections } : {})), model.assembleGroup([
        ...layoutSignals,
        ...model.assembleSelectionTopLevelSignals([]),
        ...assembleParameterSignals(params)
    ])), (vgConfig ? { config: vgConfig } : {})), (usermeta ? { usermeta } : {}));
}
//# sourceMappingURL=compile.js.map
;// CONCATENATED MODULE: ./node_modules/vega-lite/build/src/index.js

const version = package_namespaceObject.rE;



//# sourceMappingURL=index.js.map

/***/ }),

/***/ 18729:
/***/ ((module) => {

var clone = (function() {
'use strict';

function _instanceof(obj, type) {
  return type != null && obj instanceof type;
}

var nativeMap;
try {
  nativeMap = Map;
} catch(_) {
  // maybe a reference error because no `Map`. Give it a dummy value that no
  // value will ever be an instanceof.
  nativeMap = function() {};
}

var nativeSet;
try {
  nativeSet = Set;
} catch(_) {
  nativeSet = function() {};
}

var nativePromise;
try {
  nativePromise = Promise;
} catch(_) {
  nativePromise = function() {};
}

/**
 * Clones (copies) an Object using deep copying.
 *
 * This function supports circular references by default, but if you are certain
 * there are no circular references in your object, you can save some CPU time
 * by calling clone(obj, false).
 *
 * Caution: if `circular` is false and `parent` contains circular references,
 * your program may enter an infinite loop and crash.
 *
 * @param `parent` - the object to be cloned
 * @param `circular` - set to true if the object to be cloned may contain
 *    circular references. (optional - true by default)
 * @param `depth` - set to a number if the object is only to be cloned to
 *    a particular depth. (optional - defaults to Infinity)
 * @param `prototype` - sets the prototype to be used when cloning an object.
 *    (optional - defaults to parent prototype).
 * @param `includeNonEnumerable` - set to true if the non-enumerable properties
 *    should be cloned as well. Non-enumerable properties on the prototype
 *    chain will be ignored. (optional - false by default)
*/
function clone(parent, circular, depth, prototype, includeNonEnumerable) {
  if (typeof circular === 'object') {
    depth = circular.depth;
    prototype = circular.prototype;
    includeNonEnumerable = circular.includeNonEnumerable;
    circular = circular.circular;
  }
  // maintain two arrays for circular references, where corresponding parents
  // and children have the same index
  var allParents = [];
  var allChildren = [];

  var useBuffer = typeof Buffer != 'undefined';

  if (typeof circular == 'undefined')
    circular = true;

  if (typeof depth == 'undefined')
    depth = Infinity;

  // recurse this function so we don't reset allParents and allChildren
  function _clone(parent, depth) {
    // cloning null always returns null
    if (parent === null)
      return null;

    if (depth === 0)
      return parent;

    var child;
    var proto;
    if (typeof parent != 'object') {
      return parent;
    }

    if (_instanceof(parent, nativeMap)) {
      child = new nativeMap();
    } else if (_instanceof(parent, nativeSet)) {
      child = new nativeSet();
    } else if (_instanceof(parent, nativePromise)) {
      child = new nativePromise(function (resolve, reject) {
        parent.then(function(value) {
          resolve(_clone(value, depth - 1));
        }, function(err) {
          reject(_clone(err, depth - 1));
        });
      });
    } else if (clone.__isArray(parent)) {
      child = [];
    } else if (clone.__isRegExp(parent)) {
      child = new RegExp(parent.source, __getRegExpFlags(parent));
      if (parent.lastIndex) child.lastIndex = parent.lastIndex;
    } else if (clone.__isDate(parent)) {
      child = new Date(parent.getTime());
    } else if (useBuffer && Buffer.isBuffer(parent)) {
      if (Buffer.allocUnsafe) {
        // Node.js >= 4.5.0
        child = Buffer.allocUnsafe(parent.length);
      } else {
        // Older Node.js versions
        child = new Buffer(parent.length);
      }
      parent.copy(child);
      return child;
    } else if (_instanceof(parent, Error)) {
      child = Object.create(parent);
    } else {
      if (typeof prototype == 'undefined') {
        proto = Object.getPrototypeOf(parent);
        child = Object.create(proto);
      }
      else {
        child = Object.create(prototype);
        proto = prototype;
      }
    }

    if (circular) {
      var index = allParents.indexOf(parent);

      if (index != -1) {
        return allChildren[index];
      }
      allParents.push(parent);
      allChildren.push(child);
    }

    if (_instanceof(parent, nativeMap)) {
      parent.forEach(function(value, key) {
        var keyChild = _clone(key, depth - 1);
        var valueChild = _clone(value, depth - 1);
        child.set(keyChild, valueChild);
      });
    }
    if (_instanceof(parent, nativeSet)) {
      parent.forEach(function(value) {
        var entryChild = _clone(value, depth - 1);
        child.add(entryChild);
      });
    }

    for (var i in parent) {
      var attrs;
      if (proto) {
        attrs = Object.getOwnPropertyDescriptor(proto, i);
      }

      if (attrs && attrs.set == null) {
        continue;
      }
      child[i] = _clone(parent[i], depth - 1);
    }

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(parent);
      for (var i = 0; i < symbols.length; i++) {
        // Don't need to worry about cloning a symbol because it is a primitive,
        // like a number or string.
        var symbol = symbols[i];
        var descriptor = Object.getOwnPropertyDescriptor(parent, symbol);
        if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
          continue;
        }
        child[symbol] = _clone(parent[symbol], depth - 1);
        if (!descriptor.enumerable) {
          Object.defineProperty(child, symbol, {
            enumerable: false
          });
        }
      }
    }

    if (includeNonEnumerable) {
      var allPropertyNames = Object.getOwnPropertyNames(parent);
      for (var i = 0; i < allPropertyNames.length; i++) {
        var propertyName = allPropertyNames[i];
        var descriptor = Object.getOwnPropertyDescriptor(parent, propertyName);
        if (descriptor && descriptor.enumerable) {
          continue;
        }
        child[propertyName] = _clone(parent[propertyName], depth - 1);
        Object.defineProperty(child, propertyName, {
          enumerable: false
        });
      }
    }

    return child;
  }

  return _clone(parent, depth);
}

/**
 * Simple flat clone using prototype, accepts only objects, usefull for property
 * override on FLAT configuration object (no nested props).
 *
 * USE WITH CAUTION! This may not behave as you wish if you do not know how this
 * works.
 */
clone.clonePrototype = function clonePrototype(parent) {
  if (parent === null)
    return null;

  var c = function () {};
  c.prototype = parent;
  return new c();
};

// private utility functions

function __objToStr(o) {
  return Object.prototype.toString.call(o);
}
clone.__objToStr = __objToStr;

function __isDate(o) {
  return typeof o === 'object' && __objToStr(o) === '[object Date]';
}
clone.__isDate = __isDate;

function __isArray(o) {
  return typeof o === 'object' && __objToStr(o) === '[object Array]';
}
clone.__isArray = __isArray;

function __isRegExp(o) {
  return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
}
clone.__isRegExp = __isRegExp;

function __getRegExpFlags(re) {
  var flags = '';
  if (re.global) flags += 'g';
  if (re.ignoreCase) flags += 'i';
  if (re.multiline) flags += 'm';
  return flags;
}
clone.__getRegExpFlags = __getRegExpFlags;

return clone;
})();

if ( true && module.exports) {
  module.exports = clone;
}


/***/ })

}]);
//# sourceMappingURL=4350.f735bf13a1ab00fe032d.js.map?v=f735bf13a1ab00fe032d