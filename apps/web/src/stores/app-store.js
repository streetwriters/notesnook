import createStore from "../common/store";
import { db } from "../common/db";
import { store as noteStore } from "./note-store";
import { store as notebookStore } from "./notebook-store";
import { store as trashStore } from "./trash-store";
import { store as tagStore } from "./tag-store";
import { store as editorstore } from "./editor-store";
import BaseStore from "./index";
import { showToast } from "../utils/toast";
import { resetReminders } from "../common/reminders";

var syncStatusTimeout = 0;
class AppStore extends BaseStore {
  // default state
  isSideMenuOpen = false;
  isFocusMode = false;
  isEditorOpen = false;
  isVaultCreated = false;
  syncStatus = "synced";
  colors = [];
  globalMenu = { items: [], data: {} };
  reminders = [];
  menuPins = [];
  lastSynced = 0;

  refresh = async () => {
    await this.updateLastSynced();
    await resetReminders();
    noteStore.refresh();
    notebookStore.refresh();
    trashStore.refresh();
    tagStore.refresh();
    this.refreshNavItems();
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
          priority: priority === "high" ? 1 : priority === "medium" ? 2 : 1,
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
        notebookId: item.notebookId,
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
    clearTimeout(syncStatusTimeout);
    this.updateLastSynced();
    this.set((state) => (state.isSyncing = true));

    this.set((state) => (state.syncStatus = "syncing"));
    return db
      .sync(full, force)
      .then(async (result) => {
        if (!result) return;
        await this.updateLastSynced();
        this.set((state) => (state.syncStatus = "completed"));
        return await this.refresh();
      })
      .catch(async (err) => {
        showToast("error", err.message);
        console.error(err);
        if (err.code === "MERGE_CONFLICT") {
          if (editorstore.get().session.id)
            editorstore.openSession(editorstore.get().session.id, true);
          await this.refresh();
          this.set((state) => (state.syncStatus = "conflicts"));
        } else {
          this.set((state) => (state.syncStatus = "failed"));
        }
      })
      .finally(() => {
        if (this.get().syncStatus === "conflicts") return;

        syncStatusTimeout = setTimeout(() => {
          this.set((state) => (state.syncStatus = "synced"));
        }, 3000);
      });
  };
}

/**
 * @type {[import("zustand").UseStore<AppStore>, AppStore]}
 */
const [useStore, store] = createStore(AppStore);
export { useStore, store };
