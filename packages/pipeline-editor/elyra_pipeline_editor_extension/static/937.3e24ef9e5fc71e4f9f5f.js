(self.webpackChunk_elyra_pipeline_editor_extension =
  self.webpackChunk_elyra_pipeline_editor_extension || []).push([
  [937, 789],
  {
    4363: (e, t, s) => {
      (e.exports = s(2609)(!1)).push([
        e.id,
        '/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the "License");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an "AS IS" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n',
        ''
      ]);
    },
    2401: (e, t, s) => {
      var a = s(4363);
      'string' == typeof a && (a = [[e.id, a, '']]);
      s(4431)(a, { hmr: !0, transform: void 0, insertInto: void 0 }),
        a.locals && (e.exports = a.locals);
    },
    8439: (e, t, s) => {
      'use strict';
      s.r(t),
        s.d(t, {
          FrontendServices: () => m,
          NotebookParser: () => a,
          RequestHandler: () => u
        }),
        s(2401);
      class a {
        static getEnvVars(e) {
          const t = [],
            s = JSON.parse(e),
            a = /os\.(?:environ(?:\["([^"]+)|\['([^']+)|\.get\("([^"]+)|\.get\('([^']+))|getenv\("([^"]+)|getenv\('([^']+))/;
          for (const e of s.cells)
            if ('code' == e.cell_type) {
              const s = this.findInCode(e.source, a);
              for (const e of s)
                for (let s = 1; s < e.length; s++) e[s] && t.push(e[s]);
            }
          return [...new Set(t)];
        }
        static findInCode(e, t) {
          const s = [],
            a = e.split(/\r?\n/);
          for (const e of a) {
            const a = e.match(t);
            a && s.push(a);
          }
          return s;
        }
      }
      var r = s(4268),
        n = s(2959),
        o = s(5216),
        i = s(2822),
        c = s(3526);
      class u {
        static serverError(e) {
          const t = e.reason ? e.reason : '',
            s = e.message ? e.message : '',
            a = e.timestamp ? e.timestamp : '',
            i = e.traceback ? e.traceback : '',
            c = e.timestamp
              ? 'Check the JupyterLab log for more details at ' + e.timestamp
              : 'Check the JupyterLab log for more details';
          return (0, r.showDialog)({
            title: 'Error making request',
            body:
              t || s
                ? n.createElement(o.ExpandableErrorDialog, {
                    reason: t,
                    message: s,
                    timestamp: a,
                    traceback: i,
                    default_msg: c
                  })
                : n.createElement('p', null, c),
            buttons: [r.Dialog.okButton()]
          });
        }
        static server404(e) {
          return (0, r.showDialog)({
            title: 'Error contacting server',
            body: n.createElement(
              'p',
              null,
              'Endpoint ',
              n.createElement('code', null, e),
              ' not found.'
            ),
            buttons: [r.Dialog.okButton()]
          });
        }
        static async makeGetRequest(e, t) {
          return this.makeServerRequest(e, { method: 'GET' }, t);
        }
        static async makePostRequest(e, t, s) {
          return this.makeServerRequest(e, { method: 'POST', body: t }, s);
        }
        static async makePutRequest(e, t, s) {
          return this.makeServerRequest(e, { method: 'PUT', body: t }, s);
        }
        static async makeDeleteRequest(e, t) {
          return this.makeServerRequest(e, { method: 'DELETE' }, t);
        }
        static async makeServerRequest(e, t, s) {
          const a = c.ServerConnection.makeSettings(),
            n = i.URLExt.join(a.baseUrl, e);
          console.log(`Sending a ${t.method} request to ${n}`);
          const o = new r.Dialog({
            title: 'Making server request...',
            body: 'This may take some time',
            buttons: [r.Dialog.okButton()]
          });
          s && o.launch();
          const u = new Promise((r, i) => {
            c.ServerConnection.makeRequest(n, t, a).then(
              t => {
                s && o.resolve(),
                  t.json().then(
                    e => {
                      if (t.status < 200 || t.status >= 300)
                        return this.serverError(e);
                      r(e);
                    },
                    s =>
                      404 == t.status
                        ? this.server404(e)
                        : 204 != t.status
                        ? this.serverError(s)
                        : void r()
                  );
              },
              e => (console.error(e), this.serverError(e))
            );
          });
          return await u;
        }
      }
      const l = 'elyra/metadata/';
      class m {
        static noMetadataError(e) {
          return (0, r.showDialog)({
            title: 'Error retrieving metadata',
            body: n.createElement(
              'p',
              null,
              'No ',
              e,
              ' metadata has been configured.'
            ),
            buttons: [r.Dialog.okButton()]
          });
        }
        static async getMetadata(e) {
          return (await u.makeGetRequest(l + e, !1))[e];
        }
        static async postMetadata(e, t) {
          return await u.makePostRequest(l + e, t, !1);
        }
        static async putMetadata(e, t, s) {
          return await u.makePutRequest(l + e + '/' + t, s, !1);
        }
        static async deleteMetadata(e, t) {
          return await u.makeDeleteRequest(l + e + '/' + t, !1);
        }
        static async getSchema(e) {
          if (this.schemaCache[e])
            return JSON.parse(JSON.stringify(this.schemaCache[e]));
          const t = await u.makeGetRequest('elyra/schema/' + e, !1);
          return t[e] && (this.schemaCache[e] = t[e]), t[e];
        }
        static async getAllSchema() {
          const e = await u.makeGetRequest('elyra/namespace', !1),
            t = [];
          for (const s of e.namespaces) {
            const e = await this.getSchema(s);
            t.push(...e);
          }
          return t;
        }
      }
      m.schemaCache = {};
    }
  }
]);
