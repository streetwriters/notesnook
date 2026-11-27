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
  type PositionOptions,
  type UIElement
} from "@notesnook/ui-kit";
import { useMenuStore, type MenuAnchor } from "../components/menu/store";

export type MenuPosition = { x: number; y: number };

export type MenuOptions = {
  title?: string;
  position?: MenuPosition | MenuAnchor | PositionOptions;
};

function isElement(target: unknown): target is UIElement {
  return (
    typeof target === "object" &&
    target !== null &&
    "getBoundingClientRect" in target
  );
}

function targetOf(position?: MenuOptions["position"]) {
  return position && "target" in position ? position.target : undefined;
}

function toAnchor(position?: MenuOptions["position"]): MenuAnchor {
  // Web's `PositionOptions`: below its target element, or at the pointer.
  if (position && !("x" in position)) {
    const target = position.target;
    if (isElement(target)) {
      const rect = target.getBoundingClientRect();
      return {
        x: rect.x + (position.xOffset ?? 0),
        y: rect.y,
        width: position.align === "start" ? 0 : rect.width,
        height: rect.height + (position.yOffset ?? 0)
      };
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
      .open(
        items,
        toAnchor(options.position),
        options.title,
        targetOf(options.position)
      ),
  closeMenu: () => useMenuStore.getState().close(),
  isOpen: () => useMenuStore.getState().items !== undefined,
  target: () => useMenuStore.getState().target
};

export function useMenuTrigger() {
  const isOpen = useMenuStore((store) => store.items !== undefined);
  const target = useMenuStore((store) => store.target);
  return {
    openMenu: Menu.openMenu,
    closeMenu: Menu.closeMenu,
    isOpen,
    target
  };
}
