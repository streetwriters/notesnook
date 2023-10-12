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

import uFuzzy from "@leeoniya/ufuzzy";
import Database from ".";
import {
  Attachment,
  GroupedItems,
  Note,
  Notebook,
  Reminder,
  Tag,
  TrashItem
} from "../types";
import { DatabaseSchemaWithFTS, isFalse } from "../database";
import { Kysely, sql } from "kysely";

export default class Lookup {
  constructor(private readonly db: Database) {}

  async notes(
    query: string,
    ids?: string[]
  ): Promise<Note & { rank: number }[]> {
    const db = this.db.sql() as Kysely<DatabaseSchemaWithFTS>;
    return (await db
      .with("matching", (eb) =>
        eb
          .selectFrom("content_fts")
          .where("data", "match", query)
          .select(["noteId as id", "rank"])
          .unionAll(
            eb
              .selectFrom("notes_fts")
              .where("title", "match", query)
              // add 10 weight to title
              .select(["id", sql.raw<number>(`rank * 10`).as("rank")])
          )
      )
      .selectFrom("notes")
      .$if(!!ids && ids.length > 0, (eb) => eb.where("id", "in", ids!))
      .where(isFalse("notes.deleted"))
      .where(isFalse("notes.dateDeleted"))
      .innerJoin("matching", (eb) => eb.onRef("notes.id", "==", "matching.id"))
      .orderBy("matching.rank")
      .selectAll()
      .execute()) as unknown as Note & { rank: number }[];
  }

  notebooks(array: Notebook[], query: string) {
    return search(array, query, (n) => `${n.title} ${n.description}}`);
  }

  tags(array: GroupedItems<Tag>, query: string) {
    return this.byTitle(array, query);
  }

  reminders(array: Reminder[], query: string) {
    return search(array, query, (n) => `${n.title} ${n.description || ""}`);
  }

  trash(array: TrashItem[], query: string) {
    return this.byTitle(array, query);
  }

  attachments(array: Attachment[], query: string) {
    return search(array, query, (n) => `${n.filename} ${n.mimeType} ${n.hash}`);
  }

  private byTitle<T extends { title: string }>(array: T[], query: string) {
    return search(array, query, (n) => n.title);
  }
}

const uf = new uFuzzy();
function search<T>(items: T[], query: string, selector: (item: T) => string) {
  try {
    const [_idxs, _info, order] = uf.search(items.map(selector), query, true);
    if (!order) return [];
    const filtered: T[] = [];
    for (const i of order) {
      filtered.push(items[i]);
    }
    return filtered;
  } catch (e) {
    return [];
  }
}
