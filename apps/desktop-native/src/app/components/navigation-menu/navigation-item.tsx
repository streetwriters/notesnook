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

import type { ReactNode } from "react";
import { Flex, Text, type ColorValue } from "@ui";
import type { Icon } from "../icons";

export function NavigationItem(props: {
  testID: string;
  title: string;
  icon: Icon;
  iconColor?: ColorValue;
  selected: boolean;
  onPress?: () => void;
  children?: ReactNode;
}) {
  const RowIcon = props.icon;
  return (
    <Flex
      testID={props.testID}
      onPress={props.onPress}
      sx={{
        alignItems: "center",
        gap: "spacing4",
        px: "spacing5",
        py: "spacing4",
        borderRadius: "default",
        bg: props.selected ? "background-selected" : "transparent",
        ":hover": { bg: props.selected ? "hover-selected" : "hover" }
      }}
    >
      <RowIcon
        size="medium"
        color={props.iconColor ?? (props.selected ? "icon-selected" : "icon")}
      />
      <Text
        testID={`${props.testID}-title`}
        numberOfLines={1}
        sx={{
          flex: 1,
          fontSize: "sm",
          fontWeight: props.selected ? "bold" : "body",
          color: props.selected ? "paragraph-selected" : "paragraph"
        }}
      >
        {props.title}
      </Text>
      {props.children}
    </Flex>
  );
}
