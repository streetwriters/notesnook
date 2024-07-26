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
import axios from "axios";
import { AppEventManager, AppEvents } from "../common/app-events";
import { StreamableFS } from "@notesnook/streamable-fs";
import { NNCrypto } from "./nncrypto";
import hosts from "@notesnook/core/dist/utils/constants";
import { saveAs } from "file-saver";
import { showToast } from "../utils/toast";
import { db } from "../common/db";
import { getFileNameWithExtension } from "@notesnook/core/dist/utils/filename";
import { ChunkedStream, IntoChunks } from "../utils/streams/chunked-stream";
import { ProgressStream } from "../utils/streams/progress-stream";
import { consumeReadableStream } from "../utils/stream";
import { Base64DecoderStream } from "../utils/streams/base64-decoder-stream";
import { toBlob } from "@notesnook-importer/core/dist/src/utils/stream";
import { DataFormat, SerializedKey } from "@notesnook/crypto";
import { IDataType } from "hash-wasm/dist/lib/util";
import FileHandle from "@notesnook/streamable-fs/dist/src/filehandle";
import {
  CacheStorageFileStore,
  IndexedDBFileStore,
  OriginPrivateFileSystem
} from "./file-store";
import { isFeatureSupported } from "../utils/feature-check";
import {
  FileEncryptionMetadataWithHash,
  FileEncryptionMetadataWithOutputType,
  IFileStorage,
  Output,
  RequestOptions
} from "@notesnook/core/dist/interfaces";
import { logger } from "../utils/logger";
import { newQueue } from "@henrygd/queue";

export const ABYTES = 17;
const CHUNK_SIZE = 512 * 1024;
const ENCRYPTED_CHUNK_SIZE = CHUNK_SIZE + ABYTES;
const UPLOAD_PART_REQUIRED_CHUNKS = Math.ceil(
  (10 * 1024 * 1024) / ENCRYPTED_CHUNK_SIZE
);
const MINIMUM_MULTIPART_FILE_SIZE = 25 * 1024 * 1024;
export const streamablefs = new StreamableFS(
  isFeatureSupported("opfs")
    ? new OriginPrivateFileSystem("streamable-fs")
    : isFeatureSupported("cache")
    ? new CacheStorageFileStore("streamable-fs")
    : new IndexedDBFileStore("streamable-fs")
);

export async function writeEncryptedFile(
  file: File,
  key: SerializedKey,
  hash: string
) {
  if (!isFeatureSupported("indexedDB"))
    throw new Error("This browser does not support IndexedDB.");

  if (await streamablefs.exists(hash)) await streamablefs.deleteFile(hash);

  // let offset = 0;
  // let encrypted = 0;
  const fileHandle = await streamablefs.createFile(hash, file.size, file.type);
  AppEventManager.publish(AppEvents.fileEncrypted, {
    hash,
    total: 1,
    current: 0
  });

  const { iv, stream } = await NNCrypto.createEncryptionStream(key);
  await file
    .stream()
    .pipeThrough(
      new ChunkedStream(
        CHUNK_SIZE,
        isFeatureSupported("opfs") ? "copy" : "nocopy"
      )
    )
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

  AppEventManager.publish(AppEvents.fileEncrypted, {
    hash,
    total: 1,
    current: 1
  });

  return {
    chunkSize: CHUNK_SIZE,
    iv: iv,
    size: file.size,
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
async function writeEncryptedBase64(
  data: string,
  key: SerializedKey,
  mimeType: string
): Promise<FileEncryptionMetadataWithHash> {
  const bytes = new Uint8Array(Buffer.from(data, "base64"));

  const { hash, type: hashType } = await hashBuffer(bytes);

  const attachment = await db.attachments.attachment(hash);

  const file = new File([bytes.buffer], hash, {
    type: attachment?.mimeType || mimeType || "application/octet-stream"
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

export async function hashBuffer(data: IDataType) {
  return {
    hash: await xxhash64(data),
    type: "xxh64"
  };
}

export async function hashStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
) {
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

async function readEncrypted<TOutputFormat extends DataFormat>(
  filename: string,
  key: SerializedKey,
  cipherData: FileEncryptionMetadataWithOutputType<TOutputFormat>
) {
  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle) {
    console.error(`File not found. (File hash: ${filename})`);
    return;
  }
  const decryptionStream = await NNCrypto.createDecryptionStream(
    key,
    cipherData.iv
  );

  return (
    cipherData.outputType === "base64" || cipherData.outputType === "text"
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
        )
  ) as Output<TOutputFormat>;
}

type RequestOptionsWithSignal = RequestOptions & {
  signal: AbortSignal;
};

type UploadAdditionalData = {
  uploadedBytes?: number;
  uploadId?: string;
  uploaded?: boolean;
  uploadedChunks?: { PartNumber: number; ETag: string }[];
};

async function uploadFile(
  filename: string,
  requestOptions: RequestOptionsWithSignal
) {
  // if file already exists on the server, we just return true
  // we don't reupload the file i.e. overwriting is not possible.
  const uploadedFileSize = await getUploadedFileSize(filename);
  if (uploadedFileSize === -1) return false;
  if (uploadedFileSize > 0) return true;

  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle || !(await exists(fileHandle)))
    throw new Error(
      `File is corrupt or missing data. Please upload the file again. (File hash: ${filename})`
    );
  try {
    if (fileHandle.file.additionalData?.uploaded) {
      await checkUpload(filename);
      return true;
    }

    const uploaded =
      fileHandle.file.size < MINIMUM_MULTIPART_FILE_SIZE
        ? await singlePartUploadFile(fileHandle, filename, requestOptions)
        : await multiPartUploadFile(fileHandle, filename, requestOptions);

    if (uploaded) {
      await checkUpload(filename);

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
    showError(error);
    return false;
  }
}

async function singlePartUploadFile(
  fileHandle: FileHandle,
  filename: string,
  requestOptions: RequestOptionsWithSignal
) {
  console.log("Streaming file upload!");
  const { url, headers, signal } = requestOptions;

  const uploadUrl: string | { error?: string } = await fetch(url, {
    method: "PUT",
    headers,
    signal
  }).then((res) => (res.ok ? res.text() : res.json()));
  if (typeof uploadUrl !== "string")
    throw new Error(
      uploadUrl.error || "Unable to resolve attachment upload url."
    );

  const response = await axios.request({
    url: uploadUrl,
    method: "PUT",
    headers: {
      "Content-Type": ""
    },
    data: await fileHandle.toBlob(),
    signal,
    onUploadProgress: (ev) =>
      reportProgress(
        {
          total: fileHandle.file.size + ABYTES,
          loaded: ev.loaded
        },
        {
          type: "upload",
          hash: filename
        }
      )
  });
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

  const TOTAL_PARTS = Math.ceil(
    fileHandle.chunks.length / UPLOAD_PART_REQUIRED_CHUNKS
  );
  const { uploadedChunks = [] } = additionalData;
  let { uploadedBytes = 0, uploadId = "" } = additionalData;

  const initiateMultiPartUpload = await axios
    .get(
      `${hosts.API_HOST}/s3/multipart?name=${filename}&parts=${TOTAL_PARTS}&uploadId=${uploadId}`,
      {
        headers,
        signal
      }
    )
    .catch((e) => {
      throw new WrappedError("Could not initiate multi-part upload.", e);
    });

  if (initiateMultiPartUpload.data.error)
    throw new Error(initiateMultiPartUpload.data.error);

  uploadId = initiateMultiPartUpload.data.uploadId;
  const { parts } = initiateMultiPartUpload.data;

  if (!parts)
    throw new Error("Could not initiate multi-part upload: invalid response.");

  await fileHandle.addAdditionalData("uploadId", uploadId);

  const onUploadProgress = () => {
    reportProgress(
      {
        total: fileHandle.file.size + ABYTES * TOTAL_PARTS,
        loaded: uploadedBytes
      },
      {
        type: "upload",
        hash: filename
      }
    );
  };

  onUploadProgress();
  const queue = newQueue(4);
  for (let i = uploadedChunks.length; i < TOTAL_PARTS; ++i) {
    const from = i * UPLOAD_PART_REQUIRED_CHUNKS;
    const length = Math.min(
      fileHandle.chunks.length - from,
      UPLOAD_PART_REQUIRED_CHUNKS
    );
    const url = parts[i];
    queue.add(async () => {
      const blob = await fileHandle.readChunks(
        i * UPLOAD_PART_REQUIRED_CHUNKS,
        length
      );
      const response = await axios
        .request({
          url,
          method: "PUT",
          headers: { "Content-Type": "" },
          signal,
          data: blob,
          onUploadProgress: (ev) => {
            uploadedBytes += ev.bytes;
            onUploadProgress();
          }
        })
        .catch((e) => {
          throw new WrappedError(`Failed to upload part at offset ${i}`, e);
        });

      if (!response.headers.etag || typeof response.headers.etag !== "string")
        throw new Error(
          `Failed to upload part at offset ${i}: invalid etag. ETag: ${response.headers.etag}`
        );
      uploadedChunks.push({
        PartNumber: i + 1,
        ETag: JSON.parse(response.headers.etag)
      });
      await fileHandle.addAdditionalData("uploadedChunks", uploadedChunks);
      await fileHandle.addAdditionalData("uploadedBytes", uploadedBytes);
    });
  }
  await queue.done();

  await axios
    .post(
      `${hosts.API_HOST}/s3/multipart`,
      {
        Key: filename,
        UploadId: uploadId,
        PartETags: uploadedChunks.sort((a, b) => a.PartNumber - b.PartNumber)
      },
      {
        headers,
        signal
      }
    )
    .catch(async (e) => {
      await resetUpload(fileHandle);
      throw new WrappedError("Could not complete multi-part upload.", e);
    });

  return true;
}

async function resetUpload(fileHandle: FileHandle) {
  await fileHandle.addAdditionalData("uploadId", undefined);
  await fileHandle.addAdditionalData("uploadedChunks", undefined);
  await fileHandle.addAdditionalData("uploadedBytes", undefined);
  await fileHandle.addAdditionalData("uploaded", false);
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

async function downloadFile(
  filename: string,
  requestOptions: RequestOptionsWithSignal
) {
  try {
    logger.debug("DOWNLOADING FILE", { filename });
    const { url, headers, chunkSize, signal } = requestOptions;
    const handle = await streamablefs.readFile(filename);

    if (handle && (await exists(handle))) return true;
    if (handle) await handle.delete();

    const attachment = await db.attachments.attachment(filename);
    if (!attachment) throw new Error("Attachment doesn't exist.");

    reportProgress(
      { total: 100, loaded: 0 },
      { type: "download", hash: filename }
    );

    const size = await getUploadedFileSize(filename);
    if (size <= 0) {
      const error = `File length is 0. Please upload this file again from the attachment manager. (File hash: ${filename})`;
      await db.attachments.markAsFailed(attachment.id, error);
      throw new Error(error);
    }

    const totalChunks = Math.ceil(size / chunkSize);
    const decryptedLength = size - totalChunks * ABYTES;
    if (attachment && attachment.size !== decryptedLength) {
      const error = `File length mismatch. Expected ${attachment.size} but got ${decryptedLength} bytes. Please upload this file again from the attachment manager. (File hash: ${filename})`;
      await db.attachments.markAsFailed(attachment.id, error);
      throw new Error(error);
    }

    const signedUrl = (
      await axios.get(url, {
        headers,
        responseType: "text"
      })
    ).data;

    logger.debug("Got attachment signed url", { filename });

    const fileHandle = await streamablefs.createFile(
      filename,
      decryptedLength,
      attachment.mimeType || "application/octet-stream"
    );

    const response = await fetch(signedUrl, {
      signal
    });
    await response.body
      ?.pipeThrough(
        new ProgressStream((totalRead, done) => {
          reportProgress(
            {
              total: size,
              loaded: done ? size : totalRead
            },
            { type: "download", hash: filename }
          );
        })
      )
      .pipeThrough(
        new ChunkedStream(
          chunkSize + ABYTES,
          isFeatureSupported("opfs") ? "copy" : "nocopy"
        )
      )
      .pipeTo(fileHandle.writeable);

    logger.debug("Attachment downloaded", { filename });
    return true;
  } catch (e) {
    logger.error(e, "Could not download file", { filename });
    showError(toS3Error(e), "Could not download file");
    reportProgress(undefined, { type: "download", hash: filename });
    return false;
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
  const stream = await streamingDecryptFile(filename, fileMetadata);
  if (!stream) return false;
  return await toBlob(stream);
}

export async function streamingDecryptFile(
  filename: string,
  fileMetadata: FileMetadata
) {
  if (!fileMetadata) return false;

  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle) return false;

  const { key, iv } = fileMetadata;

  const decryptionStream = await NNCrypto.createDecryptionStream(key, iv);
  return fileHandle.readable.pipeThrough(decryptionStream);
}

export async function saveFile(filename: string, fileMetadata: FileMetadata) {
  logger.debug("Saving file", { filename });
  const { name, type } = fileMetadata;

  const decrypted = await decryptFile(filename, fileMetadata);
  logger.debug("Decrypting file", { filename, result: !!decrypted });
  if (decrypted) saveAs(decrypted, getFileNameWithExtension(name, type));
}

async function deleteFile(
  filename: string,
  requestOptions?: RequestOptionsWithSignal
) {
  if (!requestOptions)
    return (
      !(await streamablefs.exists(filename)) ||
      (await streamablefs.deleteFile(filename))
    );

  try {
    const { url, headers } = requestOptions;
    const response = await axios.delete(url, {
      headers: headers
    });

    const result = isSuccessStatusCode(response.status);
    if (result) await streamablefs.deleteFile(filename);
    return result;
  } catch (e) {
    showError(toS3Error(e), "Could not delete file");
    return false;
  }
}

/**
 * `-1` means an error during file size
 *
 * `0` means file either doesn't exist or file is actually of 0 length
 *
 * `>0` means file is valid
 */
export async function getUploadedFileSize(filename: string) {
  try {
    const url = `${hosts.API_HOST}/s3?name=${filename}`;
    const token = await db.tokenManager.getAccessToken();

    const attachmentInfo = await axios.head(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const contentLength = parseInt(attachmentInfo.headers["content-length"]);
    return isNaN(contentLength) ? 0 : contentLength;
  } catch (e) {
    logger.error(e, "Failed to get uploaded file size.", { filename });
    return -1;
  }
}

function clearFileStorage() {
  return streamablefs.clear();
}

export const FileStorage: IFileStorage = {
  writeEncryptedBase64,
  readEncrypted,
  uploadFile: cancellable(uploadFile),
  downloadFile: cancellable(downloadFile),
  deleteFile,
  exists,
  clearFileStorage,
  hashBase64,
  getUploadedFileSize
};

function isSuccessStatusCode(statusCode: number) {
  return statusCode >= 200 && statusCode <= 299;
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
      cancel: async (message: string) => {
        abortController.abort(message);
      }
    };
  };
}

function parseS3Error(data: ArrayBuffer | unknown) {
  const xml =
    data instanceof ArrayBuffer
      ? new TextDecoder().decode(data)
      : typeof data === "string"
      ? data
      : null;

  const error = {
    Code: "UNKNOWN",
    Message: xml || JSON.stringify(data)
  };
  try {
    if (!xml) return error;
    const doc = new DOMParser().parseFromString(xml, "text/xml");

    const ErrorElement = doc.getElementsByTagName("Error")[0];
    if (!ErrorElement) return error;

    for (const child of ErrorElement.children) {
      if (
        child.textContent &&
        (child.tagName === "Code" || child.tagName === "Message")
      )
        error[child.tagName] = child.textContent;
    }
    return error;
  } catch (e) {
    return error;
  }
}

type S3Error = { Code: string; Message: string };
function toS3Error(e: unknown): S3Error {
  if (e instanceof WrappedError) {
    const s3Error = toS3Error(e.error);
    return { ...s3Error, Message: `${e.message} ${s3Error.Message}` };
  } else if (axios.isAxiosError(e) && e.response?.data) {
    return parseS3Error(e.response.data);
  } else if (e instanceof Error) {
    return { Code: "Unknown", Message: e.message };
  } else {
    return { Code: "Unknown", Message: JSON.stringify(e) };
  }
}

function showError(error: S3Error, message?: string) {
  showToast(
    "error",
    `[${error.Code}] ${message ? message + " " : ""}${error.Message}`
  );
}

class WrappedError extends Error {
  constructor(readonly message: string, readonly error: unknown) {
    super(message);
  }
}
