/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
import BaseStore from "./index";
import { showToast } from "../utils/toast";
import { resetReminders } from "../common/reminders";
import { EV, EVENTS } from "@notesnook/core/common";
import { logger } from "../utils/logger";

var syncStatusTimeout = 0;
const BATCH_SIZE = 50;
class AppStore extends BaseStore {
  // default state
  isSideMenuOpen = false;
  isFocusMode = false;
  isEditorOpen = false;
  isVaultCreated = false;
  syncStatus = {
    key: "synced",
    progress: null,
    type: null
  };
  colors = [];
  globalMenu = { items: [], data: {} };
  reminders = [];
  menuPins = [];
  lastSynced = 0;

  init = () => {
    let count = 0;
    EV.subscribe(EVENTS.appRefreshRequested, () => this.refresh());

    db.eventManager.subscribe(
      EVENTS.syncProgress,
      ({ type, total, current }) => {
        if (total === current) return;
        this.set((state) => {
          state.syncStatus = {
            key: "syncing",
            progress: ((current / total) * 100).toFixed(),
            type
          };
        });

        if (type === "download" && ++count >= BATCH_SIZE) {
          count = 0;
          this.refresh();
        }
      }
    );

    db.eventManager.subscribe(EVENTS.syncCompleted, () => {
      this.set((state) => {
        state.syncStatus = { key: "synced" };
      });
      count = 0;
      this.refresh();
    });
  };

  refresh = async () => {
    logger.measure("refreshing app");

    await this.updateLastSynced();
    await resetReminders();
    noteStore.refresh();
    notebookStore.refresh();
    trashStore.refresh();
    tagStore.refresh();
    attachmentStore.refresh();
    monographStore.refresh();
    this.refreshNavItems();

    logger.measure("refreshing app");
  };

  refreshNavItems = () => {
    this.set((state) => {
      state.menuPins = db.settings.pins;
      state.colors = db.colors.all;
    });
  };

  toggleFocusMode = () => {
    this.set((state) => (state.isFocusMode = !state.isFocusMode));
  };

  toggleSideMenu = (toggleState) => {
    this.set(
      (state) =>
        (state.isSideMenuOpen =
          toggleState != null ? toggleState : !state.isSideMenuOpen)
    );
  };

  setGlobalMenu = (items, data) => {
    this.set((state) => (state.globalMenu = { items, data }));
  };

  setIsEditorOpen = (toggleState) => {
    this.set((state) => (state.isEditorOpen = toggleState));
  };

  setIsVaultCreated = (toggleState) => {
    this.set((state) => (state.isVaultCreated = toggleState));
  };

  /**
   *
   * @param {"backup"|"signup"|"email"|"recoverykey"} type
   * @param {string} title
   * @param {string} detail
   * @param {"high"|"medium"|"low"} priority
   */
  setReminders = (...reminders) => {
    this.set((state) => {
      state.reminders = [];
      for (let reminder of reminders) {
        const { priority, type } = reminder;
        state.reminders.push({
          type,
          priority: priority === "high" ? 1 : priority === "medium" ? 2 : 1
        });
      }
    });
  };

  dismissReminders = (...reminders) => {
    this.set((state) => {
      for (let reminder of reminders) {
        state.reminders.splice(state.reminders.indexOf(reminder), 1);
      }
    });
  };

  pinItemToMenu = async (item) => {
    if (db.settings.isPinned(item.id)) {
      await db.settings.unpin(item.id);
      this.refreshNavItems();
      showToast("success", `Shortcut removed!`);
    } else {
      await db.settings.pin(item.type, {
        id: item.id,
        notebookId: item.notebookId
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
      case "topic": {
        notebookStore.setSelectedNotebook(item.notebookId);
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

  sync = async (full = true, force = false) => {
    if (this.isSyncing()) return;

    clearTimeout(syncStatusTimeout);
    this.updateLastSynced();

    this.updateSyncStatus("syncing");
    try {
      const result = await db.sync(full, force);

      if (!result) return this.updateSyncStatus("failed");
      else if (full) this.updateSyncStatus("completed");

      await this.updateLastSynced();
    } catch (err) {
      logger.error(err);
      if (err.code === "MERGE_CONFLICT") {
        if (editorstore.get().session.id)
          editorstore.openSession(editorstore.get().session.id, true);
        await this.refresh();
        this.updateSyncStatus("conflicts");
      } else {
        this.updateSyncStatus("failed");
      }

      if (err?.message?.indexOf("Failed to fetch") > -1) return;

      showToast("error", err.message);
    } finally {
      if (this.get().syncStatus.key !== "conflicts")
        syncStatusTimeout = setTimeout(() => {
          this.updateSyncStatus("synced");
        }, 3000);
    }
  };

  /**
   *
   * @param {"synced" | "syncing" | "conflicts" | "failed" | "completed"} key
   */
  updateSyncStatus = (key) => {
    logger.info(`Sync status updated: ${key}`);
    this.set((state) => (state.syncStatus = { key }));
  };

  isSyncing = () => {
    const status = this.get().syncStatus.key;
    return status === "syncing";
  };
}

/**
 * @type {[import("zustand").UseStore<AppStore>, AppStore]}
 */
const [useStore, store] = createStore(AppStore);
export { useStore, store };
