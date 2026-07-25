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

export interface SearchSettings {
  matchCase: boolean;
  enableRegex: boolean;
  matchWholeWord: boolean;
}

export interface SearchState extends SearchSettings {
  isSearching: boolean;
  searchTerm: string;
  replaceTerm: string;
  focusNonce: number;
  isReplacing: boolean;
  isExpanded: boolean;
}

// Refactored to support independent search states for multiple editors (split panes).
export interface MultiEditorSearchState {
  editors: Record<string, SearchState | undefined>;
  getSearchState: (editorId: string) => SearchState;
  setSearchState: (editorId: string, state: Partial<SearchState>) => void;
}

const defaultState: SearchState = {
  focusNonce: 0,
  isSearching: false,
  searchTerm: "",
  replaceTerm: "",
  enableRegex: false,
  matchCase: false,
  matchWholeWord: false,
  isExpanded: false,
  isReplacing: false
};

export const useEditorSearchStore = create<MultiEditorSearchState>(
  (set, get) => ({
    editors: {},
    getSearchState: (editorId: string) => {
      return get().editors[editorId] || defaultState;
    },
    setSearchState: (editorId: string, state: Partial<SearchState>) => {
      set((prev) => ({
        editors: {
          ...prev.editors,
          [editorId]: {
            ...(prev.editors[editorId] || defaultState),
            ...state
          }
        }
      }));
    }
  })
);
