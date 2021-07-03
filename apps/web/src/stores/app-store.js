import createStore from "../common/store";
import { db } from "../common/db";
import { store as noteStore } from "./note-store";
import { store as notebookStore } from "./notebook-store";
import { store as trashStore } from "./trash-store";
import { store as editorStore } from "./editor-store";
import { store as tagStore } from "./tag-store";
import BaseStore from "./index";
import { isMobile } from "../utils/dimensions";
import { showToast } from "../utils/toast";
import { resetReminders } from "../common/reminders";

class AppStore extends BaseStore {
  // default state
  isSideMenuOpen = !isMobile();
  isSyncing = false;
  isFocusMode = false;
  isEditorOpen = false;
  isVaultCreated = false;
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
    await editorStore.refresh();
    this.refreshColors();
    this.refreshMenuPins();
  };

  refreshColors = () => {
    this.set((state) => (state.colors = db.colors.all));
  };

  refreshMenuPins = () => {
    this.set((state) => (state.menuPins = db.settings.pins));
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
  addReminder = (type, priority) => {
    this.set((state) =>
      state.reminders.push({
        type,
        priority: priority === "high" ? 1 : priority === "medium" ? 2 : 1,
      })
    );
  };

  pinItemToMenu = async (item) => {
    if (db.settings.isPinned(item.id)) {
      await db.settings.unpin(item.id);
      this.refreshMenuPins();
      showToast("success", `Shortcut removed!`);
    } else {
      await db.settings.pin(item.type, {
        id: item.id,
        notebookId: item.notebookId,
      });
      this.refreshMenuPins();
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

  sync = async (full = true) => {
    this.updateLastSynced();
    this.set((state) => (state.isSyncing = true));
    return db
      .sync(full)
      .then(async () => {
        await this.updateLastSynced();
        return await this.refresh();
      })
      .catch(async (err) => {
        console.error(err);
        if (err.code === "MERGE_CONFLICT") await this.refresh();
        else {
          showToast("error", err.message);
          console.error(err);
        }
      })
      .finally(() => {
        this.set((state) => (state.isSyncing = false));
      });
  };
}

/**
 * @type {[import("zustand").UseStore<AppStore>, AppStore]}
 */
const [useStore, store] = createStore(AppStore);
export { useStore, store };
