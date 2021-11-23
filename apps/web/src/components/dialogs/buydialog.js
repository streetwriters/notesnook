import { useEffect, useState } from "react";
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
  const [discount, setDiscount] = useState({ isApplyingCoupon: false });
  const theme = useTheme();

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.purchaseInitiated, "Buy dialog opened.");
  }, []);

  useEffect(() => {
    if (!plan) return;
    (async function () {
      const product = await getPlan(plan);
      setDiscount({ isApplyingCoupon: true });
      console.log(product);
      setSelectedPlan({
        ...productToPlan(product),
        coupon: couponCode,
      });
    })();
  }, [plan, couponCode]);

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
        flexDirection="row"
        maxWidth={["100%", "80%", "60%"]}
        maxHeight={["100%", "80%", "80%"]}
        bg="transparent"
        alignSelf={"center"}
        overflowY={props.scrollable ? "auto" : "hidden"}
        sx={{
          position: "relative",
          overflow: "hidden",
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
            borderBottomLeftRadius: "dialog",
            overflow: "hidden",
            bg: "bgSecondary",
            "@supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none))":
              {
                bg: "bgTransparent",
                backdropFilter: "blur(8px)",
              },
          }}
          width={350}
          p={4}
          py={50}
        >
          {isLoggedIn ? (
            selectedPlan ? (
              <SelectedPlan
                plan={{ ...selectedPlan, ...discount }}
                onPlanChangeRequest={() => setSelectedPlan()}
                onCouponApplied={(coupon) => {
                  setDiscount({ isApplyingCoupon: true });
                  setSelectedPlan((plan) => ({ ...plan, coupon }));
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
            <TryForFree />
          )}
        </Flex>
        {isLoggedIn ? (
          selectedPlan ? (
            <Checkout
              user={user}
              plan={selectedPlan}
              onCheckoutLoaded={(data) => {
                const pricingInfo = getPricingInfoFromCheckout(
                  selectedPlan,
                  data
                );
                console.log(pricingInfo, selectedPlan.coupon);
                setDiscount(pricingInfo);
              }}
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
      flex={1}
      flexDirection="column"
      overflowY="auto"
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

function Checkout({ user, plan, onCheckoutLoaded }) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await inlineCheckout({
        user,
        plan: plan.key,
        coupon: plan.coupon,
        country: plan.country,
        onCheckoutLoaded,
      });
      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, user]);

  return (
    <Flex
      bg="background"
      width="500px"
      padding={40}
      overflowY="auto"
      alignItems={"center"}
    >
      {isLoading ? (
        <Loader
          title={
            plan.isApplyingCoupon
              ? "Applying coupon code. Please wait..."
              : "Loading checkout. Please wait..."
          }
        />
      ) : null}
      <Box
        flex={1}
        className="checkout-container"
        display={isLoading ? "none" : "block"}
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

function TryForFree() {
  return (
    <>
      <Rocket width={200} />
      <Text variant="heading" textAlign="center" mt={4}>
        Notesnook Pro
      </Text>
      <Text variant="body" textAlign="center" mt={1}>
        Ready to take the next step in your private note taking journey?
      </Text>
      <Button variant="primary" mt={4}>
        Try free for 14 days
      </Button>
    </>
  );
}

function SelectedPlan({ plan, onPlanChangeRequest, onCouponApplied }) {
  useEffect(() => {
    const couponInput = document.getElementById("coupon");
    couponInput.value = plan.coupon ? plan.coupon : couponInput.value;
  }, [plan.coupon]);
  console.log(plan);
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
      <Text variant="body" fontSize="subheading" textAlign="center" mt={1}>
        {plan.title}
      </Text>
      <Field
        variant={plan.isInvalidCoupon ? "error" : "input"}
        sx={{ alignSelf: "stretch", my: 2 }}
        styles={{ input: { fontSize: "body" } }}
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
        isRecurringDiscount={plan.isRecurringDiscount}
      />
      <Button variant="secondary" mt={4} px={4} onClick={onPlanChangeRequest}>
        Change plan
      </Button>
    </>
  );
}

function CheckoutPricing({
  currency,
  period,
  subtotal,
  discountedPrice,
  isRecurringDiscount,
}) {
  const fields = [
    {
      key: "subtotal",
      label: "Subtotal",
      value: formatPrice(currency, subtotal.toFixed(2)),
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
        <Text variant="body" fontSize="heading" color={"text"} textAlign="end">
          {formatPrice(
            currency,
            subtotal - discountedPrice,
            isRecurringDiscount || discountedPrice <= 0 ? period : "null"
          )}
          <Text fontSize="body">
            {isRecurringDiscount || discountedPrice <= 0
              ? ""
              : `then ${formatPrice(currency, subtotal, period)}`}
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
  const { checkout } = eventData;
  const { prices, recurring_prices, coupon } = checkout;
  const price = parseFloat(prices.customer.total);
  const recurringPrice = parseFloat(recurring_prices.customer.total);

  return {
    price: plan.price,
    discount: plan.price - price,
    coupon: coupon.coupon_code,
    isRecurringDiscount: coupon.coupon_code && price === recurringPrice,
    isInvalidCoupon: !!plan.coupon !== !!coupon.coupon_code,
  };
}

function productToPlan(product) {
  return {
    key: `${product.subscription.interval}ly`,
    country: product.customer_country,
    currency: product.currency,
    price: product.price.net,
    id: product.product_id,
    title: product.subscription.interval === "month" ? "Monthly" : "Yearly",
    subtitle: `Pay once a ${product.subscription.interval}.`,
  };
}
