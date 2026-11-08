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

import { getFormattedDate } from "@notesnook/common";
import {
  SubscriptionPlan,
  SubscriptionProvider,
  SubscriptionStatus,
  type User
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { Flex, Image, Text } from "@ui";
import { User as UserIcon, UserProfileIcon } from "../icons";
import { useStore as useUserStore } from "../../stores/user-store";
import { useStore as useSettingStore } from "../../stores/setting-store";

export function getSubscriptionInfo(user?: User): {
  title: string;
  trial?: boolean;
  paused?: boolean;
  canceled?: boolean;
  expiryDate?: string;
  startDate?: string;
  autoRenew?: boolean;
  trialExpiryDate?: string;
} {
  user = user || useUserStore.getState().user;
  const { expiry, plan, status, provider } = user?.subscription || {};
  if (!expiry) return { title: "Free" };

  const trial = status === SubscriptionStatus.TRIAL;
  const title =
    plan === SubscriptionPlan.BELIEVER
      ? "Believer"
      : plan === SubscriptionPlan.PRO
      ? "Pro"
      : plan === SubscriptionPlan.ESSENTIAL
      ? "Essential"
      : plan === SubscriptionPlan.EDUCATION
      ? "Education"
      : plan === SubscriptionPlan.LEGACY_PRO
      ? "Pro (legacy)"
      : "Free";
  const autoRenew =
    (status === SubscriptionStatus.ACTIVE ||
      status === SubscriptionStatus.TRIAL) &&
    provider !== SubscriptionProvider.STREETWRITERS;
  const paused = status === SubscriptionStatus.PAUSED;
  const canceled = status === SubscriptionStatus.CANCELED;

  const expiryDate =
    (!!user?.subscription?.expiry &&
      getFormattedDate(user.subscription.expiry, "date-time")) ||
    undefined;
  const trialExpiryDate =
    (!!user?.subscription?.trialExpiry &&
      getFormattedDate(user.subscription.trialExpiry, "date-time")) ||
    undefined;
  const startDate =
    (!!user?.subscription?.start &&
      getFormattedDate(user?.subscription?.start, "date-time")) ||
    undefined;

  return {
    title,
    trial,
    expiryDate,
    startDate,
    trialExpiryDate,
    autoRenew,
    paused,
    canceled
  };
}

export function UserProfileMinimal() {
  const user = useUserStore((store) => store.user);
  const profile = useSettingStore((store) => store.profile);
  const { title, trial } = getSubscriptionInfo(user);

  if (!user || !user.id)
    return (
      <Flex
        sx={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: "spacing3",
          px: "spacing4"
        }}
      >
        <Flex
          sx={{
            alignItems: "center",
            justifyContent: "center",
            bg: "background-tertiary",
            width: 25,
            height: 25,
            borderRadius: 12.5
          }}
        >
          <UserProfileIcon size={15} color="icon-secondary" />
        </Flex>
        <Flex sx={{ flexDirection: "column", gap: "spacing1", lineHeight: 1 }}>
          <Text sx={{ fontSize: "3xs", color: "heading", fontWeight: 600 }}>
            {strings.loginMessage()}
          </Text>
          <Text sx={{ fontSize: "3xs", color: "paragraph" }}>
            {strings.loginMessageActionText()}
          </Text>
        </Flex>
      </Flex>
    );

  return (
    <Flex
      testID="user-profile-minimal"
      sx={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: "spacing3",
        px: "spacing4"
      }}
    >
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "center",
          width: 25,
          height: 25,
          borderRadius: 80,
          overflow: "hidden"
        }}
      >
        {profile?.profilePicture ? (
          <Image
            src={profile.profilePicture}
            resizeMode="contain"
            sx={{ width: "100%", height: "100%" }}
          />
        ) : (
          <UserIcon size={20} color="icon" />
        )}
      </Flex>
      <Flex
        sx={{
          flexDirection: "column",
          flex: 1,
          gap: "spacing1",
          lineHeight: 1
        }}
      >
        <Text sx={{ color: "accent", fontSize: "3xs", fontWeight: 500 }}>
          {`${title}${trial ? " (trial)" : ""}`}
        </Text>
        <Text sx={{ fontSize: "3xs", color: "heading", fontWeight: 600 }}>
          {profile?.fullName || strings.yourFullName()}
        </Text>
        <Text sx={{ fontSize: "3xs", color: "paragraph" }}>{user.email}</Text>
      </Flex>
    </Flex>
  );
}
