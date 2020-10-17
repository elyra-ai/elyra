(self.webpackChunk_elyra_code_snippet_extension =
  self.webpackChunk_elyra_code_snippet_extension || []).push([
  [405, 805],
  {
    1144: (e, t, a) => {
      (e.exports = a(2609)(!1)).push([
        e.id,
        '/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the "License");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an "AS IS" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n/* MetadataWidget CSS */\n.elyra-metadata {\n  color: var(--jp-ui-font-color1);\n  background: var(--jp-layout-color1);\n}\n\n.elyra-metadataHeader {\n  font-weight: bold;\n  padding: 8px 10px;\n  border-bottom: var(--jp-border-width) solid var(--jp-toolbar-border-color);\n  display: flex;\n  justify-content: space-between;\n}\n\n.elyra-metadataHeader p {\n  font-weight: bold;\n}\n\n.elyra-metadataHeader-button {\n  background-color: transparent;\n  vertical-align: middle;\n  padding: 5px;\n  width: 20px;\n  background-repeat: no-repeat;\n  background-position: center;\n  border: none;\n  display: inline-flex;\n  align-self: flex-end;\n}\n\n.elyra-metadataHeader-button svg {\n  transform: translate(-3px, 0px);\n}\n\n.elyra-metadataHeader-button:hover {\n  background-color: var(--jp-layout-color2);\n  cursor: pointer;\n}\n\n.elyra-metadataHeader [fill] {\n  fill: var(--jp-ui-font-color1);\n}\n\n.elyra-metadataHeader + div:first-of-type {\n  overflow-y: auto;\n  height: calc(100vh - 95px);\n}\n\n.elyra-metadata-item {\n  border-bottom: var(--jp-border-width) solid var(--jp-border-color2);\n  display: flex;\n  flex-direction: column;\n  margin: 0;\n  padding: 0;\n}\n\n.elyra-metadata-item .elyra-expandableContainer-details-visible {\n  background-color: var(--jp-cell-editor-background);\n  resize: vertical;\n  height: 100px;\n}\n\n.elyra-metadata-item .CodeMirror.cm-s-jupyter {\n  background-color: inherit;\n  border: none;\n  font-family: var(--jp-code-font-family);\n  font-size: var(--jp-code-font-size);\n  line-height: var(--jp-code-line-height);\n}\n\n.elyra-metadata-item .cm-s-jupyter li .cm-string {\n  word-break: normal;\n}\n\n/* MetadataEditor css */\n.elyra-metadataEditor .jp-InputGroup {\n  width: 100%;\n}\n\n.elyra-metadataEditor .bp3-form-group {\n  margin-bottom: 12px;\n  margin-right: 20px;\n  flex-basis: 45%;\n  height: 65px;\n}\n\n.bp3-select-popover {\n  max-height: 150px;\n  overflow-y: auto;\n}\n\n.elyra-form-DropDown-item {\n  width: 100%;\n  display: flex;\n  justify-content: left;\n  margin: 0;\n  border-radius: 0;\n}\n\n.elyra-metadataEditor {\n  padding: 20px;\n  display: flex;\n  flex-wrap: wrap;\n  height: 100%;\n  align-content: flex-start;\n  align-items: flex-start;\n  justify-content: flex-start;\n}\n\n.elyra-metadataEditor h3 {\n  flex-basis: 100%;\n  margin-bottom: 15px;\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadataEditor label.bp3-label {\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadataEditor .elyra-form-code.jp-CodeMirrorEditor {\n  background-color: var(--jp-cell-editor-background);\n  border: var(--jp-border-width) solid var(--jp-input-border-color);\n  overflow-y: auto;\n  resize: vertical;\n  min-height: 150px;\n  height: 150px;\n  padding-bottom: 10px;\n  cursor: initial;\n}\n\n.elyra-metadataEditor .CodeMirror.cm-s-jupyter {\n  background-color: inherit;\n  height: 100%;\n}\n\n.elyra-metadataEditor .bp3-form-group.elyra-metadataEditor-code {\n  height: auto;\n  flex-basis: 100%;\n  display: flex;\n}\n\n.elyra-metadataEditor-code .bp3-form-content {\n  height: 100%;\n}\n\n.bp3-dark .bp3-input {\n  border: var(--jp-border-width) solid var(--jp-input-border-color);\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadata-editor {\n  overflow-y: auto;\n}\n\n.elyra-metadata-editor.bp3-dark {\n  background-color: var(--jp-border-color3);\n}\n\n.elyra-metadataEditor .elyra-metadataEditor-saveButton {\n  flex-basis: 100%;\n  display: flex;\n}\n',
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
              var a = (function(e, t) {
                var a,
                  n,
                  i,
                  r = e[1] || '',
                  s = e[3];
                if (!s) return r;
                if (t && 'function' == typeof btoa) {
                  var o =
                      ((a = s),
                      (n = btoa(
                        unescape(encodeURIComponent(JSON.stringify(a)))
                      )),
                      (i = 'sourceMappingURL=data:application/json;charset=utf-8;base64,'.concat(
                        n
                      )),
                      '/*# '.concat(i, ' */')),
                    d = s.sources.map(function(e) {
                      return '/*# sourceURL='
                        .concat(s.sourceRoot)
                        .concat(e, ' */');
                    });
                  return [r]
                    .concat(d)
                    .concat([o])
                    .join('\n');
                }
                return [r].join('\n');
              })(t, e);
              return t[2] ? '@media '.concat(t[2], '{').concat(a, '}') : a;
            }).join('');
          }),
          (t.i = function(e, a) {
            'string' == typeof e && (e = [[null, e, '']]);
            for (var n = {}, i = 0; i < this.length; i++) {
              var r = this[i][0];
              null != r && (n[r] = !0);
            }
            for (var s = 0; s < e.length; s++) {
              var o = e[s];
              (null != o[0] && n[o[0]]) ||
                (a && !o[2]
                  ? (o[2] = a)
                  : a && (o[2] = '('.concat(o[2], ') and (').concat(a, ')')),
                t.push(o));
            }
          }),
          t
        );
      };
    },
    7221: (e, t, a) => {
      var n = a(1144);
      'string' == typeof n && (n = [[e.id, n, '']]);
      a(2379)(n, { hmr: !0, transform: void 0, insertInto: void 0 }),
        n.locals && (e.exports = n.locals);
    },
    2379: (e, t, a) => {
      var n,
        i,
        r = {},
        s =
          ((n = function() {
            return window && document && document.all && !window.atob;
          }),
          function() {
            return void 0 === i && (i = n.apply(this, arguments)), i;
          }),
        o = function(e, t) {
          return t ? t.querySelector(e) : document.querySelector(e);
        },
        d = (function(e) {
          var t = {};
          return function(e, a) {
            if ('function' == typeof e) return e();
            if (void 0 === t[e]) {
              var n = o.call(this, e, a);
              if (
                window.HTMLIFrameElement &&
                n instanceof window.HTMLIFrameElement
              )
                try {
                  n = n.contentDocument.head;
                } catch (e) {
                  n = null;
                }
              t[e] = n;
            }
            return t[e];
          };
        })(),
        l = null,
        c = 0,
        h = [],
        p = a(9657);
      function m(e, t) {
        for (var a = 0; a < e.length; a++) {
          var n = e[a],
            i = r[n.id];
          if (i) {
            i.refs++;
            for (var s = 0; s < i.parts.length; s++) i.parts[s](n.parts[s]);
            for (; s < n.parts.length; s++) i.parts.push(b(n.parts[s], t));
          } else {
            var o = [];
            for (s = 0; s < n.parts.length; s++) o.push(b(n.parts[s], t));
            r[n.id] = { id: n.id, refs: 1, parts: o };
          }
        }
      }
      function u(e, t) {
        for (var a = [], n = {}, i = 0; i < e.length; i++) {
          var r = e[i],
            s = t.base ? r[0] + t.base : r[0],
            o = { css: r[1], media: r[2], sourceMap: r[3] };
          n[s] ? n[s].parts.push(o) : a.push((n[s] = { id: s, parts: [o] }));
        }
        return a;
      }
      function f(e, t) {
        var a = d(e.insertInto);
        if (!a)
          throw new Error(
            "Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."
          );
        var n = h[h.length - 1];
        if ('top' === e.insertAt)
          n
            ? n.nextSibling
              ? a.insertBefore(t, n.nextSibling)
              : a.appendChild(t)
            : a.insertBefore(t, a.firstChild),
            h.push(t);
        else if ('bottom' === e.insertAt) a.appendChild(t);
        else {
          if ('object' != typeof e.insertAt || !e.insertAt.before)
            throw new Error(
              "[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n"
            );
          var i = d(e.insertAt.before, a);
          a.insertBefore(t, i);
        }
      }
      function y(e) {
        if (null === e.parentNode) return !1;
        e.parentNode.removeChild(e);
        var t = h.indexOf(e);
        t >= 0 && h.splice(t, 1);
      }
      function g(e) {
        var t = document.createElement('style');
        if (
          (void 0 === e.attrs.type && (e.attrs.type = 'text/css'),
          void 0 === e.attrs.nonce)
        ) {
          var n = a.nc;
          n && (e.attrs.nonce = n);
        }
        return v(t, e.attrs), f(e, t), t;
      }
      function v(e, t) {
        Object.keys(t).forEach(function(a) {
          e.setAttribute(a, t[a]);
        });
      }
      function b(e, t) {
        var a, n, i, r;
        if (t.transform && e.css) {
          if (
            !(r =
              'function' == typeof t.transform
                ? t.transform(e.css)
                : t.transform.default(e.css))
          )
            return function() {};
          e.css = r;
        }
        if (t.singleton) {
          var s = c++;
          (a = l || (l = g(t))),
            (n = S.bind(null, a, s, !1)),
            (i = S.bind(null, a, s, !0));
        } else
          e.sourceMap &&
          'function' == typeof URL &&
          'function' == typeof URL.createObjectURL &&
          'function' == typeof URL.revokeObjectURL &&
          'function' == typeof Blob &&
          'function' == typeof btoa
            ? ((a = (function(e) {
                var t = document.createElement('link');
                return (
                  void 0 === e.attrs.type && (e.attrs.type = 'text/css'),
                  (e.attrs.rel = 'stylesheet'),
                  v(t, e.attrs),
                  f(e, t),
                  t
                );
              })(t)),
              (n = C.bind(null, a, t)),
              (i = function() {
                y(a), a.href && URL.revokeObjectURL(a.href);
              }))
            : ((a = g(t)),
              (n = x.bind(null, a)),
              (i = function() {
                y(a);
              }));
        return (
          n(e),
          function(t) {
            if (t) {
              if (
                t.css === e.css &&
                t.media === e.media &&
                t.sourceMap === e.sourceMap
              )
                return;
              n((e = t));
            } else i();
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
        var a = u(e, t);
        return (
          m(a, t),
          function(e) {
            for (var n = [], i = 0; i < a.length; i++) {
              var s = a[i];
              (o = r[s.id]).refs--, n.push(o);
            }
            for (e && m(u(e, t), t), i = 0; i < n.length; i++) {
              var o;
              if (0 === (o = n[i]).refs) {
                for (var d = 0; d < o.parts.length; d++) o.parts[d]();
                delete r[o.id];
              }
            }
          }
        );
      };
      var E,
        w =
          ((E = []),
          function(e, t) {
            return (E[e] = t), E.filter(Boolean).join('\n');
          });
      function S(e, t, a, n) {
        var i = a ? '' : n.css;
        if (e.styleSheet) e.styleSheet.cssText = w(t, i);
        else {
          var r = document.createTextNode(i),
            s = e.childNodes;
          s[t] && e.removeChild(s[t]),
            s.length ? e.insertBefore(r, s[t]) : e.appendChild(r);
        }
      }
      function x(e, t) {
        var a = t.css,
          n = t.media;
        if ((n && e.setAttribute('media', n), e.styleSheet))
          e.styleSheet.cssText = a;
        else {
          for (; e.firstChild; ) e.removeChild(e.firstChild);
          e.appendChild(document.createTextNode(a));
        }
      }
      function C(e, t, a) {
        var n = a.css,
          i = a.sourceMap,
          r = void 0 === t.convertToAbsoluteUrls && i;
        (t.convertToAbsoluteUrls || r) && (n = p(n)),
          i &&
            (n +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(i)))) +
              ' */');
        var s = new Blob([n], { type: 'text/css' }),
          o = e.href;
        (e.href = URL.createObjectURL(s)), o && URL.revokeObjectURL(o);
      }
    },
    9657: e => {
      e.exports = function(e) {
        var t = 'undefined' != typeof window && window.location;
        if (!t) throw new Error('fixUrls requires window.location');
        if (!e || 'string' != typeof e) return e;
        var a = t.protocol + '//' + t.host,
          n = a + t.pathname.replace(/\/[^\/]*$/, '/');
        return e.replace(
          /url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,
          function(e, t) {
            var i,
              r = t
                .trim()
                .replace(/^"(.*)"$/, function(e, t) {
                  return t;
                })
                .replace(/^'(.*)'$/, function(e, t) {
                  return t;
                });
            return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(r)
              ? e
              : ((i =
                  0 === r.indexOf('//')
                    ? r
                    : 0 === r.indexOf('/')
                    ? a + r
                    : n + r.replace(/^\.\//, '')),
                'url(' + JSON.stringify(i) + ')');
          }
        );
      };
    },
    5405: (e, t, a) => {
      'use strict';
      a.r(t),
        a.d(t, {
          METADATA_HEADER_BUTTON_CLASS: () => g,
          METADATA_HEADER_CLASS: () => y,
          METADATA_ITEM: () => v,
          MetadataDisplay: () => b,
          MetadataEditor: () => u,
          MetadataWidget: () => E
        }),
        a(7221);
      var n = a(3450),
        i = a(5534),
        r = a(4205),
        s = a(5216),
        o = a(4268),
        d = a(9266),
        l = a(6455),
        c = a(9850),
        h = a(2959),
        p = a.n(h);
      const m = 'jp-mod-dirty';
      class u extends o.ReactWidget {
        constructor(e) {
          super(),
            (this.schema = {}),
            (this.schemaPropertiesByCategory = {}),
            (this.allMetadata = []),
            (this.metadata = {}),
            (this.handleDropdownChange = (e, t) => {
              if (
                (this.handleDirtyState(!0),
                (this.metadata[e] = t),
                'language' === e)
              ) {
                const e = this.editorServices.mimeTypeService
                  .getMimeTypeByLanguage;
                this.editor.model.mimeType = e({ name: t, codemirror_mode: t });
              }
              this.update();
            }),
            (this.editorServices = e.editorServices),
            (this.status = e.status),
            (this.clearDirty = null),
            (this.namespace = e.namespace),
            (this.schemaName = e.schema),
            (this.onSave = e.onSave),
            (this.name = e.name),
            (this.widgetClass =
              'elyra-metadataEditor-' + (this.name ? this.name : 'new')),
            this.addClass(this.widgetClass),
            (this.handleTextInputChange = this.handleTextInputChange.bind(
              this
            )),
            (this.handleDropdownChange = this.handleDropdownChange.bind(this)),
            (this.renderField = this.renderField.bind(this)),
            (this.invalidForm = !1),
            (this.showSecure = {}),
            this.initializeMetadata();
        }
        async initializeMetadata() {
          const e = await r.FrontendServices.getSchema(this.namespace);
          for (const t of e)
            if (this.schemaName === t.name) {
              (this.schema = t.properties.metadata.properties),
                (this.schemaDisplayName = t.title),
                (this.requiredFields = t.properties.metadata.required),
                this.name ||
                  (this.title.label = 'New ' + this.schemaDisplayName),
                (this.schemaPropertiesByCategory = { _noCategory: [] });
              for (const e in this.schema) {
                const t =
                  this.schema[e].uihints && this.schema[e].uihints.category;
                t
                  ? this.schemaPropertiesByCategory[t]
                    ? this.schemaPropertiesByCategory[t].push(e)
                    : (this.schemaPropertiesByCategory[t] = [e])
                  : this.schemaPropertiesByCategory._noCategory.push(e);
              }
              break;
            }
          if (
            ((this.allMetadata = await r.FrontendServices.getMetadata(
              this.namespace
            )),
            this.name)
          ) {
            for (const e of this.allMetadata)
              if (this.name === e.name) {
                (this.metadata = e.metadata),
                  (this.displayName = e.display_name),
                  (this.title.label = this.displayName);
                break;
              }
          } else this.displayName = '';
          this.update();
        }
        isValueEmpty(e) {
          return (
            null == e ||
            '' === e ||
            (Array.isArray(e) && 0 === e.length) ||
            '(No selection)' === e
          );
        }
        hasInvalidFields() {
          (this.invalidForm = !1),
            (null !== this.displayName && '' !== this.displayName) ||
              (this.invalidForm = !0);
          for (const e in this.schema)
            this.requiredFields.includes(e) &&
            this.isValueEmpty(this.metadata[e])
              ? ((this.invalidForm = !0),
                (this.schema[e].uihints.intent = n.S.DANGER))
              : (this.schema[e].uihints.intent = n.S.NONE);
          return this.invalidForm;
        }
        onCloseRequest(e) {
          this.dirty
            ? (0, o.showDialog)({
                title: 'Close without saving?',
                body: h.createElement(
                  'p',
                  null,
                  ' ',
                  `"${this.displayName}" has unsaved changes, close without saving?`,
                  ' '
                ),
                buttons: [o.Dialog.cancelButton(), o.Dialog.okButton()]
              }).then(t => {
                t.button.accept && (this.dispose(), super.onCloseRequest(e));
              })
            : (this.dispose(), super.onCloseRequest(e));
        }
        saveMetadata() {
          const e = {
            schema_name: this.schemaName,
            display_name: this.displayName,
            metadata: this.metadata
          };
          this.hasInvalidFields()
            ? this.update()
            : this.name
            ? r.FrontendServices.putMetadata(
                this.namespace,
                this.name,
                JSON.stringify(e)
              ).then(e => {
                this.handleDirtyState(!1), this.onSave(), this.close();
              })
            : r.FrontendServices.postMetadata(
                this.namespace,
                JSON.stringify(e)
              ).then(e => {
                this.handleDirtyState(!1), this.onSave(), this.close();
              });
        }
        handleTextInputChange(e, t) {
          this.handleDirtyState(!0),
            'display_name' === t
              ? (this.displayName = e.nativeEvent.target.value)
              : (this.metadata[t] = e.nativeEvent.target.value);
        }
        handleDirtyState(e) {
          (this.dirty = e),
            this.dirty && !this.clearDirty
              ? (this.clearDirty = this.status.setDirty())
              : !this.dirty &&
                this.clearDirty &&
                (this.clearDirty.dispose(), (this.clearDirty = null)),
            this.dirty && !this.title.className.includes(m)
              ? (this.title.className += m)
              : this.dirty ||
                (this.title.className = this.title.className.replace(m, ''));
        }
        onUpdateRequest(e) {
          if (
            (super.onUpdateRequest(e),
            !this.editor && null != document.getElementById('code:' + this.id))
          ) {
            let e;
            const t = this.editorServices.mimeTypeService.getMimeTypeByLanguage;
            (e = this.name ? this.metadata.code.join('\n') : ''),
              (this.editor = this.editorServices.factoryService.newInlineEditor(
                {
                  host: document.getElementById('code:' + this.id),
                  model: new d.CodeEditor.Model({
                    value: e,
                    mimeType: t({
                      name: this.metadata.language,
                      codemirror_mode: this.metadata.language
                    })
                  })
                }
              )),
              this.editor.model.value.changed.connect(e => {
                (this.metadata.code = e.text.split('\n')),
                  this.handleDirtyState(!0);
              });
          }
        }
        getDefaultChoices(e) {
          let t = this.schema[e].uihints.default_choices;
          void 0 === t && (t = []);
          for (const a of this.allMetadata)
            (0, c.find)(
              t,
              t => t.toLowerCase() === a.metadata[e].toLowerCase()
            ) || t.push(a.metadata[e]);
          return t;
        }
        renderTextInput(e, t, a, r, s, o, d) {
          let c = t || '';
          d === n.S.DANGER && (c += '\nThis field is required.');
          let p,
            m = !1;
          return (
            o &&
              (this.showSecure[a] ? (m = !0) : (this.showSecure[a] = !1),
              (p = h.createElement(
                i.u,
                { content: (m ? 'Hide' : 'Show') + ' Password' },
                h.createElement(l.Button, {
                  icon: m ? 'eye-open' : 'eye-off',
                  intent: n.S.WARNING,
                  minimal: !0,
                  onClick: () => {
                    (this.showSecure[a] = !this.showSecure[a]), this.update();
                  }
                })
              ))),
            h.createElement(
              i.cw,
              { key: a, label: e, labelInfo: s, helperText: c, intent: d },
              h.createElement(l.InputGroup, {
                onChange: e => {
                  this.handleTextInputChange(e, a);
                },
                defaultValue: r,
                rightElement: p,
                type: m || !o ? 'text' : 'password',
                className: 'elyra-metadataEditor-form-' + a
              })
            )
          );
        }
        onAfterShow(e) {
          const t = document.querySelector(
            `.${this.widgetClass} .elyra-metadataEditor-form-display_name input`
          );
          t && (t.focus(), t.setSelectionRange(t.value.length, t.value.length));
        }
        renderField(e) {
          let t = this.schema[e].uihints,
            a = '(optional)';
          if (
            (this.requiredFields &&
              this.requiredFields.includes(e) &&
              (a = '(required)'),
            void 0 === t && ((t = {}), (this.schema[e].uihints = t)),
            'textinput' === t.field_type || void 0 === t.field_type)
          )
            return this.renderTextInput(
              this.schema[e].title,
              t.description,
              e,
              this.metadata[e],
              a,
              t.secure,
              t.intent
            );
          if ('dropdown' === t.field_type)
            return h.createElement(s.DropDown, {
              label: this.schema[e].title,
              schemaField: e,
              description: t.description,
              required: a,
              intent: t.intent,
              choice: this.metadata[e],
              defaultChoices: this.getDefaultChoices(e),
              handleDropdownChange: this.handleDropdownChange
            });
          if ('code' === t.field_type) {
            let r;
            return (
              t.intent === n.S.DANGER && (r = 'This field is required.'),
              h.createElement(
                i.cw,
                {
                  className: 'elyra-metadataEditor-code',
                  labelInfo: a,
                  label: this.schema[e].title,
                  intent: t.intent,
                  helperText: r
                },
                h.createElement(
                  i.z_,
                  {
                    onResize: () => {
                      this.editor.refresh();
                    }
                  },
                  h.createElement('div', {
                    id: 'code:' + this.id,
                    className: 'elyra-form-code va-va'
                  })
                )
              )
            );
          }
        }
        render() {
          const e = [];
          for (const t in this.schemaPropertiesByCategory) {
            '_noCategory' !== t &&
              e.push(
                h.createElement(
                  'h4',
                  { style: { flexBasis: '100%', paddingBottom: '10px' } },
                  t
                )
              );
            for (const a of this.schemaPropertiesByCategory[t])
              e.push(this.renderField(a));
          }
          let t = `Edit "${this.displayName}"`;
          this.name || (t = 'Add new ' + this.schemaDisplayName);
          let a = n.S.NONE;
          return (
            '' === this.displayName && this.invalidForm && (a = n.S.DANGER),
            h.createElement(
              'div',
              { className: 'elyra-metadataEditor' },
              h.createElement('h3', null, ' ', t, ' '),
              void 0 !== this.displayName
                ? this.renderTextInput(
                    'Name',
                    '',
                    'display_name',
                    this.displayName,
                    '(required)',
                    !1,
                    a
                  )
                : null,
              e,
              h.createElement(
                i.cw,
                { className: 'elyra-metadataEditor-saveButton' },
                h.createElement(
                  l.Button,
                  {
                    onClick: () => {
                      this.saveMetadata();
                    }
                  },
                  'Save & Close'
                )
              )
            )
          );
        }
      }
      var f = a(6168);
      const y = 'elyra-metadataHeader',
        g = 'elyra-metadataHeader-button',
        v = 'elyra-metadata-item';
      class b extends p().Component {
        constructor() {
          super(...arguments),
            (this.deleteMetadata = e =>
              (0, o.showDialog)({
                title: `Delete metadata: ${e.display_name}?`,
                buttons: [o.Dialog.cancelButton(), o.Dialog.okButton()]
              }).then(t => {
                t.button.accept &&
                  r.FrontendServices.deleteMetadata(
                    this.props.namespace,
                    e.name
                  );
              })),
            (this.actionButtons = e => [
              {
                title: 'Edit',
                icon: l.editIcon,
                onClick: () => {
                  this.props.openMetadataEditor({
                    onSave: this.props.updateMetadata,
                    namespace: this.props.namespace,
                    schema: this.props.schema,
                    name: e.name
                  });
                }
              },
              {
                title: 'Delete',
                icon: s.trashIcon,
                onClick: () => {
                  this.deleteMetadata(e).then(e => {
                    this.props.updateMetadata();
                  });
                }
              }
            ]),
            (this.renderMetadata = e =>
              p().createElement(
                'div',
                { key: e.name, className: v },
                p().createElement(
                  s.ExpandableComponent,
                  {
                    displayName: e.display_name,
                    tooltip: e.metadata.description,
                    actionButtons: this.actionButtons(e)
                  },
                  p().createElement(
                    'div',
                    { id: e.name },
                    this.renderExpandableContent(e)
                  )
                )
              ));
        }
        renderExpandableContent(e) {
          return p().createElement(
            'div',
            { className: 'jp-RenderedJSON CodeMirror cm-s-jupyter' },
            p().createElement(s.JSONComponent, { json: e.metadata })
          );
        }
        sortMetadata() {
          this.props.metadata.sort((e, t) =>
            e.display_name.localeCompare(t.display_name)
          );
        }
        render() {
          return (
            this.props.sortMetadata && this.sortMetadata(),
            p().createElement(
              'div',
              null,
              p().createElement(
                'div',
                { id: 'elyra-metadata' },
                p().createElement(
                  'div',
                  null,
                  this.props.metadata.map(this.renderMetadata)
                )
              )
            )
          );
        }
      }
      class E extends o.ReactWidget {
        constructor(e) {
          super(),
            (this.openMetadataEditor = e => {
              this.props.app.commands.execute('elyra-metadata-editor:open', e);
            }),
            this.addClass('elyra-metadata'),
            (this.props = e),
            (this.renderSignal = new f.Signal(this)),
            (this.schemaDisplayName = e.schema),
            (this.fetchMetadata = this.fetchMetadata.bind(this)),
            (this.updateMetadata = this.updateMetadata.bind(this)),
            (this.openMetadataEditor = this.openMetadataEditor.bind(this)),
            (this.renderDisplay = this.renderDisplay.bind(this)),
            this.getSchema();
        }
        async getSchema() {
          const e = await r.FrontendServices.getSchema(this.props.namespace);
          for (const t of e)
            if (this.props.schema === t.name) {
              (this.schemaDisplayName = t.title), this.update();
              break;
            }
        }
        addMetadata() {
          this.openMetadataEditor({
            onSave: this.updateMetadata,
            namespace: this.props.namespace,
            schema: this.props.schema
          });
        }
        async fetchMetadata() {
          return await r.FrontendServices.getMetadata(this.props.namespace);
        }
        updateMetadata() {
          this.fetchMetadata().then(e => {
            this.renderSignal.emit(e);
          });
        }
        onAfterShow(e) {
          this.updateMetadata();
        }
        renderDisplay(e) {
          return p().createElement(b, {
            metadata: e,
            updateMetadata: this.updateMetadata,
            openMetadataEditor: this.openMetadataEditor,
            namespace: this.props.namespace,
            schema: this.props.schema,
            sortMetadata: !0
          });
        }
        render() {
          return p().createElement(
            'div',
            null,
            p().createElement(
              'header',
              { className: y },
              p().createElement(
                'div',
                { style: { display: 'flex' } },
                p().createElement(this.props.icon.react, {
                  tag: 'span',
                  width: 'auto',
                  height: '24px',
                  verticalAlign: 'middle',
                  marginRight: '5px'
                }),
                p().createElement('p', null, ' ', this.props.display_name, ' ')
              ),
              p().createElement(
                'button',
                {
                  className: g,
                  onClick: this.addMetadata.bind(this),
                  title: 'Create new ' + this.schemaDisplayName
                },
                p().createElement(l.addIcon.react, {
                  tag: 'span',
                  elementPosition: 'center',
                  width: '16px'
                })
              )
            ),
            p().createElement(
              o.UseSignal,
              { signal: this.renderSignal, initialArgs: [] },
              (e, t) => this.renderDisplay(t)
            )
          );
        }
      }
    }
  }
]);
