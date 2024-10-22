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

import DB from "../../src/api/index.js";
import { NodeStorageInterface } from "../../__mocks__/node-storage.mock.js";
import { FS } from "../../__mocks__/fs.mock.js";
import Compressor from "../../__mocks__/compressor.mock.js";
import { EventSourcePolyfill as EventSource } from "event-source-polyfill";
import { randomBytes } from "../../src/utils/random.js";
import { Note, Notebook, NoteContent } from "../../src/types.js";
import { SqliteDialect } from "@streetwriters/kysely";
import BetterSQLite3 from "better-sqlite3-multiple-ciphers";
import path from "path";
import { tmpdir } from "os";
import { getId } from "../../src/utils/id.js";
import { existsSync, mkdirSync } from "fs";
import * as betterTrigram from "sqlite-better-trigram";

const TEST_NOTEBOOK: Partial<Notebook> = {
  title: "Test Notebook",
  description: "Test Description"
};

const TEST_NOTEBOOK2: Partial<Notebook> = {
  title: "Test Notebook 2",
  description: "Test Description 2"
};

function databaseTest(type: "memory" | "persistent" = "memory") {
  const dir = path.join(tmpdir(), "notesnook-tests-tmp");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, `notesnook-${getId()}.sql`);
  const db = new DB();
  const betterSqliteDb = BetterSQLite3(
    type === "persistent" ? dbPath : ":memory:"
  ).unsafeMode(true);
  db.setup({
    storage: new NodeStorageInterface(),
    eventsource: EventSource,
    fs: FS,
    compressor: async () => Compressor,
    sqliteOptions: {
      dialect: (name) =>
        new SqliteDialect({
          database: betterSqliteDb
        }),
      password: type === "persistent" ? "iamalongpassword" : undefined
    },
    batchSize: 500
  });
  betterTrigram.load(betterSqliteDb);
  return db.init().then(() => db);
}

const notebookTest = (notebook = TEST_NOTEBOOK) =>
  databaseTest().then(async (db) => {
    const id = await db.notebooks.add(notebook);
    return { db, id };
  });

const TEST_NOTE: { content: NoteContent<false> } = {
  content: {
    type: "tiptap",
    data: `<p data-block-id="p1">Hello <span style="color:#f00">This is colorful</span></p>`
  }
};

const IMG_CONTENT = `<p>This is a note for me.j</p>\n<p><img src="data:image/png;base64,iVBORw0K" data-hash="d3eab72e94e3cd35" class="attachment" alt="Screenshot_20210915_102333.png" data-mime="image/png" data-filename="Screenshot_20210915_102333.png" data-size="68609" style="float: left;" /> &nbsp;</p>\n<p>&nbsp;</p>`;
const IMG_CONTENT_WITHOUT_HASH = `<p>This is a note for me.j</p>\n<p><img src="data:image/png;base64,iVBORw0K" class="attachment" alt="Screenshot_20210915_102333.png" data-mime="image/png" data-filename="Screenshot_20210915_102333.png" data-size="68609" style="float: left;" /> &nbsp;</p>\n<p>&nbsp;</p>`;

const LONG_TEXT =
  "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

const noteTest = (
  note: Partial<
    Note & { content: NoteContent<false>; sessionId: string }
  > = TEST_NOTE
) =>
  databaseTest().then(async (db) => {
    const id = await db.notes.add(note);
    if (!id) throw new Error("Failed to add note.");
    return { db, id };
  });

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loginFakeUser(db) {
  const email = "johndoe@example.com";
  const userSalt = randomBytes(16).toString("base64");
  await db.storage().deriveCryptoKey({
    password: "password",
    salt: userSalt
  });

  const userEncryptionKey = await db.storage().getCryptoKey(`_uk_@${email}`);

  const key = await db.crypto().generateRandomKey();
  const attachmentsKey = await db
    .storage()
    .encrypt({ password: userEncryptionKey }, JSON.stringify(key));

  await db.user.setUser({
    email,
    salt: userSalt,
    attachmentsKey: attachmentsKey
  });
}

export {
  databaseTest,
  notebookTest,
  noteTest,
  IMG_CONTENT,
  IMG_CONTENT_WITHOUT_HASH,
  TEST_NOTEBOOK,
  TEST_NOTEBOOK2,
  TEST_NOTE,
  LONG_TEXT,
  delay,
  loginFakeUser
};
