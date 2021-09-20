/**
 * GENERAL PROCESS:
 * make a get request to server with current lastSynced
 * parse the response. the response should contain everything that user has on the server
 * decrypt the response
 * merge everything into the database and look for conflicts
 * send the conflicts (if any) to the end-user for resolution
 * once the conflicts have been resolved, send the updated data back to the server
 */

/**
 * MERGING:
 * Locally, get everything that was editted/added after the lastSynced
 * Run forEach loop on the server response.
 * Add items that do not exist in the local collections
 * Remove items (without asking) that need to be removed
 * Update items that were editted before the lastSynced
 * Try to merge items that were edited after the lastSynced
 * Items in which the content has changed, send them for conflict resolution
 * Otherwise, keep the most recently updated copy.
 */

/**
 * CONFLICTS:
 * Syncing should pause until all the conflicts have been resolved
 * And then it should continue.
 */
import { EV, EVENTS } from "../../common";
import Constants from "../../utils/constants";
import http from "../../utils/http";
import TokenManager from "../token-manager";
import Collector from "./collector";
import Merger from "./merger";
import { areAllEmpty } from "./utils";
export default class Sync {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this._db = db;
    this._collector = new Collector(this._db);
    this._merger = new Merger(this._db);
    this._tokenManager = new TokenManager(this._db);
    this._isSyncing = false;
  }

  async _fetch(lastSynced, token) {
    return await http.get(
      `${Constants.API_HOST}/sync?lst=${lastSynced}`,
      token
    );
  }

  async _performChecks() {
    let lastSynced = (await this._db.context.read("lastSynced")) || 0;
    let token = await this._tokenManager.getAccessToken();

    // update the conflicts status and if find any, throw
    await this._db.conflicts.recalculate();
    await this._db.conflicts.check();

    return { lastSynced, token };
  }

  async start(full, force) {
    if (this._isSyncing) return false;

    if (force) await this._db.context.write("lastSynced", 0);
    let { lastSynced, token } = await this._performChecks();

    try {
      const now = Date.now();
      this._isSyncing = true;

      await this._uploadAttachments(token);

      // we prepare local data before merging so we always have correct data
      const data = await this._collector.collect(lastSynced);
      data.lastSynced = now;

      if (full) {
        var serverResponse = await this._fetch(lastSynced, token);
        // merge the server response
        await this._merger.merge(serverResponse, lastSynced);

        await this._downloadAttachments(token);
      }

      // check for conflicts and throw
      await this._db.conflicts.check();

      // send the data back to server
      lastSynced = await this._send(data, token);

      // update our lastSynced time
      if (lastSynced) {
        await this._db.context.write("lastSynced", lastSynced);
      }

      return true;
    } catch (e) {
      this._isSyncing = false;
      throw e;
    } finally {
      this._isSyncing = false;
    }
  }

  async eventMerge(serverResponse) {
    let { lastSynced, token } = await this._performChecks();

    const data = await this._collector.collect(lastSynced);

    // merge the server response
    await this._merger.merge(serverResponse, lastSynced);

    // check for conflicts and throw
    await this._db.conflicts.check();

    // send the data back to server
    lastSynced = await this._send(data, token);

    // update our lastSynced time
    if (lastSynced) {
      await this._db.context.write("lastSynced", lastSynced);
    }

    EV.publish(EVENTS.appRefreshRequested);

    // check for conflicts and throw
    // await this._db.conflicts.check();

    // TODO test this.
    // we won't be updating lastSynced time here because
    // it can cause the lastSynced time to move ahead of any
    // last edited (but unsynced) time resulting in edited notes
    // not getting synced.
    // if (serverResponse.lastSynced) {
    //   await this._db.context.write("lastSynced", serverResponse.lastSynced);
    // }
  }

  async _send(data, token) {
    let response = await http.post.json(
      `${Constants.API_HOST}/sync`,
      data,
      token
    );

    return response.lastSynced;
  }

  async _uploadAttachments(token) {
    const attachments = this._db.attachments.pending;
    console.log("Uploading attachments", attachments);
    for (let attachment of attachments) {
      const { hash } = attachment.metadata;
      const url = await this._getPresignedURL(hash, token, "PUT");
      const uploadResult = await this._db.fs.uploadFile(hash, { url });
      if (!uploadResult) throw new Error("Failed to upload file.");
      await this._db.attachments.markAsUploaded(attachment.id);
    }
  }

  async _downloadAttachments(token) {
    const attachments = this._db.attachments.media;
    console.log("Downloading attachments", attachments);
    for (let attachment of attachments) {
      const { hash } = attachment.metadata;
      const url = `${Constants.API_HOST}/s3?name=${hash}`;
      const downloadResult = await this._db.fs.downloadFile(hash, {
        url,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!downloadResult) throw new Error("Failed to download file.");
    }
  }

  async _getPresignedURL(filename, token, verb) {
    const response = await fetch(`${Constants.API_HOST}/s3?name=${filename}`, {
      method: verb,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.ok) return await response.text();
    throw new Error("Couldn't get presigned url.");
  }
}
