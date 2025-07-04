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
import { useThemeColors } from "@notesnook/theme";
import dayjs from "dayjs";
import React from "react";
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import * as RNIap from "react-native-iap";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import useGlobalSafeAreaInsets from "../../../hooks/use-global-safe-area-insets";
import usePricingPlans from "../../../hooks/use-pricing-plans";
import { openLinkInBrowser } from "../../../utils/functions";
import { AppFontSize } from "../../../utils/size";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { DefaultAppStyles } from "../../../utils/styles";

export const BuyPlan = (props: {
  planId: string;
  productId: string;
  canActivateTrial?: boolean;
  goBack: () => void;
  goNext: () => void;
}) => {
  const { colors } = useThemeColors();
  const insets = useGlobalSafeAreaInsets();
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
  const is5YearPlanSelected =
    pricingPlans.selectedProduct?.productId.includes("5year");

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: 80,
        marginTop: DefaultAppStyles.GAP
      }}
      keyboardDismissMode="none"
      keyboardShouldPersistTaps="always"
      stickyHeaderIndices={[0]}
    >
      <View
        style={{
          paddingHorizontal: DefaultAppStyles.GAP
        }}
      >
        {props.canActivateTrial ? (
          <View
            style={{
              gap: 10,
              marginBottom: 10
            }}
          >
            {(is5YearPlanSelected
              ? [
                  "One time purchase, no auto-renewal",
                  "Pay once and use for 5 years"
                ]
              : [
                  `Free ${billingDuration.duration} day trial, cancel any time`,
                  "Google will remind you before your trial ends"
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

        {[
          `notesnook.${props.planId}.yearly`,
          `notesnook.${props.planId}.monthly`,
          ...(props.planId === "essential"
            ? []
            : [`notesnook.${props.planId}.5year`])
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
            justifyContent: "space-between"
          }}
        >
          <Heading color={colors.primary.paragraph} size={AppFontSize.sm}>
            Due today{" "}
            {pricingPlans.userCanRequestTrial ? (
              <Text
                style={{
                  color: colors.primary.accent
                }}
              >
                ({billingDuration.duration} days free)
              </Text>
            ) : null}
          </Heading>

          <Paragraph color={colors.primary.paragraph}>
            {pricingPlans.userCanRequestTrial
              ? "0.00"
              : pricingPlans.getStandardPrice(
                  pricingPlans.selectedProduct as RNIap.Subscription
                )}
          </Paragraph>
        </View>

        {pricingPlans.userCanRequestTrial ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between"
            }}
          >
            <Paragraph color={colors.secondary.paragraph}>
              Due{" "}
              {dayjs().add(billingDuration.duration, "day").format("DD MMMM")}
            </Paragraph>
            <Paragraph color={colors.secondary.paragraph}>
              {pricingPlans.getStandardPrice(
                pricingPlans.selectedProduct as RNIap.Subscription
              )}
            </Paragraph>
          </View>
        ) : null}

        <Button
          width="100%"
          type="accent"
          loading={pricingPlans.loading}
          title={
            pricingPlans.selectedProduct?.productId.includes("5year")
              ? "Purchase"
              : pricingPlans?.userCanRequestTrial
              ? "Subscribe and start free trial"
              : "Subscribe"
          }
          style={{
            marginTop: DefaultAppStyles.GAP_VERTICAL,
            marginBottom: DefaultAppStyles.GAP_VERTICAL
          }}
          onPress={() => {
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
            ? `This is a one time purchase, no subscription.`
            : `Cancel anytime, subscription auto-renews.`}
        </Heading>
        <Heading
          style={{
            textAlign: "center"
          }}
          color={colors.secondary.paragraph}
          size={AppFontSize.xs}
        >
          By joining you agree to our{" "}
          <Text
            style={{
              textDecorationLine: "underline"
            }}
            onPress={() => {
              openLinkInBrowser("https://notesnook.com/privacy");
            }}
          >
            privacy policy
          </Text>{" "}
          and{" "}
          <Text
            style={{
              textDecorationLine: "underline"
            }}
            onPress={() => {
              openLinkInBrowser("https://notesnook.com/tos");
            }}
          >
            terms of use
          </Text>
          .
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
    props.pricingPlans?.currentPlan?.products?.[props.productId];
  const isAnnual = product?.productId.includes("yearly");
  const isSelected =
    product?.productId === props.pricingPlans.selectedProduct?.productId;

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        gap: 10
      }}
      activeOpacity={0.9}
      onPress={() => {
        props.pricingPlans.selectProduct(product?.productId);
      }}
    >
      <Icon
        name={isSelected ? "radiobox-marked" : "radiobox-blank"}
        color={isSelected ? colors.primary.accent : colors.secondary.icon}
        size={AppFontSize.lg}
      />
      <View
        style={{
          gap: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: DefaultAppStyles.GAP_VERTICAL
          }}
        >
          <Heading size={AppFontSize.md}>
            {isAnnual
              ? "Yearly"
              : product?.productId.includes("5year")
              ? "5 year plan (One time purchase)"
              : "Monthly"}
          </Heading>

          {isAnnual ? (
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
                Best value -{" "}
                {props.pricingPlans.compareProductPrice(
                  props.pricingPlans.currentPlan?.id as string,
                  `notesnook.${props.pricingPlans.currentPlan?.id}.yearly`,
                  `notesnook.${props.pricingPlans.currentPlan?.id}.monthly`
                )}
                % Off
              </Heading>
            </View>
          ) : null}
        </View>

        <Paragraph>
          {product?.productId.includes("5year")
            ? (product as RNIap.Product).localizedPrice
            : props.pricingPlans.getStandardPrice(
                product as RNIap.Subscription
              )}{" "}
          {isAnnual || product?.productId.includes("5year")
            ? `(${props.pricingPlans.getPrice(
                product as RNIap.Subscription,
                props.pricingPlans.hasTrialOffer() ? 1 : 0,
                isAnnual
              )}/month)`
            : null}
        </Paragraph>
      </View>
    </TouchableOpacity>
  );
};
