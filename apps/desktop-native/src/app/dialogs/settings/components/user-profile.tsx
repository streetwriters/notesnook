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

import { dataColor, Flex, Image, Progress, Text } from "@ui";
import {
  Edit,
  User as UserIcon,
  UserProfileIcon
} from "../../../components/icons";
import { useStore as useUserStore } from "../../../stores/user-store";
import { useStore as useSettingStore } from "../../../stores/setting-store";
import { getObjectIdTimestamp } from "@notesnook/core";
import { formatBytes, getFormattedDate } from "@notesnook/common";
import { db } from "../../../common/db";
import { showToast } from "../../../utils/toast";
import { EditProfilePictureDialog } from "../../edit-profile-picture-dialog";
import { PromptDialog } from "../../prompt";
import { strings } from "@notesnook/intl";
import {
  SubscriptionPlan,
  SubscriptionProvider,
  SubscriptionStatus,
  User
} from "@notesnook/core";

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

type Props = {
  minimal?: boolean;
};

function Avatar(props: {
  size: number;
  iconSize: number;
  children?: React.ReactNode;
  picture?: string;
  bg?: "shade" | "background-tertiary";
  mr?: number;
}) {
  return (
    <Flex
      sx={{
        bg: props.bg ?? "shade",
        width: props.size,
        height: props.size,
        mr: props.mr,
        borderRadius: props.size,
        overflow: "hidden",
        position: "relative",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {props.picture ? (
        <Image
          src={props.picture}
          resizeMode="contain"
          sx={{ width: "100%", height: "100%" }}
        />
      ) : (
        <UserIcon size={props.iconSize} />
      )}
      {props.children}
    </Flex>
  );
}

export function UserProfile({ minimal }: Props) {
  const user = useUserStore((store) => store.user);
  const profile = useSettingStore((store) => store.profile);

  const { title, trial } = getSubscriptionInfo(user);

  if (!user || !user.id) {
    if (minimal)
      return (
        <Flex
          sx={{
            alignItems: "flex-start",
            flexDirection: "row",
            gap: "spacing3",
            px: "spacing4"
          }}
        >
          <Flex
            sx={{
              bg: "background-tertiary",
              boxShadow: "menu",
              width: 25,
              height: 25,
              borderRadius: 12.5,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <UserProfileIcon size={15} color="icon-secondary" />
          </Flex>
          <Flex sx={{ flexDirection: "column", gap: "spacing1" }}>
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
        sx={{
          borderRadius: "default",
          alignItems: "center",
          flexDirection: "row",
          bg: "background-secondary",
          p: 1,
          mb: 4,
          gap: 1
        }}
      >
        <Avatar size={40} iconSize={20} />
        <Flex sx={{ flexDirection: "column" }}>
          <Text variant="subtitle">{strings.loginMessage()}</Text>
          <Text variant="subBody">{strings.loginMessageActionText()}</Text>
        </Flex>
      </Flex>
    );
  }

  if (minimal)
    return (
      <Flex
        sx={{
          alignItems: "flex-start",
          flexDirection: "row",
          gap: "spacing3",
          px: "spacing4"
        }}
      >
        <Avatar size={25} iconSize={20} picture={profile?.profilePicture} />
        <Flex sx={{ flexDirection: "column", flex: 1, gap: "spacing1" }}>
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

  return (
    <Flex
      sx={{
        borderRadius: "default",
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        bg: "background-secondary",
        p: 1,
        mb: 4
      }}
    >
      <Flex sx={{ alignItems: "center", flexDirection: "row", flex: 1 }}>
        <Avatar
          size={50}
          iconSize={24}
          mr={2}
          picture={profile?.profilePicture}
        >
          <Flex
            title={strings.editProfilePicture()}
            onPress={async () => {
              await EditProfilePictureDialog.show({ profile });
            }}
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              bg: dataColor("#000000aa"),
              top: 0,
              left: 0,
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              cursor: "pointer",
              ":hover": { opacity: 1 }
            }}
          >
            <Text variant="subBody" sx={{ color: dataColor("#ffffff") }}>
              {strings.edit()}
            </Text>
          </Flex>
        </Avatar>
        <Flex sx={{ flexDirection: "column", flex: 1 }}>
          <Text variant="subBody" sx={{ color: "accent" }}>
            {`${title}${trial ? " (trial)" : ""}`}
          </Text>

          <Flex sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
            <Text variant="subtitle">
              {profile?.fullName || strings.yourFullName()}
            </Text>
            <Edit
              size={12}
              title={strings.editFullName()}
              onPress={async () => {
                const fullName = await PromptDialog.show({
                  title: strings.editFullName(),
                  description: strings.setFullNameDesc(),
                  defaultValue: profile?.fullName,
                  label: strings.enterFullName()
                });

                if (fullName === profile?.fullName) return;

                try {
                  await db.settings.setProfile({
                    fullName: fullName || undefined
                  });
                  await useSettingStore.getState().refresh();
                  showToast("success", strings.fullNameUpdated());
                } catch (e) {
                  showToast("error", (e as Error).message);
                }
              }}
            />
          </Flex>
          <Text variant="subBody">
            {`${user.email} \u2022 ${strings.memberSince(
              getFormattedDate(getObjectIdTimestamp(user.id), "date")
            )}`}
          </Text>
          {user.totalStorage ? (
            <Flex
              sx={{
                maxWidth: 300,
                alignItems: "center",
                flexDirection: "row",
                gap: 1
              }}
            >
              <Progress
                max={user.totalStorage === -1 ? Infinity : user.totalStorage}
                value={user.storageUsed || 0}
                sx={{ flex: 1 }}
              />
              <Text variant="subBody" sx={{ flexShrink: 0 }}>
                {formatBytes(user.storageUsed || 0)}/
                {user.totalStorage === -1
                  ? strings.unlimited()
                  : formatBytes(user.totalStorage)}{" "}
                {strings.used()}
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </Flex>
  );
}
