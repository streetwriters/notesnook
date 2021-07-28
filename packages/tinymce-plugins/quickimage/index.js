const { addPluginToPluginManager } = require("../utils");

function register(editor) {
  editor.ui.registry.addButton("image", {
    icon: "image",
    tooltip: "Insert image",
    onAction: () => insertImage(editor),
  });

  editor.addCommand("InsertImage", function () {
    insertImage(editor);
  });
}

function insertImage(editor) {
  var input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("accept", "image/*");
  input.onchange = function () {
    var file = this.files[0];
    if (!file) return null;

    new Compressor(file, {
      quality: 0.6,
      mimeType: "image/jpeg",
      width: 1024,
      success(result) {
        var reader = new FileReader();
        reader.readAsDataURL(result);

        reader.onloadend = function () {
          var base64data = reader.result;
          var content = `<img src="${base64data}"/>`;
          editor.insertContent(content);
        };
      },
      error(err) {
        console.error(err.message);
      },
    });
  };
  input.dispatchEvent(new MouseEvent("click"));
}

(function init() {
  addPluginToPluginManager("quickimage", register);
})();
