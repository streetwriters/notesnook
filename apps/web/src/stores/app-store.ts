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
import { db } from "../common/db";
import { store as noteStore } from "./note-store";
import { store as notebookStore } from "./notebook-store";
import { store as trashStore } from "./trash-store";
import { store as tagStore } from "./tag-store";
import { store as editorstore } from "./editor-store";
import { store as attachmentStore } from "./attachment-store";
import { store as monographStore } from "./monograph-store";
import { store as reminderStore } from "./reminder-store";
import { store as announcementStore } from "./announcement-store";
import { store as settingStore } from "./setting-store";
import BaseStore from "./index";
import { showToast } from "../utils/toast";
import { Notice, resetNotices } from "../common/notices";
import { EV, EVENTS, SYNC_CHECK_IDS } from "@notesnook/core/dist/common";
import { logger } from "../utils/logger";
import Config from "../utils/config";
import {
  onNetworkStatusChanged,
  onPageVisibilityChanged
} from "../utils/page-visibility";
import { NetworkCheck } from "../utils/network-check";
import { Color, Notebook, Tag } from "@notesnook/core";

type SyncState =
  | "synced"
  | "syncing"
  | "conflicts"
  | "failed"
  | "completed"
  | "offline"
  | "disabled";
type SyncStatus = {
  key: SyncState;
  progress: number | null;
  type?: "download" | "upload" | "sync";
};
const networkCheck = new NetworkCheck();
let syncStatusTimeout = 0;
let pendingSync: { full: boolean } | undefined = undefined;

class AppStore extends BaseStore<AppStore> {
  // default state
  isSideMenuOpen = false;
  isFocusMode = false;
  isEditorOpen = false;
  isVaultCreated = false;
  isAutoSyncEnabled = Config.get("autoSyncEnabled", true);
  isSyncEnabled = Config.get("syncEnabled", true);
  isRealtimeSyncEnabled = Config.get("isRealtimeSyncEnabled", true);
  syncStatus: SyncStatus = {
    key: navigator.onLine
      ? Config.get("syncEnabled", true)
        ? "synced"
        : "disabled"
      : "offline",
    progress: null,
    type: undefined
  };
  colors: Color[] = [];
  notices: Notice[] = [];
  shortcuts: (Notebook | Tag)[] = [];
  lastSynced = 0;

  init = () => {
    settingStore.refresh();
    // this needs to happen here so reminders can be set on app load.
    reminderStore.refresh();
    announcementStore.refresh();

    EV.subscribe(EVENTS.appRefreshRequested, () => this.refresh());
    db.eventManager.subscribe(EVENTS.syncCompleted, () => this.refresh());

    db.eventManager.subscribe(EVENTS.syncProgress, ({ type, current }) => {
      this.set((state) => {
        state.syncStatus = {
          key: "syncing",
          progress: current,
          type
        };
      });
    });

    EV.subscribe(EVENTS.syncCheckStatus, async (type) => {
      const { isAutoSyncEnabled, isSyncEnabled } = this.get();
      switch (type) {
        case SYNC_CHECK_IDS.sync:
          return { type, result: isSyncEnabled };
        case SYNC_CHECK_IDS.autoSync:
          return { type, result: isAutoSyncEnabled };
        default:
          return { type, result: true };
      }
    });

    db.eventManager.subscribe(
      EVENTS.databaseSyncRequested,
      async (full, force, lastSynced) => {
        if (!this.get().isAutoSyncEnabled) return;
        await this.get().sync(full, force, lastSynced);
      }
    );

    db.eventManager.subscribe(EVENTS.syncAborted, () => {
      this.updateSyncStatus("failed");
    });

    onNetworkStatusChanged(async (status) => {
      if (status === "offline") {
        await this.abortSync("offline");
      } else {
        // a slight delay to make sure sockets are open and can be connected
        // to. Otherwise, this fails miserably.
        await networkCheck.waitForInternet();
        await db.connectSSE({ force: true }).catch(logger.error);
      }
    });

    onPageVisibilityChanged(async (_, documentHidden) => {
      if (!documentHidden) return;

      logger.info("Page visibility changed. Reconnecting SSE...");
      await db.connectSSE({ force: false }).catch(logger.error);
    });
  };

  refresh = async () => {
    logger.measure("refreshing app");

    await this.updateLastSynced();
    await resetNotices();
    await noteStore.refresh();
    await notebookStore.refresh();
    await reminderStore.refresh();
    await trashStore.refresh();
    await tagStore.refresh();
    await attachmentStore.refresh();
    await monographStore.refresh();
    await settingStore.refresh();
    await editorstore.refresh();

    await this.refreshNavItems();

    logger.measure("refreshing app");
  };

  refreshNavItems = async () => {
    const shortcuts = await db.shortcuts.resolved();
    const colors = await db.colors.all.items();
    this.set((state) => {
      state.shortcuts = shortcuts;
      state.colors = colors;
    });
  };

  toggleFocusMode = () => {
    this.set((state) => (state.isFocusMode = !state.isFocusMode));
  };

  toggleAutoSync = () => {
    Config.set("autoSyncEnabled", !this.get().isAutoSyncEnabled);
    this.set((state) => (state.isAutoSyncEnabled = !state.isAutoSyncEnabled));
  };

  toggleSync = () => {
    const { isSyncEnabled } = this.get();
    Config.set("syncEnabled", !isSyncEnabled);
    this.set((state) => (state.isSyncEnabled = !state.isSyncEnabled));

    if (isSyncEnabled) {
      this.abortSync("disabled");
    }
  };

  toggleRealtimeSync = () => {
    const { isRealtimeSyncEnabled } = this.get();
    Config.set("isRealtimeSyncEnabled", !isRealtimeSyncEnabled);
    this.set(
      (state) => (state.isRealtimeSyncEnabled = !state.isRealtimeSyncEnabled)
    );
  };

  toggleSideMenu = (toggleState: boolean) => {
    this.set(
      (state) =>
        (state.isSideMenuOpen =
          toggleState != null ? toggleState : !state.isSideMenuOpen)
    );
  };

  setIsEditorOpen = (toggleState: boolean) => {
    this.set((state) => (state.isEditorOpen = toggleState));
  };

  setIsVaultCreated = (toggleState: boolean) => {
    this.set((state) => (state.isVaultCreated = toggleState));
  };

  setNotices = (...notices: Notice[]) => {
    this.set((state) => {
      for (const notice of notices) {
        const oldIndex = state.notices.findIndex((a) => a.type === notice.type);
        if (oldIndex > -1) state.notices.splice(oldIndex, 1);
        state.notices.push(notice);
      }
    });
  };

  dismissNotices = (...notices: Notice[]) => {
    this.set((state) => {
      for (const notice of notices) {
        state.notices.splice(state.notices.indexOf(notice), 1);
      }
    });
  };

  addToShortcuts = async (item: { type: "tag" | "notebook"; id: string }) => {
    if (await db.shortcuts.exists(item.id)) {
      await db.shortcuts.remove(item.id);
      this.refreshNavItems();
      showToast("success", `Shortcut removed!`);
    } else {
      await db.shortcuts.add({
        itemType: item.type,
        itemId: item.id
      });
      this.refreshNavItems();
      showToast("success", `Shortcut created!`);
    }

    // refresh the respective list
    switch (item.type) {
      case "notebook": {
        notebookStore.refresh();
        break;
      }
      case "tag": {
        tagStore.refresh();
        break;
      }
      default:
        return;
    }
  };

  updateLastSynced = async () => {
    const lastSynced = await db.lastSynced();
    this.set((state) => (state.lastSynced = lastSynced));
  };

  sync = async (full = true, force = false, lastSynced?: number) => {
    if (
      this.isSyncing() ||
      !this.get().isSyncEnabled ||
      !navigator.onLine ||
      !(await networkCheck.waitForInternet())
    ) {
      logger.info("Ignoring duplicate sync", {
        full,
        force,
        lastSynced,
        syncing: this.isSyncing(),
        syncDisabled: !this.get().isSyncEnabled,
        offline: !navigator.onLine
      });
      if (this.isSyncing()) pendingSync = { full };
      return;
    }

    clearTimeout(syncStatusTimeout);
    this.updateLastSynced();

    this.updateSyncStatus("syncing");
    try {
      const result = await db.sync(full, force);

      if (!result) return this.updateSyncStatus("failed");
      this.updateSyncStatus("completed", true);

      await this.updateLastSynced();

      if (pendingSync) {
        logger.info("Running pending sync", pendingSync);
        const isFullSync = pendingSync.full;
        pendingSync = undefined;
        await this.get().sync(isFullSync, false);
      }
    } catch (err) {
      if (!(err instanceof Error)) {
        console.error(err);
        return;
      }

      logger.error(err);
      if (err.cause === "MERGE_CONFLICT") {
        const sessionId = editorstore.get().session.id;
        if (sessionId) await editorstore.openSession(sessionId, true);
        await this.refresh();
        this.updateSyncStatus("conflicts");
      } else {
        this.updateSyncStatus("failed");
      }

      if (
        err?.message?.indexOf("Failed to fetch") > -1 ||
        err?.message?.indexOf("Could not connect to the Sync server.") > -1
      )
        return;

      showToast("error", err.message);
    }
  };

  abortSync = async (status: SyncState = "offline") => {
    if (this.isSyncing()) this.updateSyncStatus("failed");
    else this.updateSyncStatus(status);

    await db.syncer.stop();
  };

  updateSyncStatus = (key: SyncState, reset = false) => {
    logger.info(`Sync status updated: ${key}`);
    this.set((state) => {
      state.syncStatus = { key, progress: null, type: undefined };
    });

    if (reset) {
      syncStatusTimeout = setTimeout(() => {
        if (this.get().syncStatus.key === key)
          this.updateSyncStatus("synced", false);
      }, 3000) as unknown as number;
    }
  };

  isSyncing = () => {
    const status = this.get().syncStatus.key;
    return status === "syncing";
  };
}

const [useStore, store] = createStore<AppStore>(
  (set, get) => new AppStore(set, get)
);
export { useStore, store };
