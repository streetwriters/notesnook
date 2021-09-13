import React from "react";
import createStore from "../common/store";
import { db } from "../common/db";
import { store as appStore } from "./app-store";
import BaseStore from "./index";
import config from "../utils/config";
import { EV, EVENTS } from "notes-core/common";
import {
  showLoadingDialog,
  showSessionExpiredDialog,
} from "../common/dialog-controller";
import { Text } from "rebass";
import { showAccountLoggedOutNotice } from "../common/dialog-controller";
import Config from "../utils/config";
import { onPageVisibilityChanged } from "../utils/page-visibility";

class UserStore extends BaseStore {
  isLoggedIn = false;
  isLoggingIn = false;
  isSigningIn = false;
  user = undefined;

  init = () => {
    EV.subscribe(EVENTS.appRefreshRequested, () => appStore.refresh());

    EV.subscribe(EVENTS.userSessionExpired, async () => {
      const user = this.get().user;
      Config.set("sessionExpired", "true");
      const loginResult = await showSessionExpiredDialog(user.email);
      Config.set("sessionExpired", "false");
      if (!loginResult) {
        await db.user.logout(false);
      } else {
        window.location.reload();
      }
    });

    db.user.getUser().then(async (user) => {
      if (!user) return false;
      this.set((state) => {
        state.user = user;
        state.isLoggedIn = true;
      });
      if (Config.get("sessionExpired") === "true")
        EV.publish(EVENTS.userSessionExpired);
    });

    if (Config.get("sessionExpired") === "true") return;

    return db.user.fetchUser().then(async (user) => {
      if (!user) return false;
      EV.remove(
        EVENTS.userSubscriptionUpdated,
        EVENTS.userEmailConfirmed,
        EVENTS.databaseSyncRequested
      );

      this.set((state) => {
        state.user = user;
        state.isLoggedIn = true;
      });
      EV.subscribe(EVENTS.userSubscriptionUpdated, (subscription) => {
        this.set((state) => (state.user.subscription = subscription));
      });
      EV.subscribe(EVENTS.userEmailConfirmed, async () => {
        window.location.reload();
      });

      EV.subscribe(EVENTS.databaseSyncRequested, async () => {
        console.log("Sync requested.");
        await appStore.sync(false);
      });

      EV.subscribe(EVENTS.userLoggedOut, async (reason) => {
        this.set((state) => {
          state.user = {};
          state.isLoggedIn = false;
        });
        config.clear();
        await appStore.refresh();

        if (!!reason) {
          await showAccountLoggedOutNotice(reason);
        }
      });

      onPageVisibilityChanged(async (documentHidden) => {
        if (!documentHidden) {
          await db.connectSSE();
        }
      });
      await appStore.sync();
      return true;
    });
  };

  login = (form, skipInit = false) => {
    this.set((state) => (state.isLoggingIn = true));
    return db.user
      .login(form.email.toLowerCase(), form.password)
      .then(() => {
        if (skipInit) return true;
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
      .signup(form.email.toLowerCase(), form.password)
      .then(() => {
        return this.init();
      })
      .finally(() => {
        this.set((state) => (state.isSigningIn = false));
      });
  };
}

/**
 * @type {[import("zustand").UseStore<UserStore>, UserStore]}
 */
const [useStore, store] = createStore(UserStore);
export { useStore, store };
