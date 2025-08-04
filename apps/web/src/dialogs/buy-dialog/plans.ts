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

import { useEffect, useState } from "react";
import { Period, Plan, PlanMetadata, Price } from "./types";
import { IS_DEV } from "./helpers";
import { SubscriptionPlan } from "@notesnook/core";
import { strings } from "@notesnook/intl";

// function createPrice(id: string, period: Period, subtotal: number): Price {
//   return {
//     id,
//     period,
//     subtotal: `${subtotal.toFixed(2)}USD`,
//     total: `0.00USD`,
//     tax: `0.00USD`,
//     currency: "USD"
//   };
// }

function createPlan(
  id: string,
  plan: SubscriptionPlan,
  period: Period,
  price: number,
  recurring = true
): Plan {
  return {
    plan,
    id,
    price: { gross: price, net: price, tax: 0 },
    currency: "USD",
    country: "US",
    period: period,
    recurring
  };
}

export const PLAN_METADATA: PlanMetadata = {
  [SubscriptionPlan.FREE]: {
    title: "Free",
    subtitle: "Get started without compromise."
  },
  [SubscriptionPlan.ESSENTIAL]: {
    title: "Essential",
    subtitle: "All the core features, minus the fluff."
  },
  [SubscriptionPlan.PRO]: {
    title: "Pro",
    subtitle: "Level up with more storage.",
    recommended: true
  },
  [SubscriptionPlan.BELIEVER]: {
    title: "Believer",
    subtitle: "Support the mission - unlock everything."
  },
  [SubscriptionPlan.EDUCATION]: {
    title: "Education",
    subtitle: ""
  }
};

type PeriodMetadata = { title: string; refundDays: number };
export const PERIOD_METADATA: Record<Period, PeriodMetadata> = {
  monthly: {
    title: strings.monthly(),
    refundDays: 7
  },
  yearly: {
    title: strings.yearly(),
    refundDays: 14
  },
  "5-year": {
    title: "5 year",
    refundDays: 30
  }
};

export const DEFAULT_PLANS: Plan[] = [
  createPlan(
    IS_DEV
      ? "pri_01j00cf6v5kqqvchcpgapr7123"
      : "pri_01j02dbe7btgk6ta3ctper2161",
    SubscriptionPlan.ESSENTIAL,
    "monthly",
    1.99
  ),
  createPlan(
    IS_DEV
      ? "pri_01j00d1qq3bart3w1rvt0q8bkt"
      : "pri_01j02dckdey85cgmrdknd2f4zx",
    SubscriptionPlan.ESSENTIAL,
    "yearly",
    19.99
  ),
  createPlan(
    IS_DEV
      ? "pri_01j00fnbzth05aafjb05kcahvq"
      : "pri_01h9qprh1xvvxbs8vcpcg7qacm",
    SubscriptionPlan.PRO,
    "monthly",
    6.99
  ),
  createPlan(
    IS_DEV
      ? "pri_01j00fpawjwkrqxy2faqhzts9m"
      : "pri_01h9qpqyjwbm3m2xy7834t3azt",
    SubscriptionPlan.PRO,
    "yearly",
    69.99
  ),
  createPlan(
    IS_DEV
      ? "pri_01j00fr72gn40xzk9cdcfpzevw"
      : "pri_01j02da6n9c1xmzq15kjhjxngn",
    SubscriptionPlan.PRO,
    "5-year",
    299.99
  ),
  createPlan(
    IS_DEV
      ? "pri_01j00fxsryh5jfyfjqq5tsx4c7"
      : "pri_01j02ddzyc1m63s3b1kq6g4bnn",
    SubscriptionPlan.BELIEVER,
    "monthly",
    8.99
  ),
  createPlan(
    IS_DEV
      ? "pri_01j00fzbz01rfn3f30crwxc7y9"
      : "pri_01j02dezv9v5ncw3e16ncvz7x7",
    SubscriptionPlan.BELIEVER,
    "yearly",
    89.99
  ),
  createPlan(
    IS_DEV
      ? "pri_01j00g0wpmj6m9vcvpjq97jwpp"
      : "pri_01j02dfxz6y8hghfbr5p8cqtgb",
    SubscriptionPlan.BELIEVER,
    "5-year",
    399.99
  )
];

export const EDUCATION_PLAN: Plan = createPlan(
  IS_DEV ? "pri_01j00g6asxjskghjcrbxpbd26e" : "pri_01j02dh4mwkbsvpygyf1bd9whs",
  SubscriptionPlan.EDUCATION,
  "yearly",
  19.99,
  false
);

let CACHED_PLANS: Plan[];
export async function getPlans(): Promise<Plan[] | null> {
  if (IS_TESTING || import.meta.env.DEV) return DEFAULT_PLANS;
  if (CACHED_PLANS) return CACHED_PLANS;

  const url = `http://localhost:8788/api/v2/prices/products/web`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const plans = (await response.json()) as Plan[];
  CACHED_PLANS = plans.sort((a, b) => a.plan - b.plan);
  return plans;
}

export function usePlans() {
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [discount, setDiscount] = useState<number>();
  const [country, setCountry] = useState<string>();
  useEffect(() => {
    (async function () {
      try {
        setIsLoading(true);
        const plans = await getPlans();
        if (!plans) return;
        setPlans(plans);
        // setDiscount(Math.max(...plans.map((p) => p.discount?.amount || 0)));
        // setCountry(plans[0].country);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);
  return { isLoading, plans, discount, country };
}
