"use strict";
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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalRenderer = exports.PortalProvider = exports.usePortalProvider = exports.PortalProviderAPI = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var react_dom_1 = require("react-dom");
var eventdispatcher_1 = require("./eventdispatcher");
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
        (0, react_dom_1.unstable_renderSubtreeIntoContainer)(this.context, wrappedChildren, container);
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
            (0, react_dom_1.unmountComponentAtNode)(container);
        }
        catch (error) {
            // IGNORE console.error(error);
        }
    };
    return PortalProviderAPI;
}(eventdispatcher_1.EventDispatcher));
exports.PortalProviderAPI = PortalProviderAPI;
var PortalProviderContext = react_1.default.createContext(undefined);
function usePortalProvider() {
    return (0, react_1.useContext)(PortalProviderContext);
}
exports.usePortalProvider = usePortalProvider;
var PortalProvider = /** @class */ (function (_super) {
    __extends(PortalProvider, _super);
    function PortalProvider(props) {
        var _this = _super.call(this, props) || this;
        _this.portalProviderAPI = new PortalProviderAPI();
        return _this;
    }
    PortalProvider.prototype.render = function () {
        return ((0, jsx_runtime_1.jsxs)(PortalProviderContext.Provider, __assign({ value: this.portalProviderAPI }, { children: [this.props.children, (0, jsx_runtime_1.jsx)(PortalRenderer, { portalProviderAPI: this.portalProviderAPI })] })));
    };
    PortalProvider.prototype.componentDidUpdate = function () {
        this.portalProviderAPI.forceUpdate();
    };
    PortalProvider.displayName = "PortalProvider";
    return PortalProvider;
}(react_1.default.Component));
exports.PortalProvider = PortalProvider;
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
        return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: Array.from(portals.entries()).map(function (_a) {
                var _b = __read(_a, 2), container = _b[0], children = _b[1];
                return (0, react_dom_1.createPortal)(children, container);
            }) }));
    };
    return PortalRenderer;
}(react_1.default.Component));
exports.PortalRenderer = PortalRenderer;
