var _JUPYTERLAB;
(_JUPYTERLAB = void 0 === _JUPYTERLAB ? {} : _JUPYTERLAB)[
  '@elyra/python-editor-extension'
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
    p,
    c,
    h,
    y,
    v,
    b,
    g,
    m,
    w,
    j = {
      456: (e, r, t) => {
        var n = {
            './index': () => t.e(639).then(() => () => t(639)),
            './extension': () => t.e(639).then(() => () => t(639)),
            './style': () => t.e(283).then(() => () => t(283))
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
    S = {};
  function x(e) {
    if (S[e]) return S[e].exports;
    var r = (S[e] = { id: e, exports: {} });
    return j[e](r, r.exports, x), r.exports;
  }
  return (
    (x.m = j),
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
      { 283: '0f9a22ae3a81eca744b0', 639: '3d4836e7646e2a629bd7' }[e] +
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
    (r = '@elyra/python-editor-extension:'),
    (x.l = (t, n, o) => {
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
          x.nc && a.setAttribute('nonce', x.nc),
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
      x.I = (t, n) => {
        n || (n = []);
        var o = r[t];
        if ((o || (o = r[t] = {}), !(n.indexOf(o) >= 0))) {
          if ((n.push(o), e[t])) return e[t];
          x.o(x.S, t) || (x.S[t] = {});
          var a = x.S[t],
            i = '@elyra/python-editor-extension',
            u = [];
          switch (t) {
            case 'default':
              ((e, r, t) => {
                var n = (a[e] = a[e] || {}),
                  o = n[r];
                (!o || (!o.loaded && i > o.from)) &&
                  (n[r] = {
                    get: () => x.e(639).then(() => () => x(639)),
                    from: i
                  });
              })('@elyra/python-editor-extension', '2.0.0-dev');
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
      var p = [],
        c = p.pop.bind(p);
      for (i = 1; i < e.length; i++) {
        var h = e[i];
        p.push(1 == h ? c() | c() : 2 == h ? c() & c() : h ? a(h, r) : !c());
      }
      return !!c();
    }),
    (i = (e, r) => {
      var t = x.S[e];
      if (!t || !x.o(t, r))
        throw new Error(
          'Shared module ' + r + " doesn't exist in shared scope " + e
        );
      return t;
    }),
    (u = (e, r) => {
      var t = e[r];
      return (
        (r = Object.keys(t).reduce((e, r) => (!e || n(e, r) ? r : e), 0)) &&
        t[r]
      );
    }),
    (l = (e, r) => {
      var t = e[r];
      return Object.keys(t).reduce(
        (e, r) => (!e || (!t[e].loaded && n(e, r)) ? r : e),
        0
      );
    }),
    (s = (e, r, t) =>
      'Unsatisfied version ' +
      r +
      ' of shared singleton module ' +
      e +
      ' (required ' +
      o(t) +
      ')'),
    (f = (e, r, t, n) => {
      var o = l(e, t);
      return (
        a(n, o) ||
          ('undefined' != typeof console &&
            console.warn &&
            console.warn(s(t, o, n))),
        h(e[t][o])
      );
    }),
    (d = (e, r, t) => {
      var o = e[r];
      return (
        (r = Object.keys(o).reduce(
          (e, r) => (!a(t, r) || (e && !n(e, r)) ? e : r),
          0
        )) && o[r]
      );
    }),
    (p = (e, r, t, n) => {
      var a = e[t];
      return (
        'No satisfying version (' +
        o(n) +
        ') of shared module ' +
        t +
        ' found in shared scope ' +
        r +
        '.\nAvailable versions: ' +
        Object.keys(a)
          .map(e => e + ' from ' + a[e].from)
          .join(', ')
      );
    }),
    (c = (e, r, t, n) => {
      'undefined' != typeof console &&
        console.warn &&
        console.warn(p(e, r, t, n));
    }),
    (h = e => ((e.loaded = 1), e.get())),
    (v = (y = e =>
      function(r, t, n, o) {
        var a = x.I(r);
        return a && a.then
          ? a.then(e.bind(e, r, x.S[r], t, n, o))
          : e(r, x.S[r], t, n, o);
      })((e, r, t, n) => (i(e, t), h(d(r, t, n) || c(r, e, t, n) || u(r, t))))),
    (b = y((e, r, t, n) => (i(e, t), f(r, 0, t, n)))),
    (g = {}),
    (m = {
      11: () => b('default', '@jupyterlab/mainmenu', [1, 3, 0, 0, , 'rc', 5]),
      101: () =>
        v('default', '@jupyterlab/outputarea', [1, 3, 0, 0, , 'rc', 5]),
      163: () => b('default', '@jupyterlab/launcher', [1, 3, 0, 0, , 'rc', 5]),
      228: () =>
        v('default', '@jupyterlab/docregistry', [1, 3, 0, 0, , 'rc', 5]),
      266: () =>
        b('default', '@jupyterlab/codeeditor', [1, 3, 0, 0, , 'rc', 5]),
      268: () => b('default', '@jupyterlab/apputils', [1, 3, 0, 0, , 'rc', 5]),
      455: () =>
        b('default', '@jupyterlab/ui-components', [1, 3, 0, 0, , 'rc', 5]),
      526: () => b('default', '@jupyterlab/services', [1, 6, 0, 0, , 'rc', 5]),
      628: () =>
        b('default', '@jupyterlab/logconsole', [1, 3, 0, 0, , 'rc', 5]),
      729: () =>
        b('default', '@jupyterlab/settingregistry', [1, 3, 0, 0, , 'rc', 5]),
      875: () =>
        b('default', '@jupyterlab/filebrowser', [1, 3, 0, 0, , 'rc', 5]),
      899: () =>
        b('default', '@jupyterlab/fileeditor', [1, 3, 0, 0, , 'rc', 5]),
      916: () => b('default', '@lumino/widgets', [1, 1, 14, 0]),
      922: () =>
        b('default', '@jupyterlab/application', [1, 3, 0, 0, , 'rc', 5]),
      941: () =>
        b('default', '@jupyterlab/rendermime', [1, 3, 0, 0, , 'rc', 5]),
      959: () => b('default', 'react', [1, 16, 13, 1])
    }),
    (w = {
      639: [
        11,
        101,
        163,
        228,
        266,
        268,
        455,
        526,
        628,
        729,
        875,
        899,
        916,
        922,
        941,
        959
      ]
    }),
    (x.f.consumes = (e, r) => {
      x.o(w, e) &&
        w[e].forEach(e => {
          if (x.o(g, e)) return r.push(g[e]);
          var t = r => {
              (g[e] = 0),
                (j[e] = t => {
                  delete S[e], (t.exports = r());
                });
            },
            n = r => {
              delete g[e],
                (j[e] = t => {
                  throw (delete S[e], r);
                });
            };
          try {
            var o = m[e]();
            o.then ? r.push((g[e] = o.then(t).catch(n))) : t(o);
          } catch (e) {
            n(e);
          }
        });
    }),
    (() => {
      var e = { 950: 0 };
      x.f.j = (r, t) => {
        var n = x.o(e, r) ? e[r] : void 0;
        if (0 !== n)
          if (n) t.push(n[2]);
          else {
            var o = new Promise((t, o) => {
              n = e[r] = [t, o];
            });
            t.push((n[2] = o));
            var a = x.p + x.u(r),
              i = new Error();
            x.l(
              a,
              t => {
                if (x.o(e, r) && (0 !== (n = e[r]) && (e[r] = void 0), n)) {
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
      var r = (self.webpackChunk_elyra_python_editor_extension =
          self.webpackChunk_elyra_python_editor_extension || []),
        t = r.push.bind(r);
      r.push = r => {
        for (var n, o, [a, i, u] = r, l = 0, s = []; l < a.length; l++)
          (o = a[l]), x.o(e, o) && e[o] && s.push(e[o][0]), (e[o] = 0);
        for (n in i) x.o(i, n) && (x.m[n] = i[n]);
        for (u && u(x), t(r); s.length; ) s.shift()();
      };
    })(),
    x(456)
  );
})();
