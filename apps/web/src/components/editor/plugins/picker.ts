import { SerializedKey } from "@notesnook/crypto/dist/src/types";
import Compressor from "compressorjs";
import { AppEventManager, AppEvents } from "../../../common/app-events";
import { db } from "../../../common/db";
import { showBuyDialog } from "../../../common/dialog-controller";
import { TaskManager } from "../../../common/task-manager";
import { isUserPremium } from "../../../hooks/use-is-user-premium";
import fs from "../../../interfaces/fs";
import { showToast } from "../../../utils/toast";

const FILE_SIZE_LIMIT = 500 * 1024 * 1024;
const IMAGE_SIZE_LIMIT = 50 * 1024 * 1024;

type MimeType = string; //`${string}/${string}`;

export async function insertAttachment(type: MimeType = "*/*") {
  if (!isUserPremium()) {
    await showBuyDialog();
    return;
  }

  const selectedFile = await showFilePicker({
    acceptedFileTypes: type || "*/*",
  });
  if (!selectedFile) return;

  return await attachFile(selectedFile);
}

export async function attachFile(selectedFile: File) {
  if (!isUserPremium()) {
    await showBuyDialog();
    return;
  }
  if (selectedFile.type.startsWith("image/")) {
    return await pickImage(selectedFile);
  } else {
    return await pickFile(selectedFile);
  }
}

export async function reuploadAttachment(
  type: MimeType,
  expectedFileHash: string
) {
  const selectedFile = await showFilePicker({
    acceptedFileTypes: type || "*/*",
  });
  if (!selectedFile) return;

  const options: AddAttachmentOptions = {
    expectedFileHash,
    showProgress: false,
    forceWrite: true,
  };

  if (selectedFile.type.startsWith("image/")) {
    const image = await pickImage(selectedFile, options);
    if (!image) return;
  } else {
    const file = await pickFile(selectedFile, options);
    if (!file) return;
  }
}

/**
 * @param {File} selectedFile
 * @returns
 */
async function pickFile(selectedFile: File, options?: AddAttachmentOptions) {
  try {
    if (selectedFile.size > FILE_SIZE_LIMIT)
      throw new Error("File too big. You cannot add files over 500 MB.");
    if (!selectedFile) return;

    return await addAttachment(selectedFile, undefined, options);
  } catch (e) {
    showToast("error", `${(e as Error).message}`);
  }
}

/**
 * @param {File} selectedImage
 * @returns
 */
async function pickImage(selectedImage: File, options?: AddAttachmentOptions) {
  try {
    if (selectedImage.size > IMAGE_SIZE_LIMIT)
      throw new Error("Image too big. You cannot add images over 50 MB.");
    if (!selectedImage) return;

    const { dataurl, file } = await compressImage(selectedImage);
    return await addAttachment(file, dataurl, options);
  } catch (e) {
    showToast("error", (e as Error).message);
  }
}

async function getEncryptionKey(): Promise<SerializedKey> {
  const key = await db.attachments!.generateKey();
  if (!key) throw new Error("Could not generate a new encryption key.");
  return key;
}

type FilePickerOptions = { acceptedFileTypes: MimeType };

export function showFilePicker({
  acceptedFileTypes,
}: FilePickerOptions): Promise<File | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", acceptedFileTypes);
    input.dispatchEvent(new MouseEvent("click"));
    input.onchange = async function () {
      if (!input.files) return resolve(undefined);
      var file = input.files[0];
      if (!file) return resolve(undefined);
      resolve(file);
    };
  });
}

type CompressionResult = { dataurl: string; file: File };
function compressImage(file: File): Promise<CompressionResult> {
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
        const buffer = await result.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        resolve({
          dataurl: `data:${file.type};base64,${base64}`,
          file: new File([result], file.name, {
            lastModified: file.lastModified,
            type: file.type,
          }),
        });
      },
      error(err) {
        reject(err);
      },
    });
  });
}

export type AttachmentProgress = {
  hash: string;
  type: "encrypt" | "download" | "upload";
  total: number;
  loaded: number;
};

export type Attachment = {
  hash: string;
  filename: string;
  type: string;
  size: number;
  dataurl?: string;
};

type AddAttachmentOptions = {
  expectedFileHash?: string;
  showProgress?: boolean;
  forceWrite?: boolean;
};

async function addAttachment(
  file: File,
  dataurl: string | undefined,
  options: AddAttachmentOptions = {}
): Promise<Attachment> {
  const { expectedFileHash, forceWrite, showProgress = true } = options;

  const action = async () => {
    const reader: ReadableStreamReader<Uint8Array> = (
      file.stream() as unknown as ReadableStream<Uint8Array>
    ).getReader();

    const { hash, type: hashType } = await fs.hashStream(reader);
    reader.releaseLock();

    if (expectedFileHash && hash !== expectedFileHash)
      throw new Error(
        `Please select the same file for reuploading. Expected hash ${expectedFileHash} but got ${hash}.`
      );
    const exists = db.attachments!.exists(hash);
    if (forceWrite || !exists) {
      let key: SerializedKey = await getEncryptionKey();

      const output = await fs.writeEncryptedFile(file, key, hash);
      if (!output) throw new Error("Could not encrypt file.");

      if (forceWrite && exists) await db.attachments?.reset(hash);
      await db.attachments!.add({
        ...output,
        hash,
        hashType,
        filename: file.name,
        type: file.type,
        key,
      });
    }

    return {
      hash: hash,
      filename: file.name,
      type: file.type,
      size: file.size,
      dataurl,
    };
  };

  const result = showProgress
    ? await withProgress(file, action)
    : await action();

  if (result instanceof Error) throw result;
  return result;
}

function withProgress<T>(file: File, action: () => Promise<T>): Promise<T> {
  return TaskManager.startTask({
    type: "modal",
    title: "Encrypting attachment",
    subtitle: "Please wait while we encrypt this attachment for upload.",
    action: (report) => {
      const event = AppEventManager.subscribe(
        AppEvents.UPDATE_ATTACHMENT_PROGRESS,
        ({ type, total, loaded }: AttachmentProgress) => {
          if (type !== "encrypt") return;
          report({
            current: loaded,
            total: total,
            text: file.name,
          });
        }
      );
      event.unsubscribe();
      return action();
    },
  });
}
