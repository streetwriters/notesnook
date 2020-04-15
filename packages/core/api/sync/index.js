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
import { HOST, HEADERS } from "../../utils/constants";
import Collector from "./collector";
import Merger from "./merger";
import { areAllEmpty } from "./utils";
var tfun = require("transfun/transfun.js").tfun;
if (!tfun) {
  tfun = global.tfun;
}

export default class Sync {
  /**
   *
   * @param {import("../index").default} db
   */
  constructor(db) {
    this._db = db;
    this._collector = new Collector(this._db);
    this._merger = new Merger(this._db);
  }

  async _fetch(lastSynced, token) {
    let response = await fetch(`${HOST}sync?lst=${lastSynced}`, {
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    });
    return await response.json();
  }

  async start() {
    let user = await this._db.user.get();
    let token = await this._db.user.token();
    if (!user || !token) throw new Error("You need to login to sync.");

    // update the conflicts status and if find any, throw
    await this._db.conflicts.recalculate();
    await this._db.conflicts.check();

    let lastSynced = user.lastSynced || 0;
    let serverResponse = await this._fetch(lastSynced, token);

    // we prepare local data before merging so we always have correct data
    const data = await this._collector.collect(lastSynced);

    // merge the server response
    await this._merger.merge(serverResponse, lastSynced);

    // check for conflicts and throw
    await this._db.conflicts.check();

    // send the data back to server
    lastSynced = await this._send(data, token);

    // update our lastSynced time
    if (lastSynced) await this._db.user.set({ lastSynced });
  }

  async _send(data, token) {
    let response = await fetch(`${HOST}sync`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      const json = await response.json();
      return json.lastSynced;
    }
    throw new Error("Failed to sync with the server.");
  }
}
