import fs from "@react-native-gpui/fs";
import { attachmentFiles, databaseHost, files } from "@platform";
import { db } from "../common/db";

export type AttachmentBench = {
  apiHost: string;
  sourcePath: string;
  size: number;
  hash: string;
  outputPath: string;
  statusPath: string;
};

const CHUNK_SIZE = 512 * 1024;

export async function runAttachmentBench(options: AttachmentBench) {
  const { apiHost, sourcePath, size, hash, outputPath, statusPath } = options;
  const status = (phase: string, extra: Record<string, unknown> = {}) =>
    fs.promises.writeFile(
      statusPath,
      new TextEncoder().encode(JSON.stringify({ phase, ...extra }))
    );
  try {
    await status("start");
    await db.tokenManager.saveToken({
      access_token: "e2e-token",
      refresh_token: "e2e-refresh",
      scope: "notesnook.sync IdentityServerApi",
      expires_in: 3600,
      token_type: "Bearer"
    } as Parameters<typeof db.tokenManager.saveToken>[0]);
    const key = await (
      await databaseHost.createStorage("db")
    ).generateCryptoKey("attachment-bench");
    const attachments = db.attachments as unknown as {
      _getEncryptionKey: () => Promise<unknown>;
    };
    attachments._getEncryptionKey = async () => key;
    const headers = { Authorization: "Bearer e2e-token" };
    const url = `${apiHost}/s3?name=${hash}`;
    const type = "application/octet-stream";

    await status("encrypt");
    const meta = await attachmentFiles.writeEncryptedFile(
      {
        name: "bench.bin",
        type,
        size,
        uri: `file://${sourcePath}`,
        text: async () => "",
        bytes: async () => new Uint8Array(0)
      },
      key,
      hash
    );
    await db.attachments.add({
      hash,
      hashType: "xxh64",
      filename: "bench.bin",
      mimeType: type,
      size,
      iv: meta.iv,
      salt: meta.salt,
      alg: meta.alg,
      chunkSize: meta.chunkSize,
      key
    });

    await status("upload");
    const uploaded = await attachmentFiles.storage
      .uploadFile(hash, { url, headers, chunkSize: CHUNK_SIZE })
      .execute();
    if (!uploaded) throw new Error("upload failed");

    await attachmentFiles.storage.deleteFile(hash);

    await status("download");
    const downloaded = await attachmentFiles.storage
      .downloadFile(hash, { url, headers, chunkSize: CHUNK_SIZE })
      .execute();
    if (!downloaded) throw new Error("download failed");

    await status("open");
    const stream = await attachmentFiles.streamingDecryptFile(hash, {
      key,
      iv: meta.iv,
      name: "bench.bin",
      type,
      isUploaded: true
    });
    if (!stream) throw new Error("decrypt failed");
    const target = await files.createAt(outputPath);
    const reader = stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      await target.write(value);
    }
    await target.close();
    await status("done");
  } catch (e) {
    await status("error", {
      message: e instanceof Error ? e.message : String(e)
    });
  }
}
