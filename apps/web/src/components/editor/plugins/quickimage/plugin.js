import tinymce from "tinymce/tinymce";
import Compressor from "compressorjs";

(function () {
  tinymce.PluginManager.add("quickimage", function (editor, url) {
    /**
     * Plugin behaviour for when the Toolbar or Menu item is selected
     *
     * @private
     */
    function _onAction() {
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

    editor.ui.registry.addButton("image", {
      icon: "image",
      tooltip: "Insert image",
      onAction: _onAction,
    });

    editor.addCommand("InsertImage", function (ui, value) {
      _onAction();
    });
  });
})();
