(self.webpackChunk_elyra_metadata_common =
  self.webpackChunk_elyra_metadata_common || []).push([
  [519],
  {
    9519: (e, t, a) => {
      'use strict';
      a.r(t),
        a.d(t, {
          METADATA_HEADER_BUTTON_CLASS: () => g,
          METADATA_HEADER_CLASS: () => y,
          METADATA_ITEM: () => E,
          MetadataDisplay: () => v,
          MetadataEditor: () => p,
          MetadataWidget: () => f
        }),
        a(7283);
      var i = a(2054),
        s = a(4205),
        n = a(5216),
        r = a(4268),
        d = a(9266),
        h = a(6455),
        o = a(9850),
        l = a(2959),
        m = a.n(l);
      const c = 'jp-mod-dirty';
      class p extends r.ReactWidget {
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
                (this.schema[e].uihints.intent = i.Intent.DANGER))
              : (this.schema[e].uihints.intent = i.Intent.NONE);
          return this.invalidForm;
        }
        onCloseRequest(e) {
          this.dirty
            ? (0, r.showDialog)({
                title: 'Close without saving?',
                body: l.createElement(
                  'p',
                  null,
                  ' ',
                  `"${this.displayName}" has unsaved changes, close without saving?`,
                  ' '
                ),
                buttons: [r.Dialog.cancelButton(), r.Dialog.okButton()]
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
            this.dirty && !this.title.className.includes(c)
              ? (this.title.className += c)
              : this.dirty ||
                (this.title.className = this.title.className.replace(c, ''));
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
            (0, o.find)(
              t,
              t => t.toLowerCase() === a.metadata[e].toLowerCase()
            ) || t.push(a.metadata[e]);
          return t;
        }
        renderTextInput(e, t, a, s, n, r, d) {
          let o = t || '';
          d === i.Intent.DANGER && (o += '\nThis field is required.');
          let m,
            c = !1;
          return (
            r &&
              (this.showSecure[a] ? (c = !0) : (this.showSecure[a] = !1),
              (m = l.createElement(
                i.Tooltip,
                { content: (c ? 'Hide' : 'Show') + ' Password' },
                l.createElement(h.Button, {
                  icon: c ? 'eye-open' : 'eye-off',
                  intent: i.Intent.WARNING,
                  minimal: !0,
                  onClick: () => {
                    (this.showSecure[a] = !this.showSecure[a]), this.update();
                  }
                })
              ))),
            l.createElement(
              i.FormGroup,
              { key: a, label: e, labelInfo: n, helperText: o, intent: d },
              l.createElement(h.InputGroup, {
                onChange: e => {
                  this.handleTextInputChange(e, a);
                },
                defaultValue: s,
                rightElement: m,
                type: c || !r ? 'text' : 'password',
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
            return l.createElement(n.DropDown, {
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
              t.intent === i.Intent.DANGER && (s = 'This field is required.'),
              l.createElement(
                i.FormGroup,
                {
                  className: 'elyra-metadataEditor-code',
                  labelInfo: a,
                  label: this.schema[e].title,
                  intent: t.intent,
                  helperText: s
                },
                l.createElement(
                  i.ResizeSensor,
                  {
                    onResize: () => {
                      this.editor.refresh();
                    }
                  },
                  l.createElement('div', {
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
                l.createElement(
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
          let a = i.Intent.NONE;
          return (
            '' === this.displayName &&
              this.invalidForm &&
              (a = i.Intent.DANGER),
            l.createElement(
              'div',
              { className: 'elyra-metadataEditor' },
              l.createElement('h3', null, ' ', t, ' '),
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
              l.createElement(
                i.FormGroup,
                { className: 'elyra-metadataEditor-saveButton' },
                l.createElement(
                  h.Button,
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
      var u = a(6168);
      const y = 'elyra-metadataHeader',
        g = 'elyra-metadataHeader-button',
        E = 'elyra-metadata-item';
      class v extends m().Component {
        constructor() {
          super(...arguments),
            (this.deleteMetadata = e =>
              (0, r.showDialog)({
                title: `Delete metadata: ${e.display_name}?`,
                buttons: [r.Dialog.cancelButton(), r.Dialog.okButton()]
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
                icon: h.editIcon,
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
                icon: n.trashIcon,
                onClick: () => {
                  this.deleteMetadata(e).then(e => {
                    this.props.updateMetadata();
                  });
                }
              }
            ]),
            (this.renderMetadata = e =>
              m().createElement(
                'div',
                { key: e.name, className: E },
                m().createElement(
                  n.ExpandableComponent,
                  {
                    displayName: e.display_name,
                    tooltip: e.metadata.description,
                    actionButtons: this.actionButtons(e)
                  },
                  m().createElement(
                    'div',
                    { id: e.name },
                    this.renderExpandableContent(e)
                  )
                )
              ));
        }
        renderExpandableContent(e) {
          return m().createElement(
            'div',
            { className: 'jp-RenderedJSON CodeMirror cm-s-jupyter' },
            m().createElement(n.JSONComponent, { json: e.metadata })
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
            m().createElement(
              'div',
              null,
              m().createElement(
                'div',
                { id: 'elyra-metadata' },
                m().createElement(
                  'div',
                  null,
                  this.props.metadata.map(this.renderMetadata)
                )
              )
            )
          );
        }
      }
      class f extends r.ReactWidget {
        constructor(e) {
          super(),
            (this.openMetadataEditor = e => {
              this.props.app.commands.execute('elyra-metadata-editor:open', e);
            }),
            this.addClass('elyra-metadata'),
            (this.props = e),
            (this.renderSignal = new u.Signal(this)),
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
          return m().createElement(v, {
            metadata: e,
            updateMetadata: this.updateMetadata,
            openMetadataEditor: this.openMetadataEditor,
            namespace: this.props.namespace,
            schema: this.props.schema,
            sortMetadata: !0
          });
        }
        render() {
          return m().createElement(
            'div',
            null,
            m().createElement(
              'header',
              { className: y },
              m().createElement(
                'div',
                { style: { display: 'flex' } },
                m().createElement(this.props.icon.react, {
                  tag: 'span',
                  width: 'auto',
                  height: '24px',
                  verticalAlign: 'middle',
                  marginRight: '5px'
                }),
                m().createElement('p', null, ' ', this.props.display_name, ' ')
              ),
              m().createElement(
                'button',
                {
                  className: g,
                  onClick: this.addMetadata.bind(this),
                  title: 'Create new ' + this.schemaDisplayName
                },
                m().createElement(h.addIcon.react, {
                  tag: 'span',
                  elementPosition: 'center',
                  width: '16px'
                })
              )
            ),
            m().createElement(
              r.UseSignal,
              { signal: this.renderSignal, initialArgs: [] },
              (e, t) => this.renderDisplay(t)
            )
          );
        }
      }
    }
  }
]);
