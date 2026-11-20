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

import { Flex, Image, Text } from "@theme-ui/components";
import {
  PencilSimple,
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
            gap: "spacing3",
            px: "spacing4"
          }}
        >
          <Flex
            variant="columnCenter"
            sx={{
              bg: "background-tertiary",
              boxShadow: "0 4px 34px 0 rgba(0, 0, 0, 0.10)",
              size: 25,
              borderRadius: "12.5px"
            }}
          >
            <UserProfileIcon size={15} color="icon-secondary" />
          </Flex>
          <Flex
            sx={{
              flexDirection: "column",
              gap: "spacing1",
              lineHeight: 1
            }}
          >
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
          borderRadius: "radius2",
          alignItems: "center",
          bg: "background-secondary",
          p: "spacing4",
          gap: "spacing4",
          mb: "spacing2"
        }}
      >
        <Flex
          variant="columnCenter"
          sx={{
            bg: "background-selected",
            size: 60,
            borderRadius: "50px",
            flexShrink: 0
          }}
        >
          <UserProfileIcon size={18} />
        </Flex>
        <Flex sx={{ flexDirection: "column", gap: "spacing1" }}>
          <Text
            sx={{
              fontSize: "sm",
              fontWeight: 600,
              lineHeight: 1,
              color: "heading"
            }}
          >
            {strings.loginMessage()}
          </Text>
          <Text sx={{ fontSize: "xs", lineHeight: 1.2, color: "paragraph" }}>
            {strings.loginMessageActionText()}
          </Text>
        </Flex>
      </Flex>
    );
  }

  if (minimal)
    return (
      <Flex
        sx={{
          alignItems: "flex-start",
          gap: "spacing3",
          px: "spacing4"
        }}
      >
        <Flex
          variant="columnCenter"
          sx={{
            size: 25,
            borderRadius: 80,
            overflow: "hidden"
          }}
        >
          {profile?.profilePicture ? (
            <Image
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
              src={profile.profilePicture}
            />
          ) : (
            <UserIcon size={20} />
          )}
        </Flex>
        <Flex
          sx={{
            flexDirection: "column",
            flex: 1,
            gap: "spacing1",
            fontSize: "3xs",
            lineHeight: 1,
            wordBreak: "break-word"
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

  const storagePercent =
    user.totalStorage && user.totalStorage > 0
      ? Math.min(100, ((user.storageUsed || 0) / user.totalStorage) * 100)
      : 0;

  return (
    <Flex
      sx={{
        borderRadius: "radius2",
        alignItems: "center",
        bg: "background-secondary",
        px: "spacing5",
        py: "spacing6",
        gap: "spacing7",
        mb: "spacing2"
      }}
    >
      <Flex
        sx={{
          alignItems: "center",
          flex: "1 1 auto",
          gap: "spacing4",
          minWidth: 0
        }}
      >
        <Flex
          variant="columnCenter"
          sx={{
            bg: "shade",
            size: 80,
            flexShrink: 0,
            borderRadius: 80,
            overflow: "hidden",
            position: "relative",
            ":hover #profile-picture-edit": {
              visibility: "visible"
            }
          }}
        >
          {profile?.profilePicture ? (
            <Image
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
              src={profile.profilePicture}
            />
          ) : (
            <UserIcon size={32} />
          )}
          <Flex
            id="profile-picture-edit"
            sx={{
              position: "absolute",
              width: "100%",
              height: "100%",
              bg: "#000000aa",
              top: 0,
              left: 0,
              alignItems: "center",
              alignContent: "center",
              justifyContent: "center",
              visibility: "collapse",
              cursor: "pointer"
            }}
            title={strings.editProfilePicture()}
            onClick={async () => {
              await EditProfilePictureDialog.show({ profile });
            }}
          >
            <Text sx={{ fontSize: "xs", lineHeight: 1, color: "white" }}>
              {strings.edit()}
            </Text>
          </Flex>
        </Flex>
        <Flex sx={{ flexDirection: "column", gap: "spacing1" }}>
          <Flex sx={{ alignItems: "center", gap: "spacing3" }}>
            <Text
              sx={{
                fontSize: "sm",
                fontWeight: 600,
                lineHeight: 1,
                color: "heading"
              }}
            >
              {profile?.fullName || strings.yourFullName()}
            </Text>
            <PencilSimple
              sx={{ cursor: "pointer", flexShrink: 0 }}
              size={15}
              title={strings.editFullName()}
              onClick={async () => {
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
          <Text sx={{ fontSize: "xs", lineHeight: 1.2, color: "paragraph" }}>
            {strings.memberSince(
              getFormattedDate(getObjectIdTimestamp(user.id), "date")
            )}
          </Text>
          <Text
            sx={{
              fontSize: "xs",
              lineHeight: 1.2,
              color: "paragraph",
              wordBreak: "break-word"
            }}
          >
            {user.email}
          </Text>
        </Flex>
      </Flex>
      <Flex
        sx={{
          flexDirection: "column",
          gap: "spacing3",
          flex: "0 1 223px",
          minWidth: "140px"
        }}
      >
        <Text
          sx={{
            fontSize: "xs",
            fontWeight: 500,
            lineHeight: 1,
            color: "accent"
          }}
        >
          {`${title}${trial ? " (trial)" : ""}`}
        </Text>
        {user.totalStorage ? (
          <>
            <Flex
              sx={{
                height: 8,
                borderRadius: "140px",
                bg: "background-tertiary",
                overflow: "hidden"
              }}
            >
              <Flex
                sx={{
                  width: `${storagePercent}%`,
                  height: "100%",
                  borderRadius: "140px",
                  bg: "accent"
                }}
              />
            </Flex>
            <Text
              sx={{
                fontSize: "xs",
                lineHeight: 1.1,
                color: "paragraph-secondary"
              }}
            >
              {formatBytes(user.storageUsed || 0)} /{" "}
              {user.totalStorage === -1
                ? strings.unlimited()
                : formatBytes(user.totalStorage)}{" "}
              {strings.used()}
            </Text>
          </>
        ) : null}
      </Flex>
    </Flex>
  );
}
