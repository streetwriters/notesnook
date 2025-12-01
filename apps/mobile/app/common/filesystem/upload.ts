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

import { isImage, RequestOptions } from "@notesnook/core";
import { PermissionsAndroid, Platform } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import { ToastManager } from "../../services/event-manager";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { IOS_APPGROUPID } from "../../utils/constants";
import { DatabaseLogger, db } from "../database";
import { createCacheDir } from "./io";
import {
  cacheDir,
  checkUpload,
  FileSizeResult,
  getUploadedFileSize
} from "./utils";
import Upload from "@ammarahmed/react-native-upload";

export async function uploadFile(
  filename: string,
  requestOptions: RequestOptions,
  cancelToken: {
    cancel: (reason?: string) => Promise<void>;
  }
) {
  if (!requestOptions) return false;
  const { url, headers } = requestOptions;
  await createCacheDir();
  DatabaseLogger.info(`Preparing to upload file: ${filename}`);

  try {
    let filePath = `${cacheDir}/${filename}`;
    let exists = await RNFetchBlob.fs.exists(filePath);
    // Check for file in appGroupPath if it doesn't exist in cacheDir
    if (!exists && Platform.OS === "ios") {
      const iosAppGroup =
        Platform.OS === "ios"
          ? await (RNFetchBlob.fs as any).pathForAppGroup(IOS_APPGROUPID)
          : null;
      const appGroupPath = `${iosAppGroup}/${filename}`;
      filePath = appGroupPath;
      exists = await RNFetchBlob.fs.exists(filePath);
    }

    if (!exists) {
      throw new Error(
        `Trying to upload file at path ${filePath} that doest not exist.`
      );
    }

    const fileInfo = await RNFetchBlob.fs.stat(filePath);

    const remoteFileSize = await getUploadedFileSize(filename);
    if (remoteFileSize === FileSizeResult.Error) return false;

    if (
      remoteFileSize > FileSizeResult.Empty &&
      remoteFileSize === fileInfo.size
    ) {
      DatabaseLogger.log(`File ${filename} is already uploaded.`);
      return true;
    }

    let attachmentInfo = await db.attachments.attachment(filename);

    DatabaseLogger.info(
      `Starting upload of ${filename} at path: ${fileInfo.path} ${fileInfo.size}`
    );

    if (Platform.OS === "android") {
      const status = await PermissionsAndroid.request(
        "android.permission.POST_NOTIFICATIONS"
      );
      if (status !== "granted") {
        ToastManager.show({
          message: `The permission to show file upload notification was disallowed by the user.`,
          type: "info"
        });
      }
    }

    const upload = Upload.create({
      customUploadId: filename,
      path: Platform.OS === "ios" ? "file://" + fileInfo.path : fileInfo.path,
      url: url,
      method: "PUT",
      headers: {
        ...headers,
        "content-type": "application/octet-stream"
      },
      appGroup: IOS_APPGROUPID,
      notification: {
        filename:
          attachmentInfo && isImage(attachmentInfo?.mimeType)
            ? "image"
            : attachmentInfo?.filename || "file",
        enabled: true,
        enableRingTone: true,
        autoClear: true
      }
    }).onChange((event) => {
      switch (event.status) {
        case "running":
        case "pending":
          useAttachmentStore
            .getState()
            .setProgress(
              event.uploadedBytes || 0,
              event.totalBytes || fileInfo.size,
              filename,
              0,
              "upload"
            );
          DatabaseLogger.info(
            `File upload progress: ${filename}, ${event.uploadedBytes}/${
              event.totalBytes || fileInfo.size
            }`
          );
          break;
        case "completed":
          console.log("Upload completed");
          break;
      }
    });
    const result = await upload.start();
    cancelToken.cancel = async () => {
      useAttachmentStore.getState().remove(filename);
      upload.cancel();
    };

    const status = result.responseCode || 0;
    const uploaded = status >= 200 && status < 300;

    useAttachmentStore.getState().remove(filename);

    if (!uploaded) {
      const fileInfo = await RNFetchBlob.fs.stat(filePath);
      throw new Error(
        `${status}, name: ${fileInfo.filename}, length: ${
          fileInfo.size
        }, info: ${JSON.stringify(result.error)}`
      );
    }
    attachmentInfo = await db.attachments.attachment(filename);
    if (!attachmentInfo) return false;
    await checkUpload(filename, requestOptions.chunkSize, attachmentInfo.size);
    DatabaseLogger.info(`File upload status: ${filename}, ${status}`);
    return uploaded;
  } catch (e) {
    useAttachmentStore.getState().remove(filename);
    ToastManager.error(e as Error, "File upload failed");
    DatabaseLogger.error(e, "File upload failed", {
      filename
    });
    return false;
  }
}
