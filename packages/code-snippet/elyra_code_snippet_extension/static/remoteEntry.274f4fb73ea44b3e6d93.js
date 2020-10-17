var _JUPYTERLAB;
(_JUPYTERLAB = void 0 === _JUPYTERLAB ? {} : _JUPYTERLAB)[
  '@elyra/code-snippet-extension'
] = (() => {
  'use strict';
  var e,
    r,
    t,
    a,
    n,
    o,
    i,
    l,
    u,
    d,
    s,
    c,
    f,
    p,
    h,
    v,
    b,
    m,
    y,
    g,
    w,
    j,
    P = {
      8099: (e, r, t) => {
        var a = {
            './index': () =>
              Promise.all([
                t.e(9),
                t.e(455),
                t.e(822),
                t.e(216),
                t.e(311),
                t.e(220)
              ]).then(() => () => t(1220)),
            './extension': () =>
              Promise.all([
                t.e(9),
                t.e(455),
                t.e(822),
                t.e(216),
                t.e(311),
                t.e(220)
              ]).then(() => () => t(1220)),
            './style': () => t.e(283).then(() => () => t(7283))
          },
          n = (e, r) => (
            (t.R = r),
            (r = t.o(a, e)
              ? a[e]()
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
              var a = t.S.default,
                n = 'default';
              if (a && a !== e)
                throw new Error(
                  'Container initialization failed as it has already been initialized with a different share scope'
                );
              return (t.S[n] = e), t.I(n, r);
            }
          };
        t.d(r, { get: () => n, init: () => o });
      }
    },
    S = {};
  function x(e) {
    if (S[e]) return S[e].exports;
    var r = (S[e] = { id: e, exports: {} });
    return P[e](r, r.exports, x), r.exports;
  }
  return (
    (x.m = P),
    (x.n = e => {
      var r = e && e.__esModule ? () => e.default : () => e;
      return x.d(r, { a: r }), r;
    }),
    (x.d = (e, r) => {
      for (var t in r)
        x.o(r, t) &&
          !x.o(e, t) &&
          Object.defineProperty(e, t, { enumerable: !0, get: r[t] });
    }),
    (x.f = {}),
    (x.e = e =>
      Promise.all(Object.keys(x.f).reduce((r, t) => (x.f[t](e, r), r), []))),
    (x.u = e =>
      e +
      '.' +
      {
        9: '48a2206005191dc8cf1c',
        168: 'cfc9a9d90ca38f897d4b',
        216: '242738d5b18462923255',
        220: 'afaf05df2c2586e92e84',
        283: '38b23b9fd5217b093b7e',
        311: '31b6350478009c9a4bd8',
        405: 'f01a6c1d46d053cfbf72',
        439: '33f23ff9ae047e871833',
        455: '0fe92df0b184b5cbcfec',
        526: '041d9c25d0994081e412',
        534: 'e66cd050b51383af4c12',
        650: 'e964b0eabad3b224d7ae',
        676: '1ed76988289c1c6da765',
        805: '8f3f8fc262cce0f556cd',
        822: '2345401446222ef15991',
        844: '6f855d19caa32efd5ae8',
        883: '70a2f49e9f9272415ad9',
        937: '536d1ef511bd8af72e82'
      }[e] +
      '.js'),
    (x.g = (function() {
      if ('object' == typeof globalThis) return globalThis;
      try {
        return this || new Function('return this')();
      } catch (e) {
        if ('object' == typeof window) return window;
      }
    })()),
    (x.o = (e, r) => Object.prototype.hasOwnProperty.call(e, r)),
    (e = {}),
    (r = '@elyra/code-snippet-extension:'),
    (x.l = (t, a, n) => {
      if (e[t]) e[t].push(a);
      else {
        var o, i;
        if (void 0 !== n)
          for (
            var l = document.getElementsByTagName('script'), u = 0;
            u < l.length;
            u++
          ) {
            var d = l[u];
            if (
              d.getAttribute('src') == t ||
              d.getAttribute('data-webpack') == r + n
            ) {
              o = d;
              break;
            }
          }
        o ||
          ((i = !0),
          ((o = document.createElement('script')).charset = 'utf-8'),
          (o.timeout = 120),
          x.nc && o.setAttribute('nonce', x.nc),
          o.setAttribute('data-webpack', r + n),
          (o.src = t)),
          (e[t] = [a]);
        var s = (r, a) => {
            (o.onerror = o.onload = null), clearTimeout(c);
            var n = e[t];
            if (
              (delete e[t],
              o.parentNode && o.parentNode.removeChild(o),
              n && n.forEach(e => e(a)),
              r)
            )
              return r(a);
          },
          c = setTimeout(
            s.bind(null, void 0, { type: 'timeout', target: o }),
            12e4
          );
        (o.onerror = s.bind(null, o.onerror)),
          (o.onload = s.bind(null, o.onload)),
          i && document.head.appendChild(o);
      }
    }),
    (x.r = e => {
      'undefined' != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
        Object.defineProperty(e, '__esModule', { value: !0 });
    }),
    (() => {
      x.S = {};
      var e = {},
        r = {};
      x.I = (t, a) => {
        a || (a = []);
        var n = r[t];
        if ((n || (n = r[t] = {}), !(a.indexOf(n) >= 0))) {
          if ((a.push(n), e[t])) return e[t];
          x.o(x.S, t) || (x.S[t] = {});
          var o = x.S[t],
            i = '@elyra/code-snippet-extension',
            l = (e, r, t) => {
              var a = (o[e] = o[e] || {}),
                n = a[r];
              (!n || (!n.loaded && i > n.from)) && (a[r] = { get: t, from: i });
            },
            u = [];
          switch (t) {
            case 'default':
              l('@elyra/application', '2.0.0-dev', () =>
                Promise.all([
                  x.e(9),
                  x.e(822),
                  x.e(216),
                  x.e(526),
                  x.e(439)
                ]).then(() => () => x(8439))
              ),
                l('@elyra/code-snippet-extension', '2.0.0-dev', () =>
                  Promise.all([
                    x.e(9),
                    x.e(455),
                    x.e(822),
                    x.e(216),
                    x.e(311),
                    x.e(220)
                  ]).then(() => () => x(1220))
                ),
                l('@elyra/metadata-common', '2.0.0-dev', () =>
                  Promise.all([
                    x.e(534),
                    x.e(9),
                    x.e(844),
                    x.e(455),
                    x.e(216),
                    x.e(311),
                    x.e(168),
                    x.e(405)
                  ]).then(() => () => x(5405))
                ),
                l('@elyra/ui-components', '2.0.0-dev', () =>
                  Promise.all([
                    x.e(534),
                    x.e(650),
                    x.e(9),
                    x.e(844),
                    x.e(455),
                    x.e(883),
                    x.e(805)
                  ]).then(() => () => x(9883))
                );
          }
          return (e[t] = u.length ? Promise.all(u).then(() => (e[t] = 1)) : 1);
        }
      };
    })(),
    (() => {
      var e;
      x.g.importScripts && (e = x.g.location + '');
      var r = x.g.document;
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
        (x.p = e);
    })(),
    (t = e => {
      var r = e => e.split('.').map(e => (+e == e ? +e : e)),
        t = /^([^-+]+)?(?:-([^+]+))?(?:\+(.+))?$/.exec(e),
        a = t[1] ? r(t[1]) : [];
      return (
        t[2] && (a.length++, a.push.apply(a, r(t[2]))),
        t[3] && (a.push([]), a.push.apply(a, r(t[3]))),
        a
      );
    }),
    (a = (e, r) => {
      (e = t(e)), (r = t(r));
      for (var a = 0; ; ) {
        if (a >= e.length) return a < r.length && 'u' != (typeof r[a])[0];
        var n = e[a],
          o = (typeof n)[0];
        if (a >= r.length) return 'u' == o;
        var i = r[a],
          l = (typeof i)[0];
        if (o != l) return ('o' == o && 'n' == l) || 's' == l || 'u' == o;
        if ('o' != o && 'u' != o && n != i) return n < i;
        a++;
      }
    }),
    (n = e => {
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
        for (var a = 1, o = 1; o < e.length; o++)
          a--,
            (r +=
              'u' == (typeof (l = e[o]))[0]
                ? '-'
                : (a > 0 ? '.' : '') + ((a = 2), l));
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
            : n(l)
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
        var a = e[0],
          n = a < 0;
        n && (a = -a - 1);
        for (var i = 0, l = 1, u = !0; ; l++, i++) {
          var d,
            s,
            c = l < e.length ? (typeof e[l])[0] : '';
          if (i >= r.length || 'o' == (s = (typeof (d = r[i]))[0]))
            return !u || ('u' == c ? l > a && !n : ('' == c) != n);
          if ('u' == s) {
            if (!u || 'u' != c) return !1;
          } else if (u)
            if (c == s)
              if (l <= a) {
                if (d != e[l]) return !1;
              } else {
                if (n ? d > e[l] : d < e[l]) return !1;
                d != e[l] && (u = !1);
              }
            else if ('s' != c && 'n' != c) {
              if (n || l <= a) return !1;
              (u = !1), l--;
            } else {
              if (l <= a || s < c != n) return !1;
              u = !1;
            }
          else 's' != c && 'n' != c && ((u = !1), l--);
        }
      }
      var f = [],
        p = f.pop.bind(f);
      for (i = 1; i < e.length; i++) {
        var h = e[i];
        f.push(1 == h ? p() | p() : 2 == h ? p() & p() : h ? o(h, r) : !p());
      }
      return !!p();
    }),
    (i = (e, r) => {
      var t = x.S[e];
      if (!t || !x.o(t, r))
        throw new Error(
          'Shared module ' + r + " doesn't exist in shared scope " + e
        );
      return t;
    }),
    (l = (e, r) => {
      var t = e[r];
      return (
        (r = Object.keys(t).reduce((e, r) => (!e || a(e, r) ? r : e), 0)) &&
        t[r]
      );
    }),
    (u = (e, r) => {
      var t = e[r];
      return Object.keys(t).reduce(
        (e, r) => (!e || (!t[e].loaded && a(e, r)) ? r : e),
        0
      );
    }),
    (d = (e, r, t) =>
      'Unsatisfied version ' +
      r +
      ' of shared singleton module ' +
      e +
      ' (required ' +
      n(t) +
      ')'),
    (s = (e, r, t, a) => {
      var n = u(e, t);
      return (
        o(a, n) ||
          ('undefined' != typeof console &&
            console.warn &&
            console.warn(d(t, n, a))),
        h(e[t][n])
      );
    }),
    (c = (e, r, t) => {
      var n = e[r];
      return (
        (r = Object.keys(n).reduce(
          (e, r) => (!o(t, r) || (e && !a(e, r)) ? e : r),
          0
        )) && n[r]
      );
    }),
    (f = (e, r, t, a) => {
      var o = e[t];
      return (
        'No satisfying version (' +
        n(a) +
        ') of shared module ' +
        t +
        ' found in shared scope ' +
        r +
        '.\nAvailable versions: ' +
        Object.keys(o)
          .map(e => e + ' from ' + o[e].from)
          .join(', ')
      );
    }),
    (p = (e, r, t, a) => {
      'undefined' != typeof console &&
        console.warn &&
        console.warn(f(e, r, t, a));
    }),
    (h = e => ((e.loaded = 1), e.get())),
    (b = (v = e =>
      function(r, t, a, n) {
        var o = x.I(r);
        return o && o.then
          ? o.then(e.bind(e, r, x.S[r], t, a, n))
          : e(r, x.S[r], t, a, n);
      })((e, r, t, a) => (i(e, t), h(c(r, t, a) || p(r, e, t, a) || l(r, t))))),
    (m = v((e, r, t, a) => (i(e, t), s(r, 0, t, a)))),
    (y = v((e, r, t, a, n) => {
      var o = r && x.o(r, t) && c(r, t, a);
      return o ? h(o) : n();
    })),
    (g = {}),
    (w = {
      2959: () => m('default', 'react', [1, 16, 13, 1]),
      4268: () => m('default', '@jupyterlab/apputils', [1, 3, 0, 0, , 'rc', 5]),
      6455: () =>
        m('default', '@jupyterlab/ui-components', [1, 3, 0, 0, , 'rc', 5]),
      2822: () =>
        m('default', '@jupyterlab/coreutils', [1, 5, 0, 0, , 'rc', 5]),
      5216: () =>
        y('default', '@elyra/ui-components', [1, 2, 0, 0, , 'dev'], () =>
          Promise.all([
            x.e(534),
            x.e(650),
            x.e(844),
            x.e(455),
            x.e(883)
          ]).then(() => () => x(9883))
        ),
      4205: () =>
        y('default', '@elyra/application', [1, 2, 0, 0, , 'dev'], () =>
          Promise.all([x.e(822), x.e(937)]).then(() => () => x(8439))
        ),
      9266: () =>
        m('default', '@jupyterlab/codeeditor', [1, 3, 0, 0, , 'rc', 5]),
      9850: () => m('default', '@lumino/algorithm', [1, 1, 3, 3]),
      1228: () =>
        b('default', '@jupyterlab/docregistry', [1, 3, 0, 0, , 'rc', 5]),
      1708: () =>
        y('default', '@elyra/metadata-common', [1, 2, 0, 0, , 'dev'], () =>
          Promise.all([x.e(534), x.e(844), x.e(676)]).then(() => () => x(5405))
        ),
      2899: () =>
        m('default', '@jupyterlab/fileeditor', [1, 3, 0, 0, , 'rc', 5]),
      4922: () =>
        m('default', '@jupyterlab/application', [1, 3, 0, 0, , 'rc', 5]),
      6970: () => m('default', '@jupyterlab/notebook', [1, 3, 0, 0, , 'rc', 5]),
      9769: () => b('default', '@jupyterlab/cells', [1, 3, 0, 0, , 'rc', 5]),
      3526: () => m('default', '@jupyterlab/services', [1, 6, 0, 0, , 'rc', 5]),
      8844: () => m('default', 'react-dom', [1, 16, 13, 1]),
      6168: () => m('default', '@lumino/signaling', [1, 1, 4, 3]),
      2916: () => m('default', '@lumino/widgets', [1, 1, 14, 0]),
      5875: () =>
        m('default', '@jupyterlab/filebrowser', [1, 3, 0, 0, , 'rc', 5])
    }),
    (j = {
      9: [2959, 4268],
      168: [6168],
      216: [5216],
      220: [1228, 1708, 2899, 4922, 6970, 9769],
      311: [4205, 9266, 9850],
      455: [6455],
      526: [3526],
      676: [6168],
      822: [2822],
      844: [8844],
      883: [2916, 5875],
      937: [3526]
    }),
    (x.f.consumes = (e, r) => {
      x.o(j, e) &&
        j[e].forEach(e => {
          if (x.o(g, e)) return r.push(g[e]);
          var t = r => {
              (g[e] = 0),
                (P[e] = t => {
                  delete S[e], (t.exports = r());
                });
            },
            a = r => {
              delete g[e],
                (P[e] = t => {
                  throw (delete S[e], r);
                });
            };
          try {
            var n = w[e]();
            n.then ? r.push((g[e] = n.then(t).catch(a))) : t(n);
          } catch (e) {
            a(e);
          }
        });
    }),
    (() => {
      var e = { 155: 0 };
      x.f.j = (r, t) => {
        var a = x.o(e, r) ? e[r] : void 0;
        if (0 !== a)
          if (a) t.push(a[2]);
          else if (/^(168|216|311|455|526|822|844|9)$/.test(r)) e[r] = 0;
          else {
            var n = new Promise((t, n) => {
              a = e[r] = [t, n];
            });
            t.push((a[2] = n));
            var o = x.p + x.u(r),
              i = new Error();
            x.l(
              o,
              t => {
                if (x.o(e, r) && (0 !== (a = e[r]) && (e[r] = void 0), a)) {
                  var n = t && ('load' === t.type ? 'missing' : t.type),
                    o = t && t.target && t.target.src;
                  (i.message =
                    'Loading chunk ' + r + ' failed.\n(' + n + ': ' + o + ')'),
                    (i.name = 'ChunkLoadError'),
                    (i.type = n),
                    (i.request = o),
                    a[1](i);
                }
              },
              'chunk-' + r
            );
          }
      };
      var r = (self.webpackChunk_elyra_code_snippet_extension =
          self.webpackChunk_elyra_code_snippet_extension || []),
        t = r.push.bind(r);
      r.push = r => {
        for (var a, n, [o, i, l] = r, u = 0, d = []; u < o.length; u++)
          (n = o[u]), x.o(e, n) && e[n] && d.push(e[n][0]), (e[n] = 0);
        for (a in i) x.o(i, a) && (x.m[a] = i[a]);
        for (l && l(x), t(r); d.length; ) d.shift()();
      };
    })(),
    x(8099)
  );
})();
