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
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import * as RNIap from "react-native-iap";
import { DatabaseLogger, db } from "../../common/database";
import { usePricing } from "../../hooks/use-pricing";
import {
  eSendEvent,
  presentSheet,
  ToastManager
} from "../../services/event-manager";
import Navigation from "../../services/navigation";
import PremiumService from "../../services/premium";
import { useSettingStore } from "../../stores/use-setting-store";
import { useUserStore } from "../../stores/use-user-store";
import {
  eClosePremiumDialog,
  eCloseSheet,
  eCloseSimpleDialog
} from "../../utils/events";
import { openLinkInBrowser } from "../../utils/functions";
import { AppFontSize } from "../../utils/size";
import { sleep } from "../../utils/time";
import { AuthMode } from "../auth/common";
import { Dialog } from "../dialog";
import BaseDialog from "../dialog/base-dialog";
import { presentDialog } from "../dialog/functions";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { Walkthrough } from "../walkthroughs";
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
  const user = useUserStore((state) => state.user);
  const [product, setProduct] = useState<{
    type: string;
    offerType: "monthly" | "yearly";
    data: RNIap.Subscription;
    cycleText: string;
    info: string;
  }>();

  const [buying, setBuying] = useState(false);
  const [loading, setLoading] = useState(false);
  const userCanRequestTrial =
    user && (!user.subscription || !user.subscription.expiry) ? true : false;
  const [upgrade, setUpgrade] = useState(!userCanRequestTrial);
  const yearlyPlan = usePricing("yearly");
  const monthlyPlan = usePricing("monthly");

  const getSkus = useCallback(async () => {
    try {
      setLoading(true);
      if (promo?.promoCode) {
        getPromo(promo?.promoCode);
      }
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  }, [promo?.promoCode]);

  const getPromo = async (code: string) => {
    try {
      let skuId: string;
      if (code.startsWith("com.streetwriters.notesnook")) {
        skuId = code;
      } else {
        skuId = await db.offers?.getCode(
          code.split(":")[0],
          Platform.OS as "ios" | "android"
        );
      }

      const products = await PremiumService.getProducts();
      const product = products.find((p) => p.productId === skuId);
      if (!product) return false;
      const isMonthly = product.productId.indexOf(".mo") > -1;

      const cycleText = isMonthly
        ? promoCyclesMonthly[
            (Platform.OS === "android"
              ? (product as RNIap.SubscriptionAndroid)
                  .subscriptionOfferDetails[0]?.pricingPhases
                  .pricingPhaseList?.[0].billingCycleCount
              : parseInt(
                  (product as RNIap.SubscriptionIOS)
                    .introductoryPriceNumberOfPeriodsIOS as string
                )) as keyof typeof promoCyclesMonthly
          ]
        : promoCyclesYearly[
            (Platform.OS === "android"
              ? (product as RNIap.SubscriptionAndroid)
                  .subscriptionOfferDetails[0]?.pricingPhases
                  .pricingPhaseList?.[0].billingCycleCount
              : parseInt(
                  (product as RNIap.SubscriptionIOS)
                    .introductoryPriceNumberOfPeriodsIOS as string
                )) as keyof typeof promoCyclesYearly
          ];

      setProduct({
        type: "promo",
        offerType: isMonthly ? "monthly" : "yearly",
        data: product,
        cycleText: cycleText,
        info: `Pay ${isMonthly ? "monthly" : "yearly"}, cancel anytime`
      });
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    getSkus();
  }, [getSkus]);

  const buySubscription = async (product: RNIap.Subscription) => {
    if (buying || !product) return;
    setBuying(true);
    try {
      if (!user) {
        setBuying(false);
        return;
      }
      useSettingStore.getState().setAppDidEnterBackgroundForAction(true);
      const androidOfferToken =
        Platform.OS === "android"
          ? (product as RNIap.SubscriptionAndroid).subscriptionOfferDetails[0]
              .offerToken
          : null;

      DatabaseLogger.info(
        `Subscription Requested initiated for user ${toUUID(user.id)}`
      );

      await RNIap.requestSubscription({
        sku: product?.productId,
        obfuscatedAccountIdAndroid: user.id,
        obfuscatedProfileIdAndroid: user.id,
        appAccountToken: toUUID(user.id),
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
        subscriptionOffers: androidOfferToken
          ? [
              {
                offerToken: androidOfferToken,
                sku: product?.productId
              }
            ]
          : undefined
      });
      useSettingStore.getState().setAppDidEnterBackgroundForAction(false);
      setBuying(false);
      eSendEvent(eCloseSheet);
      eSendEvent(eClosePremiumDialog);
      await sleep(500);
      presentSheet({
        title: "Thank you for subscribing!",
        paragraph:
          "Your Notesnook Pro subscription will be activated soon. If your account is not upgraded to Notesnook Pro, your money will be refunded to you. In case of any issues, please reach out to us at support@streetwriters.co",
        action: async () => {
          eSendEvent(eCloseSheet);
        },
        icon: "check",
        actionText: "Continue"
      });
    } catch (e) {
      setBuying(false);
    }
  };

  function getStandardPrice() {
    if (!product) return;
    const productType = product.offerType;

    if (Platform.OS === "android") {
      const pricingPhaseListItem = (product.data as RNIap.SubscriptionAndroid)
        ?.subscriptionOfferDetails[0]?.pricingPhases.pricingPhaseList?.[1];

      if (!pricingPhaseListItem) {
        const product =
          productType === "monthly"
            ? monthlyPlan?.product
            : yearlyPlan?.product;
        return (product as RNIap.SubscriptionAndroid)
          ?.subscriptionOfferDetails[0]?.pricingPhases.pricingPhaseList?.[0]
          ?.formattedPrice;
      }

      return pricingPhaseListItem?.formattedPrice;
    } else {
      const productDefault =
        productType === "monthly" ? monthlyPlan?.product : yearlyPlan?.product;
      return (
        (product.data as RNIap.SubscriptionIOS)?.localizedPrice ||
        (productDefault as RNIap.SubscriptionIOS)?.localizedPrice
      );
    }
  }

  return loading ? (
    <View
      style={{
        paddingHorizontal: 12,
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
        paddingHorizontal: 12
      }}
    >
      {buying ? (
        <BaseDialog statusBarTranslucent centered>
          <ActivityIndicator size={50} color="white" />
        </BaseDialog>
      ) : null}

      {!upgrade ? (
        <>
          <Paragraph
            style={{
              alignSelf: "center"
            }}
            size={AppFontSize.lg}
          >
            {(Platform.OS === "android"
              ? (monthlyPlan?.product as RNIap.SubscriptionAndroid | undefined)
                  ?.subscriptionOfferDetails[0]?.pricingPhases
                  .pricingPhaseList?.[0]?.formattedPrice
              : (monthlyPlan?.product as RNIap.SubscriptionIOS | undefined)
                  ?.localizedPrice) ||
              (PremiumService.getMontlySub() as any)?.localizedPrice}
            / mo
          </Paragraph>
          <Button
            onPress={() => {
              setUpgrade(true);
            }}
            title={"Upgrade now"}
            type="accent"
            width={250}
            style={{
              paddingHorizontal: 12,
              marginBottom: 15,
              marginTop: 15,
              borderRadius: 100
            }}
          />

          <Button
            onPress={async () => {
              try {
                await db.user?.activateTrial();
                eSendEvent(eClosePremiumDialog);
                eSendEvent(eCloseSheet);
                await sleep(300);
                Walkthrough.present("trialstarted", false, true);
              } catch (e) {
                console.error(e);
              }
            }}
            title={"Try free for 14 days"}
            type="secondaryAccented"
            width={250}
            style={{
              paddingHorizontal: 12,
              marginBottom: 15
            }}
          />
        </>
      ) : (
        <>
          {product?.type === "promo" ? (
            <View
              style={{
                paddingVertical: 15,
                alignItems: "center"
              }}
            >
              {product?.offerType === "monthly" ? (
                <PricingItem
                  product={{
                    type: "monthly",
                    data: monthlyPlan?.product,
                    info: "Pay once a month, cancel anytime."
                  }}
                  strikethrough={true}
                />
              ) : (
                <PricingItem
                  onPress={() => {
                    if (!monthlyPlan?.product) return;
                    buySubscription(monthlyPlan?.product);
                  }}
                  product={{
                    type: "yearly",
                    data: yearlyPlan?.product,
                    info: "Pay once a year, cancel anytime."
                  }}
                  strikethrough={true}
                />
              )}

              <Heading
                style={{
                  paddingTop: 15,
                  fontSize: AppFontSize.lg
                }}
              >
                Special offer for you
              </Heading>

              <View
                style={{
                  paddingVertical: 20,
                  paddingBottom: 10
                }}
              >
                <Heading
                  style={{
                    alignSelf: "center",
                    textAlign: "center"
                  }}
                  size={AppFontSize.xxl}
                >
                  {Platform.OS === "android"
                    ? (product.data as RNIap.SubscriptionAndroid)
                        ?.subscriptionOfferDetails[0]?.pricingPhases
                        .pricingPhaseList?.[0]?.formattedPrice
                    : (product.data as RNIap.SubscriptionIOS)
                        ?.introductoryPrice ||
                      (product.data as RNIap.SubscriptionIOS)
                        ?.localizedPrice}{" "}
                  {product?.cycleText
                    ? `for ${product.cycleText}`
                    : product?.offerType}
                </Heading>
                {product?.cycleText ? (
                  <Paragraph
                    style={{
                      color: colors.secondary.paragraph,
                      alignSelf: "center",
                      textAlign: "center"
                    }}
                    size={AppFontSize.md}
                  >
                    then {getStandardPrice()} {product?.offerType}.
                  </Paragraph>
                ) : null}
              </View>
            </View>
          ) : null}

          {user && !product ? (
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
                            throw new Error(strings.errorApplyingPromoCode());
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
                      paragraph:
                        "Enter your promo code to get a special discount."
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
                      Navigation.navigate("Auth", {
                        mode: AuthMode.login
                      });
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
        </>
      )}

      {!user || !upgrade ? (
        <Paragraph
          color={colors.secondary.paragraph}
          size={AppFontSize.xs}
          style={{
            alignSelf: "center",
            textAlign: "center",
            marginTop: 10,
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

      {user && upgrade ? (
        <>
          {Platform.OS === "ios" ? (
            <Paragraph
              textBreakStrategy="balanced"
              size={AppFontSize.xs}
              color={colors.secondary.paragraph}
              style={{
                alignSelf: "center",
                marginTop: 10,
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
                marginTop: 10,
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
