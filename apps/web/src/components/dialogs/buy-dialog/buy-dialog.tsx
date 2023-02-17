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
import { Text, Flex, Button } from "@theme-ui/components";
import * as Icon from "../../icons";
import { useStore as useUserStore } from "../../../stores/user-store";
import { useStore as useThemeStore } from "../../../stores/theme-store";
import Modal from "react-modal";
import { useTheme } from "@emotion/react";
import { ReactComponent as Rocket } from "../../../assets/rocket.svg";
import { ReactComponent as WorkAnywhere } from "../../../assets/workanywhere.svg";
import { ReactComponent as WorkLate } from "../../../assets/worklate.svg";
import Field from "../../field";
import { hardNavigate } from "../../../navigation";
import { Features } from "./features";
import { PaddleCheckout } from "./paddle";
import { Period, Plan, PricingInfo } from "./types";
import { PLAN_METADATA, usePlans } from "./plans";
import { formatPeriod, getFullPeriod, PlansList } from "./plan-list";
import { showToast } from "../../../utils/toast";
import { TaskManager } from "../../../common/task-manager";
import { db } from "../../../common/db";
import { useCheckoutStore } from "./store";
import { getCurrencySymbol } from "./helpers";
import { Theme } from "@notesnook/theme";
import { isMacStoreApp } from "../../../utils/platform";
import { isUserSubscribed } from "../../../hooks/use-is-user-premium";
import { SUBSCRIPTION_STATUS } from "../../../common/constants";

type BuyDialogProps = {
  couponCode?: string;
  plan?: "monthly" | "yearly";
  onClose: () => void;
};

export function BuyDialog(props: BuyDialogProps) {
  const { onClose, couponCode, plan } = props;
  const theme = useTheme() as Theme;

  const onApplyCoupon = useCheckoutStore((store) => store.applyCoupon);
  useEffect(() => {
    return () => {
      useCheckoutStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    if (couponCode) onApplyCoupon(couponCode);
  }, [couponCode, onApplyCoupon]);

  return (
    <Modal
      isOpen={true}
      onRequestClose={props.onClose}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldFocusAfterRender
      onAfterOpen={(e) => {
        if (!e || !onClose) return;
        // we need this work around because ReactModal content spreads over the overlay
        const child = e.contentEl.firstElementChild;
        if (!child || !(child instanceof HTMLElement)) return;

        e.contentEl.onmousedown = function (e) {
          if (!e.screenX && !e.screenY) return;
          if (
            e.x < child.offsetLeft ||
            e.x > child.offsetLeft + child.clientWidth ||
            e.y < child.offsetTop ||
            e.y > child.offsetTop + child.clientHeight
          ) {
            onClose();
          }
        };
      }}
      style={{
        content: {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          justifyContent: "center",
          backgroundColor: undefined,
          padding: 0,
          overflowY: "hidden",
          border: 0,
          zIndex: 0
        },
        overlay: {
          zIndex: 999,
          background: theme.colors.backdrop
        }
      }}
    >
      <Flex
        bg="transparent"
        sx={{
          position: "relative",
          overflow: "hidden",
          boxShadow: "4px 5px 18px 2px #00000038",
          borderRadius: "dialog",
          flexDirection: ["column", "column", "row"],
          width: ["95%", "80%", "60%"],
          maxHeight: ["95%", "80%", "80%"],
          alignSelf: "center",
          overflowY: ["scroll", "scroll", "hidden"]
        }}
      >
        <Flex
          sx={{
            borderTopLeftRadius: "dialog",
            borderBottomLeftRadius: [0, 0, "dialog"],
            overflow: "hidden",
            bg: "bgSecondary",
            "@supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none))":
              {
                bg: "bgTransparent",
                backdropFilter: "blur(8px)"
              },
            flexDirection: "column",
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            width: ["100%", "100%", 350]
          }}
          p={4}
          py={50}
        >
          <SideBar onClose={onClose} initialPlan={plan} />
        </Flex>
        <Details />
      </Flex>
    </Modal>
  );
}

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

  if (user && selectedPlan)
    return (
      <SelectedPlan
        plan={selectedPlan}
        pricingInfo={pricingInfo}
        onChangePlan={() => {
          onApplyCoupon(undefined);
          onPlanSelected(undefined);
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
          if (!initialPlan) return;
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
            action: (report) => {
              report({
                text: "Activating trial"
              });
              return db.user?.activateTrial();
            }
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
  const couponCode = useCheckoutStore((store) => store.couponCode);
  const setIsApplyingCoupon = useCheckoutStore(
    (store) => store.setIsApplyingCoupon
  );
  const theme = useThemeStore((store) => store.theme);

  if (selectedPlan && user)
    return (
      <PaddleCheckout
        plan={selectedPlan}
        theme={theme}
        user={user}
        coupon={couponCode}
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
      <Rocket width={200} />
      <Text variant="heading" mt={4} sx={{ textAlign: "center" }}>
        Notesnook Pro
      </Text>
      <Text variant="body" mt={1} sx={{ textAlign: "center" }}>
        Ready to take the next step in your private note taking journey?
      </Text>
      {isLoading || !plan ? (
        <Icon.Loading sx={{ mt: 4 }} />
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
            variant="primary"
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
            variant="primary"
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
          sx={{ borderRadius: "default", color: "primary" }}
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
      <Rocket width={200} />
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
            variant="primary"
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
        <WorkAnywhere width={180} />
      ) : (
        <WorkLate width={180} />
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
            onKeyUp={(e: KeyboardEvent) => {
              if (e.code === "Enter") applyCoupon();
            }}
            action={{
              icon: isApplyingCoupon
                ? Icon.Loading
                : pricingInfo?.coupon
                ? Icon.Cross
                : Icon.Check,
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
        <Icon.Loading sx={{ mt: 4 }} />
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
      color: "error",
      value: formatPrice(currency, price.tax.toFixed(2), null)
    },
    {
      key: "discount",
      label: "Discount",
      color: "primary",
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
            sx={{ fontSize: "subtitle", color: field.color || "text" }}
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
            {isDiscounted
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
