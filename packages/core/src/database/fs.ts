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
import { logger } from "../logger";

export type FileStorageAccessor = () => FileStorage;
export type DownloadableFile = {
  filename: string;
  chunkSize: number;
};
export type QueueItem = DownloadableFile & {
  cancel?: (reason?: string) => Promise<void>;
  operation?: Promise<boolean>;
};

export class FileStorage {
  id = Date.now();
  downloads = new Map<string, QueueItem>();
  uploads = new Map<string, QueueItem>();
  groups = {
    downloads: new Map<string, Set<string>>(),
    uploads: new Map<string, Set<string>>()
  };

  constructor(
    private readonly fs: IFileStorage,
    private readonly tokenManager: TokenManager
  ) {}

  async queueDownloads(
    files: DownloadableFile[],
    groupId: string,
    eventData?: Record<string, unknown>
  ) {
    let current = 0;
    const token = await this.tokenManager.getAccessToken();
    const total = files.length;
    const group = this.groups.downloads.get(groupId) || new Set();
    files.forEach((f) => group.add(f.filename));
    this.groups.downloads.set(groupId, group);

    for (const file of files as QueueItem[]) {
      if (!group.has(file.filename)) continue;

      const download = this.downloads.get(file.filename);
      if (download && download.operation) {
        logger.debug("[queueDownloads] duplicate download", {
          filename: file.filename,
          groupId
        });
        await download.operation;
        continue;
      }

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

      EV.publish(EVENTS.fileDownload, {
        total,
        current,
        groupId,
        filename
      });

      const url = `${hosts.API_HOST}/s3?name=${filename}`;
      const { execute, cancel } = this.fs.downloadFile(filename, {
        url,
        chunkSize,
        headers: { Authorization: `Bearer ${token}` }
      });
      file.cancel = cancel;
      file.operation = execute()
        .catch(() => false)
        .finally(() => {
          this.downloads.delete(filename);
          group.delete(filename);
        });

      this.downloads.set(filename, file);
      const result = await file.operation;
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
  }

  async queueUploads(files: DownloadableFile[], groupId: string) {
    let current = 0;
    const token = await this.tokenManager.getAccessToken();
    const total = files.length;
    const group = this.groups.uploads.get(groupId) || new Set();
    files.forEach((f) => group.add(f.filename));
    this.groups.uploads.set(groupId, group);

    for (const file of files as QueueItem[]) {
      if (!group.has(file.filename)) continue;

      const upload = this.uploads.get(file.filename);
      if (upload && upload.operation) {
        logger.debug("[queueUploads] duplicate upload", {
          filename: file.filename,
          groupId
        });
        await file.operation;
        continue;
      }

      const { filename, chunkSize } = file;
      let error = null;
      const url = `${hosts.API_HOST}/s3?name=${filename}`;
      const { execute, cancel } = this.fs.uploadFile(filename, {
        chunkSize,
        url,
        headers: { Authorization: `Bearer ${token}` }
      });
      file.cancel = cancel;
      file.operation = execute()
        .catch((e) => {
          logger.error(e, "failed to upload attachment", { hash: filename });
          error = e;
          return false;
        })
        .finally(() => {
          this.uploads.delete(filename);
          group.delete(filename);
        });

      EV.publish(EVENTS.fileUpload, {
        total,
        current,
        groupId,
        filename
      });

      this.uploads.set(filename, file);
      const result = await file.operation;
      EV.publish(EVENTS.fileUploaded, {
        error,
        success: result,
        total,
        current: ++current,
        groupId,
        filename
      });
    }
  }

  async downloadFile(groupId: string, filename: string, chunkSize: number) {
    if (await this.exists(filename)) return true;

    const download = this.downloads.get(filename);
    if (download && download.operation) {
      logger.debug("[downloadFile] duplicate download", { filename, groupId });
      return await download.operation;
    }

    logger.debug("[downloadFile] downloading", { filename, groupId });

    const url = `${hosts.API_HOST}/s3?name=${filename}`;
    const file: QueueItem = { filename, chunkSize };
    const token = await this.tokenManager.getAccessToken();
    const group = this.groups.downloads.get(groupId) || new Set();
    const { execute, cancel } = this.fs.downloadFile(filename, {
      url,
      chunkSize,
      headers: { Authorization: `Bearer ${token}` }
    });
    file.cancel = cancel;
    file.operation = execute().finally(() => {
      this.downloads.delete(filename);
      group.delete(filename);
    });

    this.downloads.set(filename, file);
    this.groups.downloads.set(groupId, group.add(filename));
    return await file.operation;
  }

  async cancel(groupId: string) {
    const queues = [
      {
        type: "download",
        ids: this.groups.downloads.get(groupId),
        files: this.downloads
      },
      {
        type: "upload",
        ids: this.groups.uploads.get(groupId),
        files: this.uploads
      }
    ].filter((a) => !!a.ids);

    for (const queue of queues) {
      if (!queue.ids) continue;

      for (const filename of queue.ids) {
        const file = queue.files.get(filename);
        if (file?.cancel) await file.cancel("Operation canceled.");
        queue.ids.delete(filename);
      }

      if (queue.type === "download") {
        this.groups.downloads.delete(groupId);
        EV.publish(EVENTS.downloadCanceled, { groupId, canceled: true });
      } else if (queue.type === "upload") {
        this.groups.uploads.delete(groupId);
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

  getUploadedFileSize(filename: string) {
    return this.fs.getUploadedFileSize(filename);
  }
}
