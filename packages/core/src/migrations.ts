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

import { parseHTML } from "./utils/html-parser";
import { decodeHTML5 } from "entities";
import { CURRENT_DATABASE_VERSION } from "./common";
import Database from "./api";
import { getId, makeId } from "./utils/id";
import {
  Color,
  ContentItem,
  HistorySession,
  Item,
  ItemMap,
  ItemType
} from "./types";
import { isCipher } from "./database/crypto";
import { IndexedCollection } from "./database/indexed-collection";

const ColorToHexCode: Record<string, string> = {
  red: "#f44336",
  orange: "#FF9800",
  yellow: "#FFD600",
  green: "#4CAF50",
  blue: "#2196F3",
  purple: "#673AB7",
  gray: "#9E9E9E",
  black: "#000000",
  white: "#ffffff"
};

type MigrationType = "local" | "sync" | "backup";
type MigrationItemType = ItemType | "notehistory" | "content" | "all";
type MigrationItemMap = ItemMap & {
  notehistory: HistorySession;
  content: ContentItem;
  all: Item;
};
type Migration = {
  version: number;
  items: {
    [P in MigrationItemType]?: (
      item: MigrationItemMap[P],
      db: Database,
      migrationType: MigrationType
    ) => boolean | Promise<boolean> | void;
  };
  collection?: (collection: IndexedCollection) => Promise<void> | void;
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
      trash: replaceDateEditedWithDateModified(),
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
            item: {
              type: pin.type,
              id: pin.data.id,
              notebookId: pin.data.notebookId
            }
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
        if (!item.data || isCipher(item.data)) return false;
        item.type = "tiptap";
        return changeSessionContentType(item);
      },
      content: (item) => {
        if (!item.data || isCipher(item.data)) return false;
        const oldType = item.type;
        item.type = "tiptap";
        return oldType !== item.type;
      },
      shortcut: (item) => {
        if (item.id === item.item.id) return false;
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
    items: {
      all: (item, _db, migrationType) => {
        if (migrationType === "local") {
          delete item.remote;
          return true;
        }
      }
    }
  },
  {
    version: 5.9,
    items: {
      tag: async (item, db) => {
        const alias = db.settings.getAlias(item.id);
        item.title = alias || item.title;
        item.id = getId(item.dateCreated);

        const colorCode = ColorToHexCode[item.title];
        if (colorCode) {
          (item as unknown as Color).type = "color";
          (item as unknown as Color).colorCode = colorCode;
        }

        delete item.localOnly;
        delete item.noteIds;
        delete item.alias;
        return true;
      },
      note: async (item, db) => {
        for (const tag of item.tags || []) {
          const oldTagId = makeId(tag);
          const oldTag = db.tags.tag(oldTagId);
          const alias = db.settings.getAlias(oldTagId);
          const newTag = db.tags.all.find(
            (t) => [alias, tag].includes(t.title) && t.id !== oldTagId
          );

          const newTagId =
            newTag?.id ||
            (await db.tags.add({
              dateCreated: oldTag?.dateCreated,
              dateModified: oldTag?.dateModified,
              title: alias || tag,
              type: "tag"
            }));
          if (!newTagId) continue;
          await db.relations.add({ type: "tag", id: newTagId }, item);
          await db.tags.delete(oldTagId);
        }

        if (item.color) {
          const oldColorId = makeId(item.color);
          const oldColor = db.tags.tag(oldColorId);
          const alias = db.settings.getAlias(oldColorId);
          const newColor = db.tags.all.find(
            (t) => [alias, item.color].includes(t.title) && t.id !== oldColorId
          );
          const newColorId =
            newColor?.id ||
            (await db.colors.add({
              dateCreated: oldColor?.dateCreated,
              dateModified: oldColor?.dateModified,
              title: alias || item.color,
              colorCode: ColorToHexCode[item.color],
              type: "color"
            }));
          if (newColorId) {
            await db.relations.add({ type: "color", id: newColorId }, item);
            await db.colors.delete(oldColorId);
          }
        }
        delete item.tags;
        delete item.color;
        return true;
      }
    }
  },
  {
    version: 6.0,
    items: {}
  }
];

export async function migrateItem<TItemType extends MigrationItemType>(
  item: MigrationItemMap[TItemType],
  version: number,
  type: TItemType,
  database: Database,
  migrationType: MigrationType
) {
  let migrationStartIndex = migrations.findIndex((m) => m.version === version);
  if (migrationStartIndex <= -1) {
    throw new Error(
      version > CURRENT_DATABASE_VERSION
        ? `Please update the app to the latest version.`
        : `You seem to be on a very outdated version. Please update the app to the latest version.`
    );
  }

  let count = 0;
  for (; migrationStartIndex < migrations.length; ++migrationStartIndex) {
    const migration = migrations[migrationStartIndex];
    if (migration.version === CURRENT_DATABASE_VERSION) break;

    if (
      migration.items.all &&
      (await migration.items.all(item, database, migrationType))
    )
      count++;

    const itemMigrator = migration.items[type];
    if (!itemMigrator) continue;
    if (await itemMigrator(item, database, migrationType)) count++;
  }

  return count > 0;
}

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
