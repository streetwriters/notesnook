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

import { hosts, RequestOptions } from "@notesnook/core";
import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import * as ScopedStorage from "react-native-scoped-storage";
import { DatabaseLogger, db } from "../database";
import { MMKV } from "../database/mmkv";

export const ABYTES = 17;
export const cacheDirOld = RNFetchBlob.fs.dirs.CacheDir;

export const cacheDir =
  Platform.OS == "ios"
    ? RNFetchBlob.fs.dirs.LibraryDir + "/.cache"
    : RNFetchBlob.fs.dirs.DocumentDir + "/.cache";

export function getRandomId(prefix: string) {
  return Math.random()
    .toString(36)
    .replace("0.", prefix || "");
}

export type S3Error = { Code: string; Message: string };

export function parseS3Error(data?: ArrayBuffer | unknown): S3Error {
  let parsedJson: any = null;
  if (typeof data === "string") {
    try {
      parsedJson = JSON.parse(data);
    } catch { }
  }

  const targetData = parsedJson || data;

  const xml =
    targetData instanceof ArrayBuffer
      ? new TextDecoder().decode(targetData)
      : typeof targetData === "string"
        ? targetData
        : typeof targetData === "object" &&
          targetData &&
          "error" in targetData &&
          typeof targetData.error === "string"
          ? targetData.error
          : typeof targetData === "object" &&
            targetData &&
            "message" in targetData &&
            typeof targetData.message === "string"
            ? targetData.message
            : null;

  const error: S3Error = {
    Code: "UNKNOWN",
    Message:
      xml ||
      (typeof data === "string" ? data : JSON.stringify(data)) ||
      "Upload error"
  };

  try {
    if (!xml) return error;
    const doc = new DOMParser().parseFromString(xml, "text/xml");

    const ErrorElement = doc.getElementsByTagName("Error")[0];
    if (!ErrorElement) return error;

    for (const child of ErrorElement.children) {
      if (
        child.textContent &&
        (child.tagName === "Code" || child.tagName === "Message")
      )
        error[child.tagName as "Code" | "Message"] = child.textContent;
    }
    return error;
  } catch (e) {
    return error;
  }
}

export function formatS3Error(error: S3Error, message?: string): string {
  const msg = `${message ? message + " " : ""}${error.Message}`;
  return error.Code === "UNKNOWN" || error.Code === "Unknown"
    ? msg
    : `[${error.Code}] ${msg}`;
}

export const MAX_UPLOAD_ATTEMPTS = 5;

// Cooldown delays between failed attempts:
// Attempt 1 fail: 30s
// Attempt 2 fail: 2m
// Attempt 3 fail: 5m
// Attempt 4 fail: 15m
// Attempt 5 fail: permanent fail
export const UPLOAD_RETRY_DELAYS_MS = [
  30 * 1000,
  2 * 60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000
];

export function getUploadAttempts(hash: string): number {
  return MMKV.getInt(`upload_attempts:${hash}`) || 0;
}

export function setUploadAttempts(hash: string, attempts: number): void {
  MMKV.setInt(`upload_attempts:${hash}`, attempts);
}

export function getUploadNextRetryAt(hash: string): number {
  const val = MMKV.getString(`upload_next_retry:${hash}`);
  return val ? Number(val) || 0 : 0;
}

export function isUploadInCooldown(hash: string): boolean {
  const nextRetryAt = getUploadNextRetryAt(hash);
  return nextRetryAt > Date.now();
}

export function recordUploadFailure(hash: string, terminal = false): number {
  if (terminal) {
    setUploadAttempts(hash, MAX_UPLOAD_ATTEMPTS);
    MMKV.removeItem(`upload_next_retry:${hash}`);
    return MAX_UPLOAD_ATTEMPTS;
  }

  const current = getUploadAttempts(hash);
  const next = current + 1;
  setUploadAttempts(hash, next);

  if (next < MAX_UPLOAD_ATTEMPTS) {
    const delay = UPLOAD_RETRY_DELAYS_MS[next - 1] || 15 * 60 * 1000;
    MMKV.setString(`upload_next_retry:${hash}`, String(Date.now() + delay));
  } else {
    MMKV.removeItem(`upload_next_retry:${hash}`);
  }
  return next;
}

export function resetUploadAttempts(hash: string): void {
  MMKV.removeItem(`upload_attempts:${hash}`);
  MMKV.removeItem(`upload_next_retry:${hash}`);
}

export function cancelable(
  operation: (
    filename: string,
    requestOptions: RequestOptions,
    cancelToken: {
      cancel: (reason?: string) => Promise<void>;
    }
  ) => Promise<boolean>
) {
  const cancelToken = {
    cancel: async (reason?: string) => { }
  };
  return (filename: string, requestOptions: RequestOptions) => {
    return {
      execute: () => operation(filename, requestOptions, cancelToken),
      cancel: async () => {
        await cancelToken.cancel();
      }
    };
  };
}

export function copyFileAsync(source: string, dest: string) {
  return new Promise((resolve, reject) => {
    //@ts-ignore
    ScopedStorage.copyFile(source, dest, (e: any, r: any) => {
      if (e) {
        reject(e);
        return;
      }
      resolve(true);
    });
  });
}

export async function releasePermissions(path: string) {
  if (Platform.OS === "ios") return;
  const uris = await ScopedStorage.getPersistedUriPermissions();
  for (const uri of uris) {
    if (path.startsWith(uri)) {
      await ScopedStorage.releasePersistableUriPermission(uri);
    }
  }
}

export const FileSizeResult = {
  Empty: 0,
  Error: -1
};

function getFileSizeFromHeaders(headers: Headers) {
  return headers.get("x-object-size") || headers.get("content-length");
}

export async function getUploadedFileSize(hash: string, retry = 0) {
  try {
    const url = `${hosts.API_HOST}/s3?name=${hash}`;
    const token = await db.tokenManager.getAccessToken();
    const attachmentInfo = await fetch(url, {
      method: "HEAD",
      headers: { Authorization: `Bearer ${token}` }
    });

    const fileSize = getFileSizeFromHeaders(attachmentInfo.headers);

    if (!attachmentInfo.ok || fileSize === null) {
      if (retry < 3) {
        DatabaseLogger.log(`Retrying file size check: ${hash}, ${retry}`);
        return getUploadedFileSize(hash, retry + 1);
      }
      throw new Error(
        `File size check failed: ${hash}, ${attachmentInfo.status}, ${fileSize}`
      );
    }

    console.log(attachmentInfo.headers);

    const contentLength = parseInt(fileSize as string);
    return isNaN(contentLength) ? FileSizeResult.Empty : contentLength;
  } catch (e) {
    DatabaseLogger.error(e);
    return FileSizeResult.Error;
  }
}

export async function checkUpload(
  filename: string,
  chunkSize: number,
  expectedSize: number
) {
  const size = await getUploadedFileSize(filename);
  const totalChunks = Math.ceil(size / (chunkSize + ABYTES));
  const decryptedLength = size - totalChunks * ABYTES;
  const error =
    size === 0
      ? `File size is 0.`
      : size === -1
        ? `File verification check failed.`
        : expectedSize !== decryptedLength
          ? `File size mismatch. Expected ${size} bytes but got ${decryptedLength} bytes.`
          : undefined;
  if (error) throw new Error(error);
}

export async function requestPermission() {
  if (Platform.OS === "ios") return true;
  return true;
}
export async function checkAndCreateDir(path: string) {
  const dir =
    Platform.OS === "ios"
      ? RNFetchBlob.fs.dirs.DocumentDir + path
      : RNFetchBlob.fs.dirs.SDCardDir + "/Notesnook/" + path;

  try {
    const exists = await RNFetchBlob.fs.exists(dir);
    const isDir = await RNFetchBlob.fs.isDir(dir);
    if (!exists || !isDir) {
      await RNFetchBlob.fs.mkdir(dir);
    }
  } catch (e) {
    await RNFetchBlob.fs.mkdir(dir);
  }
  return dir;
}

export const santizeUri = (uri: string) => {
  const decoded = decodeURI(uri);
  return Platform.OS === "ios" ? decoded.replace("file:///", "/") : decoded;
};

export function isSuccessStatusCode(statusCode: number) {
  return statusCode >= 200 && statusCode <= 299;
}
