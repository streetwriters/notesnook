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
  ExpressionBuilder,
  Kysely,
  Migration,
  MigrationProvider,
  sql
} from "@streetwriters/kysely";
import { rebuildSearchIndex } from "./fts.js";
import type { RawDatabaseSchema } from "./index.js";

const COLLATE_NOCASE: ColumnBuilderCallback = (col) =>
  col.modifyEnd(sql`collate nocase`);

export class NNMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return {
      "1": {
        async up(db) {
          await db.schema
            .createTable("kv")
            .ifNotExists()
            .modifyEnd(sql`without rowid`)
            .addColumn("key", "text", (c) => c.primaryKey().unique().notNull())
            .addColumn("value", "text")
            .addColumn("dateModified", "integer")
            .execute();

          await db.schema
            .createTable("notes")
            .ifNotExists()
            // .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .$call(addTrashColumns)
            .addColumn("title", "text", COLLATE_NOCASE)
            .addColumn("headline", "text")
            .addColumn("contentId", "text")
            .addColumn("pinned", "boolean")
            .addColumn("favorite", "boolean")
            .addColumn("localOnly", "boolean")
            .addColumn("conflicted", "boolean")
            .addColumn("readonly", "boolean")
            .addColumn("dateEdited", "integer")
            .execute();

          await createFTS5Table(
            "notes_fts",
            [{ name: "id" }, { name: "title" }],
            { contentTable: "notes", tokenizer: ["porter", "trigram"] }
          ).execute(db);

          await db.schema
            .createTable("content")
            .ifNotExists()
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
            "content_fts",
            [{ name: "id" }, { name: "noteId" }, { name: "data" }],
            { contentTable: "content", tokenizer: ["porter", "trigram"] }
          ).execute(db);

          await db.schema
            .createTable("notehistory")
            .ifNotExists()
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("noteId", "text")
            .addColumn("sessionContentId", "text")
            .addColumn("localOnly", "boolean")
            .addColumn("locked", "boolean")
            .execute();

          await db.schema
            .createTable("sessioncontent")
            .ifNotExists()
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
            .ifNotExists()
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
            .ifNotExists()
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("title", "text", COLLATE_NOCASE)
            .execute();

          await db.schema
            .createTable("colors")
            .ifNotExists()
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("title", "text", COLLATE_NOCASE)
            .addColumn("colorCode", "text", (c) => c.unique())
            .execute();

          await db.schema
            .createTable("vaults")
            .ifNotExists()
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("title", "text", COLLATE_NOCASE)
            .addColumn("key", "text")
            .execute();

          await db.schema
            .createTable("relations")
            .ifNotExists()
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("fromType", "text")
            .addColumn("fromId", "text")
            .addColumn("toType", "text")
            .addColumn("toId", "text")
            .execute();

          await db.schema
            .createTable("shortcuts")
            .ifNotExists()
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("sortIndex", "integer")
            .addColumn("itemId", "text")
            .addColumn("itemType", "text")
            .execute();

          await db.schema
            .createTable("reminders")
            .ifNotExists()
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
            .ifNotExists()
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
            .ifNotExists()
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("key", "text", (c) => c.unique())
            .addColumn("value", "text")
            .execute();

          await db.schema
            .createIndex("notehistory_noteid")
            .ifNotExists()
            .on("notehistory")
            .column("noteId")
            .execute();

          await db.schema
            .createIndex("relation_from_general")
            .ifNotExists()
            .on("relations")
            .columns(["fromType", "toType", "fromId"])
            .where("toType", "!=", "note")
            .where("toType", "!=", "notebook")
            .execute();

          await db.schema
            .createIndex("relation_to_general")
            .ifNotExists()
            .on("relations")
            .columns(["fromType", "toType", "toId"])
            .where("fromType", "!=", "note")
            .where("fromType", "!=", "notebook")
            .execute();

          await db.schema
            .createIndex("relation_from_note_notebook")
            .ifNotExists()
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
            .ifNotExists()
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
            .ifNotExists()
            .on("notes")
            .columns(["type"])
            .execute();

          await db.schema
            .createIndex("note_deleted")
            .ifNotExists()
            .on("notes")
            .columns(["deleted"])
            .execute();

          await db.schema
            .createIndex("note_date_deleted")
            .ifNotExists()
            .on("notes")
            .columns(["dateDeleted"])
            .execute();

          await db.schema
            .createIndex("notebook_type")
            .ifNotExists()
            .on("notebooks")
            .columns(["type"])
            .execute();

          await db.schema
            .createIndex("attachment_hash")
            .ifNotExists()
            .on("attachments")
            .column("hash")
            .execute();

          await db.schema
            .createIndex("content_noteId")
            .ifNotExists()
            .on("content")
            .columns(["noteId"])
            .execute();
        },
        async down(db) {}
      },
      "2": {
        async up(db) {
          await rebuildSearchIndex(db);
        }
      },
      "3": {
        async up(db) {
          await db
            .updateTable("notes")
            .where("id", "in", (eb: ExpressionBuilder<any, string>) =>
              eb
                .selectFrom("content")
                .select("noteId as id")
                .where((eb) =>
                  eb.or([
                    eb("conflicted", "is", null),
                    eb("conflicted", "==", false)
                  ])
                )
                .$castTo<string | null>()
            )
            .set({ conflicted: false })
            .execute();
        }
      },
      "4": {
        async up(db) {
          await db.schema
            .createTable("config")
            .ifNotExists()
            .modifyEnd(sql`without rowid`)
            .addColumn("name", "text", (c) => c.primaryKey().unique().notNull())
            .addColumn("value", "text")
            .addColumn("dateModified", "integer")
            .execute();
        }
      },
      "5": {
        async up(db) {
          await db
            .deleteFrom("relations")
            .where((eb) =>
              eb.or([eb("fromId", "is", null), eb("toId", "is", null)])
            )
            .execute();
        }
      },
      "6": {
        async up(db) {
          // await db.transaction().execute(async (tx) => {
          //   await tx.schema.dropTable("content_fts").execute();
          //   await tx.schema.dropTable("notes_fts").execute();
          //   await createFTS5Table(
          //     "notes_fts",
          //     [{ name: "id" }, { name: "title" }],
          //     {
          //       contentTable: "notes",
          //       tokenizer: ["porter", "trigram", "remove_diacritics 1"]
          //     }
          //   ).execute(tx);
          //   await createFTS5Table(
          //     "content_fts",
          //     [{ name: "id" }, { name: "noteId" }, { name: "data" }],
          //     {
          //       contentTable: "content",
          //       tokenizer: ["porter", "trigram", "remove_diacritics 1"]
          //     }
          //   ).execute(tx);
          // });
          // await rebuildSearchIndex(db);
        }
      },
      "7": {
        async up() {}
      },
      "8": {
        async up(db) {
          await ensureColumn(db, "notes", "isGeneratedTitle", async () => {
            await db.schema
              .alterTable("notes")
              .addColumn("isGeneratedTitle", "boolean")
              .execute();
          });
        }
      },
      "9": {
        async up(db) {
          await ensureColumn(db, "notes", "archived", async () => {
            await db.schema
              .alterTable("notes")
              .addColumn("archived", "boolean")
              .execute();
          });
        }
      },
      // changing the migrations name scheme from here because
      // apparently, Kysley runs migrations in alphanumeric order.
      // To ensure things keep running smoothly, we are now moving
      // to a date-based migration name but since any number is smaller
      // than 9, we have to use "a" in the beginning.
      "a-2025-05-16": {
        async up() {}
      },
      "a-2025-05-17": {
        async up() {}
      },
      "a-2025-06-04": {
        async up(db) {
          await runFTSTablesMigrations(db);
        }
      },
      "a-2025-07-30": {
        async up(db) {
          await db.schema
            .createTable("monographs")
            .ifNotExists()
            .$call(addBaseColumns)
            .addColumn("datePublished", "integer")
            .addColumn("title", "text", COLLATE_NOCASE)
            .addColumn("selfDestruct", "boolean")
            .addColumn("password", "text")
            .execute();
        }
      },
      "a-2026-01-07": {
        async up(db) {
          await ensureColumn(db, "notes", "expiryDate", async () => {
            await db.schema
              .alterTable("notes")
              .addColumn("expiryDate", "text")
              .execute();
          });
          await db.schema
            .createIndex("note_expiry_date")
            .ifNotExists()
            .on("notes")
            .expression(sql`expiryDate ->> '$.value'`)
            .execute();
        }
      },
      "a-2026-01-09": {
        async up(db) {
          await ensureColumn(db, "sessioncontent", "title", async () => {
            await db.schema
              .alterTable("sessioncontent")
              .addColumn("title", "text")
              .execute();
          });
        }
      },
      "a-2026-02-11": {
        async up(db) {
          await ensureColumn(db, "monographs", "publishUrl", async () => {
            await db.schema
              .alterTable("monographs")
              .addColumn("publishUrl", "text", COLLATE_NOCASE)
              .execute();
          });
        }
      },
      "a-2026-04-06": {
        async up(db) {
          await ensureColumn(db, "notes", "spellcheck", async () => {
            await db.schema
              .alterTable("notes")
              .addColumn("spellcheck", "boolean", (c) => c.defaultTo(true))
              .execute();
          });
        }
      },
      "a-2026-05-07": {
        async up(db) {
          await db.schema
            .createTable("inboxitemshistory")
            .ifNotExists()
            .modifyEnd(sql`without rowid`)
            .$call(addBaseColumns)
            .addColumn("dateSynced", "integer")
            .addColumn("status", "text")
            .addColumn("source", "text")
            .addColumn("errorContext", "text")
            .execute();
        }
      },
      "a-2026-07-06": {
        async up(db) {
          await db.schema
            .createTable("pendingsyncitems")
            .ifNotExists()
            .addColumn("id", "text", (c) => c.primaryKey().unique().notNull())
            .addColumn("type", "text")
            .addColumn("data", "text")
            .addColumn("dateCreated", "integer")
            .execute();
        }
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
    .addColumn("itemType", "text")
    .addColumn("deletedBy", "text");
};

type Tokenizer = "porter" | "trigram" | "unicode61" | "ascii" | (string & {});
function createFTS5Table(
  name: string,
  columns: {
    name: string;
    unindexed?: boolean;
  }[],
  options: {
    contentTable?: string;
    contentTableRowId?: string;
    tokenizer?: Tokenizer[];
    prefix?: number[];
    columnSize?: 0 | 1;
    detail?: "full" | "column" | "none";
  } = {}
) {
  const _options: string[] = [];
  if (options.contentTable) _options.push(`content='${options.contentTable}'`);
  if (options.contentTableRowId)
    _options.push(`content_rowid='${options.contentTableRowId}'`);
  if (options.tokenizer)
    _options.push(`tokenize='${options.tokenizer.join(" ")}'`);
  if (options.prefix) _options.push(`prefix='${options.prefix.join(" ")}'`);
  if (options.columnSize) _options.push(`columnsize='${options.columnSize}'`);
  if (options.detail) _options.push(`detail='${options.detail}'`);

  const args = sql.join([
    sql.join(
      columns.map((c) => sql.ref(`${c.name}${c.unindexed ? " UNINDEXED" : ""}`))
    ),
    sql.join(_options.map((o) => sql.raw(o)))
  ]);

  return sql`CREATE VIRTUAL TABLE IF NOT EXISTS ${sql.raw(
    name
  )} USING fts5(${args})`;
}

async function runFTSTablesMigrations(db: Kysely<any>) {
  await db.transaction().execute(async (tx) => {
    await tx.schema.dropTable("content_fts").execute();
    await tx.schema.dropTable("notes_fts").execute();

    await createFTS5Table("notes_fts", [{ name: "id" }, { name: "title" }], {
      contentTable: "notes",
      tokenizer: ["better_trigram", "remove_diacritics 1"]
    }).execute(tx);

    await createFTS5Table(
      "content_fts",
      [{ name: "id" }, { name: "noteId" }, { name: "data" }],
      {
        contentTable: "content",
        tokenizer: ["html", "better_trigram", "remove_diacritics 1"]
      }
    ).execute(tx);
  });
  await rebuildSearchIndex(db);
}

async function hasColumn(
  db: Kysely<RawDatabaseSchema>,
  tableName: string,
  columnName: string
) {
  const result = await sql<{ name: string }>`
    SELECT name
    FROM pragma_table_info(${tableName})
    WHERE name = ${columnName}
  `.execute(db);

  return result.rows.length > 0;
}

async function ensureColumn(
  db: Kysely<RawDatabaseSchema>,
  tableName: string,
  columnName: string,
  callback: () => Promise<void>
) {
  if (await hasColumn(db, tableName, columnName)) return;
  await callback();
}
