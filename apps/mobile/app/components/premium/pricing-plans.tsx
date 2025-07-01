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
import React from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import usePricingPlans from "../../hooks/use-pricing-plans";
import { eSendEvent, ToastManager } from "../../services/event-manager";
import {
  eClosePremiumDialog,
  eCloseSheet,
  eCloseSimpleDialog,
  eOpenLoginDialog
} from "../../utils/events";
import { openLinkInBrowser } from "../../utils/functions";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Dialog } from "../dialog";
import BaseDialog from "../dialog/base-dialog";
import { presentDialog } from "../dialog/functions";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { PricingItem } from "./pricing-item";

const UUID_PREFIX = "0bdaea";
const UUID_VERSION = "4";
const UUID_VARIANT = "a";

function toUUID(str: string) {
  return [
    UUID_PREFIX + str.substring(0, 2), // 6 digit prefix + first 2 oid digits
    str.substring(2, 6), // # next 4 oid digits
    UUID_VERSION + str.substring(6, 9), // # 1 digit version(0x4) + next 3 oid digits
    UUID_VARIANT + str.substring(9, 12), // # 1 digit variant(0b101) + 1 zero bit + next 3 oid digits
    str.substring(12)
  ].join("-");
}

const promoCyclesMonthly = {
  1: "first month",
  2: "first 2 months",
  3: "first 3 months",
  4: "first 4 months",
  5: "first 5 months",
  6: "first 3 months"
};

const promoCyclesYearly = {
  1: "first year",
  2: "first 2 years",
  3: "first 3 years"
};

export const PricingPlans = ({
  promo,
  marginTop,
  heading = true,
  compact = false
}: {
  promo?: {
    promoCode: string;
  };
  marginTop?: any;
  heading?: boolean;
  compact?: boolean;
}) => {
  const { colors } = useThemeColors();
  const {
    buySubscription,
    buying,
    getStandardPrice,
    product,
    setBuying,
    loading,
    user,
    setProduct,
    monthlyPlan,
    yearlyPlan,
    getPromo
  } = usePricingPlans({
    promoOffer: promo
  });

  return loading ? (
    <View
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        justifyContent: "center",
        alignItems: "center",
        height: 100
      }}
    >
      <ActivityIndicator color={colors.primary.accent} size={25} />
    </View>
  ) : (
    <View
      style={{
        paddingHorizontal: DefaultAppStyles.GAP
      }}
    >
      {buying ? (
        <BaseDialog visible statusBarTranslucent centered>
          <ActivityIndicator size={50} color="white" />
        </BaseDialog>
      ) : null}

      {!user && !product ? (
        <>
          {heading || (monthlyPlan?.info?.discount || 0) > 0 ? (
            <>
              {monthlyPlan && (monthlyPlan?.info?.discount || 0) > 0 ? (
                <View
                  style={{
                    alignSelf: "center",
                    marginTop: marginTop || 20,
                    marginBottom: 20
                  }}
                >
                  <Heading
                    style={{
                      textAlign: "center"
                    }}
                    color={colors.primary.accent}
                  >
                    Get {monthlyPlan?.info?.discount}% off in{" "}
                    {monthlyPlan?.info?.country}
                  </Heading>
                </View>
              ) : (
                <Heading
                  style={{
                    alignSelf: "center",
                    marginTop: marginTop || 20,
                    marginBottom: 20
                  }}
                >
                  Choose a plan
                </Heading>
              )}
            </>
          ) : null}

          <View
            style={{
              flexDirection: !compact ? "column" : "row",
              flexWrap: "wrap",
              justifyContent: "space-around"
            }}
          >
            <PricingItem
              onPress={() => {
                if (!monthlyPlan?.product) return;
                buySubscription(monthlyPlan?.product);
              }}
              compact={compact}
              product={{
                type: "monthly",
                data: monthlyPlan?.product,
                info: "Pay once a month, cancel anytime."
              }}
            />

            {!compact && (
              <View
                style={{
                  height: 1,
                  marginVertical: 5
                }}
              />
            )}

            <PricingItem
              onPress={() => {
                if (!yearlyPlan?.product) return;
                buySubscription(yearlyPlan?.product);
              }}
              compact={compact}
              product={{
                type: "yearly",
                data: yearlyPlan?.product,
                info: "Pay once a year, cancel anytime."
              }}
            />
          </View>

          {Platform.OS !== "ios" ? (
            <Button
              height={35}
              style={{
                marginTop: 10
              }}
              onPress={() => {
                presentDialog({
                  context: "local",
                  input: true,
                  inputPlaceholder: "Enter code",
                  positiveText: "Apply",
                  positivePress: async (value) => {
                    if (!value) return;
                    eSendEvent(eCloseSimpleDialog);
                    setBuying(true);
                    try {
                      if (!(await getPromo(value as string)))
                        throw new Error("Error applying promo code");
                      ToastManager.show({
                        heading: "Discount applied!",
                        type: "success",
                        context: "local"
                      });
                      setBuying(false);
                    } catch (e) {
                      setBuying(false);
                      ToastManager.show({
                        heading: "Promo code invalid or expired",
                        message: (e as Error).message,
                        type: "error",
                        context: "local"
                      });
                    }
                  },
                  title: "Have a promo code?",
                  paragraph: "Enter your promo code to get a special discount."
                });
              }}
              title="I have a promo code"
            />
          ) : (
            <View
              style={{
                height: 15
              }}
            />
          )}
        </>
      ) : (
        <View>
          {!user ? (
            <>
              <Button
                onPress={() => {
                  eSendEvent(eClosePremiumDialog);
                  eSendEvent(eCloseSheet);
                  setTimeout(() => {
                    eSendEvent(eOpenLoginDialog, 1);
                  }, 400);
                }}
                title={"Sign up for free"}
                type="accent"
                width={250}
                style={{
                  paddingHorizontal: 12,
                  marginTop: product?.type === "promo" ? 0 : 30,
                  marginBottom: 10
                }}
              />
              {Platform.OS !== "ios" &&
              promo &&
              !promo.promoCode.startsWith("com.streetwriters.notesnook") ? (
                <Paragraph
                  size={AppFontSize.md}
                  textBreakStrategy="balanced"
                  style={{
                    alignSelf: "center",
                    justifyContent: "center",
                    textAlign: "center"
                  }}
                >
                  Use promo code{" "}
                  <Text
                    style={{
                      fontFamily: "OpenSans-SemiBold"
                    }}
                  >
                    {promo.promoCode}
                  </Text>{" "}
                  at checkout
                </Paragraph>
              ) : null}
            </>
          ) : (
            <>
              <Button
                onPress={() => {
                  if (!product?.data) return;
                  buySubscription(product.data);
                }}
                height={40}
                width="50%"
                type="accent"
                title="Subscribe now"
              />

              <Button
                onPress={() => {
                  setProduct(undefined);
                }}
                style={{
                  marginTop: 5
                }}
                height={30}
                fontSize={13}
                type="errorShade"
                title="Cancel promo code"
              />
            </>
          )}
        </View>
      )}

      {!user ? (
        <Paragraph
          color={colors.secondary.paragraph}
          size={AppFontSize.xs}
          style={{
            alignSelf: "center",
            textAlign: "center",
            marginTop: DefaultAppStyles.GAP_VERTICAL,
            maxWidth: "80%"
          }}
        >
          {user
            ? 'On clicking "Try free for 14 days", your free trial will be activated.'
            : "After sign up you will be asked to activate your free trial."}{" "}
          <Paragraph size={AppFontSize.xs} style={{ fontWeight: "bold" }}>
            No credit card is required.
          </Paragraph>
        </Paragraph>
      ) : null}

      {user ? (
        <>
          {Platform.OS === "ios" ? (
            <Paragraph
              textBreakStrategy="balanced"
              size={AppFontSize.xs}
              color={colors.secondary.paragraph}
              style={{
                alignSelf: "center",
                marginTop: DefaultAppStyles.GAP_VERTICAL,
                textAlign: "center"
              }}
            >
              By subscribing, you will be charged to your iTunes Account for the
              selected plan. Subscriptions will automatically renew unless
              cancelled within 24-hours before the end of the current period.
            </Paragraph>
          ) : (
            <Paragraph
              size={AppFontSize.xs}
              color={colors.secondary.paragraph}
              style={{
                alignSelf: "center",
                marginTop: DefaultAppStyles.GAP_VERTICAL,
                textAlign: "center"
              }}
            >
              By subscribing, you will be charged on your Google Account, and
              your subscription will automatically renew until you cancel prior
              to the end of the then current period.
            </Paragraph>
          )}

          <View
            style={{
              width: "100%"
            }}
          >
            <Paragraph
              size={AppFontSize.xs}
              color={colors.secondary.paragraph}
              style={{
                maxWidth: "100%",
                textAlign: "center"
              }}
            >
              By subscribing, you agree to our{" "}
              <Paragraph
                size={AppFontSize.xs}
                onPress={() => {
                  openLinkInBrowser("https://notesnook.com/tos")
                    .catch(() => {})
                    .then(() => {});
                }}
                style={{
                  textDecorationLine: "underline"
                }}
                color={colors.primary.accent}
              >
                Terms of Service{" "}
              </Paragraph>
              and{" "}
              <Paragraph
                size={AppFontSize.xs}
                onPress={() => {
                  openLinkInBrowser("https://notesnook.com/privacy")
                    .catch(() => {})
                    .then(() => {});
                }}
                style={{
                  textDecorationLine: "underline"
                }}
                color={colors.primary.accent}
              >
                Privacy Policy.
              </Paragraph>
            </Paragraph>
          </View>
        </>
      ) : null}

      <Dialog context="local" />
    </View>
  );
};
