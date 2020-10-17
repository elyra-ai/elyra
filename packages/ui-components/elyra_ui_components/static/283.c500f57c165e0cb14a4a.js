(self.webpackChunk_elyra_ui_components =
  self.webpackChunk_elyra_ui_components || []).push([
  [283],
  {
    4599: (n, e, t) => {
      (n.exports = t(2609)(!1)).push([
        n.id,
        "/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an \"AS IS\" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n.elyra-expandableContainer-button,\n.elyra-expandableContainer-button.jp-mod-styled {\n  background-color: transparent;\n  vertical-align: middle;\n  padding: 0;\n  width: 20px;\n}\n\n.elyra-expandableContainer-button:hover {\n  cursor: pointer;\n}\n\n.elyra-expandableContainer-actionButton:hover {\n  background-color: var(--jp-layout-color1);\n}\n\n.elyra-expandableContainer-actionButton:active {\n  background-color: var(--jp-layout-color2);\n}\n\n.elyra-expandableContainer-title {\n  align-items: center;\n  display: flex;\n  flex-direction: row;\n  padding: 0px 4px;\n  height: 36px;\n}\n\n.elyra-expandableContainer-title:hover {\n  background: var(--jp-layout-color2);\n}\n\n.elyra-expandableContainer-name {\n  flex-grow: 1;\n  font-size: var(--jp-ui-font-size1);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  padding: 4px 0 4px 2px;\n  line-height: 28px;\n}\n\n.elyra-expandableContainer-name:hover {\n  cursor: pointer;\n}\n\n.elyra-button {\n  background-repeat: no-repeat;\n  background-position: center;\n  border: none;\n  height: 100%;\n}\n\n.elyra-expandableContainer-details-visible {\n  overflow-x: auto;\n  overflow-y: auto;\n  display: block;\n  padding: 5px;\n  margin: 5px;\n  border: 1px solid var(--jp-border-color2);\n  border-radius: 2px;\n  color: var(--jp-ui-font-color1);\n  background-color: var(--jp-layout-color1);\n}\n\n.elyra-expandableContainer-details-visible textarea {\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-expandableContainer-details-hidden {\n  display: none;\n}\n\n.elyra-expandableContainer-action-buttons {\n  display: inline-flex;\n  align-self: flex-end;\n  height: 100%;\n}\n\n.elyra-errorDialog-messageDisplay pre {\n  min-height: 125px;\n  height: 100%;\n  width: 100%;\n  resize: none;\n  overflow-x: scroll;\n}\n\n.elyra-errorDialog-messageDisplay {\n  padding-bottom: 5px;\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n}\n\n.elyra-errorDialog-messageDisplay > div:nth-child(2) {\n  margin: 15px 0;\n  display: flex;\n  flex: 1;\n  min-height: 0px;\n  flex-direction: column;\n}\n\n/* temporary fix until this is addressed in jupyterlab */\n.lm-TabBar-tabIcon svg {\n  height: auto;\n}\n\n.jp-Dialog-content {\n  resize: both;\n}\n\n.elyra-DialogDefaultButton.jp-mod-styled:hover:disabled,\n.elyra-DialogDefaultButton.jp-mod-styled:active:disabled,\n.elyra-DialogDefaultButton.jp-mod-styled:focus:disabled,\n.elyra-DialogDefaultButton.jp-mod-styled:disabled {\n  background-color: var(--jp-layout-color3);\n  opacity: 0.3;\n  pointer-events: none;\n}\n\n/* icons */\n\n[data-jp-theme-light='false'] .elyra-pieBrain-icon rect.st1,\n[data-jp-theme-light='false'] .elyra-pieBrain-icon rect.st2 {\n  fill: var(--jp-inverse-layout-color3);\n}\n\n.elyra-feedbackButton {\n  display: inline;\n  position: relative;\n}\n\n.elyra-feedbackButton[data-feedback]:not([data-feedback='']):before {\n  border: solid;\n  border-color: var(--jp-inverse-layout-color2) transparent;\n  border-width: 0 6px 6px 6px;\n  bottom: 0;\n  content: '';\n  left: 5px;\n  position: absolute;\n  z-index: 999;\n}\n\n.elyra-feedbackButton[data-feedback]:not([data-feedback='']):after {\n  background: var(--jp-inverse-layout-color2);\n  border-radius: 2px;\n  bottom: -20px;\n  color: var(--jp-ui-inverse-font-color1);\n  content: attr(data-feedback);\n  font-size: 0.75rem;\n  font-weight: 400;\n  padding: 3px 5px;\n  pointer-events: none;\n  position: absolute;\n  right: -10px;\n  text-align: center;\n  width: max-content;\n  word-wrap: break-word;\n  z-index: 999;\n}\n\n.elyra-browseFileDialog .jp-Dialog-content {\n  height: 400px;\n  width: 600px;\n}\n",
        ''
      ]);
    },
    2609: n => {
      'use strict';
      n.exports = function(n) {
        var e = [];
        return (
          (e.toString = function() {
            return this.map(function(e) {
              var t = (function(n, e) {
                var t,
                  r,
                  o,
                  a = n[1] || '',
                  i = n[3];
                if (!i) return a;
                if (e && 'function' == typeof btoa) {
                  var l =
                      ((t = i),
                      (r = btoa(
                        unescape(encodeURIComponent(JSON.stringify(t)))
                      )),
                      (o = 'sourceMappingURL=data:application/json;charset=utf-8;base64,'.concat(
                        r
                      )),
                      '/*# '.concat(o, ' */')),
                    s = i.sources.map(function(n) {
                      return '/*# sourceURL='
                        .concat(i.sourceRoot)
                        .concat(n, ' */');
                    });
                  return [a]
                    .concat(s)
                    .concat([l])
                    .join('\n');
                }
                return [a].join('\n');
              })(e, n);
              return e[2] ? '@media '.concat(e[2], '{').concat(t, '}') : t;
            }).join('');
          }),
          (e.i = function(n, t) {
            'string' == typeof n && (n = [[null, n, '']]);
            for (var r = {}, o = 0; o < this.length; o++) {
              var a = this[o][0];
              null != a && (r[a] = !0);
            }
            for (var i = 0; i < n.length; i++) {
              var l = n[i];
              (null != l[0] && r[l[0]]) ||
                (t && !l[2]
                  ? (l[2] = t)
                  : t && (l[2] = '('.concat(l[2], ') and (').concat(t, ')')),
                e.push(l));
            }
          }),
          e
        );
      };
    },
    7283: (n, e, t) => {
      var r = t(4599);
      'string' == typeof r && (r = [[n.id, r, '']]);
      t(2379)(r, { hmr: !0, transform: void 0, insertInto: void 0 }),
        r.locals && (n.exports = r.locals);
    },
    2379: (n, e, t) => {
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
        l = function(n, e) {
          return e ? e.querySelector(n) : document.querySelector(n);
        },
        s = (function(n) {
          var e = {};
          return function(n, t) {
            if ('function' == typeof n) return n();
            if (void 0 === e[n]) {
              var r = l.call(this, n, t);
              if (
                window.HTMLIFrameElement &&
                r instanceof window.HTMLIFrameElement
              )
                try {
                  r = r.contentDocument.head;
                } catch (n) {
                  r = null;
                }
              e[n] = r;
            }
            return e[n];
          };
        })(),
        c = null,
        p = 0,
        d = [],
        u = t(9657);
      function f(n, e) {
        for (var t = 0; t < n.length; t++) {
          var r = n[t],
            o = a[r.id];
          if (o) {
            o.refs++;
            for (var i = 0; i < o.parts.length; i++) o.parts[i](r.parts[i]);
            for (; i < r.parts.length; i++) o.parts.push(m(r.parts[i], e));
          } else {
            var l = [];
            for (i = 0; i < r.parts.length; i++) l.push(m(r.parts[i], e));
            a[r.id] = { id: r.id, refs: 1, parts: l };
          }
        }
      }
      function h(n, e) {
        for (var t = [], r = {}, o = 0; o < n.length; o++) {
          var a = n[o],
            i = e.base ? a[0] + e.base : a[0],
            l = { css: a[1], media: a[2], sourceMap: a[3] };
          r[i] ? r[i].parts.push(l) : t.push((r[i] = { id: i, parts: [l] }));
        }
        return t;
      }
      function b(n, e) {
        var t = s(n.insertInto);
        if (!t)
          throw new Error(
            "Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."
          );
        var r = d[d.length - 1];
        if ('top' === n.insertAt)
          r
            ? r.nextSibling
              ? t.insertBefore(e, r.nextSibling)
              : t.appendChild(e)
            : t.insertBefore(e, t.firstChild),
            d.push(e);
        else if ('bottom' === n.insertAt) t.appendChild(e);
        else {
          if ('object' != typeof n.insertAt || !n.insertAt.before)
            throw new Error(
              "[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n"
            );
          var o = s(n.insertAt.before, t);
          t.insertBefore(e, o);
        }
      }
      function y(n) {
        if (null === n.parentNode) return !1;
        n.parentNode.removeChild(n);
        var e = d.indexOf(n);
        e >= 0 && d.splice(e, 1);
      }
      function v(n) {
        var e = document.createElement('style');
        if (
          (void 0 === n.attrs.type && (n.attrs.type = 'text/css'),
          void 0 === n.attrs.nonce)
        ) {
          var r = t.nc;
          r && (n.attrs.nonce = r);
        }
        return g(e, n.attrs), b(n, e), e;
      }
      function g(n, e) {
        Object.keys(e).forEach(function(t) {
          n.setAttribute(t, e[t]);
        });
      }
      function m(n, e) {
        var t, r, o, a;
        if (e.transform && n.css) {
          if (
            !(a =
              'function' == typeof e.transform
                ? e.transform(n.css)
                : e.transform.default(n.css))
          )
            return function() {};
          n.css = a;
        }
        if (e.singleton) {
          var i = p++;
          (t = c || (c = v(e))),
            (r = j.bind(null, t, i, !1)),
            (o = j.bind(null, t, i, !0));
        } else
          n.sourceMap &&
          'function' == typeof URL &&
          'function' == typeof URL.createObjectURL &&
          'function' == typeof URL.revokeObjectURL &&
          'function' == typeof Blob &&
          'function' == typeof btoa
            ? ((t = (function(n) {
                var e = document.createElement('link');
                return (
                  void 0 === n.attrs.type && (n.attrs.type = 'text/css'),
                  (n.attrs.rel = 'stylesheet'),
                  g(e, n.attrs),
                  b(n, e),
                  e
                );
              })(e)),
              (r = k.bind(null, t, e)),
              (o = function() {
                y(t), t.href && URL.revokeObjectURL(t.href);
              }))
            : ((t = v(e)),
              (r = C.bind(null, t)),
              (o = function() {
                y(t);
              }));
        return (
          r(n),
          function(e) {
            if (e) {
              if (
                e.css === n.css &&
                e.media === n.media &&
                e.sourceMap === n.sourceMap
              )
                return;
              r((n = e));
            } else o();
          }
        );
      }
      n.exports = function(n, e) {
        if ('undefined' != typeof DEBUG && DEBUG && 'object' != typeof document)
          throw new Error(
            'The style-loader cannot be used in a non-browser environment'
          );
        ((e = e || {}).attrs = 'object' == typeof e.attrs ? e.attrs : {}),
          e.singleton || 'boolean' == typeof e.singleton || (e.singleton = i()),
          e.insertInto || (e.insertInto = 'head'),
          e.insertAt || (e.insertAt = 'bottom');
        var t = h(n, e);
        return (
          f(t, e),
          function(n) {
            for (var r = [], o = 0; o < t.length; o++) {
              var i = t[o];
              (l = a[i.id]).refs--, r.push(l);
            }
            for (n && f(h(n, e), e), o = 0; o < r.length; o++) {
              var l;
              if (0 === (l = r[o]).refs) {
                for (var s = 0; s < l.parts.length; s++) l.parts[s]();
                delete a[l.id];
              }
            }
          }
        );
      };
      var x,
        w =
          ((x = []),
          function(n, e) {
            return (x[n] = e), x.filter(Boolean).join('\n');
          });
      function j(n, e, t, r) {
        var o = t ? '' : r.css;
        if (n.styleSheet) n.styleSheet.cssText = w(e, o);
        else {
          var a = document.createTextNode(o),
            i = n.childNodes;
          i[e] && n.removeChild(i[e]),
            i.length ? n.insertBefore(a, i[e]) : n.appendChild(a);
        }
      }
      function C(n, e) {
        var t = e.css,
          r = e.media;
        if ((r && n.setAttribute('media', r), n.styleSheet))
          n.styleSheet.cssText = t;
        else {
          for (; n.firstChild; ) n.removeChild(n.firstChild);
          n.appendChild(document.createTextNode(t));
        }
      }
      function k(n, e, t) {
        var r = t.css,
          o = t.sourceMap,
          a = void 0 === e.convertToAbsoluteUrls && o;
        (e.convertToAbsoluteUrls || a) && (r = u(r)),
          o &&
            (r +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(o)))) +
              ' */');
        var i = new Blob([r], { type: 'text/css' }),
          l = n.href;
        (n.href = URL.createObjectURL(i)), l && URL.revokeObjectURL(l);
      }
    },
    9657: n => {
      n.exports = function(n) {
        var e = 'undefined' != typeof window && window.location;
        if (!e) throw new Error('fixUrls requires window.location');
        if (!n || 'string' != typeof n) return n;
        var t = e.protocol + '//' + e.host,
          r = t + e.pathname.replace(/\/[^\/]*$/, '/');
        return n.replace(
          /url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,
          function(n, e) {
            var o,
              a = e
                .trim()
                .replace(/^"(.*)"$/, function(n, e) {
                  return e;
                })
                .replace(/^'(.*)'$/, function(n, e) {
                  return e;
                });
            return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(a)
              ? n
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
