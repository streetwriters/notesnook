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

export class Lookup {
  /**
   *
   * @param {import('./index').default} db
   */
  constructor(db) {
    this._db = db;
  }

  async notes(notes, query) {
    const contents = await this._db.content.multi(
      notes.map((note) => note.contentId || "")
    );

    return search(notes, query, (note) => {
      let text = note.title;
      if (!note.locked && !!note.contentId && !!contents[note.contentId])
        text += contents[note.contentId]["data"];
      return text;
    });
  }

  notebooks(array, query) {
    return search(
      array,
      query,
      (n) =>
        `${n.title} ${n.description} ${n.topics.map((t) => t.title).join(" ")}`
    );
  }

  topics(array, query) {
    return this._byTitle(array, query);
  }

  tags(array, query) {
    return this._byTitle(array, query);
  }

  reminders(array, query) {
    return search(array, query, (n) => `${n.title} ${n.description || ""}`);
  }

  trash(array, query) {
    return this._byTitle(array, query);
  }

  attachments(array, query) {
    return search(
      array,
      query,
      (n) => `${n.metadata.filename} ${n.metadata.type} ${n.metadata.hash}`
    );
  }

  _byTitle(array, query) {
    return search(array, query, (n) => n.alias || n.title);
  }
}

function search(items, query, selector) {
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
