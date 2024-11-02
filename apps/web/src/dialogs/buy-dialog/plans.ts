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

import { Period, Plan } from "./types";

type PlanMetadata = {
  title: string;
  subtitle: string;
};

export const EDUCATION_PLAN: Plan = {
  id: import.meta.env.DEV || IS_TESTING ? "50305" : "658759",
  period: "education",
  country: "US",
  currency: "USD",
  discount: { type: "regional", amount: 0, recurring: false },
  price: { gross: 9.99, net: 0, tax: 0 },
  originalPrice: { gross: 9.99, net: 0, tax: 0 }
};

export const DEFAULT_PLANS: Plan[] = [
  {
    period: "monthly",
    country: "PK",
    currency: "USD",
    discount: { type: "regional", amount: 0, recurring: false },
    originalPrice: { gross: 4.49, net: 0, tax: 0 },
    id: import.meta.env.DEV || IS_TESTING ? "9822" : "648884",
    price: { gross: 4.49, net: 0, tax: 0 }
  },
  {
    period: "yearly",
    country: "PK",
    currency: "USD",
    discount: { type: "regional", amount: 0, recurring: false },
    id: import.meta.env.DEV || IS_TESTING ? "50305" : "658759",
    price: { gross: 49.99, net: 0, tax: 0 },
    originalPrice: { gross: 49.99, net: 0, tax: 0 }
  },
  EDUCATION_PLAN
];

export const PLAN_METADATA: Record<Period, PlanMetadata> = {
  monthly: { title: "Monthly", subtitle: `Pay once a month.` },
  yearly: { title: "Yearly", subtitle: `Pay once a year.` },
  education: {
    title: "Education",
    subtitle: "Special offer for students & teachers."
  }
};

let CACHED_PLANS: Plan[];
export async function getPlans(): Promise<Plan[] | null> {
  if (IS_TESTING || import.meta.env.DEV) return DEFAULT_PLANS;
  if (CACHED_PLANS) return CACHED_PLANS;

  const url = `https://notesnook.com/api/v1/prices/products/web`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const plans = (await response.json()) as Plan[];
  plans.push(EDUCATION_PLAN);
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
        setDiscount(Math.max(...plans.map((p) => p.discount?.amount || 0)));
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
