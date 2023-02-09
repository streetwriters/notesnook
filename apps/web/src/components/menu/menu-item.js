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

import { Check, ChevronRight, Pro } from "../icons";
import { useRef } from "react";
import { Flex, Box, Text, Button } from "@theme-ui/components";

function MenuItem({ item, isFocused, onMouseEnter, onMouseLeave, onClick }) {
  const {
    title,
    key,
    color,
    icon: Icon,
    iconColor,
    type,
    tooltip,
    isDisabled,
    isChecked,
    hasSubmenu,
    isPremium,
    modifier
  } = item;
  const itemRef = useRef();
  if (type === "seperator")
    return (
      <Box
        as="li"
        key={key}
        bg="border"
        my={2}
        sx={{ width: "95%", height: "0.5px", alignSelf: "center" }}
      />
    );

  return (
    <Flex
      as="li"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{ flex: 1, flexDirection: "column" }}
    >
      <Button
        id={key}
        data-test-id={`menuitem-${key}`}
        key={key}
        ref={itemRef}
        tabIndex={-1}
        variant="menuitem"
        title={tooltip}
        disabled={isDisabled}
        onClick={onClick}
        sx={{
          bg: isFocused ? "border" : "transparent",
          alignItems: "center",
          justifyContent: "space-between",
          display: "flex"
        }}
      >
        <Flex>
          {Icon && (
            <Icon color={iconColor || "text"} size={15} sx={{ mr: 2 }} />
          )}
          <Text
            as="span"
            sx={{
              fontSize: "menu",
              fontFamily: "body",
              color: color || "text"
            }}
          >
            {title}
          </Text>
          {isPremium && <Pro size={14} color="primary" sx={{ ml: 1 }} />}
        </Flex>
        <Flex data-test-id={`toggle-state-${isChecked ? "on" : "off"}`}>
          {isChecked && <Check size={14} />}
          {hasSubmenu && <ChevronRight size={14} />}
          {modifier && (
            <Text
              as="span"
              sx={{
                fontSize: "menu",
                fontFamily: "body",
                color: "fontTertiary"
              }}
            >
              {modifier}
            </Text>
          )}
        </Flex>
      </Button>
    </Flex>
  );
}
export default MenuItem;
