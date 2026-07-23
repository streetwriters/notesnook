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

import { Text, Flex, Button, Image, Link, Box } from "@notesnook/ui";
import {
  CheckCircleOutline,
  Loading,
  Cloud,
  FileDoc,
  Picture,
  CheckSvgIcon,
  ArrowRightSvgIcon
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
import AppleInsider from "../../assets/featured/appleinsider.svg";
// import Hackernoon from "../../assets/featured/hackernoon.png";
import ItsFoss from "../../assets/featured/itsfoss.webp";
import XDA from "../../assets/featured/xda.svg";
import PrivacyGuides from "../../assets/featured/privacy-guides.svg";
import Techlore from "../../assets/featured/techlore.svg";
import TheVerge from "../../assets/featured/theverge.svg";
import FreedomPress from "../../assets/featured/freedom-press.svg";
import { FeatureCaption } from "./feature-caption";
import Accordion from "../../components/accordion";
import { useStore as useUserStore } from "../../stores/user-store";
import { getCurrencySymbol } from "../../common/currencies";
import Star from "../../assets/star.svg";

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
  onPlanSelected: (plan: Plan) => void;
};

const testimonial = {
  username: "camflint",
  image: Cameron,
  name: "Cameron Flint",
  role: "Verified User",
  link: "https://twitter.com/camflint/status/1481061416434286592",
  text: "I'm pretty impressed at the progress @notesnook are making on their app — particularly in respect to how performant the app runs and behaves, despite the overhead of end-to-end encrypting user data."
};

const testimonials = Array.from({ length: 5 }, () => ({ ...testimonial }));

const FEATURED_ON = [
  {
    id: "android-police",
    logo: AndroidPolice,
    title: "Android Police",
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
    title: "Privacy Guides",
    link: "https://www.privacyguides.org/en/notebooks/#notesnook"
  },
  {
    id: "techlore",
    logo: Techlore,
    title: "Techlore",
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
    id: "itsfoss",
    logo: ItsFoss,
    link: "https://news.itsfoss.com/standard-notes-to-notesnook/"
  }
  // {
  //   id: "Hackernoon",
  //   logo: Hackernoon,
  //   link: "https://hackernoon.com/top-6-privacy-note-apps-for-linux-and-android-that-actually-sync"
  // },
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
    recommendedPlan
  } = props;
  const { isLoading, plans = [] } = usePlans({ loadAllPlans });
  const [selectedPeriod, setPeriod] = useState<Period>("yearly");
  const user = useUserStore((store) => store.user);

  return (
    <>
      <Flex
        sx={{
          bg: "background-tertiary",
          border: "1px solid var(--border-primary)",
          borderRadius: "16px",
          alignSelf: "center",
          gap: "spacing4",
          p: "spacing4"
        }}
      >
        {Object.entries(PERIOD_METADATA).map(([id, period]) => (
          <Button
            variant={selectedPeriod === id ? "new_accent" : "new_secondary"}
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: "9px",
              bg: selectedPeriod === id ? "accent" : "background-tertiary",
              fontWeight: selectedPeriod === id ? 600 : 500,
              borderRadius: "8px",
              p: "spacing6"
            }}
            onClick={() => setPeriod(id as Period)}
          >
            {period.title}
            {id === "yearly" && (
              <Text
                sx={{
                  bg: "accent",
                  borderRadius: "50px",
                  px: "5px",
                  py: "3px",
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
      <Flex
        sx={{
          flexDirection: ["column", "row"],
          gap: "spacing8",
          alignItems: "center",
          justifyContent: "center",
          width: "100%"
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
              const isRecommended = recommendedPlan === plan.plan;
              return (
                <Flex
                  key={plan.id}
                  data-test-id={`checkout-plan`}
                  sx={{
                    bg: isRecommended ? "background-selected" : "background",
                    border: isRecommended
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border-secondary)",
                    borderRadius: "radius4",
                    flexDirection: "column",
                    gap: "spacing11",
                    px: "spacing7",
                    py: "spacing11",
                    flex: "1 0 0",
                    maxWidth: "500px",
                    boxShadow: isRecommended
                      ? "0px 0px 12.5px rgba(0,0,0,0.12)"
                      : "0px 0px 12.5px rgba(0,0,0,0.08)"
                  }}
                >
                  <Flex
                    sx={{
                      flexDirection: "column",
                      gap: "32px",
                      width: "100%"
                    }}
                  >
                    <Flex
                      sx={{
                        flexDirection: "column",
                        gap: "12px"
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
                          sx={{ fontSize: "2xl" }}
                          data-test-id="title"
                        >
                          {metadata.title}
                        </Text>
                        {isRecommended && (
                          <Flex
                            sx={{
                              bg: "accent",
                              borderRadius: "50px",
                              px: "8px",
                              py: "4px"
                            }}
                          >
                            <Text
                              variant="subBody"
                              sx={{
                                color: "accentForeground",
                                fontSize: "md",
                                fontWeight: 500,
                                lineHeight: "1"
                              }}
                            >
                              Recommended
                            </Text>
                          </Flex>
                        )}
                      </Flex>
                      <Text
                        sx={{
                          fontSize: "sm",
                          color: "paragraph",
                          fontWeight: "normal"
                        }}
                      >
                        {metadata.subtitle}
                      </Text>
                    </Flex>
                    <Flex sx={{ flexDirection: "column" }}>
                      {plan.recurring ? (
                        <RecurringPricing plan={plan} />
                      ) : (
                        <OneTimePricing plan={plan} />
                      )}
                    </Flex>
                    <Flex
                      sx={{
                        flexDirection: "column",
                        gap: "16px"
                      }}
                    >
                      {PLAN_CARD_FEATURES.map((feature, index) => {
                        const caption =
                          feature.availability[planToAvailability(plan.plan)]
                            .caption;
                        return (
                          <Flex
                            key={feature.id}
                            sx={{ flexDirection: "column", gap: "16px" }}
                          >
                            <Flex
                              sx={{
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}
                            >
                              <Flex sx={{ gap: "12px", alignItems: "center" }}>
                                <FeatureIcon id={feature.id} />
                                <Text
                                  sx={{
                                    fontSize: "18px",
                                    color: "paragraph",
                                    fontWeight: "normal"
                                  }}
                                >
                                  {feature.title}
                                </Text>
                              </Flex>
                              <Text
                                sx={{
                                  fontSize: "title",
                                  fontWeight: "bold",
                                  color: "paragraph"
                                }}
                              >
                                <FeatureCaption caption={caption} />
                              </Text>
                            </Flex>
                            {index < PLAN_CARD_FEATURES.length - 1 && (
                              <Box
                                sx={{
                                  borderTop:
                                    "1px solid var(--border-secondary)",
                                  width: "100%"
                                }}
                              />
                            )}
                          </Flex>
                        );
                      })}
                    </Flex>
                  </Flex>
                  {selectedPlan === plan.id ? (
                    <Flex sx={{ alignItems: "center", gap: 1 }}>
                      <CheckCircleOutline color="accent" size={16} />
                      <Text variant="subBody">You are on this plan.</Text>
                    </Flex>
                  ) : (
                    <Button
                      variant={isRecommended ? "new_accent" : "new_secondary"}
                      onClick={() => onPlanSelected(plan)}
                      sx={{
                        width: "100%"
                      }}
                    >
                      Select Plan
                    </Button>
                  )}
                </Flex>
              );
            })
        )}
      </Flex>

      {/* <Text variant="body" sx={{ alignSelf: "center", mt: 2 }}> */}
      {/* Cancel anytime. {PERIOD_METADATA[selectedPeriod].refundDays}-day */}
      {/* money-back guarantee. */}
      {/* </Text> */}
      {/* <Button
        variant="tertiary"
        sx={{ alignSelf: "center", mt: 25 }}
        onClick={() =>
          document
            .getElementById("compare-plans")
            ?.scrollIntoView({ behavior: "smooth" })
        }
      >
        Compare all plans
      </Button> */}
    </>
  );
}

export function FeaturedOn() {
  return (
    <Flex
      sx={{
        bg: "background",
        flexWrap: "wrap",
        gap: "32px",
        px: "80px",
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
          sx={{ textDecoration: "none", alignSelf: "stretch", flexShrink: 0 }}
        >
          <Flex
            sx={{
              bg: "background",
              border: "1px solid var(--border-secondary)",
              borderRadius: "16px",
              boxShadow: "0px 4px 25px rgba(0,0,0,0.04)",
              height: "90px",
              px: "32px",
              py: "spacing7",
              alignItems: "center",
              gap: "12px"
            }}
          >
            <Image
              src={f.logo}
              sx={{
                maxWidth: 200
              }}
            />
            {f.title && (
              <Text
                sx={{
                  color: "heading",
                  fontSize: "xl",
                  fontWeight: 600,
                  lineHeight: "100%"
                }}
              >
                {f.title}
              </Text>
            )}
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
          gap: "50px",
          p: "80px",
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
            Frequently Asked Questions
          </Text>
          <Text
            variant="body"
            sx={{
              fontSize: "sm",
              color: "paragraph",
              textAlign: "center",
              maxWidth: "640px",
              lineHeight: "1.5"
            }}
          >
            Find answers to common questions about Notesnook, including
            features, syncing, privacy, and more. Learn more about how the app
            works and get clarity.
          </Text>
        </Flex>
        <Flex
          sx={{
            flexDirection: "column",
            gap: "16px",
            width: "100%",
            maxWidth: 1200
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
      <Button
        variant="new_accent"
        sx={{ alignSelf: "center", mt: "spacing2", mb: "spacing13" }}
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
              fontSize: "md",
              color: "paragraph-secondary"
            }}
          >
            {getCurrencySymbol(plan.currency)}
            {toMonthlyPrice(plan.originalPrice.gross, plan.period)}
          </Text>
          {plan.discount?.type === "regional" ? (
            <Text
              sx={{
                fontSize: "xxxs",
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
      ) : null}
      <Text
        as="span"
        sx={{
          fontWeight: "bold",
          fontSize: "lg",
          color: "heading"
        }}
      >
        {getCurrencySymbol(plan.currency)}
        {monthlyPrice}
      </Text>
      {isZero ? (
        ""
      ) : (
        <Text
          as="span"
          sx={{
            fontSize: "md",
            color: "paragraph-secondary",
            fontWeight: 400
          }}
        >
          {" "}
          / month
        </Text>
      )}
      <Text
        as="div"
        sx={{ fontSize: "xxs", color: "paragraph-secondary", fontWeight: 400 }}
      >
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

const rows = getFeaturesTable();
export function ComparePlans() {
  const plans = [
    SubscriptionPlan.FREE,
    SubscriptionPlan.ESSENTIAL,
    SubscriptionPlan.PRO,
    SubscriptionPlan.BELIEVER
  ];

  return (
    <Flex
      sx={{
        flexDirection: "column",
        alignItems: "center",
        gap: 50,
        p: "80px",
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
          Compare Plans
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
          Choose the plan that fits your workflow and unlock features for secure
          note taking. Compare storage, syncing, privacy, and productivity
          features to find the experience
        </Text>
      </Flex>
      <Flex
        sx={{
          flexDirection: "column",
          width: "100%",
          bg: "background",
          borderRadius: "radius6",
          p: "spacing7",
          maxWidth: 1200
        }}
      >
        <Flex
          sx={{
            bg: "background-selected",
            borderRadius: "16px",
            borderBottom: "1px solid var(--border-secondary)",
            py: "8px"
          }}
        >
          <Flex
            sx={{
              flex: "1 0 0",
              minWidth: 0,
              px: "spacing7",
              py: "16px"
            }}
          >
            <Text
              variant="body"
              sx={{
                fontWeight: 600,
                fontSize: "lg",
                color: "heading"
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
                px: "spacing7",
                py: "16px"
              }}
            >
              <Text
                variant="body"
                sx={{
                  fontWeight: 600,
                  fontSize: "lg",
                  color: "heading"
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
              py: "8px",
              ...(rowIndex % 2 === 1 ? { borderRadius: "16px" } : {})
            }}
          >
            <Flex
              sx={{
                flex: "1 0 0",
                minWidth: 0,
                px: "spacing7",
                py: "16px"
              }}
            >
              <Text
                variant="body"
                sx={{
                  fontWeight: 500,
                  fontSize: "18px",
                  color: "heading"
                }}
              >
                {feature[0]}
              </Text>
            </Flex>
            {feature.slice(1).map((limit, index) => (
              <Flex
                key={index}
                sx={{
                  flex: "1 0 0",
                  minWidth: 0,
                  px: "spacing7",
                  py: "16px"
                }}
              >
                {typeof (limit as any).caption === "boolean" ? (
                  (limit as any).caption ? (
                    <CheckSvgIcon size={20} color="accent" />
                  ) : (
                    <Text
                      variant="body"
                      sx={{
                        fontSize: "18px",
                        color: "paragraph"
                      }}
                    >
                      -
                    </Text>
                  )
                ) : (limit as any).caption === "infinity" ? (
                  <Text
                    variant="body"
                    sx={{
                      fontSize: "18px",
                      color: "paragraph"
                    }}
                  >
                    ∞
                  </Text>
                ) : (
                  <Text
                    variant="body"
                    sx={{
                      fontSize: "18px",
                      color: "paragraph"
                    }}
                  >
                    {(limit as any).caption}
                  </Text>
                )}
              </Flex>
            ))}
          </Flex>
        ))}
      </Flex>
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
        py: "80px",
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
          See how people use Notesnook to organize ideas, manage daily work, and
          stay focused with a calm and secure writing experience.
        </Text>
      </Flex>
      <Flex
        ref={viewportRef}
        sx={{
          width: "100%",
          overflow: "hidden",
          maxWidth: 1500
        }}
      >
        <Flex
          ref={trackRef}
          sx={{
            gap: "20px",
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
                gap: "40px",
                px: "20px",
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
                  gap: "20px",
                  alignItems: "flex-start"
                }}
              >
                <Flex sx={{ gap: "12px", alignItems: "center" }}>
                  <Flex
                    sx={{
                      bg: "background",
                      border: "0.6px solid var(--border-secondary)",
                      borderRadius: "radius4",
                      p: "4px",
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
                      gap: "4px",
                      alignItems: "flex-start"
                    }}
                  >
                    <Text
                      variant="heading"
                      sx={{
                        fontSize: "lg",
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
      <Flex sx={{ gap: "20px", alignItems: "center" }}>
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
            <ArrowRightSvgIcon size={24} color="icon" />
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
          <ArrowRightSvgIcon size={24} color="icon" />
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
