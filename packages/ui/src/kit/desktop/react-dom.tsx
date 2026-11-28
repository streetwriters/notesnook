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

// The two calls of `react-dom` that code shared with apps/web makes:
// `ReactDOM.render(element, container)` and
// `ReactDOM.unmountComponentAtNode(container)`, where the container is the
// element `document.getElementById` finds. Desktop has no second React root:
// the container is a `DomRoot` drawn by the app, and it draws what was
// rendered into it.

import { useSyncExternalStore, type ReactNode } from "react";
import { DesktopElement } from "./element";
import { Box } from "./primitives";

const rendered = new Map<string, ReactNode>();
const listeners = new Set<() => void>();
const ids = new WeakMap<DesktopElement, string>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function idOf(container: unknown) {
  return container instanceof DesktopElement ? ids.get(container) : undefined;
}

export const ReactDOM = {
  render(element: ReactNode, container: unknown) {
    const id = idOf(container);
    if (id === undefined) return;
    rendered.set(id, element);
    notify();
  },
  unmountComponentAtNode(container: unknown) {
    const id = idOf(container);
    if (id === undefined || !rendered.has(id)) return false;
    rendered.delete(id);
    notify();
    return true;
  }
};

/**
 * An element code can render into with `ReactDOM.render`, as apps/web's
 * `<div id="dialogContainer">`. It covers its parent and is laid out only
 * while something is rendered into it.
 */
export function DomRoot(props: { id: string }) {
  const { id } = props;
  const content = useSyncExternalStore(subscribe, () => rendered.get(id));
  return (
    <Box
      id={id}
      ref={(element: unknown) => {
        if (element instanceof DesktopElement) ids.set(element, id);
      }}
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: content === undefined ? "none" : "flex",
        flexDirection: "column"
      }}
    >
      {content}
    </Box>
  );
}

/** What `container instanceof HTMLElement` tests on desktop. */
export { DesktopElement as HTMLElement };
