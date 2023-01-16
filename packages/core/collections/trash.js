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

import dayjs from "dayjs";

export default class Trash {
  /**
   *
   * @param {import("../api").default} db
   */
  constructor(db) {
    this._db = db;
    this.collections = {
      notes: db.notes,
      notebooks: db.notebooks
    };
  }

  async init() {
    await this.cleanup();
  }

  async cleanup() {
    const now = dayjs().unix();
    for (const item of this.all) {
      if (dayjs(item.dateDeleted).add(7, "days").unix() > now) continue;
      await this.delete(item.id);
    }
  }

  get all() {
    let trashItems = [];
    for (let key in this.collections) {
      const collection = this.collections[key];
      trashItems.push(...collection.deleted);
    }
    return trashItems;
  }

  _getItem(id) {
    for (let key in this.collections) {
      const collection = this.collections[key]._collection;
      if (collection.has(id)) return [collection.getItem(id), collection];
    }
    return [];
  }

  async add(item) {
    const collection = collectionNameFromItem(item);
    if (!item || !item.type || !collection) return;

    await this.collections[collection]._collection.updateItem({
      ...item,
      id: item.itemId || item.id,
      type: "trash",
      itemType: item.itemType || item.type,
      dateDeleted: item.dateDeleted || Date.now(),
      deleted: true
    });
  }

  async delete(...ids) {
    for (let id of ids) {
      if (!id) continue;
      let [item, collection] = this._getItem(id);
      if (!item) continue;
      if (item.itemType === "note") {
        await this._db.content.remove(item.contentId);
        await this._db.noteHistory.clearSessions(id);
      } else if (item.itemType === "notebook") {
        await this._db.notes._clearAllNotebookReferences(item.id);
      }
      await collection.removeItem(id);
    }
    this._db.notes.topicReferences.rebuild();
  }

  async restore(...ids) {
    for (let id of ids) {
      let [item] = this._getItem(id);
      if (!item) continue;
      item = { ...item };
      delete item.dateDeleted;
      delete item.deleted;
      item.type = item.itemType;
      delete item.itemType;

      if (item.type === "note") {
        await this.collections.notes.add(item);
      } else if (item.type === "notebook") {
        await this.collections.notebooks.add(item);
      }
    }
    this._db.notes.topicReferences.rebuild();
  }

  async clear() {
    for (let item of this.all) {
      await this.delete(item.id);
    }
  }

  synced(id) {
    let [item] = this._getItem(id);
    if (item.itemType === "note") {
      const { contentId } = item;
      return !contentId || this._db.content.exists(contentId);
    } else return true;
  }

  /**
   *
   * @param {string} id
   */
  exists(id) {
    return this.all.findIndex((item) => item.id === id) > -1;
  }
}

function collectionNameFromItem(item) {
  const { type, itemType } = item;
  let typeToCompare = type === "trash" ? itemType : type;
  switch (typeToCompare) {
    case "note":
      return "notes";
    case "notebook":
      return "notebooks";
    default:
      return null;
  }
}
