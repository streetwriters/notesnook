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

import { ICollection } from "./collection";
import { makeId } from "../utils/id";
import { deleteItems, hasItem } from "../utils/array";
import { set } from "../utils/set";
import { Mutex } from "async-mutex";
import { Tag } from "../entities";
import CachedCollection from "../database/cached-collection";
import { IStorage } from "../interfaces";

export class Tags implements ICollection<"tags", Tag> {
  private readonly collection: CachedCollection<"tags", Tag>;
  private readonly mutex: Mutex;
  constructor(storage: IStorage) {
    this.collection = new CachedCollection(storage, "tags");
    this.mutex = new Mutex();
  }

  tag(id: string) {
    const tagItem = this.all.find((t) => t.id === id || t.title === id);
    return tagItem;
  }

  async merge(tag: Tag) {
    if (!tag) return;
    await this.collection.addItem(tag);
  }

  async add(tagId: string, ...noteIds: string[]) {
    return this.mutex.runExclusive(async () => {
      tagId = this.sanitize(tagId);
      if (!tagId) throw new Error("Tag title cannot be empty.");

      let tag = this.tag(tagId);

      if (tag && !noteIds.length)
        throw new Error("A tag with this id already exists.");

      tag = tag || {
        title: tagId
      };

      let id = tag.id || makeId(tag.title.toLowerCase());
      let notes = tag.noteIds || [];

      tag = {
        type: "tag",
        id,
        title: tag.title,
        noteIds: set.union(notes, noteIds),
        localOnly: true
      };

      await this.collection.addItem(tag);
      if (!this._db.settings.getAlias(tag.id))
        await this._db.settings.setAlias(tag.id, tag.title);
      return tag;
    });
  }

  async rename(tagId: string, newName: string) {
    const tag = this.tag(tagId);
    if (!tag) {
      console.error(`No tag found. Tag id:`, tagId);
      return;
    }

    newName = this.sanitize(newName);

    await this._db.settings.setAlias(tagId, newName);
    await this.collection.addItem({ ...tag, alias: newName });
  }

  alias(tagId: string) {
    const tag = this.tag(tagId);
    if (!tag) {
      console.error(`No tag found. Tag id:`, tagId);
      return;
    }

    return this._db.settings.getAlias(tag.id) || tag.title;
  }

  get raw() {
    return this.collection.getRaw();
  }

  get all() {
    return this.collection.getItems((item) => {
      item.alias = this._db.settings.getAlias(item.id) || item.title;
      return item;
    });
  }

  async remove(tagId: string) {
    const tag = this.tag(tagId);
    if (!tag) {
      console.error(`No tag found. Tag id:`, tagId);
      return;
    }

    for (const noteId of tag.noteIds) {
      const note = this._db.notes.note(noteId);
      if (!note) continue;
      if (hasItem(note.tags, tag.title)) await note.untag(tag.title);
    }

    await this._db.shortcuts.remove(tagId);
    await this.collection.deleteItem(tagId);
  }

  async untag(tagId: string, ...noteIds: string[]) {
    const tag = this.tag(tagId);
    if (!tag) {
      console.error(`No such tag found. Tag title:`, tagId);
      return;
    }

    deleteItems(tag.noteIds, ...noteIds);

    if (tag.noteIds.length > 0) await this.collection.addItem(tag);
    else {
      await this._db.shortcuts.remove(tag.id);
      await this.collection.deleteItem(tag.id);
    }
  }

  sanitize(tag: string) {
    let sanitized = tag.toLocaleLowerCase();
    sanitized = sanitized.replace(/[\s]+/g, "");
    // sanitized = sanitized.replace(/[+!@#$%^&*()+{}\][:;'"<>?/.\s=,]+/g, "");
    return sanitized.trim();
  }
}
