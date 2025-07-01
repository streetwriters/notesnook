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
import { Period, Plan, Price } from "./types";
import { IS_DEV } from "./helpers";

function createPrice(id: string, period: Period, subtotal: number): Price {
  return {
    id,
    period,
    subtotal,
    total: 0,
    tax: 0,
    currency: "USD"
  };
}

const FREE_PLAN: Plan = {
  id: "free",
  title: "Free",
  recurring: true,
  prices: [
    createPrice("monthly", "monthly", 0),
    createPrice("yearly", "yearly", 0),
    createPrice("5-year", "5-year", 0)
  ]
};

export const DEFAULT_PLANS: Plan[] = [
  FREE_PLAN,
  {
    id: "essential",
    title: "Essential",
    recurring: true,
    prices: [
      createPrice(
        IS_DEV
          ? "pri_01j00cf6v5kqqvchcpgapr7123"
          : "pri_01j02dbe7btgk6ta3ctper2161",
        "monthly",
        1.99
      ),
      createPrice(
        IS_DEV
          ? "pri_01j00d1qq3bart3w1rvt0q8bkt"
          : "pri_01j02dckdey85cgmrdknd2f4zx",
        "yearly",
        1.24
      )
    ]
  },
  {
    id: "pro",
    title: "Pro",
    recurring: true,
    prices: [
      createPrice(
        IS_DEV
          ? "pri_01j00fnbzth05aafjb05kcahvq"
          : "pri_01h9qprh1xvvxbs8vcpcg7qacm",
        "monthly",
        6.49
      ),
      createPrice(
        IS_DEV
          ? "pri_01j00fpawjwkrqxy2faqhzts9m"
          : "pri_01h9qpqyjwbm3m2xy7834t3azt",
        "yearly",
        5.49
      ),
      createPrice(
        IS_DEV
          ? "pri_01j00fr72gn40xzk9cdcfpzevw"
          : "pri_01j02da6n9c1xmzq15kjhjxngn",
        "5-year",
        4.49
      )
    ]
  },
  {
    id: "believer",
    title: "Believer",
    recurring: true,
    prices: [
      createPrice(
        IS_DEV
          ? "pri_01j00fxsryh5jfyfjqq5tsx4c7"
          : "pri_01j02ddzyc1m63s3b1kq6g4bnn",
        "monthly",
        7.49
      ),
      createPrice(
        IS_DEV
          ? "pri_01j00fzbz01rfn3f30crwxc7y9"
          : "pri_01j02dezv9v5ncw3e16ncvz7x7",
        "yearly",
        6.49
      ),
      createPrice(
        IS_DEV
          ? "pri_01j00g0wpmj6m9vcvpjq97jwpp"
          : "pri_01j02dfxz6y8hghfbr5p8cqtgb",
        "5-year",
        5.49
      )
    ]
  },
  {
    id: "education",
    title: "Education",
    recurring: false,
    prices: [
      createPrice(
        IS_DEV
          ? "pri_01j00g6asxjskghjcrbxpbd26e"
          : "pri_01j02dh4mwkbsvpygyf1bd9whs",
        "yearly",
        19.99
      )
    ]
  }
];

let CACHED_PLANS: Plan[];
export async function getPlans(): Promise<Plan[] | null> {
  return DEFAULT_PLANS;
  if (IS_TESTING || import.meta.env.DEV) return DEFAULT_PLANS;
  if (CACHED_PLANS) return CACHED_PLANS;

  const url = `https://notesnook.com/api/v1/prices/products/web`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const plans = (await response.json()) as Plan[];
  //  plans.push(EDUCATION_PLAN);
  CACHED_PLANS = plans;
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
