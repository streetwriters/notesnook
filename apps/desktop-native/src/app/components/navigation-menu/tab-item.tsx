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

import { Flex, type ColorValue } from "@ui";
import type { Icon } from "../icons";

export function TabItem(props: {
  testID: string;
  icon: Icon;
  selected: boolean;
  isCollapsed?: boolean;
  title?: string;
  size?: number;
  iconColor?: ColorValue;
  onPress: () => void;
}) {
  const TabIcon = props.icon;
  return (
    <Flex
      testID={props.testID}
      title={props.title}
      onPress={props.onPress}
      sx={{
        alignItems: "center",
        justifyContent: "center",
        width: props.size ?? (props.isCollapsed ? 25 : 34),
        height: props.size ?? (props.isCollapsed ? 25 : 34),
        borderRadius: props.isCollapsed ? 5 : 6,
        bg: props.selected ? "background-selected" : "transparent",
        ":hover": { bg: props.selected ? "hover-selected" : "hover" }
      }}
    >
      <TabIcon
        size={15}
        color={props.selected ? "icon-selected" : props.iconColor ?? "icon"}
      />
    </Flex>
  );
}
