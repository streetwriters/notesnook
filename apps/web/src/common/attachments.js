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

import FS from "../interfaces/fs";
import { db } from "./db";

export async function downloadAttachment(hash) {
  const attachment = db.attachments.attachment(hash);
  if (!attachment) return;
  const downloadResult = await db.fs.downloadFile(
    attachment.metadata.hash,
    attachment.metadata.hash,
    attachment.chunkSize,
    attachment.metadata
  );
  if (!downloadResult) throw new Error("Failed to download file.");

  const key = await db.attachments.decryptKey(attachment.key);
  if (!key) throw new Error("Invalid key for attachment.");

  await FS.saveFile(attachment.metadata.hash, {
    key,
    iv: attachment.iv,
    name: attachment.metadata.filename,
    type: attachment.metadata.type,
    isUploaded: !!attachment.dateUploaded
  });
}

export async function downloadAttachmentForPreview(hash) {
  const attachment = db.attachments.attachment(hash);
  if (!attachment) return;
  const downloadResult = await db.fs.downloadFile(
    attachment.metadata.hash,
    attachment.metadata.hash,
    attachment.chunkSize,
    attachment.metadata
  );
  if (!downloadResult) throw new Error("Failed to download file.");

  const key = await db.attachments.decryptKey(attachment.key);
  if (!key) throw new Error("Invalid key for attachment.");

  return await FS.decryptFile(attachment.metadata.hash, {
    key,
    iv: attachment.iv,
    name: attachment.metadata.filename,
    type: attachment.metadata.type,
    isUploaded: !!attachment.dateUploaded
  });
}

export async function checkAttachment(hash) {
  const attachment = db.attachments.attachment(hash);
  if (!attachment) return { failed: "Attachment not found." };

  try {
    const size = await FS.getUploadedFileSize(hash);
    if (size <= 0) return { failed: "File length is 0." };
  } catch (e) {
    return { failed: e.message };
  }
  return { success: true };
}

const ABYTES = 17;
export function getTotalSize(attachments) {
  let size = 0;
  for (let attachment of attachments) {
    size += attachment.length + ABYTES;
  }
  return size;
}
