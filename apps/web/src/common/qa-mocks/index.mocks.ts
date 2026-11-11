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
  Database,
  SubscriptionPlan,
  SubscriptionProvider,
  SubscriptionStatus,
  Transaction,
  TransactionStatus,
  TransactionV1,
  User
} from "@notesnook/core";

type Subscription = User["subscription"];
type Scenario = {
  label: string;
  subscription: () => Partial<Subscription>;
  transactions?: () =>
    | { type: "v2"; transactions: Transaction[] }
    | { type: "v1"; transactions: TransactionV1[] };
};
type State = { scenario: string; overrides: Partial<Subscription> };

const STORAGE_KEY = "qa-mocks";
const DAY = 24 * 60 * 60 * 1000;
const now = () => Date.now();

function paddle(
  plan: SubscriptionPlan,
  status: SubscriptionStatus,
  expiry: number,
  extra: Partial<Subscription> = {}
): () => Partial<Subscription> {
  return () => ({
    provider: SubscriptionProvider.PADDLE,
    plan,
    status,
    start: now() - 60 * DAY,
    expiry: now() + expiry,
    productId: "pri_qa_mock",
    ...extra
  });
}

function store(
  provider: SubscriptionProvider,
  status = SubscriptionStatus.ACTIVE
): () => Partial<Subscription> {
  return () => ({
    provider,
    plan: SubscriptionPlan.PRO,
    status,
    start: now() - 30 * DAY,
    expiry: now() + 30 * DAY
  });
}

function transaction(
  daysAgo: number,
  status: TransactionStatus,
  cents: number,
  currency = "USD"
): Transaction {
  const date = new Date(now() - daysAgo * DAY);
  return {
    id: `txn_qa_${daysAgo}_${status}`,
    status,
    created_at: date,
    billed_at: date,
    details: {
      line_items: [{ id: `txnitm_qa_${daysAgo}` }],
      totals: {
        subtotal: cents,
        tax: 0,
        discount: 0,
        total: cents,
        grand_total: cents,
        balance: 0,
        currency_code: currency
      }
    }
  };
}

function legacyTransaction(
  daysAgo: number,
  status: TransactionV1["status"]
): TransactionV1 {
  return {
    order_id: `qa-${daysAgo}`,
    checkout_id: `qa-checkout-${daysAgo}`,
    amount: "4.49",
    currency: "USD",
    status,
    created_at: new Date(now() - daysAgo * DAY).toISOString(),
    passthrough: null,
    product_id: 0,
    is_subscription: true,
    is_one_off: false,
    subscription: { subscription_id: 0, status: "active" },
    user: {} as TransactionV1["user"],
    receipt_url: "https://example.com/qa-mock/receipt"
  };
}

const monthlyHistory = () => ({
  type: "v2" as const,
  transactions: [
    transaction(1, "completed", 799),
    transaction(31, "completed", 799),
    transaction(61, "past_due", 799),
    transaction(62, "completed", 799, "EUR")
  ]
});

const SCENARIOS: Record<string, Scenario> = {
  free: {
    label: "Free",
    subscription: () => ({
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.EXPIRED,
      provider: SubscriptionProvider.STREETWRITERS
    }),
    transactions: () => ({ type: "v2", transactions: [] })
  },
  trial: {
    label: "Paddle · Pro trial",
    subscription: paddle(SubscriptionPlan.PRO, SubscriptionStatus.TRIAL, 0, {
      trialExpiry: now() + 7 * DAY
    }),
    transactions: () => ({ type: "v2", transactions: [] })
  },
  "trial-expired": {
    label: "Paddle · Pro trial expired",
    subscription: paddle(
      SubscriptionPlan.PRO,
      SubscriptionStatus.EXPIRED,
      -1 * DAY,
      { trialExpiry: now() - 1 * DAY }
    ),
    transactions: () => ({ type: "v2", transactions: [] })
  },
  essential: {
    label: "Paddle · Essential monthly",
    subscription: paddle(
      SubscriptionPlan.ESSENTIAL,
      SubscriptionStatus.ACTIVE,
      20 * DAY
    ),
    transactions: () => ({
      type: "v2",
      transactions: [transaction(10, "completed", 199)]
    })
  },
  pro: {
    label: "Paddle · Pro monthly",
    subscription: paddle(SubscriptionPlan.PRO, SubscriptionStatus.ACTIVE, 20 * DAY),
    transactions: monthlyHistory
  },
  "pro-yearly": {
    label: "Paddle · Pro yearly",
    subscription: paddle(
      SubscriptionPlan.PRO,
      SubscriptionStatus.ACTIVE,
      300 * DAY
    ),
    transactions: () => ({
      type: "v2",
      transactions: [transaction(65, "completed", 7799)]
    })
  },
  believer: {
    label: "Paddle · Believer",
    subscription: paddle(
      SubscriptionPlan.BELIEVER,
      SubscriptionStatus.ACTIVE,
      20 * DAY
    ),
    transactions: () => ({
      type: "v2",
      transactions: [transaction(10, "completed", 1499)]
    })
  },
  education: {
    label: "Paddle · Education",
    subscription: paddle(
      SubscriptionPlan.EDUCATION,
      SubscriptionStatus.ACTIVE,
      200 * DAY
    ),
    transactions: () => ({
      type: "v2",
      transactions: [transaction(165, "completed", 2499)]
    })
  },
  paused: {
    label: "Paddle · Pro paused",
    subscription: paddle(SubscriptionPlan.PRO, SubscriptionStatus.PAUSED, 20 * DAY),
    transactions: monthlyHistory
  },
  canceled: {
    label: "Paddle · Pro canceled (still active)",
    subscription: paddle(
      SubscriptionPlan.PRO,
      SubscriptionStatus.CANCELED,
      10 * DAY
    ),
    transactions: monthlyHistory
  },
  expired: {
    label: "Paddle · Pro expired",
    subscription: paddle(
      SubscriptionPlan.PRO,
      SubscriptionStatus.EXPIRED,
      -5 * DAY
    ),
    transactions: monthlyHistory
  },
  "legacy-pro": {
    label: "Paddle · Legacy Pro (v1)",
    subscription: paddle(
      SubscriptionPlan.LEGACY_PRO,
      SubscriptionStatus.ACTIVE,
      20 * DAY
    ),
    transactions: () => ({
      type: "v1",
      transactions: [
        legacyTransaction(10, "completed"),
        legacyTransaction(40, "refunded"),
        legacyTransaction(70, "partially_refunded"),
        legacyTransaction(100, "disputed")
      ]
    })
  },
  apple: { label: "Apple · Pro", subscription: store(SubscriptionProvider.APPLE) },
  google: {
    label: "Google · Pro",
    subscription: store(SubscriptionProvider.GOOGLE)
  },
  "gift-card": {
    label: "Gift card · Pro",
    subscription: store(SubscriptionProvider.GIFT_CARD)
  },
  streetwriters: {
    label: "Streetwriters · Pro",
    subscription: store(SubscriptionProvider.STREETWRITERS)
  }
};

function readState(): State | undefined {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return;
    const state: State = JSON.parse(value);
    return SCENARIOS[state.scenario] ? state : undefined;
  } catch {
    return;
  }
}

function writeState(state: State | undefined) {
  try {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

function updateSubscription(overrides: Partial<Subscription>) {
  const state = readState();
  if (!state) return;
  writeState({ ...state, overrides: { ...state.overrides, ...overrides } });
}

export function installQAMocks(db: Database) {
  renderPicker();

  const state = readState();
  if (!state) return;
  const scenario = SCENARIOS[state.scenario];
  const subscription = { ...scenario.subscription() };

  const getUser = db.user.getUser.bind(db.user);
  db.user.getUser = async () => {
    const user = await getUser();
    if (!user) return user;
    return {
      ...user,
      subscription: {
        ...user.subscription,
        ...subscription,
        ...readState()?.overrides
      }
    };
  };

  const subscriptions = db.subscriptions;
  subscriptions.transactions = async () =>
    (scenario.transactions || (() => ({ type: "v2", transactions: [] })))();
  subscriptions.invoice = async () => "https://example.com/qa-mock/invoice";
  subscriptions.updateUrl = async () =>
    "https://example.com/qa-mock/update-payment-method";
  subscriptions.pause = async () =>
    updateSubscription({ status: SubscriptionStatus.PAUSED });
  subscriptions.resume = async () =>
    updateSubscription({ status: SubscriptionStatus.ACTIVE });
  subscriptions.cancel = async () =>
    updateSubscription({ status: SubscriptionStatus.CANCELED });
  subscriptions.refund = async () =>
    updateSubscription({
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.EXPIRED,
      expiry: now()
    });
  subscriptions.change = async () =>
    updateSubscription({ status: SubscriptionStatus.ACTIVE });
}

function renderPicker() {
  const select = document.createElement("select");
  select.title = "QA subscription scenario (preview builds only)";
  select.style.cssText =
    "position:fixed;bottom:8px;left:8px;z-index:2147483647;font-size:12px;padding:2px 4px;opacity:0.85";

  select.append(new Option("QA: real subscription", ""));
  for (const [id, scenario] of Object.entries(SCENARIOS))
    select.append(new Option(`QA: ${scenario.label}`, id));
  select.value = readState()?.scenario || "";

  select.onchange = () => {
    writeState(
      select.value ? { scenario: select.value, overrides: {} } : undefined
    );
    window.location.reload();
  };

  const mount = () => document.body.append(select);
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
}
