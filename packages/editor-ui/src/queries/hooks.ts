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

import { useCallback, useSyncExternalStore } from "react";
import type { Editor as TiptapEditor } from "@tiptap/core";
import type { Query, QueryKind, QueryResults } from "./queries.js";
import { getQueryStore, type QueryStore } from "./store.js";

type Editor =
  | TiptapEditor
  | { readonly kind: "controller"; readonly queries: QueryStore };

function storeOf(editor: Editor): QueryStore {
  return "kind" in editor && editor.kind === "controller"
    ? editor.queries
    : getQueryStore(editor as TiptapEditor);
}

export function useEditorQuery<K extends QueryKind>(
  editor: Editor,
  query: Query<K>
): QueryResults[K] | undefined;
export function useEditorQuery<K extends QueryKind>(
  editor: Editor,
  query: Query<K>,
  fallback: QueryResults[K]
): QueryResults[K];
export function useEditorQuery<K extends QueryKind>(
  editor: Editor,
  query: Query<K>,
  fallback?: QueryResults[K]
): QueryResults[K] | undefined {
  const store = storeOf(editor);
  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(query, listener),
    [store, query]
  );
  const value = useSyncExternalStore(subscribe, () => store.read(query));
  return value === undefined ? fallback : value;
}
