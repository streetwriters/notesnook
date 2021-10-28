import Compressor from "compressorjs";
import { AppEventManager, AppEvents } from "../../../common";
import { db } from "../../../common/db";
import { showProgressDialog } from "../../../common/dialog-controller";
import fs from "../../../interfaces/fs";
import { formatBytes } from "../../../utils/filename";
import { showToast } from "../../../utils/toast";

const FILE_SIZE_LIMIT = 500 * 1024 * 1024;
const IMAGE_SIZE_LIMIT = 50 * 1024 * 1024;

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
  try {
    const selectedFile = await showFilePicker({ acceptedFileTypes: "*/*" });
    if (selectedFile.size > FILE_SIZE_LIMIT)
      throw new Error("File too big. You cannot add files over 500 MB.");
    if (!selectedFile) return;

    const result = await showProgressDialog({
      title: `Encrypting attachment`,
      subtitle: "Please wait while we encrypt this attachment for upload.",
      message: selectedFile.name,
      total: formatBytes(selectedFile.size, 0),
      setProgress: (set) => {
        const event = AppEventManager.subscribe(
          AppEvents.UPDATE_ATTACHMENT_PROGRESS,
          ({ type, total, loaded }) => {
            if (type !== "encrypt") return;

            const percent = Math.round((loaded / total) * 100);
            set({ loaded: formatBytes(loaded, 0), progress: percent });
          }
        );
        return () => {
          event.unsubscribe();
        };
      },
      action: async () => {
        const key = await getEncryptionKey();

        const reader = selectedFile.stream().getReader();
        const { hash, type: hashType } = await fs.hashStream(reader);
        reader.releaseLock();

        let output = {};
        if (!db.attachments.exists(hash)) {
          output = await fs.writeEncryptedFile(selectedFile, key, hash);
        }

        await db.attachments.add({
          ...output,
          hash,
          hashType,
          filename: selectedFile.name,
          type: selectedFile.type,
          key,
        });

        return {
          hash: hash,
          filename: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
        };
      },
    });
    if (result instanceof Error) throw result;
    return result;
  } catch (e) {
    showToast("error", `${e.message}`);
  }
}

async function pickImage() {
  try {
    const selectedImage = await showFilePicker({
      acceptedFileTypes: "image/*",
    });
    if (!selectedImage) return;

    const key = await getEncryptionKey();

    const { dataurl, blob } = await compressImage(selectedImage, "buffer");

    const reader = blob.stream().getReader();
    const { hash, type: hashType } = await fs.hashStream(reader);
    reader.releaseLock();

    var output = {};
    if (!db.attachments.exists(hash)) {
      output = await fs.writeEncryptedFile(blob, key, hash);
    }

    await db.attachments.add({
      ...output,
      key,
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
  } catch (e) {
    showToast("error", e.message);
  }
}

async function getEncryptionKey() {
  const key = await db.attachments.generateKey();
  if (!key) throw new Error("Could not generate a new encryption key.");
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
 * @returns {Promise<Blob>}
 */
function compressImage(file, type) {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.8,
      mimeType: file.type,
      maxWidth: 4000,
      maxHeight: 4000,
      /**
       *
       * @param {Blob} result
       */
      async success(result) {
        if (result.size > IMAGE_SIZE_LIMIT)
          reject("Image too big. You cannot add images over 50 MB.");

        const buffer = await result.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        resolve({
          dataurl: `data:${file.type};base64,${base64}`,
          blob: result,
        });
      },
      error(err) {
        reject(err);
      },
    });
  });
}
