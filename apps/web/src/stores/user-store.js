import createStore from "../common/store";
import { db } from "../common";
import { store as appStore } from "./app-store";

function userStore(set, get) {
  return {
    isLoggedIn: false,
    isLoggingIn: false,
    isSyncing: false,
    user: undefined,
    init: () => {
      return db.user.get().then(user => {
        if (!user) return false;
        set(state => {
          state.user = user;
          state.isLoggedIn = true;
        });
        get().sync();
        return true;
      });
    },
    login: (username, password) => {
      set(state => {
        state.isLoggingIn = true;
      });
      return db.user
        .login(username, password)
        .then(() => {
          return get().init();
        })
        .finally(() => {
          set(state => {
            state.isLoggingIn = false;
          });
        });
    },
    sync: () => {
      set(state => {
        state.isSyncing = true;
      });
      db.sync()
        .then(() => {
          appStore.getState().refreshApp();
        })
        .catch(err => {
          console.error(err);
        })
        .finally(() => {
          set(state => {
            state.isSyncing = false;
          });
        });
    },
    logout: () => {
      db.user.logout().then(() => {
        set(state => {
          state.user = undefined;
          state.isLoggedIn = false;
        });
      });
    }
  };
}

const [useStore, store] = createStore(userStore);

export { useStore, store };
