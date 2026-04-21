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
import { Plan, SKUResponse } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Config from "react-native-config";
import * as RNIap from "react-native-iap";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../../common/database";
import usePricingPlans from "../../../hooks/use-pricing-plans";
import { ToastManager } from "../../../services/event-manager";
import { openLinkInBrowser } from "../../../utils/functions";
import { AppFontSize, defaultBorderRadius } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { Button } from "../../ui/button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { Radius, Spacing } from "../../../common/design/spacing";
import useGlobalSafeAreaInsets from "../../../hooks/use-global-safe-area-insets";
const isGithubRelease = Config.GITHUB_RELEASE === "true";
export const BuyPlan = (props: {
  planId: string;
  canActivateTrial?: boolean;
  pricingPlans: ReturnType<typeof usePricingPlans>;
}) => {
  const insets = useGlobalSafeAreaInsets();
  const { colors } = useThemeColors();
  const [checkoutUrl, setCheckoutUrl] = useState<string>();
  const pricingPlans = props.pricingPlans;

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

  const isAnnual = isGithubRelease
    ? (pricingPlans.selectedProduct as Plan)?.period === "yearly"
    : (pricingPlans.selectedProduct as RNIap.Product)?.productId?.includes(
        "yearly"
      );

  const hasTrialOffer = pricingPlans.hasTrialOffer(
    props.planId,
    (pricingPlans.selectedProduct as RNIap.Product)?.productId ||
      (pricingPlans.selectedProduct as Plan)?.period
  );

  return checkoutUrl ? (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: DefaultAppStyles.GAP_VERTICAL
      }}
    >
      <Paragraph>{strings.finishPurchaseInBrowser()}</Paragraph>
      <Button
        title={strings.next()}
        type="accent"
        onPress={() => {
          pricingPlans.finish();
        }}
      />
      <Button
        title={strings.goBack()}
        onPress={() => {
          setCheckoutUrl(undefined);
        }}
      />
    </View>
  ) : (
    <View
      style={{
        flex: 1
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingVertical: Spacing.LEVEL_4
        }}
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
      >
        <View
          style={{
            paddingHorizontal: DefaultAppStyles.GAP,
            gap: Spacing.LEVEL_4
          }}
        >
          <View
            style={{
              gap: Spacing.LEVEL_2
            }}
          >
            {[
              Config.GITHUB_RELEASE === "true"
                ? "yearly"
                : `notesnook.${props.planId}.yearly`,
              Config.GITHUB_RELEASE === "true"
                ? "monthly"
                : `notesnook.${props.planId}.monthly`,
              ...(props.planId === "essential" || pricingPlans.isSubscribed()
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
          </View>

          <Paragraph
            fontFamily="MEDIUM"
            fontSize="MD"
            color={colors.secondary.paragraph}
          >
            {strings.paymentSummary()}
          </Paragraph>

          <View
            style={{
              borderWidth: 1,
              borderColor: colors.primary.border,
              borderRadius: Radius.S,
              backgroundColor: colors.secondary.background,
              padding: Spacing.LEVEL_3
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <View
                style={{
                  gap: Spacing.LEVEL_1
                }}
              >
                <Heading color={colors.primary.paragraph} size={AppFontSize.md}>
                  {strings.dueToday()}{" "}
                </Heading>
                <Paragraph>
                  {hasTrialOffer ? (
                    <Text>
                      {strings.freeTrialIncludes(
                        billingDuration?.duration || 0
                      )}
                    </Text>
                  ) : is5YearPlanSelected ? (
                    strings.billingType.annual()
                  ) : null}
                </Paragraph>
              </View>

              <Heading color={colors.primary.paragraph} fontSize="SM">
                {hasTrialOffer
                  ? "Free"
                  : pricingPlans.getStandardPrice(
                      pricingPlans.selectedProduct as RNIap.Subscription
                    )}
              </Heading>
            </View>

            {hasTrialOffer ? (
              <>
                <View
                  style={{
                    width: "100%",
                    height: 1,
                    backgroundColor: colors.primary.border,
                    marginVertical: Spacing.LEVEL_2
                  }}
                />

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <View
                    style={{
                      gap: Spacing.LEVEL_1
                    }}
                  >
                    <Heading
                      color={colors.primary.paragraph}
                      size={AppFontSize.md}
                    >
                      {strings.nextBillingDate()}
                    </Heading>
                    <Paragraph>
                      {dayjs()
                        .add(billingDuration?.duration || 0, "day")
                        .format("DD MMMM,YYYY")}{" "}
                      *{" "}
                      {isAnnual
                        ? strings.billingType.annual()
                        : is5YearPlanSelected
                          ? strings.billingType.oneTime()
                          : strings.billingType.monthly()}
                    </Paragraph>
                  </View>

                  <Heading fontSize="SM" color={colors.primary.accent}>
                    {pricingPlans.getStandardPrice(
                      pricingPlans.selectedProduct as RNIap.Subscription
                    )}
                  </Heading>
                </View>
              </>
            ) : null}
          </View>

          <Paragraph
            fontFamily="MEDIUM"
            fontSize="MD"
            color={colors.secondary.paragraph}
          >
            {strings.whatsIncluded()}
          </Paragraph>

          <View
            style={{
              gap: Spacing.LEVEL_2,
              borderWidth: 1,
              borderColor: colors.primary.border,
              padding: Spacing.LEVEL_3,
              borderRadius: Radius.S,
              backgroundColor: colors.secondary.background,
              marginBottom: 27
            }}
          >
            {[
              strings.planWhatsIncluded.unlimitedNotes(),
              strings.planWhatsIncluded.endToEnd(),
              strings.planWhatsIncluded.allDevices(),
              hasTrialOffer
                ? strings.planWhatsIncluded.freeTrial(
                    billingDuration?.duration || 0
                  )
                : undefined,
              hasTrialOffer ? strings.planWhatsIncluded.remind() : undefined,
              ...(is5YearPlanSelected
                ? strings["5yearPlanConditions"]()
                : ([] as string[]))
            ].map((item) =>
              !item ? null : (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing.LEVEL_1,
                    flex: 1
                  }}
                  key={item}
                >
                  <Icon
                    color={colors.primary.accent}
                    size={AppFontSize.lg}
                    name="check"
                  />
                  <Paragraph
                    style={{
                      flexShrink: 1
                    }}
                  >
                    {item}
                  </Paragraph>
                </View>
              )
            )}

            <Paragraph
              style={{
                marginTop: Spacing.LEVEL_0
              }}
              fontSize="XS"
            >
              <Heading fontSize="XS">{strings.note()}: </Heading>
              {is5YearPlanSelected
                ? strings.oneTimePurchase()
                : strings.cancelAnytimeAlt()}
            </Paragraph>
          </View>

          <Paragraph
            style={{
              textAlign: "center"
            }}
            color={colors.secondary.paragraph}
            size={AppFontSize.xs}
          >
            {strings.subTerms[0]()}{" "}
            <Text
              style={{
                color: colors.primary.accent
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
                color: colors.primary.accent
              }}
              onPress={() => {
                openLinkInBrowser("https://notesnook.com/tos");
              }}
            >
              {strings.subTerms[3]()}
            </Text>
          </Paragraph>
        </View>
      </ScrollView>

      <View
        style={{
          backgroundColor: colors.secondary.background,
          width: "100%",
          padding: Spacing.LEVEL_3,
          marginBottom: -insets.bottom,
          paddingBottom: insets.bottom,
          borderTopWidth: 1,
          borderTopColor: colors.primary.border
        }}
      >
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
              const url = await db.subscriptions.checkoutUrl(
                (pricingPlans.selectedProduct as Plan).plan,
                (pricingPlans.selectedProduct as Plan).period
              );
              if (url) {
                setCheckoutUrl(url);
                Linking.openURL(url);
              }
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
      </View>
    </View>
  );
};

const ProductItem = (props: {
  pricingPlans: ReturnType<typeof usePricingPlans>;
  productId: string;
}) => {
  const { colors } = useThemeColors();
  const [regionalDiscount, setRegionaDiscount] = useState<SKUResponse>();
  const product =
    props.pricingPlans?.currentPlan?.subscriptions?.[
      regionalDiscount?.sku || props.productId
    ] ||
    props.pricingPlans?.currentPlan?.products?.[props.productId] ||
    props.pricingPlans?.getWebPlan(
      props.pricingPlans?.currentPlan?.id as string,
      props.productId as "monthly" | "yearly"
    );

  const isAnnual = isGithubRelease
    ? (product as Plan)?.period === "yearly"
    : (product as RNIap.Subscription)?.productId?.includes("yearly");

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

  const isSubscribed =
    props.pricingPlans.isSubscribed() &&
    (props.pricingPlans.user?.subscription?.productId ===
      (product as RNIap.Subscription)?.productId ||
      props.pricingPlans.user?.subscription?.productId?.startsWith(
        (product as RNIap.Subscription)?.productId
      ) ||
      props.pricingPlans.user?.subscription?.productId ===
        (product as Plan)?.id);

  useEffect(() => {
    if (product) {
      props.pricingPlans
        ?.getRegionalDiscount(
          props.pricingPlans.currentPlan?.id as string,
          props.pricingPlans.isGithubRelease
            ? ((product as Plan)?.period as string)
            : props.productId
        )
        .then((value) => {
          if (
            value &&
            value.sku?.startsWith(
              (props.pricingPlans.selectedProduct as RNIap.Subscription)
                ?.productId
            )
          ) {
            props.pricingPlans.selectProduct(value?.sku as string);
          }
          setRegionaDiscount(value);
        });
    }
  }, [product, props.pricingPlans, props.productId]);

  const discountValue =
    (isAnnual && !isGithubRelease) ||
    (isGithubRelease && (product as Plan)?.discount?.amount)
      ? regionalDiscount
        ? regionalDiscount.discount
        : isGithubRelease
          ? (product as Plan).discount?.amount
          : props.pricingPlans.compareProductPrice(
              props.pricingPlans.currentPlan?.id as string,
              `notesnook.${props.pricingPlans.currentPlan?.id}.yearly`,
              `notesnook.${props.pricingPlans.currentPlan?.id}.monthly`
            )
      : undefined;

  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        gap: 10,
        opacity: isSubscribed ? 0.5 : 1,
        backgroundColor: colors.secondary.background,
        padding: Spacing.LEVEL_2,
        borderRadius: Radius.S,
        borderWidth: 1,
        borderColor: colors.primary.border,
        justifyContent: "space-between"
      }}
      activeOpacity={0.9}
      onPress={() => {
        if (isSubscribed) {
          ToastManager.show({
            message: strings.alreadySubscribed(),
            type: "info"
          });
          return;
        }
        if (!product) return;
        props.pricingPlans.selectProduct(
          isGithubRelease
            ? (product as Plan)?.period
            : (product as RNIap.Subscription)?.productId
        );
      }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: Spacing.LEVEL_1
        }}
      >
        <Icon
          name={isSelected ? "radiobox-marked" : "radiobox-blank"}
          color={isSelected ? colors.primary.accent : colors.secondary.icon}
          size={AppFontSize.lg}
        />
        <View
          style={{
            gap: Spacing.LEVEL_1
          }}
        >
          <View
            style={{
              flexDirection: "row",
              gap: DefaultAppStyles.GAP_VERTICAL_SMALL
            }}
          >
            <Heading size={AppFontSize.md}>
              {isAnnual
                ? strings.yearly()
                : is5YearProduct
                  ? strings.fiveYearPlan()
                  : strings.monthly()}
            </Heading>

            {discountValue ? (
              <View
                style={{
                  backgroundColor: colors.primary.accent,
                  borderRadius: defaultBorderRadius,
                  padding: Spacing.LEVEL_0,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Paragraph color={colors.static.white} size={AppFontSize.xxs}>
                  {strings.percentOff(`${discountValue}`)}
                </Paragraph>
              </View>
            ) : null}

            {isSubscribed ? (
              <View
                style={{
                  backgroundColor: colors.primary.accent,
                  borderRadius: defaultBorderRadius,
                  paddingHorizontal: 6,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Heading color={colors.static.white} size={AppFontSize.xs}>
                  {strings.currentPlan()}
                </Heading>
              </View>
            ) : null}
          </View>

          <Paragraph>
            {is5YearProduct
              ? strings.billingType.oneTime()
              : isAnnual
                ? strings.billingType.annual()
                : strings.billingType.monthly()}
          </Paragraph>
        </View>
      </View>

      <View
        style={{
          gap: Spacing.LEVEL_1
        }}
      >
        <Heading size={AppFontSize.sm}>
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
              )}`
            : null}

          {!isAnnual && !is5YearProduct
            ? `${props.pricingPlans.getStandardPrice(
                product as RNIap.Subscription
              )}`
            : null}
        </Heading>

        <Paragraph size={AppFontSize.xs}>/month</Paragraph>
      </View>
    </TouchableOpacity>
  );
};
