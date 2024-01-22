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

import React, { PropsWithChildren, useContext } from "react";
import { createPortal } from "react-dom";
import { EventDispatcher } from "./event-dispatcher";
import { Root, createRoot } from "react-dom/client";

export type BasePortalProviderProps = PropsWithChildren<unknown>;

export type Portals = Map<HTMLElement, React.ReactChild>;

export type PortalRendererState = {
  portals: Portals;
};

export class PortalProviderAPI extends EventDispatcher {
  portals: Map<HTMLElement, Root> = new Map();
  context?: PortalRenderer;

  constructor() {
    super();
  }

  setContext = (context: PortalRenderer) => {
    this.context = context;
  };

  render(
    children: () => React.ReactChild | JSX.Element | null,
    container: HTMLElement,
    callback?: () => void
  ) {
    if (!this.context) return;

    //  const wrappedChildren = children() as JSX.Element;

    // unstable_renderSubtreeIntoContainer(
    //   this.context,
    //   wrappedChildren,
    //   container,
    //   callback
    // );
    const root = this.portals.get(container) || createRoot(container);
    root.render(children());
    this.portals.set(container, root);
  }

  // TODO: until https://product-fabric.atlassian.net/browse/ED-5013
  // we (unfortunately) need to re-render to pass down any updated context.
  // selectively do this for nodeviews that opt-in via `hasAnalyticsContext`
  forceUpdate() {}

  remove(container: HTMLElement) {
    const root = this.portals.get(container);
    this.portals.delete(container);

    // There is a race condition that can happen caused by Prosemirror vs React,
    // where Prosemirror removes the container from the DOM before React gets
    // around to removing the child from the container
    // This will throw a NotFoundError: The node to be removed is not a child of this node
    // Both Prosemirror and React remove the elements asynchronously, and in edge
    // cases Prosemirror beats React
    try {
      root?.unmount();
      // unmountComponentAtNode(container);
    } catch (error) {
      // IGNORE console.error(error);
    }
  }
}
const PortalProviderContext = React.createContext<
  PortalProviderAPI | undefined
>(undefined);
export function usePortalProvider() {
  return useContext(PortalProviderContext);
}

export class PortalProvider extends React.Component<BasePortalProviderProps> {
  static displayName = "PortalProvider";

  portalProviderAPI: PortalProviderAPI;

  constructor(props: BasePortalProviderProps) {
    super(props);
    this.portalProviderAPI = new PortalProviderAPI();
  }

  render() {
    return (
      <PortalProviderContext.Provider value={this.portalProviderAPI}>
        {this.props.children}
        <PortalRenderer portalProviderAPI={this.portalProviderAPI} />
      </PortalProviderContext.Provider>
    );
  }

  componentDidUpdate() {
    this.portalProviderAPI.forceUpdate();
  }
}

export class PortalRenderer extends React.Component<
  { portalProviderAPI: PortalProviderAPI },
  PortalRendererState
> {
  constructor(props: { portalProviderAPI: PortalProviderAPI }) {
    super(props);
    props.portalProviderAPI.setContext(this);
    props.portalProviderAPI.on("update", this.handleUpdate);
    this.state = { portals: new Map() };
  }

  handleUpdate = (portals: Portals) => this.setState({ portals });

  render() {
    const { portals } = this.state;
    return (
      <>
        {Array.from(portals.entries()).map(([container, children]) =>
          createPortal(children, container)
        )}
      </>
    );
  }
}
