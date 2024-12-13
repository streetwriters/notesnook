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

export function parseS3Error(data?: string) {
  const xml = typeof data === "string" ? data : null;

  const error = {
    Code: "UNKNOWN",
    Message: xml
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
        error[child.tagName] = child.textContent;
    }
    return error;
  } catch (e) {
    return error;
  }
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
    cancel: async (reason?: string) => {}
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

export async function getUploadedFileSize(hash: string) {
  try {
    const url = `${hosts.API_HOST}/s3?name=${hash}`;
    const token = await db.tokenManager.getAccessToken();
    const attachmentInfo = await fetch(url, {
      method: "HEAD",
      headers: { Authorization: `Bearer ${token}` }
    });
    const contentLength = parseInt(
      attachmentInfo.headers?.get("content-length") || "0"
    );
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
  const totalChunks = Math.ceil(size / chunkSize);
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
