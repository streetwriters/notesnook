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

import {
  getCurrencySymbol as _getSymbol,
  ICurrencySymbols
} from "@brixtol/currency-symbols";
import { getFeature } from "@notesnook/common";
import { Period, Plan, SubscriptionPlan, User } from "@notesnook/core";
import { PricingInfo } from "./types";

export const IS_DEV = import.meta.env.DEV || IS_TESTING;
export function getCurrencySymbol(currency: string) {
  return _getSymbol(currency as keyof ICurrencySymbols) || currency;
}

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
      subtotal: `${getCurrencySymbol(plan.currency)}${plan.price.net}`,
      tax: `${getCurrencySymbol(plan.currency)}${plan.price.tax}`,
      total: `${getCurrencySymbol(plan.currency)}${plan.price.gross}`,
      trial_period: isTrialAvailableForPlan(plan.plan, user)
        ? {
            frequency: TRIAL_PERIODS[plan.period]
          }
        : undefined
    },
    discount: plan.discount,
    coupon: plan.discount?.code,
    recurringPrice: {
      currency: plan.currency,
      id: plan.id,
      period: plan.period,
      subtotal: `${getCurrencySymbol(plan.currency)}${plan.price.net}`,
      tax: `${getCurrencySymbol(plan.currency)}${plan.price.tax}`,
      total: `${getCurrencySymbol(plan.currency)}${plan.price.gross}`
    }
  };
}

export function isTrialAvailableForPlan(
  plan: SubscriptionPlan,
  user: User | undefined
) {
  return (
    !user?.subscription.trialsAvailed ||
    !user?.subscription.trialsAvailed?.includes(plan)
  );
}
