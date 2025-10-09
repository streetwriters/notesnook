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

import { SortOptions } from "@notesnook/core";
import createStore from "../common/store";
import BaseStore from "./index";

class SearchStore extends BaseStore<SearchStore> {
  isSearching = false;
  query?: string;
  searchType?: string;
  sortOptions?: SortOptions;

  resetSearch = () => {
    this.set({
      isSearching: false,
      query: undefined,
      searchType: undefined,
      sortOptions: undefined
    });
  };
}

const [useStore, store] = createStore<SearchStore>(
  (set, get) => new SearchStore(set, get)
);
export { useStore, store };
