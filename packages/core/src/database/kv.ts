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

import { sql } from "@streetwriters/kysely";
import { LazyDatabaseAccessor, RawDatabaseSchema } from "./index.js";
import { Token } from "../api/token-manager.js";
import { User } from "../types.js";

interface KV {
  v: number;
  lastSynced: number;
  user: User;
  token: Token;
  monographs: string[];
  deviceId: string;
  lastBackupTime: number;
  lastFullBackupTime: number;
  fullOfflineMode: boolean;
  masterKeyChangeStartedAt: number;
  /**
   * Revision of the user when the current master key was set.
   */
  masterKeyRevision: number;
}

export const KEYS: (keyof KV)[] = [
  "v",
  "lastSynced",
  "user",
  "token",
  "monographs",
  "deviceId",
  "lastBackupTime",
  "lastFullBackupTime",
  "fullOfflineMode"
];

export class KVStorage {
  private readonly db: LazyDatabaseAccessor<RawDatabaseSchema>;
  constructor(db: LazyDatabaseAccessor) {
    this.db = db as unknown as LazyDatabaseAccessor<RawDatabaseSchema>;
  }

  async read<T extends keyof KV>(key: T): Promise<KV[T] | undefined> {
    const result = await this.db().then((db) =>
      db
        .selectFrom("kv")
        .where("key", "==", key)
        .select("value")
        .limit(1)
        .executeTakeFirst()
    );
    if (!result?.value) return;
    return JSON.parse(result.value) as KV[T];
  }

  async write<T extends keyof KV>(key: T, value: KV[T]) {
    await this.db().then((db) =>
      db
        .replaceInto("kv")
        .values({
          key,
          value: JSON.stringify(value),
          dateModified: Date.now()
        })
        .execute()
    );
  }

  /**
   * Writes the user unless the stored user (of the same account) has a newer
   * revision, so a user fetched before a change to its keys can never replace
   * the changed user.
   */
  async writeUser(user: User) {
    await this.db.then((db) =>
      db
        .insertInto("kv")
        .values({
          key: "user",
          value: JSON.stringify(user),
          dateModified: Date.now()
        })
        .onConflict((oc) =>
          oc
            .column("key")
            .doUpdateSet({
              value: sql`excluded.value`,
              dateModified: sql`excluded.dateModified`
            })
            .where(
              sql<boolean>`json_extract(kv.value, '$.id') is not json_extract(excluded.value, '$.id')
                or coalesce(json_extract(kv.value, '$.revision'), -1) <= coalesce(json_extract(excluded.value, '$.revision'), -1)`
            )
        )
        .execute()
    );
  }

  async delete<T extends keyof KV>(key: T) {
    await this.db().then((db) =>
      db.deleteFrom("kv").where("key", "==", key).execute()
    );
  }

  async clear() {
    await this.db().then((db) => db.deleteFrom("kv").execute());
  }
}
