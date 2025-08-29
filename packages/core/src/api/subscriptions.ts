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

import { planToId, SubscriptionPlan } from "../types.js";
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
    if (!token) return;
    await http.post(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/v2/cancel`,
      null,
      token
    );
  }

  async pause() {
    const token = await this.db.tokenManager.getAccessToken();
    if (!token) return;
    await http.post(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/v2/pause`,
      null,
      token
    );
  }

  async resume() {
    const token = await this.db.tokenManager.getAccessToken();
    if (!token) return;
    await http.post(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/v2/resume`,
      null,
      token
    );
  }

  async refund(reason?: string) {
    const token = await this.db.tokenManager.getAccessToken();
    if (!token) return;
    await http.post(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/v2/refund`,
      { reason },
      token
    );
  }

  async transactions(): Promise<Transaction[] | undefined> {
    const token = await this.db.tokenManager.getAccessToken();
    if (!token) return;
    return await http.get(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/v2/transactions`,
      token
    );
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

  async urls(): Promise<
    { update_payment_method: string; cancel: string } | undefined
  > {
    const token = await this.db.tokenManager.getAccessToken();
    if (!token) return;
    return await http.get(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/v2/urls`,
      token
    );
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
