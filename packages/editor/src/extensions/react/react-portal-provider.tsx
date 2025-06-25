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

import { FunctionComponent, PropsWithChildren } from "react";
import { flushSync } from "react-dom";
import { EventDispatcher } from "./event-dispatcher.js";
import { Root, createRoot } from "react-dom/client";

export type BasePortalProviderProps = PropsWithChildren<unknown>;

export type Portals = Map<HTMLElement, MountedPortal>;

export interface MountedPortal {
  key: string;
  Component: FunctionComponent;
}

export type PortalRendererState = {
  portals: Portals;
};

export class PortalProviderAPI extends EventDispatcher<Portals> {
  portals: Map<HTMLElement, MountedPortal> = new Map();
  roots: Map<HTMLElement, Root> = new Map();

  constructor() {
    super();
  }

  render(Component: FunctionComponent, container: HTMLElement) {
    const root = this.roots.get(container) || createRoot(container);
    flushSync(() => root.render(<Component />));
    this.roots.set(container, root);
  }

  remove(container: HTMLElement) {
    // if container is already unmounted (maybe by prosemirror),
    // no need to proceed
    if (!container.parentNode) return;

    const root = this.roots.get(container);
    if (!root) return;
    this.roots.delete(container);

    try {
      root.unmount();
    } catch {
      // ignore
    }
  }
}
