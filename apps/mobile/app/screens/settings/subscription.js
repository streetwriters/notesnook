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

import React from "react";
import { Linking, Platform, View } from "react-native";
import { Button } from "../../components/ui/button";
import { usePricing } from "../../hooks/use-pricing";
import {
  eSendEvent,
  presentSheet,
  ToastEvent
} from "../../services/event-manager";
import PremiumService from "../../services/premium";
import { useUserStore } from "../../stores/use-user-store";
import {
  SUBSCRIPTION_PROVIDER,
  SUBSCRIPTION_STATUS
} from "../../utils/constants";
import { eOpenPremiumDialog } from "../../utils/events";
import { SIZE } from "../../utils/size";
import Config from "react-native-config";
export const Subscription = () => {
  const user = useUserStore((state) => state.user);
  const monthlyPlan = usePricing("monthly");
  const isNotPro =
    user?.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM &&
    user?.subscription?.type !== SUBSCRIPTION_STATUS.BETA;

  const hasCancelledPremium =
    SUBSCRIPTION_STATUS.PREMIUM_CANCELLED === user?.subscription?.type;

  const subscriptionProviderInfo =
    SUBSCRIPTION_PROVIDER[user?.subscription?.provider];

  const manageSubscription = () => {
    if (!user?.isEmailConfirmed) {
      PremiumService.showVerifyEmailDialog();
      return;
    }

    if (Config.GITHUB_RELEASE === "true") {
      presentSheet({
        paragraph:
          "This version of Notesnook app does not support in-app purchases. Kindly login on the Notesnook web app to make the purchase.",
        action: () => {
          Linking.openURL("https://app.notesnook.com");
        },
        actionText: "Go to web app"
      });
      return;
    }

    if (hasCancelledPremium && Platform.OS === "android") {
      if (user.subscription?.provider === 3) {
        ToastEvent.show({
          heading: "Subscribed on web",
          message: "Open your web browser to manage your subscription.",
          type: "success"
        });
        return;
      }
      Linking.openURL("https://play.google.com/store/account/subscriptions");

      /**
         *   
         * Platform.OS === 'ios'
            ? 'https://apps.apple.com/account/subscriptions'
            : 'https://play.google.com/store/account/subscriptions'
         */
    } else {
      eSendEvent(eOpenPremiumDialog);
    }
  };

  function getPrice() {
    return Platform.OS === "android"
      ? monthlyPlan?.product?.subscriptionOfferDetails[0].pricingPhases
          .pricingPhaseList?.[0]?.formattedPrice
      : monthlyPlan?.product?.localizedPrice;
  }

  return (
    <View>
      {isNotPro ? (
        <Button
          height={40}
          style={{
            borderRadius: 100,
            paddingHorizontal: 25,
            alignSelf: "flex-start"
          }}
          fontSize={SIZE.sm}
          type="accent"
          onPress={manageSubscription}
          title={
            !user?.isEmailConfirmed
              ? "Confirm your email"
              : user.subscription?.provider === 3 && hasCancelledPremium
              ? "Manage subscription from desktop app"
              : hasCancelledPremium &&
                Platform.OS === "android" &&
                Config.GITHUB_RELEASE !== "true"
              ? "Resubscribe from Google Playstore"
              : user.subscription?.type ===
                  SUBSCRIPTION_STATUS.PREMIUM_EXPIRED || hasCancelledPremium
              ? `Resubscribe to Pro (${getPrice() || "$4.49"} / mo)`
              : `Get Pro (${getPrice() || "$4.49"} / mo)`
          }
        />
      ) : null}

      {subscriptionProviderInfo &&
      user.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM_EXPIRED &&
      user.subscription?.type !== SUBSCRIPTION_STATUS.BASIC ? (
        <Button
          title={subscriptionProviderInfo?.title}
          onPress={() => {
            presentSheet({
              title: subscriptionProviderInfo.title,
              paragraph: subscriptionProviderInfo.desc
            });
          }}
          style={{
            alignSelf: "flex-start",
            borderRadius: 100
          }}
          fontSize={SIZE.sm}
          height={30}
          type="grayAccent"
        />
      ) : null}
    </View>
  );
};
