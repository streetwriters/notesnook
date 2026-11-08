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

import { strings } from "@notesnook/intl";
import { Flex, Text } from "@ui";
import { UserProfileIcon } from "../icons";

export function UserProfileMinimal() {
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
}
