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

import type Database from "../api/index.js";
import { SQLCachedCollection } from "./sql-cached-collection.js";
import { SQLCollection } from "./sql-collection.js";

/**
 * Returns a copy of `target` (and of the collections it owns) that runs on
 * `db`. The copy delegates everything else to the original, so state held in
 * shared objects (caches, counters) stays shared.
 *
 * Assigning to a field of the copy assigns it on the original (so it can't
 * silently shadow it), except for the re-bound fields.
 */
export function scopeTo<T extends object>(target: T, db: Database): T {
  const scoped: Record<string, unknown> = Object.create(target);
  const original = target as Record<string, unknown>;
  for (const key of Object.keys(original)) {
    const value = original[key];
    if (key === "db") scoped[key] = db;
    else if (isCollection(value)) scoped[key] = value.scope(db);
    else if (isScopeable(value, original.db)) scoped[key] = scopeTo(value, db);
  }
  return new Proxy(scoped, {
    set: (scoped, key, value) =>
      Object.prototype.hasOwnProperty.call(scoped, key)
        ? Reflect.set(scoped, key, value)
        : Reflect.set(target, key, value)
  }) as T;
}

/**
 * Whether `value` has to be re-bound for a transaction: it either holds the
 * database in `db` or owns a collection.
 */
export function isScopeable(value: unknown, db: unknown): value is object {
  if (typeof value !== "object" || value === null) return false;
  const member = value as Record<string, unknown>;
  return (
    (db !== undefined && member.db === db) ||
    isCollection(member) ||
    isCollection(member.collection)
  );
}

function isCollection(
  value: unknown
): value is SQLCollection<any> | SQLCachedCollection<any> {
  return value instanceof SQLCollection || value instanceof SQLCachedCollection;
}
