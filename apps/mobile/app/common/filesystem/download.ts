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

import { RequestOptions } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import NetInfo from "@react-native-community/netinfo";
import RNFetchBlob from "react-native-blob-util";
import { ToastManager } from "../../services/event-manager";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { DatabaseLogger, db } from "../database";
import { createCacheDir, exists } from "./io";
import { ABYTES, cacheDir, getUploadedFileSize, parseS3Error } from "./utils";

export async function downloadFile(
  filename: string,
  requestOptions: RequestOptions,
  cancelToken: {
    cancel: (reason?: string) => Promise<void>;
  }
) {
  if (!requestOptions) {
    DatabaseLogger.log(
      `Error downloading file: ${filename}, reason: No requestOptions`
    );
    return false;
  }

  DatabaseLogger.log(`Downloading ${filename}`);
  await createCacheDir();

  const { url, headers, chunkSize } = requestOptions;
  const tempFilePath = `${cacheDir}/${filename}_temp`;
  const originalFilePath = `${cacheDir}/${filename}`;

  try {
    if (await exists(filename)) {
      DatabaseLogger.log(`File Exists already: ${filename}`);
      return true;
    }

    const attachment = await db.attachments.attachment(filename);
    if (!attachment) return false;

    const size = await getUploadedFileSize(filename);

    if (size === -1) {
      const error = `${strings.fileVerificationFailed()} (File hash: ${filename})`;
      throw new Error(error);
    }

    if (size === 0) {
      const error = `${strings.fileLengthError()} (File hash: ${filename})`;
      await db.attachments.markAsFailed(attachment.id, error);
      throw new Error(error);
    }

    const totalChunks = Math.ceil(size / chunkSize);
    const decryptedLength = size - totalChunks * ABYTES;

    if (attachment && attachment.size !== decryptedLength) {
      const error = `${strings.fileLengthMismatch(
        attachment.size,
        decryptedLength
      )} (File hash: ${filename})`;
      await db.attachments.markAsFailed(attachment.id, error);
      throw new Error(error);
    }

    const resolveUrlResponse = await fetch(url, {
      method: "GET",
      headers
    });

    if (!resolveUrlResponse.ok) {
      DatabaseLogger.log(
        `Error downloading file: ${filename}, ${resolveUrlResponse.status}, ${resolveUrlResponse.statusText}, reason: Unable to resolve download url`
      );
      throw new Error(
        `${resolveUrlResponse.status}: ${strings.failedToResolvedDownloadUrl()}`
      );
    }

    const downloadUrl = await resolveUrlResponse.text();

    if (!downloadUrl) {
      DatabaseLogger.log(
        `Error downloading file: ${filename}, reason: Unable to resolve download url`
      );
      throw new Error(strings.failedToResolvedDownloadUrl());
    }

    DatabaseLogger.log(`Download starting: ${filename}`);
    const request = RNFetchBlob.config({
      path: tempFilePath,
      IOSBackgroundTask: true,
      overwrite: true
    })
      .fetch("GET", downloadUrl)
      .progress(async (recieved, total) => {
        useAttachmentStore
          .getState()
          .setProgress(0, total, filename, recieved, "download");

        DatabaseLogger.log(`Downloading: ${filename}, ${recieved}/${total}`);
      });

    cancelToken.cancel = async (reason) => {
      useAttachmentStore.getState().remove(filename);
      request.cancel();
      RNFetchBlob.fs.unlink(tempFilePath).catch(console.log);
      DatabaseLogger.log(`Download cancelled: ${reason} ${filename}`);
    };

    const response = await request;

    const contentType =
      response.info().headers?.["content-type"] ||
      response.info().headers?.["Content-Type"];

    if (contentType === "application/xml") {
      const error = parseS3Error(await response.text());
      throw new Error(`[${error.Code}] ${error.Message}`);
    }

    const status = response.info().status;
    useAttachmentStore.getState().remove(filename);

    if (await exists(originalFilePath)) {
      await RNFetchBlob.fs.unlink(originalFilePath).catch(console.log);
    }

    await RNFetchBlob.fs.mv(tempFilePath, originalFilePath);

    if (!(await exists(filename))) {
      throw new Error("File size mismatch");
    }

    return status >= 200 && status < 300;
  } catch (e) {
    if (
      (e as Error).message !== "canceled" &&
      !(e as Error).message.includes("NoSuchKey")
    ) {
      const toast = {
        heading: strings.downloadError((e as Error).message),
        message: (e as Error).message,
        type: "error" as const,
        context: "global"
      };
      ToastManager.show(toast);
      toast.context = "local";
      ToastManager.show(toast);
    }

    useAttachmentStore.getState().remove(filename);
    RNFetchBlob.fs.unlink(tempFilePath).catch(console.log);
    RNFetchBlob.fs.unlink(originalFilePath).catch(console.log);
    DatabaseLogger.error(e, "Download failed: ", {
      url
    });
    return false;
  }
}

export async function checkAttachment(hash: string) {
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
    return { failed: (e as Error)?.message };
  }
  return { success: true };
}
