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
            `<pre spellcheck="false" class='codeblock'>${content}</pre>`
          );
        });
        editor.selection.setRng(rng);
        editor.nodeChanged();
      } else {
        replaceContent(
          editor,
          (html) =>
            `<pre spellcheck="false" class='codeblock'>${html.replace(
              /\n/gm,
              "<br>"
            )}</pre>`
        );
      }
    }
  };

  var addInlineCode = function (editor) {
    var content = editor.selection.getContent({ format: "text" });
    content = content.replace(/^\n/gm, "") || "&nbsp;";

    const rng = editor.selection.getRng();
    editor.undoManager.transact(function () {
      editor.execCommand(
        "mceInsertContent",
        false,
        `<code spellcheck="false">${content}</pre>`
      );
    });
    editor.selection.setRng(rng);
    editor.nodeChanged();
  };

  var register = function (editor) {
    editor.addCommand("mceCodeblock", function (api) {
      addCodeBlock(editor, api);
    });

    editor.addCommand("mceCode", function (api, value) {
      addInlineCode(editor);
    });
  };

  var register$1 = function (editor) {
    editor.ui.registry.addToggleButton("codeblock", {
      icon: "code-sample",
      tooltip: "Codeblock",
      onAction: function (api) {
        return addCodeBlock(editor, api);
      },
      onSetup: getNodeChangeHandler(editor),
    });
    editor.ui.registry.addToggleButton("inlinecode", {
      icon: "sourcecode",
      tooltip: "Inline code",
      onAction: function (api) {
        return addInlineCode(editor);
      },
      onSetup: function (api) {
        var nodeChangeHandler = function (e) {
          if (e.element.tagName === "CODE") {
            if (!e.element.innerHTML.trim().length) {
              e.element.remove();
            }
            api.setActive(e.element.tagName === "PRE");
          }
        };

        editor.on("NodeChange", nodeChangeHandler);
        return function () {
          return editor.off("NodeChange", nodeChangeHandler);
        };
      },
    });
  };

  var getNodeChangeHandler = function (editor) {
    return function (api) {
      var nodeChangeHandler = function (e) {
        if (e.element.tagName === "CODE") {
          if (!e.element.innerHTML.trim().length) {
            e.element.remove();
          }
        }
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
