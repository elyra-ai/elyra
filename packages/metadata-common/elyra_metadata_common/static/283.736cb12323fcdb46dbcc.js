(self.webpackChunk_elyra_metadata_common =
  self.webpackChunk_elyra_metadata_common || []).push([
  [283, 805],
  {
    4599: (e, n, t) => {
      (e.exports = t(2609)(!1)).push([
        e.id,
        '/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the "License");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an "AS IS" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n/* MetadataWidget CSS */\n.elyra-metadata {\n  color: var(--jp-ui-font-color1);\n  background: var(--jp-layout-color1);\n}\n\n.elyra-metadataHeader {\n  font-weight: bold;\n  padding: 8px 10px;\n  border-bottom: var(--jp-border-width) solid var(--jp-toolbar-border-color);\n  display: flex;\n  justify-content: space-between;\n}\n\n.elyra-metadataHeader p {\n  font-weight: bold;\n}\n\n.elyra-metadataHeader-button {\n  background-color: transparent;\n  vertical-align: middle;\n  padding: 5px;\n  width: 20px;\n  background-repeat: no-repeat;\n  background-position: center;\n  border: none;\n  display: inline-flex;\n  align-self: flex-end;\n}\n\n.elyra-metadataHeader-button svg {\n  transform: translate(-3px, 0px);\n}\n\n.elyra-metadataHeader-button:hover {\n  background-color: var(--jp-layout-color2);\n  cursor: pointer;\n}\n\n.elyra-metadataHeader [fill] {\n  fill: var(--jp-ui-font-color1);\n}\n\n.elyra-metadataHeader + div:first-of-type {\n  overflow-y: auto;\n  height: calc(100vh - 95px);\n}\n\n.elyra-metadata-item {\n  border-bottom: var(--jp-border-width) solid var(--jp-border-color2);\n  display: flex;\n  flex-direction: column;\n  margin: 0;\n  padding: 0;\n}\n\n.elyra-metadata-item .elyra-expandableContainer-details-visible {\n  background-color: var(--jp-cell-editor-background);\n  resize: vertical;\n  height: 100px;\n}\n\n.elyra-metadata-item .CodeMirror.cm-s-jupyter {\n  background-color: inherit;\n  border: none;\n  font-family: var(--jp-code-font-family);\n  font-size: var(--jp-code-font-size);\n  line-height: var(--jp-code-line-height);\n}\n\n.elyra-metadata-item .cm-s-jupyter li .cm-string {\n  word-break: normal;\n}\n\n/* MetadataEditor css */\n.elyra-metadataEditor .jp-InputGroup {\n  width: 100%;\n}\n\n.elyra-metadataEditor .bp3-form-group {\n  margin-bottom: 12px;\n  margin-right: 20px;\n  flex-basis: 45%;\n  height: 65px;\n}\n\n.bp3-select-popover {\n  max-height: 150px;\n  overflow-y: auto;\n}\n\n.elyra-form-DropDown-item {\n  width: 100%;\n  display: flex;\n  justify-content: left;\n  margin: 0;\n  border-radius: 0;\n}\n\n.elyra-metadataEditor {\n  padding: 20px;\n  display: flex;\n  flex-wrap: wrap;\n  height: 100%;\n  align-content: flex-start;\n  align-items: flex-start;\n  justify-content: flex-start;\n}\n\n.elyra-metadataEditor h3 {\n  flex-basis: 100%;\n  margin-bottom: 15px;\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadataEditor label.bp3-label {\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadataEditor .elyra-form-code.jp-CodeMirrorEditor {\n  background-color: var(--jp-cell-editor-background);\n  border: var(--jp-border-width) solid var(--jp-input-border-color);\n  overflow-y: auto;\n  resize: vertical;\n  min-height: 150px;\n  height: 150px;\n  padding-bottom: 10px;\n  cursor: initial;\n}\n\n.elyra-metadataEditor .CodeMirror.cm-s-jupyter {\n  background-color: inherit;\n  height: 100%;\n}\n\n.elyra-metadataEditor .bp3-form-group.elyra-metadataEditor-code {\n  height: auto;\n  flex-basis: 100%;\n  display: flex;\n}\n\n.elyra-metadataEditor-code .bp3-form-content {\n  height: 100%;\n}\n\n.bp3-dark .bp3-input {\n  border: var(--jp-border-width) solid var(--jp-input-border-color);\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadata-editor {\n  overflow-y: auto;\n}\n\n.elyra-metadata-editor.bp3-dark {\n  background-color: var(--jp-border-color3);\n}\n\n.elyra-metadataEditor .elyra-metadataEditor-saveButton {\n  flex-basis: 100%;\n  display: flex;\n}\n',
        ''
      ]);
    },
    2609: e => {
      'use strict';
      e.exports = function(e) {
        var n = [];
        return (
          (n.toString = function() {
            return this.map(function(n) {
              var t = (function(e, n) {
                var t,
                  r,
                  o,
                  a = e[1] || '',
                  i = e[3];
                if (!i) return a;
                if (n && 'function' == typeof btoa) {
                  var s =
                      ((t = i),
                      (r = btoa(
                        unescape(encodeURIComponent(JSON.stringify(t)))
                      )),
                      (o = 'sourceMappingURL=data:application/json;charset=utf-8;base64,'.concat(
                        r
                      )),
                      '/*# '.concat(o, ' */')),
                    l = i.sources.map(function(e) {
                      return '/*# sourceURL='
                        .concat(i.sourceRoot)
                        .concat(e, ' */');
                    });
                  return [a]
                    .concat(l)
                    .concat([s])
                    .join('\n');
                }
                return [a].join('\n');
              })(n, e);
              return n[2] ? '@media '.concat(n[2], '{').concat(t, '}') : t;
            }).join('');
          }),
          (n.i = function(e, t) {
            'string' == typeof e && (e = [[null, e, '']]);
            for (var r = {}, o = 0; o < this.length; o++) {
              var a = this[o][0];
              null != a && (r[a] = !0);
            }
            for (var i = 0; i < e.length; i++) {
              var s = e[i];
              (null != s[0] && r[s[0]]) ||
                (t && !s[2]
                  ? (s[2] = t)
                  : t && (s[2] = '('.concat(s[2], ') and (').concat(t, ')')),
                n.push(s));
            }
          }),
          n
        );
      };
    },
    7283: (e, n, t) => {
      var r = t(4599);
      'string' == typeof r && (r = [[e.id, r, '']]);
      t(2379)(r, { hmr: !0, transform: void 0, insertInto: void 0 }),
        r.locals && (e.exports = r.locals);
    },
    2379: (e, n, t) => {
      var r,
        o,
        a = {},
        i =
          ((r = function() {
            return window && document && document.all && !window.atob;
          }),
          function() {
            return void 0 === o && (o = r.apply(this, arguments)), o;
          }),
        s = function(e, n) {
          return n ? n.querySelector(e) : document.querySelector(e);
        },
        l = (function(e) {
          var n = {};
          return function(e, t) {
            if ('function' == typeof e) return e();
            if (void 0 === n[e]) {
              var r = s.call(this, e, t);
              if (
                window.HTMLIFrameElement &&
                r instanceof window.HTMLIFrameElement
              )
                try {
                  r = r.contentDocument.head;
                } catch (e) {
                  r = null;
                }
              n[e] = r;
            }
            return n[e];
          };
        })(),
        c = null,
        d = 0,
        p = [],
        f = t(9657);
      function u(e, n) {
        for (var t = 0; t < e.length; t++) {
          var r = e[t],
            o = a[r.id];
          if (o) {
            o.refs++;
            for (var i = 0; i < o.parts.length; i++) o.parts[i](r.parts[i]);
            for (; i < r.parts.length; i++) o.parts.push(g(r.parts[i], n));
          } else {
            var s = [];
            for (i = 0; i < r.parts.length; i++) s.push(g(r.parts[i], n));
            a[r.id] = { id: r.id, refs: 1, parts: s };
          }
        }
      }
      function h(e, n) {
        for (var t = [], r = {}, o = 0; o < e.length; o++) {
          var a = e[o],
            i = n.base ? a[0] + n.base : a[0],
            s = { css: a[1], media: a[2], sourceMap: a[3] };
          r[i] ? r[i].parts.push(s) : t.push((r[i] = { id: i, parts: [s] }));
        }
        return t;
      }
      function m(e, n) {
        var t = l(e.insertInto);
        if (!t)
          throw new Error(
            "Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."
          );
        var r = p[p.length - 1];
        if ('top' === e.insertAt)
          r
            ? r.nextSibling
              ? t.insertBefore(n, r.nextSibling)
              : t.appendChild(n)
            : t.insertBefore(n, t.firstChild),
            p.push(n);
        else if ('bottom' === e.insertAt) t.appendChild(n);
        else {
          if ('object' != typeof e.insertAt || !e.insertAt.before)
            throw new Error(
              "[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n"
            );
          var o = l(e.insertAt.before, t);
          t.insertBefore(n, o);
        }
      }
      function b(e) {
        if (null === e.parentNode) return !1;
        e.parentNode.removeChild(e);
        var n = p.indexOf(e);
        n >= 0 && p.splice(n, 1);
      }
      function y(e) {
        var n = document.createElement('style');
        if (
          (void 0 === e.attrs.type && (e.attrs.type = 'text/css'),
          void 0 === e.attrs.nonce)
        ) {
          var r = t.nc;
          r && (e.attrs.nonce = r);
        }
        return v(n, e.attrs), m(e, n), n;
      }
      function v(e, n) {
        Object.keys(n).forEach(function(t) {
          e.setAttribute(t, n[t]);
        });
      }
      function g(e, n) {
        var t, r, o, a;
        if (n.transform && e.css) {
          if (
            !(a =
              'function' == typeof n.transform
                ? n.transform(e.css)
                : n.transform.default(e.css))
          )
            return function() {};
          e.css = a;
        }
        if (n.singleton) {
          var i = d++;
          (t = c || (c = y(n))),
            (r = j.bind(null, t, i, !1)),
            (o = j.bind(null, t, i, !0));
        } else
          e.sourceMap &&
          'function' == typeof URL &&
          'function' == typeof URL.createObjectURL &&
          'function' == typeof URL.revokeObjectURL &&
          'function' == typeof Blob &&
          'function' == typeof btoa
            ? ((t = (function(e) {
                var n = document.createElement('link');
                return (
                  void 0 === e.attrs.type && (e.attrs.type = 'text/css'),
                  (e.attrs.rel = 'stylesheet'),
                  v(n, e.attrs),
                  m(e, n),
                  n
                );
              })(n)),
              (r = L.bind(null, t, n)),
              (o = function() {
                b(t), t.href && URL.revokeObjectURL(t.href);
              }))
            : ((t = y(n)),
              (r = E.bind(null, t)),
              (o = function() {
                b(t);
              }));
        return (
          r(e),
          function(n) {
            if (n) {
              if (
                n.css === e.css &&
                n.media === e.media &&
                n.sourceMap === e.sourceMap
              )
                return;
              r((e = n));
            } else o();
          }
        );
      }
      e.exports = function(e, n) {
        if ('undefined' != typeof DEBUG && DEBUG && 'object' != typeof document)
          throw new Error(
            'The style-loader cannot be used in a non-browser environment'
          );
        ((n = n || {}).attrs = 'object' == typeof n.attrs ? n.attrs : {}),
          n.singleton || 'boolean' == typeof n.singleton || (n.singleton = i()),
          n.insertInto || (n.insertInto = 'head'),
          n.insertAt || (n.insertAt = 'bottom');
        var t = h(e, n);
        return (
          u(t, n),
          function(e) {
            for (var r = [], o = 0; o < t.length; o++) {
              var i = t[o];
              (s = a[i.id]).refs--, r.push(s);
            }
            for (e && u(h(e, n), n), o = 0; o < r.length; o++) {
              var s;
              if (0 === (s = r[o]).refs) {
                for (var l = 0; l < s.parts.length; l++) s.parts[l]();
                delete a[s.id];
              }
            }
          }
        );
      };
      var x,
        w =
          ((x = []),
          function(e, n) {
            return (x[e] = n), x.filter(Boolean).join('\n');
          });
      function j(e, n, t, r) {
        var o = t ? '' : r.css;
        if (e.styleSheet) e.styleSheet.cssText = w(n, o);
        else {
          var a = document.createTextNode(o),
            i = e.childNodes;
          i[n] && e.removeChild(i[n]),
            i.length ? e.insertBefore(a, i[n]) : e.appendChild(a);
        }
      }
      function E(e, n) {
        var t = n.css,
          r = n.media;
        if ((r && e.setAttribute('media', r), e.styleSheet))
          e.styleSheet.cssText = t;
        else {
          for (; e.firstChild; ) e.removeChild(e.firstChild);
          e.appendChild(document.createTextNode(t));
        }
      }
      function L(e, n, t) {
        var r = t.css,
          o = t.sourceMap,
          a = void 0 === n.convertToAbsoluteUrls && o;
        (n.convertToAbsoluteUrls || a) && (r = f(r)),
          o &&
            (r +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(o)))) +
              ' */');
        var i = new Blob([r], { type: 'text/css' }),
          s = e.href;
        (e.href = URL.createObjectURL(i)), s && URL.revokeObjectURL(s);
      }
    },
    9657: e => {
      e.exports = function(e) {
        var n = 'undefined' != typeof window && window.location;
        if (!n) throw new Error('fixUrls requires window.location');
        if (!e || 'string' != typeof e) return e;
        var t = n.protocol + '//' + n.host,
          r = t + n.pathname.replace(/\/[^\/]*$/, '/');
        return e.replace(
          /url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,
          function(e, n) {
            var o,
              a = n
                .trim()
                .replace(/^"(.*)"$/, function(e, n) {
                  return n;
                })
                .replace(/^'(.*)'$/, function(e, n) {
                  return n;
                });
            return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(a)
              ? e
              : ((o =
                  0 === a.indexOf('//')
                    ? a
                    : 0 === a.indexOf('/')
                    ? t + a
                    : r + a.replace(/^\.\//, '')),
                'url(' + JSON.stringify(o) + ')');
          }
        );
      };
    }
  }
]);
