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
      headers: { ...HEADERS, Authorization: `Bearer ${token}` }
    });
    //TODO decrypt the response.
    return await response.json();
  }

  async start() {
    let user = await this.db.user.get();
    if (!user) throw new Error("You need to login to sync.");
    let lastSyncedTimestamp = user.lastSynced || 0;
    let serverResponse = await this._fetch(lastSyncedTimestamp);

    // we prepare local data before merging so we always have correct data
    const prepare = new Prepare(this.db, user);
    const data = await prepare.get(lastSyncedTimestamp);

    // merge the server response
    const merger = new Merger(this.db);
    const mergeResult = await merger.merge(serverResponse);

    // send the data back to server
    await this._send(data);

    // update our lastSynced time
    if (!serverResponse.synced && !mergeResult && areAllEmpty(data))
      await this.db.user.set({ lastSynced: data.lastSynced });
  }

  async _send(data) {
    //TODO encrypt the payload
    let token = await this.db.user.token();
    if (!token) return;
    let response = await fetch(`${HOST}sync`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    return response.ok;
  }
}

class Merger {
  /**
   *
   * @param {Database} db
   */
  constructor(db) {
    this._db = db;
  }

  async _mergeItem(remoteItem, get, add) {
    let localItem = await get(remoteItem.id);
    if (
      !localItem ||
      remoteItem.deleted ||
      remoteItem.dateEdited > localItem.dateEdited
    ) {
      await add({ ...JSON.parse(remoteItem.data), remote: true });
    }
  }

  async _mergeArray(array, get, set) {
    return Promise.all(
      array.map(async item => await this._mergeItem(item, get, set))
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
      trash
    } = serverResponse;
    if (synced || areAllEmpty(serverResponse)) return false;
    await this._mergeArray(
      notes,
      id => this._db.notes.note(id),
      item => this._db.notes.add(item)
    );
    await this._mergeArray(
      notebooks,
      id => this._db.notebooks.notebook(id),
      item => this._db.notebooks.add(item)
    );

    await this._mergeArray(
      delta,
      id => this._db.delta.raw(id),
      item => this._db.delta.add(item)
    );
    await this._mergeArray(
      text,
      id => this._db.text.raw(id),
      item => this._db.text.add(item)
    );

    await this._mergeArray(
      tags,
      id => this._db.tags.tag(id),
      item => this._db.tags.merge(item)
    );

    await this._mergeArray(
      colors,
      id => this._db.colors.tag(id),
      item => this._db.colors.merge(item)
    );

    await this._mergeArray(
      trash,
      () => undefined,
      item => this._db.trash.add(item)
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
      lastSynced: Date.now()
    };
  }

  _prepareForServer(array) {
    return tfun
      .filter(
        item =>
          item.deleted === true || item.dateEdited > this._lastSyncedTimestamp
      )
      .map(item => ({
        id: item.id,
        dateEdited: item.dateEdited,
        dateCreated: item.dateCreated,
        data: JSON.stringify(item),
        userId: this._user.Id
      }))(array);
  }
}

function areAllEmpty(obj) {
  const arrays = Object.values(obj).filter(v => v.length !== undefined);
  return arrays.every(array => array.length === 0);
}
