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

// @vitest-environment jsdom

import { act, createElement, type ReactElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PopoverProps } from "../contracts/overlays";
import { Popover, PopoverHost } from "./popover";

type PopoverAnchor = PopoverProps["anchorRef"];

// The escape stack reads the platform keyboard (`@platform`), which only the
// app's targets provide. Popover's part is what it hands to Escape.
const escape = vi.hoisted(() => ({
  handler: undefined as (() => void) | undefined
}));

vi.mock("../shared/use-escape", () => ({
  useEscape: (handler: (() => void) | undefined, active = true) => {
    escape.handler = active ? handler : undefined;
  }
}));

// The theme scope comes from @notesnook/theme, which brings its own copy of
// React into the test graph. Its theme is not under test here.
vi.mock("./theme", () => ({
  ThemeScope: (props: { children?: ReactNode }) => props.children
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.replaceChildren();
});

async function render(element: ReactElement) {
  await act(async () => {
    root.render(element);
  });
  // Placement is computed asynchronously; let it land before reading styles.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function rect(x: number, y: number, width: number, height: number) {
  return {
    x,
    y,
    width,
    height,
    left: x,
    top: y,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({})
  } as DOMRect;
}

function anchor(x: number, y: number, width: number, height: number) {
  const element = document.createElement("button");
  element.getBoundingClientRect = () => rect(x, y, width, height);
  document.body.appendChild(element);
  return element;
}

/** The box that holds the popover's content: the parent of its text. */
function boxOf(text: string): HTMLElement {
  const label = [...document.querySelectorAll("span")].find(
    (span) => span.textContent === text
  );
  if (!label?.parentElement) throw new Error(`no popover with ${text}`);
  return label.parentElement;
}

function popoverOpen(
  props: Partial<Parameters<typeof Popover>[0]> & { onClose?: () => void },
  text = "Menu body"
) {
  return createElement(
    Popover,
    {
      isOpen: true,
      onClose: props.onClose ?? vi.fn(),
      ...props
    },
    createElement("span", null, text)
  );
}

describe("web Popover", () => {
  it("opens below its anchor ref, with its left edge on the anchor's", async () => {
    const button = anchor(100, 200, 50, 20);
    // The test anchor is a DOM element; the kit's UIElement type is wider.
    const anchorRef = { current: button } as unknown as PopoverAnchor;
    await render(popoverOpen({ anchorRef }));

    const style = getComputedStyle(boxOf("Menu body"));
    // The anchor's bottom edge (200 + 20) plus the 5px offset for bottom placements.
    expect(style.top).toBe("225px");
    expect(style.left).toBe("100px");
  });

  it("opens at an explicit anchor rect", async () => {
    await render(
      popoverOpen({ anchorRect: { x: 10, y: 20, width: 0, height: 0 } })
    );

    const style = getComputedStyle(boxOf("Menu body"));
    expect(style.top).toBe("25px");
    expect(style.left).toBe("10px");
  });

  it("draws nothing while open with no anchor to place it by", async () => {
    await render(
      popoverOpen({ anchorRef: { current: null } as unknown as PopoverAnchor })
    );

    expect(document.body.textContent).not.toContain("Menu body");
  });

  it("draws in a layer on document.body, not inside its own container", async () => {
    await render(
      popoverOpen({ anchorRect: { x: 0, y: 0, width: 0, height: 0 } })
    );

    expect(container.textContent).not.toContain("Menu body");
    expect(document.body.textContent).toContain("Menu body");
  });

  it("draws with no PopoverHost mounted, and only while open", async () => {
    await render(popoverOpen({ isOpen: false }));
    expect(document.body.textContent).not.toContain("Menu body");

    await render(
      popoverOpen({
        isOpen: true,
        anchorRect: { x: 0, y: 0, width: 0, height: 0 }
      })
    );
    expect(document.body.textContent).toContain("Menu body");
  });

  it("is still drawn once when a PopoverHost is mounted beside it", async () => {
    await render(
      createElement(
        "div",
        null,
        createElement(PopoverHost),
        popoverOpen({ anchorRect: { x: 0, y: 0, width: 0, height: 0 } })
      )
    );

    expect(document.body.innerHTML.split("Menu body").length - 1).toBe(1);
  });

  it("closes on a click outside the popover, but not on a click inside it", async () => {
    const onClose = vi.fn();
    await render(
      popoverOpen({
        onClose,
        anchorRect: { x: 0, y: 0, width: 0, height: 0 }
      })
    );

    const content = boxOf("Menu body").firstElementChild as HTMLElement;
    act(() => {
      content.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();

    const layer = boxOf("Menu body").parentElement as HTMLElement;
    act(() => {
      layer.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hands its close handler to Escape only while open", async () => {
    const onClose = vi.fn();
    const anchorRect = { x: 0, y: 0, width: 0, height: 0 };

    await render(popoverOpen({ isOpen: false, onClose, anchorRect }));
    expect(escape.handler).toBeUndefined();

    await render(popoverOpen({ isOpen: true, onClose, anchorRect }));
    escape.handler?.();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
