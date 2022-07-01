"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortalRenderer = exports.PortalProvider = exports.usePortalProvider = exports.PortalProviderAPI = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_dom_1 = require("react-dom");
const eventdispatcher_1 = require("./eventdispatcher");
class PortalProviderAPI extends eventdispatcher_1.EventDispatcher {
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
        (0, react_dom_1.unstable_renderSubtreeIntoContainer)(this.context, wrappedChildren, container);
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
            (0, react_dom_1.unmountComponentAtNode)(container);
        }
        catch (error) {
            // IGNORE console.error(error);
        }
    }
}
exports.PortalProviderAPI = PortalProviderAPI;
const PortalProviderContext = react_1.default.createContext(undefined);
function usePortalProvider() {
    return (0, react_1.useContext)(PortalProviderContext);
}
exports.usePortalProvider = usePortalProvider;
class PortalProvider extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.portalProviderAPI = new PortalProviderAPI();
    }
    render() {
        return ((0, jsx_runtime_1.jsxs)(PortalProviderContext.Provider, Object.assign({ value: this.portalProviderAPI }, { children: [this.props.children, (0, jsx_runtime_1.jsx)(PortalRenderer, { portalProviderAPI: this.portalProviderAPI })] })));
    }
    componentDidUpdate() {
        this.portalProviderAPI.forceUpdate();
    }
}
exports.PortalProvider = PortalProvider;
PortalProvider.displayName = "PortalProvider";
class PortalRenderer extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.handleUpdate = (portals) => this.setState({ portals });
        props.portalProviderAPI.setContext(this);
        props.portalProviderAPI.on("update", this.handleUpdate);
        this.state = { portals: new Map() };
    }
    render() {
        const { portals } = this.state;
        return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: Array.from(portals.entries()).map(([container, children]) => (0, react_dom_1.createPortal)(children, container)) }));
    }
}
exports.PortalRenderer = PortalRenderer;
