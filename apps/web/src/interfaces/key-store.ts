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

import { IKVStore, IndexedDBKVStore, MemoryKVStore } from "./key-value";
import { isFeatureSupported } from "../utils/feature-check";
import { desktop } from "../common/desktop-bridge";
import { SecurityKeyConfig } from "../utils/webauthn";
import BaseStore, { GetState, SetState } from "../stores";
import createStore from "../common/store";

// Key chain credentials:
/**
 * 1. Security key
 *    - changeable: false
 * 2. Password/pin
 *    - changeable: true
 * 3. Private/public key pair
 *    - changeable: true
 * 4. QR Code Scan from another app
 *    - changeable: true
 */

export type CredentialType = "password" | "securityKey";
type BaseCredential<T extends CredentialType> = { type: T; id: string };
type PasswordCredential = BaseCredential<"password"> & {
  password: string;
  salt: Uint8Array;
  iterations: number | undefined;
};

type SecurityKeyCredential = BaseCredential<"securityKey"> & {
  key: CryptoKey;
  config: SecurityKeyConfig;
};

type Credential = PasswordCredential | SecurityKeyCredential;

export type CredentialWithoutSecret =
  | Omit<PasswordCredential, "password">
  | Omit<SecurityKeyCredential, "key">;

export type SerializableCredential = CredentialWithoutSecret & {
  active: boolean;
};
export type CredentialWithSecret =
  | Omit<PasswordCredential, "salt" | "iterations">
  | Omit<SecurityKeyCredential, "config">;
export type CredentialQuery = BaseCredential<CredentialType> & {
  active?: boolean;
};

type EncryptedData = {
  iv: Uint8Array;
  cipher: ArrayBuffer;
};

function isCredentialWithSecret(
  c: CredentialWithSecret | CredentialWithoutSecret
): c is CredentialWithSecret {
  return "key" in c || "password" in c;
}

const defaultSecrets = {
  databaseKey: new ArrayBuffer(0),
  lockAfter: 0,
  userEncryptionKey: ""
};
type Secrets = typeof defaultSecrets;

export const DEFAULT_ITERATIONS = 100000;
const FALLBACK_ITERATIONS = 650000;
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

class KeyStore extends BaseStore<KeyStore> {
  #secretStore!: IKVStore;
  #metadataStore!: IKVStore;
  #keyId = "key";
  #wrappingKeyId = "wrappingKey";
  #key?: CryptoKey;

  credentials: SerializableCredential[] = [];
  secrets: Record<string, EncryptedData> = {};
  isLocked = false;

  constructor(
    private readonly dbName: string,
    setState: SetState<KeyStore>,
    get: GetState<KeyStore>
  ) {
    super(setState, get);
  }

  activeCredentials = () => this.get().credentials.filter((c) => c.active);

  init = async () => {
    this.#metadataStore =
      isFeatureSupported("indexedDB") && isFeatureSupported("clonableCryptoKey")
        ? new IndexedDBKVStore(`${this.dbName}-metadata`, "metadata")
        : new MemoryKVStore();
    this.#secretStore =
      isFeatureSupported("indexedDB") && isFeatureSupported("clonableCryptoKey")
        ? new IndexedDBKVStore(`${this.dbName}-secrets`, "secrets")
        : new MemoryKVStore();

    const credentials = await this.getCredentials();
    const secrets = Object.fromEntries(
      await this.#secretStore.entries<EncryptedData>()
    );
    this.set({
      credentials,
      secrets,
      isLocked: credentials.some((c) => c.active)
    });
  };

  register = async (credential: CredentialWithoutSecret) => {
    const { credentials } = this.get();
    const index = credentials.findIndex(
      (c) => c.type === credential.type && c.id === credential.id
    );
    if (index > -1) return credentials[index];

    this.set((store) =>
      store.credentials.push(serializeCredential(credential, false))
    );
    await this.#metadataStore.set("credentials", this.get().credentials);
    return credential;
  };

  unregister = async (
    credential: CredentialWithSecret | CredentialWithoutSecret
  ) => {
    const { credentials } = this.get();
    const index = credentials.findIndex((c) => matchCredential(c, credential));
    if (index <= -1) throw new Error("No such credential.");

    if (
      isCredentialWithSecret(credential) &&
      (await this.credentialHasKey(credential)) &&
      !(await this.verifyCredential(credential))
    )
      throw new Error(wrongCredentialError(credential));

    this.set((store) => store.credentials.splice(index, 1));

    await this.#metadataStore.delete(this.getCredentialKey(credential));
    await this.#metadataStore.set("credentials", this.get().credentials);
  };

  activate = async (
    credential: CredentialWithSecret | CredentialWithoutSecret
  ) => {
    const cred = this.findCredential(credential);
    if (!cred)
      throw new Error(`No credential with id "${credential.id}" registered.`);

    if (await this.credentialHasKey(credential)) {
      await this.update(credential, (c) => (c.active = true));
      return;
    }

    if (!isCredentialWithSecret(credential))
      throw new Error("Invalid credential.");

    const originalKey = await this.getKey();
    await this.#metadataStore.set(
      this.getCredentialKey(credential),
      await wrapKey(
        originalKey,
        await getWrappingKey(deserializeCredential(cred, credential))
      )
    );
    await this.#metadataStore.deleteMany([this.#keyId, this.#wrappingKeyId]);
    this.#key = originalKey;
    this.set({ isLocked: false });
    await this.update(credential, (c) => (c.active = true));
  };

  credentialHasKey = async (credential: CredentialQuery) => {
    return !!(await this.#metadataStore.get(this.getCredentialKey(credential)));
  };

  deactivate = async (credential: CredentialWithSecret) => {
    if (!(await this.verifyCredential(credential)))
      throw new Error(wrongCredentialError(credential));

    const cred = this.findCredential(credential);
    if (!cred)
      throw new Error(`No credential with id "${credential.id}" registered.`);

    await this.update(credential, (c) => (c.active = false));
    this.set({ isLocked: false });
  };

  unlock = async (
    credential: CredentialWithSecret,
    options?: {
      permanent?: boolean;
    }
  ) => {
    const cred = this.findCredential(credential);
    if (!cred) throw new Error("Could not find a valid credential.");

    const encryptedKey = await this.#metadataStore.get<ArrayBuffer>(
      this.getCredentialKey(credential)
    );
    if (!encryptedKey)
      throw new Error("Could not find credential's encrypted key.");

    const key = await unwrapKey(encryptedKey, [
      await getWrappingKey(deserializeCredential(cred, credential)),
      await getWrappingKey(fallbackCredential(cred, credential))
    ]).catch((e) => {
      if (e instanceof Error && e.message === "Could not unwrap key.")
        throw new Error(wrongCredentialError(credential));
      throw e;
    });
    if (options?.permanent) {
      await this.resetCredentials();
      await this.storeKey(key);
      this.#key = undefined;
    } else this.#key = key;

    this.set({ isLocked: false });
  };

  relock = () => {
    this.#key = undefined;
    this.set({ isLocked: true });
  };

  findCredential = (credential: CredentialQuery) => {
    return this.get().credentials.find((c) => matchCredential(c, credential));
  };

  hasCredential = (credential: CredentialQuery) => {
    return !!this.findCredential(credential);
  };

  changeCredential = async (
    oldCredential: CredentialWithSecret,
    newCredential: CredentialWithSecret
  ) => {
    const cred = this.findCredential(oldCredential);
    if (!cred) throw new Error("Could not find a valid credential.");

    const encryptedKey = await this.#metadataStore.get<ArrayBuffer>(
      this.getCredentialKey(oldCredential)
    );
    if (!encryptedKey) return;

    const decryptedKey = await unwrapKey(encryptedKey, [
      await getWrappingKey(deserializeCredential(cred, oldCredential)),
      await getWrappingKey(fallbackCredential(cred, oldCredential))
    ]);

    const newCred = deserializeCredential(cred, newCredential);
    const reencryptedKey = await wrapKey(
      decryptedKey,
      await getWrappingKey(newCred)
    );
    if (!reencryptedKey) throw new Error(wrongCredentialError(newCredential));

    await this.#metadataStore.set(
      this.getCredentialKey(newCredential),
      reencryptedKey
    );
    await this.update(oldCredential, (c) => {
      if (c.type === "password" && newCred.type === "password")
        c.iterations = newCred.iterations;
    });
  };

  verifyCredential = async (credential: CredentialWithSecret) => {
    try {
      const cred = this.findCredential(credential);
      if (!cred) return false;

      const encryptedKey = await this.#metadataStore.get<ArrayBuffer>(
        this.getCredentialKey(credential)
      );
      if (!encryptedKey) return false;

      const decryptedKey = await unwrapKey(encryptedKey, [
        await getWrappingKey(deserializeCredential(cred, credential)),
        await getWrappingKey(fallbackCredential(cred, credential))
      ]);
      return !!decryptedKey;
    } catch {
      return false;
    }
  };

  setValue = async <T extends keyof Secrets>(name: T, value: Secrets[T]) => {
    if (this.get().isLocked)
      throw new Error("Please unlock the key store to set values.");

    const encryptedValue = await encrypt(value, await this.getKey());
    await this.#secretStore.set(name, encryptedValue).then(() =>
      this.set((store) => {
        store.secrets = { ...store.secrets, [name]: encryptedValue };
      })
    );
  };

  getValue = async <T extends keyof Secrets>(
    name: T
  ): Promise<Secrets[T] | undefined> => {
    const { isLocked, secrets } = this.get();
    if (isLocked) throw new Error("Please unlock the key store to get values.");
    const blob = secrets[name];
    if (!blob) return;
    const decryptedBlob = await decrypt(blob, await this.getKey());
    if (defaultSecrets[name] instanceof ArrayBuffer)
      return decryptedBlob as Secrets[T];
    else return JSON.parse(decoder.decode(decryptedBlob)).value as Secrets[T];
  };

  clear = async () => {
    await this.#metadataStore?.clear();
    await this.#secretStore?.clear();
    this.#key = undefined;
    this.set({ credentials: [], secrets: {}, isLocked: false });
  };

  private update = async (
    query: CredentialQuery,
    patch: (c: SerializableCredential) => void
  ) => {
    const { credentials } = this.get();
    const index = credentials.findIndex((c) => matchCredential(c, query));
    if (index <= -1) return;
    this.set((s) => patch(s.credentials[index]));
    await this.#metadataStore.set("credentials", this.get().credentials);
  };

  private resetCredentials = async () => {
    for (const credential of this.get().credentials) {
      await this.#metadataStore.delete(this.getCredentialKey(credential));
    }
    await this.#metadataStore.delete("credentials");
    this.set({ credentials: [] });
  };

  private getKey = async () => {
    if (this.#key) return this.#key;
    if (this.get().isLocked) throw new Error("Key store is locked.");

    const wrappedKey = await this.#metadataStore.get<ArrayBuffer>(this.#keyId);
    if (!wrappedKey) return this.storeKey();

    const wrappingKey = await this.#metadataStore.get<CryptoKey>(
      this.#wrappingKeyId
    );

    if (
      desktop &&
      !wrappingKey &&
      (await desktop.safeStorage.isEncryptionAvailable.query())
    ) {
      const decrypted = Buffer.from(
        await desktop.safeStorage.decryptString.query(
          Buffer.from(wrappedKey).toString("base64")
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
    } else if (wrappingKey) {
      return unwrapKey(wrappedKey, [wrappingKey]);
    } else throw new Error("Could not decrypt key.");
  };

  private storeKey = async (key?: CryptoKey) => {
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

    if (
      IS_DESKTOP_APP &&
      desktop &&
      (await desktop.safeStorage.isEncryptionAvailable.query())
    ) {
      const encrypted = Buffer.from(
        await desktop.safeStorage.encryptString.query(
          Buffer.from(
            await window.crypto.subtle.exportKey("raw", key)
          ).toString("base64")
        ),
        "base64"
      );
      await this.#metadataStore.set(this.#keyId, encrypted.buffer);
    } else {
      const wrappingKey = await getWrappingKey();
      const wrappedKey = await wrapKey(key, wrappingKey);
      await this.#metadataStore.setMany([
        [this.#wrappingKeyId, wrappingKey],
        [this.#keyId, wrappedKey]
      ]);
    }

    return key;
  };

  private getCredentials = async () => {
    return (
      (await this.#metadataStore.get<SerializableCredential[]>(
        "credentials"
      )) || []
    );
  };

  private getCredentialKey = (credential: CredentialQuery) => {
    return `${this.#keyId}-${credential.type}-${credential.id}`;
  };
}

function serializeCredential(
  credential: Credential | CredentialWithoutSecret,
  active: boolean
): SerializableCredential {
  switch (credential.type) {
    case "password":
      return {
        type: "password",
        id: credential.id,
        active,
        salt: credential.salt,
        iterations: credential.iterations
      };
    case "securityKey":
      return {
        type: "securityKey",
        id: credential.id,
        config: credential.config,
        active
      };
  }
}

function deserializeCredential(
  credential: SerializableCredential,
  secret: CredentialWithSecret
): Credential {
  if (secret.type === "password" && credential.type === "password") {
    return {
      type: "password",
      id: credential.id,
      salt: credential.salt,
      password: secret.password,
      iterations: credential.iterations || DEFAULT_ITERATIONS
    };
  } else if (secret.type === "securityKey" && credential.type === "securityKey")
    return {
      type: "securityKey",
      id: credential.id,
      config: credential.config,
      key: secret.key
    };

  throw new Error("Credentials are of different types.");
}

function fallbackCredential(
  credential: SerializableCredential,
  secret: CredentialWithSecret
): Credential | undefined {
  if (secret.type === "password" && credential.type === "password") {
    return {
      type: "password",
      id: credential.id,
      salt: credential.salt,
      password: secret.password,
      iterations: FALLBACK_ITERATIONS
    };
  }
}

export function wrongCredentialError(query: CredentialQuery): string {
  switch (query.type) {
    case "password":
      return "Wrong password";
    case "securityKey":
      return "Wrong security key.";
  }
}

async function unwrapKey(
  wrappedKey: ArrayBuffer,
  wrappingKeys: CryptoKey[]
): Promise<CryptoKey> {
  for (const key of wrappingKeys) {
    const unwrapped = await window.crypto.subtle
      .unwrapKey(
        "raw",
        wrappedKey,
        key,
        "AES-KW",
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      )
      .catch(() => undefined);
    if (unwrapped) return unwrapped;
  }
  throw new Error("Could not unwrap key.");
}

async function wrapKey(key: CryptoKey, wrappingKey: CryptoKey) {
  return await window.crypto.subtle.wrapKey("raw", key, wrappingKey, "AES-KW");
}

async function getWrappingKey(credential?: Credential): Promise<CryptoKey> {
  let wrappingKey: CryptoKey | undefined;

  if (!credential)
    wrappingKey = await window.crypto.subtle.generateKey(
      { name: "AES-KW", length: 256 },
      false,
      ["wrapKey", "unwrapKey"]
    );
  else if (credential.type === "password") {
    wrappingKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: credential.salt,
        iterations: credential.iterations || DEFAULT_ITERATIONS,
        hash: "SHA-512"
      },
      await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(credential.password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      ),
      { name: "AES-KW", length: 256 },
      false,
      ["wrapKey", "unwrapKey"]
    );
  } else if (credential.type === "securityKey") wrappingKey = credential.key;
  if (
    !wrappingKey ||
    !wrappingKey.usages.includes("wrapKey") ||
    !wrappingKey.usages.includes("unwrapKey")
  )
    throw new Error("Could not generate a valid wrapping key.");
  return wrappingKey;
}

async function encrypt(
  data: string | number | boolean | ArrayBuffer,
  key: CryptoKey
) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const cipher = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    data instanceof ArrayBuffer
      ? data
      : encoder.encode(
          JSON.stringify({
            value: data
          })
        )
  );

  return <EncryptedData>{
    iv,
    cipher
  };
}

async function decrypt(encrypted: EncryptedData, key: CryptoKey) {
  return await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: encrypted.iv
    },
    key,
    encrypted.cipher
  );
}

function matchCredential(cred: SerializableCredential, query: CredentialQuery) {
  return (
    cred.type === query.type &&
    cred.id === query.id &&
    (query.active === undefined || cred.active === query.active)
  );
}

export async function deriveKey(password: string) {
  const passwordBuffer = encoder.encode(password);
  const importedKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-512",
      salt,
      iterations: 100000
    },
    importedKey,
    32 * 8
  );
}

const createKeyStore = (name: string) =>
  createStore<KeyStore>((set, get) => new KeyStore(name, set, get));

const [useKeyStore] = createKeyStore("KeyChain");
export { useKeyStore };
export type IKeyStore = typeof KeyStore.prototype;
