import tinymce from "tinymce/tinymce";

(function () {
  var global = tinymce.util.Tools.resolve("tinymce.PluginManager");

  var replaceContent = function (editor, content) {
    let node = editor.selection.getNode();
    editor.undoManager.transact(function () {
      node.remove();
      editor.execCommand("mceInsertContent", false, content(node));
    });
    node = editor.selection.getNode();
    editor.focus();
    editor.selection.setCursorLocation(node);
    editor.nodeChanged();
  };

  var addCodeBlock = function (editor, api) {
    if (api.isActive()) {
      replaceContent(
        editor,
        (node) => `<p>${node.innerHTML.replace(/\n/gm, "<br>")}</p>`
      );
    } else {
      var content = editor.selection.getContent({ format: "text" });
      content = content.replace(/^\n/gm, "");
      if (content.length > 0) {
        editor.undoManager.transact(function () {
          editor.execCommand(
            "mceInsertContent",
            false,
            `<pre>${content}</pre>`
          );
        });
        editor.selection.setCursorLocation();
        editor.nodeChanged();
      } else {
        replaceContent(
          editor,
          (node) => `<pre>${node.innerHTML.replace(/\n/gm, "<br>")}</pre>`
        );
      }
    }
  };

  var register = function (editor) {
    editor.addCommand("mceCode", function (api) {
      addCodeBlock(editor, api);
    });
  };

  var register$1 = function (editor) {
    editor.ui.registry.addToggleButton("code", {
      icon: "sourcecode",
      tooltip: "Code",
      onAction: function (api) {
        return addCodeBlock(editor, api);
      },
      onSetup: getNodeChangeHandler(editor),
    });
  };

  var getNodeChangeHandler = function (editor) {
    return function (api) {
      var nodeChangeHandler = function (e) {
        api.setActive(e.element.tagName === "PRE");
      };
      editor.on("NodeChange", nodeChangeHandler);
      return function () {
        return editor.off("NodeChange", nodeChangeHandler);
      };
    };
  };

  function Plugin() {
    global.add("code", function (editor) {
      register(editor);
      register$1(editor);
      return {};
    });
  }

  Plugin();
})();
