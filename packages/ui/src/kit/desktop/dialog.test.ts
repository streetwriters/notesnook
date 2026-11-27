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
import { Modal, scopeOfClassName } from "./dialog";
import { pressKey, reset, state } from "./testing/mocks";
import { cleanup, render, settle } from "./testing/render";

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
vi.mock("./theme", async () => (await import("./testing/mocks")).theme());
vi.mock("../shared/icons", async () =>
  (await import("./testing/mocks")).icons()
);

beforeEach(reset);
afterEach(cleanup);

const click = { stopPropagation: () => {}, preventDefault: () => {} };

test("shows its children only while isOpen", async () => {
  const view = await render(h(Modal, { isOpen: false }, "Delete this note?"));
  expect(view.text()).toBe("");
  expect(view.root.children).toHaveLength(0);

  await view.update(h(Modal, { isOpen: true }, "Delete this note?"));
  expect(view.text()).toBe("Delete this note?");

  await view.update(h(Modal, { isOpen: false }, "Delete this note?"));
  expect(view.text()).toBe("");
});

test("Escape calls onRequestClose with a keyboard event", async () => {
  const events: any[] = [];
  await render(
    h(Modal, { isOpen: true, onRequestClose: (event) => events.push(event) })
  );
  expect(pressKey("escape")).toBe(true);
  expect(events).toHaveLength(1);
  expect(events[0].key).toBe("Escape");
});

test("a click on the overlay calls onRequestClose; a click on the content does not", async () => {
  let closes = 0;
  const view = await render(
    h(Modal, { isOpen: true, onRequestClose: () => void closes++ }, "content")
  );
  let stopped = false;
  view
    .byTestId("modal-content")
    .props.onClick({ ...click, stopPropagation: () => (stopped = true) });
  expect(stopped).toBe(true);
  expect(closes).toBe(0);

  view.byTestId("modal-overlay").props.onClick(click);
  expect(closes).toBe(1);
});

test("shouldCloseOnEsc and shouldCloseOnOverlayClick set to false keep it open", async () => {
  let closes = 0;
  const view = await render(
    h(Modal, {
      isOpen: true,
      shouldCloseOnEsc: false,
      shouldCloseOnOverlayClick: false,
      onRequestClose: () => void closes++
    })
  );
  expect(pressKey("escape")).toBe(false);
  expect(view.byTestId("modal-overlay").props.onClick).toBeUndefined();
  expect(closes).toBe(0);
});

test("it stays open until the caller closes it: onRequestClose only asks", async () => {
  const view = await render(
    h(Modal, { isOpen: true, onRequestClose: () => {} }, "still here")
  );
  pressKey("escape");
  await settle();
  expect(view.text()).toBe("still here");
});

test("Escape closes only the modal opened last", async () => {
  const closed: string[] = [];
  const view = await render(
    h(
      "Root",
      null,
      h(Modal, { isOpen: true, onRequestClose: () => closed.push("first") }),
      h(Modal, { isOpen: true, onRequestClose: () => closed.push("second") })
    )
  );
  pressKey("escape");
  expect(closed).toEqual(["second"]);

  await view.update(
    h(
      "Root",
      null,
      h(Modal, { isOpen: true, onRequestClose: () => closed.push("first") }),
      h(Modal, { isOpen: false, onRequestClose: () => closed.push("second") })
    )
  );
  pressKey("escape");
  expect(closed).toEqual(["second", "first"]);
});

test("onAfterOpen and onAfterClose are each called once per open and close", async () => {
  const calls: string[] = [];
  const props = {
    onAfterOpen: () => calls.push("open"),
    onAfterClose: () => calls.push("close")
  };
  const view = await render(h(Modal, { ...props, isOpen: true }));
  await view.update(h(Modal, { ...props, isOpen: true }));
  expect(calls).toEqual(["open"]);

  await view.update(h(Modal, { ...props, isOpen: false }));
  expect(calls).toEqual(["open", "close"]);

  await view.update(h(Modal, { ...props, isOpen: true }));
  await view.unmount();
  expect(calls).toEqual(["open", "close", "open", "close"]);
});

test("focuses its content on open unless shouldFocusAfterRender is false", async () => {
  await render(h(Modal, { isOpen: true }));
  expect(state.focused).toBe(1);
  await render(h(Modal, { isOpen: true, shouldFocusAfterRender: false }));
  expect(state.focused).toBe(1);
});

test("the caller's overlay and content styles go over react-modal's defaults", async () => {
  const view = await render(
    h(Modal, {
      isOpen: true,
      data: { "test-id": "confirm-dialog" },
      contentLabel: "Confirm",
      style: {
        content: { top: 0, left: 0, right: 0, bottom: 0, padding: 0 },
        overlay: { opacity: 1 }
      }
    })
  );
  const content = view.byTestId("confirm-dialog");
  expect(content.props.sx).toMatchObject({
    position: "absolute",
    top: 0,
    bottom: 0,
    padding: 0,
    bg: "background"
  });
  expect(content.props["aria-label"]).toBe("Confirm");
  expect(view.byTestId("confirm-dialog-overlay").props.sx).toMatchObject({
    position: "absolute",
    opacity: 1,
    zIndex: 999
  });
});

test("a theme-scope class on the overlay applies that theme scope, as the web's dialog does", async () => {
  const view = await render(
    h(Modal, { isOpen: true, overlayClassName: "theme-scope-dialog" })
  );
  expect(view.get((node) => node.type === "ThemeScope").props.scope).toBe(
    "dialog"
  );
  expect(scopeOfClassName("popup theme-scope-contextMenu")).toBe("contextMenu");
  expect(scopeOfClassName("no-theme-scope", undefined)).toBeUndefined();
});

test("setAppElement is accepted", () => {
  expect(() => Modal.setAppElement("#root")).not.toThrow();
});
