(self.webpackChunk_elyra_metadata_extension =
  self.webpackChunk_elyra_metadata_extension || []).push([
  [283],
  {
    4599: (t, e, n) => {
      (t.exports = n(2609)(!1)).push([
        t.id,
        '.elyra-metadataEditor .jp-InputGroup {\n  width: 100%;\n}\n\n.elyra-metadataEditor .bp3-form-group {\n  margin-bottom: 12px;\n  margin-right: 20px;\n  flex-basis: 40%;\n  height: 65px;\n}\n\n.bp3-select-popover {\n  max-height: 150px;\n  overflow-y: auto;\n}\n\n.elyra-form-DropDown-item {\n  width: 100%;\n  display: flex;\n  justify-content: left;\n  margin: 0;\n  border-radius: 0;\n}\n\n.elyra-metadataEditor {\n  padding: 20px;\n  display: flex;\n  flex-wrap: wrap;\n  height: 100%;\n  align-content: flex-start;\n  align-items: flex-start;\n  justify-content: flex-start;\n}\n\n.elyra-metadataEditor h3 {\n  flex-basis: 100%;\n  margin-bottom: 15px;\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadataEditor label.bp3-label {\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadataEditor .elyra-form-code.jp-CodeMirrorEditor {\n  background-color: var(--jp-cell-editor-background);\n  border: var(--jp-border-width) solid var(--jp-input-border-color);\n  overflow-y: auto;\n  resize: vertical;\n  min-height: 150px;\n  height: 150px;\n  padding-bottom: 10px;\n  cursor: initial;\n}\n\n.elyra-metadataEditor .CodeMirror.cm-s-jupyter {\n  background-color: inherit;\n  height: 100%;\n}\n\n.elyra-metadataEditor .bp3-form-group.elyra-metadataEditor-code {\n  height: auto;\n  flex-basis: 100%;\n  display: flex;\n}\n\n.elyra-metadataEditor-code .bp3-form-content {\n  height: 100%;\n}\n\n.bp3-dark .bp3-input {\n  border: var(--jp-border-width) solid var(--jp-input-border-color);\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadata-editor {\n  overflow-y: auto;\n}\n\n.elyra-metadata-editor.bp3-dark {\n  background-color: var(--jp-border-color3);\n}\n',
        ''
      ]);
    },
    2609: t => {
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
                  a = t[1] || '',
                  i = t[3];
                if (!i) return a;
                if (e && 'function' == typeof btoa) {
                  var s =
                      ((n = i),
                      (r = btoa(
                        unescape(encodeURIComponent(JSON.stringify(n)))
                      )),
                      (o = 'sourceMappingURL=data:application/json;charset=utf-8;base64,'.concat(
                        r
                      )),
                      '/*# '.concat(o, ' */')),
                    c = i.sources.map(function(t) {
                      return '/*# sourceURL='
                        .concat(i.sourceRoot)
                        .concat(t, ' */');
                    });
                  return [a]
                    .concat(c)
                    .concat([s])
                    .join('\n');
                }
                return [a].join('\n');
              })(e, t);
              return e[2] ? '@media '.concat(e[2], '{').concat(n, '}') : n;
            }).join('');
          }),
          (e.i = function(t, n) {
            'string' == typeof t && (t = [[null, t, '']]);
            for (var r = {}, o = 0; o < this.length; o++) {
              var a = this[o][0];
              null != a && (r[a] = !0);
            }
            for (var i = 0; i < t.length; i++) {
              var s = t[i];
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
    7283: (t, e, n) => {
      var r = n(4599);
      'string' == typeof r && (r = [[t.id, r, '']]);
      n(2379)(r, { hmr: !0, transform: void 0, insertInto: void 0 }),
        r.locals && (t.exports = r.locals);
    },
    2379: (t, e, n) => {
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
        f = 0,
        u = [],
        d = n(9657);
      function p(t, e) {
        for (var n = 0; n < t.length; n++) {
          var r = t[n],
            o = a[r.id];
          if (o) {
            o.refs++;
            for (var i = 0; i < o.parts.length; i++) o.parts[i](r.parts[i]);
            for (; i < r.parts.length; i++) o.parts.push(g(r.parts[i], e));
          } else {
            var s = [];
            for (i = 0; i < r.parts.length; i++) s.push(g(r.parts[i], e));
            a[r.id] = { id: r.id, refs: 1, parts: s };
          }
        }
      }
      function h(t, e) {
        for (var n = [], r = {}, o = 0; o < t.length; o++) {
          var a = t[o],
            i = e.base ? a[0] + e.base : a[0],
            s = { css: a[1], media: a[2], sourceMap: a[3] };
          r[i] ? r[i].parts.push(s) : n.push((r[i] = { id: i, parts: [s] }));
        }
        return n;
      }
      function v(t, e) {
        var n = c(t.insertInto);
        if (!n)
          throw new Error(
            "Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."
          );
        var r = u[u.length - 1];
        if ('top' === t.insertAt)
          r
            ? r.nextSibling
              ? n.insertBefore(e, r.nextSibling)
              : n.appendChild(e)
            : n.insertBefore(e, n.firstChild),
            u.push(e);
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
      function b(t) {
        if (null === t.parentNode) return !1;
        t.parentNode.removeChild(t);
        var e = u.indexOf(t);
        e >= 0 && u.splice(e, 1);
      }
      function m(t) {
        var e = document.createElement('style');
        if (
          (void 0 === t.attrs.type && (t.attrs.type = 'text/css'),
          void 0 === t.attrs.nonce)
        ) {
          var r = n.nc;
          r && (t.attrs.nonce = r);
        }
        return y(e, t.attrs), v(t, e), e;
      }
      function y(t, e) {
        Object.keys(e).forEach(function(n) {
          t.setAttribute(n, e[n]);
        });
      }
      function g(t, e) {
        var n, r, o, a;
        if (e.transform && t.css) {
          if (
            !(a =
              'function' == typeof e.transform
                ? e.transform(t.css)
                : e.transform.default(t.css))
          )
            return function() {};
          t.css = a;
        }
        if (e.singleton) {
          var i = f++;
          (n = l || (l = m(e))),
            (r = j.bind(null, n, i, !1)),
            (o = j.bind(null, n, i, !0));
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
                  y(e, t.attrs),
                  v(t, e),
                  e
                );
              })(e)),
              (r = U.bind(null, n, e)),
              (o = function() {
                b(n), n.href && URL.revokeObjectURL(n.href);
              }))
            : ((n = m(e)),
              (r = E.bind(null, n)),
              (o = function() {
                b(n);
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
          e.singleton || 'boolean' == typeof e.singleton || (e.singleton = i()),
          e.insertInto || (e.insertInto = 'head'),
          e.insertAt || (e.insertAt = 'bottom');
        var n = h(t, e);
        return (
          p(n, e),
          function(t) {
            for (var r = [], o = 0; o < n.length; o++) {
              var i = n[o];
              (s = a[i.id]).refs--, r.push(s);
            }
            for (t && p(h(t, e), e), o = 0; o < r.length; o++) {
              var s;
              if (0 === (s = r[o]).refs) {
                for (var c = 0; c < s.parts.length; c++) s.parts[c]();
                delete a[s.id];
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
          var a = document.createTextNode(o),
            i = t.childNodes;
          i[e] && t.removeChild(i[e]),
            i.length ? t.insertBefore(a, i[e]) : t.appendChild(a);
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
      function U(t, e, n) {
        var r = n.css,
          o = n.sourceMap,
          a = void 0 === e.convertToAbsoluteUrls && o;
        (e.convertToAbsoluteUrls || a) && (r = d(r)),
          o &&
            (r +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(o)))) +
              ' */');
        var i = new Blob([r], { type: 'text/css' }),
          s = t.href;
        (t.href = URL.createObjectURL(i)), s && URL.revokeObjectURL(s);
      }
    },
    9657: t => {
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
              a = e
                .trim()
                .replace(/^"(.*)"$/, function(t, e) {
                  return e;
                })
                .replace(/^'(.*)'$/, function(t, e) {
                  return e;
                });
            return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(a)
              ? t
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
    }
  }
]);
