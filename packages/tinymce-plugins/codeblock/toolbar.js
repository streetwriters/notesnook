const { persistSelection } = require("../utils");
const { TAGNAME, state } = require("./utils");
const languages = require("./languages");

const LANGUAGE_SELECT_LABEL_SELECTOR =
  ".tox-pop__dialog span.tox-tbtn__select-label";

function maplanguagesToMenuItems() {
  if (state.languages.length === languages.length) return;

  languages.forEach((language) => {
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
    predicate: (node) => {
      if (node.nodeName === TAGNAME) {
        state.activeBlock = node;
        const languageShortname = parseCodeblockLanguage(node);
        const language = languages.find(
          (l) => l.shortname === languageShortname
        );
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

function setupChangeLanguageButton(editor, text = "Plain text") {
  changeLanguageSelectLabel(text);

  editor.ui.registry.addSplitButton("languages", {
    text: text,
    onAction: async () => {
      const isPlaintext = text === "Plain text";
      if (!isPlaintext) return;
      const language = parseCodeblockLanguage(state.activeBlock);
      selectLanguage(editor, language);
    },
    onItemAction: async (_, language) => {
      await selectLanguage(editor, language);
    },
    select: (language) => language && language.name === text,
    fetch: (callback) => callback(state.languages),
  });
}

async function selectLanguage(editor, language) {
  setupChangeLanguageButton(editor, "Loading");
  await applyHighlighting(editor, language.shortname);
  setupChangeLanguageButton(editor, language.name);
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
  return languageAliases[1];
}

async function applyHighlighting(editor, language) {
  if (!language) return;
  let hljs = await getHighlightJS(editor);
  if (!hljs.getLanguage(language)) await loadLanguage(editor, language);

  const node = state.activeBlock;

  persistSelection(node, () => {
    const code = hljs.highlight(node.innerText, {
      language,
    });
    node.innerHTML = code.value.replace(/\n/gm, "<br>");
  });
  changeCodeblockClassName(node, `language-${language}`);

  editor.save();
  editor.setDirty(false); // Force not dirty state
}

function changeCodeblockClassName(node, className) {
  const language = getLanguageFromClassList(node);
  if (language === className) return;
  if (!!language) node.classList.replace(language, className);
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

async function refreshHighlighting(editor) {
  const language = parseCodeblockLanguage(state.activeBlock);
  await applyHighlighting(editor, language);
}

const loadedLanguages = {};
async function loadLanguage(editor, shortName) {
  let hljs = await getHighlightJS(editor);
  if (!hljs) return;
  if (loadedLanguages[shortName]) return hljs.getLanguage(shortName);

  const url = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/languages/${shortName}.min.js`;
  await loadScript(editor, url);

  const lang = hljs.getLanguage(shortName);
  loadedLanguages[shortName] = lang;
}

async function getHighlightJS(editor) {
  if (global.hljs) {
    return global.hljs;
  }

  const url = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/highlight.min.js`;
  await loadScript(editor, url);
  return global.hljs;
}

function loadScript(editor, url) {
  return new Promise((resolve) => {
    const document = editor.dom.doc;
    const script = document.createElement("script");
    script.src = url;
    // Append to the `head` element
    document.head.appendChild(script);
    script.addEventListener("load", () => {
      resolve();
    });
  });
}

module.exports = { addCodeBlockToolbar, refreshHighlighting };
