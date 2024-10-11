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
import { DatabaseSchema, RawDatabaseSchema } from "./index.js";

export async function createTriggers(db: Kysely<RawDatabaseSchema>) {
  // content triggers
  await db.schema
    .createTrigger("content_after_insert_content_fts")
    .temporary()
    .ifNotExists()
    .onTable("content", "main")
    .after()
    .addEvent("insert")
    .when((eb) =>
      eb.and([
        eb("new.noteId", "is not", null),
        eb("new.data", "is not", null),
        eb("new.deleted", "is not", true)
      ])
    )
    .addQuery((c) =>
      c.insertInto("content_fts").values({
        rowid: sql`new.rowid`,
        id: sql`new.id`,
        data: sql`IIF(new.locked == 1, '', new.data)`,
        noteId: sql`new.noteId`
      })
    )
    .execute();

  await db.schema
    .createTrigger("content_after_delete_content_fts")
    .temporary()
    .ifNotExists()
    .onTable("content", "main")
    .after()
    .addEvent("delete")
    .when((eb) =>
      eb.and([
        eb("old.noteId", "is not", null),
        eb("old.data", "is not", null),
        eb("old.deleted", "is not", true)
      ])
    )
    .addQuery((c) =>
      c.insertInto("content_fts").values({
        content_fts: sql.lit("delete"),
        rowid: sql.ref("old.rowid"),
        id: sql.ref("old.id"),
        data: sql`IIF(old.locked == 1, '', old.data)`,
        noteId: sql.ref("old.noteId")
      })
    )
    .execute();

  await db.schema
    .createTrigger("content_after_update_content_fts")
    .temporary()
    .ifNotExists()
    .onTable("content", "main")
    .after()
    .addEvent("update")
    .when((eb) =>
      eb.and([
        eb("old.noteId", "is not", null),
        eb("old.data", "is not", null),
        eb("old.deleted", "is not", true)
      ])
    )
    .addQuery((c) =>
      c.insertInto("content_fts").values({
        content_fts: sql.lit("delete"),
        rowid: sql.ref("old.rowid"),
        id: sql.ref("old.id"),
        data: sql`IIF(old.locked == 1, '', old.data)`,
        noteId: sql.ref("old.noteId")
      })
    )
    .addQuery((c) =>
      c.insertInto("content_fts").values({
        rowid: sql`new.rowid`,
        id: sql`new.id`,
        data: sql`IIF(new.locked == 1, '', new.data)`,
        noteId: sql`new.noteId`
      })
    )
    .execute();

  // notes triggers
  await db.schema
    .createTrigger("notes_after_insert_notes_fts")
    .temporary()
    .ifNotExists()
    .onTable("notes", "main")
    .after()
    .addEvent("insert")
    .when((eb) =>
      eb.and([
        eb("new.title", "is not", null),
        eb("new.deleted", "is not", true)
      ])
    )
    .addQuery((c) =>
      c.insertInto("notes_fts").values({
        rowid: sql`new.rowid`,
        id: sql.ref("new.id"),
        title: sql.ref("new.title")
      })
    )
    .execute();

  await db.schema
    .createTrigger("notes_after_delete_notes_fts")
    .temporary()
    .ifNotExists()
    .onTable("notes", "main")
    .after()
    .addEvent("delete")
    .when((eb) =>
      eb.and([
        eb("old.title", "is not", null),
        eb("old.deleted", "is not", true)
      ])
    )
    .addQuery((c) =>
      c.insertInto("notes_fts").values({
        notes_fts: sql.lit("delete"),
        rowid: sql.ref("old.rowid"),
        id: sql.ref("old.id"),
        title: sql.ref("old.title")
      })
    )
    .execute();

  await db.schema
    .createTrigger("notes_after_update_notes_fts")
    .temporary()
    .ifNotExists()
    .onTable("notes", "main")
    .after()
    .addEvent("update")
    .when((eb) =>
      eb.and([
        eb("old.deleted", "is not", true),
        eb("old.title", "is not", null)
      ])
    )
    .addQuery((c) =>
      c.insertInto("notes_fts").values({
        notes_fts: sql.lit("delete"),
        rowid: sql.ref("old.rowid"),
        id: sql.ref("old.id"),
        title: sql.ref("old.title")
      })
    )
    .addQuery((c) =>
      c.insertInto("notes_fts").values({
        rowid: sql`new.rowid`,
        id: sql.ref("new.id"),
        title: sql.ref("new.title")
      })
    )
    .execute();
}

export async function dropTriggers(db: Kysely<DatabaseSchema>) {
  await db.schema.dropTrigger("content_after_insert_content_fts").execute();
  await db.schema.dropTrigger("content_after_delete_content_fts").execute();
  await db.schema.dropTrigger("content_after_update_content_fts").execute();
  await db.schema.dropTrigger("notes_after_insert_notes_fts").execute();
  await db.schema.dropTrigger("notes_after_delete_notes_fts").execute();
  await db.schema.dropTrigger("notes_after_update_notes_fts").execute();
}
