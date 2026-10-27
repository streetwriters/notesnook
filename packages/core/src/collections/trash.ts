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
import Database from "../api/index.js";
import { deleteItems, toChunks } from "../utils/array.js";
import { GroupOptions, TrashItem } from "../types.js";
import { VirtualizedGrouping } from "../utils/virtualized-grouping.js";
import {
  createKeySelector,
  getSortSelectors,
  groupArray
} from "../utils/grouping.js";
import { sql } from "@streetwriters/kysely";
import { MAX_SQL_PARAMETERS } from "../database/sql-collection.js";
import { withSubNotebooks } from "./notebooks.js";

export default class Trash {
  collections = ["notes", "notebooks"] as const;
  cache: {
    notes: string[];
    notebooks: string[];
  } = {
    notebooks: [],
    notes: []
  };
  private userDeletedCache: {
    notes: string[];
    notebooks: string[];
  } = {
    notebooks: [],
    notes: []
  };
  constructor(private readonly db: Database) {}

  async init() {
    await this.buildCache();
  }

  async buildCache() {
    this.cache.notes = [];
    this.cache.notebooks = [];
    this.userDeletedCache.notes = [];
    this.userDeletedCache.notebooks = [];

    const result = await this.db
      .sql()
      .selectFrom("notes")
      .where("type", "==", "trash")
      .select(["id", sql`'note'`.as("itemType"), "deletedBy"])
      .unionAll((eb) =>
        eb
          .selectFrom("notebooks")
          .where("type", "==", "trash")
          .select(["id", sql`'notebook'`.as("itemType"), "deletedBy"])
      )
      .execute();

    for (const { id, itemType, deletedBy } of result) {
      if (itemType === "note") {
        this.cache.notes.push(id);
        if (deletedBy === "user" || deletedBy === "expired")
          this.userDeletedCache.notes.push(id);
      } else if (itemType === "notebook") {
        this.cache.notebooks.push(id);
        if (deletedBy === "user") this.userDeletedCache.notebooks.push(id);
      }
    }
  }

  async cleanup() {
    const duration = this.db.settings.getTrashCleanupInterval();
    if (duration === -1 || !duration) {
      await this.buildCache();
      return;
    }

    const maxMs = dayjs()
      .startOf("day")
      .subtract(duration, "days")
      .toDate()
      .getTime();
    const noteIds = await this.db
      .sql()
      .selectFrom("notes")
      .where("type", "==", "trash")
      .where("dateDeleted", "<=", maxMs)
      .select("id")
      .execute();
    const notebookIds = await this.db
      .sql()
      .selectFrom("notebooks")
      .where("type", "==", "trash")
      .where("dateDeleted", "<=", maxMs)
      .select("id")
      .execute();
    await this._delete(
      noteIds.map((n) => n.id),
      notebookIds.map((n) => n.id)
    );

    await this.buildCache();
  }

  async add(
    type: "note" | "notebook",
    ids: string[],
    deletedBy: TrashItem["deletedBy"] = "user"
  ) {
    await this.db.transaction(async (tx) => {
      if (type === "note") {
        await tx.notes.collection.update(ids, {
          type: "trash",
          itemType: "note",
          dateDeleted: Date.now(),
          deletedBy
        });
        tx.afterCommit(() => {
          this.cache.notes.push(...ids);
          if (deletedBy === "user" || deletedBy === "expired")
            this.userDeletedCache.notes.push(...ids);
        });
      } else if (type === "notebook") {
        await tx.notebooks.collection.update(ids, {
          type: "trash",
          itemType: "notebook",
          dateDeleted: Date.now(),
          deletedBy
        });
        tx.afterCommit(() => {
          this.cache.notebooks.push(...ids);
          if (deletedBy === "user")
            this.userDeletedCache.notebooks.push(...ids);
        });
      }
    });
  }

  async delete(...ids: string[]) {
    if (ids.length <= 0) return;

    const noteIds = ids.filter((id) => this.cache.notes.includes(id));
    const notebookIds = ids.filter((id) => this.cache.notebooks.includes(id));

    await this._delete(noteIds, notebookIds);
  }

  private async _delete(noteIds: string[], notebookIds: string[]) {
    if (noteIds.length > 0) {
      for (const chunk of toChunks(noteIds, MAX_SQL_PARAMETERS)) {
        await this.db.transaction(async (tx) => {
          await tx.content.removeByNoteId(...chunk);
          await tx.noteHistory.clearSessions(...chunk);
          await tx.notes.remove(...chunk);
          tx.afterCommit(() => {
            deleteItems(this.cache.notes, ...chunk);
            deleteItems(this.userDeletedCache.notes, ...chunk);
          });
        });
      }
    }

    if (notebookIds.length > 0) {
      const ids = [...notebookIds, ...(await this.subNotebooks(notebookIds))];
      for (const chunk of toChunks(ids, MAX_SQL_PARAMETERS)) {
        await this.db.transaction(async (tx) => {
          await tx.notebooks.remove(...chunk);
          await tx.relations.unlinkOfType("notebook", chunk);
          tx.afterCommit(() => {
            deleteItems(this.cache.notebooks, ...chunk);
            deleteItems(this.userDeletedCache.notebooks, ...chunk);
          });
        });
      }
    }
  }

  async restore(...ids: string[]) {
    if (ids.length <= 0) return;

    const noteIds = ids.filter((id) => this.cache.notes.includes(id));
    const notebookIds = ids.filter((id) => this.cache.notebooks.includes(id));

    if (noteIds.length > 0) {
      await this.db.transaction(async (tx) => {
        await tx.notes.collection.update(noteIds, {
          type: "note",
          dateDeleted: null,
          itemType: null,
          deletedBy: null
        });
        tx.afterCommit(() => {
          deleteItems(this.cache.notes, ...noteIds);
          deleteItems(this.userDeletedCache.notes, ...noteIds);
        });
      });
    }

    if (notebookIds.length > 0) {
      const ids = [...notebookIds, ...(await this.subNotebooks(notebookIds))];
      await this.db.transaction(async (tx) => {
        await tx.notebooks.collection.update(ids, {
          type: "notebook",
          dateDeleted: null,
          itemType: null,
          deletedBy: null
        });
        tx.afterCommit(() => {
          deleteItems(this.cache.notebooks, ...ids);
          deleteItems(this.userDeletedCache.notebooks, ...ids);
        });
      });
    }
  }

  async clear() {
    await this.db.transaction(async (tx) => {
      await tx.trash._delete(this.cache.notes, this.cache.notebooks);
      tx.afterCommit(() => {
        this.cache.notes = [];
        this.cache.notebooks = [];
        this.userDeletedCache.notes = [];
        this.userDeletedCache.notebooks = [];
      });
    });
  }

  // synced(id: string) {
  //   // const [item] = this.getItem(id);
  //   if (item && item.itemType === "note") {
  //     const { contentId } = item;
  //     return !contentId || this.db.content.exists(contentId);
  //   } else return true;
  // }

  async all(deletedBy?: TrashItem["deletedBy"][]) {
    return [
      ...(await this.trashedNotes(this.cache.notes, deletedBy)),
      ...(await this.trashedNotebooks(this.cache.notebooks, deletedBy))
    ] as TrashItem[];
  }

  count() {
    return this.cache.notes.length + this.cache.notebooks.length;
  }

  private async trashedNotes(
    ids: string[],
    deletedBy?: TrashItem["deletedBy"][]
  ) {
    if (ids.length <= 0) return [];
    return (await this.db
      .sql()
      .selectFrom("notes")
      .where("type", "==", "trash")
      .where("id", "in", ids)
      .$if(!!deletedBy, (eb) => eb.where("deletedBy", "in", deletedBy))
      .selectAll()
      .execute()) as TrashItem[];
  }

  private async trashedNotebooks(
    ids: string[],
    deletedBy?: TrashItem["deletedBy"][]
  ) {
    if (ids.length <= 0) return [];
    return (await this.db
      .sql()
      .selectFrom("notebooks")
      .where("type", "==", "trash")
      .where("id", "in", ids)
      .$if(!!deletedBy, (eb) => eb.where("deletedBy", "in", deletedBy))
      .selectAll()
      .execute()) as TrashItem[];
  }

  async grouped(options: GroupOptions) {
    const selector = getSortSelectors(options)[options.sortDirection];
    const items = (await this.userDeletedItems()).sort(selector);

    return new VirtualizedGrouping<TrashItem>(
      items.length,
      this.db.options.batchSize,
      async () => items.map((item) => item.id),
      async (start, end) => {
        const slicedItems = items.slice(start, end);
        return {
          ids: slicedItems.map((item) => item.id),
          items: slicedItems
        };
      },
      (items) => groupArray(items, createKeySelector(options)),
      async () =>
        Array.from(groupArray(items, createKeySelector(options)).values())
    );
  }

  private async userDeletedItems() {
    return [
      ...(await this.db
        .sql()
        .selectFrom("notes")
        .where("type", "==", "trash")
        .where("deletedBy", "in", ["user", "expired"])
        .selectAll()
        .execute()),
      ...(await this.db
        .sql()
        .selectFrom("notebooks")
        .where("type", "==", "trash")
        .where("deletedBy", "==", "user")
        .selectAll()
        .execute())
    ] as TrashItem[];
  }

  /**
   *
   * @param {string} id
   */
  exists(id: string) {
    return this.cache.notebooks.includes(id) || this.cache.notes.includes(id);
  }

  private async subNotebooks(notebookIds: string[]) {
    const ids = await withSubNotebooks(
      this.db.sql(),
      notebookIds,
      this.userDeletedCache.notebooks
    )
      .selectFrom("subNotebooks")
      .select("id")
      .where("id", "not in", notebookIds)
      .execute();
    return ids.map((ref) => ref.id);
  }
}
