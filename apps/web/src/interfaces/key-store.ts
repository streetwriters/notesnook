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

import { Cipher } from "@notesnook/crypto";
import { IKVStore, IndexedDBKVStore, MemoryKVStore } from "./key-value";
import { NNCrypto } from "./nncrypto";
import { isFeatureSupported } from "../utils/feature-check";
import { isCipher } from "@notesnook/core/dist/database/crypto";
import { desktop } from "../common/desktop-bridge";

type BaseCredential = { id: string };
type PasswordCredential = BaseCredential & {
  type: "password";
  password: string;
};

type KeyCredential = BaseCredential & {
  type: "key";
  key: CryptoKey;
};

type Credential = PasswordCredential | KeyCredential;
export type SerializableCredential = Omit<Credential, "key" | "password">;

type EncryptedData = {
  iv: Uint8Array;
  cipher: ArrayBuffer;
};

function isEncryptedData(data: any): data is EncryptedData {
  return data.iv instanceof Uint8Array && typeof data.cipher !== "string";
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * This is not "super" secure but there's nothing better on Web.
 * Ideally, the key store should be encrypted with user's password
 * or user's biometric. Since we don't have any of that, we have to
 * resort to using CryptoKeys which are "non-exportable" when stored
 * in IndexedDB. That doesn't mean they are "secure" - just that no
 * one can run off with them. They can still be used by scripts for
 * encryption/decryption in the browser.
 *
 * There's 4 problems with this:
 * 1. Anyone can use the CryptoKeys to encrypt/decrypt values in the
 *    keystore
 * 2. Anyone can delete the CryptoKeys causing data corruption since
 *    without the CryptoKeys, there's no way to decrypt the values in
 *    the keystore.
 * 3. Anyone can modify the values.
 * 4. Anyone can add new values.
 *
 * In short, there's no way to guarantee data integrity i.e., a keystore
 * cannot sustain 99% of attack vectors inside the browser.
 *
 * What if we use user's password/pin?
 *
 * 1. This will only work if the pin/password is not stored in any way and
 *    requested everytime.
 * 2. No one can decrypt values in the keystore without the pin/password
 * 3. Anyone can add new values & modify old ones (there's no write lock).
 *    However, modification is pointless since changing a single byte would
 *    trigger HMAC authentication error. Adding new values is also pointless
 *    because the app won't ever read them.
 * 4. The values can be deleted in which case we will have a sabotaged database
 *    but the attacker still won't have any access to the actual data.
 * 5. In conclusion, this is the most secure way for devices where there's no
 *    system level keystore. The compromise here is that the database won't be
 *    encrypted if the user doesn't turn on app lock.
 */
class KeyStore {
  private secretStore: IKVStore;
  private metadataStore: IKVStore;
  private keyId = "key";
  private key?: CryptoKey;

  constructor(dbName: string) {
    this.metadataStore = isFeatureSupported("indexedDB")
      ? new IndexedDBKVStore(`${dbName}-metadata`, "metadata")
      : new MemoryKVStore();
    this.secretStore = isFeatureSupported("indexedDB")
      ? new IndexedDBKVStore(`${dbName}-secrets`, "secrets")
      : new MemoryKVStore();
  }

  public async lock(credential: Credential) {
    const originalKey = await this.getKey();
    const key = new Uint8Array(
      await window.crypto.subtle.exportKey("raw", originalKey)
    );

    await this.metadataStore.set(
      this.getCredentialKey(credential),
      await this.encryptKey(credential, key)
    );

    await this.metadataStore.delete(this.keyId);
    await this.setCredential({ id: credential.id, type: credential.type });

    this.key = originalKey;
    return this;
  }

  public async unlock(
    credential: Credential,
    options?: {
      permanent?: boolean;
    }
  ) {
    if (!(await this.hasCredential(credential))) return;

    const encryptedKey = await this.metadataStore.get<
      Cipher<"base64"> | EncryptedData
    >(this.getCredentialKey(credential));
    if (!encryptedKey) return this;

    const decryptedKey = await this.decryptKey(encryptedKey, credential);
    if (!decryptedKey) throw new Error("Could not decrypt key.");

    const key = await window.crypto.subtle.importKey(
      "raw",
      decryptedKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    if (options?.permanent) {
      await this.resetCredentials();
      await this.storeKey(key);
      this.key = undefined;
    } else this.key = key;

    return this;
  }

  public relock() {
    this.key = undefined;
  }

  public async changeCredential(
    oldCredential: Credential,
    newCredential: Credential
  ) {
    const encryptedKey = await this.metadataStore.get<Cipher<"base64">>(
      this.getCredentialKey(oldCredential)
    );
    if (!encryptedKey) return this;

    const decryptedKey = await this.decryptKey(encryptedKey, oldCredential);
    if (!decryptedKey) throw new Error("Could not decrypt key.");

    const reencryptedKey = await this.encryptKey(newCredential, decryptedKey);
    if (!reencryptedKey) throw new Error("Could not reencrypt key.");

    await this.metadataStore.set(
      this.getCredentialKey(newCredential),
      reencryptedKey
    );
  }

  public async verifyCredential(credential: Credential) {
    try {
      const encryptedKey = await this.metadataStore.get<Cipher<"base64">>(
        this.getCredentialKey(credential)
      );
      if (!encryptedKey) return false;

      const decryptedKey = await this.decryptKey(encryptedKey, credential);
      return !!decryptedKey;
    } catch {
      return false;
    }
  }

  public async removeCredential(credential: SerializableCredential) {
    await this.metadataStore.delete(this.getCredentialKey(credential));
    const credentials = await this.getCredentials();
    const index = credentials.findIndex(
      (c) => c.type === credential.type && c.id === credential.id
    );
    credentials.splice(index, 1);
    this.metadataStore.set("credentials", credentials);
  }

  public async extractKey() {
    if (await this.isLocked())
      throw new Error("Please unlock the key store to extract its key.");

    const key = await window.crypto.subtle.exportKey(
      "raw",
      await this.getKey()
    );
    return Buffer.from(key).toString("base64");
  }

  async isLocked() {
    return (await this.getCredentials()).length > 0 && !this.key;
  }

  public async getCredentials() {
    return (
      (await this.metadataStore.get<SerializableCredential[]>("credentials")) ||
      []
    );
  }

  public async hasCredential(credential: SerializableCredential) {
    const credentials = await this.getCredentials();
    const index = credentials.findIndex(
      (c) => c.type === credential.type && c.id === credential.id
    );
    return index > -1;
  }

  public async resetCredentials() {
    for (const credential of await this.getCredentials()) {
      await this.metadataStore.delete(this.getCredentialKey(credential));
    }
    await this.metadataStore.delete("credentials");
  }

  public async setCredential(credential: SerializableCredential) {
    const credentials = await this.getCredentials();
    const index = credentials.findIndex(
      (c) => c.type === credential.type && c.id === credential.id
    );
    if (index > -1) return;
    credentials.push(credential);
    await this.metadataStore.set("credentials", credentials);
  }

  public async set(name: string, value: string) {
    if (await this.isLocked())
      throw new Error("Please unlock the key store to set values.");

    return this.secretStore.set(
      name,
      await this.encrypt(value, await this.getKey())
    );
  }

  public async get(name: string): Promise<string | undefined> {
    if (await this.isLocked())
      throw new Error("Please unlock the key store to get values.");
    console.log("GETTING", name);
    const blob = await this.secretStore.get<EncryptedData>(name);
    if (!blob) return;
    return this.decrypt(blob, await this.getKey());
  }

  public async clear(): Promise<void> {
    await this.secretStore.clear();
    await this.metadataStore.clear();
    this.key = undefined;
  }

  private async decryptKey(
    encryptedKey: Cipher<"base64"> | EncryptedData,
    credential: PasswordCredential | KeyCredential
  ): Promise<Uint8Array | undefined> {
    if (credential.type === "password" && isCipher(encryptedKey)) {
      return await NNCrypto.decrypt(
        { password: credential.password },
        encryptedKey,
        "uint8array"
      );
    } else if (credential.type === "key" && isEncryptedData(encryptedKey)) {
      return new Uint8Array(
        await window.crypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: encryptedKey.iv
          },
          credential.key,
          encryptedKey.cipher
        )
      );
    }
  }

  private async encryptKey(
    credential: PasswordCredential | KeyCredential,
    key: Uint8Array
  ) {
    if (credential.type === "password") {
      return await NNCrypto.encrypt(
        { password: credential.password },
        key,
        "uint8array",
        "base64"
      );
    } else if (credential.type === "key") {
      if (!credential.key?.usages.includes("encrypt"))
        throw new Error("Cannot use this key to encrypt.");

      return await this.encrypt(key, credential.key);
    }
  }

  private async getKey() {
    if (this.key) return this.key;
    if ((await this.getCredentials()).length > 0)
      throw new Error("Key store is locked.");

    const key = await this.metadataStore.get<Uint8Array | CryptoKey>(
      this.keyId
    );

    if (key instanceof Uint8Array) {
      if (!desktop)
        throw new Error("Cannot decrypt key: no safe storage found.");
      const decrypted = Buffer.from(
        await desktop.safeStorage.decryptString.query(
          Buffer.from(key).toString("base64")
        ),
        "base64"
      );
      return window.crypto.subtle.importKey(
        "raw",
        decrypted,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
    } else if (key instanceof CryptoKey) return key;
    else return this.storeKey();
  }

  private async storeKey(key?: CryptoKey) {
    key =
      key ||
      (await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256
        },
        true,
        ["encrypt", "decrypt"]
      ));

    if (IS_DESKTOP_APP && desktop) {
      const encrypted = Buffer.from(
        await desktop.safeStorage.encryptString.query(
          Buffer.from(
            await window.crypto.subtle.exportKey("raw", key)
          ).toString("base64")
        ),
        "base64"
      );
      await this.metadataStore.set(this.keyId, encrypted);
    } else await this.metadataStore.set(this.keyId, key);

    return key;
  }

  private async encrypt(data: string | ArrayBuffer, key: CryptoKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const cipher = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      typeof data === "string" ? encoder.encode(data) : data
    );

    return <EncryptedData>{
      iv,
      cipher
    };
  }

  private async decrypt(data: EncryptedData, key: CryptoKey) {
    const plainText = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: data.iv
      },
      key,
      data.cipher
    );
    return decoder.decode(plainText);
  }

  private getCredentialKey(credential: SerializableCredential) {
    return `${this.keyId}-${credential.type}-${credential.id}`;
  }
}

export const KeyChain = new KeyStore("KeyChain");
export type IKeyStore = typeof KeyStore.prototype;
