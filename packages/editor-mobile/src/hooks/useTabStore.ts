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
import { createContext, useContext } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

globalThis.editorControllers = {};
globalThis.editors = {};
globalThis.editorTags = {};
globalThis.editorTitles = {};
globalThis.statusBars = {};

export type TabItem = {
  id: string;
  session?: {
    noteId?: string;
    readonly?: boolean;
    locked?: boolean;
    noteLocked?: boolean;
    scrollTop?: number;
    selection?: { to: number; from: number };
  };
  pinned?: boolean;
  needsRefresh?: boolean;
};

export type TabStore = {
  tabs: TabItem[];
  currentTab?: string;
  scrollPosition: Record<number, number>;
  biometryAvailable?: boolean;
  biometryEnrolled?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  sessionId?: string;
  getCurrentNoteId: () => string | undefined;
};

export const useTabStore = create(
  persist<TabStore>(
    (set, get) => ({
      tabs: [
        {
          id: "679da59a3924d4bd56d16d3f",
          session: {
            id: "679da5a5667a16db2353a062"
          }
        }
      ],
      currentTab: "679da59a3924d4bd56d16d3f",
      scrollPosition: {},
      getCurrentNoteId: () => {
        return get().tabs.find((t) => t.id === get().currentTab)?.session
          ?.noteId;
      }
    }),
    {
      name: "tab-storage-v5",
      storage: createJSONStorage(() => localStorage)
    }
  )
);

globalThis.tabStore = useTabStore;

export const TabContext = createContext<TabItem>({} as TabItem);

export const useTabContext = () => {
  const tab = useContext(TabContext);

  return tab;
};
