const { addPluginToPluginManager } = require("../utils");

function register(editor) {
  /**
   * This is basically .innerHTML but we have to resolve/remove the
   * blob urls.
   * TinyMCE getContent is extremely slow. We have to circumvent it and
   * use the Browser's native DOMParser.
   */
  editor.getHTML = async function () {
    const html = editor.getBody().innerHTML;
    const document = new DOMParser().parseFromString(html, "text/html");
    const elements = document.querySelectorAll("img[src],[data-mce-bogus]");
    for (let element of elements) {
      switch (element.nodeName) {
        case "IMG": {
          const image = element;

          if (image.hasAttribute("data-hash")) {
            image.removeAttribute("src");
            continue;
          }
          if (!image.src.startsWith("blob:")) continue;

          const datauri = await blobUriToDataUri(image.src);
          image.src = datauri;
        }
        default: {
          if (element.hasAttribute("data-mce-bogus")) element.remove();
        }
      }
    }
    return document.body.innerHTML;
  };

  editor.getText = function () {
    return editor.getBody().innerText;
  };

  editor.countWords = function () {
    const text = editor.getBody().innerText;
    return countWords(text);
  };
}

(function init() {
  addPluginToPluginManager("contenthandler", register);
})();

function blobUriToDataUri(uri) {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      blobCache[uri] = reader.result;
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
