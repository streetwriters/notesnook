import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Children, useMemo, useState } from "react";
import { Button, Flex } from "rebass";
export function Tab(props) {
    return _jsx(_Fragment, { children: props.children });
}
export function Tabs(props) {
    const { activeIndex, children, containerProps, onTabChanged } = props;
    const [activeTab, setActiveTab] = useState(activeIndex || 0);
    const tabs = useMemo(() => Children.map(children, (child) => {
        if (React.isValidElement(child))
            return { title: child.props.title, component: child };
    }), [children]);
    return (_jsxs(Flex, Object.assign({ sx: { flexDirection: "column" } }, { children: [_jsx(Flex, Object.assign({ sx: {
                    mb: 1,
                } }, { children: tabs === null || tabs === void 0 ? void 0 : tabs.map((tab, index) => (_jsx(Button, Object.assign({ sx: {
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
                    } }, { children: tab.title }), index.toString()))) })), _jsx(Flex, Object.assign({}, containerProps, { children: tabs && tabs[activeTab].component }))] })));
}
