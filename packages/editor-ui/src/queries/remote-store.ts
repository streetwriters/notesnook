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

import type { QueryStore } from "./store.js";
import type { AnchorRect, Query, QueryKind, QueryResults } from "./queries.js";

export type WireQuery = { key: string; kind: string; args?: unknown[] };

export type RemoteQueryStore = QueryStore & {
  apply(changed: Record<string, unknown>): void;
  active(): WireQuery[];
};

type Entry = {
  query: Query;
  value: unknown;
  encoded: string;
  listeners: Set<() => void>;
};

export function toWireQuery(query: Query): WireQuery {
  if (query.kind === "anchor") {
    const target = query.args[0];
    // The native editor measures the selected node or the caret; a document
    // range has no native counterpart and falls back to the caret.
    const node =
      typeof target === "object" && target !== null && "node" in target;
    return { key: query.key, kind: "anchor", args: node ? ["node"] : [] };
  }
  return { key: query.key, kind: query.kind, args: [...query.args] };
}

function fromWireValue(kind: QueryKind, value: unknown): unknown {
  if (kind !== "anchor" || typeof value !== "object" || value === null)
    return value;
  const rect = value as Record<string, unknown>;
  if (typeof rect.x !== "number" || typeof rect.y !== "number") return value;
  const width = typeof rect.width === "number" ? rect.width : 0;
  const height = typeof rect.height === "number" ? rect.height : 0;
  const anchor: AnchorRect = {
    top: rect.y,
    left: rect.x,
    right: rect.x + width,
    bottom: rect.y + height
  };
  return anchor;
}

export function createRemoteQueryStore(
  onQueriesChange: (queries: WireQuery[]) => void
): RemoteQueryStore {
  const entries = new Map<string, Entry>();
  let scheduled = false;
  let lastSent = "";

  function active(): WireQuery[] {
    const queries: WireQuery[] = [];
    for (const current of entries.values())
      if (current.listeners.size) queries.push(toWireQuery(current.query));
    return queries;
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      for (const [key, current] of entries)
        if (!current.listeners.size) entries.delete(key);
      const queries = active();
      const encoded = JSON.stringify(queries);
      if (encoded === lastSent) return;
      lastSent = encoded;
      onQueriesChange(queries);
    });
  }

  function entry(query: Query): Entry {
    let current = entries.get(query.key);
    if (!current) {
      current = {
        query,
        value: undefined,
        encoded: "undefined",
        listeners: new Set()
      };
      entries.set(query.key, current);
    }
    return current;
  }

  return {
    read<K extends QueryKind>(query: Query<K>) {
      return entries.get(query.key)?.value as QueryResults[K] | undefined;
    },
    subscribe(query, listener) {
      const current = entry(query);
      const added = !current.listeners.size;
      current.listeners.add(listener);
      if (added) schedule();
      return () => {
        current.listeners.delete(listener);
        if (!current.listeners.size) schedule();
      };
    },
    apply(changed) {
      const notify: Entry[] = [];
      for (const [key, raw] of Object.entries(changed)) {
        const current = entries.get(key);
        if (!current) continue;
        const value = fromWireValue(current.query.kind, raw);
        const encoded = JSON.stringify(value) ?? "undefined";
        if (encoded === current.encoded) continue;
        current.value = value;
        current.encoded = encoded;
        notify.push(current);
      }
      for (const current of notify)
        current.listeners.forEach((listener) => listener());
    },
    active
  };
}
