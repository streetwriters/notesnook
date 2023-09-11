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

import { CachedCollection } from "../database/cached-collection";
import { makeId } from "../utils/id";
import { ICollection } from "./collection";
import { Relation, ItemMap, ItemReference, MaybeDeletedItem } from "../types";
import Database from "../api";

type RelationsArray<TType extends keyof ItemMap> = Relation[] & {
  resolved: (limit?: number) => ItemMap[TType][];
};

export class Relations implements ICollection {
  name = "relations";
  readonly collection: CachedCollection<"relations", Relation>;
  constructor(private readonly db: Database) {
    this.collection = new CachedCollection(
      db.storage,
      "relations",
      db.eventManager
    );
  }

  init() {
    return this.collection.init();
  }

  async merge(relation: MaybeDeletedItem<Relation>) {
    await this.collection.add(relation);
  }

  async add(from: ItemReference, to: ItemReference) {
    if (
      this.all.find(
        (a) =>
          compareItemReference(a.from, from) && compareItemReference(a.to, to)
      )
    )
      return;

    const relation: Relation = {
      id: generateId(from, to),
      type: "relation",
      dateCreated: Date.now(),
      dateModified: Date.now(),
      from: { id: from.id, type: from.type },
      to: { id: to.id, type: to.type }
    };

    await this.collection.add(relation);
  }

  from<TType extends keyof ItemMap>(
    reference: ItemReference,
    type: TType
  ): RelationsArray<TType> {
    const relations = this.all.filter(
      (a) => compareItemReference(a.from, reference) && a.to.type === type
    );
    Object.defineProperties(relations, {
      resolved: {
        writable: false,
        enumerable: false,
        configurable: false,
        value: (limit?: number) =>
          this.resolve(limit ? relations.slice(0, limit) : relations, "to")
      }
    });
    return relations as RelationsArray<TType>;
  }

  to<TType extends keyof ItemMap>(
    reference: ItemReference,
    type: TType
  ): RelationsArray<TType> {
    const relations = this.all.filter(
      (a) => compareItemReference(a.to, reference) && a.from.type === type
    );
    Object.defineProperties(relations, {
      resolved: {
        writable: false,
        enumerable: false,
        configurable: false,
        value: (limit?: number) =>
          this.resolve(limit ? relations.slice(0, limit) : relations, "from")
      }
    });
    return relations as RelationsArray<TType>;
  }

  get raw() {
    return this.collection.raw();
  }

  get all(): Relation[] {
    return this.collection.items();
  }

  relation(id: string) {
    return this.collection.get(id);
  }

  async remove(...ids: string[]) {
    for (const id of ids) {
      await this.collection.remove(id);
    }
  }

  async unlink(from: ItemReference, to: ItemReference) {
    const relation = this.all.find(
      (a) =>
        compareItemReference(a.from, from) && compareItemReference(a.to, to)
    );
    if (!relation) return;

    await this.remove(relation.id);
  }

  async unlinkAll(to: ItemReference, type: keyof ItemMap) {
    for (const relation of this.all.filter(
      (a) => compareItemReference(a.to, to) && a.from.type === type
    )) {
      await this.remove(relation.id);
    }
  }

  private resolve(relations: Relation[], resolveType: "from" | "to") {
    const items = [];
    for (const relation of relations) {
      const reference = resolveType === "from" ? relation.from : relation.to;
      let item = null;
      switch (reference.type) {
        case "tag":
          item = this.db.tags.tag(reference.id);
          break;
        case "color":
          item = this.db.colors.color(reference.id);
          break;
        case "reminder":
          item = this.db.reminders.reminder(reference.id);
          break;
        case "note": {
          const note = this.db.notes.note(reference.id);
          if (!note) continue;
          item = note.data;
          break;
        }
        case "notebook": {
          const notebook = this.db.notebooks.notebook(reference.id);
          if (!notebook) continue;
          item = notebook.data;
          break;
        }
      }
      if (item) items.push(item);
    }
    return items;
  }

  async cleanup() {
    for (const relation of this.all) {
      const references = [relation.to, relation.from];
      for (const reference of references) {
        let exists: boolean | undefined = false;
        switch (reference.type) {
          case "tag":
            exists = this.db.tags.exists(reference.id);
            break;
          case "color":
            exists = this.db.colors.exists(reference.id);
            break;
          case "reminder":
            exists = this.db.reminders.exists(reference.id);
            break;
          case "note":
            exists =
              this.db.notes.exists(reference.id) ||
              this.db.trash.exists(reference.id);
            break;
          case "notebook":
            exists =
              this.db.notebooks.exists(reference.id) ||
              this.db.trash.exists(reference.id);
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
function compareItemReference(a: ItemReference, b: ItemReference) {
  return a.id === b.id && a.type === b.type;
}

/**
 * Generate deterministic constant id from `a` & `b` item reference.
 * @param {ItemReference} a
 * @param {ItemReference} b
 */
function generateId(a: ItemReference, b: ItemReference) {
  const str = `${a.id}${b.id}${a.type}${b.type}`;
  return makeId(str);
}
