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
import Sodium from "@ammarahmed/react-native-sodium";
import RNFetchBlob from "rn-fetch-blob";
import { cacheDir, getRandomId } from "./utils";
import { db } from "../database";
import { compressToBase64 } from "./compress";

export async function readEncrypted(filename, key, cipherData) {
  let path = `${cacheDir}/${filename}`;
  try {
    let exists = await RNFetchBlob.fs.exists(path);
    if (!exists) {
      return false;
    }
    const attachment = db.attachments.attachment(filename);
    const isPng = /(png)/g.test(attachment?.metadata.type);
    const isJpeg = /(jpeg|jpg)/g.test(attachment?.metadata.type);

    let output = await Sodium.decryptFile(
      key,
      {
        ...cipherData,
        hash: filename
      },
      cipherData.outputType === "base64"
        ? isPng || isJpeg
          ? "cache"
          : "base64"
        : "text"
    );
    if (cipherData.outputType === "base64" && (isPng || isJpeg)) {
      const dCachePath = `${cacheDir}/${output}`;
      output = await compressToBase64(
        `file://${dCachePath}`,
        isPng ? "PNG" : "JPEG"
      );
    }

    return output;
  } catch (e) {
    RNFetchBlob.fs.unlink(path).catch(console.log);
    console.log(e);
    return false;
  }
}

export async function writeEncrypted(filename, { data, type, key }) {
  console.log("file input: ", { type, key });
  let filepath = cacheDir + `/${getRandomId("imagecache_")}`;
  console.log(filepath);
  await RNFetchBlob.fs.writeFile(filepath, data, "base64");
  let output = await Sodium.encryptFile(key, {
    uri: Platform.OS === "ios" ? filepath : "file://" + filepath,
    type: "url"
  });
  RNFetchBlob.fs.unlink(filepath).catch(console.log);

  console.log("encrypted file output: ", output);
  return {
    ...output,
    alg: "xcha-stream"
  };
}

export async function deleteFile(filename, data) {
  let delFilePath = cacheDir + `/${filename}`;
  if (!data) {
    if (!filename) return;
    RNFetchBlob.fs.unlink(delFilePath).catch(console.log);
    return true;
  }

  let { url, headers } = data;
  try {
    let response = await RNFetchBlob.fetch("DELETE", url, headers);
    let status = response.info().status;
    let ok = status >= 200 && status < 300;
    if (ok) {
      RNFetchBlob.fs.unlink(delFilePath).catch(console.log);
    }
    return ok;
  } catch (e) {
    console.log("delete file: ", e, url, headers);
    return false;
  }
}

export async function clearFileStorage() {
  try {
    let files = await RNFetchBlob.fs.ls(cacheDir);
    for (let file of files) {
      try {
        await RNFetchBlob.fs.unlink(cacheDir + `/${file}`);
      } catch (e) {
        console.log(e);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

export async function exists(filename) {
  let exists = await RNFetchBlob.fs.exists(`${cacheDir}/${filename}`);
  return exists;
}
