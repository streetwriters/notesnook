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
import { DependencyList, useEffect, useState } from "react";
import { useStore as useSearchStore } from "../stores/search-store";
import { VirtualizedGrouping } from "@notesnook/core";

export function useSearch<T>(
  type: "notes" | "notebooks" | "reminders" | "trash" | "tags",
  lookup: (query: string) => Promise<VirtualizedGrouping<T>> | undefined,
  deps: DependencyList = []
) {
  const isSearching = useSearchStore((store) => store.isSearching);
  const query = useSearchStore((store) => store.query);
  const searchType = useSearchStore((store) => store.searchType);
  const [filteredItems, setFilteredItems] = useState<VirtualizedGrouping<T>>();

  useEffect(() => {
    (async function () {
      if (!query || !isSearching) return setFilteredItems(undefined);
      if (searchType !== type) return;
      setFilteredItems(await lookup(query));
    })();
  }, [isSearching, query, searchType, type, ...deps]);

  return filteredItems;
}
