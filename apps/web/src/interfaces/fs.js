import NNCrypto from "./nncrypto/index";
import localforage from "localforage";
import xxhash from "xxhash-wasm";

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
  const hasher = await xxhash();
  return {
    hash: Buffer.from(hasher.h64Raw(data)).toString("base64"),
    type: "xxh64",
  };
}

async function readEncrypted(filename, key, cipherData) {
  const readAsBuffer = localforage.supports(localforage.INDEXEDDB);
  cipherData.cipher = await fs.getItem(filename);
  if (!cipherData.cipher)
    throw new Error(`File not found. Filename: ${filename}`);

  return readAsBuffer
    ? await crypto.decryptBinary(key, cipherData, cipherData.outputType)
    : await crypto.decrypt(key, cipherData, cipherData.outputType);
}

const FS = { writeEncrypted, readEncrypted };
export default FS;
