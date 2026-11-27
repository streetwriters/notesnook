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

import {
  getPointerPosition,
  type MenuItem,
  type PositionOptions
} from "@notesnook/ui-kit";
import { useMenuStore, type MenuAnchor } from "../components/menu/store";

export type MenuPosition = { x: number; y: number };

export type MenuOptions = {
  title?: string;
  /**
   * A point, a rectangle, or apps/web's `PositionOptions`: the menu opens
   * below `target` (an element), or at the pointer for `"mouse"` or none.
   */
  position?: MenuPosition | MenuAnchor | PositionOptions;
  /** apps/web's option; the desktop menu is always blocking. */
  blocking?: boolean;
  /** apps/web's option; the desktop menu is always the app's own. */
  forceCustom?: boolean;
};

function toAnchor(
  position?: MenuPosition | MenuAnchor | PositionOptions
): MenuAnchor {
  if (position && !("x" in position)) {
    const { target } = position;
    if (target && target !== "mouse") {
      const { x, y, width, height } = target.getBoundingClientRect();
      return { x, y, width, height };
    }
    position = undefined;
  }
  if (!position) {
    const pointer = getPointerPosition();
    return { x: pointer.x, y: pointer.y, width: 0, height: -5 };
  }
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
