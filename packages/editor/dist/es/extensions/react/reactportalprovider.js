import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useContext } from "react";
import { createPortal, unstable_renderSubtreeIntoContainer, unmountComponentAtNode, } from "react-dom";
import { EventDispatcher } from "./event-dispatcher";
export class PortalProviderAPI extends EventDispatcher {
    constructor() {
        super();
        this.portals = new Map();
        this.setContext = (context) => {
            this.context = context;
        };
    }
    render(children, container) {
        this.portals.set(container, {
            children,
        });
        let wrappedChildren = children();
        unstable_renderSubtreeIntoContainer(this.context, wrappedChildren, container);
    }
    // TODO: until https://product-fabric.atlassian.net/browse/ED-5013
    // we (unfortunately) need to re-render to pass down any updated context.
    // selectively do this for nodeviews that opt-in via `hasAnalyticsContext`
    forceUpdate() { }
    remove(container) {
        this.portals.delete(container);
        // There is a race condition that can happen caused by Prosemirror vs React,
        // where Prosemirror removes the container from the DOM before React gets
        // around to removing the child from the container
        // This will throw a NotFoundError: The node to be removed is not a child of this node
        // Both Prosemirror and React remove the elements asynchronously, and in edge
        // cases Prosemirror beats React
        try {
            unmountComponentAtNode(container);
        }
        catch (error) {
            // IGNORE console.error(error);
        }
    }
}
const PortalProviderContext = React.createContext(undefined);
export function usePortalProvider() {
    return useContext(PortalProviderContext);
}
export class PortalProvider extends React.Component {
    constructor(props) {
        super(props);
        this.portalProviderAPI = new PortalProviderAPI();
    }
    render() {
        return (_jsxs(PortalProviderContext.Provider, Object.assign({ value: this.portalProviderAPI }, { children: [this.props.children, _jsx(PortalRenderer, { portalProviderAPI: this.portalProviderAPI })] })));
    }
    componentDidUpdate() {
        this.portalProviderAPI.forceUpdate();
    }
}
PortalProvider.displayName = "PortalProvider";
export class PortalRenderer extends React.Component {
    constructor(props) {
        super(props);
        this.handleUpdate = (portals) => this.setState({ portals });
        props.portalProviderAPI.setContext(this);
        props.portalProviderAPI.on("update", this.handleUpdate);
        this.state = { portals: new Map() };
    }
    render() {
        const { portals } = this.state;
        return (_jsx(_Fragment, { children: Array.from(portals.entries()).map(([container, children]) => createPortal(children, container)) }));
    }
}
