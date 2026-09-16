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
import {
  isActiveSubscription,
  isUserSubscribed
} from "../../hooks/use-is-user-premium";
import { strings } from "@notesnook/intl";
import {
  SubscriptionPlan,
  SubscriptionProvider,
  SubscriptionStatus as SubscriptionStatusEnum
} from "@notesnook/core";
import { TaskManager } from "../../common/task-manager";
import { ConfirmDialog } from "../confirm";
import { ChangePlanDialog } from "../buy-dialog/change-plan-dialog";

export const SubscriptionSettings: SettingsGroup[] = [
  {
    key: "subscription",
    section: "subscription",
    header: SubscriptionStatus,
    onStateChange: (listener) =>
      useUserStore.subscribe((s) => s.user, listener),
    settings: [
      {
        key: "auto-renew",
        get title() {
          return strings.autoRenew();
        },
        get description() {
          return strings.autoRenewDesc();
        },
        isHidden: () => {
          const user = useUserStore.getState().user;
          const status = user?.subscription.status;
          return (
            user?.subscription.provider !== SubscriptionProvider.PADDLE ||
            user?.subscription.plan === SubscriptionPlan.EDUCATION ||
            !isUserSubscribed(user) ||
            status === SubscriptionStatusEnum.EXPIRED ||
            status === SubscriptionStatusEnum.TRIAL ||
            status === SubscriptionStatusEnum.CANCELED
          );
        },
        components: [
          {
            type: "toggle",
            isToggled: () => isActiveSubscription(),
            async toggle() {
              try {
                if (isActiveSubscription()) await db.subscriptions.pause();
                else await db.subscriptions.resume();
                useUserStore.setState((state) => {
                  state.user!.subscription.status = isActiveSubscription()
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
        key: "change-plan",
        get title() {
          return strings.changePlan();
        },
        get description() {
          return strings.changeSubPlan();
        },
        isHidden: () => {
          const user = useUserStore.getState().user;
          const status = user?.subscription.status;
          return (
            user?.subscription.plan === SubscriptionPlan.LEGACY_PRO ||
            user?.subscription.plan === SubscriptionPlan.EDUCATION ||
            user?.subscription.provider !== SubscriptionProvider.PADDLE ||
            !isUserSubscribed(user) ||
            status === SubscriptionStatusEnum.CANCELED ||
            status === SubscriptionStatusEnum.EXPIRED
          );
        },
        components: [
          {
            type: "button",
            get title() {
              return strings.change();
            },
            variant: "secondary",
            action: async () => {
              ChangePlanDialog.show({});
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
            title: strings.update(),
            action: async () => {
              try {
                const url = await db.subscriptions.updateUrl();
                if (!url)
                  throw new Error(
                    "Failed to get subscription update url. Please contact us at support@streetwriters.co so we can help you update your payment method."
                  );
                window.open(url, "_blank");
              } catch (e) {
                if (e instanceof Error) showToast("error", e.message);
              }
            },
            variant: "secondary"
          }
        ]
      },
      {
        key: "cancel-trial",
        get title() {
          return strings.cancelTrialQuestion().replace("?", "");
        },
        get description() {
          return strings.cancelTrialDesc();
        },
        isHidden: () => {
          const user = useUserStore.getState().user;
          const status = user?.subscription.status;
          return (
            user?.subscription.plan === SubscriptionPlan.LEGACY_PRO ||
            user?.subscription.provider !== SubscriptionProvider.PADDLE ||
            !isUserSubscribed(user) ||
            status !== SubscriptionStatusEnum.TRIAL
          );
        },
        components: [
          {
            type: "button",
            get title() {
              return strings.cancel();
            },
            variant: "error",
            async action() {
              const cancelTrial = await ConfirmDialog.show({
                title: strings.cancelTrialQuestion(),
                message: strings.cancelTrialDesc(),
                negativeButtonText: strings.no(),
                positiveButtonText: strings.yes()
              });
              if (cancelTrial) {
                await TaskManager.startTask({
                  type: "modal",
                  title: strings.cancellingYourTrial(),
                  subtitle: strings.pleaseWait(),
                  action: () => db.subscriptions.cancel()
                })
                  .catch((e) => showToast("error", e.message))
                  .then(() =>
                    showToast("success", strings.trialCanceled())
                  );
              }
            }
          }
        ]
      },
      {
        key: "refund-subscription",
        get title() {
          return strings.refundSub();
        },
        get description() {
          return strings.requestRefundDesc();
        },
        isHidden: () => {
          const user = useUserStore.getState().user;
          const status = user?.subscription.status;
          return (
            user?.subscription.provider !== SubscriptionProvider.PADDLE ||
            !isUserSubscribed(user) ||
            status === SubscriptionStatusEnum.TRIAL
          );
        },
        components: [
          {
            type: "button",
            get title() {
              return strings.refundSub();
            },
            async action() {
              const refundSubscription = await ConfirmDialog.show({
                title: strings.requestRefundQuestion(),
                message: strings.requestRefundDesc(),
                negativeButtonText: strings.no(),
                positiveButtonText: strings.yes(),
                inputs: {
                  reason: {
                    title: strings.reasonForRefund(),
                    helpText: strings.optional(),
                    multiline: true
                  }
                }
              });
              if (refundSubscription) {
                const result = await TaskManager.startTask({
                  type: "modal",
                  title: strings.requestingRefundForSub(),
                  subtitle: strings.pleaseWait(),
                  action: () =>
                    db.subscriptions.refund(refundSubscription.inputs?.reason)
                });
                if (result instanceof Error) {
                  showToast("error", result.message);
                  return;
                }
                showToast(
                  "success",
                  strings.refundIssued()
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
