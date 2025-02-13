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

import { strings } from "@notesnook/intl";
import React from "react";
import { Linking, Platform, View } from "react-native";
import Config from "react-native-config";
import { Button } from "../../components/ui/button";
import { usePricing } from "../../hooks/use-pricing";
import {
  eSendEvent,
  presentSheet,
  ToastManager
} from "../../services/event-manager";
import PremiumService from "../../services/premium";
import { useUserStore } from "../../stores/use-user-store";
import { SUBSCRIPTION_STATUS } from "../../utils/constants";
import { eOpenPremiumDialog } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
export const Subscription = () => {
  const user = useUserStore((state) => state.user);
  const monthlyPlan = usePricing("monthly");
  const isNotPro =
    user?.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM &&
    user?.subscription?.type !== SUBSCRIPTION_STATUS.BETA;

  const hasCancelledPremium =
    SUBSCRIPTION_STATUS.PREMIUM_CANCELLED === user?.subscription?.type;

  const subscriptionProviderInfo =
    strings.subscriptionProviderInfo[user?.subscription?.provider];

  const manageSubscription = () => {
    if (!user?.isEmailConfirmed) {
      PremiumService.showVerifyEmailDialog();
      return;
    }

    if (Config.GITHUB_RELEASE === "true") {
      presentSheet({
        paragraph: strings.subNotSupported(),
        action: () => {
          Linking.openURL("https://app.notesnook.com");
        },
        actionText: strings.goToWebApp()
      });
      return;
    }

    if (hasCancelledPremium && Platform.OS === "android") {
      if (user.subscription?.provider === 3) {
        ToastManager.show({
          heading: strings.subOnWeb(),
          message: strings.openInBrowserToManageSub(),
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
      ? monthlyPlan?.product?.subscriptionOfferDetails[0]?.pricingPhases
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
          fontSize={AppFontSize.sm}
          type="accent"
          onPress={manageSubscription}
          title={
            !user?.isEmailConfirmed
              ? strings.confirmEmail()
              : user.subscription?.provider === 3 && hasCancelledPremium
              ? strings.manageSubDesktop()
              : hasCancelledPremium &&
                Platform.OS === "android" &&
                Config.GITHUB_RELEASE !== "true"
              ? strings.resubFromPlaystore()
              : user.subscription?.type ===
                  SUBSCRIPTION_STATUS.PREMIUM_EXPIRED || hasCancelledPremium
              ? `${strings.resubToPro()} (${getPrice() || "$4.49"} / mo)`
              : `${strings.getPro()} (${getPrice() || "$4.49"} / mo)`
          }
        />
      ) : null}

      {subscriptionProviderInfo &&
      user.subscription?.type !== SUBSCRIPTION_STATUS.PREMIUM_EXPIRED &&
      user.subscription?.type !== SUBSCRIPTION_STATUS.BASIC ? (
        <Button
          title={subscriptionProviderInfo?.title()}
          onPress={() => {
            presentSheet({
              title: subscriptionProviderInfo.title(),
              paragraph: subscriptionProviderInfo.desc()
            });
          }}
          style={{
            alignSelf: "flex-start",
            width: "100%",
            paddingHorizontal: 0
          }}
          fontSize={AppFontSize.xs}
          height={30}
          type="secondaryAccented"
        />
      ) : null}
    </View>
  );
};
