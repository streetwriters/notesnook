import localforage from "localforage";
import { extendPrototype } from "localforage-getitems";
import sort from "fast-sort";
import { getNNCrypto } from "./nncrypto.stub";
import { Cipher, SerializedKey } from "@notesnook/crypto/dist/src/types";

type EncryptedKey = { iv: Uint8Array; cipher: BufferSource };

extendPrototype(localforage);
const APP_SALT = "oVzKtazBo7d8sb7TBvY9jw";

localforage.config({
  name: "Notesnook",
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
});

function read<T>(key: string): Promise<T | null> {
  return localforage.getItem(key);
}

function readMulti(keys: string[]) {
  if (keys.length <= 0) return [];
  return localforage.getItems(sort(keys).asc());
}

function write<T>(key: string, data: T) {
  return localforage.setItem(key, data);
}

function remove(key: string) {
  return localforage.removeItem(key);
}

function clear() {
  return localforage.clear();
}

function getAllKeys() {
  return localforage.keys();
}

async function deriveCryptoKey(name: string, credentials: SerializedKey) {
  const { password, salt } = credentials;
  if (!password) throw new Error("Invalid data provided to deriveCryptoKey.");

  const crypto = await getNNCrypto();
  const keyData = await crypto.exportKey(password, salt);

  if (isIndexedDBSupported() && window?.crypto?.subtle) {
    const pbkdfKey = await derivePBKDF2Key(password);
    await write(name, pbkdfKey);
    const cipheredKey = await aesEncrypt(pbkdfKey, keyData.key!);
    await write(`${name}@_k`, cipheredKey);
  } else {
    await write(`${name}@_k`, keyData.key);
  }
}

async function getCryptoKey(name: string) {
  if (isIndexedDBSupported() && window?.crypto?.subtle) {
    const pbkdfKey = await read<CryptoKey>(name);
    const cipheredKey = await read<EncryptedKey>(`${name}@_k`);
    if (typeof cipheredKey === "string") return cipheredKey;
    if (!pbkdfKey || !cipheredKey) return;
    return await aesDecrypt(pbkdfKey, cipheredKey);
  } else {
    return await read(`${name}@_k`);
  }
}

function isIndexedDBSupported(): boolean {
  return localforage.driver() === "asyncStorage";
}

async function generateCryptoKey(
  password: string,
  salt?: string
): Promise<SerializedKey> {
  if (!password) throw new Error("Invalid data provided to generateCryptoKey.");
  const crypto = await getNNCrypto();
  return await crypto.exportKey(password, salt);
}

async function hash(password: string, email: string): Promise<string> {
  const crypto = await getNNCrypto();
  return await crypto.hash(password, `${APP_SALT}${email}`);
}

async function encrypt(key: SerializedKey, plainText: string): Promise<Cipher> {
  const crypto = await getNNCrypto();
  return await crypto.encrypt(
    key,
    { format: "text", data: plainText },
    "base64"
  );
}

async function decrypt(
  key: SerializedKey,
  cipherData: Cipher
): Promise<string | undefined> {
  const crypto = await getNNCrypto();
  cipherData.format = "base64";
  const result = await crypto.decrypt(key, cipherData);
  if (typeof result.data === "string") return result.data;
}

const Storage = {
  read,
  readMulti,
  write,
  remove,
  clear,
  getAllKeys,
  generateCryptoKey,
  deriveCryptoKey,
  getCryptoKey,
  hash,
  encrypt,
  decrypt,
};
export default Storage;

let enc = new TextEncoder();
let dec = new TextDecoder();

async function derivePBKDF2Key(password: string): Promise<CryptoKey> {
  const key = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  let salt = window.crypto.getRandomValues(new Uint8Array(16));
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function aesEncrypt(
  cryptoKey: CryptoKey,
  data: string
): Promise<EncryptedKey> {
  let iv = window.crypto.getRandomValues(new Uint8Array(12));

  const cipher = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    cryptoKey,
    enc.encode(data)
  );

  return {
    iv,
    cipher,
  };
}

async function aesDecrypt(
  cryptoKey: CryptoKey,
  data: EncryptedKey
): Promise<string> {
  const { iv, cipher } = data;

  const plainText = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    cryptoKey,
    cipher
  );
  return dec.decode(plainText);
}
