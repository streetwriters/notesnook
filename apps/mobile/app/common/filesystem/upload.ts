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

import { isImage, RequestOptions, hosts } from "@notesnook/core";
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
import { CloudUploader } from "react-native-nitro-cloud-uploader";

// Upload constants
const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
const MINIMUM_MULTIPART_FILE_SIZE = 25 * 1024 * 1024; // 25MB

interface InitiateMultipartResponse {
  uploadId: string;
  parts: string[];
  error?: string;
}

async function initiateMultipartUpload(
  filename: string,
  fileSize: number,
  headers: Record<string, string>
): Promise<InitiateMultipartResponse> {
  const totalParts = Math.ceil(fileSize / CHUNK_SIZE);

  const url = `${hosts.API_HOST}/s3/multipart?name=${filename}&parts=${totalParts}&uploadId=`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `Failed to initiate multipart upload: ${response.statusText}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  if (!data.uploadId || !data.parts) {
    throw new Error("Failed to initiate multipart upload: invalid response.");
  }

  DatabaseLogger.info(
    `Initiated multipart upload for ${filename} with upload ID: ${data.uploadId}`
  );

  return data;
}

async function multipartUploadFile(
  filename: string,
  filePath: string,
  fileSize: number,
  requestOptions: RequestOptions,
  cancelToken: { cancel: (reason?: string) => Promise<void> }
): Promise<Response> {
  const { headers } = requestOptions;

  try {
    const uploadData = await initiateMultipartUpload(
      filename,
      fileSize,
      headers
    );
    const { uploadId, parts } = uploadData;

    DatabaseLogger.info(
      `Starting upload for ${filename} with ${parts.length} parts`
    );

    cancelToken.cancel = async () => {
      useAttachmentStore.getState().remove(filename);
      await CloudUploader.cancelUpload(uploadId);
    };

    CloudUploader.addListener("upload-progress", (event) => {
      useAttachmentStore
        .getState()
        .setProgress(
          event.bytesUploaded || 0,
          event.totalBytes || fileSize,
          filename,
          0,
          "upload"
        );
      DatabaseLogger.info(
        `File upload progress: ${filename}, ${event.bytesUploaded}/${
          event.totalBytes || fileSize
        }, chunk: ${event.chunkIndex}, progress: ${event.progress}`
      );
    });
    // CloudUploader handles chunking and uploading all parts internally
    const result = await CloudUploader.startUpload(
      filename,
      filePath,
      parts,
      3, // maxParallel
      true // showNotification
    );

    CloudUploader.removeListener("upload-progress");

    if (!result.success) {
      throw new Error("Failed to upload multipart file");
    }

    DatabaseLogger.info(
      `Multipart upload completed for ${filename} with upload ID: ${uploadId}`
    );

    const response = await fetch(`${hosts.API_HOST}/s3/multipart`, {
      method: "POST",
      body: JSON.stringify({
        Key: filename,
        UploadId: uploadId,
        PartETags: result.etags.map((etag, index) => ({
          partNumber: index + 1,
          etag: etag
        }))
      }),
      headers: { ...headers, "Content-Type": "application/json" }
    });

    return response;
  } catch (error) {
    DatabaseLogger.error(error, "Multipart upload failed", { filename });
    CloudUploader.removeListener("upload-progress");
    useAttachmentStore.getState().remove(filename);
    throw error;
  }
}

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

    let uploaded = false;

    // Use multipart upload for files larger than MINIMUM_MULTIPART_FILE_SIZE
    if (fileInfo.size >= MINIMUM_MULTIPART_FILE_SIZE) {
      DatabaseLogger.info(
        `Using multipart upload for large file: ${filename} (${fileInfo.size} bytes)`
      );
      const result = await multipartUploadFile(
        filename,
        filePath,
        fileInfo.size,
        requestOptions,
        cancelToken
      );
      const status = result.status || 0;
      uploaded = status >= 200 && status < 300;

      if (!uploaded) {
        const fileInfo = await RNFetchBlob.fs.stat(filePath);
        throw new Error(
          `${status}, name: ${fileInfo.filename}, length: ${
            fileInfo.size
          }, info: ${JSON.stringify(await result.text())}`
        );
      }
    } else {
      // Use single-part upload for smaller files
      DatabaseLogger.info(
        `Using single-part upload for file: ${filename} (${fileInfo.size} bytes)`
      );
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
            DatabaseLogger.info("Upload completed");
            break;
        }
      });
      const result = await upload.start();
      cancelToken.cancel = async () => {
        useAttachmentStore.getState().remove(filename);
        upload.cancel();
      };

      const status = result.responseCode || 0;
      uploaded = status >= 200 && status < 300;

      if (!uploaded) {
        const fileInfo = await RNFetchBlob.fs.stat(filePath);
        throw new Error(
          `${status}, name: ${fileInfo.filename}, length: ${
            fileInfo.size
          }, info: ${JSON.stringify(result.error)}`
        );
      }
    }

    useAttachmentStore.getState().remove(filename);

    if (uploaded) {
      attachmentInfo = await db.attachments.attachment(filename);
      if (!attachmentInfo) return false;
      await checkUpload(
        filename,
        requestOptions.chunkSize,
        attachmentInfo.size
      );
      DatabaseLogger.info(`File upload status: ${filename}, success`);
    }

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
