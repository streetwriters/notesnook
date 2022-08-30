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

import { Flex, Text } from "@streetwriters/rebass";

function IconTag({ text, title, icon: Icon, onClick, styles, testId }) {
  return (
    <Flex
      data-test-id={testId}
      flexShrink={0}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(e);
        }
      }}
      title={text || title}
      sx={{
        borderRadius: "default",
        border: "1px solid",
        borderColor: "border",
        lineHeight: "initial",
        ":hover": {
          bg: "hover",
          filter: "brightness(95%)"
        },
        maxWidth: "100%",
        px: 1,
        mr: 1,
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
        ...styles?.container
      }}
      bg="bgSecondary"
      justifyContent="center"
      alignItems="center"
      py="2px"
    >
      <Icon
        size={11}
        color={styles?.icon?.color}
        sx={{ ...styles?.icon, flexShrink: 0 }}
      />
      <Text
        variant="body"
        sx={{
          fontSize: 11,
          ml: "2px",
          p: 0,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          overflow: "hidden",
          ...styles?.text
        }}
      >
        {text}
      </Text>
    </Flex>
  );
}
export default IconTag;
