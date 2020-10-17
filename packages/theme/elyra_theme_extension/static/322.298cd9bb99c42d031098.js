(self.webpackChunk_elyra_theme_extension =
  self.webpackChunk_elyra_theme_extension || []).push([
  [322, 283, 805],
  {
    4599: (e, t, n) => {
      (e.exports = n(2609)(!1)).push([
        e.id,
        '/*\n * Copyright 2018-2020 IBM Corporation\n *\n * Licensed under the Apache License, Version 2.0 (the "License");\n * you may not use this file except in compliance with the License.\n * You may obtain a copy of the License at\n *\n * http://www.apache.org/licenses/LICENSE-2.0\n *\n * Unless required by applicable law or agreed to in writing, software\n * distributed under the License is distributed on an "AS IS" BASIS,\n * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n * See the License for the specific language governing permissions and\n * limitations under the License.\n */\n\n.jp-LabShell {\n  background: var(--jp-layout-color3);\n}\n',
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
                  r,
                  o,
                  a = e[1] || '',
                  i = e[3];
                if (!i) return a;
                if (t && 'function' == typeof btoa) {
                  var s =
                      ((n = i),
                      (r = btoa(
                        unescape(encodeURIComponent(JSON.stringify(n)))
                      )),
                      (o = 'sourceMappingURL=data:application/json;charset=utf-8;base64,'.concat(
                        r
                      )),
                      '/*# '.concat(o, ' */')),
                    c = i.sources.map(function(e) {
                      return '/*# sourceURL='
                        .concat(i.sourceRoot)
                        .concat(e, ' */');
                    });
                  return [a]
                    .concat(c)
                    .concat([s])
                    .join('\n');
                }
                return [a].join('\n');
              })(t, e);
              return t[2] ? '@media '.concat(t[2], '{').concat(n, '}') : n;
            }).join('');
          }),
          (t.i = function(e, n) {
            'string' == typeof e && (e = [[null, e, '']]);
            for (var r = {}, o = 0; o < this.length; o++) {
              var a = this[o][0];
              null != a && (r[a] = !0);
            }
            for (var i = 0; i < e.length; i++) {
              var s = e[i];
              (null != s[0] && r[s[0]]) ||
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
      var r = n(4599);
      'string' == typeof r && (r = [[e.id, r, '']]);
      n(2379)(r, { hmr: !0, transform: void 0, insertInto: void 0 }),
        r.locals && (e.exports = r.locals);
    },
    2379: (e, t, n) => {
      var r,
        o,
        a = {},
        i =
          ((r = function() {
            return window && document && document.all && !window.atob;
          }),
          function() {
            return void 0 === o && (o = r.apply(this, arguments)), o;
          }),
        s = function(e, t) {
          return t ? t.querySelector(e) : document.querySelector(e);
        },
        c = (function(e) {
          var t = {};
          return function(e, n) {
            if ('function' == typeof e) return e();
            if (void 0 === t[e]) {
              var r = s.call(this, e, n);
              if (
                window.HTMLIFrameElement &&
                r instanceof window.HTMLIFrameElement
              )
                try {
                  r = r.contentDocument.head;
                } catch (e) {
                  r = null;
                }
              t[e] = r;
            }
            return t[e];
          };
        })(),
        l = null,
        u = 0,
        d = [],
        p = n(9657);
      function f(e, t) {
        for (var n = 0; n < e.length; n++) {
          var r = e[n],
            o = a[r.id];
          if (o) {
            o.refs++;
            for (var i = 0; i < o.parts.length; i++) o.parts[i](r.parts[i]);
            for (; i < r.parts.length; i++) o.parts.push(g(r.parts[i], t));
          } else {
            var s = [];
            for (i = 0; i < r.parts.length; i++) s.push(g(r.parts[i], t));
            a[r.id] = { id: r.id, refs: 1, parts: s };
          }
        }
      }
      function h(e, t) {
        for (var n = [], r = {}, o = 0; o < e.length; o++) {
          var a = e[o],
            i = t.base ? a[0] + t.base : a[0],
            s = { css: a[1], media: a[2], sourceMap: a[3] };
          r[i] ? r[i].parts.push(s) : n.push((r[i] = { id: i, parts: [s] }));
        }
        return n;
      }
      function m(e, t) {
        var n = c(e.insertInto);
        if (!n)
          throw new Error(
            "Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."
          );
        var r = d[d.length - 1];
        if ('top' === e.insertAt)
          r
            ? r.nextSibling
              ? n.insertBefore(t, r.nextSibling)
              : n.appendChild(t)
            : n.insertBefore(t, n.firstChild),
            d.push(t);
        else if ('bottom' === e.insertAt) n.appendChild(t);
        else {
          if ('object' != typeof e.insertAt || !e.insertAt.before)
            throw new Error(
              "[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n"
            );
          var o = c(e.insertAt.before, n);
          n.insertBefore(t, o);
        }
      }
      function v(e) {
        if (null === e.parentNode) return !1;
        e.parentNode.removeChild(e);
        var t = d.indexOf(e);
        t >= 0 && d.splice(t, 1);
      }
      function y(e) {
        var t = document.createElement('style');
        if (
          (void 0 === e.attrs.type && (e.attrs.type = 'text/css'),
          void 0 === e.attrs.nonce)
        ) {
          var r = n.nc;
          r && (e.attrs.nonce = r);
        }
        return b(t, e.attrs), m(e, t), t;
      }
      function b(e, t) {
        Object.keys(t).forEach(function(n) {
          e.setAttribute(n, t[n]);
        });
      }
      function g(e, t) {
        var n, r, o, a;
        if (t.transform && e.css) {
          if (
            !(a =
              'function' == typeof t.transform
                ? t.transform(e.css)
                : t.transform.default(e.css))
          )
            return function() {};
          e.css = a;
        }
        if (t.singleton) {
          var i = u++;
          (n = l || (l = y(t))),
            (r = x.bind(null, n, i, !1)),
            (o = x.bind(null, n, i, !0));
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
                  b(t, e.attrs),
                  m(e, t),
                  t
                );
              })(t)),
              (r = C.bind(null, n, t)),
              (o = function() {
                v(n), n.href && URL.revokeObjectURL(n.href);
              }))
            : ((n = y(t)),
              (r = I.bind(null, n)),
              (o = function() {
                v(n);
              }));
        return (
          r(e),
          function(t) {
            if (t) {
              if (
                t.css === e.css &&
                t.media === e.media &&
                t.sourceMap === e.sourceMap
              )
                return;
              r((e = t));
            } else o();
          }
        );
      }
      e.exports = function(e, t) {
        if ('undefined' != typeof DEBUG && DEBUG && 'object' != typeof document)
          throw new Error(
            'The style-loader cannot be used in a non-browser environment'
          );
        ((t = t || {}).attrs = 'object' == typeof t.attrs ? t.attrs : {}),
          t.singleton || 'boolean' == typeof t.singleton || (t.singleton = i()),
          t.insertInto || (t.insertInto = 'head'),
          t.insertAt || (t.insertAt = 'bottom');
        var n = h(e, t);
        return (
          f(n, t),
          function(e) {
            for (var r = [], o = 0; o < n.length; o++) {
              var i = n[o];
              (s = a[i.id]).refs--, r.push(s);
            }
            for (e && f(h(e, t), t), o = 0; o < r.length; o++) {
              var s;
              if (0 === (s = r[o]).refs) {
                for (var c = 0; c < s.parts.length; c++) s.parts[c]();
                delete a[s.id];
              }
            }
          }
        );
      };
      var w,
        L =
          ((w = []),
          function(e, t) {
            return (w[e] = t), w.filter(Boolean).join('\n');
          });
      function x(e, t, n, r) {
        var o = n ? '' : r.css;
        if (e.styleSheet) e.styleSheet.cssText = L(t, o);
        else {
          var a = document.createTextNode(o),
            i = e.childNodes;
          i[t] && e.removeChild(i[t]),
            i.length ? e.insertBefore(a, i[t]) : e.appendChild(a);
        }
      }
      function I(e, t) {
        var n = t.css,
          r = t.media;
        if ((r && e.setAttribute('media', r), e.styleSheet))
          e.styleSheet.cssText = n;
        else {
          for (; e.firstChild; ) e.removeChild(e.firstChild);
          e.appendChild(document.createTextNode(n));
        }
      }
      function C(e, t, n) {
        var r = n.css,
          o = n.sourceMap,
          a = void 0 === t.convertToAbsoluteUrls && o;
        (t.convertToAbsoluteUrls || a) && (r = p(r)),
          o &&
            (r +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(o)))) +
              ' */');
        var i = new Blob([r], { type: 'text/css' }),
          s = e.href;
        (e.href = URL.createObjectURL(i)), s && URL.revokeObjectURL(s);
      }
    },
    9657: e => {
      e.exports = function(e) {
        var t = 'undefined' != typeof window && window.location;
        if (!t) throw new Error('fixUrls requires window.location');
        if (!e || 'string' != typeof e) return e;
        var n = t.protocol + '//' + t.host,
          r = n + t.pathname.replace(/\/[^\/]*$/, '/');
        return e.replace(
          /url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi,
          function(e, t) {
            var o,
              a = t
                .trim()
                .replace(/^"(.*)"$/, function(e, t) {
                  return t;
                })
                .replace(/^'(.*)'$/, function(e, t) {
                  return t;
                });
            return /^(#|data:|http:\/\/|https:\/\/|file:\/\/\/|\s*$)/i.test(a)
              ? e
              : ((o =
                  0 === a.indexOf('//')
                    ? a
                    : 0 === a.indexOf('/')
                    ? n + a
                    : r + a.replace(/^\.\//, '')),
                'url(' + JSON.stringify(o) + ')');
          }
        );
      };
    },
    5322: (e, t, n) => {
      'use strict';
      n.r(t), n.d(t, { default: () => b });
      var r = n(5216),
        o = n(4922),
        a = n(4268),
        i = n(1163),
        s = n(6011),
        c = n(6455),
        l = n(9850),
        u = n(2959);
      const d = 'Elyra',
        p = ['Notebook', 'Console', d, 'Other'];
      class f extends i.Launcher {
        constructor(e) {
          super(e);
        }
        replaceCategoryIcon(e, t) {
          const n = u.Children.map(e.props.children, e => {
            if ('jp-Launcher-sectionHeader' === e.props.className) {
              const n = u.Children.map(e.props.children, e =>
                'jp-Launcher-sectionTitle' !== e.props.className
                  ? u.createElement(t.react, { stylesheet: 'launcherSection' })
                  : e
              );
              return u.cloneElement(e, e.props, n);
            }
            return e;
          });
          return u.cloneElement(e, e.props, n);
        }
        render() {
          if (!this.model) return null;
          const e = super.render().props.children.props.children,
            t = [];
          return (
            (0, l.each)(p, (n, o) => {
              u.Children.forEach(e, e => {
                e.key === n &&
                  (e.key === d &&
                    (e = this.replaceCategoryIcon(e, r.elyraIcon)),
                  t.push(e));
              });
            }),
            u.createElement(
              'div',
              { className: 'jp-Launcher-body' },
              u.createElement(
                'div',
                { className: 'jp-Launcher-content' },
                u.createElement(
                  'div',
                  { className: 'jp-Launcher-cwd' },
                  u.createElement('h3', null, this.cwd)
                ),
                t
              )
            )
          );
        }
      }
      n(7283);
      const h = 'launcher:create',
        m = 'elyra:open-help',
        v = {
          id: 'elyra-theme-extension',
          autoStart: !0,
          requires: [o.ILabShell, s.IMainMenu],
          optional: [a.ICommandPalette],
          provides: i.ILauncher,
          activate: (e, t, n, o) => {
            console.log('Elyra - theme extension is activated!');
            const s = e.shell.widgets('top');
            let u = s.next();
            for (; void 0 !== u; ) {
              if ('jp-MainLogo' === u.id) {
                r.elyraIcon.element({
                  container: u.node,
                  justify: 'center',
                  margin: '2px 5px 2px 5px',
                  height: 'auto',
                  width: '20px'
                });
                break;
              }
              u = s.next();
            }
            const { commands: d } = e,
              p = new i.LauncherModel();
            return (
              d.addCommand(h, {
                label: 'New Launcher',
                execute: e => {
                  const n = e.cwd ? String(e.cwd) : '',
                    r = 'launcher-' + y.id++,
                    o = new f({
                      model: p,
                      cwd: n,
                      callback: e => {
                        t.add(e, 'main', { ref: r });
                      },
                      commands: d
                    });
                  (o.model = p),
                    (o.title.icon = c.launcherIcon),
                    (o.title.label = 'Launcher');
                  const i = new a.MainAreaWidget({ content: o });
                  return (
                    (i.title.closable = !!(0, l.toArray)(t.widgets('main'))
                      .length),
                    (i.id = r),
                    t.add(i, 'main', { activate: e.activate }),
                    t.layoutModified.connect(() => {
                      i.title.closable =
                        (0, l.toArray)(t.widgets('main')).length > 1;
                    }, i),
                    i
                  );
                }
              }),
              o && o.addItem({ command: h, category: 'Launcher' }),
              d.addCommand(m, {
                label: 'Documentation',
                icon: r.helpIcon,
                execute: e => {
                  window.open(
                    'https://elyra.readthedocs.io/en/latest/',
                    '_blank'
                  );
                }
              }),
              p.add({ command: m, category: 'Elyra', rank: 10 }),
              p
            );
          }
        };
      var y;
      !(function(e) {
        e.id = 0;
      })(y || (y = {}));
      const b = v;
    }
  }
]);
