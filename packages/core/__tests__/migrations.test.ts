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

import { test, expect, describe } from "vitest";
import { migrateItem, migrateKV, migrateVaultKey } from "../src/migrations.js";
import { databaseTest } from "./utils/index.js";
import { getId, makeId } from "../src/utils/id.js";
import { DeletedItem, LegacySettingsItem } from "../src/types.js";
import { KEYS } from "../src/database/kv.js";

describe.concurrent("[5.2] replace date edited with date modified", () => {
  const itemsWithDateEdited = ["note", "notebook", "trash", "tiny"] as const;
  const itemsWithoutDateEdited = ["tag", "attachment", "settings"] as const;
  for (const type of itemsWithDateEdited) {
    test(type, () =>
      databaseTest().then(async (db) => {
        const item = { type, dateEdited: Date.now() };
        expect(await migrateItem(item, 5.2, 5.3, type, db, "local")).toBe(true);
        expect(item.dateModified).toBeDefined();
        expect(item.dateEdited).toBeDefined();
      })
    );
  }

  for (const type of itemsWithoutDateEdited) {
    test(type, () =>
      databaseTest().then(async (db) => {
        const item = { type, dateEdited: Date.now() };
        expect(await migrateItem(item, 5.2, 5.3, type, db, "local")).toBe(true);
        expect(item.dateModified).toBeDefined();
        expect(item.dateEdited).toBeUndefined();
      })
    );
  }
});

test("[5.2] remove tox class from checklist", () =>
  databaseTest().then(async (db) => {
    const item = {
      type: "tiny",
      dateEdited: Date.now(),
      data: `<p>hello</p><ul class="tox-checklist"><li class="tox-checklist--checked">world</li></ul>`
    };
    expect(await migrateItem(item, 5.2, 5.3, "tiny", db, "local")).toBe(true);
    expect(item.data).toBe(
      `<p>hello</p><ul class="checklist"><li class="checked">world</li></ul>`
    );
  }));

test("[5.2] wrap tables with div", () =>
  databaseTest().then(async (db) => {
    const item = {
      type: "tiny",
      dateEdited: Date.now(),
      data: `<p>hello</p><table></table>`
    };
    expect(await migrateItem(item, 5.2, 5.3, "tiny", db, "local")).toBe(true);
    expect(item.data).toBe(
      `<p>hello</p><div class="table-container" contenteditable="false"><table contenteditable="true"></table></div>`
    );
  }));

test("[5.3] decode wrapped table html entities", () =>
  databaseTest().then(async (db) => {
    const item = {
      type: "tiny",
      dateEdited: Date.now(),
      data: `<p>hello</p>&lt;div class="table-container" contenteditable="false"&gt;&lt;table contenteditable="true"&gt;&lt;/table&gt;&lt;/div&gt;`
    };
    expect(await migrateItem(item, 5.3, 5.4, "tiny", db, "local")).toBe(true);
    expect(item.data).toBe(
      `<p>hello</p><div class="table-container" contenteditable="false"><table contenteditable="true"></table></div>`
    );
  }));

describe.concurrent("[5.4] convert tiny to tiptap", () => {
  const cases = [
    {
      name: "preserve newlines in code blocks",
      from: `<p>Function</p>\n<p>Hello</p>\n<pre class="hljs language-javascript" spellcheck="false"><span class="hljs-keyword">function</span> <span class="hljs-title function_">google</span>() {<br><span class="hljs-keyword">var</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">google</span>();<br><span class="hljs-title class_">Function</span> <span class="hljs-title function_">google</span>();<br>}</pre>\n<p>Hh</p>\n<p>&nbsp;</p>`,
      to: `<p>Function</p><br><p>Hello</p><br><pre class="hljs language-javascript" spellcheck="false">function google() {<br>var function google();<br>Function google();<br>}</pre><br><p>Hh</p><br><p>&nbsp;</p>`
    },
    {
      name: "replace table container with table",
      from: `<p>hello</p><div class="table-container" contenteditable="false"><table contenteditable="true"></table></div>`,
      to: `<p>hello</p><table></table>`
    },
    {
      name: "move images out of paragraphs",
      from: `<p><img src="hello.jpg" /></p>`,
      to: `<img src="hello.jpg">`
    },
    {
      name: "replace [data-mce-bogus] elements",
      from: `<p><br data-mce-bogus="" /></p><br data-mce-bogus="" />`,
      to: `<p></p>`
    },
    {
      name: "remove [data-mce-href] & [data-mce-flag] attributes",
      from: `<p>Hello <a data-mce-href="#" href="#">world</a><span data-mce-flag="true">2</span></p>`,
      to: `<p>Hello <a href="#">world</a><span>2</span></p>`
    }
  ];

  for (const testCase of cases) {
    test(testCase.name, () =>
      databaseTest().then(async (db) => {
        const item = {
          type: "tiny",
          dateEdited: Date.now(),
          data: testCase.from
        };
        expect(await migrateItem(item, 5.4, 5.5, "tiny", db, "local")).toBe(
          true
        );
        expect(item.data).toBe(testCase.to);
      })
    );
  }
});

test("[5.6] remove note ids from topics", () =>
  databaseTest().then(async (db) => {
    const item = {
      type: "notebook",
      topics: [{ notes: ["helloworld"] }, { notes: ["helloworld2"] }]
    };
    expect(await migrateItem(item, 5.6, 5.7, "notebook", db, "local")).toBe(
      true
    );
    expect(item.topics.every((t) => !t.notes)).toBe(true);
  }));

test("[5.6] move pins to shortcuts", () =>
  databaseTest().then(async (db) => {
    const item = {
      type: "settings",
      pins: [
        {
          type: "topic",
          data: {
            id: "hello",
            notebookId: "world"
          }
        },
        {
          type: "notebook",
          data: { id: "world" }
        },
        {
          type: "tag",
          data: { id: "tag" }
        }
      ]
    };
    expect(await migrateItem(item, 5.6, 5.7, "settings", db, "local")).toBe(
      true
    );
    const shortcuts = db.shortcuts.all;
    expect(item.pins).toBeUndefined();
    expect(
      shortcuts.find((s) => s.itemType === "notebook" && s.itemId === "hello")
    ).toBeDefined();
    expect(
      shortcuts.find((s) => s.itemType === "notebook" && s.itemId === "world")
    ).toBeDefined();
    expect(
      shortcuts.find((s) => s.itemType === "tag" && s.itemId === "tag")
    ).toBeDefined();
  }));

test("[5.7] change session content type from tiny to tiptap", () =>
  databaseTest().then(async (db) => {
    const item = {
      id: "hello_content",
      type: "tiny",
      data: "<p>hello world</p>"
    };
    expect(await migrateItem(item, 5.7, 5.8, "tiny", db, "local")).toBe(true);
    expect(item.type).toBe("sessioncontent");
    expect(item.contentType).toBe("tiptap");
  }));

test("[5.7] change content item type to tiptap", () =>
  databaseTest().then(async (db) => {
    const item = {
      id: "hello_content",
      type: "content",
      data: "<p>hello world</p>"
    };
    expect(await migrateItem(item, 5.7, 5.8, "content", db, "local")).toBe(
      true
    );
    expect(item.type).toBe("tiptap");
  }));

test("[5.7] change shortcut item id to be same as its reference id", () =>
  databaseTest().then(async (db) => {
    const item = {
      id: "something",
      type: "shortcut",
      item: {
        type: "notebook",
        id: "world"
      }
    };
    expect(await migrateItem(item, 5.7, 5.8, "shortcut", db, "local")).toBe(
      true
    );
    expect(item.id).toBe("world");
  }));

test("[5.7] add type to session content", () =>
  databaseTest().then(async (db) => {
    const item = {
      id: "hello_content",
      type: "tiptap",
      data: "<p>hello world</p>"
    };
    expect(await migrateItem(item, 5.7, 5.8, "tiptap", db, "local")).toBe(true);
    expect(item.type).toBe("sessioncontent");
    expect(item.contentType).toBe("tiptap");
  }));

test("[5.7] change notehistory type to session", () =>
  databaseTest().then(async (db) => {
    const item = {
      type: "notehistory"
    };
    expect(await migrateItem(item, 5.7, 5.8, "notehistory", db, "local")).toBe(
      true
    );
    expect(item.type).toBe("session");
  }));

test("[5.8] remove remote property from items", () =>
  databaseTest().then(async (db) => {
    const item = {
      type: "note",
      remote: true
    };
    expect(await migrateItem(item, 5.8, 5.9, "note", db, "local")).toBe(true);
    expect(item.remote).toBeUndefined();
  }));

test("[5.8] do nothing if backup type is not local", () =>
  databaseTest().then(async (db) => {
    const item = {
      type: "note",
      remote: true
    };
    expect(await migrateItem(item, 5.8, 5.9, "note", db, "backup")).toBe(false);
    expect(await migrateItem(item, 5.8, 5.9, "note", db, "sync")).toBe(false);
  }));

describe.concurrent("[5.9] make tags syncable", () => {
  test("create tags inside notes & link to them using relations", () =>
    databaseTest().then(async (db) => {
      const noteId = getId();
      const tags = ["hello", "world", "i am here"];
      await db.legacyNotes.add({
        type: "note",
        title: "I am a note",
        tags,
        id: noteId
      });

      for (const tag of tags) {
        await db.legacyTags.add({
          id: makeId(tag),
          noteIds: [noteId],
          type: "tag",
          title: tag
        });
      }
      await db.storage().write("settings", {
        ...db.legacySettings.raw,
        aliases: {
          [makeId(tags[1])]: "I AM GOOD!"
        }
      });
      await db.legacySettings.init();

      const note = db.legacyNotes.get(noteId);
      if (!note) throw new Error("Failed to find note.");

      expect(await migrateItem(note, 5.9, 6.0, "note", db, "backup")).toBe(
        true
      );

      const resolvedTags = (
        await db.relations.to({ type: "note", id: noteId }, "tag").resolve()
      ).sort((a, b) => a.title.localeCompare(b.title));

      expect(note.tags).toBeUndefined();
      expect(await db.tags.all.count()).toBe(3);
      expect(resolvedTags).toHaveLength(3);
      expect(resolvedTags[0].title).toBe("hello");
      expect(resolvedTags[1].title).toBe("I AM GOOD!");
      expect(resolvedTags[2].title).toBe("i am here");
      expect(db.legacyTags.items()).toHaveLength(0);
    }));

  test("migrate old tag item to new one", () =>
    databaseTest().then(async (db) => {
      const tag = {
        id: makeId("oldone"),
        noteIds: [],
        type: "tag",
        title: "oldone"
      };
      expect(await migrateItem(tag, 5.9, 6.0, "tag", db, "backup")).toBe(true);
      expect(tag.id).toBe(makeId("oldone"));
      expect(tag.dateCreated).toBeGreaterThan(0);
      expect(tag.noteIds).toBeUndefined();
      expect(tag.alias).toBeUndefined();
      expect(tag.title).toBe("oldone");
    }));

  test("migrate old tag item with alias to new one", () =>
    databaseTest().then(async (db) => {
      await db.storage().write("settings", {
        ...db.legacySettings.raw,
        aliases: {
          [makeId("oldone")]: "alias"
        }
      });
      await db.legacySettings.init();

      const tag = {
        id: makeId("oldone"),
        noteIds: [],
        type: "tag",
        title: "oldone"
      };
      expect(await migrateItem(tag, 5.9, 6.0, "tag", db, "backup")).toBe(true);
      expect(tag.id).not.toBe(makeId("oldone"));
      expect(tag.noteIds).toBeUndefined();
      expect(tag.alias).toBeUndefined();
      expect(tag.title).toBe("alias");
    }));

  test("migrate tags before notes", () =>
    databaseTest().then(async (db) => {
      const noteId = getId();
      const tags = ["hello", "world", "i am here"];
      await db.legacyNotes.add({
        type: "note",
        title: "I am a note",
        tags,
        id: noteId
      });
      await db.storage().write("settings", {
        ...db.legacySettings.raw,
        aliases: {
          [makeId(tags[1])]: "I AM GOOD!"
        }
      });
      await db.legacySettings.init();
      for (const tag of tags) {
        const item = {
          id: makeId(tag),
          noteIds: [noteId],
          type: "tag",
          title: tag
        };
        await migrateItem(item, 5.9, 6.0, "tag", db, "backup");
        await db.tags.add(item);
      }

      const note = db.legacyNotes.get(noteId);
      if (!note) throw new Error("Failed to find note.");

      expect(await migrateItem(note, 5.9, 6.0, "note", db, "backup")).toBe(
        true
      );

      const resolvedTags = (
        await db.relations.to({ type: "note", id: noteId }, "tag").resolve()
      ).sort((a, b) => a.title.localeCompare(b.title));

      expect(note.tags).toBeUndefined();
      expect(await db.tags.all.count()).toBe(3);
      expect(resolvedTags).toHaveLength(3);
      expect(resolvedTags[0].title).toBe("hello");
      expect(resolvedTags[1].title).toBe("I AM GOOD!");
      expect(resolvedTags[2].title).toBe("i am here");
      expect(db.legacyTags.items()).toHaveLength(0);
    }));
});

describe.concurrent("[5.9] make colors syncable", () => {
  test("create colors from notes & link to them using relations", () =>
    databaseTest().then(async (db) => {
      const noteId = getId();
      await db.legacyNotes.add({
        type: "note",
        title: "I am a note",
        color: "blue",
        id: noteId
      });

      await db.legacyColors.add({
        id: makeId("blue"),
        noteIds: [noteId],
        type: "tag",
        title: "blue"
      });

      const note = db.legacyNotes.get(noteId);
      if (!note) throw new Error("Failed to find note.");

      expect(await migrateItem(note, 5.9, 6.0, "note", db, "backup")).toBe(
        true
      );

      const resolvedColors = await db.relations
        .to({ type: "note", id: noteId }, "color")
        .resolve();

      expect(note.color).toBeUndefined();
      expect(await db.colors.all.count()).toBe(1);
      expect(resolvedColors).toHaveLength(1);
      expect(resolvedColors[0].title).toBe("blue");
      expect(resolvedColors[0].colorCode).toBe("#2196F3");
      expect(db.legacyColors.exists(makeId("blue"))).toBeFalsy();
    }));

  test("migrate old color item to new one", () =>
    databaseTest().then(async (db) => {
      const color = {
        id: makeId("blue"),
        noteIds: [],
        type: "tag",
        title: "blue"
      };
      expect(await migrateItem(color, 5.9, 6.0, "tag", db, "backup")).toBe(
        true
      );
      expect(color.id).not.toBe(makeId("oldone"));
      expect(color.noteIds).toBeUndefined();
      expect(color.alias).toBeUndefined();
      expect(color.title).toBe("blue");
      expect(color.type).toBe("color");
      expect(color.colorCode).toBe("#2196F3");
    }));

  test("migrate old color item with alias to new one", () =>
    databaseTest().then(async (db) => {
      await db.storage().write("settings", {
        ...db.legacySettings.raw,
        aliases: {
          [makeId("blue")]: "very important"
        }
      });
      await db.legacySettings.init();

      const color = {
        id: makeId("blue"),
        noteIds: [],
        type: "tag",
        title: "blue"
      };
      expect(await migrateItem(color, 5.9, 6.0, "tag", db, "backup")).toBe(
        true
      );
      expect(color.id).not.toBe(makeId("oldone"));
      expect(color.noteIds).toBeUndefined();
      expect(color.alias).toBeUndefined();
      expect(color.title).toBe("very important");
      expect(color.type).toBe("color");
      expect(color.colorCode).toBe("#2196F3");
    }));

  test("migrate color before notes", () =>
    databaseTest().then(async (db) => {
      const noteId = getId();
      await db.legacyNotes.add({
        type: "note",
        title: "I am a note",
        color: "blue",
        id: noteId
      });
      await db.storage().write("settings", {
        ...db.legacySettings.raw,
        aliases: {
          [makeId("blue")]: "I AM GOOD!"
        }
      });
      await db.legacySettings.init();

      const color = {
        id: makeId("blue"),
        noteIds: [noteId],
        type: "tag",
        title: "blue"
      };
      await migrateItem(color, 5.9, 6.0, "tag", db, "backup");
      await db.colors.add(color);

      const note = db.legacyNotes.get(noteId);
      if (!note) throw new Error("Failed to find note.");

      expect(await migrateItem(note, 5.9, 6.0, "note", db, "backup")).toBe(
        true
      );

      const resolvedColors = await db.relations
        .to({ type: "note", id: noteId }, "color")
        .resolve();

      expect(note.color).toBeUndefined();
      expect(await db.colors.all.count()).toBe(1);
      expect(resolvedColors).toHaveLength(1);
      expect(resolvedColors[0].title).toBe("I AM GOOD!");
      expect(resolvedColors[0].colorCode).toBe("#2196F3");
      expect(db.legacyColors.exists(makeId("blue"))).toBeFalsy();
    }));
});

test("[5.9] move attachments.noteIds to relations", () =>
  databaseTest().then(async (db) => {
    const attachment = {
      id: "ATTACHMENT_ID",
      type: "attachment",
      noteIds: ["HELLO_NOTE_ID"]
    };
    await migrateItem(attachment, 5.9, 6.0, "attachment", db, "backup");

    const linkedNotes = await db.relations
      .to({ type: "attachment", id: "ATTACHMENT_ID" }, "note")
      .get();
    expect(attachment.noteIds).toBeUndefined();
    expect(linkedNotes).toHaveLength(1);
    expect(linkedNotes[0].fromId).toBe("HELLO_NOTE_ID");
  }));

test.todo("[5.9] flatten attachment object", () =>
  databaseTest().then(async (db) => {
    // const attachment = {
    //   id: "ATTACHMENT_ID",
    //   type: "attachment",
    //   noteIds: ["HELLO_NOTE_ID"]
    // };
    // await migrateItem(attachment, 5.9, 6.0, "attachment", db, "backup");
    // const linkedNotes = await db.relations
    //   .from({ type: "attachment", id: "ATTACHMENT_ID" }, "note")
    //   .get();
    // expect(attachment.noteIds).toBeUndefined();
    // expect(linkedNotes).toHaveLength(1);
    // expect(linkedNotes[0]).toBe("HELLO_NOTE_ID");
  })
);

describe.concurrent(
  "[5.9] move topics out of notebooks & use relations",
  () => {
    test("move topics of deleted notebook to trash after migration", () =>
      databaseTest().then(async (db) => {
        const notebook = {
          id: "parent_notebook",
          type: "trash",
          itemType: "notebook",
          dateDeleted: Date.now(),
          topics: [
            { id: "topics1", title: "Topic 1" },
            { id: "topics2", title: "Topic 2" }
          ]
        };

        await migrateItem(notebook, 5.9, 6.0, "notebook", db, "backup");

        const trash = await db.trash.all();
        expect(await db.notebooks.notebook("topics1")).toBeUndefined();
        expect(await db.notebooks.notebook("topics2")).toBeUndefined();
        expect(trash.find((t) => t.title === "Topic 1")).toBeDefined();
        expect(trash.find((t) => t.title === "Topic 2")).toBeDefined();
      }));

    test("convert topics to subnotebooks", () =>
      databaseTest().then(async (db) => {
        const notebook = {
          id: "parent_notebook",
          type: "notebook",
          topics: [
            { id: "topics1", title: "Topic 1" },
            { id: "topics2", title: "Topic 2" }
          ]
        };
        await migrateItem(notebook, 5.9, 6.0, "notebook", db, "backup");

        const linkedNotebooks = await db.relations
          .from({ type: "notebook", id: "parent_notebook" }, "notebook")
          .get();
        expect(notebook.topics).toBeUndefined();
        expect(linkedNotebooks).toHaveLength(2);
        expect(linkedNotebooks.some((a) => a.toId === "topics1")).toBeTruthy();
        expect(linkedNotebooks.some((a) => a.toId === "topics2")).toBeTruthy();
        expect(await db.notebooks.all.count()).toBe(2);
        expect(await db.notebooks.notebook("topics1")).toBeDefined();
        expect(await db.notebooks.notebook("topics2")).toBeDefined();
      }));

    test("convert topic shortcuts to notebook shortcuts", () =>
      databaseTest().then(async (db) => {
        const shortcut = {
          id: "shortcut1",
          type: "shortcut",
          item: {
            type: "topic",
            id: "topics1"
          }
        };
        await migrateItem(shortcut, 5.9, 6.0, "shortcut", db, "backup");

        expect(shortcut.itemType).toBe("notebook");
        expect(shortcut.itemId).toBe("topics1");
      }));

    test("convert topic links in note to relations", () =>
      databaseTest().then(async (db) => {
        const note = {
          id: "note1",
          type: "note",
          notebooks: [{ id: "notebook1", topics: ["topic1", "topic2"] }]
        };
        await migrateItem(note, 5.9, 6.0, "note", db, "backup");

        const linkedNotebooks = await db.relations
          .to({ type: "note", id: "note1" }, "notebook")
          .get();
        expect(note.notebooks).toBeUndefined();
        expect(linkedNotebooks).toHaveLength(2);
        expect(linkedNotebooks.some((a) => a.fromId === "topic1")).toBeTruthy();
        expect(linkedNotebooks.some((a) => a.fromId === "topic2")).toBeTruthy();
      }));
  }
);

test("[5.9] migrate settings to its own collection", () =>
  databaseTest().then(async (db) => {
    const settings: LegacySettingsItem = {
      type: "settings",
      id: "settings",
      dateCreated: Date.now(),
      dateModified: Date.now(),
      dateFormat: "CUSTOM_DATE_FORMAT!",
      defaultNotebook: { id: "notebook1", topic: "topic1" },
      groupOptions: {
        favorites: {
          groupBy: "abc",
          sortBy: "dateCreated",
          sortDirection: "asc"
        }
      },
      timeFormat: "24-hour",
      titleFormat: "I AM TITLE FORMAT",
      toolbarConfig: { desktop: { preset: "custom" } },
      trashCleanupInterval: 365
    };
    await migrateItem(settings, 5.9, 6.0, "settings", db, "backup");

    expect(db.settings.getDateFormat()).toBe(settings.dateFormat);
    expect(db.settings.getDefaultNotebook()).toBe(
      settings.defaultNotebook?.topic
    );
    expect(db.settings.getGroupOptions("favorites")).toMatchObject(
      settings.groupOptions?.favorites || {}
    );
    expect(db.settings.getTitleFormat()).toBe(settings.titleFormat);
    expect(db.settings.getTimeFormat()).toBe(settings.timeFormat);
    expect(db.settings.getToolbarConfig("desktop")).toMatchObject(
      settings.toolbarConfig?.desktop || {}
    );
    expect(db.settings.getTrashCleanupInterval()).toBe(
      settings.trashCleanupInterval
    );
  }));

describe.concurrent("[5.9] migrate kv", (test) => {
  for (const key of KEYS) {
    test(`${key} (defined)`, () =>
      databaseTest().then(async (db) => {
        await db.storage().write(key, "test");

        await migrateKV(db, 5.9, 6.0);

        expect(await db.kv().read(key)).toBeDefined();
        expect(await db.storage().read(key)).toBeUndefined();
      }));

    test(`${key} (undefined)`, () =>
      databaseTest().then(async (db) => {
        await db.storage().write(key, null);

        await migrateKV(db, 5.9, 6.0);

        expect(await db.kv().read(key)).toBe(key === "v" ? 6.1 : undefined);
        expect(await db.storage().read(key)).toBe(null);
      }));
  }
});

test("[5.9] migrate vaultKey", () =>
  databaseTest().then(async (db) => {
    const key = await db.storage().encrypt({ password: "hello" }, "world");
    await db.storage().write("vaultKey", key);

    await migrateVaultKey(db, key, 5.9, 6.0);

    expect(await db.storage().read("vaultKey")).toBeUndefined();
    expect(await db.vaults.default()).toBeDefined();
    expect((await db.vaults.default())?.key).toStrictEqual(key);
    expect((await db.vaults.default())?.key).toStrictEqual(key);
  }));

test("[5.9] remove deleteReason from deleted items", () =>
  databaseTest().then(async (db) => {
    const item: DeletedItem = {
      dateModified: Date.now(),
      deleted: true,
      id: "hello",
      remote: false,
      synced: true,
      deleteReason: true as any
    };
    await migrateItem(item, 5.9, 6.0, "all", db, "backup");

    expect(item.deleteReason).toBeUndefined();
  }));
