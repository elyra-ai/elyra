(self.webpackChunk_elyra_metadata_common =
  self.webpackChunk_elyra_metadata_common || []).push([
  [937, 789],
  {
    4363: (e, t, a) => {
      (e.exports = a(2609)(!1)).push([
        e.id,
        '/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the "License");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an "AS IS" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n',
        ''
      ]);
    },
    2401: (e, t, a) => {
      var s = a(4363);
      'string' == typeof s && (s = [[e.id, s, '']]);
      a(2379)(s, { hmr: !0, transform: void 0, insertInto: void 0 }),
        s.locals && (e.exports = s.locals);
    },
    8439: (e, t, a) => {
      'use strict';
      a.r(t),
        a.d(t, {
          FrontendServices: () => l,
          NotebookParser: () => s,
          RequestHandler: () => u
        }),
        a(2401);
      class s {
        static getEnvVars(e) {
          const t = [],
            a = JSON.parse(e),
            s = /os\.(?:environ(?:\["([^"]+)|\['([^']+)|\.get\("([^"]+)|\.get\('([^']+))|getenv\("([^"]+)|getenv\('([^']+))/;
          for (const e of a.cells)
            if ('code' == e.cell_type) {
              const a = this.findInCode(e.source, s);
              for (const e of a)
                for (let a = 1; a < e.length; a++) e[a] && t.push(e[a]);
            }
          return [...new Set(t)];
        }
        static findInCode(e, t) {
          const a = [],
            s = e.split(/\r?\n/);
          for (const e of s) {
            const s = e.match(t);
            s && a.push(s);
          }
          return a;
        }
      }
      var r = a(4268),
        n = a(2959),
        o = a(5216),
        i = a(2822),
        c = a(3526);
      class u {
        static serverError(e) {
          const t = e.reason ? e.reason : '',
            a = e.message ? e.message : '',
            s = e.timestamp ? e.timestamp : '',
            i = e.traceback ? e.traceback : '',
            c = e.timestamp
              ? 'Check the JupyterLab log for more details at ' + e.timestamp
              : 'Check the JupyterLab log for more details';
          return (0, r.showDialog)({
            title: 'Error making request',
            body:
              t || a
                ? n.createElement(o.ExpandableErrorDialog, {
                    reason: t,
                    message: a,
                    timestamp: s,
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
          const s = c.ServerConnection.makeSettings(),
            n = i.URLExt.join(s.baseUrl, e);
          console.log(`Sending a ${t.method} request to ${n}`);
          const o = new r.Dialog({
            title: 'Making server request...',
            body: 'This may take some time',
            buttons: [r.Dialog.okButton()]
          });
          a && o.launch();
          const u = new Promise((r, i) => {
            c.ServerConnection.makeRequest(n, t, s).then(
              t => {
                a && o.resolve(),
                  t.json().then(
                    e => {
                      if (t.status < 200 || t.status >= 300)
                        return this.serverError(e);
                      r(e);
                    },
                    a =>
                      404 == t.status
                        ? this.server404(e)
                        : 204 != t.status
                        ? this.serverError(a)
                        : void r()
                  );
              },
              e => (console.error(e), this.serverError(e))
            );
          });
          return await u;
        }
      }
      const m = 'elyra/metadata/';
      class l {
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
          return (await u.makeGetRequest(m + e, !1))[e];
        }
        static async postMetadata(e, t) {
          return await u.makePostRequest(m + e, t, !1);
        }
        static async putMetadata(e, t, a) {
          return await u.makePutRequest(m + e + '/' + t, a, !1);
        }
        static async deleteMetadata(e, t) {
          return await u.makeDeleteRequest(m + e + '/' + t, !1);
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
          for (const a of e.namespaces) {
            const e = await this.getSchema(a);
            t.push(...e);
          }
          return t;
        }
      }
      l.schemaCache = {};
    }
  }
]);
