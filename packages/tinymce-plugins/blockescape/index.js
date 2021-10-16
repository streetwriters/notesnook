const { addPluginToPluginManager } = require("../utils");

function register(editor) {
  editor.on("NewBlock", (e) => {
    const element = e.newBlock;
    if (element && element.parentElement.tagName === "BLOCKQUOTE") {
      editor.execCommand("mceToggleFormat", false, "blockquote");
    }
  });
}

(function init() {
  addPluginToPluginManager("blockescape", register);
})();
