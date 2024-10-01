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

import { MDIIcon } from "./mdi-icon";
import { Theme } from "@notesnook/theme";
import { isThemeColor, SchemeColors } from "@notesnook/theme";
import { Flex, FlexProps } from "@theme-ui/components";
import { useTheme } from "@emotion/react";

type MDIIconWrapper = {
  title?: string;
  path: string;
  size?: keyof Theme["iconSizes"] | number | string;
  color?: SchemeColors;
  stroke?: string;
  rotate?: boolean;
};
function MDIIconWrapper({
  title,
  path,
  size = 24,
  color = "icon",
  stroke,
  rotate
}: MDIIconWrapper) {
  const theme = useTheme() as Theme;
  const themedColor =
    theme?.colors && isThemeColor(color, theme.colors)
      ? theme.colors[color]
      : color;

  return (
    <MDIIcon
      className="icon"
      title={title}
      path={path}
      size={
        theme && typeof size === "string" && size in theme.iconSizes
          ? `${(theme?.iconSizes as any)[size] || 24}px`
          : typeof size === "string"
          ? size
          : `${size}px`
      }
      style={{
        strokeWidth: stroke || "0px",
        stroke: themedColor
      }}
      color={themedColor}
      spin={rotate}
    />
  );
}

export type IconProps = FlexProps & MDIIconWrapper;

export function Icon(props: IconProps) {
  const { sx, title, color, size, stroke, rotate, path, ...restProps } = props;

  return (
    <Flex
      sx={{
        flexShrink: 0,
        justifyContent: "center",
        alignItems: "center",
        ...sx
      }}
      {...restProps}
    >
      <MDIIconWrapper
        title={title}
        path={path}
        rotate={rotate}
        color={color}
        stroke={stroke}
        size={size}
      />
    </Flex>
  );
}
