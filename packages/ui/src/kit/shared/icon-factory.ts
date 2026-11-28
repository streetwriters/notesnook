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
import { createElement, type ReactElement } from "react";
import {
  Icon as UIIcon,
  type IconProps as UIIconProps,
  type SxProp
} from "@notesnook/ui-kit";

/**
 * An app icon's props, as apps/web's icons take them: `rotate` spins the icon
 * (a number turns it by that many degrees instead).
 */
export type IconProps = Omit<UIIconProps, "path" | "svg" | "rotate"> & {
  rotate?: boolean | number;
  rotateDirection?: "clockwise" | "counterclockwise";
};
export type Icon = ((props: IconProps) => ReactElement) & {
  /**
   * The drawing as a string, for APIs that take an icon as one (a menu item's
   * `icon: Plus.path`): an SVG path for `mdiIcon`, the whole SVG document for
   * `svgIcon`; `Icon`'s `path` prop draws either. Unset for a hand-written icon.
   */
  readonly path?: string;
};

const SPIN: Record<"clockwise" | "counterclockwise", SxProp> = {
  clockwise: {
    animation: {
      keyframes: {
        from: { transform: [{ rotate: "0deg" }] },
        to: { transform: [{ rotate: "360deg" }] }
      },
      duration: 1000,
      iterationCount: "infinite",
      easing: "linear"
    }
  },
  counterclockwise: {
    animation: {
      keyframes: {
        from: { transform: [{ rotate: "360deg" }] },
        to: { transform: [{ rotate: "0deg" }] }
      },
      duration: 1000,
      iterationCount: "infinite",
      easing: "linear"
    }
  }
};

function iconProps(
  props: IconProps,
  spins: boolean,
  shape: { path?: string; svg?: string }
): UIIconProps {
  const { rotate = spins, rotateDirection, ...rest } = props;
  if (typeof rotate === "number") return { ...rest, ...shape, rotate };
  if (!rotate) return { ...rest, ...shape };
  return {
    ...rest,
    ...shape,
    sx: { ...SPIN[rotateDirection ?? "clockwise"], ...rest.sx }
  };
}

export function mdiIcon(path: string, rotate = false): Icon {
  const Component = (props: IconProps) =>
    createElement(UIIcon, iconProps(props, rotate, { path }));
  return Object.assign(Component, { path });
}

export function svgIcon(svg: string, rotate = false): Icon {
  const Component = (props: IconProps) =>
    createElement(UIIcon, iconProps(props, rotate, { svg }));
  return Object.assign(Component, { path: svg });
}
