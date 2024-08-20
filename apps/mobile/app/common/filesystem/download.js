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

import NetInfo from "@react-native-community/netinfo";
import RNFetchBlob from "react-native-blob-util";
import { ToastManager } from "../../services/event-manager";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { DatabaseLogger, db } from "../database";
import { createCacheDir, exists } from "./io";
import { ABYTES, cacheDir, getUploadedFileSize, parseS3Error } from "./utils";

export async function downloadFile(filename, requestOptions, cancelToken) {
  if (!requestOptions) {
    DatabaseLogger.log(
      `Error downloading file: ${filename}, reason: No requestOptions`
    );
    return false;
  }

  DatabaseLogger.log(`Downloading ${filename}`);
  await createCacheDir();
  let { url, headers, chunkSize } = requestOptions;
  let tempFilePath = `${cacheDir}/${filename}_temp`;
  let originalFilePath = `${cacheDir}/${filename}`;
  try {
    if (await exists(filename)) {
      DatabaseLogger.log(`File Exists already: ${filename}`);
      return true;
    }
    const attachment = await db.attachments.attachment(filename);
    const size = await getUploadedFileSize(filename);

    if (size === -1) {
      const error = `Uploaded file verification failed. (File hash: ${filename})`;
      throw new Error(error);
    }

    if (size === 0) {
      const error = `File length is 0. Please upload this file again from the attachment manager. (File hash: ${filename})`;
      await db.attachments.markAsFailed(attachment.id, error);
      throw new Error(error);
    }

    const totalChunks = Math.ceil(size / chunkSize);
    const decryptedLength = size - totalChunks * ABYTES;

    if (attachment && attachment.size !== decryptedLength) {
      const error = `File length mismatch. Expected ${attachment.size} but got ${decryptedLength} bytes. Please upload this file again from the attachment manager. (File hash: ${filename})`;
      await db.attachments.markAsFailed(attachment.id, error);
      throw new Error(error);
    }

    let res = await fetch(url, {
      method: "GET",
      headers
    });

    if (!res.ok) {
      DatabaseLogger.log(
        `Error downloading file: ${filename}, ${res.status}, ${res.statusText}, reason: Unable to resolve download url`
      );
      throw new Error(`${res.status}: Unable to resolve download url`);
    }

    const downloadUrl = await res.text();

    if (!downloadUrl) {
      DatabaseLogger.log(
        `Error downloading file: ${filename}, reason: Unable to resolve download url`
      );
      throw new Error("Unable to resolve download url");
    }

    DatabaseLogger.log(`Download starting: ${filename}`);
    let request = RNFetchBlob.config({
      path: tempFilePath,
      IOSBackgroundTask: true
    })
      .fetch("GET", downloadUrl, null)
      .progress(async (recieved, total) => {
        useAttachmentStore
          .getState()
          .setProgress(0, total, filename, recieved, "download");

        DatabaseLogger.log(`Downloading: ${filename}, ${recieved}/${total}`);
      });

    cancelToken.cancel = () => {
      useAttachmentStore.getState().remove(filename);
      request.cancel();
      RNFetchBlob.fs.unlink(tempFilePath).catch(console.log);
      DatabaseLogger.log(`Download cancelled: ${filename}`);
    };

    let response = await request;
    console.log(response.info().headers);

    const contentType =
      response.info().headers?.["content-type"] ||
      response.info().headers?.["Content-Type"];

    if (contentType === "application/xml") {
      const error = parseS3Error(await response.text());
      throw new Error(`[${error.Code}] ${error.Message}`);
    }

    let status = response.info().status;
    useAttachmentStore.getState().remove(filename);
    await RNFetchBlob.fs.mv(tempFilePath, originalFilePath);

    if (!(await exists(filename))) {
      throw new Error("File size mismatch");
    }

    return status >= 200 && status < 300;
  } catch (e) {
    if (e.message !== "canceled" && !e.message.includes("NoSuchKey")) {
      ToastManager.show({
        heading: "Error downloading file",
        message: e.message,
        type: "error",
        context: "global"
      });
      ToastManager.show({
        heading: "Error downloading file",
        message: e.message,
        type: "error",
        context: "local"
      });
    }

    useAttachmentStore.getState().remove(filename);
    RNFetchBlob.fs.unlink(tempFilePath).catch(console.log);
    RNFetchBlob.fs.unlink(originalFilePath).catch(console.log);
    DatabaseLogger.error(e, {
      url,
      headers
    });
    return false;
  }
}

export async function checkAttachment(hash) {
  const internetState = await NetInfo.fetch();
  const isInternetReachable =
    internetState.isConnected && internetState.isInternetReachable;
  if (!isInternetReachable) return;
  const attachment = await db.attachments.attachment(hash);
  if (!attachment) return { failed: "Attachment not found." };

  try {
    const size = await getUploadedFileSize(hash);
    console.log("File Size", size);
    if (size === -1) return { success: true };

    if (size === 0)
      return {
        failed: `File length is 0. Please upload this file again from the attachment manager. (File hash: ${hash})`
      };
  } catch (e) {
    return { failed: e?.message };
  }
  return { success: true };
}
