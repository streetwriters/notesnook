import createStore from "../common/store";
import { db } from "../common";

function userStore(set, get) {
  return {
    isLoggedIn: false,
    user: undefined,
    init: () => {
      return db.user.get().then(user => {
        if (!user) return false;
        set(state => {
          state.user = user;
          state.isLoggedIn = true;
        });
        return true;
      });
    },
    login: (username, password) => {
      return db.user
        .login(username, password)
        .then(() => {
          return get().init();
        })
        .catch(() => {
          return false;
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
