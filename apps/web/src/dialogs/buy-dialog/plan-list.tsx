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

import { Text, Flex, Button, Image } from "@theme-ui/components";
import { Loading } from "../../components/icons";
import Nomad from "../../assets/nomad.svg?url";
import { Period, Plan, PlanId, Price } from "./types";
import { usePlans } from "./plans";
import { useEffect, useState } from "react";
import { getCurrencySymbol, parseAmount } from "./helpers";
import { strings } from "@notesnook/intl";

type PlansListProps = {
  selectedPlan: PlanId;
  onPlanSelected: (plan: Plan, price: Price) => void;
  onPlansLoaded?: (plans: Plan[]) => void;
};
const periods: { id: Period; title: string }[] = [
  {
    title: strings.monthly(),
    id: "monthly"
  },
  {
    title: strings.yearly(),
    id: "yearly"
  },
  {
    id: "5-year",
    title: "5 year"
  }
];
export function PlansList(props: PlansListProps) {
  const { onPlanSelected, onPlansLoaded, selectedPlan } = props;
  const { isLoading, plans, discount, country } = usePlans();
  const [selectedPeriod, setPeriod] = useState<Period>("yearly");
  console.log({ selectedPlan });
  useEffect(() => {
    if (isLoading || !onPlansLoaded) return;
    onPlansLoaded(plans);
  }, [isLoading, onPlansLoaded, plans]);

  return (
    <>
      <Image
        src={Nomad}
        style={{ flexShrink: 0, width: 150, height: 150, marginTop: 20 }}
      />
      <Text variant="heading" mt={4} sx={{ textAlign: "center" }}>
        Choose a plan
      </Text>
      <Text variant="body" mt={1} sx={{ textAlign: "center" }}>
        {discount ? (
          <>
            We are giving a special <b>{discount}% discount</b> to all users
            from {country}.
          </>
        ) : (
          "Notesnook profits when you purchase a subscription — not by selling your data."
        )}
      </Text>
      <Flex
        sx={{
          bg: "background-secondary",
          borderRadius: "default",
          overflow: "hidden",
          flexShrink: 0
        }}
      >
        {periods.map((period) => (
          <Button
            key={period.id}
            variant="secondary"
            sx={{
              bg:
                selectedPeriod === period.id
                  ? "background-selected"
                  : "transparent",
              color:
                selectedPeriod === period.id ? "accent-selected" : "paragraph",
              borderRadius: 0,
              py: 1
            }}
            onClick={() => setPeriod(period.id)}
          >
            {period.title}
          </Button>
        ))}
      </Flex>
      <Flex mt={2} sx={{ flexDirection: "column", alignSelf: "stretch" }}>
        {plans.map((plan) => {
          const price = plan.prices.find((p) => p.period === selectedPeriod);
          if (!price) return null;
          // const metadata = PLAN_METADATA[plan.period];
          return (
            <Button
              key={plan.title}
              disabled={isLoading}
              data-test-id={`checkout-plan`}
              variant="secondary"
              mt={1}
              // bg="transparent"
              // sx={
              //   {
              //     // bg: selectedPlan?.key === plan.key ? "border" : "transparent",
              // border:
              //   selectedPlan?.key === plan.key ? "1px solid var(--accent)" : "none",
              //   }
              // }
              onClick={() => onPlanSelected(plan, price)}
              sx={{
                flexShrink: 0,
                flex: 1,
                textAlign: "start",
                alignItems: "center",
                justifyContent: "space-between",
                display: "flex",
                border:
                  selectedPlan === plan.id
                    ? "1px solid var(--accent-selected)"
                    : "none",
                borderRadius: "default"
              }}
            >
              <Text
                variant="subtitle"
                sx={{ fontWeight: "normal" }}
                data-test-id="title"
              >
                {plan.title}
                {/* <br />
                <Text
                  variant="body"
                  sx={{
                    fontWeight: "normal",
                    color: "var(--paragraph-secondary)"
                  }}
                >
                  {metadata.subtitle}
                </Text> */}
              </Text>
              {isLoading ? (
                <Loading />
              ) : plan.recurring ? (
                <RecurringPricing plan={plan} price={price} />
              ) : (
                <OneTimePricing plan={plan} price={price} />
              )}
            </Button>
          );
        })}
      </Flex>
    </>
  );
}

type PricingProps = {
  plan: Plan;
  price: Price;
};
function RecurringPricing(props: PricingProps) {
  const { plan, price } = props;
  // const price = plan.prices.find((p) => p.period === period);
  // if (!price) return null;
  const monthPrice = plan.prices.find(
    (p) => p.period === "monthly" && price.period !== p.period
  );
  return (
    <Text
      sx={{ flexShrink: 0, fontSize: "subBody", textAlign: "end" }}
      variant="body"
    >
      {/* {plan.originalPrice && plan.originalPrice.gross !== plan.price.gross && (
        <Text
          sx={{
            textDecorationLine: "line-through",
            fontSize: "body",
            color: "var(--paragraph-secondary)"
          }}
        >
          {getCurrencySymbol(plan.currency)}
          {plan.originalPrice.gross}
        </Text>
      )} */}
      {/* {monthPrice && (
        <Text
          variant="subBody"
          sx={{
            textDecorationLine: "line-through",
            color: "var(--paragraph-secondary)"
          }}
        >
          {getCurrencySymbol(price.currency)}
          {monthPrice.gross}
        </Text>
      )} */}
      <Text as="div" sx={{ fontSize: "subtitle", fontWeight: "bold" }}>
        {monthPrice && monthPrice.subtotal < price.subtotal && (
          <Text
            variant="subBody"
            sx={{
              textDecorationLine: "line-through",
              color: "var(--paragraph-secondary)",
              fontWeight: "body"
            }}
          >
            {getCurrencySymbol(price.currency)}
            {monthPrice.subtotal}
          </Text>
        )}{" "}
        {getCurrencySymbol(price.currency)}
        {price.subtotal}
        /month
      </Text>
      {parseAmount(price.subtotal)?.amount === 0 ? null : (
        <Text as="div" variant="subBody">
          billed {formatRecurringPeriod(price.period)}
        </Text>
      )}
    </Text>
  );
}

function OneTimePricing(props: PricingProps) {
  const { price } = props;
  return (
    <Text
      sx={{ flexShrink: 0, fontSize: "subBody", textAlign: "end" }}
      variant="body"
    >
      <Text as="div" sx={{ fontSize: "subtitle", fontWeight: "bold" }}>
        {getCurrencySymbol(price.currency)}
        {price.subtotal}
      </Text>
      <Text as="div" variant="subBody">
        {formatOneTimePeriod(price.period)}
      </Text>
    </Text>
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
