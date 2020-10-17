(self.webpackChunk_elyra_pipeline_editor_extension =
  self.webpackChunk_elyra_pipeline_editor_extension || []).push([
  [883],
  {
    263: (e, t, r) => {
      'use strict';
      (t = e.exports = r(8663).default).default = t;
    },
    8663: (e, t) => {
      'use strict';
      t.default = (function() {
        function e(t, r, n, o) {
          (this.message = t),
            (this.expected = r),
            (this.found = n),
            (this.location = o),
            (this.name = 'SyntaxError'),
            'function' == typeof Error.captureStackTrace &&
              Error.captureStackTrace(this, e);
        }
        return (
          (function(e, t) {
            function r() {
              this.constructor = e;
            }
            (r.prototype = t.prototype), (e.prototype = new r());
          })(e, Error),
          {
            SyntaxError: e,
            parse: function(t) {
              var r,
                n = arguments.length > 1 ? arguments[1] : {},
                o = {},
                a = { start: Ne },
                i = Ne,
                s = function(e) {
                  return {
                    type: 'messageFormatPattern',
                    elements: e,
                    location: Oe()
                  };
                },
                l = function(e) {
                  var t,
                    r,
                    n,
                    o,
                    a,
                    i = '';
                  for (t = 0, n = e.length; t < n; t += 1)
                    for (r = 0, a = (o = e[t]).length; r < a; r += 1) i += o[r];
                  return i;
                },
                u = function(e) {
                  return {
                    type: 'messageTextElement',
                    value: e,
                    location: Oe()
                  };
                },
                c = /^[^ \t\n\r,.+={}#]/,
                f = {
                  type: 'class',
                  value: '[^ \\t\\n\\r,.+={}#]',
                  description: '[^ \\t\\n\\r,.+={}#]'
                },
                p = '{',
                h = { type: 'literal', value: '{', description: '"{"' },
                m = ',',
                d = { type: 'literal', value: ',', description: '","' },
                v = '}',
                y = { type: 'literal', value: '}', description: '"}"' },
                g = function(e, t) {
                  return {
                    type: 'argumentElement',
                    id: e,
                    format: t && t[2],
                    location: Oe()
                  };
                },
                _ = 'number',
                w = {
                  type: 'literal',
                  value: 'number',
                  description: '"number"'
                },
                b = 'date',
                F = { type: 'literal', value: 'date', description: '"date"' },
                x = 'time',
                k = { type: 'literal', value: 'time', description: '"time"' },
                O = function(e, t) {
                  return {
                    type: e + 'Format',
                    style: t && t[2],
                    location: Oe()
                  };
                },
                P = 'plural',
                T = {
                  type: 'literal',
                  value: 'plural',
                  description: '"plural"'
                },
                C = function(e) {
                  return {
                    type: e.type,
                    ordinal: !1,
                    offset: e.offset || 0,
                    options: e.options,
                    location: Oe()
                  };
                },
                j = 'selectordinal',
                N = {
                  type: 'literal',
                  value: 'selectordinal',
                  description: '"selectordinal"'
                },
                M = function(e) {
                  return {
                    type: e.type,
                    ordinal: !0,
                    offset: e.offset || 0,
                    options: e.options,
                    location: Oe()
                  };
                },
                E = 'select',
                A = {
                  type: 'literal',
                  value: 'select',
                  description: '"select"'
                },
                I = function(e) {
                  return { type: 'selectFormat', options: e, location: Oe() };
                },
                D = '=',
                R = { type: 'literal', value: '=', description: '"="' },
                L = function(e, t) {
                  return {
                    type: 'optionalFormatPattern',
                    selector: e,
                    value: t,
                    location: Oe()
                  };
                },
                S = 'offset:',
                U = {
                  type: 'literal',
                  value: 'offset:',
                  description: '"offset:"'
                },
                Z = function(e) {
                  return e;
                },
                G = function(e, t) {
                  return {
                    type: 'pluralFormat',
                    offset: e,
                    options: t,
                    location: Oe()
                  };
                },
                H = { type: 'other', description: 'whitespace' },
                W = /^[ \t\n\r]/,
                q = {
                  type: 'class',
                  value: '[ \\t\\n\\r]',
                  description: '[ \\t\\n\\r]'
                },
                V = { type: 'other', description: 'optionalWhitespace' },
                z = /^[0-9]/,
                B = { type: 'class', value: '[0-9]', description: '[0-9]' },
                $ = /^[0-9a-f]/i,
                J = {
                  type: 'class',
                  value: '[0-9a-f]i',
                  description: '[0-9a-f]i'
                },
                K = '0',
                Q = { type: 'literal', value: '0', description: '"0"' },
                X = /^[1-9]/,
                Y = { type: 'class', value: '[1-9]', description: '[1-9]' },
                ee = function(e) {
                  return parseInt(e, 10);
                },
                te = /^[^{}\\\0-\x1F \t\n\r]/,
                re = {
                  type: 'class',
                  value: '[^{}\\\\\\0-\\x1F\\x7f \\t\\n\\r]',
                  description: '[^{}\\\\\\0-\\x1F\\x7f \\t\\n\\r]'
                },
                ne = '\\\\',
                oe = {
                  type: 'literal',
                  value: '\\\\',
                  description: '"\\\\\\\\"'
                },
                ae = function() {
                  return '\\';
                },
                ie = '\\#',
                se = { type: 'literal', value: '\\#', description: '"\\\\#"' },
                le = function() {
                  return '\\#';
                },
                ue = '\\{',
                ce = { type: 'literal', value: '\\{', description: '"\\\\{"' },
                fe = function() {
                  return '{';
                },
                pe = '\\}',
                he = { type: 'literal', value: '\\}', description: '"\\\\}"' },
                me = function() {
                  return '}';
                },
                de = '\\u',
                ve = { type: 'literal', value: '\\u', description: '"\\\\u"' },
                ye = function(e) {
                  return String.fromCharCode(parseInt(e, 16));
                },
                ge = function(e) {
                  return e.join('');
                },
                _e = 0,
                we = 0,
                be = [{ line: 1, column: 1, seenCR: !1 }],
                Fe = 0,
                xe = [],
                ke = 0;
              if ('startRule' in n) {
                if (!(n.startRule in a))
                  throw new Error(
                    'Can\'t start parsing from rule "' + n.startRule + '".'
                  );
                i = a[n.startRule];
              }
              function Oe() {
                return Te(we, _e);
              }
              function Pe(e) {
                var r,
                  n,
                  o = be[e];
                if (o) return o;
                for (r = e - 1; !be[r]; ) r--;
                for (
                  o = {
                    line: (o = be[r]).line,
                    column: o.column,
                    seenCR: o.seenCR
                  };
                  r < e;

                )
                  '\n' === (n = t.charAt(r))
                    ? (o.seenCR || o.line++, (o.column = 1), (o.seenCR = !1))
                    : '\r' === n || '\u2028' === n || '\u2029' === n
                    ? (o.line++, (o.column = 1), (o.seenCR = !0))
                    : (o.column++, (o.seenCR = !1)),
                    r++;
                return (be[e] = o), o;
              }
              function Te(e, t) {
                var r = Pe(e),
                  n = Pe(t);
                return {
                  start: { offset: e, line: r.line, column: r.column },
                  end: { offset: t, line: n.line, column: n.column }
                };
              }
              function Ce(e) {
                _e < Fe || (_e > Fe && ((Fe = _e), (xe = [])), xe.push(e));
              }
              function je(t, r, n, o) {
                return (
                  null !== r &&
                    (function(e) {
                      var t = 1;
                      for (
                        e.sort(function(e, t) {
                          return e.description < t.description
                            ? -1
                            : e.description > t.description
                            ? 1
                            : 0;
                        });
                        t < e.length;

                      )
                        e[t - 1] === e[t] ? e.splice(t, 1) : t++;
                    })(r),
                  new e(
                    null !== t
                      ? t
                      : (function(e, t) {
                          var r,
                            n = new Array(e.length);
                          for (r = 0; r < e.length; r++)
                            n[r] = e[r].description;
                          return (
                            'Expected ' +
                            (e.length > 1
                              ? n.slice(0, -1).join(', ') +
                                ' or ' +
                                n[e.length - 1]
                              : n[0]) +
                            ' but ' +
                            (t
                              ? '"' +
                                (function(e) {
                                  function t(e) {
                                    return e
                                      .charCodeAt(0)
                                      .toString(16)
                                      .toUpperCase();
                                  }
                                  return e
                                    .replace(/\\/g, '\\\\')
                                    .replace(/"/g, '\\"')
                                    .replace(/\x08/g, '\\b')
                                    .replace(/\t/g, '\\t')
                                    .replace(/\n/g, '\\n')
                                    .replace(/\f/g, '\\f')
                                    .replace(/\r/g, '\\r')
                                    .replace(
                                      /[\x00-\x07\x0B\x0E\x0F]/g,
                                      function(e) {
                                        return '\\x0' + t(e);
                                      }
                                    )
                                    .replace(/[\x10-\x1F\x80-\xFF]/g, function(
                                      e
                                    ) {
                                      return '\\x' + t(e);
                                    })
                                    .replace(/[\u0100-\u0FFF]/g, function(e) {
                                      return '\\u0' + t(e);
                                    })
                                    .replace(/[\u1000-\uFFFF]/g, function(e) {
                                      return '\\u' + t(e);
                                    });
                                })(t) +
                                '"'
                              : 'end of input') +
                            ' found.'
                          );
                        })(r, n),
                    r,
                    n,
                    o
                  )
                );
              }
              function Ne() {
                return Me();
              }
              function Me() {
                var e, t, r;
                for (e = _e, t = [], r = Ee(); r !== o; ) t.push(r), (r = Ee());
                return t !== o && ((we = e), (t = s(t))), t;
              }
              function Ee() {
                var e;
                return (e = Ie()) === o && (e = Re()), e;
              }
              function Ae() {
                var e, r, n, a, i, s;
                if (
                  ((e = _e),
                  (r = []),
                  (n = _e),
                  (a = Be()) !== o && (i = Xe()) !== o && (s = Be()) !== o
                    ? (n = a = [a, i, s])
                    : ((_e = n), (n = o)),
                  n !== o)
                )
                  for (; n !== o; )
                    r.push(n),
                      (n = _e),
                      (a = Be()) !== o && (i = Xe()) !== o && (s = Be()) !== o
                        ? (n = a = [a, i, s])
                        : ((_e = n), (n = o));
                else r = o;
                return (
                  r !== o && ((we = e), (r = l(r))),
                  (e = r) === o &&
                    ((e = _e), (e = (r = ze()) !== o ? t.substring(e, _e) : r)),
                  e
                );
              }
              function Ie() {
                var e, t;
                return (e = _e), (t = Ae()) !== o && ((we = e), (t = u(t))), t;
              }
              function De() {
                var e, r, n;
                if ((e = Ke()) === o) {
                  if (
                    ((e = _e),
                    (r = []),
                    c.test(t.charAt(_e))
                      ? ((n = t.charAt(_e)), _e++)
                      : ((n = o), 0 === ke && Ce(f)),
                    n !== o)
                  )
                    for (; n !== o; )
                      r.push(n),
                        c.test(t.charAt(_e))
                          ? ((n = t.charAt(_e)), _e++)
                          : ((n = o), 0 === ke && Ce(f));
                  else r = o;
                  e = r !== o ? t.substring(e, _e) : r;
                }
                return e;
              }
              function Re() {
                var e, r, n, a, i, s, l;
                return (
                  (e = _e),
                  123 === t.charCodeAt(_e)
                    ? ((r = p), _e++)
                    : ((r = o), 0 === ke && Ce(h)),
                  r !== o && Be() !== o && (n = De()) !== o && Be() !== o
                    ? ((a = _e),
                      44 === t.charCodeAt(_e)
                        ? ((i = m), _e++)
                        : ((i = o), 0 === ke && Ce(d)),
                      i !== o && (s = Be()) !== o && (l = Le()) !== o
                        ? (a = i = [i, s, l])
                        : ((_e = a), (a = o)),
                      a === o && (a = null),
                      a !== o && (i = Be()) !== o
                        ? (125 === t.charCodeAt(_e)
                            ? ((s = v), _e++)
                            : ((s = o), 0 === ke && Ce(y)),
                          s !== o
                            ? ((we = e), (e = r = g(n, a)))
                            : ((_e = e), (e = o)))
                        : ((_e = e), (e = o)))
                    : ((_e = e), (e = o)),
                  e
                );
              }
              function Le() {
                var e;
                return (
                  (e = Se()) === o &&
                    (e = Ue()) === o &&
                    (e = Ze()) === o &&
                    (e = Ge()),
                  e
                );
              }
              function Se() {
                var e, r, n, a, i, s;
                return (
                  (e = _e),
                  t.substr(_e, 6) === _
                    ? ((r = _), (_e += 6))
                    : ((r = o), 0 === ke && Ce(w)),
                  r === o &&
                    (t.substr(_e, 4) === b
                      ? ((r = b), (_e += 4))
                      : ((r = o), 0 === ke && Ce(F)),
                    r === o &&
                      (t.substr(_e, 4) === x
                        ? ((r = x), (_e += 4))
                        : ((r = o), 0 === ke && Ce(k)))),
                  r !== o && Be() !== o
                    ? ((n = _e),
                      44 === t.charCodeAt(_e)
                        ? ((a = m), _e++)
                        : ((a = o), 0 === ke && Ce(d)),
                      a !== o && (i = Be()) !== o && (s = Xe()) !== o
                        ? (n = a = [a, i, s])
                        : ((_e = n), (n = o)),
                      n === o && (n = null),
                      n !== o
                        ? ((we = e), (e = r = O(r, n)))
                        : ((_e = e), (e = o)))
                    : ((_e = e), (e = o)),
                  e
                );
              }
              function Ue() {
                var e, r, n, a;
                return (
                  (e = _e),
                  t.substr(_e, 6) === P
                    ? ((r = P), (_e += 6))
                    : ((r = o), 0 === ke && Ce(T)),
                  r !== o && Be() !== o
                    ? (44 === t.charCodeAt(_e)
                        ? ((n = m), _e++)
                        : ((n = o), 0 === ke && Ce(d)),
                      n !== o && Be() !== o && (a = Ve()) !== o
                        ? ((we = e), (e = r = C(a)))
                        : ((_e = e), (e = o)))
                    : ((_e = e), (e = o)),
                  e
                );
              }
              function Ze() {
                var e, r, n, a;
                return (
                  (e = _e),
                  t.substr(_e, 13) === j
                    ? ((r = j), (_e += 13))
                    : ((r = o), 0 === ke && Ce(N)),
                  r !== o && Be() !== o
                    ? (44 === t.charCodeAt(_e)
                        ? ((n = m), _e++)
                        : ((n = o), 0 === ke && Ce(d)),
                      n !== o && Be() !== o && (a = Ve()) !== o
                        ? ((we = e), (e = r = M(a)))
                        : ((_e = e), (e = o)))
                    : ((_e = e), (e = o)),
                  e
                );
              }
              function Ge() {
                var e, r, n, a, i;
                if (
                  ((e = _e),
                  t.substr(_e, 6) === E
                    ? ((r = E), (_e += 6))
                    : ((r = o), 0 === ke && Ce(A)),
                  r !== o)
                )
                  if (Be() !== o)
                    if (
                      (44 === t.charCodeAt(_e)
                        ? ((n = m), _e++)
                        : ((n = o), 0 === ke && Ce(d)),
                      n !== o)
                    )
                      if (Be() !== o) {
                        if (((a = []), (i = We()) !== o))
                          for (; i !== o; ) a.push(i), (i = We());
                        else a = o;
                        a !== o
                          ? ((we = e), (e = r = I(a)))
                          : ((_e = e), (e = o));
                      } else (_e = e), (e = o);
                    else (_e = e), (e = o);
                  else (_e = e), (e = o);
                else (_e = e), (e = o);
                return e;
              }
              function He() {
                var e, r, n, a;
                return (
                  (e = _e),
                  (r = _e),
                  61 === t.charCodeAt(_e)
                    ? ((n = D), _e++)
                    : ((n = o), 0 === ke && Ce(R)),
                  n !== o && (a = Ke()) !== o
                    ? (r = n = [n, a])
                    : ((_e = r), (r = o)),
                  (e = r !== o ? t.substring(e, _e) : r) === o && (e = Xe()),
                  e
                );
              }
              function We() {
                var e, r, n, a, i;
                return (
                  (e = _e),
                  Be() !== o && (r = He()) !== o && Be() !== o
                    ? (123 === t.charCodeAt(_e)
                        ? ((n = p), _e++)
                        : ((n = o), 0 === ke && Ce(h)),
                      n !== o && Be() !== o && (a = Me()) !== o && Be() !== o
                        ? (125 === t.charCodeAt(_e)
                            ? ((i = v), _e++)
                            : ((i = o), 0 === ke && Ce(y)),
                          i !== o
                            ? ((we = e), (e = L(r, a)))
                            : ((_e = e), (e = o)))
                        : ((_e = e), (e = o)))
                    : ((_e = e), (e = o)),
                  e
                );
              }
              function qe() {
                var e, r, n;
                return (
                  (e = _e),
                  t.substr(_e, 7) === S
                    ? ((r = S), (_e += 7))
                    : ((r = o), 0 === ke && Ce(U)),
                  r !== o && Be() !== o && (n = Ke()) !== o
                    ? ((we = e), (e = r = Z(n)))
                    : ((_e = e), (e = o)),
                  e
                );
              }
              function Ve() {
                var e, t, r, n;
                if (((e = _e), (t = qe()) === o && (t = null), t !== o))
                  if (Be() !== o) {
                    if (((r = []), (n = We()) !== o))
                      for (; n !== o; ) r.push(n), (n = We());
                    else r = o;
                    r !== o
                      ? ((we = e), (e = t = G(t, r)))
                      : ((_e = e), (e = o));
                  } else (_e = e), (e = o);
                else (_e = e), (e = o);
                return e;
              }
              function ze() {
                var e, r;
                if (
                  (ke++,
                  (e = []),
                  W.test(t.charAt(_e))
                    ? ((r = t.charAt(_e)), _e++)
                    : ((r = o), 0 === ke && Ce(q)),
                  r !== o)
                )
                  for (; r !== o; )
                    e.push(r),
                      W.test(t.charAt(_e))
                        ? ((r = t.charAt(_e)), _e++)
                        : ((r = o), 0 === ke && Ce(q));
                else e = o;
                return ke--, e === o && ((r = o), 0 === ke && Ce(H)), e;
              }
              function Be() {
                var e, r, n;
                for (ke++, e = _e, r = [], n = ze(); n !== o; )
                  r.push(n), (n = ze());
                return (
                  (e = r !== o ? t.substring(e, _e) : r),
                  ke--,
                  e === o && ((r = o), 0 === ke && Ce(V)),
                  e
                );
              }
              function $e() {
                var e;
                return (
                  z.test(t.charAt(_e))
                    ? ((e = t.charAt(_e)), _e++)
                    : ((e = o), 0 === ke && Ce(B)),
                  e
                );
              }
              function Je() {
                var e;
                return (
                  $.test(t.charAt(_e))
                    ? ((e = t.charAt(_e)), _e++)
                    : ((e = o), 0 === ke && Ce(J)),
                  e
                );
              }
              function Ke() {
                var e, r, n, a, i, s;
                if (
                  ((e = _e),
                  48 === t.charCodeAt(_e)
                    ? ((r = K), _e++)
                    : ((r = o), 0 === ke && Ce(Q)),
                  r === o)
                ) {
                  if (
                    ((r = _e),
                    (n = _e),
                    X.test(t.charAt(_e))
                      ? ((a = t.charAt(_e)), _e++)
                      : ((a = o), 0 === ke && Ce(Y)),
                    a !== o)
                  ) {
                    for (i = [], s = $e(); s !== o; ) i.push(s), (s = $e());
                    i !== o ? (n = a = [a, i]) : ((_e = n), (n = o));
                  } else (_e = n), (n = o);
                  r = n !== o ? t.substring(r, _e) : n;
                }
                return r !== o && ((we = e), (r = ee(r))), r;
              }
              function Qe() {
                var e, r, n, a, i, s, l, u;
                return (
                  te.test(t.charAt(_e))
                    ? ((e = t.charAt(_e)), _e++)
                    : ((e = o), 0 === ke && Ce(re)),
                  e === o &&
                    ((e = _e),
                    t.substr(_e, 2) === ne
                      ? ((r = ne), (_e += 2))
                      : ((r = o), 0 === ke && Ce(oe)),
                    r !== o && ((we = e), (r = ae())),
                    (e = r) === o &&
                      ((e = _e),
                      t.substr(_e, 2) === ie
                        ? ((r = ie), (_e += 2))
                        : ((r = o), 0 === ke && Ce(se)),
                      r !== o && ((we = e), (r = le())),
                      (e = r) === o &&
                        ((e = _e),
                        t.substr(_e, 2) === ue
                          ? ((r = ue), (_e += 2))
                          : ((r = o), 0 === ke && Ce(ce)),
                        r !== o && ((we = e), (r = fe())),
                        (e = r) === o &&
                          ((e = _e),
                          t.substr(_e, 2) === pe
                            ? ((r = pe), (_e += 2))
                            : ((r = o), 0 === ke && Ce(he)),
                          r !== o && ((we = e), (r = me())),
                          (e = r) === o &&
                            ((e = _e),
                            t.substr(_e, 2) === de
                              ? ((r = de), (_e += 2))
                              : ((r = o), 0 === ke && Ce(ve)),
                            r !== o
                              ? ((n = _e),
                                (a = _e),
                                (i = Je()) !== o &&
                                (s = Je()) !== o &&
                                (l = Je()) !== o &&
                                (u = Je()) !== o
                                  ? (a = i = [i, s, l, u])
                                  : ((_e = a), (a = o)),
                                (n = a !== o ? t.substring(n, _e) : a) !== o
                                  ? ((we = e), (e = r = ye(n)))
                                  : ((_e = e), (e = o)))
                              : ((_e = e), (e = o))))))),
                  e
                );
              }
              function Xe() {
                var e, t, r;
                if (((e = _e), (t = []), (r = Qe()) !== o))
                  for (; r !== o; ) t.push(r), (r = Qe());
                else t = o;
                return t !== o && ((we = e), (t = ge(t))), t;
              }
              if ((r = i()) !== o && _e === t.length) return r;
              throw (r !== o &&
                _e < t.length &&
                Ce({ type: 'end', description: 'end of input' }),
              je(
                null,
                xe,
                Fe < t.length ? t.charAt(Fe) : null,
                Fe < t.length ? Te(Fe, Fe + 1) : Te(Fe, Fe)
              ));
            }
          }
        );
      })();
    },
    6067: (e, t, r) => {
      'use strict';
      var n = r(4369).Z;
      r(9228), ((t = e.exports = n).default = t);
    },
    3843: (e, t) => {
      'use strict';
      function r(e, t, r) {
        (this.locales = e), (this.formats = t), (this.pluralFn = r);
      }
      function n(e) {
        this.id = e;
      }
      function o(e, t, r, n, o) {
        (this.id = e),
          (this.useOrdinal = t),
          (this.offset = r),
          (this.options = n),
          (this.pluralFn = o);
      }
      function a(e, t, r, n) {
        (this.id = e),
          (this.offset = t),
          (this.numberFormat = r),
          (this.string = n);
      }
      function i(e, t) {
        (this.id = e), (this.options = t);
      }
      (t.default = r),
        (r.prototype.compile = function(e) {
          return (
            (this.pluralStack = []),
            (this.currentPlural = null),
            (this.pluralNumberFormat = null),
            this.compileMessage(e)
          );
        }),
        (r.prototype.compileMessage = function(e) {
          if (!e || 'messageFormatPattern' !== e.type)
            throw new Error(
              'Message AST is not of type: "messageFormatPattern"'
            );
          var t,
            r,
            n,
            o = e.elements,
            a = [];
          for (t = 0, r = o.length; t < r; t += 1)
            switch ((n = o[t]).type) {
              case 'messageTextElement':
                a.push(this.compileMessageText(n));
                break;
              case 'argumentElement':
                a.push(this.compileArgument(n));
                break;
              default:
                throw new Error('Message element does not have a valid type');
            }
          return a;
        }),
        (r.prototype.compileMessageText = function(e) {
          return this.currentPlural && /(^|[^\\])#/g.test(e.value)
            ? (this.pluralNumberFormat ||
                (this.pluralNumberFormat = new Intl.NumberFormat(this.locales)),
              new a(
                this.currentPlural.id,
                this.currentPlural.format.offset,
                this.pluralNumberFormat,
                e.value
              ))
            : e.value.replace(/\\#/g, '#');
        }),
        (r.prototype.compileArgument = function(e) {
          var t = e.format;
          if (!t) return new n(e.id);
          var r,
            a = this.formats,
            s = this.locales,
            l = this.pluralFn;
          switch (t.type) {
            case 'numberFormat':
              return (
                (r = a.number[t.style]),
                { id: e.id, format: new Intl.NumberFormat(s, r).format }
              );
            case 'dateFormat':
              return (
                (r = a.date[t.style]),
                { id: e.id, format: new Intl.DateTimeFormat(s, r).format }
              );
            case 'timeFormat':
              return (
                (r = a.time[t.style]),
                { id: e.id, format: new Intl.DateTimeFormat(s, r).format }
              );
            case 'pluralFormat':
              return (
                (r = this.compileOptions(e)),
                new o(e.id, t.ordinal, t.offset, r, l)
              );
            case 'selectFormat':
              return (r = this.compileOptions(e)), new i(e.id, r);
            default:
              throw new Error(
                'Message element does not have a valid format type'
              );
          }
        }),
        (r.prototype.compileOptions = function(e) {
          var t,
            r,
            n,
            o = e.format,
            a = o.options,
            i = {};
          for (
            this.pluralStack.push(this.currentPlural),
              this.currentPlural = 'pluralFormat' === o.type ? e : null,
              t = 0,
              r = a.length;
            t < r;
            t += 1
          )
            i[(n = a[t]).selector] = this.compileMessage(n.value);
          return (this.currentPlural = this.pluralStack.pop()), i;
        }),
        (n.prototype.format = function(e) {
          return e || 'number' == typeof e
            ? 'string' == typeof e
              ? e
              : String(e)
            : '';
        }),
        (o.prototype.getOption = function(e) {
          var t = this.options;
          return (
            t['=' + e] ||
            t[this.pluralFn(e - this.offset, this.useOrdinal)] ||
            t.other
          );
        }),
        (a.prototype.format = function(e) {
          var t = this.numberFormat.format(e - this.offset);
          return this.string
            .replace(/(^|[^\\])#/g, '$1' + t)
            .replace(/\\#/g, '#');
        }),
        (i.prototype.getOption = function(e) {
          var t = this.options;
          return t[e] || t.other;
        });
    },
    7906: (e, t, r) => {
      'use strict';
      var n = r(9529),
        o = r(9170),
        a = r(3843),
        i = r(263);
      function s(e, t, r) {
        var n = 'string' == typeof e ? s.__parse(e) : e;
        if (!n || 'messageFormatPattern' !== n.type)
          throw new TypeError('A message must be provided as a String or AST.');
        (r = this._mergeFormats(s.formats, r)),
          o.defineProperty(this, '_locale', { value: this._resolveLocale(t) });
        var a = this._findPluralRuleFunction(this._locale),
          i = this._compilePattern(n, t, r, a),
          l = this;
        this.format = function(t) {
          try {
            return l._format(i, t);
          } catch (t) {
            throw t.variableId
              ? new Error(
                  "The intl string context variable '" +
                    t.variableId +
                    "' was not provided to the string '" +
                    e +
                    "'"
                )
              : t;
          }
        };
      }
      (t.default = s),
        o.defineProperty(s, 'formats', {
          enumerable: !0,
          value: {
            number: {
              currency: { style: 'currency' },
              percent: { style: 'percent' }
            },
            date: {
              short: { month: 'numeric', day: 'numeric', year: '2-digit' },
              medium: { month: 'short', day: 'numeric', year: 'numeric' },
              long: { month: 'long', day: 'numeric', year: 'numeric' },
              full: {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              }
            },
            time: {
              short: { hour: 'numeric', minute: 'numeric' },
              medium: { hour: 'numeric', minute: 'numeric', second: 'numeric' },
              long: {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                timeZoneName: 'short'
              },
              full: {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                timeZoneName: 'short'
              }
            }
          }
        }),
        o.defineProperty(s, '__localeData__', { value: o.objCreate(null) }),
        o.defineProperty(s, '__addLocaleData', {
          value: function(e) {
            if (!e || !e.locale)
              throw new Error(
                'Locale data provided to IntlMessageFormat is missing a `locale` property'
              );
            s.__localeData__[e.locale.toLowerCase()] = e;
          }
        }),
        o.defineProperty(s, '__parse', { value: i.default.parse }),
        o.defineProperty(s, 'defaultLocale', {
          enumerable: !0,
          writable: !0,
          value: void 0
        }),
        (s.prototype.resolvedOptions = function() {
          return { locale: this._locale };
        }),
        (s.prototype._compilePattern = function(e, t, r, n) {
          return new a.default(t, r, n).compile(e);
        }),
        (s.prototype._findPluralRuleFunction = function(e) {
          for (var t = s.__localeData__, r = t[e.toLowerCase()]; r; ) {
            if (r.pluralRuleFunction) return r.pluralRuleFunction;
            r = r.parentLocale && t[r.parentLocale.toLowerCase()];
          }
          throw new Error(
            'Locale data added to IntlMessageFormat is missing a `pluralRuleFunction` for :' +
              e
          );
        }),
        (s.prototype._format = function(e, t) {
          var r,
            o,
            a,
            i,
            s,
            l,
            u = '';
          for (r = 0, o = e.length; r < o; r += 1)
            if ('string' != typeof (a = e[r])) {
              if (((i = a.id), !t || !n.hop.call(t, i)))
                throw (((l = new Error(
                  'A value must be provided for: ' + i
                )).variableId = i),
                l);
              (s = t[i]),
                a.options
                  ? (u += this._format(a.getOption(s), t))
                  : (u += a.format(s));
            } else u += a;
          return u;
        }),
        (s.prototype._mergeFormats = function(e, t) {
          var r,
            a,
            i = {};
          for (r in e)
            n.hop.call(e, r) &&
              ((i[r] = a = o.objCreate(e[r])),
              t && n.hop.call(t, r) && n.extend(a, t[r]));
          return i;
        }),
        (s.prototype._resolveLocale = function(e) {
          'string' == typeof e && (e = [e]),
            (e = (e || []).concat(s.defaultLocale));
          var t,
            r,
            n,
            o,
            a = s.__localeData__;
          for (t = 0, r = e.length; t < r; t += 1)
            for (n = e[t].toLowerCase().split('-'); n.length; ) {
              if ((o = a[n.join('-')])) return o.locale;
              n.pop();
            }
          var i = e.pop();
          throw new Error(
            'No locale data has been added to IntlMessageFormat for: ' +
              e.join(', ') +
              ', or the default locale: ' +
              i
          );
        });
    },
    3074: (e, t) => {
      'use strict';
      t.default = {
        locale: 'en',
        pluralRuleFunction: function(e, t) {
          var r = String(e).split('.'),
            n = !r[1],
            o = Number(r[0]) == e,
            a = o && r[0].slice(-1),
            i = o && r[0].slice(-2);
          return t
            ? 1 == a && 11 != i
              ? 'one'
              : 2 == a && 12 != i
              ? 'two'
              : 3 == a && 13 != i
              ? 'few'
              : 'other'
            : 1 == e && n
            ? 'one'
            : 'other';
        }
      };
    },
    9170: (e, t, r) => {
      'use strict';
      var n = r(9529),
        o = (function() {
          try {
            return !!Object.defineProperty({}, 'a', {});
          } catch (e) {
            return !1;
          }
        })(),
        a =
          (!o && Object.prototype.__defineGetter__,
          o
            ? Object.defineProperty
            : function(e, t, r) {
                'get' in r && e.__defineGetter__
                  ? e.__defineGetter__(t, r.get)
                  : (n.hop.call(e, t) && !('value' in r)) || (e[t] = r.value);
              }),
        i =
          Object.create ||
          function(e, t) {
            var r, o;
            function i() {}
            for (o in ((i.prototype = e), (r = new i()), t))
              n.hop.call(t, o) && a(r, o, t[o]);
            return r;
          };
      (t.defineProperty = a), (t.objCreate = i);
    },
    4369: (e, t, r) => {
      'use strict';
      var n = r(7906),
        o = r(3074);
      n.default.__addLocaleData(o.default),
        (n.default.defaultLocale = 'en'),
        (t.Z = n.default);
    },
    9529: (e, t) => {
      'use strict';
      t.extend = function(e) {
        var t,
          n,
          o,
          a,
          i = Array.prototype.slice.call(arguments, 1);
        for (t = 0, n = i.length; t < n; t += 1)
          if ((o = i[t])) for (a in o) r.call(o, a) && (e[a] = o[a]);
        return e;
      };
      var r = Object.prototype.hasOwnProperty;
      t.hop = r;
    },
    2208: (e, t, r) => {
      'use strict';
      var n = r(8333).Z;
      r(9228), ((t = e.exports = n).default = t);
    },
    7573: (e, t, r) => {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: !0 });
      var n = r(6067),
        o = r(3230),
        a = r(493);
      t.default = l;
      var i = [
          'second',
          'second-short',
          'minute',
          'minute-short',
          'hour',
          'hour-short',
          'day',
          'day-short',
          'month',
          'month-short',
          'year',
          'year-short'
        ],
        s = ['best fit', 'numeric'];
      function l(e, t) {
        (t = t || {}),
          a.isArray(e) && (e = e.concat()),
          a.defineProperty(this, '_locale', { value: this._resolveLocale(e) }),
          a.defineProperty(this, '_options', {
            value: {
              style: this._resolveStyle(t.style),
              units: this._isValidUnits(t.units) && t.units
            }
          }),
          a.defineProperty(this, '_locales', { value: e }),
          a.defineProperty(this, '_fields', {
            value: this._findFields(this._locale)
          }),
          a.defineProperty(this, '_messages', { value: a.objCreate(null) });
        var r = this;
        this.format = function(e, t) {
          return r._format(e, t);
        };
      }
      a.defineProperty(l, '__localeData__', { value: a.objCreate(null) }),
        a.defineProperty(l, '__addLocaleData', {
          value: function() {
            for (var e = 0; e < arguments.length; e++) {
              var t = arguments[e];
              if (!t || !t.locale)
                throw new Error(
                  'Locale data provided to IntlRelativeFormat is missing a `locale` property value'
                );
              (l.__localeData__[t.locale.toLowerCase()] = t),
                n.default.__addLocaleData(t);
            }
          }
        }),
        a.defineProperty(l, 'defaultLocale', {
          enumerable: !0,
          writable: !0,
          value: void 0
        }),
        a.defineProperty(l, 'thresholds', {
          enumerable: !0,
          value: {
            second: 45,
            'second-short': 45,
            minute: 45,
            'minute-short': 45,
            hour: 22,
            'hour-short': 22,
            day: 26,
            'day-short': 26,
            month: 11,
            'month-short': 11
          }
        }),
        (l.prototype.resolvedOptions = function() {
          return {
            locale: this._locale,
            style: this._options.style,
            units: this._options.units
          };
        }),
        (l.prototype._compileMessage = function(e) {
          var t,
            r = this._locales,
            o = (this._locale, this._fields[e].relativeTime),
            a = '',
            i = '';
          for (t in o.future)
            o.future.hasOwnProperty(t) &&
              (a += ' ' + t + ' {' + o.future[t].replace('{0}', '#') + '}');
          for (t in o.past)
            o.past.hasOwnProperty(t) &&
              (i += ' ' + t + ' {' + o.past[t].replace('{0}', '#') + '}');
          var s =
            '{when, select, future {{0, plural, ' +
            a +
            '}}past {{0, plural, ' +
            i +
            '}}}';
          return new n.default(s, r);
        }),
        (l.prototype._getMessage = function(e) {
          var t = this._messages;
          return t[e] || (t[e] = this._compileMessage(e)), t[e];
        }),
        (l.prototype._getRelativeUnits = function(e, t) {
          var r = this._fields[t];
          if (r.relative) return r.relative[e];
        }),
        (l.prototype._findFields = function(e) {
          for (var t = l.__localeData__, r = t[e.toLowerCase()]; r; ) {
            if (r.fields) return r.fields;
            r = r.parentLocale && t[r.parentLocale.toLowerCase()];
          }
          throw new Error(
            'Locale data added to IntlRelativeFormat is missing `fields` for :' +
              e
          );
        }),
        (l.prototype._format = function(e, t) {
          var r = t && void 0 !== t.now ? t.now : a.dateNow();
          if ((void 0 === e && (e = r), !isFinite(r)))
            throw new RangeError(
              'The `now` option provided to IntlRelativeFormat#format() is not in valid range.'
            );
          if (!isFinite(e))
            throw new RangeError(
              'The date value provided to IntlRelativeFormat#format() is not in valid range.'
            );
          var n = o.default(r, e),
            i = this._options.units || this._selectUnits(n),
            s = n[i];
          if ('numeric' !== this._options.style) {
            var l = this._getRelativeUnits(s, i);
            if (l) return l;
          }
          return this._getMessage(i).format({
            0: Math.abs(s),
            when: s < 0 ? 'past' : 'future'
          });
        }),
        (l.prototype._isValidUnits = function(e) {
          if (!e || a.arrIndexOf.call(i, e) >= 0) return !0;
          if ('string' == typeof e) {
            var t = /s$/.test(e) && e.substr(0, e.length - 1);
            if (t && a.arrIndexOf.call(i, t) >= 0)
              throw new Error(
                '"' +
                  e +
                  '" is not a valid IntlRelativeFormat `units` value, did you mean: ' +
                  t
              );
          }
          throw new Error(
            '"' +
              e +
              '" is not a valid IntlRelativeFormat `units` value, it must be one of: "' +
              i.join('", "') +
              '"'
          );
        }),
        (l.prototype._resolveLocale = function(e) {
          'string' == typeof e && (e = [e]),
            (e = (e || []).concat(l.defaultLocale));
          var t,
            r,
            n,
            o,
            a = l.__localeData__;
          for (t = 0, r = e.length; t < r; t += 1)
            for (n = e[t].toLowerCase().split('-'); n.length; ) {
              if ((o = a[n.join('-')])) return o.locale;
              n.pop();
            }
          var i = e.pop();
          throw new Error(
            'No locale data has been added to IntlRelativeFormat for: ' +
              e.join(', ') +
              ', or the default locale: ' +
              i
          );
        }),
        (l.prototype._resolveStyle = function(e) {
          if (!e) return s[0];
          if (a.arrIndexOf.call(s, e) >= 0) return e;
          throw new Error(
            '"' +
              e +
              '" is not a valid IntlRelativeFormat `style` value, it must be one of: "' +
              s.join('", "') +
              '"'
          );
        }),
        (l.prototype._selectUnits = function(e) {
          var t,
            r,
            n,
            o = i.filter(function(e) {
              return e.indexOf('-short') < 1;
            });
          for (
            t = 0, r = o.length;
            t < r && ((n = o[t]), !(Math.abs(e[n]) < l.thresholds[n]));
            t += 1
          );
          return n;
        });
    },
    3230: (e, t) => {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: !0 });
      var r = Math.round;
      function n(e) {
        var t = new Date(e);
        return t.setHours(0, 0, 0, 0), t;
      }
      t.default = function(e, t) {
        var o,
          a,
          i,
          s,
          l,
          u = r((t = +t) - (e = +e)),
          c = r(u / 1e3),
          f = r(c / 60),
          p = r(f / 60),
          h =
            ((o = e),
            (a = n(t)),
            (i = n(o)),
            (s = a.getTime() - 6e4 * a.getTimezoneOffset()),
            (l = i.getTime() - 6e4 * i.getTimezoneOffset()),
            Math.round((s - l) / 864e5)),
          m = r(h / 7),
          d = (400 * h) / 146097,
          v = r(12 * d),
          y = r(d);
        return {
          millisecond: u,
          second: c,
          'second-short': c,
          minute: f,
          'minute-short': f,
          hour: p,
          'hour-short': p,
          day: h,
          'day-short': h,
          week: m,
          'week-short': m,
          month: v,
          'month-short': v,
          year: y,
          'year-short': y
        };
      };
    },
    6030: (e, t) => {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: !0 }),
        (t.default = {
          locale: 'en',
          pluralRuleFunction: function(e, t) {
            var r = String(e).split('.'),
              n = !r[1],
              o = Number(r[0]) == e,
              a = o && r[0].slice(-1),
              i = o && r[0].slice(-2);
            return t
              ? 1 == a && 11 != i
                ? 'one'
                : 2 == a && 12 != i
                ? 'two'
                : 3 == a && 13 != i
                ? 'few'
                : 'other'
              : 1 == e && n
              ? 'one'
              : 'other';
          },
          fields: {
            year: {
              displayName: 'year',
              relative: { 0: 'this year', 1: 'next year', '-1': 'last year' },
              relativeTime: {
                future: { one: 'in {0} year', other: 'in {0} years' },
                past: { one: '{0} year ago', other: '{0} years ago' }
              }
            },
            'year-short': {
              displayName: 'yr.',
              relative: { 0: 'this yr.', 1: 'next yr.', '-1': 'last yr.' },
              relativeTime: {
                future: { one: 'in {0} yr.', other: 'in {0} yr.' },
                past: { one: '{0} yr. ago', other: '{0} yr. ago' }
              }
            },
            month: {
              displayName: 'month',
              relative: {
                0: 'this month',
                1: 'next month',
                '-1': 'last month'
              },
              relativeTime: {
                future: { one: 'in {0} month', other: 'in {0} months' },
                past: { one: '{0} month ago', other: '{0} months ago' }
              }
            },
            'month-short': {
              displayName: 'mo.',
              relative: { 0: 'this mo.', 1: 'next mo.', '-1': 'last mo.' },
              relativeTime: {
                future: { one: 'in {0} mo.', other: 'in {0} mo.' },
                past: { one: '{0} mo. ago', other: '{0} mo. ago' }
              }
            },
            week: {
              displayName: 'week',
              relativePeriod: 'the week of {0}',
              relative: { 0: 'this week', 1: 'next week', '-1': 'last week' },
              relativeTime: {
                future: { one: 'in {0} week', other: 'in {0} weeks' },
                past: { one: '{0} week ago', other: '{0} weeks ago' }
              }
            },
            'week-short': {
              displayName: 'wk.',
              relativePeriod: 'the week of {0}',
              relative: { 0: 'this wk.', 1: 'next wk.', '-1': 'last wk.' },
              relativeTime: {
                future: { one: 'in {0} wk.', other: 'in {0} wk.' },
                past: { one: '{0} wk. ago', other: '{0} wk. ago' }
              }
            },
            day: {
              displayName: 'day',
              relative: { 0: 'today', 1: 'tomorrow', '-1': 'yesterday' },
              relativeTime: {
                future: { one: 'in {0} day', other: 'in {0} days' },
                past: { one: '{0} day ago', other: '{0} days ago' }
              }
            },
            'day-short': {
              displayName: 'day',
              relative: { 0: 'today', 1: 'tomorrow', '-1': 'yesterday' },
              relativeTime: {
                future: { one: 'in {0} day', other: 'in {0} days' },
                past: { one: '{0} day ago', other: '{0} days ago' }
              }
            },
            hour: {
              displayName: 'hour',
              relative: { 0: 'this hour' },
              relativeTime: {
                future: { one: 'in {0} hour', other: 'in {0} hours' },
                past: { one: '{0} hour ago', other: '{0} hours ago' }
              }
            },
            'hour-short': {
              displayName: 'hr.',
              relative: { 0: 'this hour' },
              relativeTime: {
                future: { one: 'in {0} hr.', other: 'in {0} hr.' },
                past: { one: '{0} hr. ago', other: '{0} hr. ago' }
              }
            },
            minute: {
              displayName: 'minute',
              relative: { 0: 'this minute' },
              relativeTime: {
                future: { one: 'in {0} minute', other: 'in {0} minutes' },
                past: { one: '{0} minute ago', other: '{0} minutes ago' }
              }
            },
            'minute-short': {
              displayName: 'min.',
              relative: { 0: 'this minute' },
              relativeTime: {
                future: { one: 'in {0} min.', other: 'in {0} min.' },
                past: { one: '{0} min. ago', other: '{0} min. ago' }
              }
            },
            second: {
              displayName: 'second',
              relative: { 0: 'now' },
              relativeTime: {
                future: { one: 'in {0} second', other: 'in {0} seconds' },
                past: { one: '{0} second ago', other: '{0} seconds ago' }
              }
            },
            'second-short': {
              displayName: 'sec.',
              relative: { 0: 'now' },
              relativeTime: {
                future: { one: 'in {0} sec.', other: 'in {0} sec.' },
                past: { one: '{0} sec. ago', other: '{0} sec. ago' }
              }
            }
          }
        });
    },
    493: (e, t) => {
      'use strict';
      Object.defineProperty(t, '__esModule', { value: !0 });
      var r = Object.prototype.hasOwnProperty,
        n = Object.prototype.toString,
        o = (function() {
          try {
            return !!Object.defineProperty({}, 'a', {});
          } catch (e) {
            return !1;
          }
        })(),
        a =
          (!o && Object.prototype.__defineGetter__,
          o
            ? Object.defineProperty
            : function(e, t, n) {
                'get' in n && e.__defineGetter__
                  ? e.__defineGetter__(t, n.get)
                  : (r.call(e, t) && !('value' in n)) || (e[t] = n.value);
              });
      t.defineProperty = a;
      var i =
        Object.create ||
        function(e, t) {
          var n, o;
          function i() {}
          for (o in ((i.prototype = e), (n = new i()), t))
            r.call(t, o) && a(n, o, t[o]);
          return n;
        };
      t.objCreate = i;
      var s =
        Array.prototype.indexOf ||
        function(e, t) {
          var r = this;
          if (!r.length) return -1;
          for (var n = t || 0, o = r.length; n < o; n++)
            if (r[n] === e) return n;
          return -1;
        };
      t.arrIndexOf = s;
      var l =
        Array.isArray ||
        function(e) {
          return '[object Array]' === n.call(e);
        };
      t.isArray = l;
      var u =
        Date.now ||
        function() {
          return new Date().getTime();
        };
      t.dateNow = u;
    },
    8333: (e, t, r) => {
      'use strict';
      var n = r(7573),
        o = r(6030);
      n.default.__addLocaleData(o.default),
        (n.default.defaultLocale = 'en'),
        (t.Z = n.default);
    },
    7677: e => {
      'use strict';
      e.exports = function(e, t, r, n, o, a, i, s) {
        if (!e) {
          var l;
          if (void 0 === t)
            l = new Error(
              'Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.'
            );
          else {
            var u = [r, n, o, a, i, s],
              c = 0;
            (l = new Error(
              t.replace(/%s/g, function() {
                return u[c++];
              })
            )).name = 'Invariant Violation';
          }
          throw ((l.framesToPop = 1), l);
        }
      };
    },
    883: (e, t, r) => {
      'use strict';
      r.r(t),
        r.d(t, {
          FormattedDate: () => Oe,
          FormattedHTMLMessage: () => Ie,
          FormattedMessage: () => Ae,
          FormattedNumber: () => Ne,
          FormattedPlural: () => Me,
          FormattedRelative: () => je,
          FormattedTime: () => Pe,
          IntlProvider: () => ke,
          addLocaleData: () => w,
          defineMessages: () => le,
          injectIntl: () => se,
          intlShape: () => V
        });
      var n = r(214),
        o = r.n(n),
        a = r(6067),
        i = r.n(a),
        s = r(2208),
        l = r.n(s),
        u = r(3980),
        c = r.n(u),
        f = r(2959),
        p = r.n(f),
        h = r(3463),
        m = r.n(h),
        d = r(7677),
        v = r.n(d);
      function y(e) {
        return JSON.stringify(
          e.map(function(e) {
            return e && 'object' == typeof e
              ? ((t = e),
                Object.keys(t)
                  .sort()
                  .map(function(e) {
                    var r;
                    return ((r = {})[e] = t[e]), r;
                  }))
              : e;
            var t;
          })
        );
      }
      const g = function(e, t) {
        return (
          void 0 === t && (t = {}),
          function() {
            for (var r, n = [], o = 0; o < arguments.length; o++)
              n[o] = arguments[o];
            var a = y(n),
              i = a && t[a];
            return (
              i ||
                ((i = new ((r = e).bind.apply(r, [void 0].concat(n)))()),
                a && (t[a] = i)),
              i
            );
          }
        );
      };
      var _ = {
        locale: 'en',
        pluralRuleFunction: function(e, t) {
          var r = String(e).split('.'),
            n = !r[1],
            o = Number(r[0]) == e,
            a = o && r[0].slice(-1),
            i = o && r[0].slice(-2);
          return t
            ? 1 == a && 11 != i
              ? 'one'
              : 2 == a && 12 != i
              ? 'two'
              : 3 == a && 13 != i
              ? 'few'
              : 'other'
            : 1 == e && n
            ? 'one'
            : 'other';
        },
        fields: {
          year: {
            displayName: 'year',
            relative: { 0: 'this year', 1: 'next year', '-1': 'last year' },
            relativeTime: {
              future: { one: 'in {0} year', other: 'in {0} years' },
              past: { one: '{0} year ago', other: '{0} years ago' }
            }
          },
          'year-short': {
            displayName: 'yr.',
            relative: { 0: 'this yr.', 1: 'next yr.', '-1': 'last yr.' },
            relativeTime: {
              future: { one: 'in {0} yr.', other: 'in {0} yr.' },
              past: { one: '{0} yr. ago', other: '{0} yr. ago' }
            }
          },
          month: {
            displayName: 'month',
            relative: { 0: 'this month', 1: 'next month', '-1': 'last month' },
            relativeTime: {
              future: { one: 'in {0} month', other: 'in {0} months' },
              past: { one: '{0} month ago', other: '{0} months ago' }
            }
          },
          'month-short': {
            displayName: 'mo.',
            relative: { 0: 'this mo.', 1: 'next mo.', '-1': 'last mo.' },
            relativeTime: {
              future: { one: 'in {0} mo.', other: 'in {0} mo.' },
              past: { one: '{0} mo. ago', other: '{0} mo. ago' }
            }
          },
          day: {
            displayName: 'day',
            relative: { 0: 'today', 1: 'tomorrow', '-1': 'yesterday' },
            relativeTime: {
              future: { one: 'in {0} day', other: 'in {0} days' },
              past: { one: '{0} day ago', other: '{0} days ago' }
            }
          },
          'day-short': {
            displayName: 'day',
            relative: { 0: 'today', 1: 'tomorrow', '-1': 'yesterday' },
            relativeTime: {
              future: { one: 'in {0} day', other: 'in {0} days' },
              past: { one: '{0} day ago', other: '{0} days ago' }
            }
          },
          hour: {
            displayName: 'hour',
            relative: { 0: 'this hour' },
            relativeTime: {
              future: { one: 'in {0} hour', other: 'in {0} hours' },
              past: { one: '{0} hour ago', other: '{0} hours ago' }
            }
          },
          'hour-short': {
            displayName: 'hr.',
            relative: { 0: 'this hour' },
            relativeTime: {
              future: { one: 'in {0} hr.', other: 'in {0} hr.' },
              past: { one: '{0} hr. ago', other: '{0} hr. ago' }
            }
          },
          minute: {
            displayName: 'minute',
            relative: { 0: 'this minute' },
            relativeTime: {
              future: { one: 'in {0} minute', other: 'in {0} minutes' },
              past: { one: '{0} minute ago', other: '{0} minutes ago' }
            }
          },
          'minute-short': {
            displayName: 'min.',
            relative: { 0: 'this minute' },
            relativeTime: {
              future: { one: 'in {0} min.', other: 'in {0} min.' },
              past: { one: '{0} min. ago', other: '{0} min. ago' }
            }
          },
          second: {
            displayName: 'second',
            relative: { 0: 'now' },
            relativeTime: {
              future: { one: 'in {0} second', other: 'in {0} seconds' },
              past: { one: '{0} second ago', other: '{0} seconds ago' }
            }
          },
          'second-short': {
            displayName: 'sec.',
            relative: { 0: 'now' },
            relativeTime: {
              future: { one: 'in {0} sec.', other: 'in {0} sec.' },
              past: { one: '{0} sec. ago', other: '{0} sec. ago' }
            }
          }
        }
      };
      function w() {
        var e =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [],
          t = Array.isArray(e) ? e : [e];
        t.forEach(function(e) {
          e && e.locale && (i().__addLocaleData(e), l().__addLocaleData(e));
        });
      }
      function b(e) {
        var t = e && e.toLowerCase();
        return !(!i().__localeData__[t] || !l().__localeData__[t]);
      }
      var F =
          'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
            ? function(e) {
                return typeof e;
              }
            : function(e) {
                return e &&
                  'function' == typeof Symbol &&
                  e.constructor === Symbol &&
                  e !== Symbol.prototype
                  ? 'symbol'
                  : typeof e;
              },
        x =
          ((function() {
            function e(e) {
              this.value = e;
            }
            function t(t) {
              var r, n;
              function o(r, n) {
                try {
                  var i = t[r](n),
                    s = i.value;
                  s instanceof e
                    ? Promise.resolve(s.value).then(
                        function(e) {
                          o('next', e);
                        },
                        function(e) {
                          o('throw', e);
                        }
                      )
                    : a(i.done ? 'return' : 'normal', i.value);
                } catch (e) {
                  a('throw', e);
                }
              }
              function a(e, t) {
                switch (e) {
                  case 'return':
                    r.resolve({ value: t, done: !0 });
                    break;
                  case 'throw':
                    r.reject(t);
                    break;
                  default:
                    r.resolve({ value: t, done: !1 });
                }
                (r = r.next) ? o(r.key, r.arg) : (n = null);
              }
              (this._invoke = function(e, t) {
                return new Promise(function(a, i) {
                  var s = { key: e, arg: t, resolve: a, reject: i, next: null };
                  n ? (n = n.next = s) : ((r = n = s), o(e, t));
                });
              }),
                'function' != typeof t.return && (this.return = void 0);
            }
            'function' == typeof Symbol &&
              Symbol.asyncIterator &&
              (t.prototype[Symbol.asyncIterator] = function() {
                return this;
              }),
              (t.prototype.next = function(e) {
                return this._invoke('next', e);
              }),
              (t.prototype.throw = function(e) {
                return this._invoke('throw', e);
              }),
              (t.prototype.return = function(e) {
                return this._invoke('return', e);
              });
          })(),
          function(e, t) {
            if (!(e instanceof t))
              throw new TypeError('Cannot call a class as a function');
          }),
        k = (function() {
          function e(e, t) {
            for (var r = 0; r < t.length; r++) {
              var n = t[r];
              (n.enumerable = n.enumerable || !1),
                (n.configurable = !0),
                'value' in n && (n.writable = !0),
                Object.defineProperty(e, n.key, n);
            }
          }
          return function(t, r, n) {
            return r && e(t.prototype, r), n && e(t, n), t;
          };
        })(),
        O = function(e, t, r) {
          return (
            t in e
              ? Object.defineProperty(e, t, {
                  value: r,
                  enumerable: !0,
                  configurable: !0,
                  writable: !0
                })
              : (e[t] = r),
            e
          );
        },
        P =
          Object.assign ||
          function(e) {
            for (var t = 1; t < arguments.length; t++) {
              var r = arguments[t];
              for (var n in r)
                Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
            }
            return e;
          },
        T = function(e, t) {
          if ('function' != typeof t && null !== t)
            throw new TypeError(
              'Super expression must either be null or a function, not ' +
                typeof t
            );
          (e.prototype = Object.create(t && t.prototype, {
            constructor: {
              value: e,
              enumerable: !1,
              writable: !0,
              configurable: !0
            }
          })),
            t &&
              (Object.setPrototypeOf
                ? Object.setPrototypeOf(e, t)
                : (e.__proto__ = t));
        },
        C = function(e, t) {
          if (!e)
            throw new ReferenceError(
              "this hasn't been initialised - super() hasn't been called"
            );
          return !t || ('object' != typeof t && 'function' != typeof t) ? e : t;
        },
        j = function(e) {
          if (Array.isArray(e)) {
            for (var t = 0, r = Array(e.length); t < e.length; t++) r[t] = e[t];
            return r;
          }
          return Array.from(e);
        },
        N = c().bool,
        M = c().number,
        E = c().string,
        A = c().func,
        I = c().object,
        D = c().oneOf,
        R = c().shape,
        L = c().any,
        S = c().oneOfType,
        U = D(['best fit', 'lookup']),
        Z = D(['narrow', 'short', 'long']),
        G = D(['numeric', '2-digit']),
        H = A.isRequired,
        W = {
          locale: E,
          timeZone: E,
          formats: I,
          messages: I,
          textComponent: L,
          defaultLocale: E,
          defaultFormats: I,
          onError: A
        },
        q = {
          formatDate: H,
          formatTime: H,
          formatRelative: H,
          formatNumber: H,
          formatPlural: H,
          formatMessage: H,
          formatHTMLMessage: H
        },
        V = R(P({}, W, q, { formatters: I, now: H })),
        z =
          (E.isRequired,
          S([E, I]),
          {
            localeMatcher: U,
            formatMatcher: D(['basic', 'best fit']),
            timeZone: E,
            hour12: N,
            weekday: Z,
            era: Z,
            year: G,
            month: D(['numeric', '2-digit', 'narrow', 'short', 'long']),
            day: G,
            hour: G,
            minute: G,
            second: G,
            timeZoneName: D(['short', 'long'])
          }),
        B = {
          localeMatcher: U,
          style: D(['decimal', 'currency', 'percent']),
          currency: E,
          currencyDisplay: D(['symbol', 'code', 'name']),
          useGrouping: N,
          minimumIntegerDigits: M,
          minimumFractionDigits: M,
          maximumFractionDigits: M,
          minimumSignificantDigits: M,
          maximumSignificantDigits: M
        },
        $ = {
          style: D(['best fit', 'numeric']),
          units: D([
            'second',
            'minute',
            'hour',
            'day',
            'month',
            'year',
            'second-short',
            'minute-short',
            'hour-short',
            'day-short',
            'month-short',
            'year-short'
          ])
        },
        J = { style: D(['cardinal', 'ordinal']) },
        K = Object.keys(W),
        Q = {
          '&': '&amp;',
          '>': '&gt;',
          '<': '&lt;',
          '"': '&quot;',
          "'": '&#x27;'
        },
        X = /[&><"']/g;
      function Y(e) {
        return ('' + e).replace(X, function(e) {
          return Q[e];
        });
      }
      function ee(e, t) {
        var r =
          arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
        return t.reduce(function(t, n) {
          return (
            e.hasOwnProperty(n)
              ? (t[n] = e[n])
              : r.hasOwnProperty(n) && (t[n] = r[n]),
            t
          );
        }, {});
      }
      function te() {
        var e =
            arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {},
          t = e.intl;
        v()(
          t,
          '[React Intl] Could not find required `intl` object. <IntlProvider> needs to exist in the component ancestry.'
        );
      }
      function re(e, t) {
        if (e === t) return !0;
        if (
          'object' !== (void 0 === e ? 'undefined' : F(e)) ||
          null === e ||
          'object' !== (void 0 === t ? 'undefined' : F(t)) ||
          null === t
        )
          return !1;
        var r = Object.keys(e),
          n = Object.keys(t);
        if (r.length !== n.length) return !1;
        for (
          var o = Object.prototype.hasOwnProperty.bind(t), a = 0;
          a < r.length;
          a++
        )
          if (!o(r[a]) || e[r[a]] !== t[r[a]]) return !1;
        return !0;
      }
      function ne(e, t, r) {
        var n = e.props,
          o = e.state,
          a = e.context,
          i = void 0 === a ? {} : a,
          s =
            arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {},
          l = i.intl,
          u = void 0 === l ? {} : l,
          c = s.intl,
          f = void 0 === c ? {} : c;
        return !re(t, n) || !re(r, o) || !(f === u || re(ee(f, K), ee(u, K)));
      }
      function oe(e, t) {
        return '[React Intl] ' + e + (t ? '\n' + t : '');
      }
      function ae(e) {}
      function ie(e) {
        return e.displayName || e.name || 'Component';
      }
      function se(e) {
        var t =
            arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {},
          r = t.intlPropName,
          n = void 0 === r ? 'intl' : r,
          o = t.withRef,
          a = void 0 !== o && o,
          i = (function(t) {
            function r(e, t) {
              x(this, r);
              var n = C(
                this,
                (r.__proto__ || Object.getPrototypeOf(r)).call(this, e, t)
              );
              return te(t), n;
            }
            return (
              T(r, t),
              k(r, [
                {
                  key: 'getWrappedInstance',
                  value: function() {
                    return (
                      v()(
                        a,
                        '[React Intl] To access the wrapped instance, the `{withRef: true}` option must be set when calling: `injectIntl()`'
                      ),
                      this._wrappedInstance
                    );
                  }
                },
                {
                  key: 'render',
                  value: function() {
                    var t = this;
                    return p().createElement(
                      e,
                      P({}, this.props, O({}, n, this.context.intl), {
                        ref: a
                          ? function(e) {
                              return (t._wrappedInstance = e);
                            }
                          : null
                      })
                    );
                  }
                }
              ]),
              r
            );
          })(f.Component);
        return (
          (i.displayName = 'InjectIntl(' + ie(e) + ')'),
          (i.contextTypes = { intl: V }),
          (i.WrappedComponent = e),
          m()(i, e)
        );
      }
      function le(e) {
        return e;
      }
      function ue(e) {
        return i().prototype._resolveLocale(e);
      }
      function ce(e) {
        return i().prototype._findPluralRuleFunction(e);
      }
      var fe = function e(t) {
          var r =
            arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
          x(this, e);
          var n = 'ordinal' === r.style,
            o = ce(ue(t));
          this.format = function(e) {
            return o(e, n);
          };
        },
        pe = Object.keys(z),
        he = Object.keys(B),
        me = Object.keys($),
        de = Object.keys(J),
        ve = { second: 60, minute: 60, hour: 24, day: 30, month: 12 };
      function ye(e) {
        var t = l().thresholds;
        (t.second = e.second),
          (t.minute = e.minute),
          (t.hour = e.hour),
          (t.day = e.day),
          (t.month = e.month),
          (t['second-short'] = e['second-short']),
          (t['minute-short'] = e['minute-short']),
          (t['hour-short'] = e['hour-short']),
          (t['day-short'] = e['day-short']),
          (t['month-short'] = e['month-short']);
      }
      function ge(e, t, r, n) {
        var o = e && e[t] && e[t][r];
        if (o) return o;
        n(oe('No ' + t + ' format named: ' + r));
      }
      function _e(e, t) {
        var r =
            arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {},
          n =
            arguments.length > 3 && void 0 !== arguments[3] ? arguments[3] : {},
          o = e.locale,
          a = e.formats,
          i = e.messages,
          s = e.defaultLocale,
          l = e.defaultFormats,
          u = r.id,
          c = r.defaultMessage;
        v()(u, '[React Intl] An `id` must be provided to format a message.');
        var f = i && i[u],
          p = Object.keys(n).length > 0;
        if (!p) return f || c || u;
        var h = void 0,
          m = e.onError || ae;
        if (f)
          try {
            var d = t.getMessageFormat(f, o, a);
            h = d.format(n);
          } catch (e) {
            m(
              oe(
                'Error formatting message: "' +
                  u +
                  '" for locale: "' +
                  o +
                  '"' +
                  (c ? ', using default message as fallback.' : ''),
                e
              )
            );
          }
        else
          (!c || (o && o.toLowerCase() !== s.toLowerCase())) &&
            m(
              oe(
                'Missing message: "' +
                  u +
                  '" for locale: "' +
                  o +
                  '"' +
                  (c ? ', using default message as fallback.' : '')
              )
            );
        if (!h && c)
          try {
            var y = t.getMessageFormat(c, s, l);
            h = y.format(n);
          } catch (e) {
            m(oe('Error formatting the default message for: "' + u + '"', e));
          }
        return (
          h ||
            m(
              oe(
                'Cannot format message: "' +
                  u +
                  '", using message ' +
                  (f || c ? 'source' : 'id') +
                  ' as fallback.'
              )
            ),
          h || f || c || u
        );
      }
      var we = Object.freeze({
          formatDate: function(e, t, r) {
            var n =
                arguments.length > 3 && void 0 !== arguments[3]
                  ? arguments[3]
                  : {},
              o = e.locale,
              a = e.formats,
              i = e.timeZone,
              s = n.format,
              l = e.onError || ae,
              u = new Date(r),
              c = P({}, i && { timeZone: i }, s && ge(a, 'date', s, l)),
              f = ee(n, pe, c);
            try {
              return t.getDateTimeFormat(o, f).format(u);
            } catch (e) {
              l(oe('Error formatting date.', e));
            }
            return String(u);
          },
          formatTime: function(e, t, r) {
            var n =
                arguments.length > 3 && void 0 !== arguments[3]
                  ? arguments[3]
                  : {},
              o = e.locale,
              a = e.formats,
              i = e.timeZone,
              s = n.format,
              l = e.onError || ae,
              u = new Date(r),
              c = P({}, i && { timeZone: i }, s && ge(a, 'time', s, l)),
              f = ee(n, pe, c);
            f.hour ||
              f.minute ||
              f.second ||
              (f = P({}, f, { hour: 'numeric', minute: 'numeric' }));
            try {
              return t.getDateTimeFormat(o, f).format(u);
            } catch (e) {
              l(oe('Error formatting time.', e));
            }
            return String(u);
          },
          formatRelative: function(e, t, r) {
            var n =
                arguments.length > 3 && void 0 !== arguments[3]
                  ? arguments[3]
                  : {},
              o = e.locale,
              a = e.formats,
              i = n.format,
              s = e.onError || ae,
              u = new Date(r),
              c = new Date(n.now),
              f = i && ge(a, 'relative', i, s),
              p = ee(n, me, f),
              h = P({}, l().thresholds);
            ye(ve);
            try {
              return t
                .getRelativeFormat(o, p)
                .format(u, { now: isFinite(c) ? c : t.now() });
            } catch (e) {
              s(oe('Error formatting relative time.', e));
            } finally {
              ye(h);
            }
            return String(u);
          },
          formatNumber: function(e, t, r) {
            var n =
                arguments.length > 3 && void 0 !== arguments[3]
                  ? arguments[3]
                  : {},
              o = e.locale,
              a = e.formats,
              i = n.format,
              s = e.onError || ae,
              l = i && ge(a, 'number', i, s),
              u = ee(n, he, l);
            try {
              return t.getNumberFormat(o, u).format(r);
            } catch (e) {
              s(oe('Error formatting number.', e));
            }
            return String(r);
          },
          formatPlural: function(e, t, r) {
            var n =
                arguments.length > 3 && void 0 !== arguments[3]
                  ? arguments[3]
                  : {},
              o = e.locale,
              a = ee(n, de),
              i = e.onError || ae;
            try {
              return t.getPluralFormat(o, a).format(r);
            } catch (e) {
              i(oe('Error formatting plural.', e));
            }
            return 'other';
          },
          formatMessage: _e,
          formatHTMLMessage: function(e, t, r) {
            var n =
                arguments.length > 3 && void 0 !== arguments[3]
                  ? arguments[3]
                  : {},
              o = Object.keys(n).reduce(function(e, t) {
                var r = n[t];
                return (e[t] = 'string' == typeof r ? Y(r) : r), e;
              }, {});
            return _e(e, t, r, o);
          }
        }),
        be = Object.keys(W),
        Fe = Object.keys(q),
        xe = {
          formats: {},
          messages: {},
          timeZone: null,
          textComponent: 'span',
          defaultLocale: 'en',
          defaultFormats: {},
          onError: ae
        },
        ke = (function(e) {
          function t(e) {
            var r =
              arguments.length > 1 && void 0 !== arguments[1]
                ? arguments[1]
                : {};
            x(this, t);
            var n = C(
              this,
              (t.__proto__ || Object.getPrototypeOf(t)).call(this, e, r)
            );
            v()(
              'undefined' != typeof Intl,
              '[React Intl] The `Intl` APIs must be available in the runtime, and do not appear to be built-in. An `Intl` polyfill should be loaded.\nSee: http://formatjs.io/guides/runtime-environments/'
            );
            var o = r.intl,
              a = void 0;
            a = isFinite(e.initialNow)
              ? Number(e.initialNow)
              : o
              ? o.now()
              : Date.now();
            var s = o || {},
              u = s.formatters,
              c =
                void 0 === u
                  ? {
                      getDateTimeFormat: g(Intl.DateTimeFormat),
                      getNumberFormat: g(Intl.NumberFormat),
                      getMessageFormat: g(i()),
                      getRelativeFormat: g(l()),
                      getPluralFormat: g(fe)
                    }
                  : u;
            return (
              (n.state = P({}, c, {
                now: function() {
                  return n._didDisplay ? Date.now() : a;
                }
              })),
              n
            );
          }
          return (
            T(t, e),
            k(t, [
              {
                key: 'getConfig',
                value: function() {
                  var e = this.context.intl,
                    t = ee(this.props, be, e);
                  for (var r in xe) void 0 === t[r] && (t[r] = xe[r]);
                  if (
                    !(function(e) {
                      for (var t = (e || '').split('-'); t.length > 0; ) {
                        if (b(t.join('-'))) return !0;
                        t.pop();
                      }
                      return !1;
                    })(t.locale)
                  ) {
                    var n = t,
                      o = n.locale,
                      a = n.defaultLocale,
                      i = n.defaultFormats;
                    (0, n.onError)(
                      oe(
                        'Missing locale data for locale: "' +
                          o +
                          '". Using default locale: "' +
                          a +
                          '" as fallback.'
                      )
                    ),
                      (t = P({}, t, {
                        locale: a,
                        formats: i,
                        messages: xe.messages
                      }));
                  }
                  return t;
                }
              },
              {
                key: 'getBoundFormatFns',
                value: function(e, t) {
                  return Fe.reduce(function(r, n) {
                    return (r[n] = we[n].bind(null, e, t)), r;
                  }, {});
                }
              },
              {
                key: 'getChildContext',
                value: function() {
                  var e = this.getConfig(),
                    t = this.getBoundFormatFns(e, this.state),
                    r = this.state,
                    n = r.now,
                    o = (function(e, t) {
                      var r = {};
                      for (var n in e)
                        t.indexOf(n) >= 0 ||
                          (Object.prototype.hasOwnProperty.call(e, n) &&
                            (r[n] = e[n]));
                      return r;
                    })(r, ['now']);
                  return { intl: P({}, e, t, { formatters: o, now: n }) };
                }
              },
              {
                key: 'shouldComponentUpdate',
                value: function() {
                  for (
                    var e = arguments.length, t = Array(e), r = 0;
                    r < e;
                    r++
                  )
                    t[r] = arguments[r];
                  return ne.apply(void 0, [this].concat(t));
                }
              },
              {
                key: 'componentDidMount',
                value: function() {
                  this._didDisplay = !0;
                }
              },
              {
                key: 'render',
                value: function() {
                  return f.Children.only(this.props.children);
                }
              }
            ]),
            t
          );
        })(f.Component);
      (ke.displayName = 'IntlProvider'),
        (ke.contextTypes = { intl: V }),
        (ke.childContextTypes = { intl: V.isRequired });
      var Oe = (function(e) {
        function t(e, r) {
          x(this, t);
          var n = C(
            this,
            (t.__proto__ || Object.getPrototypeOf(t)).call(this, e, r)
          );
          return te(r), n;
        }
        return (
          T(t, e),
          k(t, [
            {
              key: 'shouldComponentUpdate',
              value: function() {
                for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
                  t[r] = arguments[r];
                return ne.apply(void 0, [this].concat(t));
              }
            },
            {
              key: 'render',
              value: function() {
                var e = this.context.intl,
                  t = e.formatDate,
                  r = e.textComponent,
                  n = this.props,
                  o = n.value,
                  a = n.children,
                  i = t(o, this.props);
                return 'function' == typeof a
                  ? a(i)
                  : p().createElement(r, null, i);
              }
            }
          ]),
          t
        );
      })(f.Component);
      (Oe.displayName = 'FormattedDate'), (Oe.contextTypes = { intl: V });
      var Pe = (function(e) {
        function t(e, r) {
          x(this, t);
          var n = C(
            this,
            (t.__proto__ || Object.getPrototypeOf(t)).call(this, e, r)
          );
          return te(r), n;
        }
        return (
          T(t, e),
          k(t, [
            {
              key: 'shouldComponentUpdate',
              value: function() {
                for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
                  t[r] = arguments[r];
                return ne.apply(void 0, [this].concat(t));
              }
            },
            {
              key: 'render',
              value: function() {
                var e = this.context.intl,
                  t = e.formatTime,
                  r = e.textComponent,
                  n = this.props,
                  o = n.value,
                  a = n.children,
                  i = t(o, this.props);
                return 'function' == typeof a
                  ? a(i)
                  : p().createElement(r, null, i);
              }
            }
          ]),
          t
        );
      })(f.Component);
      (Pe.displayName = 'FormattedTime'), (Pe.contextTypes = { intl: V });
      var Te = 36e5,
        Ce = 864e5,
        je = (function(e) {
          function t(e, r) {
            x(this, t);
            var n = C(
              this,
              (t.__proto__ || Object.getPrototypeOf(t)).call(this, e, r)
            );
            te(r);
            var o = isFinite(e.initialNow)
              ? Number(e.initialNow)
              : r.intl.now();
            return (n.state = { now: o }), n;
          }
          return (
            T(t, e),
            k(t, [
              {
                key: 'scheduleNextUpdate',
                value: function(e, t) {
                  var r = this;
                  clearTimeout(this._timer);
                  var n = e.value,
                    o = e.units,
                    a = e.updateInterval,
                    i = new Date(n).getTime();
                  if (a && isFinite(i)) {
                    var s = i - t.now,
                      l = (function(e) {
                        switch (e) {
                          case 'second':
                            return 1e3;
                          case 'minute':
                            return 6e4;
                          case 'hour':
                            return Te;
                          case 'day':
                            return Ce;
                          default:
                            return 2147483647;
                        }
                      })(
                        o ||
                          (function(e) {
                            var t = Math.abs(e);
                            return t < 6e4
                              ? 'second'
                              : t < Te
                              ? 'minute'
                              : t < Ce
                              ? 'hour'
                              : 'day';
                          })(s)
                      ),
                      u = Math.abs(s % l),
                      c = s < 0 ? Math.max(a, l - u) : Math.max(a, u);
                    this._timer = setTimeout(function() {
                      r.setState({ now: r.context.intl.now() });
                    }, c);
                  }
                }
              },
              {
                key: 'componentDidMount',
                value: function() {
                  this.scheduleNextUpdate(this.props, this.state);
                }
              },
              {
                key: 'componentWillReceiveProps',
                value: function(e) {
                  (function(e, t) {
                    if (e === t) return !0;
                    var r = new Date(e).getTime(),
                      n = new Date(t).getTime();
                    return isFinite(r) && isFinite(n) && r === n;
                  })(e.value, this.props.value) ||
                    this.setState({ now: this.context.intl.now() });
                }
              },
              {
                key: 'shouldComponentUpdate',
                value: function() {
                  for (
                    var e = arguments.length, t = Array(e), r = 0;
                    r < e;
                    r++
                  )
                    t[r] = arguments[r];
                  return ne.apply(void 0, [this].concat(t));
                }
              },
              {
                key: 'componentWillUpdate',
                value: function(e, t) {
                  this.scheduleNextUpdate(e, t);
                }
              },
              {
                key: 'componentWillUnmount',
                value: function() {
                  clearTimeout(this._timer);
                }
              },
              {
                key: 'render',
                value: function() {
                  var e = this.context.intl,
                    t = e.formatRelative,
                    r = e.textComponent,
                    n = this.props,
                    o = n.value,
                    a = n.children,
                    i = t(o, P({}, this.props, this.state));
                  return 'function' == typeof a
                    ? a(i)
                    : p().createElement(r, null, i);
                }
              }
            ]),
            t
          );
        })(f.Component);
      (je.displayName = 'FormattedRelative'),
        (je.contextTypes = { intl: V }),
        (je.defaultProps = { updateInterval: 1e4 });
      var Ne = (function(e) {
        function t(e, r) {
          x(this, t);
          var n = C(
            this,
            (t.__proto__ || Object.getPrototypeOf(t)).call(this, e, r)
          );
          return te(r), n;
        }
        return (
          T(t, e),
          k(t, [
            {
              key: 'shouldComponentUpdate',
              value: function() {
                for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
                  t[r] = arguments[r];
                return ne.apply(void 0, [this].concat(t));
              }
            },
            {
              key: 'render',
              value: function() {
                var e = this.context.intl,
                  t = e.formatNumber,
                  r = e.textComponent,
                  n = this.props,
                  o = n.value,
                  a = n.children,
                  i = t(o, this.props);
                return 'function' == typeof a
                  ? a(i)
                  : p().createElement(r, null, i);
              }
            }
          ]),
          t
        );
      })(f.Component);
      (Ne.displayName = 'FormattedNumber'), (Ne.contextTypes = { intl: V });
      var Me = (function(e) {
        function t(e, r) {
          x(this, t);
          var n = C(
            this,
            (t.__proto__ || Object.getPrototypeOf(t)).call(this, e, r)
          );
          return te(r), n;
        }
        return (
          T(t, e),
          k(t, [
            {
              key: 'shouldComponentUpdate',
              value: function() {
                for (var e = arguments.length, t = Array(e), r = 0; r < e; r++)
                  t[r] = arguments[r];
                return ne.apply(void 0, [this].concat(t));
              }
            },
            {
              key: 'render',
              value: function() {
                var e = this.context.intl,
                  t = e.formatPlural,
                  r = e.textComponent,
                  n = this.props,
                  o = n.value,
                  a = n.other,
                  i = n.children,
                  s = t(o, this.props),
                  l = this.props[s] || a;
                return 'function' == typeof i
                  ? i(l)
                  : p().createElement(r, null, l);
              }
            }
          ]),
          t
        );
      })(f.Component);
      (Me.displayName = 'FormattedPlural'),
        (Me.contextTypes = { intl: V }),
        (Me.defaultProps = { style: 'cardinal' });
      var Ee = function(e, t) {
          return _e({}, { getMessageFormat: g(i()) }, e, t);
        },
        Ae = (function(e) {
          function t(e, r) {
            x(this, t);
            var n = C(
              this,
              (t.__proto__ || Object.getPrototypeOf(t)).call(this, e, r)
            );
            return e.defaultMessage || te(r), n;
          }
          return (
            T(t, e),
            k(t, [
              {
                key: 'shouldComponentUpdate',
                value: function(e) {
                  var t = this.props.values,
                    r = e.values;
                  if (!re(r, t)) return !0;
                  for (
                    var n = P({}, e, { values: t }),
                      o = arguments.length,
                      a = Array(o > 1 ? o - 1 : 0),
                      i = 1;
                    i < o;
                    i++
                  )
                    a[i - 1] = arguments[i];
                  return ne.apply(void 0, [this, n].concat(a));
                }
              },
              {
                key: 'render',
                value: function() {
                  var e,
                    t = this.context.intl || {},
                    r = t.formatMessage,
                    n = void 0 === r ? Ee : r,
                    o = t.textComponent,
                    a = void 0 === o ? 'span' : o,
                    i = this.props,
                    s = i.id,
                    l = i.description,
                    u = i.defaultMessage,
                    c = i.values,
                    p = i.tagName,
                    h = void 0 === p ? a : p,
                    m = i.children,
                    d = void 0,
                    v = void 0,
                    y = void 0;
                  if (c && Object.keys(c).length > 0) {
                    var g = Math.floor(1099511627776 * Math.random()).toString(
                        16
                      ),
                      _ =
                        ((e = 0),
                        function() {
                          return 'ELEMENT-' + g + '-' + (e += 1);
                        });
                    (d = '@__' + g + '__@'),
                      (v = {}),
                      (y = {}),
                      Object.keys(c).forEach(function(e) {
                        var t = c[e];
                        if ((0, f.isValidElement)(t)) {
                          var r = _();
                          (v[e] = d + r + d), (y[r] = t);
                        } else v[e] = t;
                      });
                  }
                  var w,
                    b = n({ id: s, description: l, defaultMessage: u }, v || c);
                  return (
                    (w =
                      y && Object.keys(y).length > 0
                        ? b
                            .split(d)
                            .filter(function(e) {
                              return !!e;
                            })
                            .map(function(e) {
                              return y[e] || e;
                            })
                        : [b]),
                    'function' == typeof m
                      ? m.apply(void 0, j(w))
                      : f.createElement.apply(void 0, [h, null].concat(j(w)))
                  );
                }
              }
            ]),
            t
          );
        })(f.Component);
      (Ae.displayName = 'FormattedMessage'),
        (Ae.contextTypes = { intl: V }),
        (Ae.defaultProps = { values: {} });
      var Ie = (function(e) {
        function t(e, r) {
          x(this, t);
          var n = C(
            this,
            (t.__proto__ || Object.getPrototypeOf(t)).call(this, e, r)
          );
          return te(r), n;
        }
        return (
          T(t, e),
          k(t, [
            {
              key: 'shouldComponentUpdate',
              value: function(e) {
                var t = this.props.values,
                  r = e.values;
                if (!re(r, t)) return !0;
                for (
                  var n = P({}, e, { values: t }),
                    o = arguments.length,
                    a = Array(o > 1 ? o - 1 : 0),
                    i = 1;
                  i < o;
                  i++
                )
                  a[i - 1] = arguments[i];
                return ne.apply(void 0, [this, n].concat(a));
              }
            },
            {
              key: 'render',
              value: function() {
                var e = this.context.intl,
                  t = e.formatHTMLMessage,
                  r = e.textComponent,
                  n = this.props,
                  o = n.id,
                  a = n.description,
                  i = n.defaultMessage,
                  s = n.values,
                  l = n.tagName,
                  u = void 0 === l ? r : l,
                  c = n.children,
                  f = t({ id: o, description: a, defaultMessage: i }, s);
                if ('function' == typeof c) return c(f);
                var h = { __html: f };
                return p().createElement(u, { dangerouslySetInnerHTML: h });
              }
            }
          ]),
          t
        );
      })(f.Component);
      (Ie.displayName = 'FormattedHTMLMessage'),
        (Ie.contextTypes = { intl: V }),
        (Ie.defaultProps = { values: {} }),
        w(_),
        w(o());
    }
  }
]);
