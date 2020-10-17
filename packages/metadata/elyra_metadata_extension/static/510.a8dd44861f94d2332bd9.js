(self.webpackChunk_elyra_metadata_extension =
  self.webpackChunk_elyra_metadata_extension || []).push([
  [510],
  {
    4363: (e, t, a) => {
      (e.exports = a(2609)(!1)).push([
        e.id,
        '/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the "License");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an "AS IS" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n',
        ''
      ]);
    },
    7947: (e, t, a) => {
      (e.exports = a(2609)(!1)).push([
        e.id,
        "/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the \"License\");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an \"AS IS\" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n.elyra-expandableContainer-button,\n.elyra-expandableContainer-button.jp-mod-styled {\n  background-color: transparent;\n  vertical-align: middle;\n  padding: 0;\n  width: 20px;\n}\n\n.elyra-expandableContainer-button:hover {\n  cursor: pointer;\n}\n\n.elyra-expandableContainer-actionButton:hover {\n  background-color: var(--jp-layout-color1);\n}\n\n.elyra-expandableContainer-actionButton:active {\n  background-color: var(--jp-layout-color2);\n}\n\n.elyra-expandableContainer-title {\n  align-items: center;\n  display: flex;\n  flex-direction: row;\n  padding: 0px 4px;\n  height: 36px;\n}\n\n.elyra-expandableContainer-title:hover {\n  background: var(--jp-layout-color2);\n}\n\n.elyra-expandableContainer-name {\n  flex-grow: 1;\n  font-size: var(--jp-ui-font-size1);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  padding: 4px 0 4px 2px;\n  line-height: 28px;\n}\n\n.elyra-expandableContainer-name:hover {\n  cursor: pointer;\n}\n\n.elyra-button {\n  background-repeat: no-repeat;\n  background-position: center;\n  border: none;\n  height: 100%;\n}\n\n.elyra-expandableContainer-details-visible {\n  overflow-x: auto;\n  overflow-y: auto;\n  display: block;\n  padding: 5px;\n  margin: 5px;\n  border: 1px solid var(--jp-border-color2);\n  border-radius: 2px;\n  color: var(--jp-ui-font-color1);\n  background-color: var(--jp-layout-color1);\n}\n\n.elyra-expandableContainer-details-visible textarea {\n  color: var(--jp-ui-font-color1);\n}\n\n.elyra-expandableContainer-details-hidden {\n  display: none;\n}\n\n.elyra-expandableContainer-action-buttons {\n  display: inline-flex;\n  align-self: flex-end;\n  height: 100%;\n}\n\n.elyra-errorDialog-messageDisplay pre {\n  min-height: 125px;\n  height: 100%;\n  width: 100%;\n  resize: none;\n  overflow-x: scroll;\n}\n\n.elyra-errorDialog-messageDisplay {\n  padding-bottom: 5px;\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n}\n\n.elyra-errorDialog-messageDisplay > div:nth-child(2) {\n  margin: 15px 0;\n  display: flex;\n  flex: 1;\n  min-height: 0px;\n  flex-direction: column;\n}\n\n/* temporary fix until this is addressed in jupyterlab */\n.lm-TabBar-tabIcon svg {\n  height: auto;\n}\n\n.jp-Dialog-content {\n  resize: both;\n}\n\n.elyra-DialogDefaultButton.jp-mod-styled:hover:disabled,\n.elyra-DialogDefaultButton.jp-mod-styled:active:disabled,\n.elyra-DialogDefaultButton.jp-mod-styled:focus:disabled,\n.elyra-DialogDefaultButton.jp-mod-styled:disabled {\n  background-color: var(--jp-layout-color3);\n  opacity: 0.3;\n  pointer-events: none;\n}\n\n/* icons */\n\n[data-jp-theme-light='false'] .elyra-pieBrain-icon rect.st1,\n[data-jp-theme-light='false'] .elyra-pieBrain-icon rect.st2 {\n  fill: var(--jp-inverse-layout-color3);\n}\n\n.elyra-feedbackButton {\n  display: inline;\n  position: relative;\n}\n\n.elyra-feedbackButton[data-feedback]:not([data-feedback='']):before {\n  border: solid;\n  border-color: var(--jp-inverse-layout-color2) transparent;\n  border-width: 0 6px 6px 6px;\n  bottom: 0;\n  content: '';\n  left: 5px;\n  position: absolute;\n  z-index: 999;\n}\n\n.elyra-feedbackButton[data-feedback]:not([data-feedback='']):after {\n  background: var(--jp-inverse-layout-color2);\n  border-radius: 2px;\n  bottom: -20px;\n  color: var(--jp-ui-inverse-font-color1);\n  content: attr(data-feedback);\n  font-size: 0.75rem;\n  font-weight: 400;\n  padding: 3px 5px;\n  pointer-events: none;\n  position: absolute;\n  right: -10px;\n  text-align: center;\n  width: max-content;\n  word-wrap: break-word;\n  z-index: 999;\n}\n\n.elyra-browseFileDialog .jp-Dialog-content {\n  height: 400px;\n  width: 600px;\n}\n",
        ''
      ]);
    },
    2401: (e, t, a) => {
      var n = a(4363);
      'string' == typeof n && (n = [[e.id, n, '']]);
      a(2379)(n, { hmr: !0, transform: void 0, insertInto: void 0 }),
        n.locals && (e.exports = n.locals);
    },
    3291: (e, t, a) => {
      var n = a(7947);
      'string' == typeof n && (n = [[e.id, n, '']]);
      a(2379)(n, { hmr: !0, transform: void 0, insertInto: void 0 }),
        n.locals && (e.exports = n.locals);
    },
    9510: (e, t, a) => {
      'use strict';
      a.d(t, { u9: () => d }), a(2401);
      var n = a(4268),
        s = a(2959),
        l = a(9883),
        i = a(2822),
        r = a(3526);
      class o {
        static serverError(e) {
          const t = e.reason ? e.reason : '',
            a = e.message ? e.message : '',
            i = e.timestamp ? e.timestamp : '',
            r = e.traceback ? e.traceback : '',
            o = e.timestamp
              ? 'Check the JupyterLab log for more details at ' + e.timestamp
              : 'Check the JupyterLab log for more details';
          return (0, n.showDialog)({
            title: 'Error making request',
            body:
              t || a
                ? s.createElement(l.ex, {
                    reason: t,
                    message: a,
                    timestamp: i,
                    traceback: r,
                    default_msg: o
                  })
                : s.createElement('p', null, o),
            buttons: [n.Dialog.okButton()]
          });
        }
        static server404(e) {
          return (0, n.showDialog)({
            title: 'Error contacting server',
            body: s.createElement(
              'p',
              null,
              'Endpoint ',
              s.createElement('code', null, e),
              ' not found.'
            ),
            buttons: [n.Dialog.okButton()]
          });
        }
        static async makeGetRequest(e, t) {
          return this.makeServerRequest(e, { method: 'GET' }, t);
        }
        static async makePostRequest(e, t, a) {
          return this.makeServerRequest(e, { method: 'POST', body: t }, a);
        }
        static async makePutRequest(e, t, a) {
          return this.makeServerRequest(e, { method: 'PUT', body: t }, a);
        }
        static async makeDeleteRequest(e, t) {
          return this.makeServerRequest(e, { method: 'DELETE' }, t);
        }
        static async makeServerRequest(e, t, a) {
          const s = r.ServerConnection.makeSettings(),
            l = i.URLExt.join(s.baseUrl, e);
          console.log(`Sending a ${t.method} request to ${l}`);
          const o = new n.Dialog({
            title: 'Making server request...',
            body: 'This may take some time',
            buttons: [n.Dialog.okButton()]
          });
          a && o.launch();
          const c = new Promise((n, i) => {
            r.ServerConnection.makeRequest(l, t, s).then(
              t => {
                a && o.resolve(),
                  t.json().then(
                    e => {
                      if (t.status < 200 || t.status >= 300)
                        return this.serverError(e);
                      n(e);
                    },
                    a =>
                      404 == t.status
                        ? this.server404(e)
                        : 204 != t.status
                        ? this.serverError(a)
                        : void n()
                  );
              },
              e => (console.error(e), this.serverError(e))
            );
          });
          return await c;
        }
      }
      const c = 'elyra/metadata/';
      class d {
        static noMetadataError(e) {
          return (0, n.showDialog)({
            title: 'Error retrieving metadata',
            body: s.createElement(
              'p',
              null,
              'No ',
              e,
              ' metadata has been configured.'
            ),
            buttons: [n.Dialog.okButton()]
          });
        }
        static async getMetadata(e) {
          return (await o.makeGetRequest(c + e, !1))[e];
        }
        static async postMetadata(e, t) {
          return await o.makePostRequest(c + e, t, !1);
        }
        static async putMetadata(e, t, a) {
          return await o.makePutRequest(c + e + '/' + t, a, !1);
        }
        static async deleteMetadata(e, t) {
          return await o.makeDeleteRequest(c + e + '/' + t, !1);
        }
        static async getSchema(e) {
          if (this.schemaCache[e])
            return JSON.parse(JSON.stringify(this.schemaCache[e]));
          const t = await o.makeGetRequest('elyra/schema/' + e, !1);
          return t[e] && (this.schemaCache[e] = t[e]), t[e];
        }
        static async getAllSchema() {
          const e = await o.makeGetRequest('elyra/namespace', !1),
            t = [];
          for (const a of e.namespaces) {
            const e = await this.getSchema(a);
            t.push(...e);
          }
          return t;
        }
      }
      d.schemaCache = {};
    },
    9883: (e, t, a) => {
      'use strict';
      a.d(t, {
        vb: () => m,
        IV: () => c,
        ex: () => d,
        vK: () => w,
        yi: () => p
      }),
        a(4268),
        a(5875),
        a(2916);
      var n = a(2959),
        s = a.n(n),
        l = (a(3291), a(6455));
      class i extends n.Component {
        constructor(e) {
          super(e), (this.node = n.createRef());
        }
        handleClick() {
          let e = this.props.onClick();
          'string' != typeof e && (e = this.props.feedback),
            e &&
              (this.node.current.setAttribute('data-feedback', e),
              setTimeout(() => {
                this.node.current.removeAttribute('data-feedback');
              }, 750));
        }
        render() {
          const { children: e, className: t } = this.props,
            a = 'elyra-feedbackButton ' + t;
          return n.createElement(
            'button',
            {
              title: this.props.title,
              ref: this.node,
              className: a,
              onClick: () => {
                this.handleClick();
              }
            },
            e
          );
        }
      }
      const r = 'elyra-button',
        o = 'elyra-expandableContainer-button';
      class c extends n.Component {
        constructor(e) {
          super(e), (this.state = { expanded: !1 });
        }
        toggleDetailsDisplay() {
          const e = !this.state.expanded;
          this.props.onBeforeExpand && this.props.onBeforeExpand(e),
            this.setState({ expanded: e });
        }
        componentDidUpdate() {
          this.props.onExpand && this.props.onExpand(this.state.expanded);
        }
        render() {
          const e = [r, o].join(' '),
            t = this.props.actionButtons || [];
          return n.createElement(
            'div',
            null,
            n.createElement(
              'div',
              {
                key: this.props.displayName,
                className: 'elyra-expandableContainer-title'
              },
              n.createElement(
                'button',
                {
                  className: e,
                  onClick: () => {
                    this.toggleDetailsDisplay();
                  }
                },
                this.state.expanded
                  ? n.createElement(l.caretDownIcon.react, {
                      tag: 'span',
                      elementPosition: 'center',
                      width: '20px'
                    })
                  : n.createElement(l.caretRightIcon.react, {
                      tag: 'span',
                      elementPosition: 'center',
                      width: '20px'
                    })
              ),
              n.createElement(
                'span',
                {
                  title: this.props.tooltip,
                  className: 'elyra-expandableContainer-name',
                  onClick: () => {
                    this.toggleDetailsDisplay();
                  }
                },
                this.props.displayName
              ),
              n.createElement(
                'div',
                { className: 'elyra-expandableContainer-action-buttons' },
                t.map(t =>
                  n.createElement(
                    i,
                    {
                      key: t.title,
                      title: t.title,
                      feedback: t.feedback || '',
                      className: e + ' elyra-expandableContainer-actionButton',
                      onClick: () => {
                        t.onClick();
                      }
                    },
                    n.createElement(t.icon.react, {
                      tag: 'span',
                      elementPosition: 'center',
                      width: '16px'
                    })
                  )
                )
              )
            ),
            n.createElement(
              'div',
              {
                className: this.state.expanded
                  ? 'elyra-expandableContainer-details-visible'
                  : 'elyra-expandableContainer-details-hidden'
              },
              this.props.children ? this.props.children : null
            )
          );
        }
      }
      class d extends n.Component {
        constructor(e) {
          super(e);
        }
        updateDialogSize(e) {
          this.dialogNode ||
            (this.dialogNode = document.querySelector('.jp-Dialog-content'));
          const t = this.dialogNode.clientWidth,
            a = this.dialogNode.clientHeight;
          e && (t < 600 || a < 400)
            ? ((this.collapsedDimensions = [t, a]),
              (this.dialogNode.style.width = Math.max(t, 600) + 'px'),
              (this.dialogNode.style.height = Math.max(a, 400) + 'px'))
            : !e &&
              this.collapsedDimensions &&
              ((this.dialogNode.style.width =
                this.collapsedDimensions[0] + 'px'),
              (this.dialogNode.style.height =
                this.collapsedDimensions[1] + 'px'));
        }
        render() {
          const e = this.props.traceback
            ? n.createElement(
                c,
                {
                  displayName: 'Error details: ',
                  tooltip: 'Error stack trace',
                  onBeforeExpand: e => {
                    this.updateDialogSize(e);
                  }
                },
                n.createElement('pre', null, this.props.traceback)
              )
            : null;
          return n.createElement(
            'div',
            { className: 'elyra-errorDialog-messageDisplay' },
            n.createElement('div', null, this.props.message),
            e,
            n.createElement('div', null, this.props.default_msg)
          );
        }
      }
      new l.LabIcon({
        name: 'elyra:import',
        svgstr:
          '<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">\n\t<title>Insert</title>\n\t<g class="jp-icon3" fill="#616161">\n\t\t<path d="M4,22v8H6V22h8.17l-2.58,2.59L13,26l5-5-5-5-1.41,1.41L14.17,20H6A2,2,0,0,0,4,22Z"/>\n\t\t<path d="M26,2H10A2,2,0,0,0,8,4v8h2V4H26V28H18v2h8a2,2,0,0,0,2-2V4A2,2,0,0,0,26,2Z"/>\n\t</g>\n</svg>\n'
      }),
        new l.LabIcon({
          name: 'elyra:code-snippet',
          svgstr:
            '<?xml version="1.0" ?>\n<!DOCTYPE svg  PUBLIC \'-//W3C//DTD SVG 1.1//EN\'  \'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\'>\n<svg height="500px" id="elyra-code-snippet-icon" version="1.1" viewBox="125 150 250 200" width="500px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n    <g>\n        <g>\n            <polygon class="jp-icon3" fill="#231F20" points="195.568,185.811 142.681,250.173 195.568,314.534 208.077,293.962 172.44,250.173 208.077,206.384"/>\n            <polygon class="jp-icon3" fill="#231F20" points="228.707,313 251.922,313 288.816,187 265.6,187"/>\n            <polygon class="jp-icon3" fill="#231F20" points="303.876,185.81 291.37,206.384 327.005,250.173 291.37,293.961 303.876,314.535 356.765,250.173"/>\n        </g>\n    </g>\n</svg>\n'
        }),
        new l.LabIcon({
          name: 'elyra:dragdrop',
          svgstr:
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 213.69 200"><defs><style>.cls-1{isolation:isolate;}.cls-2{fill:url(#linear-gradient);}.cls-3{fill:#909faf;}.cls-4{fill:#fff;}.cls-5{fill:#00b6cb;}.cls-6{fill:#5a6872;}.cls-7,.cls-8{fill:#dfe3e6;}.cls-7{mix-blend-mode:multiply;}</style><linearGradient id="linear-gradient" x1="100.01" y1="198.49" x2="100.01" y2="-7.76" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#909faf"/></linearGradient></defs><title>Active-state_Drag-drop-file</title><g class="cls-1"><g id="Artwork"><circle class="cls-2" cx="100.01" cy="99.74" r="100"/><path class="cls-3" d="M26.11,167.59a100,100,0,0,0,147.85,0Z"/><circle class="cls-4" cx="67.69" cy="25.37" r="2.5"/><path class="cls-4" d="M30.54,167.67V58.09A2.07,2.07,0,0,1,32.61,56H168.47a2.07,2.07,0,0,1,2.07,2.07V167.67Z"/><path class="cls-5" d="M121.55,113.66h-19v-19a2,2,0,0,0-4,0v19h-19a2,2,0,1,0,0,4h19v19a2,2,0,0,0,4,0v-19h19a2,2,0,0,0,0-4Z"/><path class="cls-6" d="M170.54,144.15a2,2,0,0,0,2-2v-10a2,2,0,0,0-4,0v10A2,2,0,0,0,170.54,144.15Z"/><path class="cls-6" d="M170.54,121.15a2,2,0,0,0,2-2v-10a2,2,0,0,0-4,0v10A2,2,0,0,0,170.54,121.15Z"/><path class="cls-6" d="M170.54,75.15a2,2,0,0,0,2-2v-10a2,2,0,0,0-4,0v10A2,2,0,0,0,170.54,75.15Z"/><path class="cls-6" d="M170.54,98.15a2,2,0,0,0,2-2v-10a2,2,0,0,0-4,0v10A2,2,0,0,0,170.54,98.15Z"/><path class="cls-6" d="M83,58H93a2,2,0,1,0,0-4H83a2,2,0,0,0,0,4Z"/><path class="cls-6" d="M106,58h10a2,2,0,1,0,0-4H106a2,2,0,0,0,0,4Z"/><path class="cls-6" d="M129,58h10a2,2,0,0,0,0-4H129a2,2,0,1,0,0,4Z"/><path class="cls-6" d="M152,58h10a2,2,0,0,0,0-4H152a2,2,0,0,0,0,4Z"/><path class="cls-6" d="M37,58H47a2,2,0,0,0,0-4H37a2,2,0,0,0,0,4Z"/><path class="cls-6" d="M72,56a2,2,0,0,0-2-2H60a2,2,0,0,0,0,4H70A2,2,0,0,0,72,56Z"/><path class="cls-6" d="M30.54,144.53a2,2,0,0,0,2-2v-10a2,2,0,0,0-4,0v10A2,2,0,0,0,30.54,144.53Z"/><path class="cls-6" d="M30.54,121.53a2,2,0,0,0,2-2v-10a2,2,0,0,0-4,0v10A2,2,0,0,0,30.54,121.53Z"/><path class="cls-6" d="M30.54,98.53a2,2,0,0,0,2-2v-10a2,2,0,0,0-4,0v10A2,2,0,0,0,30.54,98.53Z"/><path class="cls-6" d="M30.54,75.53a2,2,0,0,0,2-2v-10a2,2,0,0,0-4,0v10A2,2,0,0,0,30.54,75.53Z"/><path class="cls-6" d="M51,165.65H32.53s0-.07,0-.12v-10a2,2,0,0,0-4,0v10c0,.05,0,.08,0,.12H2a2,2,0,1,0,0,4H51a2,2,0,0,0,0-4Z"/><path class="cls-6" d="M198,165.65h-8.21a2,2,0,0,0,0,4H198a2,2,0,0,0,0-4Z"/><path class="cls-6" d="M178.73,165.65h-6.26a2,2,0,0,0,.07-.5v-10a2,2,0,0,0-4,0v10a2,2,0,0,0,.07.5H63.73a2,2,0,1,0,0,4h115a2,2,0,0,0,0-4Z"/><path class="cls-6" d="M100,3.74a96,96,0,1,1-96,96,96.11,96.11,0,0,1,96-96m0-4a100,100,0,1,0,100,100A100,100,0,0,0,100-.26Z"/><path class="cls-7" d="M112.49,54.07l26.13,64.7a6.5,6.5,0,0,0-3.27,7.08,6.39,6.39,0,0,0-2.74,3.36,6.53,6.53,0,0,0,1.71,6.95l2.54,2.53a4.07,4.07,0,0,0-.17,1.16v.44c0,.37,0,.75,0,1.12a10.89,10.89,0,0,0,10.83,10.71l4.7,0,5.25,0a12.11,12.11,0,0,0,8.32-3.22c1.92-1.79,3.42-3.29,4.73-4.73a14.68,14.68,0,0,0,.68-18.9L120.48,56H117.9c-.08-2.33-2.63-2-2.63-2Z"/><path class="cls-4" d="M209.74,105.7l-57.35,23.06a3.1,3.1,0,0,1-4-1.72L120.82,58.57a3.11,3.11,0,0,1,1.72-4L166,37.05,189.51,47.1l21.94,54.57A3.1,3.1,0,0,1,209.74,105.7Z"/><path class="cls-8" d="M166.89,39.17l5,12.53A2.26,2.26,0,0,0,174.86,53l12.52-5a2.21,2.21,0,0,0,1.23-1.21l-21.7-9.25A2.23,2.23,0,0,0,166.89,39.17Z"/><path class="cls-6" d="M213.31,100.93,191.36,46.36a2,2,0,0,0-1.07-1.1l-.77-.33-.12-.07-7.51-3.2-15.07-6.45a2,2,0,0,0-1.53,0L121.8,52.68A5.1,5.1,0,0,0,119,59.31l27.54,68.48a5.1,5.1,0,0,0,4.73,3.2,5.26,5.26,0,0,0,1.9-.37l57.34-23.07a5.08,5.08,0,0,0,2.83-6.62ZM180.25,45.31l4,1.71-10.12,4.07a.25.25,0,0,1-.19,0,.27.27,0,0,1-.14-.14l-4.07-10.13Zm29.34,58a1.1,1.1,0,0,1-.6.58l-57.34,23.07a1.1,1.1,0,0,1-1.43-.61L122.68,57.82a1.07,1.07,0,0,1,0-.84,1.09,1.09,0,0,1,.6-.59L165,39.64c0,.09.05.19.09.28l5,12.52a4.25,4.25,0,0,0,4,2.67,4.16,4.16,0,0,0,1.58-.31l12.53-5c.08,0,.16-.08.24-.12l21.23,52.78A1.11,1.11,0,0,1,209.59,103.26Z"/><path class="cls-6" d="M163.19,61.91a2,2,0,0,0-2.6-1.11l-20.51,8.25A2,2,0,0,0,139,71.66a2,2,0,0,0,1.85,1.25,2.17,2.17,0,0,0,.75-.14l20.51-8.25A2,2,0,0,0,163.19,61.91Z"/><path class="cls-6" d="M160.93,78a2,2,0,0,0-2.6-1.11l-13,5.22a2,2,0,0,0,.75,3.86,1.92,1.92,0,0,0,.74-.15l13-5.22A2,2,0,0,0,160.93,78Z"/><path class="cls-6" d="M164.62,87.21A2,2,0,0,0,162,86.1l-13,5.22a2,2,0,1,0,1.5,3.71l13-5.22A2,2,0,0,0,164.62,87.21Z"/><path class="cls-6" d="M168.35,96.47a2,2,0,0,0-2.6-1.11l-13,5.22a2,2,0,0,0-1.11,2.61,2,2,0,0,0,2.6,1.1l13-5.22A2,2,0,0,0,168.35,96.47Z"/><path class="cls-6" d="M169.47,104.62l-13,5.23a2,2,0,0,0,1.5,3.71l13-5.23a2,2,0,0,0-1.49-3.71Z"/><path class="cls-6" d="M168.34,77.05a2,2,0,0,0,.75-.15l13-5.22a2,2,0,0,0-1.5-3.71l-13,5.22a2,2,0,0,0,.75,3.86Z"/><path class="cls-6" d="M186.88,78.26a2,2,0,0,0-2.6-1.11l-13,5.22a2,2,0,1,0,1.49,3.71l13-5.22A2,2,0,0,0,186.88,78.26Z"/><path class="cls-6" d="M190.6,87.52a2,2,0,0,0-2.6-1.11l-13,5.22a2,2,0,0,0,.75,3.86,1.92,1.92,0,0,0,.74-.15l13-5.22A2,2,0,0,0,190.6,87.52Z"/><path class="cls-6" d="M191.73,95.67l-13,5.23a2,2,0,0,0,1.49,3.71l13-5.23a2,2,0,1,0-1.49-3.71Z"/><path class="cls-4" d="M155.23,147l-4.69,0a8.9,8.9,0,0,1-8.85-8.75v-1.52a2,2,0,0,1,.67-1.49c-1.21-1.21-2.42-2.41-3.62-3.62a4.51,4.51,0,0,1-1.23-4.87,4.43,4.43,0,0,1,3.46-2.9,4.45,4.45,0,0,1-.75-2.79,4.32,4.32,0,0,1,2.6-3.78,4.47,4.47,0,0,1,1.9-.44,4.23,4.23,0,0,1,1.93.47,4.59,4.59,0,0,1,.1-.51,4.49,4.49,0,0,1,2.9-3.16,4.29,4.29,0,0,1,4.45.91,4.46,4.46,0,0,1,4.4-3.6,4.61,4.61,0,0,1,2.77.92c.13.11.27.22.39.34,1.05,1.06,2.1,2.1,3.16,3.14,2.38,2.36,4.85,4.8,7.19,7.3a12.65,12.65,0,0,1,0,17.06c-1.27,1.39-2.73,2.86-4.61,4.61a10.16,10.16,0,0,1-7,2.68Z"/><path class="cls-6" d="M158.5,113a2.57,2.57,0,0,1,1.55.51l.2.17c3.44,3.45,7,6.83,10.3,10.39a10.71,10.71,0,0,1,0,14.34c-1.42,1.57-2.95,3-4.49,4.5a8.12,8.12,0,0,1-5.63,2.14l-5.23,0-4.65,0a6.89,6.89,0,0,1-6.87-6.8c0-.49,0-1,0-1.47l.16-.12c.65.67,1.29,1.35,2,2a1.3,1.3,0,0,0,.89.45,1,1,0,0,0,.68-.31c.42-.43.36-1-.19-1.52q-3.51-3.53-7-7a2.54,2.54,0,0,1-.75-2.8,2.44,2.44,0,0,1,2.33-1.63,2.5,2.5,0,0,1,1.68.65c.86.77,1.62,1.65,2.49,2.41a1.37,1.37,0,0,0,.86.29.78.78,0,0,0,.22,0,1,1,0,0,0,.61-.77,1.52,1.52,0,0,0-.44-1c-1.34-1.38-2.72-2.73-4.09-4.08a2.56,2.56,0,0,1-.84-2.07,2.34,2.34,0,0,1,1.44-2.1,2.48,2.48,0,0,1,1.06-.25,2.37,2.37,0,0,1,1.48.54,18,18,0,0,1,1.49,1.41c1,1,2,2,3,3a1.29,1.29,0,0,0,.9.43.9.9,0,0,0,.68-.31c.4-.41.33-1-.2-1.52-.92-.93-1.87-1.83-2.76-2.78a2.49,2.49,0,0,1,1-4.13,2.52,2.52,0,0,1,.83-.15,2.54,2.54,0,0,1,1.76.8c.92.89,1.81,1.81,2.72,2.72a1.41,1.41,0,0,0,.94.46.86.86,0,0,0,.64-.28c.44-.45.38-1-.16-1.58a5.45,5.45,0,0,1-.66-.78,2.44,2.44,0,0,1,.46-3.15,2.49,2.49,0,0,1,1.65-.61m0-4a6.48,6.48,0,0,0-4.32,1.63,6.64,6.64,0,0,0-1,1.13,6.31,6.31,0,0,0-2-.34,6.51,6.51,0,0,0-2.16.38,6.61,6.61,0,0,0-3.64,3.12c-.2,0-.42,0-.63,0a6.56,6.56,0,0,0-2.75.62,6.35,6.35,0,0,0-3.75,5.48,7.1,7.1,0,0,0,.13,1.79,6.35,6.35,0,0,0-2.73,3.37,6.49,6.49,0,0,0,1.71,6.94l2.53,2.53a4.07,4.07,0,0,0-.17,1.16v1.56A10.9,10.9,0,0,0,150.52,149l4.69,0,5.27,0a12.09,12.09,0,0,0,8.31-3.22c1.93-1.79,3.43-3.29,4.73-4.73a14.67,14.67,0,0,0-.05-19.77c-2.37-2.53-4.85-5-7.25-7.35q-1.58-1.56-3.14-3.13c-.23-.22-.44-.39-.59-.51a6.57,6.57,0,0,0-4-1.34Z"/><path class="cls-4" d="M109.55,35.67a3.26,3.26,0,0,1-3.25-3.25.75.75,0,0,0-1.5,0,3.26,3.26,0,0,1-3.25,3.25.75.75,0,0,0,0,1.5,3.25,3.25,0,0,1,3.25,3.25.75.75,0,0,0,1.5,0,3.25,3.25,0,0,1,3.25-3.25.75.75,0,0,0,0-1.5Z"/><path class="cls-4" d="M19.15,102.94a1.75,1.75,0,0,1-1.75-1.75.75.75,0,0,0-1.5,0,1.76,1.76,0,0,1-1.75,1.75.75.75,0,0,0,0,1.5,1.75,1.75,0,0,1,1.75,1.75.75.75,0,0,0,1.5,0,1.75,1.75,0,0,1,1.75-1.75.75.75,0,1,0,0-1.5Z"/></g></g></svg>\n'
        }),
        new l.LabIcon({
          name: 'elyra:elyra',
          svgstr:
            '<?xml version="1.0" encoding="utf-8"?>\n<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"\n\tid="elyra-pie-brain-icon" x="0px" y="0px" viewBox="0 0 243 225">\n<style type="text/css">\n\t.st0{clip-path:url(#SVGID_2_);}\n\t.st1{fill:#706E6F;stroke:#706E6F;stroke-width:1.9754;stroke-miterlimit:10;}\n\t.st2{fill:#706E6F;}\n\t.st3{fill:#f37726;}\n</style>\n<g class="elyra-pieBrain-icon">\n\t<g>\n\t\t<defs>\n\t\t\t<path id="SVGID_1_" d="M234,116.8c0,50.3-38.4,95.2-96,95.2l-0.3-95.2L203,48.1C221.7,65.4,234,89.8,234,116.8z"/>\n\t\t</defs>\n\t\t<clipPath id="SVGID_2_">\n\t\t\t<use xlink:href="#SVGID_1_"  style="overflow:visible;"/>\n\t\t</clipPath>\n\t\t<g class="st0">\n\t\t\t<rect x="137.8" y="222.6" class="st1" width="95.4" height="7.2"/>\n\t\t</g>\n\t\t<g class="st0">\n\t\t\t<rect x="137.8" y="242" class="st1" width="95.4" height="7.2"/>\n\t\t</g>\n\t\t<g class="st0">\n\t\t\t<rect x="136.8" y="163.7" class="st2" width="98.2" height="9.2"/>\n\t\t\t<rect x="136.8" y="183" class="st2" width="98.2" height="9.2"/>\n\t\t\t<rect x="136.8" y="202.3" class="st2" width="98.2" height="9.2"/>\n\t\t\t<rect x="136.6" y="67" class="st2" width="98.4" height="9.2"/>\n\t\t\t<rect x="136.6" y="47.7" class="st2" width="98.4" height="9.2"/>\n\t\t\t<rect x="136.6" y="86.3" class="st2" width="98.4" height="9.2"/>\n\t\t\t<rect x="136.2" y="144.3" class="st2" width="98.5" height="9.2"/>\n\t\t\t<rect x="136.8" y="125" class="st2" width="98.1" height="9.2"/>\n\t\t\t<rect x="136.8" y="105.7" class="st2" width="98" height="9.2"/>\n\t\t</g>\n\t</g>\n\t<g>\n\t\t<g>\n\t\t\t<path class="st3" d="M107.1,13l-0.5-0.4c-1.8-1.5-3.8-2.3-5.7-2.5l-0.2,0C90.2,7,79.6,10.6,71,19.9c-2.6,2.8-4.7,6.1-6.2,9.9\n\t\t\t\tl-0.4,1l-1-0.3c-11.1-3.4-22.3-0.1-29.9,8c-8.6,9.1-11.5,23.3-7.5,36.1l0.3,0.9l-0.8,0.5C14.7,82.1,9.5,94.5,9.1,104.2\n\t\t\t\tc-0.9,19.6,7.6,28.5,16.1,34.6l0.7,0.5l-0.2,0.8c-3,9.9-2.1,20.5,2.5,29.1c7.7,14.2,23.3,20.4,38.1,15.2l1-0.4l0.4,1\n\t\t\t\tc0.9,2,2,3.8,3.3,5.3c8.2,9.7,19.9,13.3,31.4,9.7l0.2,0c1.5-0.2,2.9-0.7,4.2-1.7l0.2-0.1c3-2.3,5-6.5,5-10.5V22.4\n\t\t\t\tC111.9,19.2,110.1,15.6,107.1,13z M105.3,49.2L104,49c-2.6-0.4-6.5-1.5-10.1-4.7c-3.3-2.9-5.2-6.3-6.2-9l-6.3,2.1\n\t\t\t\tc1.3,3.5,3.8,8,8.1,11.8c5.3,4.6,10.9,6.1,14.7,6.5l1,0.1v41.4l-1.5-0.6c-4.5-1.6-9.1-2.4-13.6-2.4c-6.3,0-12.3,1.6-17.8,4.7\n\t\t\t\tc-3.4,1.9-6.4,4.3-9,7l-0.8,0.8l-0.8-0.8c-2.6-2.5-7.1-5.6-13.2-6.1c-0.6-0.1-1.2-0.1-1.9-0.1c-6.3,0-11.1,2.9-13.4,4.8l4.4,5\n\t\t\t\tc1.9-1.5,5.6-3.5,10.4-3.1c5,0.5,8.4,3.4,10,5.1l0.6,0.6l-0.4,0.7c-3.8,6.4-5.2,12.8-5.8,16.5l6.5,0.9\n\t\t\t\tc0.9-5.9,4.2-18.5,16.7-25.6c13-7.4,25.5-2.3,29.1-0.6l0.6,0.3v49.1l-1.3,0c-3.2,0-9.5,0.7-15.3,5.7c-5.3,4.6-7.5,10.4-8.4,14\n\t\t\t\tl6.5,1.3c0.7-2.5,2.3-6.9,6.2-10.3c4.2-3.7,8.7-4.1,11.1-4.1l1.1,0v27.4c0,1.9-1,3.7-1.8,4.7l-0.2,0.2l-0.2,0.1\n\t\t\t\tc-3.3,1.5-6.4,2.1-9.4,2.1c-7.5,0-13.8-4-17.7-8.7c-5.2-6.2-5.4-18-3.5-24.1c1.4-4.7,2.9-5.8,8.5-9.9l0.5-0.4\n\t\t\t\tc6.1-4.5,13.4-15.1,9.3-26.1l-6.1,2.7c2.6,7.8-3.6,15.5-7.1,18.2l-0.5,0.4c-2.1,1.6-4,2.9-5.5,4.3l-1.2,1.1l-0.7-1.4\n\t\t\t\tc-0.4-0.8-0.8-1.5-1.2-2.1c-2.2-3.5-6.1-6.1-8-7.2l-3.1,5.8c1.6,1,4.2,2.9,5.5,4.9c1,1.6,1.6,3.2,2.1,5c0.3,1,0.6,1.9,0.9,2.7\n\t\t\t\tL66,160l-0.1,0.4c-1.3,4.7-1.6,10.7-0.7,16.2l0.1,0.9l-0.9,0.3c-11.6,4.4-24.5-0.7-30.6-12c-6.9-12.7-3.4-29.9,7.7-38.9l-3.9-5.3\n\t\t\t\tc-3.4,2.7-6.3,6.1-8.6,10.1l-0.7,1.2l-1-0.8c-6.5-5.1-12.4-11.9-11.7-27.7c0.5-10.6,7.5-23,19.6-25.2l0.1,0l0.1,0\n\t\t\t\tc1.5,0.1,3,0,4.4-0.2l0.7-0.1l0.4,0.6c1.6,2.4,3.5,4.5,5.6,6.1c3.6,2.7,8,4.1,12.5,4.2L59,83.2c-2.3-0.1-5.3-0.7-8.3-2.9\n\t\t\t\tc-1.1-0.8-2.1-1.8-3-3l-0.7-0.9l0.9-0.7c2.9-2.4,4.7-5.9,5.4-10.3l-6.6-0.7c-0.6,3.9-2.7,8.3-10.9,7.9c-0.4,0-0.7,0-1.1,0\n\t\t\t\tc-0.4,0.1-0.9,0.1-1.3,0.2l-1,0.2l-0.3-1C29,61.6,31.4,50.2,38.2,43c6-6.4,15-8.8,23.3-6.2l1,0.3l-0.2,1\n\t\t\t\tc-1,5.6-0.7,11.4,0.7,16.7c3,11.3,10.3,17.8,14.2,20.5l3.6-5.5c-3.2-2.3-9-7.6-11.4-16.7c-2.7-10.3-0.2-21.6,6.4-28.8\n\t\t\t\tc4.8-5.2,14.6-12.9,26.9-6.4l0.3,0.2c0.5,0.5,2.3,2.3,2.3,4.1V49.2z"/>\n\t\t</g>\n\t\t<g>\n\t\t\t<path class="st3" d="M174.8,30.7c-14-13.4-32.4-20.7-51.8-20.7c-1.5,0-2.8,1.2-2.8,2.7L120,84.6c0,1.1,0.7,2.1,1.8,2.6\n\t\t\t\tc0.3,0.1,0.7,0.2,1,0.2c0.8,0,1.5-0.3,2-0.9l50-51.9C176,33.5,175.9,31.7,174.8,30.7z"/>\n\t\t\t<g>\n\t\t\t\t<path class="st3" d="M123.8,200.3c-1.9,0-3.5-1.5-3.5-3.5l-0.3-90.7c0-0.9,0.3-1.8,1-2.4l62.2-65.5c0.6-0.7,1.5-1.1,2.4-1.1\n\t\t\t\t\tc1,0,1.8,0.3,2.5,1c18.5,17.9,28.7,42.1,28.7,68C216.8,158.1,175.1,200.3,123.8,200.3z M127,107.6l0.3,85.7\n\t\t\t\t\tc45.9-1.8,82.6-40.2,82.6-87.1c0-22.8-8.5-44.2-24.1-60.5L127,107.6z"/>\n\t\t\t</g>\n\t\t</g>\n\t</g>\n</g>\n</svg>\n'
        }),
        new l.LabIcon({
          name: 'elyra:pipeline',
          svgstr:
            '<?xml version="1.0" encoding="UTF-8"?>\n<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"\n  id="elyra-pipeline-editor-icon" width="32px" height="32px" viewBox="0 0 32 32">\n  <title>Elyra Pipeline Editor</title>\n  <g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">\n    <path class="jp-icon3 jp-icon-selectable" fill="#000000" d="M20,23 L11.86,23 C11.7609757,22.6493104 11.616411,22.3131134 11.43,22 L22,11.43 C22.6019656,11.7993928 23.293741,11.9965488 24,12 C26.0803346,12.0067496 27.8185594,10.4177446 27.9980602,8.34515757 C28.177561,6.27257049 26.7384074,4.4083819 24.6878883,4.05737018 C22.6373692,3.70635845 20.6600973,4.98571688 20.14,7 L11.86,7 C11.356433,5.04969328 9.48121328,3.77807479 7.48299948,4.03188121 C5.48478569,4.28568764 3.98701665,5.98573188 3.98701665,8 C3.98701665,10.0142681 5.48478569,11.7143124 7.48299948,11.9681188 C9.48121328,12.2219252 11.356433,10.9503067 11.86,9 L20.14,9 C20.2390243,9.35068963 20.383589,9.68688662 20.57,10 L10,20.57 C9.39803439,20.2006072 8.70625898,20.0034512 8,20 C5.91966537,19.9932504 4.18144061,21.5822554 4.00193981,23.6548424 C3.822439,25.7274295 5.26159259,27.5916181 7.31211167,27.9426298 C9.36263076,28.2936415 11.3399027,27.0142831 11.86,25 L20,25 L20,28 L28,28 L28,20 L20,20 L20,23 Z M8,10 C6.8954305,10 6,9.1045695 6,8 C6,6.8954305 6.8954305,6 8,6 C9.1045695,6 10,6.8954305 10,8 C10,8.53043298 9.78928632,9.03914081 9.41421356,9.41421356 C9.03914081,9.78928632 8.53043298,10 8,10 Z M24,6 C25.1045695,6 26,6.8954305 26,8 C26,9.1045695 25.1045695,10 24,10 C22.8954305,10 22,9.1045695 22,8 C22,6.8954305 22.8954305,6 24,6 Z M8,26 C6.8954305,26 6,25.1045695 6,24 C6,22.8954305 6.8954305,22 8,22 C9.1045695,22 10,22.8954305 10,24 C10,25.1045695 9.1045695,26 8,26 Z M22,22 L26,22 L26,26 L22,26 L22,22 Z"></path>\n  </g>\n</svg>'
        }),
        new l.LabIcon({
          name: 'elyra:errorIcon',
          svgstr:
            '<svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="#d32f2f" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">\n  <circle cx="16" cy="16" r="10"></circle>\n  <title>Error</title>\n</svg>\n'
        }),
        new l.LabIcon({
          name: 'elyra:clear-pipeline',
          svgstr:
            '<svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">\n  <path d="M7 27H30V29H7zM27.38 10.51L19.45 2.59a2 2 0 00-2.83 0l-14 14a2 2 0 000 2.83L7.13 24h9.59L27.38 13.34A2 2 0 0027.38 10.51zM15.89 22H8L4 18l6.31-6.31 7.93 7.92zm3.76-3.76l-7.92-7.93L18 4 26 11.93z"></path>\n  <title>Clear</title>\n</svg>'
        }),
        new l.LabIcon({
          name: 'elyra:export-pipeline',
          svgstr:
            '<svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">\n\t<path d="M13 21L26.17 21 23.59 23.59 25 25 30 20 25 15 23.59 16.41 26.17 19 13 19 13 21z"></path>\n\t<path d="M22,14V10a1,1,0,0,0-.29-.71l-7-7A1,1,0,0,0,14,2H4A2,2,0,0,0,2,4V28a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V26H20v2H4V4h8v6a2,2,0,0,0,2,2h6v2Zm-8-4V4.41L19.59,10Z"></path>\n\t<title>Export</title>\n</svg>'
        }),
        new l.LabIcon({
          name: 'elyra:save-pipeline',
          svgstr:
            '<svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">\n  <path d="M27.71,9.29l-5-5A1,1,0,0,0,22,4H6A2,2,0,0,0,4,6V26a2,2,0,0,0,2,2H26a2,2,0,0,0,2-2V10A1,1,0,0,0,27.71,9.29ZM12,6h8v4H12Zm8,20H12V18h8Zm2,0V18a2,2,0,0,0-2-2H12a2,2,0,0,0-2,2v8H6V6h4v4a2,2,0,0,0,2,2h8a2,2,0,0,0,2-2V6.41l4,4V26Z"></path>\n  <title>Save</title>\n</svg>'
        }),
        new l.LabIcon({
          name: 'elyra:runtimes',
          svgstr:
            '<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">\n    <g>\n        <rect class="jp-icon3" fill="#231F20" x="20" y="20" width="10" height="2"/>\n        <rect class="jp-icon3" fill="#231F20" x="20" y="24" width="10" height="2"/>\n        <rect class="jp-icon3" fill="#231F20" x="20" y="28" width="10" height="2"/>\n        <path class="jp-icon3" fill="#231F20" d="M16,20a3.9123,3.9123,0,0,1-4-4,3.9123,3.9123,0,0,1,4-4,3.9123,3.9123,0,0,1,4,4h2a6,6,0,1,0-6,6Z"/>\n        <path class="jp-icon3" fill="#231F20" d="M29.3047,11.0439,26.9441,6.9561a1.9977,1.9977,0,0,0-2.3728-.8946l-2.4341.8233a11.0419,11.0419,0,0,0-1.312-.7583l-.5037-2.5186A2,2,0,0,0,18.36,2H13.64a2,2,0,0,0-1.9611,1.6079l-.5037,2.5186A10.9666,10.9666,0,0,0,9.8481,6.88L7.4287,6.0615a1.9977,1.9977,0,0,0-2.3728.8946L2.6953,11.0439a2.0006,2.0006,0,0,0,.4119,2.5025l1.9309,1.6968C5.021,15.4946,5,15.7446,5,16c0,.2578.01.5127.0278.7656l-1.9206,1.688a2.0006,2.0006,0,0,0-.4119,2.5025l2.3606,4.0878a1.9977,1.9977,0,0,0,2.3728.8946l2.4341-.8233a10.9736,10.9736,0,0,0,1.312.7583l.5037,2.5186A2,2,0,0,0,13.64,30H16V28H13.64l-.71-3.5508a9.0953,9.0953,0,0,1-2.6948-1.5713l-3.4468,1.166-2.36-4.0878L7.1528,17.561a8.9263,8.9263,0,0,1-.007-3.1279L4.4275,12.0439,6.7886,7.9561l3.4267,1.1591a9.0305,9.0305,0,0,1,2.7141-1.5644L13.64,4H18.36l.71,3.5508a9.0978,9.0978,0,0,1,2.6948,1.5713l3.4468-1.166,2.36,4.0878-2.7978,2.4522L26.0923,16l2.8-2.4536A2.0006,2.0006,0,0,0,29.3047,11.0439Z"/>\n    </g>\n</svg>\n'
        }),
        new l.LabIcon({
          name: 'elyra:container',
          svgstr:
            '<svg id="icon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">\n    <path class="jp-icon3" fill="#231F20"  d="M28,12H20V4h8Zm-6-2h4V6H22Z"/>\n    <path class="jp-icon3" fill="#231F20"  d="M17,15V9H9V23H23V15Zm-6-4h4v4H11Zm4,10H11V17h4Zm6,0H17V17h4Z"/>\n    <path class="jp-icon3" fill="#231F20"  d="M26,28H6a2.0023,2.0023,0,0,1-2-2V6A2.0023,2.0023,0,0,1,6,4H16V6H6V26H26V16h2V26A2.0023,2.0023,0,0,1,26,28Z"/>\n</svg>\n'
        });
      const p = new l.LabIcon({
        name: 'elyra:trashIcon',
        svgstr:
          '<svg focusable="false" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">\n\t<title>Delete item</title>\n\t<g class="jp-icon3" fill="#616161">\n\t\t<path d="M12 12H14V24H12zM18 12H20V24H18z"></path>\n\t\t<path d="M4 6V8H6V28a2 2 0 002 2H24a2 2 0 002-2V8h2V6zM8 28V8H24V28zM12 2H20V4H12z"></path>\n\t</g>\n</svg>\n'
      });
      new l.LabIcon({
        name: 'elyra:helpIcon',
        svgstr:
          '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">\n  <polygon class="jp-icon3 jp-icon-selectable" fill="#000000" points="17 22 17 14 13 14 13 16 15 16 15 22 12 22 12 24 20 24 20 22 17 22"/>\n  <path class="jp-icon3 jp-icon-selectable" fill="#000000" d="M16,8a1.5,1.5,0,1,0,1.5,1.5A1.5,1.5,0,0,0,16,8Z"/>\n  <path class="jp-icon3 jp-icon-selectable" fill="#000000" d="M26,28H6a2.0023,2.0023,0,0,1-2-2V6A2.0023,2.0023,0,0,1,6,4H26a2.0023,2.0023,0,0,1,2,2V26A2.0023,2.0023,0,0,1,26,28ZM6,6V26H26V6Z"/>\n</svg>\n'
      });
      var h = a(5534),
        g = a(3450);
      class m extends n.Component {
        constructor() {
          super(...arguments),
            (this.renderCreateOption = (e, t, a) =>
              n.createElement(h.sN, {
                icon: 'add',
                key: 'createOption',
                text: `Create "${e}"`,
                active: t,
                onClick: a,
                shouldDismissPopover: !1
              })),
            (this.filterDropdown = (e, t, a, n) => {
              const s = t.toLowerCase(),
                l = e.toLowerCase();
              return l === s ? s === l : ('' + s).indexOf(l) >= 0;
            });
        }
        itemRenderer(e, t) {
          return n.createElement(l.Button, {
            className: 'elyra-form-DropDown-item',
            onClick: t.handleClick,
            key: e,
            text: e
          });
        }
        render() {
          let e = this.props.description ? this.props.description : '';
          return (
            this.props.intent == g.S.DANGER &&
              (e += '\nThis field is required.'),
            n.createElement(
              h.cw,
              {
                key: this.props.label,
                label: this.props.label,
                labelInfo: this.props.required,
                helperText: e,
                intent: this.props.intent
              },
              n.createElement(
                l.Select,
                {
                  items: this.props.defaultChoices,
                  itemPredicate: this.filterDropdown,
                  createNewItemFromQuery: e => e,
                  createNewItemRenderer: this.renderCreateOption,
                  onItemSelect: e => {
                    this.props.handleDropdownChange(this.props.schemaField, e);
                  },
                  itemRenderer: this.itemRenderer
                },
                n.createElement(l.Button, {
                  rightIcon: 'caret-down',
                  text: this.props.choice ? this.props.choice : '(No selection)'
                })
              )
            )
          );
        }
      }
      var v = a(650);
      const u = {
        scheme: 'jupyter',
        base00: 'invalid',
        base01: 'invalid',
        base02: 'invalid',
        base03: 'invalid',
        base04: 'invalid',
        base05: 'invalid',
        base06: 'invalid',
        base07: 'invalid',
        base08: 'invalid',
        base09: 'invalid',
        base0A: 'invalid',
        base0B: 'invalid',
        base0C: 'invalid',
        base0D: 'invalid',
        base0E: 'invalid',
        base0F: 'invalid'
      };
      class w extends s().Component {
        render() {
          return s().createElement(v.Z, {
            data: this.props.json,
            theme: {
              extend: u,
              valueLabel: 'cm-variable',
              valueText: 'cm-string',
              nestedNodeItemString: 'cm-comment'
            },
            invertTheme: !1,
            hideRoot: !0,
            getItemString: (e, t, a, n) =>
              Array.isArray(t)
                ? s().createElement('span', null, a, ' ', n)
                : 0 === Object.keys(t).length
                ? s().createElement('span', null, a)
                : null,
            labelRenderer: ([e, t]) =>
              s().createElement('span', { className: 'cm-keyword' }, e + ': '),
            valueRenderer: e => {
              let t = 'cm-string';
              return (
                'number' == typeof e && (t = 'cm-number'),
                ('true' !== e && 'false' !== e) || (t = 'cm-keyword'),
                s().createElement('span', { className: t }, '' + e)
              );
            }
          });
        }
      }
    }
  }
]);
