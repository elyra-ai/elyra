var _JUPYTERLAB;
(_JUPYTERLAB = void 0 === _JUPYTERLAB ? {} : _JUPYTERLAB)[
  '@elyra/ui-components'
] = (() => {
  'use strict';
  var e,
    r,
    t,
    n,
    o,
    a,
    i,
    u,
    l,
    s,
    f,
    d,
    c,
    p,
    h,
    v,
    m,
    b,
    g = {
      5592: (e, r, t) => {
        var n = {
            './index': () =>
              Promise.all([t.e(959), t.e(283), t.e(672)]).then(() => () =>
                t(1672)
              ),
            './style': () => t.e(283).then(() => () => t(7283))
          },
          o = (e, r) => (
            (t.R = r),
            (r = t.o(n, e)
              ? n[e]()
              : Promise.resolve().then(() => {
                  throw new Error(
                    'Module "' + e + '" does not exist in container.'
                  );
                })),
            (t.R = void 0),
            r
          ),
          a = (e, r) => {
            if (t.S) {
              var n = t.S.default,
                o = 'default';
              if (n && n !== e)
                throw new Error(
                  'Container initialization failed as it has already been initialized with a different share scope'
                );
              return (t.S[o] = e), t.I(o, r);
            }
          };
        t.d(r, { get: () => o, init: () => a });
      }
    },
    y = {};
  function w(e) {
    if (y[e]) return y[e].exports;
    var r = (y[e] = { id: e, exports: {} });
    return g[e](r, r.exports, w), r.exports;
  }
  return (
    (w.m = g),
    (w.n = e => {
      var r = e && e.__esModule ? () => e.default : () => e;
      return w.d(r, { a: r }), r;
    }),
    (w.d = (e, r) => {
      for (var t in r)
        w.o(r, t) &&
          !w.o(e, t) &&
          Object.defineProperty(e, t, { enumerable: !0, get: r[t] });
    }),
    (w.f = {}),
    (w.e = e =>
      Promise.all(Object.keys(w.f).reduce((r, t) => (w.f[t](e, r), r), []))),
    (w.u = e =>
      e +
      '.' +
      {
        35: 'a94dcab97d23ee798ede',
        283: 'c500f57c165e0cb14a4a',
        650: 'fb2d79b7dc76eb5f5e27',
        672: '2e88da1ff8ce6d462fde',
        844: 'c2e7173808cec9f570ba',
        959: '8bfbdf1e331c49f92f3d'
      }[e] +
      '.js'),
    (w.g = (function() {
      if ('object' == typeof globalThis) return globalThis;
      try {
        return this || new Function('return this')();
      } catch (e) {
        if ('object' == typeof window) return window;
      }
    })()),
    (w.o = (e, r) => Object.prototype.hasOwnProperty.call(e, r)),
    (e = {}),
    (r = '@elyra/ui-components:'),
    (w.l = (t, n, o) => {
      if (e[t]) e[t].push(n);
      else {
        var a, i;
        if (void 0 !== o)
          for (
            var u = document.getElementsByTagName('script'), l = 0;
            l < u.length;
            l++
          ) {
            var s = u[l];
            if (
              s.getAttribute('src') == t ||
              s.getAttribute('data-webpack') == r + o
            ) {
              a = s;
              break;
            }
          }
        a ||
          ((i = !0),
          ((a = document.createElement('script')).charset = 'utf-8'),
          (a.timeout = 120),
          w.nc && a.setAttribute('nonce', w.nc),
          a.setAttribute('data-webpack', r + o),
          (a.src = t)),
          (e[t] = [n]);
        var f = (r, n) => {
            (a.onerror = a.onload = null), clearTimeout(d);
            var o = e[t];
            if (
              (delete e[t],
              a.parentNode && a.parentNode.removeChild(a),
              o && o.forEach(e => e(n)),
              r)
            )
              return r(n);
          },
          d = setTimeout(
            f.bind(null, void 0, { type: 'timeout', target: a }),
            12e4
          );
        (a.onerror = f.bind(null, a.onerror)),
          (a.onload = f.bind(null, a.onload)),
          i && document.head.appendChild(a);
      }
    }),
    (w.r = e => {
      'undefined' != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
        Object.defineProperty(e, '__esModule', { value: !0 });
    }),
    (() => {
      w.S = {};
      var e = {},
        r = {};
      w.I = (t, n) => {
        n || (n = []);
        var o = r[t];
        if ((o || (o = r[t] = {}), !(n.indexOf(o) >= 0))) {
          if ((n.push(o), e[t])) return e[t];
          w.o(w.S, t) || (w.S[t] = {});
          var a = w.S[t],
            i = '@elyra/ui-components',
            u = (e, r, t) => {
              var n = (a[e] = a[e] || {}),
                o = n[r];
              (!o || (!o.loaded && i > o.from)) && (n[r] = { get: t, from: i });
            },
            l = [];
          switch (t) {
            case 'default':
              u('@blueprintjs/core', '3.28.1', () =>
                Promise.all([w.e(35), w.e(959), w.e(844)]).then(() => () =>
                  w(6035)
                )
              ),
                u('@elyra/ui-components', '2.0.0-dev', () =>
                  Promise.all([w.e(959), w.e(283), w.e(672)]).then(() => () =>
                    w(1672)
                  )
                ),
                u('react-json-tree', '0.11.2', () =>
                  Promise.all([w.e(650), w.e(959)]).then(() => () => w(650))
                );
          }
          return (e[t] = l.length ? Promise.all(l).then(() => (e[t] = 1)) : 1);
        }
      };
    })(),
    (() => {
      var e;
      w.g.importScripts && (e = w.g.location + '');
      var r = w.g.document;
      if (!e && r && (r.currentScript && (e = r.currentScript.src), !e)) {
        var t = r.getElementsByTagName('script');
        t.length && (e = t[t.length - 1].src);
      }
      if (!e)
        throw new Error(
          'Automatic publicPath is not supported in this browser'
        );
      (e = e
        .replace(/#.*$/, '')
        .replace(/\?.*$/, '')
        .replace(/\/[^\/]+$/, '/')),
        (w.p = e);
    })(),
    (t = e => {
      var r = e => e.split('.').map(e => (+e == e ? +e : e)),
        t = /^([^-+]+)?(?:-([^+]+))?(?:\+(.+))?$/.exec(e),
        n = t[1] ? r(t[1]) : [];
      return (
        t[2] && (n.length++, n.push.apply(n, r(t[2]))),
        t[3] && (n.push([]), n.push.apply(n, r(t[3]))),
        n
      );
    }),
    (n = (e, r) => {
      (e = t(e)), (r = t(r));
      for (var n = 0; ; ) {
        if (n >= e.length) return n < r.length && 'u' != (typeof r[n])[0];
        var o = e[n],
          a = (typeof o)[0];
        if (n >= r.length) return 'u' == a;
        var i = r[n],
          u = (typeof i)[0];
        if (a != u) return ('o' == a && 'n' == u) || 's' == u || 'u' == a;
        if ('o' != a && 'u' != a && o != i) return o < i;
        n++;
      }
    }),
    (o = e => {
      if (1 === e.length) return '*';
      if (0 in e) {
        var r = '',
          t = e[0];
        r +=
          0 == t
            ? '>='
            : -1 == t
            ? '<'
            : 1 == t
            ? '^'
            : 2 == t
            ? '~'
            : t > 0
            ? '='
            : '!=';
        for (var n = 1, a = 1; a < e.length; a++)
          n--,
            (r +=
              'u' == (typeof (u = e[a]))[0]
                ? '-'
                : (n > 0 ? '.' : '') + ((n = 2), u));
        return r;
      }
      var i = [];
      for (a = 1; a < e.length; a++) {
        var u = e[a];
        i.push(
          0 === u
            ? 'not(' + l() + ')'
            : 1 === u
            ? '(' + l() + ' || ' + l() + ')'
            : 2 === u
            ? i.pop() + ' ' + i.pop()
            : o(u)
        );
      }
      return l();
      function l() {
        return i.pop().replace(/^\((.+)\)$/, '$1');
      }
    }),
    (a = (e, r) => {
      if (0 in e) {
        r = t(r);
        var n = e[0],
          o = n < 0;
        o && (n = -n - 1);
        for (var i = 0, u = 1, l = !0; ; u++, i++) {
          var s,
            f,
            d = u < e.length ? (typeof e[u])[0] : '';
          if (i >= r.length || 'o' == (f = (typeof (s = r[i]))[0]))
            return !l || ('u' == d ? u > n && !o : ('' == d) != o);
          if ('u' == f) {
            if (!l || 'u' != d) return !1;
          } else if (l)
            if (d == f)
              if (u <= n) {
                if (s != e[u]) return !1;
              } else {
                if (o ? s > e[u] : s < e[u]) return !1;
                s != e[u] && (l = !1);
              }
            else if ('s' != d && 'n' != d) {
              if (o || u <= n) return !1;
              (l = !1), u--;
            } else {
              if (u <= n || f < d != o) return !1;
              l = !1;
            }
          else 's' != d && 'n' != d && ((l = !1), u--);
        }
      }
      var c = [],
        p = c.pop.bind(c);
      for (i = 1; i < e.length; i++) {
        var h = e[i];
        c.push(1 == h ? p() | p() : 2 == h ? p() & p() : h ? a(h, r) : !p());
      }
      return !!p();
    }),
    (i = (e, r) => {
      var t = w.S[e];
      if (!t || !w.o(t, r))
        throw new Error(
          'Shared module ' + r + " doesn't exist in shared scope " + e
        );
      return t;
    }),
    (u = (e, r) => {
      var t = e[r];
      return Object.keys(t).reduce(
        (e, r) => (!e || (!t[e].loaded && n(e, r)) ? r : e),
        0
      );
    }),
    (l = (e, r, t) =>
      'Unsatisfied version ' +
      r +
      ' of shared singleton module ' +
      e +
      ' (required ' +
      o(t) +
      ')'),
    (s = (e, r, t, n) => {
      var o = u(e, t);
      return (
        a(n, o) ||
          ('undefined' != typeof console &&
            console.warn &&
            console.warn(l(t, o, n))),
        d(e[t][o])
      );
    }),
    (f = (e, r, t) => {
      var o = e[r];
      return (
        (r = Object.keys(o).reduce(
          (e, r) => (!a(t, r) || (e && !n(e, r)) ? e : r),
          0
        )) && o[r]
      );
    }),
    (d = e => ((e.loaded = 1), e.get())),
    (p = (c = e =>
      function(r, t, n, o) {
        var a = w.I(r);
        return a && a.then
          ? a.then(e.bind(e, r, w.S[r], t, n, o))
          : e(r, w.S[r], t, n, o);
      })((e, r, t, n) => (i(e, t), s(r, 0, t, n)))),
    (h = c((e, r, t, n, o) => {
      var a = r && w.o(r, t) && f(r, t, n);
      return a ? d(a) : o();
    })),
    (v = {}),
    (m = {
      2959: () => p('default', 'react', [1, 16, 13, 1]),
      2054: () =>
        h('default', '@blueprintjs/core', [1, 3, 22, 2], () =>
          Promise.all([w.e(35), w.e(844)]).then(() => () => w(6035))
        ),
      2916: () => p('default', '@lumino/widgets', [1, 1, 14, 0]),
      4268: () => p('default', '@jupyterlab/apputils', [1, 3, 0, 0, , 'rc', 5]),
      5530: () =>
        h('default', 'react-json-tree', [2, 0, 11, 2], () =>
          w.e(650).then(() => () => w(650))
        ),
      5875: () =>
        p('default', '@jupyterlab/filebrowser', [1, 3, 0, 0, , 'rc', 5]),
      6455: () =>
        p('default', '@jupyterlab/ui-components', [1, 3, 0, 0, , 'rc', 5]),
      8844: () => p('default', 'react-dom', [1, 16, 13, 1])
    }),
    (b = {
      672: [2054, 2916, 4268, 5530, 5875, 6455],
      844: [8844],
      959: [2959]
    }),
    (w.f.consumes = (e, r) => {
      w.o(b, e) &&
        b[e].forEach(e => {
          if (w.o(v, e)) return r.push(v[e]);
          var t = r => {
              (v[e] = 0),
                (g[e] = t => {
                  delete y[e], (t.exports = r());
                });
            },
            n = r => {
              delete v[e],
                (g[e] = t => {
                  throw (delete y[e], r);
                });
            };
          try {
            var o = m[e]();
            o.then ? r.push((v[e] = o.then(t).catch(n))) : t(o);
          } catch (e) {
            n(e);
          }
        });
    }),
    (() => {
      var e = { 671: 0 };
      w.f.j = (r, t) => {
        var n = w.o(e, r) ? e[r] : void 0;
        if (0 !== n)
          if (n) t.push(n[2]);
          else if (/^(844|959)$/.test(r)) e[r] = 0;
          else {
            var o = new Promise((t, o) => {
              n = e[r] = [t, o];
            });
            t.push((n[2] = o));
            var a = w.p + w.u(r),
              i = new Error();
            w.l(
              a,
              t => {
                if (w.o(e, r) && (0 !== (n = e[r]) && (e[r] = void 0), n)) {
                  var o = t && ('load' === t.type ? 'missing' : t.type),
                    a = t && t.target && t.target.src;
                  (i.message =
                    'Loading chunk ' + r + ' failed.\n(' + o + ': ' + a + ')'),
                    (i.name = 'ChunkLoadError'),
                    (i.type = o),
                    (i.request = a),
                    n[1](i);
                }
              },
              'chunk-' + r
            );
          }
      };
      var r = (self.webpackChunk_elyra_ui_components =
          self.webpackChunk_elyra_ui_components || []),
        t = r.push.bind(r);
      r.push = r => {
        for (var n, o, [a, i, u] = r, l = 0, s = []; l < a.length; l++)
          (o = a[l]), w.o(e, o) && e[o] && s.push(e[o][0]), (e[o] = 0);
        for (n in i) w.o(i, n) && (w.m[n] = i[n]);
        for (u && u(w), t(r); s.length; ) s.shift()();
      };
    })(),
    w(5592)
  );
})();
