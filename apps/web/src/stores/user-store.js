import createStore from "../common/store";
import { db } from "../common";
import { store as appStore } from "./app-store";
import BaseStore from "./index";

class UserStore extends BaseStore {
  isLoggedIn = false;
  isLoggingIn = false;
  isSigningIn = false;
  isSyncing = false;
  user = undefined;

  init = () => {
    return db.user.get().then((user) => {
      if (!user) return false;
      this.set((state) => {
        state.user = user;
        state.isLoggedIn = true;
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
    db.user.logout().then(async () => {
      this.set((state) => {
        state.user = undefined;
        state.isLoggedIn = false;
      });
      await appStore.refresh();
    });
  };
}

/**
 * @type {[import("zustand").UseStore<UserStore>, UserStore]}
 */
const [useStore, store] = createStore(UserStore);
export { useStore, store };
