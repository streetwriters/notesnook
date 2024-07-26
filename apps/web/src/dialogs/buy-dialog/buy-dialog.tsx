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
import { Text, Flex, Button, Link } from "@theme-ui/components";
import { Cross, Check, Loading } from "../../components/icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { useTheme } from "@emotion/react";
import Rocket from "../../assets/rocket.svg?react";
import WorkAnywhere from "../../assets/workanywhere.svg?react";
import WorkLate from "../../assets/worklate.svg?react";
import Field from "../../components/field";
import { hardNavigate } from "../../navigation";
import { Features } from "./features";
import { PaddleCheckout } from "./paddle";
import { Period, Plan, PricingInfo } from "./types";
import { PLAN_METADATA, usePlans } from "./plans";
import { formatPeriod, getFullPeriod, PlansList } from "./plan-list";
import { showToast } from "../../utils/toast";
import { TaskManager } from "../../common/task-manager";
import { db } from "../../common/db";
import { useCheckoutStore } from "./store";
import { getCurrencySymbol } from "./helpers";
import { Theme } from "@notesnook/theme";
import { isMacStoreApp } from "../../utils/platform";
import { isUserSubscribed } from "../../hooks/use-is-user-premium";
import { SUBSCRIPTION_STATUS } from "../../common/constants";
import BaseDialog from "../../components/dialog";
import { ScopedThemeProvider } from "../../components/theme-provider";
import { User } from "@notesnook/core";
import { BaseDialogProps, DialogManager } from "../../common/dialog-manager";

type BuyDialogProps = BaseDialogProps<false> & {
  couponCode?: string;
  plan?: "monthly" | "yearly" | "education";
};

export const BuyDialog = DialogManager.register(function BuyDialog(
  props: BuyDialogProps
) {
  const { onClose, couponCode, plan } = props;
  const theme = useTheme() as Theme;

  const onApplyCoupon = useCheckoutStore((store) => store.applyCoupon);
  const isCheckoutCompleted = useCheckoutStore((store) => store.isCompleted);

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
          <SideBar onClose={() => onClose(false)} initialPlan={plan} />
        </ScopedThemeProvider>
        <Details />
      </Flex>
    </BaseDialog>
  );
});

type SideBarProps = {
  initialPlan?: Period;
  onClose: () => void;
};
function SideBar(props: SideBarProps) {
  const { initialPlan, onClose } = props;
  const [showPlans, setShowPlans] = useState(false);
  const onPlanSelected = useCheckoutStore((state) => state.selectPlan);
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const pricingInfo = useCheckoutStore((state) => state.pricingInfo);
  const user = useUserStore((store) => store.user);
  const couponCode = useCheckoutStore((store) => store.couponCode);
  const onApplyCoupon = useCheckoutStore((store) => store.applyCoupon);
  const isCheckoutCompleted = useCheckoutStore((store) => store.isCompleted);

  if (isCheckoutCompleted) return <CheckoutCompleted onClose={onClose} />;

  if (user && selectedPlan)
    return (
      <SelectedPlan
        plan={selectedPlan}
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
      <AlreadyPremium user={user} onShowPlans={() => setShowPlans(true)} />
    );
  }

  if (user && (showPlans || !!initialPlan))
    return (
      <PlansList
        onPlansLoaded={(plans) => {
          if (!initialPlan || showPlans) return;
          const plan = plans.find((p) => p.period === initialPlan);
          onPlanSelected(plan);
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
            title: "Activating trial",
            action: () => db.user.activateTrial()
          });
          if (result) onClose();
        } catch (e) {
          if (e instanceof Error)
            showToast(
              "error",
              `Could not activate trial. Please try again. Error: ${e.message}`
            );
        }
      }}
    />
  );
}

function Details() {
  const user = useUserStore((store) => store.user);
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const onPriceUpdated = useCheckoutStore((state) => state.updatePrice);
  const completeCheckout = useCheckoutStore((state) => state.completeCheckout);
  const isCheckoutCompleted = useCheckoutStore((store) => store.isCompleted);
  const couponCode = useCheckoutStore((store) => store.couponCode);
  const setIsApplyingCoupon = useCheckoutStore(
    (store) => store.setIsApplyingCoupon
  );
  const theme = useThemeStore((store) => store.colorScheme);

  if (isCheckoutCompleted) return null;

  if (selectedPlan && user)
    return (
      <PaddleCheckout
        plan={selectedPlan}
        theme={theme}
        user={user}
        coupon={couponCode}
        onCompleted={completeCheckout}
        onCouponApplied={() => setIsApplyingCoupon(true)}
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
      <Rocket style={{ flexShrink: 0, width: 200, height: 200 }} />
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
          Starting from {getCurrencySymbol(plan.currency)}
          {plan.price.gross}
          {formatPeriod(plan.period)}
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
  user: User | undefined;
  onShowPlans: () => void;
};
function AlreadyPremium(props: AlreadyPremiumProps) {
  const { user, onShowPlans } = props;

  const isCanceled =
    user?.subscription?.type === SUBSCRIPTION_STATUS.PREMIUM_CANCELED;

  return (
    <>
      <Rocket style={{ flexShrink: 0, width: 200, height: 200 }} />
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

function CheckoutCompleted(props: { onClose: () => void }) {
  const { onClose } = props;

  return (
    <>
      <Rocket style={{ flexShrink: 0, width: 200, height: 200 }} />
      <Text variant="heading" mt={4} sx={{ textAlign: "center" }}>
        Thank you!
      </Text>
      <Text variant="body" mt={1} sx={{ textAlign: "center" }}>
        You have successfully subscribed to Notesnook Pro.
      </Text>
      <Button
        variant="accent"
        mt={2}
        sx={{ borderRadius: 100, px: 6 }}
        onClick={onClose}
        data-test-id="see-all-plans"
      >
        Continue
      </Button>
    </>
  );
}

type SelectedPlanProps = {
  plan: Plan;
  pricingInfo: PricingInfo | undefined;
  onChangePlan?: () => void;
};
function SelectedPlan(props: SelectedPlanProps) {
  const { plan, pricingInfo, onChangePlan } = props;
  const metadata = PLAN_METADATA[plan.period];
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
      {plan.period === "monthly" ? (
        <WorkAnywhere style={{ flexShrink: 0, width: 180, height: 180 }} />
      ) : (
        <WorkLate style={{ flexShrink: 0, width: 180, height: 180 }} />
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
        {metadata.title}
      </Text>
      {plan.period === "education" && (
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
          <Text data-test-id={`checkout-plan-country-${pricingInfo.country}`} />
          {pricingInfo.coupon && (
            <Text data-test-id={`checkout-plan-coupon-applied`} />
          )}

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
function CheckoutPricing(props: CheckoutPricingProps) {
  const { pricingInfo } = props;
  const { currency, price, discount, period, recurringPrice } = pricingInfo;
  const fields = [
    {
      key: "subtotal",
      label: "Subtotal",
      value: formatPrice(currency, price.net.toFixed(2), null)
    },
    {
      key: "tax",
      label: "Sales tax",
      color: "red",
      value: formatPrice(currency, price.tax.toFixed(2), null)
    },
    {
      key: "discount",
      label: "Discount",
      color: "accent",
      value: formatPrice(
        currency,
        discount.amount.toFixed(2),
        null,
        discount.amount > 0
      )
    }
  ];

  const isDiscounted = discount.recurring || discount.amount <= 0;
  const currentTotal = formatPrice(
    currency,
    (price.gross - discount.amount).toFixed(2),
    isDiscounted ? period : undefined
  );
  const recurringTotal = formatPrice(
    currency,
    recurringPrice.gross.toFixed(2),
    period
  );
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
            sx={{ fontSize: "subtitle" }}
            data-test-id={`label`}
          >
            {field.label}
          </Text>
          <Text
            data-test-id={`value`}
            variant="body"
            sx={{ fontSize: "subtitle", color: field.color || "paragraph" }}
          >
            {field.value}
          </Text>
        </Flex>
      ))}
      <Flex
        mt={1}
        sx={{ justifyContent: "space-between", alignSelf: "stretch" }}
        data-test-id={`checkout-price-item`}
      >
        <Text
          variant="body"
          sx={{ fontSize: "heading" }}
          data-test-id={`label`}
        >
          Total
        </Text>
        <Text as="div" variant="body" sx={{ textAlign: "end" }}>
          <Text
            data-test-id={`value`}
            sx={{ fontSize: "heading", color: "paragraph" }}
          >
            {currentTotal}
          </Text>
          <Text as="div" sx={{ fontSize: "body", color: "paragraph" }}>
            {period === "education" && discount.amount > 0
              ? "for one year"
              : isDiscounted
              ? "forever"
              : `first ${getFullPeriod(period)} then ${recurringTotal}`}
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
  const formattedPeriod = period ? formatPeriod(period) : "";
  const currencySymbol = getCurrencySymbol(currency);
  const prefix = negative ? "-" : "";
  return `${prefix}${currencySymbol}${price}${formattedPeriod}`;
}
