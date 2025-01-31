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
  id: number;
  noteId?: string;
  /**
   * @deprecated
   */
  previewTab?: boolean;
  readonly?: boolean;
  locked?: boolean;
  noteLocked?: boolean;
  pinned?: boolean;
  needsRefresh?: boolean;
};

export type NoteState = {
  top: number;
  to: number;
  from: number;
};

export type TabStore = {
  tabs: TabItem[];
  currentTab: number;
  scrollPosition: Record<number, number>;
  noteState: Record<string, NoteState>;
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
  setNoteState: (noteId: string, state: Partial<NoteState>) => void;
  biometryAvailable?: boolean;
  biometryEnrolled?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  sessionId?: string;
  getNoteState: (noteId: string) => NoteState | undefined;
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
      noteState: {},
      getNoteState: (noteId: string) => {
        const sessionId = get().sessionId;
        const session = sessionId ? global.sessions.get(sessionId) : undefined;
        if (session?.noteId === noteId) {
          return {
            top: session.scrollTop,
            to: session.to,
            from: session.from
          };
        }
        return undefined;
      },
      tabs: [
        {
          id: 0
        }
      ],
      currentTab: 0,
      scrollPosition: {},
      setNoteState: (noteId: string, state: Partial<NoteState>) => {
        if (editorControllers[get().currentTab]?.loading) return;

        const sessionId = get().sessionId;
        if (sessionId) {
          globalThis.sessions.updateSession(sessionId, {
            from: state.from,
            to: state.to,
            scrollTop: state.top
          });
        }

        const noteState = {
          ...get().noteState
        };
        noteState[noteId] = {
          ...get().noteState[noteId],
          ...state
        };

        set({
          noteState
        });
      },
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
      focusPreviewTab: (noteId: string, options) => {},
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
            noteId
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
