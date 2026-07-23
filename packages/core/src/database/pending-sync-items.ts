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

import { DatabaseAccessor, RawDatabaseSchema } from "./index.js";
import { PendingSyncItem } from "../types.js";

export class PendingSyncItems {
  constructor(private readonly db: DatabaseAccessor<RawDatabaseSchema>) {}

  async add(item: PendingSyncItem) {
    await this.db().replaceInto("pendingsyncitems").values(item).execute();
  }

  async getByType(type: PendingSyncItem["type"]) {
    const result = await this.db()
      .selectFrom("pendingsyncitems")
      .where("type", "==", type)
      .selectAll()
      .execute();
    return result as PendingSyncItem[];
  }

  async remove(ids: string[]) {
    if (ids.length === 0) return;

    await this.db()
      .deleteFrom("pendingsyncitems")
      .where("id", "in", ids)
      .execute();
  }
}
