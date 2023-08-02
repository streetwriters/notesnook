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
import { shallow } from "zustand/shallow";
import { MenuItem, PositionOptions } from "@notesnook/ui";
// import { isUserPremium } from "./use-is-user-premium";

type MenuOptions = {
  position?: PositionOptions;
  blocking?: boolean;
  title?: string;
};
type MenuStore = {
  isOpen: boolean;
  items: MenuItem[];
  title?: string;
  options: MenuOptions;
  open: (items: MenuItem[], option?: MenuOptions) => void;
  close: () => void;
};

const useMenuStore = create<MenuStore>((set) => ({
  isOpen: false,
  items: [],
  title: undefined,
  options: {
    blocking: false
  },
  open: (items, options) => set(() => ({ isOpen: true, items, options })),
  close: () =>
    set(() => ({
      isOpen: false,
      items: [],
      data: undefined,
      title: undefined
    }))
}));

export function useMenuTrigger() {
  const isOpen = useMenuStore((store) => store.isOpen);
  const target = useMenuStore((store) => store.options?.position?.target);
  const [open, close] = useMenuStore(
    (store) => [store.open, store.close],
    shallow
  );

  return {
    openMenu: open,
    closeMenu: close,
    isOpen,
    target
  };
}

export const Menu = {
  openMenu: (items: MenuItem[], options: MenuOptions = {}) =>
    useMenuStore.getState().open(items, options),
  closeMenu: () => useMenuStore.getState().close(),
  isOpen: () => useMenuStore.getState().isOpen,
  target: () => useMenuStore.getState().options?.position?.target
};

export function useMenu() {
  const [items, options] = useMenuStore((store) => [
    store.items,
    store.options
  ]);
  return { items, options };
}
