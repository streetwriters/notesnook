/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Check, ChevronRight, Pro } from "../icons";
import { useRef } from "react";
import { Flex, Box, Text, Button } from "@streetwriters/rebass";

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
        width="95%"
        height="0.5px"
        bg="border"
        my={2}
        alignSelf="center"
      />
    );

  return (
    <Flex
      as="li"
      flexDirection={"column"}
      flex={1}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Button
        id={key}
        data-test-id={`menuitem-${key}`}
        key={key}
        ref={itemRef}
        tabIndex={-1}
        variant="menuitem"
        display="flex"
        alignItems={"center"}
        justifyContent={"space-between"}
        title={tooltip}
        disabled={isDisabled}
        onClick={onClick}
        sx={{
          bg: isFocused ? "hover" : "transparent"
        }}
      >
        <Flex>
          {Icon && (
            <Icon color={iconColor || "text"} size={15} sx={{ mr: 2 }} />
          )}
          <Text
            as="span"
            fontFamily="body"
            fontSize="menu"
            color={color || "text"}
          >
            {title}
          </Text>
          {isPremium && <Pro size={14} color="primary" sx={{ ml: 1 }} />}
        </Flex>
        <Flex>
          {isChecked && (
            <Check size={14} data-test-id={`menuitem-${key}-checked`} />
          )}
          {hasSubmenu && <ChevronRight size={14} />}
          {modifier && (
            <Text
              as="span"
              fontFamily="body"
              fontSize="menu"
              color="fontTertiary"
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
