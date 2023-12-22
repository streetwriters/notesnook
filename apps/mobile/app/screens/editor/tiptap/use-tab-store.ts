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
import create from "zustand";
import { persist, StateStorage } from "zustand/middleware";
import { editorController } from "./utils";
import { MMKV } from "../../../common/database/mmkv";

export type TabItem = {
  id: number;
  noteId?: string;
  previewTab?: boolean;
  readonly?: boolean;
  locked?: boolean;
};

export type TabStore = {
  tabs: TabItem[];
  currentTab: number;
  updateTab: (id: number, options: Omit<Partial<TabItem>, "id">) => void;
  focusPreviewTab: (
    noteId: string,
    options: Omit<Partial<TabItem>, "id">
  ) => void;
  removeTab: (index: number) => void;
  moveTab: (index: number, toIndex: number) => void;
  newTab: (noteId?: string, previewTab?: boolean) => void;
  focusTab: (id: number) => void;
  getNoteIdForTab: (id: number) => string | undefined;
  getTabForNote: (noteId: string) => number | undefined;
  hasTabForNote: (noteId: string) => boolean;
  focusEmptyTab: () => void;
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

export function syncTabs() {
  editorController.current?.commands.doAsync(`
    globalThis.tabStore?.setState({
      tabs: ${JSON.stringify(useTabStore.getState().tabs)},
      currentTab: ${useTabStore.getState().currentTab}
    });
`);
}

export const useTabStore = create<TabStore>(
  persist(
    (set, get) => ({
      tabs: [
        {
          id: 0
        }
      ],
      currentTab: 0,
      updateTab: (id: number, options: Omit<Partial<TabItem>, "id">) => {
        if (!options) return;
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
        syncTabs();
      },
      focusPreviewTab: (
        noteId: string,
        options: Omit<Partial<TabItem>, "id" | "noteId">
      ) => {
        const index = get().tabs.findIndex((t) => t.previewTab);
        if (index === -1) return get().newTab(noteId, true);
        const tabs = [...get().tabs];
        tabs[index] = {
          ...tabs[index],
          previewTab: true,
          ...options,
          noteId: noteId
        };
        console.log("focus preview", noteId);
        set({
          tabs: tabs,
          currentTab: tabs[index].id
        });

        syncTabs();
      },
      removeTab: (id: number) => {
        const index = get().tabs.findIndex((t) => t.id === id);

        if (index > -1) {
          const isFocused = id === get().currentTab;
          const nextTabs = get().tabs.slice();
          nextTabs.splice(index, 1);

          if (nextTabs.length === 0) {
            nextTabs.push({
              id: 0
            });
          }

          set({
            tabs: nextTabs,
            currentTab: isFocused
              ? nextTabs[nextTabs.length - 1].id
              : get().currentTab
          });
          syncTabs();
        }
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
        console.log("new tab");
        syncTabs();
      },
      focusEmptyTab: () => {
        const index = get().tabs.findIndex((t) => !t.noteId);
        if (index === -1) return get().newTab();
        console.log("focus empty tab", get().tabs[index]);
        set({
          currentTab: get().tabs[index].id
        });

        syncTabs();
      },
      moveTab: (index: number, toIndex: number) => {
        const tabs = get().tabs.slice();
        tabs.splice(toIndex, 0, tabs.slice(index, 1)[0]);
        set({
          tabs: tabs
        });
        syncTabs();
      },
      focusTab: (id: number) => {
        set({
          currentTab: id
        });
        syncTabs();
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
      name: "tabs-storage",
      getStorage: () => MMKV as unknown as StateStorage
    }
  )
);
