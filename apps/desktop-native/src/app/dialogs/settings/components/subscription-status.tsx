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
import { Button, Flex, Text } from "@ui";
import { strings } from "@notesnook/intl";
import { getSubscriptionInfo } from "./user-profile";
import { BuyDialog } from "../../buy-dialog";
import { PromptDialog } from "../../prompt";
import { TaskManager } from "../../../common/task-manager";
import { db } from "../../../common/db";
import { showToast } from "../../../utils/toast";
import {
  formatBytes,
  getFeature,
  getFeaturesUsage,
  usePromise
} from "@notesnook/common";
import { SubscriptionProvider } from "@notesnook/core";

export function SubscriptionStatus() {
  const user = useUserStore((store) => store.user);
  const featuresUsage = usePromise(() => getFeaturesUsage(), [user]);

  const { title, autoRenew, expiryDate, trialExpiryDate, trial } =
    getSubscriptionInfo(user);
  const subtitle =
    title === "Free"
      ? ""
      : trial
      ? strings.trialOngoingStartsOn(trialExpiryDate || "")
      : user?.subscription.provider === SubscriptionProvider.GIFT_CARD
      ? strings.subExpiresOn(expiryDate || "")
      : autoRenew
      ? strings.subAutoRenewsOn(expiryDate || "")
      : expiryDate
      ? strings.accountDowngradesFreeOn(expiryDate)
      : "";

  if (!user) return null;
  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex
        sx={{
          flexDirection: "column",
          borderRadius: "default",
          justifyContent: "center",
          alignItems: "flex-start",
          bg: "background-secondary",
          p: 2,
          gap: 2
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
        <Text variant="heading">{title}</Text>
        {subtitle ? (
          <Text variant="body">
            {subtitle}{" "}
            {strings.subscriptionProviderInfo[
              user.subscription.provider || 0
            ].desc()}
          </Text>
        ) : null}
        {featuresUsage.status === "fulfilled" ? (
          <Flex
            sx={{
              flexDirection: "column",
              borderTop: "1px solid",
              borderTopColor: "border",
              pt: 2,
              width: "100%"
            }}
          >
            {featuresUsage.value.map((feature) => (
              <Flex
                key={feature.id}
                sx={{
                  flexDirection: "row",
                  justifyContent: "space-between"
                }}
              >
                <Text variant="body">{getFeature(feature.id).title}</Text>
                <Text variant="subBody" sx={{ textAlign: "right" }}>
                  {feature.id === "storage"
                    ? `${formatBytes(feature.used)}/${
                        feature.total === Infinity
                          ? strings.unlimited()
                          : formatBytes(feature.total)
                      }`
                    : feature.total === Infinity
                    ? strings.unlimited()
                    : strings.countOfTotal(feature.used, feature.total)}
                </Text>
              </Flex>
            ))}
          </Flex>
        ) : null}

        {title === "Free" ? (
          <Flex
            sx={{
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 1
            }}
          >
            <Button variant="accent" onPress={() => BuyDialog.show({})}>
              <Text>{strings.upgradeToPro()}</Text>
            </Button>
            <Button
              variant="secondary"
              onPress={async () => {
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
              }}
              sx={{ bg: "background" }}
            >
              <Text>{strings.redeemGiftCode()}</Text>
            </Button>
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
}
