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

import hosts from "@notesnook/core/dist/utils/constants";
import NetInfo from "@react-native-community/netinfo";
import RNFetchBlob from "react-native-blob-util";
import { ToastEvent } from "../../services/event-manager";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { db } from "../database";
import { cacheDir, fileCheck } from "./utils";
import { createCacheDir, exists } from "./io";

export async function downloadFile(filename, data, cancelToken) {
  if (!data) return false;

  await createCacheDir();

  let { url, headers } = data;
  let path = `${cacheDir}/${filename}`;

  try {
    if (await exists(filename)) {
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
    console.log("Download starting");
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

    cancelToken.cancel = () => {
      useAttachmentStore.getState().remove(filename);
      request.cancel();
    };
    let response = await request;
    await fileCheck(response, totalSize);
    let status = response.info().status;
    useAttachmentStore.getState().remove(filename);
    return status >= 200 && status < 300;
  } catch (e) {
    if (e.message !== "canceled") {
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
    }

    useAttachmentStore.getState().remove(filename);
    RNFetchBlob.fs.unlink(path).catch(console.log);
    console.log("Download file error:", e, url, headers);
    return false;
  }
}

export async function getUploadedFileSize(hash) {
  try {
    const url = `${hosts.API_HOST}/s3?name=${hash}`;
    const token = await db.user.tokenManager.getAccessToken();

    const attachmentInfo = await fetch(url, {
      method: "HEAD",
      headers: { Authorization: `Bearer ${token}` }
    });

    const contentLength = parseInt(
      attachmentInfo.headers?.get("content-length")
    );
    return isNaN(contentLength) ? 0 : contentLength;
  } catch (e) {
    return 0;
  }
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
