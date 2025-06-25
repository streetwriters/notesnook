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
import { AppEventManager, AppEvents } from "../../common/app-events";
import { db } from "../../common/db";
import { TaskManager } from "../../common/task-manager";
import { isUserPremium } from "../../hooks/use-is-user-premium";
import { showToast } from "../../utils/toast";
import { showFilePicker } from "../../utils/file-picker";
import { Attachment } from "@notesnook/editor";
import { ImagePickerDialog } from "../../dialogs/image-picker-dialog";
import { BuyDialog } from "../../dialogs/buy-dialog";
import { strings } from "@notesnook/intl";
import {
  getUploadedFileSize,
  hashStream,
  writeEncryptedFile
} from "../../interfaces/fs";
import Config from "../../utils/config";
import { compressImage, FileWithURI } from "../../utils/image-compressor";
import { ImageCompressionOptions } from "../../stores/setting-store";

const FILE_SIZE_LIMIT = 500 * 1024 * 1024;
const IMAGE_SIZE_LIMIT = 50 * 1024 * 1024;

export async function insertAttachments(type = "*/*") {
  if (!isUserPremium()) {
    await BuyDialog.show({});
    return;
  }

  const files = await showFilePicker({
    acceptedFileTypes: type || "*/*",
    multiple: true
  });
  if (!files) return;
  return await attachFiles(files);
}

export async function attachFiles(files: File[]) {
  if (!isUserPremium()) {
    await BuyDialog.show({});
    return;
  }

  let images = files.filter((f) => f.type.startsWith("image/"));
  const imageCompressionConfig = Config.get<ImageCompressionOptions>(
    "imageCompression",
    ImageCompressionOptions.ASK_EVERY_TIME
  );

  switch (imageCompressionConfig) {
    case ImageCompressionOptions.ENABLE: {
      let compressedImages: FileWithURI[] = [];
      for (const image of images) {
        const compressed = await compressImage(image, {
          maxWidth: (naturalWidth) => Math.min(1920, naturalWidth * 0.7),
          width: (naturalWidth) => naturalWidth,
          height: (_, naturalHeight) => naturalHeight,
          resize: "contain",
          quality: 0.7
        });
        compressedImages.push(
          new FileWithURI([compressed], image.name, {
            lastModified: image.lastModified,
            type: image.type
          })
        );
      }
      images = compressedImages;
      break;
    }
    case ImageCompressionOptions.DISABLE:
      break;
    default:
      images =
        images.length > 0
          ? (await ImagePickerDialog.show({
              images
            })) || []
          : [];
  }

  const documents = files.filter((f) => !f.type.startsWith("image/"));
  const attachments: Attachment[] = [];
  for (const file of [...images, ...documents]) {
    const attachment = file.type.startsWith("image/")
      ? await pickImage(file)
      : await pickFile(file);
    if (!attachment) continue;
    attachments.push(attachment);
  }
  return attachments;
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
    showProgress: false,
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

/**
 * @param {File} file
 * @returns
 */
async function pickFile(
  file: File,
  options?: AddAttachmentOptions
): Promise<Attachment | undefined> {
  try {
    if (file.size > FILE_SIZE_LIMIT)
      throw new Error(strings.fileTooLargeDesc(500));

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
    if (file.size > IMAGE_SIZE_LIMIT)
      throw new Error(strings.imageTooLarge(50));
    if (!file) return;

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
  showProgress?: boolean;
  forceWrite?: boolean;
};

async function addAttachment(
  file: File,
  options: AddAttachmentOptions = {}
): Promise<string> {
  const { expectedFileHash, showProgress = true } = options;
  let forceWrite = options.forceWrite;

  const action = async () => {
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
  };

  const result = showProgress
    ? await withProgress(file, action)
    : await action();

  if (result instanceof Error) throw result;
  return result;
}

function withProgress<T>(
  file: File,
  action: () => Promise<T>
): Promise<T | Error> {
  return TaskManager.startTask({
    type: "modal",
    title: strings.encryptingAttachment(),
    subtitle: strings.encryptingAttachmentDesc(),
    action: (report) => {
      const event = AppEventManager.subscribe(
        AppEvents.UPDATE_ATTACHMENT_PROGRESS,
        ({ type, total, loaded }: AttachmentProgress) => {
          if (type !== "encrypt") return;
          report({
            current: Math.round((loaded / total) * 100),
            total: 100,
            text: file.name
          });
        }
      );
      return action().finally(() => event.unsubscribe());
    }
  });
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
