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
import { Edit, User } from "../../../components/icons";
import { useStore as useUserStore } from "../../../stores/user-store";
import { useStore as useSettingStore } from "../../../stores/setting-store";
import { getObjectIdTimestamp } from "@notesnook/core";
import { getFormattedDate } from "@notesnook/common";
import { SUBSCRIPTION_STATUS } from "../../../common/constants";
import dayjs from "dayjs";
import { useMemo } from "react";
import { db } from "../../../common/db";
import { showToast } from "../../../utils/toast";
import { EditProfilePictureDialog } from "../../edit-profile-picture-dialog";
import { PromptDialog } from "../../prompt";
import { strings } from "@notesnook/intl";

export function UserProfile() {
  const user = useUserStore((store) => store.user);
  const profile = useSettingStore((store) => store.profile);

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

  if (!user || !user.id)
    return (
      <Flex
        sx={{
          borderRadius: "default",
          alignItems: "center",
          bg: "var(--background-secondary)",
          p: 2,
          mb: 4
        }}
      >
        <Flex
          variant="columnCenter"
          sx={{
            bg: "shade",
            mr: 2,
            size: 60,
            borderRadius: 80
          }}
        >
          <User size={30} />
        </Flex>
        <Flex sx={{ flexDirection: "column" }}>
          <Text variant={"title"}>{strings.loginMessage()}</Text>
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
        p: 2,
        mb: 4
      }}
    >
      <Flex sx={{ alignItems: "center" }}>
        <Flex
          variant="columnCenter"
          sx={{
            bg: "shade",
            mr: 2,
            size: 60,
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
            <User size={30} />
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
            <Text variant="body" sx={{ color: "white" }}>
              {strings.edit()}
            </Text>
          </Flex>
        </Flex>
        <Flex sx={{ flexDirection: "column" }}>
          <Text
            variant="subBody"
            sx={{
              color: "accent"
            }}
          >
            {remainingDays > 0 && (isPro || isProCancelled)
              ? `PRO`
              : remainingDays > 0 && isTrial
              ? "TRIAL"
              : isBeta
              ? "BETA TESTER"
              : "BASIC"}
          </Text>

          <Text variant={"title"}>
            {profile?.fullName || strings.yourFullName()}{" "}
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
          </Text>
          <Text variant={"subBody"}>
            {user.email} •{" "}
            {strings.memberSince(
              getFormattedDate(getObjectIdTimestamp(user.id), "date")
            )}
          </Text>
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
