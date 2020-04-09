/**
 * GENERAL PROCESS:
 * make a get request to server with current lastSyncedTimestamp
 * parse the response. the response should contain everything that user has on the server
 * decrypt the response
 * merge everything into the database and look for conflicts
 * send the conflicts (if any) to the end-user for resolution
 * once the conflicts have been resolved, send the updated data back to the server
 */

/**
 * MERGING:
 * Locally, get everything that was editted/added after the lastSyncedTimestamp
 * Run forEach loop on the server response.
 * Add items that do not exist in the local collections
 * Remove items (without asking) that need to be removed
 * Update items that were editted before the lastSyncedTimestamp
 * Try to merge items that were edited after the lastSyncedTimestamp
 * Items in which the content has changed, send them for conflict resolution
 * Otherwise, keep the most recently updated copy.
 */

/**
 * CONFLICTS:
 * Syncing should pause until all the conflicts have been resolved
 * And then it should continue.
 */
import Database from "../index";
import { HOST, HEADERS } from "../../utils/constants";
import Prepare from "./prepare";
import Merger from "./merger";
import { areAllEmpty } from "./utils";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

export default class Sync {
  /**
   *
   * @param {Database} db
   */
  constructor(db) {
    this.db = db;
  }

  async _fetch(lastSyncedTimestamp) {
    let token = await this.db.user.token();
    if (!token) throw new Error("You are not logged in");
    let response = await fetch(`${HOST}sync?lst=${lastSyncedTimestamp}`, {
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    });
    //TODO decrypt the response.
    return await response.json();
  }

  async throwOnConflicts(lastSynced) {
    let hasConflicts = await this.db.context.read("hasConflicts");
    if (hasConflicts) {
      if (lastSynced) {
        await this.db.user.set({ lastSynced });
      }
      const mergeConflictError = new Error(
        "Merge conflicts detected. Please resolve all conflicts to continue syncing."
      );
      mergeConflictError.code = "MERGE_CONFLICT";
      throw mergeConflictError;
    }
  }

  async start() {
    let user = await this.db.user.get();
    if (!user) throw new Error("You need to login to sync.");

    await this.db.conflicts.recalculate();
    await this.throwOnConflicts();

    let lastSyncedTimestamp = user.lastSynced || 0;
    let serverResponse = await this._fetch(lastSyncedTimestamp);

    // we prepare local data before merging so we always have correct data
    const prepare = new Prepare(this.db, user);
    const data = await prepare.get(lastSyncedTimestamp);

    // merge the server response
    const merger = new Merger(this.db, lastSyncedTimestamp);
    const mergeResult = await merger.merge(serverResponse);
    await this.throwOnConflicts(data.lastSynced);

    // send the data back to server
    await this._send(data);

    // update our lastSynced time
    if (mergeResult || !areAllEmpty(data))
      await this.db.user.set({ lastSynced: data.lastSynced });
  }

  async _send(data) {
    //TODO encrypt the payload
    let token = await this.db.user.token();
    if (!token) return;
    let response = await fetch(`${HOST}sync`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    return response.ok;
  }
}
