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

import { getId } from "../utils/id";
import { CachedCollection } from "../database/cached-collection";
import { MaybeDeletedItem, Tag } from "../types";
import Database from "../api";
import { ICollection } from "./collection";

export class Tags implements ICollection {
  name = "tags";
  readonly collection: CachedCollection<"tags", Tag>;
  constructor(private readonly db: Database) {
    this.collection = new CachedCollection(db.storage, "tags", db.eventManager);
  }

  init() {
    return this.collection.init();
  }

  tag(id: string) {
    return this.collection.get(id);
  }

  async merge(remoteTag: MaybeDeletedItem<Tag>) {
    if (!remoteTag) return;

    const localTag = this.collection.get(remoteTag.id);
    if (!localTag || remoteTag.dateModified > localTag.dateModified)
      await this.collection.add(remoteTag);
  }

  async add(item: Partial<Tag>) {
    if (item.remote)
      throw new Error("Please use db.tags.merge to merge remote tags.");

    const id = item.id || getId(item.dateCreated);
    const oldTag = this.tag(id);

    item.title = item.title ? Tags.sanitize(item.title) : item.title;
    if (!item.title && !oldTag?.title) throw new Error("Title is required.");

    const tag: Tag = {
      id,
      dateCreated: item.dateCreated || oldTag?.dateCreated || Date.now(),
      dateModified: item.dateModified || oldTag?.dateModified || Date.now(),
      title: item.title || oldTag?.title || "",
      type: "tag",
      remote: false
    };
    await this.collection.add(tag);
    return tag.id;
  }

  get raw() {
    return this.collection.raw();
  }

  get all() {
    return this.collection.items();
  }

  async remove(id: string) {
    await this.collection.remove(id);
    await this.db.relations.cleanup();
  }

  async delete(id: string) {
    await this.collection.delete(id);
    await this.db.relations.cleanup();
  }

  exists(id: string) {
    return this.collection.exists(id);
  }

  static sanitize(title: string) {
    return title.replace(/^\s+|\s+$/gm, "");
  }
}
