import { useCallback, useEffect, useRef, useState } from "react";
import { Text, Flex, Button } from "@streetwriters/rebass";
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
import { formatPeriod, PlansList } from "./plan-list";
import { showToast } from "../../../utils/toast";
import { TaskManager } from "../../../common/task-manager";
import { db } from "../../../common/db";
import { useCheckoutStore } from "./store";
import { getCurrencySymbol } from "./helpers";

type BuyDialogProps = {
  couponCode?: string;
  plan?: "monthly" | "yearly";
  onClose: () => void;
};

export function BuyDialog(props: BuyDialogProps) {
  const { onClose, couponCode, plan } = props;
  const theme: any = useTheme();

  useEffect(() => {
    return () => {
      useCheckoutStore.getState().reset();
    };
  }, []);

  return (
    <Modal
      isOpen={true}
      onRequestClose={props.onClose}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldFocusAfterRender
      onAfterOpen={(e: any) => {
        if (!onClose) return;
        // we need this work around because ReactModal content spreads over the overlay
        const child = e.contentEl.firstElementChild;
        e.contentEl.onmousedown = function (e: any) {
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
          background: theme.colors.overlay
        }
      }}
    >
      <Flex
        flexDirection={["column", "column", "row"]}
        width={["95%", "80%", "60%"]}
        maxHeight={["95%", "80%", "80%"]}
        bg="transparent"
        alignSelf={"center"}
        overflowY={["scroll", "scroll", "hidden"]}
        sx={{
          position: "relative",
          overflow: "hidden",
          boxShadow: "4px 5px 18px 2px #00000038",
          borderRadius: "dialog"
        }}
      >
        <Flex
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          flexShrink={0}
          sx={{
            borderTopLeftRadius: "dialog",
            borderBottomLeftRadius: [0, 0, "dialog"],
            overflow: "hidden",
            bg: "bgSecondary",
            "@supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none))":
              {
                bg: "bgTransparent",
                backdropFilter: "blur(8px)"
              }
          }}
          width={["100%", "100%", 350]}
          p={4}
          py={50}
        >
          <SideBar
            onClose={onClose}
            couponCode={couponCode}
            initialPlan={plan}
          />
        </Flex>
        <Details initialCouponCode={couponCode} />
      </Flex>
    </Modal>
  );
}

type SideBarProps = {
  couponCode?: string;
  initialPlan?: Period;
  onClose: () => void;
};
function SideBar(props: SideBarProps) {
  const { couponCode, initialPlan, onClose } = props;
  const [showPlans, setShowPlans] = useState(!!initialPlan);
  const onPlanSelected = useCheckoutStore((state) => state.onPlanSelected);
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const pricingInfo = useCheckoutStore((state) => state.pricingInfo);
  const user = useUserStore((store) => store.user);

  if (user && selectedPlan)
    return (
      <SelectedPlan
        plan={selectedPlan}
        pricingInfo={pricingInfo}
        onChangePlan={initialPlan ? undefined : () => onPlanSelected(undefined)}
      />
    );

  if (user && showPlans)
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

type DetailsProps = {
  initialCouponCode?: string;
};
function Details(props: DetailsProps) {
  const { initialCouponCode } = props;
  const user = useUserStore((store) => store.user);
  const selectedPlan = useCheckoutStore((state) => state.selectedPlan);
  const onPriceUpdated = useCheckoutStore((state) => state.onPriceUpdated);
  const couponCode = useCheckoutStore((store) => store.couponCode);
  const onApplyCoupon = useCheckoutStore((store) => store.onApplyCoupon);
  const setIsApplyingCoupon = useCheckoutStore(
    (store) => store.setIsApplyingCoupon
  );
  const theme = useThemeStore((store) => store.theme);

  if (selectedPlan && user)
    return (
      <PaddleCheckout
        plan={selectedPlan}
        // @ts-ignore TODO
        theme={theme}
        user={user}
        coupon={couponCode}
        onCouponApplied={() => setIsApplyingCoupon(true)}
        onPriceUpdated={(pricingInfo) => {
          onPriceUpdated(pricingInfo);
          console.log(initialCouponCode, "applying coupon", couponCode);

          if (!initialCouponCode || initialCouponCode === couponCode) return;
          console.log(initialCouponCode, "applying coupon");
          onApplyCoupon(initialCouponCode);
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
      <Text variant="heading" textAlign="center" mt={4}>
        Notesnook Pro
      </Text>
      <Text variant="body" textAlign="center" mt={1}>
        Ready to take the next step in your private note taking journey?
      </Text>
      {isLoading || !plan ? (
        <Icon.Loading sx={{ mt: 4 }} />
      ) : (
        <Text variant={"body"} fontSize="title" mt={4}>
          Starting from {getCurrencySymbol(plan.currency)}
          {plan.price.gross}
          {formatPeriod(plan.period)}
        </Text>
      )}
      {user ? (
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
          <Text variant={"subBody"} textAlign="center" mt={2}>
            After creating your account, you will be asked to activate your free
            trial. <b>No credit card is required.</b>
          </Text>
        </>
      )}

      {couponCode && (
        <Text
          variant="subBody"
          bg="shade"
          color="primary"
          mt={4}
          p={1}
          sx={{ borderRadius: "default" }}
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

type SelectedPlanProps = {
  plan: Plan;
  pricingInfo: PricingInfo | undefined;
  onChangePlan?: () => void;
};
function SelectedPlan(props: SelectedPlanProps) {
  const { plan, pricingInfo, onChangePlan } = props;
  const metadata = PLAN_METADATA[plan.period];
  const [isInvalidCoupon, setIsInvalidCoupon] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useCheckoutStore((store) => [
    store.isApplyingCoupon,
    store.setIsApplyingCoupon
  ]);

  const onApplyCoupon = useCheckoutStore((store) => store.onApplyCoupon);
  const couponCode = useCheckoutStore((store) => store.couponCode);
  const couponInputRef = useRef<HTMLInputElement>();

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

  useEffect(
    () => {
      if (!couponInputRef.current) return;
      setIsApplyingCoupon(false);

      const couponValue = couponInputRef.current.value;

      const isInvalidCoupon =
        (!!couponValue && couponValue !== pricingInfo?.coupon) ||
        (!!couponCode && couponCode !== pricingInfo?.coupon);

      setIsInvalidCoupon(isInvalidCoupon);
      if (isInvalidCoupon) {
        if (couponCode) couponInputRef.current.value = couponCode;
        return;
      }

      const pricingInfoCoupon = pricingInfo?.coupon || "";
      if (couponValue !== pricingInfoCoupon) {
        couponInputRef.current.value = pricingInfoCoupon;
        onApplyCoupon(pricingInfo?.coupon);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pricingInfo, onApplyCoupon, setIsApplyingCoupon]
  );

  return (
    <>
      {plan.period === "monthly" ? (
        <WorkAnywhere width={180} />
      ) : (
        <WorkLate width={180} />
      )}
      <Text variant="heading" textAlign="center" mt={4}>
        Notesnook Pro
      </Text>
      <Text
        data-test-id="checkout-plan-title"
        variant="body"
        fontSize="subheading"
        textAlign="center"
        mt={1}
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
            variant={isInvalidCoupon ? "error" : "input"}
            sx={{ alignSelf: "stretch", my: 2 }}
            styles={{ input: { fontSize: "body" } }}
            data-test-id="checkout-coupon-code"
            id="coupon"
            name="coupon"
            placeholder={
              isApplyingCoupon ? "Applying coupon code..." : "Coupon code"
            }
            autoFocus={isInvalidCoupon}
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
          justifyContent="space-between"
          alignSelf="stretch"
          mt={1}
        >
          <Text variant="body" fontSize="subtitle">
            {field.label}
          </Text>
          <Text
            data-test-id={`checkout-price-${field.key}`}
            variant="body"
            fontSize="subtitle"
            color={field.color || "text"}
          >
            {field.value}
          </Text>
        </Flex>
      ))}
      <Flex justifyContent="space-between" alignSelf="stretch" mt={1}>
        <Text variant="body" fontSize="heading">
          Total
        </Text>
        <Text
          data-test-id={`checkout-price-total`}
          variant="body"
          fontSize="heading"
          color={"text"}
          textAlign="end"
        >
          {currentTotal}
          {isDiscounted ? null : (
            <Text fontSize="body">{`then ${recurringTotal}`}</Text>
          )}
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
