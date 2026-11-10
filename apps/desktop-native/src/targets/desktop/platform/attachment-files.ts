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

import Sodium from "@ammarahmed/react-native-sodium";
import fs, { download, paths, upload } from "@react-native-gpui/fs";
import { StreamableFS } from "@notesnook/streamable-fs";
import type { FileHandle } from "@notesnook/streamable-fs";
import {
  getFileNameWithExtension,
  hosts,
  type FileEncryptionMetadata,
  type FileEncryptionMetadataWithHash,
  type FileEncryptionMetadataWithOutputType,
  type IFileStorage,
  type Output,
  type RequestOptions
} from "@notesnook/core";
import type { DataFormat, SerializedKey } from "@notesnook/crypto";
import { AppEventManager, AppEvents } from "../../../app/common/app-events";
import type {
  AttachmentFiles,
  FileMetadata,
  PickedFile
} from "../../../platform";
import { crypto } from "./crypto";
import { environment } from "./environment";
import { files } from "./files";
import { createFileStore } from "./attachment-file-store";
import {
  ABYTES,
  CHUNK_SIZE,
  ENCRYPTED_CHUNK_SIZE,
  MINIMUM_MULTIPART_FILE_SIZE,
  UPLOAD_PART_REQUIRED_CHUNKS,
  checkUploadError,
  decryptedLength,
  parseS3Error,
  sodiumCacheDirectory
} from "./attachment-math";

const UPLOAD_CONCURRENCY = 2;

type RequestOptionsWithSignal = RequestOptions & { signal: AbortSignal };

type UploadAdditionalData = {
  uploadedBytes?: number;
  uploadId?: string;
  uploaded?: boolean;
  uploadedChunks?: { PartNumber: number; ETag: string }[];
};

type S3Error = { Code: string; Message: string };

class WrappedError extends Error {
  constructor(readonly message: string, readonly error: unknown) {
    super(message);
  }
}

class HttpError extends Error {
  constructor(readonly status: number, readonly body: string) {
    super(`HTTP ${status}`);
  }
}

async function readIntoBuffer(path: string) {
  const handle = await fs.promises.open(path, "r");
  try {
    const { size } = await handle.stat();
    const buffer = new Uint8Array(size);
    const { bytesRead } = await handle.read(buffer, 0, size, 0);
    return bytesRead === size ? buffer : buffer.slice(0, bytesRead);
  } finally {
    await handle.close();
  }
}

const fsStore = {
  mkdir: (path: string, options: { recursive: boolean }) =>
    fs.promises.mkdir(path, options),
  readFile: readIntoBuffer,
  writeFile: (path: string, data: Uint8Array) =>
    fs.promises.writeFile(path, data),
  readdir: (path: string) => fs.promises.readdir(path),
  stat: (path: string) => fs.promises.stat(path),
  rm: (path: string, options: { recursive: boolean; force: boolean }) =>
    fs.promises.rm(path, options)
};

export const streamablefs = new StreamableFS(
  createFileStore(fsStore, `${paths.appData}/streamable-fs`)
);

async function getDb() {
  return (await import("../../../app/common/db")).db;
}

async function toast(type: "error", message: string) {
  const { showToast } = await import("../../../app/utils/toast");
  showToast(type, message);
}

function randomId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}

function sodiumCache() {
  return sodiumCacheDirectory(
    environment.os === "macOS" || environment.os === "Windows"
      ? environment.os
      : "Linux",
    paths.home
  );
}

function bytesOfBase64(data: string) {
  return new Uint8Array(Buffer.from(data, "base64"));
}

function localPath(uri: string) {
  const path = uri.startsWith("file://") ? uri.slice("file://".length) : uri;
  return decodeURIComponent(path);
}

function reportProgress(
  ev: { total?: number; loaded?: number } | undefined,
  { type, hash, file }: { type: string; hash: string; file?: PickedFile }
) {
  AppEventManager.publish(AppEvents.UPDATE_ATTACHMENT_PROGRESS, {
    type,
    hash,
    file,
    total: ev?.total || 1,
    loaded: ev?.loaded || 1
  });
}

async function removeQuietly(path: string) {
  await fs.promises.rm(path, { force: true }).catch(() => {});
}

async function ingest(
  path: string,
  handle: FileHandle,
  chunkSize: number,
  onProgress?: (loaded: number) => void
) {
  const source = await fs.promises.open(path, "r");
  const writer = handle.writeable.getWriter();
  try {
    let position = 0;
    for (;;) {
      const buffer = new Uint8Array(chunkSize);
      const { bytesRead } = await source.read(buffer, 0, chunkSize, position);
      if (bytesRead === 0) break;
      position += bytesRead;
      await writer.write(
        bytesRead === chunkSize ? buffer : buffer.slice(0, bytesRead)
      );
      onProgress?.(position);
      if (bytesRead < chunkSize) break;
    }
    await writer.close();
  } catch (e) {
    await writer.abort(e).catch(() => {});
    throw e;
  } finally {
    await source.close();
  }
}

async function assemble(handle: FileHandle, path: string) {
  const out = await fs.promises.open(path, "w");
  try {
    for (const chunk of handle.chunks) {
      const data = await handle.readChunk(
        parseInt(chunk.slice(chunk.lastIndexOf("-") + 1))
      );
      if (!data) throw new Error(`No data found for chunk ${chunk}.`);
      await out.write(data);
    }
  } finally {
    await out.close();
  }
}

async function exists(filename: string | FileHandle) {
  const handle =
    typeof filename === "string"
      ? await streamablefs.readFile(filename)
      : filename;
  return (
    !!handle &&
    handle.file.size === (await handle.size()) - handle.chunks.length * ABYTES
  );
}

type DecryptKind = "text" | "base64" | "cache";

async function decryptNative(
  filename: string,
  key: SerializedKey,
  iv: string,
  kind: DecryptKind
) {
  const handle = await streamablefs.readFile(filename);
  if (!handle) return undefined;
  const cacheName = `dec-${randomId()}`;
  const cachePath = `${sodiumCache()}/${cacheName}`;
  await fs.promises.mkdir(sodiumCache(), { recursive: true });
  try {
    await assemble(handle, cachePath);
    const result = await Sodium.decryptFile(
      key,
      { hash: cacheName, iv, salt: key.salt, chunkSize: CHUNK_SIZE },
      kind
    );
    return { result, cacheName };
  } finally {
    await removeQuietly(cachePath);
  }
}

async function decryptToFile(filename: string, key: SerializedKey, iv: string) {
  const decrypted = await decryptNative(filename, key, iv, "cache");
  return decrypted?.result;
}

async function encryptToStore(
  input: { type: "url"; uri: string } | { type: "base64"; data: string },
  key: SerializedKey,
  hash: string,
  size: number,
  type: string
) {
  if (await streamablefs.exists(hash)) await streamablefs.deleteFile(hash);
  const handle = await streamablefs.createFile(hash, size, type);
  AppEventManager.publish(AppEvents.fileEncrypted, {
    hash,
    total: 1,
    current: 0
  });
  await fs.promises.mkdir(sodiumCache(), { recursive: true });
  const cachePath = `${sodiumCache()}/${hash}`;
  try {
    const result = await Sodium.encryptFile(key, {
      uri: "",
      ...input,
      hash
    } as unknown as Parameters<typeof Sodium.encryptFile>[1]);
    await ingest(cachePath, handle, ENCRYPTED_CHUNK_SIZE);
    if (!(await exists(handle))) {
      await handle.delete();
      throw new Error("Failed to encrypt file. Please try again.");
    }
    AppEventManager.publish(AppEvents.fileEncrypted, {
      hash,
      total: 1,
      current: 1
    });
    return { iv: result.iv, salt: result.salt };
  } catch (e) {
    await handle.delete().catch(() => {});
    throw e;
  } finally {
    await removeQuietly(cachePath);
  }
}

async function writeEncryptedFile(
  file: PickedFile,
  key: SerializedKey,
  hash: string
): Promise<FileEncryptionMetadata> {
  let path = file.uri.startsWith("file://") ? localPath(file.uri) : undefined;
  let temp: string | undefined;
  if (!path) {
    temp = `${paths.temp}/attachment-${randomId()}`;
    await fs.promises.writeFile(temp, await file.bytes());
    path = temp;
  }
  try {
    reportProgress(
      { total: file.size, loaded: 0 },
      { type: "encrypt", hash, file }
    );
    const { iv, salt } = await encryptToStore(
      { type: "url", uri: path },
      key,
      hash,
      file.size,
      file.type
    );
    reportProgress(
      { total: file.size, loaded: file.size },
      { type: "encrypt", hash, file }
    );
    return {
      chunkSize: CHUNK_SIZE,
      iv,
      size: file.size,
      salt,
      alg: "xcha-stream"
    };
  } finally {
    if (temp) await removeQuietly(temp);
  }
}

async function hashBase64(data: string) {
  return { hash: await crypto.xxh64(bytesOfBase64(data)), type: "xxh64" };
}

async function writeEncryptedBase64(
  data: string,
  key: SerializedKey,
  mimeType: string
): Promise<FileEncryptionMetadataWithHash> {
  const bytes = bytesOfBase64(data);
  const { hash, type: hashType } = await hashBase64(data);
  const db = await getDb();
  const attachment = await db.attachments.attachment(hash);
  const { iv, salt } = await encryptToStore(
    { type: "base64", data },
    key,
    hash,
    bytes.length,
    attachment?.mimeType || mimeType || "application/octet-stream"
  );
  return {
    chunkSize: CHUNK_SIZE,
    iv,
    size: bytes.length,
    salt,
    alg: "xcha-stream",
    hash,
    hashType
  };
}

async function readEncrypted<TOutputFormat extends DataFormat>(
  filename: string,
  key: SerializedKey,
  cipherData: FileEncryptionMetadataWithOutputType<TOutputFormat>
) {
  if (!(await streamablefs.exists(filename))) {
    console.error(`File not found. (File hash: ${filename})`);
    return;
  }
  const kind: DecryptKind =
    cipherData.outputType === "base64" || cipherData.outputType === "text"
      ? cipherData.outputType
      : "cache";
  const decrypted = await decryptNative(
    filename,
    { ...key, salt: cipherData.salt || key.salt },
    cipherData.iv,
    kind
  );
  if (!decrypted) return;
  if (kind !== "cache") return decrypted.result as Output<TOutputFormat>;
  try {
    return (await fs.promises.readFile(
      decrypted.result
    )) as Output<TOutputFormat>;
  } finally {
    await removeQuietly(decrypted.result);
  }
}

async function readFileStream(path: string, remove: boolean) {
  const handle = await fs.promises.open(path, "r");
  let position = 0;
  let closed = false;
  async function finish() {
    if (closed) return;
    closed = true;
    await handle.close().catch(() => {});
    if (remove) await removeQuietly(path);
  }
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const buffer = new Uint8Array(CHUNK_SIZE);
        const { bytesRead } = await handle.read(
          buffer,
          0,
          CHUNK_SIZE,
          position
        );
        if (bytesRead === 0) {
          await finish();
          controller.close();
          return;
        }
        position += bytesRead;
        controller.enqueue(
          bytesRead === CHUNK_SIZE ? buffer : buffer.slice(0, bytesRead)
        );
      } catch (e) {
        await finish();
        controller.error(e);
      }
    },
    cancel: finish
  });
}

async function decryptFile(
  filename: string,
  fileMetadata: FileMetadata
): Promise<Uint8Array | false> {
  if (!fileMetadata) return false;
  const path = await decryptToFile(filename, fileMetadata.key, fileMetadata.iv);
  if (!path) return false;
  try {
    return await fs.promises.readFile(path);
  } finally {
    await removeQuietly(path);
  }
}

async function streamingDecryptFile(
  filename: string,
  fileMetadata: FileMetadata
): Promise<ReadableStream<Uint8Array> | false> {
  if (!fileMetadata) return false;
  const path = await decryptToFile(filename, fileMetadata.key, fileMetadata.iv);
  if (!path) return false;
  return readFileStream(path, true);
}

async function saveFile(filename: string, fileMetadata: FileMetadata) {
  const { name, type } = fileMetadata;
  const stream = await streamingDecryptFile(filename, fileMetadata);
  if (!stream) return;
  let target;
  try {
    target = await files.create(await getFileNameWithExtension(name, type));
  } catch (e) {
    await stream.cancel();
    if (e instanceof Error && e.message === "No file was selected") return;
    throw e;
  }
  const reader = stream.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      await target.write(value);
    }
    await target.close();
  } catch (e) {
    await reader.cancel().catch(() => {});
    await target.abort();
    throw e;
  }
}

function toS3Error(e: unknown): S3Error {
  if (e instanceof WrappedError) {
    const s3Error = toS3Error(e.error);
    return { ...s3Error, Message: `${e.message} ${s3Error.Message}` };
  } else if (e instanceof HttpError) {
    return parseS3Error(e.body);
  } else if (e instanceof Error) {
    return { Code: "Unknown", Message: e.message };
  }
  return { Code: "Unknown", Message: JSON.stringify(e) };
}

async function showError(error: S3Error, message?: string) {
  message = `${message ? message + " " : ""}${error.Message}`;
  await toast(
    "error",
    error.Code === "UNKNOWN" ? message : `[${error.Code}] ${message}`
  );
}

function isSuccessStatusCode(statusCode: number) {
  return statusCode >= 200 && statusCode <= 299;
}

type XhrResult = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

function request(
  method: string,
  url: string,
  options: {
    headers?: Record<string, string>;
    body?: Uint8Array | string;
    signal?: AbortSignal;
    onUploadProgress?: (loaded: number) => void;
  } = {}
) {
  return new Promise<XhrResult>((resolve, reject) => {
    const { signal } = options;
    if (signal?.aborted) return reject(new Error("Request aborted."));
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    for (const [name, value] of Object.entries(options.headers ?? {}))
      xhr.setRequestHeader(name, value);
    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort);
    const cleanup = () => signal?.removeEventListener("abort", onAbort);
    if (options.onUploadProgress)
      xhr.upload.onprogress = (ev) => options.onUploadProgress?.(ev.loaded);
    xhr.onload = () => {
      cleanup();
      const headers: Record<string, string> = {};
      for (const line of (xhr.getAllResponseHeaders() || "").split(/\r?\n/)) {
        const index = line.indexOf(":");
        if (index > 0)
          headers[line.slice(0, index).trim().toLowerCase()] = line
            .slice(index + 1)
            .trim();
      }
      const result = {
        status: xhr.status,
        headers,
        body: xhr.responseText ?? ""
      };
      if (isSuccessStatusCode(xhr.status)) resolve(result);
      else reject(new HttpError(xhr.status, result.body));
    };
    xhr.onerror = () => {
      cleanup();
      reject(new Error(`Network request failed (${method} ${url}).`));
    };
    xhr.onabort = () => {
      cleanup();
      reject(new Error("Request aborted."));
    };
    xhr.send(options.body as any);
  });
}

async function writeChunksToFile(
  handle: FileHandle,
  from: number,
  length: number,
  path: string
) {
  const out = await fs.promises.open(path, "w");
  let total = 0;
  try {
    for (let i = from; i < from + length; ++i) {
      const chunk = await handle.readChunk(i);
      if (!chunk) throw new Error(`No data found for chunk at offset ${i}.`);
      await out.write(chunk);
      total += chunk.length;
    }
  } finally {
    await out.close();
  }
  return total;
}

async function uploadChunks(
  handle: FileHandle,
  from: number,
  length: number,
  url: string,
  options: {
    headers?: Record<string, string>;
    signal?: AbortSignal;
    onProgress?: (sent: number) => void;
  }
) {
  const temp = `${paths.temp}/upload-${randomId()}`;
  try {
    const size = await writeChunksToFile(handle, from, length, temp);
    const response = await upload(url, temp, {
      headers: options.headers,
      signal: options.signal,
      onProgress: options.onProgress
        ? (sent) => options.onProgress?.(sent)
        : undefined
    });
    if (!isSuccessStatusCode(response.status))
      throw new HttpError(response.status, response.body);
    return { size, headers: response.headers, status: response.status };
  } finally {
    await removeQuietly(temp);
  }
}

async function getUploadedFileSize(filename: string) {
  try {
    const url = `${hosts.API_HOST}/s3?name=${filename}`;
    const token = await (await getDb()).tokenManager.getAccessToken();
    const info = await request("HEAD", url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const contentLength = parseInt(
      info.headers["x-object-size"] ?? info.headers["content-length"]
    );
    return isNaN(contentLength) ? 0 : contentLength;
  } catch (e) {
    console.error("Failed to get uploaded file size.", filename, e);
    return -1;
  }
}

async function checkUpload(
  filename: string,
  chunkSize: number,
  expectedSize: number
) {
  const error = checkUploadError(
    await getUploadedFileSize(filename),
    chunkSize,
    expectedSize
  );
  if (error) throw new Error(error);
}

async function resetUpload(fileHandle: FileHandle) {
  await fileHandle.addAdditionalData("uploadId", undefined);
  await fileHandle.addAdditionalData("uploadedChunks", undefined);
  await fileHandle.addAdditionalData("uploadedBytes", undefined);
  await fileHandle.addAdditionalData("uploaded", false);
}

async function singlePartUploadFile(
  fileHandle: FileHandle,
  filename: string,
  requestOptions: RequestOptionsWithSignal
) {
  const { url, headers, signal } = requestOptions;
  const response = await uploadChunks(
    fileHandle,
    0,
    fileHandle.chunks.length,
    url,
    {
      headers: { ...headers, "Content-Type": "" },
      signal,
      onProgress: (loaded) =>
        reportProgress(
          { total: fileHandle.file.size + ABYTES, loaded },
          { type: "upload", hash: filename }
        )
    }
  );
  return isSuccessStatusCode(response.status);
}

async function multiPartUploadFile(
  fileHandle: FileHandle,
  filename: string,
  requestOptions: RequestOptionsWithSignal
) {
  const { headers, signal } = requestOptions;
  const additionalData = (fileHandle.file.additionalData ||
    {}) as UploadAdditionalData;
  const totalParts = Math.ceil(
    fileHandle.chunks.length / UPLOAD_PART_REQUIRED_CHUNKS
  );
  const { uploadedChunks = [] } = additionalData;
  let { uploadedBytes = 0, uploadId = "" } = additionalData;

  const initiate = await request(
    "GET",
    `${hosts.API_HOST}/s3/multipart?name=${filename}&parts=${totalParts}&uploadId=${uploadId}`,
    { headers, signal }
  ).catch((e) => {
    throw new WrappedError("Could not initiate multi-part upload.", e);
  });
  const initiated = JSON.parse(initiate.body);
  if (initiated.error) throw new Error(initiated.error);
  uploadId = initiated.uploadId;
  const { parts } = initiated;
  if (!parts)
    throw new Error("Could not initiate multi-part upload: invalid response.");
  await fileHandle.addAdditionalData("uploadId", uploadId);

  const report = () =>
    reportProgress(
      {
        total: fileHandle.file.size + ABYTES * totalParts,
        loaded: uploadedBytes
      },
      { type: "upload", hash: filename }
    );
  report();

  const pending: number[] = [];
  for (let i = uploadedChunks.length; i < totalParts; ++i) pending.push(i);
  const uploadPart = async (i: number) => {
    const from = i * UPLOAD_PART_REQUIRED_CHUNKS;
    const length = Math.min(
      fileHandle.chunks.length - from,
      UPLOAD_PART_REQUIRED_CHUNKS
    );
    const response = await uploadChunks(fileHandle, from, length, parts[i], {
      headers: { "Content-Type": "" },
      signal
    }).catch((e) => {
      throw new WrappedError(`Failed to upload part at offset ${i}`, e);
    });
    const etag = response.headers.etag;
    if (!etag)
      throw new Error(
        `Failed to upload part at offset ${i}: invalid etag. ETag: ${etag}`
      );
    uploadedBytes += response.size;
    report();
    uploadedChunks.push({ PartNumber: i + 1, ETag: JSON.parse(etag) });
    await fileHandle.addAdditionalData("uploadedChunks", uploadedChunks);
    await fileHandle.addAdditionalData("uploadedBytes", uploadedBytes);
  };
  const workers = Array.from(
    { length: Math.min(UPLOAD_CONCURRENCY, pending.length) },
    async () => {
      for (
        let next = pending.shift();
        next !== undefined;
        next = pending.shift()
      )
        await uploadPart(next);
    }
  );
  try {
    await Promise.all(workers);
  } finally {
    pending.length = 0;
  }

  await request("POST", `${hosts.API_HOST}/s3/multipart`, {
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      Key: filename,
      UploadId: uploadId,
      PartETags: uploadedChunks.sort((a, b) => a.PartNumber - b.PartNumber)
    }),
    signal
  }).catch(async (e) => {
    await resetUpload(fileHandle);
    throw new WrappedError("Could not complete multi-part upload.", e);
  });
  return true;
}

async function uploadFile(
  filename: string,
  requestOptions: RequestOptionsWithSignal
) {
  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle || !(await exists(fileHandle)))
    throw new Error(
      `File is corrupt or missing data. Please upload the file again. (File hash: ${filename})`
    );
  if (fileHandle.file.additionalData?.uploaded) return true;

  const uploadedFileSize = await getUploadedFileSize(filename);
  if (uploadedFileSize === -1) return false;
  if (uploadedFileSize > 0 && uploadedFileSize === (await fileHandle.size()))
    return true;

  try {
    const uploaded =
      fileHandle.file.size < MINIMUM_MULTIPART_FILE_SIZE
        ? await singlePartUploadFile(fileHandle, filename, requestOptions)
        : await multiPartUploadFile(fileHandle, filename, requestOptions);
    if (uploaded) {
      await checkUpload(
        filename,
        requestOptions.chunkSize,
        fileHandle.file.size
      );
      await fileHandle.addAdditionalData("uploaded", true);
    }
    return uploaded;
  } catch (e) {
    console.error(e);
    reportProgress(undefined, { type: "upload", hash: filename });
    const error = toS3Error(e);
    if (
      [
        "NoSuchKey",
        "NoSuchUpload",
        "IncompleteBody",
        "InternalError",
        "InvalidObjectState",
        "InvalidPart",
        "InvalidPartOrder",
        "SignatureDoesNotMatch"
      ].includes(error.Code)
    )
      await resetUpload(fileHandle);
    await showError(error);
    return false;
  }
}

async function downloadFile(
  filename: string,
  requestOptions: RequestOptionsWithSignal
) {
  const temp = `${paths.temp}/download-${randomId()}`;
  try {
    const { url, headers, chunkSize, signal } = requestOptions;
    const handle = await streamablefs.readFile(filename);
    if (handle && (await exists(handle))) return true;
    if (handle) await handle.delete();

    const db = await getDb();
    const attachment = await db.attachments.attachment(filename);
    if (!attachment) throw new Error("Attachment doesn't exist.");

    reportProgress(
      { total: 100, loaded: 0 },
      { type: "download", hash: filename }
    );

    let signedUrl: string;
    try {
      signedUrl = (await request("GET", url, { headers, signal })).body;
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) {
        await toast("error", "Please login to download attachments.");
        reportProgress(undefined, { type: "download", hash: filename });
        return false;
      }
      throw e;
    }

    let size = 0;
    try {
      const result = await download(signedUrl, temp, {
        signal,
        onProgress: (received, total) =>
          reportProgress(
            { total: total > 0 ? total : received || 1, loaded: received },
            { type: "download", hash: filename }
          )
      });
      size = result.bytes;
    } catch (e) {
      const body = (e as { body?: string }).body;
      if (body !== undefined) throw new HttpError((e as any).status, body);
      throw e;
    }

    if (size <= 0) {
      const error = `File length is 0. Please upload this file again from the attachment manager. (File hash: ${filename})`;
      await db.attachments.markAsFailed(attachment.id, error);
      throw new Error(error);
    }

    const length = decryptedLength(size, chunkSize);
    if (attachment.size !== length) {
      const error = `File length mismatch. Expected ${attachment.size} but got ${length} bytes. Please upload this file again from the attachment manager. (File hash: ${filename})`;
      await db.attachments.markAsFailed(attachment.id, error);
      throw new Error(error);
    }

    const target = await streamablefs.createFile(
      filename,
      length,
      attachment.mimeType || "application/octet-stream",
      { overwrite: true }
    );
    try {
      await ingest(temp, target, chunkSize + ABYTES);
    } catch (e) {
      await target.delete().catch(() => {});
      throw e;
    }
    reportProgress(
      { total: size, loaded: size },
      { type: "download", hash: filename }
    );
    return true;
  } catch (e) {
    console.error("Could not download file", filename, e);
    await showError(toS3Error(e), "Could not download file");
    reportProgress(undefined, { type: "download", hash: filename });
    return false;
  } finally {
    await removeQuietly(temp);
  }
}

async function deleteFile(filename: string, requestOptions?: RequestOptions) {
  if (!requestOptions)
    return (
      !(await streamablefs.exists(filename)) ||
      (await streamablefs.deleteFile(filename))
    );
  try {
    const { url, headers } = requestOptions;
    await request("DELETE", url, { headers });
    await streamablefs.deleteFile(filename);
    return true;
  } catch (e) {
    await showError(toS3Error(e), "Could not delete file");
    return false;
  }
}

async function bulkDeleteFiles(
  filenames: string[],
  requestOptions?: RequestOptions
) {
  if (!requestOptions) {
    await streamablefs.bulkDeleteFiles(filenames);
    return true;
  }
  try {
    const { url, headers } = requestOptions;
    await request("POST", url, {
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ names: filenames })
    });
    await streamablefs.bulkDeleteFiles(filenames);
    return true;
  } catch (e) {
    await showError(toS3Error(e), "Could not bulk delete files");
    return false;
  }
}

async function bulkExists(filenames: string[]) {
  const existing = new Set(
    (await streamablefs.list()).map((c) => c.replace(/-chunk-\d+/, ""))
  );
  return Array.from(new Set(filenames)).filter((name) => !existing.has(name));
}

function cancellable<T>(
  operation: (
    filename: string,
    requestOptions: RequestOptionsWithSignal
  ) => Promise<T>
) {
  return function (filename: string, requestOptions: RequestOptions) {
    const abortController = new AbortController();
    return {
      execute: () =>
        operation(filename, {
          ...requestOptions,
          signal: abortController.signal
        }),
      cancel: async (message?: string) => {
        abortController.abort(message);
      }
    };
  };
}

const storage: IFileStorage = {
  writeEncryptedBase64,
  readEncrypted,
  uploadFile: cancellable(uploadFile),
  downloadFile: cancellable(downloadFile),
  deleteFile,
  bulkDeleteFiles,
  exists,
  clearFileStorage: () => streamablefs.clear(),
  hashBase64,
  getUploadedFileSize,
  bulkExists
};

export const attachmentFiles: AttachmentFiles = {
  storage,
  streamablefs,
  writeEncryptedFile,
  checkUpload,
  getUploadedFileSize,
  decryptFile,
  streamingDecryptFile,
  saveFile
};
