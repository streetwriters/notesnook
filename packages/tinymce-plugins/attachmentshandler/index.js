function register(editor) {
  editor.addCommand("mceAttachImage", function (image) {
    insertImage(editor, image);
  });

  editor.addCommand("mceAttachFile", function (file) {
    insertFile(editor, file);
  });

  editor.addCommand("mceReplaceImage", function (image) {
    const { hash, src } = image;
    const element = document.querySelector(`img[data-hash="${hash}"]`);
    if (!element || !src || !hash) return;
    element.setAttribute("src", src);
  });

  editor.addCommand("mceUpdateAttachmentProgress", function (progressState) {
    const { hash, total, loaded } = progressState;
    const element = document.querySelector(
      `span.attachment[data-hash="${hash}"]`
    );
    if (!element || !total || !loaded) return;
    if (total === loaded) {
      element.removeAttribute("data-progress");
      element.style.removeProperty("--progress");
    } else {
      const percent = Math.round((loaded / total) * 100);
      element.setAttribute("data-progress", `${percent}%`);
      element.style.setProperty("--progress", `${percent}%`);
    }
  });
}

async function insertImage(editor, image) {
  var content = `
    <img class="attachment"
        alt="${image.filename || image.hash}"
        data-mime="${image.type}"
        data-hash="${image.hash}"
        data-filename="${image.filename}"
        src="${image.dataurl}"
        data-size="${image.size}"
        style="float: left;"/>`;
  editor.insertContent(content);
}

async function insertFile(editor, file) {
  var content = `
      <span
          class="attachment"
          contenteditable="false"
          title="${file.filename}"
          data-mime="${file.type}"
          data-filename="${file.filename}"
          data-hash="${file.hash}"
          data-size="${formatBytes(file.size, 1)}">
          <em>&nbsp;</em>
          ${file.filename}
      </span>`;
  editor.insertContent(content);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "K", "M", "G", "T", "P", "E", "Z", "Y"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}

(function init() {
  addPluginToPluginManager("attachmentshandler", register);
})();
