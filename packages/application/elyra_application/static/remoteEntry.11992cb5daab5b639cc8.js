var _JUPYTERLAB;
(_JUPYTERLAB = void 0 === _JUPYTERLAB ? {} : _JUPYTERLAB)[
  '@elyra/application'
] = (() => {
  'use strict';
  var e,
    r,
    t,
    n,
    a,
    o,
    i,
    l,
    u,
    s,
    d,
    f,
    p,
    c,
    h,
    v,
    y,
    g,
    m = {
      9491: (e, r, t) => {
        var n = {
            './index': () =>
              Promise.all([t.e(9), t.e(581)]).then(() => () => t(6581)),
            './style': () => t.e(283).then(() => () => t(7283))
          },
          a = (e, r) => (
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
          o = (e, r) => {
            if (t.S) {
              var n = t.S.default,
                a = 'default';
              if (n && n !== e)
                throw new Error(
                  'Container initialization failed as it has already been initialized with a different share scope'
                );
              return (t.S[a] = e), t.I(a, r);
            }
          };
        t.d(r, { get: () => a, init: () => o });
      }
    },
    b = {};
  function w(e) {
    if (b[e]) return b[e].exports;
    var r = (b[e] = { id: e, exports: {} });
    return m[e](r, r.exports, w), r.exports;
  }
  return (
    (w.m = m),
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
        9: 'aa50f78c6521e2e3d3cd',
        283: 'af92783f8db9f79786a3',
        581: 'becb0017b396bf98729f',
        751: '664ca7255c269fa4b9f7',
        805: 'f74495bc6e41838f3549',
        909: 'b0dc0895a2048d5fd11b'
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
    (r = '@elyra/application:'),
    (w.l = (t, n, a) => {
      if (e[t]) e[t].push(n);
      else {
        var o, i;
        if (void 0 !== a)
          for (
            var l = document.getElementsByTagName('script'), u = 0;
            u < l.length;
            u++
          ) {
            var s = l[u];
            if (
              s.getAttribute('src') == t ||
              s.getAttribute('data-webpack') == r + a
            ) {
              o = s;
              break;
            }
          }
        o ||
          ((i = !0),
          ((o = document.createElement('script')).charset = 'utf-8'),
          (o.timeout = 120),
          w.nc && o.setAttribute('nonce', w.nc),
          o.setAttribute('data-webpack', r + a),
          (o.src = t)),
          (e[t] = [n]);
        var d = (r, n) => {
            (o.onerror = o.onload = null), clearTimeout(f);
            var a = e[t];
            if (
              (delete e[t],
              o.parentNode && o.parentNode.removeChild(o),
              a && a.forEach(e => e(n)),
              r)
            )
              return r(n);
          },
          f = setTimeout(
            d.bind(null, void 0, { type: 'timeout', target: o }),
            12e4
          );
        (o.onerror = d.bind(null, o.onerror)),
          (o.onload = d.bind(null, o.onload)),
          i && document.head.appendChild(o);
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
        var a = r[t];
        if ((a || (a = r[t] = {}), !(n.indexOf(a) >= 0))) {
          if ((n.push(a), e[t])) return e[t];
          w.o(w.S, t) || (w.S[t] = {});
          var o = w.S[t],
            i = '@elyra/application',
            l = (e, r, t) => {
              var n = (o[e] = o[e] || {}),
                a = n[r];
              (!a || (!a.loaded && i > a.from)) && (n[r] = { get: t, from: i });
            },
            u = [];
          switch (t) {
            case 'default':
              l('@elyra/application', '2.0.0-dev', () =>
                Promise.all([w.e(9), w.e(581)]).then(() => () => w(6581))
              ),
                l('@elyra/ui-components', '2.0.0-dev', () =>
                  Promise.all([
                    w.e(909),
                    w.e(751),
                    w.e(9),
                    w.e(805)
                  ]).then(() => () => w(9883))
                );
          }
          return (e[t] = u.length ? Promise.all(u).then(() => (e[t] = 1)) : 1);
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
        var a = e[n],
          o = (typeof a)[0];
        if (n >= r.length) return 'u' == o;
        var i = r[n],
          l = (typeof i)[0];
        if (o != l) return ('o' == o && 'n' == l) || 's' == l || 'u' == o;
        if ('o' != o && 'u' != o && a != i) return a < i;
        n++;
      }
    }),
    (a = e => {
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
        for (var n = 1, o = 1; o < e.length; o++)
          n--,
            (r +=
              'u' == (typeof (l = e[o]))[0]
                ? '-'
                : (n > 0 ? '.' : '') + ((n = 2), l));
        return r;
      }
      var i = [];
      for (o = 1; o < e.length; o++) {
        var l = e[o];
        i.push(
          0 === l
            ? 'not(' + u() + ')'
            : 1 === l
            ? '(' + u() + ' || ' + u() + ')'
            : 2 === l
            ? i.pop() + ' ' + i.pop()
            : a(l)
        );
      }
      return u();
      function u() {
        return i.pop().replace(/^\((.+)\)$/, '$1');
      }
    }),
    (o = (e, r) => {
      if (0 in e) {
        r = t(r);
        var n = e[0],
          a = n < 0;
        a && (n = -n - 1);
        for (var i = 0, l = 1, u = !0; ; l++, i++) {
          var s,
            d,
            f = l < e.length ? (typeof e[l])[0] : '';
          if (i >= r.length || 'o' == (d = (typeof (s = r[i]))[0]))
            return !u || ('u' == f ? l > n && !a : ('' == f) != a);
          if ('u' == d) {
            if (!u || 'u' != f) return !1;
          } else if (u)
            if (f == d)
              if (l <= n) {
                if (s != e[l]) return !1;
              } else {
                if (a ? s > e[l] : s < e[l]) return !1;
                s != e[l] && (u = !1);
              }
            else if ('s' != f && 'n' != f) {
              if (a || l <= n) return !1;
              (u = !1), l--;
            } else {
              if (l <= n || d < f != a) return !1;
              u = !1;
            }
          else 's' != f && 'n' != f && ((u = !1), l--);
        }
      }
      var p = [],
        c = p.pop.bind(p);
      for (i = 1; i < e.length; i++) {
        var h = e[i];
        p.push(1 == h ? c() | c() : 2 == h ? c() & c() : h ? o(h, r) : !c());
      }
      return !!c();
    }),
    (i = (e, r) => {
      var t = w.S[e];
      if (!t || !w.o(t, r))
        throw new Error(
          'Shared module ' + r + " doesn't exist in shared scope " + e
        );
      return t;
    }),
    (l = (e, r) => {
      var t = e[r];
      return Object.keys(t).reduce(
        (e, r) => (!e || (!t[e].loaded && n(e, r)) ? r : e),
        0
      );
    }),
    (u = (e, r, t) =>
      'Unsatisfied version ' +
      r +
      ' of shared singleton module ' +
      e +
      ' (required ' +
      a(t) +
      ')'),
    (s = (e, r, t, n) => {
      var a = l(e, t);
      return (
        o(n, a) ||
          ('undefined' != typeof console &&
            console.warn &&
            console.warn(u(t, a, n))),
        f(e[t][a])
      );
    }),
    (d = (e, r, t) => {
      var a = e[r];
      return (
        (r = Object.keys(a).reduce(
          (e, r) => (!o(t, r) || (e && !n(e, r)) ? e : r),
          0
        )) && a[r]
      );
    }),
    (f = e => ((e.loaded = 1), e.get())),
    (c = (p = e =>
      function(r, t, n, a) {
        var o = w.I(r);
        return o && o.then
          ? o.then(e.bind(e, r, w.S[r], t, n, a))
          : e(r, w.S[r], t, n, a);
      })((e, r, t, n) => (i(e, t), s(r, 0, t, n)))),
    (h = p((e, r, t, n, a) => {
      var o = r && w.o(r, t) && d(r, t, n);
      return o ? f(o) : a();
    })),
    (v = {}),
    (y = {
      2959: () => c('default', 'react', [1, 16, 13, 1]),
      4268: () => c('default', '@jupyterlab/apputils', [1, 3, 0, 0, , 'rc', 5]),
      2822: () =>
        c('default', '@jupyterlab/coreutils', [1, 5, 0, 0, , 'rc', 5]),
      3526: () => c('default', '@jupyterlab/services', [1, 6, 0, 0, , 'rc', 5]),
      5216: () =>
        h('default', '@elyra/ui-components', [1, 2, 0, 0, , 'dev'], () =>
          Promise.all([w.e(909), w.e(751)]).then(() => () => w(9883))
        ),
      2916: () => c('default', '@lumino/widgets', [1, 1, 14, 0]),
      5875: () =>
        c('default', '@jupyterlab/filebrowser', [1, 3, 0, 0, , 'rc', 5]),
      6455: () =>
        c('default', '@jupyterlab/ui-components', [1, 3, 0, 0, , 'rc', 5]),
      8844: () => c('default', 'react-dom', [1, 16, 13, 1])
    }),
    (g = {
      9: [2959, 4268],
      581: [2822, 3526, 5216],
      751: [2916, 5875, 6455, 8844]
    }),
    (w.f.consumes = (e, r) => {
      w.o(g, e) &&
        g[e].forEach(e => {
          if (w.o(v, e)) return r.push(v[e]);
          var t = r => {
              (v[e] = 0),
                (m[e] = t => {
                  delete b[e], (t.exports = r());
                });
            },
            n = r => {
              delete v[e],
                (m[e] = t => {
                  throw (delete b[e], r);
                });
            };
          try {
            var a = y[e]();
            a.then ? r.push((v[e] = a.then(t).catch(n))) : t(a);
          } catch (e) {
            n(e);
          }
        });
    }),
    (() => {
      var e = { 579: 0 };
      w.f.j = (r, t) => {
        var n = w.o(e, r) ? e[r] : void 0;
        if (0 !== n)
          if (n) t.push(n[2]);
          else if (9 != r) {
            var a = new Promise((t, a) => {
              n = e[r] = [t, a];
            });
            t.push((n[2] = a));
            var o = w.p + w.u(r),
              i = new Error();
            w.l(
              o,
              t => {
                if (w.o(e, r) && (0 !== (n = e[r]) && (e[r] = void 0), n)) {
                  var a = t && ('load' === t.type ? 'missing' : t.type),
                    o = t && t.target && t.target.src;
                  (i.message =
                    'Loading chunk ' + r + ' failed.\n(' + a + ': ' + o + ')'),
                    (i.name = 'ChunkLoadError'),
                    (i.type = a),
                    (i.request = o),
                    n[1](i);
                }
              },
              'chunk-' + r
            );
          } else e[r] = 0;
      };
      var r = (self.webpackChunk_elyra_application =
          self.webpackChunk_elyra_application || []),
        t = r.push.bind(r);
      r.push = r => {
        for (var n, a, [o, i, l] = r, u = 0, s = []; u < o.length; u++)
          (a = o[u]), w.o(e, a) && e[a] && s.push(e[a][0]), (e[a] = 0);
        for (n in i) w.o(i, n) && (w.m[n] = i[n]);
        for (l && l(w), t(r); s.length; ) s.shift()();
      };
    })(),
    w(9491)
  );
})();
