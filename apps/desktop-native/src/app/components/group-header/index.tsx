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

import { Flex, Text } from "@ui";

export default function GroupHeader(props: {
  title: string;
  showGroupCounts?: boolean;
  isFocused?: boolean;
}) {
  return (
    <Flex
      testID="group-header"
      sx={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        px: "spacing6",
        my: "spacing6"
      }}
    >
      <Flex
        sx={{ flexDirection: "row", gap: "spacing3", alignItems: "center" }}
      >
        {props.title ? (
          <Text
            testID="title"
            sx={{ fontSize: "xs", fontWeight: 400, color: "accent" }}
          >
            {props.title}
          </Text>
        ) : null}
      </Flex>
    </Flex>
  );
}
