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

import { useCallback, useEffect, useRef, useState } from "react";
import { Text, Flex, Button, Link, Box, Image } from "@theme-ui/components";
import { Cross, Check, Loading } from "../../components/icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import Rocket from "../../assets/rocket.svg?url";
import WorkAnywhere from "../../assets/workanywhere.svg?url";
import WorkLate from "../../assets/worklate.svg?url";
import Field from "../../components/field";
import { hardNavigate } from "../../navigation";
import { Features } from "./features";
import { PaddleCheckout } from "./paddle";
import { Period, Plan, PlanId, Price, PricingInfo } from "./types";
import { usePlans } from "./plans";
import {
  formatRecurringPeriodShort,
  getFullPeriod,
  PlansList
} from "./plan-list";
import { showToast } from "../../utils/toast";
import { TaskManager } from "../../common/task-manager";
import { db } from "../../common/db";
import { useCheckoutStore } from "./store";
import { getCurrencySymbol } from "./helpers";
import { isMacStoreApp } from "../../utils/platform";
import { isUserSubscribed } from "../../hooks/use-is-user-premium";
import { SUBSCRIPTION_STATUS } from "../../common/constants";
import BaseDialog from "../../components/dialog";
import { ScopedThemeProvider } from "../../components/theme-provider";
import { User } from "@notesnook/core";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";
import { strings } from "@notesnook/intl";

type BuyDialogProps = BaseDialogProps<false> & {
  couponCode?: string;
  plan?: PlanId;
  onClose: () => void;
};

export const BuyDialog = DialogManager.register(function BuyDialog(
  props: BuyDialogProps
) {
  const { onClose, couponCode, plan } = props;

  const onApplyCoupon = useCheckoutStore((store) => store.applyCoupon);
  const isCheckoutCompleted = useCheckoutStore((store) => store.isCompleted);
  const user = useUserStore((store) => store.user);

  useEffect(() => {
    return () => {
      useCheckoutStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    if (couponCode) onApplyCoupon(couponCode);
  }, [couponCode, onApplyCoupon]);

  return (
    <BaseDialog
      isOpen={true}
      width={"868px"}
      onClose={() => props.onClose(false)}
      noScroll
      sx={{
        bg: "transparent",
        width: ["95%", "80%", isCheckoutCompleted ? "400px" : "60%"]
      }}
    >
      <Flex
        bg="transparent"
        sx={{
          height: ["auto", "auto", "80vw"],
          width: "100%",
          overflow: "hidden",
          position: "relative",
          flexDirection: ["column", "column", "row"],
          alignSelf: "center",
          overflowY: ["scroll", "scroll", "hidden"]
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
            alignItems: "center",
            justifyContent: "center",
            width: ["100%", "100%", isCheckoutCompleted ? "100%" : 350],
            p: 4,
            py: 50
          }}
        >
          <CheckoutSideBar
            onClose={() => onClose(false)}
            initialPlan={plan || "free"}
            user={user}
          />
        </ScopedThemeProvider>
        <CheckoutDetails user={user} />
      </Flex>
    </BaseDialog>
  );
});

type SideBarProps = {
  initialPlan: PlanId;
  onClose: () => void;
  user?: User;
};
export function CheckoutSideBar(props: SideBarProps) {
  const { initialPlan, onClose, user } = props;
  const [showPlans, setShowPlans] = useState(false);
  const onPlanSelected = useCheckoutStore((state) => state.selectPlan);
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const selectedPrice = useCheckoutStore((state) => state.selectedPrice);
  const pricingInfo = useCheckoutStore((state) => state.pricingInfo);
  const couponCode = useCheckoutStore((store) => store.couponCode);
  const onApplyCoupon = useCheckoutStore((store) => store.applyCoupon);
  const isCheckoutCompleted = useCheckoutStore((store) => store.isCompleted);

  if (isCheckoutCompleted) return <CheckoutCompleted onClose={onClose} />;

  if (user && selectedPlan && selectedPrice)
    return (
      <SelectedPlan
        plan={selectedPlan}
        price={selectedPrice}
        pricingInfo={pricingInfo}
        onChangePlan={() => {
          onApplyCoupon(undefined);
          onPlanSelected(undefined);
          setShowPlans(true);
        }}
      />
    );

  if (user && !showPlans && isUserSubscribed(user)) {
    return (
      <AlreadyPremium
        isCanceled={
          user?.subscription?.type === SUBSCRIPTION_STATUS.PREMIUM_CANCELED
        }
        onShowPlans={() => setShowPlans(true)}
      />
    );
  }

  if (user)
    return (
      <PlansList
        selectedPlan={selectedPlan?.id || initialPlan || "free"}
        onPlansLoaded={(plans) => {
          // if (!initialPlan || showPlans) return;
          // const plan = plans.find((p) => p.id === initialPlan);
          // onPlanSelected(plan);
        }}
        onPlanSelected={onPlanSelected}
      />
    );

  return (
    <TrialOrUpgrade
      couponCode={couponCode}
      user={user}
      onShowPlans={() => setShowPlans(true)}
      onTrialRequested={async () => {
        try {
          const result = await TaskManager.startTask({
            type: "status",
            id: "trialActivation",
            title: strings.activatingTrial(),
            action: () => db.user.activateTrial()
          });
          if (result) onClose();
        } catch (e) {
          if (e instanceof Error)
            showToast(
              "error",
              `${strings.couldNotActivateTrial()} ${strings.error()}: ${
                e.message
              }`
            );
        }
      }}
    />
  );
}

export function CheckoutDetails({
  user
}: {
  user?: { id: string; email: string };
}) {
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const selectedPrice = useCheckoutStore((state) => state.selectedPrice);
  const onPriceUpdated = useCheckoutStore((state) => state.updatePrice);
  const completeCheckout = useCheckoutStore((state) => state.completeCheckout);
  const isCheckoutCompleted = useCheckoutStore((store) => store.isCompleted);
  const couponCode = useCheckoutStore((store) => store.couponCode);
  const theme = useThemeStore((store) => store.colorScheme);
  if (isCheckoutCompleted) return null;

  if (selectedPlan && user && selectedPrice)
    return (
      <PaddleCheckout
        plan={selectedPlan}
        price={selectedPrice}
        theme={theme}
        user={user}
        coupon={couponCode}
        onCompleted={completeCheckout}
        onPriceUpdated={(pricingInfo) => {
          onPriceUpdated(pricingInfo);
          // console.log(
          //   initialCouponCode,
          //   "applying coupon",
          //   couponCode,
          //   pricingInfo.coupon
          // );

          // if (!initialCouponCode || initialCouponCode === couponCode) return;
          // console.log(initialCouponCode, "applying coupon");
          // onApplyCoupon(initialCouponCode);
        }}
      />
    );

  return <Features />;
}

type TrialOrUpgradeProps = {
  couponCode?: string;
  user: User | undefined;
  onShowPlans: () => void;
  onTrialRequested: () => void | Promise<void>;
};
function TrialOrUpgrade(props: TrialOrUpgradeProps) {
  const { user, onShowPlans, onTrialRequested, couponCode } = props;
  const { isLoading, plans } = usePlans();
  const plan = plans[0];

  return (
    <>
      <Image src={Rocket} style={{ flexShrink: 0, width: 200, height: 200 }} />
      <Text variant="heading" mt={4} sx={{ textAlign: "center" }}>
        Notesnook Pro
      </Text>
      <Text variant="body" mt={1} sx={{ textAlign: "center" }}>
        Ready to take the next step in your private note taking journey?
      </Text>
      {isLoading || !plan ? (
        <Loading sx={{ mt: 4 }} />
      ) : (
        <Text variant={"body"} mt={4} sx={{ fontSize: "title" }}>
          {/* Starting from {getCurrencySymbol(plan.currency)}
          {plan.price.gross}
          {formatPeriod(plan.period)} */}
        </Text>
      )}
      {isMacStoreApp() ? (
        <>
          <Text variant={"subBody"} mt={2} sx={{ textAlign: "center" }}>
            You cannot upgrade from the macOS app.
          </Text>
        </>
      ) : user ? (
        <>
          <Button
            variant="accent"
            mt={2}
            sx={{ borderRadius: 100, px: 6 }}
            onClick={onShowPlans}
            data-test-id="see-all-plans"
          >
            See all plans
          </Button>
          {!user.subscription || !user.subscription.expiry ? (
            <Button
              variant="secondary"
              mt={2}
              sx={{ borderRadius: 100, px: 6 }}
              onClick={onTrialRequested}
            >
              Try free for 14 days
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <Button
            variant="accent"
            mt={4}
            sx={{ borderRadius: 100, px: 6 }}
            onClick={() => hardNavigate("/signup")}
          >
            Sign up for free
          </Button>
          <Text variant={"subBody"} mt={2} sx={{ textAlign: "center" }}>
            After creating your account, you will be asked to activate your free
            trial. <b>No credit card is required.</b>
          </Text>
        </>
      )}

      {couponCode && (
        <Text
          variant="subBody"
          bg="shade"
          mt={4}
          p={1}
          sx={{ borderRadius: "default", color: "accent" }}
        >
          {user
            ? "Please select a plan to use your coupon:"
            : `Please sign up or login to use your coupon:`}{" "}
          <b>{couponCode}</b>
        </Text>
      )}
    </>
  );
}

type AlreadyPremiumProps = {
  isCanceled?: boolean;
  onShowPlans: () => void;
};
function AlreadyPremium(props: AlreadyPremiumProps) {
  const { isCanceled, onShowPlans } = props;
  return (
    <>
      <Image src={Rocket} style={{ flexShrink: 0, width: 200, height: 200 }} />
      <Text variant="heading" mt={4} sx={{ textAlign: "center" }}>
        Notesnook Pro
      </Text>
      {isCanceled ? (
        <>
          <Text variant="body" mt={1} sx={{ textAlign: "center" }}>
            Resubscribing to Notesnook Pro will replace your existing
            subscription.
          </Text>
          <Button
            variant="accent"
            mt={2}
            sx={{ borderRadius: 100, px: 6 }}
            onClick={onShowPlans}
            data-test-id="see-all-plans"
          >
            Continue
          </Button>
        </>
      ) : (
        <Text variant="body" mt={1} sx={{ textAlign: "center" }}>
          You are already subscribed to Notesnook Pro.
        </Text>
      )}
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
  price: Price;
  pricingInfo: PricingInfo | undefined;
  onChangePlan?: () => void;
};
function SelectedPlan(props: SelectedPlanProps) {
  const { plan, price, pricingInfo, onChangePlan } = props;
  const [isApplyingCoupon, setIsApplyingCoupon] = useCheckoutStore((store) => [
    store.isApplyingCoupon,
    store.setIsApplyingCoupon
  ]);

  const onApplyCoupon = useCheckoutStore((store) => store.applyCoupon);
  const couponInputRef = useRef<HTMLInputElement>(null);

  const applyCoupon = useCallback(() => {
    const coupon = couponInputRef.current?.value;
    if (!coupon) return;
    setIsApplyingCoupon(true);
    onApplyCoupon(coupon);
  }, [onApplyCoupon, setIsApplyingCoupon]);

  const removeCoupon = useCallback(() => {
    setIsApplyingCoupon(true);
    onApplyCoupon(undefined);
  }, [onApplyCoupon, setIsApplyingCoupon]);

  useEffect(() => {
    if (!couponInputRef.current) return;
    setIsApplyingCoupon(false);

    const couponValue = couponInputRef.current.value;

    if (pricingInfo?.invalidCoupon) return;

    const pricingInfoCoupon = pricingInfo?.coupon || "";
    if (couponValue !== pricingInfoCoupon) {
      couponInputRef.current.value = pricingInfoCoupon;
      onApplyCoupon(pricingInfo?.coupon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingInfo, onApplyCoupon, setIsApplyingCoupon]);

  return (
    <>
      {price.period === "monthly" ? (
        <Image
          src={WorkAnywhere}
          style={{ flexShrink: 0, width: 120, height: 120 }}
        />
      ) : (
        <Image
          src={WorkLate}
          style={{ flexShrink: 0, width: 120, height: 120 }}
        />
      )}
      <Text variant="heading" mt={4} sx={{ textAlign: "center" }}>
        Notesnook Pro
      </Text>
      <Text
        data-test-id="checkout-plan-title"
        variant="body"
        mt={1}
        sx={{ fontSize: "subheading", textAlign: "center" }}
      >
        {plan.title}
      </Text>
      {plan.id === "education" && (
        <Link
          href="https://notesnook.com/education"
          target="_blank"
          variant="text.body"
          mt={1}
          sx={{
            textDecorationColor: "primary",
            color: "primary",
            textAlign: "center"
          }}
        >
          Apply here to get your Education discount code.
        </Link>
      )}
      {pricingInfo ? (
        <>
          {IS_TESTING ? (
            <>
              <span
                data-test-id={`checkout-plan-country-${pricingInfo.country}`}
              />
              {pricingInfo.coupon && (
                <span data-test-id={`checkout-plan-coupon-applied`} />
              )}
            </>
          ) : null}

          <Field
            inputRef={couponInputRef}
            variant={pricingInfo.invalidCoupon ? "error" : "input"}
            sx={{ alignSelf: "stretch", my: 2 }}
            styles={{ input: { fontSize: "body" } }}
            data-test-id="checkout-coupon-code"
            id="coupon"
            name="coupon"
            placeholder={
              isApplyingCoupon ? "Applying coupon code..." : "Coupon code"
            }
            autoFocus={pricingInfo.invalidCoupon}
            disabled={!!pricingInfo?.coupon}
            onKeyUp={(e) => {
              if (e.code === "Enter") applyCoupon();
            }}
            action={{
              icon: isApplyingCoupon
                ? Loading
                : pricingInfo?.coupon
                ? Cross
                : Check,
              onClick: () =>
                pricingInfo?.coupon ? removeCoupon() : applyCoupon()
            }}
          />
          <CheckoutPricing pricingInfo={pricingInfo} />
          {onChangePlan && (
            <Button
              data-test-id="checkout-plan-change"
              variant="secondary"
              mt={4}
              px={4}
              sx={{ flexShrink: 0 }}
              onClick={onChangePlan}
            >
              Change plan
            </Button>
          )}
        </>
      ) : (
        <Loading sx={{ mt: 4 }} />
      )}
    </>
  );
}

type CheckoutPricingProps = {
  pricingInfo: PricingInfo;
};
export function CheckoutPricing(props: CheckoutPricingProps) {
  const { pricingInfo } = props;
  const { price, discount, period, recurringPrice } = pricingInfo;
  const fields = [
    {
      key: "subtotal",
      label: "Subtotal",
      value: price.subtotal
    },
    {
      key: "tax",
      label: "Sales tax",
      color: "red",
      value: price.tax
    },
    {
      key: "discount",
      label: "Discount",
      color: "green",
      value: price.discount
    }
  ];

  const isRecurringDiscount = !discount || discount.recurring;
  const currentTotal = price.total;
  const recurringTotal = recurringPrice ? recurringPrice.total : undefined;
  return (
    <>
      {fields.map((field) => (
        <Flex
          key={field.key}
          mt={1}
          sx={{ justifyContent: "space-between", alignSelf: "stretch" }}
          data-test-id={`checkout-price-item`}
        >
          <Text
            variant="body"
            data-test-id={`label`}
            sx={{ fontWeight: "bold" }}
          >
            {field.label}
          </Text>
          <Text
            data-test-id={`value`}
            variant="body"
            sx={{ color: field.color || "paragraph" }}
          >
            {field.value}
          </Text>
        </Flex>
      ))}
      <Box sx={{ my: 2, height: 1, bg: "separator" }} />
      <Flex
        mt={1}
        sx={{ justifyContent: "space-between", alignSelf: "stretch" }}
        data-test-id={`checkout-price-item`}
      >
        <Text variant="title" data-test-id={`label`}>
          Total
        </Text>
        <Text as="div" variant="title" sx={{ textAlign: "end" }}>
          <Text
            data-test-id={`value`}
            sx={{ fontSize: "title", color: "paragraph" }}
          >
            {currentTotal}
          </Text>
          <Text as="div" sx={{ fontSize: "body", color: "paragraph" }}>
            {recurringTotal
              ? isRecurringDiscount
                ? "forever"
                : `first ${getFullPeriod(period)} then ${recurringTotal}`
              : "for one year"}
          </Text>
        </Text>
      </Flex>
    </>
  );
}

function formatPrice(
  currency: string,
  price: string,
  period?: Period | null,
  negative = false
) {
  const formattedPeriod = period ? formatRecurringPeriodShort(period) : "";
  const currencySymbol = getCurrencySymbol(currency);
  const prefix = negative ? "-" : "";
  return `${prefix}${currencySymbol}${price}${formattedPeriod}`;
}
