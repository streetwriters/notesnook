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
import {
  CHECK_IDS,
  checkIsUserPremium,
  FREE_NOTEBOOKS_LIMIT
} from "../common.js";

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
    await this.cleanup();
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
        if (deletedBy === "user") this.userDeletedCache.notes.push(id);
      } else if (itemType === "notebook") {
        this.cache.notebooks.push(id);
        if (deletedBy === "user") this.userDeletedCache.notebooks.push(id);
      }
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
      if (deletedBy === "user") this.userDeletedCache.notes.push(...ids);
    } else if (type === "notebook") {
      await this.db.notebooks.collection.update(ids, {
        type: "trash",
        itemType: "notebook",
        dateDeleted: Date.now(),
        deletedBy
      });
      this.cache.notebooks.push(...ids);
      if (deletedBy === "user") this.userDeletedCache.notebooks.push(...ids);
    }
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
        await this.db.content.removeByNoteId(...chunk);
        await this.db.noteHistory.clearSessions(...chunk);
        await this.db.notes.remove(...chunk);
        deleteItems(this.cache.notes, ...chunk);
        deleteItems(this.userDeletedCache.notes, ...chunk);
      }
    }

    if (notebookIds.length > 0) {
      const ids = [...notebookIds, ...(await this.subNotebooks(notebookIds))];
      for (const chunk of toChunks(ids, MAX_SQL_PARAMETERS)) {
        await this.db.notebooks.remove(...chunk);
        await this.db.relations.unlinkOfType("notebook", chunk);
        deleteItems(this.cache.notebooks, ...chunk);
        deleteItems(this.userDeletedCache.notebooks, ...chunk);
      }
    }
  }

  async restore(...ids: string[]) {
    if (ids.length <= 0) return;

    const noteIds = ids.filter((id) => this.cache.notes.includes(id));
    const notebookIds = ids.filter((id) => this.cache.notebooks.includes(id));

    if (noteIds.length > 0) {
      await this.db.notes.collection.update(noteIds, {
        type: "note",
        dateDeleted: null,
        itemType: null,
        deletedBy: null
      });
      deleteItems(this.cache.notes, ...noteIds);
      deleteItems(this.userDeletedCache.notes, ...noteIds);
    }

    if (notebookIds.length > 0) {
      const notebooksLimitReached =
        (await this.db.notebooks.all.count()) + notebookIds.length >
        FREE_NOTEBOOKS_LIMIT;
      const isUserPremium = await checkIsUserPremium(CHECK_IDS.notebookAdd);
      if (notebooksLimitReached && !isUserPremium) {
        return false;
      }
      const ids = [...notebookIds, ...(await this.subNotebooks(notebookIds))];
      await this.db.notebooks.collection.update(ids, {
        type: "notebook",
        dateDeleted: null,
        itemType: null,
        deletedBy: null
      });
      deleteItems(this.cache.notebooks, ...ids);
      deleteItems(this.userDeletedCache.notebooks, ...ids);
    }
  }

  async clear() {
    await this._delete(this.cache.notes, this.cache.notebooks);
    this.cache = { notebooks: [], notes: [] };
    this.userDeletedCache = { notebooks: [], notes: [] };
  }

  // synced(id: string) {
  //   // const [item] = this.getItem(id);
  //   if (item && item.itemType === "note") {
  //     const { contentId } = item;
  //     return !contentId || this.db.content.exists(contentId);
  //   } else return true;
  // }

  async all(deletedBy?: TrashItem["deletedBy"]) {
    return [
      ...(await this.trashedNotes(this.cache.notes, deletedBy)),
      ...(await this.trashedNotebooks(this.cache.notebooks, deletedBy))
    ] as TrashItem[];
  }

  private async trashedNotes(
    ids: string[],
    deletedBy?: TrashItem["deletedBy"]
  ) {
    if (ids.length <= 0) return [];
    return (await this.db
      .sql()
      .selectFrom("notes")
      .where("type", "==", "trash")
      .where("id", "in", ids)
      .$if(!!deletedBy, (eb) => eb.where("deletedBy", "==", deletedBy))
      .selectAll()
      .execute()) as TrashItem[];
  }

  private async trashedNotebooks(
    ids: string[],
    deletedBy?: TrashItem["deletedBy"]
  ) {
    if (ids.length <= 0) return [];
    return (await this.db
      .sql()
      .selectFrom("notebooks")
      .where("type", "==", "trash")
      .where("id", "in", ids)
      .$if(!!deletedBy, (eb) => eb.where("deletedBy", "==", deletedBy))
      .selectAll()
      .execute()) as TrashItem[];
  }

  async grouped(options: GroupOptions) {
    const ids = [
      ...this.userDeletedCache.notes,
      ...this.userDeletedCache.notebooks
    ];
    const selector = getSortSelectors(options)[options.sortDirection];
    return new VirtualizedGrouping<TrashItem>(
      ids.length,
      this.db.options.batchSize,
      () => Promise.resolve(ids),
      async (start, end) => {
        const slicedIds = ids.slice(start, end);
        const noteIds = slicedIds.filter((id) =>
          this.userDeletedCache.notes.includes(id)
        );
        const notebookIds = slicedIds.filter((id) =>
          this.userDeletedCache.notebooks.includes(id)
        );
        const items = [
          ...(await this.trashedNotes(noteIds)),
          ...(await this.trashedNotebooks(notebookIds))
        ];
        items.sort(selector);

        return {
          ids: slicedIds,
          items
        };
      },
      (items) => groupArray(items, createKeySelector(options)),
      async () => {
        const items = await this.all();
        items.sort(selector);
        return Array.from(
          groupArray(items, createKeySelector(options)).values()
        );
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
              .selectFrom(["relations", "subNotebooks"])
              .select("relations.toId as id")
              .where("toType", "==", "notebook")
              .where("fromType", "==", "notebook")
              .whereRef("fromId", "==", "subNotebooks.id")
              .where("toId", "not in", this.userDeletedCache.notebooks)
              .$narrowType<{ id: string }>()
          )
      )
      .selectFrom("subNotebooks")
      .select("id")
      .where("id", "not in", notebookIds)
      .execute();
    return ids.map((ref) => ref.id);
  }
}
