import hosts from "../utils/constants";
import TokenManager from "../api/token-manager";

export default class FileStorage {
  constructor(fs, storage) {
    this.fs = fs;
    this.tokenManager = new TokenManager(storage);
  }

  async downloadFile(hash) {
    const url = `${hosts.API_HOST}/s3?name=${hash}`;
    const token = await this.tokenManager.getAccessToken();
    return await this.fs.downloadFile(hash, {
      url,
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async uploadFile(hash) {
    const token = await this.tokenManager.getAccessToken();
    const url = await this._getPresignedURL(hash, token, "PUT");
    return await this.fs.uploadFile(hash, { url });
  }

  readEncrypted(filename, encryptionKey, cipherData) {
    return this.fs.readEncrypted(filename, encryptionKey, cipherData);
  }

  writeEncrypted(filename, data, type, encryptionKey) {
    return this._db.fs.writeEncrypted(filename, {
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
