/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import http from "../utils/http";
import Constants from "../utils/constants";

class Monographs {
  /**
   *
   * @param {import("./index").default} db
   */
  constructor(db) {
    this._db = db;
    this.monographs = undefined;
  }

  async deinit() {
    this.monographs = undefined;
    await this._db.storage().write("monographs", this.monographs);
  }

  async init() {
    try {
      const user = await this._db.user.getUser();
      const token = await this._db.tokenManager.getAccessToken();
      if (!user || !token || !user.isEmailConfirmed) return;
      let monographs = await this._db.storage().read("monographs", true);
      monographs = await http.get(`${Constants.API_HOST}/monographs`, token);
      await this._db.storage().write("monographs", monographs);

      if (monographs) this.monographs = monographs;
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Check if note is published.
   * @param {string} noteId id of the note
   * @returns {boolean} Whether note is published or not.
   */
  isPublished(noteId) {
    return this.monographs && this.monographs.indexOf(noteId) > -1;
  }

  /**
   * Get note published monograph id
   * @param {string} noteId id of the note
   * @returns Monograph Id
   */
  monograph(noteId) {
    if (!this.monographs) return;

    return this.monographs[this.monographs.indexOf(noteId)];
  }

  /**
   * Publish a note as a monograph
   * @param {string} noteId id of the note to publish
   * @param {{password: string, selfDestruct: boolean}} opts Publish options
   * @returns
   */
  async publish(noteId, opts = { password: undefined, selfDestruct: false }) {
    if (!this.monographs) await this.init();

    let update = !!this.isPublished(noteId);

    const user = await this._db.user.getUser();
    const token = await this._db.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    const note = this._db.notes.note(noteId);
    if (!note) throw new Error("No such note found.");

    const content = await this._db.content.downloadMedia(
      `monograph-${noteId}`,
      await this._db.content.raw(note.data.contentId),
      false
    );
    if (!content) throw new Error("This note has no content.");

    const monograph = {
      id: noteId,
      title: note.title,
      userId: user.id,
      selfDestruct: opts.selfDestruct
    };

    if (opts.password) {
      monograph.encryptedContent = await this._db
        .storage()
        .encrypt(
          { password: opts.password },
          JSON.stringify({ type: content.type, data: content.data })
        );
    } else {
      monograph.content = JSON.stringify({
        type: content.type,
        data: content.data
      });
    }

    const method = update ? http.patch.json : http.post.json;

    const { id } = await method(
      `${Constants.API_HOST}/monographs`,
      monograph,
      token
    );

    this.monographs.push(id);
    return id;
  }

  /**
   * Unpublish a note
   * @param {string} noteId id of the note to unpublish
   */
  async unpublish(noteId) {
    if (!this.monographs) await this.init();

    const user = await this._db.user.getUser();
    const token = await this._db.tokenManager.getAccessToken();
    if (!user || !token) throw new Error("Please login to publish a note.");

    // const note = this._db.notes.note(noteId);
    // if (!note) throw new Error("No such note found.");

    if (!this.isPublished(noteId))
      throw new Error("This note is not published.");

    await http.delete(`${Constants.API_HOST}/monographs/${noteId}`, token);

    this.monographs.splice(this.monographs.indexOf(noteId), 1);
  }

  get all() {
    if (!this.monographs) return [];

    return this._db.notes.all.filter(
      (note) => this.monographs.indexOf(note.id) > -1
    );
  }

  async get(monographId) {
    return await http.get(`${Constants.API_HOST}/monographs/${monographId}`);
  }
}
export default Monographs;
