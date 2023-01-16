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

var fs = {};

function hasItem(key) {
  return !!fs[key];
}

/**
 * We perform 4 steps here:
 * 1. We convert base64 to Uint8Array (if we get base64, that is)
 * 2. We hash the Uint8Array.
 * 3. We encrypt the Uint8Array
 * 4. We save the encrypted Uint8Array
 */
async function writeEncrypted(filename, { data }) {
  const { hash, type: hashType } = hashBuffer(data);
  if (!filename) filename = hash;
  if (hasItem(filename)) return { hash, hashType };
  fs[filename] = data;
  return {
    chunkSize: 512,
    alg: "xcha-stream",
    hash,
    hashType,
    iv: "some iv",
    cipher: data,
    salt: "i am some salt",
    length: data.length
  };
}

function hashBuffer(data) {
  return {
    hash: hashCode(data).toString(16),
    type: "xxh3"
  };
}

async function readEncrypted(filename) {
  const cipher = fs[filename];
  if (!cipher) {
    console.error(`File not found. Filename: ${filename}`);
    return null;
  }
  return cipher.data;
}

async function uploadFile(filename) {
  let cipher = fs[filename];
  if (!cipher) throw new Error(`File not found. Filename: ${filename}`);
  return true;
}

async function downloadFile(filename) {
  return hasItem(filename);
}

async function deleteFile(filename) {
  if (!hasItem(filename)) return true;
  delete fs[filename];
  return true;
}

function exists(filename) {
  return hasItem(filename);
}

async function clearFileStorage() {
  fs = {};
}

module.exports = {
  writeEncrypted,
  readEncrypted,
  uploadFile: cancellable(uploadFile),
  downloadFile: cancellable(downloadFile),
  deleteFile,
  exists,
  clearFileStorage
};

function cancellable(operation) {
  return function (filename, requestOptions) {
    return {
      execute: () => operation(filename, requestOptions),
      cancel: () => {}
    };
  };
}

function hashCode(str) {
  var hash = 0,
    i,
    chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
