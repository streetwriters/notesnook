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

import { createButtonVariant } from "@notesnook/theme";
import { Button, Flex, FlexProps } from "@theme-ui/components";
import { Icon } from "../icons";

type TabItemProps = {
  icon: Icon;
  title?: string;
  selected?: boolean;
  onClick?: () => void;
};

export function TabItem(props: TabItemProps & FlexProps) {
  const {
    icon: Icon,
    color,
    title,
    selected,
    onClick,
    sx,
    ...restProps
  } = props;

  return (
    <Flex
      {...restProps}
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
        borderRadius: "default",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ":focus": { bg: selected ? "hover-selected" : "hover" },
        p: 1,
        ...sx
      }}
      title={title}
      onClick={() => {
        if (onClick) onClick();
      }}
    >
      <Icon size={16} color={color || (selected ? "icon-selected" : "icon")} />
    </Flex>
  );
}
