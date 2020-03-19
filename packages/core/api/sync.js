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
    let data = await this._merge({ serverResponse, lastSyncedTimestamp, user });
    await this._send(data);
    await this.db.user.set({ lastSynced: data.lastSynced });
  }

  async _merge({ serverResponse, lastSyncedTimestamp, user }) {
    const { notes, synced, notebooks } = serverResponse;

    if (!synced) {
      syncArrayWithDatabase(
        notes,
        id => this.db.notes.note(id).data,
        item => this.db.notes.add(item)
      );
      syncArrayWithDatabase(
        notebooks,
        id => this.db.notebooks.notebook(id).data,
        item => this.db.notebooks.add(item)
      );

      ["delta", "text"].forEach(type => {
        syncArrayWithDatabase(
          serverResponse[type],
          id => this.db[type].raw(id),
          item => this.db[type].add(item)
        );
      });
    }
    // TODO trash, colors, tags
    return {
      notes: prepareForServer(this.db.notes.all, user, lastSyncedTimestamp),
      notebooks: prepareForServer(
        this.db.notebooks.all,
        user,
        lastSyncedTimestamp
      ),
      delta: prepareForServer(
        await this.db.delta.all(),
        user,
        lastSyncedTimestamp
      ),
      text: prepareForServer(
        await this.db.text.all(),
        user,
        lastSyncedTimestamp
      ),
      tags: [],
      colors: [],
      trash: [],
      lastSynced: Date.now()
    };
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

async function syncWithDatabase(remoteItem, get, add) {
  let localItem = await get(remoteItem.id);
  if (!localItem || remoteItem.dateEdited > localItem.dateEdited) {
    await add({ ...JSON.parse(remoteItem.data), remote: true });
  }
}

async function syncArrayWithDatabase(array, get, set) {
  array.forEach(async item => await syncWithDatabase(item, get, set));
}

function prepareForServer(array, user, lastSyncedTimestamp) {
  return tfun
    .filter(item => item.dateEdited > lastSyncedTimestamp)(array)
    .map(item => ({
      id: item.id,
      dateEdited: item.dateEdited,
      dateCreated: item.dateCreated,
      data: JSON.stringify(item),
      userId: user.Id
    }));
}
