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
import { isMacStoreApp, isTesting } from "../../utils/platform";
import { Period, Plan } from "./types";
import { db } from "../../common/db";

type PlanMetadata = {
  title: string;
  subtitle: string;
};

export const DEFAULT_PLANS: Plan[] = [
  {
    period: "monthly",
    country: "PK",
    currency: "USD",
    discount: 0,
    id: import.meta.env.NODE_ENV === "development" ? "9822" : "648884",
    price: { gross: 4.49, net: 0, tax: 0 },
    platform: "web"
  },
  {
    period: "yearly",
    country: "PK",
    currency: "USD",
    discount: 0,
    id: import.meta.env.NODE_ENV === "development" ? "50305" : "658759",
    price: { gross: 49.99, net: 0, tax: 0 },
    platform: "web"
  }
];

export const PLAN_METADATA: Record<Period, PlanMetadata> = {
  monthly: { title: "Monthly", subtitle: `Pay once a month.` },
  yearly: { title: "Yearly", subtitle: `Pay once a year.` }
};

let CACHED_PLANS: Plan[];
export async function getPlans(): Promise<Plan[] | null> {
  if (isTesting() || import.meta.env.NODE_ENV === "development")
    return DEFAULT_PLANS;
  if (CACHED_PLANS) return CACHED_PLANS;

  if (isMacStoreApp()) {
    const result = (
      await Promise.all(
        (["monthly", "yearly"] as const).map(
          async (period): Promise<Plan | null> => {
            const plan = await db.pricing?.sku("ios", period);
            const price = await db.pricing?.price(period);
            if (plan && price)
              return {
                period,
                country: plan?.countryCode,
                currency: "USD",
                id: plan.sku,
                discount: price.discount,
                price: { gross: parseFloat(price.price), net: 0, tax: 0 },
                originalPrice: DEFAULT_PLANS.find((p) => p.period === period)
                  ?.price,
                platform: "macos"
              };
            return null;
          }
        )
      )
    ).filter((p) => !!p);
    console.log("P", result);
    if (result.length < 2) return DEFAULT_PLANS;
    return result as Plan[];
  }

  const url = `https://notesnook.com/api/v1/prices/products/web`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const plans = (await response.json()) as Plan[];
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
        setDiscount(Math.max(...plans.map((p) => p.discount)));
        setCountry(plans[0].country);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);
  return { isLoading, plans, discount, country };
}
