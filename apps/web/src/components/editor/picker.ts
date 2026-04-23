/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { SerializedKey } from "@notesnook/crypto";
import { db } from "../../common/db";
import { showToast } from "../../utils/toast";
import { showFilePicker } from "../../utils/file-picker";
import { Attachment } from "@notesnook/editor";
import {
  getUploadedFileSize,
  hashStream,
  writeEncryptedFile
} from "../../interfaces/fs";
import { compressImage, FileWithURI } from "../../utils/image-compressor";
import { checkFeature } from "../../common";
import { AttachFilesDialog } from "../../dialogs/attach-files-dialog";

export async function insertAttachments(
  type: string,
  onDone: (attachments: Attachment[]) => void
): Promise<void> {
  const files = await showFilePicker({
    acceptedFileTypes: type || "*/*",
    multiple: true
  });
  if (!files || files.length === 0) return;

  await AttachFilesDialog.show({
    files,
    skipSpecialImageHandling: type === "*/*",
    onDone
  });
}

export async function reuploadAttachment(
  type: string,
  expectedFileHash: string
) {
  const [selectedFile] = await showFilePicker({
    acceptedFileTypes: type || "*/*"
  });
  if (!selectedFile) return;

  const options: AddAttachmentOptions = {
    expectedFileHash,
    forceWrite: true
  };

  if (selectedFile.type.startsWith("image/")) {
    const image = await pickImage(selectedFile, options);
    if (!image) return;
  } else {
    const file = await pickFile(selectedFile, options);
    if (!file) return;
  }
}

type AttachFilesMessage =
  | { type: "compressing"; index: number }
  | { type: "encrypting"; index: number }
  | {
      type: "done";
      index: number;
      attachment: Attachment | undefined;
    }
  | { type: "error"; index: number; error: string };

export async function* attachFiles(
  files: File[],
  shouldCompress: boolean[],
  skipSpecialImageHandling = false
): AsyncGenerator<AttachFilesMessage> {
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    const shouldCompressFile = shouldCompress[i];

    if (shouldCompressFile) {
      yield { type: "compressing", index: i };
      try {
        const compressed = await compressImage(file, {
          maxWidth: (naturalWidth) => Math.min(1920, naturalWidth * 0.7),
          width: (naturalWidth) => naturalWidth,
          height: (_, naturalHeight) => naturalHeight,
          resize: "contain",
          quality: 0.7
        });
        file = new FileWithURI([compressed], file.name, {
          lastModified: file.lastModified,
          type: file.type
        });
      } catch (e) {
        yield {
          type: "error",
          index: i,
          error: (e as Error).message || "Compression failed"
        };
        continue;
      }
    }

    yield { type: "encrypting", index: i };

    try {
      const attachment =
        !skipSpecialImageHandling && file.type.startsWith("image/")
          ? await pickImage(file)
          : await pickFile(file);

      yield { type: "done", index: i, attachment: attachment || undefined };
    } catch (e) {
      yield { type: "error", index: i, error: (e as Error).message };
    }
  }
}

/**
 * @param {File} file
 * @returns
 */
async function pickFile(
  file: File,
  options?: AddAttachmentOptions
): Promise<Attachment | undefined> {
  try {
    if (!(await checkFeature("fileSize", { value: file.size }))) return;

    const hash = await addAttachment(file, options);
    return {
      type: "file",
      filename: file.name,
      hash,
      mime: file.type,
      size: file.size
    };
  } catch (e) {
    console.error(e);
    showToast("error", `${(e as Error).message}`);
  }
}

/**
 * @param {File} file
 * @returns
 */
async function pickImage(
  file: File,
  options?: AddAttachmentOptions
): Promise<Attachment | undefined> {
  try {
    if (!(await checkFeature("fileSize", { value: file.size }))) return;

    const hash = await addAttachment(file, options);
    const dimensions = await getImageDimensions(file);
    return {
      type: "image",
      filename: file.name,
      hash,
      mime: file.type,
      size: file.size,
      ...dimensions
    };
  } catch (e) {
    showToast("error", (e as Error).message);
  }
}

async function getEncryptionKey(): Promise<SerializedKey> {
  const key = await db.attachments.generateKey();
  if (!key) throw new Error("Could not generate a new encryption key.");
  return key;
}

export type AttachmentProgress = {
  hash: string;
  type: "encrypt" | "download" | "upload";
  total: number;
  loaded: number;
};

type AddAttachmentOptions = {
  expectedFileHash?: string;
  forceWrite?: boolean;
};

async function addAttachment(
  file: File,
  options: AddAttachmentOptions = {}
): Promise<string> {
  const { expectedFileHash } = options;
  let forceWrite = options.forceWrite;

  const reader = file.stream().getReader();
  const { hash, type: hashType } = await hashStream(reader);
  reader.releaseLock();

  if (expectedFileHash && hash !== expectedFileHash)
    throw new Error(
      `Please select the same file for reuploading. Expected hash ${expectedFileHash} but got ${hash}.`
    );

  const exists = await db.attachments.attachment(hash);
  if (!forceWrite && exists) {
    forceWrite = (await getUploadedFileSize(hash)) === 0;
  }

  if (forceWrite || !exists) {
    if (forceWrite && exists) {
      if (!(await db.fs().deleteFile(hash, false)))
        throw new Error("Failed to delete attachment from server.");
      await db.attachments.reset(exists.id);
    }

    const key: SerializedKey = await getEncryptionKey();

    const output = await writeEncryptedFile(file, key, hash);
    if (!output) throw new Error("Could not encrypt file.");

    await db.attachments.add({
      ...output,
      hash,
      hashType,
      filename: exists?.filename || file.name,
      mimeType: exists?.type || file.type,
      key
    });
  }

  return hash;
}

function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number } | undefined>(
    (resolve) => {
      const img = new Image();
      img.onload = () => {
        const { naturalWidth: width, naturalHeight: height } = img;
        resolve({ width, height });
      };
      img.onerror = () => {
        resolve(undefined);
      };
      img.src = URL.createObjectURL(file);
    }
  );
}
