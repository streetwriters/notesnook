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
import Notebook from "../models/notebook";
import { getId } from "../utils/id";
import { CHECK_IDS, checkIsUserPremium } from "../common";
import qclone from "qclone";

export default class Notebooks extends Collection {
  async merge(remoteNotebook) {
    if (remoteNotebook.deleted)
      return await this._collection.addItem(remoteNotebook);

    const id = remoteNotebook.id || id();
    let localNotebook = this._collection.getItem(id);

    if (localNotebook && localNotebook.topics?.length) {
      const lastSyncedTimestamp = await this._db.lastSynced();
      let isChanged = false;
      // merge new and old topics
      for (let oldTopic of localNotebook.topics) {
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
    return await this._collection.addItem(remoteNotebook);
  }

  async add(notebookArg) {
    if (!notebookArg) throw new Error("Notebook cannot be undefined or null.");
    if (notebookArg.remote)
      throw new Error(
        "Please use db.notebooks.merge to merge remote notebooks"
      );

    //TODO reliably and efficiently check for duplicates.
    const id = notebookArg.id || getId();
    let oldNotebook = this._collection.getItem(id);

    if (
      !oldNotebook &&
      this.all.length >= 3 &&
      !(await checkIsUserPremium(CHECK_IDS.notebookAdd))
    )
      return;

    let notebook = {
      ...oldNotebook,
      ...notebookArg
    };

    if (!notebook.title) throw new Error("Notebook must contain a title.");

    notebook = {
      id,
      type: "notebook",
      title: notebook.title,
      description: notebook.description,
      pinned: !!notebook.pinned,
      topics: notebook.topics || [],

      dateCreated: notebook.dateCreated,
      dateModified: notebook.dateModified,
      dateEdited: Date.now()
    };

    await this._collection.addItem(notebook);

    if (!oldNotebook) {
      await this.notebook(notebook).topics.add(...notebook.topics);
    }
    return id;
  }

  get raw() {
    return this._collection.getRaw();
  }

  /**
   * @return {any[]}
   */
  get all() {
    return this._collection.getItems();
  }

  get pinned() {
    return this.all.filter((item) => item.pinned === true);
  }

  get deleted() {
    return this.raw.filter((item) => item.dateDeleted > 0);
  }

  /**
   *
   * @param {string} id The id of the notebook
   * @returns {Notebook} The notebook of the given id
   */
  notebook(id) {
    let notebook = id.type ? id : this._collection.getItem(id);
    if (!notebook || notebook.deleted) return;
    return new Notebook(notebook, this._db);
  }

  exists(id) {
    return this._collection.exists(id);
  }

  async delete(...ids) {
    for (let id of ids) {
      let notebook = this.notebook(id);
      if (!notebook) continue;
      const notebookData = qclone(notebook.data);
      // await notebook.topics.delete(...notebook.data.topics);
      await this._collection.removeItem(id);
      await this._db.shortcuts.remove(id);
      await this._db.trash.add(notebookData);
    }
  }
}
