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
import { editorController } from "./utils";

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
  newTab: (noteId?: string) => void;
  focusTab: (id: number) => void;
  getNoteIdForTab: (id: number) => string | undefined;
  getTabForNote: (noteId: string) => number | undefined;
  hasTabForNote: (noteId: string) => boolean;
  focusEmptyTab: () => void;
  getCurrentNoteId: () => string | undefined;
};

export const useTabStore = create<TabStore>((set, get) => ({
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

    editorController.current?.commands.doAsync(`
    globalThis.tabStore.getState().updateTab(${id}, ${JSON.stringify(options)});
`);
  },
  focusPreviewTab: (noteId: string, options: Omit<Partial<TabItem>, "id">) => {
    const index = get().tabs.findIndex((t) => t.previewTab);
    if (index === -1) return get().newTab(noteId);
    const tabs = [...get().tabs];
    tabs[index] = {
      ...tabs[index],
      noteId: noteId,
      ...options
    };
    set({
      currentTab: tabs[index].id
    });

    editorController.current?.commands.doAsync(`
    globalThis.tabStore.getState().focusPreviewTab(${
      noteId ? `"${noteId}"` : ""
    }, ${JSON.stringify(options || {})});
`);
  },
  removeTab: (index: number) => {
    editorController.current?.commands.doAsync(`
        globalThis.tabStore.getState().removeTab(${index});
    `);
  },
  newTab: (noteId?: string) => {
    editorController.current?.commands.doAsync(`
        globalThis.tabStore.getState().newTab(${noteId ? `"${noteId}"` : ""});
    `);
  },
  focusEmptyTab: () => {
    const index = get().tabs.findIndex((t) => !t.noteId);
    if (index === -1) return get().newTab();
    const tabs = [...get().tabs];
    tabs[index] = {
      ...tabs[index]
    };
    set({
      currentTab: tabs[index].id
    });

    editorController.current?.commands.doAsync(`
    globalThis.tabStore.getState().focusEmptyTab();
`);
  },
  moveTab: (index: number, toIndex: number) => {
    editorController.current?.commands.doAsync(`
        globalThis.tabStore.getState().moveTab(${index}, ${toIndex});
    `);
  },
  focusTab: (id: number) => {
    editorController.current?.commands.doAsync(`
        globalThis.tabStore.getState().focusTab(${id});
    `);
  },
  getNoteIdForTab: (id: number) => {
    return get().tabs.find((t) => t.id === id)?.noteId;
  },
  hasTabForNote: (noteId: string) => {
    return typeof get().tabs.find((t) => t.noteId === noteId)?.id === "number";
  },
  getTabForNote: (noteId: string) => {
    return get().tabs.find((t) => t.noteId === noteId)?.id;
  },
  getCurrentNoteId: () => {
    return get().tabs.find((t) => t.id === get().currentTab)?.noteId;
  }
}));
