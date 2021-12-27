import { useCallback, useEffect, useState } from "react";
import { Text, Flex, Button, Box } from "rebass";
import * as Icon from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { getPlans, getPlan, inlineCheckout } from "../../common/checkout";
import getSymbolFromCurrency from "currency-symbol-map";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";
import Modal from "react-modal";
import { useTheme } from "emotion-theming";
import { ReactComponent as Rocket } from "../../assets/rocket.svg";
import { ReactComponent as Nomad } from "../../assets/nomad.svg";
import { ReactComponent as WorkAnywhere } from "../../assets/workanywhere.svg";
import { ReactComponent as WorkLate } from "../../assets/worklate.svg";
import Loader from "../loader";
import Field from "../field";
import { useSessionState } from "../../utils/hooks";
import { hardNavigate } from "../../navigation";

const sections = [
  {
    title: "Focused on privacy",
    detail:
      "Everything you do in Notesnook stays private. We use XChaCha20-Poly1305-IETF and Argon2 to encrypt your notes.",
    features: [
      {
        title: "Zero ads & zero trackers",
        icon: Icon.Billboard,
      },
      {
        title: "On device encryption",
        icon: Icon.Cellphone,
      },
      {
        title: "Secure app lock for all",
        icon: Icon.CellphoneLock,
      },
      {
        title: "100% end-to-end encrypted",
        icon: Icon.Lock,
      },
      {
        title: "Private vault for notes",
        icon: Icon.ShieldLock,
        pro: true,
      },
    ],
  },
  {
    title: "Instant syncing",
    detail:
      "Seemlessly work from anywhere. Every change is synced instantly everywhere.",
    pro: true,
  },
  {
    title: "100% cross platform",
    detail: "Notesnook is available on all major platforms — for everyone.",
    columns: 8,
    features: [
      {
        icon: Icon.iOS,
      },
      {
        icon: Icon.Android,
      },
      {
        icon: Icon.Windows,
      },
      {
        icon: Icon.Linux,
      },
      {
        icon: Icon.MacOS,
      },
      {
        icon: Icon.Chrome,
      },
      {
        icon: Icon.Firefox,
      },
      {
        icon: Icon.Safari,
      },
    ],
  },
  {
    title: "Attach files & images",
    detail:
      "Add your documents, PDFs, images and videos, and keep them safe and organized.",
    pro: true,
    features: [
      {
        title: "Bulletproof encryption",
        icon: Icon.Lock,
      },
      {
        title: "High quality 4K images",
        icon: Icon.ImageMultiple,
      },
      {
        title: "Unlimited storage",
        icon: Icon.Harddisk,
      },
      {
        title: "Upto 500 MB per file",
        icon: Icon.FileCabinet,
      },
      {
        title: "All file types supported",
        icon: Icon.File,
      },
    ],
  },
  {
    title: "No limit on notes",
    detail:
      "We don't have nonsense like blocks and whatnot. You can create as many notes as you want — no limits.",
  },
  {
    title: "Safe publishing to the Internet",
    detail:
      "Publishing is nothing new but we offer fully encrypted, anonymous publishing. Take any note & share it with the world.",
    features: [
      {
        title: "Anonymous publishing",
        icon: Icon.Anonymous,
      },
      {
        title: "Password protection",
        icon: Icon.CloudLock,
      },
      {
        title: "Self destructable notes",
        icon: Icon.Timebomb,
      },
    ],
  },
  {
    title: "Organize yourself in the best way",
    detail:
      "We offer multiple ways to keep you organized. The only limit is your imagination.",
    features: [
      {
        title: "Unlimited notebooks*",
        icon: Icon.Notebook2,
        pro: true,
      },
      {
        title: "Colors & tags*",
        icon: Icon.Palette,
        pro: true,
      },
      {
        title: "Side menu shortcuts",
        icon: Icon.Shortcut,
      },
      {
        title: "Pins & favorites",
        icon: Icon.Pin,
      },
    ],
    info: "* Free users can only create 3 notebooks (no limit on topics) and 5 tags.",
  },

  {
    title: "Rich tools for rich editing",
    detail:
      "Having the right tool at the right time is crucial for note taking. Lists, tables, codeblocks — you name it, we have it.",
    pro: true,
    features: [
      {
        title: "Lists & tables",
        icon: Icon.Table,
      },
      {
        title: "Images & embeds",
        icon: Icon.Embed,
      },
      {
        title: "Checklists",
        icon: Icon.CheckCircleOutline,
      },
      {
        title: "Markdown shortcuts",
        icon: Icon.Markdown,
      },
    ],
  },
  {
    title: "Export and take your notes anywhere",
    detail:
      "You own your notes, not us. No proprietary formats. No vendor lock in. No waiting for hours to download your notes.",
    // info: "* Free users can export notes in well formatted plain text.",
    features: [
      {
        title: "Export as Markdown",
        icon: Icon.Markdown,
        pro: true,
      },
      {
        title: "Export as PDF",
        icon: Icon.PDF,
        pro: true,
      },
      {
        title: "Export as HTML",
        icon: Icon.HTML,
        pro: true,
      },
      {
        title: "Export as text",
        icon: Icon.Text,
      },
      {
        title: "Bulk exports",
        icon: Icon.Export,
      },
    ],
  },
  {
    title: "Backup & keep your notes safe",
    detail:
      "Do not worry about losing your data. Turn on automatic backups on weekly or daily basis.",
    features: [
      {
        title: "Automatic monthly, weekly & daily backups",
        icon: Icon.Backup,
        pro: true,
      },
      {
        title: "Backup encryption",
        icon: Icon.EncryptedBackup,
        pro: true,
      },
    ],
  },
  {
    title: "Personalize & make Notesnook your own",
    detail:
      "Change app themes to match your style. Custom themes are coming soon.",
    pro: true,
    features: [
      {
        title: "10+ themes",
        icon: Icon.Accent,
      },
      {
        title: "Automatic dark mode",
        icon: Icon.Theme,
      },
      {
        title: "Change default home page",
        icon: Icon.Home,
      },
    ],
  },
];

function BuyDialog(props) {
  const { couponCode, plan } = props;
  const user = useUserStore((store) => store.user);
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const [selectedPlan, setSelectedPlan] = useState();
  const [discount, setDiscount] = useState();
  const theme = useTheme();

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.purchaseInitiated, "Buy dialog opened.");
  }, []);

  useEffect(() => {
    if (!plan) return;
    (async function () {
      const product = await getPlan(plan);
      setDiscount({ isApplyingCoupon: !!couponCode });
      setSelectedPlan({
        ...productToPlan(product),
        coupon: couponCode,
      });
    })();
  }, [plan, couponCode]);

  const onCheckoutLoaded = useCallback((data) => {
    setSelectedPlan((plan) => {
      const pricingInfo = getPricingInfoFromCheckout(plan, data);
      if (plan.country !== pricingInfo.country) {
        return { ...plan, ...pricingInfo };
      }
      setDiscount(pricingInfo);
      return plan;
    });
  }, []);

  return (
    <Modal
      isOpen={true}
      onRequestClose={props.onClose}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldFocusAfterRender
      onAfterOpen={(e) => {
        if (!props.onClose) return;
        // we need this work around because ReactModal content spreads over the overlay
        const child = e.contentEl.firstElementChild;
        e.contentEl.onmousedown = function (e) {
          if (!e.screenX && !e.screenY) return;
          if (
            e.x < child.offsetLeft ||
            e.x > child.offsetLeft + child.clientWidth ||
            e.y < child.offsetTop ||
            e.y > child.offsetTop + child.clientHeight
          ) {
            props.onClose();
          }
        };
        if (props.onOpen) props.onOpen();
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
          zIndex: 0,
        },
        overlay: {
          zIndex: 999,
          background: theme.colors.overlay,
        },
      }}
    >
      <Flex
        flexDirection={["column", "column", "row"]}
        width={["95%", "80%", "60%"]}
        maxHeight={["95%", "80%", "80%"]}
        bg="transparent"
        alignSelf={"center"}
        overflowY={["scroll", "scroll", "auto"]}
        sx={{
          position: "relative",
          // overflow: "hidden",
          boxShadow: "4px 5px 18px 2px #00000038",
          borderRadius: "dialog",
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
                backdropFilter: "blur(8px)",
              },
          }}
          width={["100%", "100%", 350]}
          p={4}
          py={50}
        >
          {isLoggedIn ? (
            selectedPlan ? (
              <SelectedPlan
                plan={{ ...selectedPlan, ...discount }}
                onPlanChangeRequest={() => {
                  setSelectedPlan();
                  setDiscount();
                }}
                isPlanChangeable={!plan}
                onCouponApplied={(coupon) => {
                  setDiscount({
                    isApplyingCoupon: true,
                  });
                  setSelectedPlan((plan) => ({
                    ...plan,
                    coupon,
                  }));
                }}
              />
            ) : plan ? (
              <Loader title="Please wait..." />
            ) : (
              <ChooseAPlan
                selectedPlan={selectedPlan}
                onPlanChanged={(plan) => setSelectedPlan(plan)}
              />
            )
          ) : (
            <TryForFree couponCode={couponCode} />
          )}
        </Flex>
        {isLoggedIn ? (
          selectedPlan ? (
            <Checkout
              user={user}
              planId={selectedPlan.key}
              coupon={selectedPlan.coupon}
              country={selectedPlan.country}
              onCheckoutLoaded={onCheckoutLoaded}
            />
          ) : plan ? null : (
            <FeaturesList />
          )
        ) : (
          <FeaturesList />
        )}
      </Flex>
    </Modal>
  );
}
export default BuyDialog;

function RecurringPricing(props) {
  const { plan } = props;
  // if (product.prices.total === prices.recurring_prices.total) return null;
  return (
    <Text variant="body" fontSize="subBody">
      <Text as="span" fontSize="subtitle">
        <Price currency={plan.currency} price={plan.price} />
      </Text>
      {formatPeriod(plan.key)}
    </Text>
  );
}

function Price(props) {
  const { currency, price } = props;
  return (
    <>
      {getSymbolFromCurrency(currency)}
      {price}
    </>
  );
}

function FeaturesList() {
  return (
    <Flex
      flexDirection="column"
      flex={1}
      overflowY={["hidden", "hidden", "auto"]}
      flexShrink={0}
      sx={{ position: "relative" }}
      pt={6}
      bg="background"
    >
      {sections.map((section) => (
        <Flex flexDirection="column" px={6} pb={50}>
          {section.pro && (
            <Flex
              bg="bgSecondary"
              alignSelf="start"
              px={2}
              py="2px"
              sx={{ borderRadius: 50 }}
              mb={1}
            >
              <Icon.Pro color="primary" size={16} />
              <Text variant="body" color="primary" ml={"2px"}>
                Pro
              </Text>
            </Flex>
          )}
          <Text variant="body" fontSize={"1.3rem"}>
            {section.title}
          </Text>
          <Text variant="body" mt={1} fontSize="title" color="fontTertiary">
            {section.detail}
          </Text>
          {section.features && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: section.columns
                  ? "1fr ".repeat(section.columns)
                  : "1fr 1fr 1fr",
                gap: 3,
              }}
              mt={4}
            >
              {section.features.map((feature) => (
                <Flex alignItems="start" flexDirection="column">
                  <feature.icon size={20} color="text" sx={{ mb: 1 }} />
                  {feature.pro && (
                    <Flex justifyContent="center" alignItems="center">
                      <Icon.Pro color="primary" size={14} />
                      <Text variant="subBody" color="primary" ml={"2px"}>
                        Pro
                      </Text>
                    </Flex>
                  )}
                  {feature.title && (
                    <Text variant="body" fontSize="subtitle">
                      {feature.title}
                    </Text>
                  )}
                </Flex>
              ))}
            </Box>
          )}
          {section.info && (
            <Text mt={1} variant="subBody">
              {section.info}
            </Text>
          )}
        </Flex>
      ))}
    </Flex>
  );
}

function Checkout({ user, planId, coupon, country, onCheckoutLoaded }) {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    (async () => {
      setIsLoaded(false);
      await inlineCheckout({
        user,
        plan: planId,
        coupon,
        country,
        onCheckoutLoaded,
      });
      setIsLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, coupon]);

  return (
    <Flex
      bg="background"
      //width="100%"
      flex={1}
      padding={40}
      flexShrink={[0, 0, 1]}
      overflowY={["hidden", "hidden", "auto"]}
      alignItems={isLoaded ? "stretch" : "center"}
    >
      {!isLoaded ? (
        <Loader
          title={
            coupon
              ? "Applying coupon code. Please wait..."
              : "Loading checkout. Please wait..."
          }
        />
      ) : null}
      <Box
        flex={1}
        className="checkout-container"
        display={!isLoaded ? "none" : "block"}
      />
    </Flex>
  );
}

const CACHED_PLANS = [
  {
    key: "monthly",
    title: "Monthly",
    subtitle: `Pay once a month.`,
  },
  {
    key: "yearly",
    title: "Yearly",
    subtitle: `Pay once a year.`,
  },
];
function PlansList({ selectedPlan, onPlanChanged }) {
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useSessionState("PlansList:plans", CACHED_PLANS);

  useEffect(() => {
    if (plans && plans !== CACHED_PLANS) return;
    (async function () {
      try {
        setIsLoading(true);
        let plans = await getPlans();
        plans = plans.map((product) => {
          return productToPlan(product);
        });
        setPlans(plans);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [plans, setPlans]);

  return plans.map((plan) => (
    <Button
      disabled={isLoading}
      data-test-id={`checkout-plan-${plan.key}`}
      variant="tool"
      display="flex"
      textAlign="start"
      justifyContent="space-between"
      alignItems="center"
      flex={1}
      mt={1}
      sx={{
        bg: selectedPlan?.key === plan.key ? "border" : "transparent",
        border:
          selectedPlan?.key === plan.key ? "1px solid var(--primary)" : "none",
      }}
      onClick={() => onPlanChanged(plan)}
    >
      <Text variant="subtitle" fontWeight="normal">
        {plan.title}
        <Text variant="body" fontWeight="normal" color="fontTertiary">
          {plan.subtitle}
        </Text>
      </Text>
      {isLoading ? <Icon.Loading /> : <RecurringPricing plan={plan} />}
    </Button>
  ));
}

function ChooseAPlan({ selectedPlan, onPlanChanged }) {
  return (
    <>
      <Nomad width={200} />
      <Text variant="heading" textAlign="center" mt={4}>
        Choose a plan
      </Text>
      <Text variant="body" textAlign="center" mt={1}>
        Every day we spend hours improving Notesnook. You are what makes that
        possible.
      </Text>
      <Flex flexDirection="column" alignSelf="stretch" mt={2}>
        <PlansList selectedPlan={selectedPlan} onPlanChanged={onPlanChanged} />
      </Flex>
    </>
  );
}

function TryForFree({ couponCode }) {
  return (
    <>
      <Rocket width={200} />
      <Text variant="heading" textAlign="center" mt={4}>
        Notesnook Pro
      </Text>
      <Text variant="body" textAlign="center" mt={1}>
        Ready to take the next step in your private note taking journey?
      </Text>
      <Button variant="primary" mt={4} onClick={() => hardNavigate("/signup")}>
        {couponCode ? "Claim my discount" : "Try free for 14 days"}
      </Button>
      {couponCode && (
        <Text
          variant="subBody"
          bg="shade"
          color="primary"
          mt={4}
          p={1}
          sx={{ borderRadius: "default" }}
        >
          Please sign up or login to use your coupon: <b>{couponCode}</b>
        </Text>
      )}
    </>
  );
}

function SelectedPlan({
  plan,
  isPlanChangeable,
  onPlanChangeRequest,
  onCouponApplied,
}) {
  useEffect(() => {
    const couponInput = document.getElementById("coupon");
    couponInput.value = plan.coupon ? plan.coupon : couponInput.value;
  }, [plan.coupon]);

  return (
    <>
      {plan.key === "monthly" ? (
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
        {plan.title}
      </Text>
      <Field
        variant={plan.isInvalidCoupon ? "error" : "input"}
        sx={{ alignSelf: "stretch", my: 2 }}
        styles={{ input: { fontSize: "body" } }}
        data-test-id="checkout-coupon-code"
        id="coupon"
        name="coupon"
        placeholder="Coupon code"
        autoFocus={plan.isInvalidCoupon}
        disabled={!!plan.coupon}
        onKeyUp={(e) => {
          if (e.code === "Enter") {
            const couponInput = document.getElementById("coupon");
            if (!!plan.coupon) couponInput.value = "";
            onCouponApplied(couponInput.value);
          }
        }}
        action={{
          icon: plan.isApplyingCoupon
            ? Icon.Loading
            : plan.coupon
            ? Icon.Cross
            : Icon.Check,
          onClick: () => {
            const couponInput = document.getElementById("coupon");
            if (!!plan.coupon) couponInput.value = "";
            onCouponApplied(couponInput.value);
          },
        }}
      />
      <CheckoutPricing
        currency={plan.currency}
        period={plan.key}
        subtotal={plan.price}
        discountedPrice={plan.discount || 0.0}
        tax={plan.tax || 0.0}
        recurringTax={plan.recurringTax || 0.0}
        isRecurringDiscount={plan.isRecurringDiscount}
      />
      {isPlanChangeable && (
        <Button
          data-test-id="checkout-plan-change"
          variant="secondary"
          mt={4}
          px={4}
          onClick={onPlanChangeRequest}
        >
          Change plan
        </Button>
      )}
    </>
  );
}

function CheckoutPricing({
  currency,
  period,
  subtotal,
  discountedPrice,
  tax,
  recurringTax,
  isRecurringDiscount,
}) {
  const fields = [
    {
      key: "subtotal",
      label: "Subtotal",
      value: formatPrice(currency, subtotal.toFixed(2)),
    },
    {
      key: "tax",
      label: "Sales tax",
      color: "error",
      value: formatPrice(currency, tax.toFixed(2), null),
    },
    {
      key: "discount",
      label: "Discount",
      color: "primary",
      value: formatPrice(
        currency,
        discountedPrice.toFixed(2),
        null,
        discountedPrice > 0
      ),
    },
  ];
  const currentTotal = (subtotal + tax - discountedPrice).toFixed(2);
  const recurringTotal = (subtotal + recurringTax).toFixed(2);
  const isDiscounted = isRecurringDiscount || discountedPrice <= 0;
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
          {formatPrice(currency, currentTotal, isDiscounted ? period : "null")}
          <Text fontSize="body">
            {isDiscounted
              ? ""
              : `then ${formatPrice(currency, recurringTotal, period)}`}
          </Text>
        </Text>
      </Flex>
    </>
  );
}

function formatPrice(currency, price, period, negative = false) {
  return `${negative ? "-" : ""}${getSymbolFromCurrency(
    currency
  )}${price}${formatPeriod(period)}`;
}

function formatPeriod(period) {
  return period === "monthly" ? "/mo" : period === "yearly" ? "/yr" : "";
}

function getPricingInfoFromCheckout(plan, eventData) {
  const {
    checkout,
    user: { country },
  } = eventData;
  const { prices, recurring_prices, coupon } = checkout;
  const { currency, total, total_tax } = prices.customer;

  const couponCode = coupon.coupon_code ? coupon.coupon_code : undefined;
  const price = parseFloat(total);
  const recurringPrice = parseFloat(recurring_prices.customer.total);
  const tax = parseFloat(total_tax);
  const recurringTax = parseFloat(recurring_prices.customer.total_tax);
  const isCouponApplied = !!couponCode;

  const isCurrencyChanged = plan.currency !== currency;
  return {
    country,
    currency,
    price: isCurrencyChanged ? price : plan.price,
    tax,
    recurringTax,
    discount: isCouponApplied ? plan.price - price : 0,
    coupon: couponCode,
    isRecurringDiscount: couponCode && price === recurringPrice,
    isInvalidCoupon: plan.coupon && plan.coupon !== couponCode,
  };
}

function productToPlan(product) {
  return {
    key: `${product.subscription.interval}ly`,
    // country: product.customer_country,
    currency: product.currency,
    price: product.price.net,
    id: product.product_id,
    title: product.subscription.interval === "month" ? "Monthly" : "Yearly",
    subtitle: `Pay once a ${product.subscription.interval}.`,

    tax: product.price.tax,
    recurringTax: product.subscription.price.tax,
  };
}
