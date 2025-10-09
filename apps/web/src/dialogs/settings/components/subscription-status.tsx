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
import { Button, Flex, Grid, Progress, Text } from "@theme-ui/components";
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

export function SubscriptionStatus() {
  const user = useUserStore((store) => store.user);
  const featuresUsage = usePromise(() => getFeaturesUsage(), [user]);

  const { title, autoRenew, expiryDate, trialExpiryDate, trial } =
    getSubscriptionInfo(user);
  const subtitle =
    title === "Free"
      ? ""
      : trial
      ? `Your free trial is on-going. Your subscription will start on ${trialExpiryDate}.`
      : autoRenew
      ? `Your subscription will auto renew on ${expiryDate}.`
      : expiryDate
      ? `Your account will automatically downgrade to the Free plan on ${expiryDate}.`
      : "";

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
          gap: 2
          // mb: isBasic ? 0 : 4
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
          <Grid
            sx={{
              gridTemplateRows: "1fr ".repeat(featuresUsage.value.length),
              gridTemplateColumns: "1fr 3fr 1fr",
              borderTop: "1px solid var(--border)",
              pt: 2,
              width: "100%"
            }}
          >
            {featuresUsage.value.map((feature, index) => (
              <>
                <Text sx={{ gridRow: index + 1, gridColumn: 1 }} variant="body">
                  {getFeature(feature.id).title}
                </Text>
                <Text
                  sx={{ gridRow: index + 1, gridColumn: 3, textAlign: "right" }}
                  variant="subBody"
                >
                  {feature.id === "storage"
                    ? `${formatBytes(feature.used)}/${
                        feature.total === Infinity
                          ? "Unlimited"
                          : formatBytes(feature.total)
                      }`
                    : feature.total === Infinity
                    ? "Unlimited"
                    : `${feature.used} of ${feature.total}`}
                </Text>
              </>
            ))}
          </Grid>
        ) : null}

        {title === "Free" ? (
          <Flex sx={{ alignItems: "center", justifyContent: "center", gap: 1 }}>
            <Button variant="accent" onClick={() => BuyDialog.show({})}>
              {strings.upgradeToPro()}
            </Button>
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
                    action: () =>
                      db.subscriptions
                        .redeemCode(giftCode)
                        .catch((e) => showToast("error", e.message))
                  });
                }
              }}
              sx={{ bg: "background" }}
            >
              {strings.redeemGiftCode()}
            </Button>
          </Flex>
        ) : null}
      </Flex>
      {/* {isBasic ? <Features /> : null} */}
    </>
  );
}
