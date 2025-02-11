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
import {
  TabHistory as TabHistoryType,
  TabSessionHistory
} from "@notesnook/common";
import { getId } from "@notesnook/core";
import { MMKVLoader } from "react-native-mmkv-storage";
import create from "zustand";
import { persist, StateStorage } from "zustand/middleware";
import { db } from "../../../common/database";
import { MMKV } from "../../../common/database/mmkv";
import { eSendEvent } from "../../../services/event-manager";
import { eOnLoadNote } from "../../../utils/events";
import { editorController } from "./utils";

class TabHistory {
  history: string[];
  constructor() {
    this.history = [];
  }

  add(item: string) {
    const index = this.history.findIndex((id) => item === id);
    if (index !== -1) {
      // Item already exists, move it to the top
      this.history.splice(index, 1);
    }
    this.history.unshift(item); // Add item to the beginning of the array

    useTabStore.setState({
      historyNew: this.history.slice()
    });
    return true; // Item added successfully
  }

  remove(id: string) {
    const index = this.history.findIndex((item) => item === id);
    if (index >= -1 && index < this.history.length) {
      const removedItem = this.history.splice(index, 1)[0];
      return removedItem;
    }
    useTabStore.setState({
      historyNew: this.history.slice()
    });
    return null; // Invalid index
  }

  restoreLast() {
    if (this.history.length > 0) {
      const restoredItem = this.history.shift(); // Remove and return the first item
      return restoredItem;
    }
    useTabStore.setState({
      historyNew: this.history.slice()
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
    if (!id) return null;
    return TabSessionStorage.storage.getMap(id);
  }

  static set(id: string, session: TabSessionItem): void {
    if (!id) return;
    TabSessionStorage.storage.setMap(id, session);
  }

  static update(id: string, session: Partial<TabSessionItem>) {
    const currentSession = TabSessionStorage.get(id);
    const newSession = {
      ...currentSession,
      ...session,
      id: currentSession?.id || session.id || id
    };

    TabSessionStorage.set(id, newSession as TabSessionItem);
    return newSession;
  }

  static remove(id: string) {
    if (!id) return;
    TabSessionStorageKV.removeItem(id);
  }
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
  }
});

export type TabItem = {
  id: string;
  pinned?: boolean;
  needsRefresh?: boolean;
  session?: Partial<TabSessionItem>;
};

const history = new TabHistory();

export type TabStore = {
  tabs: TabItem[];
  currentTab: string;
  updateTab: (id: string, options: Omit<Partial<TabItem>, "id">) => void;
  focusPreviewTab: (
    noteId: string,
    options: Omit<Partial<TabItem>, "id">
  ) => void;
  removeTab: (index: string) => void;
  moveTab: (index: number, toIndex: number) => void;
  newTab: (options?: Omit<Partial<TabItem>, "id">) => string;
  focusTab: (id: string) => void;
  getNoteIdForTab: (id: string) => string | undefined;
  getTabForNote: (noteId: string) => string | undefined;
  getTabsForNote: (noteId: string) => TabItem[];
  forEachNoteTab: (noteId: string, cb: (tab: TabItem) => void) => void;
  hasTabForNote: (noteId: string) => boolean;
  focusEmptyTab: () => void;
  getCurrentNoteId: () => string | undefined;
  getTab: (tabId: string) => TabItem | undefined;
  newTabSession: (
    id: string,
    options?: Omit<Partial<TabSessionItem>, "id">
  ) => void;
  historyNew: string[];
  biometryAvailable?: boolean;
  biometryEnrolled?: boolean;
  tabSessionHistory: TabHistoryType;
  goBack(): void;
  goForward(): void;
  loadSession: (id: string) => Promise<boolean>;
  canGoBack?: boolean;
  canGoForward?: boolean;
  sessionId?: string;
};

const DEFAULT_TABS = {
  tabs: [
    {
      id: "679da59a3924d4bd56d16d3f",
      session: {
        id: "679da5a5667a16db2353a062"
      }
    }
  ],
  tabSessionHistory: {
    "679da59a3924d4bd56d16d3f": {
      backStack: ["679da5a5667a16db2353a062"],
      forwardStack: [] as string[]
    }
  } as TabHistoryType,
  historyNew: ["679da59a3924d4bd56d16d3f"],
  currentTab: "679da59a3924d4bd56d16d3f"
} as TabStore;

export function resetTabStore() {
  useTabStore.setState({
    ...DEFAULT_TABS
  });
  TabSessionStorage.storage.clearStore();
}

export const useTabStore = create<TabStore>(
  persist(
    (set, get) => ({
      ...DEFAULT_TABS,
      newTabSession: (
        _id?: string,
        options?: Omit<Partial<TabSessionItem>, "id">
      ) => {
        const tabId = _id || (get().currentTab as string);

        const sessionHistory = get().tabSessionHistory[tabId];

        let oldSessionId: string | undefined = undefined;
        if (sessionHistory) {
          const allSessions = sessionHistory.backStack.concat(
            sessionHistory.forwardStack
          );
          allSessions.forEach((id) => {
            if (TabSessionStorage.get(id)?.noteId === options?.noteId) {
              oldSessionId = id;
            }
          });
        }

        const sessionId =
          oldSessionId &&
          tabSessionHistory.currentSessionId(tabId) === oldSessionId
            ? oldSessionId
            : tabSessionHistory.add(tabId, oldSessionId);

        let session: Partial<TabSessionItem>;

        if (!oldSessionId) {
          session = {
            id: sessionId,
            ...options
          };
          TabSessionStorage.set(sessionId, session as TabSessionItem);
        } else {
          session = {
            id: sessionId,
            ...TabSessionStorage.get(oldSessionId),
            ...options
          };
        }

        const index = get().tabs.findIndex((t) => t.id === tabId);
        if (index == -1) return;
        const tabs = [...get().tabs];
        tabs[index] = {
          ...tabs[index],
          session: session
        } as TabItem;

        set({
          tabs: tabs
        });
        syncTabs();
      },
      updateTab: (id: string, options: Omit<Partial<TabItem>, "id">) => {
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
        const currentTab = get().currentTab;
        if (!currentTab) return;
        if (!tabSessionHistory.canGoBack(currentTab)) return;

        const id = tabSessionHistory.back(currentTab) as string;
        const sessionLoaded = await get().loadSession(id);

        if (!sessionLoaded) {
          const canGoBack = tabSessionHistory.canGoBack(currentTab);
          if (!canGoBack) {
            tabSessionHistory.forward(currentTab);
            syncTabs();
          } else {
            get().goBack();
            tabSessionHistory.remove(currentTab, id);
            TabSessionStorage.remove(id);
            return;
          }
        } else {
          syncTabs();
        }
      },
      goForward: async () => {
        const currentTab = get().currentTab;
        if (!currentTab) return;

        if (!tabSessionHistory.canGoForward(currentTab)) return;
        const id = tabSessionHistory.forward(currentTab) as string;
        if (!(await get().loadSession(id))) {
          const canGoForward = tabSessionHistory.canGoForward(currentTab);
          if (!canGoForward) {
            tabSessionHistory.back(currentTab);
            syncTabs();
          } else {
            get().goForward();
            tabSessionHistory.remove(currentTab, id);
            TabSessionStorage.remove(id);
            return;
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
          session.noteLocked = isLocked;
          session.locked = isLocked;

          session.readonly = note.readonly;
        } else if (session.noteId) {
          console.log("Failed to load session...");
          return false;
        }

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

      removeTab: (id: string) => {
        const index = get().tabs.findIndex((t) => t.id === id);
        if (index > -1) {
          const isFocused = id === get().currentTab;
          const nextTabs = get().tabs.slice();
          nextTabs.splice(index, 1);
          history.remove(id);

          const tabSessions = tabSessionHistory.getTabHistory(id);
          tabSessions.back.forEach((id) => TabSessionStorage.remove(id));
          tabSessions.forward.forEach((id) => TabSessionStorage.remove(id));
          tabSessionHistory.clearStackForTab(id);

          if (nextTabs.length === 0) {
            const id = getId();
            set({
              tabs: [{ id: id }]
            });
            get().newTabSession(id);
            get().focusTab(id);
          } else {
            set({
              tabs: nextTabs
            });
            if (isFocused) {
              const lastTab = history.restoreLast();
              if (lastTab) get().focusTab(lastTab);
            }
          }
          syncTabs();
        }
      },
      newTab: (options) => {
        const id = getId();
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

      focusTab: (id: string) => {
        history.add(id);
        set({
          currentTab: id,
          canGoBack: tabSessionHistory.canGoBack(id),
          canGoForward: tabSessionHistory.canGoForward(id),
          sessionId: tabSessionHistory.currentSessionId(id)
        });
        syncTabs();
      },
      getNoteIdForTab: (id: string) => {
        return get().tabs.find((t) => t.id === id)?.session?.noteId;
      },
      hasTabForNote: (noteId: string) => {
        return !!get().tabs.find((t) => t.session?.noteId === noteId);
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
      name: "tabs-storage-v5",
      getStorage: () => MMKV as unknown as StateStorage,
      onRehydrateStorage: () => {
        return (state) => {
          history.history = state?.historyNew || [];
        };
      }
    }
  )
);
