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

import type { MenuItem } from "@ui";
import { useMenuStore, type MenuAnchor } from "../components/menu/store";

export type MenuPosition = { x: number; y: number };

export type MenuOptions = {
  title?: string;
  position?: MenuPosition | MenuAnchor;
};

const DEFAULT_ANCHOR: MenuAnchor = { x: 320, y: 120, width: 0, height: 0 };

function toAnchor(position?: MenuPosition | MenuAnchor): MenuAnchor {
  if (!position) return DEFAULT_ANCHOR;
  if ("width" in position) return position;
  return { x: position.x, y: position.y, width: 0, height: -5 };
}

export const Menu = {
  openMenu: (items: MenuItem[], options: MenuOptions = {}) =>
    useMenuStore
      .getState()
      .open(items, toAnchor(options.position), options.title),
  closeMenu: () => useMenuStore.getState().close(),
  isOpen: () => useMenuStore.getState().items !== undefined
};

export function useMenuTrigger() {
  const isOpen = useMenuStore((store) => store.items !== undefined);
  return {
    openMenu: Menu.openMenu,
    closeMenu: Menu.closeMenu,
    isOpen
  };
}
