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

import { DatabaseAccessor, RawDatabaseSchema } from ".";
import { Token } from "../api/token-manager";
import { User } from "../types";

interface KV {
  v: number;
  lastSynced: number;
  user: User;
  token: Token;
  monographs: string[];
  deviceId: string;
  lastBackupTime: number;
  fullOfflineMode: boolean;
}

export const KEYS: (keyof KV)[] = [
  "v",
  "lastSynced",
  "user",
  "token",
  "monographs",
  "deviceId",
  "lastBackupTime",
  "fullOfflineMode"
];

export class KVStorage {
  private readonly db: DatabaseAccessor<RawDatabaseSchema>;
  constructor(db: DatabaseAccessor) {
    this.db = db as unknown as DatabaseAccessor<RawDatabaseSchema>;
  }

  async read<T extends keyof KV>(key: T): Promise<KV[T] | undefined> {
    const result = await this.db()
      .selectFrom("kv")
      .where("key", "==", key)
      .select("value")
      .limit(1)
      .executeTakeFirst();
    if (!result?.value) return;
    return JSON.parse(result.value) as KV[T];
  }

  async write<T extends keyof KV>(key: T, value: KV[T]) {
    await this.db()
      .replaceInto("kv")
      .values({
        key,
        value: JSON.stringify(value),
        dateModified: Date.now()
      })
      .execute();
  }

  async delete<T extends keyof KV>(key: T) {
    await this.db().deleteFrom("kv").where("key", "==", key).execute();
  }

  async clear() {
    await this.db().deleteFrom("kv").execute();
  }
}
