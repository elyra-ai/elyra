(self.webpackChunk_elyra_code_snippet_extension =
  self.webpackChunk_elyra_code_snippet_extension || []).push([
  [220, 283, 805],
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
                  o,
                  a,
                  i = e[1] || '',
                  r = e[3];
                if (!r) return i;
                if (t && 'function' == typeof btoa) {
                  var s =
                      ((n = r),
                      (o = btoa(
                        unescape(encodeURIComponent(JSON.stringify(n)))
                      )),
                      (a = 'sourceMappingURL=data:application/json;charset=utf-8;base64,'.concat(
                        o
                      )),
                      '/*# '.concat(a, ' */')),
                    c = r.sources.map(function(e) {
                      return '/*# sourceURL='
                        .concat(r.sourceRoot)
                        .concat(e, ' */');
                    });
                  return [i]
                    .concat(c)
                    .concat([s])
                    .join('\n');
                }
                return [i].join('\n');
              })(t, e);
              return t[2] ? '@media '.concat(t[2], '{').concat(n, '}') : n;
            }).join('');
          }),
          (t.i = function(e, n) {
            'string' == typeof e && (e = [[null, e, '']]);
            for (var o = {}, a = 0; a < this.length; a++) {
              var i = this[a][0];
              null != i && (o[i] = !0);
            }
            for (var r = 0; r < e.length; r++) {
              var s = e[r];
              (null != s[0] && o[s[0]]) ||
                (n && !s[2]
                  ? (s[2] = n)
                  : n && (s[2] = '('.concat(s[2], ') and (').concat(n, ')')),
                t.push(s));
            }
          }),
          t
        );
      };
    },
    7283: (e, t, n) => {
      var o = n(4599);
      'string' == typeof o && (o = [[e.id, o, '']]);
      n(2379)(o, { hmr: !0, transform: void 0, insertInto: void 0 }),
        o.locals && (e.exports = o.locals);
    },
    2379: (e, t, n) => {
      var o,
        a,
        i = {},
        r =
          ((o = function() {
            return window && document && document.all && !window.atob;
          }),
          function() {
            return void 0 === a && (a = o.apply(this, arguments)), a;
          }),
        s = function(e, t) {
          return t ? t.querySelector(e) : document.querySelector(e);
        },
        c = (function(e) {
          var t = {};
          return function(e, n) {
            if ('function' == typeof e) return e();
            if (void 0 === t[e]) {
              var o = s.call(this, e, n);
              if (
                window.HTMLIFrameElement &&
                o instanceof window.HTMLIFrameElement
              )
                try {
                  o = o.contentDocument.head;
                } catch (e) {
                  o = null;
                }
              t[e] = o;
            }
            return t[e];
          };
        })(),
        d = null,
        l = 0,
        p = [],
        u = n(9657);
      function f(e, t) {
        for (var n = 0; n < e.length; n++) {
          var o = e[n],
            a = i[o.id];
          if (a) {
            a.refs++;
            for (var r = 0; r < a.parts.length; r++) a.parts[r](o.parts[r]);
            for (; r < o.parts.length; r++) a.parts.push(b(o.parts[r], t));
          } else {
            var s = [];
            for (r = 0; r < o.parts.length; r++) s.push(b(o.parts[r], t));
            i[o.id] = { id: o.id, refs: 1, parts: s };
          }
        }
      }
      function h(e, t) {
        for (var n = [], o = {}, a = 0; a < e.length; a++) {
          var i = e[a],
            r = t.base ? i[0] + t.base : i[0],
            s = { css: i[1], media: i[2], sourceMap: i[3] };
          o[r] ? o[r].parts.push(s) : n.push((o[r] = { id: r, parts: [s] }));
        }
        return n;
      }
      function m(e, t) {
        var n = c(e.insertInto);
        if (!n)
          throw new Error(
            "Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."
          );
        var o = p[p.length - 1];
        if ('top' === e.insertAt)
          o
            ? o.nextSibling
              ? n.insertBefore(t, o.nextSibling)
              : n.appendChild(t)
            : n.insertBefore(t, n.firstChild),
            p.push(t);
        else if ('bottom' === e.insertAt) n.appendChild(t);
        else {
          if ('object' != typeof e.insertAt || !e.insertAt.before)
            throw new Error(
              "[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n"
            );
          var a = c(e.insertAt.before, n);
          n.insertBefore(t, a);
        }
      }
      function g(e) {
        if (null === e.parentNode) return !1;
        e.parentNode.removeChild(e);
        var t = p.indexOf(e);
        t >= 0 && p.splice(t, 1);
      }
      function v(e) {
        var t = document.createElement('style');
        if (
          (void 0 === e.attrs.type && (e.attrs.type = 'text/css'),
          void 0 === e.attrs.nonce)
        ) {
          var o = n.nc;
          o && (e.attrs.nonce = o);
        }
        return y(t, e.attrs), m(e, t), t;
      }
      function y(e, t) {
        Object.keys(t).forEach(function(n) {
          e.setAttribute(n, t[n]);
        });
      }
      function b(e, t) {
        var n, o, a, i;
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
          var r = l++;
          (n = d || (d = v(t))),
            (o = S.bind(null, n, r, !1)),
            (a = S.bind(null, n, r, !0));
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
                  m(e, t),
                  t
                );
              })(t)),
              (o = L.bind(null, n, t)),
              (a = function() {
                g(n), n.href && URL.revokeObjectURL(n.href);
              }))
            : ((n = v(t)),
              (o = E.bind(null, n)),
              (a = function() {
                g(n);
              }));
        return (
          o(e),
          function(t) {
            if (t) {
              if (
                t.css === e.css &&
                t.media === e.media &&
                t.sourceMap === e.sourceMap
              )
                return;
              o((e = t));
            } else a();
          }
        );
      }
      e.exports = function(e, t) {
        if ('undefined' != typeof DEBUG && DEBUG && 'object' != typeof document)
          throw new Error(
            'The style-loader cannot be used in a non-browser environment'
          );
        ((t = t || {}).attrs = 'object' == typeof t.attrs ? t.attrs : {}),
          t.singleton || 'boolean' == typeof t.singleton || (t.singleton = r()),
          t.insertInto || (t.insertInto = 'head'),
          t.insertAt || (t.insertAt = 'bottom');
        var n = h(e, t);
        return (
          f(n, t),
          function(e) {
            for (var o = [], a = 0; a < n.length; a++) {
              var r = n[a];
              (s = i[r.id]).refs--, o.push(s);
            }
            for (e && f(h(e, t), t), a = 0; a < o.length; a++) {
              var s;
              if (0 === (s = o[a]).refs) {
                for (var c = 0; c < s.parts.length; c++) s.parts[c]();
                delete i[s.id];
              }
            }
          }
        );
      };
      var w,
        C =
          ((w = []),
          function(e, t) {
            return (w[e] = t), w.filter(Boolean).join('\n');
          });
      function S(e, t, n, o) {
        var a = n ? '' : o.css;
        if (e.styleSheet) e.styleSheet.cssText = C(t, a);
        else {
          var i = document.createTextNode(a),
            r = e.childNodes;
          r[t] && e.removeChild(r[t]),
            r.length ? e.insertBefore(i, r[t]) : e.appendChild(i);
        }
      }
      function E(e, t) {
        var n = t.css,
          o = t.media;
        if ((o && e.setAttribute('media', o), e.styleSheet))
          e.styleSheet.cssText = n;
        else {
          for (; e.firstChild; ) e.removeChild(e.firstChild);
          e.appendChild(document.createTextNode(n));
        }
      }
      function L(e, t, n) {
        var o = n.css,
          a = n.sourceMap,
          i = void 0 === t.convertToAbsoluteUrls && a;
        (t.convertToAbsoluteUrls || i) && (o = u(o)),
          a &&
            (o +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(a)))) +
              ' */');
        var r = new Blob([o], { type: 'text/css' }),
          s = e.href;
        (e.href = URL.createObjectURL(r)), s && URL.revokeObjectURL(s);
      }
    },
    9657: e => {
      e.exports = function(e) {
        var t = 'undefined' != typeof window && window.location;
        if (!t) throw new Error('fixUrls requires window.location');
        if (!e || 'string' != typeof e) return e;
        var n = t.protocol + '//' + t.host,
          o = n + t.pathname.replace(/\/[^\/]*$/, '/');
        return e.replace(
          /url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,
          function(e, t) {
            var a,
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
              : ((a =
                  0 === i.indexOf('//')
                    ? i
                    : 0 === i.indexOf('/')
                    ? n + i
                    : o + i.replace(/^\.\//, '')),
                'url(' + JSON.stringify(a) + ')');
          }
        );
      };
    },
    1220: (e, t, n) => {
      'use strict';
      n.r(t),
        n.d(t, { code_snippet_extension: () => E, default: () => L }),
        n(7283);
      var o = n(5216),
        a = n(4922),
        i = n(4268),
        r = n(9266),
        s = n(4205);
      const c = 'code-snippets',
        d = 'code-snippet';
      class l {
        static async findAll() {
          return await s.FrontendServices.getMetadata(c);
        }
        static async findByLanguage(e) {
          const t = await this.findAll(),
            n = [];
          for (const o of t) o.metadata.language === e && n.push(o);
          return n;
        }
        static deleteCodeSnippet(e) {
          return (0, i.showDialog)({
            title: `Delete snippet: ${e.display_name}?`,
            buttons: [i.Dialog.cancelButton(), i.Dialog.okButton()]
          }).then(
            t =>
              !!t.button.accept &&
              (s.FrontendServices.deleteMetadata(c, e.name), !0)
          );
        }
      }
      var p = n(1708),
        u = n(9769),
        f = n(2822),
        h = n(1228),
        m = n(2899),
        g = n(6970),
        v = n(6455),
        y = n(9850),
        b = n(2959),
        w = n.n(b);
      class C extends p.MetadataDisplay {
        constructor() {
          super(...arguments),
            (this.editors = {}),
            (this.insertCodeSnippet = async e => {
              var t, n;
              const o = this.props.getCurrentWidget(),
                a = e.metadata.code.join('\n');
              if (
                o instanceof h.DocumentWidget &&
                o.content instanceof m.FileEditor
              ) {
                const t = o.content.editor,
                  n = /^\.(md|mkdn?|mdown|markdown)$/;
                null !== f.PathExt.extname(o.context.path).match(n) &&
                'markdown' !== e.metadata.language.toLowerCase()
                  ? t.replaceSelection(
                      '```' + e.metadata.language + '\n' + a + '\n```'
                    )
                  : 'PythonFileEditor' == o.constructor.name
                  ? this.verifyLanguageAndInsert(e, 'python', t)
                  : t.replaceSelection(a);
              } else if (o instanceof g.NotebookPanel) {
                const i = o,
                  r = i.content.activeCell,
                  s = r.editor;
                if (r instanceof u.CodeCell) {
                  const o = await (null ===
                      (n =
                        null === (t = i.sessionContext.session) || void 0 === t
                          ? void 0
                          : t.kernel) || void 0 === n
                      ? void 0
                      : n.info),
                    a = (null == o ? void 0 : o.language_info.name) || '';
                  this.verifyLanguageAndInsert(e, a, s);
                } else
                  r instanceof u.MarkdownCell &&
                  'markdown' !== e.metadata.language.toLowerCase()
                    ? s.replaceSelection(
                        '```' + e.metadata.language + '\n' + a + '\n```'
                      )
                    : s.replaceSelection(a);
              } else
                this.showErrDialog(
                  'Code snippet insert failed: Unsupported widget'
                );
            }),
            (this.verifyLanguageAndInsert = async (e, t, n) => {
              const o = e.metadata.code.join('\n');
              t && e.metadata.language.toLowerCase() !== t.toLowerCase()
                ? (await this.showWarnDialog(t, e.display_name)).button
                    .accept && n.replaceSelection(o)
                : n.replaceSelection(o);
            }),
            (this.showWarnDialog = async (e, t) =>
              (0, i.showDialog)({
                title: 'Warning',
                body: `Code snippet "${t}" is incompatible with ${e}. Continue?`,
                buttons: [i.Dialog.cancelButton(), i.Dialog.okButton()]
              })),
            (this.showErrDialog = e =>
              (0, i.showDialog)({
                title: 'Error',
                body: e,
                buttons: [i.Dialog.okButton()]
              })),
            (this.actionButtons = e => [
              {
                title: 'Copy',
                icon: v.copyIcon,
                feedback: 'Copied!',
                onClick: () => {
                  i.Clipboard.copyToSystem(e.metadata.code.join('\n'));
                }
              },
              {
                title: 'Insert',
                icon: o.importIcon,
                onClick: () => {
                  this.insertCodeSnippet(e);
                }
              },
              {
                title: 'Edit',
                icon: v.editIcon,
                onClick: () => {
                  this.props.openMetadataEditor({
                    onSave: this.props.updateMetadata,
                    namespace: c,
                    schema: d,
                    name: e.name
                  });
                }
              },
              {
                title: 'Delete',
                icon: o.trashIcon,
                onClick: () => {
                  l.deleteCodeSnippet(e).then(t => {
                    if (t) {
                      this.props.updateMetadata(), delete this.editors[e.name];
                      const t = (0, y.find)(
                        this.props.shell.widgets('main'),
                        (t, n) =>
                          t.id ==
                          'elyra-metadata-editor:code-snippets:code-snippet:' +
                            e.name
                      );
                      t && t.dispose();
                    }
                  });
                }
              }
            ]),
            (this.renderMetadata = e =>
              w().createElement(
                'div',
                { key: e.name, className: p.METADATA_ITEM },
                w().createElement(
                  o.ExpandableComponent,
                  {
                    displayName: this.getDisplayName(e),
                    tooltip: e.metadata.description,
                    actionButtons: this.actionButtons(e),
                    onExpand: () => {
                      this.editors[e.name].refresh();
                    }
                  },
                  w().createElement('div', { id: e.name })
                )
              ));
        }
        getDisplayName(e) {
          return `[${e.metadata.language}] ${e.display_name}`;
        }
        sortMetadata() {
          this.props.metadata.sort((e, t) =>
            this.getDisplayName(e).localeCompare(this.getDisplayName(t))
          );
        }
        componentDidUpdate() {
          const e = this.props.editorServices.factoryService.newInlineEditor,
            t = this.props.editorServices.mimeTypeService.getMimeTypeByLanguage;
          this.props.metadata.map(n => {
            n.name in this.editors
              ? (this.editors[n.name].model.value.text = n.metadata.code.join(
                  '\n'
                ))
              : (this.editors[n.name] = e({
                  config: { readOnly: !0 },
                  host: document.getElementById(n.name),
                  model: new r.CodeEditor.Model({
                    value: n.metadata.code.join('\n'),
                    mimeType: t({
                      name: n.metadata.language,
                      codemirror_mode: n.metadata.language
                    })
                  })
                }));
          });
        }
      }
      class S extends p.MetadataWidget {
        constructor(e) {
          super(e);
        }
        async fetchMetadata() {
          return await l.findAll();
        }
        renderDisplay(e) {
          return w().createElement(C, {
            metadata: e,
            openMetadataEditor: this.openMetadataEditor,
            updateMetadata: this.updateMetadata,
            namespace: c,
            schema: d,
            getCurrentWidget: this.props.getCurrentWidget,
            editorServices: this.props.editorServices,
            shell: this.props.app.shell,
            sortMetadata: !0
          });
        }
      }
      const E = {
          id: 'elyra-code-snippet-extension',
          autoStart: !0,
          requires: [i.ICommandPalette, a.ILayoutRestorer, r.IEditorServices],
          activate: (e, t, n, a) => {
            console.log('Elyra - code-snippet extension is activated!');
            const i = new S({
                app: e,
                display_name: 'Code Snippets',
                namespace: c,
                schema: d,
                icon: o.codeSnippetIcon,
                getCurrentWidget: () => e.shell.currentWidget,
                editorServices: a
              }),
              r = 'elyra-metadata:code-snippets:code-snippet';
            (i.id = r),
              (i.title.icon = o.codeSnippetIcon),
              (i.title.caption = 'Code Snippets'),
              n.add(i, r),
              e.shell.add(i, 'left', { rank: 900 });
          }
        },
        L = E;
    }
  }
]);
