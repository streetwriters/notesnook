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

import "web-streams-polyfill/dist/ponyfill";
import { xxhash64, createXXHash64 } from "hash-wasm";
import axios, { AxiosProgressEvent } from "axios";
import { AppEventManager, AppEvents } from "../common/app-events";
import { StreamableFS } from "@notesnook/streamable-fs";
import { getNNCrypto } from "./nncrypto.stub";
import hosts from "@notesnook/core/utils/constants";
import { sendAttachmentsProgressEvent } from "@notesnook/core/common";
import { saveAs } from "file-saver";
import { showToast } from "../utils/toast";
import { db } from "../common/db";
import { getFileNameWithExtension } from "@notesnook/core/utils/filename";
import { ChunkedStream, IntoChunks } from "../utils/streams/chunked-stream";
import { ProgressStream } from "../utils/streams/progress-stream";
import { consumeReadableStream } from "../utils/stream";
import { Base64DecoderStream } from "../utils/streams/base64-decoder-stream";
import { toBlob } from "@notesnook-importer/core/dist/src/utils/stream";
import { Cipher, OutputFormat, SerializedKey } from "@notesnook/crypto";
import { IDataType } from "hash-wasm/dist/lib/util";
import { IndexedDBKVStore } from "./key-value";

const ABYTES = 17;
const CHUNK_SIZE = 512 * 1024;
const ENCRYPTED_CHUNK_SIZE = CHUNK_SIZE + ABYTES;
const UPLOAD_PART_REQUIRED_CHUNKS = Math.ceil(
  (5 * 1024 * 1024) / ENCRYPTED_CHUNK_SIZE
);
const streamablefs = new StreamableFS("streamable-fs");

async function writeEncryptedFile(
  file: File,
  key: SerializedKey,
  hash: string
) {
  const crypto = await getNNCrypto();

  if (!IndexedDBKVStore.isIndexedDBSupported())
    throw new Error("This browser does not support IndexedDB.");

  if (await streamablefs.exists(hash)) await streamablefs.deleteFile(hash);

  // let offset = 0;
  // let encrypted = 0;
  const fileHandle = await streamablefs.createFile(hash, file.size, file.type);
  sendAttachmentsProgressEvent("encrypt", hash, 1, 0);

  const { iv, stream } = await crypto.createEncryptionStream(key);
  await file
    .stream()
    .pipeThrough(new ChunkedStream(CHUNK_SIZE))
    .pipeThrough(new IntoChunks(file.size))
    .pipeThrough(stream)
    .pipeThrough(
      new ProgressStream((totalRead, done) =>
        reportProgress(
          {
            total: file.size,
            loaded: done ? file.size : totalRead
          },
          { type: "encrypt", hash }
        )
      )
    )
    .pipeTo(fileHandle.writeable);

  sendAttachmentsProgressEvent("encrypt", hash, 1);

  return {
    chunkSize: CHUNK_SIZE,
    iv: iv,
    length: file.size,
    salt: key.salt!,
    alg: "xcha-stream"
  };
}

/**
 * We perform 4 steps here:
 * 1. We convert base64 to Uint8Array
 * 2. We hash the Uint8Array.
 * 3. We encrypt the Uint8Array
 * 4. We save the encrypted Uint8Array
 */
async function writeEncryptedBase64(metadata: {
  data: string;
  key: SerializedKey;
  mimeType?: string;
}) {
  const { data, key, mimeType } = metadata;

  const bytes = new Uint8Array(Buffer.from(data, "base64"));

  const { hash, type: hashType } = await hashBuffer(bytes);

  const attachment = db.attachments?.attachment(hash);

  const file = new File([bytes.buffer], hash, {
    type: attachment?.metadata.type || mimeType || "application/octet-stream"
  });

  const result = await writeEncryptedFile(file, key, hash);
  return {
    ...result,
    hash,
    hashType
  };
}

function hashBase64(data: string) {
  return hashBuffer(Buffer.from(data, "base64"));
}

async function hashBuffer(data: IDataType) {
  return {
    hash: await xxhash64(data),
    type: "xxh64"
  };
}

async function hashStream(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const hasher = await createXXHash64();
  hasher.init();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value } = await reader.read();
    if (!value) break;
    hasher.update(value);
  }

  return { type: "xxh64", hash: hasher.digest("hex") };
}

async function readEncrypted(
  filename: string,
  key: SerializedKey,
  cipherData: Cipher & { outputType: OutputFormat }
) {
  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle) {
    console.error(`File not found. (File hash: ${filename})`);
    return null;
  }
  const crypto = await getNNCrypto();
  const decryptionStream = await crypto.createDecryptionStream(
    key,
    cipherData.iv
  );

  return cipherData.outputType === "base64" || cipherData.outputType === "text"
    ? (
        await consumeReadableStream(
          fileHandle.readable
            .pipeThrough(decryptionStream)
            .pipeThrough(
              cipherData.outputType === "text"
                ? new globalThis.TextDecoderStream()
                : new Base64DecoderStream()
            )
        )
      ).join("")
    : new Uint8Array(
        Buffer.concat(
          await consumeReadableStream(
            fileHandle.readable.pipeThrough(decryptionStream)
          )
        )
      );
}

type RequestOptions = {
  headers: Record<string, string>;
  signal: AbortSignal;
  url: string;
  chunkSize: number;
};

async function uploadFile(filename: string, requestOptions: RequestOptions) {
  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle)
    throw new Error(`File stream not found. (File hash: ${filename})`);
  const TOTAL_PARTS = Math.ceil(
    fileHandle.file.chunks / UPLOAD_PART_REQUIRED_CHUNKS
  );

  const additionalData = (fileHandle.file.additionalData || {}) as {
    uploadedBytes?: number;
    uploadId?: string;
    uploaded?: boolean;
    uploadedChunks?: { PartNumber: number; ETag: string }[];
  };

  const { uploadedChunks = [], uploaded = false } = additionalData;
  let { uploadedBytes = 0, uploadId = "" } = additionalData;

  try {
    if (uploaded) {
      await checkUpload(filename);
      return true;
    }

    const { headers, signal } = requestOptions;

    const initiateMultiPartUpload = await axios
      .get(
        `${hosts.API_HOST}/s3/multipart?name=${filename}&parts=${TOTAL_PARTS}&uploadId=${uploadId}`,
        {
          headers,
          signal
        }
      )
      .catch((e) => {
        throw new S3Error("Could not initiate multi-part upload.", e);
      });

    uploadId = initiateMultiPartUpload.data.uploadId;
    const { parts } = initiateMultiPartUpload.data;

    await fileHandle.addAdditionalData("uploadId", uploadId);

    const onUploadProgress = (ev: AxiosProgressEvent) => {
      reportProgress(
        {
          total: fileHandle.file.size + ABYTES,
          loaded: uploadedBytes + ev.loaded
        },
        {
          type: "upload",
          hash: filename
        }
      );
    };

    for (let i = uploadedChunks.length; i < TOTAL_PARTS; ++i) {
      const blob = await fileHandle.readChunks(
        i * UPLOAD_PART_REQUIRED_CHUNKS,
        UPLOAD_PART_REQUIRED_CHUNKS
      );
      const url = parts[i];
      const data = await blob.arrayBuffer();
      const response = await axios
        .request({
          url,
          method: "PUT",
          headers: { "Content-Type": "" },
          signal,
          data,
          onUploadProgress
        })
        .catch((e) => {
          throw new S3Error(`Failed to upload part at offset ${i}`, e);
        });

      if (!response.headers.etag || typeof response.headers.etag !== "string")
        throw new Error(
          `Failed to upload part at offset ${i}: invalid etag. ETag: ${response.headers.etag}`
        );

      uploadedBytes += blob.size;
      uploadedChunks.push({
        PartNumber: i + 1,
        ETag: JSON.parse(response.headers.etag)
      });
      await fileHandle.addAdditionalData("uploadedChunks", uploadedChunks);
      await fileHandle.addAdditionalData("uploadedBytes", uploadedBytes);
    }

    await axios
      .post(
        `${hosts.API_HOST}/s3/multipart`,
        {
          Key: filename,
          UploadId: uploadId,
          PartETags: uploadedChunks
        },
        {
          headers,
          signal
        }
      )
      .catch((e) => {
        throw new S3Error("Could not complete multi-part upload.", e);
      });

    await fileHandle.addAdditionalData("uploaded", true);

    if (isAttachmentDeletable(fileHandle.file.type)) {
      await streamablefs.deleteFile(filename);
    }
    await checkUpload(filename);
    return true;
  } catch (e) {
    reportProgress(undefined, { type: "upload", hash: filename });
    if (e instanceof S3Error) e.handle();
    else handleS3Error(e);

    return false;
  }
}

async function checkUpload(filename: string) {
  if ((await getUploadedFileSize(filename)) <= 0) {
    const error = `Upload verification failed: file size is 0. Please upload this file again. (File hash: ${filename})`;
    throw new Error(error);
  }
}

function reportProgress(
  ev: { total?: number; loaded?: number } | undefined,
  { type, hash }: { type: string; hash: string }
) {
  AppEventManager.publish(AppEvents.UPDATE_ATTACHMENT_PROGRESS, {
    type,
    hash,
    total: ev?.total || 1,
    loaded: ev?.loaded || 1
  });
}

async function downloadFile(filename: string, requestOptions: RequestOptions) {
  const { url, headers, chunkSize, signal } = requestOptions;
  const handle = await streamablefs.readFile(filename);

  if (
    handle &&
    handle.file.size === (await handle.size()) - handle.file.chunks * ABYTES
  )
    return true;
  else if (handle) await handle.delete();

  const attachment = db.attachments?.attachment(filename);
  try {
    reportProgress(
      { total: 100, loaded: 0 },
      { type: "download", hash: filename }
    );

    const signedUrl = (
      await axios.get(url, {
        headers,
        responseType: "text"
      })
    ).data;

    const response = await fetch(signedUrl, {
      signal
    });

    const contentType = response.headers.get("content-type");
    if (contentType === "application/xml") {
      const error = parseS3Error(await response.text());
      if (error.Code !== "Unknown") {
        throw new Error(`[${error.Code}] ${error.Message}`);
      }
    }
    const contentLength = parseInt(
      response.headers.get("content-length") || "0"
    );
    if (contentLength === 0 || isNaN(contentLength)) {
      const error = `File length is 0. Please upload this file again from the attachment manager. (File hash: ${filename})`;
      await db.attachments?.markAsFailed(filename, error);
      throw new Error(error);
    }

    if (!response.body) {
      const error = `The download response does not contain a body. Please upload this file again from the attachment manager. (File hash: ${filename})`;
      await db.attachments?.markAsFailed(filename, error);
      throw new Error(error);
    }

    const totalChunks = Math.ceil(contentLength / chunkSize);
    const decryptedLength = contentLength - totalChunks * ABYTES;
    if (attachment && attachment.length !== decryptedLength) {
      const error = `File length mismatch. Please upload this file again from the attachment manager. (File hash: ${filename})`;
      await db.attachments?.markAsFailed(filename, error);
      throw new Error(error);
    }

    const fileHandle = await streamablefs.createFile(
      filename,
      decryptedLength,
      attachment?.metadata.type || "application/octet-stream"
    );

    await response.body
      .pipeThrough(
        new ProgressStream((totalRead, done) => {
          reportProgress(
            {
              total: contentLength,
              loaded: done ? contentLength : totalRead
            },
            { type: "download", hash: filename }
          );
        })
      )
      .pipeThrough(new ChunkedStream(chunkSize + ABYTES))
      .pipeTo(fileHandle.writeable);

    return true;
  } catch (e) {
    handleS3Error(e, "Could not download file");
    reportProgress(undefined, { type: "download", hash: filename });
    return false;
  }
}

function exists(filename: string) {
  return streamablefs.exists(filename);
}

type FileMetadata = {
  key: SerializedKey;
  iv: string;
  name: string;
  type: string;
  isUploaded: boolean;
};
export async function decryptFile(
  filename: string,
  fileMetadata: FileMetadata
) {
  if (!fileMetadata) return false;

  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle) return false;

  const { key, iv } = fileMetadata;

  const crypto = await getNNCrypto();
  const decryptionStream = await crypto.createDecryptionStream(key, iv);
  return await toBlob(fileHandle.readable.pipeThrough(decryptionStream));
}

async function saveFile(filename: string, fileMetadata: FileMetadata) {
  if (!fileMetadata) return false;

  const { name, type, isUploaded } = fileMetadata;

  const decrypted = await decryptFile(filename, fileMetadata);
  if (decrypted) saveAs(decrypted, getFileNameWithExtension(name, type));

  if (isUploaded && isAttachmentDeletable(type))
    await streamablefs.deleteFile(filename);
}

async function deleteFile(filename: string, requestOptions: RequestOptions) {
  if (!requestOptions) return await streamablefs.deleteFile(filename);
  if (!requestOptions && !(await streamablefs.exists(filename))) return true;

  try {
    const { url, headers } = requestOptions;
    const response = await axios.delete(url, {
      headers: headers
    });

    const result = isSuccessStatusCode(response.status);
    if (result) await streamablefs.deleteFile(filename);
    return result;
  } catch (e) {
    handleS3Error(e, "Could not delete file");
    return false;
  }
}

async function getUploadedFileSize(filename: string) {
  try {
    const url = `${hosts.API_HOST}/s3?name=${filename}`;
    const token = await db.user?.tokenManager.getAccessToken();

    const attachmentInfo = await axios.head(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const contentLength = parseInt(attachmentInfo.headers["content-length"]);
    return isNaN(contentLength) ? 0 : contentLength;
  } catch (e) {
    console.error(e);
    return 0;
  }
}

function clearFileStorage() {
  return streamablefs.clear();
}

const FS = {
  writeEncryptedBase64,
  readEncrypted,
  uploadFile: cancellable(uploadFile),
  downloadFile: cancellable(downloadFile),
  deleteFile,
  saveFile,
  exists,
  writeEncryptedFile,
  clearFileStorage,
  getUploadedFileSize,
  decryptFile,

  hashBase64,
  hashBuffer,
  hashStream
};
export default FS;

function isAttachmentDeletable(type: string) {
  return !type.startsWith("image/") && !type.startsWith("application/pdf");
}

function isSuccessStatusCode(statusCode: number) {
  return statusCode >= 200 && statusCode <= 299;
}

function cancellable(
  operation: (filename: string, requestOptions: RequestOptions) => any
) {
  return function (filename: string, requestOptions: RequestOptions) {
    const abortController = new AbortController();
    requestOptions.signal = abortController.signal;
    return {
      execute: () => operation(filename, requestOptions),
      cancel: (message: string) => {
        abortController.abort(message);
      }
    };
  };
}
function parseS3Error(data: ArrayBuffer | unknown) {
  if (!(data instanceof ArrayBuffer)) {
    return {
      Code: "UNKNOWN",
      Message: typeof data === "object" ? JSON.stringify(data) : data
    };
  }
  const xml = new TextDecoder().decode(data);
  const doc = new DOMParser().parseFromString(xml, "text/xml");

  const ErrorElement = doc.getElementsByTagName("Error")[0];
  if (!ErrorElement)
    return { Code: "Unknown", Message: "An unknown error occured." };

  const error: Record<string, string> = {};
  for (const child of ErrorElement.children) {
    if (child.textContent) error[child.tagName] = child.textContent;
  }
  return error;
}

function handleS3Error(e: unknown, message?: unknown) {
  if (axios.isAxiosError(e) && e.response?.data) {
    const error = parseS3Error(e.response.data);
    showToast("error", `${message}: [${error.Code}] ${error.Message}`);
  } else if (message && e instanceof Error) {
    showToast("error", `${message}: ${e.message}`);
  } else if (e instanceof Error) {
    showToast("error", e.message);
  } else {
    showToast("error", JSON.stringify(e));
  }
}

class S3Error extends Error {
  constructor(message: string, readonly error: Error) {
    super(message);
  }

  handle() {
    handleS3Error(this.error, this.message);
  }
}
