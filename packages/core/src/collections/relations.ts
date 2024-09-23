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

import { makeId } from "../utils/id.js";
import { ICollection } from "./collection.js";
import {
  Relation,
  ItemMap,
  ItemReference,
  ItemReferences,
  ValueOf
} from "../types.js";
import Database from "../api/index.js";
import { FilteredSelector, SQLCollection } from "../database/sql-collection.js";
import { DatabaseSchema, UnlinkEvent, isFalse } from "../database/index.js";
import { SelectQueryBuilder } from "@streetwriters/kysely";
import { EVENTS } from "../common.js";

export class Relations implements ICollection {
  name = "relations";
  readonly collection: SQLCollection<"relations", Relation>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCollection(
      db.sql,
      db.transaction,
      "relations",
      db.eventManager,
      db.sanitizer
    );
  }

  async init() {
    // await this.buildCache();
    await this.collection.init();
  }

  async add(from: ItemReference, to: ItemReference) {
    if (!from.id || !to.id) throw new Error("Invalid item reference.");
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

  from(
    reference: ItemReference | ItemReferences
  ): RelationsArray<keyof RelatableTable>;
  from(
    reference: ItemReference | ItemReferences,
    types: (keyof RelatableTable)[]
  ): RelationsArray<keyof RelatableTable>;
  from<TType extends keyof RelatableTable>(
    reference: ItemReference | ItemReferences,
    type: TType
  ): RelationsArray<TType>;
  from<TType extends keyof RelatableTable = keyof RelatableTable>(
    reference: ItemReference | ItemReferences,
    type?: TType | keyof RelatableTable[]
  ) {
    return new RelationsArray(
      this.db,
      reference,
      type ? (Array.isArray(type) ? type : ([type] as TType[])) : undefined,
      "from"
    );
  }

  to(
    reference: ItemReference | ItemReferences
  ): RelationsArray<keyof RelatableTable>;
  to(
    reference: ItemReference | ItemReferences,
    types: (keyof RelatableTable)[]
  ): RelationsArray<keyof RelatableTable>;
  to<TType extends keyof RelatableTable>(
    reference: ItemReference | ItemReferences,
    type: TType
  ): RelationsArray<TType>;
  to<TType extends keyof RelatableTable = keyof RelatableTable>(
    reference: ItemReference | ItemReferences,
    type?: TType | keyof RelatableTable[]
  ) {
    return new RelationsArray(
      this.db,
      reference,
      type ? (Array.isArray(type) ? type : ([type] as TType[])) : undefined,
      "to"
    );
  }

  fromCache: Map<string, string[]> = new Map();
  toCache: Map<string, string[]> = new Map();
  async buildCache() {
    console.time("cache build");
    this.fromCache.clear();
    this.toCache.clear();

    console.time("query");
    const relations = await this.db
      .sql()
      .selectFrom("relations")
      .select(["toId", "fromId"])
      .$narrowType<{ toId: string; fromId: string }>()
      .execute();
    console.timeEnd("query");
    for (const { fromId, toId } of relations) {
      const fromIds = this.fromCache.get(fromId) || [];
      fromIds.push(toId);
      this.fromCache.set(fromId, fromIds);

      const toIds = this.toCache.get(toId) || [];
      toIds.push(fromId);
      this.toCache.set(toId, toIds);
    }
    console.timeEnd("cache build");
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

  async unlink(from: ItemReference, to: ItemReference) {
    await this.remove(generateId(from, to));
    this.db.eventManager.publish(EVENTS.databaseUpdated, <UnlinkEvent>{
      collection: "relations",
      type: "unlink",
      reference: to,
      direction: "from",
      types: [from.type]
    });
  }

  async unlinkOfType(type: keyof RelatableTable, ids?: string[]) {
    await this.db
      .sql()
      .replaceInto("relations")
      .columns(["id", "dateModified", "deleted", "synced"])
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
            eb.lit(1).as("deleted"),
            eb.lit(0).as("synced")
          ])
      )
      .execute();

    this.db.eventManager.publish(EVENTS.databaseUpdated, <UnlinkEvent>{
      collection: "relations",
      type: "unlink",
      reference: { type: type, ids: ids || [] },
      direction: "from",
      types: Object.keys(TABLE_MAP)
    });
    this.db.eventManager.publish(EVENTS.databaseUpdated, <UnlinkEvent>{
      collection: "relations",
      type: "unlink",
      reference: { type: type, ids: ids || [] },
      direction: "to",
      types: Object.keys(TABLE_MAP)
    });
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
  attachment: "attachments",
  vault: "vaults"
} as const;

type RelatableTable = typeof TABLE_MAP;

class RelationsArray<TType extends keyof RelatableTable> {
  constructor(
    private readonly db: Database,
    private readonly reference: ItemReference | ItemReferences,
    private readonly types: TType[] | undefined,
    private readonly direction: "from" | "to"
  ) {}

  get selector() {
    if (!this.types)
      throw new Error("Cannot use selector when no tables are specified.");
    if (this.types.length > 1)
      throw new Error(
        "Cannot use selector when more than 1 tables are specified."
      );
    const table: ValueOf<RelatableTable> = TABLE_MAP[this.types[0]];
    return new FilteredSelector<ItemMap[TType]>(
      table,
      this.db
        .sql()
        .selectFrom<keyof DatabaseSchema>(table)
        .where("id", "in", (b) =>
          b
            .selectFrom("relations")
            .$call((eb) =>
              this.buildRelationsQuery()(
                eb as SelectQueryBuilder<DatabaseSchema, "relations", unknown>
              )
            )
        )
        // TODO: check if we need to index deleted field.
        .where(isFalse("deleted")),
      this.db.options?.batchSize
    );
  }

  async resolve(limit?: number) {
    const items = await this.selector.filter
      .$if(limit !== undefined && limit > 0, (b) => b.limit(limit!))
      .selectAll()
      .execute();
    return items as unknown as ItemMap[TType][];
  }

  async unlink() {
    await this.db
      .sql()
      .replaceInto("relations")
      .columns(["id", "dateModified", "deleted", "synced"])
      .expression((eb) =>
        eb
          .selectFrom("relations")
          .$call(this.buildRelationsQuery())
          .clearSelect()
          .select((eb) => [
            "relations.id",
            eb.lit(Date.now()).as("dateModified"),
            eb.lit(true).as("deleted"),
            eb.lit(false).as("synced")
          ])
      )
      .execute();

    this.db.eventManager.publish(EVENTS.databaseUpdated, <UnlinkEvent>{
      collection: "relations",
      type: "unlink",
      reference: this.reference,
      direction: this.direction,
      types: this.types
    });
  }

  async get() {
    const relations = await this.db
      .sql()
      .selectFrom("relations")
      .$call(this.buildRelationsQuery())
      .clearSelect()
      .select(["fromId", "toId", "fromType", "toType"])
      .$narrowType<{
        fromId: string;
        toId: string;
        fromType: keyof ItemMap;
        toType: keyof ItemMap;
      }>()
      .execute();
    return relations;
  }

  async count() {
    const result = await this.db
      .sql()
      .selectFrom("relations")
      .$call(this.buildRelationsQuery())
      .clearSelect()
      .select((b) => b.fn.count<number>("relations.id").as("count"))
      .executeTakeFirst();
    if (!result) return 0;
    return result.count;
  }

  async has(...ids: string[]) {
    const result = await this.db
      .sql()
      .selectFrom("relations")
      .$call(this.buildRelationsQuery())
      .clearSelect()
      .where(this.direction === "from" ? "toId" : "fromId", "in", ids)
      .select((b) => b.fn.count<number>("id").as("count"))
      .executeTakeFirst();
    if (!result) return false;
    return result.count > 0;
  }

  async hasAll(...ids: string[]) {
    const result = await this.db
      .sql()
      .selectFrom("relations")
      .$call(this.buildRelationsQuery())
      .clearSelect()
      .where(this.direction === "from" ? "toId" : "fromId", "in", ids)
      .select((b) => b.fn.count<number>("id").as("count"))
      .executeTakeFirst();
    if (!result) return false;
    return result.count === ids.length;
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
          .$if(!!this.types, (eb) =>
            eb.where(
              "fromType",
              this.types!.length > 1 ? "in" : "==",
              this.types!.length > 1 ? this.types : this.types![0]
            )
          )
          .where("toType", "==", this.reference.type)
          .where(
            "toId",
            isItemReferences(this.reference) ? "in" : "==",
            isItemReferences(this.reference)
              ? this.reference.ids
              : this.reference.id
          )
          .$if(
            !!this.types?.includes("note" as TType) &&
              this.db.trash.cache.notes.length > 0,
            (b) => b.where("fromId", "not in", this.db.trash.cache.notes)
          )
          .$if(
            !!this.types?.includes("notebook" as TType) &&
              this.db.trash.cache.notebooks.length > 0,
            (b) => b.where("fromId", "not in", this.db.trash.cache.notebooks)
          )
          .select("relations.fromId as id")
          .$narrowType<{ id: string }>();
      } else {
        return builder
          .$if(!!this.types, (eb) =>
            eb.where(
              "toType",
              this.types!.length > 1 ? "in" : "==",
              this.types!.length > 1 ? this.types : this.types![0]
            )
          )
          .where("fromType", "==", this.reference.type)
          .where(
            "fromId",
            isItemReferences(this.reference) ? "in" : "==",
            isItemReferences(this.reference)
              ? this.reference.ids
              : this.reference.id
          )
          .$if(
            !!this.types?.includes("note" as TType) &&
              this.db.trash.cache.notes.length > 0,
            (b) => b.where("toId", "not in", this.db.trash.cache.notes)
          )
          .$if(
            !!this.types?.includes("notebook" as TType) &&
              this.db.trash.cache.notebooks.length > 0,
            (b) => b.where("toId", "not in", this.db.trash.cache.notebooks)
          )
          .select("relations.toId as id")
          .$narrowType<{ id: string }>();
      }
    };
  }
}

function isItemReferences(
  ref: ItemReference | ItemReferences
): ref is ItemReferences {
  return "ids" in ref;
}
