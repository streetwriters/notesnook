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
import { TabSessionHistory } from "@notesnook/common";
import { MMKVLoader } from "react-native-mmkv-storage";
import create from "zustand";
import { persist, StateStorage } from "zustand/middleware";
import { db } from "../../../common/database";
import { MMKV } from "../../../common/database/mmkv";
import { eSendEvent } from "../../../services/event-manager";
import { eOnLoadNote } from "../../../utils/events";
import { editorController } from "./utils";

class TabHistory {
  history: number[];
  constructor() {
    this.history = [0];
  }

  add(item: number) {
    const index = this.history.findIndex((id) => item === id);
    if (index !== -1) {
      // Item already exists, move it to the top
      this.history.splice(index, 1);
    }
    this.history.unshift(item); // Add item to the beginning of the array

    useTabStore.setState({
      history: this.history.slice()
    });
    return true; // Item added successfully
  }

  remove(id: number) {
    const index = this.history.findIndex((item) => item === id);
    if (index >= -1 && index < this.history.length) {
      const removedItem = this.history.splice(index, 1)[0];
      return removedItem;
    }
    useTabStore.setState({
      history: this.history.slice()
    });
    return null; // Invalid index
  }

  restoreLast() {
    if (this.history.length > 0) {
      const restoredItem = this.history.shift(); // Remove and return the first item
      return restoredItem;
    }
    useTabStore.setState({
      history: this.history.slice()
    });
    return null; // History is empty
  }

  getHistory() {
    return this.history.slice(); // Return a copy to prevent external modification
  }
}

export type TabSessionItem = {
  id: string;
  noteId?: string;
  scrollTop?: number;
  selection?: { to: number; from: number };
  noteLocked?: boolean;
  locked?: boolean;
  readonly?: boolean;
};

const TabSessionStorageKV = new MMKVLoader()
  .withInstanceID("tab-session-storage")
  .disableIndexing()
  .initialize();

class TabSessionStorage {
  static storage: typeof TabSessionStorageKV = TabSessionStorageKV;

  static get(id: string): TabSessionItem | null {
    return TabSessionStorage.storage.getMap(id);
  }

  static set(id: string, session: TabSessionItem): void {
    TabSessionStorage.storage.setMap(id, session);
  }

  static update(id: string, session: Partial<TabSessionItem>) {
    const currentSession = TabSessionStorage.get(id);
    const newSession = {
      ...currentSession,
      ...session
    };
    TabSessionStorage.set(id, newSession as TabSessionItem);
    return newSession;
  }

  static remove(id: string) {
    TabSessionStorageKV.removeItem(id);
  }
}

function getId(id: number, tabs: TabItem[]): number {
  const exists = tabs.find((t) => t.id === id);
  if (exists) {
    return getId(id + 1, tabs);
  }
  return id;
}

export function syncTabs(
  type: "tabs" | "history" | "biometry" | "all" = "all"
) {
  const data: Partial<TabStore> = {};

  if (type === "tabs" || type === "all") {
    data.tabs = useTabStore.getState().tabs;
    data.currentTab = useTabStore.getState().currentTab;
  }
  if (type === "history" || type === "all") {
    data.canGoBack = useTabStore.getState().canGoBack;
    data.canGoForward = useTabStore.getState().canGoForward;
    data.sessionId = useTabStore.getState().sessionId;
  }

  if (type === "biometry" || type === "all") {
    data.biometryAvailable = useTabStore.getState().biometryAvailable;
    data.biometryEnrolled = useTabStore.getState().biometryEnrolled;
  }

  editorController.current?.commands.doAsync(`
    globalThis.tabStore?.setState(${JSON.stringify(data)});
`);
}
export const tabSessionHistory = new TabSessionHistory({
  get() {
    return useTabStore.getState();
  },
  set(state) {
    useTabStore.setState({
      ...state
    });
  },
  getCurrentTab: () => useTabStore.getState().currentTab
});

export type TabItem = {
  id: number;
  pinned?: boolean;
  needsRefresh?: boolean;
  session?: Partial<TabSessionItem>;
};

const history = new TabHistory();

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
  newTab: (options?: Omit<Partial<TabItem>, "id">) => number;
  focusTab: (id: number) => void;
  getNoteIdForTab: (id: number) => string | undefined;
  getTabForNote: (noteId: string) => number | undefined;
  getTabsForNote: (noteId: string) => TabItem[];
  forEachNoteTab: (noteId: string, cb: (tab: TabItem) => void) => void;
  hasTabForNote: (noteId: string) => boolean;
  focusEmptyTab: () => void;
  getCurrentNoteId: () => string | undefined;
  getTab: (tabId: number) => TabItem | undefined;
  newTabSession: (
    id: number,
    options: Omit<Partial<TabSessionItem>, "id">
  ) => void;
  history: number[];
  biometryAvailable?: boolean;
  biometryEnrolled?: boolean;
  tabSessionHistory: Record<
    number,
    { back_stack: string[]; forward_stack: string[] }
  >;
  goBack(): void;
  goForward(): void;
  loadSession: (id: string) => Promise<boolean>;
  canGoBack?: boolean;
  canGoForward?: boolean;
  sessionId?: string;
};

export const useTabStore = create<TabStore>(
  persist(
    (set, get) => ({
      tabs: [],
      tabSessionHistory: {},
      history: [0],
      currentTab: 0,
      newTabSession: (
        id: number,
        options: Omit<Partial<TabSessionItem>, "id">
      ) => {
        const sessionId = tabSessionHistory.add();
        const session = {
          id: sessionId,
          ...options
        };
        TabSessionStorage.set(sessionId, session);
        const index = get().tabs.findIndex((t) => t.id === id);
        if (index == -1) return;
        const tabs = [...get().tabs];
        tabs[index] = {
          ...tabs[index],
          ...options,
          session: session
        } as TabItem;

        set({
          tabs: tabs
        });
        syncTabs();
      },
      updateTab: (id: number, options: Omit<Partial<TabItem>, "id">) => {
        if (!options) return;
        const index = get().tabs.findIndex((t) => t.id === id);
        if (index == -1) return;
        const tabs = [...get().tabs];

        const sessionId =
          options.session?.id || (tabs[index].session?.id as string);
        const updatedSession = !options.session
          ? tabs[index].session
          : TabSessionStorage.update(sessionId, options.session);

        tabs[index] = {
          ...tabs[index],
          ...options,
          session: updatedSession
        } as TabItem;

        set({
          tabs: tabs
        });
        syncTabs();
      },
      goBack: async () => {
        if (!tabSessionHistory.canGoBack()) return;
        const id = tabSessionHistory.back() as string;
        const sessionLoaded = await get().loadSession(id);
        if (!sessionLoaded) {
          tabSessionHistory.remove(id);
          TabSessionStorage.remove(id);
          if (!tabSessionHistory.canGoBack()) {
            tabSessionHistory.forward();
            syncTabs();
          } else {
            return get().goBack();
          }
        } else {
          syncTabs();
        }
      },
      goForward: async () => {
        if (!tabSessionHistory.canGoForward()) return;
        const id = tabSessionHistory.forward() as string;
        if (!(await get().loadSession(id))) {
          tabSessionHistory.remove(id);
          TabSessionStorage.remove(id);
          if (!tabSessionHistory.canGoForward()) {
            tabSessionHistory.back();
            syncTabs();
          } else {
            return get().goForward();
          }
        } else {
          syncTabs();
        }
      },
      loadSession: async (id: string) => {
        const session = TabSessionStorage.get(id);
        if (!session) return false;

        const note = session?.noteId
          ? await db.notes.note(session?.noteId)
          : undefined;

        if (note) {
          const isLocked = await db.vaults.itemExists(note);
          if (isLocked && !session?.noteLocked) {
            session.locked = true;
            session.noteLocked = true;
          }
          session.readonly = note.readonly;
        } else if (session.noteId) {
          console.log("Failed to load session...");
          return false;
        }

        get().updateTab(get().currentTab, {
          session: session
        });
        console.log("Loading session", session);
        eSendEvent(eOnLoadNote, {
          item: note,
          newNote: !note,
          tabId: get().currentTab,
          session: session
        });

        return true;
      },
      focusPreviewTab: (
        noteId: string,
        options: Omit<Partial<TabItem>, "id" | "noteId">
      ) => {},

      removeTab: (id: number) => {
        const index = get().tabs.findIndex((t) => t.id === id);
        if (index > -1) {
          const isFocused = id === get().currentTab;
          const nextTabs = get().tabs.slice();
          nextTabs.splice(index, 1);
          history.remove(id);

          const tabSessions = tabSessionHistory.getHistory();
          tabSessions.back.forEach((id) => TabSessionStorage.remove(id));
          tabSessions.forward.forEach((id) => TabSessionStorage.remove(id));
          tabSessionHistory.clearStackForTab(id);

          if (nextTabs.length === 0) {
            set({
              tabs: [{ id: 0 }]
            });
            get().newTabSession(0, {});
            get().focusTab(0);
          } else {
            set({
              tabs: nextTabs
            });
            if (isFocused) {
              get().focusTab(history.restoreLast() || 0);
            }
          }
          syncTabs();
        }
      },
      newTab: (options) => {
        const id = getId(get().tabs.length, get().tabs);
        set({
          tabs: [
            ...get().tabs,
            {
              id: id,
              ...options
            }
          ]
        });
        get().newTabSession(id, options?.session || {});
        get().focusTab(id);
        return id;
      },
      focusEmptyTab: () => {
        const index = get().tabs.findIndex((t) => !t.session?.noteId);
        if (index === -1) return get().newTab();
        console.log("focus empty tab", get().tabs[index]);

        get().focusTab(get().tabs[index].id);
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
        history.add(id);
        set({
          currentTab: id
        });
        set({
          canGoBack: tabSessionHistory.canGoBack(),
          canGoForward: tabSessionHistory.canGoForward(),
          sessionId: tabSessionHistory.currentSessionId()
        });
        syncTabs();
      },
      getNoteIdForTab: (id: number) => {
        return get().tabs.find((t) => t.id === id)?.session?.noteId;
      },
      hasTabForNote: (noteId: string) => {
        return (
          typeof get().tabs.find((t) => t.session?.noteId === noteId)?.id ===
          "number"
        );
      },
      getTabForNote: (noteId: string) => {
        return get().tabs.find((t) => t.session?.noteId === noteId)?.id;
      },
      getTabsForNote(noteId: string) {
        return get().tabs.filter((t) => t.session?.noteId === noteId);
      },
      forEachNoteTab: (noteId: string, cb: (tab: TabItem) => void) => {
        const tabs = get().tabs.filter((t) => t.session?.noteId === noteId);
        tabs.forEach(cb);
      },
      getCurrentNoteId: () => {
        return get().tabs.find((t) => t.id === get().currentTab)?.session
          ?.noteId;
      },
      getTab: (tabId) => {
        return get().tabs.find((t) => t.id === tabId);
      }
    }),
    {
      name: "tabs-storage",
      getStorage: () => MMKV as unknown as StateStorage,
      onRehydrateStorage: () => {
        return (state) => {
          history.history = state?.history || [];
        };
      }
    }
  )
);
