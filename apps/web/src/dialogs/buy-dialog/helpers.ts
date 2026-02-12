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

import { getFeature } from "@notesnook/common";
import { Period, Plan, SubscriptionPlan, User } from "@notesnook/core";
import { PricingInfo } from "./types";
import { getCurrencySymbol } from "../../common/currencies";

export const IS_DEV = import.meta.env.DEV || IS_TESTING;

export function parseAmount(amount: string) {
  const matches = /(.+?)([\d.]+)/.exec(amount);
  if (!matches || matches.length < 3) return;
  return {
    formatted: amount,
    symbol: matches[1],
    amount: parseFloat(matches[2])
  };
}

export const FEATURE_HIGHLIGHTS = [
  getFeature("storage"),
  getFeature("fileSize"),
  getFeature("colors"),
  getFeature("notebooks"),
  getFeature("fullQualityImages"),
  getFeature("appLock")
];

const TRIAL_PERIODS: Record<Period, number> = {
  yearly: 14,
  monthly: 7,
  "5-year": 30
};

export function toPricingInfo(plan: Plan, user: User | undefined): PricingInfo {
  return {
    country: plan.country,
    period: plan.period,
    price: {
      currency: plan.currency,
      id: plan.id,
      period: plan.period,
      subtotal: formatPrice(plan.price.net, plan.currency),
      tax: formatPrice(plan.price.tax, plan.currency),
      total: formatPrice(plan.price.gross, plan.currency),
      trial_period: isTrialAvailableForPlan(plan.plan, user)
        ? {
            frequency: TRIAL_PERIODS[plan.period]
          }
        : undefined
    },
    discount: plan.discount,
    coupon: plan.discount?.code,
    recurringPrice: plan.recurring
      ? {
          currency: plan.currency,
          id: plan.id,
          period: plan.period,
          subtotal: formatPrice(plan.price.net, plan.currency),
          tax: formatPrice(plan.price.tax, plan.currency),
          total: formatPrice(plan.price.gross, plan.currency)
        }
      : undefined
  };
}

export function isTrialAvailableForPlan(
  plan: SubscriptionPlan,
  user: User | undefined
) {
  if (plan === SubscriptionPlan.EDUCATION) return false;
  return (
    !user?.subscription.trialsAvailed ||
    !user?.subscription.trialsAvailed?.includes(plan)
  );
}

export function formatPrice(price: number, currency: string) {
  return `${getCurrencySymbol(currency)}${price.toFixed(2)}`;
}
