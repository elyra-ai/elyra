(self.webpackChunk_elyra_code_snippet_extension =
  self.webpackChunk_elyra_code_snippet_extension || []).push([
  [283, 805],
  {
    4599: (e, t, n) => {
      (e.exports = n(2609)(!1)).push([
        e.id,
        '/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the "License");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an "AS IS" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n',
        ''
      ]);
    },
    2609: e => {
      'use strict';
      e.exports = function(e) {
        var t = [];
        return (
          (t.toString = function() {
            return this.map(function(t) {
              var n = (function(e, t) {
                var n,
                  r,
                  o,
                  i = e[1] || '',
                  s = e[3];
                if (!s) return i;
                if (t && 'function' == typeof btoa) {
                  var a =
                      ((n = s),
                      (r = btoa(
                        unescape(encodeURIComponent(JSON.stringify(n)))
                      )),
                      (o = 'sourceMappingURL=data:application/json;charset=utf-8;base64,'.concat(
                        r
                      )),
                      '/*# '.concat(o, ' */')),
                    c = s.sources.map(function(e) {
                      return '/*# sourceURL='
                        .concat(s.sourceRoot)
                        .concat(e, ' */');
                    });
                  return [i]
                    .concat(c)
                    .concat([a])
                    .join('\n');
                }
                return [i].join('\n');
              })(t, e);
              return t[2] ? '@media '.concat(t[2], '{').concat(n, '}') : n;
            }).join('');
          }),
          (t.i = function(e, n) {
            'string' == typeof e && (e = [[null, e, '']]);
            for (var r = {}, o = 0; o < this.length; o++) {
              var i = this[o][0];
              null != i && (r[i] = !0);
            }
            for (var s = 0; s < e.length; s++) {
              var a = e[s];
              (null != a[0] && r[a[0]]) ||
                (n && !a[2]
                  ? (a[2] = n)
                  : n && (a[2] = '('.concat(a[2], ') and (').concat(n, ')')),
                t.push(a));
            }
          }),
          t
        );
      };
    },
    7283: (e, t, n) => {
      var r = n(4599);
      'string' == typeof r && (r = [[e.id, r, '']]);
      n(2379)(r, { hmr: !0, transform: void 0, insertInto: void 0 }),
        r.locals && (e.exports = r.locals);
    },
    2379: (e, t, n) => {
      var r,
        o,
        i = {},
        s =
          ((r = function() {
            return window && document && document.all && !window.atob;
          }),
          function() {
            return void 0 === o && (o = r.apply(this, arguments)), o;
          }),
        a = function(e, t) {
          return t ? t.querySelector(e) : document.querySelector(e);
        },
        c = (function(e) {
          var t = {};
          return function(e, n) {
            if ('function' == typeof e) return e();
            if (void 0 === t[e]) {
              var r = a.call(this, e, n);
              if (
                window.HTMLIFrameElement &&
                r instanceof window.HTMLIFrameElement
              )
                try {
                  r = r.contentDocument.head;
                } catch (e) {
                  r = null;
                }
              t[e] = r;
            }
            return t[e];
          };
        })(),
        u = null,
        f = 0,
        l = [],
        p = n(9657);
      function d(e, t) {
        for (var n = 0; n < e.length; n++) {
          var r = e[n],
            o = i[r.id];
          if (o) {
            o.refs++;
            for (var s = 0; s < o.parts.length; s++) o.parts[s](r.parts[s]);
            for (; s < r.parts.length; s++) o.parts.push(g(r.parts[s], t));
          } else {
            var a = [];
            for (s = 0; s < r.parts.length; s++) a.push(g(r.parts[s], t));
            i[r.id] = { id: r.id, refs: 1, parts: a };
          }
        }
      }
      function h(e, t) {
        for (var n = [], r = {}, o = 0; o < e.length; o++) {
          var i = e[o],
            s = t.base ? i[0] + t.base : i[0],
            a = { css: i[1], media: i[2], sourceMap: i[3] };
          r[s] ? r[s].parts.push(a) : n.push((r[s] = { id: s, parts: [a] }));
        }
        return n;
      }
      function v(e, t) {
        var n = c(e.insertInto);
        if (!n)
          throw new Error(
            "Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."
          );
        var r = l[l.length - 1];
        if ('top' === e.insertAt)
          r
            ? r.nextSibling
              ? n.insertBefore(t, r.nextSibling)
              : n.appendChild(t)
            : n.insertBefore(t, n.firstChild),
            l.push(t);
        else if ('bottom' === e.insertAt) n.appendChild(t);
        else {
          if ('object' != typeof e.insertAt || !e.insertAt.before)
            throw new Error(
              "[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n"
            );
          var o = c(e.insertAt.before, n);
          n.insertBefore(t, o);
        }
      }
      function b(e) {
        if (null === e.parentNode) return !1;
        e.parentNode.removeChild(e);
        var t = l.indexOf(e);
        t >= 0 && l.splice(t, 1);
      }
      function m(e) {
        var t = document.createElement('style');
        if (
          (void 0 === e.attrs.type && (e.attrs.type = 'text/css'),
          void 0 === e.attrs.nonce)
        ) {
          var r = n.nc;
          r && (e.attrs.nonce = r);
        }
        return y(t, e.attrs), v(e, t), t;
      }
      function y(e, t) {
        Object.keys(t).forEach(function(n) {
          e.setAttribute(n, t[n]);
        });
      }
      function g(e, t) {
        var n, r, o, i;
        if (t.transform && e.css) {
          if (
            !(i =
              'function' == typeof t.transform
                ? t.transform(e.css)
                : t.transform.default(e.css))
          )
            return function() {};
          e.css = i;
        }
        if (t.singleton) {
          var s = f++;
          (n = u || (u = m(t))),
            (r = U.bind(null, n, s, !1)),
            (o = U.bind(null, n, s, !0));
        } else
          e.sourceMap &&
          'function' == typeof URL &&
          'function' == typeof URL.createObjectURL &&
          'function' == typeof URL.revokeObjectURL &&
          'function' == typeof Blob &&
          'function' == typeof btoa
            ? ((n = (function(e) {
                var t = document.createElement('link');
                return (
                  void 0 === e.attrs.type && (e.attrs.type = 'text/css'),
                  (e.attrs.rel = 'stylesheet'),
                  y(t, e.attrs),
                  v(e, t),
                  t
                );
              })(t)),
              (r = S.bind(null, n, t)),
              (o = function() {
                b(n), n.href && URL.revokeObjectURL(n.href);
              }))
            : ((n = m(t)),
              (r = x.bind(null, n)),
              (o = function() {
                b(n);
              }));
        return (
          r(e),
          function(t) {
            if (t) {
              if (
                t.css === e.css &&
                t.media === e.media &&
                t.sourceMap === e.sourceMap
              )
                return;
              r((e = t));
            } else o();
          }
        );
      }
      e.exports = function(e, t) {
        if ('undefined' != typeof DEBUG && DEBUG && 'object' != typeof document)
          throw new Error(
            'The style-loader cannot be used in a non-browser environment'
          );
        ((t = t || {}).attrs = 'object' == typeof t.attrs ? t.attrs : {}),
          t.singleton || 'boolean' == typeof t.singleton || (t.singleton = s()),
          t.insertInto || (t.insertInto = 'head'),
          t.insertAt || (t.insertAt = 'bottom');
        var n = h(e, t);
        return (
          d(n, t),
          function(e) {
            for (var r = [], o = 0; o < n.length; o++) {
              var s = n[o];
              (a = i[s.id]).refs--, r.push(a);
            }
            for (e && d(h(e, t), t), o = 0; o < r.length; o++) {
              var a;
              if (0 === (a = r[o]).refs) {
                for (var c = 0; c < a.parts.length; c++) a.parts[c]();
                delete i[a.id];
              }
            }
          }
        );
      };
      var w,
        L =
          ((w = []),
          function(e, t) {
            return (w[e] = t), w.filter(Boolean).join('\n');
          });
      function U(e, t, n, r) {
        var o = n ? '' : r.css;
        if (e.styleSheet) e.styleSheet.cssText = L(t, o);
        else {
          var i = document.createTextNode(o),
            s = e.childNodes;
          s[t] && e.removeChild(s[t]),
            s.length ? e.insertBefore(i, s[t]) : e.appendChild(i);
        }
      }
      function x(e, t) {
        var n = t.css,
          r = t.media;
        if ((r && e.setAttribute('media', r), e.styleSheet))
          e.styleSheet.cssText = n;
        else {
          for (; e.firstChild; ) e.removeChild(e.firstChild);
          e.appendChild(document.createTextNode(n));
        }
      }
      function S(e, t, n) {
        var r = n.css,
          o = n.sourceMap,
          i = void 0 === t.convertToAbsoluteUrls && o;
        (t.convertToAbsoluteUrls || i) && (r = p(r)),
          o &&
            (r +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(o)))) +
              ' */');
        var s = new Blob([r], { type: 'text/css' }),
          a = e.href;
        (e.href = URL.createObjectURL(s)), a && URL.revokeObjectURL(a);
      }
    },
    9657: e => {
      e.exports = function(e) {
        var t = 'undefined' != typeof window && window.location;
        if (!t) throw new Error('fixUrls requires window.location');
        if (!e || 'string' != typeof e) return e;
        var n = t.protocol + '//' + t.host,
          r = n + t.pathname.replace(/\/[^\/]*$/, '/');
        return e.replace(
          /url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,
          function(e, t) {
            var o,
              i = t
                .trim()
                .replace(/^"(.*)"$/, function(e, t) {
                  return t;
                })
                .replace(/^'(.*)'$/, function(e, t) {
                  return t;
                });
            return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(i)
              ? e
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
