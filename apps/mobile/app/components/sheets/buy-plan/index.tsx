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
import { Plan } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import dayjs from "dayjs";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import Config from "react-native-config";
import * as RNIap from "react-native-iap";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { WebView } from "react-native-webview";
import { db } from "../../../common/database";
import useGlobalSafeAreaInsets from "../../../hooks/use-global-safe-area-insets";
import usePricingPlans from "../../../hooks/use-pricing-plans";
import { openLinkInBrowser } from "../../../utils/functions";
import { AppFontSize, defaultBorderRadius } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { Button } from "../../ui/button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
const isGithubRelease = Config.GITHUB_RELEASE === "true";
export const BuyPlan = (props: {
  planId: string;
  productId: string;
  canActivateTrial?: boolean;
  goBack: () => void;
  goNext: () => void;
}) => {
  const { colors } = useThemeColors();
  const insets = useGlobalSafeAreaInsets();
  const [checkoutUrl, setCheckoutUrl] = useState<string>();
  const pricingPlans = usePricingPlans({
    planId: props.planId,
    productId: props.productId,
    onBuy: () => {
      props.goNext();
    }
  });

  const billingDuration = pricingPlans.getBillingDuration(
    pricingPlans.selectedProduct as RNIap.Subscription,
    0,
    0,
    true
  );
  const is5YearPlanSelected = (
    isGithubRelease
      ? (pricingPlans.selectedProduct as Plan)?.period
      : (pricingPlans.selectedProduct as RNIap.Product)?.productId
  )?.includes("5");

  return checkoutUrl ? (
    <View
      style={{
        flex: 1
      }}
    >
      <WebView
        source={{
          html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Basic HTML Page with Button</title>
  </head>
  <body>
    <h1>Welcome to My Page</h1>
    <p>This is a simple example of an HTML page with a button.</p>

    <button
      type="button"
      onclick="window.ReactNativeWebView.postMessage(JSON.stringify({
                success:true
             }));"
    >
      Click Me!
    </button>
  </body>
</html>
`
        }}
        onMessage={(message) => {
          const data = JSON.parse(message.nativeEvent.data);
          if (data.success) {
            props.goNext();
          }
          return;
        }}
        domStorageEnabled
        javaScriptEnabled
        style={{
          flex: 1
        }}
      />
    </View>
  ) : (
    <ScrollView
      contentContainerStyle={{
        marginTop: DefaultAppStyles.GAP_VERTICAL
      }}
      keyboardDismissMode="none"
      keyboardShouldPersistTaps="always"
    >
      <View
        style={{
          paddingHorizontal: DefaultAppStyles.GAP,
          gap: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        {[
          Config.GITHUB_RELEASE === "true"
            ? "yearly"
            : `notesnook.${props.planId}.yearly`,
          Config.GITHUB_RELEASE === "true"
            ? "monthly"
            : `notesnook.${props.planId}.monthly`,
          ...(props.planId === "essential"
            ? []
            : [
                Config.GITHUB_RELEASE === "true"
                  ? "5-year"
                  : `notesnook.${props.planId}.5year`
              ])
        ].map((item) => (
          <ProductItem
            key={item}
            pricingPlans={pricingPlans}
            productId={item}
          />
        ))}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: colors.primary.border,
            padding: DefaultAppStyles.GAP,
            borderRadius: defaultBorderRadius
          }}
        >
          <Heading color={colors.primary.paragraph} size={AppFontSize.sm}>
            {strings.dueToday()}{" "}
            {pricingPlans.userCanRequestTrial ? (
              <Text
                style={{
                  color: colors.primary.accent
                }}
              >
                ({strings.daysFree(`${billingDuration?.duration || 0}`)})
              </Text>
            ) : null}
          </Heading>

          <Paragraph color={colors.primary.paragraph}>
            {pricingPlans.userCanRequestTrial
              ? "FREE"
              : pricingPlans.getStandardPrice(
                  pricingPlans.selectedProduct as RNIap.Subscription
                )}
          </Paragraph>
        </View>

        {pricingPlans.userCanRequestTrial ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              borderWidth: 1,
              borderColor: colors.primary.border,
              padding: DefaultAppStyles.GAP,
              borderRadius: defaultBorderRadius
            }}
          >
            <Paragraph color={colors.secondary.paragraph}>
              {strings.due(
                dayjs()
                  .add(billingDuration?.duration || 0, "day")
                  .format("DD MMMM")
              )}
            </Paragraph>
            <Paragraph color={colors.secondary.paragraph}>
              {pricingPlans.getStandardPrice(
                pricingPlans.selectedProduct as RNIap.Subscription
              )}
            </Paragraph>
          </View>
        ) : null}

        {props.canActivateTrial ? (
          <View
            style={{
              gap: DefaultAppStyles.GAP_VERTICAL,
              borderWidth: 1,
              borderColor: colors.primary.border,
              padding: DefaultAppStyles.GAP,
              borderRadius: defaultBorderRadius
            }}
          >
            {(is5YearPlanSelected
              ? strings["5yearPlanConditions"]()
              : [
                  strings.trialPlanConditions[0](
                    billingDuration?.duration as number
                  ),
                  strings.trialPlanConditions[1](0)
                ]
            ).map((item) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10
                }}
                key={item}
              >
                <Icon
                  color={colors.primary.accent}
                  size={AppFontSize.lg}
                  name="check"
                />
                <Paragraph>{item}</Paragraph>
              </View>
            ))}
          </View>
        ) : null}

        <Button
          width="100%"
          type="accent"
          loading={pricingPlans.loading}
          title={
            is5YearPlanSelected
              ? strings.purchase()
              : pricingPlans?.userCanRequestTrial
              ? strings.subscribeAndStartTrial()
              : strings.subscribe()
          }
          onPress={async () => {
            if (isGithubRelease) {
              setCheckoutUrl(
                await db.subscriptions.checkoutUrl(
                  (pricingPlans.selectedProduct as Plan).plan,
                  (pricingPlans.selectedProduct as Plan).period
                )
              );
              return;
            }

            const offerToken = pricingPlans.getOfferTokenAndroid(
              pricingPlans.selectedProduct as RNIap.SubscriptionAndroid,
              0
            );
            pricingPlans.subscribe(
              pricingPlans.selectedProduct as RNIap.Subscription,
              offerToken
            );
          }}
        />

        <Heading
          style={{
            textAlign: "center"
          }}
          color={colors.secondary.paragraph}
          size={AppFontSize.xs}
        >
          {is5YearPlanSelected
            ? strings.oneTimePurchase()
            : strings.cancelAnytimeAlt()}
        </Heading>
        <Heading
          style={{
            textAlign: "center"
          }}
          color={colors.secondary.paragraph}
          size={AppFontSize.xs}
        >
          {strings.subTerms[0]()}{" "}
          <Text
            style={{
              textDecorationLine: "underline"
            }}
            onPress={() => {
              openLinkInBrowser("https://notesnook.com/privacy");
            }}
          >
            {strings.subTerms[1]()}
          </Text>{" "}
          {strings.subTerms[2]()}{" "}
          <Text
            style={{
              textDecorationLine: "underline"
            }}
            onPress={() => {
              openLinkInBrowser("https://notesnook.com/tos");
            }}
          >
            {strings.subTerms[3]()}
          </Text>
        </Heading>
      </View>
    </ScrollView>
  );
};

const ProductItem = (props: {
  pricingPlans: ReturnType<typeof usePricingPlans>;
  productId: string;
}) => {
  const { colors } = useThemeColors();
  const product =
    props.pricingPlans?.currentPlan?.subscriptions?.[props.productId] ||
    props.pricingPlans?.currentPlan?.products?.[props.productId] ||
    props.pricingPlans?.getWebPlan(
      props.pricingPlans?.currentPlan?.id as string,
      props.productId as "monthly" | "yearly"
    );

  const isAnnual = isGithubRelease
    ? (product as Plan)?.period === "yearly"
    : (product as RNIap.Subscription)?.productId.includes("yearly");

  const isSelected = isGithubRelease
    ? (product as Plan)?.period ===
      (props.pricingPlans.selectedProduct as Plan)?.period
    : (product as RNIap.Subscription)?.productId ===
      (props.pricingPlans.selectedProduct as RNIap.Subscription)?.productId;

  const is5YearProduct = (
    isGithubRelease
      ? (product as Plan)?.period
      : (product as RNIap.Product)?.productId
  )?.includes("5");

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        gap: 10
      }}
      activeOpacity={0.9}
      onPress={() => {
        if (!product) return;
        props.pricingPlans.selectProduct(
          isGithubRelease
            ? (product as Plan)?.period
            : (product as RNIap.Subscription)?.productId
        );
      }}
    >
      <Icon
        name={isSelected ? "radiobox-marked" : "radiobox-blank"}
        color={isSelected ? colors.primary.accent : colors.secondary.icon}
        size={AppFontSize.lg}
      />
      <View>
        <View
          style={{
            flexDirection: "row",
            gap: DefaultAppStyles.GAP_VERTICAL_SMALL
          }}
        >
          <Heading size={AppFontSize.md}>
            {isAnnual
              ? "Yearly"
              : is5YearProduct
              ? "5 year plan (One time purchase)"
              : "Monthly"}
          </Heading>

          {(isAnnual && !isGithubRelease) ||
          (isGithubRelease && (product as Plan)?.discount?.amount) ? (
            <View
              style={{
                backgroundColor: colors.static.red,
                borderRadius: 100,
                paddingHorizontal: 6,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Heading color={colors.static.white} size={AppFontSize.xs}>
                {strings.bestValue()} -{" "}
                {strings.percentOff(
                  (isGithubRelease
                    ? (product as Plan).discount?.amount
                    : props.pricingPlans.compareProductPrice(
                        props.pricingPlans.currentPlan?.id as string,
                        `notesnook.${props.pricingPlans.currentPlan?.id}.yearly`,
                        `notesnook.${props.pricingPlans.currentPlan?.id}.monthly`
                      )) as string
                )}
              </Heading>
            </View>
          ) : null}
        </View>

        <Paragraph size={AppFontSize.md}>
          {isAnnual || is5YearProduct
            ? `${props.pricingPlans.getPrice(
                product as RNIap.Subscription,
                props.pricingPlans.hasTrialOffer(
                  undefined,
                  (product as RNIap.Subscription)?.productId
                )
                  ? 1
                  : 0,
                isAnnual
              )}/${strings.month}`
            : null}

          {!isAnnual && !is5YearProduct
            ? `${props.pricingPlans.getStandardPrice(
                product as RNIap.Subscription
              )}/${strings.month()}`
            : null}
        </Paragraph>
      </View>
    </TouchableOpacity>
  );
};
