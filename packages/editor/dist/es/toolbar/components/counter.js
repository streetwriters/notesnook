import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Flex } from "rebass";
import { Button } from "../../components/button";
import { ToolButton } from "./tool-button";
function _Counter(props) {
    const { title, onDecrease, onIncrease, onReset, value } = props;
    return (_jsxs(Flex, Object.assign({ sx: {
            alignItems: "center",
            mr: 1,
            ":last-of-type": {
                mr: 0,
            },
        } }, { children: [_jsx(ToolButton, { toggled: false, title: `Decrease ${title}`, icon: "minus", variant: "small", onClick: onDecrease }), _jsx(Button, Object.assign({ sx: {
                    color: "text",
                    bg: "transparent",
                    px: 0,
                    fontSize: "subBody",
                    mx: 1,
                    textAlign: "center",
                }, onClick: onReset, title: `Reset ${title}` }, { children: value })), _jsx(ToolButton, { toggled: false, title: `Increase ${title}`, icon: "plus", variant: "small", onClick: onIncrease })] })));
}
export const Counter = React.memo(_Counter, (prev, next) => {
    return prev.value === next.value;
});
