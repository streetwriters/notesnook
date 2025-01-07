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
import { PropsWithChildren } from "react";
import { Icon } from "../icons";

type TabItemProps = {
  icon?: Icon;
  title?: string;
  selected?: boolean;
  onClick?: () => void;
};

export function TabItem(props: PropsWithChildren<TabItemProps & FlexProps>) {
  const {
    icon: Icon,
    color,
    title,
    children,
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
        mx: 1,
        p: 0,
        mt: "3px",
        alignItems: "center",
        position: "relative",
        ":first-of-type": { mt: 1 },
        ":last-of-type": { mb: 1 },
        ":focus": { bg: selected ? "hover-selected" : "hover" },
        ...sx
      }}
    >
      <Button
        data-test-id={`tab-item`}
        sx={{
          px: 2,
          flex: 1,
          alignItems: "center",
          justifyContent: "flex-start",
          display: "flex"
        }}
        title={title}
        onClick={() => {
          if (onClick) onClick();
        }}
      >
        {Icon ? (
          <Icon
            size={20}
            color={color || (selected ? "icon-selected" : "icon")}
          />
        ) : null}
      </Button>
    </Flex>
  );
}
