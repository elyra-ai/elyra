(self.webpackChunk_elyra_python_editor_extension =
  self.webpackChunk_elyra_python_editor_extension || []).push([
  [283],
  {
    599: (t, e, n) => {
      (t.exports = n(609)(!1)).push([
        t.id,
        '/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the "License");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an "AS IS" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n.elyra-PythonEditor-OutputArea-error {\n  background-color: var(--jp-rendermime-error-background);\n}\n\n.elyra-PythonEditor-OutputArea-child {\n  border-top: 1px solid var(--jp-border-color2);\n  border-bottom: 1px solid var(--jp-border-color2);\n}\n\n.elyra-PythonEditor-OutputArea-prompt {\n  flex: 0 0 37px;\n  border-right: 1px solid var(--jp-border-color2);\n  padding: unset;\n  text-align: center;\n}\n\n.elyra-PythonEditor-OutputArea-output {\n  padding: var(--jp-code-padding);\n  border: var(--jp-border-width) solid transparent;\n  margin-right: 64px;\n}\n\n.elyra-PythonEditor-scrollTop {\n  top: 33px;\n}\n\n.elyra-PythonEditor-scrollBottom {\n  top: 62px;\n}\n\n.elyra-PythonEditor-scrollBottom,\n.elyra-PythonEditor-scrollTop {\n  position: absolute;\n  right: 21px;\n  z-index: 1;\n  background-color: transparent;\n  width: 30px;\n  height: 30px;\n  border-width: 0px;\n  border-style: solid;\n  border-radius: 5px;\n}\n\nbutton.elyra-PythonEditor-scrollTop:hover {\n  background-color: var(--jp-layout-color2);\n}\n\nbutton.elyra-PythonEditor-scrollBottom:hover {\n  background-color: var(--jp-layout-color2);\n}\n\n.elyra-PythonEditor-scrollBottom g[fill],\n.elyra-PythonEditor-scrollTop g[fill] {\n  fill: var(--jp-inverse-layout-color3);\n}\n\n.jp-Document .jp-Toolbar.elyra-PythonEditor-Toolbar {\n  justify-content: flex-start;\n}\n',
        ''
      ]);
    },
    609: t => {
      'use strict';
      t.exports = function(t) {
        var e = [];
        return (
          (e.toString = function() {
            return this.map(function(e) {
              var n = (function(t, e) {
                var n,
                  r,
                  o,
                  i = t[1] || '',
                  a = t[3];
                if (!a) return i;
                if (e && 'function' == typeof btoa) {
                  var s =
                      ((n = a),
                      (r = btoa(
                        unescape(encodeURIComponent(JSON.stringify(n)))
                      )),
                      (o = 'sourceMappingURL=data:application/json;charset=utf-8;base64,'.concat(
                        r
                      )),
                      '/*# '.concat(o, ' */')),
                    c = a.sources.map(function(t) {
                      return '/*# sourceURL='
                        .concat(a.sourceRoot)
                        .concat(t, ' */');
                    });
                  return [i]
                    .concat(c)
                    .concat([s])
                    .join('\n');
                }
                return [i].join('\n');
              })(e, t);
              return e[2] ? '@media '.concat(e[2], '{').concat(n, '}') : n;
            }).join('');
          }),
          (e.i = function(t, n) {
            'string' == typeof t && (t = [[null, t, '']]);
            for (var r = {}, o = 0; o < this.length; o++) {
              var i = this[o][0];
              null != i && (r[i] = !0);
            }
            for (var a = 0; a < t.length; a++) {
              var s = t[a];
              (null != s[0] && r[s[0]]) ||
                (n && !s[2]
                  ? (s[2] = n)
                  : n && (s[2] = '('.concat(s[2], ') and (').concat(n, ')')),
                e.push(s));
            }
          }),
          e
        );
      };
    },
    283: (t, e, n) => {
      var r = n(599);
      'string' == typeof r && (r = [[t.id, r, '']]);
      n(379)(r, { hmr: !0, transform: void 0, insertInto: void 0 }),
        r.locals && (t.exports = r.locals);
    },
    379: (t, e, n) => {
      var r,
        o,
        i = {},
        a =
          ((r = function() {
            return window && document && document.all && !window.atob;
          }),
          function() {
            return void 0 === o && (o = r.apply(this, arguments)), o;
          }),
        s = function(t, e) {
          return e ? e.querySelector(t) : document.querySelector(t);
        },
        c = (function(t) {
          var e = {};
          return function(t, n) {
            if ('function' == typeof t) return t();
            if (void 0 === e[t]) {
              var r = s.call(this, t, n);
              if (
                window.HTMLIFrameElement &&
                r instanceof window.HTMLIFrameElement
              )
                try {
                  r = r.contentDocument.head;
                } catch (t) {
                  r = null;
                }
              e[t] = r;
            }
            return e[t];
          };
        })(),
        l = null,
        u = 0,
        p = [],
        d = n(657);
      function f(t, e) {
        for (var n = 0; n < t.length; n++) {
          var r = t[n],
            o = i[r.id];
          if (o) {
            o.refs++;
            for (var a = 0; a < o.parts.length; a++) o.parts[a](r.parts[a]);
            for (; a < r.parts.length; a++) o.parts.push(g(r.parts[a], e));
          } else {
            var s = [];
            for (a = 0; a < r.parts.length; a++) s.push(g(r.parts[a], e));
            i[r.id] = { id: r.id, refs: 1, parts: s };
          }
        }
      }
      function h(t, e) {
        for (var n = [], r = {}, o = 0; o < t.length; o++) {
          var i = t[o],
            a = e.base ? i[0] + e.base : i[0],
            s = { css: i[1], media: i[2], sourceMap: i[3] };
          r[a] ? r[a].parts.push(s) : n.push((r[a] = { id: a, parts: [s] }));
        }
        return n;
      }
      function y(t, e) {
        var n = c(t.insertInto);
        if (!n)
          throw new Error(
            "Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."
          );
        var r = p[p.length - 1];
        if ('top' === t.insertAt)
          r
            ? r.nextSibling
              ? n.insertBefore(e, r.nextSibling)
              : n.appendChild(e)
            : n.insertBefore(e, n.firstChild),
            p.push(e);
        else if ('bottom' === t.insertAt) n.appendChild(e);
        else {
          if ('object' != typeof t.insertAt || !t.insertAt.before)
            throw new Error(
              "[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n"
            );
          var o = c(t.insertAt.before, n);
          n.insertBefore(e, o);
        }
      }
      function v(t) {
        if (null === t.parentNode) return !1;
        t.parentNode.removeChild(t);
        var e = p.indexOf(t);
        e >= 0 && p.splice(e, 1);
      }
      function b(t) {
        var e = document.createElement('style');
        if (
          (void 0 === t.attrs.type && (t.attrs.type = 'text/css'),
          void 0 === t.attrs.nonce)
        ) {
          var r = n.nc;
          r && (t.attrs.nonce = r);
        }
        return m(e, t.attrs), y(t, e), e;
      }
      function m(t, e) {
        Object.keys(e).forEach(function(n) {
          t.setAttribute(n, e[n]);
        });
      }
      function g(t, e) {
        var n, r, o, i;
        if (e.transform && t.css) {
          if (
            !(i =
              'function' == typeof e.transform
                ? e.transform(t.css)
                : e.transform.default(t.css))
          )
            return function() {};
          t.css = i;
        }
        if (e.singleton) {
          var a = u++;
          (n = l || (l = b(e))),
            (r = j.bind(null, n, a, !1)),
            (o = j.bind(null, n, a, !0));
        } else
          t.sourceMap &&
          'function' == typeof URL &&
          'function' == typeof URL.createObjectURL &&
          'function' == typeof URL.revokeObjectURL &&
          'function' == typeof Blob &&
          'function' == typeof btoa
            ? ((n = (function(t) {
                var e = document.createElement('link');
                return (
                  void 0 === t.attrs.type && (t.attrs.type = 'text/css'),
                  (t.attrs.rel = 'stylesheet'),
                  m(e, t.attrs),
                  y(t, e),
                  e
                );
              })(e)),
              (r = L.bind(null, n, e)),
              (o = function() {
                v(n), n.href && URL.revokeObjectURL(n.href);
              }))
            : ((n = b(e)),
              (r = E.bind(null, n)),
              (o = function() {
                v(n);
              }));
        return (
          r(t),
          function(e) {
            if (e) {
              if (
                e.css === t.css &&
                e.media === t.media &&
                e.sourceMap === t.sourceMap
              )
                return;
              r((t = e));
            } else o();
          }
        );
      }
      t.exports = function(t, e) {
        if ('undefined' != typeof DEBUG && DEBUG && 'object' != typeof document)
          throw new Error(
            'The style-loader cannot be used in a non-browser environment'
          );
        ((e = e || {}).attrs = 'object' == typeof e.attrs ? e.attrs : {}),
          e.singleton || 'boolean' == typeof e.singleton || (e.singleton = a()),
          e.insertInto || (e.insertInto = 'head'),
          e.insertAt || (e.insertAt = 'bottom');
        var n = h(t, e);
        return (
          f(n, e),
          function(t) {
            for (var r = [], o = 0; o < n.length; o++) {
              var a = n[o];
              (s = i[a.id]).refs--, r.push(s);
            }
            for (t && f(h(t, e), e), o = 0; o < r.length; o++) {
              var s;
              if (0 === (s = r[o]).refs) {
                for (var c = 0; c < s.parts.length; c++) s.parts[c]();
                delete i[s.id];
              }
            }
          }
        );
      };
      var x,
        w =
          ((x = []),
          function(t, e) {
            return (x[t] = e), x.filter(Boolean).join('\n');
          });
      function j(t, e, n, r) {
        var o = n ? '' : r.css;
        if (t.styleSheet) t.styleSheet.cssText = w(e, o);
        else {
          var i = document.createTextNode(o),
            a = t.childNodes;
          a[e] && t.removeChild(a[e]),
            a.length ? t.insertBefore(i, a[e]) : t.appendChild(i);
        }
      }
      function E(t, e) {
        var n = e.css,
          r = e.media;
        if ((r && t.setAttribute('media', r), t.styleSheet))
          t.styleSheet.cssText = n;
        else {
          for (; t.firstChild; ) t.removeChild(t.firstChild);
          t.appendChild(document.createTextNode(n));
        }
      }
      function L(t, e, n) {
        var r = n.css,
          o = n.sourceMap,
          i = void 0 === e.convertToAbsoluteUrls && o;
        (e.convertToAbsoluteUrls || i) && (r = d(r)),
          o &&
            (r +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(o)))) +
              ' */');
        var a = new Blob([r], { type: 'text/css' }),
          s = t.href;
        (t.href = URL.createObjectURL(a)), s && URL.revokeObjectURL(s);
      }
    },
    657: t => {
      t.exports = function(t) {
        var e = 'undefined' != typeof window && window.location;
        if (!e) throw new Error('fixUrls requires window.location');
        if (!t || 'string' != typeof t) return t;
        var n = e.protocol + '//' + e.host,
          r = n + e.pathname.replace(/\/[^\/]*$/, '/');
        return t.replace(
          /url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,
          function(t, e) {
            var o,
              i = e
                .trim()
                .replace(/^"(.*)"$/, function(t, e) {
                  return e;
                })
                .replace(/^'(.*)'$/, function(t, e) {
                  return e;
                });
            return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(i)
              ? t
              : ((o =
                  0 === i.indexOf('//')
                    ? i
                    : 0 === i.indexOf('/')
                    ? n + i
                    : r + i.replace(/^\.\//, '')),
                'url(' + JSON.stringify(o) + ')');
          }
        );
      };
    }
  }
]);
