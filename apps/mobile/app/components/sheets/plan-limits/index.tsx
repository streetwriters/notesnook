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
import React, { useEffect, useState } from "react";
import {
  FeatureId,
  FeatureUsage,
  formatBytes,
  getFeature,
  getFeaturesUsage
} from "@notesnook/common";
import { SubscriptionPlan, SubscriptionProvider } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import { Platform, View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import { FontSizes } from "../../../common/design/font";
import { Spacing, Radius } from "../../../common/design/spacing";
import { eSendEvent, ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import PremiumService from "../../../services/premium";
import SettingsService from "../../../services/settings";
import { useUserStore } from "../../../stores/use-user-store";
import { eCloseSheet } from "../../../utils/events";
import AppIcon from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

const FEATURE_ICONS: Partial<Record<FeatureId, string>> = {
  storage: "cloud",
  colors: "palette",
  tags: "shopping-mode",
  notebooks: "book-open",
  activeReminders: "bell",
  shortcuts: "arrow-square-out"
};

export function PlanLimits() {
  const { colors } = useThemeColors();
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    getFeaturesUsage()
      .then((result) => {
        setFeatureUsage(result);
      })
      .catch((e) => console.log(e));
  }, []);

  const isCurrentPlatform =
    (user?.subscription?.provider === SubscriptionProvider.APPLE &&
      Platform.OS === "ios") ||
    (user?.subscription?.provider === SubscriptionProvider.GOOGLE &&
      Platform.OS === "android");

  return (
    <ScrollView
      style={{
        width: "100%",
        paddingHorizontal: Spacing.LEVEL_3,
        paddingVertical: Spacing.LEVEL_4
      }}
      contentContainerStyle={{
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
              name="chart-donut"
              iconFamily="notesnook"
              size={16}
              color={colors.primary.icon}
            />
          </View>
          <View style={{ flex: 1, gap: Spacing.LEVEL_1 }}>
            <Heading fontSize="XL" lineHeight="100%">
              {strings.planLimits()}
            </Heading>
            <Paragraph fontSize="SM" color={colors.primary.paragraph}>
              {strings.planLimitsDesc()}
            </Paragraph>
          </View>
        </View>

        <View
          style={{ height: 1, backgroundColor: colors.primary.separator }}
        />

        <View style={{ gap: Spacing.LEVEL_2, width: "100%" }}>
          {featureUsage?.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%"
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.LEVEL_1
                }}
              >
                <AppIcon
                  name={FEATURE_ICONS[item.id] || "checkbox"}
                  iconFamily="notesnook"
                  size={16}
                  color={colors.secondary.icon}
                />
                <Paragraph fontSize="SM" color={colors.primary.paragraph}>
                  {getFeature(item.id).title}
                </Paragraph>
              </View>
              <Paragraph
                fontFamily="MEDIUM"
                fontSize="XS"
                color={colors.secondary.heading}
              >
                {item.total === Infinity
                  ? strings.unlimited()
                  : item.id === "storage"
                    ? `${formatBytes(item.used)}/${formatBytes(
                        item.total
                      )} ${strings.used()}`
                    : `${item.used}/${item.total} ${strings.used()}`}
              </Paragraph>
            </View>
          ))}
        </View>
      </View>

      {((user?.subscription?.provider === SubscriptionProvider.PADDLE ||
        user?.subscription?.provider === SubscriptionProvider.STREETWRITERS ||
        !isCurrentPlatform) &&
        PremiumService.get()) ||
      SettingsService.getProperty("serverUrls") ? null : (
        <Button
          title={strings.changePlan()}
          onPress={() => {
            if (user?.subscription?.plan === SubscriptionPlan.LEGACY_PRO) {
              ToastManager.show({
                message: strings.cannotChangePlan(),
                context: "local"
              });
              return;
            }

            if (
              user?.subscription.plan !== SubscriptionPlan.FREE &&
              user?.subscription.productId?.includes("5year")
            ) {
              ToastManager.show({
                message:
                  "You have made a one time purchase. To change your plan please contact support.",
                type: "info",
                context: "local"
              });
              return;
            }
            Navigation.navigate("PayWall", {
              context: "logged-in",
              canGoBack: true
            });
            eSendEvent(eCloseSheet);
          }}
          type="accent"
          fontSize={FontSizes.MD}
          style={{
            width: "100%",
            borderRadius: Radius.S
          }}
        />
      )}
    </ScrollView>
  );
}
