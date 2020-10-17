(self.webpackChunk_elyra_python_editor_extension =
  self.webpackChunk_elyra_python_editor_extension || []).push([
  [639, 283],
  {
    599: (t, e, n) => {
      (t.exports = n(609)(!1)).push([
        t.id,
        '/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the "License");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an "AS IS" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n.elyra-PythonEditor-OutputArea-error {\n  background-color: var(--jp-rendermime-error-background);\n}\n\n.elyra-PythonEditor-OutputArea-child {\n  border-top: 1px solid var(--jp-border-color2);\n  border-bottom: 1px solid var(--jp-border-color2);\n}\n\n.elyra-PythonEditor-OutputArea-prompt {\n  flex: 0 0 37px;\n  border-right: 1px solid var(--jp-border-color2);\n  padding: unset;\n  text-align: center;\n}\n\n.elyra-PythonEditor-OutputArea-output {\n  padding: var(--jp-code-padding);\n  border: var(--jp-border-width) solid transparent;\n  margin-right: 64px;\n}\n\n.elyra-PythonEditor-scrollTop {\n  top: 33px;\n}\n\n.elyra-PythonEditor-scrollBottom {\n  top: 62px;\n}\n\n.elyra-PythonEditor-scrollBottom,\n.elyra-PythonEditor-scrollTop {\n  position: absolute;\n  right: 21px;\n  z-index: 1;\n  background-color: transparent;\n  width: 30px;\n  height: 30px;\n  border-width: 0px;\n  border-style: solid;\n  border-radius: 5px;\n}\n\nbutton.elyra-PythonEditor-scrollTop:hover {\n  background-color: var(--jp-layout-color2);\n}\n\nbutton.elyra-PythonEditor-scrollBottom:hover {\n  background-color: var(--jp-layout-color2);\n}\n\n.elyra-PythonEditor-scrollBottom g[fill],\n.elyra-PythonEditor-scrollTop g[fill] {\n  fill: var(--jp-inverse-layout-color3);\n}\n\n.jp-Document .jp-Toolbar.elyra-PythonEditor-Toolbar {\n  justify-content: flex-start;\n}\n',
        ''
      ]);
    },
    609: t => {
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
                  i = t[1] || '',
                  s = t[3];
                if (!s) return i;
                if (e && 'function' == typeof btoa) {
                  var a =
                      ((n = s),
                      (r = btoa(
                        unescape(encodeURIComponent(JSON.stringify(n)))
                      )),
                      (o = 'sourceMappingURL=data:application/json;charset=utf-8;base64,'.concat(
                        r
                      )),
                      '/*# '.concat(o, ' */')),
                    l = s.sources.map(function(t) {
                      return '/*# sourceURL='
                        .concat(s.sourceRoot)
                        .concat(t, ' */');
                    });
                  return [i]
                    .concat(l)
                    .concat([a])
                    .join('\n');
                }
                return [i].join('\n');
              })(e, t);
              return e[2] ? '@media '.concat(e[2], '{').concat(n, '}') : n;
            }).join('');
          }),
          (e.i = function(t, n) {
            'string' == typeof t && (t = [[null, t, '']]);
            for (var r = {}, o = 0; o < this.length; o++) {
              var i = this[o][0];
              null != i && (r[i] = !0);
            }
            for (var s = 0; s < t.length; s++) {
              var a = t[s];
              (null != a[0] && r[a[0]]) ||
                (n && !a[2]
                  ? (a[2] = n)
                  : n && (a[2] = '('.concat(a[2], ') and (').concat(n, ')')),
                e.push(a));
            }
          }),
          e
        );
      };
    },
    283: (t, e, n) => {
      var r = n(599);
      'string' == typeof r && (r = [[t.id, r, '']]);
      n(379)(r, { hmr: !0, transform: void 0, insertInto: void 0 }),
        r.locals && (t.exports = r.locals);
    },
    379: (t, e, n) => {
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
        a = function(t, e) {
          return e ? e.querySelector(t) : document.querySelector(t);
        },
        l = (function(t) {
          var e = {};
          return function(t, n) {
            if ('function' == typeof t) return t();
            if (void 0 === e[t]) {
              var r = a.call(this, t, n);
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
        c = null,
        d = 0,
        u = [],
        p = n(657);
      function h(t, e) {
        for (var n = 0; n < t.length; n++) {
          var r = t[n],
            o = i[r.id];
          if (o) {
            o.refs++;
            for (var s = 0; s < o.parts.length; s++) o.parts[s](r.parts[s]);
            for (; s < r.parts.length; s++) o.parts.push(v(r.parts[s], e));
          } else {
            var a = [];
            for (s = 0; s < r.parts.length; s++) a.push(v(r.parts[s], e));
            i[r.id] = { id: r.id, refs: 1, parts: a };
          }
        }
      }
      function y(t, e) {
        for (var n = [], r = {}, o = 0; o < t.length; o++) {
          var i = t[o],
            s = e.base ? i[0] + e.base : i[0],
            a = { css: i[1], media: i[2], sourceMap: i[3] };
          r[s] ? r[s].parts.push(a) : n.push((r[s] = { id: s, parts: [a] }));
        }
        return n;
      }
      function f(t, e) {
        var n = l(t.insertInto);
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
          var o = l(t.insertAt.before, n);
          n.insertBefore(e, o);
        }
      }
      function m(t) {
        if (null === t.parentNode) return !1;
        t.parentNode.removeChild(t);
        var e = u.indexOf(t);
        e >= 0 && u.splice(e, 1);
      }
      function g(t) {
        var e = document.createElement('style');
        if (
          (void 0 === t.attrs.type && (t.attrs.type = 'text/css'),
          void 0 === t.attrs.nonce)
        ) {
          var r = n.nc;
          r && (t.attrs.nonce = r);
        }
        return b(e, t.attrs), f(t, e), e;
      }
      function b(t, e) {
        Object.keys(e).forEach(function(n) {
          t.setAttribute(n, e[n]);
        });
      }
      function v(t, e) {
        var n, r, o, i;
        if (e.transform && t.css) {
          if (
            !(i =
              'function' == typeof e.transform
                ? e.transform(t.css)
                : e.transform.default(t.css))
          )
            return function() {};
          t.css = i;
        }
        if (e.singleton) {
          var s = d++;
          (n = c || (c = g(e))),
            (r = x.bind(null, n, s, !1)),
            (o = x.bind(null, n, s, !0));
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
                  b(e, t.attrs),
                  f(t, e),
                  e
                );
              })(e)),
              (r = E.bind(null, n, e)),
              (o = function() {
                m(n), n.href && URL.revokeObjectURL(n.href);
              }))
            : ((n = g(e)),
              (r = k.bind(null, n)),
              (o = function() {
                m(n);
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
          e.singleton || 'boolean' == typeof e.singleton || (e.singleton = s()),
          e.insertInto || (e.insertInto = 'head'),
          e.insertAt || (e.insertAt = 'bottom');
        var n = y(t, e);
        return (
          h(n, e),
          function(t) {
            for (var r = [], o = 0; o < n.length; o++) {
              var s = n[o];
              (a = i[s.id]).refs--, r.push(a);
            }
            for (t && h(y(t, e), e), o = 0; o < r.length; o++) {
              var a;
              if (0 === (a = r[o]).refs) {
                for (var l = 0; l < a.parts.length; l++) a.parts[l]();
                delete i[a.id];
              }
            }
          }
        );
      };
      var w,
        O =
          ((w = []),
          function(t, e) {
            return (w[t] = e), w.filter(Boolean).join('\n');
          });
      function x(t, e, n, r) {
        var o = n ? '' : r.css;
        if (t.styleSheet) t.styleSheet.cssText = O(e, o);
        else {
          var i = document.createTextNode(o),
            s = t.childNodes;
          s[e] && t.removeChild(s[e]),
            s.length ? t.insertBefore(i, s[e]) : t.appendChild(i);
        }
      }
      function k(t, e) {
        var n = e.css,
          r = e.media;
        if ((r && t.setAttribute('media', r), t.styleSheet))
          t.styleSheet.cssText = n;
        else {
          for (; t.firstChild; ) t.removeChild(t.firstChild);
          t.appendChild(document.createTextNode(n));
        }
      }
      function E(t, e, n) {
        var r = n.css,
          o = n.sourceMap,
          i = void 0 === e.convertToAbsoluteUrls && o;
        (e.convertToAbsoluteUrls || i) && (r = p(r)),
          o &&
            (r +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(o)))) +
              ' */');
        var s = new Blob([r], { type: 'text/css' }),
          a = t.href;
        (t.href = URL.createObjectURL(s)), a && URL.revokeObjectURL(a);
      }
    },
    657: t => {
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
              i = e
                .trim()
                .replace(/^"(.*)"$/, function(t, e) {
                  return e;
                })
                .replace(/^'(.*)'$/, function(t, e) {
                  return e;
                });
            return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(i)
              ? t
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
    },
    639: (t, e, n) => {
      'use strict';
      n.r(e), n.d(e, { default: () => R }), n(283);
      var r = n(922),
        o = n(268),
        i = n(266),
        s = n(875),
        a = n(899),
        l = n(163),
        c = n(11),
        d = n(729),
        u = n(455),
        p = n(228),
        h = n(628),
        y = n(101),
        f = n(941),
        m = n(916),
        g = n(959),
        b = n.n(g);
      class v extends b().Component {
        constructor(t) {
          super(t),
            (this.filterPythonKernels = t => {
              Object.entries(t.kernelspecs)
                .filter(t => !1 === t[1].language.includes('python'))
                .forEach(e => delete t.kernelspecs[e[0]]);
            }),
            (this.createOptionElems = t => {
              Object.keys(t.kernelspecs).forEach((t, e) => {
                const n = b().createElement('option', { key: e, value: t }, t);
                this.kernelOptionElems.push(n);
              });
            }),
            (this.handleSelection = t => {
              const e = t.target.value;
              this.updateKernel(e);
            }),
            (this.state = { kernelSpecs: null }),
            (this.updateKernel = this.props.updateKernel),
            (this.kernelOptionElems = []),
            this.getKernelSPecs();
        }
        async getKernelSPecs() {
          const t = await this.props.runner.getKernelSpecs();
          this.filterPythonKernels(t),
            this.updateKernel(t.default),
            this.createOptionElems(t),
            this.setState({ kernelSpecs: t });
        }
        render() {
          return this.state.kernelSpecs
            ? b().createElement(
                u.HTMLSelect,
                {
                  className: 'jp-Notebook-toolbarCellTypeDropdown bp3-minimal',
                  onChange: this.handleSelection.bind(this),
                  defaultValue: this.state.kernelSpecs.default
                },
                this.kernelOptionElems
              )
            : b().createElement('span', null, 'Fetching kernel specs...');
        }
      }
      class w extends o.ReactWidget {
        constructor(t, e) {
          super(), (this.runner = t), (this.updateKernel = e);
        }
        render() {
          return b().createElement(
            v,
            Object.assign(
              {},
              { runner: this.runner, updateKernel: this.updateKernel }
            )
          );
        }
      }
      var O = n(526);
      class x {
        constructor(t, e) {
          (this.errorDialog = t => (
            this.disableRun(!1),
            (0, o.showDialog)({
              title: 'Error',
              body: t,
              buttons: [o.Dialog.okButton()]
            })
          )),
            (this.runPython = async (t, e) => {
              if (!this.kernel) {
                this.disableRun(!0);
                const n = this.model.value.text;
                try {
                  this.kernel = await this.kernelManager.startNew({ name: t });
                } catch (t) {
                  return this.errorDialog(
                    'Could not start kernel environment to execute script.'
                  );
                }
                if (!this.kernel)
                  return this.errorDialog(
                    'Failed to start kernel environment to execute script.'
                  );
                const r = this.kernel.requestExecute({ code: n });
                r.onIOPub = t => {
                  const n = {};
                  'error' === t.msg_type
                    ? (n.error = {
                        type: t.content.ename,
                        output: t.content.evalue
                      })
                    : 'execute_result' === t.msg_type
                    ? 'text/plain' in t.content.data
                      ? (n.output = t.content.data['text/plain'])
                      : console.log('Ignoring received message ' + t)
                    : 'stream' === t.msg_type
                    ? (n.output = t.content.text)
                    : 'status' === t.msg_type &&
                      (n.status = t.content.execution_state),
                    e(n);
                };
                try {
                  await r.done, this.shutDownKernel();
                } catch (t) {
                  console.log('Exception: done = ' + JSON.stringify(t));
                }
              }
            }),
            (this.getKernelSpecs = async () => (
              await this.kernelSpecManager.ready,
              await this.kernelSpecManager.specs
            )),
            (this.startKernel = async t => this.kernelManager.startNew(t)),
            (this.shutDownKernel = async () => {
              if (this.kernel) {
                const t = this.kernel.name;
                try {
                  const e = this.kernel;
                  (this.kernel = null),
                    this.disableRun(!1),
                    await e.shutdown(),
                    console.log(t + ' kernel shut down');
                } catch (t) {
                  console.log('Exception: shutdown = ' + JSON.stringify(t));
                }
              }
            }),
            (this.kernelSpecManager = new O.KernelSpecManager()),
            (this.kernelManager = new O.KernelManager()),
            (this.kernel = null),
            (this.model = t),
            (this.disableRun = e);
        }
      }
      const k = 'elyra-PythonEditor-OutputArea-error',
        E = 'elyra-PythonEditor-Run';
      class P extends p.DocumentWidget {
        constructor(t) {
          super(t),
            (this.createOutputAreaWidget = () => {
              (this.dockPanel = new u.DockPanelSvg({ tabsMovable: !1 })),
                m.Widget.attach(this.dockPanel, document.body),
                window.addEventListener('resize', () => {
                  this.dockPanel.fit();
                });
              const t = new y.OutputAreaModel(),
                e = new f.RenderMimeRegistry({
                  initialFactories: f.standardRendererFactories
                });
              (this.outputAreaWidget = new y.OutputArea({
                rendermime: e,
                model: t
              })),
                this.outputAreaWidget.addClass('elyra-PythonEditor-OutputArea'),
                this.layout.addWidget(this.dockPanel);
            }),
            (this.updateSelectedKernel = t => {
              this.kernelName = t;
            }),
            (this.runPython = async () => {
              this.runDisabled ||
                (this.resetOutputArea(),
                this.displayOutputArea(),
                this.runner.runPython(this.kernelName, this.handleKernelMsg));
            }),
            (this.stopRun = async () => {
              this.runner.shutDownKernel(),
                this.dockPanel.isEmpty || this.updatePromptText(' ');
            }),
            (this.disableRun = t => {
              (this.runDisabled = t),
                (document.querySelector('#' + this.id + ' .' + E).disabled = t);
            }),
            (this.resetOutputArea = () => {
              this.dockPanel.hide(),
                this.outputAreaWidget.model.clear(),
                this.outputAreaWidget.removeClass(k);
            }),
            (this.handleKernelMsg = async t => {
              let e = '';
              t.status
                ? this.displayKernelStatus(t.status)
                : (t.error
                    ? ((e = 'Error : ' + t.error.type + ' - ' + t.error.output),
                      this.getOutputAreaChildWidget().addClass(k))
                    : t.output && (e = t.output),
                  this.displayOutput(e));
            }),
            (this.createScrollButtons = t => {
              const e = document.createElement('button'),
                n = document.createElement('button');
              (e.className = 'elyra-PythonEditor-scrollTop'),
                (n.className = 'elyra-PythonEditor-scrollBottom'),
                (e.onclick = function() {
                  t.node.scrollTop = 0;
                }),
                (n.onclick = function() {
                  t.node.scrollTop = t.node.scrollHeight;
                }),
                u.caretUpEmptyThinIcon.element({
                  container: e,
                  elementPosition: 'center'
                }),
                u.caretDownEmptyThinIcon.element({
                  container: n,
                  elementPosition: 'center'
                }),
                this.dockPanel.node.appendChild(e),
                this.dockPanel.node.appendChild(n);
            }),
            (this.displayOutputArea = () => {
              if (
                (this.dockPanel.show(),
                m.BoxLayout.setStretch(this.dockPanel, 1),
                this.dockPanel.isEmpty)
              ) {
                (this.scrollingWidget = new h.ScrollingWidget({
                  content: this.outputAreaWidget
                })),
                  this.createScrollButtons(this.scrollingWidget),
                  this.dockPanel.addWidget(this.scrollingWidget, {
                    mode: 'split-bottom'
                  });
                const t = this.dockPanel.tabBars().next();
                (t.id = 'tab-python-editor-output'),
                  (t.currentTitle.label = 'Python Console Output'),
                  (t.currentTitle.closable = !0),
                  t.disposed.connect((t, e) => {
                    this.stopRun(), this.resetOutputArea();
                  }, this);
              }
              this.outputAreaWidget.model.add({
                name: 'stdout',
                output_type: 'stream',
                text: ['Waiting for kernel to start...']
              }),
                this.updatePromptText(' '),
                this.setOutputAreaClasses();
            }),
            (this.displayKernelStatus = t => {
              'busy' === t
                ? ((this.emptyOutput = !0),
                  this.displayOutput(' '),
                  this.updatePromptText('*'))
                : 'idle' === t && this.updatePromptText(' ');
            }),
            (this.displayOutput = t => {
              if (t) {
                const e = { name: 'stdout', output_type: 'stream', text: [t] };
                this.emptyOutput
                  ? (this.outputAreaWidget.model.clear(!1),
                    this.outputAreaWidget.model.add(e),
                    (this.emptyOutput = !1),
                    this.outputAreaWidget.model.clear(!0))
                  : this.outputAreaWidget.model.add(e),
                  this.updatePromptText('*'),
                  this.setOutputAreaClasses();
              }
            }),
            (this.setOutputAreaClasses = () => {
              this.getOutputAreaChildWidget().addClass(
                'elyra-PythonEditor-OutputArea-child'
              ),
                this.getOutputAreaOutputWidget().addClass(
                  'elyra-PythonEditor-OutputArea-output'
                ),
                this.getOutputAreaPromptWidget().addClass(
                  'elyra-PythonEditor-OutputArea-prompt'
                );
            }),
            (this.getOutputAreaChildWidget = () =>
              this.outputAreaWidget.layout.widgets[0]),
            (this.getOutputAreaOutputWidget = () =>
              this.getOutputAreaChildWidget().layout.widgets[1]),
            (this.getOutputAreaPromptWidget = () =>
              this.getOutputAreaChildWidget().layout.widgets[0]),
            (this.updatePromptText = t => {
              this.getOutputAreaPromptWidget().node.innerText = '[' + t + ']:';
            }),
            (this.saveFile = () => {
              if (this.model.readOnly)
                return (0, o.showDialog)({
                  title: 'Cannot Save',
                  body: 'Document is read-only',
                  buttons: [o.Dialog.okButton()]
                });
              this.context.save();
            }),
            this.addClass('elyra-PythonEditor'),
            (this.model = this.content.model),
            (this.runner = new x(this.model, this.disableRun)),
            (this.kernelName = null),
            (this.emptyOutput = !0),
            (this.runDisabled = !1),
            (this.title.icon = u.pythonIcon);
          const e = new o.ToolbarButton({
              icon: u.saveIcon,
              onClick: this.saveFile,
              tooltip: 'Save file contents'
            }),
            n = new w(this.runner, this.updateSelectedKernel),
            r = new o.ToolbarButton({
              className: E,
              icon: u.runIcon,
              onClick: this.runPython,
              tooltip: 'Run'
            }),
            i = new o.ToolbarButton({
              icon: u.stopIcon,
              onClick: this.stopRun,
              tooltip: 'Stop'
            }),
            s = this.toolbar;
          s.addItem('save', e),
            s.addItem('run', r),
            s.addItem('stop', i),
            s.addItem('select', n),
            this.toolbar.addClass('elyra-PythonEditor-Toolbar'),
            this.createOutputAreaWidget();
        }
      }
      class A extends p.ABCWidgetFactory {
        constructor(t) {
          super(t.factoryOptions), (this._services = t.editorServices);
        }
        createNewWidget(t) {
          const e = this._services.factoryService.newDocumentEditor,
            n = new a.FileEditor({
              factory: t => e(t),
              context: t,
              mimeTypeService: this._services.mimeTypeService
            });
          return new P({ content: n, context: t });
        }
      }
      const S = 'PyEditor',
        C = 'python',
        T = 'elyra-python-editor-extension',
        I = 'pyeditor:create-new-python-file',
        W = 'docmanager:open',
        R = {
          id: T,
          autoStart: !0,
          requires: [
            i.IEditorServices,
            a.IEditorTracker,
            o.ICommandPalette,
            d.ISettingRegistry,
            s.IFileBrowserFactory
          ],
          optional: [r.ILayoutRestorer, c.IMainMenu, l.ILauncher],
          activate: (t, e, n, r, s, a, l, c, d) => {
            console.log('Elyra - python-editor extension is activated!');
            const p = new A({
                editorServices: e,
                factoryOptions: { name: S, fileTypes: [C], defaultFor: [C] }
              }),
              { restored: h } = t,
              y = new o.WidgetTracker({ namespace: T });
            let f = Object.assign({}, i.CodeEditor.defaultConfig);
            l &&
              l.restore(y, {
                command: W,
                args: t => ({ path: t.context.path, factory: S }),
                name: t => t.context.path
              });
            const m = e => {
                (f = Object.assign(
                  Object.assign({}, i.CodeEditor.defaultConfig),
                  e.get('editorConfig').composite
                )),
                  t.commands.notifyCommandChanged();
              },
              g = () => {
                y.forEach(t => {
                  b(t);
                });
              },
              b = t => {
                n.has(t) || n.add(t);
                const e = t.content.editor;
                Object.keys(f).forEach(t => {
                  const n = t;
                  e.setOption(n, f[n]);
                });
              };
            Promise.all([s.load('@jupyterlab/fileeditor-extension:plugin'), h])
              .then(([t]) => {
                m(t),
                  g(),
                  t.changed.connect(() => {
                    m(t), g();
                  });
              })
              .catch(t => {
                console.error(t.message), g();
              }),
              t.docRegistry.addWidgetFactory(p),
              p.widgetCreated.connect((t, e) => {
                y.add(e),
                  e.context.pathChanged.connect(() => {
                    y.save(e);
                  }),
                  b(e);
              }),
              y.widgetAdded.connect((t, e) => {
                b(e);
              }),
              d && d.add({ command: I, category: 'Elyra', rank: 2 }),
              c && c.fileMenu.newMenu.addGroup([{ command: I }], 30),
              t.commands.addCommand(I, {
                label: t => (t.isPalette ? 'New Python File' : 'Python File'),
                caption: 'Create a new python file',
                icon: t => (t.isPalette ? void 0 : u.pythonIcon),
                execute: e => {
                  return (
                    (n = e.cwd || a.defaultBrowser.model.path),
                    t.commands
                      .execute('docmanager:new-untitled', {
                        path: n,
                        type: 'file',
                        ext: '.py'
                      })
                      .then(e =>
                        t.commands.execute(W, { path: e.path, factory: S })
                      )
                  );
                  var n;
                }
              }),
              r.addItem({
                command: I,
                args: { isPalette: !0 },
                category: 'Elyra'
              });
          }
        };
    }
  }
]);
