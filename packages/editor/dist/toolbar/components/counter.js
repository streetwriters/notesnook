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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Flex, Text } from "rebass";
import { Button } from "../../components/button";
import { ToolButton } from "./tool-button";
function _Counter(props) {
    var title = props.title, onDecrease = props.onDecrease, onIncrease = props.onIncrease, onReset = props.onReset, value = props.value;
    return (_jsxs(Flex, __assign({ sx: {
            alignItems: "center",
            mr: 1,
            ":last-of-type": {
                mr: 0,
            },
        } }, { children: [_jsx(ToolButton, { toggled: false, title: "Decrease ".concat(title), icon: "minus", variant: "small", onClick: onDecrease }), _jsx(Button, __assign({ sx: {
                    bg: "transparent",
                }, onClick: onReset }, { children: _jsx(Text, __assign({ variant: "body", sx: { fontSize: "subBody", mx: 1, textAlign: "center" }, title: "Reset ".concat(title) }, { children: value })) })), _jsx(ToolButton, { toggled: false, title: "Increase ".concat(title), icon: "plus", variant: "small", onClick: onIncrease })] })));
}
export var Counter = React.memo(_Counter, function (prev, next) {
    return prev.value === next.value;
});
