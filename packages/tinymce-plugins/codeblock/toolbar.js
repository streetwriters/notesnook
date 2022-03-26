const { persistSelection } = require("../utils");
const { TAGNAME, state, newlineToBR } = require("./utils");
const languages = require("./languages");
const hljs = require("highlight.js/lib/core");

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

  editor.ui.registry.addButton("copyCode", {
    icon: "copy",
    tooltip: "Copy code",
    onAction: async () => {
      await copyToClipboard(
        state.activeBlock.innerText,
        state.activeBlock.outerHTML
      );
    },
  });

  editor.ui.registry.addContextToolbar("codeblock-selection", {
    predicate: (node) => {
      if (node.nodeName === TAGNAME) {
        if (state.activeBlock === node) return true;

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
    items: "copyCode languages",
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
      if (!language) return;
      selectLanguage(editor, language);
    },
    onItemAction: async (_, language) => {
      if (!language) return;
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
  editor.focus();
}

function changeLanguageSelectLabel(text) {
  const label = document.querySelector(LANGUAGE_SELECT_LABEL_SELECTOR);
  if (!label || label.textContent === text) return;
  label.textContent = text;
}

function parseCodeblockLanguage(node) {
  if (!node || node.tagName !== TAGNAME) return;

  const languageAlias = getLanguageFromClassList(node);
  if (!languageAlias) return;
  return languageAlias;
}

async function applyHighlighting(editor, language) {
  const node = state.activeBlock;
  if (!node) return;

  // load hljs into the editor window which can be the iframe
  // or the main window. This is required so language definitions
  // can be loaded.
  editor.contentWindow.hljs = hljs;

  if (!language) return;
  if (!hljs.getLanguage(language)) await loadLanguage(editor, language);

  persistSelection(node, () => {
    const code = hljs.highlight(node.innerText, {
      language,
    });
    node.innerHTML = newlineToBR(code.value);
  });
  changeCodeblockClassName(node, `language-${language}`);

  editor.setDirty(false); // Force not dirty state
}

function changeCodeblockClassName(node, className) {
  node.className = "";
  node.classList.add("hljs");
  node.classList.add(className);
}

/**
 *
 * @param {Element} node
 */
function getLanguageFromClassList(node) {
  let lang = undefined;
  const classes = Array.from(node.classList.values());
  for (let i = 0; i < classes.length; ++i) {
    const className = classes[i];
    if (className === "brush:") {
      lang = classes[i + 1];
    } else if (className.startsWith("brush:")) {
      lang = className.split(":")[1];
    } else if (
      className.startsWith("lang-") ||
      className.startsWith("language-")
    ) {
      lang = className.split("-")[1];
    }
  }

  if (!lang) return;
  const language = languages.find(
    (l) => l.shortname === lang || (l.aliases && l.aliases.indexOf(lang) > -1)
  );
  return language ? language.shortname : undefined;
}

async function refreshHighlighting(editor) {
  const language = parseCodeblockLanguage(state.activeBlock);
  await applyHighlighting(editor, language);
}

const loadedLanguages = {};
async function loadLanguage(editor, shortName) {
  if (loadedLanguages[shortName]) return hljs.getLanguage(shortName);

  const url = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/languages/${shortName}.min.js`;
  await loadScript(editor, url);

  const lang = hljs.getLanguage(shortName);
  loadedLanguages[shortName] = lang;
}

function loadScript(editor, url) {
  return new Promise((resolve, reject) => {
    const document = editor.dom.doc;
    const script = document.createElement("script");
    script.src = url;
    // Append to the `head` element
    document.head.appendChild(script);
    script.addEventListener("load", () => {
      resolve();
    });
    script.addEventListener("error", (error) => {
      console.error(error);
      reject(`Could not load script at url ${url}.`);
    });
  });
}

module.exports = {
  addCodeBlockToolbar,
  refreshHighlighting,
  getLanguageFromClassList,
};

function copyToClipboard(text, html) {
  return navigator.clipboard.write([
    new ClipboardItem({
      "text/plain": new Blob([text], { type: "text/plain" }),
      "text/html": new Blob([html], { type: "text/html" }),
    }),
  ]);
}
