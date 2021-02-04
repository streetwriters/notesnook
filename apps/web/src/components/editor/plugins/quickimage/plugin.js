import tinymce from "tinymce/tinymce";

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
        var reader = new FileReader();
        reader.onload = function (e) {
          console.log(e, reader);
          minifyImg(
            reader.result,
            600,
            (r) => {
              console.log(r);
              var content = `<img src="${r}">`;
              editor.insertContent(content);
              reader.onerror = null;
            },
            1
          );

          reader.onerror = function () {
            reader.onerror = null;
          };
        };
        reader.readAsDataURL(file);
      };
      input.dispatchEvent(new MouseEvent("click"));
    }

    editor.ui.registry.addButton("image", {
      icon: "image",
      tooltip: "Insert image",
      onAction: _onAction,
    });

    var minifyImg = function (dataUrl, newWidth, resolve, quality) {
      var image, oldWidth, oldHeight, newHeight, canvas, ctx, newDataUrl;
      new Promise(function (resolve) {
        image = new Image();
        image.src = dataUrl;
        resolve();
      }).then(() => {
        oldWidth = image.width;
        oldHeight = image.height;

        newHeight = Math.floor((oldHeight / oldWidth) * newWidth);

        canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0, newWidth, newHeight);
        newDataUrl = canvas.toDataURL(undefined, quality);
        resolve(newDataUrl);
      });
    };

    editor.addCommand("InsertImage", function (ui, value) {
      _onAction();
    });
  });
})();
