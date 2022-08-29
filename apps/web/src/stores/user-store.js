import createStore from "../common/store";
import { db } from "../common/db";
import BaseStore from "./index";
import config from "../utils/config";
import { EV, EVENTS } from "@notesnook/core/common";
import {
  showAccountLoggedOutNotice,
  showOnboardingDialog
} from "../common/dialog-controller";
import Config from "../utils/config";
import { onPageVisibilityChanged } from "../utils/page-visibility";
import { hashNavigate } from "../navigation";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { SUBSCRIPTION_STATUS } from "../common/constants";
import { ANALYTICS_EVENTS, trackEvent } from "../utils/analytics";
import { logger } from "../utils/logger";

class UserStore extends BaseStore {
  isLoggedIn = false;
  isLoggingIn = false;
  isSigningIn = false;
  /**
   * @type {User}
   */
  user = undefined;

  init = () => {
    EV.subscribe(EVENTS.userSessionExpired, async () => {
      Config.set("sessionExpired", true);
      window.location.replace("/sessionexpired");
    });

    db.user.getUser().then(async (user) => {
      if (!user) return false;
      this.set((state) => {
        state.user = user;
        state.isLoggedIn = true;
      });
      if (Config.get("sessionExpired")) EV.publish(EVENTS.userSessionExpired);
    });

    if (Config.get("sessionExpired")) return;

    return db.user.fetchUser().then(async (user) => {
      if (!user) return false;

      EV.remove(EVENTS.userSubscriptionUpdated, EVENTS.userEmailConfirmed);

      this.set((state) => {
        state.user = user;
        state.isLoggedIn = true;
      });

      EV.subscribe(EVENTS.userSubscriptionUpdated, (subscription) => {
        const wasUserPremium = isUserPremium();
        this.set((state) => (state.user.subscription = subscription));
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
          state.user = {};
          state.isLoggedIn = false;
        });
        config.clear();
        EV.publish(EVENTS.appRefreshRequested);
        if (!!reason) {
          await showAccountLoggedOutNotice(reason);
        }
      });

      onPageVisibilityChanged(async function (type, documentHidden) {
        if (!documentHidden) {
          logger.info("Page visibility changed. Reconnecting SSE...");
          if (type === "online") {
            // a slight delay to make sure sockets are open and can be connected
            // to. Otherwise, this fails miserably.
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          await db.connectSSE({ force: type === "online" }).catch(logger.error);
        }
      });

      return true;
    });
  };

  refreshUser = async () => {
    return db.user.fetchUser().then(async (user) => {
      this.set((state) => (state.user = user));
    });
  };

  login = async (form, skipInit = false) => {
    this.set((state) => (state.isLoggingIn = true));
    const { email, password, code, method } = form;

    try {
      if (code) await db.user.mfaLogin(email, password, { code, method });
      else await db.user.login(email, password);

      if (skipInit) return true;
      return this.init();
    } finally {
      this.set((state) => (state.isLoggingIn = false));
    }
  };

  signup = (form) => {
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

/**
 * @type {[import("zustand").UseStore<UserStore>, UserStore]}
 */
const [useStore, store] = createStore(UserStore);
export { useStore, store };
