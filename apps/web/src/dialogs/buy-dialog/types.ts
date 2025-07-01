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
  CheckoutEventNames,
  CheckoutEventsCustomer,
  CheckoutEventsDiscount,
  CheckoutEventsItem,
  PaddleEventData
} from "@paddle/paddle-js";

export type Period = "monthly" | "yearly" | "5-year";

// export interface CallbackData {
//   checkout?: Checkout;
// }

export interface Checkout {
  id?: string;
  prices: {
    customer: {
      items: CheckoutPrices[];
    };
  };
  recurring_prices: {
    customer: {
      items: CheckoutPrices[];
    };
  };
}

export type PaddleEvent = {
  action: "event";
  event_name: CheckoutEventNames;
  callback_data: PaddleEventData;
};

export type PlanId = "free" | "essential" | "pro" | "believer" | "education";
export interface Plan {
  // period: Period;
  id: PlanId;
  title: string;
  prices: Price[];
  recurring: boolean;
  // currency: string;
  // originalPrice?: Price;
  // discount: number;
  // country: string;
}

export type PricingInfo = {
  country: string;
  // currency: string;
  price: Price;
  period: Period;
  recurringPrice: Price;
  discount?: Discount;
  coupon?: string;
  invalidCoupon?: boolean;
};

export type Discount = {
  type: "regional" | "promo";
  code?: string;
  recurring: boolean;
  amount: number;
};

export interface Price {
  id: string;
  period: Period;
  subtotal: string;
  total: string;
  tax: string;
  discount?: string;
  currency: string;
}

export interface Customer {
  // id: number;
  // email: string;
  country_code: string;
  // postcode: null;
  // audience_opt_in: boolean;
}

export interface Item {
  // checkout_product_id: number;
  // product_id: number;
  // name: string;
  // custom_message: string;
  // quantity: number;
  // allow_quantity: boolean;
  // min_quantity: number;
  // max_quantity: number;
  // icon_url: string;
  prices: CheckoutPrices[];
  recurring: Recurring;
  // webhook_url: null;
}

export interface CheckoutPrices {
  currency: string;
  unit_price: CheckoutPrice;
  // line_price: CheckoutPrice;
  discounts: CheckoutDiscount[];

  recurring: CheckoutPrices;
  // tax_rate: number;
}

export interface CheckoutDiscount {
  // rank: number;
  // type: string;
  // net_discount: number;
  gross_discount: number;
  code: string;
  // description: string;
}

export interface CheckoutPrice {
  net: number;
  gross: number;
  net_discount: number;
  gross_discount: number;
  net_after_discount: number;
  gross_after_discount: number;
  tax: number;
  tax_after_discount: number;
}

export interface Recurring {
  // period: string;
  // interval: number;
  // trial_days: number;
  prices: CheckoutPrices[];
}

export type TotalPrice = CheckoutPrice & {
  currency: string;
  is_free: boolean;
  includes_tax: boolean;
  tax_rate: number;
};

export interface Vendor {
  id: number;
  name: string;
  // type: string;
  // status: string;
  // transaction_id: string;
  currency_code: string;
  customer: CheckoutEventsCustomer;
  // seller: Seller;
  items: CheckoutEventsItem[];
  // totals: DataRecurringTotals;
  // recurring_totals: DataRecurringTotals;
  // payments: Payments;
  discount?: CheckoutEventsDiscount;
  // is_free: boolean;
  // ip_geo_country_code: string;
  //  custom_data: null;
  //  created_at: Date;
  //  environment: string;
  // source_page: string;
  // messages: any[];
}
