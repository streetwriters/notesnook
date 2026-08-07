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

import { formatBytes, getFormattedDate } from "@notesnook/common";
import {
  SubscriptionPlan,
  SubscriptionProvider,
  SubscriptionStatus
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import dayjs from "dayjs";
import React from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { Radius, Spacing } from "../../../common/design/spacing";
import { PlanLimits } from "../../../components/sheets/plan-limits";
import { Button } from "../../../components/ui/button";
import Heading from "../../../components/ui/typography/heading";
import Paragraph from "../../../components/ui/typography/paragraph";
import { presentSheet, ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import PremiumService from "../../../services/premium";
import SettingsService from "../../../services/settings";
import { useUserStore } from "../../../stores/use-user-store";
import { planToDisplayName } from "../../../utils/constants";
import { AppFontSize } from "../../../utils/size";
import { SectionItem } from "../section-item";

export const getTimeLeft = (t2) => {
  let daysRemaining = dayjs(t2).diff(dayjs(), "days");
  return {
    time: dayjs(t2).diff(dayjs(), daysRemaining === 0 ? "hours" : "days"),
    isHour: daysRemaining === 0
  };
};

const getBillingSubtitle = (user) => {
  if (!user?.subscription || user.subscription.plan === SubscriptionPlan.FREE) {
    return null;
  }

  const isAnnual = user.subscription.productId?.includes("yearly");
  const billingLabel =
    user?.subscription?.provider === SubscriptionProvider.STREETWRITERS
      ? "Awarded"
      : isAnnual
        ? "Billed annually"
        : user.subscription.productId?.includes("monthly")
          ? "Billed monthly"
          : null;

  if (!user.subscription.expiry) return billingLabel;

  const expiryLabel = getFormattedDate(user.subscription.expiry, "date");
  const renewalLabel =
    user.subscription.status === SubscriptionStatus.CANCELED ||
    user.subscription.status === SubscriptionStatus.PAUSED ||
    user.subscription.status === SubscriptionStatus.EXPIRED ||
    user?.subscription?.provider === SubscriptionProvider.STREETWRITERS
      ? "Ends"
      : "Renews";

  return [billingLabel, `${renewalLabel} ${expiryLabel}`]
    .filter(Boolean)
    .join(" • ");
};

const SettingsUserSection = ({ item }) => {
  const { colors } = useThemeColors();
  const [user] = useUserStore((state) => [state.user]);
  const used = user?.storageUsed || 0;
  const total = user?.totalStorage || 0;
  const storagePercent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const planName = planToDisplayName(user?.subscription?.plan);
  const billingSubtitle = getBillingSubtitle(user);
  const showUpgradeButton = !(
    ((user?.subscription?.provider === SubscriptionProvider.PADDLE ||
      user?.subscription?.provider === SubscriptionProvider.STREETWRITERS ||
      !(
        (user?.subscription?.provider === SubscriptionProvider.APPLE &&
          Platform.OS === "ios") ||
        (user?.subscription?.provider === SubscriptionProvider.GOOGLE &&
          Platform.OS === "android")
      )) &&
      PremiumService.get()) ||
    SettingsService.getProperty("serverUrls")
  );

  const storageText =
    total === -1
      ? `${formatBytes(used)}/Unlimited ${strings.used()}`
      : `${formatBytes(used)}/${formatBytes(total)} ${strings.used()}`;

  return (
    <>
      {user ? (
        <>
          <View
            style={{
              paddingHorizontal: Spacing.LEVEL_3,
              marginBottom: Spacing.LEVEL_2,
              marginTop: -Spacing.LEVEL_2
            }}
          >
            <View
              style={{
                backgroundColor: colors.secondary.background,
                borderRadius: Radius.S,
                padding: Spacing.LEVEL_2,
                gap: Spacing.LEVEL_3,
                width: "100%"
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: Spacing.LEVEL_2,
                  width: "100%"
                }}
              >
                <View
                  style={{
                    flexShrink: 1,
                    gap: Spacing.LEVEL_1
                  }}
                >
                  <Heading
                    fontSize="XL"
                    fontFamily="SEMI_BOLD"
                    lineHeight={null}
                    color={colors.primary.heading}
                  >
                    {planName}
                  </Heading>

                  {billingSubtitle ? (
                    <Paragraph fontSize="XS" color={colors.primary.paragraph}>
                      {billingSubtitle}
                    </Paragraph>
                  ) : null}
                </View>

                <Button
                  title={strings.upgrade().toUpperCase()}
                  type="accent"
                  disabled={!showUpgradeButton}
                  fontSize={AppFontSize.sm}
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: Spacing.LEVEL_2,
                    paddingVertical: Spacing.LEVEL_2,
                    borderRadius: Radius.XS
                  }}
                  textStyle={{
                    textTransform: "uppercase"
                  }}
                  onPress={() => {
                    if (
                      user?.subscription?.plan === SubscriptionPlan.LEGACY_PRO
                    ) {
                      ToastManager.show({
                        message: strings.cannotChangePlan(),
                        context: "local"
                      });
                      return;
                    }

                    if (
                      user.subscription?.plan !== SubscriptionPlan.FREE &&
                      user.subscription?.productId &&
                      user.subscription?.productId.includes("5year")
                    ) {
                      ToastManager.show({
                        message:
                          "You have made a one time purchase. To change your plan please contact support.",
                        type: "info"
                      });
                      return;
                    }

                    Navigation.navigate("PayWall", {
                      context: "logged-in",
                      canGoBack: true
                    });
                  }}
                />
              </View>

              <View
                style={{
                  gap: Spacing.LEVEL_1,
                  width: "100%"
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: Spacing.LEVEL_2,
                    width: "100%"
                  }}
                >
                  <Paragraph
                    fontSize="XS"
                    fontFamily="MEDIUM"
                    color={colors.secondary.paragraph}
                  >
                    {strings.storage()}
                  </Paragraph>
                  <Paragraph
                    fontSize="XS"
                    fontFamily="MEDIUM"
                    color={colors.secondary.paragraph}
                  >
                    {storageText}
                  </Paragraph>
                </View>

                <View
                  style={{
                    backgroundColor: colors.tertiary.background,
                    width: "100%",
                    height: 8,
                    borderRadius: Radius.XXL,
                    overflow: "hidden"
                  }}
                >
                  <View
                    style={{
                      backgroundColor: colors.primary.accent,
                      height: 8,
                      width: `${storagePercent}%`,
                      borderRadius: Radius.XXL
                    }}
                  />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    presentSheet({
                      component: <PlanLimits />
                    });
                  }}
                  style={{
                    alignSelf: "flex-start"
                  }}
                >
                  <Paragraph
                    fontSize="XS"
                    fontFamily="SEMI_BOLD"
                    color={colors.primary.accent}
                  >
                    {strings.viewAllLimits()}
                  </Paragraph>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <Heading
            style={{
              paddingHorizontal: Spacing.LEVEL_3,
              marginBottom: Spacing.LEVEL_2
            }}
            color={colors.primary.accent}
            size={AppFontSize.sm}
            fontFamily="MEDIUM"
          >
            {strings.account()}
          </Heading>

          {item.sections.map((item) => (
            <SectionItem key={item.name} item={item} />
          ))}

          <View
            style={{
              paddingHorizontal: Spacing.LEVEL_3,
              width: "100%"
            }}
          >
            <View
              style={{
                height: 1,
                width: "100%",
                backgroundColor: colors.primary.separator
              }}
            />
          </View>
        </>
      ) : null}
    </>
  );
};

export default SettingsUserSection;
