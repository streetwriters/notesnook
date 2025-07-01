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

import { SettingsGroup } from "./types";
import { SubscriptionStatus } from "./components/subscription-status";
import { showToast } from "../../utils/toast";
import { db } from "../../common/db";
import { BillingHistory } from "./components/billing-history";
import { useStore as useUserStore } from "../../stores/user-store";
import { isUserSubscribed } from "../../hooks/use-is-user-premium";
import { strings } from "@notesnook/intl";
import {
  SubscriptionPlan,
  SubscriptionProvider,
  SubscriptionStatus as SubscriptionStatusEnum
} from "@notesnook/core";
import { TaskManager } from "../../common/task-manager";
import { ConfirmDialog } from "../confirm";

export const SubscriptionSettings: SettingsGroup[] = [
  {
    key: "subscription",
    section: "subscription",
    header: SubscriptionStatus,
    settings: [
      {
        key: "auto-renew",
        title: "Auto renew",
        onStateChange: (listener) =>
          useUserStore.subscribe((s) => s.user, listener),
        description:
          "Toggle auto renew to avoid any surprise charges. If you do not turn auto renew back on, you'll be automatically downgraded to the Free plan at the end of your billing period.",
        isHidden: () => {
          const user = useUserStore.getState().user;
          const status = user?.subscription.status;
          return (
            user?.subscription.provider !== SubscriptionProvider.PADDLE ||
            !isUserSubscribed(user) ||
            status === SubscriptionStatusEnum.CANCELED ||
            status === SubscriptionStatusEnum.EXPIRED
          );
        },
        components: [
          {
            type: "toggle",
            isToggled: () =>
              useUserStore.getState().user?.subscription.status ===
              SubscriptionStatusEnum.ACTIVE,
            async toggle() {
              try {
                const user = useUserStore.getState().user;
                const status = user?.subscription.status;
                if (status === SubscriptionStatusEnum.ACTIVE)
                  await db.subscriptions.pause();
                else await db.subscriptions.resume();
                useUserStore.setState((state) => {
                  state.user!.subscription.status =
                    status === SubscriptionStatusEnum.ACTIVE
                      ? SubscriptionStatusEnum.PAUSED
                      : SubscriptionStatusEnum.ACTIVE;
                });
              } catch (e) {
                showToast("error", (e as Error).message);
              }
            }
          }
        ]
      },
      {
        key: "payment-method",
        title: strings.paymentMethod(),
        description: strings.changePaymentMethodDescription(),
        isHidden: () => {
          const user = useUserStore.getState().user;
          return (
            user?.subscription.provider !== SubscriptionProvider.PADDLE ||
            !isUserSubscribed(user)
          );
        },
        components: [
          {
            type: "button",
            title: strings.update(),
            action: async () => {
              try {
                const urls = await db.subscriptions.urls();
                if (!urls)
                  throw new Error(
                    "Failed to get subscription management urls. Please contact us at support@streetwriters.co so we can help you update your payment method."
                  );
                window.open(urls?.update_payment_method, "_blank");
              } catch (e) {
                if (e instanceof Error) showToast("error", e.message);
              }
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "cancel-subscription",
        title: "Cancel subscription",
        onStateChange: (listener) =>
          useUserStore.subscribe((s) => s.user, listener),
        description: `Cancel your subscription to stop all future charges permanently. You will automatically be downgraded to the Free plan at the end of your billing period.

Canceled subscriptions cannot be resumed/renewed which is why it is recommended that you disable auto renew instead.`,
        isHidden: () => {
          const user = useUserStore.getState().user;
          const status = user?.subscription.status;
          return (
            user?.subscription.provider !== SubscriptionProvider.PADDLE ||
            !isUserSubscribed(user) ||
            status === SubscriptionStatusEnum.CANCELED ||
            status === SubscriptionStatusEnum.EXPIRED
          );
        },
        components: [
          {
            type: "button",
            title: "Cancel",
            async action() {
              const cancelSubscription = await ConfirmDialog.show({
                title: "Cancel subscription?",
                message:
                  "Cancel your subscription to stop all future charges permanently. You will automatically be downgraded to the Free plan at the end of your billing period.",
                negativeButtonText: "No",
                positiveButtonText: "Yes"
              });
              if (cancelSubscription) {
                await TaskManager.startTask({
                  type: "modal",
                  title: "Cancelling your subscription",
                  subtitle: "Please wait...",
                  action: () => db.subscriptions.cancel()
                })
                  .catch((e) => showToast("error", e.message))
                  .then(() =>
                    showToast("success", "Your subscription has been canceled.")
                  );
              }
            },
            variant: "error"
          }
        ]
      },
      {
        key: "refund-subscription",
        title: "Refund subscription",
        onStateChange: (listener) =>
          useUserStore.subscribe((s) => s.user, listener),
        description: `You will only be issued a refund if you are eligible as per our refund policy. Your account will immediately be downgraded to Basic and your funds will be transferred to your account within 24 hours.`,
        isHidden: () => {
          const user = useUserStore.getState().user;
          return (
            user?.subscription.provider !== SubscriptionProvider.PADDLE ||
            !isUserSubscribed(user) ||
            user.subscription.plan === SubscriptionPlan.EDUCATION
          );
        },
        components: [
          {
            type: "button",
            title: "Refund",
            async action() {
              const refundSubscription = await ConfirmDialog.show({
                title: "Request refund?",
                message:
                  "You will only be issued a refund if you are eligible as per our refund policy. Your account will immediately be downgraded to Basic and your funds will be transferred to your account within 24 hours.",
                negativeButtonText: "No",
                positiveButtonText: "Yes"
              });
              if (refundSubscription) {
                await TaskManager.startTask({
                  type: "modal",
                  title: "Requesting refund for your subscription",
                  subtitle: "Please wait...",
                  action: () => db.subscriptions.refund()
                })
                  .catch((e) => showToast("error", e.message))
                  .then(() =>
                    showToast(
                      "success",
                      "Your refund request has been sent. If you are eligible for a refund, you'll receive your funds within 24 hours. Please wait at least 24 hours before reaching out to us in case there is any problem."
                    )
                  );
              }
            },
            variant: "error"
          }
        ]
      },
      {
        key: "billing-history",
        title: strings.billingHistory(),
        isHidden: () => {
          const user = useUserStore.getState().user;
          return (
            user?.subscription.provider !== SubscriptionProvider.PADDLE ||
            !isUserSubscribed(user)
          );
        },
        components: [{ type: "custom", component: BillingHistory }]
      }
    ]
  }
];
