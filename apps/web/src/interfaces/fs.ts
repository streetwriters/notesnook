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
import { IndexedDBKVStore } from "./key-value";
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

const ABYTES = 17;
const CHUNK_SIZE = 512 * 1024;
const ENCRYPTED_CHUNK_SIZE = CHUNK_SIZE + ABYTES;
const UPLOAD_PART_REQUIRED_CHUNKS = Math.ceil(
  (5 * 1024 * 1024) / ENCRYPTED_CHUNK_SIZE
);
const MINIMUM_MULTIPART_FILE_SIZE = 25 * 1024 * 1024;
const streamablefs = new StreamableFS(
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
  if (!IndexedDBKVStore.isIndexedDBSupported())
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
  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle || !(await exists(filename)))
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
      if (isAttachmentDeletable(fileHandle.file.type)) {
        await streamablefs.deleteFile(filename);
      }
    }

    return uploaded;
  } catch (e) {
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

  const uploadUrl = await fetch(url, {
    method: "PUT",
    headers,
    signal
  }).then((res) => (res.ok ? res.text() : null));
  if (!uploadUrl) throw new Error("Unable to resolve attachment upload url.");

  const response = await axios.request({
    url: uploadUrl,
    method: "PUT",
    headers: {
      "Content-Type": ""
    },
    data: IS_DESKTOP_APP
      ? await (await fileHandle.toBlob()).arrayBuffer()
      : await fileHandle.toBlob(),
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
    fileHandle.file.chunks / UPLOAD_PART_REQUIRED_CHUNKS
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

  uploadId = initiateMultiPartUpload.data.uploadId;
  const { parts } = initiateMultiPartUpload.data;

  if (!parts)
    throw new Error("Could not initiate multi-part upload: invalid response.");

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

  onUploadProgress({ bytes: 0, loaded: 0 });
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
        headers: { "Content-Type": "", "X-Content-Length": data.byteLength },
        signal,
        data,
        onUploadProgress
      })
      .catch((e) => {
        throw new WrappedError(`Failed to upload part at offset ${i}`, e);
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

    onUploadProgress({ bytes: 0, loaded: blob.size });
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
  const { url, headers, chunkSize, signal } = requestOptions;
  const handle = await streamablefs.readFile(filename);

  if (
    handle &&
    handle.file.size === (await handle.size()) - handle.file.chunks * ABYTES
  )
    return true;
  else if (handle) await handle.delete();

  const attachment = await db.attachments.attachment(filename);
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
      await db.attachments.markAsFailed(filename, error);
      throw new Error(error);
    }

    if (!response.body) {
      const error = `The download response does not contain a body. Please upload this file again from the attachment manager. (File hash: ${filename})`;
      await db.attachments.markAsFailed(filename, error);
      throw new Error(error);
    }

    const totalChunks = Math.ceil(contentLength / chunkSize);
    const decryptedLength = contentLength - totalChunks * ABYTES;
    if (attachment && attachment.size !== decryptedLength) {
      const error = `File length mismatch. Please upload this file again from the attachment manager. (File hash: ${filename})`;
      await db.attachments.markAsFailed(filename, error);
      throw new Error(error);
    }

    const fileHandle = await streamablefs.createFile(
      filename,
      decryptedLength,
      attachment?.mimeType || "application/octet-stream"
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
      .pipeThrough(
        new ChunkedStream(
          chunkSize + ABYTES,
          isFeatureSupported("opfs") ? "copy" : "nocopy"
        )
      )
      .pipeTo(fileHandle.writeable);

    return true;
  } catch (e) {
    console.error(e);
    showError(toS3Error(e), "Could not download file");
    reportProgress(undefined, { type: "download", hash: filename });
    return false;
  }
}

async function exists(filename: string) {
  const handle = await streamablefs.readFile(filename);
  return (
    !!handle &&
    handle.file.size === (await handle.size()) - handle.file.chunks * ABYTES
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
  if (!fileMetadata) return false;

  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle) return false;

  const { key, iv } = fileMetadata;

  const decryptionStream = await NNCrypto.createDecryptionStream(key, iv);
  return await toBlob(fileHandle.readable.pipeThrough(decryptionStream));
}

export async function saveFile(filename: string, fileMetadata: FileMetadata) {
  const { name, type, isUploaded } = fileMetadata;

  const decrypted = await decryptFile(filename, fileMetadata);
  if (decrypted) saveAs(decrypted, getFileNameWithExtension(name, type));

  if (isUploaded && isAttachmentDeletable(type))
    await streamablefs.deleteFile(filename);
}

async function deleteFile(
  filename: string,
  requestOptions: RequestOptionsWithSignal
) {
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
    showError(toS3Error(e), "Could not delete file");
    return false;
  }
}

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
    console.error(e);
    return 0;
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
  hashBase64
};

function isAttachmentDeletable(type: string) {
  return !type.startsWith("image/") && !type.startsWith("application/pdf");
}

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
