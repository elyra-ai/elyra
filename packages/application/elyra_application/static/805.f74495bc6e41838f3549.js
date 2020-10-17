(self.webpackChunk_elyra_application =
  self.webpackChunk_elyra_application || []).push([
  [805],
  {
    2609: t => {
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
                  a = t[3];
                if (!a) return i;
                if (e && 'function' == typeof btoa) {
                  var s =
                      ((n = a),
                      (r = btoa(
                        unescape(encodeURIComponent(JSON.stringify(n)))
                      )),
                      (o = 'sourceMappingURL=data:application/json;charset=utf-8;base64,'.concat(
                        r
                      )),
                      '/*# '.concat(o, ' */')),
                    c = a.sources.map(function(t) {
                      return '/*# sourceURL='
                        .concat(a.sourceRoot)
                        .concat(t, ' */');
                    });
                  return [i]
                    .concat(c)
                    .concat([s])
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
            for (var a = 0; a < t.length; a++) {
              var s = t[a];
              (null != s[0] && r[s[0]]) ||
                (n && !s[2]
                  ? (s[2] = n)
                  : n && (s[2] = '('.concat(s[2], ') and (').concat(n, ')')),
                e.push(s));
            }
          }),
          e
        );
      };
    },
    2379: (t, e, n) => {
      var r,
        o,
        i = {},
        a =
          ((r = function() {
            return window && document && document.all && !window.atob;
          }),
          function() {
            return void 0 === o && (o = r.apply(this, arguments)), o;
          }),
        s = function(t, e) {
          return e ? e.querySelector(t) : document.querySelector(t);
        },
        c = (function(t) {
          var e = {};
          return function(t, n) {
            if ('function' == typeof t) return t();
            if (void 0 === e[t]) {
              var r = s.call(this, t, n);
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
        f = null,
        u = 0,
        l = [],
        p = n(9657);
      function d(t, e) {
        for (var n = 0; n < t.length; n++) {
          var r = t[n],
            o = i[r.id];
          if (o) {
            o.refs++;
            for (var a = 0; a < o.parts.length; a++) o.parts[a](r.parts[a]);
            for (; a < r.parts.length; a++) o.parts.push(g(r.parts[a], e));
          } else {
            var s = [];
            for (a = 0; a < r.parts.length; a++) s.push(g(r.parts[a], e));
            i[r.id] = { id: r.id, refs: 1, parts: s };
          }
        }
      }
      function h(t, e) {
        for (var n = [], r = {}, o = 0; o < t.length; o++) {
          var i = t[o],
            a = e.base ? i[0] + e.base : i[0],
            s = { css: i[1], media: i[2], sourceMap: i[3] };
          r[a] ? r[a].parts.push(s) : n.push((r[a] = { id: a, parts: [s] }));
        }
        return n;
      }
      function v(t, e) {
        var n = c(t.insertInto);
        if (!n)
          throw new Error(
            "Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid."
          );
        var r = l[l.length - 1];
        if ('top' === t.insertAt)
          r
            ? r.nextSibling
              ? n.insertBefore(e, r.nextSibling)
              : n.appendChild(e)
            : n.insertBefore(e, n.firstChild),
            l.push(e);
        else if ('bottom' === t.insertAt) n.appendChild(e);
        else {
          if ('object' != typeof t.insertAt || !t.insertAt.before)
            throw new Error(
              "[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n"
            );
          var o = c(t.insertAt.before, n);
          n.insertBefore(e, o);
        }
      }
      function b(t) {
        if (null === t.parentNode) return !1;
        t.parentNode.removeChild(t);
        var e = l.indexOf(t);
        e >= 0 && l.splice(e, 1);
      }
      function m(t) {
        var e = document.createElement('style');
        if (
          (void 0 === t.attrs.type && (t.attrs.type = 'text/css'),
          void 0 === t.attrs.nonce)
        ) {
          var r = n.nc;
          r && (t.attrs.nonce = r);
        }
        return y(e, t.attrs), v(t, e), e;
      }
      function y(t, e) {
        Object.keys(e).forEach(function(n) {
          t.setAttribute(n, e[n]);
        });
      }
      function g(t, e) {
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
          var a = u++;
          (n = f || (f = m(e))),
            (r = L.bind(null, n, a, !1)),
            (o = L.bind(null, n, a, !0));
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
                  y(e, t.attrs),
                  v(t, e),
                  e
                );
              })(e)),
              (r = j.bind(null, n, e)),
              (o = function() {
                b(n), n.href && URL.revokeObjectURL(n.href);
              }))
            : ((n = m(e)),
              (r = R.bind(null, n)),
              (o = function() {
                b(n);
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
          e.singleton || 'boolean' == typeof e.singleton || (e.singleton = a()),
          e.insertInto || (e.insertInto = 'head'),
          e.insertAt || (e.insertAt = 'bottom');
        var n = h(t, e);
        return (
          d(n, e),
          function(t) {
            for (var r = [], o = 0; o < n.length; o++) {
              var a = n[o];
              (s = i[a.id]).refs--, r.push(s);
            }
            for (t && d(h(t, e), e), o = 0; o < r.length; o++) {
              var s;
              if (0 === (s = r[o]).refs) {
                for (var c = 0; c < s.parts.length; c++) s.parts[c]();
                delete i[s.id];
              }
            }
          }
        );
      };
      var w,
        U =
          ((w = []),
          function(t, e) {
            return (w[t] = e), w.filter(Boolean).join('\n');
          });
      function L(t, e, n, r) {
        var o = n ? '' : r.css;
        if (t.styleSheet) t.styleSheet.cssText = U(e, o);
        else {
          var i = document.createTextNode(o),
            a = t.childNodes;
          a[e] && t.removeChild(a[e]),
            a.length ? t.insertBefore(i, a[e]) : t.appendChild(i);
        }
      }
      function R(t, e) {
        var n = e.css,
          r = e.media;
        if ((r && t.setAttribute('media', r), t.styleSheet))
          t.styleSheet.cssText = n;
        else {
          for (; t.firstChild; ) t.removeChild(t.firstChild);
          t.appendChild(document.createTextNode(n));
        }
      }
      function j(t, e, n) {
        var r = n.css,
          o = n.sourceMap,
          i = void 0 === e.convertToAbsoluteUrls && o;
        (e.convertToAbsoluteUrls || i) && (r = p(r)),
          o &&
            (r +=
              '\n/*# sourceMappingURL=data:application/json;base64,' +
              btoa(unescape(encodeURIComponent(JSON.stringify(o)))) +
              ' */');
        var a = new Blob([r], { type: 'text/css' }),
          s = t.href;
        (t.href = URL.createObjectURL(a)), s && URL.revokeObjectURL(s);
      }
    },
    9657: t => {
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
    }
  }
]);
