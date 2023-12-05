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

import {
  ColumnBuilderCallback,
  CreateTableBuilder,
  Kysely,
  Migration,
  MigrationProvider,
  sql
} from "kysely";

const COLLATE_NOCASE: ColumnBuilderCallback = (col) =>
  col.modifyEnd(sql`collate nocase`);

export class NNMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return {
      "1": {
        async up(db) {
          await db.schema
            .createTable("notes")
            // .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .$call(addTrashColumns)
            .addColumn("title", "text", COLLATE_NOCASE)
            .addColumn("headline", "text")
            .addColumn("contentId", "text")
            .addColumn("pinned", "boolean")
            .addColumn("locked", "boolean")
            .addColumn("favorite", "boolean")
            .addColumn("localOnly", "boolean")
            .addColumn("conflicted", "boolean")
            .addColumn("readonly", "boolean")
            .addColumn("dateEdited", "integer")
            .execute();
          await createFTS5Table(db, "notes", ["title"]);

          await db.schema
            .createTable("content")
            // .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("noteId", "text")
            .addColumn("data", "text")
            .addColumn("locked", "boolean")
            .addColumn("localOnly", "boolean")
            .addColumn("conflicted", "text")
            .addColumn("sessionId", "text")
            .addColumn("dateEdited", "integer")
            .addColumn("dateResolved", "integer")
            .execute();
          await createFTS5Table(
            db,
            "content",
            ["data"],
            ["noteId"],
            ["(new.locked is null or new.locked == 0)"]
          );

          await db.schema
            .createTable("notehistory")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("noteId", "text")
            .addColumn("sessionContentId", "text")
            .addColumn("localOnly", "boolean")
            .addColumn("locked", "boolean")
            .execute();

          await db.schema
            .createTable("sessioncontent")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("data", "text")
            .addColumn("contentType", "text")
            .addColumn("locked", "boolean")
            .addColumn("compressed", "boolean")
            .addColumn("localOnly", "boolean")
            .execute();

          await db.schema
            .createTable("notebooks")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .$call(addTrashColumns)
            .addColumn("title", "text", COLLATE_NOCASE)
            .addColumn("description", "text")
            .addColumn("dateEdited", "integer")
            .addColumn("pinned", "boolean")
            .execute();

          await db.schema
            .createTable("tags")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("title", "text", COLLATE_NOCASE)
            .execute();

          await db.schema
            .createTable("colors")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("title", "text", COLLATE_NOCASE)
            .addColumn("colorCode", "text")
            .execute();

          await db.schema
            .createTable("relations")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("fromType", "text")
            .addColumn("fromId", "text")
            .addColumn("toType", "text")
            .addColumn("toId", "text")
            .execute();

          await db.schema
            .createTable("shortcuts")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("sortIndex", "integer")
            .addColumn("itemId", "text")
            .addColumn("itemType", "text")
            .execute();

          await db.schema
            .createTable("reminders")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("title", "text", COLLATE_NOCASE)
            .addColumn("description", "text")
            .addColumn("priority", "text")
            .addColumn("date", "integer")
            .addColumn("mode", "text")
            .addColumn("recurringMode", "text")
            .addColumn("selectedDays", "text")
            .addColumn("localOnly", "boolean")
            .addColumn("disabled", "boolean")
            .addColumn("snoozeUntil", "integer")
            .execute();

          await db.schema
            .createTable("attachments")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("iv", "text")
            .addColumn("salt", "text")
            .addColumn("size", "integer")
            .addColumn("alg", "text")
            .addColumn("key", "text")
            .addColumn("chunkSize", "integer")
            .addColumn("hash", "text", (c) => c.unique())
            .addColumn("hashType", "text")
            .addColumn("mimeType", "text")
            .addColumn("filename", "text")
            .addColumn("dateDeleted", "integer")
            .addColumn("dateUploaded", "integer")
            .addColumn("failed", "text")
            .execute();

          await db.schema
            .createTable("settings")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("key", "text")
            .addColumn("value", "text")
            .execute();

          await db.schema
            .createIndex("notehistory_noteid")
            .on("notehistory")
            .column("noteId")
            .execute();

          await db.schema
            .createIndex("relation_from_general")
            .on("relations")
            .columns(["fromType", "toType", "fromId"])
            .where("toType", "!=", "note")
            .where("toType", "!=", "notebook")
            .execute();

          await db.schema
            .createIndex("relation_to_general")
            .on("relations")
            .columns(["fromType", "toType", "toId"])
            .where("fromType", "!=", "note")
            .where("fromType", "!=", "notebook")
            .execute();

          await db.schema
            .createIndex("relation_from_note_notebook")
            .on("relations")
            .columns(["fromType", "toType", "fromId", "toId"])
            .where((eb) =>
              eb.or([
                eb("toType", "==", "note"),
                eb("toType", "==", "notebook")
              ])
            )
            .execute();

          await db.schema
            .createIndex("relation_to_note_notebook")
            .on("relations")
            .columns(["fromType", "toType", "toId", "fromId"])
            .where((eb) =>
              eb.or([
                eb("fromType", "==", "note"),
                eb("fromType", "==", "notebook")
              ])
            )
            .execute();

          await db.schema
            .createIndex("note_type")
            .on("notes")
            .columns(["type"])
            .execute();

          await db.schema
            .createIndex("note_deleted")
            .on("notes")
            .columns(["deleted"])
            .execute();

          await db.schema
            .createIndex("note_date_deleted")
            .on("notes")
            .columns(["dateDeleted"])
            .execute();

          await db.schema
            .createIndex("notebook_type")
            .on("notebooks")
            .columns(["type"])
            .execute();

          await db.schema
            .createIndex("attachment_hash")
            .on("attachments")
            .column("hash")
            .execute();
        },
        async down(db) {}
      }
    };
  }
}

const addBaseColumns = <T extends string, C extends string = never>(
  builder: CreateTableBuilder<T, C>
) => {
  return builder
    .addColumn("id", "text", (c) => c.primaryKey().unique().notNull())
    .addColumn("type", "text")
    .addColumn("dateModified", "integer")
    .addColumn("dateCreated", "integer")
    .addColumn("synced", "boolean")
    .addColumn("deleted", "boolean");
};

const addTrashColumns = <T extends string, C extends string = never>(
  builder: CreateTableBuilder<T, C>
) => {
  return builder

    .addColumn("dateDeleted", "integer")
    .addColumn("itemType", "text");
};

async function createFTS5Table(
  db: Kysely<any>,
  table: string,
  indexedColumns: string[],
  unindexedColumns: string[] = [],
  insertConditions: string[] = []
) {
  const ref = sql.raw(table);
  const ref_fts = sql.raw(table + "_fts");
  const ref_ai = sql.raw(table + "_ai");
  const ref_ad = sql.raw(table + "_ad");
  const ref_au = sql.raw(table + "_au");
  const indexed_cols = sql.raw(indexedColumns.join(", "));
  const unindexed_cols =
    unindexedColumns.length > 0
      ? sql.raw(unindexedColumns.join(" UNINDEXED,") + " UNINDEXED,")
      : sql.raw("");
  const new_indexed_cols = sql.raw(indexedColumns.join(", new."));
  const old_indexed_cols = sql.raw(indexedColumns.join(", old."));
  await sql`CREATE VIRTUAL TABLE ${ref_fts} USING fts5(
    id UNINDEXED, ${unindexed_cols} ${indexed_cols}, content='${sql.raw(
    table
  )}', tokenize='porter trigram'
  )`.execute(db);
  insertConditions = [
    "(new.deleted is null or new.deleted == 0)",
    ...insertConditions
  ];
  await sql`CREATE TRIGGER ${ref_ai} AFTER INSERT ON ${ref} WHEN ${sql.raw(
    insertConditions.join(" AND ")
  )}
  BEGIN
    INSERT INTO ${ref_fts}(rowid, id, ${indexed_cols}) VALUES (new.rowid, new.id, new.${new_indexed_cols});
  END;`.execute(db);
  await sql`CREATE TRIGGER ${ref_ad} AFTER DELETE ON ${ref}
  BEGIN
    INSERT INTO ${ref_fts} (${ref_fts}, rowid, id, ${indexed_cols})
    VALUES ('delete', old.rowid, old.id, old.${old_indexed_cols});
  END;`.execute(db);
  await sql`CREATE TRIGGER ${ref_au} AFTER UPDATE ON ${ref}
  BEGIN
    INSERT INTO ${ref_fts} (${ref_fts}, rowid, id, ${indexed_cols})
    VALUES ('delete', old.rowid, old.id, old.${old_indexed_cols});
    INSERT INTO ${ref_fts} (rowid, id, ${indexed_cols})
    VALUES (new.rowid, new.id, new.${new_indexed_cols});
  END;`.execute(db);
}
