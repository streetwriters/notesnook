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
import { Button, Dialog, Flex, Text, ThemeScope } from "@ui";
import { Loading, Coupon } from "../../components/icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { PaddleCheckout } from "./paddle";
import { Features } from "./features";
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
import { strings } from "@notesnook/intl";
import { Period, SubscriptionPlan, User } from "@notesnook/core";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import dayjs from "dayjs";
import { PromptDialog } from "../prompt";
import { IconTag } from "../components/icon-tag";
import { usePromise } from "@notesnook/common";
import { getCurrencySymbol } from "../../common/currencies";
import { environment } from "@platform";

type BuyDialogProps = BaseDialogProps<false> & {
  couponCode?: string;
  coupon?: string;
  plan?: string;
  onShowPlans?: () => void;
  onCheckoutComplete?: () => void;
  onClose: () => void;
};

export const BuyDialog = DialogManager.register(function BuyDialog(
  props: BuyDialogProps
) {
  const { onClose, onShowPlans, onCheckoutComplete } = props;
  const couponCode = props.couponCode ?? props.coupon;

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
    <Dialog
      isOpen={true}
      width="868px"
      onClose={() => onClose(false)}
      noScroll={!!selectedPlan}
    >
      {selectedPlan ? (
        <Flex
          sx={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            flexDirection: ["column", "column", "row"],
            bg: "background"
          }}
        >
          <ThemeScope scope="navigationMenu">
            <Flex
              sx={{
                flexDirection: "column",
                bg: "background",
                flexShrink: 0,
                width: 350,
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
            </Flex>
          </ThemeScope>
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
              {strings.selectAPlan()}
            </Text>
            <Text
              variant="title"
              sx={{ mt: 1, color: "heading-secondary", textAlign: "center" }}
            >
              {strings.oneSubscriptionLifetimeNotes()}
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
    </Dialog>
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
    <Flex sx={{ flexDirection: "column" }}>
      <Text variant="heading" sx={{ mt: 4, textAlign: "center" }}>
        Notesnook
      </Text>
      <Text variant="body" sx={{ mt: 1, textAlign: "center" }}>
        {strings.alreadySubscribedChangeFromSettings()}
      </Text>
    </Flex>
  );
}

export function CheckoutCompleted(props: {
  onClose: () => void;
  buttonText?: string;
}) {
  const { onClose, buttonText } = props;

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Text variant="heading" sx={{ mt: 4, textAlign: "center" }}>
        {strings.youAreAwesome()}
      </Text>
      <Text variant="body" sx={{ mt: 1, textAlign: "center" }}>
        {strings.thankYouForSupportingPrivacy()}
      </Text>
      <Button
        variant="accent"
        sx={{ mt: 2, borderRadius: 100, px: 6 }}
        onPress={onClose}
        testID="see-all-plans"
      >
        <Text>{buttonText || strings.continue()}</Text>
      </Button>
    </Flex>
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
    <Flex sx={{ flexDirection: "column" }}>
      <Text variant="title">{strings.orderSummary()}</Text>
      <Flex
        sx={{
          flexDirection: "column",
          gap: 1,
          mt: 2,
          borderBottom: "1px solid",
          mb: 2,
          pb: 2
        }}
      >
        <Flex sx={{ justifyContent: "space-between" }}>
          <Text
            testID="checkout-plan-title"
            variant="body"
            sx={{ fontWeight: "bold", color: "heading" }}
          >
            {strings.plan(PLAN_METADATA[plan.plan].title)}
          </Text>
          <Text variant="body">
            {getCurrencySymbol(plan.currency)}
            {plan.price.gross}
            {formatRecurringPeriodShort(plan.period)}
          </Text>
        </Flex>
        <Flex sx={{ justifyContent: "space-between" }}>
          <Text variant="body">
            {strings.billedPeriod(formatRecurringPeriod(plan.period))}
          </Text>
          <Button variant="anchor" onPress={onChangePlan}>
            <Text>{strings.changePlan()}</Text>
          </Button>
        </Flex>
        {upsellDetails.status === "fulfilled" && upsellDetails.value ? (
          <Button
            variant="accentSecondary"
            sx={{ color: "accent", textAlign: "left" }}
            onPress={() => selectPlan(upsellDetails.value?.plan)}
          >
            {upsellDetails.value.text}
          </Button>
        ) : null}
      </Flex>
      <CheckoutPricing pricingInfo={pricingInfo} />
    </Flex>
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
    <Flex sx={{ flexDirection: "column" }}>
      {environment.isTesting ? (
        <Flex sx={{ flexDirection: "column" }}>
          <Flex testID={`checkout-plan-country-${pricingInfo.country}`} />
          {pricingInfo.coupon && <Flex testID="checkout-plan-coupon-applied" />}
        </Flex>
      ) : null}
      <Flex
        sx={{
          flexDirection: "column",
          gap: 1,
          borderBottom: "1px solid",
          mb: 2,
          pb: 2
        }}
      >
        <Flex sx={{ justifyContent: "space-between" }}>
          <Flex sx={{ flexDirection: "column" }}>
            <Text variant="body" sx={{ color: "heading" }}>
              {strings.today()}
            </Text>
            {pricingInfo.price.trial_period ? (
              <Text variant="subBody">
                {strings.freeTrialDays(
                  pricingInfo.price.trial_period.frequency
                )}
              </Text>
            ) : null}
          </Flex>
          {pricingInfo.price.trial_period ? (
            <Text variant="body" sx={{ color: "heading" }}>
              {formatPrice(0, pricingInfo.price.currency)}
            </Text>
          ) : (
            <Text variant="body" sx={{ color: "heading" }}>
              {pricingInfo.price.subtotal}
            </Text>
          )}
        </Flex>
        {pricingInfo.price.trial_period ? (
          <Flex sx={{ flexDirection: "column" }}>
            <Flex sx={{ width: 2, bg: "border", height: 20 }} />
            <Flex sx={{ justifyContent: "space-between" }}>
              <Flex sx={{ flexDirection: "column" }}>
                <Text variant="body" sx={{ color: "heading" }}>
                  {strings.afterFreeTrialDays(
                    pricingInfo.price.trial_period.frequency
                  )}
                </Text>
                <Text variant="subBody">
                  {dayjs()
                    .add(pricingInfo.price.trial_period.frequency, "days")
                    .format("YYYY-MM-DD")}{" "}
                </Text>
              </Flex>
              <Text variant="body" sx={{ color: "heading" }}>
                {pricingInfo.price.subtotal}
              </Text>
            </Flex>
          </Flex>
        ) : null}

        {pricingInfo.recurringPrice ? (
          <Flex sx={{ flexDirection: "column" }}>
            <Flex sx={{ width: 2, bg: "border", height: 20 }} />
            <Flex sx={{ justifyContent: "space-between" }}>
              <Flex sx={{ flexDirection: "column" }}>
                <Text variant="body" sx={{ color: "heading" }}>
                  {pricingInfo.period === "monthly"
                    ? strings.nextMonth()
                    : pricingInfo.period === "yearly"
                    ? strings.nextYear()
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
              <Text variant="body" sx={{ color: "heading" }}>
                {pricingInfo.recurringPrice.subtotal}
              </Text>
            </Flex>
          </Flex>
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
          testID={`checkout-price-item`}
        >
          <Text variant="body" testID={`label`} color="paragraph-secondary">
            {strings.salesTax()}
          </Text>
          <Text
            testID={`value`}
            variant="body"
            sx={{ color: "paragraph-secondary" }}
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
          testID={`checkout-price-item`}
        >
          <Text variant="body" testID={`label`} color="paragraph-secondary">
            {strings.discount()}
          </Text>
          {isApplyingCoupon ? (
            <Loading size={14} />
          ) : pricingInfo.coupon ? (
            <Flex sx={{ alignItems: "center", gap: 1 }}>
              <IconTag icon={Coupon} text={pricingInfo.coupon} />
              <Text
                testID={`value`}
                variant="body"
                sx={{ color: "paragraph-secondary" }}
              >
                {price.discount}
              </Text>
            </Flex>
          ) : (
            <Button
              variant="anchor"
              onPress={async () => {
                const code = await PromptDialog.show({
                  title: strings.discountCode(),
                  defaultValue: pricingInfo.coupon,
                  label: strings.enterDiscountCode()
                });
                if (code) applyCoupon(code);
              }}
            >
              {strings.addDiscount()}
            </Button>
          )}
        </Flex>
        <Flex
          sx={{ justifyContent: "space-between", alignSelf: "stretch" }}
          testID={`checkout-price-item`}
        >
          <Text variant="title" testID={`label`}>
            {strings.totalForToday()}
          </Text>
          {price.trial_period ? (
            <Text variant="title" sx={{ textAlign: "right" }}>
              {formatPrice(0, pricingInfo.price.currency)}
            </Text>
          ) : (
            <Text testID={`value`} variant="title" sx={{ textAlign: "right" }}>
              {price.total}
            </Text>
          )}
        </Flex>
        <Text variant="subBody" sx={{ mt: 2 }}>
          {strings.cancelAnytime()}{" "}
          {strings.dayMoneyBackGuarantee(
            PERIOD_METADATA[pricingInfo.period].refundDays
          )}
        </Text>
      </Flex>
    </Flex>
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
    text: strings.savePercentBySwitchingPlan(
      savings,
      PERIOD_METADATA[nextPlan.period].title
    ),
    plan: nextPlan
  };
}
