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

import { filter, parse } from "liqe";
import Database from ".";
import {
  Attachment,
  Note,
  Notebook,
  Reminder,
  Tag,
  Topic,
  TrashItem,
  isDeleted
} from "../types";
import { isUnencryptedContent } from "../collections/content";

export default class Lookup {
  constructor(private readonly db: Database) {}

  async notes(notes: Note[], query: string) {
    const contents = await this.db.content.multi(
      notes.map((note) => note.contentId || "")
    );

    return search(notes, query, (note) => {
      let text = note.title;
      const noteContent = note.contentId ? contents[note.contentId] : "";
      if (
        !note.locked &&
        noteContent &&
        !isDeleted(noteContent) &&
        isUnencryptedContent(noteContent)
      )
        text += noteContent.data;
      return text;
    });
  }

  notebooks(array: Notebook[], query: string) {
    return search(
      array,
      query,
      (n) =>
        `${n.title} ${n.description} ${n.topics.map((t) => t.title).join(" ")}`
    );
  }

  topics(array: Topic[], query: string) {
    return this.byTitle(array, query);
  }

  tags(array: Tag[], query: string) {
    return this.byTitle(array, query);
  }

  reminders(array: Reminder[], query: string) {
    return search(array, query, (n) => `${n.title} ${n.description || ""}`);
  }

  trash(array: TrashItem[], query: string) {
    return this.byTitle(array, query);
  }

  attachments(array: Attachment[], query: string) {
    return search(
      array,
      query,
      (n) => `${n.metadata.filename} ${n.metadata.type} ${n.metadata.hash}`
    );
  }

  private byTitle<T extends { title: string }>(array: T[], query: string) {
    return search(array, query, (n) => n.title);
  }
}

function search<T>(items: T[], query: string, selector: (item: T) => string) {
  try {
    return filter(
      parse(`text:"${query.toLowerCase()}"`),
      items.map((item) => {
        return { item, text: selector(item).toLowerCase() };
      })
    ).map((v) => v.item);
  } catch (e) {
    return [];
  }
}
