/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { compress, decompress } from "../utils/compression";
import { makeSessionContentId } from "../utils/id";
import Collection from "./collection";

export default class SessionContent extends Collection {
  /**
   *
   * @param {string} sessionId
   * @param {{content:string:data:string}} content
   */
  async add(sessionId, content, locked) {
    if (!sessionId || !content) return;
    let compressed = locked ? null : compress(content.data);

    await this._collection.addItem({
      id: makeSessionContentId(sessionId),
      data: compressed || content.data,
      type: content.type,
      compressed: !!compressed,
      localOnly: true,
      locked
    });
  }

  /**
   *
   * @param {string} sessionId
   * @returns {Promise<{content:string;data:string}>}
   */
  async get(sessionContentId) {
    if (!sessionContentId) return;
    let session = await this._collection.getItem(sessionContentId);
    return {
      data: session.compressed ? decompress(session.data) : session.data,
      type: session.type
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
    let indices = await this._collection.indexer.getIndices();
    let items = await this._collection.getItems(indices);

    return Object.values(items);
  }
}
