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

import { useEffect, useState } from "react";
import type { ItemMap, ItemType, VirtualizedGrouping } from "@notesnook/core";
import { resolveItems } from "@notesnook/common";

export function useResolvedItem<TItemType extends ItemType>(options: {
  type?: TItemType;
  items: VirtualizedGrouping<ItemMap[TItemType]>;
  index: number;
}) {
  const { index, items } = options;
  const [result, setResult] = useState(() => items.cacheItem(index));

  useEffect(() => {
    let cancelled = false;
    items.item(index, resolveItems).then(({ data, group, item }) => {
      if (!cancelled && item) setResult({ data, group, item });
    });
    return () => {
      cancelled = true;
    };
  }, [index, items]);

  return result;
}
