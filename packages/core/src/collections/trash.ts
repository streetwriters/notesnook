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

export default class Trash {
  collections = ["notes", "notebooks"] as const;
  cache: string[] = [];
  constructor(private readonly db: Database) {}

  async init() {
    await this.cleanup();
    const result = await this.db
      .sql()
      .selectNoFrom((eb) => [
        eb
          .selectFrom("notes")
          .where("type", "==", "trash")
          .select("id")
          .as("id"),
        eb
          .selectFrom("notebooks")
          .where("type", "==", "trash")
          .select("id")
          .as("id")
      ])
      .execute();

    this.cache = result.reduce((ids, item) => {
      if (item.id) ids.push(item.id);
      return ids;
    }, [] as string[]);
  }

  async cleanup() {
    const duration = this.db.settings.getTrashCleanupInterval();
    if (duration === -1 || !duration) return;

    const maxMs = dayjs().subtract(duration, "days").toDate().getTime();
    const expiredItems = await this.db
      .sql()
      .selectNoFrom((eb) => [
        eb
          .selectFrom("notes")
          .where("type", "==", "trash")
          .where("dateDeleted", "<=", maxMs)
          .select("id")
          .as("noteId"),
        eb
          .selectFrom("notebooks")
          .where("type", "==", "trash")
          .where("dateDeleted", "<=", maxMs)
          .select("id")
          .as("notebookId")
      ])
      .execute();
    const { noteIds, notebookIds } = expiredItems.reduce(
      (ids, item) => {
        if (item.noteId) ids.noteIds.push(item.noteId);
        if (item.notebookId) ids.notebookIds.push(item.notebookId);
        return ids;
      },
      { noteIds: [] as string[], notebookIds: [] as string[] }
    );
    await this.delete("note", noteIds);
    await this.delete("note", notebookIds);
  }

  async add(type: "note" | "notebook", ids: string[]) {
    if (type === "note") {
      await this.db.notes.collection.update(ids, {
        type: "trash",
        itemType: "note",
        dateDeleted: Date.now()
      });
    } else if (type === "notebook") {
      await this.db.notebooks.collection.update(ids, {
        type: "trash",
        itemType: "notebook",
        dateDeleted: Date.now()
      });
    }
    this.cache.push(...ids);
  }

  async delete(type: "note" | "notebook", ids: string[]) {
    if (type === "note") {
      await this.db.content.removeByNoteId(...ids);
      await this.db.noteHistory.clearSessions(...ids);
      await this.db.notes.delete(...ids);
    } else if (type === "notebook") {
      await this.db.relations.unlinkOfType("notebook", ids);
      await this.db.notebooks.delete(...ids);
    }
    ids.forEach((id) => this.cache.splice(this.cache.indexOf(id), 1));
  }

  async restore(type: "note" | "notebook", ids: string[]) {
    if (type === "note") {
      await this.db.notes.collection.update(ids, {
        type: "note",
        dateDeleted: null,
        itemType: null
      });
    } else {
      await this.db.notebooks.collection.update(ids, {
        type: "notebook",
        dateDeleted: null,
        itemType: null
      });
    }
    ids.forEach((id) => this.cache.splice(this.cache.indexOf(id), 1));
  }

  async clear() {
    // for (const item of this.all) {
    //   await this.delete(item.id);
    // }
    this.cache = [];
  }

  // synced(id: string) {
  //   // const [item] = this.getItem(id);
  //   if (item && item.itemType === "note") {
  //     const { contentId } = item;
  //     return !contentId || this.db.content.exists(contentId);
  //   } else return true;
  // }

  /**
   *
   * @param {string} id
   */
  exists(id: string) {
    return this.cache.includes(id);
  }
}
