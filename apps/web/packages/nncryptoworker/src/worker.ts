import { NNCrypto } from "nncrypto";
import { SerializedKey } from "nncrypto/dist/src/types";
import { expose } from "comlink";
import WorkerStream from "./workerstream";

const crypto = new NNCrypto();

const module = {
  exportKey: crypto.exportKey.bind(crypto),
  deriveKey: crypto.deriveKey.bind(crypto),
  encrypt: crypto.encrypt.bind(crypto),
  decrypt: crypto.decrypt.bind(crypto),
  hash: crypto.hash.bind(crypto),
  createEncryptionStream: (id: string, key: SerializedKey) => {
    return crypto.createEncryptionStream(key, new WorkerStream(id));
  },
  createDecryptionStream: (id: string, iv: string, key: SerializedKey) => {
    return crypto.createDecryptionStream(iv, key, new WorkerStream(id));
  },
};

export type NNCryptoWorkerModule = typeof module;

expose(module);
