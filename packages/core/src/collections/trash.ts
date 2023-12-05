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
import { deleteItems } from "../utils/array";
import { GroupOptions, TrashItem } from "../types";
import { VirtualizedGrouping } from "../utils/virtualized-grouping";
import { groupArray } from "../utils/grouping";

export default class Trash {
  collections = ["notes", "notebooks"] as const;
  cache: {
    notes: string[];
    notebooks: string[];
  } = {
    notebooks: [],
    notes: []
  };
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
          .as("noteId"),
        eb
          .selectFrom("notebooks")
          .where("type", "==", "trash")
          .select("id")
          .as("notebookId")
      ])
      .execute();

    for (const { noteId, notebookId } of result) {
      if (noteId) this.cache.notes.push(noteId);
      else if (notebookId) this.cache.notebooks.push(notebookId);
    }
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

    await this._delete(noteIds, notebookIds);
  }

  async add(type: "note" | "notebook", ids: string[]) {
    if (type === "note") {
      await this.db.notes.collection.update(ids, {
        type: "trash",
        itemType: "note",
        dateDeleted: Date.now()
      });
      this.cache.notes.push(...ids);
    } else if (type === "notebook") {
      await this.db.notebooks.collection.update(ids, {
        type: "trash",
        itemType: "notebook",
        dateDeleted: Date.now()
      });
      this.cache.notebooks.push(...ids);
    }
  }

  async delete(...ids: string[]) {
    if (ids.length <= 0) return;

    const noteIds = [];
    const notebookIds = [];
    for (const id of ids) {
      const isNote = this.cache.notes.includes(id);
      if (isNote) {
        noteIds.push(id);
        this.cache.notes.splice(this.cache.notes.indexOf(id), 1);
      } else if (!isNote) {
        notebookIds.push(id);
        this.cache.notebooks.splice(this.cache.notebooks.indexOf(id), 1);
      }
    }

    await this._delete(noteIds, notebookIds);
  }

  private async _delete(noteIds: string[], notebookIds: string[]) {
    if (noteIds.length > 0) {
      await this.db.content.removeByNoteId(...noteIds);
      await this.db.noteHistory.clearSessions(...noteIds);
      await this.db.notes.remove(...noteIds);
      deleteItems(this.cache.notes, ...noteIds);
    }

    if (notebookIds.length > 0) {
      await this.db.relations.unlinkOfType("notebook", notebookIds);
      await this.db.notebooks.remove(...notebookIds);
      deleteItems(this.cache.notebooks, ...notebookIds);
    }
  }

  async restore(...ids: string[]) {
    if (ids.length <= 0) return;

    const noteIds = [];
    const notebookIds = [];
    for (const id of ids) {
      const isNote = this.cache.notes.includes(id);
      if (isNote) {
        noteIds.push(id);
        this.cache.notes.splice(this.cache.notes.indexOf(id), 1);
      } else if (!isNote) {
        notebookIds.push(id);
        this.cache.notebooks.splice(this.cache.notebooks.indexOf(id), 1);
      }
    }

    if (noteIds.length > 0) {
      await this.db.notes.collection.update(noteIds, {
        type: "note",
        dateDeleted: null,
        itemType: null
      });
    }

    if (notebookIds.length > 0) {
      await this.db.notebooks.collection.update(notebookIds, {
        type: "notebook",
        dateDeleted: null,
        itemType: null
      });
    }
  }

  async clear() {
    await this._delete(this.cache.notes, this.cache.notebooks);
    this.cache = { notebooks: [], notes: [] };
  }

  // synced(id: string) {
  //   // const [item] = this.getItem(id);
  //   if (item && item.itemType === "note") {
  //     const { contentId } = item;
  //     return !contentId || this.db.content.exists(contentId);
  //   } else return true;
  // }

  async all() {
    const trashedNotes = await this.db
      .sql()
      .selectFrom("notes")
      .where("type", "==", "trash")
      .where("id", "in", this.cache.notes)
      .selectAll()
      .execute();

    const trashedNotebooks = await this.db
      .sql()
      .selectFrom("notebooks")
      .where("type", "==", "trash")
      .where("id", "in", this.cache.notebooks)
      .selectAll()
      .execute();

    return [...trashedNotes, ...trashedNotebooks] as TrashItem[];
  }

  async grouped(options: GroupOptions) {
    // const items = await this.all();
    // const ids = groupArray(items, options);
    // const records: Record<string, TrashItem> = {};
    // for (const item of items) records[item.id] = item;
    // const ids = [...this.cache.notebooks,...this.cache.notes]

    return new VirtualizedGrouping<TrashItem>(
      this.cache.notebooks.length + this.cache.notes.length,
      this.db.options.batchSize,
      async (start, end) => {
        //         const notesRange = end < this.cache.notes.length ? [start, end] : [start, this.cache.notes.length - 1];
        // const notebooksRange = start >= this.cache.notes.length ?[start, end] : [
        //   0, end
        // ]
        // TODO:
        return { ids: [], items: [] };
        // return {
        //   ids: ids.slice(start,end),
        // }
        // const items: Record<string, TrashItem> = {};
        // for (const id of ids) items[id] = records[id];
        // return items;
      }
    );
  }

  /**
   *
   * @param {string} id
   */
  exists(id: string) {
    return this.cache.notebooks.includes(id) || this.cache.notes.includes(id);
  }
}
