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

import { CreateTableBuilder, Migration, MigrationProvider, sql } from "kysely";

export class NNMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return {
      "1": {
        async up(db) {
          await db.schema
            .createTable("notes")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("title", "text")
            .addColumn("headline", "text")
            .addColumn("contentId", "text")
            .addColumn("pinned", "boolean")
            .addColumn("locked", "boolean")
            .addColumn("favorite", "boolean")
            .addColumn("localOnly", "boolean")
            .addColumn("conflicted", "boolean")
            .addColumn("readonly", "boolean")
            .addColumn("dateEdited", "integer")
            .addColumn("dateDeleted", "integer")
            .addColumn("itemType", "text")
            .addForeignKeyConstraint(
              "note_has_content",
              ["contentId"],
              "content",
              ["id"],
              (b) => b.onDelete("restrict").onUpdate("restrict")
            )
            .execute();

          await db.schema
            .createTable("content")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("noteId", "text")
            .addColumn("data", "text")
            .addColumn("localOnly", "boolean")
            .addColumn("conflicted", "text")
            .addColumn("sessionId", "text")
            .addColumn("dateEdited", "integer")
            .addColumn("dateResolved", "integer")
            .execute();

          await db.schema
            .createTable("notebooks")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("title", "text")
            .addColumn("description", "text")
            .addColumn("dateEdited", "text")
            .addColumn("pinned", "boolean")
            .execute();

          await db.schema
            .createTable("tags")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("title", "text")
            .execute();

          await db.schema
            .createTable("colors")
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("title", "text")
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
            .addColumn("title", "text")
            .addColumn("description", "text")
            .addColumn("priority", "text")
            .addColumn("date", "integer")
            .addColumn("mode", "text")
            .addColumn("recurringMode", "text")
            .addColumn("selectedDays", "blob")
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
            .addColumn("encryptionKey", "text")
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
