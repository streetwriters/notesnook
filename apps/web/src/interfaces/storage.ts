import localforage from "localforage";
import { extendPrototype } from "localforage-getitems";
import * as MemoryDriver from "localforage-driver-memory";
import { getNNCrypto } from "./nncrypto.stub";
import { Cipher, SerializedKey } from "@notesnook/crypto/dist/src/types";

type EncryptedKey = { iv: Uint8Array; cipher: BufferSource };

localforage.defineDriver(MemoryDriver);
extendPrototype(localforage);
const APP_SALT = "oVzKtazBo7d8sb7TBvY9jw";

export class NNStorage {
  database: LocalForage;
  constructor(persistence: "memory" | "db" = "db") {
    const drivers =
      persistence === "memory"
        ? [MemoryDriver._driver]
        : [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE];
    this.database = localforage.createInstance({
      name: "Notesnook",
      driver: drivers,
    });
  }

  read<T>(key: string): Promise<T | null> {
    if (!key) return Promise.resolve(null);
    return this.database.getItem(key);
  }

  readMulti(keys: string[]) {
    if (keys.length <= 0) return [];
    return this.database.getItems(keys.sort());
  }

  write<T>(key: string, data: T) {
    return this.database.setItem(key, data);
  }

  remove(key: string) {
    return this.database.removeItem(key);
  }

  clear() {
    return this.database.clear();
  }

  getAllKeys() {
    return this.database.keys();
  }

  async deriveCryptoKey(name: string, credentials: SerializedKey) {
    const { password, salt } = credentials;
    if (!password) throw new Error("Invalid data provided to deriveCryptoKey.");

    const crypto = await getNNCrypto();
    const keyData = await crypto.exportKey(password, salt);

    if (this.isIndexedDBSupported() && window?.crypto?.subtle) {
      const pbkdfKey = await derivePBKDF2Key(password);
      await this.write(name, pbkdfKey);
      const cipheredKey = await aesEncrypt(pbkdfKey, keyData.key!);
      await this.write(`${name}@_k`, cipheredKey);
    } else {
      await this.write(`${name}@_k`, keyData.key);
    }
  }

  async getCryptoKey(name: string): Promise<string | undefined> {
    if (this.isIndexedDBSupported() && window?.crypto?.subtle) {
      const pbkdfKey = await this.read<CryptoKey>(name);
      const cipheredKey = await this.read<EncryptedKey | string>(`${name}@_k`);
      if (typeof cipheredKey === "string") return cipheredKey;
      if (!pbkdfKey || !cipheredKey) return;
      return await aesDecrypt(pbkdfKey, cipheredKey);
    } else {
      const key = await this.read<string>(`${name}@_k`);
      if (!key) return;
      return key;
    }
  }

  isIndexedDBSupported(): boolean {
    return this.database.driver() === "asyncStorage";
  }

  async generateCryptoKey(
    password: string,
    salt?: string
  ): Promise<SerializedKey> {
    if (!password)
      throw new Error("Invalid data provided to generateCryptoKey.");
    const crypto = await getNNCrypto();
    return await crypto.exportKey(password, salt);
  }

  async hash(password: string, email: string): Promise<string> {
    const crypto = await getNNCrypto();
    return await crypto.hash(password, `${APP_SALT}${email}`);
  }

  async encrypt(key: SerializedKey, plainText: string): Promise<Cipher> {
    const crypto = await getNNCrypto();
    return await crypto.encrypt(
      key,
      { format: "text", data: plainText },
      "base64"
    );
  }

  async decrypt(
    key: SerializedKey,
    cipherData: Cipher
  ): Promise<string | undefined> {
    const crypto = await getNNCrypto();
    cipherData.format = "base64";
    const result = await crypto.decrypt(key, cipherData);
    if (typeof result.data === "string") return result.data;
  }
}

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
