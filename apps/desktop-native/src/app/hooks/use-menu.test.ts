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

import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => {
  const state = {
    items: undefined as unknown[] | undefined,
    anchor: undefined as unknown,
    title: undefined as string | undefined,
    open(items: unknown[], anchor: unknown, title?: string) {
      Object.assign(state, { items, anchor, title });
    },
    close() {
      Object.assign(state, { items: undefined, anchor: undefined });
    }
  };
  return state;
});

vi.mock("@notesnook/ui-kit", () => ({
  getPointerPosition: () => ({ x: 7, y: 9 })
}));
vi.mock("../components/menu/store", () => ({
  useMenuStore: Object.assign(() => store.items !== undefined, {
    getState: () => store
  })
}));

const { Menu } = await import("./use-menu");
const items = [{ type: "button" as const, key: "a", title: "A" }];

beforeEach(() => store.close());

describe("Menu.openMenu", () => {
  it("opens below an element given as web's position target", () => {
    const target = {
      getBoundingClientRect: () => ({ x: 10, y: 20, width: 136, height: 30 })
    };
    Menu.openMenu(items, {
      blocking: true,
      forceCustom: true,
      position: {
        target: target as never,
        isTargetAbsolute: true,
        location: "below"
      }
    });
    expect(store.anchor).toEqual({ x: 10, y: 20, width: 136, height: 30 });
    expect(store.items).toBe(items);
  });

  it("opens at the pointer for a mouse target or no target", () => {
    Menu.openMenu(items, { position: { target: "mouse" } });
    expect(store.anchor).toEqual({ x: 7, y: 9, width: 0, height: -5 });
    Menu.openMenu(items, { position: { location: "below" } });
    expect(store.anchor).toEqual({ x: 7, y: 9, width: 0, height: -5 });
  });

  it("still takes a point or a rectangle", () => {
    Menu.openMenu(items, { position: { x: 1, y: 2 } });
    expect(store.anchor).toEqual({ x: 1, y: 2, width: 0, height: -5 });
    Menu.openMenu(items, { position: { x: 1, y: 2, width: 3, height: 4 } });
    expect(store.anchor).toEqual({ x: 1, y: 2, width: 3, height: 4 });
  });
});
