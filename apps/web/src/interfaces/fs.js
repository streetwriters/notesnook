import NNCrypto from "./nncrypto/index";
import localforage from "localforage";
import { xxhash3 } from "hash-wasm";
import axios from "axios";
import { AppEventManager, AppEvents } from "../common";

const PLACEHOLDER = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMzUuNDcgMTM1LjQ3Ij48ZyBmaWxsPSJncmF5Ij48cGF0aCBkPSJNNjUuNjMgNjUuODZhNC40OCA0LjQ4IDAgMSAwLS4wMS04Ljk2IDQuNDggNC40OCAwIDAgMCAwIDguOTZ6bTAtNi4zM2ExLjg1IDEuODUgMCAxIDEgMCAzLjcgMS44NSAxLjg1IDAgMCAxIDAtMy43em0wIDAiLz48cGF0aCBkPSJNODguNDkgNDguNTNINDYuOThjLS45IDAtMS42NC43My0xLjY0IDEuNjRWODUuM2MwIC45Ljc0IDEuNjQgMS42NCAxLjY0aDQxLjVjLjkxIDAgMS42NC0uNzQgMS42NC0xLjY0VjUwLjE3YzAtLjktLjczLTEuNjQtMS42My0xLjY0Wm0tLjk5IDIuNjJ2MjAuNzdsLTguMjUtOC4yNWExLjM4IDEuMzggMCAwIDAtMS45NSAwTDY1LjYzIDc1LjM0bC03LjQ2LTcuNDZhMS4zNyAxLjM3IDAgMCAwLTEuOTUgMGwtOC4yNSA4LjI1VjUxLjE1Wk00Ny45NyA4NC4zMXYtNC40N2w5LjIyLTkuMjIgNy40NiA3LjQ1YTEuMzcgMS4zNyAwIDAgMCAxLjk1IDBMNzguMjcgNjYuNGw5LjIzIDkuMjN2OC42OHptMCAwIi8+PC9nPjwvc3ZnPg==`;
const crypto = new NNCrypto();
const fs = localforage.createInstance({
  storeName: "notesnook-fs",
  name: "NotesnookFS",
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
});

fs.hasItem = async function (key) {
  const keys = await fs.keys();
  return keys.includes(key);
};

/**
 * We perform 4 steps here:
 * 1. We convert base64 to Uint8Array (if we get base64, that is)
 * 2. We hash the Uint8Array.
 * 3. We encrypt the Uint8Array
 * 4. We save the encrypted Uint8Array
 */
async function writeEncrypted(filename, { data, type, key }) {
  const saveAsBuffer = localforage.supports(localforage.INDEXEDDB);

  if (type === "base64") data = new Uint8Array(Buffer.from(data, "base64"));
  const { hash, type: hashType } = await hashBuffer(data);
  if (!filename) filename = hash;

  if (await fs.hasItem(filename)) return { hash, hashType };

  const output = saveAsBuffer
    ? await crypto.encryptBinary(key, data, "buffer")
    : await crypto.encrypt(key, data, "buffer");

  await fs.setItem(filename, output.cipher);
  return {
    hash,
    hashType,
    iv: output.iv,
    length: output.length,
    salt: output.salt,
    alg: output.alg,
  };
}

async function hashBuffer(data) {
  return {
    hash: await xxhash3(data),
    type: "xxh3",
  };
}

async function readEncrypted(filename, key, cipherData) {
  console.log("Reading encrypted file", filename);
  const readAsBuffer = localforage.supports(localforage.INDEXEDDB);
  cipherData.cipher = await fs.getItem(filename);
  if (!cipherData.cipher) {
    console.error(`File not found. Filename: ${filename}`);
    return PLACEHOLDER;
  }

  return readAsBuffer
    ? await crypto.decryptBinary(key, cipherData, cipherData.outputType)
    : await crypto.decrypt(key, cipherData, cipherData.outputType);
}

async function uploadFile(filename, requestOptions) {
  console.log("Request to upload file", filename, requestOptions);
  const { url } = requestOptions;

  let cipher = await fs.getItem(filename);
  if (!cipher) throw new Error(`File not found. Filename: ${filename}`);

  const readAsBuffer = localforage.supports(localforage.INDEXEDDB);
  if (!readAsBuffer)
    cipher = Uint8Array.from(window.atob(cipher), (c) => c.charCodeAt(0));

  const response = await axios.request({
    url: url,
    method: "PUT",
    headers: {
      "Content-Type": "",
    },
    data: new Blob([cipher.buffer]),
    onUploadProgress: (ev) => {
      console.log("Uploading file", filename, ev);
      AppEventManager.publish(AppEvents.UPDATE_ATTACHMENT_PROGRESS, {
        type: "upload",
        hash: filename,
        total: ev.total,
        loaded: ev.loaded,
      });
    },
  });

  console.log("File uploaded:", filename, response);
  return isSuccessStatusCode(response.status);
}

async function downloadFile(filename, requestOptions) {
  const { url, headers } = requestOptions;
  console.log("Request to download file", filename, url, headers);
  if (await fs.hasItem(filename)) return true;

  const response = await axios.get(url, {
    headers: headers,
    responseType: "blob",
    onDownloadProgress: (ev) => {
      console.log("Downloading file", filename, ev);
      AppEventManager.publish(AppEvents.UPDATE_ATTACHMENT_PROGRESS, {
        type: "download",
        hash: filename,
        total: ev.total,
        loaded: ev.loaded,
      });
    },
  });
  console.log("File downloaded", filename, url, response);
  if (!isSuccessStatusCode(response.status)) return false;
  const blob = new Blob([response.data]);
  await fs.setItem(filename, new Uint8Array(await blob.arrayBuffer()));
  return true;
}

async function deleteFile(filename, requestOptions) {
  const { url, headers } = requestOptions;
  console.log("Request to delete file", filename, url, headers);
  if (!(await fs.hasItem(filename))) return true;

  const response = await axios.delete(url, {
    headers: headers,
  });
  const result = isSuccessStatusCode(response.status);
  // if (result) await fs.removeItem(filename);
  return result;
}

function exists(filename) {
  return fs.hasItem(filename);
}

const FS = {
  writeEncrypted,
  readEncrypted,
  uploadFile,
  downloadFile,
  deleteFile,
  exists,
};
export default FS;

function isSuccessStatusCode(statusCode) {
  return statusCode >= 200 && statusCode <= 299;
}
