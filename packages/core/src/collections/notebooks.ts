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
import { CHECK_IDS, checkIsUserPremium } from "../common";
import { CachedCollection } from "../database/cached-collection";
import Topics from "./topics";
import Database from "../api";
import {
  MaybeDeletedItem,
  Notebook,
  Topic,
  TrashItem,
  TrashOrItem,
  isDeleted,
  isTrashItem
} from "../types";
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

  async merge(remoteNotebook: MaybeDeletedItem<TrashOrItem<Notebook>>) {
    if (isDeleted(remoteNotebook) || isTrashItem(remoteNotebook))
      return await this.collection.add(remoteNotebook);

    const id = remoteNotebook.id;
    const localNotebook = this.collection.get(id);

    if (localNotebook && localNotebook.topics?.length) {
      const lastSyncedTimestamp = await this.db.lastSynced();
      let isChanged = false;
      // merge new and old topics
      for (const oldTopic of localNotebook.topics) {
        const newTopicIndex = remoteNotebook.topics.findIndex(
          (t) => t.id === oldTopic.id
        );
        const newTopic = remoteNotebook.topics[newTopicIndex];

        // CASE 1: if topic exists in old notebook but not in new notebook, it's deleted.
        // However, if the dateEdited of topic in the old notebook is > lastSyncedTimestamp
        // it was newly added or edited so add it to the new notebook.
        if (!newTopic && oldTopic.dateEdited > lastSyncedTimestamp) {
          remoteNotebook.topics.push({ ...oldTopic, dateEdited: Date.now() });
          isChanged = true;
        }

        // CASE 2: if topic exists in new notebook but not in old notebook, it's new.
        // This case will be automatically handled as the new notebook is our source of truth.

        // CASE 3: if topic exists in both notebooks:
        //      if oldTopic.dateEdited > newTopic.dateEdited: we keep oldTopic
        //      and merge the notes of both topics.
        else if (newTopic && oldTopic.dateEdited > newTopic.dateEdited) {
          remoteNotebook.topics[newTopicIndex] = {
            ...oldTopic,
            dateEdited: Date.now()
          };
          isChanged = true;
        }
      }
      remoteNotebook.remote = !isChanged;
    }
    return await this.collection.add(remoteNotebook);
  }

  async add(
    notebookArg: Partial<
      Omit<Notebook, "topics"> & { topics: Partial<Topic>[] }
    >
  ) {
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

    if (
      !oldNotebook &&
      this.all.length >= 3 &&
      !(await checkIsUserPremium(CHECK_IDS.notebookAdd))
    )
      return;

    const mergedNotebook: Partial<Notebook> = {
      ...oldNotebook,
      ...notebookArg,
      topics: oldNotebook?.topics || []
    };

    if (!mergedNotebook.title)
      throw new Error("Notebook must contain a title.");

    const notebook: Notebook = {
      id,
      type: "notebook",
      title: mergedNotebook.title,
      description: mergedNotebook.description,
      pinned: !!mergedNotebook.pinned,
      topics: mergedNotebook.topics || [],

      dateCreated: mergedNotebook.dateCreated || Date.now(),
      dateModified: mergedNotebook.dateModified || Date.now(),
      dateEdited: Date.now()
    };

    await this.collection.add(notebook);

    if (!oldNotebook && notebookArg.topics) {
      await this.topics(id).add(...notebookArg.topics);
    }
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
    ) as TrashOrItem<Notebook>[];
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

  topics(id: string) {
    return new Topics(id, this.db);
  }

  totalNotes(id: string) {
    const notebook = this.collection.get(id);
    if (!notebook || isTrashItem(notebook)) return 0;
    let count = 0;
    for (const topic of notebook.topics) {
      count += this.db.notes.topicReferences.count(topic.id);
    }
    return count + this.db.relations.from(notebook, "note").resolved().length;
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
