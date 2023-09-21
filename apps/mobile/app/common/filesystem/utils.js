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

import * as ScopedStorage from "react-native-scoped-storage";
import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";

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

export function extractValueFromXmlTag(code, xml) {
  if (!xml.includes(code)) return `Unknown ${code}`;
  return xml.slice(
    xml.indexOf(`<${code}>`) + code.length + 2,
    xml.indexOf(`</${code}>`)
  );
}

export async function fileCheck(response, totalSize) {
  if (totalSize < 1000) {
    let text = await response.text();
    if (text.startsWith("<?xml")) {
      let errorJson = {
        Code: extractValueFromXmlTag("Code", text),
        Message: extractValueFromXmlTag("Message", text)
      };
      throw new Error(`${errorJson.Code}: ${errorJson.Message}`);
    }
  }
}

export function cancelable(operation) {
  const cancelToken = {
    cancel: () => {}
  };
  return (filename, { url, headers }) => {
    return {
      execute: () => operation(filename, { url, headers }, cancelToken),
      cancel: async () => {
        await cancelToken.cancel();
        RNFetchBlob.fs.unlink(`${cacheDir}/${filename}`).catch(console.log);
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
