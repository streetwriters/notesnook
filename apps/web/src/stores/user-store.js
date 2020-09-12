import createStore from "../common/store";
import { db } from "../common";
import { store as appStore } from "./app-store";
import BaseStore from "./index";
import config from "../utils/config";

class UserStore extends BaseStore {
  isLoggedIn = false;
  isLoggingIn = false;
  isSigningIn = false;
  isSyncing = false;
  user = {};

  init = () => {
    return db.user.get().then(async (user) => {
      if (!user) return false;
      this.set((state) => {
        state.user = user;
        state.isLoggedIn = true;
      });
      db.ev.subscribe("db:refresh", () => appStore.refresh());
      db.ev.subscribe("user:upgraded", (subscription) => {
        console.log("user:upgraded", subscription);
        this.set((state) => {
          state.user = {
            ...state.user,
            notesnook: { ...state.user.notesnook, subscription },
          };
        });
      });
      this.sync();
      return true;
    });
  };

  login = (form) => {
    this.set((state) => (state.isLoggingIn = true));
    return db.user
      .login(form.username, form.password)
      .then(() => {
        return this.init();
      })
      .finally(() => {
        this.set((state) => (state.isLoggingIn = false));
      });
  };

  signup = (form) => {
    this.set((state) => (state.isSigningIn = true));
    return db.user
      .signup(form.username, form.email, form.password)
      .then(() => {
        return this.init();
      })
      .finally(() => {
        this.set((state) => (state.isSigningIn = false));
      });
  };

  sync = () => {
    this.set((state) => (state.isSyncing = true));
    db.sync()
      .then(() => {
        appStore.refresh();
      })
      .catch(async (err) => {
        if (err.code === "MERGE_CONFLICT") await appStore.refresh();
        else console.error(err);
      })
      .finally(() => {
        this.set((state) => (state.isSyncing = false));
      });
  };

  logout = () => {
    return db.user.logout().then(async () => {
      this.set((state) => {
        state.user = {};
        state.isLoggedIn = false;
      });
      config.clear();
      await appStore.refresh();
    });
  };
}

/**
 * @type {[import("zustand").UseStore<UserStore>, UserStore]}
 */
const [useStore, store] = createStore(UserStore);
export { useStore, store };
