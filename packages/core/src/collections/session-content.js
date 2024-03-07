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

import { tinyToTiptap } from "../migrations";
import { makeSessionContentId } from "../utils/id";
import Collection from "./collection";

export default class SessionContent extends Collection {
  async merge(item) {
    await this._collection.addItem(item);
  }

  /**
   *
   * @param {string} sessionId
   * @param {{content:string:data:string}} content
   */
  async add(sessionId, content, locked) {
    if (!sessionId || !content) return;
    let data = locked
      ? content.data
      : await this._db.compressor.compress(content.data);

    await this._collection.addItem({
      type: "sessioncontent",
      id: makeSessionContentId(sessionId),
      data,
      contentType: content.type,
      compressed: !locked,
      localOnly: true,
      locked,
      title: content.title
    });
  }

  /**
   *
   * @param {string} sessionId
   * @returns {Promise<{content:string;data:string;title:string}>}
   */
  async get(sessionContentId) {
    if (!sessionContentId) return;
    let session = await this._collection.getItem(sessionContentId);

    if (session.contentType === "tiny" && session.compressed) {
      session.compressed = await this._db.compressor.compress(
        tinyToTiptap(await this._db.compressor.decompress(session.data))
      );
      session.contentType = "tiptap";
      await this._collection.addItem(session);
    }

    return {
      data: session.compressed
        ? await this._db.compressor.decompress(session.data)
        : session.data,
      type: session.contentType,
      title: session.title
    };
  }

  /**
   *
   * @param {string} sessionContentId
   */
  async remove(sessionContentId) {
    await this._collection.deleteItem(sessionContentId);
  }

  async all() {
    let indices = this._collection.indexer.getIndices();
    let items = await this._collection.getItems(indices);

    return Object.values(items);
  }
}
