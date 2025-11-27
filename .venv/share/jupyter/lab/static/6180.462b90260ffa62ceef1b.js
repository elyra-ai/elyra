"use strict";
(self["webpackChunk_jupyterlab_application_top"] = self["webpackChunk_jupyterlab_application_top"] || []).push([[6180],{

/***/ 15136:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  main: () => (/* binding */ main)
});

// EXTERNAL MODULE: consume shared module (default) @jupyterlab/coreutils@~6.4.10 (singleton) (fallback: ./node_modules/@jupyterlab/coreutils/lib/index.js)
var index_js_ = __webpack_require__(10382);
// EXTERNAL MODULE: consume shared module (default) @lumino/coreutils@^2.0.0 (singleton) (fallback: ./node_modules/@lumino/coreutils/dist/index.js)
var dist_index_js_ = __webpack_require__(5592);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/application-extension/style/index.js + 1 modules
var style = __webpack_require__(20979);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/apputils-extension/style/index.js + 1 modules
var apputils_extension_style = __webpack_require__(25313);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/cell-toolbar-extension/style/index.js + 2 modules
var cell_toolbar_extension_style = __webpack_require__(56104);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/celltags-extension/style/index.js + 1 modules
var celltags_extension_style = __webpack_require__(11114);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/codemirror-extension/style/index.js
var codemirror_extension_style = __webpack_require__(72508);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/completer-extension/style/index.js
var completer_extension_style = __webpack_require__(2129);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/console-extension/style/index.js + 1 modules
var console_extension_style = __webpack_require__(99382);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/csvviewer-extension/style/index.js + 2 modules
var csvviewer_extension_style = __webpack_require__(36672);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/debugger-extension/style/index.js + 2 modules
var debugger_extension_style = __webpack_require__(1904);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/docmanager-extension/style/index.js
var docmanager_extension_style = __webpack_require__(87779);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/documentsearch-extension/style/index.js
var documentsearch_extension_style = __webpack_require__(13067);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/extensionmanager-extension/style/index.js + 2 modules
var extensionmanager_extension_style = __webpack_require__(67374);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/filebrowser-extension/style/index.js + 1 modules
var filebrowser_extension_style = __webpack_require__(20135);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/fileeditor-extension/style/index.js
var fileeditor_extension_style = __webpack_require__(61689);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/help-extension/style/index.js + 1 modules
var help_extension_style = __webpack_require__(34072);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/htmlviewer-extension/style/index.js + 2 modules
var htmlviewer_extension_style = __webpack_require__(54336);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/hub-extension/style/index.js
var hub_extension_style = __webpack_require__(19457);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/imageviewer-extension/style/index.js + 2 modules
var imageviewer_extension_style = __webpack_require__(43017);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/inspector-extension/style/index.js
var inspector_extension_style = __webpack_require__(45695);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/javascript-extension/style/index.js + 1 modules
var javascript_extension_style = __webpack_require__(53640);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/json-extension/style/index.js + 1 modules
var json_extension_style = __webpack_require__(367);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/launcher-extension/style/index.js + 1 modules
var launcher_extension_style = __webpack_require__(68149);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/logconsole-extension/style/index.js + 1 modules
var logconsole_extension_style = __webpack_require__(87456);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/lsp-extension/style/index.js + 1 modules
var lsp_extension_style = __webpack_require__(4380);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/mainmenu-extension/style/index.js
var mainmenu_extension_style = __webpack_require__(61132);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/markdownviewer-extension/style/index.js + 2 modules
var markdownviewer_extension_style = __webpack_require__(57996);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/markedparser-extension/style/index.js + 1 modules
var markedparser_extension_style = __webpack_require__(41884);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/mathjax-extension/style/index.js + 1 modules
var mathjax_extension_style = __webpack_require__(51874);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/mermaid-extension/style/index.js + 1 modules
var mermaid_extension_style = __webpack_require__(90288);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/metadataform-extension/style/index.js
var metadataform_extension_style = __webpack_require__(87145);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/notebook-extension/style/index.js
var notebook_extension_style = __webpack_require__(90167);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/pdf-extension/style/index.js + 1 modules
var pdf_extension_style = __webpack_require__(98547);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/pluginmanager-extension/style/index.js
var pluginmanager_extension_style = __webpack_require__(57292);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/rendermime-extension/style/index.js
var rendermime_extension_style = __webpack_require__(80046);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/running-extension/style/index.js
var running_extension_style = __webpack_require__(54289);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/settingeditor-extension/style/index.js + 2 modules
var settingeditor_extension_style = __webpack_require__(40779);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/shortcuts-extension/style/index.js + 1 modules
var shortcuts_extension_style = __webpack_require__(48552);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/statusbar-extension/style/index.js
var statusbar_extension_style = __webpack_require__(40005);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/terminal-extension/style/index.js + 2 modules
var terminal_extension_style = __webpack_require__(70558);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/toc-extension/style/index.js + 1 modules
var toc_extension_style = __webpack_require__(31747);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/tooltip-extension/style/index.js + 2 modules
var tooltip_extension_style = __webpack_require__(95527);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/translation-extension/style/index.js
var translation_extension_style = __webpack_require__(50277);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/ui-components-extension/style/index.js
var ui_components_extension_style = __webpack_require__(77767);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/vega5-extension/style/index.js + 1 modules
var vega5_extension_style = __webpack_require__(54549);
// EXTERNAL MODULE: ./node_modules/@jupyterlab/workspaces-extension/style/index.js + 1 modules
var workspaces_extension_style = __webpack_require__(75591);
;// CONCATENATED MODULE: ./build/style.js
/* This is a generated file of CSS imports */
/* It was generated by @jupyterlab/builder in Build.ensureAssets() */















































;// CONCATENATED MODULE: ./build/index.out.js
// This file is auto-generated from the corresponding file in /dev_mode
/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */






async function createModule(scope, module) {
  try {
    const factory = await window._JUPYTERLAB[scope].get(module);
    const instance = factory();
    instance.__scope__ = scope;
    return instance;
  } catch(e) {
    console.warn(`Failed to create module: package: ${scope}; module: ${module}`);
    throw e;
  }
}

/**
 * The main entry point for the application.
 */
async function main() {

   // Handle a browser test.
   // Set up error handling prior to loading extensions.
   var browserTest = index_js_.PageConfig.getOption('browserTest');
   if (browserTest.toLowerCase() === 'true') {
     var el = document.createElement('div');
     el.id = 'browserTest';
     document.body.appendChild(el);
     el.textContent = '[]';
     el.style.display = 'none';
     var errors = [];
     var reported = false;
     var timeout = 25000;

     var report = function() {
       if (reported) {
         return;
       }
       reported = true;
       el.className = 'completed';
     }

     window.onerror = function(msg, url, line, col, error) {
       errors.push(String(error));
       el.textContent = JSON.stringify(errors)
     };
     console.error = function(message) {
       errors.push(String(message));
       el.textContent = JSON.stringify(errors)
     };
  }

  var pluginRegistry = new dist_index_js_.PluginRegistry();
  var JupyterLab = (__webpack_require__(44036).JupyterLab);
  var disabled = [];
  var deferred = [];
  var ignorePlugins = [];
  var register = [];


  const federatedExtensionPromises = [];
  const federatedMimeExtensionPromises = [];
  const federatedStylePromises = [];

  // Start initializing the federated extensions
  const extensions = JSON.parse(
    index_js_.PageConfig.getOption('federated_extensions')
  );

  // Keep a mapping of renamed plugin ids to ensure user configs don't break.
  // The mapping is defined in the main index.js for JupyterLab, since it may not be relevant for
  // other lab-based applications (they may not use the same set of plugins).
  const renamedPluginIds = {
    '@jupyterlab/application:mimedocument': '@jupyterlab/application-extension:mimedocument',
    '@jupyterlab/help-extension:licenses': '@jupyterlab/apputils-extension:licenses-plugin',
    '@jupyterlab/lsp:ILSPCodeExtractorsManager': '@jupyterlab/lsp-extension:code-extractor-manager',
    '@jupyterlab/translation:translator': '@jupyterlab/translation-extension:translator',
    '@jupyterlab/workspaces:commands': '@jupyterlab/workspaces-extension:commands'
  };

  // Transparently handle the case of renamed plugins, so current configs don't break.
  // And emit a warning in the dev tools console to notify about the rename so
  // users can update their config.
  const disabledExtensions = index_js_.PageConfig.Extension.disabled.map(id => {
    if (renamedPluginIds[id]) {
      console.warn(`Plugin ${id} has been renamed to ${renamedPluginIds[id]}. Consider updating your config to use the new name.`);
      return renamedPluginIds[id];
    }
    return id;
  });

  const deferredExtensions = index_js_.PageConfig.Extension.deferred.map(id => {
    if (renamedPluginIds[id]) {
      console.warn(`Plugin id ${id} has been renamed to ${renamedPluginIds[id]}. Consider updating your config to use the new name.`);
      return renamedPluginIds[id];
    }
    return id;
  });

  // This is basically a copy of PageConfig.Extension.isDisabled to
  // take into account the case of renamed plugins.
  const isPluginDisabled = (id) => {
    const separatorIndex = id.indexOf(':');
    let extName = '';
    if (separatorIndex !== -1) {
      extName = id.slice(0, separatorIndex);
    }
    return disabledExtensions.some(val => val === id || (extName && val === extName));
  }

  // This is basically a copy of PageConfig.Extension.isDeferred to
  // take into account the case of renamed plugins.
  const isPluginDeferred = (id) => {
    const separatorIndex = id.indexOf(':');
    let extName = '';
    if (separatorIndex !== -1) {
      extName = id.slice(0, separatorIndex);
    }
    return deferredExtensions.some(val => val === id || (extName && val === extName));
  }

  const queuedFederated = [];

  extensions.forEach(data => {
    if (data.extension) {
      queuedFederated.push(data.name);
      federatedExtensionPromises.push(createModule(data.name, data.extension));
    }
    if (data.mimeExtension) {
      queuedFederated.push(data.name);
      federatedMimeExtensionPromises.push(createModule(data.name, data.mimeExtension));
    }

    if (data.style && !isPluginDisabled(data.name)) {
      federatedStylePromises.push(createModule(data.name, data.style));
    }
  });

  const allPlugins = [];

  /**
   * Get the plugins from an extension.
   */
  function getPlugins(extension) {
    // Handle commonjs or es2015 modules
    let exports;
    if (extension.hasOwnProperty('__esModule')) {
      exports = extension.default;
    } else {
      // CommonJS exports.
      exports = extension;
    }

    return Array.isArray(exports) ? exports : [exports];
  }

  /**
   * Iterate over active plugins in an extension.
   *
   * #### Notes
   * This also populates the disabled, deferred, and ignored arrays.
   */
  function* activePlugins(extension) {
    const plugins = getPlugins(extension);
    for (let plugin of plugins) {
      const isDisabled = isPluginDisabled(plugin.id);
      allPlugins.push({
        id: plugin.id,
        description: plugin.description,
        requires: plugin.requires ?? [],
        optional: plugin.optional ?? [],
        provides: plugin.provides ?? null,
        autoStart: plugin.autoStart,
        enabled: !isDisabled,
        extension: extension.__scope__
      });
      if (isDisabled) {
        disabled.push(plugin.id);
        continue;
      }
      if (isPluginDeferred(plugin.id)) {
        deferred.push(plugin.id);
        ignorePlugins.push(plugin.id);
      }
      yield plugin;
    }
  }

  // Handle the registered mime extensions.
  const mimeExtensions = [];
  if (!queuedFederated.includes('@jupyterlab/javascript-extension')) {
    try {
      let ext = __webpack_require__(33894);
      ext.__scope__ = '@jupyterlab/javascript-extension';
      for (let plugin of activePlugins(ext)) {
        mimeExtensions.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/json-extension')) {
    try {
      let ext = __webpack_require__(63480);
      ext.__scope__ = '@jupyterlab/json-extension';
      for (let plugin of activePlugins(ext)) {
        mimeExtensions.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/mermaid-extension')) {
    try {
      let ext = __webpack_require__(47375);
      ext.__scope__ = '@jupyterlab/mermaid-extension';
      for (let plugin of activePlugins(ext)) {
        mimeExtensions.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/pdf-extension')) {
    try {
      let ext = __webpack_require__(23131);
      ext.__scope__ = '@jupyterlab/pdf-extension';
      for (let plugin of activePlugins(ext)) {
        mimeExtensions.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/vega5-extension')) {
    try {
      let ext = __webpack_require__(47764);
      ext.__scope__ = '@jupyterlab/vega5-extension';
      for (let plugin of activePlugins(ext)) {
        mimeExtensions.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Add the federated mime extensions.
  const federatedMimeExtensions = await Promise.allSettled(federatedMimeExtensionPromises);
  federatedMimeExtensions.forEach(p => {
    if (p.status === "fulfilled") {
      for (let plugin of activePlugins(p.value)) {
        mimeExtensions.push(plugin);
      }
    } else {
      console.error(p.reason);
    }
  });

  // Handled the registered standard extensions.
  if (!queuedFederated.includes('@jupyterlab/application-extension')) {
    try {
      let ext = __webpack_require__(67416);
      ext.__scope__ = '@jupyterlab/application-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/apputils-extension')) {
    try {
      let ext = __webpack_require__(3980);
      ext.__scope__ = '@jupyterlab/apputils-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/cell-toolbar-extension')) {
    try {
      let ext = __webpack_require__(8976);
      ext.__scope__ = '@jupyterlab/cell-toolbar-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/celltags-extension')) {
    try {
      let ext = __webpack_require__(68942);
      ext.__scope__ = '@jupyterlab/celltags-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/codemirror-extension')) {
    try {
      let ext = __webpack_require__(3656);
      ext.__scope__ = '@jupyterlab/codemirror-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/completer-extension')) {
    try {
      let ext = __webpack_require__(68352);
      ext.__scope__ = '@jupyterlab/completer-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/console-extension')) {
    try {
      let ext = __webpack_require__(35232);
      ext.__scope__ = '@jupyterlab/console-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/csvviewer-extension')) {
    try {
      let ext = __webpack_require__(99392);
      ext.__scope__ = '@jupyterlab/csvviewer-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/debugger-extension')) {
    try {
      let ext = __webpack_require__(96706);
      ext.__scope__ = '@jupyterlab/debugger-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/docmanager-extension')) {
    try {
      let ext = __webpack_require__(2666);
      ext.__scope__ = '@jupyterlab/docmanager-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/documentsearch-extension')) {
    try {
      let ext = __webpack_require__(76126);
      ext.__scope__ = '@jupyterlab/documentsearch-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/extensionmanager-extension')) {
    try {
      let ext = __webpack_require__(53260);
      ext.__scope__ = '@jupyterlab/extensionmanager-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/filebrowser-extension')) {
    try {
      let ext = __webpack_require__(18600);
      ext.__scope__ = '@jupyterlab/filebrowser-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/fileeditor-extension')) {
    try {
      let ext = __webpack_require__(46678);
      ext.__scope__ = '@jupyterlab/fileeditor-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/help-extension')) {
    try {
      let ext = __webpack_require__(5154);
      ext.__scope__ = '@jupyterlab/help-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/htmlviewer-extension')) {
    try {
      let ext = __webpack_require__(34186);
      ext.__scope__ = '@jupyterlab/htmlviewer-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/hub-extension')) {
    try {
      let ext = __webpack_require__(99180);
      ext.__scope__ = '@jupyterlab/hub-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/imageviewer-extension')) {
    try {
      let ext = __webpack_require__(39164);
      ext.__scope__ = '@jupyterlab/imageviewer-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/inspector-extension')) {
    try {
      let ext = __webpack_require__(46124);
      ext.__scope__ = '@jupyterlab/inspector-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/launcher-extension')) {
    try {
      let ext = __webpack_require__(40044);
      ext.__scope__ = '@jupyterlab/launcher-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/logconsole-extension')) {
    try {
      let ext = __webpack_require__(86970);
      ext.__scope__ = '@jupyterlab/logconsole-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/lsp-extension')) {
    try {
      let ext = __webpack_require__(83648);
      ext.__scope__ = '@jupyterlab/lsp-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/mainmenu-extension')) {
    try {
      let ext = __webpack_require__(40760);
      ext.__scope__ = '@jupyterlab/mainmenu-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/markdownviewer-extension')) {
    try {
      let ext = __webpack_require__(71998);
      ext.__scope__ = '@jupyterlab/markdownviewer-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/markedparser-extension')) {
    try {
      let ext = __webpack_require__(1566);
      ext.__scope__ = '@jupyterlab/markedparser-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/mathjax-extension')) {
    try {
      let ext = __webpack_require__(61416);
      ext.__scope__ = '@jupyterlab/mathjax-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/mermaid-extension')) {
    try {
      let ext = __webpack_require__(58540);
      ext.__scope__ = '@jupyterlab/mermaid-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/metadataform-extension')) {
    try {
      let ext = __webpack_require__(94710);
      ext.__scope__ = '@jupyterlab/metadataform-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/notebook-extension')) {
    try {
      let ext = __webpack_require__(10010);
      ext.__scope__ = '@jupyterlab/notebook-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/pluginmanager-extension')) {
    try {
      let ext = __webpack_require__(33400);
      ext.__scope__ = '@jupyterlab/pluginmanager-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/rendermime-extension')) {
    try {
      let ext = __webpack_require__(77988);
      ext.__scope__ = '@jupyterlab/rendermime-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/running-extension')) {
    try {
      let ext = __webpack_require__(39076);
      ext.__scope__ = '@jupyterlab/running-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/services-extension')) {
    try {
      let ext = __webpack_require__(67620);
      ext.__scope__ = '@jupyterlab/services-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/settingeditor-extension')) {
    try {
      let ext = __webpack_require__(59640);
      ext.__scope__ = '@jupyterlab/settingeditor-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/shortcuts-extension')) {
    try {
      let ext = __webpack_require__(32511);
      ext.__scope__ = '@jupyterlab/shortcuts-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/statusbar-extension')) {
    try {
      let ext = __webpack_require__(61728);
      ext.__scope__ = '@jupyterlab/statusbar-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/terminal-extension')) {
    try {
      let ext = __webpack_require__(80384);
      ext.__scope__ = '@jupyterlab/terminal-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/theme-dark-extension')) {
    try {
      let ext = __webpack_require__(72304);
      ext.__scope__ = '@jupyterlab/theme-dark-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/theme-dark-high-contrast-extension')) {
    try {
      let ext = __webpack_require__(11112);
      ext.__scope__ = '@jupyterlab/theme-dark-high-contrast-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/theme-light-extension')) {
    try {
      let ext = __webpack_require__(5328);
      ext.__scope__ = '@jupyterlab/theme-light-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/toc-extension')) {
    try {
      let ext = __webpack_require__(43022);
      ext.__scope__ = '@jupyterlab/toc-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/tooltip-extension')) {
    try {
      let ext = __webpack_require__(7136);
      ext.__scope__ = '@jupyterlab/tooltip-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/translation-extension')) {
    try {
      let ext = __webpack_require__(7216);
      ext.__scope__ = '@jupyterlab/translation-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/ui-components-extension')) {
    try {
      let ext = __webpack_require__(44652);
      ext.__scope__ = '@jupyterlab/ui-components-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (!queuedFederated.includes('@jupyterlab/workspaces-extension')) {
    try {
      let ext = __webpack_require__(536);
      ext.__scope__ = '@jupyterlab/workspaces-extension';
      for (let plugin of activePlugins(ext)) {
        register.push(plugin);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Add the federated extensions.
  const federatedExtensions = await Promise.allSettled(federatedExtensionPromises);
  federatedExtensions.forEach(p => {
    if (p.status === "fulfilled") {
      for (let plugin of activePlugins(p.value)) {
        register.push(plugin);
      }
    } else {
      console.error(p.reason);
    }
  });

  // Load all federated component styles and log errors for any that do not
  (await Promise.allSettled(federatedStylePromises)).filter(({status}) => status === "rejected").forEach(({reason}) => {
    console.error(reason);
  });

  // 2. Register the plugins
  pluginRegistry.registerPlugins(register);

  // 3. Get and resolve the service manager and connection status plugins
  const IConnectionStatus = (__webpack_require__(94247).IConnectionStatus);
  const IServiceManager = (__webpack_require__(94247).IServiceManager);
  const connectionStatus = await pluginRegistry.resolveOptionalService(IConnectionStatus);
  const serviceManager = await pluginRegistry.resolveRequiredService(IServiceManager);

  const lab = new JupyterLab({
    pluginRegistry,
    serviceManager,
    mimeExtensions,
    connectionStatus,
    disabled: {
      matches: disabled,
      patterns: disabledExtensions
        .map(function (val) { return val.raw; })
    },
    deferred: {
      matches: deferred,
      patterns: deferredExtensions
        .map(function (val) { return val.raw; })
    },
    availablePlugins: allPlugins
  });

  // 4. Start the application, which will activate the other plugins
  lab.start({ ignorePlugins, bubblingKeydown: true });

  // Expose global app instance when in dev mode or when toggled explicitly.
  var exposeAppInBrowser = (index_js_.PageConfig.getOption('exposeAppInBrowser') || '').toLowerCase() === 'true';
  var devMode = (index_js_.PageConfig.getOption('devMode') || '').toLowerCase() === 'true';

  if (exposeAppInBrowser || devMode) {
    window.jupyterapp = lab;
  }

  // Handle a browser test.
  if (browserTest.toLowerCase() === 'true') {
    lab.restored
      .then(function() { report(errors); })
      .catch(function(reason) { report([`RestoreError: ${reason.message}`]); });

    // Handle failures to restore after the timeout has elapsed.
    window.setTimeout(function() { report(errors); }, timeout);
  }
}


/***/ }),

/***/ 78269:
/***/ ((module) => {

module.exports = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAsElEQVQIHQGlAFr/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7+r3zKmT0/+pk9P/7+r3zAAAAAAAAAAABAAAAAAAAAAA6OPzM+/q9wAAAAAA6OPzMwAAAAAAAAAAAgAAAAAAAAAAGR8NiRQaCgAZIA0AGR8NiQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQyoYJ/SY80UAAAAASUVORK5CYII=";

/***/ })

}]);
//# sourceMappingURL=6180.462b90260ffa62ceef1b.js.map?v=462b90260ffa62ceef1b