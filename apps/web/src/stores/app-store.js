import createStore from "../common/store";
import { db } from "../common";
import { showPasswordDialog } from "../components/dialogs/passworddialog";

function appStore(set, get) {
  return {
    isSideMenuOpen: false,
    arePropertiesVisible: false,
    isSelectionMode: false,
    selectedItems: [],
    colors: [],
    closeSideMenu: function() {
      set(state => (state.isSideMenuOpen = false));
    },
    openSideMenu: function() {
      set(state => (state.isSideMenuOpen = true));
    },
    refreshColors: function() {
      set(state => {
        state.colors = db.colors.all;
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
      });
      if (get().selectedItems.length <= 0) {
        get().exitSelectionMode();
      }
    },
    createVault: function() {
      return showPasswordDialog("create_vault").then(password => {
        if (!password) return false;
        return db.vault.create(password);
      });
    },
    unlockVault: function unlockVault() {
      return showPasswordDialog("unlock_vault")
        .then(password => {
          if (!password) return false;
          return db.vault.unlock(password);
        })
        .catch(({ message }) => {
          if (message === "ERR_WRNG_PWD") return unlockVault();
          else return false;
        });
    }
  };
}

const [useStore, store] = createStore(appStore);

export { useStore, store };
