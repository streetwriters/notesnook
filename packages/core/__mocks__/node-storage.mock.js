import { NNCrypto } from "@notesnook/crypto";

export class NodeStorageInterface {
  constructor() {
    this.storage = {};
    this.crypto = new NNCrypto();
  }

  async read(key) {
    return new Promise((resolve) => resolve(this.storage[key]));
  }

  async readMulti(keys) {
    return new Promise((resolve) => {
      const result = [];
      keys.forEach((key) => {
        result.push([key, this.storage[key]]);
      });
      resolve(result);
    });
  }

  async write(key, data) {
    return new Promise((resolve) => resolve((this.storage[key] = data)));
  }
  remove(key) {
    delete this.storage[key];
  }
  clear() {
    this.storage = {};
  }
  getAllKeys() {
    return Object.keys(this.storage);
  }

  async encrypt(password, data) {
    return await this.crypto.encrypt(
      password,
      { format: "text", data },
      "base64"
    );
  }

  async decrypt(key, cipherData) {
    cipherData.format = "base64";
    const result = await this.crypto.decrypt(key, cipherData);
    if (typeof result.data === "string") return result.data;
  }

  async deriveCryptoKey(name, { password, salt }) {
    const keyData = await this.crypto.exportKey(password, salt);
    await this.write(`${name}@_k`, keyData.key);
  }

  async getCryptoKey(name) {
    const key = await this.read(`${name}@_k`);
    if (!key) return;
    return key;
  }

  async hash(password, email) {
    const APP_SALT = "oVzKtazBo7d8sb7TBvY9jw";
    return await this.crypto.hash(password, `${APP_SALT}${email}`);
  }

  async generateCryptoKey(password, salt) {
    return { password, salt };
  }
}
