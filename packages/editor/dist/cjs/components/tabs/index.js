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
exports.Tabs = exports.Tab = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const rebass_1 = require("rebass");
function Tab(props) {
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: props.children });
}
exports.Tab = Tab;
function Tabs(props) {
    const { activeIndex, children, containerProps, onTabChanged } = props;
    const [activeTab, setActiveTab] = (0, react_1.useState)(activeIndex || 0);
    const tabs = (0, react_1.useMemo)(() => react_1.Children.map(children, (child) => {
        if (react_1.default.isValidElement(child))
            return { title: child.props.title, component: child };
    }), [children]);
    return ((0, jsx_runtime_1.jsxs)(rebass_1.Flex, Object.assign({ sx: { flexDirection: "column" } }, { children: [(0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({ sx: {
                    mb: 1,
                } }, { children: tabs === null || tabs === void 0 ? void 0 : tabs.map((tab, index) => ((0, jsx_runtime_1.jsx)(rebass_1.Button, Object.assign({ sx: {
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
                    }, onClick: () => {
                        setActiveTab(index);
                        onTabChanged === null || onTabChanged === void 0 ? void 0 : onTabChanged(index);
                    } }, { children: tab.title }), index.toString()))) })), (0, jsx_runtime_1.jsx)(rebass_1.Flex, Object.assign({}, containerProps, { children: tabs && tabs[activeTab].component }))] })));
}
exports.Tabs = Tabs;
