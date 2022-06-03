var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import { createPortal, unstable_renderSubtreeIntoContainer, unmountComponentAtNode, } from "react-dom";
import { EventDispatcher } from "./event-dispatcher";
var PortalProviderAPI = /** @class */ (function (_super) {
    __extends(PortalProviderAPI, _super);
    function PortalProviderAPI() {
        var _this = _super.call(this) || this;
        _this.portals = new Map();
        _this.setContext = function (context) {
            _this.context = context;
        };
        return _this;
    }
    PortalProviderAPI.prototype.render = function (children, container) {
        this.portals.set(container, {
            children: children,
        });
        var wrappedChildren = children();
        unstable_renderSubtreeIntoContainer(this.context, wrappedChildren, container);
    };
    // TODO: until https://product-fabric.atlassian.net/browse/ED-5013
    // we (unfortunately) need to re-render to pass down any updated context.
    // selectively do this for nodeviews that opt-in via `hasAnalyticsContext`
    PortalProviderAPI.prototype.forceUpdate = function () { };
    PortalProviderAPI.prototype.remove = function (container) {
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
    };
    return PortalProviderAPI;
}(EventDispatcher));
export { PortalProviderAPI };
var PortalProvider = /** @class */ (function (_super) {
    __extends(PortalProvider, _super);
    function PortalProvider(props) {
        var _this = _super.call(this, props) || this;
        _this.portalProviderAPI = new PortalProviderAPI();
        return _this;
    }
    PortalProvider.prototype.render = function () {
        return this.props.render(this.portalProviderAPI);
    };
    PortalProvider.prototype.componentDidUpdate = function () {
        this.portalProviderAPI.forceUpdate();
    };
    PortalProvider.displayName = "PortalProvider";
    return PortalProvider;
}(React.Component));
export { PortalProvider };
var PortalRenderer = /** @class */ (function (_super) {
    __extends(PortalRenderer, _super);
    function PortalRenderer(props) {
        var _this = _super.call(this, props) || this;
        _this.handleUpdate = function (portals) { return _this.setState({ portals: portals }); };
        props.portalProviderAPI.setContext(_this);
        props.portalProviderAPI.on("update", _this.handleUpdate);
        _this.state = { portals: new Map() };
        return _this;
    }
    PortalRenderer.prototype.render = function () {
        var portals = this.state.portals;
        return (_jsx(_Fragment, { children: Array.from(portals.entries()).map(function (_a) {
                var _b = __read(_a, 2), container = _b[0], children = _b[1];
                return createPortal(children, container);
            }) }));
    };
    return PortalRenderer;
}(React.Component));
export { PortalRenderer };
