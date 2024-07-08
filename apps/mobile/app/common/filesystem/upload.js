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

import RNFetchBlob from "react-native-blob-util";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { DatabaseLogger, db } from "../database";
import { cacheDir } from "./utils";
import { isImage, isDocument } from "@notesnook/core/dist/utils/filename";
import { Platform } from "react-native";
import { IOS_APPGROUPID } from "../../utils/constants";
import { createCacheDir } from "./io";
import { getUploadedFileSize } from "./download";
import { ToastManager } from "../../services/event-manager";

export async function uploadFile(filename, data, cancelToken) {
  if (!data) return false;
  let { url, headers } = data;
  await createCacheDir();
  DatabaseLogger.info(`Preparing to upload file: ${filename}`);

  try {
    const uploadedFileSize = await getUploadedFileSize(filename);
    if (uploadedFileSize === -1) {
      DatabaseLogger.log("Upload verification failed.");
      return false;
    }

    const isUploaded = uploadedFileSize !== 0;
    if (isUploaded) {
      DatabaseLogger.log(`File ${filename} is already uploaded.`);
      return true;
    }

    let res = await fetch(url, {
      method: "PUT",
      headers
    });

    const uploadUrl = res.ok ? await res.text() : await res.json();

    if (typeof uploadUrl !== "string") {
      throw new Error(
        uploadUrl.error || "Unable to resolve attachment upload url."
      );
    }

    let uploadFilePath = `${cacheDir}/${filename}`;

    const iosAppGroup =
      Platform.OS === "ios"
        ? await RNFetchBlob.fs.pathForAppGroup(IOS_APPGROUPID)
        : null;
    const appGroupPath = `${iosAppGroup}/${filename}`;
    let exists = await RNFetchBlob.fs.exists(uploadFilePath);
    if (!exists && Platform.OS === "ios") {
      uploadFilePath = appGroupPath;
      exists = await RNFetchBlob.fs.exists(uploadFilePath);
    }

    if (!exists) {
      throw new Error(
        `Trying to upload file at path ${uploadFilePath} that doest not exist.`
      );
    }

    DatabaseLogger.info(`Starting upload: ${filename}`);

    let request = RNFetchBlob.config({
      IOSBackgroundTask: !globalThis["IS_SHARE_EXTENSION"]
    })
      .fetch(
        "PUT",
        uploadUrl,
        {
          "content-type": ""
        },
        RNFetchBlob.wrap(uploadFilePath)
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
      request.cancel();
    };
    let response = await request;

    let status = response.info().status;
    let text = await response.text();
    let result = status >= 200 && status < 300 && text.length === 0;
    useAttachmentStore.getState().remove(filename);
    if (result) {
      DatabaseLogger.info(
        `File upload status: ${filename}, ${status}, ${text}`
      );
      let attachment = await db.attachments.attachment(filename);
      if (!attachment) return result;
      if (!isImage(attachment.mimeType) && !isDocument(attachment.mimeType)) {
        RNFetchBlob.fs.unlink(`${cacheDir}/${filename}`).catch(console.log);
      }
    } else {
      const fileInfo = await RNFetchBlob.fs.stat(uploadFilePath);
      throw new Error(
        `${status}, ${text}, name: ${fileInfo.filename}, length: ${
          fileInfo.size
        }, info: ${JSON.stringify(response.info())}`
      );
    }

    return result;
  } catch (e) {
    useAttachmentStore.getState().remove(filename);
    ToastManager.error(e, "File upload failed");
    DatabaseLogger.error(e, "File upload failed", {
      filename
    });
    return false;
  }
}
