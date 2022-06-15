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
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Children, useMemo, useState } from "react";
import { Button, Flex } from "rebass";
export function Tab(props) {
    return _jsx(_Fragment, { children: props.children });
}
export function Tabs(props) {
    var activeIndex = props.activeIndex, children = props.children, containerProps = props.containerProps, onTabChanged = props.onTabChanged;
    var _a = __read(useState(activeIndex || 0), 2), activeTab = _a[0], setActiveTab = _a[1];
    var tabs = useMemo(function () {
        return Children.map(children, function (child) {
            if (React.isValidElement(child))
                return { title: child.props.title, component: child };
        });
    }, [children]);
    return (_jsxs(Flex, __assign({ sx: { flexDirection: "column" } }, { children: [_jsx(Flex, __assign({ sx: {
                    mb: 1,
                } }, { children: tabs === null || tabs === void 0 ? void 0 : tabs.map(function (tab, index) { return (_jsx(Button, __assign({ sx: {
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
                    } }, { children: tab.title }), index.toString())); }) })), _jsx(Flex, __assign({}, containerProps, { children: tabs && tabs[activeTab].component }))] })));
}
