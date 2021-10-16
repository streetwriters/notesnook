const {
  addPluginToPluginManager,
  getCharacterRange,
  moveCaretTo,
} = require("../utils");
const { createCodeBlock, isCodeBlock, TAGNAME, state } = require("./utils");
const { addCodeBlockToolbar, refreshHighlighting } = require("./toolbar");

const TAB = "  ";
const EMPTY_LINE = "<p><br></p>";

/**
 * @param {import("tinymce").Editor} editor
 */
function register(editor) {
  addCodeBlockToolbar(editor);

  editor.addCommand("mceInsertCodeBlock", function (api, args) {
    toggleCodeBlock(editor, api, args);
  });

  editor.ui.registry.addToggleButton("codeblock", {
    icon: "code-sample",
    tooltip: "Codeblock",
    onAction: function (api) {
      return toggleCodeBlock(editor, api);
    },
    onSetup: (api) => {
      return registerHandlers(api, editor);
    },
  });
}

var toggleCodeBlock = function (editor, api, type) {
  const isInsideCodeBlock = api && api.isActive && api.isActive();
  if (isInsideCodeBlock) {
    const node = editor.selection.getNode();
    let selectedText = node.textContent;
    if (selectedText) {
      editor.selection.setContent(`<p>${selectedText}</p>`);
    } else {
      blurCodeBlock(editor, node);
    }
  } else {
    var content = editor.selection.getContent({ format: "text" }); //.replace(/^\n/gm, "");
    if (type === "shortcut") content = "<br>";
    insertCodeBlock(editor, content);
  }
};

function insertCodeBlock(editor, content) {
  editor.undoManager.transact(function () {
    const pre = createCodeBlock(content);
    editor.dom.setAttrib(pre, "data-mce-id", "__mcenew");
    editor.focus();
    editor.insertContent(`${pre.outerHTML}${EMPTY_LINE}`);

    setTimeout(() => {
      const insertedPre = editor.dom.select('*[data-mce-id="__mcenew"]')[0];
      editor.dom.setAttrib(insertedPre, "data-mce-id", null);
      editor.selection.select(insertedPre, true);
      editor.selection.collapse(true);
      editor.nodeChanged({ selectionChange: true });
    }, 0);
  });
}

function blurCodeBlock(editor, block) {
  editor.undoManager.transact(function () {
    const p = document.createElement("p");
    p.innerHTML = "<br>";
    editor.focus();
    editor.dom.insertAfter(p, block);

    setTimeout(() => {
      editor.selection.select(p, true);
      editor.selection.collapse(true);
      editor.nodeChanged({ selectionChange: true });
    }, 0);
  });
}

var isCreatingCodeBlock = false;
var registerHandlers = function (api, editor) {
  function onNodeChanged(event) {
    api.setActive(event.element.tagName === TAGNAME);
  }

  // A simple hack to handle the ``` markdown text pattern
  // This acts as a "command" for us. Whenever, TinyMCE adds
  // <pre></pre> we override it and insert our own modified
  // code block.
  function onBeforeSetContent(e) {
    if (e.content === "<pre></pre>") {
      e.preventDefault();
      isCreatingCodeBlock = true;
      toggleCodeBlock(editor, undefined, "shortcut");
    }
  }

  function onBeforeExecCommand(e) {
    const node = editor.selection.getNode();

    // override pasting: by default the pasted code
    // is stripped of all newlines; i.e. it is pasted
    // as a single line.
    if (
      isCodeBlock(node) &&
      e.command === "mceInsertContent" &&
      e.value &&
      e.value.paste
    ) {
      e.value.content = e.value.content
        .replace(/<p>/gm, "")
        .replace(/<\/p>|<br \/>/gm, "\n");
    }

    // TextPattern plugin by default adds a new line for the replacement patterns,
    // but we don't want to add a new line so we override it.
    if (isCreatingCodeBlock && e.command === "mceInsertNewLine") {
      e.preventDefault();
      isCreatingCodeBlock = false;
    }
  }

  // TinyMCE doesn't handle tab key events by default.
  // This makes for a poor code block experience so
  // we have to handle all the logic manually.
  function onKeyDown(e) {
    const node = state.activeBlock;
    if (!node || e.code !== "Tab") return;

    const characterRange = getCharacterRange(node);
    if (!characterRange) return;

    e.preventDefault();

    // Shift + Tab = Deindent on all major platforms
    const isDeindent = e.shiftKey;
    const text = node.textContent;

    const hasCodeAfterCaret = text.substring(characterRange.end).length > 0;
    if (hasCodeAfterCaret) {
      const isTextSelected = characterRange.start !== characterRange.end;
      if (isTextSelected) {
        // we need handle multiline tabbing as well
        // so we split the selected code into lines
        // and indent each line seperately.

        let [beforeSelection, selection, afterSelection] = [
          text.substring(0, characterRange.start),
          text.substring(characterRange.start, characterRange.end),
          text.substring(characterRange.end),
        ];

        let content = beforeSelection;
        const selectedLines = selection.split("\n");
        for (var i = 0; i < selectedLines.length; ++i) {
          const line = selectedLines[i];
          selectedLines[i] = isDeindent
            ? line.replace(TAB, "")
            : `${TAB}${line}`;
        }
        content += selectedLines.join("\n");
        content += afterSelection;
        node.textContent = content;

        const endIndex = isDeindent
          ? characterRange.end - TAB.length * selectedLines.length
          : characterRange.end + TAB.length * selectedLines.length;
        moveCaretTo(node, characterRange.start, endIndex);
      } else {
        // TODO: handle line deindent
        editor.insertContent(TAB);
      }
    } else {
      editor.insertContent(TAB);
    }
  }

  function onKeyUp(e) {
    // perf: only apply highlighting on whitespace characters
    if (
      e.code === "Enter" ||
      e.code === "Space" ||
      e.code === "Backspace" ||
      e.code === "Tab"
    )
      refreshHighlighting(editor);
  }

  editor.on("BeforeExecCommand", onBeforeExecCommand);
  editor.on("BeforeSetContent", onBeforeSetContent);
  editor.on("NodeChange", onNodeChanged);
  editor.on("keydown", onKeyDown);
  editor.on("keyup", onKeyUp);
  return function () {
    editor.off("BeforeExecCommand", onBeforeExecCommand);
    editor.off("BeforeSetContent", onBeforeSetContent);
    editor.off("keydown", onKeyDown);
    editor.off("keyup", onKeyUp);
    editor.off("NodeChange", onNodeChanged);
  };
};

function insertAt(str, token, index) {
  return str.substring(0, index) + token + str.substring(index);
}

(function init() {
  addPluginToPluginManager("codeblock", register);
})();

/**
 * Call this function in paste_postprocess function in tinymce.init.
 * This basically removes all internal formatting of code blocks and applies
 * the necessary formatting for consistency.
 */
function processPastedContent(node) {
  if (!node) return;

  if (node.childNodes) {
    for (let childNode of node.childNodes) {
      if (childNode.tagName === "PRE") {
        childNode.className = "hljs";
        const code = childNode.textContent || childNode.innerText;
        childNode.innerHTML = code;
      }
    }
  }
}

module.exports = { processPastedContent };
