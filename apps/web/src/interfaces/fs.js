import NNCrypto from "./nncrypto/index";
import localforage from "localforage";
import xxhash from "xxhash-wasm";
import { xxhash3 } from "hash-wasm";
import axios from "axios";

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
    hash: xxhash3(data),
    type: "xxh3",
  };
}

async function readEncrypted(filename, key, cipherData) {
  console.log("Reading encrypted file", filename);
  const readAsBuffer = localforage.supports(localforage.INDEXEDDB);
  cipherData.cipher = await fs.getItem(filename);
  if (!cipherData.cipher)
    throw new Error(`File not found. Filename: ${filename}`);

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

const FS = {
  writeEncrypted,
  readEncrypted,
  uploadFile,
  downloadFile,
  deleteFile,
};
export default FS;

function isSuccessStatusCode(statusCode) {
  return statusCode >= 200 && statusCode <= 299;
}
