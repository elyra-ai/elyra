(self.webpackChunk_elyra_pipeline_editor_extension =
  self.webpackChunk_elyra_pipeline_editor_extension || []).push([
  [283, 805],
  {
    4599: (n, e, t) => {
      (n.exports = t(2609)(!1)).push([
        n.id,
        "/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an \"AS IS\" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n.empty-canvas h1 {\n  color: #8897a2;\n  size: 20pt;\n  text-align: center;\n}\n\n.elyra-tooltipError {\n  color: var(--jp-error-color1);\n}\n\n.elyra-PipelineEditor .properties-modal {\n  position: absolute;\n}\n\n.elyra-PipelineEditor .bx--modal-content {\n  padding: 0;\n}\n\n.elyra-PipelineEditor .properties-modal button.bx--btn {\n  -webkit-box-flex: 0;\n  -ms-flex: 0;\n  flex: 0;\n  min-height: 2.5rem;\n  height: 2.5rem;\n  padding: 0 1rem;\n  margin: 0 1rem 0 0;\n  text-align: center;\n}\n\n.common-canvas-tooltip[data-id^='node_tip'] {\n  max-width: initial;\n}\n.elyra-PipelineNodeTooltip {\n  text-align: left;\n}\n.elyra-PipelineNodeTooltip dd {\n  font-weight: 600;\n}\n.elyra-PipelineNodeTooltip dt {\n  margin-left: 10px;\n  white-space: pre-wrap;\n}\n\n/* notebook-scheduler css */\n\n.jp-Dialog-content {\n  max-width: 100vw;\n  max-height: 100vh;\n}\n\n.lm-Widget a {\n  color: #1970b7;\n}\n\n.elyra-table {\n  margin: 1px;\n  padding: 1px;\n}\n\n.elyra-table th,\ntr,\ntd {\n  padding: 2px;\n}\n\n.elyra-notebookExperimentWidget {\n  overflow: scroll;\n}\n\n.elyra-experiments {\n  padding-right: 5px;\n}\n\n.elyra-Table-experiments {\n  font-family: 'Trebuchet MS', Arial, Helvetica, sans-serif;\n  width: 100%;\n  background-color: #ffffff;\n  margin-top: 5px;\n  margin-bottom: 10px;\n}\n\n.elyra-Table-experiments tr:hover:nth-child(even) {\n  background-color: #ddd;\n}\n\n.elyra-Table-experiments tr:hover:nth-child(odd) {\n  background-color: #ddd;\n}\n\n.elyra-Table-experiments tr:nth-child(even) {\n  background-color: #f2f2f2;\n}\n\n.elyra-Table-experiments td {\n  font-weight: normal;\n  padding: 10px;\n}\n\n.elyra-Table-experiments thead {\n  color: #495057;\n\n  background-color: #e9ecef;\n  padding-left: 10px;\n  padding-right: 10px;\n}\n\n.properties-control-panel[data-id='properties-nodeGroupInfo'],\n.properties-control-panel[data-id='properties-nodeDependenciesControls'] {\n  position: relative;\n}\n.properties-control-panel > .properties-control-panel {\n  padding: 0;\n}\n.properties-control-panel[data-id='properties-nodeFileControl'] {\n  width: calc(100% - 100px);\n}\n.properties-action-panel[data-id='properties-nodeBrowseFileAction'] {\n  position: absolute;\n  right: 0;\n  top: 0.6rem;\n}\n.properties-action-panel[data-id='properties-nodeAddDependenciesAction'] {\n  margin: 0;\n  padding: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n}\n.properties-action-panel[data-id='properties-nodeAddDependenciesAction']\n  .properties-action-button {\n  padding-right: 0;\n}\n.properties-action-panel[data-id='properties-nodeAddDependenciesAction']\n  .bx--btn--tertiary {\n  border: 0 none;\n  font-size: 0.8rem;\n  min-height: 1.75rem;\n  margin: 0;\n}\n\nbody.elyra-browseFileDialog-open .properties-modal {\n  display: none;\n}\n\nspan.elyra-BreadCrumbs-disabled {\n  color: var(--md-grey-500);\n  cursor: not-allowed;\n  font-size: 0.8rem;\n  font-style: italic;\n  pointer-events: none;\n}\nspan.elyra-BreadCrumbs-disabled:hover {\n  background-color: transparent;\n  pointer-events: none;\n}\nspan.elyra-BreadCrumbs-disabled svg {\n  cursor: not-allowed;\n  pointer-events: none;\n}\nspan.elyra-BreadCrumbs-disabled svg path.jp-icon3[fill] {\n  fill: var(--md-grey-500);\n}\nspan.elyra-BreadCrumbs-disabled + span {\n  color: var(--md-grey-500);\n}\n",
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
                  i = n[1] || '',
                  a = n[3];
                if (!a) return i;
                if (e && 'function' == typeof btoa) {
                  var s =
                      ((t = a),
                      (r = btoa(
                        unescape(encodeURIComponent(JSON.stringify(t)))
                      )),
                      (o = 'sourceMappingURL=data:application/json;charset=utf-8;base64,'.concat(
                        r
                      )),
                      '/*# '.concat(o, ' */')),
                    l = a.sources.map(function(n) {
                      return '/*# sourceURL='
                        .concat(a.sourceRoot)
                        .concat(n, ' */');
                    });
                  return [i]
                    .concat(l)
                    .concat([s])
                    .join('\n');
                }
                return [i].join('\n');
              })(e, n);
              return e[2] ? '@media '.concat(e[2], '{').concat(t, '}') : t;
            }).join('');
          }),
          (e.i = function(n, t) {
            'string' == typeof n && (n = [[null, n, '']]);
            for (var r = {}, o = 0; o < this.length; o++) {
              var i = this[o][0];
              null != i && (r[i] = !0);
            }
            for (var a = 0; a < n.length; a++) {
              var s = n[a];
              (null != s[0] && r[s[0]]) ||
                (t && !s[2]
                  ? (s[2] = t)
                  : t && (s[2] = '('.concat(s[2], ') and (').concat(t, ')')),
                e.push(s));
            }
          }),
          e
        );
      };
    },
    7283: (n, e, t) => {
      var r = t(4599);
      'string' == typeof r && (r = [[n.id, r, '']]);
      t(4431)(r, { hmr: !0, transform: void 0, insertInto: void 0 }),
        r.locals && (n.exports = r.locals);
    },
    4431: (n, e, t) => {
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
        s = function(n, e) {
          return e ? e.querySelector(n) : document.querySelector(n);
        },
        l = (function(n) {
          var e = {};
          return function(n, t) {
            if ('function' == typeof n) return n();
            if (void 0 === e[n]) {
              var r = s.call(this, n, t);
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
        p = null,
        c = 0,
        d = [],
        f = t(9657);
      function u(n, e) {
        for (var t = 0; t < n.length; t++) {
          var r = n[t],
            o = i[r.id];
          if (o) {
            o.refs++;
            for (var a = 0; a < o.parts.length; a++) o.parts[a](r.parts[a]);
            for (; a < r.parts.length; a++) o.parts.push(y(r.parts[a], e));
          } else {
            var s = [];
            for (a = 0; a < r.parts.length; a++) s.push(y(r.parts[a], e));
            i[r.id] = { id: r.id, refs: 1, parts: s };
          }
        }
      }
      function h(n, e) {
        for (var t = [], r = {}, o = 0; o < n.length; o++) {
          var i = n[o],
            a = e.base ? i[0] + e.base : i[0],
            s = { css: i[1], media: i[2], sourceMap: i[3] };
          r[a] ? r[a].parts.push(s) : t.push((r[a] = { id: a, parts: [s] }));
        }
        return t;
      }
      function m(n, e) {
        var t = l(n.insertInto);
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
          var o = l(n.insertAt.before, t);
          t.insertBefore(e, o);
        }
      }
      function b(n) {
        if (null === n.parentNode) return !1;
        n.parentNode.removeChild(n);
        var e = d.indexOf(n);
        e >= 0 && d.splice(e, 1);
      }
      function g(n) {
        var e = document.createElement('style');
        if (
          (void 0 === n.attrs.type && (n.attrs.type = 'text/css'),
          void 0 === n.attrs.nonce)
        ) {
          var r = t.nc;
          r && (n.attrs.nonce = r);
        }
        return v(e, n.attrs), m(n, e), e;
      }
      function v(n, e) {
        Object.keys(e).forEach(function(t) {
          n.setAttribute(t, e[t]);
        });
      }
      function y(n, e) {
        var t, r, o, i;
        if (e.transform && n.css) {
          if (
            !(i =
              'function' == typeof e.transform
                ? e.transform(n.css)
                : e.transform.default(n.css))
          )
            return function() {};
          n.css = i;
        }
        if (e.singleton) {
          var a = c++;
          (t = p || (p = g(e))),
            (r = A.bind(null, t, a, !1)),
            (o = A.bind(null, t, a, !0));
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
                  v(e, n.attrs),
                  m(n, e),
                  e
                );
              })(e)),
              (r = L.bind(null, t, e)),
              (o = function() {
                b(t), t.href && URL.revokeObjectURL(t.href);
              }))
            : ((t = g(e)),
              (r = C.bind(null, t)),
              (o = function() {
                b(t);
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
          e.singleton || 'boolean' == typeof e.singleton || (e.singleton = a()),
          e.insertInto || (e.insertInto = 'head'),
          e.insertAt || (e.insertAt = 'bottom');
        var t = h(n, e);
        return (
          u(t, e),
          function(n) {
            for (var r = [], o = 0; o < t.length; o++) {
              var a = t[o];
              (s = i[a.id]).refs--, r.push(s);
            }
            for (n && u(h(n, e), e), o = 0; o < r.length; o++) {
              var s;
              if (0 === (s = r[o]).refs) {
                for (var l = 0; l < s.parts.length; l++) s.parts[l]();
                delete i[s.id];
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
      function A(n, e, t, r) {
        var o = t ? '' : r.css;
        if (n.styleSheet) n.styleSheet.cssText = w(e, o);
        else {
          var i = document.createTextNode(o),
            a = n.childNodes;
          a[e] && n.removeChild(a[e]),
            a.length ? n.insertBefore(i, a[e]) : n.appendChild(i);
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
      function L(n, e, t) {
        var r = t.css,
          o = t.sourceMap,
          i = void 0 === e.convertToAbsoluteUrls && o;
        (e.convertToAbsoluteUrls || i) && (r = f(r)),
          o &&
            (r +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(o)))) +
              ' */');
        var a = new Blob([r], { type: 'text/css' }),
          s = n.href;
        (n.href = URL.createObjectURL(a)), s && URL.revokeObjectURL(s);
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
              i = e
                .trim()
                .replace(/^"(.*)"$/, function(n, e) {
                  return e;
                })
                .replace(/^'(.*)'$/, function(n, e) {
                  return e;
                });
            return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(i)
              ? n
              : ((o =
                  0 === i.indexOf('//')
                    ? i
                    : 0 === i.indexOf('/')
                    ? t + i
                    : r + i.replace(/^\.\//, '')),
                'url(' + JSON.stringify(o) + ')');
          }
        );
      };
    }
  }
]);
