(self.webpackChunk_elyra_pipeline_editor_extension =
  self.webpackChunk_elyra_pipeline_editor_extension || []).push([
  [568],
  {
    9326: (e, t, n) => {
      (e.exports = n(2609)(!1)).push([
        e.id,
        "/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an \"AS IS\" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n/** https://github.com/carbon-design-system/carbon/blob/master/packages/themes/docs/sass.md **/\nbody[data-jp-theme-light='true'] .common-canvas,\nbody[data-jp-theme-light='true'] .properties-modal,\nbody[data-jp-theme-light='true'] .common-canvas-tooltip {\n  /** carbon--theme--v9 **/\n  --interactive-01: #3d70b2;\n  --ui-background: #f4f7fb;\n  --ui-01: #ffffff;\n  --ui-02: #f4f7fb;\n  --ui-03: #dfe3e6;\n  --ui-04: #8897a2;\n  --ui-05: #5a6872;\n  --text-01: #152935;\n  --text-02: #5a6872;\n  --text-03: #cdd1d4;\n  --icon-01: #3d70b2;\n  --link-01: #3d70b2;\n  --inverse-01: #ffffff;\n  --inverse-02: #161616;\n  --inverse-link: #5596e6;\n  --highlight: #f4f7fb;\n}\n\nbody[data-jp-theme-light='false'] .common-canvas,\nbody[data-jp-theme-light='false'] .properties-modal,\nbody[data-jp-theme-light='false'] .common-canvas-tooltip {\n  /* carbon--theme--g100 */\n  --ui-background: #161616;\n  --ui-01: #262626;\n  --ui-02: #393939;\n  --ui-03: #6f6f6f;\n  --ui-04: #c6c6c6;\n  --ui-05: #f4f4f4;\n  --text-01: #f4f4f4;\n  --text-02: #c6c6c6;\n  --text-03: #6f6f6f;\n  --icon-01: #f4f4f4;\n  --link-01: #78a9ff;\n  --inverse-01: #161616;\n  --inverse-02: #ffffff;\n  --inverse-link: #0f62fe;\n  --highlight: #002d9c;\n}\n\n.common-canvas-tooltip {\n  background-color: var(--ui-02);\n  border-color: var(--ui-03);\n  color: var(--text-01);\n}\n.common-canvas-tooltip #tipArrow polyline {\n  fill: var(--ui-02);\n}\n.common-canvas-tooltip #tipArrow polygon {\n  fill: var(--ui-03);\n}\n\n.d3-svg-background {\n  fill: var(--ui-01);\n}\n\n.d3-comment-rect {\n  fill: var(--ui-01);\n  stroke: var(--ui-04);\n  stroke-width: 1;\n}\n.d3-comment-selection-highlight[data-selected='yes'] {\n  stroke: var(--inverse-link);\n  fill: transparent;\n}\n.d3-comment-text {\n  fill: var(--text-02);\n}\n.d3-comment-entry {\n  fill: var(--text-02);\n}\n.d3-comment-halo {\n  fill: none;\n  stroke: transparent;\n  stroke-width: 8;\n}\n.d3-comment-halo:hover {\n  fill: none;\n  stroke: var(--inverse-link);\n  stroke-width: 8;\n}\n.d3-comment-link {\n  stroke: var(--ui-04);\n  fill: none;\n}\n.d3-comment-link-arrow-head {\n  stroke: var(--ui-04);\n  fill: transparent;\n}\ng .d3-comment-link:hover,\ng .d3-data-link:hover,\ng .d3-selectable-link:hover,\ng .d3-selectable-link:hover ~ .d3-selectable-link,\ng .d3-link-selection-area:hover ~ .d3-selectable-link {\n  stroke: var(--link-01);\n}\n\n.d3-node-body-halo {\n  stroke: transparent;\n  fill: transparent;\n}\n.d3-node-body-outline {\n  stroke: var(--ui-04);\n  stroke-width: 1;\n  fill: var(--ui-02);\n}\n.d3-node-body-outline[hover='yes'] {\n  stroke: var(--ui-03);\n  fill: var(--ui-03);\n}\n\n.d3-node-label {\n  fill: var(--text-01);\n}\n\n.d3-node-ellipsis {\n  fill: var(--icon-01);\n}\n.d3-node-ellipsis:hover,\n.d3-node-ellipsis-background:hover ~ .d3-node-ellipsis {\n  fill: var(--inverse-link);\n}\n.toolbar-div {\n  border-bottom-color: var(--ui-03);\n}\n.toolbar-div .bx--btn {\n  margin: 0;\n}\n.toolbar-div,\n.toolbar-item.default button,\n.toolbar-item.ghost button,\n.toolbar-overflow-item button {\n  background-color: var(--ui-background);\n}\n.toolbar-item.default button:hover,\n.toolbar-item.ghost button:hover,\n.toolbar-overflow-item button:hover {\n  background-color: var(--ui-03);\n}\n.toolbar-item.default button:disabled:hover,\n.toolbar-item.ghost button:disabled:hover,\n.toolbar-overflow-item button:disabled:hover {\n  background-color: var(--ui-01);\n}\n.toolbar-item-content.default {\n  color: var(--text-01);\n}\n.toolbar-item-content.disabled.default {\n  color: var(--text-03);\n}\n.toolbar-divider,\n.toolbar-overflow-item button {\n  border-right-color: var(--ui-03);\n}\n.overflow-toolbar-divider {\n  border-bottom-color: var(--ui-03);\n}\n.overflow-toolbar-icon-label {\n  color: var(--text-01);\n}\n.toolbar-popover-list {\n  border-color: var(--ui-03);\n  background-color: var(--ui-background);\n}\n#zoom-actions-container {\n  background-color: var(--ui-background);\n}\n\nsvg.canvas-icon,\nsvg.properties-icon,\nsvg.canvas-icon .jp-icon3[fill] {\n  fill: var(--inverse-02);\n}\n\n.list-item-containers .list-item:hover {\n  background-color: var(--ui-03);\n}\n.list-item-containers .list-item:active {\n  background-color: var(--ui-05);\n}\n.palette-flyout-content .palette-list-item:active {\n  background-color: var(--ui-03);\n}\n.palette-list-item {\n  border-color: var(--ui-03);\n}\n.palette-list-item:hover {\n  background-color: var(--ui-03);\n}\n\nbody[data-jp-theme-light='false'] .bx--modal.is-visible {\n  background-color: rgba(75, 75, 75, 0.65);\n}\n.bx--modal-container {\n  background-color: var(--ui-01);\n}\n.bx--modal-header__heading,\n.bx--modal-content {\n  color: var(--text-01);\n}\n.properties-control-item {\n  padding: 5px 0 10px 0;\n}\n.properties-dropdown .bx--list-box__field {\n  background-color: transparent;\n}\n.properties-label-container label,\n.properties-checkbox label {\n  color: var(--text-01);\n}\n.bx--list-box__menu-icon > svg {\n  fill: var(--text-02);\n}\n.properties-textarea textarea::placeholder {\n  color: var(--text-03);\n}\n.properties-textarea textarea {\n  color: var(--text-01);\n}\n.bx--text-area__wrapper {\n  width: 100%;\n}\n.bx--modal .bx--text-input,\n.bx--modal .properties-textarea textarea,\n.bx--modal .bx--select-input,\n.bx--modal .bx--dropdown {\n  background-color: var(--ui-02);\n}\n.properties-checkbox label::before {\n  background-color: transparent;\n  border: 1px solid var(--text-01);\n}\n.properties-checkbox label::after {\n  border-left: 2px solid var(--ui-01);\n  border-bottom: 2px solid var(--ui-01);\n}\n.bx--checkbox:checked + .bx--checkbox-label::before {\n  background-color: var(--text-01);\n}\n.bx--modal-footer {\n  background-color: var(--ui-01);\n}\n.bx--list-box__menu {\n  background-color: var(--ui-02);\n}\n.bx--list-box__menu-item,\n.bx--list-box__label,\n.bx--list-box__menu-item__option,\n.bx--list-box__menu-item--active .bx--list-box__menu-item__option,\n.bx--list-box__menu-item--highlighted .bx--list-box__menu-item__option,\n.bx--list-box__menu-item:hover .bx--list-box__menu-item__option {\n  color: var(--text-01);\n}\n.bx--list-box__menu-item__option,\n.bx--list-box__menu-item--active,\n.bx--list-box__menu-item--highlighted,\n.bx--list-box__menu-item:hover {\n  border-top-color: transparent;\n}\n.bx--list-box__menu-item--highlighted,\n.bx--list-box__menu-item:hover {\n  background-color: var(--ui-01);\n}\n\n.bx--list-box__menu-item__option svg.bx--list-box__menu-item__selected-icon {\n  margin-left: 10px;\n  vertical-align: bottom;\n}\n\n.context-menu-popover {\n  background-color: var(--ui-02);\n}\n.react-contextmenu-item {\n  color: var(--text-01);\n}\n.react-contextmenu-item:active,\n.react-contextmenu-item:focus,\n.react-contextmenu-item:hover {\n  background: var(--ui-03);\n}\n.react-contextmenu-item.contextmenu-divider {\n  background-color: var(--ui-03);\n}\n\n.bx--modal-footer {\n  padding: 12px;\n  justify-content: flex-end;\n  height: initial;\n}\n.bx--modal-footer button.bx--btn {\n  height: 32px;\n  justify-content: center;\n  padding: 12px 15px;\n  margin-right: 1rem;\n  max-width: 5rem;\n}\n.bx--modal-footer .bx--btn:not(:last-child) {\n  margin-right: 12px;\n}\n.bx--modal-footer .bx--btn--primary {\n  background: var(--md-blue-500);\n}\n.bx--modal-footer .bx--btn--secondary {\n  background: var(--md-grey-500);\n}\n.bx--modal-content .bx--btn--tertiary {\n  border-color: var(--md-blue-500);\n  color: var(--md-blue-500);\n}\n.bx--modal-content .bx--btn--tertiary:hover {\n  background: var(--md-blue-500);\n  color: #ffffff;\n}\n.bx--modal-footer .bx--btn:disabled {\n  background-color: var(--jp-layout-color3);\n  opacity: 0.3;\n  pointer-events: none;\n}\n\nimg.toolbar-icons[disabled] {\n  opacity: 0.5;\n}\n",
        ''
      ]);
    },
    4599: (e, t, n) => {
      (e.exports = n(2609)(!1)).push([
        e.id,
        "/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an \"AS IS\" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n.empty-canvas h1 {\n  color: #8897a2;\n  size: 20pt;\n  text-align: center;\n}\n\n.elyra-tooltipError {\n  color: var(--jp-error-color1);\n}\n\n.elyra-PipelineEditor .properties-modal {\n  position: absolute;\n}\n\n.elyra-PipelineEditor .bx--modal-content {\n  padding: 0;\n}\n\n.elyra-PipelineEditor .properties-modal button.bx--btn {\n  -webkit-box-flex: 0;\n  -ms-flex: 0;\n  flex: 0;\n  min-height: 2.5rem;\n  height: 2.5rem;\n  padding: 0 1rem;\n  margin: 0 1rem 0 0;\n  text-align: center;\n}\n\n.common-canvas-tooltip[data-id^='node_tip'] {\n  max-width: initial;\n}\n.elyra-PipelineNodeTooltip {\n  text-align: left;\n}\n.elyra-PipelineNodeTooltip dd {\n  font-weight: 600;\n}\n.elyra-PipelineNodeTooltip dt {\n  margin-left: 10px;\n  white-space: pre-wrap;\n}\n\n/* notebook-scheduler css */\n\n.jp-Dialog-content {\n  max-width: 100vw;\n  max-height: 100vh;\n}\n\n.lm-Widget a {\n  color: #1970b7;\n}\n\n.elyra-table {\n  margin: 1px;\n  padding: 1px;\n}\n\n.elyra-table th,\ntr,\ntd {\n  padding: 2px;\n}\n\n.elyra-notebookExperimentWidget {\n  overflow: scroll;\n}\n\n.elyra-experiments {\n  padding-right: 5px;\n}\n\n.elyra-Table-experiments {\n  font-family: 'Trebuchet MS', Arial, Helvetica, sans-serif;\n  width: 100%;\n  background-color: #ffffff;\n  margin-top: 5px;\n  margin-bottom: 10px;\n}\n\n.elyra-Table-experiments tr:hover:nth-child(even) {\n  background-color: #ddd;\n}\n\n.elyra-Table-experiments tr:hover:nth-child(odd) {\n  background-color: #ddd;\n}\n\n.elyra-Table-experiments tr:nth-child(even) {\n  background-color: #f2f2f2;\n}\n\n.elyra-Table-experiments td {\n  font-weight: normal;\n  padding: 10px;\n}\n\n.elyra-Table-experiments thead {\n  color: #495057;\n\n  background-color: #e9ecef;\n  padding-left: 10px;\n  padding-right: 10px;\n}\n\n.properties-control-panel[data-id='properties-nodeGroupInfo'],\n.properties-control-panel[data-id='properties-nodeDependenciesControls'] {\n  position: relative;\n}\n.properties-control-panel > .properties-control-panel {\n  padding: 0;\n}\n.properties-control-panel[data-id='properties-nodeFileControl'] {\n  width: calc(100% - 100px);\n}\n.properties-action-panel[data-id='properties-nodeBrowseFileAction'] {\n  position: absolute;\n  right: 0;\n  top: 0.6rem;\n}\n.properties-action-panel[data-id='properties-nodeAddDependenciesAction'] {\n  margin: 0;\n  padding: 0;\n  position: absolute;\n  right: 0;\n  top: 0;\n}\n.properties-action-panel[data-id='properties-nodeAddDependenciesAction']\n  .properties-action-button {\n  padding-right: 0;\n}\n.properties-action-panel[data-id='properties-nodeAddDependenciesAction']\n  .bx--btn--tertiary {\n  border: 0 none;\n  font-size: 0.8rem;\n  min-height: 1.75rem;\n  margin: 0;\n}\n\nbody.elyra-browseFileDialog-open .properties-modal {\n  display: none;\n}\n\nspan.elyra-BreadCrumbs-disabled {\n  color: var(--md-grey-500);\n  cursor: not-allowed;\n  font-size: 0.8rem;\n  font-style: italic;\n  pointer-events: none;\n}\nspan.elyra-BreadCrumbs-disabled:hover {\n  background-color: transparent;\n  pointer-events: none;\n}\nspan.elyra-BreadCrumbs-disabled svg {\n  cursor: not-allowed;\n  pointer-events: none;\n}\nspan.elyra-BreadCrumbs-disabled svg path.jp-icon3[fill] {\n  fill: var(--md-grey-500);\n}\nspan.elyra-BreadCrumbs-disabled + span {\n  color: var(--md-grey-500);\n}\n",
        ''
      ]);
    },
    7038: (e, t, n) => {
      var i = n(9326);
      'string' == typeof i && (i = [[e.id, i, '']]);
      n(4431)(i, { hmr: !0, transform: void 0, insertInto: void 0 }),
        i.locals && (e.exports = i.locals);
    },
    7283: (e, t, n) => {
      var i = n(4599);
      'string' == typeof i && (i = [[e.id, i, '']]);
      n(4431)(i, { hmr: !0, transform: void 0, insertInto: void 0 }),
        i.locals && (e.exports = i.locals);
    },
    4249: function(e, t, n) {
      'use strict';
      var i =
          (this && this.__createBinding) ||
          (Object.create
            ? function(e, t, n, i) {
                void 0 === i && (i = n),
                  Object.defineProperty(e, i, {
                    enumerable: !0,
                    get: function() {
                      return t[n];
                    }
                  });
              }
            : function(e, t, n, i) {
                void 0 === i && (i = n), (e[i] = t[n]);
              }),
        o =
          (this && this.__setModuleDefault) ||
          (Object.create
            ? function(e, t) {
                Object.defineProperty(e, 'default', {
                  enumerable: !0,
                  value: t
                });
              }
            : function(e, t) {
                e.default = t;
              }),
        r =
          (this && this.__importStar) ||
          function(e) {
            if (e && e.__esModule) return e;
            var t = {};
            if (null != e)
              for (var n in e)
                'default' !== n &&
                  Object.prototype.hasOwnProperty.call(e, n) &&
                  i(t, e, n);
            return o(t, e), t;
          },
        a =
          (this && this.__importDefault) ||
          function(e) {
            return e && e.__esModule ? e : { default: e };
          };
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.NotebookSubmissionDialog = void 0);
      const l = r(n(2959)),
        s = a(n(6988)),
        d = ({ env: e }) =>
          e.length > 0
            ? l.createElement(
                l.Fragment,
                null,
                l.createElement(
                  'tr',
                  null,
                  l.createElement('td', { colSpan: 4 })
                ),
                l.createElement(
                  'tr',
                  null,
                  l.createElement(
                    'td',
                    { colSpan: 4 },
                    l.createElement(
                      'div',
                      { style: { fontSize: 'var(--jp-ui-font-size3)' } },
                      'Environmental Variables'
                    )
                  )
                ),
                s.default.chunkArray(e, 4).map((e, t) =>
                  l.createElement(
                    'tr',
                    { key: t },
                    e.map(e =>
                      l.createElement(
                        'td',
                        { key: e },
                        l.createElement('label', { htmlFor: e }, e, ':'),
                        l.createElement('br', null),
                        l.createElement('input', {
                          type: 'text',
                          id: e,
                          className: 'envVar',
                          name: e,
                          size: 20
                        })
                      )
                    )
                  )
                )
              )
            : null;
      class c extends l.Component {
        render() {
          const { runtimes: e, images: t, env: n } = this.props;
          return l.createElement(
            'form',
            null,
            l.createElement(
              'table',
              { id: 'table-submit-dialog', className: 'elyra-table' },
              l.createElement(
                'tbody',
                null,
                l.createElement(
                  'tr',
                  null,
                  l.createElement(
                    'td',
                    { colSpan: 2 },
                    l.createElement(
                      'label',
                      { htmlFor: 'runtime_config' },
                      'Runtime Config:'
                    ),
                    l.createElement('br', null),
                    l.createElement(
                      'select',
                      {
                        id: 'runtime_config',
                        name: 'runtime_config',
                        className: 'elyra-form-runtime-config'
                      },
                      e.map(e =>
                        l.createElement(
                          'option',
                          { key: e.name, value: e.name },
                          e.display_name
                        )
                      )
                    )
                  ),
                  l.createElement(
                    'td',
                    { colSpan: 2 },
                    l.createElement(
                      'label',
                      { htmlFor: 'framework' },
                      'Runtime images:'
                    ),
                    l.createElement('br', null),
                    l.createElement(
                      'select',
                      {
                        id: 'framework',
                        name: 'framework',
                        className: 'elyra-form-framework'
                      },
                      Object.entries(t).map(([e, t]) =>
                        l.createElement('option', { key: e, value: e }, t)
                      )
                    )
                  )
                ),
                l.createElement(
                  'tr',
                  null,
                  l.createElement(
                    'td',
                    null,
                    l.createElement('br', null),
                    l.createElement('input', {
                      type: 'checkbox',
                      id: 'dependency_include',
                      name: 'dependency_include',
                      size: 20,
                      defaultChecked: !0
                    }),
                    l.createElement(
                      'label',
                      { htmlFor: 'dependency_include' },
                      'Include dependencies'
                    ),
                    l.createElement('br', null)
                  ),
                  l.createElement(
                    'td',
                    { colSpan: 3 },
                    l.createElement('br', null),
                    l.createElement('input', {
                      type: 'text',
                      id: 'dependencies',
                      name: 'dependencies',
                      placeholder: '*.py',
                      defaultValue: '*.py',
                      size: 20
                    })
                  )
                ),
                l.createElement(d, { env: n })
              )
            )
          );
        }
      }
      t.NotebookSubmissionDialog = c;
    },
    4347: function(e, t, n) {
      'use strict';
      var i =
          (this && this.__createBinding) ||
          (Object.create
            ? function(e, t, n, i) {
                void 0 === i && (i = n),
                  Object.defineProperty(e, i, {
                    enumerable: !0,
                    get: function() {
                      return t[n];
                    }
                  });
              }
            : function(e, t, n, i) {
                void 0 === i && (i = n), (e[i] = t[n]);
              }),
        o =
          (this && this.__setModuleDefault) ||
          (Object.create
            ? function(e, t) {
                Object.defineProperty(e, 'default', {
                  enumerable: !0,
                  value: t
                });
              }
            : function(e, t) {
                e.default = t;
              }),
        r =
          (this && this.__importStar) ||
          function(e) {
            if (e && e.__esModule) return e;
            var t = {};
            if (null != e)
              for (var n in e)
                'default' !== n &&
                  Object.prototype.hasOwnProperty.call(e, n) &&
                  i(t, e, n);
            return o(t, e), t;
          },
        a =
          (this && this.__awaiter) ||
          function(e, t, n, i) {
            return new (n || (n = Promise))(function(o, r) {
              function a(e) {
                try {
                  s(i.next(e));
                } catch (e) {
                  r(e);
                }
              }
              function l(e) {
                try {
                  s(i.throw(e));
                } catch (e) {
                  r(e);
                }
              }
              function s(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof n
                      ? t
                      : new n(function(e) {
                          e(t);
                        })).then(a, l);
              }
              s((i = i.apply(e, t || [])).next());
            });
          },
        l =
          (this && this.__importDefault) ||
          function(e) {
            return e && e.__esModule ? e : { default: e };
          };
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.PipelineEditorFactory = t.PipelineEditor = t.PipelineEditorWidget = t.commandIDs = void 0);
      const s = r(n(4371)),
        d = n(3303),
        c = n(5216),
        p = n(4268),
        u = n(1228),
        m = n(9850),
        h = n(6168),
        f = n(1314),
        b = l(n(7685)),
        v = l(n(483));
      n(4389), n(843), n(7038);
      const g = r(n(2959)),
        y = n(2155),
        _ = n(3857),
        x = n(5909),
        P = r(n(538)),
        E = n(5342),
        w = r(n(1672)),
        k = n(8565),
        C = n(2430),
        S = n(8425),
        N = r(n(6679)),
        I = l(n(6988)),
        O = e =>
          g.createElement(
            'dl',
            { className: 'elyra-PipelineNodeTooltip' },
            Object.keys(e).map((t, n) => {
              let i = e[t];
              Array.isArray(i)
                ? (i = i.join('\n'))
                : 'boolean' == typeof i && (i = i ? 'Yes' : 'No');
              let o = '';
              return (
                'Error' == t && (o = 'elyra-tooltipError'),
                g.createElement(
                  g.Fragment,
                  { key: n },
                  g.createElement('dd', { className: o }, t),
                  g.createElement('dt', { className: o }, i)
                )
              );
            })
          );
      t.commandIDs = {
        openPipelineEditor: 'pipeline-editor:open',
        openMetadata: 'elyra-metadata:open',
        openDocManager: 'docmanager:open',
        newDocManager: 'docmanager:new-untitled',
        submitNotebook: 'notebook:submit',
        addFileToPipeline: 'pipeline-editor:add-node'
      };
      class M extends p.ReactWidget {
        constructor(e) {
          super(e),
            (this.shell = e.shell),
            (this.commands = e.commands),
            (this.browserFactory = e.browserFactory),
            (this.context = e.context),
            (this.serviceManager = e.serviceManager),
            (this.addFileToPipelineSignal = e.addFileToPipelineSignal);
        }
        render() {
          return g.createElement(D, {
            shell: this.shell,
            commands: this.commands,
            browserFactory: this.browserFactory,
            widgetContext: this.context,
            widgetId: this.parent.id,
            serviceManager: this.serviceManager,
            addFileToPipelineSignal: this.addFileToPipelineSignal
          });
        }
      }
      t.PipelineEditorWidget = M;
      class D extends g.Component {
        constructor(e) {
          super(e),
            (this.position = 10),
            (this.shell = e.shell),
            (this.commands = e.commands),
            (this.browserFactory = e.browserFactory),
            (this.serviceManager = e.serviceManager),
            (this.canvasController = new d.CanvasController()),
            this.canvasController.setPipelineFlowPalette(w),
            (this.widgetContext = e.widgetContext),
            (this.canvasManager = new _.CanvasManager(
              this.widgetContext,
              this.canvasController
            )),
            (this.widgetId = e.widgetId),
            (this.addFileToPipelineSignal = e.addFileToPipelineSignal),
            (this.contextMenuHandler = this.contextMenuHandler.bind(this)),
            (this.clickActionHandler = this.clickActionHandler.bind(this)),
            (this.editActionHandler = this.editActionHandler.bind(this)),
            (this.beforeEditActionHandler = this.beforeEditActionHandler.bind(
              this
            )),
            (this.tipHandler = this.tipHandler.bind(this)),
            (this.nodesConnected = this.nodesConnected.bind(this)),
            (this.state = {
              showPropertiesDialog: !1,
              propertiesInfo: {},
              showValidationError: !1,
              validationError: { errorMessage: '', errorSeverity: 'error' },
              emptyPipeline: I.default.isEmptyPipeline(
                this.canvasController.getPipelineFlow()
              )
            }),
            (this.applyPropertyChanges = this.applyPropertyChanges.bind(this)),
            (this.closePropertiesDialog = this.closePropertiesDialog.bind(
              this
            )),
            (this.openPropertiesDialog = this.openPropertiesDialog.bind(this)),
            (this.propertiesActionHandler = this.propertiesActionHandler.bind(
              this
            )),
            (this.propertiesControllerHandler = this.propertiesControllerHandler.bind(
              this
            )),
            this.addFileToPipelineSignal.connect(e => {
              this.handleAddFileToPipelineCanvas();
            }),
            (this.node = g.createRef()),
            (this.handleEvent = this.handleEvent.bind(this));
        }
        render() {
          const e = g.createElement(
              f.Collapse,
              { in: this.state.showValidationError },
              g.createElement(
                v.default,
                {
                  severity: this.state.validationError.errorSeverity,
                  action: g.createElement(
                    f.IconButton,
                    {
                      'aria-label': 'close',
                      color: 'inherit',
                      size: 'small',
                      onClick: () => {
                        this.setState({ showValidationError: !1 });
                      }
                    },
                    g.createElement(b.default, { fontSize: 'inherit' })
                  )
                },
                this.state.validationError.errorMessage
              )
            ),
            t = {
              enableInternalObjectModel: !0,
              emptyCanvasContent: g.createElement(
                'div',
                null,
                g.createElement(c.dragDropIcon.react, {
                  tag: 'div',
                  elementPosition: 'center',
                  height: '120px'
                }),
                g.createElement(
                  'h1',
                  null,
                  ' ',
                  'Start your new pipeline by dragging files from the file browser pane.',
                  ' '
                )
              ),
              enablePaletteLayout: 'None',
              paletteInitialState: !1,
              enableInsertNodeDroppedOnLink: !0,
              enableNodeFormatType: 'Horizontal'
            },
            n = this.canvasController.getPipelineFlow(),
            i = I.default.isEmptyCanvas(n),
            o = [
              {
                action: 'run',
                label: 'Run Pipeline',
                enable: !this.state.emptyPipeline
              },
              {
                action: 'save',
                label: 'Save Pipeline',
                enable: !0,
                iconEnabled: c.IconUtil.encode(c.savePipelineIcon),
                iconDisabled: c.IconUtil.encode(c.savePipelineIcon)
              },
              {
                action: 'export',
                label: 'Export Pipeline',
                enable: !this.state.emptyPipeline,
                iconEnabled: c.IconUtil.encode(c.exportPipelineIcon),
                iconDisabled: c.IconUtil.encode(c.exportPipelineIcon)
              },
              {
                action: 'clear',
                label: 'Clear Pipeline',
                enable: !this.state.emptyPipeline || !i,
                iconEnabled: c.IconUtil.encode(c.clearPipelineIcon),
                iconDisabled: c.IconUtil.encode(c.clearPipelineIcon)
              },
              {
                action: 'openRuntimes',
                label: 'Open Runtimes',
                enable: !0,
                iconEnabled: c.IconUtil.encode(c.runtimesIcon),
                iconDisabled: c.IconUtil.encode(c.runtimesIcon)
              },
              { divider: !0 },
              { action: 'undo', label: 'Undo' },
              { action: 'redo', label: 'Redo' },
              { action: 'cut', label: 'Cut' },
              { action: 'copy', label: 'Copy' },
              { action: 'paste', label: 'Paste' },
              { action: 'createAutoComment', label: 'Add Comment', enable: !0 },
              { action: 'deleteSelectedObjects', label: 'Delete' },
              {
                action: 'arrangeHorizontally',
                label: 'Arrange Horizontally',
                enable: !this.state.emptyPipeline
              },
              {
                action: 'arrangeVertically',
                label: 'Arrange Vertically',
                enable: !this.state.emptyPipeline
              }
            ],
            r = {
              actionHandler: this.propertiesActionHandler,
              controllerHandler: this.propertiesControllerHandler,
              applyPropertyChanges: this.applyPropertyChanges,
              closePropertiesDialog: this.closePropertiesDialog
            },
            a = this.state.showPropertiesDialog
              ? g.createElement(
                  y.IntlProvider,
                  { key: 'IntlProvider2', locale: 'en', messages: P.messages },
                  g.createElement(d.CommonProperties, {
                    propertiesInfo: this.state.propertiesInfo,
                    propertiesConfig: {},
                    callbacks: r
                  })
                )
              : null;
          return g.createElement(
            'div',
            { style: { height: '100%' }, ref: this.node },
            e,
            g.createElement(
              y.IntlProvider,
              { key: 'IntlProvider1', locale: 'en', messages: P.messages },
              g.createElement(d.CommonCanvas, {
                canvasController: this.canvasController,
                contextMenuHandler: this.contextMenuHandler,
                clickActionHandler: this.clickActionHandler,
                editActionHandler: this.editActionHandler,
                beforeEditActionHandler: this.beforeEditActionHandler,
                tipHandler: this.tipHandler,
                toolbarConfig: o,
                config: t,
                notificationConfig: { enable: !1 },
                contextMenuConfig: {
                  enableCreateSupernodeNonContiguous: !0,
                  defaultMenuEntries: { saveToPalette: !1, createSupernode: !0 }
                }
              })
            ),
            a
          );
        }
        updateModel() {
          const e = this.canvasController.getPipelineFlow();
          this.widgetContext.model.fromString(JSON.stringify(e, null, 2)),
            this.setState({ emptyPipeline: I.default.isEmptyPipeline(e) });
        }
        initPropertiesInfo() {
          return a(this, void 0, void 0, function*() {
            const e = yield C.PipelineService.getRuntimeImages(),
              t = [];
            for (const n in e)
              t.push(n), (N.resources['runtime_image.' + n + '.label'] = e[n]);
            (N.parameters[1].enum = t),
              (this.propertiesInfo = { parameterDef: N, appData: { id: '' } });
          });
        }
        openPropertiesDialog(e) {
          console.log('Opening properties dialog');
          const t = e.targetObject.id,
            n = e.targetObject.app_data,
            i = JSON.parse(JSON.stringify(this.propertiesInfo));
          (i.appData.id = t),
            (i.parameterDef.current_parameters.filename = n.filename),
            (i.parameterDef.current_parameters.runtime_image = n.runtime_image),
            (i.parameterDef.current_parameters.outputs = n.outputs),
            (i.parameterDef.current_parameters.env_vars = n.env_vars),
            (i.parameterDef.current_parameters.dependencies = n.dependencies),
            (i.parameterDef.current_parameters.include_subdirectories =
              n.include_subdirectories),
            this.setState({
              showValidationError: !1,
              showPropertiesDialog: !0,
              propertiesInfo: i
            });
        }
        applyPropertyChanges(e, t) {
          console.log('Applying changes to properties');
          const n = this.canvasController.getPrimaryPipelineId();
          let i = this.canvasController.getNode(t.id, n);
          if (!i) {
            const e = this.canvasController.getSupernodes(n);
            for (const n of e)
              if (
                ((i = this.canvasController.getNode(
                  t.id,
                  n.subflow_ref.pipeline_id_ref
                )),
                i)
              )
                break;
          }
          const o = i.app_data;
          o.filename !== e.filename &&
            ((o.filename = e.filename),
            (i.label = s.basename(e.filename, s.extname(e.filename)))),
            (o.runtime_image = e.runtime_image),
            (o.outputs = e.outputs),
            (o.env_vars = e.env_vars),
            (o.dependencies = e.dependencies),
            (o.include_subdirectories = e.include_subdirectories),
            this.validateAllNodes(),
            this.updateModel();
        }
        closePropertiesDialog() {
          console.log('Closing properties dialog');
          const e = JSON.parse(JSON.stringify(this.propertiesInfo));
          this.setState({ showPropertiesDialog: !1, propertiesInfo: e });
        }
        propertiesControllerHandler(e) {
          this.propertiesController = e;
        }
        propertiesActionHandler(e, t, n) {
          const i = { name: n.parameter_ref },
            o = C.PipelineService.getWorkspaceRelativeNodePath(
              this.widgetContext.path,
              this.propertiesController.getPropertyValue('filename')
            );
          if ('browse_file' === e) {
            const e = s.extname(o);
            c.showBrowseFileDialog(
              this.browserFactory.defaultBrowser.model.manager,
              {
                startPath: s.dirname(o),
                filter: t => {
                  const n = s.extname(t.path);
                  return e === n;
                }
              }
            ).then(e => {
              e.button.accept &&
                e.value.length &&
                this.propertiesController.updatePropertyValue(
                  i,
                  C.PipelineService.getPipelineRelativeNodePath(
                    this.widgetContext.path,
                    e.value[0].path
                  )
                );
            });
          } else
            'add_dependencies' === e &&
              c
                .showBrowseFileDialog(
                  this.browserFactory.defaultBrowser.model.manager,
                  {
                    multiselect: !0,
                    includeDir: !0,
                    rootPath: s.dirname(o),
                    filter: e => e.path !== o
                  }
                )
                .then(e => {
                  if (e.button.accept && e.value.length) {
                    const t = new Set(
                      this.propertiesController.getPropertyValue(i)
                    );
                    e.value.forEach(e => {
                      t.add(e.path);
                    }),
                      this.propertiesController.updatePropertyValue(i, [...t]);
                  }
                });
        }
        contextMenuHandler(e, t) {
          let n = t;
          return (
            'node' === e.type &&
              (e.selectedObjectIds.length > 1
                ? (n = n.concat({ action: 'openFile', label: 'Open Files' }))
                : 'execution_node' == e.targetObject.type &&
                  (n = n.concat(
                    { action: 'openFile', label: 'Open File' },
                    { action: 'properties', label: 'Properties' }
                  ))),
            n
          );
        }
        clickActionHandler(e) {
          'DOUBLE_CLICK' === e.clickType &&
            'node' === e.objectType &&
            this.handleOpenFile(e.selectedObjectIds);
        }
        nodesConnected(e, t, n) {
          if (n.find((n, i) => n.srcNodeId == e && n.trgNodeId == t)) return !0;
          for (const i of n)
            if (i.srcNodeId == e && this.nodesConnected(i.trgNodeId, t, n))
              return !0;
          return !1;
        }
        beforeEditActionHandler(e) {
          return 'linkNodes' == e.editType &&
            this.nodesConnected(
              e.targetNodes[0].id,
              e.nodes[0].id,
              this.canvasController.getLinks()
            )
            ? (this.setState({
                validationError: {
                  errorMessage:
                    'Invalid operation: circular references in pipeline.',
                  errorSeverity: 'error'
                },
                showValidationError: !0
              }),
              null)
            : e;
        }
        editActionHandler(e) {
          if ((this.setState({ showValidationError: !1 }), e && e.editType))
            switch (
              (console.log('Handling action: ' + e.editType), e.editType)
            ) {
              case 'run':
                this.handleRunPipeline();
                break;
              case 'export':
                this.handleExportPipeline();
                break;
              case 'save':
                this.handleSavePipeline();
                break;
              case 'clear':
                this.handleClearPipeline(e);
                break;
              case 'openRuntimes':
                this.handleOpenRuntimes();
                break;
              case 'openFile':
                'node' === e.type && this.handleOpenFile(e.selectedObjectIds);
                break;
              case 'properties':
                'node' === e.type &&
                  (this.state.showPropertiesDialog
                    ? this.closePropertiesDialog()
                    : this.openPropertiesDialog(e));
            }
          this.validateAllLinks(), this.updateModel();
        }
        tipHandler(e, t) {
          if ('tipTypeNode' === e) {
            const e = t.node.app_data,
              n = this.propertiesInfo.parameterDef.uihints.parameter_info,
              i = {};
            return (
              null != e &&
                null != e.invalidNodeError &&
                (i.Error = e.invalidNodeError),
              'execution_node' == t.node.type &&
                n.forEach(t => {
                  i[t.label.default] = e[t.parameter_ref] || '';
                }),
              g.createElement(O, Object.assign({}, i))
            );
          }
        }
        handleAddFileToPipelineCanvas(e, t) {
          if (this.shell.currentWidget.id !== this.widgetId) return;
          let n = 0,
            i = 0;
          const o = !(e && t);
          o && ((i = this.position), (e = 75), (t = 85));
          const r = this.browserFactory.defaultBrowser;
          return (
            m.toArray(r.selectedItems()).map(o => {
              if (this.canvasManager.isSupportedNode(o)) {
                let n;
                if ('notebook' == o.type) {
                  const e = r.model.manager.open(o.path);
                  (n = e.content.model.toString()), e.dispose();
                }
                this.canvasManager.addNode(o, n, e + i, t + i) &&
                  ((i += 20), this.setState({ showValidationError: !1 }));
              } else n++;
            }),
            o && (this.position = i),
            n
              ? p.showDialog({
                  title: 'Unsupported File(s)',
                  body:
                    'Currently, only selected notebook files can be added to a pipeline',
                  buttons: [p.Dialog.okButton()]
                })
              : void 0
          );
        }
        handleOpenFile(e) {
          for (let n = 0; n < e.length; n++) {
            const i = C.PipelineService.getWorkspaceRelativeNodePath(
              this.widgetContext.path,
              this.canvasController.getNode(e[n]).app_data.filename
            );
            this.commands.execute(t.commandIDs.openDocManager, { path: i });
          }
        }
        handleExportPipeline() {
          return a(this, void 0, void 0, function*() {
            const e = yield this.validatePipeline();
            if (e)
              return void this.setState({
                showValidationError: !0,
                validationError: { errorMessage: e, errorSeverity: 'error' }
              });
            const t = yield C.PipelineService.getRuntimes(),
              n = {
                title: 'Export pipeline',
                body: E.formDialogWidget(
                  g.createElement(k.PipelineExportDialog, { runtimes: t })
                ),
                buttons: [p.Dialog.cancelButton(), p.Dialog.okButton()],
                defaultButton: 1,
                focusNodeSelector: '#runtime_config'
              },
              i = yield c.showFormDialog(n);
            if (null == i.value) return;
            const o = this.canvasController.getPipelineFlow(),
              r = this.widgetContext.path,
              a = s.dirname(r),
              l = s.basename(r, s.extname(r)),
              d = i.value.pipeline_filetype,
              u = a + '/' + l + '.' + d,
              m = i.value.overwrite,
              h = i.value.runtime_config,
              f = C.PipelineService.getRuntimeName(h, t);
            C.PipelineService.setNodePathsRelativeToWorkspace(
              o.pipelines[0],
              this.widgetContext.path
            ),
              (o.pipelines[0].app_data.name = l),
              (o.pipelines[0].app_data.runtime = f),
              (o.pipelines[0].app_data['runtime-config'] = h),
              C.PipelineService.exportPipeline(o, d, u, m);
          });
        }
        handleOpenPipeline() {
          return a(this, void 0, void 0, function*() {
            this.widgetContext.ready.then(() =>
              a(this, void 0, void 0, function*() {
                let e = this.widgetContext.model.toJSON();
                if (null == e)
                  (e = this.canvasController.getPipelineFlow()),
                    I.default.isEmptyPipeline(e) &&
                      ((e.pipelines[0].app_data.version =
                        x.PIPELINE_CURRENT_VERSION),
                      this.canvasController.setPipelineFlow(e));
                else {
                  const t = +I.default.getPipelineVersion(e);
                  t !== x.PIPELINE_CURRENT_VERSION
                    ? t > x.PIPELINE_CURRENT_VERSION
                      ? p
                          .showDialog({
                            title: 'Load pipeline failed!',
                            body: g.createElement(
                              'p',
                              null,
                              'This pipeline corresponds to a more recent version of Elyra and cannot be used until Elyra has been upgraded.'
                            ),
                            buttons: [p.Dialog.okButton()]
                          })
                          .then(() => {
                            this.handleClosePipeline();
                          })
                      : p
                          .showDialog({
                            title: 'Migrate pipeline?',
                            body: g.createElement(
                              'p',
                              null,
                              'This pipeline corresponds to an older version of Elyra and needs to be migrated.',
                              g.createElement('br', null),
                              'Although the pipeline can be further edited and/or submitted after its update,',
                              g.createElement('br', null),
                              'the migration will not be completed until the pipeline has been saved within the editor.',
                              g.createElement('br', null),
                              g.createElement('br', null),
                              'Proceed with migration?'
                            ),
                            buttons: [
                              p.Dialog.cancelButton(),
                              p.Dialog.okButton()
                            ]
                          })
                          .then(t => {
                            t.button.accept
                              ? ((e = C.PipelineService.convertPipeline(
                                  e,
                                  this.widgetContext.path
                                )),
                                this.setAndVerifyPipelineFlow(e))
                              : this.handleClosePipeline();
                          })
                    : yield this.setAndVerifyPipelineFlow(e);
                }
              })
            );
          });
        }
        setAndVerifyPipelineFlow(e) {
          return a(this, void 0, void 0, function*() {
            this.canvasController.setPipelineFlow(e);
            const t = yield this.validatePipeline();
            t
              ? this.setState({
                  emptyPipeline: I.default.isEmptyPipeline(e),
                  showValidationError: !0,
                  validationError: { errorMessage: t, errorSeverity: 'error' }
                })
              : this.setState({
                  emptyPipeline: I.default.isEmptyPipeline(e),
                  showValidationError: !1
                });
          });
        }
        validateNode(e, t) {
          return a(this, void 0, void 0, function*() {
            let n,
              i,
              o = !0;
            if ('super_node' == e.type) {
              for (const t of this.canvasController.getNodes(
                e.subflow_ref.pipeline_id_ref
              ))
                o =
                  (yield this.validateNode(t, e.subflow_ref.pipeline_id_ref)) &&
                  o;
              o
                ? (e.app_data.invalidNodeError = null)
                : (e.app_data || (e.app_data = {}),
                  (e.app_data.invalidNodeError =
                    'Supernode contains invalid nodes.')),
                (n = 15),
                (i = 0);
            } else {
              if ('execution_node' != e.type) return !0;
              (e.app_data.invalidNodeError = yield this.validateProperties(e)),
                (n = 20),
                (i = 3);
            }
            if (null != e.app_data && null != e.app_data.invalidNodeError) {
              this.canvasController.setNodeDecorations(
                e.id,
                [
                  {
                    id: 'error',
                    image: c.IconUtil.encode(c.errorIcon),
                    outline: !1,
                    position: 'topLeft',
                    x_pos: n,
                    y_pos: i
                  }
                ],
                t
              );
              const o = {};
              o[t] = [e.id];
              const r = {
                body: { default: 'stroke: var(--jp-error-color1);' },
                selection_outline: {
                  default: 'stroke: var(--jp-error-color1);'
                },
                label: { default: 'fill: var(--jp-error-color1);' }
              };
              return this.canvasController.setObjectsStyle(o, r, !0), !1;
            }
            {
              const n = {};
              n[t] = [e.id];
              const i = {
                body: { default: '' },
                selection_outline: { default: '' },
                label: { default: '' }
              };
              return (
                this.canvasController.setObjectsStyle(n, i, !0),
                this.canvasController.setNodeDecorations(e.id, [], t),
                !0
              );
            }
          });
        }
        validateProperties(e) {
          return a(this, void 0, void 0, function*() {
            const t = [],
              n = yield this.serviceManager.contents
                .get(
                  C.PipelineService.getWorkspaceRelativeNodePath(
                    this.widgetContext.path,
                    e.app_data.filename
                  )
                )
                .then(e => null)
                .catch(e => 'notebook does not exist');
            return (
              n && t.push(n),
              (null != e.app_data.runtime_image &&
                '' != e.app_data.runtime_image) ||
                t.push('no runtime image'),
              0 == t.length ? null : t.join('\n')
            );
          });
        }
        validateAllNodes() {
          return a(this, void 0, void 0, function*() {
            let e = null;
            const t = this.canvasController.getPrimaryPipelineId();
            for (const n of this.canvasController.getNodes(t))
              (yield this.validateNode(n, t)) ||
                (e = 'Some nodes have missing or invalid properties. ');
            return e;
          });
        }
        validateAllLinks() {
          let e = null;
          const t = this.canvasController.getLinks();
          for (const n of t)
            if (this.nodesConnected(n.trgNodeId, n.srcNodeId, t)) {
              e = 'Circular references in pipeline. ';
              const t = {};
              t[this.canvasController.getPrimaryPipelineId()] = [n.id];
              const i = {
                line: {
                  default:
                    'stroke-dasharray: 13; stroke: var(--jp-error-color1);'
                }
              };
              this.canvasController.setLinksStyle(t, i, !0);
            } else {
              const e = {};
              e[this.canvasController.getPrimaryPipelineId()] = [n.id];
              const t = { line: { default: '' } };
              this.canvasController.setLinksStyle(e, t, !0);
            }
          return e;
        }
        validatePipeline() {
          return a(this, void 0, void 0, function*() {
            const e = yield this.validateAllNodes(),
              t = this.validateAllLinks();
            return e || t
              ? 'Invalid pipeline: ' +
                  (null == e ? '' : e) +
                  (null == t ? '' : t)
              : null;
          });
        }
        handleRunPipeline() {
          return a(this, void 0, void 0, function*() {
            const e = yield this.validatePipeline();
            if (e)
              return void this.setState({
                showValidationError: !0,
                validationError: { errorMessage: e, errorSeverity: 'error' }
              });
            const t = s.basename(
                this.widgetContext.path,
                s.extname(this.widgetContext.path)
              ),
              n = yield C.PipelineService.getRuntimes(!1);
            n.unshift(
              JSON.parse(
                JSON.stringify({
                  name: 'local',
                  display_name: 'Run in-place locally'
                })
              )
            );
            const i = {
                title: 'Run pipeline',
                body: E.formDialogWidget(
                  g.createElement(S.PipelineSubmissionDialog, {
                    name: t,
                    runtimes: n
                  })
                ),
                buttons: [p.Dialog.cancelButton(), p.Dialog.okButton()],
                defaultButton: 1,
                focusNodeSelector: '#pipeline_name'
              },
              o = yield c.showFormDialog(i);
            if (null == o.value) return;
            const r = this.canvasController.getPipelineFlow(),
              a = o.value.runtime_config,
              l = C.PipelineService.getRuntimeName(a, n) || 'local';
            C.PipelineService.setNodePathsRelativeToWorkspace(
              r.pipelines[0],
              this.widgetContext.path
            ),
              (r.pipelines[0].app_data.name = o.value.pipeline_name),
              (r.pipelines[0].app_data.runtime = l),
              (r.pipelines[0].app_data['runtime-config'] = a),
              C.PipelineService.submitPipeline(
                r,
                C.PipelineService.getDisplayName(o.value.runtime_config, n)
              );
          });
        }
        handleSavePipeline() {
          this.updateModel(), this.widgetContext.save();
        }
        handleClearPipeline(e) {
          return p
            .showDialog({
              title: 'Clear Pipeline',
              body: 'Are you sure you want to clear the pipeline?',
              buttons: [
                p.Dialog.cancelButton(),
                p.Dialog.okButton({ label: 'Clear' })
              ]
            })
            .then(t => {
              t.button.accept &&
                (this.canvasController.selectAll(),
                this.canvasController.editActionHandler({
                  editType: 'deleteSelectedObjects',
                  editSource: e.editSource,
                  pipelineId: e.pipelineId
                }));
            });
        }
        handleOpenRuntimes() {
          this.shell.activateById(
            `elyra-metadata:${C.RUNTIMES_NAMESPACE}:${C.KFP_SCHEMA}`
          );
        }
        handleClosePipeline() {
          this.shell.currentWidget && this.shell.currentWidget.close();
        }
        componentDidMount() {
          const e = this.node.current;
          e.addEventListener('dragenter', this.handleEvent),
            e.addEventListener('dragover', this.handleEvent),
            e.addEventListener('lm-dragenter', this.handleEvent),
            e.addEventListener('lm-dragover', this.handleEvent),
            e.addEventListener('lm-drop', this.handleEvent),
            this.initPropertiesInfo().finally(() => {
              this.handleOpenPipeline();
            });
        }
        componentWillUnmount() {
          const e = this.node.current;
          e.removeEventListener('lm-drop', this.handleEvent),
            e.removeEventListener('lm-dragover', this.handleEvent),
            e.removeEventListener('lm-dragenter', this.handleEvent),
            e.removeEventListener('dragover', this.handleEvent),
            e.removeEventListener('dragenter', this.handleEvent);
        }
        handleEvent(e) {
          switch (e.type) {
            case 'dragenter':
            case 'dragover':
            case 'lm-dragenter':
              e.preventDefault();
              break;
            case 'lm-dragover':
              e.preventDefault(),
                e.stopPropagation(),
                (e.dropAction = e.proposedAction);
              break;
            case 'lm-drop':
              e.preventDefault(),
                e.stopPropagation(),
                this.handleAddFileToPipelineCanvas(e.offsetX, e.offsetY);
          }
        }
      }
      t.PipelineEditor = D;
      class A extends u.ABCWidgetFactory {
        constructor(e) {
          super(e),
            (this.shell = e.shell),
            (this.commands = e.commands),
            (this.browserFactory = e.browserFactory),
            (this.serviceManager = e.serviceManager),
            (this.addFileToPipelineSignal = new h.Signal(this));
        }
        createNewWidget(e) {
          const t = {
              shell: this.shell,
              commands: this.commands,
              browserFactory: this.browserFactory,
              context: e,
              addFileToPipelineSignal: this.addFileToPipelineSignal,
              serviceManager: this.serviceManager
            },
            n = new M(t),
            i = new u.DocumentWidget({
              content: n,
              context: e,
              node: document.createElement('div')
            });
          return (
            i.addClass('elyra-PipelineEditor'),
            (i.title.icon = c.pipelineIcon),
            i
          );
        }
      }
      t.PipelineEditorFactory = A;
    },
    8565: function(e, t, n) {
      'use strict';
      var i =
          (this && this.__createBinding) ||
          (Object.create
            ? function(e, t, n, i) {
                void 0 === i && (i = n),
                  Object.defineProperty(e, i, {
                    enumerable: !0,
                    get: function() {
                      return t[n];
                    }
                  });
              }
            : function(e, t, n, i) {
                void 0 === i && (i = n), (e[i] = t[n]);
              }),
        o =
          (this && this.__setModuleDefault) ||
          (Object.create
            ? function(e, t) {
                Object.defineProperty(e, 'default', {
                  enumerable: !0,
                  value: t
                });
              }
            : function(e, t) {
                e.default = t;
              }),
        r =
          (this && this.__importStar) ||
          function(e) {
            if (e && e.__esModule) return e;
            var t = {};
            if (null != e)
              for (var n in e)
                'default' !== n &&
                  Object.prototype.hasOwnProperty.call(e, n) &&
                  i(t, e, n);
            return o(t, e), t;
          };
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.PipelineExportDialog = void 0);
      const a = r(n(2959)),
        l = [
          {
            label: 'KFP static configuration file (YAML formatted)',
            key: 'yaml'
          },
          { label: 'KFP domain-specific language Python code', key: 'py' }
        ];
      class s extends a.Component {
        render() {
          const { runtimes: e } = this.props;
          return a.createElement(
            'form',
            null,
            a.createElement(
              'label',
              { htmlFor: 'runtime_config' },
              'Runtime Config:'
            ),
            a.createElement('br', null),
            a.createElement(
              'select',
              {
                id: 'runtime_config',
                name: 'runtime_config',
                className: 'elyra-form-runtime-config',
                'data-form-required': !0
              },
              e.map(e =>
                a.createElement(
                  'option',
                  { key: e.name, value: e.name },
                  e.display_name
                )
              )
            ),
            a.createElement(
              'label',
              { htmlFor: 'pipeline_filetype' },
              'Export Pipeline as:'
            ),
            a.createElement('br', null),
            a.createElement(
              'select',
              {
                id: 'pipeline_filetype',
                name: 'pipeline_filetype',
                className: 'elyra-form-export-filetype',
                'data-form-required': !0
              },
              l.map(e =>
                a.createElement('option', { key: e.key, value: e.key }, e.label)
              )
            ),
            a.createElement('input', {
              type: 'checkbox',
              id: 'overwrite',
              name: 'overwrite'
            }),
            a.createElement(
              'label',
              { htmlFor: 'overwrite' },
              'Replace if file already exists'
            ),
            a.createElement('br', null)
          );
        }
      }
      t.PipelineExportDialog = s;
    },
    2430: function(e, t, n) {
      'use strict';
      var i =
          (this && this.__createBinding) ||
          (Object.create
            ? function(e, t, n, i) {
                void 0 === i && (i = n),
                  Object.defineProperty(e, i, {
                    enumerable: !0,
                    get: function() {
                      return t[n];
                    }
                  });
              }
            : function(e, t, n, i) {
                void 0 === i && (i = n), (e[i] = t[n]);
              }),
        o =
          (this && this.__setModuleDefault) ||
          (Object.create
            ? function(e, t) {
                Object.defineProperty(e, 'default', {
                  enumerable: !0,
                  value: t
                });
              }
            : function(e, t) {
                e.default = t;
              }),
        r =
          (this && this.__importStar) ||
          function(e) {
            if (e && e.__esModule) return e;
            var t = {};
            if (null != e)
              for (var n in e)
                'default' !== n &&
                  Object.prototype.hasOwnProperty.call(e, n) &&
                  i(t, e, n);
            return o(t, e), t;
          },
        a =
          (this && this.__awaiter) ||
          function(e, t, n, i) {
            return new (n || (n = Promise))(function(o, r) {
              function a(e) {
                try {
                  s(i.next(e));
                } catch (e) {
                  r(e);
                }
              }
              function l(e) {
                try {
                  s(i.throw(e));
                } catch (e) {
                  r(e);
                }
              }
              function s(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof n
                      ? t
                      : new n(function(e) {
                          e(t);
                        })).then(a, l);
              }
              s((i = i.apply(e, t || [])).next());
            });
          },
        l =
          (this && this.__importDefault) ||
          function(e) {
            return e && e.__esModule ? e : { default: e };
          };
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.PipelineService = t.RUNTIME_IMAGE_SCHEMA = t.RUNTIME_IMAGES_NAMESPACE = t.KFP_SCHEMA = t.RUNTIMES_NAMESPACE = void 0);
      const s = r(n(4371)),
        d = n(4205),
        c = n(4268),
        p = r(n(2959)),
        u = l(n(6988));
      (t.RUNTIMES_NAMESPACE = 'runtimes'),
        (t.KFP_SCHEMA = 'kfp'),
        (t.RUNTIME_IMAGES_NAMESPACE = 'runtime-images'),
        (t.RUNTIME_IMAGE_SCHEMA = 'runtime-image'),
        (t.PipelineService = class {
          static getRuntimes(e = !0) {
            return a(this, void 0, void 0, function*() {
              const t = yield d.FrontendServices.getMetadata('runtimes');
              return e && 0 === Object.keys(t).length
                ? d.FrontendServices.noMetadataError('runtimes')
                : t;
            });
          }
          static getRuntimeImages() {
            return a(this, void 0, void 0, function*() {
              const e = yield d.FrontendServices.getMetadata('runtime-images');
              if (0 === Object.keys(e).length)
                return d.FrontendServices.noMetadataError('runtime-images');
              const t = {};
              for (const n in e)
                t[e[n].metadata.image_name] = e[n].display_name;
              return t;
            });
          }
          static getDisplayName(e, t) {
            return t.find(t => t.name === e).display_name;
          }
          static getRuntimeName(e, t) {
            return t.find(t => t.name === e).schema_name;
          }
          static submitPipeline(e, t) {
            return a(this, void 0, void 0, function*() {
              const n = yield d.RequestHandler.makePostRequest(
                'elyra/pipeline/schedule',
                JSON.stringify(e),
                !0
              );
              let i, o;
              return (
                n.run_url
                  ? ((i = 'Job submission to ' + t + ' succeeded'),
                    (o = p.createElement(
                      'p',
                      null,
                      'Check the status of your job at',
                      ' ',
                      p.createElement(
                        'a',
                        {
                          href: n.run_url,
                          target: '_blank',
                          rel: 'noopener noreferrer'
                        },
                        'Run Details.'
                      ),
                      p.createElement('br', null),
                      'The results and outputs are in the ',
                      n.object_storage_path,
                      ' ',
                      'working directory in',
                      ' ',
                      p.createElement(
                        'a',
                        {
                          href: n.object_storage_url,
                          target: '_blank',
                          rel: 'noopener noreferrer'
                        },
                        'object storage'
                      ),
                      '.'
                    )))
                  : ((i = 'Job execution succeeded'),
                    (o = p.createElement(
                      'p',
                      null,
                      'Your job has been executed in-place in your local environment.'
                    ))),
                c.showDialog({
                  title: i,
                  body: o,
                  buttons: [c.Dialog.okButton()]
                })
              );
            });
          }
          static exportPipeline(e, t, n, i) {
            return a(this, void 0, void 0, function*() {
              console.log('Exporting pipeline to [' + t + '] format'),
                console.log('Overwriting existing file: ' + i);
              const o = {
                  pipeline: e,
                  export_format: t,
                  export_path: n,
                  overwrite: i
                },
                r = yield d.RequestHandler.makePostRequest(
                  'elyra/pipeline/export',
                  JSON.stringify(o),
                  !0
                );
              return c.showDialog({
                title: 'Pipeline export succeeded',
                body: p.createElement(
                  'p',
                  null,
                  'Exported file: ',
                  r.export_path,
                  ' '
                ),
                buttons: [c.Dialog.okButton()]
              });
            });
          }
          static convertPipeline(e, t) {
            let n = JSON.parse(JSON.stringify(e));
            const i = u.default.getPipelineVersion(n);
            return (
              i < 1 &&
                (console.info('Migrating pipeline to version 1.'),
                (n = this.convertPipelineV0toV1(n))),
              i < 2 &&
                (console.info('Migrating pipeline to version 2.'),
                (n = this.convertPipelineV1toV2(n, t))),
              i < 3 &&
                (console.info(
                  'Migrating pipeline to version 3 (current version).'
                ),
                (n = this.convertPipelineV2toV3(n, t))),
              n
            );
          }
          static convertPipelineV0toV1(e) {
            u.default.renamePipelineAppdataField(
              e.pipelines[0],
              'title',
              'name'
            ),
              u.default.deletePipelineAppdataField(e.pipelines[0], 'export'),
              u.default.deletePipelineAppdataField(
                e.pipelines[0],
                'export_format'
              ),
              u.default.deletePipelineAppdataField(
                e.pipelines[0],
                'export_path'
              );
            for (const t in e.pipelines[0].nodes) {
              const n = e.pipelines[0].nodes[t];
              u.default.renamePipelineAppdataField(n, 'artifact', 'filename'),
                u.default.renamePipelineAppdataField(
                  n,
                  'image',
                  'runtime_image'
                ),
                u.default.renamePipelineAppdataField(n, 'vars', 'env_vars'),
                u.default.renamePipelineAppdataField(
                  n,
                  'file_dependencies',
                  'dependencies'
                ),
                u.default.renamePipelineAppdataField(
                  n,
                  'recursive_dependencies',
                  'include_subdirectories'
                );
            }
            return (e.pipelines[0].app_data.version = 1), e;
          }
          static convertPipelineV1toV2(e, t) {
            return (
              (e.pipelines[0] = this.setNodePathsRelativeToPipeline(
                e.pipelines[0],
                t
              )),
              (e.pipelines[0].app_data.version = 2),
              e
            );
          }
          static convertPipelineV2toV3(e, t) {
            return (e.pipelines[0].app_data.version = 3), e;
          }
          static getPipelineRelativeNodePath(e, t) {
            return s.relative(s.dirname(e), t);
          }
          static getWorkspaceRelativeNodePath(e, t) {
            return s.resolve(s.dirname(e), t).substring(1);
          }
          static setNodePathsRelativeToPipeline(e, t) {
            for (const n of e.nodes)
              n.app_data.filename = this.getPipelineRelativeNodePath(
                t,
                n.app_data.filename
              );
            return e;
          }
          static setNodePathsRelativeToWorkspace(e, t) {
            for (const n of e.nodes)
              n.app_data.filename = this.getWorkspaceRelativeNodePath(
                t,
                n.app_data.filename
              );
            return e;
          }
        });
    },
    8425: function(e, t, n) {
      'use strict';
      var i =
          (this && this.__createBinding) ||
          (Object.create
            ? function(e, t, n, i) {
                void 0 === i && (i = n),
                  Object.defineProperty(e, i, {
                    enumerable: !0,
                    get: function() {
                      return t[n];
                    }
                  });
              }
            : function(e, t, n, i) {
                void 0 === i && (i = n), (e[i] = t[n]);
              }),
        o =
          (this && this.__setModuleDefault) ||
          (Object.create
            ? function(e, t) {
                Object.defineProperty(e, 'default', {
                  enumerable: !0,
                  value: t
                });
              }
            : function(e, t) {
                e.default = t;
              }),
        r =
          (this && this.__importStar) ||
          function(e) {
            if (e && e.__esModule) return e;
            var t = {};
            if (null != e)
              for (var n in e)
                'default' !== n &&
                  Object.prototype.hasOwnProperty.call(e, n) &&
                  i(t, e, n);
            return o(t, e), t;
          };
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.PipelineSubmissionDialog = void 0);
      const a = r(n(2959));
      class l extends a.Component {
        render() {
          const e = this.props.name,
            t = this.props.runtimes;
          return a.createElement(
            'form',
            null,
            a.createElement(
              'label',
              { htmlFor: 'pipeline_name' },
              'Pipeline Name:'
            ),
            a.createElement('br', null),
            a.createElement('input', {
              type: 'text',
              id: 'pipeline_name',
              name: 'pipeline_name',
              value: e,
              'data-form-required': !0
            }),
            a.createElement('br', null),
            a.createElement('br', null),
            a.createElement(
              'label',
              { htmlFor: 'runtime_config' },
              'Runtime Config:'
            ),
            a.createElement('br', null),
            a.createElement(
              'select',
              {
                id: 'runtime_config',
                name: 'runtime_config',
                className: 'elyra-form-runtime-config',
                'data-form-required': !0
              },
              t.map(e =>
                a.createElement(
                  'option',
                  { key: e.name, value: e.name },
                  e.display_name
                )
              )
            )
          );
        }
      }
      t.PipelineSubmissionDialog = l;
    },
    3823: function(e, t, n) {
      'use strict';
      var i =
          (this && this.__awaiter) ||
          function(e, t, n, i) {
            return new (n || (n = Promise))(function(o, r) {
              function a(e) {
                try {
                  s(i.next(e));
                } catch (e) {
                  r(e);
                }
              }
              function l(e) {
                try {
                  s(i.throw(e));
                } catch (e) {
                  r(e);
                }
              }
              function s(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof n
                      ? t
                      : new n(function(e) {
                          e(t);
                        })).then(a, l);
              }
              s((i = i.apply(e, t || [])).next());
            });
          },
        o =
          (this && this.__importDefault) ||
          function(e) {
            return e && e.__esModule ? e : { default: e };
          };
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.RuntimesWidget = void 0);
      const r = n(1708),
        a = o(n(2959)),
        l = n(2430);
      class s extends r.MetadataDisplay {
        renderExpandableContent(e) {
          const t = e.metadata.api_endpoint.endsWith('/')
            ? e.metadata.api_endpoint
            : e.metadata.api_endpoint + '/';
          return a.default.createElement(
            'div',
            null,
            a.default.createElement('h6', null, 'Kubeflow Pipelines UI'),
            a.default.createElement(
              'a',
              { href: t, target: '_blank', rel: 'noreferrer noopener' },
              t
            ),
            a.default.createElement('br', null),
            a.default.createElement('br', null),
            a.default.createElement('h6', null, 'Cloud Object Storage'),
            a.default.createElement(
              'a',
              {
                href: e.metadata.cos_endpoint,
                target: '_blank',
                rel: 'noreferrer noopener'
              },
              e.metadata.cos_endpoint
            )
          );
        }
      }
      class d extends r.MetadataWidget {
        constructor(e) {
          super(e);
        }
        fetchMetadata() {
          return i(this, void 0, void 0, function*() {
            return yield l.PipelineService.getRuntimes(!1);
          });
        }
        renderDisplay(e) {
          return a.default.createElement(s, {
            metadata: e,
            updateMetadata: this.updateMetadata,
            openMetadataEditor: this.openMetadataEditor,
            namespace: l.RUNTIMES_NAMESPACE,
            schema: l.KFP_SCHEMA,
            sortMetadata: !0
          });
        }
      }
      t.RuntimesWidget = d;
    },
    5278: function(e, t, n) {
      'use strict';
      var i =
          (this && this.__createBinding) ||
          (Object.create
            ? function(e, t, n, i) {
                void 0 === i && (i = n),
                  Object.defineProperty(e, i, {
                    enumerable: !0,
                    get: function() {
                      return t[n];
                    }
                  });
              }
            : function(e, t, n, i) {
                void 0 === i && (i = n), (e[i] = t[n]);
              }),
        o =
          (this && this.__setModuleDefault) ||
          (Object.create
            ? function(e, t) {
                Object.defineProperty(e, 'default', {
                  enumerable: !0,
                  value: t
                });
              }
            : function(e, t) {
                e.default = t;
              }),
        r =
          (this && this.__importStar) ||
          function(e) {
            if (e && e.__esModule) return e;
            var t = {};
            if (null != e)
              for (var n in e)
                'default' !== n &&
                  Object.prototype.hasOwnProperty.call(e, n) &&
                  i(t, e, n);
            return o(t, e), t;
          },
        a =
          (this && this.__awaiter) ||
          function(e, t, n, i) {
            return new (n || (n = Promise))(function(o, r) {
              function a(e) {
                try {
                  s(i.next(e));
                } catch (e) {
                  r(e);
                }
              }
              function l(e) {
                try {
                  s(i.throw(e));
                } catch (e) {
                  r(e);
                }
              }
              function s(e) {
                var t;
                e.done
                  ? o(e.value)
                  : ((t = e.value),
                    t instanceof n
                      ? t
                      : new n(function(e) {
                          e(t);
                        })).then(a, l);
              }
              s((i = i.apply(e, t || [])).next());
            });
          },
        l =
          (this && this.__rest) ||
          function(e, t) {
            var n = {};
            for (var i in e)
              Object.prototype.hasOwnProperty.call(e, i) &&
                t.indexOf(i) < 0 &&
                (n[i] = e[i]);
            if (
              null != e &&
              'function' == typeof Object.getOwnPropertySymbols
            ) {
              var o = 0;
              for (i = Object.getOwnPropertySymbols(e); o < i.length; o++)
                t.indexOf(i[o]) < 0 &&
                  Object.prototype.propertyIsEnumerable.call(e, i[o]) &&
                  (n[i[o]] = e[i[o]]);
            }
            return n;
          },
        s =
          (this && this.__importDefault) ||
          function(e) {
            return e && e.__esModule ? e : { default: e };
          };
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.SubmitNotebookButtonExtension = void 0);
      const d = n(4205),
        c = n(5216),
        p = n(4268),
        u = r(n(2959)),
        m = n(5342),
        h = n(4249),
        f = n(2430),
        b = s(n(6988));
      t.SubmitNotebookButtonExtension = class {
        constructor() {
          this.showWidget = () =>
            a(this, void 0, void 0, function*() {
              const e = d.NotebookParser.getEnvVars(
                  this.panel.content.model.toString()
                ),
                t = yield f.PipelineService.getRuntimes(),
                n = yield f.PipelineService.getRuntimeImages(),
                i = {
                  title: 'Submit notebook',
                  body: m.formDialogWidget(
                    u.createElement(h.NotebookSubmissionDialog, {
                      env: e,
                      runtimes: t,
                      images: n
                    })
                  ),
                  buttons: [p.Dialog.cancelButton(), p.Dialog.okButton()]
                },
                o = yield c.showFormDialog(i);
              if (null == o.value) return;
              const r = o.value,
                {
                  runtime_config: a,
                  framework: s,
                  dependency_include: v,
                  dependencies: g
                } = r,
                y = l(r, [
                  'runtime_config',
                  'framework',
                  'dependency_include',
                  'dependencies'
                ]),
                _ = b.default.generateNotebookPipeline(
                  this.panel.context.path,
                  a,
                  s,
                  v ? g : void 0,
                  y
                ),
                x = f.PipelineService.getDisplayName(a, t);
              f.PipelineService.submitPipeline(_, x);
            });
        }
        createNew(e, t) {
          this.panel = e;
          const n = new p.ToolbarButton({
            label: 'Submit Notebook ...',
            onClick: this.showWidget,
            tooltip: 'Submit Notebook ...'
          });
          return e.toolbar.insertItem(10, 'submitNotebook', n), n;
        }
      };
    },
    3857: function(e, t, n) {
      'use strict';
      var i =
          (this && this.__createBinding) ||
          (Object.create
            ? function(e, t, n, i) {
                void 0 === i && (i = n),
                  Object.defineProperty(e, i, {
                    enumerable: !0,
                    get: function() {
                      return t[n];
                    }
                  });
              }
            : function(e, t, n, i) {
                void 0 === i && (i = n), (e[i] = t[n]);
              }),
        o =
          (this && this.__setModuleDefault) ||
          (Object.create
            ? function(e, t) {
                Object.defineProperty(e, 'default', {
                  enumerable: !0,
                  value: t
                });
              }
            : function(e, t) {
                e.default = t;
              }),
        r =
          (this && this.__importStar) ||
          function(e) {
            if (e && e.__esModule) return e;
            var t = {};
            if (null != e)
              for (var n in e)
                'default' !== n &&
                  Object.prototype.hasOwnProperty.call(e, n) &&
                  i(t, e, n);
            return o(t, e), t;
          };
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.CanvasManager = void 0);
      const a = r(n(4371)),
        l = n(4205),
        s = n(5216),
        d = n(6455),
        c = n(2430);
      var p;
      !(function(e) {
        (e.notebook = 'notebook'), (e.python = 'python'), (e.other = 'other');
      })(p || (p = {}));
      const u = new Map([
          ['.py', p.python],
          ['.ipynb', p.notebook]
        ]),
        m = new Map([
          ['.py', d.pythonIcon],
          ['.ipynb', d.notebookIcon]
        ]);
      class h {
        constructor(e, t) {
          (this.widgetContext = e), (this.canvasController = t);
        }
        isSupportedNode(e) {
          return !!h.getNodeType(e.path);
        }
        addNode(e, t, n, i) {
          console.log('Adding ==> ' + e.path);
          const o = this.canvasController.getPaletteNode(
            h.getOperationName(e.path)
          );
          if (o) {
            const r = {
              editType: 'createNode',
              offsetX: n,
              offsetY: i,
              nodeTemplate: this.canvasController.convertNodeTemplate(o)
            };
            let d;
            return (
              h.getNodeType(e.path) == p.notebook &&
                (d = l.NotebookParser.getEnvVars(t).map(e => e + '=')),
              (r.nodeTemplate.label = a.basename(e.path)),
              (r.nodeTemplate.image = s.IconUtil.encode(h.getNodeIcon(e.path))),
              (r.nodeTemplate.app_data.filename = c.PipelineService.getPipelineRelativeNodePath(
                this.widgetContext.path,
                e.path
              )),
              (r.nodeTemplate.app_data.runtime_image = ''),
              (r.nodeTemplate.app_data.env_vars = d),
              (r.nodeTemplate.app_data.include_subdirectories = !1),
              this.canvasController.editActionHandler(r),
              !0
            );
          }
          return !1;
        }
        static getOperationName(e) {
          return `execute-${h.getNodeType(e)}-node`;
        }
        static getNodeIcon(e) {
          const t = a.extname(e);
          return m.get(t);
        }
        static getNodeType(e) {
          const t = a.extname(e);
          return u.get(t);
        }
      }
      t.CanvasManager = h;
    },
    5909: (e, t) => {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.PIPELINE_CURRENT_VERSION = void 0),
        (t.PIPELINE_CURRENT_VERSION = 3);
    },
    538: e => {
      'use strict';
      e.exports = JSON.parse(
        '{"messages":{"node-context.editNode":"Open","node-context.viewModel":"View Model","node-context.connectNode":"Connect","node-context.createSuperNode":"Create supernode","node-context.expandSuperNode":"Expand supernode","node-context.disconnectNode":"Disconnect","node-context.deleteNode":"Delete","node-context.editMenu":"Edit","node-context.executeNode":"Execute","node-context.previewNode":"Preview","edit-context.cutSelection":"Cut","edit-context.copySelection":"Copy","comment-context.deleteComment":"Delete","link-context.deleteLink":"Delete","canvas-context.addComment":"New comment","canvas-context.pasteClipboard":"Paste","canvas-context.selectAll":"Select all","canvas-context.streamProperties":"Options","canvas-context.undo":"Undo","canvas-context.redo":"Redo","dialog.nodePropertiesTitle":"Node Properties","subPanel.button.tooltip":"Edit","structureListEditor.addButton.label":"Add Value","structureListEditor.removeButton.tooltip":"Delete selected rows","structureListEditor.addButton.tooltip":"Add new row","expressionCell.controlLabel":"Expression","structureTable.addButton.label":"Add Columns","structureTable.addButton.tooltip":"Select columns to add","structureTable.removeButton.tooltip":"Remove selected columns","fieldPicker.saveButton.label":"Select Fields for","fieldPicker.saveButton.tooltip":"Save and return","fieldPicker.resetButton.label":"Reset ","fieldPicker.resetButton.tooltip":"Reset to previous values","fieldPicker.filter.label":"Filter:","fieldPicker.fieldColumn.label":"Field name","fieldPicker.dataTypeColumn.label":"Data type","flyout.applyButton.label":"OK","flyout.rejectButton.label":"Cancel","propertiesEdit.applyButton.label":"Save","propertiesEdit.rejectButton.label":"Cancel","table.search.placeholder":"Search in column","summary.longTable.placeholder":"More than ten fields...","alerts.tab.title":"Alerts","title.editor.label":"edit title","table.summary.error":"There are {errorMsgCount} error cells.","table.summary.warning":"There are {warningMsgCount} warning cells.","control.summary.error":"There are {errorMsgCount} parameters with errors.","control.summary.warning":"There are {warningMsgCount} parameters with warnings.","control.summary.error.warning":"There are {errorMsgCount} parameters with errors and {warningMsgCount} parameters with warnings.","required.error":"Required parameter \'{label}\' has no value.","datetime.format.error":"Invalid {role}. Format should be {format}.","invalid.field.error":"Invalid {label}, field not found in dataset.","expression.operators.label":"Operators","expression.validate.label":"Validate","expression.builder.title":"Expression Builder","expression.builder.label":"Expression","expression.fields.title":"Fields","expression.values.title":"Values","expression.field.column":"Field","expression.storage.column":"Storage","expression.value.column":"Value","expression.function.column":"Function","expression.return.column":"Return","expression.field.tab":"Fields and Values","expression.functions.tab":"Functions","expression.recently.used":"Recently Used","expression.all.functions":"All Functions","expression.min.label":"Min","expression.max.label":"Max","expression.no.functions":"No functions found.","multi.selected.row.label":"rows selected.","multi.selected.row.action":"Changing a value in this row will change the value in all allowed selected rows.","toolbar.zoomIn":"Zoom In","toolbar.zoomOut":"Zoom Out","toolbar.zoomToFit":"Zoom To Fit"}}'
      );
    },
    5342: (e, t, n) => {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.formDialogWidget = void 0);
      const i = n(4268),
        o = n(3211),
        r = n(2916);
      t.formDialogWidget = e => {
        const t = i.ReactWidget.create(e);
        return (
          o.MessageLoop.sendMessage(t, r.Widget.Msg.UpdateRequest),
          (t.getValue = () => {
            const e = t.node.querySelector('form'),
              n = {};
            for (const t of Object.values(e.elements))
              switch (t.type) {
                case 'checkbox':
                  n[t.name] = t.checked;
                  break;
                default:
                  n[t.name] = t.value;
              }
            return n;
          }),
          t
        );
      };
    },
    1568: (e, t, n) => {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: !0 });
      const i = n(5216),
        o = n(4922),
        r = n(4268),
        a = n(5875),
        l = n(1163),
        s = n(6011),
        d = n(6455),
        c = n(4347),
        p = n(2430),
        u = n(3823),
        m = n(5278);
      n(7283);
      const h = 'Pipeline Editor',
        f = 'pipeline',
        b = {
          id: f,
          autoStart: !0,
          requires: [
            r.ICommandPalette,
            l.ILauncher,
            a.IFileBrowserFactory,
            o.ILayoutRestorer,
            s.IMainMenu
          ],
          activate: (e, t, n, o, a, l) => {
            console.log('Elyra - pipeline-editor extension is activated!');
            const s = new c.PipelineEditorFactory({
              name: h,
              fileTypes: [f],
              defaultFor: [f],
              shell: e.shell,
              commands: e.commands,
              browserFactory: o,
              serviceManager: e.serviceManager
            });
            e.docRegistry.addFileType({
              name: f,
              extensions: ['.pipeline'],
              icon: i.pipelineIcon
            }),
              e.docRegistry.addWidgetFactory(s);
            const b = new r.WidgetTracker({
              namespace: 'elyra-pipeline-editor-extension'
            });
            s.widgetCreated.connect((e, t) => {
              b.add(t),
                t.context.pathChanged.connect(() => {
                  b.save(t);
                });
            }),
              a.restore(b, {
                command: c.commandIDs.openDocManager,
                args: e => ({ path: e.context.path, factory: h }),
                name: e => e.context.path
              });
            const v = c.commandIDs.addFileToPipeline;
            e.commands.addCommand(v, {
              label: 'Add File to Pipeline',
              icon: d.addIcon,
              execute: e => {
                s.addFileToPipelineSignal.emit(e);
              }
            }),
              e.contextMenu.addItem({
                selector: '[data-file-type="notebook"]',
                command: v
              });
            const g = c.commandIDs.openPipelineEditor;
            e.commands.addCommand(g, {
              label: e =>
                e.isPalette ? 'New Pipeline Editor' : 'Pipeline Editor',
              icon: e => (e.isPalette ? void 0 : i.pipelineIcon),
              execute: () => {
                e.commands
                  .execute(c.commandIDs.newDocManager, {
                    type: 'file',
                    path: o.defaultBrowser.model.path,
                    ext: '.pipeline'
                  })
                  .then(t =>
                    e.commands.execute(c.commandIDs.openDocManager, {
                      path: t.path,
                      factory: h
                    })
                  );
              }
            }),
              t.addItem({
                command: g,
                args: { isPalette: !0 },
                category: 'Elyra'
              }),
              n && n.add({ command: g, category: 'Elyra', rank: 1 }),
              l.fileMenu.newMenu.addGroup([{ command: g }], 30);
            const y = new m.SubmitNotebookButtonExtension();
            e.docRegistry.addWidgetExtension('Notebook', y),
              e.contextMenu.addItem({
                selector: '.jp-Notebook',
                command: c.commandIDs.submitNotebook,
                rank: -0.5
              });
            const _ = new u.RuntimesWidget({
                app: e,
                display_name: 'Runtimes',
                namespace: p.RUNTIMES_NAMESPACE,
                schema: p.KFP_SCHEMA,
                icon: i.runtimesIcon
              }),
              x = `elyra-metadata:${p.RUNTIMES_NAMESPACE}:${p.KFP_SCHEMA}`;
            (_.id = x),
              (_.title.icon = i.runtimesIcon),
              (_.title.caption = 'Runtimes'),
              a.add(_, x),
              e.shell.add(_, 'left', { rank: 950 });
          }
        };
      t.default = b;
    },
    1672: e => {
      'use strict';
      e.exports = JSON.parse(
        '{"version":"3.0","categories":[{"label":"Notebook","image":"","id":"notebooks","description":"Notebook Pipeline","node_types":[{"id":"","op":"execute-notebook-node","type":"execution_node","inputs":[{"id":"inPort","app_data":{"ui_data":{"cardinality":{"min":0,"max":-1},"label":"Input Port"}}}],"outputs":[{"id":"outPort","app_data":{"ui_data":{"cardinality":{"min":0,"max":-1},"label":"Output Port"}}}],"parameters":{},"app_data":{"ui_data":{"label":"Notebook","description":"Notebook file","image":"","x_pos":0,"y_pos":0}}}]},{"label":"Python Script","image":"","id":"python-script","description":"Python Script","node_types":[{"id":"","op":"execute-python-node","type":"execution_node","inputs":[{"id":"inPort","app_data":{"ui_data":{"cardinality":{"min":0,"max":-1},"label":"Input Port"}}}],"outputs":[{"id":"outPort","app_data":{"ui_data":{"cardinality":{"min":0,"max":-1},"label":"Output Port"}}}],"parameters":{},"app_data":{"ui_data":{"label":"Python","description":"Python Script","image":"","x_pos":0,"y_pos":0}}}]}]}'
      );
    },
    5534: e => {
      'use strict';
      e.exports = JSON.parse(
        '{"doc_type":"pipeline","version":"3.0","json_schema":"http://api.dataplatform.ibm.com/schemas/common-pipeline/pipeline-flow/pipeline-flow-v3-schema.json","id":"{{primary_pipeline_uuid}}","primary_pipeline":"{{primary_pipeline_uuid}}","pipelines":[{"id":"{{primary_pipeline_uuid}}","nodes":[{"id":"{{pipelines.node.uuid}}","type":"execution_node","op":"execute-notebook-node","app_data":{"filename":"{{filename}}","runtime_image":"{{runtime_image}}","outputs":[],"env_vars":[],"dependencies":[],"include_subdirectories":false}}],"app_data":{"name":"{{name}}","runtime":"{{runtime}}","runtime-config":"{{runtime-config}}","version":"{{version}}","ui_data":{"comments":[]}}}],"schemas":[]}'
      );
    },
    6679: e => {
      'use strict';
      e.exports = JSON.parse(
        '{"current_parameters":{"filename":"","runtime_image":"","outputs":[],"env_vars":[],"dependencies":[],"include_subdirectories":false},"parameters":[{"id":"filename","type":"string"},{"id":"runtime_image","enum":[]},{"id":"dependencies","type":"array[string]"},{"id":"include_subdirectories","type":"boolean"},{"id":"env_vars","type":"array[string]"},{"id":"outputs","type":"array[string]"}],"uihints":{"id":"nodeProperties","parameter_info":[{"parameter_ref":"filename","control":"readonly","label":{"default":"Filename"}},{"parameter_ref":"runtime_image","control":"oneofselect","label":{"default":"Runtime Image (docker image used as execution environment)"}},{"parameter_ref":"dependencies","label":{"default":"File Dependencies"},"place_holder_text":{"default":"Local file dependencies that need to be copied to remote execution environment.\\nOne filename or expression (e.g. *.py) per line. Supported patterns: ? and *."}},{"parameter_ref":"include_subdirectories","label":{"default":"Include Subdirectories in Dependencies (may increase submission time)"}},{"parameter_ref":"env_vars","label":{"default":"Environment Variables"},"place_holder_text":{"default":"Environment variables to be set on the execution environment.\\nOne variable per line in the format ENV_VAR=value."}},{"parameter_ref":"outputs","label":{"default":"Output Files"},"place_holder_text":{"default":"Files generated during execution that will become available to all subsequent pipeline steps.\\n One filename or expression (e.g. *.csv) per line. Supported patterns: ? and *."}}],"action_info":[{"id":"browse_file","label":{"default":"Browse..."},"control":"button","data":{"parameter_ref":"filename"}},{"id":"add_dependencies","label":{"default":"Add Dependencies..."},"control":"button","data":{"parameter_ref":"dependencies"}}],"group_info":[{"id":"nodeGroupInfo","label":{"default":"Node Properties"},"type":"panels","group_info":[{"id":"nodeFileControl","type":"controls","parameter_refs":["filename"]},{"id":"nodeBrowseFileAction","type":"actionPanel","action_refs":["browse_file"]},{"id":"nodeRuntimeImageControl","type":"controls","parameter_refs":["runtime_image"]},{"id":"nodeDependenciesControls","type":"panels","group_info":[{"id":"nodeAddDependenciesControl","type":"controls","parameter_refs":["dependencies"]},{"id":"nodeAddDependenciesAction","type":"actionPanel","action_refs":["add_dependencies"]}]},{"id":"nodePropertiesControls","type":"controls","parameter_refs":["include_subdirectories","env_vars","outputs"]}]}]},"resources":{}}'
      );
    },
    6988: function(e, t, n) {
      'use strict';
      var i =
          (this && this.__createBinding) ||
          (Object.create
            ? function(e, t, n, i) {
                void 0 === i && (i = n),
                  Object.defineProperty(e, i, {
                    enumerable: !0,
                    get: function() {
                      return t[n];
                    }
                  });
              }
            : function(e, t, n, i) {
                void 0 === i && (i = n), (e[i] = t[n]);
              }),
        o =
          (this && this.__setModuleDefault) ||
          (Object.create
            ? function(e, t) {
                Object.defineProperty(e, 'default', {
                  enumerable: !0,
                  value: t
                });
              }
            : function(e, t) {
                e.default = t;
              }),
        r =
          (this && this.__importStar) ||
          function(e) {
            if (e && e.__esModule) return e;
            var t = {};
            if (null != e)
              for (var n in e)
                'default' !== n &&
                  Object.prototype.hasOwnProperty.call(e, n) &&
                  i(t, e, n);
            return o(t, e), t;
          },
        a =
          (this && this.__importDefault) ||
          function(e) {
            return e && e.__esModule ? e : { default: e };
          };
      Object.defineProperty(t, '__esModule', { value: !0 });
      const l = r(n(4371)),
        s = a(n(6426)),
        d = n(5909),
        c = a(n(5534));
      class p {
        static getUUID() {
          return s.default();
        }
        static generateNotebookPipeline(e, t, n, i, o) {
          const r = JSON.parse(JSON.stringify(c.default)),
            a = p.getUUID(),
            s = l.basename(e, l.extname(e)),
            u = Object.entries(o).map(([e, t]) => `${e}=${t}`);
          return (
            (r.id = a),
            (r.primary_pipeline = a),
            (r.pipelines[0].id = a),
            (r.pipelines[0].nodes[0].id = a),
            (r.pipelines[0].nodes[0].app_data.filename = e),
            (r.pipelines[0].nodes[0].app_data.runtime_image = n),
            (r.pipelines[0].nodes[0].app_data.env_vars = u),
            (r.pipelines[0].nodes[0].app_data.dependencies = i),
            (r.pipelines[0].app_data.name = s),
            (r.pipelines[0].app_data.runtime = 'kfp'),
            (r.pipelines[0].app_data['runtime-config'] = t),
            (r.pipelines[0].app_data.version = d.PIPELINE_CURRENT_VERSION),
            r
          );
        }
        static isEmptyPipeline(e) {
          return 0 === Object.keys(e.pipelines[0].nodes).length;
        }
        static isEmptyCanvas(e) {
          return (
            this.isEmptyPipeline(e) &&
            0 === e.pipelines[0].app_data.ui_data.comments.length
          );
        }
        static getPipelineVersion(e) {
          let t = 0;
          return (
            e &&
              (t =
                +this.getPipelineAppdataField(e.pipelines[0], 'version') || 0),
            t
          );
        }
        static getPipelineAppdataField(e, t) {
          return this.hasPipelineAppdataField(e, t) ? e.app_data[t] : null;
        }
        static hasPipelineAppdataField(e, t) {
          return (
            Object.prototype.hasOwnProperty.call(e, 'app_data') &&
            Object.prototype.hasOwnProperty.call(e.app_data, t)
          );
        }
        static deletePipelineAppdataField(e, t) {
          this.hasPipelineAppdataField(e, t) && delete e.app_data[t];
        }
        static renamePipelineAppdataField(e, t, n) {
          this.hasPipelineAppdataField(e, t) &&
            ((e.app_data[n] = e.app_data[t]),
            this.deletePipelineAppdataField(e, t));
        }
        static chunkArray(e, t) {
          return Array.from(Array(Math.ceil(e.length / t)), (n, i) =>
            e.slice(i * t, i * t + t)
          );
        }
      }
      t.default = p;
    }
  }
]);
