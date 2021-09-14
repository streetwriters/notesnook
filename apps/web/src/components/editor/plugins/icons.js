import * as Icons from "@mdi/js";

function register(editor) {
  editor.ui.registry.addIcon(
    "attachment",
    createSvgElement(Icons.mdiAttachment)
  );
}

function createSvgElement(path) {
  return `<svg height="24" width="24"><path d="${path}" /></svg>`;
}

(function init() {
  global.tinymce.PluginManager.add("icons", register);
})();
