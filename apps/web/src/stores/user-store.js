import React from "react";
import createStore from "../common/store";
import { db } from "../common";
import { store as appStore } from "./app-store";
import BaseStore from "./index";
import config from "../utils/config";
import { EV } from "notes-core/common";
import { showLoadingDialog } from "../components/dialogs/loadingdialog";
import { Text } from "rebass";

class UserStore extends BaseStore {
  isLoggedIn = false;
  isLoggingIn = false;
  isSigningIn = false;
  isSyncing = false;
  user = undefined;

  init = () => {
    return db.user.get().then(async (user) => {
      if (!user) return false;
      this.set((state) => {
        state.user = user;
        state.isLoggedIn = true;
      });
      EV.subscribe("db:refresh", () => appStore.refresh());
      EV.subscribe("user:upgraded", (subscription) => {
        this.set((state) => {
          state.user = {
            ...state.user,
            subscription,
          };
        });
      });
      EV.subscribe("db:sync", () => this.sync(false));
      await this.sync();
      return true;
    });
  };

  login = (form) => {
    this.set((state) => (state.isLoggingIn = true));
    return db.user
      .login(form.username, form.password)
      .then(() => {
        return showLoadingDialog({
          title: "Importing your data...",
          subtitle:
            "We are importing your data from the server. Please wait...",
          action: async () => {
            return await this.init();
          },
          message: (
            <Text color="error">
              Please do NOT close your browser or power off your device.
            </Text>
          ),
        });
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

  sync = (full = true) => {
    this.set((state) => (state.isSyncing = true));
    return db
      .sync(full)
      .then(() => {
        return appStore.refresh();
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
