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
    isUploaded: !!attachment.dateUploaded,
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
