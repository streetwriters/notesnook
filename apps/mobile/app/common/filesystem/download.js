/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import NetInfo from "@react-native-community/netinfo";
import hosts from "@notesnook/core/utils/constants";
import React from "react";
import { Platform } from "react-native";
import * as ScopedStorage from "react-native-scoped-storage";
import Sodium from "react-native-sodium";
import RNFetchBlob from "rn-fetch-blob";
import { ShareComponent } from "../../components/sheets/export-notes/share";
import { presentSheet, ToastEvent } from "../../services/event-manager";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { db } from "../database";
import Storage from "../database/storage";
import { cacheDir, fileCheck } from "./utils";

export async function downloadFile(filename, data, cancelToken) {
  if (!data) return false;
  let { url, headers } = data;

  let path = `${cacheDir}/${filename}`;
  try {
    let exists = await RNFetchBlob.fs.exists(path);
    if (exists) {
      return true;
    }

    let res = await fetch(url, {
      method: "GET",
      headers
    });
    if (!res.ok)
      throw new Error(`${res.status}: Unable to resolve download url`);
    const downloadUrl = await res.text();

    if (!downloadUrl) throw new Error("Unable to resolve download url");
    let totalSize = 0;
    let request = RNFetchBlob.config({
      path: path,
      IOSBackgroundTask: true
    })
      .fetch("GET", downloadUrl, null)
      .progress((recieved, total) => {
        useAttachmentStore
          .getState()
          .setProgress(0, total, filename, recieved, "download");
        totalSize = total;
        console.log("downloading: ", recieved, total);
      });

    cancelToken.cancel = request.cancel;
    let response = await request;
    await fileCheck(response, totalSize);
    let status = response.info().status;
    useAttachmentStore.getState().remove(filename);
    return status >= 200 && status < 300;
  } catch (e) {
    ToastEvent.show({
      heading: "Error downloading file",
      message: e.message,
      type: "error",
      context: "global"
    });
    ToastEvent.show({
      heading: "Error downloading file",
      message: e.message,
      type: "error",
      context: "local"
    });

    useAttachmentStore.getState().remove(filename);
    RNFetchBlob.fs.unlink(path).catch(console.log);
    console.log("download file error: ", e, url, headers);
    return false;
  }
}

export async function downloadAttachment(hash, global = true) {
  let attachment = db.attachments.attachment(hash);
  if (!attachment) {
    console.log("attachment not found");
    return;
  }

  let folder = {};
  if (Platform.OS === "android") {
    folder = await ScopedStorage.openDocumentTree();
    if (!folder) return;
  } else {
    folder.uri = await Storage.checkAndCreateDir("/downloads/");
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
      fileName: attachment.metadata.filename,
      uri: folder.uri,
      chunkSize: attachment.chunkSize
    };

    let fileUri = await Sodium.decryptFile(key, info, false);
    ToastEvent.show({
      heading: "Download successful",
      message: attachment.metadata.filename + " downloaded",
      type: "success"
    });

    if (attachment.dateUploaded) {
      RNFetchBlob.fs
        .unlink(RNFetchBlob.fs.dirs.CacheDir + `/${attachment.metadata.hash}`)
        .catch(console.log);
    }

    if (Platform.OS === "ios") {
      fileUri = folder.uri + `/${attachment.metadata.filename}`;
    }
    console.log("saved file uri: ", fileUri);

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

export async function getUploadedFileSize(hash) {
  const url = `${hosts.API_HOST}/s3?name=${hash}`;
  const token = await db.user.tokenManager.getAccessToken();

  const attachmentInfo = await fetch(url, {
    method: "HEAD",
    headers: { Authorization: `Bearer ${token}` }
  });

  const contentLength = parseInt(attachmentInfo.headers?.get("content-length"));
  return isNaN(contentLength) ? 0 : contentLength;
}

export async function checkAttachment(hash) {
  const internetState = await NetInfo.fetch();
  const isInternetReachable =
    internetState.isConnected && internetState.isInternetReachable;
  if (!isInternetReachable) return { success: true };
  const attachment = db.attachments.attachment(hash);
  if (!attachment) return { failed: "Attachment not found." };

  try {
    const size = await getUploadedFileSize(hash);
    if (size <= 0) return { failed: "File length is 0." };
  } catch (e) {
    return { failed: e?.message };
  }
  return { success: true };
}
