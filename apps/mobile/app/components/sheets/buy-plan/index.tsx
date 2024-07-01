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
import { Text, TouchableOpacity, View } from "react-native";
import usePricingPlans from "../../../hooks/use-pricing-plans";
import { presentSheet } from "../../../services/event-manager";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SIZE } from "../../../utils/size";
import Paragraph from "../../ui/typography/paragraph";
import Heading from "../../ui/typography/heading";
import { useThemeColors } from "@notesnook/theme";
import * as RNIap from "react-native-iap";
import { Button } from "../../ui/button";
import dayjs from "dayjs";
import { openLinkInBrowser } from "../../../utils/functions";

export const BuyPlan = (props: {
  planId: string;
  productId: string;
  canActivateTrial?: boolean;
}) => {
  const { colors } = useThemeColors();
  const pricingPlans = usePricingPlans({
    planId: props.planId,
    productId: props.productId
  });

  const billingDuration = pricingPlans.getBillingDuration(
    pricingPlans.selectedProduct as RNIap.Subscription,
    0,
    0
  );

  return (
    <View
      style={{
        paddingHorizontal: 16,
        gap: 16,
        height: "90%"
      }}
    >
      <Heading>
        {props.canActivateTrial
          ? `Try ${pricingPlans.currentPlan?.name} plan for free`
          : `${pricingPlans.currentPlan?.name} plan`}{" "}
      </Heading>

      {props.canActivateTrial ? (
        <View
          style={{
            gap: 10,
            marginBottom: 10
          }}
        >
          {[
            `Free ${
              pricingPlans.getBillingDuration(
                pricingPlans.selectedProduct as RNIap.Subscription,
                0,
                0
              ).duration
            } day trial, cancel any time`,
            "Google will remind you before your trial ends"
          ].map((item) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10
              }}
              key={item}
            >
              <Icon color={colors.primary.accent} size={SIZE.lg} name="check" />
              <Paragraph>{item}</Paragraph>
            </View>
          ))}
        </View>
      ) : null}

      {[
        `notesnook.${props.planId}.yearly`,
        `notesnook.${props.planId}.monthly`
      ].map((item) => (
        <ProductItem key={item} pricingPlans={pricingPlans} productId={item} />
      ))}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20
        }}
      >
        <Heading color={colors.primary.paragraph} size={SIZE.sm}>
          Due today{" "}
          {props.canActivateTrial ? (
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
          {props.canActivateTrial
            ? "0.00"
            : pricingPlans.getStandardPrice(
                pricingPlans.selectedProduct as RNIap.Subscription
              )}
        </Paragraph>
      </View>

      {props.canActivateTrial ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between"
          }}
        >
          <Paragraph color={colors.secondary.paragraph}>
            Due {dayjs().add(7, "day").format("DD MMMM")}
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
        title="Subscribe"
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

      <View>
        <Heading
          style={{
            textAlign: "center"
          }}
          color={colors.secondary.paragraph}
          size={SIZE.xs}
        >
          Cancel anytime, subscription auto-renews.
        </Heading>
        <Heading
          style={{
            textAlign: "center"
          }}
          color={colors.secondary.paragraph}
          size={SIZE.xs}
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
    </View>
  );
};

const ProductItem = (props: {
  pricingPlans: ReturnType<typeof usePricingPlans>;
  productId: string;
}) => {
  const { colors } = useThemeColors();
  const product = props.pricingPlans?.currentPlan?.products?.[props.productId];
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
        size={SIZE.lg}
      />
      <View
        style={{
          gap: 10
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: 10
          }}
        >
          <Heading size={SIZE.md}>{isAnnual ? "Yearly" : "Monthly"}</Heading>

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
              <Heading size={SIZE.xs}>
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
          {props.pricingPlans.getStandardPrice(product as RNIap.Subscription)}{" "}
          {isAnnual
            ? `(${props.pricingPlans.getAndroidPrice(
                product as RNIap.SubscriptionAndroid,
                1,
                true
              )}/month)`
            : null}
        </Paragraph>
      </View>
    </TouchableOpacity>
  );
};

BuyPlan.present = (
  context: string,
  planId: string,
  productId: string,
  canActivateTrial: boolean
) => {
  presentSheet({
    component: () => (
      <BuyPlan
        planId={planId}
        canActivateTrial={canActivateTrial}
        productId={productId}
      />
    )
  });
};
