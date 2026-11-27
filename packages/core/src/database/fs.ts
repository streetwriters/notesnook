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

import hosts from "../utils/constants.js";
import TokenManager from "../api/token-manager.js";
import {
  FileEncryptionMetadataWithOutputType,
  IFileStorage
} from "../interfaces.js";
import { DataFormat, SerializedKey } from "@notesnook/crypto";
import { EVENTS } from "../common.js";
import { logger } from "../logger.js";
import EventManager from "../utils/event-manager.js";

export type FileStorageAccessor = () => FileStorage;
export type DownloadableFile = {
  filename: string;
  chunkSize: number;
};
type TransferKind = "upload" | "download";
type TransferStatus = "success" | "failed" | "canceled";
type TransferResult = { status: TransferStatus; error?: unknown };
type Transfer = DownloadableFile & {
  groups: Set<string>;
  canceled: boolean;
  cancel?: (reason?: string) => Promise<void>;
  done?: Promise<TransferResult>;
};

const CANCELED_EVENT = {
  download: EVENTS.downloadCanceled,
  upload: EVENTS.uploadCanceled
};

export class FileStorage {
  id = Date.now();
  private transfers = {
    upload: new Map<string, Transfer>(),
    download: new Map<string, Transfer>()
  };
  private queues = {
    upload: new Map<string, object>(),
    download: new Map<string, object>()
  };

  constructor(
    private readonly fs: IFileStorage,
    private readonly tokenManager: TokenManager,
    private readonly eventManager: EventManager
  ) {}

  async queueDownloads(
    files: DownloadableFile[],
    groupId: string,
    eventData?: Record<string, unknown>
  ) {
    await this.withQueue("download", groupId, files, async (transfers) => {
      const missing = new Set(
        await this.fs.bulkExists(transfers.map((t) => t.filename))
      );
      transfers = transfers.filter((t) => {
        if (missing.has(t.filename)) return true;
        this.release("download", groupId, t);
        return false;
      });
      if (transfers.length <= 0) return;

      const token = await this.tokenManager.getAccessToken();
      const total = transfers.length;
      let current = 0;

      for (const transfer of transfers) {
        const { filename } = transfer;
        current++;
        const event = { groupId, filename, eventData, current, total };
        const exists = await this.exists(filename);

        if (this.isCanceledFor(groupId, transfer)) {
          this.eventManager.publish(EVENTS.fileDownloaded, {
            ...event,
            success: false,
            canceled: true
          });
          continue;
        }

        if (exists) {
          this.release("download", groupId, transfer);
          this.eventManager.publish(EVENTS.fileDownloaded, {
            ...event,
            success: true
          });
          continue;
        }

        this.eventManager.publish(EVENTS.fileDownload, {
          total,
          current,
          groupId,
          filename
        });

        const { status } = await this.start("download", transfer, token);
        if (eventData)
          this.eventManager.publish(EVENTS.fileDownloaded, {
            ...event,
            success: status === "success",
            canceled: status === "canceled"
          });
      }
    });
  }

  async queueUploads(files: DownloadableFile[], groupId: string) {
    await this.withQueue("upload", groupId, files, async (transfers) => {
      const token = await this.tokenManager.getAccessToken();
      const total = transfers.length;
      let current = 0;

      for (const transfer of transfers) {
        const { filename } = transfer;
        const canceled = this.isCanceledFor(groupId, transfer);
        if (!canceled)
          this.eventManager.publish(EVENTS.fileUpload, {
            total,
            current,
            groupId,
            filename
          });

        const { status, error }: TransferResult = canceled
          ? { status: "canceled" }
          : await this.start("upload", transfer, token);
        this.eventManager.publish(EVENTS.fileUploaded, {
          error: error ?? null,
          success: status === "success",
          canceled: status === "canceled",
          total,
          current: ++current,
          groupId,
          filename
        });
      }
    });
  }

  async downloadFile(groupId: string, filename: string, chunkSize: number) {
    const transfer = this.acquire("download", groupId, { filename, chunkSize });
    try {
      if (await this.exists(filename)) return true;

      logger.debug("[downloadFile] downloading", { filename, groupId });

      const token = await this.tokenManager.getAccessToken();
      if (this.isCanceledFor(groupId, transfer)) return false;

      const { status, error } = await this.start("download", transfer, token);
      if (status === "failed" && error) throw error;
      return status === "success";
    } finally {
      this.release("download", groupId, transfer);
    }
  }

  async cancel(groupId: string) {
    for (const kind of ["download", "upload"] as const) {
      let found = this.queues[kind].delete(groupId);
      for (const transfer of this.transfers[kind].values()) {
        if (!transfer.groups.delete(groupId)) continue;
        found = true;
        if (transfer.groups.size === 0) await this.abort(kind, transfer);
      }
      if (!found) continue;

      this.eventManager.publish(CANCELED_EVENT[kind], {
        groupId,
        canceled: true
      });
    }
  }

  async cancelTransfers(filename: string) {
    for (const kind of ["upload", "download"] as const) {
      const transfer = this.transfers[kind].get(filename);
      if (!transfer) continue;
      await this.abort(kind, transfer);
      await transfer.done;
    }
  }

  private async withQueue(
    kind: TransferKind,
    groupId: string,
    files: DownloadableFile[],
    body: (transfers: Transfer[]) => Promise<void>
  ) {
    if (this.queues[kind].has(groupId)) {
      logger.debug(`[${kind} queue] group already exists`, { groupId });
      return;
    }

    const queue = {};
    this.queues[kind].set(groupId, queue);
    const transfers = unique(files).map((f) => this.acquire(kind, groupId, f));
    try {
      await body(transfers);
    } finally {
      for (const transfer of transfers) this.release(kind, groupId, transfer);
      if (this.queues[kind].get(groupId) === queue)
        this.queues[kind].delete(groupId);
    }
  }

  private acquire(kind: TransferKind, groupId: string, file: DownloadableFile) {
    let transfer = this.transfers[kind].get(file.filename);
    if (!transfer) {
      transfer = { ...file, groups: new Set(), canceled: false };
      this.transfers[kind].set(file.filename, transfer);
    }
    transfer.groups.add(groupId);
    return transfer;
  }

  private release(kind: TransferKind, groupId: string, transfer: Transfer) {
    transfer.groups.delete(groupId);
    if (!transfer.done && transfer.groups.size === 0)
      this.deleteTransfer(kind, transfer);
  }

  private deleteTransfer(kind: TransferKind, transfer: Transfer) {
    if (this.transfers[kind].get(transfer.filename) === transfer)
      this.transfers[kind].delete(transfer.filename);
  }

  private isCanceledFor(groupId: string, transfer: Transfer) {
    return transfer.canceled || !transfer.groups.has(groupId);
  }

  private async abort(kind: TransferKind, transfer: Transfer) {
    transfer.canceled = true;
    if (!transfer.done) this.deleteTransfer(kind, transfer);
    await transfer.cancel?.("Operation canceled.");
  }

  private start(
    kind: TransferKind,
    transfer: Transfer,
    token?: string
  ): Promise<TransferResult> {
    if (transfer.canceled) return Promise.resolve({ status: "canceled" });
    if (transfer.done) {
      logger.debug(`[${kind}] duplicate transfer`, {
        filename: transfer.filename
      });
      return transfer.done;
    }
    return (transfer.done = this.transferFile(kind, transfer, token));
  }

  private async transferFile(
    kind: TransferKind,
    transfer: Transfer,
    token?: string
  ): Promise<TransferResult> {
    const { filename, chunkSize } = transfer;
    try {
      if (kind === "download" && (await this.exists(filename)))
        return { status: "success" };
      if (transfer.canceled) return { status: "canceled" };

      const options = {
        url: `${hosts.API_HOST}/s3?name=${filename}`,
        chunkSize,
        headers: { Authorization: `Bearer ${token}` }
      };
      const { execute, cancel } =
        kind === "upload"
          ? this.fs.uploadFile(filename, options)
          : this.fs.downloadFile(filename, options);
      transfer.cancel = cancel;

      const result = await execute();
      if (transfer.canceled) return { status: "canceled" };
      return { status: result ? "success" : "failed" };
    } catch (error) {
      if (transfer.canceled) return { status: "canceled" };
      if (kind === "upload")
        logger.error(error, "failed to upload attachment", { hash: filename });
      return { status: "failed", error };
    } finally {
      this.deleteTransfer(kind, transfer);
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

  async bulkDeleteFiles(filenames: string[], localOnly = false) {
    if (filenames.length === 0) return true;

    if (localOnly) return await this.fs.bulkDeleteFiles(filenames);

    const token = await this.tokenManager.getAccessToken();
    const url = `${hosts.API_HOST}/s3/bulk-delete`;
    return await this.fs.bulkDeleteFiles(filenames, {
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

function unique(files: DownloadableFile[]) {
  const seen = new Set<string>();
  const result: DownloadableFile[] = [];
  for (const file of files) {
    if (seen.has(file.filename)) continue;
    seen.add(file.filename);
    result.push(file);
  }
  return result;
}
