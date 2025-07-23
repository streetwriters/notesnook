import { View, Text } from "react-native";
import {
  eSendEvent,
  presentSheet,
  ToastManager
} from "../../../services/event-manager";
import { FeatureId, FeatureResult } from "@notesnook/common";
import { useEffect, useState } from "react";
import usePricingPlans from "../../../hooks/use-pricing-plans";
import { BuyPlan } from "../buy-plan";
import Heading from "../../ui/typography/heading";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import Paragraph from "../../ui/typography/paragraph";
import { Button } from "../../ui/button";
import { eCloseSheet } from "../../../utils/events";
import Navigation from "../../../services/navigation";
import { useThemeColors } from "@notesnook/theme";
import AppIcon from "../../ui/AppIcon";

const INDEX_TO_PLAN = {
  0: "essential",
  1: "pro",
  2: "believer"
};

const Steps = {
  Select: 0,
  Buy: 1
};

export default function PaywallSheet<Tid extends FeatureId>(props: {
  feature: FeatureResult<Tid>;
}) {
  const { colors } = useThemeColors();
  const [step, setStep] = useState(Steps.Select);
  const pricingPlans = usePricingPlans();
  useEffect(() => {
    console.log("PaywallSheet mounted with feature:", props.feature);
    ToastManager.hide();
    if (!props.feature.availableOn) return;
    const plan = pricingPlans.pricingPlans.find(
      //@ts-ignore
      (p) => p.id === INDEX_TO_PLAN[props.feature.availableOn]
    );
    if (!plan) return;
    pricingPlans.selectPlan(plan?.id);
    pricingPlans.selectProduct(
      plan?.subscriptionSkuList?.find((sku) => sku.includes("year"))
    );
  }, []);

  console.log(pricingPlans.currentPlan, pricingPlans.selectedProduct);

  return (
    <View
      style={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        gap: DefaultAppStyles.GAP_VERTICAL,
        paddingBottom: DefaultAppStyles.GAP
      }}
    >
      {step === Steps.Select ? (
        <>
          <View
            style={{
              width: "100%",
              paddingHorizontal: DefaultAppStyles.GAP,
              gap: DefaultAppStyles.GAP_VERTICAL
            }}
          >
            {/* <View
          style={{
            backgroundColor: colors.secondary.background,
            borderRadius: 10,
            height: 150,
            width: "100%",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Heading>{pricingPlans.currentPlan?.name}</Heading>
        </View> */}

            <Paragraph>
              <AppIcon
                name="crown"
                size={AppFontSize.md}
                color={colors.static.orange}
              />{" "}
              Upgrade plan to {pricingPlans.currentPlan?.name} to use this
              feature.
            </Paragraph>

            <View
              style={{
                gap: DefaultAppStyles.GAP_VERTICAL_SMALL,
                width: "100%"
              }}
            >
              <Heading>Try it for free</Heading>

              <Heading size={AppFontSize.sm}>
                Get this and so much more:
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
                  <Heading size={AppFontSize.sm}>25 GB</Heading> cloud storage
                  space for storing images and files upto 5 GB every month.
                </Paragraph>
              </View>

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
                  <Heading size={AppFontSize.sm}>App lock</Heading> for locking
                  your notes as soon as app enters background
                </Paragraph>
              </View>

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
                  Use advanced note taking features like{" "}
                  <Heading size={AppFontSize.sm}>
                    tables, outlines, block level note linking
                  </Heading>{" "}
                  and much more.
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
              <Heading size={AppFontSize.xs}>Cancel anytime.</Heading> Google
              will remind you 2 days before your trial ends.
            </Paragraph>

            <Button
              type="accent"
              title="Upgrade"
              style={{
                marginVertical: DefaultAppStyles.GAP_VERTICAL,
                width: "100%"
              }}
              onPress={() => {
                setStep(Steps.Buy);
              }}
            />
          </View>

          <Button
            type="plain"
            title="Explore all plans"
            icon="arrow-right"
            iconPosition="right"
            onPress={() => {
              eSendEvent(eCloseSheet);
              Navigation.navigate("PayWall", {
                context: "logged-in"
              });
            }}
          />
        </>
      ) : null}

      {pricingPlans.currentPlan &&
      pricingPlans.selectedProduct &&
      step === Steps.Buy ? (
        <>
          <View
            style={{
              width: "100%",
              paddingHorizontal: DefaultAppStyles.GAP
            }}
          >
            <Heading>{pricingPlans.currentPlan.name} plan</Heading>
            <Paragraph>{pricingPlans.currentPlan.description}</Paragraph>
          </View>
          <BuyPlan
            planId={pricingPlans.currentPlan?.id}
            productId={pricingPlans.selectedProduct?.productId}
            goBack={() => {}}
            goNext={() => {}}
          />
        </>
      ) : null}
    </View>
  );
}

PaywallSheet.present = <Tid extends FeatureId>(feature: FeatureResult<Tid>) => {
  presentSheet({
    component: <PaywallSheet feature={feature} />
  });
};
