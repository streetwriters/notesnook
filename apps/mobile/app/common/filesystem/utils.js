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

import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import * as ScopedStorage from "react-native-scoped-storage";
import { DatabaseLogger, db } from "../database";
import hosts from "@notesnook/core/dist/utils/constants";

export const ABYTES = 17;
export const cacheDirOld = RNFetchBlob.fs.dirs.CacheDir;

export const cacheDir =
  Platform.OS == "ios"
    ? RNFetchBlob.fs.dirs.LibraryDir + "/.cache"
    : RNFetchBlob.fs.dirs.DocumentDir + "/.cache";

export function getRandomId(prefix) {
  return Math.random()
    .toString(36)
    .replace("0.", prefix || "");
}

/**
 *
 * @param {string | undefined} data
 * @returns
 */
export function parseS3Error(data) {
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

export function cancelable(operation) {
  const cancelToken = {
    cancel: () => {}
  };
  return (filename, requestOptions) => {
    return {
      execute: () => operation(filename, requestOptions, cancelToken),
      cancel: async () => {
        await cancelToken.cancel();
      }
    };
  };
}

export function copyFileAsync(source, dest) {
  return new Promise((resolve, reject) => {
    ScopedStorage.copyFile(source, dest, (e, r) => {
      if (e) {
        reject(e);
        return;
      }
      resolve();
    });
  });
}

export async function releasePermissions(path) {
  if (Platform.OS === "ios") return;
  const uris = await ScopedStorage.getPersistedUriPermissions();
  for (let uri of uris) {
    if (path.startsWith(uri)) {
      await ScopedStorage.releasePersistableUriPermission(uri);
    }
  }
}

export async function getUploadedFileSize(hash) {
  try {
    const url = `${hosts.API_HOST}/s3?name=${hash}`;
    const token = await db.tokenManager.getAccessToken();
    const attachmentInfo = await fetch(url, {
      method: "HEAD",
      headers: { Authorization: `Bearer ${token}` }
    });
    const contentLength = parseInt(
      attachmentInfo.headers?.get("content-length")
    );
    return isNaN(contentLength) ? 0 : contentLength;
  } catch (e) {
    DatabaseLogger.error(e);
    return -1;
  }
}
