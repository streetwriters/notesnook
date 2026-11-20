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
import { Box, Flex, Text } from "@theme-ui/components";
import { strings } from "@notesnook/intl";
import { getSubscriptionInfo } from "./user-profile";
import {
  FeatureUsage,
  formatBytes,
  getFeature,
  getFeaturesUsage,
  usePromise
} from "@notesnook/common";
import {
  SubscriptionProvider,
  SubscriptionStatus as SubscriptionStatusEnum
} from "@notesnook/core";
import { StatusPill } from "../../../components/settings-ui";

function getUsageValue(feature: FeatureUsage, isFree: boolean) {
  const total =
    feature.total === Infinity
      ? strings.unlimited()
      : feature.id === "storage"
      ? formatBytes(feature.total)
      : `${feature.total}`;
  if (!isFree) return total;
  return feature.id === "storage"
    ? `${formatBytes(feature.used)}/${total}`
    : feature.total === Infinity
    ? strings.unlimited()
    : strings.countOfTotal(feature.used, feature.total);
}

function UsageColumn(props: { features: FeatureUsage[]; isFree: boolean }) {
  return (
    <Flex sx={{ flexDirection: "column", gap: "10px", flex: 1, minWidth: 0 }}>
      {props.features.map((feature) => (
        <Flex key={feature.id} sx={{ gap: "spacing13" }}>
          <Text
            sx={{
              flex: "0 1 150px",
              minWidth: 0,
              overflowWrap: "anywhere",
              fontSize: "xs",
              lineHeight: 1,
              color: "paragraph"
            }}
          >
            {getFeature(feature.id).title}
          </Text>
          <Text
            sx={{
              flex: "1 1 0",
              minWidth: 0,
              overflowWrap: "anywhere",
              fontSize: "xs",
              lineHeight: 1,
              color: "heading"
            }}
          >
            {getUsageValue(feature, props.isFree)}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}

export function SubscriptionStatus() {
  const user = useUserStore((store) => store.user);
  const featuresUsage = usePromise(() => getFeaturesUsage(), [user]);

  const { title, autoRenew, expiryDate, trialExpiryDate, trial } =
    getSubscriptionInfo(user);
  const isFree = title === "Free";
  const subtitle = isFree
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

  const status = user.subscription.status;
  const showActive =
    isFree ||
    status === SubscriptionStatusEnum.ACTIVE ||
    status === SubscriptionStatusEnum.TRIAL;
  const usage = featuresUsage.status === "fulfilled" ? featuresUsage.value : [];
  const half = Math.ceil(usage.length / 2);
  const description = isFree
    ? "Upgrade to Pro to unlock all premium features."
    : subtitle
    ? `${subtitle} ${strings.subscriptionProviderInfo[
        user.subscription.provider || 0
      ].desc()}`
    : "";

  return (
    <Flex
      sx={{
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "stretch",
        borderRadius: "radius2",
        bg: "background-secondary",
        px: "spacing5",
        py: "spacing6",
        gap: "spacing4"
      }}
    >
      <Flex sx={{ flexDirection: "column", gap: "spacing3" }}>
        <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Text
            variant="heading"
            sx={{
              fontSize: "lg",
              fontWeight: 600,
              lineHeight: 1,
              color: "heading"
            }}
          >
            {title}
          </Text>
          {showActive ? <StatusPill label={strings.active()} /> : null}
        </Flex>
        {description ? (
          <Text
            variant="body"
            sx={{ fontSize: "xs", lineHeight: 1.1, color: "paragraph" }}
          >
            {description}
          </Text>
        ) : null}
      </Flex>
      {usage.length > 0 ? (
        <Box
          sx={{
            containerType: "inline-size",
            bg: "background",
            border: "1px solid",
            borderColor: "border-secondary",
            borderRadius: "radius2",
            px: "spacing4",
            py: "spacing6"
          }}
        >
          <Flex
            sx={{
              justifyContent: "center",
              gap: "spacing7",
              "@container (max-width: 560px)": { flexDirection: "column" }
            }}
          >
            <UsageColumn features={usage.slice(0, half)} isFree={isFree} />
            {usage.length > 1 ? (
              <>
                <Flex
                  sx={{
                    width: "1px",
                    alignSelf: "stretch",
                    flexShrink: 0,
                    bg: "separator",
                    "@container (max-width: 560px)": {
                      width: "100%",
                      height: "1px"
                    }
                  }}
                />
                <UsageColumn features={usage.slice(half)} isFree={isFree} />
              </>
            ) : null}
          </Flex>
        </Box>
      ) : null}
    </Flex>
  );
}
