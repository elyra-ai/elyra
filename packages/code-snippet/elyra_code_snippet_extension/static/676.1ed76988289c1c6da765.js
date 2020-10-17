(self.webpackChunk_elyra_code_snippet_extension =
  self.webpackChunk_elyra_code_snippet_extension || []).push([
  [676, 168],
  {
    1144: (e, t, a) => {
      (e.exports = a(2609)(!1)).push([
        e.id,
        '/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the "License");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an "AS IS" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n/* MetadataWidget CSS */\n.elyra-metadata {\n  color: var(--jp-ui-font-color1);\n  background: var(--jp-layout-color1);\n}\n\n.elyra-metadataHeader {\n  font-weight: bold;\n  padding: 8px 10px;\n  border-bottom: var(--jp-border-width) solid var(--jp-toolbar-border-color);\n  display: flex;\n  justify-content: space-between;\n}\n\n.elyra-metadataHeader p {\n  font-weight: bold;\n}\n\n.elyra-metadataHeader-button {\n  background-color: transparent;\n  vertical-align: middle;\n  padding: 5px;\n  width: 20px;\n  background-repeat: no-repeat;\n  background-position: center;\n  border: none;\n  display: inline-flex;\n  align-self: flex-end;\n}\n\n.elyra-metadataHeader-button svg {\n  transform: translate(-3px, 0px);\n}\n\n.elyra-metadataHeader-button:hover {\n  background-color: var(--jp-layout-color2);\n  cursor: pointer;\n}\n\n.elyra-metadataHeader [fill] {\n  fill: var(--jp-ui-font-color1);\n}\n\n.elyra-metadataHeader + div:first-of-type {\n  overflow-y: auto;\n  height: calc(100vh - 95px);\n}\n\n.elyra-metadata-item {\n  border-bottom: var(--jp-border-width) solid var(--jp-border-color2);\n  display: flex;\n  flex-direction: column;\n  margin: 0;\n  padding: 0;\n}\n\n.elyra-metadata-item .elyra-expandableContainer-details-visible {\n  background-color: var(--jp-cell-editor-background);\n  resize: vertical;\n  height: 100px;\n}\n\n.elyra-metadata-item .CodeMirror.cm-s-jupyter {\n  background-color: inherit;\n  border: none;\n  font-family: var(--jp-code-font-family);\n  font-size: var(--jp-code-font-size);\n  line-height: var(--jp-code-line-height);\n}\n\n.elyra-metadata-item .cm-s-jupyter li .cm-string {\n  word-break: normal;\n}\n\n/* MetadataEditor css */\n.elyra-metadataEditor .jp-InputGroup {\n  width: 100%;\n}\n\n.elyra-metadataEditor .bp3-form-group {\n  margin-bottom: 12px;\n  margin-right: 20px;\n  flex-basis: 45%;\n  height: 65px;\n}\n\n.bp3-select-popover {\n  max-height: 150px;\n  overflow-y: auto;\n}\n\n.elyra-form-DropDown-item {\n  width: 100%;\n  display: flex;\n  justify-content: left;\n  margin: 0;\n  border-radius: 0;\n}\n\n.elyra-metadataEditor {\n  padding: 20px;\n  display: flex;\n  flex-wrap: wrap;\n  height: 100%;\n  align-content: flex-start;\n  align-items: flex-start;\n  justify-content: flex-start;\n}\n\n.elyra-metadataEditor h3 {\n  flex-basis: 100%;\n  margin-bottom: 15px;\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadataEditor label.bp3-label {\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadataEditor .elyra-form-code.jp-CodeMirrorEditor {\n  background-color: var(--jp-cell-editor-background);\n  border: var(--jp-border-width) solid var(--jp-input-border-color);\n  overflow-y: auto;\n  resize: vertical;\n  min-height: 150px;\n  height: 150px;\n  padding-bottom: 10px;\n  cursor: initial;\n}\n\n.elyra-metadataEditor .CodeMirror.cm-s-jupyter {\n  background-color: inherit;\n  height: 100%;\n}\n\n.elyra-metadataEditor .bp3-form-group.elyra-metadataEditor-code {\n  height: auto;\n  flex-basis: 100%;\n  display: flex;\n}\n\n.elyra-metadataEditor-code .bp3-form-content {\n  height: 100%;\n}\n\n.bp3-dark .bp3-input {\n  border: var(--jp-border-width) solid var(--jp-input-border-color);\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-metadata-editor {\n  overflow-y: auto;\n}\n\n.elyra-metadata-editor.bp3-dark {\n  background-color: var(--jp-border-color3);\n}\n\n.elyra-metadataEditor .elyra-metadataEditor-saveButton {\n  flex-basis: 100%;\n  display: flex;\n}\n',
        ''
      ]);
    },
    7221: (e, t, a) => {
      var i = a(1144);
      'string' == typeof i && (i = [[e.id, i, '']]);
      a(2379)(i, { hmr: !0, transform: void 0, insertInto: void 0 }),
        i.locals && (e.exports = i.locals);
    },
    5405: (e, t, a) => {
      'use strict';
      a.r(t),
        a.d(t, {
          METADATA_HEADER_BUTTON_CLASS: () => f,
          METADATA_HEADER_CLASS: () => g,
          METADATA_ITEM: () => v,
          MetadataDisplay: () => b,
          MetadataEditor: () => u,
          MetadataWidget: () => E
        }),
        a(7221);
      var i = a(3450),
        n = a(5534),
        s = a(4205),
        r = a(5216),
        o = a(4268),
        d = a(9266),
        l = a(6455),
        h = a(9850),
        c = a(2959),
        p = a.n(c);
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
          const e = await s.FrontendServices.getSchema(this.namespace);
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
            ((this.allMetadata = await s.FrontendServices.getMetadata(
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
                (this.schema[e].uihints.intent = i.S.DANGER))
              : (this.schema[e].uihints.intent = i.S.NONE);
          return this.invalidForm;
        }
        onCloseRequest(e) {
          this.dirty
            ? (0, o.showDialog)({
                title: 'Close without saving?',
                body: c.createElement(
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
            ? s.FrontendServices.putMetadata(
                this.namespace,
                this.name,
                JSON.stringify(e)
              ).then(e => {
                this.handleDirtyState(!1), this.onSave(), this.close();
              })
            : s.FrontendServices.postMetadata(
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
            (0, h.find)(
              t,
              t => t.toLowerCase() === a.metadata[e].toLowerCase()
            ) || t.push(a.metadata[e]);
          return t;
        }
        renderTextInput(e, t, a, s, r, o, d) {
          let h = t || '';
          d === i.S.DANGER && (h += '\nThis field is required.');
          let p,
            m = !1;
          return (
            o &&
              (this.showSecure[a] ? (m = !0) : (this.showSecure[a] = !1),
              (p = c.createElement(
                n.u,
                { content: (m ? 'Hide' : 'Show') + ' Password' },
                c.createElement(l.Button, {
                  icon: m ? 'eye-open' : 'eye-off',
                  intent: i.S.WARNING,
                  minimal: !0,
                  onClick: () => {
                    (this.showSecure[a] = !this.showSecure[a]), this.update();
                  }
                })
              ))),
            c.createElement(
              n.cw,
              { key: a, label: e, labelInfo: r, helperText: h, intent: d },
              c.createElement(l.InputGroup, {
                onChange: e => {
                  this.handleTextInputChange(e, a);
                },
                defaultValue: s,
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
            return c.createElement(r.DropDown, {
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
            let s;
            return (
              t.intent === i.S.DANGER && (s = 'This field is required.'),
              c.createElement(
                n.cw,
                {
                  className: 'elyra-metadataEditor-code',
                  labelInfo: a,
                  label: this.schema[e].title,
                  intent: t.intent,
                  helperText: s
                },
                c.createElement(
                  n.z_,
                  {
                    onResize: () => {
                      this.editor.refresh();
                    }
                  },
                  c.createElement('div', {
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
                c.createElement(
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
          let a = i.S.NONE;
          return (
            '' === this.displayName && this.invalidForm && (a = i.S.DANGER),
            c.createElement(
              'div',
              { className: 'elyra-metadataEditor' },
              c.createElement('h3', null, ' ', t, ' '),
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
              c.createElement(
                n.cw,
                { className: 'elyra-metadataEditor-saveButton' },
                c.createElement(
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
      var y = a(6168);
      const g = 'elyra-metadataHeader',
        f = 'elyra-metadataHeader-button',
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
                  s.FrontendServices.deleteMetadata(
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
                icon: r.trashIcon,
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
                  r.ExpandableComponent,
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
            p().createElement(r.JSONComponent, { json: e.metadata })
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
            (this.renderSignal = new y.Signal(this)),
            (this.schemaDisplayName = e.schema),
            (this.fetchMetadata = this.fetchMetadata.bind(this)),
            (this.updateMetadata = this.updateMetadata.bind(this)),
            (this.openMetadataEditor = this.openMetadataEditor.bind(this)),
            (this.renderDisplay = this.renderDisplay.bind(this)),
            this.getSchema();
        }
        async getSchema() {
          const e = await s.FrontendServices.getSchema(this.props.namespace);
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
          return await s.FrontendServices.getMetadata(this.props.namespace);
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
              { className: g },
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
                  className: f,
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
