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

import { SubscriptionPlan, SubscriptionPlanId } from "../types.js";
import http from "../utils/http.js";

export type SKUResponse = {
  country: string;
  countryCode: string;
  sku?: string;
  discount: number;
};

export interface PlanPrice {
  gross: number;
  net: number;
  tax: number;
  currency?: string;
}

export type Period = "monthly" | "yearly" | "5-year";

export type Discount = {
  type: "regional" | "promo";
  code?: string;
  recurring: boolean;
  amount: number;
};

export interface Plan {
  plan: SubscriptionPlan;
  recurring: boolean;
  id: string;
  name?: string;
  period: Period;
  price: PlanPrice;
  currency: string;
  currencySymbol?: string;
  originalPrice?: PlanPrice;
  discount?: Discount;
  country: string;
}

const BASE_URL = `https://notesnook.com/api/v2/prices`;
export class Pricing {
  static sku(
    platform: "android" | "ios" | "web",
    period: Period,
    plan: SubscriptionPlanId
  ): Promise<SKUResponse> {
    return http.get(
      `${BASE_URL}/skus?platform=${platform}&period=${period}&plan=${plan}`
    );
  }

  static products(): Promise<Plan[]> {
    return http.get(`${BASE_URL}/products`);
  }
}
