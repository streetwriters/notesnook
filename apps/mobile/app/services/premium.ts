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

import { SubscriptionPlan } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Platform } from "react-native";
import Config from "react-native-config";
import * as RNIap from "react-native-iap";
import { db } from "../common/database";
import { MMKV } from "../common/database/mmkv";
import { useUserStore } from "../stores/use-user-store";
import { itemSkus } from "../utils/constants";
import { presentSheet, ToastManager } from "./event-manager";
import SettingsService from "./settings";

let subs: RNIap.Subscription[] = [];
let products: RNIap.Product[] = [];

async function setPremiumStatus() {
  let userstore = useUserStore.getState();
  try {
    const user = await db.user.getUser();
    if (!user) {
      userstore.setPremium(get());
    } else {
      userstore.setPremium(get());
      userstore.setUser(user);
    }
  } catch (e) {}
  if (Config.GITHUB_RELEASE === "true") return;

  if (get()) {
    await subscriptions.clear();
  }
  try {
    await RNIap.initConnection();
    subs = await RNIap.getSubscriptions({
      skus: itemSkus
    });
  } catch (e) {}
}

async function loadProductsAndSubs() {
  try {
    if (Config.GITHUB_RELEASE === "true") throw new Error("Github release");
    if (!subs || subs.length === 0) {
      subs = await RNIap.getSubscriptions({
        skus: itemSkus
      });
      console.log("SUBS", subs);
    }

    if (!products || products.length === 0) {
      products = await RNIap.getProducts({
        skus: ["notesnook.pro.5year", "notesnook.believer.5year"]
      });
    }

    return {
      subs,
      products
    };
  } catch (e) {
    console.error("Failed to load products and subscriptions", e);
    return {
      subs: [],
      products: []
    };
  }
}

function get() {
  // if (__DEV__ || Config.isTesting === "true") return true;
  return (
    useUserStore.getState().user?.subscription?.plan !== undefined &&
    useUserStore.getState().user?.subscription?.plan !== SubscriptionPlan.FREE
  );
}

const showVerifyEmailDialog = () => {
  presentSheet({
    title: strings.confirmEmail(),
    paragraph: strings.emailConfirmationLinkSent(),
    action: async () => {
      try {
        let lastVerificationEmailTime =
          SettingsService.get().lastVerificationEmailTime;
        if (
          lastVerificationEmailTime &&
          Date.now() - lastVerificationEmailTime < 60000 * 2
        ) {
          ToastManager.show({
            heading: strings.waitBeforeResendEmail(),
            type: "error",
            context: "local"
          });

          return;
        }
        await db.user.sendVerificationEmail();
        SettingsService.set({
          lastVerificationEmailTime: Date.now()
        });

        ToastManager.show({
          heading: strings.verificationEmailSent(),
          message: strings.emailConfirmationLinkSent(),
          type: "success",
          context: "local"
        });
      } catch (e) {
        ToastManager.show({
          heading: strings.failedToSendVerificationEmail(),
          message: (e as Error).message,
          type: "error",
          context: "local"
        });
      }
    },
    actionText: strings.resendEmail()
  });
};

const subscriptions = {
  trialStatus: false,
  setTrialStatus: (status: boolean) => {
    subscriptions.trialStatus = status;
  },
  /**
   *
   * @returns {RNIap.Purchase} subscription
   */
  get: () => {
    if (Platform.OS === "android") return;
    let _subscriptions = MMKV.getString("subscriptionsIOS");
    if (!_subscriptions) return [];
    return JSON.parse(_subscriptions) as (
      | RNIap.SubscriptionPurchase
      | RNIap.ProductPurchase
    )[];
  },
  /**
   *
   * @param {RNIap.Purchase} subscription
   * @returns
   */
  set: async (
    subscription: RNIap.SubscriptionPurchase | RNIap.ProductPurchase
  ) => {
    if (Platform.OS === "android") return;
    const _subscriptions = subscriptions.get();
    if (!_subscriptions) return;

    let index = _subscriptions.findIndex(
      (s) => s.transactionId === subscription.transactionId
    );
    if (index === -1) {
      _subscriptions.unshift(subscription);
    } else {
      _subscriptions[index] = subscription;
    }
    MMKV.setString("subscriptionsIOS", JSON.stringify(_subscriptions));
  },
  remove: async (transactionId: string) => {
    if (Platform.OS === "android") return;
    const _subscriptions = subscriptions.get();
    if (!_subscriptions) return;

    let index = _subscriptions.findIndex(
      (s) => s.transactionId === transactionId
    );
    if (index !== -1) {
      _subscriptions.splice(index);
      MMKV.setString("subscriptionsIOS", JSON.stringify(_subscriptions));
    }
  },
  /**
   *
   * @param {RNIap.Purchase} subscription
   */
  verify: async (
    subscription: RNIap.SubscriptionPurchase | RNIap.ProductPurchase
  ) => {
    if (Platform.OS === "android") return;

    if (subscription.transactionReceipt) {
      if (Platform.OS === "ios") {
        let user = await db.user.getUser();
        if (!user) return;
        let requestData = {
          method: "POST",
          body: JSON.stringify({
            receipt_data: subscription.transactionReceipt,
            trial_status: subscriptions.trialStatus,
            user_id: user.id
          }),
          headers: {
            "Content-Type": "application/json"
          }
        };

        try {
          let result = await fetch(
            __DEV__
              ? "https://payments.streetwriters.co/apple/verify"
              : "https://payments.streetwriters.co/apple/verify",
            requestData
          );

          let text = await result.text();

          if (!result.ok) {
            if (text === "Receipt already expired.") {
              await subscriptions.clear(subscription);
            }
            return;
          } else {
            await subscriptions.clear(subscription);
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
  },
  clear: async (
    _subscription?: RNIap.SubscriptionPurchase | RNIap.ProductPurchase
  ) => {
    if (Platform.OS === "android") return;
    let _subscriptions = subscriptions.get();
    if (!_subscriptions) return;
    let subscription = null;
    if (_subscription) {
      subscription = _subscription;
    } else {
      subscription = _subscriptions.length > 0 ? _subscriptions[0] : null;
    }

    if (subscription) {
      await RNIap.finishTransaction({
        purchase: subscription
      });
      await RNIap.clearTransactionIOS();
      await subscriptions.remove(subscription.transactionId as string);
    }
  }
};

const PremiumService = {
  setPremiumStatus,
  get,
  showVerifyEmailDialog,
  loadProductsAndSubs: loadProductsAndSubs,
  subscriptions
};

export default PremiumService;
