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

import type { Editor as TiptapEditor } from "@tiptap/core";
import {
  q,
  type AnchorRect,
  type AnchorTarget,
  type Query,
  type QueryKind,
  type QueryResults
} from "./queries.js";
import { getQueryStore, type QueryStore } from "./store.js";
import { useStoreQuery } from "./use-query.js";

type Editor =
  | TiptapEditor
  | { readonly kind: "controller"; readonly queries: QueryStore };

function storeOf(editor: Editor): QueryStore {
  return "kind" in editor && editor.kind === "controller"
    ? editor.queries
    : getQueryStore(editor as TiptapEditor);
}

const emptyStore: QueryStore = {
  read: () => undefined,
  subscribe: () => () => {}
};

/**
 * Where a popup should open: the viewport rect of the selection, a selected
 * node or a document range, kept current as the editor changes. Pass no
 * editor to subscribe to nothing (e.g. while the popup is closed).
 */
export function useAnchorQuery(
  editor: Editor | undefined,
  target: AnchorTarget = "selection"
): AnchorRect | null | undefined {
  const store = editor ? storeOf(editor) : emptyStore;
  return useStoreQuery(store, q.anchor(target));
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
  const value = useStoreQuery(storeOf(editor), query);
  return value === undefined ? fallback : value;
}
