const { addPluginToPluginManager } = require("../utils");

const CLASS_NAMES = {
  list: "tox-checklist",
  checked: "tox-checklist--checked",
};
const EMPTY_CHECKLIST_HTML = `<ul class="${CLASS_NAMES.list}"><li></li></ul>`;

/**
 * @param {import("tinymce").Editor} editor
 */
function register(editor) {
  editor.addCommand("insertChecklist", function () {
    insertChecklist(editor);
  });

  editor.ui.registry.addButton("checklist", {
    icon: "checklist",
    tooltip: "Insert checklist",
    onAction: () => insertChecklist(editor),
  });

  editor.on(
    "mousedown",
    function (event) {
      var node = event.target;
      var parent = node.parentElement;
      if (
        event.offsetX > 0 ||
        parent.className !== CLASS_NAMES.list ||
        node.nodeName !== "LI"
      ) {
        return;
      }
      event.preventDefault();
      toggleChecklistItem(editor, node);
    },
    { capture: true, passive: false }
  );

  editor.on(
    "touchstart",
    function (event) {
      var node = event.target;
      var parent = node.parentElement;
      if (
        event.targetTouches.length > 0 ||
        event.targetTouches[0].clientX > 45 ||
        parent.className !== CLASS_NAMES.list ||
        node.nodeName !== "LI"
      ) {
        return;
      }
      event.preventDefault();

      toggleChecklistItem(editor, node);
    },
    { capture: true, passive: false }
  );
}

/**
 * @param {import("tinymce").Editor} editor
 */
function insertChecklist(editor) {
  editor.undoManager.transact(function () {
    editor.insertContent(EMPTY_CHECKLIST_HTML);
  });
}

/**
 * @param {import("tinymce").Editor} editor
 * @param {any} node
 */
function toggleChecklistItem(editor, node) {
  editor.undoManager.transact(function () {
    node.className =
      node.className === CLASS_NAMES.checked ? "" : CLASS_NAMES.checked;
  });
}

(function init() {
  addPluginToPluginManager("checklist", register);
})();
