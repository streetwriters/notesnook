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

import React from "react";
import { Platform } from "react-native";
import * as ScopedStorage from "react-native-scoped-storage";
import Sodium from "@ammarahmed/react-native-sodium";
import RNFetchBlob from "rn-fetch-blob";
import { ShareComponent } from "../../components/sheets/export-notes/share";
import { presentSheet, ToastEvent } from "../../services/event-manager";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { db } from "../database";
import Storage from "../database/storage";
import { cacheDir } from "./utils";

export default async function downloadAttachment(
  hash,
  global = true,
  options = {
    silent: false,
    cache: false
  }
) {
  let attachment = db.attachments.attachment(hash);
  console.log(attachment);
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
    await db.fs.downloadFile(
      attachment.metadata.hash,
      attachment.metadata.hash
    );
    if (
      !(await RNFetchBlob.fs.exists(`${cacheDir}/${attachment.metadata.hash}`))
    )
      return;

    let key = await db.attachments.decryptKey(attachment.key);
    let info = {
      iv: attachment.iv,
      salt: attachment.salt,
      length: attachment.length,
      alg: attachment.alg,
      hash: attachment.metadata.hash,
      hashType: attachment.metadata.hashType,
      mime: attachment.metadata.type,
      fileName: options.cache ? undefined : attachment.metadata.filename,
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
        message: attachment.metadata.filename + " downloaded",
        type: "success"
      });
    }

    if (
      attachment.dateUploaded &&
      !attachment.metadata?.type?.startsWith("image")
    ) {
      RNFetchBlob.fs
        .unlink(RNFetchBlob.fs.dirs.CacheDir + `/${attachment.metadata.hash}`)
        .catch(console.log);
    }

    if (Platform.OS === "ios") {
      fileUri = folder.uri + `/${attachment.metadata.filename}`;
    }
    console.log("saved file uri: ", fileUri);
    if (!options.silent) {
      presentSheet({
        title: "File downloaded",
        paragraph: `${attachment.metadata.filename} saved to ${
          Platform.OS === "android"
            ? "selected path"
            : "File Manager/Notesnook/downloads"
        }`,
        icon: "download",
        context: global ? null : attachment.metadata.hash,
        component: (
          <ShareComponent
            uri={fileUri}
            name={attachment.metadata.filename}
            padding={12}
          />
        )
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
  }
}
