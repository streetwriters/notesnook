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

// `ReactDOM.render` and `ReactDOM.unmountComponentAtNode` as apps/web calls
// them. React 19 removed both from `react-dom`, so they are written on
// `react-dom/client` roots here; behaviour is the same.

import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

const roots = new WeakMap<Element, Root>();

export const ReactDOM = {
  render(element: ReactNode, container: Element) {
    let root = roots.get(container);
    if (!root) roots.set(container, (root = createRoot(container)));
    root.render(element);
  },
  unmountComponentAtNode(container: Element) {
    const root = roots.get(container);
    if (!root) return false;
    root.unmount();
    roots.delete(container);
    return true;
  }
};

/** An element to render into with `ReactDOM.render`: a `<div>` with an id. */
export function DomRoot(props: { id: string }) {
  return <div id={props.id} />;
}

const WebHTMLElement = globalThis.HTMLElement;
export { WebHTMLElement as HTMLElement };
