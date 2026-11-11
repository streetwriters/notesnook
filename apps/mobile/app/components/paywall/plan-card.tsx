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
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import {
  ActivityIndicator,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import * as RNIap from "react-native-iap";
//@ts-ignore
import { Radius, Spacing } from "../../common/design/spacing";
import usePricingPlans, {
  PlanOverView,
  PricingPlan
} from "../../hooks/use-pricing-plans";
import PremiumService from "../../services/premium";
import { getElevationStyle } from "../../utils/elevation";
import { AppFontSize, defaultBorderRadius } from "../../utils/size";
import AppIcon from "../ui/AppIcon";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { Steps } from "./common";

export const PricingPlanCard = ({
  plan,
  pricingPlans,
  annualBilling,
  setStep
}: {
  plan: PricingPlan;
  pricingPlans?: ReturnType<typeof usePricingPlans>;
  annualBilling?: boolean;
  setStep: (step: number) => void;
}) => {
  const { colors } = useThemeColors();
  const regionalDiscount =
    plan.id === "pro" && annualBilling
      ? pricingPlans?.regionalDiscount
      : undefined;
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const product =
    plan.subscriptions?.[
      regionalDiscount?.sku ||
        `notesnook.${plan.id}.${annualBilling ? "yearly" : "monthly"}`
    ];

  const WebPlan = pricingPlans?.getWebPlan(
    plan.id,
    annualBilling ? "yearly" : "monthly"
  );

  const price = pricingPlans?.getPrice(
    pricingPlans.isGithubRelease && WebPlan
      ? WebPlan
      : (product as RNIap.Subscription),
    pricingPlans.hasTrialOffer(plan.id, product?.productId) ? 1 : 0,
    annualBilling
  );

  const isSubscribed =
    product?.productId &&
    pricingPlans?.user?.subscription?.productId?.includes(plan.id) &&
    pricingPlans.isSubscribed();

  const isNotReady =
    pricingPlans?.loadingPlans || (!price && !WebPlan?.price?.gross);

  return (
    <View
      style={{
        ...getElevationStyle(3),
        backgroundColor: colors.secondary.background,
        borderWidth: 1,
        borderColor: colors.primary.border,
        borderRadius: Radius.LG,
        padding: 16,
        flexShrink: isTablet ? 1 : undefined,
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 6
      }}
    >
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
            marginBottom: Spacing.LEVEL_1
          }}
        >
          <Heading size={AppFontSize.xl}>{plan.name} </Heading>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.LEVEL_1
            }}
          >
            {isSubscribed ? (
              <View
                style={{
                  backgroundColor: colors.primary.accent,
                  borderRadius: defaultBorderRadius,
                  padding: Spacing.LEVEL_0,
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "flex-start",
                  marginBottom: Spacing.LEVEL_1
                }}
              >
                <Heading color={colors.static.white} size={AppFontSize.xxs}>
                  {strings.currentPlan()}
                </Heading>
              </View>
            ) : (
              <>
                {regionalDiscount?.discount || WebPlan?.discount ? (
                  <View
                    style={{
                      backgroundColor: colors.static.red,
                      borderRadius: 100,
                      padding: Spacing.LEVEL_0,
                      paddingHorizontal: Spacing.LEVEL_1,
                      justifyContent: "center",
                      alignSelf: "flex-start"
                    }}
                  >
                    <Heading color={colors.static.white} size={AppFontSize.xxs}>
                      {strings.percentOff(
                        `${regionalDiscount?.discount || WebPlan?.discount?.amount}`
                      )}
                    </Heading>
                  </View>
                ) : null}

                {plan.recommended ? (
                  <View
                    style={{
                      backgroundColor: colors.static.red,
                      borderRadius: 100,
                      padding: Spacing.LEVEL_0,
                      paddingHorizontal: Spacing.LEVEL_1
                    }}
                  >
                    <Text
                      style={{
                        color: colors.static.white,
                        fontSize: AppFontSize.xxs
                      }}
                    >
                      {strings.recommended()}
                    </Text>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>

        <Paragraph>{plan.description}</Paragraph>

        <View
          style={{
            marginTop: Spacing.LEVEL_3
          }}
        >
          {pricingPlans?.loadingPlans || (!price && !WebPlan?.price?.gross) ? (
            <ActivityIndicator size="small" color={colors.primary.accent} />
          ) : (
            <View>
              <Heading size={24}>
                {price ||
                  `${WebPlan?.price?.currency} ${WebPlan?.price?.gross}`}{" "}
                <Paragraph color={colors.secondary.heading} fontSize="SM">
                  /{strings.month()}
                </Paragraph>
              </Heading>

              {!product && !WebPlan ? null : (
                <Paragraph
                  color={colors.primary.paragraph}
                  size={AppFontSize.xs}
                >
                  {annualBilling
                    ? strings.billedAnnually(
                        pricingPlans?.getStandardPrice(
                          (product || WebPlan) as any
                        ) as string
                      )
                    : strings.billedMonthly(
                        pricingPlans?.getStandardPrice(
                          (product || WebPlan) as any
                        ) as string
                      )}
                </Paragraph>
              )}
            </View>
          )}
        </View>

        <View
          style={{
            marginVertical: Spacing.LEVEL_4,
            gap: Spacing.LEVEL_2
          }}
        >
          {Object.keys(PlanOverView[plan.id as keyof typeof PlanOverView]).map(
            (item) => (
              <View
                key={item + plan.id}
                style={{
                  flexDirection: "row",
                  width: "100%",
                  justifyContent: "space-between",
                  borderBottomColor: colors.primary.border,
                  borderBottomWidth: 1,
                  paddingBottom: Spacing.LEVEL_2
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: Spacing.LEVEL_1
                  }}
                >
                  <AppIcon
                    name={
                      item === "storage"
                        ? "cloud"
                        : item === "fileSize"
                          ? "file"
                          : "image-outline"
                    }
                    iconFamily="notesnook"
                    size={AppFontSize.lg}
                  />
                  <Paragraph size={AppFontSize.sm}>
                    {strings[item as "storage" | "hdImages" | "fileSize"]()}
                  </Paragraph>
                </View>

                <Heading size={AppFontSize.sm}>
                  {
                    PlanOverView[plan.id as keyof typeof PlanOverView][
                      item as "storage" | "hdImages" | "fileSize"
                    ]
                  }
                </Heading>
              </View>
            )
          )}
        </View>

        <Button
          title={strings.selectPlan()}
          type={plan.id === "pro" ? "accent" : "tertiary"}
          style={{
            width: "100%"
          }}
          onPress={() => {
            if (isNotReady) return;
            const currentPlanSubscribed =
              PremiumService.get() &&
              (pricingPlans?.user?.subscription?.productId ===
                (product as RNIap.Subscription)?.productId ||
                pricingPlans?.user?.subscription?.productId?.startsWith(
                  (product as RNIap.Subscription)?.productId
                ));
            pricingPlans?.selectPlan(
              plan.id,
              currentPlanSubscribed
                ? `notesnook.${plan.id}.${
                    !(product as RNIap.Subscription)?.productId.includes(
                      "yearly"
                    )
                      ? "yearly"
                      : "monthly"
                  }`
                : pricingPlans.isGithubRelease
                  ? (WebPlan?.period as string)
                  : (product?.productId as string)
            );
            setStep(Steps.buy);
          }}
        />
      </View>
    </View>
  );
};
