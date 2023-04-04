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

import { Cipher, SerializedKey } from "@notesnook/crypto/dist/src/types";

export interface IStorage {
  write<T>(key: string, data: T): Promise<void>;
  readMulti<T>(keys: string[]): Promise<[string, T][]>;
  read<T>(key: string, isArray?: boolean): Promise<T | undefined>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  encrypt(key: SerializedKey, plainText: string): Promise<Cipher>;
  decrypt(key: SerializedKey, cipherData: Cipher): Promise<string | undefined>;
  deriveCryptoKey(name: string, credentials: SerializedKey): Promise<void>;
  hash(password: string, email: string): Promise<string>;
  getCryptoKey(name: string): Promise<string | undefined>;
  generateCryptoKey(password: string, salt?: string): Promise<SerializedKey>;

  //   async generateRandomKey() {
  //     const passwordBytes = randomBytes(124);
  //     const password = passwordBytes.toString("base64");
  //     return await this.storage.generateCryptoKey(password);
  //   }
}

export interface ICompressor {
  compress(data: string): Promise<string>;
  decompress(data: string): Promise<string>;
}

type RequestOptions = {
  url: string;
  chunkSize?: number;
  headers: { Authorization: string };
};
type Cancellable<T> = {
  execute(): Promise<T>;
  cancel(reason?: string): Promise<void>;
};
export interface IFileStorage {
  downloadFile(
    filename: string,
    requestOptions: RequestOptions
  ): Cancellable<boolean>;
  uploadFile(
    filename: string,
    requestOptions: RequestOptions
  ): Cancellable<boolean>;
  readEncrypted(
    filename: string,
    encryptionKey: SerializedKey,
    cipherData: Cipher
  ): Promise<string | Uint8Array>;
  writeEncryptedBase64(
    data: string,
    encryptionKey: SerializedKey,
    mimeType: string
  ): Promise<Cipher>;
  deleteFile(
    filename: string,
    requestOptions?: RequestOptions
  ): Promise<boolean>;
  exists(filename: string): Promise<boolean>;
  clearFileStorage(): Promise<void>;
  hashBase64(data: string): Promise<{ hash: string; type: string }>;
}
