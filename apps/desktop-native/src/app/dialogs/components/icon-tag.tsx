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
import type { Icon } from "../../components/icons";

export function IconTag(props: { icon: Icon; text: string }) {
  const { icon: TagIcon, text } = props;
  return (
    <Flex
      sx={{
        flexDirection: "row",
        alignItems: "center",
        bg: "background-secondary",
        borderRadius: "default",
        px: 1,
        py: "2px",
        mr: 1
      }}
    >
      <TagIcon size={12} color="icon" />
      <Text variant="subBody" sx={{ ml: "2px", color: "paragraph" }}>
        {text}
      </Text>
    </Flex>
  );
}
