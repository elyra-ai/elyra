(self.webpackChunk_elyra_metadata_common =
  self.webpackChunk_elyra_metadata_common || []).push([
  [439, 805],
  {
    4363: (e, t, n) => {
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
                  a = e[1] || '',
                  s = e[3];
                if (!s) return a;
                if (t && 'function' == typeof btoa) {
                  var i =
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
                  return [a]
                    .concat(c)
                    .concat([i])
                    .join('\n');
                }
                return [a].join('\n');
              })(t, e);
              return t[2] ? '@media '.concat(t[2], '{').concat(n, '}') : n;
            }).join('');
          }),
          (t.i = function(e, n) {
            'string' == typeof e && (e = [[null, e, '']]);
            for (var r = {}, o = 0; o < this.length; o++) {
              var a = this[o][0];
              null != a && (r[a] = !0);
            }
            for (var s = 0; s < e.length; s++) {
              var i = e[s];
              (null != i[0] && r[i[0]]) ||
                (n && !i[2]
                  ? (i[2] = n)
                  : n && (i[2] = '('.concat(i[2], ') and (').concat(n, ')')),
                t.push(i));
            }
          }),
          t
        );
      };
    },
    2401: (e, t, n) => {
      var r = n(4363);
      'string' == typeof r && (r = [[e.id, r, '']]);
      n(2379)(r, { hmr: !0, transform: void 0, insertInto: void 0 }),
        r.locals && (e.exports = r.locals);
    },
    2379: (e, t, n) => {
      var r,
        o,
        a = {},
        s =
          ((r = function() {
            return window && document && document.all && !window.atob;
          }),
          function() {
            return void 0 === o && (o = r.apply(this, arguments)), o;
          }),
        i = function(e, t) {
          return t ? t.querySelector(e) : document.querySelector(e);
        },
        c = (function(e) {
          var t = {};
          return function(e, n) {
            if ('function' == typeof e) return e();
            if (void 0 === t[e]) {
              var r = i.call(this, e, n);
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
        l = 0,
        f = [],
        d = n(9657);
      function p(e, t) {
        for (var n = 0; n < e.length; n++) {
          var r = e[n],
            o = a[r.id];
          if (o) {
            o.refs++;
            for (var s = 0; s < o.parts.length; s++) o.parts[s](r.parts[s]);
            for (; s < r.parts.length; s++) o.parts.push(b(r.parts[s], t));
          } else {
            var i = [];
            for (s = 0; s < r.parts.length; s++) i.push(b(r.parts[s], t));
            a[r.id] = { id: r.id, refs: 1, parts: i };
          }
        }
      }
      function h(e, t) {
        for (var n = [], r = {}, o = 0; o < e.length; o++) {
          var a = e[o],
            s = t.base ? a[0] + t.base : a[0],
            i = { css: a[1], media: a[2], sourceMap: a[3] };
          r[s] ? r[s].parts.push(i) : n.push((r[s] = { id: s, parts: [i] }));
        }
        return n;
      }
      function m(e, t) {
        var n = c(e.insertInto);
        if (!n)
          throw new Error(
            "Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."
          );
        var r = f[f.length - 1];
        if ('top' === e.insertAt)
          r
            ? r.nextSibling
              ? n.insertBefore(t, r.nextSibling)
              : n.appendChild(t)
            : n.insertBefore(t, n.firstChild),
            f.push(t);
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
      function v(e) {
        if (null === e.parentNode) return !1;
        e.parentNode.removeChild(e);
        var t = f.indexOf(e);
        t >= 0 && f.splice(t, 1);
      }
      function y(e) {
        var t = document.createElement('style');
        if (
          (void 0 === e.attrs.type && (e.attrs.type = 'text/css'),
          void 0 === e.attrs.nonce)
        ) {
          var r = n.nc;
          r && (e.attrs.nonce = r);
        }
        return g(t, e.attrs), m(e, t), t;
      }
      function g(e, t) {
        Object.keys(t).forEach(function(n) {
          e.setAttribute(n, t[n]);
        });
      }
      function b(e, t) {
        var n, r, o, a;
        if (t.transform && e.css) {
          if (
            !(a =
              'function' == typeof t.transform
                ? t.transform(e.css)
                : t.transform.default(e.css))
          )
            return function() {};
          e.css = a;
        }
        if (t.singleton) {
          var s = l++;
          (n = u || (u = y(t))),
            (r = S.bind(null, n, s, !1)),
            (o = S.bind(null, n, s, !0));
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
                  g(t, e.attrs),
                  m(e, t),
                  t
                );
              })(t)),
              (r = E.bind(null, n, t)),
              (o = function() {
                v(n), n.href && URL.revokeObjectURL(n.href);
              }))
            : ((n = y(t)),
              (r = R.bind(null, n)),
              (o = function() {
                v(n);
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
          p(n, t),
          function(e) {
            for (var r = [], o = 0; o < n.length; o++) {
              var s = n[o];
              (i = a[s.id]).refs--, r.push(i);
            }
            for (e && p(h(e, t), t), o = 0; o < r.length; o++) {
              var i;
              if (0 === (i = r[o]).refs) {
                for (var c = 0; c < i.parts.length; c++) i.parts[c]();
                delete a[i.id];
              }
            }
          }
        );
      };
      var w,
        k =
          ((w = []),
          function(e, t) {
            return (w[e] = t), w.filter(Boolean).join('\n');
          });
      function S(e, t, n, r) {
        var o = n ? '' : r.css;
        if (e.styleSheet) e.styleSheet.cssText = k(t, o);
        else {
          var a = document.createTextNode(o),
            s = e.childNodes;
          s[t] && e.removeChild(s[t]),
            s.length ? e.insertBefore(a, s[t]) : e.appendChild(a);
        }
      }
      function R(e, t) {
        var n = t.css,
          r = t.media;
        if ((r && e.setAttribute('media', r), e.styleSheet))
          e.styleSheet.cssText = n;
        else {
          for (; e.firstChild; ) e.removeChild(e.firstChild);
          e.appendChild(document.createTextNode(n));
        }
      }
      function E(e, t, n) {
        var r = n.css,
          o = n.sourceMap,
          a = void 0 === t.convertToAbsoluteUrls && o;
        (t.convertToAbsoluteUrls || a) && (r = d(r)),
          o &&
            (r +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(o)))) +
              ' */');
        var s = new Blob([r], { type: 'text/css' }),
          i = e.href;
        (e.href = URL.createObjectURL(s)), i && URL.revokeObjectURL(i);
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
              a = t
                .trim()
                .replace(/^"(.*)"$/, function(e, t) {
                  return t;
                })
                .replace(/^'(.*)'$/, function(e, t) {
                  return t;
                });
            return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(a)
              ? e
              : ((o =
                  0 === a.indexOf('//')
                    ? a
                    : 0 === a.indexOf('/')
                    ? n + a
                    : r + a.replace(/^\.\//, '')),
                'url(' + JSON.stringify(o) + ')');
          }
        );
      };
    },
    8439: (e, t, n) => {
      'use strict';
      n.r(t),
        n.d(t, {
          FrontendServices: () => f,
          NotebookParser: () => r,
          RequestHandler: () => u
        }),
        n(2401);
      class r {
        static getEnvVars(e) {
          const t = [],
            n = JSON.parse(e),
            r = /os\.(?:environ(?:\["([^"]+)|\['([^']+)|\.get\("([^"]+)|\.get\('([^']+))|getenv\("([^"]+)|getenv\('([^']+))/;
          for (const e of n.cells)
            if ('code' == e.cell_type) {
              const n = this.findInCode(e.source, r);
              for (const e of n)
                for (let n = 1; n < e.length; n++) e[n] && t.push(e[n]);
            }
          return [...new Set(t)];
        }
        static findInCode(e, t) {
          const n = [],
            r = e.split(/\r?\n/);
          for (const e of r) {
            const r = e.match(t);
            r && n.push(r);
          }
          return n;
        }
      }
      var o = n(4268),
        a = n(2959),
        s = n(5216),
        i = n(2822),
        c = n(3526);
      class u {
        static serverError(e) {
          const t = e.reason ? e.reason : '',
            n = e.message ? e.message : '',
            r = e.timestamp ? e.timestamp : '',
            i = e.traceback ? e.traceback : '',
            c = e.timestamp
              ? 'Check the JupyterLab log for more details at ' + e.timestamp
              : 'Check the JupyterLab log for more details';
          return (0, o.showDialog)({
            title: 'Error making request',
            body:
              t || n
                ? a.createElement(s.ExpandableErrorDialog, {
                    reason: t,
                    message: n,
                    timestamp: r,
                    traceback: i,
                    default_msg: c
                  })
                : a.createElement('p', null, c),
            buttons: [o.Dialog.okButton()]
          });
        }
        static server404(e) {
          return (0, o.showDialog)({
            title: 'Error contacting server',
            body: a.createElement(
              'p',
              null,
              'Endpoint ',
              a.createElement('code', null, e),
              ' not found.'
            ),
            buttons: [o.Dialog.okButton()]
          });
        }
        static async makeGetRequest(e, t) {
          return this.makeServerRequest(e, { method: 'GET' }, t);
        }
        static async makePostRequest(e, t, n) {
          return this.makeServerRequest(e, { method: 'POST', body: t }, n);
        }
        static async makePutRequest(e, t, n) {
          return this.makeServerRequest(e, { method: 'PUT', body: t }, n);
        }
        static async makeDeleteRequest(e, t) {
          return this.makeServerRequest(e, { method: 'DELETE' }, t);
        }
        static async makeServerRequest(e, t, n) {
          const r = c.ServerConnection.makeSettings(),
            a = i.URLExt.join(r.baseUrl, e);
          console.log(`Sending a ${t.method} request to ${a}`);
          const s = new o.Dialog({
            title: 'Making server request...',
            body: 'This may take some time',
            buttons: [o.Dialog.okButton()]
          });
          n && s.launch();
          const u = new Promise((o, i) => {
            c.ServerConnection.makeRequest(a, t, r).then(
              t => {
                n && s.resolve(),
                  t.json().then(
                    e => {
                      if (t.status < 200 || t.status >= 300)
                        return this.serverError(e);
                      o(e);
                    },
                    n =>
                      404 == t.status
                        ? this.server404(e)
                        : 204 != t.status
                        ? this.serverError(n)
                        : void o()
                  );
              },
              e => (console.error(e), this.serverError(e))
            );
          });
          return await u;
        }
      }
      const l = 'elyra/metadata/';
      class f {
        static noMetadataError(e) {
          return (0, o.showDialog)({
            title: 'Error retrieving metadata',
            body: a.createElement(
              'p',
              null,
              'No ',
              e,
              ' metadata has been configured.'
            ),
            buttons: [o.Dialog.okButton()]
          });
        }
        static async getMetadata(e) {
          return (await u.makeGetRequest(l + e, !1))[e];
        }
        static async postMetadata(e, t) {
          return await u.makePostRequest(l + e, t, !1);
        }
        static async putMetadata(e, t, n) {
          return await u.makePutRequest(l + e + '/' + t, n, !1);
        }
        static async deleteMetadata(e, t) {
          return await u.makeDeleteRequest(l + e + '/' + t, !1);
        }
        static async getSchema(e) {
          if (this.schemaCache[e])
            return JSON.parse(JSON.stringify(this.schemaCache[e]));
          const t = await u.makeGetRequest('elyra/schema/' + e, !1);
          return t[e] && (this.schemaCache[e] = t[e]), t[e];
        }
        static async getAllSchema() {
          const e = await u.makeGetRequest('elyra/namespace', !1),
            t = [];
          for (const n of e.namespaces) {
            const e = await this.getSchema(n);
            t.push(...e);
          }
          return t;
        }
      }
      f.schemaCache = {};
    }
  }
]);
