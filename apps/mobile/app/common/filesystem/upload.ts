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
import { MMKV } from "../database/mmkv";
import { createCacheDir } from "./io";
import {
  cacheDir,
  checkUpload,
  FileSizeResult,
  getUploadedFileSize
} from "./utils";
import Upload from "@ammarahmed/react-native-upload";
import { useUserStore } from "../../stores/use-user-store";
import { sleep } from "../../utils/time";
import { isFeatureAvailable } from "@notesnook/common";
import { strings } from "@notesnook/intl";

// Upload constants
const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
const MINIMUM_MULTIPART_FILE_SIZE = 25 * 1024 * 1024; // 25MB

// S3 error codes meaning the saved upload ID or its parts are no longer valid,
// so the next attempt has to start a new multipart upload.
const RESET_UPLOAD_ERRORS = [
  "NoSuchKey",
  "NoSuchUpload",
  "IncompleteBody",
  "InternalError",
  "InvalidObjectState",
  "InvalidPart",
  "InvalidPartOrder",
  "SignatureDoesNotMatch"
];

interface StoredMultipartSession {
  uploadId: string;
  etags: string[];
}

const getMultipartSessionKey = (filename: string) =>
  `s3_multipart_upload_${filename}`;

class MultipartInitiateError extends Error {
  // true when the server explicitly rejected the request (4xx or data.error)
  constructor(
    message: string,
    public readonly rejected: boolean
  ) {
    super(message);
    this.name = "MultipartInitiateError";
  }
}

interface InitiateMultipartResponse {
  uploadId: string;
  parts: string[];
  error?: string;
}

async function initiateMultipartUpload(
  filename: string,
  fileSize: number,
  headers: Record<string, string>,
  existingUploadId = ""
): Promise<InitiateMultipartResponse> {
  const totalParts = Math.ceil(fileSize / CHUNK_SIZE);

  const url = `${hosts.API_HOST}/s3/multipart?name=${filename}&parts=${totalParts}&uploadId=${existingUploadId}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new MultipartInitiateError(
      `Failed to initiate multipart upload: ${response.statusText}`,
      response.status >= 400 && response.status < 500
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new MultipartInitiateError(data.error, true);
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
  cancelToken: { cancel: (reason?: string) => Promise<void> },
  displayName: string
): Promise<Response> {
  const { headers } = requestOptions;
  const sessionKey = getMultipartSessionKey(filename);

  try {
    const savedSession = MMKV.getMap<StoredMultipartSession>(sessionKey);
    const savedUploadId = savedSession?.uploadId || "";
    let currentEtags: string[] = savedSession?.etags || [];

    let uploadData: InitiateMultipartResponse;
    try {
      uploadData = await initiateMultipartUpload(
        filename,
        fileSize,
        headers,
        savedUploadId
      );
    } catch (e) {
      // Discard the saved session only if the server rejected it. Network
      // errors and 5xx keep it so the next attempt can resume.
      if (savedUploadId && (e as MultipartInitiateError).rejected === true)
        MMKV.removeItem(sessionKey);
      throw e;
    }
    const { uploadId, parts } = uploadData;

    // Discard the saved etags if the server gave us a new session or the
    // part count changed.
    if (
      (savedUploadId && uploadId !== savedUploadId) ||
      currentEtags.length !== parts.length
    ) {
      currentEtags = [];
      MMKV.removeItem(sessionKey);
    }

    // Remember the upload ID even if no part finishes.
    MMKV.setMap(sessionKey, { uploadId, etags: currentEtags });

    const uploadedParts = currentEtags.filter(Boolean).length;
    if (uploadedParts > 0) {
      DatabaseLogger.info(
        `Resuming multipart upload for ${filename}: ${uploadedParts}/${parts.length} parts already uploaded`
      );
    }

    DatabaseLogger.info(
      `Starting upload for ${filename} with ${parts.length} parts`
    );

    const upload = Upload.createMultipartS3({
      uploadId,
      path: filePath,
      parts,
      maxParallel: 3,
      appGroup: IOS_APPGROUPID,
      existingEtags: currentEtags.length > 0 ? currentEtags : undefined,
      resumable: false,
      notification: {
        filename: displayName,
        enabled: true,
        enableRingTone: true,
        autoClear: true
      }
    });

    let cancelled = false;
    cancelToken.cancel = async () => {
      cancelled = true;
      MMKV.removeItem(sessionKey);
      useAttachmentStore.getState().remove(filename);
      await upload.cancel();
    };

    upload.onProgress((event) => {
      if (!cancelled && event.etags && event.etags.length === parts.length) {
        currentEtags = event.etags;
        MMKV.setMap(sessionKey, { uploadId, etags: currentEtags });
      }
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
    // Upload handles chunking and uploading all parts internally
    const result = await upload.start();

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

    // The completion request ends this multipart session whether or not it
    // succeeded, so a retry starts a new session instead of reusing this upload ID.
    MMKV.removeItem(sessionKey);

    return response;
  } catch (error) {
    DatabaseLogger.error(error, "Multipart upload failed", { filename });
    const errorText = error instanceof Error ? error.message : String(error);
    if (
      RESET_UPLOAD_ERRORS.some((code) => errorText.includes(code)) ||
      // iOS errors don't include the S3 code; NoSuchUpload/NoSuchKey are 404s
      /HTTP (status )?404\b/.test(errorText)
    ) {
      MMKV.removeItem(sessionKey);
    }
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

    const featureResult = await isFeatureAvailable(
      "fileSize",
      fileInfo.size || 0
    );

    if (!featureResult.isAllowed) {
      ToastManager.show({
        heading: strings.fileTooLarge(),
        message: featureResult.error,
        type: "error"
      });
      return false;
    }

    if (
      remoteFileSize > FileSizeResult.Empty &&
      remoteFileSize === fileInfo.size
    ) {
      DatabaseLogger.log(`File ${filename} is already uploaded.`);
      return true;
    }

    let attachmentInfo = await db.attachments.attachment(filename);
    const displayName =
      attachmentInfo && isImage(attachmentInfo?.mimeType)
        ? "image"
        : attachmentInfo?.filename || "file";

    DatabaseLogger.info(
      `Starting upload of ${filename} at path: ${fileInfo.path} ${fileInfo.size}`
    );

    if (Platform.OS === "android") {
      useUserStore.setState({
        disableAppLockRequests: true
      });
      const status = await PermissionsAndroid.request(
        "android.permission.POST_NOTIFICATIONS"
      );
      if (status !== "granted") {
        ToastManager.show({
          message: strings.fileUploadNotificationPermissionDisallowed(),
          type: "info"
        });
      }
      await sleep(500);
      useUserStore.setState({
        disableAppLockRequests: false
      });
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
        cancelToken,
        displayName
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
          filename: displayName,
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
      cancelToken.cancel = async () => {
        useAttachmentStore.getState().remove(filename);
        upload.cancel();
      };
      const result = await upload.start();

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
