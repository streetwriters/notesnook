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
import { Platform } from "react-native";
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

    const fileSize = (await RNFetchBlob.fs.stat(filePath)).size;

    const remoteFileSize = await getUploadedFileSize(filename);
    if (remoteFileSize === FileSizeResult.Error) return false;

    if (remoteFileSize > FileSizeResult.Empty && remoteFileSize === fileSize) {
      DatabaseLogger.log(`File ${filename} is already uploaded.`);
      return true;
    }

    const uploadUrlResponse = await fetch(url, {
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

    const uploadRequest = RNFetchBlob.config({
      //@ts-ignore
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

    cancelToken.cancel = async () => {
      useAttachmentStore.getState().remove(filename);
      uploadRequest.cancel();
    };

    const uploadResponse = await uploadRequest;
    const status = uploadResponse.info().status;
    const uploaded = status >= 200 && status < 300;

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
    if (!attachment) return false;
    await checkUpload(filename, requestOptions.chunkSize, attachment.size);
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
