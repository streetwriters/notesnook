import {
  Cipher,
  OutputFormat,
  Plaintext,
  SerializedKey,
} from "nncrypto/dist/src/types";
import { expose } from "comlink";
import WorkerStream from "./workerstream";
import { NNCrypto } from "nncrypto";

var crypto: NNCrypto | null = null;
async function loadNNCrypto(): Promise<NNCrypto> {
  if (crypto) return crypto;
  const { NNCrypto } = await import("nncrypto");
  return (crypto = new NNCrypto());
}

const module = {
  exportKey: async function (password: string, salt?: string) {
    const crypto = await loadNNCrypto();
    return crypto.exportKey(password, salt);
  },
  deriveKey: async function (password: string, salt?: string) {
    const crypto = await loadNNCrypto();
    return crypto.deriveKey(password, salt);
  },
  hash: async function (password: string, salt: string) {
    const crypto = await loadNNCrypto();
    return crypto.hash(password, salt);
  },
  encrypt: async function (
    key: SerializedKey,
    plaintext: Plaintext,
    outputFormat?: OutputFormat
  ) {
    const crypto = await loadNNCrypto();
    return crypto.encrypt(key, plaintext, outputFormat);
  },
  decrypt: async function (
    key: SerializedKey,
    cipherData: Cipher,
    outputFormat?: OutputFormat
  ) {
    const crypto = await loadNNCrypto();
    return crypto.decrypt(key, cipherData, outputFormat);
  },
  createEncryptionStream: async function (id: string, key: SerializedKey) {
    const crypto = await loadNNCrypto();
    return crypto.createEncryptionStream(key, new WorkerStream(id));
  },
  createDecryptionStream: async function (
    id: string,
    iv: string,
    key: SerializedKey
  ) {
    const crypto = await loadNNCrypto();
    return crypto.createDecryptionStream(iv, key, new WorkerStream(id));
  },
};

export type NNCryptoWorkerModule = typeof module;

expose(module);
