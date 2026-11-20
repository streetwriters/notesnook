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
import type { Query, QueryKind, QueryResults } from "./queries.js";
import type { QueryStore } from "./store.js";

export function useStoreQuery<K extends QueryKind>(
  store: QueryStore,
  query: Query<K>
): QueryResults[K] | undefined {
  const subscribe = useCallback(
    (listener: () => void) => store.subscribe(query, listener),
    [store, query]
  );
  return useSyncExternalStore(subscribe, () => store.read(query));
}

export function useControllerQuery<K extends QueryKind>(
  editor: { readonly queries: QueryStore },
  query: Query<K>
): QueryResults[K] | undefined;
export function useControllerQuery<K extends QueryKind>(
  editor: { readonly queries: QueryStore },
  query: Query<K>,
  fallback: QueryResults[K]
): QueryResults[K];
export function useControllerQuery<K extends QueryKind>(
  editor: { readonly queries: QueryStore },
  query: Query<K>,
  fallback?: QueryResults[K]
): QueryResults[K] | undefined {
  const value = useStoreQuery(editor.queries, query);
  return value === undefined ? fallback : value;
}
