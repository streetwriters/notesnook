import tinymce from "tinymce/tinymce";

(function () {
  var global = tinymce.util.Tools.resolve("tinymce.PluginManager");

  var replaceContent = function (editor, content) {
    editor.undoManager.transact(function () {
      editor.execCommand("mceInsertContent", false, content("<br>"));
    });
  };

  var addCodeBlock = function (editor, api, type) {
    if (api && api.isActive && api.isActive()) {
      let node = editor.selection.getNode();
      const innerText = node.textContent;
      if (innerText.length <= 0) {
        replaceContent(
          editor,
          (html) => `<p>${html.replace(/\n/gm, "<br>")}</p>`
        );
      } else {
        editor.execCommand("mceInsertNewLine", false, { shiftKey: true });
      }
    } else {
      var content = editor.selection.getContent({ format: "text" });
      content = content.replace(/^\n/gm, "");
      if (type === "shortcut") content = "<br>";
      if (content.length > 0) {
        const rng = editor.selection.getRng();
        editor.undoManager.transact(function () {
          editor.execCommand(
            "mceInsertContent",
            false,
            `<pre class='codeblock'>${content}</pre>`
          );
        });
        editor.selection.setRng(rng);
        editor.nodeChanged();
      } else {
        replaceContent(
          editor,
          (html) =>
            `<pre class='codeblock'>${html.replace(/\n/gm, "<br>")}</pre>`
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
