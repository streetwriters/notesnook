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

import { makeId } from "../utils/id";
import { ICollection } from "./collection";
import {
  Relation,
  ItemMap,
  ItemReference,
  ValueOf,
  MaybeDeletedItem
} from "../types";
import Database from "../api";
import { SQLCollection } from "../database/sql-collection";
import { DatabaseAccessor, DatabaseSchema } from "../database";
import { SelectQueryBuilder } from "kysely";

export class Relations implements ICollection {
  name = "relations";
  readonly collection: SQLCollection<"relations", Relation>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(db.sql, "relations", db.eventManager);
  }

  async init() {
    // return this.collection.init();
  }

  async add(from: ItemReference, to: ItemReference) {
    await this.collection.upsert({
      id: generateId(from, to),
      type: "relation",
      dateCreated: Date.now(),
      dateModified: Date.now(),
      fromId: from.id,
      fromType: from.type,
      toId: to.id,
      toType: to.type
    });
  }

  from<TType extends keyof RelatableTable>(
    reference: ItemReference,
    type: TType
  ) {
    return new RelationsArray(
      this.db.sql,
      this.db.trash.cache,
      reference,
      type,
      "from"
    );
  }

  to<TType extends keyof RelatableTable>(
    reference: ItemReference,
    type: TType
  ) {
    return new RelationsArray(
      this.db.sql,
      this.db.trash.cache,
      reference,
      type,
      "to"
    );
  }

  // get raw() {
  //   return this.collection.raw();
  // }

  // get all(): Relation[] {
  //   return this.collection.items();
  // }

  // relation(id: string) {
  //   return this.collection.get(id);
  // }

  async remove(...ids: string[]) {
    await this.collection.softDelete(ids);
  }

  unlink(from: ItemReference, to: ItemReference) {
    return this.remove(generateId(from, to));
  }

  async unlinkOfType(type: keyof RelatableTable, ids?: string[]) {
    await this.db
      .sql()
      .replaceInto("relations")
      .columns(["id", "dateModified", "deleted"])
      .expression((eb) =>
        eb
          .selectFrom("relations")
          .where((eb) =>
            eb.or([eb("fromType", "==", type), eb("toType", "==", type)])
          )
          .$if(ids !== undefined && ids.length > 0, (eb) =>
            eb.where((eb) =>
              eb.or([eb("fromId", "in", ids), eb("toId", "in", ids)])
            )
          )
          .select((eb) => [
            "relations.id",
            eb.lit(Date.now()).as("dateModified"),
            eb.lit(1).as("deleted")
          ])
      )
      .execute();
  }

  async cleanup() {
    //   for (const relation of this.all) {
    //     const references = [relation.to, relation.from];
    //     for (const reference of references) {
    //       let exists: boolean | undefined = false;
    //       switch (reference.type) {
    //         case "tag":
    //           exists = this.db.tags.exists(reference.id);
    //           break;
    //         case "color":
    //           exists = this.db.colors.exists(reference.id);
    //           break;
    //         case "reminder":
    //           exists = this.db.reminders.exists(reference.id);
    //           break;
    //         case "note":
    //           exists =
    //             this.db.notes.exists(reference.id) ||
    //             this.db.trash.exists(reference.id);
    //           break;
    //         case "notebook":
    //           exists =
    //             this.db.notebooks.exists(reference.id) ||
    //             this.db.trash.exists(reference.id);
    //           break;
    //       }
    //       if (!exists) await this.remove(relation.id);
    //     }
    //   }
    // }
  }
}

/**
 *
 * @param {ItemReference} a
 * @param {ItemReference} b
 */
function compareItemReference(a: ItemReference, b: ItemReference) {
  return a.id === b.id && a.type === b.type;
}

/**
 * Generate deterministic constant id from `a` & `b` item reference.
 * @param {ItemReference} a
 * @param {ItemReference} b
 */
function generateId(a: ItemReference, b: ItemReference) {
  const str = `${a.id}${b.id}${a.type}${b.type}`;
  return makeId(str);
}

const TABLE_MAP = {
  note: "notes",
  notebook: "notebooks",
  reminder: "reminders",
  tag: "tags",
  color: "colors",
  attachment: "attachments"
} as const;

type RelatableTable = typeof TABLE_MAP;

class RelationsArray<TType extends keyof RelatableTable> {
  private table: ValueOf<RelatableTable> = TABLE_MAP[this.type];

  constructor(
    private readonly sql: DatabaseAccessor,
    private readonly trashIds: string[],
    private readonly reference: ItemReference,
    private readonly type: TType,
    private readonly direction: "from" | "to"
  ) {}

  async resolve(limit?: number): Promise<ItemMap[TType][]> {
    const items = await this.sql()
      .selectFrom(this.table)
      .where("id", "in", (b) =>
        b
          .selectFrom("relations")
          .$call((eb) =>
            this.buildRelationsQuery()(
              eb as SelectQueryBuilder<DatabaseSchema, "relations", unknown>
            )
          )
      )
      .$if(limit !== undefined && limit > 0, (b) => b.limit(limit!))
      .selectAll()
      // TODO: check if we need to index deleted field.
      .where("deleted", "is", null)
      .execute();
    return items as unknown as ItemMap[TType][];
  }

  async unlink() {
    await this.sql()
      .replaceInto("relations")
      .columns(["id", "dateModified", "deleted"])
      .expression((eb) =>
        eb
          .selectFrom("relations")
          .$call(this.buildRelationsQuery())
          .clearSelect()
          .select((eb) => [
            "relations.id",
            eb.lit(Date.now()).as("dateModified"),
            eb.lit(1).as("deleted")
          ])
      )
      .execute();
  }

  async get() {
    const ids = await this.sql()
      .selectFrom("relations")
      .$call(this.buildRelationsQuery())
      .execute();
    return ids.map((i) => i.id);
  }

  async count() {
    const result = await this.sql()
      .selectFrom("relations")
      .$call(this.buildRelationsQuery())
      .clearSelect()
      .select((b) => b.fn.count<number>("relations.id").as("count"))
      .executeTakeFirst();
    if (!result) return 0;
    return result.count;
  }

  async has(id: string) {
    const result = await this.sql()
      .selectFrom("relations")
      .$call(this.buildRelationsQuery())
      .clearSelect()
      .where(this.direction === "from" ? "toId" : "fromId", "==", id)
      .select((b) => b.fn.count<number>("id").as("count"))
      .executeTakeFirst();
    if (!result) return false;
    return result.count > 0;
  }

  /**
   * Build an optimized query for obtaining relations based on the given
   * parameters. The resulting query uses a covering index (the most
   * optimizable index) for obtaining relations.
   */
  private buildRelationsQuery() {
    return (
      builder: SelectQueryBuilder<DatabaseSchema, "relations", unknown>
    ) => {
      if (this.direction === "to") {
        return builder
          .where("fromType", "==", this.type)
          .where("toType", "==", this.reference.type)
          .where("toId", "==", this.reference.id)
          .$if(
            (this.type === "note" || this.type === "notebook") &&
              this.trashIds.length > 0,
            (b) => b.where("fromId", "not in", this.trashIds)
          )
          .select("relations.fromId as id")
          .$narrowType<{ id: string }>();
      } else {
        return builder
          .where("toType", "==", this.type)
          .where("fromType", "==", this.reference.type)
          .where("fromId", "==", this.reference.id)
          .$if(
            (this.type === "note" || this.type === "notebook") &&
              this.trashIds.length > 0,
            (b) => b.where("toId", "not in", this.trashIds)
          )
          .select("relations.toId as id")
          .$narrowType<{ id: string }>();
      }
    };
  }
}
