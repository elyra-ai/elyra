(self.webpackChunk_elyra_metadata_extension =
  self.webpackChunk_elyra_metadata_extension || []).push([
  [568],
  {
    1568: (e, a, t) => {
      'use strict';
      t.r(a), t.d(a, { default: () => r });
      var n = t(9510),
        i = t(1708),
        s = t(4922),
        d = t(4268),
        l = t(9266),
        c = t(6455),
        o = t(9850);
      const m = 'elyra-metadata:open',
        r = {
          id: 'elyra-metadata',
          autoStart: !0,
          requires: [d.ICommandPalette, l.IEditorServices, s.ILabStatus],
          optional: [d.IThemeManager],
          activate: async (e, a, t, s, d) => {
            console.log('Elyra - metadata extension is activated!'),
              e.commands.addCommand('elyra-metadata-editor:open', {
                execute: a => {
                  (a => {
                    let n;
                    n = a.name ? a.name : 'New ' + a.schema;
                    const d = `elyra-metadata-editor:${a.namespace}:${
                      a.schema
                    }:${a.name ? a.name : 'new'}`;
                    if (
                      (0, o.find)(e.shell.widgets('main'), (e, a) => e.id == d)
                    )
                      return void e.shell.activateById(d);
                    const m = new i.MetadataEditor(
                      Object.assign(Object.assign({}, a), {
                        editorServices: t,
                        status: s
                      })
                    );
                    (m.title.label = n),
                      (m.id = d),
                      (m.title.closable = !0),
                      (m.title.icon = c.textEditorIcon),
                      m.addClass('elyra-metadata-editor'),
                      e.shell.add(m, 'main'),
                      l();
                  })(a);
                }
              });
            const l = () => {
              const e = d.theme && d.isLight(d.theme);
              document.querySelectorAll('.elyra-metadata-editor').forEach(a => {
                e
                  ? (a.className = a.className
                      .replace(new RegExp('bp3-dark', 'gi'), '')
                      .trim())
                  : (a.className += ' bp3-dark');
              });
            };
            d && d.themeChanged.connect(l);
            e.commands.addCommand('elyra-metadata:open', {
              label: e => e.label,
              execute: a => {
                (a => {
                  const t = c.LabIcon.resolve({ icon: a.icon }),
                    n = `elyra-metadata:${a.namespace}:${a.schema}`,
                    s = new i.MetadataWidget({
                      app: e,
                      display_name: a.display_name,
                      namespace: a.namespace,
                      schema: a.schema,
                      icon: t
                    });
                  (s.id = n),
                    (s.title.icon = t),
                    (s.title.caption = a.display_name),
                    null ==
                      (0, o.find)(e.shell.widgets('left'), e => e.id === n) &&
                      e.shell.add(s, 'left', { rank: 1e3 }),
                    e.shell.activateById(n);
                })(a);
              }
            });
            const r = 'elyra-metadata:close';
            e.commands.addCommand(r, {
              label: 'Close Tab',
              execute: a => {
                const t = e.contextMenuHitTest(e => !!e.dataset.id);
                if (t) {
                  const a = t.dataset.id,
                    n = (0, o.find)(
                      e.shell.widgets('left'),
                      (e, t) => e.id === a
                    );
                  n && n.dispose();
                }
              }
            }),
              e.contextMenu.addItem({
                selector:
                  '[data-id^="elyra-metadata:"]:not([data-id$="code-snippet"]):not([data-id$="runtimes:kfp"])',
                command: r
              });
            const h = await n.u9.getAllSchema();
            for (const e of h) {
              let t = 'ui-components:text-editor',
                n = e.title;
              e.uihints &&
                (e.uihints.icon && (t = e.uihints.icon),
                e.uihints.title && (n = e.uihints.title)),
                a.addItem({
                  command: m,
                  args: {
                    label: 'Manage ' + n,
                    display_name: e.title,
                    namespace: e.namespace,
                    schema: e.name,
                    icon: t
                  },
                  category: 'Elyra'
                });
            }
          }
        };
    }
  }
]);
