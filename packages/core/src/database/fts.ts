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

import { Kysely, sql } from "@streetwriters/kysely";
import { RawDatabaseSchema } from "./index.js";

export async function rebuildSearchIndex(db: Kysely<RawDatabaseSchema>) {
  await db.transaction().execute(async (tx) => {
    for (const query of [
      sql`INSERT INTO content_fts(content_fts) VALUES('delete-all')`,
      sql`INSERT INTO notes_fts(notes_fts) VALUES('delete-all')`
    ]) {
      await query.execute(tx);
    }

    await tx
      .insertInto("content_fts")
      .columns(["rowid", "id", "data", "noteId"])
      .expression((eb) =>
        eb
          .selectFrom("content")
          .where((eb) =>
            eb.and([
              eb("noteId", "is not", null),
              eb("data", "is not", null),
              eb("deleted", "is not", true)
            ])
          )
          .select([
            "rowid",
            "id",
            sql`IIF(locked == 1, '', data)`.as("data"),
            "noteId"
          ])
      )
      .execute();

    await tx
      .insertInto("notes_fts")
      .columns(["rowid", "id", "title"])
      .expression((eb) =>
        eb
          .selectFrom("notes")
          .where((eb) =>
            eb.and([eb("title", "is not", null), eb("deleted", "is not", true)])
          )
          .select(["rowid", "id", "title"])
      )
      .execute();

    for (const query of [
      sql`INSERT INTO content_fts(content_fts) VALUES('optimize')`,
      sql`INSERT INTO notes_fts(notes_fts) VALUES('optimize')`
    ]) {
      await query.execute(tx);
    }
  });
}
