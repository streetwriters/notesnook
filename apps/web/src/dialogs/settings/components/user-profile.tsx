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

import { Flex, Text } from "@theme-ui/components";
import { User } from "../../../components/icons";
import { useStore as useUserStore } from "../../../stores/user-store";
import ObjectID from "@notesnook/core/utils/object-id";
import { getFormattedDate } from "@notesnook/common";
import { SUBSCRIPTION_STATUS } from "../../../common/constants";
import dayjs from "dayjs";
import { useMemo } from "react";

export function UserProfile() {
  const user = useUserStore((store) => store.user);

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

  if (!user)
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
          <Text variant={"title"}>You are not logged in</Text>
          <Text variant={"subBody"}>
            Login or create an account to sync your notes.
          </Text>
        </Flex>
      </Flex>
    );

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
        <Text variant={"title"}>{user.email}</Text>
        <Text variant={"subBody"}>
          Member since{" "}
          {getFormattedDate(new ObjectID(user.id).getTimestamp(), "date")}
        </Text>
      </Flex>
    </Flex>
  );
}
