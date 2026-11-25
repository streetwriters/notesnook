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

import type { Editor } from "@tiptap/core";
import type { Editor as NotesnookEditor } from "../types.js";
import { findSelectedNode } from "../utils/prosemirror.js";
import { getTextDirection } from "../extensions/text-direction/text-direction.js";
import type { SearchStorage } from "../extensions/search-replace/index.js";
import type { Query, QueryKind, QueryResults } from "./queries.js";

export type QueryStore = {
  read<K extends QueryKind>(query: Query<K>): QueryResults[K] | undefined;
  subscribe(query: Query, listener: () => void): () => void;
};

type Entry = { value: unknown; encoded: string; listeners: Set<() => void> };

const stores = new WeakMap<Editor, QueryStore>();

export function getQueryStore(editor: Editor): QueryStore {
  let store = stores.get(editor);
  if (!store) stores.set(editor, (store = createQueryStore(editor)));
  return store;
}

function createQueryStore(editor: Editor): QueryStore {
  const entries = new Map<Query, Entry>();

  function entry(query: Query): Entry {
    let current = entries.get(query);
    if (!current) {
      const value = evaluate(editor, query);
      current = { value, encoded: JSON.stringify(value), listeners: new Set() };
      entries.set(query, current);
    }
    return current;
  }

  function refresh() {
    const changed: Entry[] = [];
    for (const [query, current] of entries) {
      if (!current.listeners.size) {
        entries.delete(query);
        continue;
      }
      const value = evaluate(editor, query);
      const encoded = JSON.stringify(value);
      if (encoded === current.encoded) continue;
      current.value = value;
      current.encoded = encoded;
      changed.push(current);
    }
    for (const current of changed)
      current.listeners.forEach((listener) => listener());
  }

  editor.on("transaction", refresh);
  editor.on("focus", refresh);
  editor.on("blur", refresh);

  return {
    read<K extends QueryKind>(query: Query<K>) {
      return entry(query).value as QueryResults[K] | undefined;
    },
    subscribe(query, listener) {
      const current = entry(query);
      current.listeners.add(listener);
      return () => current.listeners.delete(listener);
    }
  };
}

function evaluate(editor: Editor, query: Query): unknown {
  const [name, attributes] = query.args as [
    string | string[],
    Record<string, unknown> | undefined
  ];
  try {
    switch (query.kind) {
      case "isActive":
        return Array.isArray(name)
          ? name.some((item) => editor.isActive(item))
          : editor.isActive(name, attributes);
      case "attributes":
        return editor.getAttributes(String(name));
      case "selectedNode": {
        const types = Array.isArray(name) ? name : [name];
        for (const type of types) {
          const node = findSelectedNode(editor, type);
          if (node) return node.attrs;
        }
        return null;
      }
      case "editable":
        return editor.isEditable;
      case "textDirection":
        return getTextDirection(editor as NotesnookEditor);
      case "search": {
        const storage = editor.storage.searchreplace as
          | SearchStorage
          | undefined;
        return {
          count: storage?.results?.length ?? 0,
          selectedIndex: storage?.selectedIndex ?? 0
        };
      }
    }
  } catch {
    return undefined;
  }
}
