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
import { FeatureId, FeatureResult } from "@notesnook/common";
import { SubscriptionPlan, SubscriptionProvider } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import Config from "react-native-config";
import usePricingPlans, {
  PlanOverView
} from "../../../hooks/use-pricing-plans";
import {
  eSendEvent,
  presentSheet,
  ToastManager
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import PremiumService from "../../../services/premium";
import SettingsService from "../../../services/settings";
import { useUserStore } from "../../../stores/use-user-store";
import { eCloseSheet } from "../../../utils/events";
import { FontSizes } from "../../../common/design/font";
import { Radius, Spacing } from "../../../common/design/spacing";
import { AuthMode } from "../../auth/common";
import AppIcon from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
const isGithubRelease = Config.GITHUB_RELEASE === "true";
const INDEX_TO_PLAN = {
  1: "essential",
  2: "pro",
  3: "believer"
};

export default function PaywallSheet<Tid extends FeatureId>(props: {
  feature: FeatureResult<Tid>;
}) {
  const { colors } = useThemeColors();
  const pricingPlans = usePricingPlans();
  useEffect(() => {
    ToastManager.hide();
    if (!props.feature.availableOn) return;
    const plan = pricingPlans.pricingPlans.find(
      //@ts-ignore
      (p) => p.id === INDEX_TO_PLAN[props.feature.availableOn]
    );
    if (!plan) return;
    pricingPlans.selectPlan(plan?.id);
    const product = isGithubRelease
      ? "yearly"
      : plan?.subscriptionSkuList?.find((sku) => sku.includes("year"));
    if (product) {
      pricingPlans.selectProduct(product);
    }
  }, []);

  const isSubscribedOnWeb =
    PremiumService.get() &&
    (pricingPlans.user?.subscription?.provider ===
      SubscriptionProvider.PADDLE ||
      pricingPlans.user?.subscription?.provider ===
        SubscriptionProvider.STREETWRITERS);

  const isCurrentPlatform =
    (pricingPlans.user?.subscription?.provider === SubscriptionProvider.APPLE &&
      Platform.OS === "ios") ||
    (pricingPlans.user?.subscription?.provider ===
      SubscriptionProvider.GOOGLE &&
      Platform.OS === "android");

  if (!pricingPlans.currentPlan) return null;

  const features = [
    {
      title: `${
        PlanOverView[pricingPlans.currentPlan.id as keyof typeof PlanOverView]
          .storage
      } ${strings.cloudStorage()}`,
      description: strings.cloudStorageBenefit()
    },
    ...(pricingPlans.currentPlan.id !== "essential"
      ? [
          {
            title: strings.appLockSecurity(),
            description: strings.appLockSecurityBenefit()
          }
        ]
      : []),
    {
      title: strings.advancedNoteElements(),
      description: strings.advancedNoteElementsBenefit()
    }
  ];

  const onUpgrade = () => {
    if (PremiumService.get()) {
      if (
        pricingPlans.user?.subscription.plan === SubscriptionPlan.LEGACY_PRO ||
        !isCurrentPlatform
      ) {
        ToastManager.show({
          message: strings.cannotChangePlan(),
          context: "local"
        });
        return;
      }

      if (isSubscribedOnWeb) {
        ToastManager.show({
          message: strings.changePlanOnWeb(),
          context: "local"
        });
        return;
      }
    }

    eSendEvent(eCloseSheet);
    if (!useUserStore.getState().user) {
      Navigation.navigate("Auth", {
        mode: AuthMode.login
      });
      return;
    }
    Navigation.navigate("PayWall", {
      context: "logged-in",
      state: {
        planId: pricingPlans.currentPlan?.id,
        productId: isGithubRelease
          ? "yearly"
          : (pricingPlans.selectProduct as any).productId,
        billingType: "annual"
      }
    });
  };

  return (
    <View
      style={{
        width: "100%",
        paddingHorizontal: Spacing.LEVEL_3,
        paddingVertical: Spacing.LEVEL_4,
        gap: Spacing.LEVEL_3
      }}
    >
      <View style={{ gap: Spacing.LEVEL_3, width: "100%" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: Spacing.LEVEL_1,
            width: "100%"
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: Radius.XS,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.secondary.background
            }}
          >
            <AppIcon
              name="crown-simple"
              iconFamily="notesnook"
              size={16}
              color={colors.static.orange}
            />
          </View>
          <View style={{ flex: 1, gap: Spacing.LEVEL_1 }}>
            <Heading fontSize="XL" lineHeight="100%">
              {strings.tryItForFree()}
            </Heading>
            <Paragraph fontSize="SM" color={colors.primary.paragraph}>
              {strings.unlockPremiumFeatures()}
            </Paragraph>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.primary.border }} />

        <View style={{ gap: Spacing.LEVEL_2, width: "100%" }}>
          {features.map((feature) => (
            <View
              key={feature.title}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: Spacing.LEVEL_1,
                width: "100%"
              }}
            >
              <AppIcon
                name="check"
                iconFamily="notesnook"
                size={16}
                color={colors.primary.accent}
                style={{ marginTop: 1 }}
              />
              <View style={{ flex: 1, gap: Spacing.LEVEL_1 }}>
                <Heading fontFamily="MEDIUM" fontSize="SM" lineHeight="100%">
                  {feature.title}
                </Heading>
                <Paragraph fontSize="XS" color={colors.primary.paragraph}>
                  {feature.description}
                </Paragraph>
              </View>
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.LEVEL_0 + 2,
            padding: Spacing.LEVEL_1,
            borderRadius: Radius.XS,
            backgroundColor: colors.selected.background
          }}
        >
          <Paragraph fontSize="XS" color={colors.secondary.heading}>
            {strings.sevenDayFreeTrial()}
          </Paragraph>
          <View
            style={{
              width: 4,
              height: 4,
              borderRadius: Radius.MD,
              backgroundColor: colors.secondary.heading
            }}
          />
          <Paragraph fontSize="XS" color={colors.secondary.heading}>
            {strings.cancelAnytimeShort()}
          </Paragraph>
        </View>
      </View>

      <View
        style={{ flexDirection: "row", gap: Spacing.LEVEL_2, width: "100%" }}
      >
        {isSubscribedOnWeb ? null : (
          <Button
            type="plain-outline"
            title={strings.viewPlans()}
            fontSize={FontSizes.MD}
            style={{
              flex: 1,
              borderRadius: Radius.S,
              paddingVertical: Spacing.LEVEL_3
            }}
            onPress={() => {
              eSendEvent(eCloseSheet);
              Navigation.navigate("PayWall", {
                context: useUserStore.getState().user
                  ? "logged-in"
                  : "logged-out"
              });
            }}
          />
        )}
        <Button
          type="accent"
          title={strings.upgrade()}
          fontSize={FontSizes.MD}
          style={{
            flex: 1,
            borderRadius: Radius.S,
            paddingVertical: Spacing.LEVEL_3
          }}
          onPress={onUpgrade}
        />
      </View>
    </View>
  );
}

PaywallSheet.present = <Tid extends FeatureId>(feature: FeatureResult<Tid>) => {
  if (SettingsService.getProperty("serverUrls")) return;
  presentSheet({
    component: <PaywallSheet feature={feature} />
  });
};
