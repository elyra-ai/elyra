var _JUPYTERLAB;
(_JUPYTERLAB = void 0 === _JUPYTERLAB ? {} : _JUPYTERLAB)[
  '@elyra/pipeline-editor-extension'
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
    d,
    u,
    s,
    c,
    f,
    p,
    h,
    b,
    m,
    v,
    y,
    g,
    w,
    P,
    j = {
      1818: (e, r, t) => {
        var a = {
            './index': () =>
              Promise.all([
                t.e(782),
                t.e(880),
                t.e(959),
                t.e(844),
                t.e(455),
                t.e(268),
                t.e(718),
                t.e(216),
                t.e(206),
                t.e(568)
              ]).then(() => () => t(1568)),
            './extension': () =>
              Promise.all([
                t.e(782),
                t.e(880),
                t.e(959),
                t.e(844),
                t.e(455),
                t.e(268),
                t.e(718),
                t.e(216),
                t.e(206),
                t.e(568)
              ]).then(() => () => t(1568)),
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
    x = {};
  function S(e) {
    if (x[e]) return x[e].exports;
    var r = (x[e] = { id: e, loaded: !1, exports: {} });
    return j[e].call(r.exports, r, r.exports, S), (r.loaded = !0), r.exports;
  }
  return (
    (S.m = j),
    (S.n = e => {
      var r = e && e.__esModule ? () => e.default : () => e;
      return S.d(r, { a: r }), r;
    }),
    (S.d = (e, r) => {
      for (var t in r)
        S.o(r, t) &&
          !S.o(e, t) &&
          Object.defineProperty(e, t, { enumerable: !0, get: r[t] });
    }),
    (S.f = {}),
    (S.e = e =>
      Promise.all(Object.keys(S.f).reduce((r, t) => (S.f[t](e, r), r), []))),
    (S.u = e =>
      e +
      '.' +
      {
        76: '6fc602d3b5abe88f4fcf',
        191: '6df6ba8df9e30e7c7af8',
        196: 'f100cfe28729dcd7db89',
        206: '7e968bb42e2411286326',
        216: '7913b36edfc1039739d5',
        233: 'bd68c4cdcfda55ffd874',
        247: '2c6e98cffe05485f0a1b',
        258: '416b039cd9416ea0d0cc',
        264: 'c97652155f549a7c8f9f',
        266: '1c1944222fed4fbab13f',
        268: 'e0f37b91108c27129269',
        275: '2ee1538765513a7aac97',
        283: '46fa9c0611e22259f385',
        405: 'cc00e0ea062a06156676',
        439: 'c63389f311ccfc34389a',
        455: 'fe17590d41369e086a62',
        534: '1ca8aa0cbde75a9a546c',
        568: 'd59b16581ece7b78b556',
        718: 'a3e6cab3ae248a1f1221',
        782: '29fb5ca2207167899759',
        789: 'a4953225345e25379900',
        805: '335f525a8b9d16c7ae38',
        825: 'b54df7e44e3e9bb02fd6',
        844: '2620f633037cd981621e',
        846: 'b5c5eb525f65b3c3acfa',
        880: 'c8d420b6680ab544ac26',
        883: 'c3860a3a034140a8b944',
        937: '3e24ef9e5fc71e4f9f5f',
        959: '50ace1567d09ccde5800'
      }[e] +
      '.js'),
    (S.g = (function() {
      if ('object' == typeof globalThis) return globalThis;
      try {
        return this || new Function('return this')();
      } catch (e) {
        if ('object' == typeof window) return window;
      }
    })()),
    (S.hmd = e => (
      (e = Object.create(e)).children || (e.children = []),
      Object.defineProperty(e, 'exports', {
        enumerable: !0,
        set: () => {
          throw new Error(
            'ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: ' +
              e.id
          );
        }
      }),
      e
    )),
    (S.o = (e, r) => Object.prototype.hasOwnProperty.call(e, r)),
    (e = {}),
    (r = '@elyra/pipeline-editor-extension:'),
    (S.l = (t, a, n) => {
      if (e[t]) e[t].push(a);
      else {
        var o, i;
        if (void 0 !== n)
          for (
            var l = document.getElementsByTagName('script'), d = 0;
            d < l.length;
            d++
          ) {
            var u = l[d];
            if (
              u.getAttribute('src') == t ||
              u.getAttribute('data-webpack') == r + n
            ) {
              o = u;
              break;
            }
          }
        o ||
          ((i = !0),
          ((o = document.createElement('script')).charset = 'utf-8'),
          (o.timeout = 120),
          S.nc && o.setAttribute('nonce', S.nc),
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
    (S.r = e => {
      'undefined' != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }),
        Object.defineProperty(e, '__esModule', { value: !0 });
    }),
    (() => {
      S.S = {};
      var e = {},
        r = {};
      S.I = (t, a) => {
        a || (a = []);
        var n = r[t];
        if ((n || (n = r[t] = {}), !(a.indexOf(n) >= 0))) {
          if ((a.push(n), e[t])) return e[t];
          S.o(S.S, t) || (S.S[t] = {});
          var o = S.S[t],
            i = '@elyra/pipeline-editor-extension',
            l = (e, r, t) => {
              var a = (o[e] = o[e] || {}),
                n = a[r];
              (!n || (!n.loaded && i > n.from)) && (a[r] = { get: t, from: i });
            },
            d = [];
          switch (t) {
            case 'default':
              l('@elyra/application', '2.0.0-dev', () =>
                Promise.all([
                  S.e(959),
                  S.e(268),
                  S.e(216),
                  S.e(789),
                  S.e(439)
                ]).then(() => () => S(8439))
              ),
                l('@elyra/canvas', '9.0.3', () =>
                  Promise.all([
                    S.e(191),
                    S.e(959),
                    S.e(844),
                    S.e(264)
                  ]).then(() => () => S(7191))
                ),
                l('@elyra/metadata-common', '2.0.0-dev', () =>
                  Promise.all([
                    S.e(534),
                    S.e(959),
                    S.e(844),
                    S.e(455),
                    S.e(268),
                    S.e(216),
                    S.e(206),
                    S.e(266),
                    S.e(233)
                  ]).then(() => () => S(5405))
                ),
                l('@elyra/pipeline-editor-extension', '2.0.0-dev', () =>
                  Promise.all([
                    S.e(782),
                    S.e(880),
                    S.e(959),
                    S.e(844),
                    S.e(455),
                    S.e(268),
                    S.e(718),
                    S.e(216),
                    S.e(206),
                    S.e(568)
                  ]).then(() => () => S(1568))
                ),
                l('@elyra/ui-components', '2.0.0-dev', () =>
                  Promise.all([
                    S.e(534),
                    S.e(247),
                    S.e(959),
                    S.e(844),
                    S.e(455),
                    S.e(268),
                    S.e(718),
                    S.e(76),
                    S.e(805)
                  ]).then(() => () => S(9883))
                ),
                l('@material-ui/core', '4.11.0', () =>
                  Promise.all([
                    S.e(275),
                    S.e(782),
                    S.e(959),
                    S.e(844)
                  ]).then(() => () => S(2275))
                ),
                l('react-intl', '2.9.0', () =>
                  Promise.all([S.e(883), S.e(959), S.e(258)]).then(() => () =>
                    S(883)
                  )
                ),
                l('react-redux', '7.2.1', () =>
                  Promise.all([S.e(196), S.e(959), S.e(844)]).then(() => () =>
                    S(7846)
                  )
                );
          }
          return (e[t] = d.length ? Promise.all(d).then(() => (e[t] = 1)) : 1);
        }
      };
    })(),
    (() => {
      var e;
      S.g.importScripts && (e = S.g.location + '');
      var r = S.g.document;
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
        (S.p = e);
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
            ? 'not(' + d() + ')'
            : 1 === l
            ? '(' + d() + ' || ' + d() + ')'
            : 2 === l
            ? i.pop() + ' ' + i.pop()
            : n(l)
        );
      }
      return d();
      function d() {
        return i.pop().replace(/^\((.+)\)$/, '$1');
      }
    }),
    (o = (e, r) => {
      if (0 in e) {
        r = t(r);
        var a = e[0],
          n = a < 0;
        n && (a = -a - 1);
        for (var i = 0, l = 1, d = !0; ; l++, i++) {
          var u,
            s,
            c = l < e.length ? (typeof e[l])[0] : '';
          if (i >= r.length || 'o' == (s = (typeof (u = r[i]))[0]))
            return !d || ('u' == c ? l > a && !n : ('' == c) != n);
          if ('u' == s) {
            if (!d || 'u' != c) return !1;
          } else if (d)
            if (c == s)
              if (l <= a) {
                if (u != e[l]) return !1;
              } else {
                if (n ? u > e[l] : u < e[l]) return !1;
                u != e[l] && (d = !1);
              }
            else if ('s' != c && 'n' != c) {
              if (n || l <= a) return !1;
              (d = !1), l--;
            } else {
              if (l <= a || s < c != n) return !1;
              d = !1;
            }
          else 's' != c && 'n' != c && ((d = !1), l--);
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
      var t = S.S[e];
      if (!t || !S.o(t, r))
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
    (d = (e, r) => {
      var t = e[r];
      return Object.keys(t).reduce(
        (e, r) => (!e || (!t[e].loaded && a(e, r)) ? r : e),
        0
      );
    }),
    (u = (e, r, t) =>
      'Unsatisfied version ' +
      r +
      ' of shared singleton module ' +
      e +
      ' (required ' +
      n(t) +
      ')'),
    (s = (e, r, t, a) => {
      var n = d(e, t);
      return (
        o(a, n) ||
          ('undefined' != typeof console &&
            console.warn &&
            console.warn(u(t, n, a))),
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
    (m = (b = e =>
      function(r, t, a, n) {
        var o = S.I(r);
        return o && o.then
          ? o.then(e.bind(e, r, S.S[r], t, a, n))
          : e(r, S.S[r], t, a, n);
      })((e, r, t, a) => (i(e, t), h(c(r, t, a) || p(r, e, t, a) || l(r, t))))),
    (v = b((e, r, t, a) => (i(e, t), s(r, 0, t, a)))),
    (y = b((e, r, t, a, n) => {
      var o = r && S.o(r, t) && c(r, t, a);
      return o ? h(o) : n();
    })),
    (g = {}),
    (w = {
      2959: () => v('default', 'react', [1, 16, 13, 1]),
      8844: () => v('default', 'react-dom', [1, 16, 13, 1]),
      6455: () =>
        v('default', '@jupyterlab/ui-components', [1, 3, 0, 0, , 'rc', 5]),
      4268: () => v('default', '@jupyterlab/apputils', [1, 3, 0, 0, , 'rc', 5]),
      2916: () => v('default', '@lumino/widgets', [1, 1, 14, 0]),
      5875: () =>
        v('default', '@jupyterlab/filebrowser', [1, 3, 0, 0, , 'rc', 5]),
      5216: () =>
        y('default', '@elyra/ui-components', [1, 2, 0, 0, , 'dev'], () =>
          Promise.all([
            S.e(534),
            S.e(247),
            S.e(844),
            S.e(455),
            S.e(718),
            S.e(76)
          ]).then(() => () => S(9883))
        ),
      4205: () =>
        y('default', '@elyra/application', [1, 2, 0, 0, , 'dev'], () =>
          S.e(937).then(() => () => S(8439))
        ),
      6168: () => v('default', '@lumino/signaling', [1, 1, 4, 3]),
      9850: () => v('default', '@lumino/algorithm', [1, 1, 3, 3]),
      1163: () => v('default', '@jupyterlab/launcher', [1, 3, 0, 0, , 'rc', 5]),
      1228: () =>
        m('default', '@jupyterlab/docregistry', [1, 3, 0, 0, , 'rc', 5]),
      1314: () =>
        y('default', '@material-ui/core', [1, 4, 1, 2], () =>
          S.e(275).then(() => () => S(2275))
        ),
      1708: () =>
        y('default', '@elyra/metadata-common', [1, 2, 0, 0, , 'dev'], () =>
          Promise.all([S.e(534), S.e(405)]).then(() => () => S(5405))
        ),
      2155: () =>
        y('default', 'react-intl', [1, 3, 0, 0], () =>
          Promise.all([S.e(883), S.e(846)]).then(() => () => S(883))
        ),
      3211: () => v('default', '@lumino/messaging', [1, 1, 4, 3]),
      3303: () =>
        y('default', '@elyra/canvas', [4, 9, 0, 3], () =>
          Promise.all([S.e(191), S.e(264)]).then(() => () => S(7191))
        ),
      4922: () =>
        v('default', '@jupyterlab/application', [1, 3, 0, 0, , 'rc', 5]),
      6011: () => v('default', '@jupyterlab/mainmenu', [1, 3, 0, 0, , 'rc', 5]),
      2822: () =>
        v('default', '@jupyterlab/coreutils', [1, 5, 0, 0, , 'rc', 5]),
      3526: () => v('default', '@jupyterlab/services', [1, 6, 0, 0, , 'rc', 5]),
      4305: () =>
        y('default', 'react-redux', [1, 7, 0, 0], () =>
          S.e(196).then(() => () => S(7846))
        ),
      7624: () =>
        y('default', 'react-intl', [1, 5, 0, 0], () =>
          Promise.all([S.e(883), S.e(825)]).then(() => () => S(883))
        ),
      9266: () =>
        v('default', '@jupyterlab/codeeditor', [1, 3, 0, 0, , 'rc', 5])
    }),
    (P = {
      206: [4205, 6168, 9850],
      216: [5216],
      264: [4305, 7624],
      266: [9266],
      268: [4268],
      405: [9266],
      455: [6455],
      568: [1163, 1228, 1314, 1708, 2155, 3211, 3303, 4922, 6011],
      718: [2916, 5875],
      789: [2822, 3526],
      844: [8844],
      937: [2822, 3526],
      959: [2959]
    }),
    (S.f.consumes = (e, r) => {
      S.o(P, e) &&
        P[e].forEach(e => {
          if (S.o(g, e)) return r.push(g[e]);
          var t = r => {
              (g[e] = 0),
                (j[e] = t => {
                  delete x[e], (t.exports = r());
                });
            },
            a = r => {
              delete g[e],
                (j[e] = t => {
                  throw (delete x[e], r);
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
      var e = { 288: 0 };
      S.f.j = (r, t) => {
        var a = S.o(e, r) ? e[r] : void 0;
        if (0 !== a)
          if (a) t.push(a[2]);
          else if (/^(2(6[468]|06|16)|455|718|789|844|959)$/.test(r)) e[r] = 0;
          else {
            var n = new Promise((t, n) => {
              a = e[r] = [t, n];
            });
            t.push((a[2] = n));
            var o = S.p + S.u(r),
              i = new Error();
            S.l(
              o,
              t => {
                if (S.o(e, r) && (0 !== (a = e[r]) && (e[r] = void 0), a)) {
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
      var r = (self.webpackChunk_elyra_pipeline_editor_extension =
          self.webpackChunk_elyra_pipeline_editor_extension || []),
        t = r.push.bind(r);
      r.push = r => {
        for (var a, n, [o, i, l] = r, d = 0, u = []; d < o.length; d++)
          (n = o[d]), S.o(e, n) && e[n] && u.push(e[n][0]), (e[n] = 0);
        for (a in i) S.o(i, a) && (S.m[a] = i[a]);
        for (l && l(S), t(r); u.length; ) u.shift()();
      };
    })(),
    S(1818)
  );
})();
