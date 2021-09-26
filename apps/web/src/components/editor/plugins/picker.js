import Compressor from "compressorjs";
import { db } from "../../../common/db";
import fs from "../../../interfaces/fs";

function register(editor) {
  editor.ui.registry.addButton("attachment", {
    icon: "attachment",
    tooltip: "Attach a file",
    onAction: () => insertFile(editor),
  });

  editor.ui.registry.addButton("image", {
    icon: "image",
    tooltip: "Insert image",
    onAction: () => insertImage(editor),
  });
}

async function insertImage(editor) {
  const image = await pickImage();
  if (!image) return;
  editor.execCommand("mceAttachImage", image);
}

async function insertFile(editor) {
  const file = await pickFile();
  if (!file) return;
  editor.execCommand("mceAttachFile", file);
}

(function init() {
  global.tinymce.PluginManager.add("picker", register);
})();

async function pickFile() {
  const selectedFile = await showFilePicker({ acceptedFileTypes: "*/*" });
  if (!selectedFile) return;

  const key = await getEncryptionKey();
  const buffer = await selectedFile.arrayBuffer();
  const output = await fs.writeEncrypted(null, {
    data: new Uint8Array(buffer),
    type: "buffer",
    key,
  });

  await db.attachments.add({
    ...output,
    filename: selectedFile.name,
    type: selectedFile.type,
  });

  return {
    hash: output.hash,
    filename: selectedFile.name,
    type: selectedFile.type,
    size: selectedFile.size,
  };
}

async function pickImage() {
  const selectedImage = await showFilePicker({ acceptedFileTypes: "image/*" });
  if (!selectedImage) return;

  const { dataurl, buffer } = await compressImage(selectedImage, "buffer");
  const key = await getEncryptionKey();

  const output = await fs.writeEncrypted(null, {
    data: new Uint8Array(buffer),
    type: "buffer",
    key,
  });

  await db.attachments.add({
    ...output,
    filename: selectedImage.name,
    type: selectedImage.type,
  });

  return {
    hash: output.hash,
    filename: selectedImage.name,
    type: selectedImage.type,
    size: selectedImage.length,
    dataurl,
  };
}

async function getEncryptionKey() {
  const key = await db.user.getEncryptionKey();
  if (!key) throw new Error("No encryption key found. Are you logged in?");
  return key; // { password: "helloworld" };
}

/**
 *
 * @returns {Promise<File>}
 */
function showFilePicker({ acceptedFileTypes }) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", acceptedFileTypes);
    input.dispatchEvent(new MouseEvent("click"));
    input.onchange = async function () {
      var file = this.files[0];
      if (!file) return null;
      resolve(file);
    };
  });
}

/**
 *
 * @param {File} file
 * @param {"base64"|"buffer"} type
 */
function compressImage(file, type) {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.8,
      mimeType: file.type,
      maxWidth: 2000,
      maxHeight: 2000,
      /**
       *
       * @param {Blob} result
       */
      async success(result) {
        const buffer = await result.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        resolve({ dataurl: `data:${file.type};base64,${base64}`, buffer });
      },
      error(err) {
        reject(err);
      },
    });
  });
}
