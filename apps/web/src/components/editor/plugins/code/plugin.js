import tinymce from "tinymce/tinymce";
import hljs from "highlight.js/lib/common";
import { getCharacterRange, moveCaretTo, persistSelection } from "../utils";

const TAB = "  ";
const LANGUAGE_SELECT_LABEL_SELECTOR =
  ".tox-pop__dialog span.tox-tbtn__select-label";
const state = {
  activeBlock: null,
  languages: [{ type: "choiceitem", text: "Auto detect", value: "autodetect" }],
};
languagesToItems();

(function () {
  var global = tinymce.util.Tools.resolve("tinymce.PluginManager");

  var replaceContent = function (editor, content) {
    editor.undoManager.transact(function () {
      editor.execCommand("mceInsertContent", false, content("<br>"));
    });
  };

  function createPreBlock(content) {
    const pre = document.createElement("pre");
    pre.spellcheck = false;
    pre.classList.add("hljs");
    pre.innerHTML = content;
    return pre;
  }

  function insertPreBlock(editor, content) {
    editor.undoManager.transact(function () {
      const pre = createPreBlock(content);
      editor.dom.setAttrib(pre, "data-mce-id", "__mcenew");
      editor.focus();
      editor.insertContent(`${pre.outerHTML}<p><br></p>`);

      setTimeout(() => {
        const insertedPre = editor.dom.select('*[data-mce-id="__mcenew"]')[0];
        editor.dom.setAttrib(insertedPre, "data-mce-id", null);
        editor.selection.select(insertedPre, true);
        editor.selection.collapse(true);
        editor.nodeChanged({ selectionChange: true });
      }, 0);
    });
  }

  function exitPreBlock(editor, block) {
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
        exitPreBlock(editor, node);
      }
    } else {
      var content = editor.selection.getContent({ format: "text" }); //.replace(/^\n/gm, "");
      if (type === "shortcut") content = "<br>";
      insertPreBlock(editor, content);
    }
  };

  var addInlineCode = function (editor) {
    var content = editor.selection.getContent({ format: "text" });
    content = content.replace(/^\n/gm, "") || "&nbsp;";

    editor.undoManager.transact(function () {
      editor.execCommand(
        "mceInsertContent",
        false,
        `<code spellcheck="false">${content}</code>&nbsp;`
      );
    });

    editor.nodeChanged({ selectionChange: true });
  };

  var register = function (editor) {
    editor.addCommand("mceInsertCodeBlock", function (api, args) {
      addCodeBlock(editor, api, args);
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
        const node = editor.selection.getNode();
        if (
          node?.tagName === "PRE" &&
          e.command === "mceInsertContent" &&
          e.value?.paste
        ) {
          e.value.content = e.value.content
            .replace(/<p>/gm, "")
            .replace(/<\/p>|<br \/>/gm, "\n");
        }
        if (editor.creatingCodeBlock && e.command === "mceInsertNewLine") {
          e.preventDefault();
          editor.creatingCodeBlock = false;
        }
      };

      function handleKeyDown(e) {
        if (state.activeBlock) {
          if (e.code === "Tab") {
            e.preventDefault();
            const isDeindent = e.shiftKey;
            const text = state.activeBlock.textContent;
            const characterRange = getCharacterRange(state.activeBlock);
            if (!characterRange) return;

            if (text.substring(characterRange.start).length > 0) {
              if (characterRange.start === characterRange.end) {
                state.activeBlock.textContent = insertAt(
                  text,
                  TAB,
                  characterRange.start
                );
                moveCaretTo(
                  state.activeBlock,
                  characterRange.start + TAB.length,
                  characterRange.end + TAB.length
                );
              } else {
                let content = text.substring(0, characterRange.start);
                const lines = text
                  .substring(characterRange.start, characterRange.end)
                  .split("\n");
                for (var i = 0; i < lines.length; ++i) {
                  const line = lines[i];
                  lines[i] = isDeindent
                    ? line.replace(TAB, "")
                    : `${TAB}${line}`;
                }
                content += lines.join("\n");
                content += text.substring(characterRange.end);
                state.activeBlock.textContent = content;

                const endIndex = isDeindent
                  ? characterRange.end - TAB.length * lines.length
                  : characterRange.end + TAB.length * lines.length;
                moveCaretTo(state.activeBlock, characterRange.start, endIndex);
              }
            } else {
              editor.insertContent(TAB);
            }
          }
        }
      }

      function handleKeyUp(e) {
        if (
          e.code === "Enter" ||
          e.code === "Space" ||
          e.code === "Backspace" ||
          e.code === "Tab"
        )
          applyHighlighting(editor, null, true);
      }

      editor.on("BeforeExecCommand", beforeExecCommandHandler);
      editor.on("BeforeSetContent", setContentHandler);
      editor.on("NodeChange", nodeChangeHandler);
      editor.on("keydown", handleKeyDown);
      editor.on("keyup", handleKeyUp);
      return function () {
        editor.off("BeforeExecCommand", beforeExecCommandHandler);
        editor.off("BeforeSetContent", setContentHandler);
        editor.off("keydown", handleKeyDown);
        editor.off("keyup", handleKeyUp);
        editor.off("NodeChange", nodeChangeHandler);
      };
    };
  };

  function Plugin() {
    global.add("code", function (editor) {
      setupChangeLanguageButton(editor);
      setupPreToolbar(editor);

      register(editor);
      register$1(editor);

      return {};
    });
  }

  Plugin();
})();

function languagesToItems() {
  const languages = hljs.listLanguages();
  languages.forEach((lang) => {
    const language = hljs.getLanguage(lang);
    state.languages.push({
      type: "choiceitem",
      text: language.name,
      value: language,
    });
  });
}

function setupPreToolbar(editor) {
  editor.ui.registry.addContextToolbar("preselection", {
    predicate: function (node) {
      if (node.nodeName === "PRE") {
        state.activeBlock = node;
        const language = detectCodeblockLanguage(node);
        changeSelectedLanguage(editor, language, true);
        return true;
      } else if (
        node.parentElement.nodeName !== "PRE" &&
        node.className !== "line"
      ) {
        state.activeBlock = null;
      }
      return false;
    },
    items: "copy hljs-languages",
    position: "node",
  });
}

function setupChangeLanguageButton(editor, text) {
  editor.ui.registry.addSplitButton("hljs-languages", {
    text: text || "Auto detect",
    onAction: function () {
      const isAutoDetect = text === "Auto detect" || !text;
      if (!isAutoDetect) applyHighlighting(editor, null, true);
      else applyHighlighting(editor, null, false, true);
    },
    onItemAction: function (_buttonApi, value) {
      changeSelectedLanguage(editor, value);
    },
    select: (value) => value?.name === text,
    fetch: (callback) => {
      callback(state.languages);
    },
  });
}

function changeSelectedLanguage(editor, value, highlighted = false) {
  if (!highlighted) applyHighlighting(editor, value);

  const label = document.querySelector(LANGUAGE_SELECT_LABEL_SELECTOR);
  if (!label || label?.textContent === value?.name) return;
  label.textContent = value?.name || "Auto detect";

  setupChangeLanguageButton(editor, value?.name);
}

function detectCodeblockLanguage(node, auto = false) {
  if (node?.tagName !== "PRE") return;

  const languageAliases = getLanguageFromClassName(node.className).split("-");
  if (languageAliases.length > 1) {
    return hljs.getLanguage(languageAliases[1]);
  } else if (auto) {
    const result = hljs.highlightAuto(node.innerText);
    if (result.errorRaised) {
      console.error(result.errorRaised);
      return;
    }
    return hljs.getLanguage(result.language);
  }
}

function applyHighlighting(editor, language, refresh = false, auto = false) {
  const node = state.activeBlock;
  const detectedLanguage = detectCodeblockLanguage(node, auto);

  const isDifferentLanguage = detectedLanguage?.name !== language?.name;
  const shouldHighlight = refresh || !detectedLanguage || isDifferentLanguage;
  if (!shouldHighlight) return;

  if (refresh || auto) language = detectedLanguage;
  if (!language || !language.aliases?.length) return;

  const alias = language.aliases[0];

  persistSelection(node, () => {
    node.innerHTML = hljs.highlight(node.innerText, {
      language: alias,
    }).value;
    editor.save();
  });

  if (refresh) return;

  node.className = node.className.replace(
    getLanguageFromClassName(node.className),
    ` language-${alias} `
  );

  if (auto) changeSelectedLanguage(editor, language, true);
}

function insertAt(str, token, index) {
  return str.substring(0, index) + token + str.substring(index);
}

function getLanguageFromClassName(className) {
  const classes = className.split(" ");
  const languageKey = classes.find((c) => c.startsWith("lang"));
  return languageKey || "";
}
