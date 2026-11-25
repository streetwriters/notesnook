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

import createStore from "../common/store";
import BaseStore from "./index";
import Config from "../utils/config";

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 10;

class RecentSearchStore extends BaseStore<RecentSearchStore> {
  recentSearches: string[] = [];

  addRecentSearch = (query: string) => {
    if (!query || !query.trim()) return;
    const trimmedQuery = query.trim();
    const searches = this.get().recentSearches.filter(
      (s) => s !== trimmedQuery
    );
    searches.unshift(trimmedQuery);
    const limited = searches.slice(0, MAX_RECENT_SEARCHES);
    Config.set(RECENT_SEARCHES_KEY, limited);
    this.set({ recentSearches: limited });
  };

  removeRecentSearch = (query: string) => {
    const searches = this.get().recentSearches.filter((s) => s !== query);
    Config.set(RECENT_SEARCHES_KEY, searches);
    this.set({ recentSearches: searches });
  };

  clearRecentSearches = () => {
    Config.remove(RECENT_SEARCHES_KEY);
    this.set({ recentSearches: [] });
  };
}

const [useRecentSearchStore] = createStore<RecentSearchStore>(
  (set, get) => {
    const savedSearches = Config.get<string[]>(RECENT_SEARCHES_KEY, []);
    const store = new RecentSearchStore(set, get);
    store.recentSearches = Array.isArray(savedSearches) ? savedSearches : [];
    return store;
  }
);

export { useRecentSearchStore };
