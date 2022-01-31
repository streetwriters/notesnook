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
import {
  checkIsUserPremium,
  CHECK_IDS,
  EV,
  EVENTS,
  sendAttachmentsProgressEvent,
} from "../../common";
import Constants from "../../utils/constants";
import http from "../../utils/http";
import TokenManager from "../token-manager";
import Collector from "./collector";
import Merger from "./merger";
import { areAllEmpty } from "./utils";
import { Mutex, withTimeout } from "async-mutex";

export default class Sync {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this._db = db;
    this._collector = new Collector(this._db);
    this._merger = new Merger(this._db);
    this._tokenManager = new TokenManager(this._db.storage);
    this._autoSyncTimeout = 0;
    this._autoSyncInterval = 5000;

    this.syncMutex = withTimeout(
      new Mutex(),
      20 * 1000,
      new Error("Sync timed out.")
    );
  }

  async start(full, force) {
    if (this.syncMutex.isLocked()) return false;

    return this.syncMutex
      .runExclusive(() => {
        this.stopAutoSync();
        return this._sync(full, force);
      })
      .finally(() => this._afterSync());
  }

  async remoteSync() {
    if (this.syncMutex.isLocked()) {
      this.hasNewChanges = true;
      return;
    }
    await this.syncMutex
      .runExclusive(async () => {
        this.stopAutoSync();
        this.hasNewChanges = false;
        if (await this._sync(true, false))
          EV.publish(EVENTS.appRefreshRequested);
      })
      .finally(() => this._afterSync());
  }

  async startAutoSync() {
    if (!(await checkIsUserPremium(CHECK_IDS.databaseSync))) return;
    this.databaseUpdatedEvent = EV.subscribe(
      EVENTS.databaseUpdated,
      this._scheduleSync.bind(this)
    );
  }

  stopAutoSync() {
    clearTimeout(this._autoSyncTimeout);
    if (this.databaseUpdatedEvent) this.databaseUpdatedEvent.unsubscribe();
  }

  async acquireLock(callback) {
    this.stopAutoSync();
    await this.syncMutex.runExclusive(callback);
    await this.startAutoSync();
  }

  async _sync(full, force) {
    let { lastSynced } = await this._performChecks();
    if (force) lastSynced = 0;

    if (full) {
      // We request and merge remote attachments beforehand to handle
      // all possible conflicts that will occur if a user attaches
      // the same file/image on both his devices. Since both files
      // will have the same hash but different encryption key, it
      // will cause problems on the local device.
      await this._mergeAttachments(lastSynced);

      // All pending attachments are uploaded before anything else.
      // This is done to ensure that when any note arrives on user's
      // device, its attachments can be downloaded.
      await this._uploadAttachments();
    }

    // We collect, encrypt, and ready local changes before asking
    // the server for remote changes. This is done to ensure we
    // don't accidentally send the remote changes back to the server.
    const data = await this._collector.collect(lastSynced);

    // We update the local last synced time before fetching data
    // from the server. This is necessary to ensure that if the user
    // makes any local changes, it is not ignored in the next sync.
    // This is also the last synced time that is set for later sync cycles.
    data.lastSynced = Date.now();
    if (full) {
      // We request remote changes and merge them. If any new changes
      // come before or during this step (e.g. SSE), it can be safely
      // ignored because the `lastSynced` time can never be newer
      // than the change time.
      var serverResponse = await this._fetch(lastSynced);
      await this._merger.merge(serverResponse, lastSynced);
      await this._db.conflicts.check();
      // ignore the changes that have arrived uptil this point.
      // this.hasNewChanges = false;
    }

    if (!areAllEmpty(data)) {
      lastSynced = await this._send(data);
    } else if (serverResponse) lastSynced = serverResponse.lastSynced;

    await this._db.storage.write("lastSynced", lastSynced);
    return true;
  }

  async _afterSync() {
    if (!this.hasNewChanges) {
      this.startAutoSync();
    } else {
      return this.remoteSync();
    }
  }

  _scheduleSync() {
    this.stopAutoSync();
    this._autoSyncTimeout = setTimeout(() => {
      EV.publish(EVENTS.databaseSyncRequested);
    }, this._autoSyncInterval);
  }

  async _send(data) {
    let token = await this._tokenManager.getAccessToken();
    let response = await http.post.json(
      `${Constants.API_HOST}/sync`,
      data,
      token
    );
    return response.lastSynced;
  }

  async _mergeAttachments(lastSynced) {
    let token = await this._tokenManager.getAccessToken();
    var serverResponse = await this._fetchAttachments(lastSynced, token);
    await this._merger.merge(serverResponse, lastSynced);
  }

  async _uploadAttachments() {
    const attachments = this._db.attachments.pending;
    for (var i = 0; i < attachments.length; ++i) {
      const attachment = attachments[i];
      const { hash, filename } = attachment.metadata;
      sendAttachmentsProgressEvent("upload", hash, attachments.length, i);

      try {
        const isUploaded = await this._db.fs.uploadFile(hash, hash);
        if (!isUploaded) throw new Error("Failed to upload file.");

        await this._db.attachments.markAsUploaded(attachment.id);
      } catch (e) {
        throw new Error(
          `Failed to upload the following attachment: "${filename}". Please try attaching this file again. (Reference error: ${e.message})`
        );
      }
    }
    sendAttachmentsProgressEvent("upload", null, attachments.length);
  }

  async _performChecks() {
    let lastSynced = (await this._db.lastSynced()) || 0;

    // update the conflicts status and if find any, throw
    await this._db.conflicts.recalculate();
    await this._db.conflicts.check();

    return { lastSynced };
  }

  async _fetch(lastSynced) {
    let token = await this._tokenManager.getAccessToken();
    return await http.get(
      `${Constants.API_HOST}/sync?lst=${lastSynced}`,
      token
    );
  }

  async _fetchAttachments(lastSynced) {
    let token = await this._tokenManager.getAccessToken();
    return await http.get(
      `${Constants.API_HOST}/sync/attachments?lst=${lastSynced}`,
      token
    );
  }
}
