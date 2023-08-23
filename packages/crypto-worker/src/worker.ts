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

import {
  Cipher,
  OutputFormat,
  Plaintext,
  SerializedKey
} from "@notesnook/crypto/dist/src/types";
import { expose, transfer } from "comlink";
import type { Decryption, NNCrypto, Output } from "@notesnook/crypto";

let crypto: NNCrypto | null = null;
let decryption: typeof Decryption | null = null;

async function loadNNCrypto(): Promise<NNCrypto> {
  if (crypto) return crypto;
  const { NNCrypto } = await import("@notesnook/crypto");
  return (crypto = new NNCrypto());
}

async function loadDecryptionModule(): Promise<typeof Decryption> {
  if (decryption) return decryption;
  const { Decryption } = await import("@notesnook/crypto");
  return (decryption = Decryption);
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
    plaintext: Plaintext<OutputFormat>,
    outputFormat?: OutputFormat
  ) {
    const crypto = await loadNNCrypto();
    return crypto.encrypt(key, plaintext, outputFormat);
  },
  decrypt: async function <TOutputFormat extends OutputFormat>(
    key: SerializedKey,
    cipherData: Cipher,
    outputFormat: TOutputFormat = "text" as TOutputFormat
  ) {
    const decryption = await loadDecryptionModule();
    return decryption.decrypt(key, cipherData, outputFormat);
  },
  decryptMulti: async function <TOutputFormat extends OutputFormat>(
    key: SerializedKey,
    items: Cipher[],
    outputFormat: TOutputFormat = "text" as TOutputFormat
  ) {
    const decryption = await loadDecryptionModule();
    const decryptedItems: Output<TOutputFormat>[] = [];
    for (const cipherData of items) {
      decryptedItems.push(decryption.decrypt(key, cipherData, outputFormat));
    }
    return decryptedItems;
  },
  createEncryptionStream: async function (key: SerializedKey) {
    const crypto = await loadNNCrypto();
    const stream = await crypto.createEncryptionStream(key);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return transfer(stream, [stream.stream]);
  },
  createDecryptionStream: async function (key: SerializedKey, iv: string) {
    const crypto = await loadNNCrypto();
    const obj = { stream: await crypto.createDecryptionStream(key, iv) };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return transfer(obj, [obj.stream]);
  }
};

export type NNCryptoWorkerModule = typeof module;

expose(module);
