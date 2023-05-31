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
import {
  getFileNameWithExtension,
  isImage,
  isDocument
} from "@notesnook/core/utils/filename";
import React from "react";
import { Platform } from "react-native";
import * as ScopedStorage from "react-native-scoped-storage";
import { subscribe, zip } from "react-native-zip-archive";
import RNFetchBlob from "react-native-blob-util";
import { ShareComponent } from "../../components/sheets/export-notes/share";
import { ToastEvent, presentSheet } from "../../services/event-manager";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { db } from "../database";
import Storage from "../database/storage";
import { cacheDir, copyFileAsync, releasePermissions } from "./utils";

export const FileDownloadStatus = {
  Success: 1,
  Fail: 0
};

/**
 * Download all user's attachments
 * @returns
 */
export function downloadAllAttachments() {
  const attachments = db.attachments.all;
  return downloadAttachments(attachments);
}

/**
 * Downloads provided attachments to a .zip file
 * on user's device.
 * @param attachments
 * @param onProgress
 * @returns
 */
export async function downloadAttachments(
  attachments,
  onProgress,
  canceled,
  groupId
) {
  if (!attachments || !attachments.length) return;
  const result = new Map();

  let outputFolder;
  if (Platform.OS === "android") {
    // Ask the user to select a directory to store the file
    let file = await ScopedStorage.openDocumentTree(true);
    outputFolder = file.uri;
    if (!outputFolder) return;
  } else {
    outputFolder = await Storage.checkAndCreateDir("/downloads/");
  }

  // Create the folder to zip;
  const zipSourceFolder = `${cacheDir}/notesnook-attachments`;
  const zipOutputFile =
    Platform.OS === "ios"
      ? `${outputFolder}/notesnook-attachments-${Date.now()}.zip`
      : `${cacheDir}/notesnook-attachments.zip`;
  if (await RNFetchBlob.fs.exists(zipSourceFolder))
    await RNFetchBlob.fs.unlink(zipSourceFolder);
  await RNFetchBlob.fs.mkdir(zipSourceFolder);

  for (let i = 0; i < attachments.length; i++) {
    let attachment = attachments[i];
    const hash = attachment.metadata.hash;
    try {
      if (canceled.current) {
        RNFetchBlob.fs.unlink(zipSourceFolder).catch(console.log);
        return;
      }
      onProgress?.(
        i + 1 / attachments.length,
        `Downloading attachments (${i + 1}/${
          attachments.length
        })... Please wait`
      );
      // Download to cache
      let uri = await downloadAttachment(hash, false, {
        silent: true,
        cache: true,
        groupId: groupId
      });
      if (canceled.current) {
        RNFetchBlob.fs.unlink(zipSourceFolder).catch(console.log);
        return;
      }
      if (!uri) throw new Error("Failed to download file");
      // Move file to the source folder we will zip eventually and rename the file to it's actual name.
      const filePath = `${zipSourceFolder}/${attachment.metadata.filename}`;
      await RNFetchBlob.fs.mv(`${cacheDir}/${uri}`, filePath);
      result.set(hash, {
        filename: attachment.metadata.filename,
        status: FileDownloadStatus.Success
      });
    } catch (e) {
      result.set(hash, {
        filename: attachment.metadata.filename,
        status: FileDownloadStatus.Fail,
        reason: e
      });
      console.log("Error downloading attachment", e);
    }
  }
  if (canceled.current) {
    RNFetchBlob.fs.unlink(zipSourceFolder).catch(console.log);
    return;
  }
  if (result?.size) {
    let sub;
    try {
      onProgress?.(0, `Zipping... Please wait`);
      // If all goes well, zip the notesnook-attachments folder in cache.

      sub = subscribe(({ progress }) => {
        onProgress(
          progress,
          `Saving zip file (${(progress * 100).toFixed(1)}%)... Please wait`
        );
      });
      await zip(zipSourceFolder, zipOutputFile);
      sub?.remove();
      onProgress(1, `Saving zip file... Please wait`);
      if (Platform.OS === "android") {
        // Move the zip to user selected directory.
        const file = await ScopedStorage.createFile(
          outputFolder,
          `notesnook-attachments-${Date.now()}.zip`,
          "application/zip"
        );
        await copyFileAsync(`file://${zipOutputFile}`, file.uri);
      }

      onProgress?.(1, `Done`);
      releasePermissions(outputFolder);
    } catch (e) {
      releasePermissions(outputFolder);
      sub?.remove();
      console.log("Error zipping attachments", e);
    }
    // Remove source & zip file from cache.
    RNFetchBlob.fs.unlink(zipSourceFolder).catch(console.log);
    if (Platform.OS === "android") {
      RNFetchBlob.fs.unlink(zipOutputFile).catch(console.log);
    }
  }

  return result;
}

export default async function downloadAttachment(
  hash,
  global = true,
  options = {
    silent: false,
    cache: false,
    throwError: false,
    groupId: undefined
  }
) {
  let attachment = db.attachments.attachment(hash);
  if (!attachment) {
    console.log("attachment not found");
    return;
  }

  let folder = {};
  if (!options.cache) {
    if (Platform.OS === "android") {
      folder = await ScopedStorage.openDocumentTree();
      if (!folder) return;
    } else {
      folder.uri = await Storage.checkAndCreateDir("/downloads/");
    }
  }

  try {
    console.log(
      "starting download attachment",
      attachment.metadata.hash,
      options.groupId
    );
    await db.fs.downloadFile(
      options.groupId || attachment.metadata.hash,
      attachment.metadata.hash
    );
    if (
      !(await RNFetchBlob.fs.exists(`${cacheDir}/${attachment.metadata.hash}`))
    )
      return;

    let filename = getFileNameWithExtension(
      attachment.metadata.filename,
      attachment.metadata.type
    );

    let key = await db.attachments.decryptKey(attachment.key);
    let info = {
      iv: attachment.iv,
      salt: attachment.salt,
      length: attachment.length,
      alg: attachment.alg,
      hash: attachment.metadata.hash,
      hashType: attachment.metadata.hashType,
      mime: attachment.metadata.type,
      fileName: options.cache ? undefined : filename,
      uri: options.cache ? undefined : folder.uri,
      chunkSize: attachment.chunkSize
    };

    let fileUri = await Sodium.decryptFile(
      key,
      info,
      options.cache ? "cache" : "file"
    );

    if (!options.silent) {
      ToastEvent.show({
        heading: "Download successful",
        message: filename + " downloaded",
        type: "success"
      });
    }

    if (
      attachment.dateUploaded &&
      !isImage(attachment.metadata?.type) &&
      !isDocument(attachment.metadata?.type)
    ) {
      RNFetchBlob.fs
        .unlink(RNFetchBlob.fs.dirs.CacheDir + `/${attachment.metadata.hash}`)
        .catch(console.log);
    }
    if (Platform.OS === "ios" && !options.cache) {
      fileUri = folder.uri + `/${filename}`;
    }
    if (!options.silent) {
      presentSheet({
        title: "File downloaded",
        paragraph: `${filename} saved to ${
          Platform.OS === "android"
            ? "selected path"
            : "File Manager/Notesnook/downloads"
        }`,
        icon: "download",
        context: global ? null : attachment.metadata.hash,
        component: <ShareComponent uri={fileUri} name={filename} padding={12} />
      });
    }

    return fileUri;
  } catch (e) {
    console.log("download attachment error: ", e);
    if (attachment.dateUploaded) {
      RNFetchBlob.fs
        .unlink(RNFetchBlob.fs.dirs.CacheDir + `/${attachment.metadata.hash}`)
        .catch(console.log);
    }
    useAttachmentStore.getState().remove(attachment.metadata.hash);
    if (options.throwError) {
      throw e;
    }
  }
}
