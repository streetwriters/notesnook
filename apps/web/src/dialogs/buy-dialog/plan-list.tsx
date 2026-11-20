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

import { IconBox, buttonProps } from "../../components/settings-ui";
import { Text, Flex, Button, Image, Link, Box } from "@notesnook/ui";
import {
  CheckCircleOutline,
  Loading,
  Cloud,
  FileDoc,
  Picture,
  CheckSvgIcon,
  ArrowRight,
  ShieldCheck,
  CaretDown,
  Table,
  CalendarBlank,
  Prohibit,
  HandCoins
} from "../../components/icons";
import { Plan } from "./types";
import { PERIOD_METADATA, PLAN_METADATA, usePlans } from "./plans";
import { useEffect, useRef, useState } from "react";
import {
  getFeature,
  getFeaturesTable,
  planToAvailability
} from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { Period, SubscriptionPlan } from "@notesnook/core";
import Cameron from "../../assets/testimonials/cameron.jpg";
import AndroidPolice from "../../assets/featured/android-police.svg";
import AndroidPoliceTitle from "../../assets/featured/android-police-title.svg";
import AppleInsider from "../../assets/featured/appleinsider.svg";
import NessLabs from "../../assets/featured/ness-labs.svg";
import PrivacyGuides from "../../assets/featured/privacy-guides.svg";
import PrivacyGuidesTitle from "../../assets/featured/privacy-guides-title.svg";
import Techlore from "../../assets/featured/techlore.svg";
import TechloreTitle from "../../assets/featured/techlore-title.svg";
import TheVerge from "../../assets/featured/theverge.svg";
import FreedomPress from "../../assets/featured/freedom-press.svg";
import XDA from "../../assets/featured/xda.svg";
import { FeatureCaption } from "./feature-caption";
import Accordion from "../../components/accordion";
import { useStore as useUserStore } from "../../stores/user-store";
import { getCurrencySymbol } from "../../common/currencies";
import Star from "../../assets/star.svg";
import { DialogManager } from "../../common/dialog-manager";
import Dialog from "../../components/dialog";

const PLAN_CARD_FEATURES = [
  getFeature("storage"),
  getFeature("fileSize"),
  getFeature("fullQualityImages")
];

type PlansListProps = {
  selectedPlan?: string | null;
  loadAllPlans?: boolean;
  ignoreTrial?: boolean;
  recommendedPlan?: SubscriptionPlan;
  /**
   * "dialog" renders the compact look used inside dialogs (Change plan).
   * Omit for the default full-page look.
   */
  variant?: "dialog";
  onPlanSelected: (plan: Plan) => void;
};

const testimonial = {
  username: "camflint",
  image: Cameron,
  name: "Cameron Flint",
  get role() {
    return strings.verifiedUser();
  },
  link: "https://twitter.com/camflint/status/1481061416434286592",
  text: "I'm pretty impressed at the progress @notesnook are making on their app — particularly in respect to how performant the app runs and behaves, despite the overhead of end-to-end encrypting user data."
};

const testimonials = Array.from({ length: 5 }, () => ({ ...testimonial }));

const FEATURED_ON = [
  {
    id: "android-police",
    logo: AndroidPolice,
    title: AndroidPoliceTitle,
    link: "https://www.androidpolice.com/tried-encrypted-all-in-one-productivity-app-blew-my-mind/"
  },
  {
    id: "theverge",
    logo: TheVerge,
    link: "http://www.theverge.com/23942597/notes-text-evernote-onenote-keep-apps"
  },

  {
    id: "freedom-press",
    logo: FreedomPress,
    link: "https://freedom.press/digisec/blog/note-taking-security/#notesnook"
  },
  {
    id: "privacy-guides",
    logo: PrivacyGuides,
    title: PrivacyGuidesTitle,
    link: "https://www.privacyguides.org/en/notebooks/#notesnook"
  },
  {
    id: "techlore",
    logo: Techlore,
    title: TechloreTitle,
    link: "https://www.youtube.com/watch?v=I9ibGRNjK3E"
  },
  {
    id: "apple-insider",
    logo: AppleInsider,
    link: "https://appleinsider.com/articles/22/08/18/the-best-secure-note-apps-for-ios-ipados-and-macos-to-keep-your-thoughts-private"
  },
  {
    id: "xda",
    logo: XDA,
    link: "https://www.xda-developers.com/note-taking-app-is-onenote-on-steroids/"
  },
  {
    id: "ness-labs",
    logo: NessLabs,
    logoSize: { width: 61, height: 36 },
    link: "https://nesslabs.com/"
  }
];

const FEATURE_ICONS: Record<string, React.ComponentType<{ size: number }>> = {
  storage: Cloud,
  fileSize: FileDoc,
  fullQualityImages: Picture
};

function FeatureIcon({ id }: { id: string }) {
  const Icon = FEATURE_ICONS[id];
  if (!Icon) return null;
  return <Icon size={20} />;
}

export function PlansList(props: PlansListProps) {
  const {
    onPlanSelected,
    selectedPlan,
    loadAllPlans,
    ignoreTrial,
    recommendedPlan,
    variant
  } = props;
  const isDialog = variant === "dialog";
  const { isLoading, plans = [] } = usePlans({ loadAllPlans });
  const [selectedPeriod, setPeriod] = useState<Period>("yearly");
  const user = useUserStore((store) => store.user);

  return (
    <>
      <Flex
        sx={{
          bg: isDialog ? "background-secondary" : "background-tertiary",
          ...(isDialog
            ? { border: "1px solid", borderColor: "border" }
            : { border: "1px solid var(--border-primary)" }),
          borderRadius: isDialog ? "radius3" : "16px",
          alignSelf: "center",
          gap: "spacing4",
          p: "spacing4"
        }}
      >
        {Object.entries(PERIOD_METADATA).map(([id, period]) => (
          <Button
            key={id}
            variant={selectedPeriod === id ? "new_accent" : "new_secondary"}
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: "spacing3",
              bg:
                selectedPeriod === id
                  ? "accent"
                  : isDialog
                  ? "transparent"
                  : "background-tertiary",
              color:
                selectedPeriod === id
                  ? "accentForeground"
                  : "heading-secondary",
              fontWeight: selectedPeriod === id ? 600 : 500,
              border: "none",
              borderRadius: "8px",
              p: "spacing6",
              fontSize: "md"
            }}
            onClick={() => setPeriod(id as Period)}
          >
            {period.title}
            {id === "yearly" && (
              <Text
                sx={{
                  bg: "accent",
                  borderRadius: "50px",
                  px: "spacing2",
                  py: "spacing1",
                  color: "accentForeground",
                  fontSize: "subtitle",
                  fontWeight: "normal",
                  lineHeight: "1"
                }}
              >
                -20%
              </Text>
            )}
          </Button>
        ))}
      </Flex>
      <Flex sx={{ flexDirection: "column", width: "100%" }}>
        <Flex
          sx={{
            flexDirection: ["column", "row"],
            gap: "spacing8"
          }}
        >
          {isLoading ? (
            <Loading />
          ) : (
            plans
              .filter(
                (p) =>
                  p.plan !== SubscriptionPlan.EDUCATION &&
                  p.period === selectedPeriod
              )
              .map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  recommendedPlan={recommendedPlan}
                  selectedPlan={selectedPlan}
                  variant={variant}
                  onPlanSelected={onPlanSelected}
                />
              ))
          )}
        </Flex>
        <Flex
          sx={{
            display: isDialog ? "none" : "flex",
            mt: "spacing7",
            alignItems: "center",
            justifyContent: "space-between",
            p: "spacing6",
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: "radius2"
          }}
        >
          <Flex sx={{ alignItems: "flex-start", gap: "spacing6" }}>
            <IconBox>
              <ShieldCheck size={20} color="icon" />
            </IconBox>
            <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
              <Text
                sx={{
                  color: "heading",
                  fontSize: "lg",
                  fontWeight: 600,
                  lineHeight: 1
                }}
              >
                {strings.cancelAnytimeShort()}
              </Text>
              <Text
                sx={{
                  color: "paragraph",
                  fontSize: "sm",
                  fontWeight: 400,
                  lineHeight: 1
                }}
              >
                {strings.moneyBackGuarantee14Days()}
              </Text>
            </Flex>
          </Flex>
          <Button
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "spacing3"
            }}
            onClick={() => CancelInfoDialog.show({})}
          >
            <Text
              sx={{
                color: "heading-secondary",
                fontSize: "sm",
                fontWeight: 600,
                lineHeight: 1,
                whiteSpace: "nowrap"
              }}
            >
              {strings.learnMore()}
            </Text>
            <CaretDown
              sx={{
                rotate: "-90deg"
              }}
              size={15}
              color="icon-secondary"
            />
          </Button>
        </Flex>
      </Flex>
    </>
  );
}

export function FeaturedOn() {
  return (
    <Flex
      sx={{
        bg: "background",
        flexWrap: "wrap",
        gap: "spacing9",
        px: "spacing14",
        py: "spacing13",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {FEATURED_ON.map((f) => (
        <Link
          key={f.id}
          href={f.link}
          title={f.id}
          target="_blank"
          sx={{
            textDecoration: "none",
            alignSelf: "stretch",
            flexShrink: 0,
            minWidth: 250
          }}
        >
          <Flex
            sx={{
              bg: "background",
              border: "1px solid var(--border-secondary)",
              borderRadius: "16px",
              boxShadow: "0px 4px 25px rgba(0,0,0,0.04)",
              height: "90px",
              px: "spacing9",
              py: "spacing7",
              alignItems: "center",
              gap: "spacing9",
              justifyContent: "center"
            }}
          >
            <Image
              src={f.logo}
              sx={{
                width: f.logoSize?.width,
                height: f.logoSize?.height,
                maxWidth: 200
              }}
            />
            {f.title && <Image src={f.title} />}
          </Flex>
        </Link>
      ))}
    </Flex>
  );
}

export function Footer() {
  return (
    <>
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing13",
          p: "spacing14",
          alignItems: "center",
          position: "relative"
        }}
      >
        <Image
          src={Star}
          sx={{
            position: "absolute",
            top: 36,
            right: 183,
            width: "46px",
            height: "46px"
          }}
        />
        <Image
          src={Star}
          sx={{
            position: "absolute",
            bottom: 8,
            left: 36,
            width: "28px",
            height: "28px"
          }}
        />
        <Flex
          sx={{
            flexDirection: "column",
            gap: "spacing6",
            alignItems: "center"
          }}
        >
          <Text
            variant="heading"
            id="compare-plans"
            sx={{
              fontSize: "2xl",
              textAlign: "center"
            }}
          >
            {strings.frequentlyAskedQuestions()}
          </Text>
          <Text
            variant="body"
            sx={{
              fontSize: "sm",
              color: "paragraph",
              textAlign: "center",
              lineHeight: "1.5"
            }}
          >
            {strings.faqDescription()}
          </Text>
        </Flex>
        <Flex
          sx={{
            flexDirection: "column",
            gap: "spacing6",
            width: "100%"
          }}
        >
          {strings.checkoutFaqs.map((faq, index) => (
            <Accordion
              key={faq.question()}
              title={faq.question()}
              isClosed={index !== 0}
              variant="faq"
              titleSx={{ fontSize: "lg" }}
            >
              <Text
                sx={{
                  fontSize: "sm",
                  color: "paragraph",
                  lineHeight: "1.5"
                }}
              >
                {faq.answer()}
              </Text>
            </Accordion>
          ))}
        </Flex>
      </Flex>
    </>
  );
}

type PricingProps = {
  plan: Plan;
  variant?: "dialog";
};
function RecurringPricing(props: PricingProps) {
  const { plan, variant } = props;
  const isDialog = variant === "dialog";
  const isZero = plan.price.gross === 0;
  const monthlyPrice = toMonthlyPrice(plan.price.gross, plan.period);
  const hasDiscount =
    plan.originalPrice && plan.originalPrice.gross !== plan.price.gross;
  return (
    <>
      <Text
        sx={{
          textDecorationLine: hasDiscount ? "line-through" : "none",
          fontSize: "md",
          color: isDialog ? "heading-secondary" : "paragraph-secondary",
          ...(isDialog ? { fontWeight: 500, lineHeight: 1 } : {})
        }}
      >
        {hasDiscount ? (
          <>
            {getCurrencySymbol(plan.currency)}
            {toMonthlyPrice(plan.originalPrice!.gross, plan.period)}
          </>
        ) : (
          <>&nbsp;</>
        )}
      </Text>

      <Text
        as="span"
        sx={{
          fontWeight: isDialog ? 600 : "bold",
          fontSize: "xl",
          color: "heading",
          ...(isDialog ? { lineHeight: 1 } : {})
        }}
      >
        {getCurrencySymbol(plan.currency)}
        {monthlyPrice}{" "}
        {isZero ? (
          ""
        ) : (
          <Text
            as="span"
            sx={{
              fontSize: "sm",
              color: isDialog ? "paragraph" : "paragraph-secondary",
              fontWeight: 400
            }}
          >
            {" "}
            {strings.perMonth()}
          </Text>
        )}
      </Text>

      <Text
        as="div"
        sx={{
          fontSize: "sm",
          color: isDialog ? "paragraph" : "paragraph-secondary",
          fontWeight: 400,
          ...(isDialog ? { lineHeight: 1 } : {})
        }}
      >
        {isZero
          ? strings.forever()
          : plan.period === "monthly"
          ? ""
          : plan.period === "yearly"
          ? strings.billedAnnually(
              `${getCurrencySymbol(plan.currency)}${plan.price.gross}`
            )
          : plan.period === "5-year"
          ? strings.billedEvery5Years(
              `${getCurrencySymbol(plan.currency)}${plan.price.gross}`
            )
          : ""}
      </Text>
    </>
  );
}

function OneTimePricing(props: PricingProps) {
  const { plan } = props;
  return (
    <>
      <Text as="div" sx={{ fontSize: "lg", fontWeight: 600 }}>
        {getCurrencySymbol(plan.currency)}
        {plan.price.gross}
      </Text>
      <Text
        as="div"
        sx={{ fontSize: "md", fontWeight: 400, color: "paragraph-secondary" }}
      >
        {formatOneTimePeriod(plan.period)}
      </Text>
    </>
  );
}

type ComparePlansProps = {
  /**
   * "dialog" renders the compact card used inside dialogs (Change plan).
   * Omit for the default full-page look.
   */
  variant?: "dialog";
  /** Only for the "dialog" variant: the feature table can be expanded/collapsed. */
  collapsible?: boolean;
};

function limitsOf(row: ReturnType<typeof getFeaturesTable>[number]) {
  const [, ...limits] = row;
  return limits;
}

export function ComparePlans(props: ComparePlansProps = {}) {
  const { variant, collapsible } = props;
  const isDialog = variant === "dialog";
  const [isOpen, setIsOpen] = useState(!collapsible);
  const rows = getFeaturesTable();
  const plans = [
    SubscriptionPlan.FREE,
    SubscriptionPlan.ESSENTIAL,
    SubscriptionPlan.PRO,
    SubscriptionPlan.BELIEVER
  ] as const;
  const cellPx = isDialog ? "spacing6" : "spacing7";
  const cellPy = isDialog ? "spacing4" : "spacing6";

  const table = (
    <Flex
      sx={{
        flexDirection: "column",
        width: "100%",
        bg: "background",
        ...(isDialog
          ? { overflow: "hidden" }
          : { borderRadius: "radius6", p: "spacing7" })
      }}
    >
      <Flex
        sx={{
          bg: "background-selected",
          borderRadius: isDialog ? "radius2" : "16px",
          borderBottom: "1px solid var(--border-secondary)",
          py: isDialog ? 0 : "spacing3"
        }}
      >
        <Flex
          sx={{
            flex: "1 0 0",
            minWidth: 0,
            px: cellPx,
            py: cellPy
          }}
        >
          <Text
            variant="body"
            sx={{
              fontWeight: isDialog ? 500 : 600,
              fontSize: isDialog ? "xs" : "lg",
              color: "heading",
              ...(isDialog ? { lineHeight: 1.2 } : {})
            }}
          >
            Features
          </Text>
        </Flex>
        {plans.map((plan) => (
          <Flex
            key={plan}
            sx={{
              flex: "1 0 0",
              minWidth: 0,
              px: cellPx,
              py: cellPy
            }}
          >
            <Text
              variant="body"
              sx={{
                fontWeight: isDialog ? 500 : 600,
                fontSize: isDialog ? "xs" : "lg",
                color: "heading",
                ...(isDialog ? { lineHeight: 1.2 } : {})
              }}
            >
              {PLAN_METADATA[plan].title}
            </Text>
          </Flex>
        ))}
      </Flex>
      {rows.map((feature, rowIndex) => (
        <Flex
          key={feature[0]}
          sx={{
            bg: rowIndex % 2 === 0 ? "background" : "background-secondary",
            ...(isDialog
              ? { height: "36px", alignItems: "center" }
              : {
                  py: "spacing3",
                  ...(rowIndex % 2 === 1 ? { borderRadius: "16px" } : {})
                })
          }}
        >
          <Flex
            sx={{
              flex: "1 0 0",
              minWidth: 0,
              px: cellPx,
              py: cellPy
            }}
          >
            <Text
              variant="body"
              sx={{
                fontWeight: isDialog ? 400 : 500,
                fontSize: isDialog ? "xs" : "md",
                color: isDialog ? "paragraph" : "heading",
                ...(isDialog ? { lineHeight: 1 } : {})
              }}
            >
              {feature[0]}
            </Text>
          </Flex>
          {limitsOf(feature).map((limit, index) => (
            <Flex
              key={index}
              sx={{
                flex: "1 0 0",
                minWidth: 0,
                px: cellPx,
                py: cellPy
              }}
            >
              {typeof limit.caption === "boolean" ? (
                limit.caption ? (
                  <CheckSvgIcon size={isDialog ? 15 : 20} color="accent" />
                ) : (
                  <Text
                    variant="body"
                    sx={{
                      fontSize: isDialog ? "sm" : "18px",
                      color: "paragraph",
                      ...(isDialog ? { lineHeight: 1 } : {})
                    }}
                  >
                    -
                  </Text>
                )
              ) : limit.caption === "infinity" ? (
                <Text
                  variant="body"
                  sx={{
                    fontSize: isDialog ? "sm" : "18px",
                    color: "paragraph",
                    ...(isDialog ? { lineHeight: 1 } : {})
                  }}
                >
                  ∞
                </Text>
              ) : (
                <Text
                  variant="body"
                  sx={{
                    fontSize: isDialog ? "xs" : "sm",
                    color: "paragraph",
                    ...(isDialog ? { lineHeight: 1 } : {})
                  }}
                >
                  {limit.caption}
                </Text>
              )}
            </Flex>
          ))}
        </Flex>
      ))}
    </Flex>
  );

  if (isDialog) {
    return (
      <Flex
        id="compare-plans"
        sx={{
          flexDirection: "column",
          gap: "spacing7",
          p: "spacing7",
          border: "1px solid",
          borderColor: "border",
          borderRadius: "radius4"
        }}
      >
        <Flex
          {...buttonProps(
            collapsible ? () => setIsOpen((open) => !open) : undefined
          )}
          aria-expanded={collapsible ? isOpen : undefined}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            cursor: collapsible ? "pointer" : "default"
          }}
        >
          <Flex sx={{ alignItems: "flex-start", gap: "spacing3" }}>
            <IconBox>
              <Table size={15} color="icon" />
            </IconBox>
            <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
              <Text
                sx={{
                  fontSize: "lg",
                  fontWeight: 600,
                  lineHeight: 1,
                  color: "heading"
                }}
              >
                {strings.comparePlans()}
              </Text>
              <Text
                sx={{
                  fontSize: "md",
                  fontWeight: 400,
                  lineHeight: 1,
                  color: "paragraph"
                }}
              >
                See what’s included in each plan
              </Text>
            </Flex>
          </Flex>
          {collapsible && (
            <CaretDown
              size={15}
              color="icon-secondary"
              sx={{ rotate: isOpen ? "180deg" : "0deg", flexShrink: 0 }}
            />
          )}
        </Flex>
        {isOpen && table}
      </Flex>
    );
  }

  return (
    <Flex
      sx={{
        flexDirection: "column",
        alignItems: "center",
        gap: "spacing13",
        p: "spacing14",
        position: "relative"
      }}
    >
      <Image
        src={Star}
        sx={{
          position: "absolute",
          top: 60,
          right: 256,
          width: "28px",
          height: "28px"
        }}
      />
      <Image
        src={Star}
        sx={{
          position: "absolute",
          top: 123,
          left: 127,
          width: "45px",
          height: "45px"
        }}
      />
      <Image
        src={Star}
        sx={{
          position: "absolute",
          top: "35%",
          left: 26,
          width: "45px",
          height: "45px"
        }}
      />
      <Image
        src={Star}
        sx={{
          position: "absolute",
          top: "70%",
          right: 10,
          width: "45px",
          height: "45px"
        }}
      />
      <Image
        src={Star}
        sx={{
          position: "absolute",
          bottom: 85,
          left: 362,
          width: "32px",
          height: "32px"
        }}
      />
      <Flex
        sx={{
          flexDirection: "column",
          alignItems: "center",
          gap: "spacing6"
        }}
      >
        <Text
          sx={{
            fontSize: "2xl",
            textAlign: "center",
            color: "heading",
            fontWeight: 600
          }}
          id="compare-plans"
        >
          {strings.comparePlans()}
        </Text>
        <Text
          sx={{
            fontSize: "sm",
            fontWeight: 400,
            color: "paragraph",
            textAlign: "center",
            lineHeight: "1.5",
            maxWidth: 712
          }}
        >
          {strings.comparePlansDescription()}
        </Text>
      </Flex>
      {table}
    </Flex>
  );
}

export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateMaxOffset = () => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;

      setMaxOffset(Math.max(0, track.scrollWidth - viewport.clientWidth));
    };

    updateMaxOffset();

    const resizeObserver = new ResizeObserver(updateMaxOffset);
    if (viewportRef.current) resizeObserver.observe(viewportRef.current);
    if (trackRef.current) resizeObserver.observe(trackRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const lastIndex = Math.ceil(maxOffset / 620);
  const offset = Math.min(currentIndex * 620, maxOffset);

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, lastIndex));
  }, [lastIndex]);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex >= lastIndex;

  const goToPrev = () => {
    if (isFirst) return;
    setCurrentIndex((prev) => prev - 1);
  };

  const goToNext = () => {
    if (isLast) return;
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <Flex
      sx={{
        flexDirection: "column",
        gap: "spacing13",
        py: "spacing14",
        alignItems: "center",
        overflow: "hidden",
        bg: "background",
        position: "relative"
      }}
    >
      <Image
        src={Star}
        sx={{
          position: "absolute",
          top: 93,
          left: 100,
          width: "46px",
          height: "46px"
        }}
      />
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing6",
          alignItems: "center"
        }}
      >
        <Text
          variant="heading"
          sx={{
            fontSize: "2xl",
            textAlign: "center",
            color: "heading",
            fontWeight: 600,
            lineHeight: "100%"
          }}
        >
          Testimonials
        </Text>
        <Text
          variant="body"
          sx={{
            fontSize: "sm",
            color: "paragraph",
            textAlign: "center",
            maxWidth: 689,
            lineHeight: "1.5"
          }}
        >
          {strings.testimonialsDescription()}
        </Text>
      </Flex>
      <Flex
        ref={viewportRef}
        sx={{
          width: "100%",
          overflow: "hidden"
        }}
      >
        <Flex
          ref={trackRef}
          sx={{
            gap: "spacing7",
            transform: `translateX(-${offset}px)`,
            transition: "transform 0.3s ease"
          }}
        >
          {testimonials.map((t, index) => (
            <Flex
              key={index}
              sx={{
                bg: "background",
                border: "1px solid var(--border-secondary)",
                borderRadius: "radius6",
                flexDirection: "column",
                gap: "spacing11",
                px: "spacing7",
                py: "spacing11",
                width: 600,
                flexShrink: 0,
                position: "relative",
                boxShadow: "0px 0px 25px 0px rgba(0,0,0,0.04)",
                overflow: "hidden"
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  border: "1.5px dashed var(--border)",
                  borderRadius: "32px",
                  pointerEvents: "none",
                  left: "8px",
                  right: "8px",
                  top: "6px",
                  bottom: "6px"
                }}
              />
              <Flex
                sx={{
                  flexDirection: "column",
                  gap: "spacing7",
                  alignItems: "flex-start"
                }}
              >
                <Flex sx={{ gap: "spacing6", alignItems: "center" }}>
                  <Flex
                    sx={{
                      bg: "background",
                      border: "0.6px solid var(--border-secondary)",
                      borderRadius: "radius4",
                      p: "spacing2",
                      boxShadow:
                        "0px 4px 1px 0px rgba(0,0,0,0), 0px 3px 1px 0px rgba(0,0,0,0.01), 0px 2px 1px 0px rgba(0,0,0,0.05), 0px 1px 1px 0px rgba(0,0,0,0.09)",
                      flexShrink: 0
                    }}
                  >
                    <Image
                      src={t.image}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "radius3",
                        objectFit: "cover"
                      }}
                    />
                  </Flex>
                  <Flex
                    sx={{
                      flexDirection: "column",
                      gap: "spacing2",
                      alignItems: "flex-start"
                    }}
                  >
                    <Text
                      variant="heading"
                      sx={{
                        fontSize: "xl",
                        fontWeight: 600,
                        lineHeight: "100%",
                        color: "heading"
                      }}
                    >
                      {t.name}
                    </Text>
                    <Text
                      sx={{
                        fontSize: 14,
                        color: "paragraph",
                        lineHeight: "1.3",
                        letterSpacing: "-0.14px",
                        fontWeight: 400
                      }}
                    >
                      {t.role}
                    </Text>
                  </Flex>
                </Flex>
                <Text
                  sx={{
                    fontSize: "sm",
                    color: "paragraph",
                    lineHeight: "1.7",
                    fontWeight: 400
                  }}
                >
                  {t.text}
                </Text>
              </Flex>
            </Flex>
          ))}
        </Flex>
      </Flex>
      <Flex sx={{ gap: "spacing7", alignItems: "center" }}>
        <Flex
          sx={{
            width: 50,
            height: 50,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "radius3",
            bg: "background",
            boxShadow: "0px 4px 64px 0px rgba(0,0,0,0.07)",
            cursor: isFirst ? "default" : "pointer",
            flexShrink: 0,
            opacity: isFirst ? 0.4 : 1
          }}
          onClick={goToPrev}
        >
          <Flex
            sx={{
              transform: "rotate(180deg)"
            }}
          >
            <ArrowRight size={24} color="icon" />
          </Flex>
        </Flex>
        <Flex
          sx={{
            width: 50,
            height: 50,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "radius3",
            bg: "background",
            boxShadow: "0px 4px 64px 0px rgba(0,0,0,0.07)",
            cursor: isLast ? "default" : "pointer",
            flexShrink: 0,
            opacity: isLast ? 0.4 : 1
          }}
          onClick={goToNext}
        >
          <ArrowRight size={24} color="icon" />
        </Flex>
      </Flex>
    </Flex>
  );
}

export function formatOneTimePeriod(period: Period) {
  return period === "monthly"
    ? strings.for1Month()
    : period === "yearly"
    ? strings.for1Year()
    : period === "5-year"
    ? strings.for5Years()
    : "";
}

export function formatRecurringPeriod(period: Period) {
  return period === "monthly"
    ? strings.monthly()
    : period === "yearly"
    ? strings.annually()
    : period === "5-year"
    ? strings.every5Years()
    : "";
}

export function formatRecurringPeriodShort(period: Period) {
  return period === "monthly"
    ? "/mo"
    : period === "yearly"
    ? "/yr"
    : period === "5-year"
    ? "/5yr"
    : "";
}

export function getFullPeriod(period: Period) {
  return period === "monthly" ? "month" : period === "yearly" ? "year" : "";
}

function toMonthlyPrice(price: number, period: Period) {
  return period === "monthly"
    ? price
    : period === "5-year"
    ? (price / (12 * 5)).toFixed(2)
    : (price / 12).toFixed(2);
}

const CancelInfoDialog = DialogManager.register(function CancelInfoDialog(
  props
) {
  return (
    <Dialog
      isOpen={true}
      title={strings.cancelAnytimeHassleFree()}
      description={strings.cancelAnytimeHassleFreeDesc()}
      showCloseButton={true}
      onClose={() => props.onClose(false)}
      width={550}
    >
      <Flex
        sx={{
          mt: "spacing6",
          mb: "spacing7",
          flexDirection: "column",
          gap: "spacing4",
          width: "100%"
        }}
      >
        <CancelInfoCard
          icon={CalendarBlank}
          title={strings.cancelAnytimeShort()}
          description={strings.cancelAnytimeInfo()}
        />
        <CancelInfoCard
          icon={Prohibit}
          title={strings.noCancellationFees()}
          description={strings.noCancellationFeesDesc()}
        />
        <CancelInfoCard
          icon={HandCoins}
          title={strings.refundPolicy()}
          description={strings.refundPolicyDesc()}
        />
      </Flex>
    </Dialog>
  );
});

type CancelInfoCardProps = {
  icon: React.ComponentType<{ size: number; color?: string }>;
  title: string;
  description: string;
};

function CancelInfoCard(props: CancelInfoCardProps) {
  const Icon = props.icon;

  return (
    <Flex
      sx={{
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        p: "spacing5",
        bg: "background-secondary",
        borderRadius: "radius2"
      }}
    >
      <Flex
        sx={{
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "spacing3",
          flex: 1,
          minWidth: 0
        }}
      >
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            bg: "background-tertiary",
            borderRadius: "radius1",
            flexShrink: 0
          }}
        >
          <Icon size={15} color="icon" />
        </Flex>
        <Flex
          sx={{
            flexDirection: "column",
            gap: "spacing3",
            alignItems: "flex-start",
            flex: 1,
            minWidth: 0
          }}
        >
          <Text
            sx={{
              color: "heading",
              fontSize: "sm",
              fontWeight: 500,
              lineHeight: 1,
              whiteSpace: "nowrap"
            }}
          >
            {props.title}
          </Text>
          <Text
            sx={{
              color: "paragraph",
              fontSize: "sm",
              fontWeight: 400,
              lineHeight: 1.4
            }}
          >
            {props.description}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

function PlanCard({
  plan,
  recommendedPlan,
  selectedPlan,
  variant,
  onPlanSelected
}: {
  plan: Plan;
  recommendedPlan?: SubscriptionPlan;
  selectedPlan?: string | null;
  variant?: "dialog";
  onPlanSelected: (plan: Plan) => void;
}) {
  const metadata = PLAN_METADATA[plan.plan];
  const isDialog = variant === "dialog";
  const isRecommended = recommendedPlan === plan.plan;
  const isCurrent = selectedPlan === plan.id;
  const isHighlighted = isRecommended;
  return (
    <Flex
      data-test-id={`checkout-plan`}
      sx={{
        bg: isHighlighted ? "background-selected" : "background",
        border: isHighlighted
          ? "1px solid var(--accent)"
          : "1px solid var(--border-secondary)",
        borderRadius: "radius4",
        flexDirection: "column",
        gap: isDialog ? "spacing8" : "spacing11",
        p: "spacing7",
        flex: 1,
        ...(isDialog ? { minWidth: 0 } : {}),
        boxShadow: isHighlighted
          ? isDialog
            ? "0px 0px 25px rgba(0,0,0,0.12)"
            : "0px 0px 12.5px rgba(0,0,0,0.12)"
          : "0px 0px 12.5px rgba(0,0,0,0.08)"
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing9",
          width: "100%"
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            gap: "spacing4"
          }}
        >
          <Flex
            sx={{
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Text
              variant="heading"
              sx={{
                fontSize: "xl",
                ...(isDialog ? { fontWeight: 600, lineHeight: 1 } : {})
              }}
              data-test-id="title"
            >
              {metadata.title}
            </Text>
            {(plan.discount?.type === "regional" || isRecommended) && (
              <Text
                variant="subBody"
                sx={{
                  bg: "accent",
                  borderRadius: "50px",
                  px: "spacing3",
                  py: "spacing2",
                  color: "accentForeground",
                  fontSize: isDialog ? "subtitle" : "sm",
                  lineHeight: "100%"
                }}
              >
                {plan.discount?.type === "regional"
                  ? strings.percentOff(`${plan.discount.amount}`).toUpperCase()
                  : strings.recommended()}
              </Text>
            )}
          </Flex>
          <Text
            sx={{
              fontSize: "sm",
              color: "paragraph",
              fontWeight: "normal",
              ...(isDialog ? { lineHeight: 1 } : {})
            }}
          >
            {metadata.subtitle}
          </Text>
        </Flex>
        <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
          {plan.recurring ? (
            <RecurringPricing plan={plan} variant={variant} />
          ) : (
            <OneTimePricing plan={plan} />
          )}
        </Flex>
        <Flex
          sx={{
            flexDirection: "column",
            gap: "spacing6"
          }}
        >
          {PLAN_CARD_FEATURES.map((feature, index) => {
            const caption =
              feature.availability[planToAvailability(plan.plan)].caption;
            return (
              <Flex
                key={feature.id}
                sx={{
                  pt: index > 0 ? "spacing6" : 0,
                  borderTop:
                    index > 0 ? "1px solid var(--border-secondary)" : "none",
                  borderColor: isHighlighted
                    ? "accent-secondary"
                    : "border-secondary",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <Flex sx={{ gap: "spacing6", alignItems: "center" }}>
                  <FeatureIcon id={feature.id} />
                  <Text
                    sx={{
                      fontSize: "md",
                      color: "paragraph",
                      fontWeight: "normal",
                      ...(isDialog ? { lineHeight: 1 } : {})
                    }}
                  >
                    {feature.title}
                  </Text>
                </Flex>
                <Text
                  sx={{
                    fontSize: isDialog ? "md" : "sm",
                    fontWeight: isDialog ? 600 : "bold",
                    color: "paragraph",
                    ...(isDialog ? { lineHeight: 1 } : {})
                  }}
                >
                  <FeatureCaption caption={caption} />
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
      {isCurrent ? (
        <Flex
          sx={{
            alignItems: "center",
            gap: 1,
            ...(isDialog ? { mt: "auto" } : {})
          }}
        >
          <CheckCircleOutline color="accent" size={16} />
          <Text variant="subBody">{strings.youAreOnThisPlan()}</Text>
        </Flex>
      ) : (
        <Button
          variant={isHighlighted ? "new_accent" : "new_secondary"}
          onClick={() => onPlanSelected(plan)}
          sx={{
            width: "100%",
            ...(!isDialog ? { fontSize: "md" } : {}),
            ...(isDialog
              ? {
                  mt: "auto",
                  fontWeight: 600,
                  lineHeight: 1,
                  ...(isHighlighted
                    ? { fontSize: "sm", px: "spacing4", py: "spacing5" }
                    : { fontSize: "md", px: "spacing5", py: "spacing6" })
                }
              : {})
          }}
        >
          {strings.selectPlan()}
        </Button>
      )}
    </Flex>
  );
}
