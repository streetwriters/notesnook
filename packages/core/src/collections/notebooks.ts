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

import { getId } from "../utils/id.js";
import Database from "../api/index.js";
import { Notebook, TrashOrItem, isTrashItem } from "../types.js";
import { ICollection } from "./collection.js";
import { SQLCollection } from "../database/sql-collection.js";
import { isFalse } from "../database/index.js";
import { sql } from "@streetwriters/kysely";
import { deleteItems } from "../utils/array.js";
import {
  CHECK_IDS,
  checkIsUserPremium,
  FREE_NOTEBOOKS_LIMIT
} from "../common.js";

export class Notebooks implements ICollection {
  name = "notebooks";
  /**
   * @internal
   */
  collection: SQLCollection<"notebooks", TrashOrItem<Notebook>>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "notebooks",
      db.eventManager,
      db.sanitizer
    );
  }

  init() {
    return this.collection.init();
  }

  async add(notebookArg: Partial<Notebook>) {
    if (!notebookArg) throw new Error("Notebook cannot be undefined or null.");
    if (notebookArg.remote)
      throw new Error(
        "Please use db.notebooks.merge to merge remote notebooks"
      );

    const id = notebookArg.id || getId();
    const oldNotebook = await this.notebook(id);

    if (oldNotebook && isTrashItem(oldNotebook))
      throw new Error("Cannot modify trashed notebooks.");

    if (
      !oldNotebook &&
      (await this.all.count()) >= FREE_NOTEBOOKS_LIMIT &&
      !(await checkIsUserPremium(CHECK_IDS.notebookAdd))
    )
      return;

    const mergedNotebook: Partial<Notebook> = {
      ...oldNotebook,
      ...notebookArg
    };

    if (!mergedNotebook.title)
      throw new Error("Notebook must contain a title.");

    await this.collection.upsert({
      id,
      type: "notebook",
      title: mergedNotebook.title,
      description: mergedNotebook.description,
      pinned: !!mergedNotebook.pinned,

      dateCreated: mergedNotebook.dateCreated || Date.now(),
      dateModified: mergedNotebook.dateModified || Date.now(),
      dateEdited: Date.now()
    });
    return id;
  }

  // get raw() {
  //   return this.collection.raw();
  // }

  get all() {
    return this.collection.createFilter<Notebook>(
      (qb) => qb.where(isFalse("dateDeleted")).where(isFalse("deleted")),
      this.db.options?.batchSize
    );
  }

  get pinned() {
    return this.collection.createFilter<Notebook>(
      (qb) =>
        qb
          .where(isFalse("dateDeleted"))
          .where(isFalse("deleted"))
          .where("pinned", "==", true),
      this.db.options?.batchSize
    );
  }

  // get trashed() {
  //   return this.raw.filter((item) =>
  //     isTrashItem(item)
  //   ) as BaseTrashItem<Notebook>[];
  // }

  async pin(state: boolean, ...ids: string[]) {
    await this.collection.update(ids, { pinned: state });
  }

  async totalNotes(id: string) {
    const result = await this.db
      .sql()
      .withRecursive(`subNotebooks(id)`, (eb) =>
        eb
          .selectNoFrom((eb) => eb.val(id).as("id"))
          .unionAll((eb) =>
            eb
              .selectFrom(["relations", "subNotebooks"])
              .select("relations.toId as id")
              .where("toType", "==", "notebook")
              .where("fromType", "==", "notebook")
              .whereRef("fromId", "==", "subNotebooks.id")
              .where("toId", "not in", this.db.trash.cache.notebooks)
              .$narrowType<{ id: string }>()
          )
      )
      .selectFrom("relations")
      .where("toType", "==", "note")
      .where("fromType", "==", "notebook")
      .where("fromId", "in", (eb) =>
        eb.selectFrom("subNotebooks").select("subNotebooks.id")
      )
      .where("toId", "not in", this.db.trash.cache.notes)
      .select((eb) => eb.fn.count<number>("relations.toId").as("totalNotes"))
      .executeTakeFirst();

    if (!result) return 0;
    return result.totalNotes;
  }

  async notes(id: string) {
    const result = await this.db
      .sql()
      .withRecursive(`subNotebooks(id)`, (eb) =>
        eb
          .selectNoFrom((eb) => eb.val(id).as("id"))
          .unionAll((eb) =>
            eb
              .selectFrom(["relations", "subNotebooks"])
              .select("relations.toId as id")
              .where("toType", "==", "notebook")
              .where("fromType", "==", "notebook")
              .whereRef("fromId", "==", "subNotebooks.id")
              .where("toId", "not in", this.db.trash.cache.notebooks)
              .$narrowType<{ id: string }>()
          )
      )
      .selectFrom("relations")
      .where("toType", "==", "note")
      .where("fromType", "==", "notebook")
      .where("fromId", "in", (eb) =>
        eb.selectFrom("subNotebooks").select("subNotebooks.id")
      )
      .where("toId", "not in", this.db.trash.cache.notes)
      .select("relations.toId as id")
      .$narrowType<{ id: string }>()
      .execute();

    return result.map((i) => i.id);
  }

  get roots() {
    return this.collection.createFilter<Notebook>(
      (qb) =>
        qb
          .where("id", "not in", (eb) =>
            eb
              .selectFrom("relations")
              .where("toType", "==", "notebook")
              .where("fromType", "==", "notebook")
              .select("relations.toId as id")
              .$narrowType<{ id: string }>()
          )
          .where(isFalse("dateDeleted"))
          .where(isFalse("deleted")),
      this.db.options?.batchSize
    );
  }

  async breadcrumbs(id: string) {
    const ids = await this.db
      .sql()
      .withRecursive(`subNotebooks(id)`, (eb) =>
        eb
          .selectNoFrom((eb) => eb.val(id).as("id"))
          .unionAll((eb) =>
            eb
              .selectFrom(["relations", "subNotebooks"])
              .select("relations.fromId as id")
              .where("toType", "==", "notebook")
              .where("fromType", "==", "notebook")
              .whereRef("toId", "==", "subNotebooks.id")
              .where("fromId", "not in", this.db.trash.cache.notebooks)
              .$narrowType<{ id: string }>()
          )
      )
      .selectFrom("subNotebooks")
      .select("id")
      .execute();
    const records = await this.all
      .fields(["notebooks.id", "notebooks.title"])
      .records(ids.map((i) => i.id));

    return ids
      .reverse()
      .map((id) => records[id.id])
      .filter(Boolean) as {
      id: string;
      title: string;
    }[];
  }

  async notebook(id: string) {
    const notebook = await this.collection.get(id);
    if (!notebook || isTrashItem(notebook)) return;
    return notebook;
  }

  find(title: string) {
    return this.all.find((eb) => eb("notebooks.title", "==", title));
  }

  exists(id: string) {
    return this.all.has(id);
  }

  async moveToTrash(...ids: string[]) {
    await this.db.transaction(async (tr) => {
      const query = tr
        .withRecursive(`subNotebooks(id)`, (eb) =>
          eb
            .selectFrom(() =>
              sql<{ id: string }>`(VALUES ${sql.join(
                ids.map((id) => sql.raw(`('${id}')`))
              )})`.as("roots")
            )
            .selectAll()
            .unionAll((eb) =>
              eb
                .selectFrom(["relations", "subNotebooks"])
                .select("relations.toId as id")
                .where("toType", "==", "notebook")
                .where("fromType", "==", "notebook")
                .whereRef("fromId", "==", "subNotebooks.id")
                .where("toId", "not in", this.db.trash.cache.notebooks)
                .$narrowType<{ id: string }>()
            )
        )
        .selectFrom("subNotebooks")
        .select("id");

      const subNotebookIds = (await query.execute()).map((ref) => ref.id);
      deleteItems(subNotebookIds, ...ids);
      if (subNotebookIds.length > 0)
        await this.db.trash.add("notebook", subNotebookIds, "app");
      await this.db.trash.add("notebook", ids, "user");
    });
  }

  async remove(...ids: string[]) {
    await this.db.transaction(async () => {
      await this.db.relations.unlinkOfType("notebook", ids);
      await this.collection.softDelete(ids);
    });
  }
}
