import hosts from "../utils/constants";
import TokenManager from "../api/token-manager";

export default class FileStorage {
  constructor(fs, storage) {
    this.fs = fs;
    this.tokenManager = new TokenManager(storage);
    this._queue = [];
  }

  async downloadFile(groupId, hash) {
    const url = `${hosts.API_HOST}/s3?name=${hash}`;
    const token = await this.tokenManager.getAccessToken();
    const { execute, cancel } = this.fs.downloadFile(hash, {
      url,
      headers: { Authorization: `Bearer ${token}` },
    });
    this._queue.push({ groupId, hash, cancel, type: "download" });
    return await execute();
  }

  async uploadFile(groupId, hash) {
    const token = await this.tokenManager.getAccessToken();
    const url = await this._getPresignedURL(hash, token, "PUT");
    const { execute, cancel } = this.fs.uploadFile(hash, { url });
    this._queue.push({ groupId, hash, cancel, type: "upload" });
    return await execute();
  }

  async cancel(groupId, type = undefined) {
    console.trace("Cancelling", groupId, type);
    await Promise.all(
      this._queue
        .filter(
          (item) => item.groupId === groupId && (!type || item.type === type)
        )
        .map(async (op) => await op.cancel("Operation canceled."))
    );
  }

  readEncrypted(filename, encryptionKey, cipherData) {
    return this.fs.readEncrypted(filename, encryptionKey, cipherData);
  }

  writeEncrypted(filename, data, type, encryptionKey) {
    return this.fs.writeEncrypted(filename, {
      data,
      type,
      key: encryptionKey,
    });
  }

  async deleteFile(filename) {
    const token = await this.tokenManager.getToken();
    const url = `${hosts.API_HOST}/s3?name=${hash}`;
    return await this.fs.deleteFile(filename, {
      url,
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   *
   * @param {string} filename
   * @returns {Promise<boolean>}
   */
  exists(filename) {
    return this.fs.exists(filename);
  }

  async _getPresignedURL(filename, token, verb) {
    const response = await fetch(`${hosts.API_HOST}/s3?name=${filename}`, {
      method: verb,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) return await response.text();
    throw new Error("Couldn't get presigned url.");
  }
}
