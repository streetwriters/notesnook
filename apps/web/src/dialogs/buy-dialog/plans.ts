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
import { Plan, PlanMetadata } from "./types";
import { Period, SubscriptionPlan } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { db } from "../../common/db";

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
  },
  [SubscriptionPlan.LEGACY_PRO]: {
    title: "Pro (legacy)",
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

const PLANS = getPlans().catch(console.error);
export async function getPlans(): Promise<Plan[] | null> {
  const user = await db.user.getUser();
  const plans = await db.pricing.products(user?.subscription?.trialsAvailed);
  return plans.sort((a, b) => a.plan - b.plan);
}

export function usePlans() {
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [discount, setDiscount] = useState<number>();
  const [country, setCountry] = useState<string>();
  useEffect(() => {
    (async function () {
      try {
        setIsLoading(true);
        const plans = await PLANS;
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
