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

import Sodium from "@ammarahmed/react-native-sodium";
import { Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import { eSendEvent } from "../../services/event-manager";
import { IOS_APPGROUPID } from "../../utils/constants";
import { DatabaseLogger, db } from "../database";
import { ABYTES, cacheDir, cacheDirOld, getRandomId } from "./utils";

export async function readEncrypted(filename, key, cipherData) {
  await migrateFilesFromCache();
  DatabaseLogger.log("Read encrypted file...");
  let path = `${cacheDir}/${filename}`;

  try {
    if (!(await exists(filename))) {
      return false;
    }

    let output = await Sodium.decryptFile(
      key,
      {
        ...cipherData,
        hash: filename,
        appGroupId: IOS_APPGROUPID
      },
      cipherData.outputType === "base64" ? "base64" : "text"
    );

    DatabaseLogger.log("File decrypted...");

    return output;
  } catch (e) {
    RNFetchBlob.fs.unlink(path).catch(console.log);
    DatabaseLogger.error(e);
    return false;
  }
}

export async function hashBase64(data) {
  const hash = await Sodium.hashFile({
    type: "base64",
    data,
    uri: ""
  });
  return {
    hash: hash,
    type: "xxh64"
  };
}

export async function writeEncryptedBase64(data, key) {
  await createCacheDir();
  let filepath = cacheDir + `/${getRandomId("imagecache_")}`;
  await RNFetchBlob.fs.writeFile(filepath, data, "base64");
  let output = await Sodium.encryptFile(key, {
    uri: Platform.OS === "ios" ? filepath : "file://" + filepath,
    type: "url"
  });
  RNFetchBlob.fs.unlink(filepath).catch(console.log);
  console.log("encrypted file output: ", output);
  output.size = output.length;
  delete output.length;
  return {
    ...output,
    alg: "xcha-stream"
  };
}

export async function deleteFile(filename, data) {
  await createCacheDir();
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
    let oldCache = await RNFetchBlob.fs.ls(cacheDirOld);

    for (let file of files) {
      await RNFetchBlob.fs.unlink(cacheDir + `/${file}`).catch(console.log);
    }
    for (let file of oldCache) {
      await RNFetchBlob.fs.unlink(cacheDirOld + `/${file}`).catch(console.log);
    }
  } catch (e) {
    console.log("clearFileStorage", e);
  }
}

export async function createCacheDir() {
  if (!(await RNFetchBlob.fs.exists(cacheDir))) {
    await RNFetchBlob.fs.mkdir(cacheDir);
    DatabaseLogger.log("Cache directory created");
  }
}

export async function migrateFilesFromCache() {
  try {
    await createCacheDir();
    const migratedFilesPath = cacheDir + "/.migrated_1";
    const migrated = await RNFetchBlob.fs.exists(migratedFilesPath);
    if (migrated) {
      console.log("Files migrated already");
      return;
    }

    let files = await RNFetchBlob.fs.ls(cacheDir);
    console.log("Files to migrate:", files.join(","));

    let oldCache = await RNFetchBlob.fs.ls(cacheDirOld);
    for (let file of oldCache) {
      if (file.startsWith("org.") || file.startsWith("com.")) continue;
      RNFetchBlob.fs
        .mv(cacheDirOld + `/${file}`, cacheDir + `/${file}`)
        .catch(console.log);
      console.log("Moved", file);
    }
    await RNFetchBlob.fs.createFile(migratedFilesPath, "1", "utf8");
  } catch (e) {
    console.log("migrateFilesFromCache", e);
  }
}

export async function clearCache() {
  await RNFetchBlob.fs.unlink(cacheDir).catch(console.log);
  await createCacheDir();
  eSendEvent("cache-cleared");
}

export async function deleteCacheFileByPath(path) {
  await RNFetchBlob.fs.unlink(path).catch(console.log);
}

export async function deleteCacheFileByName(name) {
  const iosAppGroup =
    Platform.OS === "ios"
      ? await RNFetchBlob.fs.pathForAppGroup(IOS_APPGROUPID)
      : null;
  const appGroupPath = `${iosAppGroup}/${name}`;
  await RNFetchBlob.fs.unlink(appGroupPath).catch(console.log);
  await RNFetchBlob.fs.unlink(`${cacheDir}/${name}`).catch(console.log);
}

export async function deleteDCacheFiles() {
  const files = await RNFetchBlob.fs.ls(cacheDir);
  for (const file of files) {
    if (file.includes("_dcache")) {
      await RNFetchBlob.fs.unlink(file).catch(console.log);
    }
  }
}

export async function exists(filename) {
  let path = `${cacheDir}/${filename}`;

  const iosAppGroup =
    Platform.OS === "ios"
      ? await RNFetchBlob.fs.pathForAppGroup(IOS_APPGROUPID)
      : null;
  const appGroupPath = `${iosAppGroup}/${filename}`;

  let exists = await RNFetchBlob.fs.exists(path);

  // Check if file is present in app group path.
  let existsInAppGroup = false;
  if (!exists && Platform.OS === "ios") {
    existsInAppGroup = await RNFetchBlob.fs.exists(appGroupPath);
  }

  if (exists || existsInAppGroup) {
    const attachment = await db.attachments.attachment(filename);
    const totalChunks = Math.ceil(attachment.size / attachment.chunkSize);
    const totalAbytes = totalChunks * ABYTES;
    const expectedFileSize = attachment.size + totalAbytes;

    const stat = await RNFetchBlob.fs.stat(
      existsInAppGroup ? appGroupPath : path
    );

    if (stat.size !== expectedFileSize) {
      DatabaseLogger.log(
        `File size mismatch: ${filename}, expected: ${expectedFileSize}, actual: ${stat.size}`
      );
      RNFetchBlob.fs
        .unlink(existsInAppGroup ? appGroupPath : path)
        .catch(console.log);
      return false;
    }

    exists = true;
  }
  return exists;
}

export async function bulkExists(files) {
  const cacheFiles = await RNFetchBlob.fs.ls(cacheDir);
  let missingFiles = files.filter((file) => !cacheFiles.includes(file));

  if (Platform.OS === "ios") {
    const iosAppGroup =
      Platform.OS === "ios"
        ? await RNFetchBlob.fs.pathForAppGroup(IOS_APPGROUPID)
        : null;
    const appGroupFiles = await RNFetchBlob.fs.ls(iosAppGroup);
    missingFiles = missingFiles.filter((file) => !appGroupFiles.includes(file));
  }

  return missingFiles;
}

export async function getCacheSize() {
  const stat = await RNFetchBlob.fs.lstat(`file://` + cacheDir);
  let total = 0;
  console.log("Total files", stat.length);
  stat.forEach((s) => {
    total += parseInt(s.size);
  });
  return total;
}
