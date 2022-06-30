"use strict";
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
exports.Tabs = exports.Tab = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importStar(require("react"));
var rebass_1 = require("rebass");
function Tab(props) {
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: props.children });
}
exports.Tab = Tab;
function Tabs(props) {
    var activeIndex = props.activeIndex, children = props.children, containerProps = props.containerProps, onTabChanged = props.onTabChanged;
    var _a = __read((0, react_1.useState)(activeIndex || 0), 2), activeTab = _a[0], setActiveTab = _a[1];
    var tabs = (0, react_1.useMemo)(function () {
        return react_1.Children.map(children, function (child) {
            if (react_1.default.isValidElement(child))
                return { title: child.props.title, component: child };
        });
    }, [children]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, __assign({ sx: { flexDirection: "column" } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Flex, __assign({ sx: {
                    mb: 1,
                } }, { children: tabs === null || tabs === void 0 ? void 0 : tabs.map(function (tab, index) { return ((0, jsx_runtime_1.jsx)(rebass_1.Button, __assign({ sx: {
                        flex: 1,
                        p: 0,
                        py: 1,
                        borderRadius: 0,
                        borderTopLeftRadius: "default",
                        borderTopRightRadius: "default",
                        bg: activeTab === index ? "bgSecondary" : "transparent",
                        fontWeight: activeTab === index ? "bold" : "normal",
                        color: "text",
                        ":last-of-type": { mr: 0 },
                        borderBottom: "2px solid",
                        borderBottomColor: activeTab === index ? "primary" : "transparent",
                        ":hover": {
                            bg: "hover",
                        },
                    }, onClick: function () {
                        setActiveTab(index);
                        onTabChanged === null || onTabChanged === void 0 ? void 0 : onTabChanged(index);
                    } }, { children: tab.title }), index.toString())); }) })), (0, jsx_runtime_1.jsx)(rebass_1.Flex, __assign({}, containerProps, { children: tabs && tabs[activeTab].component }))] })));
}
exports.Tabs = Tabs;
