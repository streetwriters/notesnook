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

import { Text, Flex, Button, Image, Link, Box } from "@theme-ui/components";
import { CheckCircleOutline, Loading } from "../../components/icons";
import { Plan } from "./types";
import { PERIOD_METADATA, PLAN_METADATA, usePlans } from "./plans";
import { useState } from "react";
import { FEATURE_HIGHLIGHTS, isTrialAvailableForPlan } from "./helpers";
import { strings } from "@notesnook/intl";
import { Period, SubscriptionPlan } from "@notesnook/core";
import Cameron from "../../assets/testimonials/cameron.jpg";
import AndroidPolice from "../../assets/featured/android-police.svg";
import AppleInsider from "../../assets/featured/appleinsider.svg";
import Hackernoon from "../../assets/featured/hackernoon.png";
import ItsFoss from "../../assets/featured/itsfoss.webp";
import XDA from "../../assets/featured/xda.svg";
import PrivacyGuides from "../../assets/featured/privacy-guides.svg";
import Techlore from "../../assets/featured/techlore.svg";
import TheVerge from "../../assets/featured/theverge.svg";
import FreedomPress from "../../assets/featured/freedom-press.svg";
import { getFeaturesTable, planToAvailability } from "@notesnook/common";
import { FeatureCaption } from "./feature-caption";
import Accordion from "../../components/accordion";
import { useStore as useUserStore } from "../../stores/user-store";
import { getCurrencySymbol } from "../../common/currencies";

type PlansListProps = {
  selectedPlan?: string | null;
  loadAllPlans?: boolean;
  ignoreTrial?: boolean;
  recommendedPlan?: SubscriptionPlan;
  onPlanSelected: (plan: Plan) => void;
};

const testimonial = {
  username: "camflint",
  image: Cameron,
  name: "Cameron Flint",
  link: "https://twitter.com/camflint/status/1481061416434286592",
  text: "I'm pretty impressed at the progress @notesnook are making on their app — particularly in respect to how performant the app runs and behaves, despite the overhead of end-to-end encrypting user data."
};

const FEATURED_ON = [
  {
    id: "android-police",
    logo: AndroidPolice,
    size: 70,
    filter: {
      light: `grayscale(1) contrast(100) brightness(1)`
    },
    link: "https://www.androidpolice.com/tried-encrypted-all-in-one-productivity-app-blew-my-mind/"
  },
  {
    id: "apple-insider",
    logo: AppleInsider,
    link: "https://appleinsider.com/articles/22/08/18/the-best-secure-note-apps-for-ios-ipados-and-macos-to-keep-your-thoughts-private"
  },
  {
    id: "itsfoss",
    logo: ItsFoss,
    link: "https://news.itsfoss.com/standard-notes-to-notesnook/"
  },
  {
    id: "Hackernoon",
    logo: Hackernoon,
    link: "https://hackernoon.com/top-6-privacy-note-apps-for-linux-and-android-that-actually-sync"
  },
  {
    id: "xda",
    logo: XDA,
    size: 100,
    link: "https://www.xda-developers.com/note-taking-app-is-onenote-on-steroids/"
  }
];

const RECOMMENDED_BY = [
  {
    id: "privacy-guides",
    logo: PrivacyGuides,
    size: 45,
    link: "https://www.privacyguides.org/en/notebooks/#notesnook"
  },
  {
    id: "techlore",
    logo: Techlore,
    size: 45,
    link: "https://www.youtube.com/watch?v=I9ibGRNjK3E"
  },
  {
    id: "theverge",
    logo: TheVerge,
    size: 140,
    link: "http://www.theverge.com/23942597/notes-text-evernote-onenote-keep-apps"
  },
  {
    id: "freedom-press",
    logo: FreedomPress,
    filter: {
      light: `grayscale(1) contrast(100) brightness(0)`,
      dark: "brightness(0) invert(1)"
    },
    link: "https://freedom.press/digisec/blog/note-taking-security/#notesnook"
  }
];

export function PlansList(props: PlansListProps) {
  const {
    onPlanSelected,
    selectedPlan,
    loadAllPlans,
    ignoreTrial,
    recommendedPlan
  } = props;
  const { isLoading, plans = [] } = usePlans({ loadAllPlans });
  const [selectedPeriod, setPeriod] = useState<Period>("yearly");
  const user = useUserStore((store) => store.user);

  return (
    <>
      <Flex
        sx={{
          mt: 25,
          bg: "background-secondary",
          border: "1px solid var(--border)",
          borderRadius: "100px",
          overflow: "hidden",
          alignSelf: "center"
        }}
      >
        {Object.entries(PERIOD_METADATA).map(([id, period]) => (
          <Button
            key={id}
            variant={selectedPeriod === id ? "accent" : "secondary"}
            sx={{
              bg: selectedPeriod === id ? "accent-selected" : "transparent",
              color:
                selectedPeriod === id
                  ? "accentForeground-selected"
                  : "paragraph",
              borderRadius: 100,
              py: 1
            }}
            onClick={() => setPeriod(id as Period)}
          >
            {period.title}
          </Button>
        ))}
      </Flex>
      <Flex
        mt={2}
        sx={{
          flexDirection: "row",
          gap: 2,
          alignItems: "center",
          justifyContent: "center"
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
            .map((plan) => {
              const metadata = PLAN_METADATA[plan.plan];
              return (
                <Flex
                  key={plan.id}
                  data-test-id={`checkout-plan`}
                  mt={1}
                  sx={{
                    maxWidth: 300,
                    p: 2,
                    flexShrink: 0,
                    flex: 1,
                    textAlign: "start",
                    display: "flex",
                    flexDirection: "column",
                    border:
                      recommendedPlan === plan.plan
                        ? "2px solid var(--accent)"
                        : "1px solid var(--border)",
                    borderRadius: "dialog"
                  }}
                >
                  <Flex
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "start"
                    }}
                  >
                    <Text
                      variant="title"
                      sx={{
                        color: "heading-secondary"
                      }}
                      data-test-id="title"
                    >
                      {metadata.title}
                    </Text>{" "}
                    {recommendedPlan === plan.plan ? (
                      <Text
                        variant="subBody"
                        sx={{
                          bg: "accent",
                          color: "accentForeground",
                          borderRadius: 100,
                          px: 1,
                          py: "small"
                        }}
                      >
                        Most popular
                      </Text>
                    ) : null}
                  </Flex>

                  <Text
                    variant="body"
                    sx={{
                      color: "paragraph-secondary"
                    }}
                  >
                    {metadata.subtitle}
                  </Text>
                  <Text sx={{ mt: 1 }} variant="body">
                    {plan.recurring ? (
                      <RecurringPricing plan={plan} />
                    ) : (
                      <OneTimePricing plan={plan} />
                    )}
                  </Text>
                  <Flex
                    sx={{
                      flexDirection: "column",
                      pt: 2,
                      mt: 1,
                      gap: 1,
                      borderTop: "1px solid var(--border)"
                    }}
                  >
                    {FEATURE_HIGHLIGHTS.map((feature) => {
                      const caption =
                        feature.availability[planToAvailability(plan.plan)]
                          .caption;
                      return (
                        <Flex
                          key={feature.id}
                          sx={{ justifyContent: "space-between" }}
                        >
                          <Text variant="body">{feature.title}</Text>
                          <Text
                            variant="body"
                            sx={{ color: "paragraph-secondary" }}
                          >
                            <FeatureCaption caption={caption} />
                          </Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                  {selectedPlan === plan.id ? (
                    <Flex sx={{ mt: 2, alignItems: "center", gap: 1 }}>
                      <CheckCircleOutline color="accent" size={16} />
                      <Text variant="subBody">You are on this plan.</Text>
                    </Flex>
                  ) : (
                    <Button
                      variant={
                        recommendedPlan === plan.plan ? "accent" : "secondary"
                      }
                      onClick={() => onPlanSelected(plan)}
                      sx={{ mt: 2 }}
                    >
                      {isTrialAvailableForPlan(plan.plan, user) && !ignoreTrial
                        ? "Start your free trial"
                        : "Select plan"}
                    </Button>
                  )}
                </Flex>
              );
            })
        )}
      </Flex>

      <Text variant="body" sx={{ alignSelf: "center", mt: 2 }}>
        Cancel anytime. {PERIOD_METADATA[selectedPeriod].refundDays}-day
        money-back guarantee.
      </Text>
      <Button
        variant="tertiary"
        sx={{ alignSelf: "center", mt: 25 }}
        onClick={() =>
          document
            .getElementById("compare-plans")
            ?.scrollIntoView({ behavior: "smooth" })
        }
      >
        Compare all plans
      </Button>
      <Flex
        sx={{ alignItems: "center", justifyContent: "center", gap: 4, mt: 50 }}
      >
        {FEATURED_ON.map((f) => (
          <Link key={f.id} href={f.link} title={f.id} target="_blank">
            <Image
              src={f.logo}
              width={f.size || 200}
              css={`
                [data-theme="dark"] & {
                  filter: ${"grayscale(1) invert(1)"};
                }
                [data-theme="light"] & {
                  filter: ${f.filter?.light || "grayscale(1)"};
                  mix-blend-mode: multiply;
                }
              `}
              sx={{
                objectFit: "scale-down"
              }}
            />
          </Link>
        ))}
      </Flex>
      <Testimonial />
    </>
  );
}

export function Footer() {
  return (
    <>
      <Text
        variant="title"
        sx={{ alignSelf: "center", fontSize: "heading", mb: 25, mt: 100 }}
        id="compare-plans"
      >
        FAQs
      </Text>
      <Flex sx={{ flexDirection: "column", gap: 2 }}>
        {strings.checkoutFaqs.map((faq) => (
          <Accordion key={faq.question()} title={faq.question()} isClosed>
            <Text>{faq.answer()}</Text>
          </Accordion>
        ))}
      </Flex>
      <Text
        variant="heading"
        sx={{ fontSize: "subheading", textAlign: "center", mt: 100 }}
      >
        Trusted and recommended by over 200K users
      </Text>
      <Flex
        sx={{ alignItems: "center", justifyContent: "center", gap: 4, mt: 4 }}
      >
        {RECOMMENDED_BY.map((f) => (
          <Link key={f.id} href={f.link} title={f.id} target="_blank">
            <Image
              src={f.logo}
              width={f.size || 200}
              css={`
                [data-theme="dark"] & {
                  filter: ${f.filter?.dark || "grayscale(1) invert(1)"};
                }
                [data-theme="light"] & {
                  filter: ${f.filter?.light || "grayscale(1)"};
                  mix-blend-mode: multiply;
                }
              `}
              sx={{
                objectFit: "scale-down"
              }}
            />
          </Link>
        ))}
      </Flex>
      <Button
        variant="accent"
        sx={{ alignSelf: "center", mt: 2, mb: 25 }}
        onClick={() =>
          document
            .getElementById("select-plan")
            ?.scrollIntoView({ behavior: "smooth" })
        }
      >
        Upgrade now
      </Button>
    </>
  );
}

type PricingProps = {
  plan: Plan;
};
function RecurringPricing(props: PricingProps) {
  const { plan } = props;
  const isZero = plan.price.gross === 0;
  const monthlyPrice = toMonthlyPrice(plan.price.gross, plan.period);
  return (
    <>
      {plan.originalPrice && plan.originalPrice.gross !== plan.price.gross ? (
        <Flex sx={{ justifyContent: "space-between" }}>
          <Text
            sx={{
              textDecorationLine: "line-through",
              fontSize: "subtitle",
              color: "var(--paragraph-secondary)"
            }}
          >
            {getCurrencySymbol(plan.currency)}
            {toMonthlyPrice(plan.originalPrice.gross, plan.period)}
          </Text>
          {plan.discount?.type === "regional" ? (
            <Text
              variant="subBody"
              sx={{
                bg: "shade",
                color: "accent",
                borderRadius: 100,
                px: 1,
                py: "small"
              }}
            >
              {plan.discount?.amount}% off in {plan.country}
            </Text>
          ) : null}
        </Flex>
      ) : (
        <br />
      )}
      <Text variant="heading" sx={{ fontWeight: "normal", fontSize: "2em" }}>
        {getCurrencySymbol(plan.currency)}
        {monthlyPrice}{" "}
        {isZero ? (
          ""
        ) : (
          <Text sx={{ fontSize: "title", color: "paragraph-secondary" }}>
            / month
          </Text>
        )}
      </Text>
      <Text as="div" variant="subBody">
        {isZero ? (
          "forever"
        ) : plan.period === "monthly" ? (
          ""
        ) : (
          <>
            billed {formatRecurringPeriod(plan.period)} at{" "}
            {getCurrencySymbol(plan.currency)}
            {plan.price.gross}
          </>
        )}
      </Text>
    </>
  );
}

function OneTimePricing(props: PricingProps) {
  const { plan } = props;
  return (
    <>
      <Text as="div" sx={{ fontSize: "subtitle", fontWeight: "bold" }}>
        {getCurrencySymbol(plan.currency)}
        {plan.price.gross}
      </Text>
      <Text as="div" variant="subBody">
        {formatOneTimePeriod(plan.period)}
      </Text>
    </>
  );
}

const rows = getFeaturesTable();
export function ComparePlans() {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        // alignSelf: "center",
        bg: "background-secondary",
        border: "1px solid var(--border)",
        borderRadius: "dialog",
        p: 50
      }}
    >
      <Text
        variant="title"
        sx={{ alignSelf: "center", fontSize: "heading", mb: 25 }}
        id="compare-plans"
      >
        Compare plans
      </Text>
      <table
        style={{
          tableLayout: "fixed",
          borderCollapse: "collapse"
        }}
        cellPadding={0}
        cellSpacing={0}
      >
        <thead>
          <Box
            as="tr"
            sx={{
              height: 30,
              th: { borderBottom: "1px solid var(--separator)" }
            }}
          >
            {[
              { id: "id", title: "", width: "5%" },
              ...[
                SubscriptionPlan.FREE,
                SubscriptionPlan.ESSENTIAL,
                SubscriptionPlan.PRO,
                SubscriptionPlan.BELIEVER
              ].map((p) => ({
                id: p,
                title: PLAN_METADATA[p].title,
                width: "20%"
              }))
            ].map((column) =>
              !column.title ? (
                <th key={column.id} />
              ) : (
                <Box
                  as="th"
                  key={column.id}
                  sx={{
                    width: column.width,
                    px: 1,
                    mb: 2,
                    textAlign: "center"
                  }}
                >
                  <Text variant="subtitle" sx={{ textAlign: "center" }}>
                    {column.title}
                  </Text>
                </Box>
              )
            )}
          </Box>
        </thead>
        <tbody>
          {rows.map((feature) => (
            <Box key={feature[0]} as="tr" sx={{ height: 30 }}>
              <Text
                as="td"
                variant="body"
                sx={{ overflow: "hidden", whiteSpace: "nowrap" }}
              >
                {feature[0]}
              </Text>
              {feature.slice(1).map((limit, index) => (
                <Text
                  key={index}
                  as="td"
                  variant="body"
                  sx={{ textAlign: "center" }}
                >
                  <FeatureCaption caption={(limit as any).caption} />
                </Text>
              ))}
            </Box>
          ))}
        </tbody>
      </table>
    </Flex>
  );
}

function Testimonial() {
  return (
    <Flex sx={{ flexDirection: "column", width: "40%", alignSelf: "center" }}>
      <Text
        variant="body"
        sx={{
          fontSize: "body",
          color: "paragraph-secondary",
          mt: 5,
          textAlign: "center"
        }}
      >
        {testimonial.text} —{" "}
        <Link
          sx={{ fontStyle: "italic", color: "paragraph-secondary" }}
          href={testimonial.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          source
        </Link>
      </Text>
      <Flex mt={2} sx={{ alignItems: "center", justifyContent: "center" }}>
        <Image src={testimonial.image} sx={{ borderRadius: 50, width: 40 }} />
        <Flex ml={2} sx={{ flexDirection: "column" }}>
          <Text variant="body" sx={{ fontSize: 14, fontWeight: "bold" }}>
            {testimonial.name}
          </Text>
          <Text variant="subBody">@{testimonial.username}</Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

export function formatOneTimePeriod(period: Period) {
  return period === "monthly"
    ? "for 1 month"
    : period === "yearly"
    ? "for 1 year"
    : period === "5-year"
    ? "for 5 years"
    : "";
}

export function formatRecurringPeriod(period: Period) {
  return period === "monthly"
    ? "monthly"
    : period === "yearly"
    ? "annually"
    : period === "5-year"
    ? "every 5 years"
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
