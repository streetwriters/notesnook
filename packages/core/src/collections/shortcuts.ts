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

import Database from "../api/index.js";
import { SQLCachedCollection } from "../database/sql-cached-collection.js";
import { Notebook, Shortcut, Tag } from "../types.js";
import { ICollection } from "./collection.js";

type ResolveTypeToItem<T extends "notebooks" | "tags" | "all"> =
  T extends "tags"
    ? Tag[]
    : T extends "notebooks"
    ? Notebook[]
    : (Tag | Notebook)[];

const ALLOWED_SHORTCUT_TYPES = ["notebook", "topic", "tag"];
export class Shortcuts implements ICollection {
  name = "shortcuts";
  readonly collection: SQLCachedCollection<"shortcuts", Shortcut>;
  constructor(private readonly db: Database) {
    this.collection = new SQLCachedCollection(
      db.sql,
      db.transaction,
      "shortcuts",
      db.eventManager,
      db.sanitizer
    );
  }

  init() {
    return this.collection.init();
  }

  async add(shortcut: Partial<Shortcut>) {
    if (!shortcut) return;
    if (shortcut.remote)
      throw new Error(
        "Please use db.shortcuts.merge to merge remote shortcuts."
      );

    if (
      shortcut.itemId &&
      shortcut.itemType &&
      !ALLOWED_SHORTCUT_TYPES.includes(shortcut.itemType)
    )
      throw new Error("Cannot create a shortcut for this type of item.");

    const oldShortcut = shortcut.itemId
      ? this.shortcut(shortcut.itemId)
      : shortcut.id
      ? this.shortcut(shortcut.id)
      : null;

    shortcut = {
      ...oldShortcut,
      ...shortcut
    };

    if (!shortcut.itemId || !shortcut.itemType)
      throw new Error("Cannot create a shortcut without an item.");

    const id = shortcut.id || shortcut.itemId;

    await this.collection.upsert({
      id,
      type: "shortcut",
      itemId: shortcut.itemId,
      itemType: shortcut.itemType,
      dateCreated: shortcut.dateCreated || Date.now(),
      dateModified: shortcut.dateModified || Date.now(),
      sortIndex: -1 // await this.collection.count()
    });
    return id;
  }

  // get raw() {
  //   return this.collection.raw();
  // }

  get all() {
    return this.collection.items();
  }

  async resolved<T extends "notebooks" | "tags" | "all">(
    type: T = "all" as T
  ): Promise<ResolveTypeToItem<T>> {
    const tagIds: string[] = [];
    const notebookIds: string[] = [];

    for (const shortcut of this.all) {
      if (
        (type === "all" || type === "notebooks") &&
        shortcut.itemType === "notebook"
      )
        notebookIds.push(shortcut.itemId);
      else if (
        (type === "all" || type === "tags") &&
        shortcut.itemType === "tag"
      )
        tagIds.push(shortcut.itemId);
    }

    const notebooks =
      notebookIds.length > 0
        ? await this.db.notebooks.all.items(notebookIds)
        : [];
    const tags = tagIds.length > 0 ? await this.db.tags.all.items(tagIds) : [];

    const sortedItems: (Notebook | Tag)[] = [];

    this.all
      .sort((a, b) => a.dateCreated - b.dateCreated)
      .forEach((shortcut) => {
        if (type === "all" || type === "notebooks") {
          const notebook = notebooks.find((n) => n.id === shortcut.itemId);
          if (notebook) sortedItems.push(notebook);
        }
        if (type === "all" || type === "tags") {
          const tag = tags.find((t) => t.id === shortcut.itemId);
          if (tag) sortedItems.push(tag);
        }
      });

    return sortedItems as ResolveTypeToItem<T>;
  }

  exists(id: string) {
    return this.collection.exists(id);
  }

  shortcut(id: string) {
    return this.collection.get(id);
  }

  async remove(...shortcutIds: string[]) {
    await this.collection.softDelete(shortcutIds);
    // await this.db
    //   .sql()
    //   .deleteFrom("shortcuts")
    //   .where((eb) =>
    //     eb.or([eb("id", "in", shortcutIds), eb("itemId", "in", shortcutIds)])
    //   )
    //   .execute();
    // const shortcuts = this.all.filter(
    //   (shortcut) =>
    //     shortcutIds.includes(shortcut.item.id) ||
    //     shortcutIds.includes(shortcut.id)
    // );
    // for (const { id } of shortcuts) {
    //   await this.collection.remove(id);
    // }
  }
}
