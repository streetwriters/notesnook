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
import {
  Flex,
  Text,
  type ColorValue,
  type ContextMenuEvent,
  type MenuItem
} from "@ui";
import type { Icon } from "../icons";
import { Menu } from "../../hooks/use-menu";
import { AppEventManager, AppEvents } from "../../common/app-events";

export function NavigationItem(props: {
  title: string;
  icon?: Icon;
  iconSize?: number;
  color?: ColorValue;
  selected?: boolean;
  onPress?: () => void;
  menuItems?: MenuItem[];
  children?: ReactNode;
}) {
  const { icon: RowIcon, iconSize = 13, selected, menuItems } = props;
  return (
    <Flex
      testID="navigation-item"
      title={props.title}
      onPress={() => {
        AppEventManager.publish(AppEvents.toggleSideMenu, false);
        props.onPress?.();
      }}
      onContextMenu={
        menuItems
          ? (event: ContextMenuEvent) => {
              event.preventDefault();
              event.stopPropagation();
              Menu.openMenu(menuItems, {
                position: { x: event.pageX, y: event.pageY }
              });
            }
          : undefined
      }
      sx={{
        borderRadius: "radius1",
        px: "spacing2",
        py: "spacing4",
        alignItems: "center",
        flexDirection: "row",
        bg: selected ? "background-selected" : "transparent",
        ":hover": { bg: selected ? "hover-selected" : "hover" }
      }}
    >
      <Flex
        sx={{
          p: 0,
          flex: 1,
          alignItems: "center",
          justifyContent: "flex-start",
          flexDirection: "row"
        }}
      >
        {RowIcon ? (
          <RowIcon
            size={iconSize}
            color={props.color ?? (selected ? "icon-selected" : "icon")}
          />
        ) : null}
        <Text
          testID="title"
          variant="body"
          numberOfLines={1}
          sx={{
            fontSize: "xs",
            fontWeight: "normal",
            color: selected ? "paragraph-selected" : "paragraph",
            pr: "spacing1",
            ml: "spacing3"
          }}
        >
          {props.title}
        </Text>
      </Flex>
      {props.children}
    </Flex>
  );
}
