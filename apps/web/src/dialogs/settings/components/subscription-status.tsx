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

import { useStore as useUserStore } from "../../../stores/user-store";
import { Button, Flex, Text } from "@theme-ui/components";
import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";
import { SUBSCRIPTION_STATUS } from "../../../common/constants";
import { db } from "../../../common/db";
import { TaskManager } from "../../../common/task-manager";
import { showToast } from "../../../utils/toast";
import { Loading } from "../../../components/icons";
import { Features } from "../../buy-dialog/features";
import { ConfirmDialog } from "../../confirm";
import { BuyDialog } from "../../buy-dialog";
import { strings } from "@notesnook/intl";
import { PromptDialog } from "../../prompt";

export function SubscriptionStatus() {
  const user = useUserStore((store) => store.user);

  const [activateTrial, isActivatingTrial] = useAction(async () => {
    await db.user.activateTrial();
  });

  const provider =
    strings.subscriptionProviderInfo[user?.subscription?.provider || 0];
  const {
    isTrial,
    isBeta,
    isPro,
    isBasic,
    isProCancelled,
    isProExpired,
    remainingDays
  } = useMemo(() => {
    const type = user?.subscription?.type;
    const expiry = user?.subscription?.expiry;
    if (!expiry) return { isBasic: true, remainingDays: 0 };
    return {
      remainingDays: dayjs(expiry).diff(dayjs(), "day"),
      isTrial: type === SUBSCRIPTION_STATUS.TRIAL,
      isBasic: type === SUBSCRIPTION_STATUS.BASIC,
      isBeta: type === SUBSCRIPTION_STATUS.BETA,
      isPro: type === SUBSCRIPTION_STATUS.PREMIUM,
      isProCancelled: type === SUBSCRIPTION_STATUS.PREMIUM_CANCELED,
      isProExpired: type === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED
    };
  }, [user]);

  const subtitle = useMemo(() => {
    const expiryDate = dayjs(user?.subscription?.expiry).format("MMMM D, YYYY");
    const startDate = dayjs(user?.subscription?.start).format("MMMM D, YYYY");
    return isPro
      ? provider.type === "Streetwriters" || provider.type === "Gift card"
        ? `Ending on ${expiryDate}`
        : `Next payment on ${expiryDate}.`
      : isProCancelled
      ? `Ending on ${expiryDate}.`
      : isProExpired
      ? "Your account will be downgraded to Basic in 3 days."
      : isBeta
      ? `Beta member since ${startDate}`
      : isTrial
      ? `Ending on ${expiryDate}`
      : null;
  }, [isPro, isProExpired, isProCancelled, isBeta, isTrial, user, provider]);

  if (!user) return null;
  return (
    <>
      <Flex
        sx={{
          flexDirection: "column",
          borderRadius: "default",
          justifyContent: "center",
          alignItems: "start",
          bg: "var(--background-secondary)",
          p: 2,
          mb: isBasic ? 0 : 4
        }}
      >
        <Text
          variant="subBody"
          sx={{
            fontSize: 11,
            fontWeight: "bold",
            letterSpacing: 0.3,
            color: "accent"
          }}
        >
          {strings.currentPlan()}
        </Text>
        <Text
          variant="heading"
          sx={{
            mt: 2
          }}
        >
          {remainingDays > 0 && (isPro || isProCancelled)
            ? `Pro`
            : remainingDays > 0 && isTrial
            ? "Trial"
            : isBeta
            ? "Beta user"
            : "Basic"}
        </Text>
        <Text variant="body">
          {remainingDays > 0 && (isPro || isProCancelled || isTrial || isBeta)
            ? `Access to all Pro features including unlimited storage for attachments,
          notebooks & tags.`
            : "Access only to basic features including unlimited notes & end-to-end encrypted syncing to unlimited devices."}
        </Text>
        <Text sx={{ mt: 2 }} variant="subBody">
          {subtitle}. {provider.desc()}
        </Text>
        <Flex sx={{ gap: 1, mt: 2 }}>
          {provider.type === "Web" && (isPro || isProCancelled) ? (
            <>
              {isPro && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const cancelSubscription = await ConfirmDialog.show({
                      title: "Cancel subscription?",
                      message:
                        "Cancelling your subscription will automatically downgrade you to the Basic plan at the end of your billing period. You will have to resubscribe to continue using the Pro features.",
                      negativeButtonText: strings.no(),
                      positiveButtonText: strings.yes()
                    });
                    if (cancelSubscription) {
                      await TaskManager.startTask({
                        type: "modal",
                        title: "Cancelling your subscription",
                        subtitle: strings.pleaseWait() + "...",
                        action: () => db.subscriptions.cancel()
                      })
                        .catch((e) => showToast("error", e.message))
                        .then(() =>
                          showToast("success", strings.subCanceled())
                        );
                    }
                  }}
                >
                  {strings.cancelSub()}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={async () => {
                  const refundSubscription = await ConfirmDialog.show({
                    title: "Request refund?",
                    message:
                      "You will only be issued a refund if you are eligible as per our refund policy. Your account will be immediately downgraded to Basic and your funds will be transferred to your account within 24 hours.",
                    negativeButtonText: strings.no(),
                    positiveButtonText: strings.yes()
                  });
                  if (refundSubscription) {
                    await TaskManager.startTask({
                      type: "modal",
                      title: "Requesting refund for your subscription",
                      subtitle: strings.pleaseWait() + "...",
                      action: () => db.subscriptions.refund()
                    })
                      .catch((e) => showToast("error", e.message))
                      .then(() => showToast("success", strings.refundIssued()));
                  }
                }}
              >
                Request a refund
              </Button>
            </>
          ) : null}
          {!isPro && (
            <>
              <Button variant="accent" onClick={() => BuyDialog.show({})}>
                {isProCancelled ? strings.resubToPro() : strings.upgradeToPro()}
              </Button>
              {isBasic && (
                <Button
                  variant="secondary"
                  onClick={activateTrial}
                  sx={{ bg: "background" }}
                >
                  {isActivatingTrial ? (
                    <Loading size={16} />
                  ) : (
                    strings.tryFreeFor14Days()
                  )}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={async () => {
                  const giftCode = await PromptDialog.show({
                    title: strings.redeemGiftCode(),
                    description: strings.redeemGiftCodeDesc()
                  });
                  if (giftCode) {
                    await TaskManager.startTask({
                      type: "modal",
                      title: strings.redeemingGiftCode(),
                      subtitle: strings.pleaseWait() + "...",
                      action: () => db.subscriptions.redeemCode(giftCode)
                    }).catch((e) => showToast("error", e.message));
                  }
                }}
                sx={{ bg: "background" }}
              >
                {strings.redeemGiftCode()}
              </Button>
            </>
          )}
        </Flex>
      </Flex>
      {isBasic ? <Features /> : null}
    </>
  );
}

function useAction(action: () => Promise<void>) {
  const [isLoading, setIsLoading] = useState(false);

  const _action = useCallback(async () => {
    try {
      setIsLoading(true);
      await action();
    } catch (e) {
      if (e instanceof Error) {
        showToast("error", e.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [action]);

  return [_action, isLoading] as const;
}
