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
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
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

  return !pricingPlans.currentPlan ? null : (
    <View
      style={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        gap: DefaultAppStyles.GAP_VERTICAL
      }}
    >
      <>
        <View
          style={{
            width: "100%",
            paddingHorizontal: DefaultAppStyles.GAP,
            gap: DefaultAppStyles.GAP_VERTICAL
          }}
        >
          <Paragraph>
            <AppIcon
              name="crown"
              size={AppFontSize.md}
              color={colors.static.orange}
            />
            {strings.upgradePlanTo(pricingPlans.currentPlan?.name)}
          </Paragraph>

          <View
            style={{
              gap: DefaultAppStyles.GAP_VERTICAL_SMALL,
              width: "100%"
            }}
          >
            <Heading>{strings.tryItForFree()}</Heading>

            <Heading size={AppFontSize.sm}>
              {strings.getThisAndSoMuchMore()}
            </Heading>

            <View
              style={{
                gap: DefaultAppStyles.GAP_SMALL,
                flexDirection: "row"
              }}
            >
              <AppIcon name="cloud" size={AppFontSize.xxl} />
              <Paragraph
                style={{
                  flexShrink: 1
                }}
              >
                <Heading size={AppFontSize.sm}>
                  {
                    PlanOverView[
                      pricingPlans.currentPlan.id as keyof typeof PlanOverView
                    ].storage
                  }
                </Heading>{" "}
                {strings.cloudSpace()}
              </Paragraph>
            </View>

            {pricingPlans.currentPlan.id !== "essential" ? (
              <View
                style={{
                  gap: DefaultAppStyles.GAP_SMALL,
                  flexDirection: "row"
                }}
              >
                <AppIcon name="lock" size={AppFontSize.xxl} />
                <Paragraph
                  style={{
                    flexShrink: 1
                  }}
                >
                  <Heading size={AppFontSize.sm}>{strings.appLock()}</Heading>{" "}
                  {strings.appLockFeatureBenefit()}
                </Paragraph>
              </View>
            ) : null}

            <View
              style={{
                gap: DefaultAppStyles.GAP_SMALL,
                flexDirection: "row"
              }}
            >
              <AppIcon name="vector-link" size={AppFontSize.xxl} />
              <Paragraph
                style={{
                  flexShrink: 1
                }}
              >
                {strings.advancedNoteTaking[0]()}{" "}
                <Heading size={AppFontSize.sm}>
                  {strings.advancedNoteTaking[1]()}
                </Heading>{" "}
                {strings.advancedNoteTaking[2]()}
              </Paragraph>
            </View>
          </View>
        </View>

        <View
          style={{
            width: "100%",
            paddingHorizontal: DefaultAppStyles.GAP
          }}
        >
          <Paragraph
            style={{
              marginVertical: 10
            }}
            size={AppFontSize.xs}
          >
            <Heading size={AppFontSize.xs}>{strings.cancelAnytime()}</Heading>{" "}
            {strings.googleReminderTrial()}
          </Paragraph>

          <Button
            type="accent"
            title={strings.upgrade()}
            style={{
              marginVertical: DefaultAppStyles.GAP_VERTICAL,
              width: "100%"
            }}
            onPress={() => {
              if (PremiumService.get()) {
                if (
                  pricingPlans.user?.subscription.plan ===
                    SubscriptionPlan.LEGACY_PRO ||
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
            }}
          />
        </View>

        {isSubscribedOnWeb ? null : (
          <Button
            type="plain"
            title={strings.exploreAllPlans()}
            icon="arrow-right"
            iconPosition="right"
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
      </>
    </View>
  );
}

PaywallSheet.present = <Tid extends FeatureId>(feature: FeatureResult<Tid>) => {
  if (SettingsService.getProperty("serverUrls")) return;
  presentSheet({
    component: <PaywallSheet feature={feature} />
  });
};
