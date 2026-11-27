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

import { createElement as h } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { MenuItem } from "../contracts/overlays";
import { MenuPresenter } from "./menu";
import { PopupPresenter } from "./popover";
import { pressKey, reset, state } from "./testing/mocks";
import { cleanup, render, settle, textOf } from "./testing/render";

vi.mock("react-native", async () =>
  (await import("./testing/mocks")).reactNative()
);
vi.mock("@platform", async () => (await import("./testing/mocks")).platform());
vi.mock("./style/use-styled", async () =>
  (await import("./testing/mocks")).useStyledModule()
);
vi.mock("./primitives", async () =>
  (await import("./testing/mocks")).primitives()
);
vi.mock("./hooks", async () => (await import("./testing/mocks")).hooks());
vi.mock("./theme", async () => (await import("./testing/mocks")).theme());
vi.mock("../shared/icon-factory", async () =>
  (await import("./testing/mocks")).icons()
);

beforeEach(reset);
afterEach(cleanup);

const click = { stopPropagation: () => {}, preventDefault: () => {} };

function element(x: number, y: number, width: number, height: number) {
  return { getBoundingClientRect: () => ({ x, y, width, height }) } as never;
}

function placed(view: Awaited<ReturnType<typeof render>>) {
  const { top, left, opacity } = view.byTestId("popup-presenter").props.sx;
  return { top, left, opacity };
}

test("a popup shows its children only while isOpen", async () => {
  const props = { onClose: () => {}, position: {} };
  const view = await render(
    h(PopupPresenter, { ...props, isOpen: false }, "Move to notebook")
  );
  expect(view.text()).toBe("");

  await view.update(
    h(PopupPresenter, { ...props, isOpen: true }, "Move to notebook")
  );
  expect(view.text()).toBe("Move to notebook");
});

test("a popup with no target opens at the pointer and stays there", async () => {
  state.pointer.x = 300;
  state.pointer.y = 200;
  const props = { isOpen: true, onClose: () => {}, position: {} };
  const view = await render(h(PopupPresenter, props, "menu"));
  expect(placed(view)).toEqual({ top: 200, left: 300, opacity: 1 });

  state.pointer.x = 10;
  state.pointer.y = 10;
  await view.update(h(PopupPresenter, props, "menu"));
  expect(placed(view)).toEqual({ top: 200, left: 300, opacity: 1 });
});

test("a popup at the window's corner flips up and stays inside the window", async () => {
  // The popup measures 200x100 in a 1000x800 window.
  state.pointer.x = 950;
  state.pointer.y = 780;
  const view = await render(
    h(PopupPresenter, { isOpen: true, onClose: () => {}, position: {} })
  );
  expect(placed(view)).toEqual({ top: 680, left: 790, opacity: 1 });
});

test("a popup is placed against its target by location and align", async () => {
  const target = element(400, 300, 60, 20);
  const view = await render(
    h(PopupPresenter, {
      isOpen: true,
      onClose: () => {},
      position: { target, location: "below", yOffset: 5 }
    })
  );
  expect(placed(view)).toMatchObject({ top: 325, left: 400 });

  await view.update(
    h(PopupPresenter, {
      isOpen: true,
      onClose: () => {},
      position: { target, location: "right", gap: 5 }
    })
  );
  expect(placed(view)).toMatchObject({ top: 300, left: 465 });

  await view.update(
    h(PopupPresenter, {
      isOpen: true,
      onClose: () => {},
      position: { target, location: "below", align: "end" }
    })
  );
  expect(placed(view)).toMatchObject({ top: 320, left: 260 });
});

test("a target that only has measureInWindow is still measured", async () => {
  const target = {
    measureInWindow: (callback: (...rect: number[]) => void) =>
      callback(100, 100, 40, 40)
  } as never;
  const view = await render(
    h(PopupPresenter, {
      isOpen: true,
      onClose: () => {},
      position: { target, location: "below" }
    })
  );
  expect(placed(view)).toMatchObject({ top: 140, left: 100 });
});

test("Escape, a click outside and a right-click outside each close a popup; a click inside does not", async () => {
  let closes = 0;
  const view = await render(
    h(PopupPresenter, {
      isOpen: true,
      onClose: () => void closes++,
      position: {}
    })
  );
  let stopped = false;
  view
    .byTestId("popup-presenter")
    .props.onClick({ ...click, stopPropagation: () => (stopped = true) });
  expect(stopped).toBe(true);
  expect(closes).toBe(0);

  pressKey("escape");
  view.byTestId("popup-backdrop").props.onClick(click);
  let prevented = false;
  view.byTestId("popup-backdrop").props.onContextMenu({
    ...click,
    preventDefault: () => (prevented = true)
  });
  expect(closes).toBe(3);
  expect(prevented).toBe(true);
});

test("a non-blocking popup has no backdrop over the window", async () => {
  const view = await render(
    h(PopupPresenter, {
      isOpen: true,
      blocking: false,
      onClose: () => {},
      position: {}
    })
  );
  expect(view.queryByTestId("popup-backdrop")).toBeUndefined();
  expect(view.queryByTestId("popup-presenter")).toBeDefined();
});

test("a popup focuses itself unless focusOnRender is false, and applies its scope", async () => {
  const view = await render(
    h(PopupPresenter, {
      isOpen: true,
      scope: "dialog",
      onClose: () => {},
      position: {}
    })
  );
  expect(state.focused).toBe(1);
  expect(view.get((node) => node.type === "ThemeScope").props.scope).toBe(
    "dialog"
  );

  await render(
    h(PopupPresenter, {
      isOpen: true,
      focusOnRender: false,
      onClose: () => {},
      position: {}
    })
  );
  expect(state.focused).toBe(1);
});

function menu(items: MenuItem[], extra: Record<string, unknown> = {}) {
  const log: string[] = [];
  const element = h(MenuPresenter, {
    isOpen: true,
    onClose: () => void log.push("close"),
    position: {},
    items,
    ...extra
  });
  return { log, element };
}

function button(key: string, title: string, log: string[]): MenuItem {
  return { type: "button", key, title, onClick: () => void log.push(key) };
}

test("a menu draws its title and items in the contextMenu scope, and hides hidden ones", async () => {
  const { element } = menu(
    [
      { type: "button", key: "pin", title: "Pin" },
      { type: "separator", key: "sep" },
      { type: "button", key: "secret", title: "Secret", isHidden: true },
      { type: "button", key: "delete", title: "Delete", isDisabled: true }
    ],
    { title: "Note" }
  );
  const view = await render(element);
  expect(textOf(view.byTestId("menu-container"))).toBe("NotePinDelete");
  expect(view.byTestId("menu-title")).toBeDefined();
  expect(view.queryByTestId("menu-button-secret")).toBeUndefined();
  expect(view.byTestId("menu-button-delete").props.disabled).toBe(true);
  expect(view.get((node) => node.type === "ThemeScope").props.scope).toBe(
    "contextMenu"
  );
});

test("a menu that is not open draws nothing", async () => {
  const { element } = menu([{ type: "button", key: "pin", title: "Pin" }], {
    isOpen: false
  });
  const view = await render(element);
  expect(view.root.children).toHaveLength(0);
});

test("clicking an item runs it and closes the menu", async () => {
  const log: string[] = [];
  const { element, log: closes } = menu([button("pin", "Pin", log)]);
  const view = await render(element);
  view.byTestId("menu-button-pin").props.onClick(click);
  expect(log).toEqual(["pin"]);
  expect(closes).toEqual(["close"]);
});

test("hovering an item with a submenu opens it, and its items run and close the menu", async () => {
  const log: string[] = [];
  const { element, log: closes } = menu([
    {
      type: "button",
      key: "move",
      title: "Move to",
      menu: { items: [button("work", "Work", log)] }
    },
    button("pin", "Pin", log)
  ]);
  const view = await render(element);
  expect(view.queryByTestId("menu-button-work")).toBeUndefined();

  await settle(() => view.byTestId("menu-button-move").props.onMouseEnter());
  expect(view.queryByTestId("menu-button-work")).toBeDefined();

  // Clicking the parent keeps the menu open; it only opens the submenu.
  await settle(() => view.byTestId("menu-button-move").props.onClick(click));
  expect(closes).toEqual([]);

  view.byTestId("menu-button-work").props.onClick(click);
  expect(log).toEqual(["work"]);
  expect(closes).toEqual(["close"]);

  await settle(() => view.byTestId("menu-button-pin").props.onMouseEnter());
  expect(view.queryByTestId("menu-button-work")).toBeUndefined();
});

test("arrow keys skip separators and disabled items, and Enter runs the focused one", async () => {
  const log: string[] = [];
  const { element, log: closes } = menu([
    button("pin", "Pin", log),
    { type: "separator", key: "sep" },
    { ...button("lock", "Lock", log), isDisabled: true } as MenuItem,
    button("delete", "Delete", log)
  ]);
  await render(element);
  await settle(() => pressKey("down"));
  await settle(() => pressKey("down"));
  await settle(() => pressKey("enter"));
  expect(log).toEqual(["delete"]);
  expect(closes).toEqual(["close"]);
});

test("ArrowUp from nothing focused goes to the last item, and Enter with nothing focused does nothing", async () => {
  const log: string[] = [];
  const { element } = menu([
    button("pin", "Pin", log),
    button("delete", "Delete", log)
  ]);
  await render(element);
  await settle(() => pressKey("enter"));
  expect(log).toEqual([]);
  await settle(() => pressKey("up"));
  await settle(() => pressKey("enter"));
  expect(log).toEqual(["delete"]);
});

test("the keys are released when the menu closes", async () => {
  const log: string[] = [];
  const { element } = menu([button("pin", "Pin", log)]);
  const view = await render(element);
  expect(state.keys.some((entry) => entry.keys.includes("down"))).toBe(true);
  await view.unmount();
  expect(state.keys).toEqual([]);
});

test("a lazy item shows what its loader returns", async () => {
  const log: string[] = [];
  const { element } = menu([
    button("pin", "Pin", log),
    {
      type: "lazy-loader",
      key: "tags",
      items: async () => [button("tag-work", "Work", log)]
    }
  ]);
  const view = await render(element);
  await settle();
  expect(textOf(view.byTestId("menu-container"))).toBe("PinWork");
});

test("an empty menu and children in place of items both render", async () => {
  const empty = await render(menu([]).element);
  expect(textOf(empty.byTestId("menu-container"))).toBe("");

  const custom = await render(
    h(
      MenuPresenter,
      { isOpen: true, onClose: () => {}, position: {} },
      h("Custom", null, "my own content")
    )
  );
  expect(custom.text()).toBe("my own content");
  expect(custom.queryByTestId("menu-container")).toBeUndefined();
});

test("an item's styles.icon.color colours its icon", async () => {
  const colors: unknown[] = [];
  const Swatch = (props: { color?: unknown }) => {
    colors.push(props.color);
    return null;
  };
  const { element } = menu([
    {
      ...button("red", "Red", []),
      iconComponent: Swatch,
      styles: { icon: { color: "accent" } }
    } as MenuItem,
    { ...button("plain", "Plain", []), iconComponent: Swatch } as MenuItem
  ]);
  await render(element);
  expect(colors).toContain("accent");
  expect(colors).toContain("icon-secondary");
});
