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

import { EVENTS } from "../common";
import { isDeleted } from "../types";
import EventManager from "../utils/event-manager";
import {
  DatabaseAccessor,
  DatabaseCollection,
  DatabaseSchema,
  SQLiteItem
} from ".";

export class SQLCollection<
  TCollectionType extends keyof DatabaseSchema,
  T extends DatabaseSchema[TCollectionType] = DatabaseSchema[TCollectionType]
> implements DatabaseCollection<SQLiteItem<T>, true>
{
  constructor(
    private readonly db: DatabaseAccessor,
    private readonly type: TCollectionType,
    private readonly eventManager: EventManager
  ) {}

  async clear() {
    await this.db().deleteFrom(this.type).execute();
  }

  async init() {}

  async upsert(item: SQLiteItem<T>) {
    if (!item.id) throw new Error("The item must contain the id field.");
    if (!item.deleted) item.dateCreated = item.dateCreated || Date.now();
    this.eventManager.publish(EVENTS.databaseUpdated, item.id, item);

    // if item is newly synced, remote will be true.
    if (!item.remote) {
      item.dateModified = Date.now();
      item.synced = false;
    }
    // the item has become local now, so remove the flags
    delete item.remote;

    await this.db()
      .replaceInto<keyof DatabaseSchema>(this.type)
      .values(item)
      .execute();
  }

  async softDelete(ids: string[]) {
    this.eventManager.publish(EVENTS.databaseUpdated, ids);
    await this.db()
      .replaceInto<keyof DatabaseSchema>(this.type)
      .values(
        ids.map((id) => ({
          id,
          deleted: true,
          dateModified: Date.now()
        }))
      )
      .execute();
  }

  async delete(ids: string[]) {
    this.eventManager.publish(EVENTS.databaseUpdated, ids);
    await this.db()
      .deleteFrom<keyof DatabaseSchema>(this.type)
      .where("id", "in", ids)
      .execute();
  }

  async exists(id: string) {
    const { count } =
      (await this.db()
        .selectFrom<keyof DatabaseSchema>(this.type)
        .select((a) => a.fn.count<number>("id").as("count"))
        .where("id", "==", id)
        .limit(1)
        .executeTakeFirst()) || {};

    return count !== undefined && count > 0;
  }

  async count() {
    const { count } =
      (await this.db()
        .selectFrom<keyof DatabaseSchema>(this.type)
        .select((a) => a.fn.count<number>("id").as("count"))
        .where("deleted", "is", null)
        .executeTakeFirst()) || {};
    return count || 0;
  }

  async get(id: string) {
    const item = await this.db()
      .selectFrom<keyof DatabaseSchema>(this.type)
      .selectAll()
      .where("id", "==", id)
      .executeTakeFirst();
    if (!item || isDeleted(item)) return;
    return item as T;
  }

  async put(items: (SQLiteItem<T> | undefined)[]) {
    const entries = items.reduce((array, item) => {
      if (!item) return array;
      if (!item.remote) {
        item.dateModified = Date.now();
        item.synced = false;
      }
      delete item.remote;
      array.push(item);
      return array;
    }, [] as SQLiteItem<T>[]);

    await this.db()
      .replaceInto<keyof DatabaseSchema>(this.type)
      .values(entries)
      .execute();
  }

  async update(ids: string[], partial: Partial<SQLiteItem<T>>) {
    await this.db()
      .updateTable<keyof DatabaseSchema>(this.type)
      .where("id", "in", ids)
      .set({
        ...partial,
        dateModified: Date.now()
      })
      .execute();
  }
}
