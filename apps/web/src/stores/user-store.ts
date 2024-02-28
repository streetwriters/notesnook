/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import createStore from "../common/store";
import { db } from "../common/db";
import BaseStore from "./index";
import config from "../utils/config";
import { EV, EVENTS } from "@notesnook/core/dist/common";
import {
  showAccountLoggedOutNotice,
  showOnboardingDialog
} from "../common/dialog-controller";
import Config from "../utils/config";
import { hashNavigate } from "../navigation";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { SUBSCRIPTION_STATUS } from "../common/constants";
import { ANALYTICS_EVENTS, trackEvent } from "../utils/analytics";
import { AuthenticatorType, Profile, User } from "@notesnook/core";

class UserStore extends BaseStore<UserStore> {
  isLoggedIn?: boolean;
  isLoggingIn = false;
  isSigningIn = false;

  user?: User = undefined;
  profile?: Profile;
  counter = 0;

  init = () => {
    EV.subscribe(EVENTS.userSessionExpired, async () => {
      Config.set("sessionExpired", true);
      window.location.replace("/sessionexpired");
    });

    db.user.getUser().then((user) => {
      if (!user) {
        this.set({ isLoggedIn: false });
        return;
      }
      this.set({
        user,
        isLoggedIn: true
      });
      if (Config.get("sessionExpired")) EV.publish(EVENTS.userSessionExpired);
    });

    db.user.getProfile().then((profile) => this.set({ profile }));

    if (Config.get("sessionExpired")) return;

    return db.user.fetchUser().then(async (user) => {
      if (!user) return false;

      const profile = await db.user.getProfile();

      this.set({
        profile,
        user,
        isLoggedIn: true
      });

      EV.remove(EVENTS.userSubscriptionUpdated, EVENTS.userEmailConfirmed);

      EV.subscribe(EVENTS.userSubscriptionUpdated, (subscription) => {
        const wasUserPremium = isUserPremium();
        this.set((state) => {
          if (!state.user) return;
          state.user.subscription = subscription;
        });
        if (!wasUserPremium && isUserPremium())
          showOnboardingDialog(
            subscription.type === SUBSCRIPTION_STATUS.TRIAL ? "trial" : "pro"
          );
      });

      EV.subscribe(EVENTS.userEmailConfirmed, () => {
        hashNavigate("/confirmed");
      });

      EV.subscribe(EVENTS.userLoggedOut, async (reason) => {
        this.set((state) => {
          state.user = undefined;
          state.isLoggedIn = false;
        });
        config.clear();
        EV.publish(EVENTS.appRefreshRequested);
        if (reason) {
          await showAccountLoggedOutNotice(reason);
        }
      });

      return true;
    });
  };

  refreshUser = async () => {
    return db.user.fetchUser().then(async (user) => {
      const profile = await db.user.getProfile();
      this.set({ user, profile });
    });
  };

  login = async (
    form:
      | { email: string }
      | { email: string; password: string }
      | { code: string; method: AuthenticatorType },
    skipInit = false,
    sessionExpired = false
  ) => {
    this.set((state) => (state.isLoggingIn = true));

    try {
      if ("email" in form && !("password" in form)) {
        return await db.user.authenticateEmail(form.email);
      } else if ("code" in form) {
        const { code, method } = form;
        return await db.user.authenticateMultiFactorCode(code, method);
      } else if ("password" in form) {
        const { email, password } = form;
        await db.user.authenticatePassword(
          email,
          password,
          undefined,
          sessionExpired
        );
        Config.set("encryptBackups", true);

        if (skipInit) return true;
        return this.init();
      }
    } finally {
      this.set((state) => (state.isLoggingIn = false));
    }
  };

  signup = (form: { email: string; password: string }) => {
    this.set((state) => (state.isSigningIn = true));
    return db.user
      .signup(form.email.toLowerCase(), form.password)
      .then(() => {
        trackEvent(ANALYTICS_EVENTS.accountCreated);
        return this.init();
      })
      .finally(() => {
        this.set((state) => (state.isSigningIn = false));
      });
  };
}

const [useStore, store] = createStore<UserStore>(
  (set, get) => new UserStore(set, get)
);
export { useStore, store };
