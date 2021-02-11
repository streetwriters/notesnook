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
    editor.selection.setCursorLocation(node, 5);
    editor.nodeChanged();
  };

  var addCodeBlock = function (editor, api, type) {
    if (api && api.isActive && api.isActive()) {
      editor.execCommand("mceInsertNewLine", false, { shiftKey: true });
    } else {
      var content = editor.selection.getContent({ format: "text" });
      content = content.replace(/^\n/gm, "");
      if (type === "shortcut") content = "<br>";
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

      var setContentHandler = function (e) {
        if (e.content === "<pre></pre>") {
          e.preventDefault();
          editor.creatingCodeBlock = true;
          addCodeBlock(editor, undefined, "shortcut");
        }
      };

      var beforeExecCommandHandler = function (e) {
        console.log(e);
        if (editor.creatingCodeBlock && e.command === "mceInsertNewLine") {
          e.preventDefault();
          editor.creatingCodeBlock = false;
        }
      };

      editor.on("BeforeExecCommand", beforeExecCommandHandler);
      editor.on("BeforeSetContent", setContentHandler);
      editor.on("NodeChange", nodeChangeHandler);
      return function () {
        editor.off("BeforeExecCommand", beforeExecCommandHandler);
        editor.off("BeforeSetContent", setContentHandler);
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
