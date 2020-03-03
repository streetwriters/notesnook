import createStore from "../common/store";
import { db } from "../common";

function appStore(set, get) {
  return {
    isSideMenuOpen: false,
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
      set(state => {
        const index = state.selectedItems.findIndex(v => item.id === v.id);
        if (index >= 0) {
          state.selectedItems.splice(index, 1);
        } else {
          state.selectedItems.push(item);
        }
      });
      if (get().selectedItems.length <= 0) {
        get().exitSelectionMode();
      }
    }
  };
}

const [useStore, store] = createStore(appStore);

export { useStore, store };
