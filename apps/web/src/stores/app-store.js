import { db } from "../common/index";
import createStore from "../common/store";

function appStore(set) {
  return {
    isSideMenuOpen: false,
    closeSideMenu: function() {
      set(state => (state.isSideMenuOpen = false));
    },
    openSideMenu: function() {
      set(state => (state.isSideMenuOpen = true));
    }
  };
}

const [useStore, store] = createStore(appStore);

export { useStore, store };
