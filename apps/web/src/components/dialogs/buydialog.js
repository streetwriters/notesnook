import React, { useEffect, useState } from "react";
import { Text, Flex, Button } from "rebass";
import Dialog from "./dialog";
import * as Icon from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { getCouponData, upgrade } from "../../common/checkout";
import { ReactComponent as Personalization } from "../../assets/accent.svg";
import { ReactComponent as Backups } from "../../assets/backup.svg";
import { ReactComponent as Export } from "../../assets/export.svg";
import { ReactComponent as Organize } from "../../assets/organize.svg";
import { ReactComponent as RichText } from "../../assets/richtext.svg";
import { ReactComponent as Sync } from "../../assets/sync.svg";
import { ReactComponent as Vault } from "../../assets/vault.svg";
import getSymbolFromCurrency from "currency-symbol-map";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";
import { navigate } from "../../navigation";

const premiumDetails = [
  {
    title: "Unlimited attachments",
    description: "Your notes will be automatically synced to all your devices.",
    illustration: {
      icon: Sync,
      width: "40%",
    },
  },
  {
    title: "Unlimited storage",
    description: "Your notes will be automatically synced to all your devices.",
    illustration: {
      icon: Sync,
      width: "40%",
    },
  },
  {
    title: "Unlimited notebooks & tags",
    description:
      "Make unlimited notebooks and tags, and assign colors to your notes for quick access.",
    illustration: {
      icon: Organize,
      width: "40%",
    },
  },
  {
    title: "Automatic syncing",
    description: "Your notes will be automatically synced to all your devices.",
    illustration: {
      icon: Sync,
      width: "40%",
    },
  },
  {
    title: "Secure vault for notes",
    description:
      "Lock any note with a password and keep sensitive data under lock and key.",
    illustration: {
      icon: Vault,
      width: "35%",
    },
  },
  {
    title: "Full rich text editor + markdown support",
    description:
      "Add images, links, tables and lists to your notes, and use markdown for fast editing.",
    illustration: {
      icon: RichText,
      width: "50%",
    },
  },
  {
    title: "Multi-format exports",
    description: "Export your notes in PDF, Markdown, or HTML formats.",
    illustration: {
      icon: Export,
      width: "25%",
    },
  },
  {
    title: "Automatic encrypted backups",
    description: "Enable daily or weekly backups with automatic encryption.",
    illustration: {
      icon: Backups,
      width: "25%",
    },
  },
  {
    title: "Customize Notesnook",
    description: "Change app colors and turn on automatic theme switching.",
    illustration: {
      icon: Personalization,
      width: "50%",
    },
  },
  {
    title: (
      <>
        Special Pro badge on{" "}
        <a href="https://discord.gg/5davZnhw3V">our Discord server</a>
      </>
    ),
    description:
      "Pro users get access to special channels and priority support on our Discord server.",
    illustration: {
      icon: Personalization,
      width: "50%",
    },
  },
];

function BuyDialog(props) {
  const { couponCode } = props;
  const [coupon, setCoupon] = useState(couponCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const [prices, setPrices] = useState();
  const [plan, setPlan] = useState(props.plan || "monthly");
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);
  const user = useUserStore((store) => store.user);

  useEffect(() => {
    (async function () {
      try {
        setIsLoading(true);
        setError();
        const data = await getCouponData(coupon, plan);
        setPrices({
          ...data.paddlejs.vendor,
          withoutDiscount: data.total[0],
        });
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [coupon, plan]);

  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.purchaseInitiated, "Buy dialog opened.");
  }, []);

  return (
    <Dialog
      isOpen={true}
      // showClose
      onClose={props.onCancel}
      padding={"0px"}
      margin={"0px"}
      headerPaddingBottom={"0px"}
    >
      <Flex flexDirection="column" flex={1} overflowY="hidden">
        <Flex bg="primary" p={5} sx={{ position: "relative" }}>
          <Text variant="heading" fontSize="38px" color="static">
            Notesnook Pro
            <Text
              variant="subBody"
              color="static"
              opacity={1}
              fontWeight="normal"
              fontSize="title"
            >
              Ready to take the next step on your private note taking journey?
            </Text>
          </Text>
          <Text
            sx={{ position: "absolute", top: 0, right: 0 }}
            variant="heading"
            color="static"
            opacity={0.2}
            fontSize={90}
          >
            PRO
          </Text>
        </Flex>
        <Flex
          flexDirection="column"
          px={5}
          pb={2}
          overflowY="auto"
          sx={{ position: "relative" }}
        >
          {premiumDetails.map((item) => (
            <Flex mt={2}>
              <Icon.Checkmark color="primary" size={16} />
              <Text variant="body" fontSize="title" ml={1}>
                {item.title}
              </Text>
            </Flex>
          ))}
        </Flex>

        <Flex
          flexDirection="column"
          bg={error ? "errorBg" : "shade"}
          p={5}
          pt={2}
        >
          {isLoading ? (
            <Icon.Loading size={32} />
          ) : error ? (
            <>
              <Text variant="title" color="error" fontWeight="normal">
                {error}
              </Text>
              <Button
                variant="primary"
                bg="error"
                color="static"
                mt={2}
                onClick={() => setCoupon()}
              >
                Try again
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="anchor"
                display="flex"
                justifyContent="center"
                alignItems="center"
                onClick={() => {
                  setPlan((s) => (s === "monthly" ? "yearly" : "monthly"));
                }}
              >
                <Text variant="body" mr={1}>
                  Monthly
                </Text>
                {plan === "monthly" ? (
                  <Icon.ToggleUnchecked color="primary" />
                ) : (
                  <Icon.ToggleChecked color="primary" />
                )}
                <Text variant="body" ml={1}>
                  Yearly
                </Text>
              </Button>
              {coupon ? (
                <Flex mb={1} alignItems="center" justifyContent="space-between">
                  <Flex alignItems="center" justifyContent="center">
                    <Text variant="subBody" mr={1}>
                      Coupon:
                    </Text>
                    <Text
                      variant="subBody"
                      fontSize={10}
                      bg="primary"
                      color="static"
                      px={1}
                      py="3px"
                      sx={{ borderRadius: "default" }}
                    >
                      {coupon}
                    </Text>
                  </Flex>

                  <Flex>
                    <Text
                      sx={{ cursor: "pointer", ":hover": { opacity: 0.8 } }}
                      variant="subBody"
                      color="primary"
                      mr={1}
                      onClick={() => {
                        const code = window.prompt("Enter new coupon code:");
                        setCoupon(code);
                      }}
                    >
                      Change
                    </Text>
                    <Text
                      sx={{ cursor: "pointer", ":hover": { opacity: 0.8 } }}
                      variant="subBody"
                      color="error"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to remove this coupon?"
                          )
                        ) {
                          setCoupon();
                        }
                      }}
                    >
                      Remove
                    </Text>
                  </Flex>
                </Flex>
              ) : (
                <Text
                  sx={{ cursor: "pointer", ":hover": { opacity: 0.8 } }}
                  variant="subBody"
                  color="primary"
                  mr={1}
                  onClick={() => {
                    const code = window.prompt("Enter new coupon code:");
                    setCoupon(code);
                  }}
                >
                  Add coupon code
                </Text>
              )}
              <Text variant="heading" fontSize={24} color="primary">
                Only <MainPricing prices={prices} plan={plan} />
              </Text>
              <RecurringPricing prices={prices} plan={plan} />
              <Text display="flex" variant="subBody" color="text" mt={1} mb={2}>
                Cancel anytime. No questions asked.
              </Text>
              <Button
                fontSize="title"
                fontWeight="bold"
                onClick={async () => {
                  if (isLoggedIn) {
                    await upgrade(user, coupon, plan);
                  } else {
                    navigate(`/login`, { redirect: `/#/buy/${coupon}` });
                  }
                  props.onCancel();
                }}
              >
                Subscribe to Notesnook Pro
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Dialog>
  );
}
export default BuyDialog;

function MainPricing(props) {
  const { prices, plan } = props;

  if (prices.withoutDiscount.net !== prices.prices.total)
    return (
      <>
        <del>
          <Price
            currency={prices.withoutDiscount.currency}
            price={prices.withoutDiscount.net}
          />
        </del>{" "}
        <Price currency={prices.currency} price={prices.prices.total} />
        {prices.recurring_prices.total === prices.prices.total
          ? ` per ${planToPeriod(plan)}`
          : ` your first ${planToPeriod(plan)}`}
      </>
    );
  else
    return (
      <>
        <Price currency={prices.currency} price={prices.prices.total} />
        {` per ${planToPeriod(plan)}`}
      </>
    );
}

function RecurringPricing(props) {
  const { prices, plan } = props;

  if (prices.prices.total === prices.recurring_prices.total) return null;
  return (
    <Text
      display="flex"
      variant="body"
      mt={1}
      fontWeight="bold"
      color="primary"
    >
      And then{" "}
      <Price currency={prices.currency} price={prices.recurring_prices.total} />{" "}
      every {planToPeriod(plan)} afterwards.
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

function planToPeriod(plan) {
  return plan === "monthly" ? "month" : "year";
}
