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

import hosts from "../utils/constants.js";
import http from "../utils/http.js";
import TokenManager from "./token-manager.js";

export type TransactionStatus =
  | "completed"
  | "refunded"
  | "partially_refunded"
  | "disputed";

export type Transaction = {
  order_id: string;
  checkout_id: string;
  amount: string;
  currency: string;
  status: TransactionStatus;
  created_at: string;
  passthrough: null;
  product_id: number;
  is_subscription: boolean;
  is_one_off: boolean;
  subscription: Subscription;
  user: User;
  receipt_url: string;
};

type Subscription = {
  subscription_id: number;
  status: string;
};

type User = {
  user_id: number;
  email: string;
  marketing_consent: boolean;
};

export default class Subscriptions {
  constructor(private readonly tokenManager: TokenManager) {}

  async cancel() {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await http.delete(`${hosts.SUBSCRIPTIONS_HOST}/subscriptions`, token);
  }

  async refund() {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    await http.post(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/refund`,
      null,
      token
    );
  }

  async transactions(): Promise<Transaction[] | undefined> {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return await http.get(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/transactions`,
      token
    );
  }

  async updateUrl(): Promise<string | undefined> {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return await http.get(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/update`,
      token
    );
  }

  async redeemCode(code: string) {
    const token = await this.tokenManager.getAccessToken();
    if (!token) return;
    return http.post.json(
      `${hosts.SUBSCRIPTIONS_HOST}/subscriptions/redeem`,
      {
        code
      },
      token
    );
  }
}
