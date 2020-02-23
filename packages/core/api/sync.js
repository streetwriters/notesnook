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
    if (!token) return;
    let response = await fetch(`${HOST}sync?lst=${lastSyncedTimestamp}`, {
      headers: { ...HEADERS, Authorization: `Bearer ${token}` }
    });
    //TODO decrypt the response.
    return await response.json();
  }

  async start() {
    let user = await this.db.user.get();
    if (!user) return false;
    let lastSyncedTimestamp = user.lastSyncedTimestamp || 0;
    let serverResponse = await this._fetch(lastSyncedTimestamp);
    let data = this._merge({ serverResponse, lastSyncedTimestamp, user });
    await this.db.user.set({ lastSynced: data.lastSynced });
    await this._send(data);
    return true;
  }

  _merge({ serverResponse, lastSyncedTimestamp, user }) {
    const { notes, notebooks /* tags, colors, trash */ } = serverResponse;

    notes.forEach(async note => {
      note = JSON.parse(note.data);
      let localNote = this.db.notes.note(note.id);
      if (!localNote || note.dateEdited > localNote.data.dateEdited) {
        await this.db.notes.add({ ...note, remote: true });
      }
    });
    notebooks.forEach(async nb => {
      nb = JSON.parse(nb.data);
      let localNb = this.db.notebooks.notebook(nb.id);
      if (!localNb || nb.dateEdited > localNb.data.dateEdited) {
        await this.db.notebooks.add({ ...nb, remote: true });
      }
    });
    // TODO trash, colors, tags
    return {
      notes: this.db.notes.all
        .filter(v => v.dateEdited > lastSyncedTimestamp)
        .map(v => ({
          dateEdited: v.dateEdited,
          dateCreated: v.dateCreated,
          data: JSON.stringify(v),
          userId: user.Id
        })),
      notebooks: this.db.notebooks.all
        .filter(v => v.dateEdited > lastSyncedTimestamp)
        .map(v => ({
          dateEdited: v.dateEdited,
          dateCreated: v.dateCreated,
          data: JSON.stringify(v),
          userId: user.Id
        })),
      tags: [],
      colors: [],
      tags: [],
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
