import createStore from "../common/store";
import { db } from "../common";
import { showPasswordDialog } from "../components/dialogs/passworddialog";

function appStore(set, get) {
  return {
    isSideMenuOpen: false,
    isFocusModeEnabled: false,
    arePropertiesVisible: false,
    isSelectionMode: false,
    shouldSelectAll: false,
    selectedItems: [],
    colors: [],
    closeSideMenu: function() {
      set(state => {
        state.isSideMenuOpen = false;
      });
    },
    openSideMenu: function() {
      set(state => {
        state.isSideMenuOpen = true;
      });
    },
    refreshColors: function() {
      set(state => {
        state.colors = db.colors.all;
      });
    },
    enableFocusMode: function() {
      set(state => {
        state.isFocusModeEnabled = true;
      });
    },
    disableFocusMode: function() {
      set(state => {
        state.isFocusModeEnabled = false;
      });
    },
    hideProperties: function() {
      set(state => {
        state.arePropertiesVisible = false;
      });
    },
    showProperties: function() {
      set(state => {
        state.arePropertiesVisible = true;
      });
    },
    enterSelectionMode: function() {
      set(state => {
        state.isSelectionMode = true;
      });
    },
    exitSelectionMode: function() {
      set(state => {
        state.isSelectionMode = false;
        state.selectedItems = [];
      });
    },
    selectItem: function(item) {
      const index = get().selectedItems.findIndex(v => item.id === v.id);
      set(state => {
        if (index >= 0) {
          state.selectedItems.splice(index, 1);
        } else {
          state.selectedItems.push(item);
        }
        state.shouldSelectAll = false;
      });
      if (get().selectedItems.length <= 0) {
        get().exitSelectionMode();
      }
    },
    selectAll() {
      if (!get().isSelectionMode) return;
      set(state => {
        state.shouldSelectAll = true;
      });
    },
    createVault: function() {
      return showPasswordDialog("create_vault", password =>
        db.vault.create(password)
      );
    },
    unlockVault: function() {
      return showPasswordDialog("unlock_vault", password => {
        return db.vault
          .unlock(password)
          .then(() => true)
          .catch(() => false);
      });
    }
  };
}

const [useStore, store] = createStore(appStore);

export { useStore, store };
