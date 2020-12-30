import createStore from "../common/store";
import { db } from "../common";
import { store as noteStore } from "./note-store";
import { store as notebookStore } from "./notebook-store";
import { store as trashStore } from "./trash-store";
import { store as editorStore } from "./editor-store";
import { store as tagStore } from "./tag-store";
import BaseStore from "./index";
import { isMobile } from "../utils/dimensions";
import { showToast } from "../utils/toast";
import { toTitleCase } from "../utils/string";
import { resetReminders } from "../common/reminders";

class AppStore extends BaseStore {
  // default state
  isSideMenuOpen = !isMobile();
  isFocusMode = false;
  isEditorOpen = false;
  colors = [];
  globalMenu = { items: [], data: {} };
  reminders = [];
  menuPins = [];

  refresh = async () => {
    await resetReminders();
    noteStore.refresh();
    notebookStore.refresh();
    trashStore.refresh();
    tagStore.refresh();
    editorStore.openLastSession();
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
      this.set((state) => {
        const index = state.menuPins.findIndex((i) => i.id === item.id);
        if (index >= -1) {
          state.menuPins.splice(index, 1);
        }
      });
      await db.settings.unpin(item.id);
      showToast("success", `${toTitleCase(item.type)} unpinned from menu!`);
    } else {
      this.set((state) => state.menuPins.push(item));
      await db.settings.pin(item.type, {
        id: item.id,
        notebookId: item.notebookId,
      });
      showToast("success", `${toTitleCase(item.type)} pinned to menu!`);
    }

    // refresh the respective list
    switch (item.type) {
      case "notebook": {
        notebookStore.refresh();
        break;
      }
      case "topic": {
        notebookStore.setSelectedNotebookTopics(item.notebookId);
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
}

/**
 * @type {[import("zustand").UseStore<AppStore>, AppStore]}
 */
const [useStore, store] = createStore(AppStore);
export { useStore, store };
