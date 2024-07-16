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

export class ConfigStorage {
  private readonly db: DatabaseAccessor<RawDatabaseSchema>;
  constructor(db: DatabaseAccessor) {
    this.db = db as unknown as DatabaseAccessor<RawDatabaseSchema>;
  }

  async getItem(name: string): Promise<unknown | undefined> {
    const result = await this.db()
      .selectFrom("config")
      .where("name", "==", name)
      .select("value")
      .limit(1)
      .executeTakeFirst();
    if (!result?.value) return;
    return JSON.parse(result.value);
  }

  async setItem(name: string, value: unknown) {
    await this.db()
      .replaceInto("config")
      .values({
        name,
        value: JSON.stringify(value),
        dateModified: Date.now()
      })
      .execute();
  }

  async removeItem(name: string) {
    await this.db().deleteFrom("config").where("name", "==", name).execute();
  }

  async clear() {
    await this.db().deleteFrom("config").execute();
  }
}
