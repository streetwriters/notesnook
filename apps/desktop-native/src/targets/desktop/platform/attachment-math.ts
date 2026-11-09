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

export const ABYTES = 17;
export const CHUNK_SIZE = 512 * 1024;
export const ENCRYPTED_CHUNK_SIZE = CHUNK_SIZE + ABYTES;
export const UPLOAD_PART_REQUIRED_CHUNKS = Math.ceil(
  (10 * 1024 * 1024) / ENCRYPTED_CHUNK_SIZE
);
export const MINIMUM_MULTIPART_FILE_SIZE = 25 * 1024 * 1024;

export function decryptedLength(encryptedSize: number, chunkSize: number) {
  const totalChunks = Math.ceil(encryptedSize / (chunkSize + ABYTES));
  return encryptedSize - totalChunks * ABYTES;
}

export function checkUploadError(
  size: number,
  chunkSize: number,
  expectedSize: number
) {
  const decrypted = decryptedLength(size, chunkSize);
  return size === 0
    ? `File size is 0.`
    : size === -1
    ? `File verification check failed.`
    : expectedSize !== decrypted
    ? `File size mismatch. Expected ${size} bytes but got ${decrypted} bytes.`
    : undefined;
}

export function sodiumCacheDirectory(
  os: "macOS" | "Windows" | "Linux" | null,
  home: string,
  xdgDataHome?: string
) {
  const base =
    os === "macOS"
      ? `${home}/Library/Application Support`
      : os === "Windows"
      ? `${home}/AppData/Local`
      : xdgDataHome || `${home}/.local/share`;
  return `${base}/react-native-sodium/.cache`;
}

export function parseS3Error(data: unknown) {
  const text =
    typeof data === "string"
      ? data
      : typeof data === "object" &&
        data &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
      ? (data as { error: string }).error
      : null;
  const error = { Code: "UNKNOWN", Message: text || JSON.stringify(data) };
  if (!text) return error;
  const code = /<Code>([\s\S]*?)<\/Code>/.exec(text);
  const message = /<Message>([\s\S]*?)<\/Message>/.exec(text);
  if (code) error.Code = code[1];
  if (message) error.Message = message[1];
  return error;
}
