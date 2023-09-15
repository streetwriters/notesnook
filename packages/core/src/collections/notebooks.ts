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

import { createNotebookModel } from "../models/notebook";
import { getId } from "../utils/id";
import { CachedCollection } from "../database/cached-collection";
import Database from "../api";
import { BaseTrashItem, Notebook, TrashOrItem, isTrashItem } from "../types";
import { ICollection } from "./collection";

export class Notebooks implements ICollection {
  name = "notebooks";
  /**
   * @internal
   */
  collection: CachedCollection<"notebooks", TrashOrItem<Notebook>>;
  constructor(private readonly db: Database) {
    this.collection = new CachedCollection(
      db.storage,
      "notebooks",
      db.eventManager
    );
  }

  init() {
    return this.collection.init();
  }

  async add(notebookArg: Partial<Notebook>) {
    if (!notebookArg) throw new Error("Notebook cannot be undefined or null.");
    if (notebookArg.remote)
      throw new Error(
        "Please use db.notebooks.merge to merge remote notebooks"
      );

    //TODO reliably and efficiently check for duplicates.
    const id = notebookArg.id || getId();
    const oldNotebook = this.collection.get(id);

    if (oldNotebook && isTrashItem(oldNotebook))
      throw new Error("Cannot modify trashed notebooks.");

    const mergedNotebook: Partial<Notebook> = {
      ...oldNotebook,
      ...notebookArg
    };

    if (!mergedNotebook.title)
      throw new Error("Notebook must contain a title.");

    const notebook: Notebook = {
      id,
      type: "notebook",
      title: mergedNotebook.title,
      description: mergedNotebook.description,
      pinned: !!mergedNotebook.pinned,

      dateCreated: mergedNotebook.dateCreated || Date.now(),
      dateModified: mergedNotebook.dateModified || Date.now(),
      dateEdited: Date.now()
    };

    await this.collection.add(notebook);
    return id;
  }

  get raw() {
    return this.collection.raw();
  }

  get all() {
    return this.collection.items((note) =>
      isTrashItem(note) ? undefined : note
    ) as Notebook[];
  }

  get pinned() {
    return this.all.filter((item) => item.pinned === true);
  }

  get trashed() {
    return this.raw.filter((item) =>
      isTrashItem(item)
    ) as BaseTrashItem<Notebook>[];
  }

  async pin(...ids: string[]) {
    for (const id of ids) {
      if (!this.exists(id)) continue;
      await this.add({ id, pinned: true });
    }
  }

  async unpin(...ids: string[]) {
    for (const id of ids) {
      if (!this.exists(id)) continue;
      await this.add({ id, pinned: false });
    }
  }

  totalNotes(id: string) {
    let count = 0;
    const subNotebooks = this.db.relations.from(
      { type: "notebook", id },
      "notebook"
    );
    for (const notebook of subNotebooks) {
      count += this.totalNotes(notebook.to.id);
    }
    count += this.db.relations.from({ type: "notebook", id }, "note").length;
    return count;
  }

  notebook(idOrNotebook: string | Notebook) {
    const notebook =
      typeof idOrNotebook === "string"
        ? this.collection.get(idOrNotebook)
        : idOrNotebook;
    if (!notebook || isTrashItem(notebook)) return;
    return createNotebookModel(notebook, this.db);
  }

  exists(id: string) {
    return this.collection.exists(id);
  }

  async delete(...ids: string[]) {
    for (const id of ids) {
      const notebook = this.collection.get(id);
      if (!notebook || isTrashItem(notebook)) continue;
      await this.collection.remove(id);
      await this.db.shortcuts?.remove(id);
      await this.db.trash?.add(notebook);
    }
  }
}
