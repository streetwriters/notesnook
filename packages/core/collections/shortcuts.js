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

import Collection from "./collection";

/**
 * @typedef {{
 *  id: string,
 *  type: "tag" | "notebook" | "topic",
 *  notebookId?: string
 * }} ShortcutRef
 *
 * @typedef {{
 *  id: string,
 *  type: "shortcut",
 *  item: ShortcutRef,
 *  dateCreated: number,
 *  dateModified: number,
 *  sortIndex: number
 * }} Shortcut
 *
 */

const ALLOWED_SHORTCUT_TYPES = ["notebook", "topic", "tag"];
export default class Shortcuts extends Collection {
  async merge(shortcut) {
    if (!shortcut) return;
    await this._collection.addItem(shortcut);
  }

  /**
   *
   * @param {Partial<Shortcut>} shortcut
   * @returns
   */
  async add(shortcut) {
    if (!shortcut) return;
    if (shortcut.remote)
      throw new Error(
        "Please use db.shortcuts.merge to merge remote shortcuts."
      );

    if (!ALLOWED_SHORTCUT_TYPES.includes(shortcut.item.type))
      throw new Error("Cannot create a shortcut for this type of item.");

    let oldShortcut = shortcut.item
      ? this.shortcut(shortcut.item.id)
      : shortcut.id
      ? this._collection.getItem(shortcut.id)
      : null;

    shortcut = {
      ...oldShortcut,
      ...shortcut
    };

    const id = shortcut.id || shortcut.item.id;

    shortcut = {
      id,
      type: "shortcut",
      item: {
        type: shortcut.item.type,
        id: shortcut.item.id,
        notebookId: shortcut.item.notebookId
      },
      dateCreated: shortcut.dateCreated,
      dateModified: shortcut.dateModified,
      sortIndex: this._collection.count()
    };

    await this._collection.addItem(shortcut);
    return shortcut.id;
  }

  get raw() {
    return this._collection.getRaw();
  }

  /**
   * @return {Shortcut[]}
   */
  get all() {
    return this._collection.getItems();
  }

  get resolved() {
    return this.all.reduce((prev, shortcut) => {
      const {
        item: { id, type, notebookId }
      } = shortcut;

      let item = null;
      switch (type) {
        case "notebook": {
          const notebook = this._db.notebooks.notebook(id);
          item = notebook ? notebook.data : null;
          break;
        }
        case "topic": {
          const notebook = this._db.notebooks.notebook(notebookId);
          if (notebook) {
            const topic = notebook.topics.topic(id);
            if (topic) item = topic._topic;
          }
          break;
        }
        case "tag":
          item = this._db.tags.tag(id);
          break;
      }
      if (item) prev.push(item);
      return prev;
    }, []);
  }

  exists(itemId) {
    return !!this.shortcut(itemId);
  }

  shortcut(id) {
    return this.all.find(
      (shortcut) => shortcut.item.id === id || shortcut.id === id
    );
  }

  async remove(...shortcutIds) {
    const shortcuts = this.all.filter(
      (shortcut) =>
        shortcutIds.includes(shortcut.item.id) ||
        shortcutIds.includes(shortcut.id)
    );
    for (const { id } of shortcuts) {
      await this._collection.removeItem(id);
    }
  }
}
