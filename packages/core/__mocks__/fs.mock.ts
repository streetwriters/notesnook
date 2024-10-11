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

import { DataFormat, SerializedKey } from "@notesnook/crypto";
import {
  FileEncryptionMetadataWithOutputType,
  IFileStorage,
  RequestOptions
} from "../src/interfaces.js";
import { xxhash64 } from "hash-wasm";
import { IDataType } from "hash-wasm/dist/lib/util";

let fs = {};

function hasItem(key) {
  return !!fs[key];
}

async function writeEncryptedBase64(
  data: string,
  key: SerializedKey,
  _mimeType: string
) {
  const bytes = new Uint8Array(Buffer.from(data, "base64"));

  const { hash, type: hashType } = await hashBuffer(bytes);

  if (hasItem(hash)) delete fs[hash];

  fs[hash] = data;
  return {
    chunkSize: 512,
    alg: "xcha-stream",
    hash,
    hashType,
    iv: "some iv",
    salt: key.salt!,
    size: data.length
  };
}

function hashBase64(data: string) {
  return hashBuffer(Buffer.from(data, "base64"));
}

export async function hashBuffer(data: IDataType) {
  return {
    hash: await xxhash64(data),
    type: "xxh64"
  };
}

async function readEncrypted<TOutputFormat extends DataFormat>(
  filename: string,
  _key: SerializedKey,
  _cipherData: FileEncryptionMetadataWithOutputType<TOutputFormat>
) {
  const cipher = fs[filename];
  if (!cipher) {
    console.error(`File not found. Filename: ${filename}`);
    return null;
  }
  return cipher.data;
}

async function uploadFile(filename: string, _requestOptions: RequestOptions) {
  const cipher = fs[filename];
  if (!cipher) throw new Error(`File not found. Filename: ${filename}`);
  return true;
}

async function downloadFile(filename: string, _requestOptions: RequestOptions) {
  return hasItem(filename);
}

async function deleteFile(filename: string, _requestOptions: RequestOptions) {
  if (!hasItem(filename)) return true;
  delete fs[filename];
  return true;
}

async function exists(filename) {
  return hasItem(filename);
}

async function clearFileStorage() {
  fs = {};
}

export const FS: IFileStorage = {
  writeEncryptedBase64,
  readEncrypted,
  uploadFile: cancellable(uploadFile),
  downloadFile: cancellable(downloadFile),
  deleteFile,
  exists,
  clearFileStorage,
  hashBase64
};

function cancellable<T>(
  operation: (filename: string, requestOptions: RequestOptions) => Promise<T>
) {
  return function (filename: string, requestOptions: RequestOptions) {
    const abortController = new AbortController();
    return {
      execute: () => operation(filename, requestOptions),
      cancel: async (message: string) => {
        abortController.abort(message);
      }
    };
  };
}
