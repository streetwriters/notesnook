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

import { ItemMap, ItemType, VirtualizedGrouping } from "@notesnook/core";
import { resolveItems } from "../utils/resolve-items.js";
import { useDeferredValue, useEffect, useState, useTransition } from "react";

export type ResolvedItemOptions<TItemType extends ItemType> = {
  type?: TItemType;
  items: VirtualizedGrouping<ItemMap[TItemType]>;
  index: number;
};

/**
 * Fetches & resolves the item from VirtualizedGrouping
 */
export function useResolvedItem<TItemType extends ItemType>(
  options: ResolvedItemOptions<TItemType>
) {
  const { index, items } = options;
  const [result, setResult] = useState(() => items.cacheItem(index));
  const deferredResult = useDeferredValue(result);
  const [, startTransition] = useTransition();

  useEffect(() => {
    items
      .item(index, resolveItems)
      .then(({ data, group, item }) =>
        item ? startTransition(() => setResult({ data, group, item })) : null
      );
  }, [index, items]);

  return deferredResult;
}

/**
 * Fetches but does not resolve the item from VirtualizedGrouping
 */
export function useUnresolvedItem<TItemType extends ItemType>(
  options: ResolvedItemOptions<TItemType>
) {
  const { index, items } = options;
  const [result, setResult] = useState(() => items.cacheItem(index));
  const deferredResult = useDeferredValue(result);
  const [, startTransition] = useTransition();

  useEffect(() => {
    items
      .item(index)
      .then(({ group, item }) =>
        item
          ? startTransition(() => setResult({ group, item, data: null }))
          : null
      );
  }, [index, items]);
  return deferredResult;
}
