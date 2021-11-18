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
  });
}
