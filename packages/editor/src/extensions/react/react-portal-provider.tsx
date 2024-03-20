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

import React, {
  FunctionComponent,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal, flushSync } from "react-dom";
import { EventDispatcher } from "./event-dispatcher";
import { nanoid } from "nanoid";

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

  constructor() {
    super();
  }

  /**
   * Trigger an update in all subscribers.
   */
  private update() {
    this.emit("update", this.portals);
  }

  render(Component: FunctionComponent, container: HTMLElement) {
    const portal = this.portals.get(container);
    this.portals.set(container, { Component, key: portal?.key ?? nanoid() });
    this.update();
  }

  /**
   * Force an update in all the portals by setting new keys for every portal.
   *
   * Delete all orphaned containers (deleted from the DOM). This is useful for
   * Decoration where there is no destroy method.
   */
  forceUpdate(): void {
    for (const [container, { Component }] of this.portals) {
      this.portals.set(container, { Component, key: nanoid() });
    }
  }

  remove(container: HTMLElement) {
    // Remove the portal which was being wrapped in the provided container.
    this.portals.delete(container);

    // Trigger an update
    this.update();
  }
}

const PortalProviderContext = React.createContext<
  PortalProviderAPI | undefined
>(undefined);
export function usePortalProvider() {
  return useContext(PortalProviderContext);
}

export function PortalProvider(props: PropsWithChildren) {
  const portalProviderAPI = useMemo(() => new PortalProviderAPI(), []);

  return (
    <PortalProviderContext.Provider value={portalProviderAPI}>
      {props.children}
      <PortalRenderer portalProviderAPI={portalProviderAPI} />
    </PortalProviderContext.Provider>
  );
}

function PortalRenderer(props: { portalProviderAPI: PortalProviderAPI }) {
  const { portalProviderAPI } = props;
  const mounted = useRef(true);
  const [portals, setPortals] = useState(() =>
    Array.from(portalProviderAPI.portals.entries())
  );

  useEffect(() => {
    mounted.current = true;
    function onUpdate(portalMap: Portals) {
      // we have to make sure the component is mounted otherwise React
      // throws an error.
      if (!mounted.current) return;

      const portals = Array.from(portalMap.entries());
      // flushSync is necessary here, otherwise we get into a loop where
      // ProseMirror destroys and recreates the node view over and over again.
      flushSync(() => setPortals(portals));
    }
    portalProviderAPI.on("update", onUpdate);
    return () => {
      mounted.current = false;
      portalProviderAPI.off("update", onUpdate);
    };
  }, [portalProviderAPI]);

  return (
    <>
      {portals.map(([container, { Component, key }]) =>
        createPortal(<Component />, container, key)
      )}
    </>
  );
}
