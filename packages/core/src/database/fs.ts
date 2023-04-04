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
import { IFileStorage, IStorage } from "../interfaces";
import { Cipher, SerializedKey } from "@notesnook/crypto/dist/src/types";

type QueueEntry = {
  groupId: string;
  filename: string;
  cancel: (reason?: string) => Promise<void>;
  type: "download" | "upload";
};

export default class FileStorage {
  private readonly tokenManager: TokenManager;
  private readonly queue: QueueEntry[];
  constructor(private readonly fs: IFileStorage, storage: IStorage) {
    this.tokenManager = new TokenManager(storage);
    this.queue = [];
  }

  async downloadFile(groupId: string, filename: string, chunkSize: number) {
    const url = `${hosts.API_HOST}/s3?name=${filename}`;
    const token = await this.tokenManager.getAccessToken();
    const { execute, cancel } = this.fs.downloadFile(filename, {
      url,
      chunkSize,
      headers: { Authorization: `Bearer ${token}` }
    });
    this.queue.push({ groupId, filename, cancel, type: "download" });
    const result = await execute();
    this.deleteOp(groupId, "download");
    return result;
  }

  async uploadFile(groupId: string, filename: string) {
    const token = await this.tokenManager.getAccessToken();
    const url = `${hosts.API_HOST}/s3?name=${filename}`;
    const { execute, cancel } = this.fs.uploadFile(filename, {
      url,
      headers: { Authorization: `Bearer ${token}` }
    });
    this.queue.push({ groupId, filename, cancel, type: "upload" });
    const result = await execute();
    this.deleteOp(groupId, "upload");
    return result;
  }

  async cancel(groupId: string, type = undefined) {
    const [op] = this.deleteOp(groupId, type);
    if (!op) return;
    await op.cancel("Operation canceled.");
  }

  private deleteOp(groupId: string, type?: QueueEntry["type"]) {
    const opIndex = this.queue.findIndex(
      (item) => item.groupId === groupId && (!type || item.type === type)
    );
    if (opIndex < 0) return [];
    return this.queue.splice(opIndex, 1);
  }

  readEncrypted(
    filename: string,
    encryptionKey: SerializedKey,
    cipherData: Cipher
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
      headers: { Authorization: `Bearer ${token}` }
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
