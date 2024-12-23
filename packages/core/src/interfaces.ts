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

import { Cipher, DataFormat, SerializedKey } from "@notesnook/crypto";
import { KVStorage } from "./database/kv.js";
import { ConfigStorage } from "./database/config.js";

export type Output<TOutputFormat extends DataFormat> =
  TOutputFormat extends "uint8array" ? Uint8Array : string;
export type FileEncryptionMetadata = {
  chunkSize: number;
  iv: string;
  size: number;
  salt: string;
  alg: string;
};
export type FileEncryptionMetadataWithOutputType<
  TOutputFormat extends DataFormat
> = FileEncryptionMetadata & { outputType: TOutputFormat };
export type FileEncryptionMetadataWithHash = FileEncryptionMetadata & {
  hash: string;
  hashType: string;
};

export interface IStorage {
  write<T>(key: string, data: T): Promise<void>;
  writeMulti<T>(entries: [string, T][]): Promise<void>;
  readMulti<T>(keys: string[]): Promise<[string, T][]>;
  read<T>(key: string, isArray?: boolean): Promise<T | undefined>;
  remove(key: string): Promise<void>;
  removeMulti(keys: string[]): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  encrypt(key: SerializedKey, plainText: string): Promise<Cipher<"base64">>;
  encryptMulti(
    key: SerializedKey,
    items: string[]
  ): Promise<Cipher<"base64">[]>;
  decrypt(key: SerializedKey, cipherData: Cipher<"base64">): Promise<string>;
  decryptMulti(
    key: SerializedKey,
    items: Cipher<"base64">[]
  ): Promise<string[]>;
  deriveCryptoKey(credentials: SerializedKey): Promise<void>;
  hash(
    password: string,
    email: string,
    options?: { usesFallback?: boolean }
  ): Promise<string>;
  getCryptoKey(): Promise<string | undefined>;
  generateCryptoKey(password: string, salt?: string): Promise<SerializedKey>;

  generateCryptoKeyFallback(
    password: string,
    salt?: string
  ): Promise<SerializedKey>;
  deriveCryptoKeyFallback(credentials: SerializedKey): Promise<void>;

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

export type RequestOptions = {
  url: string;
  // metadata?: AttachmentMetadata;
  chunkSize: number;
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
  readEncrypted<TOutputFormat extends DataFormat>(
    filename: string,
    encryptionKey: SerializedKey,
    cipherData: FileEncryptionMetadataWithOutputType<TOutputFormat>
  ): Promise<Output<TOutputFormat> | undefined>;
  writeEncryptedBase64(
    data: string,
    encryptionKey: SerializedKey,
    mimeType: string
  ): Promise<FileEncryptionMetadataWithHash>;
  deleteFile(
    filename: string,
    requestOptions?: RequestOptions
  ): Promise<boolean>;
  exists(filename: string): Promise<boolean>;
  bulkExists(filenames: string[]): Promise<string[]>;
  getUploadedFileSize(filename: string): Promise<number>;
  clearFileStorage(): Promise<void>;
  hashBase64(data: string): Promise<{ hash: string; type: string }>;
}

export type StorageAccessor = () => IStorage;
export type KVStorageAccessor = () => KVStorage;
export type ConfigStorageAccessor = () => ConfigStorage;
export type CompressorAccessor = () => Promise<ICompressor>;
