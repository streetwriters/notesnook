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
import RNFetchBlob from "react-native-blob-util";
import { ToastManager } from "../../services/event-manager";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { IOS_APPGROUPID } from "../../utils/constants";
import { DatabaseLogger, db } from "../database";
import { createCacheDir } from "./io";
import { cacheDir, checkUpload, getUploadedFileSize } from "./utils";

export async function uploadFile(filename, requestOptions, cancelToken) {
  if (!requestOptions) return false;
  let { url, headers } = requestOptions;
  await createCacheDir();
  DatabaseLogger.info(`Preparing to upload file: ${filename}`);

  try {
    let filePath = `${cacheDir}/${filename}`;
    let exists = await RNFetchBlob.fs.exists(filePath);
    // Check for file in appGroupPath if it doesn't exist in cacheDir
    if (!exists && Platform.OS === "ios") {
      const iosAppGroup =
        Platform.OS === "ios"
          ? await RNFetchBlob.fs.pathForAppGroup(IOS_APPGROUPID)
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

    const fileSize = (await RNFetchBlob.fs.stat(filePath)).size;

    let remoteFileSize = await getUploadedFileSize(filename);
    if (remoteFileSize === -1) return false;
    if (remoteFileSize > 0 && remoteFileSize === fileSize) {
      DatabaseLogger.log(`File ${filename} is already uploaded.`);
      return true;
    }

    let uploadUrlResponse = await fetch(url, {
      method: "PUT",
      headers
    });

    const uploadUrl = uploadUrlResponse.ok
      ? await uploadUrlResponse.text()
      : await uploadUrlResponse.json();

    if (typeof uploadUrl !== "string") {
      throw new Error(
        uploadUrl.error || "Unable to resolve attachment upload url."
      );
    }

    DatabaseLogger.info(`Starting upload: ${filename}`);

    let uploadRequest = RNFetchBlob.config({
      IOSBackgroundTask: !globalThis["IS_SHARE_EXTENSION"]
    })
      .fetch(
        "PUT",
        uploadUrl,
        {
          "content-type": ""
        },
        RNFetchBlob.wrap(filePath)
      )
      .uploadProgress((sent, total) => {
        useAttachmentStore
          .getState()
          .setProgress(sent, total, filename, 0, "upload");
        DatabaseLogger.info(
          `File upload progress: ${filename}, ${sent}/${total}`
        );
      });

    cancelToken.cancel = () => {
      useAttachmentStore.getState().remove(filename);
      uploadRequest.cancel();
    };

    let uploadResponse = await uploadRequest;
    let status = uploadResponse.info().status;
    let uploaded = status >= 200 && status < 300;

    useAttachmentStore.getState().remove(filename);

    if (!uploaded) {
      const fileInfo = await RNFetchBlob.fs.stat(filePath);
      throw new Error(
        `${status}, name: ${fileInfo.filename}, length: ${
          fileInfo.size
        }, info: ${JSON.stringify(uploadResponse.info())}`
      );
    }
    const attachment = await db.attachments.attachment(filename);
    await checkUpload(filename, requestOptions.chunkSize, attachment.size);
    DatabaseLogger.info(`File upload status: ${filename}, ${status}`);
    return uploaded;
  } catch (e) {
    useAttachmentStore.getState().remove(filename);
    ToastManager.error(e, "File upload failed");
    DatabaseLogger.error(e, "File upload failed", {
      filename
    });
    return false;
  }
}
