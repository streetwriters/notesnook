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

import { create } from "zustand";
import { MMKV } from "../common/database/mmkv";

const RECENT_SEARCHES_KEY = "recentSearches";
const MAX_RECENT_SEARCHES = 10;

export interface RecentSearchStore {
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

function loadRecentSearches(): string[] {
  try {
    const data = MMKV.getString(RECENT_SEARCHES_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]): void {
  MMKV.setString(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}

export const useRecentSearchStore = create<RecentSearchStore>((set, get) => ({
  recentSearches: loadRecentSearches(),

  addRecentSearch: (query: string) => {
    if (!query || !query.trim()) return;
    const trimmedQuery = query.trim();
    const searches = get().recentSearches.filter((s) => s !== trimmedQuery);
    searches.unshift(trimmedQuery);
    const limited = searches.slice(0, MAX_RECENT_SEARCHES);
    saveRecentSearches(limited);
    set({ recentSearches: limited });
  },

  removeRecentSearch: (query: string) => {
    const searches = get().recentSearches.filter((s) => s !== query);
    saveRecentSearches(searches);
    set({ recentSearches: searches });
  },

  clearRecentSearches: () => {
    MMKV.removeItem(RECENT_SEARCHES_KEY);
    set({ recentSearches: [] });
  }
}));
