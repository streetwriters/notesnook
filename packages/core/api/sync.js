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
import Database from "./index";
import { HOST, HEADERS } from "../utils/constants";
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

  async throwOnConflicts() {
    let hasConflicts = await this.db.context.read("hasConflicts");
    if (hasConflicts) {
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
    await this.throwOnConflicts();
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

class Merger {
  /**
   *
   * @param {Database} db
   */
  constructor(db, lastSynced) {
    this._db = db;
    this._lastSynced = lastSynced;
  }

  async _mergeItem(remoteItem, get, add) {
    let localItem = await get(remoteItem.id);
    remoteItem = { ...JSON.parse(remoteItem.data), remote: true };
    if (!localItem || remoteItem.dateEdited > localItem.dateEdited) {
      await add(remoteItem);
    }
  }

  async _mergeArray(array, get, set) {
    return Promise.all(
      array.map(async (item) => await this._mergeItem(item, get, set))
    );
  }

  async _mergeItemWithConflicts(remoteItem, get, add, resolve) {
    let localItem = await get(remoteItem.id);
    if (!localItem) {
      await add({ ...JSON.parse(remoteItem.data), remote: true });
    } else if (localItem.resolved) {
      await add({...localItem, resolved: false});
    } else if (localItem.dateEdited > this._lastSynced) {
      // we have a conflict
      await resolve(localItem, JSON.parse(remoteItem.data));
    }
  }

  async _mergeArrayWithConflicts(array, get, set, resolve) {
    return Promise.all(
      array.map(
        async (item) =>
          await this._mergeItemWithConflicts(item, get, set, resolve)
      )
    );
  }

  async merge(serverResponse) {
    const {
      notes,
      synced,
      notebooks,
      delta,
      text,
      tags,
      colors,
      trash,
    } = serverResponse;

    if (synced || areAllEmpty(serverResponse)) return false;

    await this._mergeArray(
      notes,
      (id) => this._db.notes.note(id),
      (item) => this._db.notes.add(item)
    );
    await this._mergeArray(
      notebooks,
      (id) => this._db.notebooks.notebook(id),
      (item) => this._db.notebooks.add(item)
    );

    await this._mergeArrayWithConflicts(
      delta,
      (id) => this._db.delta.raw(id),
      (item) => this._db.delta.add(item),
      async (local, remote) => {
        await this._db.delta.add({ ...local, conflicted: remote });
        await this._db.notes.add({ id: local.noteId, conflicted: true });
        await this._db.context.write("hasConflicts", true);
      }
    );

    await this._mergeArray(
      text,
      (id) => this._db.text.raw(id),
      (item) => this._db.text.add(item)
    );

    await this._mergeArray(
      tags,
      (id) => this._db.tags.tag(id),
      (item) => this._db.tags.merge(item)
    );

    await this._mergeArray(
      colors,
      (id) => this._db.colors.tag(id),
      (item) => this._db.colors.merge(item)
    );

    await this._mergeArray(
      trash,
      () => undefined,
      (item) => this._db.trash.add(item)
    );

    return true;
  }
}

class Prepare {
  /**
   *
   * @param {Database} db
   * @param {Object} user
   * @param {Number} lastSyncedTimestamp
   */
  constructor(db, user) {
    this._db = db;
    this._user = user;
  }

  async get(lastSyncedTimestamp) {
    this._lastSyncedTimestamp = lastSyncedTimestamp;
    return {
      notes: this._prepareForServer(this._db.notes.raw),
      notebooks: this._prepareForServer(this._db.notebooks.raw),
      delta: this._prepareForServer(await this._db.delta.all()),
      text: this._prepareForServer(await this._db.text.all()),
      tags: this._prepareForServer(this._db.tags.raw),
      colors: this._prepareForServer(this._db.colors.raw),
      trash: this._prepareForServer(this._db.trash.raw),
      lastSynced: Date.now(),
    };
  }

  _prepareForServer(array) {
    return tfun
      .filter((item) => item.dateEdited > this._lastSyncedTimestamp)
      .map((item) => ({
        id: item.id,
        data: JSON.stringify(item),
      }))(array);
  }
}

function areAllEmpty(obj) {
  const arrays = Object.values(obj).filter((v) => v.length !== undefined);
  return arrays.every((array) => array.length === 0);
}
