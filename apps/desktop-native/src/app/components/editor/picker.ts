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

import { crypto, type PickedFile } from "@platform";
import type { SerializedKey } from "@notesnook/crypto";
import { strings } from "@notesnook/intl";
import { db } from "../../common/db";
import { checkFeature } from "../../common";
import { getUploadedFileSize, writeEncryptedFile } from "../../common/fs";
import { showToast } from "../../utils/toast";
import { showFilePicker } from "../../utils/file-picker";
import { AttachFilesDialog } from "../../dialogs/attach-files-dialog";

class TaskQueue {
  private running = 0;
  private pending: (() => Promise<void>)[] = [];
  private idle: (() => void)[] = [];
  constructor(private readonly concurrency: number) {}

  add(task: () => Promise<void>) {
    this.pending.push(task);
    this.next();
  }

  private next() {
    while (this.running < this.concurrency && this.pending.length) {
      const task = this.pending.shift() as () => Promise<void>;
      this.running++;
      task()
        .catch(() => undefined)
        .finally(() => {
          this.running--;
          this.next();
        });
    }
    if (!this.running && !this.pending.length) {
      this.idle.forEach((resolve) => resolve());
      this.idle = [];
    }
  }

  onIdle() {
    if (!this.running && !this.pending.length) return Promise.resolve();
    return new Promise<void>((resolve) => this.idle.push(resolve));
  }
}

export type Attachment = {
  type: "image" | "file" | "web-clip";
  filename: string;
  hash: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
};

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

  if (
    !(await checkFeature("fileSize", {
      value: selectedFile.size
    }))
  ) {
    return;
  }

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
  | { type: "encrypting"; index: number }
  | {
      type: "done";
      index: number;
      attachment: Attachment | undefined;
    }
  | { type: "error"; index: number; error: string };

export async function attachFiles(
  files: PickedFile[],
  report: (progress: AttachFilesMessage) => void,
  skipSpecialImageHandling = false
) {
  const queue = new TaskQueue(8);
  for (let i = 0; i < files.length; i++) {
    queue.add(async () => {
      const file = files[i];

      report({ type: "encrypting", index: i });

      try {
        const allowed = await checkFeature("fileSize", {
          value: file.size,
          type: "toast"
        });
        if (!allowed) {
          throw new Error(strings.fileSizeLimitExceededPleaseUpgrade());
        }

        const attachment =
          !skipSpecialImageHandling && file.type.startsWith("image/")
            ? await pickImage(file)
            : await pickFile(file);

        report({ type: "done", index: i, attachment: attachment || undefined });
      } catch (e) {
        report({ type: "error", index: i, error: (e as Error).message });
      }
    });
  }
  await queue.onIdle();
}

async function pickFile(
  file: PickedFile,
  options?: AddAttachmentOptions
): Promise<Attachment | undefined> {
  try {
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

async function pickImage(
  file: PickedFile,
  options?: AddAttachmentOptions
): Promise<Attachment | undefined> {
  try {
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
    console.error(e);
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
  file?: PickedFile;
};

type AddAttachmentOptions = {
  expectedFileHash?: string;
  forceWrite?: boolean;
};

async function addAttachment(
  file: PickedFile,
  options: AddAttachmentOptions = {}
): Promise<string> {
  const { expectedFileHash } = options;
  let forceWrite = options.forceWrite;

  const hash = await crypto.xxh64(await file.bytes());
  const hashType = "xxh64";

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
      mimeType: exists?.mimeType || file.type,
      key
    });
  }

  return hash;
}

function getImageDimensions(_file: PickedFile) {
  return Promise.resolve<{ width: number; height: number } | undefined>(
    undefined
  );
}
