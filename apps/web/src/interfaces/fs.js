import "web-streams-polyfill/dist/ponyfill";
import localforage from "localforage";
import { xxhash64, createXXHash64 } from "hash-wasm";
import axios from "axios";
import { AppEventManager, AppEvents } from "../common/app-events";
import { StreamableFS } from "streamablefs";
import { getNNCrypto } from "./nncrypto.stub";
import hosts from "notes-core/utils/constants";
import { sendAttachmentsProgressEvent } from "notes-core/common";
import { saveAs } from "file-saver";
import { showToast } from "../utils/toast";

const ABYTES = 17;
const CHUNK_SIZE = 512 * 1024;
const ENCRYPTED_CHUNK_SIZE = CHUNK_SIZE + ABYTES;
const UPLOAD_PART_REQUIRED_CHUNKS = Math.ceil(
  (5 * 1024 * 1024) / ENCRYPTED_CHUNK_SIZE
);
const streamablefs = new StreamableFS("streamable-fs");

/**
 * @param {File} file
 * @param {import("nncrypto/dist/src/types").SerializedKey} key
 * @param {string} hash
 */
async function writeEncryptedFile(file, key, hash) {
  const crypto = await getNNCrypto();

  if (!localforage.supports(localforage.INDEXEDDB))
    throw new Error("This browser does not support IndexedDB.");

  if (await streamablefs.exists(hash)) await streamablefs.deleteFile(hash);

  let offset = 0;
  let encrypted = 0;
  const fileHandle = await streamablefs.createFile(hash, file.size, file.type);
  sendAttachmentsProgressEvent("encrypt", hash, 1, 0);

  const iv = await crypto.encryptStream(
    key,
    {
      read: async () => {
        let end = Math.min(offset + CHUNK_SIZE, file.size);
        if (offset === end) return;
        const chunk = new Uint8Array(
          await file.slice(offset, end).arrayBuffer()
        );
        offset = end;
        const isFinal = offset === file.size;
        return {
          final: isFinal,
          data: chunk,
        };
      },
      write: async (chunk) => {
        encrypted += chunk.data.length - ABYTES;
        reportProgress(
          { total: file.size, loaded: encrypted },
          { type: "encrypt", hash }
        );
        await fileHandle.write(chunk.data);
      },
    },
    file.name
  );

  sendAttachmentsProgressEvent("encrypt", hash, 1);

  return {
    chunkSize: CHUNK_SIZE,
    iv: iv,
    length: file.size,
    salt: key.salt,
    alg: "xcha-stream",
  };
}

/**
 * We perform 4 steps here:
 * 1. We convert base64 to Uint8Array (if we get base64, that is)
 * 2. We hash the Uint8Array.
 * 3. We encrypt the Uint8Array
 * 4. We save the encrypted Uint8Array
 */
async function writeEncrypted(filename, { data, type, key }) {
  if (type === "base64") data = new Uint8Array(Buffer.from(data, "base64"));

  const { hash, type: hashType } = await hashBuffer(data);
  if (!filename) filename = hash;

  const file = new File([data], filename, { type });
  const result = await writeEncryptedFile(file, key, hash);
  return {
    ...result,
    hash,
    hashType,
  };
}

/**
 *
 * @param {import("hash-wasm/dist/lib/util").IDataType} data
 * @returns
 */
async function hashBuffer(data) {
  return {
    hash: await xxhash64(data),
    type: "xxh64",
  };
}

/**
 *
 * @param {ReadableStreamReader<Uint8Array>} reader
 * @returns
 */
async function hashStream(reader) {
  const hasher = await createXXHash64();
  hasher.init();

  while (true) {
    const { value } = await reader.read();
    if (!value) break;
    hasher.update(value);
  }

  return { type: "xxh64", hash: hasher.digest("hex") };
}

async function readEncrypted(filename, key, cipherData) {
  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle) {
    console.error(`File not found. Filename: ${filename}`);
    return null;
  }

  const reader = fileHandle.getReader();
  const plainText = new Uint8Array(fileHandle.file.size);
  let offset = 0;

  const crypto = await getNNCrypto();
  await crypto.decryptStream(
    key,
    cipherData.iv,
    {
      read: async () => {
        const { value } = await reader.read();
        return value;
      },
      write: async (chunk) => {
        plainText.set(chunk.data, offset);
        offset += chunk.data.length;
      },
    },
    filename
  );

  return cipherData.outputType === "base64"
    ? Buffer.from(plainText).toString("base64")
    : plainText;
}

async function uploadFile(filename, requestOptions) {
  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle)
    throw new Error(`File stream not found. Filename: ${filename}`);
  const TOTAL_PARTS = Math.ceil(
    fileHandle.file.chunks / UPLOAD_PART_REQUIRED_CHUNKS
  );

  let {
    uploadedChunks = [],
    uploadedBytes = 0,
    uploaded = false,
    uploadId = "",
  } = fileHandle.file.additionalData || {};

  if (uploaded) return true;

  const { headers, cancellationToken } = requestOptions;

  const initiateMultiPartUpload = await axios.get(
    `${hosts.API_HOST}/s3/multipart?name=${filename}&parts=${TOTAL_PARTS}&uploadId=${uploadId}`,
    {
      headers,
      cancelToken: cancellationToken,
    }
  );
  if (!isSuccessStatusCode(initiateMultiPartUpload.status))
    throw new Error("Could not initiate multi-part upload.");

  uploadId = initiateMultiPartUpload.data.uploadId;
  const { parts } = initiateMultiPartUpload.data;

  await fileHandle.addAdditionalData("uploadId", uploadId);

  function onUploadProgress(ev) {
    reportProgress(
      {
        total: fileHandle.file.size + ABYTES,
        loaded: uploadedBytes + ev.loaded,
      },
      {
        type: "upload",
        hash: filename,
      }
    );
  }

  for (let i = uploadedChunks.length; i < TOTAL_PARTS; ++i) {
    const blob = await fileHandle.readChunks(
      i * UPLOAD_PART_REQUIRED_CHUNKS,
      UPLOAD_PART_REQUIRED_CHUNKS
    );
    const url = parts[i];
    const data = await blob.arrayBuffer();
    const response = await axios.request({
      url,
      method: "PUT",
      headers: { "Content-Type": "" },
      cancelToken: cancellationToken,
      data,
      onUploadProgress,
    });
    if (!isSuccessStatusCode(response.status) || !response.headers.etag)
      throw new Error(`Failed to upload part at offset ${i}.`);

    uploadedBytes += blob.size;
    uploadedChunks.push({
      PartNumber: i + 1,
      ETag: JSON.parse(response.headers.etag),
    });
    await fileHandle.addAdditionalData("uploadedChunks", uploadedChunks);
    await fileHandle.addAdditionalData("uploadedBytes", uploadedBytes);
  }

  const completeMultiPartUpload = await axios.post(
    `${hosts.API_HOST}/s3/multipart`,
    {
      Key: filename,
      UploadId: uploadId,
      PartETags: uploadedChunks,
    },
    {
      headers,
      cancelToken: cancellationToken,
    }
  );
  if (!isSuccessStatusCode(completeMultiPartUpload.status))
    throw new Error("Could not complete multi-part upload.");

  await fileHandle.addAdditionalData("uploaded", true);
  // Keep the images cached; delete everything else.
  if (!fileHandle.file.type?.startsWith("image/")) {
    await streamablefs.deleteFile(filename);
  }
  return true;
}

function reportProgress(ev, { type, hash }) {
  AppEventManager.publish(AppEvents.UPDATE_ATTACHMENT_PROGRESS, {
    type,
    hash,
    total: ev?.total || 1,
    loaded: ev?.loaded || 1,
  });
}

async function downloadFile(filename, requestOptions) {
  const { url, headers, chunkSize, cancellationToken } = requestOptions;
  if (await streamablefs.exists(filename)) return true;

  try {
    reportProgress(
      { total: 100, loaded: 0 },
      { type: "download", hash: filename }
    );

    const signedUrlResponse = await axios.get(url, {
      headers,
      responseType: "text",
    });
    if (!isSuccessStatusCode(signedUrlResponse.status)) return false;

    const signedUrl = signedUrlResponse.data;
    const response = await axios.get(signedUrl, {
      responseType: "arraybuffer",
      cancelToken: cancellationToken,
      onDownloadProgress: (ev) =>
        reportProgress(ev, { type: "download", hash: filename }),
    });

    const contentLength =
      response.headers["content-length"] || response.headers["Content-Length"];
    if (!isSuccessStatusCode(response.status) || contentLength === "0") {
      console.error("Abort: file length is 0.", filename);
      return false;
    }

    const distributor = new ChunkDistributor(chunkSize + ABYTES);
    distributor.fill(new Uint8Array(response.data));
    distributor.close();

    const fileHandle = await streamablefs.createFile(
      filename,
      response.data.byteLength,
      "application/octet-stream"
    );

    for (let chunk of distributor.chunks) {
      await fileHandle.write(chunk.data);
    }

    return true;
  } catch (e) {
    showToast("error", `Could not download file: ${e.message}`);
    console.error(e);
    reportProgress(undefined, { type: "download", hash: filename });
    return false;
  }
}

function exists(filename) {
  return streamablefs.exists(filename);
}

async function saveFile(filename, { key, iv, name, type }) {
  const fileHandle = await streamablefs.readFile(filename);
  if (!fileHandle) return false;

  const blobParts = [];
  const reader = fileHandle.getReader();

  const crypto = await getNNCrypto();
  await crypto.decryptStream(
    key,
    iv,
    {
      read: async () => {
        const { value } = await reader.read();
        return value;
      },
      write: async (chunk) => {
        blobParts.push(chunk.data);
      },
    },
    filename
  );
  saveAs(new Blob(blobParts, { type }), name);
  await streamablefs.deleteFile(filename);
}

async function deleteFile(filename, requestOptions) {
  if (!requestOptions) return await streamablefs.deleteFile(filename);

  const { url, headers } = requestOptions;
  if (!(await streamablefs.exists(filename))) return true;

  const response = await axios.delete(url, {
    headers: headers,
  });
  const result = isSuccessStatusCode(response.status);
  if (result) await streamablefs.deleteFile(filename);
  return result;
}

function clearFileStorage() {
  return streamablefs.clear();
}

const FS = {
  writeEncrypted,
  readEncrypted,
  uploadFile: cancellable(uploadFile),
  downloadFile: cancellable(downloadFile),
  deleteFile,
  saveFile,
  exists,
  hashBuffer,
  hashStream,
  writeEncryptedFile,
  clearFileStorage,
};
export default FS;

function isSuccessStatusCode(statusCode) {
  return statusCode >= 200 && statusCode <= 299;
}

function cancellable(operation) {
  return function (filename, requestOptions) {
    const source = axios.CancelToken.source();
    requestOptions.cancellationToken = source.token;
    return {
      execute: () => operation(filename, requestOptions),
      cancel: (message) => {
        source.cancel(message);
      },
    };
  };
}

class ChunkDistributor {
  /**
   * @typedef {{length: number, data: Uint8Array, final: boolean}} Chunk
   */

  constructor(chunkSize) {
    this.chunkSize = chunkSize;
    this.chunks = [];
    this.filledCount = 0;
    this.done = false;
  }

  /**
   * @returns {Chunk}
   */
  get lastChunk() {
    return this.chunks[this.chunks.length - 1];
  }

  /**
   * @returns {boolean}
   */
  get isLastChunkFilled() {
    return this.lastChunk.length === this.chunkSize;
  }

  /**
   * @returns {Chunk}
   */
  get firstChunk() {
    const chunk = this.chunks.shift();
    if (chunk.data.length === this.chunkSize) this.filledCount--;
    return chunk;
  }

  close() {
    if (!this.lastChunk)
      throw new Error("No data available in this distributor.");
    this.lastChunk.data = this.lastChunk.data.slice(0, this.lastChunk.length);
    this.lastChunk.final = true;
    this.done = true;
  }

  /**
   * @param {Uint8Array} data
   */
  fill(data) {
    if (this.done || !data || !data.length) return;

    const dataLength = data.length;
    const totalBlocks = Math.ceil(dataLength / this.chunkSize);

    for (let i = 0; i < totalBlocks; ++i) {
      const start = i * this.chunkSize;

      if (this.lastChunk && !this.isLastChunkFilled) {
        const needed = this.chunkSize - this.lastChunk.length;
        const end = Math.min(start + needed, dataLength);
        const chunk = data.slice(start, end);

        this.lastChunk.data.set(chunk, this.lastChunk.length);
        this.lastChunk.length += chunk.length;

        if (this.lastChunk.length === this.chunkSize) this.filledCount++;

        if (end !== dataLength) {
          this.fill(data.slice(end));
          break;
        }
      } else {
        const end = Math.min(start + this.chunkSize, dataLength);
        let chunk = data.slice(start, end);

        const buffer = new Uint8Array(this.chunkSize);
        buffer.set(chunk, 0);

        this.chunks.push({ data: buffer, final: false, length: chunk.length });
        if (chunk.length === this.chunkSize) this.filledCount++;
      }
    }
  }
}
