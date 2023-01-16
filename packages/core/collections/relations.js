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

import { makeId } from "../utils/id";
import Collection from "./collection";

/**
 * @typedef {{
 *  id: string;
 *  type: string;
 * }} ItemReference
 *
 * @typedef {{
 *  id: string;
 *  type: string;
 *  from: ItemReference;
 *  to: ItemReference;
 *  dateCreated: number;
 *  dateModified: number;
 * }} Relation
 */

export default class Relations extends Collection {
  async merge(relation) {
    if (!relation) return;
    await this._collection.addItem(relation);
  }

  /**
   *
   * @param {ItemReference} from
   * @param {ItemReference} to
   */
  async add(from, to) {
    if (
      this.all.find(
        (a) =>
          compareItemReference(a.from, from) && compareItemReference(a.to, to)
      )
    )
      return;

    const relation = {
      id: generateId(from, to),
      type: "relation",
      dateCreated: Date.now(),
      dateModified: Date.now(),
      from: { id: from.id, type: from.type },
      to: { id: to.id, type: to.type }
    };

    await this._collection.addItem(relation);
  }

  /**
   *
   * @param {ItemReference} reference
   * @param {string} type
   */
  from(reference, type) {
    const relations = this.all.filter(
      (a) => compareItemReference(a.from, reference) && a.to.type === type
    );
    return this.resolve(relations, "to");
  }

  /**
   *
   * @param {ItemReference} reference
   * @param {string} type
   */
  to(reference, type) {
    const relations = this.all.filter(
      (a) => compareItemReference(a.to, reference) && a.from.type === type
    );
    return this.resolve(relations, "from");
  }

  get raw() {
    return this._collection.getRaw();
  }

  /**
   * @return {Relation[]}
   */
  get all() {
    return this._collection.getItems();
  }

  /**
   * @return {Relation}
   */
  relation(id) {
    return this._collection.getItem(id);
  }

  async remove(...ids) {
    for (const id of ids) {
      await this._collection.removeItem(id);
    }
  }

  /**
   * @param {Relation[]} relations
   * @param {"from" | "to"} resolveType
   * @private
   *
   * @returns {Relation[]}
   */
  resolve(relations, resolveType) {
    const items = [];
    for (const relation of relations) {
      const reference = resolveType === "from" ? relation.from : relation.to;

      let item = null;
      switch (reference.type) {
        case "reminder":
          item = this._db.reminders.reminder(reference.id);
          break;
        case "note":
          item = this._db.notes.note(reference.id)?.data;
          break;
      }
      if (item) items.push(item);
    }
    return items;
  }

  async cleanup() {
    const relations = this._collection.getItems();
    for (const relation of relations) {
      const references = [relation.to, relation.from];
      for (let reference of references) {
        let exists = false;
        switch (reference.type) {
          case "reminder":
            exists = this._db.reminders.exists(reference.id);
            break;
          case "note":
            exists =
              this._db.notes.exists(reference.id) ||
              this._db.trash.exists(reference.id);
            break;
        }
        if (!exists) await this.remove(relation.id);
      }
    }
  }
}

/**
 *
 * @param {ItemReference} a
 * @param {ItemReference} b
 */
function compareItemReference(a, b) {
  return a.id === b.id && a.type === b.type;
}

/**
 * Generate deterministic constant id from `a` & `b` item reference.
 * @param {ItemReference} a
 * @param {ItemReference} b
 */
function generateId(a, b) {
  const str = `${a.id}${b.id}${a.type}${b.type}`;
  return makeId(str);
}
