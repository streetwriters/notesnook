import React, { useEffect, useState } from "react";
import { Text, Flex, Button, Box } from "rebass";
import Dialog from "./dialog";
import * as Icon from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { getCouponData, upgrade } from "../../common/checkout";
import getSymbolFromCurrency from "currency-symbol-map";
import { ANALYTICS_EVENTS, trackEvent } from "../../utils/analytics";
import { navigate } from "../../navigation";
import Switch from "../switch";
import Modal from "react-modal";
import { useTheme } from "emotion-theming";
import { ReactComponent as Rocket } from "../../assets/rocket.svg";

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

const plans = [
  {
    title: "Monthly",
    subtitle: "Pay once a month",
    price: 4.99,
    currency: "USD",
  },
  {
    title: "Yearly",
    subtitle: "Pay once a year",
    price: 49.99,
    currency: "USD",
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
  const theme = useTheme();

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
        width={"60%"}
        // maxHeight={["100%", "80%", "70%"]}
        height={["100%", "80%", "70%"]}
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
          sx={{
            borderRadius: "dialog",
            overflow: "hidden",
            bg: "bgTransparent",
            backdropFilter: "blur(8px)",
          }}
          width={350}
          p={4}
          py={50}
        >
          <Rocket width={200} />
          <Text variant="heading" textAlign="center" mt={4}>
            Choose a plan
          </Text>
          <Text variant="body" textAlign="center" mt={1}>
            Every day we spend hours improving Notesnook. You are what makes
            that possible.
          </Text>
        </Flex>
        <Flex
          flex={1}
          flexDirection="column"
          overflowY="auto"
          sx={{ position: "relative" }}
          pt={6}
          bg="background"
          justifyContent="center"
        >
          {plans.map((plan) => (
            <Flex justifyContent="space-between" alignItems="center" p={6}>
              <Text variant="heading" fontWeight="normal">
                {plan.title}
                <Text variant="subtitle" fontWeight="normal">
                  {plan.subtitle}
                </Text>
              </Text>
              <Text variant="body" fontSize="subheading">
                {plan.price} {plan.currency}
              </Text>
            </Flex>
          ))}
        </Flex>
        {/* <Flex
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          sx={{
            borderRadius: "dialog",
            overflow: "hidden",
            bg: "bgTransparent",
            backdropFilter: "blur(8px)",
          }}
          width={350}
          p={4}
          py={50}
        >
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
        </Flex>
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
        </Flex> */}
      </Flex>
    </Modal>
  );

  /* <Flex flexDirection="column" flex={1} overflowY="hidden">
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
              <Flex justifyContent="center" alignItems="center">
                <Text variant="body" mr={1}>
                  Monthly
                </Text>
                <Switch
                  checked={plan !== "monthly"}
                  onClick={() => {
                    setPlan((s) => (s === "monthly" ? "yearly" : "monthly"));
                  }}
                />
                <Text variant="body" ml={1}>
                  Yearly
                </Text>
              </Flex>
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
      </Flex> */
  // </Dialog>
  // );
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
