/*! For license information please see 196.f100cfe28729dcd7db89.js.LICENSE.txt */
(self.webpackChunk_elyra_pipeline_editor_extension =
  self.webpackChunk_elyra_pipeline_editor_extension || []).push([
  [196],
  {
    7560: (e, t, r) => {
      'use strict';
      function n() {
        return (n =
          Object.assign ||
          function(e) {
            for (var t = 1; t < arguments.length; t++) {
              var r = arguments[t];
              for (var n in r)
                Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
            }
            return e;
          }).apply(this, arguments);
      }
      r.d(t, { Z: () => n });
    },
    8283: (e, t, r) => {
      'use strict';
      function n(e, t) {
        if (null == e) return {};
        var r,
          n,
          o = {},
          u = Object.keys(e);
        for (n = 0; n < u.length; n++)
          (r = u[n]), t.indexOf(r) >= 0 || (o[r] = e[r]);
        return o;
      }
      r.d(t, { Z: () => n });
    },
    3463: (e, t, r) => {
      'use strict';
      var n = r(8570),
        o = {
          childContextTypes: !0,
          contextType: !0,
          contextTypes: !0,
          defaultProps: !0,
          displayName: !0,
          getDefaultProps: !0,
          getDerivedStateFromError: !0,
          getDerivedStateFromProps: !0,
          mixins: !0,
          propTypes: !0,
          type: !0
        },
        u = {
          name: !0,
          length: !0,
          prototype: !0,
          caller: !0,
          callee: !0,
          arguments: !0,
          arity: !0
        },
        i = {
          $$typeof: !0,
          compare: !0,
          defaultProps: !0,
          displayName: !0,
          propTypes: !0,
          type: !0
        },
        a = {};
      function s(e) {
        return n.isMemo(e) ? i : a[e.$$typeof] || o;
      }
      (a[n.ForwardRef] = {
        $$typeof: !0,
        render: !0,
        defaultProps: !0,
        displayName: !0,
        propTypes: !0
      }),
        (a[n.Memo] = i);
      var c = Object.defineProperty,
        f = Object.getOwnPropertyNames,
        p = Object.getOwnPropertySymbols,
        l = Object.getOwnPropertyDescriptor,
        d = Object.getPrototypeOf,
        y = Object.prototype;
      e.exports = function e(t, r, n) {
        if ('string' != typeof r) {
          if (y) {
            var o = d(r);
            o && o !== y && e(t, o, n);
          }
          var i = f(r);
          p && (i = i.concat(p(r)));
          for (var a = s(t), v = s(r), m = 0; m < i.length; ++m) {
            var b = i[m];
            if (!(u[b] || (n && n[b]) || (v && v[b]) || (a && a[b]))) {
              var h = l(r, b);
              try {
                c(t, b, h);
              } catch (e) {}
            }
          }
        }
        return t;
      };
    },
    8262: (e, t, r) => {
      'use strict';
      var n = r(3586);
      function o() {}
      function u() {}
      (u.resetWarningCache = o),
        (e.exports = function() {
          function e(e, t, r, o, u, i) {
            if (i !== n) {
              var a = new Error(
                'Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types'
              );
              throw ((a.name = 'Invariant Violation'), a);
            }
          }
          function t() {
            return e;
          }
          e.isRequired = e;
          var r = {
            array: e,
            bool: e,
            func: e,
            number: e,
            object: e,
            string: e,
            symbol: e,
            any: e,
            arrayOf: t,
            element: e,
            elementType: e,
            instanceOf: t,
            node: e,
            objectOf: t,
            oneOf: t,
            oneOfType: t,
            shape: t,
            exact: t,
            checkPropTypes: u,
            resetWarningCache: o
          };
          return (r.PropTypes = r), r;
        });
    },
    3980: (e, t, r) => {
      e.exports = r(8262)();
    },
    3586: e => {
      'use strict';
      e.exports = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';
    },
    6866: (e, t) => {
      'use strict';
      var r = 'function' == typeof Symbol && Symbol.for,
        n = r ? Symbol.for('react.element') : 60103,
        o = r ? Symbol.for('react.portal') : 60106,
        u = r ? Symbol.for('react.fragment') : 60107,
        i = r ? Symbol.for('react.strict_mode') : 60108,
        a = r ? Symbol.for('react.profiler') : 60114,
        s = r ? Symbol.for('react.provider') : 60109,
        c = r ? Symbol.for('react.context') : 60110,
        f = r ? Symbol.for('react.async_mode') : 60111,
        p = r ? Symbol.for('react.concurrent_mode') : 60111,
        l = r ? Symbol.for('react.forward_ref') : 60112,
        d = r ? Symbol.for('react.suspense') : 60113,
        y = r ? Symbol.for('react.suspense_list') : 60120,
        v = r ? Symbol.for('react.memo') : 60115,
        m = r ? Symbol.for('react.lazy') : 60116,
        b = r ? Symbol.for('react.block') : 60121,
        h = r ? Symbol.for('react.fundamental') : 60117,
        S = r ? Symbol.for('react.responder') : 60118,
        P = r ? Symbol.for('react.scope') : 60119;
      function g(e) {
        if ('object' == typeof e && null !== e) {
          var t = e.$$typeof;
          switch (t) {
            case n:
              switch ((e = e.type)) {
                case f:
                case p:
                case u:
                case a:
                case i:
                case d:
                  return e;
                default:
                  switch ((e = e && e.$$typeof)) {
                    case c:
                    case l:
                    case m:
                    case v:
                    case s:
                      return e;
                    default:
                      return t;
                  }
              }
            case o:
              return t;
          }
        }
      }
      function w(e) {
        return g(e) === p;
      }
      (t.AsyncMode = f),
        (t.ConcurrentMode = p),
        (t.ContextConsumer = c),
        (t.ContextProvider = s),
        (t.Element = n),
        (t.ForwardRef = l),
        (t.Fragment = u),
        (t.Lazy = m),
        (t.Memo = v),
        (t.Portal = o),
        (t.Profiler = a),
        (t.StrictMode = i),
        (t.Suspense = d),
        (t.isAsyncMode = function(e) {
          return w(e) || g(e) === f;
        }),
        (t.isConcurrentMode = w),
        (t.isContextConsumer = function(e) {
          return g(e) === c;
        }),
        (t.isContextProvider = function(e) {
          return g(e) === s;
        }),
        (t.isElement = function(e) {
          return 'object' == typeof e && null !== e && e.$$typeof === n;
        }),
        (t.isForwardRef = function(e) {
          return g(e) === l;
        }),
        (t.isFragment = function(e) {
          return g(e) === u;
        }),
        (t.isLazy = function(e) {
          return g(e) === m;
        }),
        (t.isMemo = function(e) {
          return g(e) === v;
        }),
        (t.isPortal = function(e) {
          return g(e) === o;
        }),
        (t.isProfiler = function(e) {
          return g(e) === a;
        }),
        (t.isStrictMode = function(e) {
          return g(e) === i;
        }),
        (t.isSuspense = function(e) {
          return g(e) === d;
        }),
        (t.isValidElementType = function(e) {
          return (
            'string' == typeof e ||
            'function' == typeof e ||
            e === u ||
            e === p ||
            e === a ||
            e === i ||
            e === d ||
            e === y ||
            ('object' == typeof e &&
              null !== e &&
              (e.$$typeof === m ||
                e.$$typeof === v ||
                e.$$typeof === s ||
                e.$$typeof === c ||
                e.$$typeof === l ||
                e.$$typeof === h ||
                e.$$typeof === S ||
                e.$$typeof === P ||
                e.$$typeof === b))
          );
        }),
        (t.typeOf = g);
    },
    8570: (e, t, r) => {
      'use strict';
      e.exports = r(6866);
    },
    7846: (e, t, r) => {
      'use strict';
      r.r(t),
        r.d(t, {
          Provider: () => f,
          ReactReduxContext: () => u,
          batch: () => Q.unstable_batchedUpdates,
          connect: () => H,
          connectAdvanced: () => C,
          createDispatchHook: () => z,
          createSelectorHook: () => Y,
          createStoreHook: () => I,
          shallowEqual: () => E,
          useDispatch: () => K,
          useSelector: () => J,
          useStore: () => L
        });
      var n = r(2959),
        o = r.n(n),
        u = (r(3980), o().createContext(null)),
        i = function(e) {
          e();
        },
        a = function() {
          return i;
        },
        s = { notify: function() {} },
        c = (function() {
          function e(e, t) {
            (this.store = e),
              (this.parentSub = t),
              (this.unsubscribe = null),
              (this.listeners = s),
              (this.handleChangeWrapper = this.handleChangeWrapper.bind(this));
          }
          var t = e.prototype;
          return (
            (t.addNestedSub = function(e) {
              return this.trySubscribe(), this.listeners.subscribe(e);
            }),
            (t.notifyNestedSubs = function() {
              this.listeners.notify();
            }),
            (t.handleChangeWrapper = function() {
              this.onStateChange && this.onStateChange();
            }),
            (t.isSubscribed = function() {
              return Boolean(this.unsubscribe);
            }),
            (t.trySubscribe = function() {
              this.unsubscribe ||
                ((this.unsubscribe = this.parentSub
                  ? this.parentSub.addNestedSub(this.handleChangeWrapper)
                  : this.store.subscribe(this.handleChangeWrapper)),
                (this.listeners = (function() {
                  var e = a(),
                    t = null,
                    r = null;
                  return {
                    clear: function() {
                      (t = null), (r = null);
                    },
                    notify: function() {
                      e(function() {
                        for (var e = t; e; ) e.callback(), (e = e.next);
                      });
                    },
                    get: function() {
                      for (var e = [], r = t; r; ) e.push(r), (r = r.next);
                      return e;
                    },
                    subscribe: function(e) {
                      var n = !0,
                        o = (r = { callback: e, next: null, prev: r });
                      return (
                        o.prev ? (o.prev.next = o) : (t = o),
                        function() {
                          n &&
                            null !== t &&
                            ((n = !1),
                            o.next ? (o.next.prev = o.prev) : (r = o.prev),
                            o.prev ? (o.prev.next = o.next) : (t = o.next));
                        }
                      );
                    }
                  };
                })()));
            }),
            (t.tryUnsubscribe = function() {
              this.unsubscribe &&
                (this.unsubscribe(),
                (this.unsubscribe = null),
                this.listeners.clear(),
                (this.listeners = s));
            }),
            e
          );
        })();
      const f = function(e) {
        var t = e.store,
          r = e.context,
          i = e.children,
          a = (0, n.useMemo)(
            function() {
              var e = new c(t);
              return (
                (e.onStateChange = e.notifyNestedSubs),
                { store: t, subscription: e }
              );
            },
            [t]
          ),
          s = (0, n.useMemo)(
            function() {
              return t.getState();
            },
            [t]
          );
        (0, n.useEffect)(
          function() {
            var e = a.subscription;
            return (
              e.trySubscribe(),
              s !== t.getState() && e.notifyNestedSubs(),
              function() {
                e.tryUnsubscribe(), (e.onStateChange = null);
              }
            );
          },
          [a, s]
        );
        var f = r || u;
        return o().createElement(f.Provider, { value: a }, i);
      };
      var p = r(7560),
        l = r(8283),
        d = r(3463),
        y = r.n(d),
        v = r(8570),
        m =
          'undefined' != typeof window &&
          void 0 !== window.document &&
          void 0 !== window.document.createElement
            ? n.useLayoutEffect
            : n.useEffect,
        b = [],
        h = [null, null];
      function S(e, t) {
        var r = e[1];
        return [t.payload, r + 1];
      }
      function P(e, t, r) {
        m(function() {
          return e.apply(void 0, t);
        }, r);
      }
      function g(e, t, r, n, o, u, i) {
        (e.current = n),
          (t.current = o),
          (r.current = !1),
          u.current && ((u.current = null), i());
      }
      function w(e, t, r, n, o, u, i, a, s, c) {
        if (e) {
          var f = !1,
            p = null,
            l = function() {
              if (!f) {
                var e,
                  r,
                  l = t.getState();
                try {
                  e = n(l, o.current);
                } catch (e) {
                  (r = e), (p = e);
                }
                r || (p = null),
                  e === u.current
                    ? i.current || s()
                    : ((u.current = e),
                      (a.current = e),
                      (i.current = !0),
                      c({ type: 'STORE_UPDATED', payload: { error: r } }));
              }
            };
          return (
            (r.onStateChange = l),
            r.trySubscribe(),
            l(),
            function() {
              if (((f = !0), r.tryUnsubscribe(), (r.onStateChange = null), p))
                throw p;
            }
          );
        }
      }
      var O = function() {
        return [null, 0];
      };
      function C(e, t) {
        void 0 === t && (t = {});
        var r = t,
          i = r.getDisplayName,
          a =
            void 0 === i
              ? function(e) {
                  return 'ConnectAdvanced(' + e + ')';
                }
              : i,
          s = r.methodName,
          f = void 0 === s ? 'connectAdvanced' : s,
          d = r.renderCountProp,
          m = void 0 === d ? void 0 : d,
          C = r.shouldHandleStateChanges,
          x = void 0 === C || C,
          E = r.storeKey,
          M = void 0 === E ? 'store' : E,
          T = (r.withRef, r.forwardRef),
          R = void 0 !== T && T,
          $ = r.context,
          N = void 0 === $ ? u : $,
          _ = (0, l.Z)(r, [
            'getDisplayName',
            'methodName',
            'renderCountProp',
            'shouldHandleStateChanges',
            'storeKey',
            'withRef',
            'forwardRef',
            'context'
          ]),
          j = N;
        return function(t) {
          var r = t.displayName || t.name || 'Component',
            u = a(r),
            i = (0, p.Z)({}, _, {
              getDisplayName: a,
              methodName: f,
              renderCountProp: m,
              shouldHandleStateChanges: x,
              storeKey: M,
              displayName: u,
              wrappedComponentName: r,
              WrappedComponent: t
            }),
            s = _.pure,
            d = s
              ? n.useMemo
              : function(e) {
                  return e();
                };
          function C(r) {
            var u = (0, n.useMemo)(
                function() {
                  var e = r.reactReduxForwardedRef,
                    t = (0, l.Z)(r, ['reactReduxForwardedRef']);
                  return [r.context, e, t];
                },
                [r]
              ),
              a = u[0],
              s = u[1],
              f = u[2],
              y = (0, n.useMemo)(
                function() {
                  return a &&
                    a.Consumer &&
                    (0, v.isContextConsumer)(
                      o().createElement(a.Consumer, null)
                    )
                    ? a
                    : j;
                },
                [a, j]
              ),
              m = (0, n.useContext)(y),
              C =
                Boolean(r.store) &&
                Boolean(r.store.getState) &&
                Boolean(r.store.dispatch);
            Boolean(m) && Boolean(m.store);
            var E = C ? r.store : m.store,
              M = (0, n.useMemo)(
                function() {
                  return (function(t) {
                    return e(t.dispatch, i);
                  })(E);
                },
                [E]
              ),
              T = (0, n.useMemo)(
                function() {
                  if (!x) return h;
                  var e = new c(E, C ? null : m.subscription),
                    t = e.notifyNestedSubs.bind(e);
                  return [e, t];
                },
                [E, C, m]
              ),
              R = T[0],
              $ = T[1],
              N = (0, n.useMemo)(
                function() {
                  return C ? m : (0, p.Z)({}, m, { subscription: R });
                },
                [C, m, R]
              ),
              _ = (0, n.useReducer)(S, b, O),
              D = _[0][0],
              k = _[1];
            if (D && D.error) throw D.error;
            var q = (0, n.useRef)(),
              F = (0, n.useRef)(f),
              Z = (0, n.useRef)(),
              W = (0, n.useRef)(!1),
              A = d(
                function() {
                  return Z.current && f === F.current
                    ? Z.current
                    : M(E.getState(), f);
                },
                [E, D, f]
              );
            P(g, [F, q, W, f, A, Z, $]),
              P(w, [x, E, R, M, F, q, W, Z, $, k], [E, R, M]);
            var B = (0, n.useMemo)(
              function() {
                return o().createElement(t, (0, p.Z)({}, A, { ref: s }));
              },
              [s, t, A]
            );
            return (0, n.useMemo)(
              function() {
                return x ? o().createElement(y.Provider, { value: N }, B) : B;
              },
              [y, B, N]
            );
          }
          var E = s ? o().memo(C) : C;
          if (((E.WrappedComponent = t), (E.displayName = u), R)) {
            var T = o().forwardRef(function(e, t) {
              return o().createElement(
                E,
                (0, p.Z)({}, e, { reactReduxForwardedRef: t })
              );
            });
            return (T.displayName = u), (T.WrappedComponent = t), y()(T, t);
          }
          return y()(E, t);
        };
      }
      function x(e, t) {
        return e === t
          ? 0 !== e || 0 !== t || 1 / e == 1 / t
          : e != e && t != t;
      }
      function E(e, t) {
        if (x(e, t)) return !0;
        if (
          'object' != typeof e ||
          null === e ||
          'object' != typeof t ||
          null === t
        )
          return !1;
        var r = Object.keys(e),
          n = Object.keys(t);
        if (r.length !== n.length) return !1;
        for (var o = 0; o < r.length; o++)
          if (
            !Object.prototype.hasOwnProperty.call(t, r[o]) ||
            !x(e[r[o]], t[r[o]])
          )
            return !1;
        return !0;
      }
      r(7288);
      var M = function() {
        return Math.random()
          .toString(36)
          .substring(7)
          .split('')
          .join('.');
      };
      function T(e, t) {
        return function() {
          return t(e.apply(this, arguments));
        };
      }
      function R(e) {
        return function(t, r) {
          var n = e(t, r);
          function o() {
            return n;
          }
          return (o.dependsOnOwnProps = !1), o;
        };
      }
      function $(e) {
        return null !== e.dependsOnOwnProps && void 0 !== e.dependsOnOwnProps
          ? Boolean(e.dependsOnOwnProps)
          : 1 !== e.length;
      }
      function N(e, t) {
        return function(t, r) {
          r.displayName;
          var n = function(e, t) {
            return n.dependsOnOwnProps ? n.mapToProps(e, t) : n.mapToProps(e);
          };
          return (
            (n.dependsOnOwnProps = !0),
            (n.mapToProps = function(t, r) {
              (n.mapToProps = e), (n.dependsOnOwnProps = $(e));
              var o = n(t, r);
              return (
                'function' == typeof o &&
                  ((n.mapToProps = o),
                  (n.dependsOnOwnProps = $(o)),
                  (o = n(t, r))),
                o
              );
            }),
            n
          );
        };
      }
      M(), M();
      const _ = [
          function(e) {
            return 'function' == typeof e ? N(e) : void 0;
          },
          function(e) {
            return e
              ? void 0
              : R(function(e) {
                  return { dispatch: e };
                });
          },
          function(e) {
            return e && 'object' == typeof e
              ? R(function(t) {
                  return (function(e, t) {
                    if ('function' == typeof e) return T(e, t);
                    if ('object' != typeof e || null === e)
                      throw new Error(
                        'bindActionCreators expected an object or a function, instead received ' +
                          (null === e ? 'null' : typeof e) +
                          '. Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?'
                      );
                    var r = {};
                    for (var n in e) {
                      var o = e[n];
                      'function' == typeof o && (r[n] = T(o, t));
                    }
                    return r;
                  })(e, t);
                })
              : void 0;
          }
        ],
        j = [
          function(e) {
            return 'function' == typeof e ? N(e) : void 0;
          },
          function(e) {
            return e
              ? void 0
              : R(function() {
                  return {};
                });
          }
        ];
      function D(e, t, r) {
        return (0, p.Z)({}, r, {}, e, {}, t);
      }
      const k = [
        function(e) {
          return 'function' == typeof e
            ? (function(e) {
                return function(t, r) {
                  r.displayName;
                  var n,
                    o = r.pure,
                    u = r.areMergedPropsEqual,
                    i = !1;
                  return function(t, r, a) {
                    var s = e(t, r, a);
                    return (
                      i ? (o && u(s, n)) || (n = s) : ((i = !0), (n = s)), n
                    );
                  };
                };
              })(e)
            : void 0;
        },
        function(e) {
          return e
            ? void 0
            : function() {
                return D;
              };
        }
      ];
      function q(e, t, r, n) {
        return function(o, u) {
          return r(e(o, u), t(n, u), u);
        };
      }
      function F(e, t, r, n, o) {
        var u,
          i,
          a,
          s,
          c,
          f = o.areStatesEqual,
          p = o.areOwnPropsEqual,
          l = o.areStatePropsEqual,
          d = !1;
        return function(o, y) {
          return d
            ? (function(o, d) {
                var y,
                  v,
                  m = !p(d, i),
                  b = !f(o, u);
                return (
                  (u = o),
                  (i = d),
                  m && b
                    ? ((a = e(u, i)),
                      t.dependsOnOwnProps && (s = t(n, i)),
                      (c = r(a, s, i)))
                    : m
                    ? (e.dependsOnOwnProps && (a = e(u, i)),
                      t.dependsOnOwnProps && (s = t(n, i)),
                      (c = r(a, s, i)))
                    : b
                    ? ((y = e(u, i)),
                      (v = !l(y, a)),
                      (a = y),
                      v && (c = r(a, s, i)),
                      c)
                    : c
                );
              })(o, y)
            : ((a = e((u = o), (i = y))),
              (s = t(n, i)),
              (c = r(a, s, i)),
              (d = !0),
              c);
        };
      }
      function Z(e, t) {
        var r = t.initMapStateToProps,
          n = t.initMapDispatchToProps,
          o = t.initMergeProps,
          u = (0, l.Z)(t, [
            'initMapStateToProps',
            'initMapDispatchToProps',
            'initMergeProps'
          ]),
          i = r(e, u),
          a = n(e, u),
          s = o(e, u);
        return (u.pure ? F : q)(i, a, s, e, u);
      }
      function W(e, t, r) {
        for (var n = t.length - 1; n >= 0; n--) {
          var o = t[n](e);
          if (o) return o;
        }
        return function(t, n) {
          throw new Error(
            'Invalid value of type ' +
              typeof e +
              ' for ' +
              r +
              ' argument when connecting component ' +
              n.wrappedComponentName +
              '.'
          );
        };
      }
      function A(e, t) {
        return e === t;
      }
      function B(e) {
        var t = void 0 === e ? {} : e,
          r = t.connectHOC,
          n = void 0 === r ? C : r,
          o = t.mapStateToPropsFactories,
          u = void 0 === o ? j : o,
          i = t.mapDispatchToPropsFactories,
          a = void 0 === i ? _ : i,
          s = t.mergePropsFactories,
          c = void 0 === s ? k : s,
          f = t.selectorFactory,
          d = void 0 === f ? Z : f;
        return function(e, t, r, o) {
          void 0 === o && (o = {});
          var i = o,
            s = i.pure,
            f = void 0 === s || s,
            y = i.areStatesEqual,
            v = void 0 === y ? A : y,
            m = i.areOwnPropsEqual,
            b = void 0 === m ? E : m,
            h = i.areStatePropsEqual,
            S = void 0 === h ? E : h,
            P = i.areMergedPropsEqual,
            g = void 0 === P ? E : P,
            w = (0, l.Z)(i, [
              'pure',
              'areStatesEqual',
              'areOwnPropsEqual',
              'areStatePropsEqual',
              'areMergedPropsEqual'
            ]),
            O = W(e, u, 'mapStateToProps'),
            C = W(t, a, 'mapDispatchToProps'),
            x = W(r, c, 'mergeProps');
          return n(
            d,
            (0, p.Z)(
              {
                methodName: 'connect',
                getDisplayName: function(e) {
                  return 'Connect(' + e + ')';
                },
                shouldHandleStateChanges: Boolean(e),
                initMapStateToProps: O,
                initMapDispatchToProps: C,
                initMergeProps: x,
                pure: f,
                areStatesEqual: v,
                areOwnPropsEqual: b,
                areStatePropsEqual: S,
                areMergedPropsEqual: g
              },
              w
            )
          );
        };
      }
      const H = B();
      function U() {
        return (0, n.useContext)(u);
      }
      function I(e) {
        void 0 === e && (e = u);
        var t =
          e === u
            ? U
            : function() {
                return (0, n.useContext)(e);
              };
        return function() {
          return t().store;
        };
      }
      var L = I();
      function z(e) {
        void 0 === e && (e = u);
        var t = e === u ? L : I(e);
        return function() {
          return t().dispatch;
        };
      }
      var K = z(),
        V = function(e, t) {
          return e === t;
        };
      function Y(e) {
        void 0 === e && (e = u);
        var t =
          e === u
            ? U
            : function() {
                return (0, n.useContext)(e);
              };
        return function(e, r) {
          void 0 === r && (r = V);
          var o = t(),
            u = (function(e, t, r, o) {
              var u,
                i = (0, n.useReducer)(function(e) {
                  return e + 1;
                }, 0)[1],
                a = (0, n.useMemo)(
                  function() {
                    return new c(r, o);
                  },
                  [r, o]
                ),
                s = (0, n.useRef)(),
                f = (0, n.useRef)(),
                p = (0, n.useRef)(),
                l = (0, n.useRef)(),
                d = r.getState();
              try {
                u =
                  e !== f.current || d !== p.current || s.current
                    ? e(d)
                    : l.current;
              } catch (e) {
                throw (s.current &&
                  (e.message +=
                    '\nThe error may be correlated with this previous error:\n' +
                    s.current.stack +
                    '\n\n'),
                e);
              }
              return (
                m(function() {
                  (f.current = e),
                    (p.current = d),
                    (l.current = u),
                    (s.current = void 0);
                }),
                m(
                  function() {
                    function e() {
                      try {
                        var e = f.current(r.getState());
                        if (t(e, l.current)) return;
                        l.current = e;
                      } catch (e) {
                        s.current = e;
                      }
                      i();
                    }
                    return (
                      (a.onStateChange = e),
                      a.trySubscribe(),
                      e(),
                      function() {
                        return a.tryUnsubscribe();
                      }
                    );
                  },
                  [r, a]
                ),
                u
              );
            })(e, r, o.store, o.subscription);
          return (0, n.useDebugValue)(u), u;
        };
      }
      var G,
        J = Y(),
        Q = r(8844);
      (G = Q.unstable_batchedUpdates), (i = G);
    },
    7288: (e, t, r) => {
      'use strict';
      (e = r.hmd(e)),
        (function(e) {
          var t,
            r = e.Symbol;
          'function' == typeof r
            ? r.observable
              ? (t = r.observable)
              : ((t = r('observable')), (r.observable = t))
            : (t = '@@observable');
        })(
          'undefined' != typeof self
            ? self
            : 'undefined' != typeof window
            ? window
            : void 0 !== r.g
            ? r.g
            : e
        );
    }
  }
]);
