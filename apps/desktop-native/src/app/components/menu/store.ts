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

import { create } from "zustand";
import type { MenuItem } from "@ui";

export type MenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MenuState = {
  items: MenuItem[] | undefined;
  anchor: MenuAnchor | undefined;
  title: string | undefined;
  open: (items: MenuItem[], anchor: MenuAnchor, title?: string) => void;
  close: () => void;
};

export const useMenuStore = create<MenuState>((set) => ({
  items: undefined,
  anchor: undefined,
  title: undefined,
  open: (items, anchor, title) => set({ items, anchor, title }),
  close: () => set({ items: undefined, anchor: undefined, title: undefined })
}));
