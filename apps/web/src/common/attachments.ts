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

import { lazify } from "../utils/lazify";
import { db } from "./db";

async function download(hash: string, groupId?: string) {
  const attachment = await db.attachments.attachment(hash);
  if (!attachment) return;
  const downloadResult = await db
    .fs()
    .downloadFile(
      groupId || attachment.hash,
      attachment.hash,
      attachment.chunkSize
    );
  if (!downloadResult) throw new Error("Failed to download file.");

  const key = await db.attachments.decryptKey(attachment.key);
  if (!key) throw new Error("Invalid key for attachment.");

  return { key, attachment };
}

export async function saveAttachment(hash: string) {
  const response = await download(hash);
  if (!response) return;

  const { attachment, key } = response;
  await lazify(import("../interfaces/fs"), ({ saveFile }) =>
    saveFile(attachment.hash, {
      key,
      iv: attachment.iv,
      name: attachment.filename,
      type: attachment.mimeType,
      isUploaded: !!attachment.dateUploaded
    })
  );
}

type OutputTypeToReturnType = {
  blob: Blob;
  base64: string;
  text: string;
};
export async function downloadAttachment<
  TType extends "blob" | "base64" | "text",
  TOutputType = OutputTypeToReturnType[TType]
>(
  hash: string,
  type: TType,
  groupId?: string
): Promise<TOutputType | undefined> {
  const response = await download(hash, groupId);
  if (!response) return;
  const { attachment, key } = response;

  if (type === "base64" || type === "text")
    return (await db.attachments.read(hash, type)) as TOutputType;

  const blob = await lazify(import("../interfaces/fs"), ({ decryptFile }) =>
    decryptFile(attachment.hash, {
      key,
      iv: attachment.iv,
      name: attachment.filename,
      type: attachment.mimeType,
      isUploaded: !!attachment.dateUploaded
    })
  );

  if (!blob) return;
  return blob as TOutputType;
}

export async function checkAttachment(hash: string) {
  const attachment = db.attachments.attachment(hash);
  if (!attachment) return { failed: "Attachment not found." };

  try {
    const size = await lazify(
      import("../interfaces/fs"),
      ({ getUploadedFileSize }) => getUploadedFileSize(hash)
    );
    if (size <= 0) return { failed: "File length is 0." };
  } catch (e) {
    return { failed: e instanceof Error ? e.message : "Unknown error." };
  }
  return { success: true };
}
