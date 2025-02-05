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
import { EV, EVENTS } from "@notesnook/core";
import Config from "../utils/config";
import { hashNavigate } from "../navigation";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { SUBSCRIPTION_STATUS } from "../common/constants";
import { AuthenticatorType, User } from "@notesnook/core";
import { ConfirmDialog } from "../dialogs/confirm";
import { OnboardingDialog } from "../dialogs/onboarding-dialog";
import { strings } from "@notesnook/intl";

class UserStore extends BaseStore<UserStore> {
  isLoggedIn?: boolean;
  isLoggingIn = false;
  isSigningIn = false;

  user?: User = undefined;
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

    if (Config.get("sessionExpired")) return;

    EV.subscribe(EVENTS.userSubscriptionUpdated, (subscription) => {
      const wasUserPremium = isUserPremium();
      this.set((state) => {
        if (!state.user) return;
        state.user.subscription = subscription;
      });
      if (!wasUserPremium && isUserPremium())
        OnboardingDialog.show({
          type:
            subscription.type === SUBSCRIPTION_STATUS.TRIAL ? "trial" : "pro"
        });
    });

    EV.subscribe(EVENTS.userEmailConfirmed, () => {
      hashNavigate("/confirmed");
    });

    EV.subscribe(EVENTS.userLoggedOut, async (reason) => {
      this.set((state) => {
        state.user = undefined;
        state.isLoggedIn = false;
      });
      Config.logout();
      if (reason) {
        await ConfirmDialog.show({
          title: strings.loggedOut(),
          message: reason,
          negativeButtonText: strings.okay()
        });
      }
    });

    return db.user.fetchUser().then(async (user) => {
      if (!user) return false;

      this.set({
        user,
        isLoggedIn: true
      });

      return true;
    });
  };

  refreshUser = async () => {
    return db.user.fetchUser().then((user) => {
      this.set({ user });
    });
  };

  login = async (
    form:
      | { email: string }
      | { email: string; password: string }
      | { code: string; method: AuthenticatorType | "recoveryCode" },
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
