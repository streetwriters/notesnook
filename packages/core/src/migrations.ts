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

import { parseHTML } from "./utils/html-parser.js";
import { decodeHTML5 } from "entities";
import { CURRENT_DATABASE_VERSION } from "./common.js";
import Database from "./api/index.js";
import { makeId } from "./utils/id.js";
import {
  Color,
  ContentItem,
  HistorySession,
  Item,
  ItemMap,
  ItemType,
  MaybeDeletedItem,
  ToolbarConfigPlatforms,
  isDeleted,
  isGroupingKey
} from "./types.js";
import { isCipher } from "./utils/crypto.js";
import { IndexedCollection } from "./database/indexed-collection.js";
import { DefaultColors } from "./collections/colors.js";
import { Cipher } from "@notesnook/crypto";
import { KEYS } from "./database/kv.js";

type MigrationType = "local" | "sync" | "backup";
type MigrationItemType = ItemType | "notehistory" | "content" | "never";
type MigrationItemMap = ItemMap & {
  notehistory: HistorySession;
  content: ContentItem;
  never: never;
};
type Migration = {
  version: number;
  items: {
    [P in MigrationItemType]?: (
      item: MigrationItemMap[P],
      db: Database,
      migrationType: MigrationType
    ) => "skip" | boolean | Promise<boolean | "skip"> | void;
  };
  all?: (
    item: MaybeDeletedItem<Item>,
    db: Database,
    migrationType: MigrationType,
    itemType: MigrationItemType
  ) => "skip" | boolean | Promise<boolean | "skip"> | void;
  /**
   * @deprecated
   */
  collection?: (collection: IndexedCollection) => Promise<void> | void;
  /**
   * @deprecated
   */
  vaultKey?: (db: Database, key: Cipher<"base64">) => Promise<void> | void;
  /**
   * @deprecated
   */
  kv?: (db: Database) => Promise<void> | void;
};

const migrations: Migration[] = [
  { version: 5.0, items: {} },
  { version: 5.1, items: {} },
  {
    version: 5.2,
    items: {
      note: replaceDateEditedWithDateModified(false),
      notebook: replaceDateEditedWithDateModified(false),
      tag: replaceDateEditedWithDateModified(true),
      attachment: replaceDateEditedWithDateModified(true),
      trash: replaceDateEditedWithDateModified(false),
      tiny: (item) => {
        replaceDateEditedWithDateModified(false)(item);

        if (!item.data || isCipher(item.data)) return true;

        item.data = removeToxClassFromChecklist(wrapTablesWithDiv(item.data));
        return true;
      },
      settings: replaceDateEditedWithDateModified(true)
    }
  },
  {
    version: 5.3,
    items: {
      tiny: (item) => {
        if (!item.data || isCipher(item.data)) return false;
        item.data = decodeWrappedTableHtml(item.data);
        return true;
      }
    }
  },
  {
    version: 5.4,
    items: {
      tiny: (item) => {
        if (!item.data || isCipher(item.data)) return false;
        item.type = "tiptap";
        item.data = tinyToTiptap(item.data);
        return true;
      }
    }
  },
  {
    version: 5.5,
    items: {}
  },
  {
    version: 5.6,
    items: {
      notebook: (item) => {
        if (!item.topics) return false;

        item.topics = item.topics.map((topic) => {
          delete topic.notes;
          return topic;
        });
        return item.topics.length > 0;
      },
      settings: async (item, db) => {
        if (!item.pins) return false;

        for (const pin of item.pins) {
          if (!pin.data) continue;
          await db.shortcuts.add({
            itemId: pin.data.id,
            itemType: pin.type === "topic" ? "notebook" : pin.type
          });
        }
        delete item.pins;
        return true;
      }
    }
  },
  {
    version: 5.7,
    items: {
      tiny: (item) => {
        item.type = "tiptap";
        return changeSessionContentType(item);
      },
      content: (item) => {
        const oldType = item.type;
        item.type = "tiptap";
        return oldType !== item.type;
      },
      shortcut: (item) => {
        if (!item.item || item.id === item.item.id) return false;
        item.id = item.item.id;
        return true;
      },
      tiptap: (item) => {
        return changeSessionContentType(item);
      },
      notehistory: (item) => {
        const oldType = item.type;
        item.type = "session";
        return oldType !== item.type;
      }
    },
    collection: async (collection) => {
      await collection.indexer.migrateIndices();
    }
  },
  {
    version: 5.8,
    items: {},
    all: (item, _db, migrationType) => {
      if (migrationType === "local") {
        delete item.remote;
        return true;
      }
    }
  },
  {
    version: 5.9,
    items: {
      trash: (item) => {
        if (!item.deletedBy) item.deletedBy = "user";
        delete item.itemId;
        return true;
      },
      color: async (item, db, migrationType) => {
        return (
          (await migrations
            .find((migration) => migration.version === 5.9)
            ?.items.tag?.(item as any, db, migrationType)) || false
        );
      },
      tag: async (item, db) => {
        const oldTagId = makeId(item.title);
        const alias = db.legacySettings.getAlias(item.id);
        if (
          !alias &&
          (db.legacyTags
            .items()
            .find((t) => item.title === t.title && t.id !== oldTagId) ||
            db.legacyColors
              .items()
              .find((t) => item.title === t.title && t.id !== oldTagId))
        )
          return "skip";

        const colorCode = DefaultColors[item.title];
        if (colorCode) {
          const newColor = await db.colors.all.find((eb) =>
            eb("title", "in", [alias, item.title])
          );
          if (newColor) return "skip";

          (item as unknown as Color).type = "color";
          (item as unknown as Color).colorCode = colorCode;
        } else {
          const newTag = await db.tags.all.find((eb) =>
            eb("title", "in", [alias, item.title])
          );
          if (newTag) return "skip";
        }

        // there's a case where dateCreated is null in tags
        item.dateCreated = item.dateCreated || Date.now();
        item.title = alias || item.title;
        item.id = makeId(item.title);

        delete item.localOnly;
        delete item.noteIds;
        delete item.alias;
        return true;
      },
      note: async (item, db) => {
        for (const tag of item.tags || []) {
          if (!tag) continue;

          const oldTagId = makeId(tag);
          const oldTag = db.legacyTags.get(oldTagId);
          const alias = db.legacySettings.getAlias(oldTagId);
          const newTag = await db.tags.all.find((eb) =>
            eb("title", "in", [alias, tag])
          );

          const newTagId =
            newTag?.id ||
            (await db.tags.add({
              // IMPORTANT: the id must be deterministic to avoid creating
              // duplicate colors when migrating on different devices
              id: makeId(alias || tag),
              dateCreated: oldTag?.dateCreated,
              dateModified: oldTag?.dateModified,
              title: alias || tag,
              type: "tag"
            }));
          if (!newTagId) continue;
          await db.relations.add({ type: "tag", id: newTagId }, item);
          await db.legacyTags.delete(oldTagId);
        }

        if (item.color) {
          const oldColorId = makeId(item.color);
          const oldColor = db.legacyColors.get(oldColorId);
          const alias = db.legacySettings.getAlias(oldColorId);
          const newColor = await db.colors.all.find((eb) =>
            eb("title", "in", [alias, item.color])
          );

          const newColorId =
            newColor?.id ||
            (await db.colors.add({
              // IMPORTANT: the id must be deterministic to avoid creating
              // duplicate colors when migrating on different devices
              id: makeId(alias || item.color),
              dateCreated: oldColor?.dateCreated,
              dateModified: oldColor?.dateModified,
              title: alias || item.color,
              colorCode: DefaultColors[item.color],
              type: "color"
            }));
          if (newColorId) {
            await db.relations.add({ type: "color", id: newColorId }, item);
            await db.legacyColors.delete(oldColorId);
          }
        }

        if (item.notebooks) {
          for (const notebook of item.notebooks) {
            for (const topic of notebook.topics) {
              await db.relations.add({ type: "notebook", id: topic }, item);
            }
          }
        }

        if (item.locked) {
          const vault = await db.vaults.default();
          if (vault)
            await db.relations.add({ type: "vault", id: vault.id }, item);
        }

        delete item.locked;
        delete item.notebooks;
        delete item.tags;
        delete item.color;
        return true;
      },
      attachment: async (item, db) => {
        for (const noteId of item.noteIds || []) {
          await db.relations.add(
            { type: "note", id: noteId },
            { type: "attachment", id: item.id }
          );
        }

        if (item.metadata) {
          item.hash = item.metadata.hash;
          item.mimeType = item.metadata.type;
          item.hashType = item.metadata.hashType;
          item.filename = item.metadata.filename;
        }

        if (item.length) item.size = item.length;

        delete item.length;
        delete item.metadata;
        delete item.noteIds;
        return true;
      },
      notebook: async (item, db) => {
        for (const topic of item.topics || []) {
          const subNotebookId = await db.notebooks.add({
            id: topic.id,
            title: topic.title,
            dateCreated: topic.dateCreated,
            dateEdited: topic.dateEdited,
            dateModified: topic.dateModified
          });
          if (!subNotebookId) continue;
          await db.relations.add(item, { id: subNotebookId, type: "notebook" });
          // if the parent notebook is deleted, we should delete the newly
          // created notebooks too
          if (item.dateDeleted) {
            await db.trash.add("notebook", [subNotebookId], "app");
          }
        }
        delete item.topics;
        delete item.totalNotes;
        delete item.topic;
        return true;
      },
      shortcut: (item) => {
        if (item.item?.type === "topic") {
          item.item = { type: "notebook", id: item.item.id };
        }

        if (item.item) {
          item.itemId = item.item.id;
          item.itemType = item.item.type;
        }

        delete item.item;
        return true;
      },
      settings: async (item, db) => {
        if (item.trashCleanupInterval)
          await db.settings.setTrashCleanupInterval(item.trashCleanupInterval);
        if (item.defaultNotebook)
          await db.settings.setDefaultNotebook(
            item.defaultNotebook
              ? item.defaultNotebook.topic || item.defaultNotebook.id
              : undefined
          );

        if (item.titleFormat)
          await db.settings.setTitleFormat(item.titleFormat);
        if (item.dateFormat) await db.settings.setDateFormat(item.dateFormat);
        if (item.timeFormat) await db.settings.setTimeFormat(item.timeFormat);

        if (item.groupOptions) {
          for (const key in item.groupOptions) {
            if (!isGroupingKey(key)) continue;
            const value = item.groupOptions[key];
            if (!value) continue;
            if (key === "tags" && value.sortBy === "dateEdited")
              value.sortBy = "dateModified";
            await db.settings.setGroupOptions(key, value);
          }
        }
        if (item.toolbarConfig) {
          for (const key in item.toolbarConfig) {
            const value = item.toolbarConfig[key as ToolbarConfigPlatforms];
            if (!value) continue;
            await db.settings.setToolbarConfig(
              key as ToolbarConfigPlatforms,
              value
            );
          }
        }
        return true;
      },
      relation: (item) => {
        item.fromId = item.from!.id;
        item.fromType = item.from!.type;
        item.toId = item.to!.id;
        item.toType = item.to!.type;

        delete item.to;
        delete item.from;
        return true;
      },
      tiptap: (item) => {
        item.locked = isCipher(item.data);
        delete item.resolved;
        return true;
      },
      tiny: (item) => {
        delete item.resolved;
        return true;
      },
      notehistory: (item) => {
        delete item.data;
        return true;
      }
    },
    all: (item) => {
      delete item.deleteReason;
      return true;
    },
    async vaultKey(db, key) {
      await db.vaults.add({ title: "Default", key });
      await db.storage().remove("vaultKey");
    },
    async kv(db) {
      for (const key of KEYS) {
        const value = await db.storage().read(key);
        if (value === undefined || value === null) continue;
        await db.kv().write(key, value as any);
        await db.storage().remove(key);
      }
    }
  },
  {
    version: 6.0,
    items: {
      note: (item) => {
        delete item.locked;
        return true;
      }
    },
    all: (item) => {
      if (isDeleted(item)) {
        const allowedKeys = [
          "deleted",
          "dateModified",
          "id",
          "synced",
          "remote"
        ];
        for (const key in item) {
          if (allowedKeys.includes(key)) continue;
          delete (item as any)[key];
        }
        return true;
      }
    }
  },
  { version: 6.1, items: {} }
];

export async function migrateItem<TItemType extends MigrationItemType>(
  item: MaybeDeletedItem<MigrationItemMap[TItemType]>,
  itemVersion: number,
  databaseVersion: number,
  type: TItemType,
  database: Database,
  migrationType: MigrationType
) {
  let migrationStartIndex = migrations.findIndex(
    (m) => m.version === itemVersion
  );
  if (migrationStartIndex <= -1) {
    throw new Error(
      itemVersion > databaseVersion
        ? `Please update the app to the latest version.`
        : `You seem to be on a very outdated version. Please update the app to the latest version.`
    );
  }

  let count = 0;
  for (; migrationStartIndex < migrations.length; ++migrationStartIndex) {
    const migration = migrations[migrationStartIndex];
    if (migration.version === databaseVersion) break;

    let result =
      !!migration.all &&
      (await migration.all(item, database, migrationType, type));
    if (result === "skip") return "skip";
    if (result) {
      if (
        !isDeleted(item) &&
        item.type &&
        item.type !== "trash" &&
        item.type !== type
      )
        type = item.type as TItemType;
      count++;
    }

    const itemMigrator = migration.items[type];
    if (isDeleted(item) || !itemMigrator) continue;

    result = await itemMigrator(item, database, migrationType);
    if (result === "skip") return "skip";
    if (result) {
      if (item.type && item.type !== "trash" && item.type !== type)
        type = item.type as TItemType;
      count++;
    }
  }

  return count > 0;
}

/**
 * @deprecated
 */
export async function migrateCollection(
  collection: IndexedCollection,
  version: number
) {
  let migrationStartIndex = migrations.findIndex((m) => m.version === version);
  if (migrationStartIndex <= -1) {
    throw new Error(
      version > CURRENT_DATABASE_VERSION
        ? `Please update the app to the latest version.`
        : `You seem to be on a very outdated version. Please update the app to the latest version.`
    );
  }

  for (; migrationStartIndex < migrations.length; ++migrationStartIndex) {
    const migration = migrations[migrationStartIndex];
    if (migration.version === CURRENT_DATABASE_VERSION) break;

    if (!migration.collection) continue;
    await migration.collection(collection);
  }
}

/**
 * @deprecated
 */
export async function migrateVaultKey(
  db: Database,
  vaultKey: Cipher<"base64">,
  version: number,
  databaseVersion: number
) {
  let migrationStartIndex = migrations.findIndex((m) => m.version === version);
  if (migrationStartIndex <= -1) {
    throw new Error(
      version > databaseVersion
        ? `Please update the app to the latest version.`
        : `You seem to be on a very outdated version. Please update the app to the latest version.`
    );
  }

  for (; migrationStartIndex < migrations.length; ++migrationStartIndex) {
    const migration = migrations[migrationStartIndex];
    if (migration.version === databaseVersion) break;

    if (!migration.vaultKey) continue;
    await migration.vaultKey(db, vaultKey);
  }
}

/**
 * @deprecated
 */
export async function migrateKV(
  db: Database,
  version: number,
  databaseVersion: number
) {
  let migrationStartIndex = migrations.findIndex((m) => m.version === version);
  if (migrationStartIndex <= -1) {
    throw new Error(
      version > databaseVersion
        ? `Please update the app to the latest version.`
        : `You seem to be on a very outdated version. Please update the app to the latest version.`
    );
  }

  for (; migrationStartIndex < migrations.length; ++migrationStartIndex) {
    const migration = migrations[migrationStartIndex];
    if (migration.version === databaseVersion) break;

    if (!migration.kv) continue;
    await migration.kv(db);
  }
}

function replaceDateEditedWithDateModified(removeDateEditedProperty = false) {
  return function (item: any) {
    item.dateModified = item.dateEdited;
    if (removeDateEditedProperty) delete item.dateEdited;
    delete item.persistDateEdited;
    return true;
  };
}

function wrapTablesWithDiv(html: string) {
  const document = parseHTML(html);
  if (!document) return html;
  const tables = document.getElementsByTagName("table");
  for (const table of tables) {
    table.setAttribute("contenteditable", "true");
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "false");
    div.innerHTML = table.outerHTML;
    div.classList.add("table-container");
    table.replaceWith(div);
  }
  return "outerHTML" in document
    ? (document.outerHTML as string)
    : document.body.innerHTML;
}

function removeToxClassFromChecklist(html: string): string {
  const document = parseHTML(html);
  if (!document) return html;
  const checklists = document.querySelectorAll(
    ".tox-checklist,.tox-checklist--checked"
  );

  for (const item of checklists) {
    if (item.classList.contains("tox-checklist--checked"))
      item.classList.replace("tox-checklist--checked", "checked");
    else if (item.classList.contains("tox-checklist"))
      item.classList.replace("tox-checklist", "checklist");
  }
  return "outerHTML" in document
    ? (document.outerHTML as string)
    : document.body.innerHTML;
}

const regex = /&lt;div class="table-container".*&lt;\/table&gt;&lt;\/div&gt;/gm;
function decodeWrappedTableHtml(html: string) {
  return html.replace(regex, (match) => {
    const html = decodeHTML5(match);
    return html;
  });
}

const NEWLINE_REPLACEMENT_REGEX = /\n|<br>|<br\/>/gm;
const PREBLOCK_REGEX = /(<pre.*?>)(.*?)(<\/pre>)/gm;
const SPAN_REGEX = /<span class=.*?>(.*?)<\/span>/gm;

export function tinyToTiptap(html: string) {
  if (typeof html !== "string") return html;

  // Preserve newlines in pre blocks
  html = html
    .replace(/\n/gm, "<br/>")
    .replace(
      PREBLOCK_REGEX,
      (_pre, start: string, inner: string, end: string) => {
        let codeblock = start;
        codeblock += inner
          .replace(NEWLINE_REPLACEMENT_REGEX, "<br/>")
          .replace(SPAN_REGEX, (_span, inner) => inner);
        codeblock += end;
        return codeblock;
      }
    );

  const document = parseHTML(html);
  if (!document) return html;

  const tables = document.querySelectorAll("table");
  for (const table of tables) {
    table.removeAttribute("contenteditable");
    if (
      table.parentElement &&
      table.parentElement.nodeName.toLowerCase() === "div"
    ) {
      table.parentElement.replaceWith(table);
    }
  }

  const images = document.querySelectorAll("p > img");
  for (const image of images) {
    image.parentElement?.replaceWith(image.cloneNode());
  }

  const bogus = document.querySelectorAll("[data-mce-bogus]");
  for (const element of bogus) {
    element.remove();
  }

  const attributes = document.querySelectorAll(
    "[data-mce-href], [data-mce-flag]"
  );
  for (const element of attributes) {
    element.removeAttribute("data-mce-href");
    element.removeAttribute("data-mce-flag");
  }

  return document.body.innerHTML;
}

function changeSessionContentType(item: any) {
  if (item.id.endsWith("_content")) {
    item.contentType = item.type;
    item.type = "sessioncontent";
    return true;
  }
  return false;
}
