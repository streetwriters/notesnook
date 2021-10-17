const { persistSelection } = require("../utils");
const { TAGNAME, state } = require("./utils");
const hljs = require("highlight.js");

const LANGUAGE_SELECT_LABEL_SELECTOR =
  ".tox-pop__dialog span.tox-tbtn__select-label";

function maplanguagesToMenuItems() {
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

function addCodeBlockToolbar(editor) {
  maplanguagesToMenuItems();
  setupChangeLanguageButton(editor);

  editor.ui.registry.addContextToolbar("codeblock-selection", {
    predicate: function (node) {
      if (node.nodeName === TAGNAME) {
        state.activeBlock = node;
        const language = parseCodeblockLanguage(node);
        setupChangeLanguageButton(editor, language && language.name);
        return true;
      } else {
        state.activeBlock = null;
      }
      return false;
    },
    items: "copy languages",
    position: "node",
  });
}

function setupChangeLanguageButton(editor, text = "Auto detect") {
  changeLanguageSelectLabel(text);

  editor.ui.registry.addSplitButton("languages", {
    text: text,
    onAction: function () {
      const isAutoDetect = text === "Auto detect";
      const language = isAutoDetect
        ? autoDetectLanguage(state.activeBlock)
        : parseCodeblockLanguage(state.activeBlock);
      selectLanguage(editor, language);
    },
    onItemAction: function (_, language) {
      selectLanguage(editor, language);
    },
    select: (language) => language && language.name === text,
    fetch: (callback) => callback(state.languages),
  });
}

function selectLanguage(editor, language) {
  applyHighlighting(editor, language);
  setupChangeLanguageButton(editor, language && language.name);
}

function changeLanguageSelectLabel(text) {
  const label = document.querySelector(LANGUAGE_SELECT_LABEL_SELECTOR);
  if (!label || label.textContent === text) return;
  label.textContent = text;
}

function parseCodeblockLanguage(node) {
  if (!node || node.tagName !== TAGNAME) return;

  const languageAliases = getLanguageFromClassList(node).split("-");
  if (languageAliases.length <= 1) return;
  return hljs.getLanguage(languageAliases[1]);
}

function autoDetectLanguage(node) {
  const result = hljs.highlightAuto(node.innerText);
  if (result.errorRaised) {
    console.error(result.errorRaised);
    return;
  }
  return hljs.getLanguage(result.language);
}

function applyHighlighting(editor, language) {
  if (!language || !language.aliases || !language.aliases.length) return;

  const node = state.activeBlock;
  const alias = language.aliases[0];

  persistSelection(node, () => {
    const code = hljs.highlight(node.innerText, {
      language: alias,
    });
    node.innerHTML = code.value.replace(/\n/gm, "<br>");
    editor.save();
  });

  changeCodeblockClassName(node, `language-${alias}`);
}

function changeCodeblockClassName(node, className) {
  const language = getLanguageFromClassList(node);
  if (!!language)
    node.classList.replace(getLanguageFromClassList(node), className);
  else node.classList.add(className);
}

/**
 *
 * @param {Element} node
 */
function getLanguageFromClassList(node) {
  for (let className of node.classList.values()) {
    if (className.startsWith("language") || className.startsWith("lang"))
      return className;
  }
  return "";
}

function refreshHighlighting(editor) {
  applyHighlighting(editor, parseCodeblockLanguage(state.activeBlock));
}

module.exports = { addCodeBlockToolbar, refreshHighlighting };
