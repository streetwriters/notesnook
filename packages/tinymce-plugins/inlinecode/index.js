const { addPluginToPluginManager } = require("../utils");

const TAGNAME = "CODE";

function register(editor) {
  editor.ui.registry.addToggleButton("inlinecode", {
    icon: "sourcecode",
    tooltip: "Inline code",
    onAction: function () {
      return addInlineCode(editor);
    },
    onSetup: function (api) {
      var nodeChangeHandler = function (e) {
        if (
          e.element.tagName === TAGNAME &&
          !e.element.innerHTML.trim().length
        ) {
          e.element.remove();
        }
        api.setActive(e.element.tagName === TAGNAME);
      };

      editor.on("NodeChange", nodeChangeHandler);
      return function () {
        return editor.off("NodeChange", nodeChangeHandler);
      };
    },
  });

  editor.addCommand("mceInsertInlineCode", function () {
    addInlineCode(editor);
  });
}

function addInlineCode(editor) {
  var content = editor.selection.getContent({ format: "text" });
  content = content.replace(/^\n/gm, "") || "&nbsp;";

  editor.undoManager.transact(function () {
    editor.execCommand(
      "mceInsertContent",
      false,
      `<code spellcheck="false">${content}</code>`
    );
  });

  editor.nodeChanged({ selectionChange: true });
}

(function init() {
  addPluginToPluginManager("inlinecode", register);
})();
