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

import { strings } from "@notesnook/intl";
import { logger } from "../utils/logger";
import { showToast } from "../utils/toast";
import { db } from "./db";
import { checkUpload, decryptFile, saveFile } from "../interfaces/fs";

async function download(hash: string, groupId?: string) {
  const attachment = await db.attachments.attachment(hash);
  if (!attachment) {
    logger.debug("could not find attachment for download", { hash, groupId });
    return;
  }
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
  try {
    const response = await download(hash);
    if (!response) return;

    const { attachment, key } = response;
    await saveFile(attachment.hash, {
      key,
      iv: attachment.iv,
      name: attachment.filename,
      type: attachment.mimeType,
      isUploaded: !!attachment.dateUploaded
    });
  } catch (e) {
    console.error(e);
    showToast(
      "error",
      `${strings.attachmentsDownloadFailed(1)}: ${hash} (error: ${
        (e as Error).message
      })`
    );
  }
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
  logger.debug("downloading attachment", { hash, type, groupId });
  try {
    const response = await download(hash, groupId);
    if (!response) return;
    const { attachment, key } = response;

    if (type === "base64" || type === "text")
      return (await db.attachments.read(hash, type)) as TOutputType;

    const blob = await decryptFile(attachment.hash, {
      key,
      iv: attachment.iv,
      name: attachment.filename,
      type: attachment.mimeType,
      isUploaded: !!attachment.dateUploaded
    });

    logger.debug("Attachment decrypted", { hash });

    if (!blob) return;
    return blob as TOutputType;
  } catch (e) {
    console.error(e);
    showToast(
      "error",
      `${strings.attachmentsDownloadFailed(1)}: ${hash} (error: ${
        (e as Error).message
      })`
    );
  }
}

export async function checkAttachment(hash: string) {
  const attachment = await db.attachments.attachment(hash);
  if (!attachment) return { failed: "Attachment not found." };

  try {
    await checkUpload(hash, attachment.chunkSize, attachment.size);
    await db.attachments.markAsFailed(attachment.id);
  } catch (e) {
    const reason = e instanceof Error ? e.message : "Unknown error.";
    await db.attachments.markAsFailed(attachment.id, reason);
    return { failed: reason };
  }
  return { success: true };
}
