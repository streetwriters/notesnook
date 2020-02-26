import createStore from "../common/store";
import { db } from "../common";

function appStore(set) {
  return {
    isSideMenuOpen: false,
    closeSideMenu: function() {
      set(state => (state.isSideMenuOpen = false));
    },
    openSideMenu: function() {
      set(state => (state.isSideMenuOpen = true));
    },
    colors: [],
    refreshColors: function() {
      set(state => {
        state.colors = db.colors.all;
      });
    }
  };
}

const [useStore, store] = createStore(appStore);

export { useStore, store };
