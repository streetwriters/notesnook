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
import Database from "../api";
import {
  BaseTrashItem,
  Note,
  Notebook,
  TrashItem,
  isTrashItem
} from "../types";

function toTrashItem<T extends Note | Notebook>(item: T): BaseTrashItem<T> {
  return {
    ...item,
    id: item.id,
    type: "trash",
    itemType: item.type,
    dateDeleted: Date.now()
  };
}

export default class Trash {
  collections = ["notes", "notebooks"] as const;
  cache: string[] = [];
  constructor(private readonly db: Database) {}

  async init() {
    await this.cleanup();
    this.cache = this.all.map((t) => t.id);
  }

  async cleanup() {
    const now = dayjs().unix();
    const duration = this.db.settings.getTrashCleanupInterval();
    if (duration === -1 || !duration) return;
    for (const item of this.all) {
      if (
        isTrashItem(item) &&
        item.dateDeleted &&
        dayjs(item.dateDeleted).add(duration, "days").unix() > now
      )
        continue;
      await this.delete(item.id);
    }
  }

  get all(): TrashItem[] {
    const trashItems: TrashItem[] = [];
    for (const key of this.collections) {
      const collection = this.db[key];
      trashItems.push(...collection.trashed);
    }
    return trashItems;
  }

  private getItem(id: string) {
    for (const key of this.collections) {
      const collection = this.db[key].collection;
      const item = collection.get(id);
      if (item && isTrashItem(item)) return [item, collection] as const;
    }
    return [] as const;
  }

  async add(item: Note | Notebook) {
    if (item.type === "note") {
      await this.db.notes.collection.update(toTrashItem(item));
    } else if (item.type === "notebook") {
      await this.db.notebooks.collection.update(toTrashItem(item));
    }
    this.cache.push(item.id);
  }

  async delete(...ids: string[]) {
    for (const id of ids) {
      const [item, collection] = this.getItem(id);
      if (!item || !collection) continue;
      if (item.itemType === "note") {
        if (item.contentId) await this.db.content.remove(item.contentId);
        await this.db.noteHistory.clearSessions(id);
      } else if (item.itemType === "notebook") {
        await this.db.relations.unlinkAll({ type: "notebook", id: item.id });
      }
      await collection.remove(id);
      this.cache.splice(this.cache.indexOf(id), 1);
    }
  }

  async restore(...ids: string[]) {
    for (const id of ids) {
      const [item] = this.getItem(id);
      if (!item) continue;
      if (item.itemType === "note") {
        await this.db.notes.collection.update({ ...item, type: "note" });
      } else if (item.itemType === "notebook") {
        await this.db.notebooks.collection.update({
          ...item,
          type: "notebook"
        });
      }
      this.cache.splice(this.cache.indexOf(id), 1);
    }
  }

  async clear() {
    for (const item of this.all) {
      await this.delete(item.id);
    }
    this.cache = [];
  }

  synced(id: string) {
    const [item] = this.getItem(id);
    if (item && item.itemType === "note") {
      const { contentId } = item;
      return !contentId || this.db.content.exists(contentId);
    } else return true;
  }

  /**
   *
   * @param {string} id
   */
  exists(id: string) {
    return this.cache.includes(id);
  }
}
