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

import { useRef } from "react";
import { Flex, Text } from "@theme-ui/components";
import { Icon } from "../../toolbar/components/icon";
import { Icons } from "../../toolbar/icons";
import { useToolbarLocation } from "../../toolbar/stores/toolbar-store";
import { Button } from "../button";
import { MenuButton, MenuItemComponentProps } from "./types";

type MenuButtonProps = {
  item: MenuButton;
  isFocused?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
} & MenuItemComponentProps;

export function MenuButton(props: MenuButtonProps) {
  const { item, isFocused, onMouseEnter, onMouseLeave, onClick } = props;
  const {
    title,
    key,
    icon,
    tooltip,
    isDisabled,
    isChecked,
    menu,
    modifier,
    styles
  } = item;
  const itemRef = useRef<HTMLButtonElement>(null);
  const toolbarLocation = useToolbarLocation();
  const isBottom = toolbarLocation === "bottom";

  return (
    <Flex
      as="li"
      sx={{ flexShrink: 0, flexDirection: "column" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Button
        id={key}
        data-test-id={`MenuButton-${key}`}
        key={key}
        ref={itemRef}
        tabIndex={-1}
        variant="menuitem"
        title={tooltip}
        disabled={isDisabled}
        onClick={(e) => onClick?.(e.nativeEvent)}
        sx={{
          ...styles,
          bg: isFocused && !isBottom ? "hover" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          ":hover": {
            bg: isBottom ? "transparent" : "hover"
          }
        }}
      >
        <Flex sx={{ fontSize: "inherit", fontFamily: "inherit" }}>
          {icon && <Icon path={Icons[icon]} size={"medium"} sx={{ mr: 2 }} />}
          <Text
            as="span"
            variant={"body"}
            sx={{ fontSize: "inherit", fontFamily: "inherit" }}
          >
            {title}
          </Text>
        </Flex>
        {isChecked || menu || modifier ? (
          <Flex sx={{ ml: 4 }}>
            {isChecked && <Icon path={Icons.check} size={"small"} />}
            {menu && <Icon path={Icons.chevronRight} size={"small"} />}
            {modifier && (
              <Text
                as="span"
                sx={{
                  fontFamily: "body",
                  fontSize: "menu",
                  color: "fontTertiary"
                }}
              >
                {modifier}
              </Text>
            )}
          </Flex>
        ) : null}
      </Button>
    </Flex>
  );
}
