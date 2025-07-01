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
import { Flex, Text } from "@theme-ui/components";
import { strings } from "@notesnook/intl";
import { getSubscriptionInfo } from "./user-profile";

export function SubscriptionStatus() {
  const user = useUserStore((store) => store.user);

  const { title, autoRenew, expiryDate, trial, legacy } =
    getSubscriptionInfo(user);

  const subtitle = autoRenew
    ? `Your subscription will auto renew on ${expiryDate}.`
    : `Your account will automatically downgrade to the Free plan on ${expiryDate}.`;

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
          p: 2
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
        <Text
          variant="heading"
          sx={{
            mt: 2
          }}
        >
          {title}
          {legacy ? " (legacy)" : ""}
        </Text>
        <Text variant="body">
          {trial ? "Your free trial is on-going." : subtitle}
        </Text>
      </Flex>
      {/* {isBasic ? <Features /> : null} */}
    </>
  );
}
