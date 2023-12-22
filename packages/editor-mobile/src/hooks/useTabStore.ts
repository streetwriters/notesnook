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
global.editorTags = {};
global.editorTitles = {};
global.statusBars = {};

export type TabItem = {
  id: number;
  noteId?: string;
  previewTab?: boolean;
  readonly?: boolean;
};

export type TabStore = {
  tabs: TabItem[];
  currentTab: number;
  scrollPosition: Record<number, number>;
  updateTab: (id: number, options: Omit<Partial<TabItem>, "id">) => void;
  removeTab: (index: number) => void;
  moveTab: (index: number, toIndex: number) => void;
  newTab: (noteId?: string, previewTab?: boolean) => void;
  focusTab: (id: number) => void;
  setScrollPosition: (id: number, position: number) => void;
  getNoteIdForTab: (id: number) => string | undefined;
  getTabForNote: (noteId: string) => number | undefined;
  hasTabForNote: (noteId: string) => boolean;
  focusEmptyTab: () => void;
  focusPreviewTab: (
    noteId: string,
    options: Omit<Partial<TabItem>, "id">
  ) => void;
  getCurrentNoteId: () => string | undefined;
  getTab: (tabId: number) => TabItem | undefined;
};

function getId(id: number, tabs: TabItem[]): number {
  const exists = tabs.find((t) => t.id === id);
  if (exists) {
    return getId(id + 1, tabs);
  }
  return id;
}

export const useTabStore = create(
  persist<TabStore>(
    (set, get) => ({
      tabs: [
        {
          id: 0,
          previewTab: true
        }
      ],
      currentTab: 0,
      scrollPosition: {},
      updateTab: (id: number, options: Omit<Partial<TabItem>, "id">) => {
        const index = get().tabs.findIndex((t) => t.id === id);
        if (index == -1) return;
        const tabs = [...get().tabs];
        tabs[index] = {
          ...tabs[index],
          ...options
        };
        set({
          tabs: tabs
        });
      },
      removeTab: (index: number) => {
        const scrollPosition = { ...get().scrollPosition };
        if (scrollPosition[index]) {
          delete scrollPosition[index];
        }
        globalThis.editorControllers[index] = undefined;
        globalThis.editors[index] = null;

        set({
          scrollPosition
        });
      },
      focusPreviewTab: (noteId: string, options) => {
        const index = get().tabs.findIndex((t) => t.previewTab);
        if (index == -1) return get().newTab(noteId, true);
        const tabs = [...get().tabs];
        tabs[index] = {
          ...tabs[index],
          noteId: noteId,
          previewTab: true,
          ...options
        };

        set({
          currentTab: tabs[index].id
        });
      },
      focusEmptyTab: () => {
        const index = get().tabs.findIndex((t) => !t.noteId);
        if (index == -1) return get().newTab();
        const tabs = [...get().tabs];
        tabs[index] = {
          ...tabs[index]
        };
        set({
          currentTab: tabs[index].id
        });
      },
      newTab: (noteId?: string, previewTab?: boolean) => {
        const id = getId(get().tabs.length, get().tabs);
        const nextTabs = [
          ...get().tabs,
          {
            id: id,
            noteId,
            previewTab: previewTab
          }
        ];
        set({
          tabs: nextTabs,
          currentTab: id
        });
      },
      moveTab: (index: number, toIndex: number) => {
        const tabs = get().tabs.slice();
        tabs.splice(toIndex, 0, tabs.slice(index, 1)[0]);
        set({
          tabs: tabs
        });
      },
      focusTab: (id: number) => {
        set({
          currentTab: id
        });
      },
      setScrollPosition: (id: number, position: number) => {
        set({
          scrollPosition: {
            ...get().scrollPosition,
            [id]: position
          }
        });
      },
      getNoteIdForTab: (id: number) => {
        return get().tabs.find((t) => t.id === id)?.noteId;
      },
      hasTabForNote: (noteId: string) => {
        return (
          typeof get().tabs.find((t) => t.noteId === noteId)?.id === "number"
        );
      },
      getTabForNote: (noteId: string) => {
        return get().tabs.find((t) => t.noteId === noteId)?.id;
      },
      getCurrentNoteId: () => {
        return get().tabs.find((t) => t.id === get().currentTab)?.noteId;
      },
      getTab: (tabId) => {
        return get().tabs.find((t) => t.id === tabId);
      }
    }),
    {
      name: "tab-storage",
      storage: createJSONStorage(() => localStorage)
    }
  )
);

globalThis.tabStore = useTabStore;

export const TabContext = createContext<TabItem>({
  id: 0
});

export const useTabContext = () => {
  const tab = useContext(TabContext);

  return tab;
};
