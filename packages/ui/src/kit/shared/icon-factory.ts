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
import { createElement, type ComponentType } from "react";
import { Icon as UIIcon, type IconProps } from "@notesnook/ui-kit";

/**
 * An icon component. Like apps/web's icons it carries its drawing as `path`,
 * for APIs that take an icon as a string (a menu item's `icon`): an SVG path
 * for `mdiIcon`, the whole SVG document for `svgIcon`; `Icon`'s `path` prop
 * draws either.
 */
export type Icon = ComponentType<Omit<IconProps, "path" | "svg">> & {
  /** Unset for an icon component written by hand. */
  readonly path?: string;
};

export function mdiIcon(path: string, rotate = false): Icon {
  const Component = (props: Omit<IconProps, "path" | "svg">) =>
    createElement(UIIcon, { rotate: rotate ? 1 : undefined, ...props, path });
  return Object.assign(Component, { path });
}

export function svgIcon(svg: string, rotate = false): Icon {
  const Component = (props: Omit<IconProps, "path" | "svg">) =>
    createElement(UIIcon, { rotate: rotate ? 1 : undefined, ...props, svg });
  return Object.assign(Component, { path: svg });
}
