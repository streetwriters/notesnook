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

import hosts from "../utils/constants";
import TokenManager from "../api/token-manager";
import {
  FileEncryptionMetadataWithOutputType,
  IFileStorage
} from "../interfaces";
import { DataFormat, SerializedKey } from "@notesnook/crypto/dist/src/types";
import { EV, EVENTS } from "../common";

export type FileStorageAccessor = () => FileStorage;
export type DownloadableFile = {
  filename: string;
  // metadata: AttachmentMetadata;
  chunkSize: number;
};
export type QueueItem = DownloadableFile & {
  cancel?: (reason?: string) => Promise<void>;
};

export class FileStorage {
  downloads = new Map<string, QueueItem[]>();
  uploads = new Map<string, QueueItem[]>();
  constructor(
    private readonly fs: IFileStorage,
    private readonly tokenManager: TokenManager
  ) {}

  async queueDownloads(
    files: DownloadableFile[],
    groupId: string,
    eventData?: Record<string, unknown>
  ) {
    const token = await this.tokenManager.getAccessToken();
    const total = files.length;
    let current = 0;
    this.downloads.set(groupId, files);

    for (const file of files as QueueItem[]) {
      const { filename, chunkSize } = file;
      if (await this.exists(filename)) {
        current++;
        EV.publish(EVENTS.fileDownloaded, {
          success: true,
          groupId,
          filename,
          eventData
        });
        continue;
      }

      const url = `${hosts.API_HOST}/s3?name=${filename}`;
      const { execute, cancel } = this.fs.downloadFile(filename, {
        url,
        chunkSize,
        headers: { Authorization: `Bearer ${token}` }
      });
      file.cancel = cancel;

      EV.publish(EVENTS.fileDownload, {
        total,
        current,
        groupId,
        filename
      });

      const result = await execute().catch(() => false);
      if (eventData)
        EV.publish(EVENTS.fileDownloaded, {
          success: result,
          total,
          current: ++current,
          groupId,
          filename,
          eventData
        });
    }
    this.downloads.delete(groupId);
  }

  async queueUploads(files: DownloadableFile[], groupId: string) {
    const token = await this.tokenManager.getAccessToken();
    const total = files.length;
    let current = 0;
    this.uploads.set(groupId, files);

    for (const file of files as QueueItem[]) {
      const { filename, chunkSize } = file;
      const url = `${hosts.API_HOST}/s3?name=${filename}`;
      const { execute, cancel } = this.fs.uploadFile(filename, {
        chunkSize,
        url,
        headers: { Authorization: `Bearer ${token}` }
      });
      file.cancel = cancel;

      EV.publish(EVENTS.fileUpload, {
        total,
        current,
        groupId,
        filename
      });

      let error = null;
      const result = await execute().catch((e) => {
        console.error("Failed to upload attachment:", e);
        error = e;
        return false;
      });

      EV.publish(EVENTS.fileUploaded, {
        error,
        success: result,
        total,
        current: ++current,
        groupId,
        filename
      });
    }
    this.uploads.delete(groupId);
  }

  async downloadFile(groupId: string, filename: string, chunkSize: number) {
    const url = `${hosts.API_HOST}/s3?name=${filename}`;
    const token = await this.tokenManager.getAccessToken();
    const { execute, cancel } = this.fs.downloadFile(filename, {
      url,
      chunkSize,
      headers: { Authorization: `Bearer ${token}` }
    });
    this.downloads.set(groupId, [{ cancel, filename, chunkSize }]);
    const result = await execute();
    this.downloads.delete(groupId);
    return result;
  }

  async cancel(groupId: string) {
    const queues = [
      { type: "download", files: this.downloads.get(groupId) },
      { type: "upload", files: this.uploads.get(groupId) }
    ].filter((a) => !!a.files);

    for (const queue of queues) {
      if (!queue.files) continue;
      for (let i = 0; i < queue.files.length; ++i) {
        const file = queue.files[i];
        if (file.cancel) await file.cancel("Operation canceled.");
        queue.files.splice(i, 1);
      }

      if (queue.type === "download") {
        this.downloads.delete(groupId);
        EV.publish(EVENTS.downloadCanceled, { groupId, canceled: true });
      } else if (queue.type === "upload") {
        this.uploads.delete(groupId);
        EV.publish(EVENTS.uploadCanceled, { groupId, canceled: true });
      }
    }
  }

  readEncrypted<TOutputFormat extends DataFormat>(
    filename: string,
    encryptionKey: SerializedKey,
    cipherData: FileEncryptionMetadataWithOutputType<TOutputFormat>
  ) {
    return this.fs.readEncrypted(filename, encryptionKey, cipherData);
  }

  writeEncryptedBase64(
    data: string,
    encryptionKey: SerializedKey,
    mimeType: string
  ) {
    return this.fs.writeEncryptedBase64(data, encryptionKey, mimeType);
  }

  async deleteFile(filename: string, localOnly = false) {
    if (localOnly) return await this.fs.deleteFile(filename);

    const token = await this.tokenManager.getAccessToken();
    const url = `${hosts.API_HOST}/s3?name=${filename}`;
    return await this.fs.deleteFile(filename, {
      url,
      headers: { Authorization: `Bearer ${token}` },
      chunkSize: 0
    });
  }

  exists(filename: string) {
    return this.fs.exists(filename);
  }

  clear() {
    return this.fs.clearFileStorage();
  }

  hashBase64(data: string) {
    return this.fs.hashBase64(data);
  }
}
