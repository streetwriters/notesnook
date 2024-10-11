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

import { useCallback, useEffect, useState } from "react";
import { MenuButtonItem, MenuItem } from "./types.js";

export function useFocus(
  items: MenuItem[],
  onAction: (event: KeyboardEvent) => void,
  onClose: (event: KeyboardEvent) => void
) {
  const [focusIndex, setFocusIndex] = useState(-1);
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);

  const moveItemIntoView = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;
      const element = document.getElementById(item.key);
      if (!element) return;
      element.scrollIntoView({
        behavior: "auto"
      });
    },
    [items]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const as = <T>(i: number) => items[i] as unknown as T | undefined;
      const isSeperator = (i: number) =>
        items &&
        (items[i]?.type === "separator" || as<MenuButtonItem>(i)?.isDisabled);
      const moveDown = (i: number) => (i < items.length - 1 ? ++i : 0);
      const moveUp = (i: number) => (i > 0 ? --i : items.length - 1);
      const hasSubmenu = (i: number) => items && as<MenuButtonItem>(i)?.menu;
      const openSubmenu = (index: number) => {
        if (!hasSubmenu(index)) return;
        setIsSubmenuOpen(true);
      };

      const closeSubmenu = (index: number) => {
        if (!hasSubmenu(index)) return;
        setIsSubmenuOpen(false);
      };

      setFocusIndex((i) => {
        let nextIndex = i;

        switch (e.key) {
          case "ArrowUp":
            if (isSubmenuOpen) break;
            nextIndex = moveUp(i);
            while (isSeperator(nextIndex)) {
              nextIndex = moveUp(nextIndex);
            }
            break;
          case "ArrowDown":
            if (isSubmenuOpen) break;
            nextIndex = moveDown(i);
            while (isSeperator(nextIndex)) {
              nextIndex = moveDown(nextIndex);
            }
            break;
          case "ArrowRight":
            openSubmenu(i);
            break;
          case "ArrowLeft":
            closeSubmenu(i);
            break;
          case "Enter":
            onAction && onAction(e);
            break;
          case "Escape":
            onClose && onClose(e);
            break;
          default:
            break;
        }
        if (nextIndex !== i) moveItemIntoView(nextIndex);

        return nextIndex;
      });
    },
    [items, moveItemIntoView, isSubmenuOpen, onAction, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  return { focusIndex, setFocusIndex, isSubmenuOpen, setIsSubmenuOpen };
}
