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

import { PropsWithChildren } from "react";
import { Flex, FlexProps } from "@theme-ui/components";
import { ThemeUIStyleObject } from "@theme-ui/core";

const EFFECTS = {
  border: {
    "--borderWidth": "2px",
    bg: "background-secondary",
    position: "relative",
    borderRadius: 20,
    "& *": {
      zIndex: 2
    },
    ":before": {
      content: `""`,
      position: "absolute",
      top: `calc(-1 * var(--borderWidth))`,
      left: `calc(-1 * var(--borderWidth))`,
      height: `calc(100% + var(--borderWidth) * 2)`,
      width: `calc(100% + var(--borderWidth) * 2)`,
      background: `linear-gradient(
          60deg,
          var(--theme-ui-colors-muted),
          var(--theme-ui-colors-muted),
          #008837cc,
          var(--theme-ui-colors-muted),
          var(--theme-ui-colors-muted)
        )`,
      borderRadius: `calc(10 * var(--borderWidth))`,
      zIndex: 0,
      animation: `animatedgradient 7s ease reverse infinite`,
      backgroundSize: `300% 300%`
    },
    ":after": {
      content: `""`,
      position: "absolute",
      background: `background-secondary`,
      top: 0,
      left: 0,
      borderRadius: 18,
      height: `100%`,
      width: `100%`,
      zIndex: 1
    }
  } as ThemeUIStyleObject,
  none: {
    borderRadius: 20,
    overflow: "hidden",
    background: "background"
  } as ThemeUIStyleObject
};

const HOVER_EFFECTS = {
  float: (isDark: boolean) =>
    ({
      transform: "translateY(-5px)",
      boxShadow: isDark
        ? "0px 0px 15px 0px #000000"
        : "0px 0px 10px 0px #00000011"
    } as ThemeUIStyleObject),
  scale: () =>
    ({
      scale: "1.01 1.01"
    } as ThemeUIStyleObject),
  none: () => ({})
};

export default function Card(
  props: PropsWithChildren<
    FlexProps & {
      href?: string;
      target?: "_blank" | "_parent" | "_top" | "_self";
      effect?: keyof typeof EFFECTS;
      hoverEffect?: "float" | "scale" | "none";
    }
  >
) {
  const {
    sx,
    children,
    href,
    target,
    as,
    effect = "none",
    hoverEffect = "float",
    ...restProps
  } = props;

  // const [colorMode] = useColorMode();
  const isDark = false; // colorMode === "dark";

  return (
    <Flex
      {...restProps}
      as={href ? "a" : as}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      href={href}
      target={target}
      sx={{
        textDecoration: "none",
        flexDirection: "column",
        // border: "1px solid var(--border)",
        ":hover": HOVER_EFFECTS[hoverEffect](isDark),
        transition:
          "transform 300ms ease-in, box-shadow 300ms ease-in, scale 150ms ease-in",
        ...EFFECTS[effect],
        ...sx
      }}
    >
      {children}
    </Flex>
  );
}
