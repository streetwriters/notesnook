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
  const key = await getEncryptionKey();

  const selectedFile = await showFilePicker({ acceptedFileTypes: "*/*" });
  if (!selectedFile) return;

  const generator = fs.writeEncryptedFile(selectedFile, key);

  let { value: output } = await generator.next();
  if (!db.attachments.exists(output.hash)) {
    const { value } = await generator.next();
    output = value;
  }
  console.log(output);
  await db.attachments.add({
    ...output,
    salt: "sda",
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
  const key = await getEncryptionKey();

  const selectedImage = await showFilePicker({ acceptedFileTypes: "image/*" });
  if (!selectedImage) return;

  const { dataurl, buffer } = await compressImage(selectedImage, "buffer");
  const { hash, type: hashType } = await fs.hashBuffer(Buffer.from(buffer));

  const output = db.attachments.exists(hash)
    ? {}
    : await fs.writeEncrypted(null, {
        data: new Uint8Array(buffer),
        type: "buffer",
        key,
        hash,
      });

  await db.attachments.add({
    ...output,
    hash,
    hashType,
    filename: selectedImage.name,
    type: selectedImage.type,
  });

  return {
    hash,
    filename: selectedImage.name,
    type: selectedImage.type,
    size: selectedImage.size,
    dataurl,
  };
}

async function getEncryptionKey() {
  return { password: "helloworld" };
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
 * @returns {{ dataurl: string, buffer: ArrayBuffer }}
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
