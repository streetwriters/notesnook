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

import { Flex, Image, Progress, Text } from "@theme-ui/components";
import { Edit, User as UserIcon } from "../../../components/icons";
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

  if (!user || !user.id)
    return (
      <Flex
        sx={{
          borderRadius: "default",
          alignItems: "center",
          bg: "var(--background-secondary)",
          p: 1,
          mb: minimal ? 0 : 4,
          gap: 1
        }}
      >
        <Flex
          variant="columnCenter"
          sx={{
            bg: "shade",
            size: minimal ? 30 : 40,
            borderRadius: 80
          }}
        >
          <UserIcon size={minimal ? 15 : 20} />
        </Flex>
        <Flex sx={{ flexDirection: "column" }}>
          <Text variant={minimal ? "body" : "subtitle"}>
            {strings.loginMessage()}
          </Text>
          <Text variant={"subBody"}>{strings.loginMessageActionText()}</Text>
        </Flex>
      </Flex>
    );

  return (
    <Flex
      sx={{
        borderRadius: "default",
        alignItems: "center",
        justifyContent: "space-between",
        bg: "var(--background-secondary)",
        p: 1,
        mb: minimal ? 0 : 4
      }}
    >
      <Flex sx={{ alignItems: "center", flex: 1 }}>
        <Flex
          variant="columnCenter"
          sx={{
            bg: "shade",
            mr: 2,
            size: minimal ? 40 : 50,
            borderRadius: 80,
            overflow: "hidden",
            position: "relative",
            ":hover #profile-picture-edit": {
              visibility: minimal ? "hidden" : "visible"
            }
          }}
        >
          {profile?.profilePicture ? (
            <Image
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
              src={profile.profilePicture}
            />
          ) : (
            <UserIcon size={minimal ? 20 : 24} />
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
            <Text variant="subBody" sx={{ color: "white" }}>
              {strings.edit()}
            </Text>
          </Flex>
        </Flex>
        <Flex sx={{ flexDirection: "column", flex: 1 }}>
          <Text
            variant="subBody"
            sx={{
              color: "accent"
            }}
          >
            {`${title}${trial ? " (trial)" : ""}`}
          </Text>

          <Text variant={minimal ? "body" : "subtitle"}>
            {profile?.fullName || strings.yourFullName()}{" "}
            {minimal ? null : (
              <Edit
                sx={{ display: "inline-block", cursor: "pointer" }}
                size={12}
                title={strings.editFullName()}
                onClick={async () => {
                  const fullName = await PromptDialog.show({
                    title: strings.editFullName(),
                    description: strings.setFullNameDesc(),
                    defaultValue: profile?.fullName
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
            )}
          </Text>
          <Text variant={"subBody"}>
            {user.email}
            {minimal ? null : (
              <>
                {" "}
                •{" "}
                {strings.memberSince(
                  getFormattedDate(getObjectIdTimestamp(user.id), "date")
                )}
              </>
            )}
          </Text>
          {user.totalStorage && !minimal ? (
            <Flex sx={{ maxWidth: 300, alignItems: "center", gap: 1 }}>
              <Progress
                max={user.totalStorage === -1 ? Infinity : user.totalStorage}
                value={user.storageUsed || 0}
                color="var(--accent)"
              />
              <Text variant="subBody" sx={{ flexShrink: 0 }}>
                {formatBytes(user.storageUsed || 0)}/
                {user.totalStorage === -1
                  ? "Unlimited"
                  : formatBytes(user.totalStorage)}{" "}
                used
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </Flex>
      {/* <Button
        variant="icon"
        sx={{
          borderRadius: 50,
          p: 0,
          m: 0,
          width: 30,
          height: 30,
          alignSelf: "end"
        }}
        title="Edit profile"
        onClick={() => showEditProfileDialog(profile)}
      >
        <Edit size={18} />
      </Button> */}
    </Flex>
  );
}
