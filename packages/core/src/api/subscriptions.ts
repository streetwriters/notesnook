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
  planToId,
  SubscriptionPlan,
  SubscriptionStatus,
  User
} from "../types.js";
import hosts from "../utils/constants.js";
import http from "../utils/http.js";
import Database from "./index.js";
import { Period } from "./pricing.js";

export type TransactionStatus =
  | "completed"
  | "billed"
  | "paid"
  | "past_due"
  | "canceled";

export type TransactionStatusV1 =
  | "completed"
  | "refunded"
  | "partially_refunded"
  | "disputed";

export type TransactionV1 = {
  order_id: string;
  checkout_id: string;
  amount: string;
  currency: string;
  status: TransactionStatusV1;
  created_at: string;
  passthrough: null;
  product_id: number;
  is_subscription: boolean;
  is_one_off: boolean;
  subscription: SubscriptionV1;
  user: User;
  receipt_url: string;
};

type SubscriptionV1 = {
  subscription_id: number;
  status: string;
};

export interface Transaction {
  id: string;
  status: TransactionStatus;
  created_at: Date;
  billed_at: Date;
  details: Details;
}

export interface Details {
  totals: Totals;
  line_items: LineItem[];
}

export interface LineItem {
  id: string;
}

export interface Totals {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  grand_total: number;
  balance: number;
  currency_code: string;
}

export default class Subscriptions {
  constructor(private readonly db: Database) {}

  async cancel() {
    const token = await this.db.tokenManager.getAccessToken();
    const user = await this.db.user.getUser();
    if (!token || !user) return;
    const endpoint = isLegacySubscription(user)
      ? `subscriptions/cancel`
      : `subscriptions/v2/cancel`;
    await http.post(`${hosts.SUBSCRIPTIONS_HOST}/${endpoint}`, null, token);
  }

  async pause() {
    const token = await this.db.tokenManager.getAccessToken();
    const user = await this.db.user.getUser();
    if (!token || !user) return;
    const endpoint = isLegacySubscription(user)
      ? `subscriptions?pause=true`
      : `subscriptions/v2/pause`;
    if (isLegacySubscription(user))
      await http.delete(`${hosts.SUBSCRIPTIONS_HOST}/${endpoint}`, token);
    else
      await http.post(`${hosts.SUBSCRIPTIONS_HOST}/${endpoint}`, null, token);
  }

  async resume() {
    const token = await this.db.tokenManager.getAccessToken();
    const user = await this.db.user.getUser();
    if (!token || !user) return;
    const endpoint = isLegacySubscription(user)
      ? `subscriptions/resume`
      : `subscriptions/v2/resume`;
    await http.post(`${hosts.SUBSCRIPTIONS_HOST}/${endpoint}`, null, token);
  }

  async refund(reason?: string) {
    const token = await this.db.tokenManager.getAccessToken();
    const user = await this.db.user.getUser();
    if (!token || !user) return;
    const endpoint = isLegacySubscription(user)
      ? `subscriptions/refund`
      : `subscriptions/v2/refund`;
    await http.post(
      `${hosts.SUBSCRIPTIONS_HOST}/${endpoint}`,
      { reason },
      token
    );
  }

  async transactions(): Promise<
    | { type: "v2"; transactions: Transaction[] }
    | { type: "v1"; transactions: TransactionV1[] }
    | undefined
  > {
    const token = await this.db.tokenManager.getAccessToken();
    const user = await this.db.user.getUser();
    if (!token || !user) return;
    if (isLegacySubscription(user)) {
      return {
        type: "v1",
        transactions: await http.get(
          `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/transactions`,
          token
        )
      };
    } else {
      return {
        type: "v2",
        transactions: await http.get(
          `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/v2/transactions`,
          token
        )
      };
    }
  }

  async invoice(transactionId: string): Promise<string | undefined> {
    const token = await this.db.tokenManager.getAccessToken();
    if (!token) return;
    const response = await http.get(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/v2/invoice?transactionId=${transactionId}`,
      token
    );
    return response.url;
  }

  async updateUrl(): Promise<string | undefined> {
    const token = await this.db.tokenManager.getAccessToken();
    if (!token) return;
    const user = await this.db.user.getUser();
    if (!token || !user) return;
    if (isLegacySubscription(user)) {
      return await http.get(
        `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/update`,
        token
      );
    } else {
      const result = await http.get(
        `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/v2/urls`,
        token
      );
      return result.update_payment_method;
    }
  }

  async redeemCode(code: string) {
    const token = await this.db.tokenManager.getAccessToken();
    if (!token) return;
    return http.post.json(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/redeem`,
      {
        code
      },
      token
    );
  }

  async checkoutUrl(plan: SubscriptionPlan, period: Period) {
    const user = await this.db.user.getUser();
    if (!user) return;
    return `${hosts.NOTESNOOK_HOST}/api/v2/checkout?userId=${user.id}&email=${
      user.email
    }&plan=${planToId(plan)}&period=${period}`;
  }

  async preview(productId: string) {
    const token = await this.db.tokenManager.getAccessToken();
    if (!token) return;
    return http.post(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/v2/preview`,
      {
        productId: productId
      },
      token
    );
  }

  async change(productId: string) {
    const token = await this.db.tokenManager.getAccessToken();
    if (!token) return;
    return http.post(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/v2/change`,
      {
        productId: productId
      },
      token
    );
  }
}

function isLegacySubscription(user: User) {
  return (
    user.subscription.plan === SubscriptionPlan.LEGACY_PRO &&
    user.subscription.status !== SubscriptionStatus.EXPIRED
  );
}
