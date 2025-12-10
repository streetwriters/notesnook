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

import { useCallback, useEffect } from "react";
import { Text, Flex, Button, Box, Image } from "@theme-ui/components";
import { Loading, Coupon } from "../../components/icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import Rocket from "../../assets/rocket.svg?url";
import { Features } from "./features";
import { PaddleCheckout } from "./paddle";
import { Plan, PricingInfo } from "./types";
import { getPlans, PERIOD_METADATA, PLAN_METADATA } from "./plans";
import {
  ComparePlans,
  Footer,
  formatRecurringPeriod,
  formatRecurringPeriodShort,
  PlansList
} from "./plan-list";
import { useCheckoutStore } from "./store";
import { formatPrice, toPricingInfo } from "./helpers";
import { isUserSubscribed } from "../../hooks/use-is-user-premium";
import BaseDialog from "../../components/dialog";
import { ScopedThemeProvider } from "../../components/theme-provider";
import { Period, SubscriptionPlan, User } from "@notesnook/core";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import dayjs from "dayjs";
import { PromptDialog } from "../prompt";
import IconTag from "../../components/icon-tag";
import { usePromise } from "@notesnook/common";
import { getCurrencySymbol } from "../../common/currencies";

type BuyDialogProps = BaseDialogProps<false> & {
  couponCode?: string;
  onShowPlans?: () => void;
  onCheckoutComplete?: () => void;
  onClose: () => void;
};

export const BuyDialog = DialogManager.register(function BuyDialog(
  props: BuyDialogProps
) {
  const { onClose, onShowPlans, onCheckoutComplete, couponCode } = props;

  const applyCoupon = useCheckoutStore((store) => store.applyCoupon);
  const user = useUserStore((store) => store.user);
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const selectPlan = useCheckoutStore((state) => state.selectPlan);

  useEffect(() => {
    return () => {
      useCheckoutStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    if (couponCode) applyCoupon(couponCode);
  }, [couponCode, applyCoupon]);

  return (
    <BaseDialog
      isOpen={true}
      width={"868px"}
      onClose={() => onClose(false)}
      noScroll={!!selectedPlan}
      sx={{
        width: ["95%", "80%", "60%"],
        height: ["auto", "auto", "80vw"]
      }}
    >
      {selectedPlan ? (
        <Flex
          sx={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            position: "relative",
            flexDirection: ["column", "column", "row"],
            alignSelf: "center",
            overflowY: ["scroll", "scroll", "hidden"],
            bg: "background"
          }}
        >
          <ScopedThemeProvider
            scope="navigationMenu"
            sx={{
              display: "flex",
              overflow: ["hidden", "hidden", "auto"],
              flexDirection: "column",
              backgroundColor: "background",
              flexShrink: 0,
              // alignItems: "center",
              // justifyContent: "center",
              width: ["100%", "100%", 350],
              p: 4
            }}
          >
            <CheckoutSideBar
              selectedPlan={selectedPlan}
              onShowPlans={
                onShowPlans ??
                (() => {
                  selectPlan(undefined);
                })
              }
              user={user}
            />
          </ScopedThemeProvider>
          <CheckoutDetails
            onComplete={onCheckoutComplete ?? (() => onClose(false))}
            user={user}
          />
        </Flex>
      ) : (
        <Flex sx={{ flexDirection: "column", py: 25, flex: 1, px: 25 }}>
          <Flex sx={{ flexDirection: "column", alignSelf: "center" }}>
            <Text
              id="select-plan"
              variant="heading"
              sx={{ textAlign: "center" }}
            >
              Select a plan
            </Text>
            <Text
              variant="title"
              mt={1}
              sx={{ color: "heading-secondary", textAlign: "center" }}
            >
              One subscription for a lifetime of notes.
            </Text>
          </Flex>
          <PlansList
            selectedPlan={user?.subscription?.productId}
            recommendedPlan={SubscriptionPlan.PRO}
            onPlanSelected={(plan) => selectPlan(plan)}
          />
          <Flex
            sx={{
              flexDirection: "column",
              mt: 100
            }}
          >
            <ComparePlans />
            <Footer />
          </Flex>
        </Flex>
      )}
    </BaseDialog>
  );
});

type SideBarProps = {
  selectedPlan: Plan;
  onShowPlans: () => void;
  user?: User;
};
export function CheckoutSideBar(props: SideBarProps) {
  const { onShowPlans, selectedPlan, user } = props;
  const pricingInfo = useCheckoutStore((state) => state.pricingInfo);

  if (user && selectedPlan)
    return (
      <SelectedPlan
        user={user}
        plan={selectedPlan}
        pricingInfo={pricingInfo}
        onChangePlan={onShowPlans}
      />
    );

  if (user && isUserSubscribed(user)) {
    return <AlreadyPremium />;
  }

  return null;
}

export function CheckoutDetails({
  user,
  onComplete
}: {
  user?: { id: string; email: string };
  onComplete: () => void;
}) {
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const onPriceUpdated = useCheckoutStore((state) => state.updatePrice);
  const couponCode = useCheckoutStore((store) => store.couponCode);
  const setIsApplyingCoupon = useCheckoutStore(
    (store) => store.setIsApplyingCoupon
  );
  const theme = useThemeStore((store) => store.colorScheme);

  if (selectedPlan && user)
    return (
      <PaddleCheckout
        plan={selectedPlan}
        theme={theme}
        user={user}
        coupon={couponCode}
        onCompleted={onComplete}
        onPriceUpdated={(pricingInfo) => {
          onPriceUpdated(pricingInfo);
          setIsApplyingCoupon(false);
        }}
      />
    );

  return <Features />;
}

function AlreadyPremium() {
  return (
    <>
      <Image src={Rocket} style={{ flexShrink: 0, width: 200, height: 200 }} />
      <Text variant="heading" mt={4} sx={{ textAlign: "center" }}>
        Notesnook
      </Text>
      <Text variant="body" mt={1} sx={{ textAlign: "center" }}>
        You already have a Notesnook subscription. You can change your plan from
        Settings {">"} Subscription details.
      </Text>
    </>
  );
}

export function CheckoutCompleted(props: {
  onClose: () => void;
  buttonText?: string;
}) {
  const { onClose, buttonText } = props;

  return (
    <>
      <Image src={Rocket} style={{ flexShrink: 0, width: 200, height: 200 }} />
      <Text variant="heading" mt={4} sx={{ textAlign: "center" }}>
        You are awesome!
      </Text>
      <Text variant="body" mt={1} sx={{ textAlign: "center" }}>
        Thank you for supporting privacy! Your subscription is now active.
      </Text>
      <Button
        variant="accent"
        mt={2}
        sx={{ borderRadius: 100, px: 6 }}
        onClick={onClose}
        data-test-id="see-all-plans"
      >
        {buttonText || "Continue"}
      </Button>
    </>
  );
}

type SelectedPlanProps = {
  plan: Plan;
  user: User;
  pricingInfo: PricingInfo | undefined;
  onChangePlan?: () => void;
};
function SelectedPlan(props: SelectedPlanProps) {
  const {
    plan,
    user,
    pricingInfo = toPricingInfo(plan, user),
    onChangePlan
  } = props;
  const selectPlan = useCheckoutStore((store) => store.selectPlan);
  const upsellDetails = usePromise(() => getUpsellDetails(plan), [plan]);

  return (
    <>
      <Text variant="title">Order summary</Text>
      <Flex
        sx={{
          flexDirection: "column",
          gap: 1,
          mt: 2,
          borderBottom: "1px solid var(--border)",
          mb: 2,
          pb: 2
        }}
      >
        <Flex sx={{ justifyContent: "space-between" }}>
          <Text
            data-test-id="checkout-plan-title"
            variant="body"
            sx={{ fontWeight: "bold", color: "heading" }}
          >
            {PLAN_METADATA[plan.plan].title} plan
          </Text>
          <Text variant="body">
            {getCurrencySymbol(plan.currency)}
            {plan.price.gross}
            {formatRecurringPeriodShort(plan.period)}
          </Text>
        </Flex>
        <Flex sx={{ justifyContent: "space-between" }}>
          <Text variant="body">
            Billed {formatRecurringPeriod(plan.period)}
          </Text>
          <Button variant="anchor" onClick={onChangePlan}>
            Change plan
          </Button>
        </Flex>
        {upsellDetails.status === "fulfilled" && upsellDetails.value ? (
          <Button
            variant="accentSecondary"
            sx={{ color: "accent", textAlign: "left" }}
            onClick={() => selectPlan(upsellDetails.value?.plan)}
          >
            {upsellDetails.value.text}
          </Button>
        ) : null}
      </Flex>
      <CheckoutPricing pricingInfo={pricingInfo} />
    </>
  );
}

type CheckoutPricingProps = {
  pricingInfo: PricingInfo;
};
export function CheckoutPricing(props: CheckoutPricingProps) {
  const { pricingInfo } = props;
  const { price } = pricingInfo;

  const [isApplyingCoupon, setIsApplyingCoupon] = useCheckoutStore((store) => [
    store.isApplyingCoupon,
    store.setIsApplyingCoupon
  ]);

  const onApplyCoupon = useCheckoutStore((store) => store.applyCoupon);

  const applyCoupon = useCallback(
    (code: string) => {
      setIsApplyingCoupon(true);
      onApplyCoupon(code);
    },
    [onApplyCoupon, setIsApplyingCoupon]
  );

  const removeCoupon = useCallback(() => {
    setIsApplyingCoupon(true);
    onApplyCoupon(undefined);
  }, [onApplyCoupon, setIsApplyingCoupon]);

  // useEffect(() => {
  //   setIsApplyingCoupon(false);

  //   if (pricingInfo.invalidCoupon) return;

  //   const pricingInfoCoupon = pricingInfo.coupon || "";
  //   if (couponValue !== pricingInfoCoupon) {
  //     onApplyCoupon(pricingInfo.coupon);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [pricingInfo, onApplyCoupon, setIsApplyingCoupon]);

  return (
    <>
      {IS_TESTING ? (
        <>
          <span data-test-id={`checkout-plan-country-${pricingInfo.country}`} />
          {pricingInfo.coupon && (
            <span data-test-id={`checkout-plan-coupon-applied`} />
          )}
        </>
      ) : null}
      <Flex
        sx={{
          flexDirection: "column",
          gap: 1,
          borderBottom: "1px solid var(--border)",
          mb: 2,
          pb: 2
        }}
      >
        <Flex sx={{ justifyContent: "space-between" }}>
          <Flex sx={{ flexDirection: "column" }}>
            <Text variant="body" color="heading">
              Today
            </Text>
            {pricingInfo.price.trial_period ? (
              <Text variant="subBody">
                {pricingInfo.price.trial_period.frequency} day free trial
              </Text>
            ) : null}
          </Flex>
          {pricingInfo.price.trial_period ? (
            <Text variant="body" color="heading">
              {formatPrice(0, pricingInfo.price.currency)}
            </Text>
          ) : (
            <Text variant="body" color="heading">
              {pricingInfo.price.subtotal}
            </Text>
          )}
        </Flex>
        {pricingInfo.price.trial_period ? (
          <>
            <Box sx={{ width: "2px", bg: "border", height: "20px" }} />
            <Flex sx={{ justifyContent: "space-between" }}>
              <Flex sx={{ flexDirection: "column" }}>
                <Text variant="body" color="heading">
                  After {pricingInfo.price.trial_period.frequency} day free
                  trial
                </Text>
                <Text variant="subBody">
                  {dayjs()
                    .add(pricingInfo.price.trial_period.frequency, "days")
                    .format("YYYY-MM-DD")}{" "}
                </Text>
              </Flex>
              <Text variant="body" color="heading">
                {pricingInfo.price.subtotal}
              </Text>
            </Flex>
          </>
        ) : null}

        {pricingInfo.recurringPrice ? (
          <>
            <Box sx={{ width: "2px", bg: "border", height: "20px" }} />
            <Flex sx={{ justifyContent: "space-between" }}>
              <Flex sx={{ flexDirection: "column" }}>
                <Text variant="body" color="heading">
                  {pricingInfo.period === "monthly"
                    ? "Next month"
                    : pricingInfo.period === "yearly"
                    ? "Next year"
                    : dayjs()
                        .add(5, "year")
                        .add(
                          pricingInfo.price.trial_period?.frequency || 0,
                          "days"
                        )
                        .format("YYYY-MM-DD")}
                </Text>
                {pricingInfo.period === "monthly" ||
                pricingInfo.period === "yearly" ? (
                  <Text variant="subBody">
                    {pricingInfo.period === "monthly"
                      ? dayjs()
                          .add(1, "month")
                          .add(
                            pricingInfo.price.trial_period?.frequency || 0,
                            "days"
                          )
                          .format("YYYY-MM-DD")
                      : dayjs()
                          .add(1, "year")
                          .add(
                            pricingInfo.price.trial_period?.frequency || 0,
                            "days"
                          )
                          .format("YYYY-MM-DD")}
                  </Text>
                ) : null}
              </Flex>
              <Text variant="body" color="heading">
                {pricingInfo.recurringPrice.subtotal}
              </Text>
            </Flex>
          </>
        ) : null}
      </Flex>
      <Flex
        sx={{
          flexDirection: "column",
          gap: 1,
          mb: 2,
          pb: 2
        }}
      >
        <Flex
          sx={{ justifyContent: "space-between", alignSelf: "stretch" }}
          data-test-id={`checkout-price-item`}
        >
          <Text
            variant="body"
            data-test-id={`label`}
            color="paragraph-secondary"
          >
            Sales tax
          </Text>
          <Text
            data-test-id={`value`}
            variant="body"
            color="paragraph-secondary"
          >
            {price.tax}
          </Text>
        </Flex>
        <Flex
          sx={{
            justifyContent: "space-between",
            alignSelf: "stretch",
            alignItems: "center"
          }}
          data-test-id={`checkout-price-item`}
        >
          <Text
            variant="body"
            data-test-id={`label`}
            color="paragraph-secondary"
          >
            Discount
          </Text>
          {isApplyingCoupon ? (
            <Loading size={14} />
          ) : pricingInfo.coupon ? (
            <Flex sx={{ alignItems: "center", gap: 1 }}>
              <IconTag
                icon={Coupon}
                text={pricingInfo.coupon}
                onDismiss={() => removeCoupon()}
              />
              <Text
                data-test-id={`value`}
                variant="body"
                color="paragraph-secondary"
              >
                {price.discount}
              </Text>
            </Flex>
          ) : (
            <Button
              variant="anchor"
              onClick={async () => {
                const code = await PromptDialog.show({
                  title: "Enter discount code",
                  defaultValue: pricingInfo.coupon
                });
                if (code) applyCoupon(code);
              }}
            >
              Add discount
            </Button>
          )}
        </Flex>
        <Flex
          sx={{ justifyContent: "space-between", alignSelf: "stretch" }}
          data-test-id={`checkout-price-item`}
        >
          <Text variant="title" data-test-id={`label`}>
            Total for today
          </Text>
          {price.trial_period ? (
            <Text as="div" variant="title" sx={{ textAlign: "end" }}>
              {formatPrice(0, pricingInfo.price.currency)}
            </Text>
          ) : (
            <Text
              data-test-id={`value`}
              variant="title"
              sx={{ textAlign: "end" }}
            >
              {price.total}
            </Text>
          )}
        </Flex>
        <Text variant="subBody" sx={{ mt: 2 }}>
          Cancel anytime. {PERIOD_METADATA[pricingInfo.period].refundDays}-day
          money-back guarantee.
        </Text>
      </Flex>
    </>
  );
}

async function getUpsellDetails(plan: Plan) {
  const plans = await getPlans();
  if (!plans) return;

  const nextPeriod: Period = plan.period === "5-year" ? "5-year" : "yearly";
  const nextPlan = plans.find(
    (p) =>
      p.plan === plan.plan &&
      p.period !== plan.period &&
      p.period === nextPeriod
  );
  if (!nextPlan) return;
  const divider = nextPeriod === "yearly" ? 12 : 5;
  const dividedPrice = nextPlan.price.gross / divider;
  const savings = (100 - (dividedPrice / plan.price.gross) * 100).toFixed(0);

  return {
    text: `Save ${savings}% by switching to ${nextPlan.period} plan.`,
    plan: nextPlan
  };
}
