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

import { SettingsGroup, Setting } from "./types";
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
import { hardNavigate } from "../../navigation";
import { PromptDialog } from "../prompt";
import { CancelSubscriptionDialog } from "./components/cancel-subscription-dialog";
import {
  ClockCounterClockwise,
  CrownSimple,
  FileText,
  Gift,
  PencilSimple,
  Pause,
  Close,
  Wallet,
  XCircle
} from "../../components/icons";

const onStateChange: SettingsGroup["onStateChange"] = (listener) =>
  useUserStore.subscribe((s) => s.user, listener);

const currentSubscription = () => useUserStore.getState().user?.subscription;

function isPaddleSubscriber() {
  const user = useUserStore.getState().user;
  return (
    user?.subscription.provider === SubscriptionProvider.PADDLE &&
    isUserSubscribed(user)
  );
}

function hasPlan(...plans: SubscriptionPlan[]) {
  const plan = currentSubscription()?.plan;
  return plan !== undefined && plans.includes(plan);
}

function hasStatus(...statuses: SubscriptionStatusEnum[]) {
  const status = currentSubscription()?.status;
  return status !== undefined && statuses.includes(status);
}

// the old auto-renew toggle's visibility; cancel and resume subscription replace it
function isAutoRenewHidden() {
  return (
    !isPaddleSubscriber() ||
    hasPlan(SubscriptionPlan.EDUCATION) ||
    hasStatus(
      SubscriptionStatusEnum.EXPIRED,
      SubscriptionStatusEnum.TRIAL,
      SubscriptionStatusEnum.CANCELED
    )
  );
}

function isFreeUser() {
  return !currentSubscription()?.expiry;
}

const upgradeToPro: Setting = {
  key: "upgrade-to-pro",
  title: strings.upgradeToPro(),
  description: "Unlock all Pro features",
  icon: CrownSimple,
  isHidden: () => !isFreeUser(),
  components: [
    {
      type: "navigation",
      action: async () => {
        hardNavigate("/plans");
      }
    }
  ]
};

const redeemGiftCode: Setting = {
  key: "redeem-gift-code",
  title: strings.redeemGiftCode(),
  description: "Enter your gift code to redeem your gift.",
  icon: Gift,
  isHidden: () => !isFreeUser(),
  components: [
    {
      type: "navigation",
      action: async () => {
        const giftCode = await PromptDialog.show({
          title: strings.redeemGiftCode(),
          description: strings.redeemGiftCodeDesc(),
          label: strings.enterGiftCode()
        });
        if (giftCode) {
          await TaskManager.startTask({
            type: "modal",
            title: strings.redeemingGiftCode(),
            subtitle: strings.pleaseWait() + "...",
            action: () =>
              db.subscriptions
                .redeemCode(giftCode)
                .catch((e) => showToast("error", e.message))
          });
        }
      }
    }
  ]
};

export const SubscriptionSettings: SettingsGroup[] = [
  {
    key: "subscription",
    section: "subscription",
    header: SubscriptionStatus,
    onStateChange,
    settings: []
  },
  {
    key: "billing-payment",
    section: "subscription",
    header: "Billing & payment",
    onStateChange,
    settings: [
      {
        key: "payment-method",
        title: strings.paymentMethod(),
        description: strings.changePaymentMethodDescription(),
        icon: Wallet,
        isHidden: () =>
          !isPaddleSubscriber() ||
          hasStatus(
            SubscriptionStatusEnum.CANCELED,
            SubscriptionStatusEnum.EXPIRED
          ),
        components: [
          {
            type: "navigation",
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
            }
          }
        ]
      },
      {
        key: "billing-history",
        title: strings.billingHistory(),
        description: "View past invoices and receipts",
        icon: FileText,
        isHidden: () => !isPaddleSubscriber(),
        components: [
          {
            type: "navigation",
            page: {
              key: "billing-history",
              title: strings.billingHistory(),
              component: BillingHistory
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
        icon: PencilSimple,
        isHidden: () =>
          hasPlan(SubscriptionPlan.LEGACY_PRO, SubscriptionPlan.EDUCATION) ||
          !isPaddleSubscriber() ||
          hasStatus(
            SubscriptionStatusEnum.CANCELED,
            SubscriptionStatusEnum.EXPIRED
          ),
        components: [
          {
            type: "navigation",
            action: async () => {
              ChangePlanDialog.show({});
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
        icon: ClockCounterClockwise,
        isHidden: () =>
          !isPaddleSubscriber() || hasStatus(SubscriptionStatusEnum.TRIAL),
        components: [
          {
            type: "navigation",
            async action() {
              const refundSubscription = await ConfirmDialog.show({
                title: strings.requestRefundQuestion(),
                subtitle: strings.requestRefundDesc(),
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
                showToast("success", strings.refundIssued());
              }
            }
          }
        ]
      }
    ]
  },
  {
    key: "subscription-management",
    section: "subscription",
    header: "Subscription management",
    onStateChange,
    settings: [
      upgradeToPro,
      redeemGiftCode,
      {
        key: "cancel-trial",
        get title() {
          return strings.cancelTrialQuestion().replace("?", "");
        },
        get description() {
          return strings.cancelTrialDesc();
        },
        icon: XCircle,
        isHidden: () =>
          hasPlan(SubscriptionPlan.LEGACY_PRO) ||
          !isPaddleSubscriber() ||
          !hasStatus(SubscriptionStatusEnum.TRIAL),
        components: [
          {
            type: "navigation",
            async action() {
              const cancelTrial = await ConfirmDialog.show({
                title: strings.cancelTrialQuestion(),
                subtitle: strings.cancelTrialDesc(),
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
                  .then(() => showToast("success", strings.trialCanceled()));
              }
            }
          }
        ]
      },
      {
        key: "cancel-subscription",
        title: "Cancel subscription",
        description: "Cancel your subscription to switch to the Free plan.",
        icon: Close,
        isHidden: () => isAutoRenewHidden() || !isActiveSubscription(),
        components: [
          {
            type: "navigation",
            async action() {
              const confirmed = await CancelSubscriptionDialog.show({});
              if (!confirmed) return;
              try {
                await db.subscriptions.pause();
                useUserStore.setState((state) => {
                  state.user!.subscription.status =
                    SubscriptionStatusEnum.PAUSED;
                });
              } catch (e) {
                showToast("error", (e as Error).message);
              }
            }
          }
        ]
      },
      {
        key: "resume-subscription",
        title: "Resume subscription",
        description: "Resume your subscription to keep your Pro features.",
        icon: Pause,
        isHidden: () => isAutoRenewHidden() || isActiveSubscription(),
        components: [
          {
            type: "navigation",
            async action() {
              try {
                await db.subscriptions.resume();
                useUserStore.setState((state) => {
                  state.user!.subscription.status =
                    SubscriptionStatusEnum.ACTIVE;
                });
              } catch (e) {
                showToast("error", (e as Error).message);
              }
            }
          }
        ]
      }
    ]
  }
];
