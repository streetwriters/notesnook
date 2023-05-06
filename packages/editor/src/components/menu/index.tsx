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

import { useCallback, useRef, useEffect, PropsWithChildren } from "react";
import { Box, Flex, FlexProps, Text } from "@theme-ui/components";
import { getPosition } from "../../utils/position";
import {
  MenuButton as MenuButtonType,
  MenuItem as MenuItemType
} from "./types";
import { useFocus } from "./use-focus";
import { MenuSeparator } from "./menu-separator";
import { MenuButton } from "./menu-button";
import { PopupPresenter, PopupPresenterProps } from "../popup-presenter";

type MenuProps = MenuContainerProps & {
  items?: MenuItemType[];
  onClose: () => void;
};

export function Menu(props: MenuProps) {
  const { items = [], onClose, ...containerProps } = props;
  const hoverTimeout = useRef<number>();
  const onAction = useCallback(
    (e?: Event, item?: MenuButtonType) => {
      e?.stopPropagation();

      if (item?.onClick) {
        item.onClick();
      }
      if (onClose) onClose();
    },
    [onClose]
  );

  const { focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen } =
    useFocus(
      items,
      (e) => {
        const item = items[focusIndex];
        if (item && item.type === "button") onAction(e, item);
      },
      () => onClose()
    );
  const focusedItem = items[focusIndex];

  const subMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const item = items[focusIndex];
    if (!item || !subMenuRef.current) return;

    const menuItemElement = document.getElementById(item.key);
    if (!menuItemElement) return;

    if (!isSubmenuOpen) {
      subMenuRef.current.style.visibility = "hidden";
      return;
    }

    const { top, left } = getPosition(subMenuRef.current, {
      // yOffset: menuItemElement.offsetHeight,
      target: menuItemElement,
      location: "right"
    });

    subMenuRef.current.style.visibility = "visible";
    subMenuRef.current.style.top = `${top}px`;
    subMenuRef.current.style.left = `${left}px`;
  }, [isSubmenuOpen, focusIndex, items]);

  return (
    <>
      <MenuContainer {...containerProps}>
        {items.map((item, index) => {
          if (item.isHidden) return null;

          switch (item.type) {
            case "separator":
              return <MenuSeparator key={item.key} />;
            case "button":
              return (
                <MenuButton
                  key={item.key}
                  item={item}
                  onClick={(e) => {
                    if (item.menu) {
                      setFocusIndex(index);
                      setIsSubmenuOpen(true);
                    } else onAction(e, item);
                  }}
                  isFocused={focusIndex === index}
                  onMouseEnter={() => {
                    if (item.isDisabled) {
                      setFocusIndex(-1);
                      return;
                    }

                    if (hoverTimeout.current)
                      clearTimeout(hoverTimeout.current);
                    setFocusIndex(index);
                    setIsSubmenuOpen(false);
                    if (item.menu) {
                      hoverTimeout.current = setTimeout(() => {
                        setIsSubmenuOpen(true);
                      }, 500) as unknown as number;
                    }
                  }}
                  onMouseLeave={() => {
                    if (hoverTimeout.current)
                      clearTimeout(hoverTimeout.current);
                  }}
                />
              );
            case "popup":
              return <item.component onClick={(e) => onAction(e)} />;
          }
        })}
      </MenuContainer>
      {focusedItem?.type === "button" && focusedItem?.menu && isSubmenuOpen && (
        <Flex
          ref={subMenuRef}
          style={{ visibility: "hidden" }}
          sx={{
            position: "absolute"
          }}
        >
          <Menu items={focusedItem.menu.items} onClose={onClose} />
        </Flex>
      )}
    </>
  );
}

type MenuContainerProps = FlexProps & {
  title?: string;
};
function MenuContainer(props: PropsWithChildren<MenuContainerProps>) {
  const { children, title, sx, ...flexProps } = props;

  return (
    <Box
      className="menuContainer"
      as="ul"
      tabIndex={-1}
      sx={{
        bg: "background",
        py: 1,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        listStyle: "none",
        padding: 0,
        margin: 0,
        borderRadius: "default",
        boxShadow: "menu",
        border: "1px solid var(--border)",
        minWidth: 220,
        ...sx
      }}
      {...flexProps}
    >
      {title && (
        <Text
          sx={{
            fontFamily: "body",
            fontSize: "subtitle",
            color: "accent",
            py: "8px",
            px: 3,
            borderBottom: "1px solid",
            borderBottomColor: "border",
            wordWrap: "break-word"
          }}
        >
          {title}
        </Text>
      )}
      {children}
      {/* <FlexScrollContainer>{children}</FlexScrollContainer> */}
    </Box>
  );
}

export type MenuPresenterProps = PopupPresenterProps & MenuProps;
export function MenuPresenter(props: PropsWithChildren<MenuPresenterProps>) {
  const { items = [], ...restProps } = props;
  return (
    <PopupPresenter {...restProps}>
      {props.children ? props.children : <Menu items={items} {...restProps} />}
    </PopupPresenter>
  );
}
