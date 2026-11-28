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

import {
  Button,
  Flex,
  Text,
  createButtonVariant,
  type FlexProps,
  type MenuItem
} from "@notesnook/ui-kit";
import type * as React from "@notesnook/ui-kit/contracts/react";
import { Menu } from "../../hooks/use-menu";
import { PropsWithChildren } from "react";
import { Icon } from "../icons";
import { SchemeColors } from "@notesnook/theme";
import { AppEventManager, AppEvents } from "../../common/app-events";

type NavigationItemProps = {
  icon?: Icon;
  iconSize?: number;
  collapsedIconSize?: number;
  color?: SchemeColors;
  title?: string;
  isCollapsed?: boolean;
  isLoading?: boolean;
  selected?: boolean;
  onClick?: () => void;
  menuItems?: MenuItem[];
};

function NavigationItem(
  props: PropsWithChildren<
    NavigationItemProps & { containerRef?: React.Ref<HTMLElement> } & FlexProps
  >
) {
  const {
    icon: Icon,
    iconSize = 13,
    collapsedIconSize = 15,
    color,
    title,
    isLoading,
    children,
    isCollapsed,
    selected,
    onClick,
    menuItems,
    sx,
    containerRef,
    ...restProps
  } = props;

  return (
    <Flex
      {...restProps}
      ref={containerRef}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.focus();
      }}
      sx={{
        ...createButtonVariant(
          selected ? "background-selected" : "transparent",
          "transparent",
          {
            hover: {
              bg: selected ? "hover-selected" : "hover"
            }
          }
        ),
        borderRadius: "radius1",
        px: "spacing2",
        py: isCollapsed ? "spacing2" : "spacing4",
        alignItems: "center",
        position: "relative",
        ...sx
      }}
      onClick={() => {
        AppEventManager.publish(AppEvents.toggleSideMenu, false);
        if (onClick) onClick();
      }}
      data-test-id={`navigation-item`}
      title={title}
      onContextMenu={(e) => {
        if (!menuItems) return;
        e.preventDefault();
        e.stopPropagation();
        Menu.openMenu(menuItems);
      }}
    >
      <Flex
        sx={{
          p: 0,
          flex: 1,
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "flex-start"
        }}
      >
        {Icon ? (
          <Icon
            size={isCollapsed ? collapsedIconSize : iconSize}
            color={color || (selected ? "icon-selected" : "icon")}
            rotate={isLoading}
          />
        ) : null}

        {isCollapsed ? null : (
          <Text
            variant="body"
            sx={{
              fontSize: "xs",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: "normal",
              color: selected ? "paragraph-selected" : "paragraph",
              pr: "spacing1"
            }}
            ml="spacing3"
            data-test-id="title"
          >
            {title}
          </Text>
        )}
      </Flex>
      {children && !isCollapsed ? children : null}
    </Flex>
  );
}
export default NavigationItem;

export function SortableNavigationItem(
  props: PropsWithChildren<
    {
      id: string;
      onDragEnter?: React.DragEventHandler<HTMLElement>;
      onDragLeave?: React.DragEventHandler<HTMLElement>;
      onDrop?: React.DragEventHandler<HTMLElement>;
    } & NavigationItemProps
  >
) {
  // apps/web makes the item sortable with @dnd-kit's useSortable (DOM
  // listeners and CSS transforms). Here the kit's SortableList, which
  // ReorderableList renders the items in, moves the rows.
  const { id: _id, ...restProps } = props;

  return <NavigationItem {...restProps} />;
}
