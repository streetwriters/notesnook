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

import { createElement as h, forwardRef, type ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  cleanup,
  render,
  type TestNode
} from "../../../../../../packages/ui/src/kit/desktop/testing/render";

// The kit's Modal is replaced by a host that records its props and shows its
// children while open, so the test sees what the dialog asks of it.
const modal = vi.hoisted(() => ({ props: undefined as any, appElement: "" }));

vi.mock("@notesnook/ui-kit", async () => {
  const React = await import("react");
  const host = (type: string) =>
    React.forwardRef<unknown, any>(function Host(props, ref) {
      return React.createElement(type, { ...props, ref });
    });
  const Modal = Object.assign(
    (props: any) => {
      modal.props = props;
      return props.isOpen
        ? React.createElement("Modal", props, props.children)
        : null;
    },
    { setAppElement: (element: string) => (modal.appElement = element) }
  );
  return {
    Modal,
    Flex: host("Flex"),
    Button: host("Button"),
    Text: host("Text"),
    ScrollContainer: host("ScrollContainer")
  };
});
vi.mock("../../stores/theme-store", () => ({
  useStore: (select: (state: { colorScheme: string }) => unknown) =>
    select({ colorScheme: "light" })
}));
vi.mock("../icons", () => ({
  Close: forwardRef(function Close() {
    return null;
  }),
  Loading: function Loading() {
    return h("Loading");
  }
}));

const { default: Dialog } = await import("./index");

beforeEach(() => {
  modal.props = undefined;
});
afterEach(cleanup);

const click = { stopPropagation: vi.fn(), preventDefault: () => {} };

function dialog(props: Record<string, unknown>, children?: ReactNode) {
  return h(Dialog, props as never, children);
}

test("renders through the kit's Modal, in the dialog theme scope", async () => {
  const onOpen = vi.fn();
  const onClose = vi.fn();
  const view = await render(
    dialog({ testId: "confirm-dialog", title: "Delete?", onOpen, onClose }, "Body")
  );

  expect(modal.appElement).toBe("#root");
  expect(modal.props.isOpen).toBe(true);
  expect(modal.props.overlayClassName).toBe("theme-scope-dialog");
  expect(modal.props.shouldCloseOnEsc).toBe(true);
  expect(view.all((n) => n.type === "Modal")).toHaveLength(1);
  expect(view.text()).toContain("Delete?");
  expect(view.text()).toContain("Body");

  modal.props.onAfterOpen();
  expect(onOpen).toHaveBeenCalledTimes(1);
  modal.props.onRequestClose({ key: "Escape" });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("isOpen false renders nothing; a missing isOpen means open", async () => {
  const view = await render(dialog({ isOpen: false, title: "Hidden" }));
  expect(view.text()).toBe("");
  await view.update(dialog({ title: "Shown" }));
  expect(view.text()).toContain("Shown");
});

test("keeps the test ids the e2e specs use", async () => {
  const view = await render(dialog({ testId: "add-notebook-dialog", title: "T" }));
  expect(view.byTestId("add-notebook-dialog-backdrop")).toBeDefined();
  expect(view.byTestId("add-notebook-dialog")).toBeDefined();
  expect(view.byTestId("dialog-title")).toBeDefined();

  await view.update(dialog({ title: "T" }));
  expect(view.byTestId("dialog-backdrop")).toBeDefined();
  expect(view.byTestId("dialog")).toBeDefined();
});

test("a click on the backdrop closes it, a click inside does not", async () => {
  const onClose = vi.fn();
  const view = await render(dialog({ testId: "d", onClose }, "Body"));

  const inside = view.byTestId("d");
  inside.props.onClick(click);
  expect(click.stopPropagation).toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();

  view.byTestId("d-backdrop").props.onClick(click);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("positive and negative buttons call their handlers", async () => {
  const yes = vi.fn();
  const no = vi.fn();
  const view = await render(
    dialog({
      positiveButton: { text: "Save", onClick: yes },
      negativeButton: { text: "Cancel", onClick: no }
    })
  );
  const yesButton = view.byTestId("dialog-yes");
  const noButton = view.byTestId("dialog-no");
  expect(yesButton.props.variant).toBe("new_accent");
  expect(noButton.props.variant).toBe("new_tertiary");
  expect(yesButton.props["data-role"]).toBe("positive-button");
  yesButton.props.onClick(click);
  noButton.props.onClick(click);
  expect(yes).toHaveBeenCalledTimes(1);
  expect(no).toHaveBeenCalledTimes(1);
});

test("a disabled or loading button does not fire and shows a spinner", async () => {
  const yes = vi.fn();
  const view = await render(
    dialog({
      positiveButton: { text: "Save", onClick: yes, disabled: true, loading: true }
    })
  );
  const button = view.byTestId("dialog-yes");
  expect(button.props.disabled).toBe(true);
  expect(button.props.onClick).toBeUndefined();
  expect(view.all((n: TestNode) => n.type === "Loading")).toHaveLength(1);
  expect(view.text(button)).not.toContain("Save");
});

test("the close button closes it; noScroll leaves out the scroll container", async () => {
  const onClose = vi.fn();
  const view = await render(
    dialog({ showCloseButton: true, noScroll: true, onClose }, "Body")
  );
  view.byTestId("dialog-close").props.onClick(click);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(view.all((n) => n.type === "ScrollContainer")).toHaveLength(0);

  await view.update(dialog({}, "Body"));
  expect(view.all((n) => n.type === "ScrollContainer")).toHaveLength(1);
});
