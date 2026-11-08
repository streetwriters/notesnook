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

import { Button, Dialog, Flex, Text } from "@ui";
import {
  CheckCircleOutline,
  Loading,
  Cloud,
  FileDoc,
  Picture,
  ShieldCheck,
  CaretDown,
  CalendarBlank,
  Check,
  Prohibit,
  HandCoins,
  type Icon
} from "../../components/icons";
import {
  getFeature,
  getFeaturesTable,
  planToAvailability
} from "@notesnook/common";
import { Plan } from "./types";
import { PERIOD_METADATA, PLAN_METADATA, usePlans } from "./plans";
import { useState } from "react";
import { strings } from "@notesnook/intl";
import { Period, SubscriptionPlan } from "@notesnook/core";
import { FeatureCaption } from "./feature-caption";
import { useStore as useUserStore } from "../../stores/user-store";
import { getCurrencySymbol } from "../../common/currencies";
import { DialogManager } from "../../common/dialog-manager";
import Accordion from "../../components/accordion";

type PlansListProps = {
  selectedPlan?: string | null;
  loadAllPlans?: boolean;
  ignoreTrial?: boolean;
  recommendedPlan?: SubscriptionPlan;
  onPlanSelected: (plan: Plan) => void;
};

type PricingProps = {
  plan: Plan;
};

const PLAN_CARD_FEATURES = [
  getFeature("storage"),
  getFeature("fileSize"),
  getFeature("fullQualityImages")
];

const FEATURE_ICONS: Record<string, Icon> = {
  storage: Cloud,
  fileSize: FileDoc,
  fullQualityImages: Picture
};

function FeatureIcon({ id }: { id: string }) {
  const FeatureGlyph = FEATURE_ICONS[id];
  if (!FeatureGlyph) return null;
  return <FeatureGlyph size={20} />;
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
          border: "1px solid",
          borderColor: "border-tertiary",
          borderRadius: 16,
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
              bg: selectedPeriod === id ? "accent" : "background-tertiary",
              color:
                selectedPeriod === id
                  ? "accentForeground"
                  : "heading-secondary",
              fontWeight: selectedPeriod === id ? 600 : 500,
              border: "none",
              borderRadius: 8,
              p: "spacing6",
              fontSize: "md"
            }}
            onPress={() => setPeriod(id as Period)}
          >
            {period.title}
            {id === "yearly" && (
              <Text
                sx={{
                  bg: "accent",
                  borderRadius: 50,
                  px: "spacing2",
                  py: "spacing1",
                  color: "accentForeground",
                  fontSize: "subtitle",
                  fontWeight: "normal",
                  lineHeight: 1
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
                  onPlanSelected={onPlanSelected}
                />
              ))
          )}
        </Flex>
        <Flex
          sx={{
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
            <Flex
              sx={{
                width: "30px",
                height: "30px",
                alignItems: "center",
                justifyContent: "center",
                bg: "background-secondary",
                borderRadius: "radius1",
                flexShrink: 0
              }}
            >
              <ShieldCheck size={20} color="icon" />
            </Flex>
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
            onPress={() => CancelInfoDialog.show({})}
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
                transform: [{ rotate: "-90deg" }]
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

function RecurringPricing(props: PricingProps) {
  const { plan } = props;
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
          color: "paragraph-secondary"
        }}
      >
        {hasDiscount ? (
          <>
            {getCurrencySymbol(plan.currency)}
            {toMonthlyPrice(plan.originalPrice!.gross, plan.period)}
          </>
        ) : (
          " "
        )}
      </Text>

      <Text
        sx={{
          fontWeight: "bold",
          fontSize: "xl",
          color: "heading"
        }}
      >
        {getCurrencySymbol(plan.currency)}
        {monthlyPrice}{" "}
        {isZero ? (
          ""
        ) : (
          <Text
            sx={{
              fontSize: "sm",
              color: "paragraph-secondary",
              fontWeight: 400
            }}
          >
            {" "}
            {strings.perMonth()}
          </Text>
        )}
      </Text>

      <Text
        sx={{
          fontSize: "sm",
          color: "paragraph-secondary",
          fontWeight: 400
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
      <Text sx={{ fontSize: "lg", fontWeight: 600 }}>
        {getCurrencySymbol(plan.currency)}
        {plan.price.gross}
      </Text>
      <Text
        sx={{ fontSize: "md", fontWeight: 400, color: "paragraph-secondary" }}
      >
        {formatOneTimePeriod(plan.period)}
      </Text>
    </>
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
  icon: Icon;
  title: string;
  description: string;
};

function CancelInfoCard(props: CancelInfoCardProps) {
  const CardIcon = props.icon;

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
          <CardIcon size={15} color="icon" />
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
  onPlanSelected
}: {
  plan: Plan;
  recommendedPlan?: SubscriptionPlan;
  selectedPlan?: string | null;
  onPlanSelected: (plan: Plan) => void;
}) {
  const metadata = PLAN_METADATA[plan.plan];
  const isRecommended = recommendedPlan === plan.plan;
  return (
    <Flex
      testID={`checkout-plan`}
      sx={{
        bg: isRecommended ? "background-selected" : "background",
        border: isRecommended ? "1px solid" : "1px solid",
        borderColor: isRecommended ? "accent" : "border-secondary",
        borderRadius: "radius4",
        flexDirection: "column",
        gap: "spacing11",
        p: "spacing7",
        flex: 1,
        boxShadow: "menu"
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
            <Text variant="heading" sx={{ fontSize: "xl" }} testID="title">
              {metadata.title}
            </Text>
            {(plan.discount?.type === "regional" || isRecommended) && (
              <Text
                variant="subBody"
                sx={{
                  bg: "accent",
                  borderRadius: 50,
                  px: "spacing3",
                  py: "spacing2",
                  color: "accentForeground",
                  fontSize: "sm",
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
              fontWeight: "normal"
            }}
          >
            {metadata.subtitle}
          </Text>
        </Flex>
        <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
          {plan.recurring ? (
            <RecurringPricing plan={plan} />
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
                  borderTop: index > 0 ? "1px solid" : "none",
                  borderColor: isRecommended
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
                      fontWeight: "normal"
                    }}
                  >
                    {feature.title}
                  </Text>
                </Flex>
                <Text
                  sx={{
                    fontSize: "sm",
                    fontWeight: "bold",
                    color: "paragraph"
                  }}
                >
                  <FeatureCaption caption={caption} />
                </Text>
              </Flex>
            );
          })}
        </Flex>
      </Flex>
      {selectedPlan === plan.id ? (
        <Flex sx={{ alignItems: "center", gap: 1 }}>
          <CheckCircleOutline color="accent" size={16} />
          <Text variant="subBody">{strings.youAreOnThisPlan()}</Text>
        </Flex>
      ) : (
        <Button
          variant={isRecommended ? "new_accent" : "new_secondary"}
          onPress={() => onPlanSelected(plan)}
          sx={{
            width: "100%",
            fontSize: "md"
          }}
        >
          {strings.selectPlan()}
        </Button>
      )}
    </Flex>
  );
}
export function ComparePlans() {
  const rows = getFeaturesTable();
  const plans = [
    SubscriptionPlan.FREE,
    SubscriptionPlan.ESSENTIAL,
    SubscriptionPlan.PRO,
    SubscriptionPlan.BELIEVER
  ];
  const cellSx = {
    flex: 1,
    minWidth: 0,
    px: "spacing7",
    py: "spacing6"
  } as const;

  return (
    <Flex
      sx={{
        flexDirection: "column",
        alignItems: "center",
        gap: "spacing13",
        p: "spacing14"
      }}
    >
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
        >
          {strings.comparePlans()}
        </Text>
        <Text
          sx={{
            fontSize: "sm",
            fontWeight: 400,
            color: "paragraph",
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: 712
          }}
        >
          {strings.comparePlansDescription()}
        </Text>
      </Flex>
      <Flex
        sx={{
          flexDirection: "column",
          width: "100%",
          bg: "background",
          borderRadius: "radius6",
          p: "spacing7"
        }}
      >
        <Flex
          sx={{
            flexDirection: "row",
            bg: "background-selected",
            borderRadius: 16,
            py: "spacing3"
          }}
        >
          <Flex sx={cellSx}>
            <Text
              variant="body"
              sx={{ fontWeight: 600, fontSize: "lg", color: "heading" }}
            >
              Features
            </Text>
          </Flex>
          {plans.map((plan) => (
            <Flex key={plan} sx={cellSx}>
              <Text
                variant="body"
                sx={{ fontWeight: 600, fontSize: "lg", color: "heading" }}
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
              flexDirection: "row",
              bg: rowIndex % 2 === 0 ? "background" : "background-secondary",
              py: "spacing3",
              borderRadius: rowIndex % 2 === 1 ? 16 : 0
            }}
          >
            <Flex sx={cellSx}>
              <Text
                variant="body"
                sx={{ fontWeight: 500, fontSize: "md", color: "heading" }}
              >
                {feature[0]}
              </Text>
            </Flex>
            {feature.slice(1).map((limit, index) => {
              const caption = (limit as { caption: boolean | string | number })
                .caption;
              return (
                <Flex key={index} sx={cellSx}>
                  {typeof caption === "boolean" ? (
                    caption ? (
                      <Check size={20} color="accent" />
                    ) : (
                      <Text
                        variant="body"
                        sx={{ fontSize: 18, color: "paragraph" }}
                      >
                        -
                      </Text>
                    )
                  ) : caption === "infinity" ? (
                    <Text
                      variant="body"
                      sx={{ fontSize: 18, color: "paragraph" }}
                    >
                      {"\u221e"}
                    </Text>
                  ) : (
                    <Text
                      variant="body"
                      sx={{ fontSize: "sm", color: "paragraph" }}
                    >
                      {caption}
                    </Text>
                  )}
                </Flex>
              );
            })}
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}

export function Footer() {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        gap: "spacing13",
        p: "spacing14",
        alignItems: "center"
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing6",
          alignItems: "center"
        }}
      >
        <Text variant="heading" sx={{ fontSize: "2xl", textAlign: "center" }}>
          {strings.frequentlyAskedQuestions()}
        </Text>
        <Text
          variant="body"
          sx={{
            fontSize: "sm",
            color: "paragraph",
            textAlign: "center",
            lineHeight: 1.5
          }}
        >
          {strings.faqDescription()}
        </Text>
      </Flex>
      <Flex sx={{ flexDirection: "column", gap: "spacing6", width: "100%" }}>
        {strings.checkoutFaqs.map((faq, index) => (
          <Accordion
            key={faq.question()}
            title={faq.question()}
            isClosed={index !== 0}
            variant="faq"
            titleSx={{ fontSize: "lg" }}
          >
            <Text sx={{ fontSize: "sm", color: "paragraph", lineHeight: 1.5 }}>
              {faq.answer()}
            </Text>
          </Accordion>
        ))}
      </Flex>
    </Flex>
  );
}
