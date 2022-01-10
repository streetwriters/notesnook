const { addPluginToPluginManager } = require("../utils");
const { QUERY, ATTRIBUTES } = require("./filters");

function register(editor) {
  /**
   * This is basically .innerHTML but we have to resolve/remove the
   * blob urls.
   * TinyMCE getContent is extremely slow. We have to circumvent it and
   * use the Browser's native DOMParser.
   */
  editor.getHTML = async function() {
    const body = editor.getBody();
    if (!body) return;

    const document = body.cloneNode(true);

    const elements = document.querySelectorAll(QUERY);
    for (let element of elements) {
      sanitizeElement(element);
      switch (element.nodeName) {
        case "IMG": {
          const image = element;

          if (image.hasAttribute("data-hash")) {
            image.removeAttribute("src");
            continue;
          }
          if (!image.src.startsWith("blob:")) continue;

          try {
            const datauri = await blobUriToDataUri(image.src);
            image.src = datauri;
          } catch (e) {
            console.error(e);
            image.remove();
            continue;
          }
        }
      }
    }
    return document.innerHTML;
  };

  editor.getText = function() {
    const body = editor.getBody();
    if (!body) return;

    return body.innerText;
  };

  editor.countWords = function() {
    const text = editor.getText();
    if (!text) return;
    return countWords(text);
  };

  editor.setHTML = function(html) {
    editorSetContent(editor, html, true);
  };

  editor.clearContent = function() {
    editorSetContent(editor, "<p><br></p>", false);
  };
}

(function init() {
  addPluginToPluginManager("contenthandler", register);
})();

function blobUriToDataUri(uri) {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function() {
      resolve(reader.result);
    };
    reader.onerror = reject;
    await fetch(uri)
      .then((r) => r.blob())
      .then((blobFile) => reader.readAsDataURL(blobFile));
  });
}

function countWords(str) {
  let count = 0;
  let shouldCount = false;

  for (var i = 0; i < str.length; ++i) {
    const s = str[i];

    if (s === " " || s === "\r" || s === "\n" || s === "*") {
      if (!shouldCount) continue;
      ++count;
      shouldCount = false;
    } else {
      shouldCount = true;
    }
  }

  if (shouldCount) ++count;
  return count;
}

/**
 *
 * @param {HTMLElement} element
 */
function sanitizeElement(element) {
  for (let attr of element.attributes) {
    if (ATTRIBUTES.strip.indexOf(attr.name) > -1)
      element.removeAttribute(attr.name);
    else if (ATTRIBUTES.elementDelete.indexOf(attr.name) > -1) {
      element.remove();
    }
  }
}

function editorSetContent(editor, content, removePlaceholder = true) {
  const body = editor.getBody();
  if (!body) return;

  body.innerHTML = "";

  if (removePlaceholder) {
    body.removeAttribute("data-mce-placeholder");
    body.removeAttribute("aria-placeholder");
  } else {
    body.setAttribute("data-mce-placeholder", editor.settings.placeholder);
    body.setAttribute("aria-placeholder", editor.settings.placeholder);
  }

  // perf: directly set the HTML content without any parsing or anything.
  // We probably should pass untrusted content here — so it is up to the
  // client code to ensure the HTML is clean.
  body.innerHTML = content;

  editor.undoManager.reset();
  editor.undoManager.clear();
  editor.setDirty(false);

  editor.focus();
}
