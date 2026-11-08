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
import { Icon as UIIcon, type IconProps } from "@ui";

export type Icon = ComponentType<Omit<IconProps, "path" | "svg">>;

export function mdiIcon(path: string, rotate = false): Icon {
  const Component: Icon = (props) =>
    createElement(UIIcon, { rotate: rotate ? 1 : undefined, ...props, path });
  return Component;
}

export function svgIcon(svg: string, rotate = false): Icon {
  const Component: Icon = (props) =>
    createElement(UIIcon, { rotate: rotate ? 1 : undefined, ...props, svg });
  return Component;
}
