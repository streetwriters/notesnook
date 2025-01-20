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

import { CHECK_IDS } from "@notesnook/core";
import React from "react";
import { Platform } from "react-native";
import Config from "react-native-config";
import * as RNIap from "react-native-iap";
import { db } from "../common/database";
import { MMKV } from "../common/database/mmkv";
import DialogHeader from "../components/dialog/dialog-header";
import { CompactFeatures } from "../components/premium/compact-features";
import { PricingPlans } from "../components/premium/pricing-plans";
import Seperator from "../components/ui/seperator";
import { useUserStore } from "../stores/use-user-store";
import { itemSkus, SUBSCRIPTION_STATUS } from "../utils/constants";
import {
  eOpenPremiumDialog,
  eOpenTrialEndingDialog,
  eShowGetPremium
} from "../utils/events";
import { eSendEvent, presentSheet, ToastManager } from "./event-manager";

import SettingsService from "./settings";
import { strings } from "@notesnook/intl";
let premiumStatus = 0;

/**
 * @type {RNIap.Subscription[]}
 */
let products = [];
let user = null;

function getUser() {
  return user;
}

async function setPremiumStatus() {
  let userstore = useUserStore.getState();
  try {
    user = await db.user.getUser();
    if (!user) {
      premiumStatus = 0;
      userstore.setPremium(get());
    } else {
      premiumStatus = user.subscription?.type || 0;
      userstore.setPremium(get());
      userstore.setUser(user);
    }
  } catch (e) {
    premiumStatus = 0;
  }
  if (Config.GITHUB_RELEASE === "true") return;

  if (get()) {
    await subscriptions.clear();
  }
  try {
    await RNIap.initConnection();
    products = await RNIap.getSubscriptions({
      skus: itemSkus
    });
  } catch (e) {}
  if (premiumStatus === 0 && !__DEV__) {
    SettingsService.reset();
  }
}

function getMontlySub() {
  let _product = products.find(
    (p) => p.productId === "com.streetwriters.notesnook.sub.mo"
  );
  if (!_product) {
    _product = {
      localizedPrice: "$4.49"
    };
  }

  return _product;
}

async function getProducts() {
  if (!products || products.length === 0) {
    products = await RNIap.getSubscriptions(itemSkus);
  }
  return products;
}

function get() {
  if (__DEV__ || Config.isTesting === "true") return true;

  return SUBSCRIPTION_STATUS.BASIC !== premiumStatus;
}

async function verify(callback, error) {
  try {
    if (!get()) {
      if (error) {
        error();
        return;
      }
      eSendEvent(eOpenPremiumDialog);
      return;
    }
    if (!callback) console.warn("You must provide a callback function");
    await callback();
  } catch (e) {
    console.error(e);
  }
}

const onUserStatusCheck = async (type) => {
  let user = await db.user.getUser();
  let userstore = useUserStore.getState();
  premiumStatus = user?.subscription?.type || 0;
  if (userstore?.premium !== get()) {
    userstore.setPremium(get());
  }

  let status = get();
  let message = null;
  if (!status) {
    switch (type) {
      case CHECK_IDS.noteColor:
        message = {
          context: "sheet",
          title: strings.getNotesnookPro(),
          desc: strings.colorsProMessage()
        };
        break;
      case CHECK_IDS.noteExport:
        message = {
          context: "export",
          title: strings.getNotesnookPro(),
          desc: strings.exportProMessage()
        };
        break;
      case CHECK_IDS.noteTag:
        message = {
          context: "sheet",
          title: strings.getNotesnookPro(),
          desc: strings.tagsProMessage()
        };
        break;
      case CHECK_IDS.notebookAdd:
        message = {
          context: "sheet",
          title: strings.getNotesnookPro(),
          desc: strings.notebookProMessage()
        };
        break;
      case CHECK_IDS.vaultAdd:
        message = {
          context: "sheet",
          title: strings.getNotesnookPro(),
          desc: strings.vaultProMessage()
        };
        break;
    }

    if (message) {
      eSendEvent(eShowGetPremium, message);
    }
  }
  return { type, result: status };
};

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
          message: e.message,
          type: "error",
          context: "local"
        });
      }
    },
    actionText: strings.resendEmail()
  });
};

const subscriptions = {
  /**
   *
   * @returns {RNIap.Purchase} subscription
   */
  get: () => {
    if (Platform.OS === "android") return;
    let _subscriptions = MMKV.getString("subscriptionsIOS");
    if (!_subscriptions) return [];
    return JSON.parse(_subscriptions);
  },
  /**
   *
   * @param {RNIap.Purchase} subscription
   * @returns
   */
  set: async (subscription) => {
    if (Platform.OS === "android") return;
    let _subscriptions = MMKV.getString("subscriptionsIOS");
    if (_subscriptions) {
      _subscriptions = JSON.parse(_subscriptions);
    } else {
      _subscriptions = [];
    }
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
  remove: async (transactionId) => {
    if (Platform.OS === "android") return;
    let _subscriptions = MMKV.getString("subscriptionsIOS");
    if (_subscriptions) {
      _subscriptions = JSON.parse(_subscriptions);
    } else {
      _subscriptions = [];
    }
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
  verify: async (subscription) => {
    if (Platform.OS === "android") return;

    if (subscription.transactionReceipt) {
      if (Platform.OS === "ios") {
        let user = await db.user.getUser();
        if (!user) return;
        let requestData = {
          method: "POST",
          body: JSON.stringify({
            receipt_data: subscription.transactionReceipt,
            user_id: user.id
          }),
          headers: {
            "Content-Type": "application/json"
          }
        };

        try {
          let result = await fetch(
            __DEV__
              ? "http://192.168.43.5:4264/apple/verify"
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
        } catch (e) {}
      }
    }
  },
  clear: async (_subscription) => {
    if (Platform.OS === "android") return;
    let _subscriptions = subscriptions.get();
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
      await subscriptions.remove(subscription.transactionId);
    }
  }
};

async function getRemainingTrialDaysStatus() {
  let user = await db.user.getUser();
  if (!user || !user.subscription || user.subscription?.expiry === 0) return;

  let premium = user.subscription.type !== SUBSCRIPTION_STATUS.BASIC;
  let isTrial = user.subscription.type === SUBSCRIPTION_STATUS.TRIAL;
  let total = user.subscription.expiry - user.subscription.start;
  let current = Date.now() - user.subscription.start;
  current = (current / total) * 100;

  let lastTrialDialogShownAt = MMKV.getString("lastTrialDialogShownAt");

  if (current > 75 && isTrial && lastTrialDialogShownAt !== "ending") {
    eSendEvent(eOpenTrialEndingDialog, {
      title: strings.trialEndingSoon(),
      offer: null,
      extend: false
    });
    MMKV.setItem("lastTrialDialogShownAt", "ending");
    return true;
  }

  if (!premium && lastTrialDialogShownAt !== "expired") {
    eSendEvent(eOpenTrialEndingDialog, {
      title: strings.trialExpired(),
      offer: 30,
      extend: false
    });
    MMKV.setItem("lastTrialDialogShownAt", "expired");
    return true;
  }
  return false;
}

const features_list = [
  {
    content: "Unlock unlimited notebooks, tags, colors. Organize like a pro"
  },
  {
    content: "Attach files upto 500MB, upload 4K images with unlimited storage"
  },
  {
    content: "Instantly sync to unlimited devices"
  },
  {
    content: "A private vault to keep everything important always locked"
  },
  {
    content:
      "Rich note editing experience with markdown, tables, checklists and more"
  },
  {
    content: "Export your notes in PDF, markdown and html formats"
  }
];

const sheet = (context, promo, trial) => {
  presentSheet({
    context: context,
    component: (ref) => (
      <>
        <DialogHeader
          centered
          title="Upgrade to Notesnook"
          titlePart="Pro"
          paragraph="Manage your work on another level, enjoy seamless sync and keep all notes in one place."
          padding={12}
        />
        <Seperator />
        <CompactFeatures
          scrollRef={ref}
          maxHeight={400}
          features={features_list}
          vertical
        />
        <Seperator half />
        <PricingPlans trial={trial} compact heading={false} promo={promo} />
      </>
    )
  });
};

const PremiumService = {
  verify,
  setPremiumStatus,
  get,
  onUserStatusCheck,
  showVerifyEmailDialog,
  getProducts,
  getUser,
  subscriptions,
  getMontlySub,
  getRemainingTrialDaysStatus,
  sheet
};

export default PremiumService;
