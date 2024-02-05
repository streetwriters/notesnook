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
import { getSortSelectors, groupArray } from "../utils/grouping";
import { sql } from "kysely";

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
      .selectFrom("notes")
      .where("type", "==", "trash")
      .select(["id", sql`'note'`.as("itemType")])
      .unionAll((eb) =>
        eb
          .selectFrom("notebooks")
          .where("type", "==", "trash")
          .select(["id", sql`'notebook'`.as("itemType")])
      )
      .execute();

    for (const { id, itemType } of result) {
      if (itemType === "note") this.cache.notes.push(id);
      else if (itemType === "notebook") this.cache.notebooks.push(id);
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

  async add(
    type: "note" | "notebook",
    ids: string[],
    deletedBy: TrashItem["deletedBy"] = "user"
  ) {
    if (type === "note") {
      await this.db.notes.collection.update(ids, {
        type: "trash",
        itemType: "note",
        dateDeleted: Date.now(),
        deletedBy
      });
      this.cache.notes.push(...ids);
    } else if (type === "notebook") {
      await this.db.notebooks.collection.update(ids, {
        type: "trash",
        itemType: "notebook",
        dateDeleted: Date.now(),
        deletedBy
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
      const ids = [...notebookIds, ...(await this.subNotebooks(notebookIds))];
      await this.db.notebooks.remove(...ids);
      await this.db.relations.unlinkOfType("notebook", ids);
      deleteItems(this.cache.notebooks, ...ids);
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
        //  this.cache.notes.splice(this.cache.notes.indexOf(id), 1);
      } else if (!isNote) {
        notebookIds.push(id);
        // this.cache.notebooks.splice(this.cache.notebooks.indexOf(id), 1);
      }
    }

    if (noteIds.length > 0) {
      await this.db.notes.collection.update(noteIds, {
        type: "note",
        dateDeleted: null,
        itemType: null,
        deletedBy: null
      });
      deleteItems(this.cache.notes, ...noteIds);
    }

    if (notebookIds.length > 0) {
      const ids = [...notebookIds, ...(await this.subNotebooks(notebookIds))];
      await this.db.notebooks.collection.update(ids, {
        type: "notebook",
        dateDeleted: null,
        itemType: null,
        deletedBy: null
      });
      deleteItems(this.cache.notebooks, ...ids);
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
    return [
      ...(await this.trashedNotes(this.cache.notes)),
      ...(await this.trashedNotebooks(this.cache.notebooks))
    ] as TrashItem[];
  }

  private async trashedNotes(ids: string[]) {
    return (await this.db
      .sql()
      .selectFrom("notes")
      .where("type", "==", "trash")
      .where("id", "in", ids)
      .where("deletedBy", "==", "user")
      .selectAll()
      .execute()) as TrashItem[];
  }

  private async trashedNotebooks(ids: string[]) {
    return (await this.db
      .sql()
      .selectFrom("notebooks")
      .where("type", "==", "trash")
      .where("id", "in", ids)
      .where("deletedBy", "==", "user")
      .selectAll()
      .execute()) as TrashItem[];
  }

  async grouped(options: GroupOptions) {
    const ids = [...this.cache.notes, ...this.cache.notebooks];
    const selector = getSortSelectors(options)[options.sortDirection];
    return new VirtualizedGrouping<TrashItem>(
      ids.length,
      this.db.options.batchSize,
      () => Promise.resolve(ids),
      async (start, end) => {
        const notesRange =
          end < this.cache.notes.length
            ? [start, end]
            : [start, this.cache.notes.length];
        const notebooksRange =
          start >= this.cache.notes.length
            ? [start, end]
            : [0, Math.min(this.cache.notebooks.length, end)];

        const items = [
          ...(await this.trashedNotes(
            this.cache.notes.slice(notesRange[0], notesRange[1])
          )),
          ...(await this.trashedNotebooks(
            this.cache.notebooks.slice(notebooksRange[0], notebooksRange[1])
          ))
        ];
        items.sort(selector);

        return {
          ids: ids.slice(start, end),
          items
        };
      },
      (items) => groupArray(items, options),
      async () => {
        const items = await this.all();
        items.sort(selector);
        return Array.from(groupArray(items, options).values());
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

  private async subNotebooks(notebookIds: string[]) {
    const ids = await this.db
      .sql()
      .withRecursive(`subNotebooks(id)`, (eb) =>
        eb
          .selectFrom((eb) =>
            sql<{ id: string }>`(VALUES ${sql.join(
              notebookIds.map((id) => eb.parens(sql`${id}`))
            )})`.as("notebookIds")
          )
          .selectAll()
          .unionAll((eb) =>
            eb
              .selectFrom(["relations", "subNotebooks", "notebooks"])
              .select("relations.toId as id")
              .where("toType", "==", "notebook")
              .where("fromType", "==", "notebook")
              .whereRef("fromId", "==", "subNotebooks.id")
              .where(
                (eb) =>
                  eb
                    .selectFrom("notebooks")
                    .whereRef("notebooks.id", "==", "relations.toId")
                    .where("notebooks.type", "==", "trash")
                    .limit(1)
                    .select("deletedBy"),
                "!=",
                "user"
              )
              .$narrowType<{ id: string }>()
          )
      )
      .selectFrom("subNotebooks")
      .select("id")
      .execute();
    return ids.map((ref) => ref.id);
  }
}
