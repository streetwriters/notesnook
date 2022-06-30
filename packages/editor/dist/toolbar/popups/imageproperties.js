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
import { Flex, Text } from "rebass";
import { useCallback } from "react";
import { Popup } from "../components/popup";
import { Checkbox } from "@rebass/forms";
import { InlineInput } from "../../components/inline-input";
export function ImageProperties(props) {
    var height = props.height, width = props.width, float = props.float, editor = props.editor, onClose = props.onClose;
    var onSizeChange = useCallback(function (newWidth, newHeight) {
        var size = newWidth
            ? {
                width: newWidth,
                height: newWidth * (height / width),
            }
            : newHeight
                ? {
                    width: newHeight * (width / height),
                    height: newHeight,
                }
                : {
                    width: 0,
                    height: 0,
                };
        editor.chain().setImageSize(size).run();
    }, [width, height]);
    return (_jsx(Popup, __assign({ title: "Image properties", onClose: onClose }, { children: _jsxs(Flex, __assign({ sx: { width: ["auto", 300], flexDirection: "column", p: 1 } }, { children: [_jsxs(Flex, __assign({ sx: { justifyContent: "space-between", alignItems: "center" } }, { children: [_jsx(Text, __assign({ variant: "body" }, { children: "Floating?" })), _jsx(Checkbox, { checked: float, onClick: function () {
                                return editor
                                    .chain()
                                    .setImageAlignment({ float: !float, align: "left" })
                                    .run();
                            } })] })), _jsxs(Flex, __assign({ sx: { alignItems: "center", mt: 2 } }, { children: [_jsx(InlineInput, { label: "width", type: "number", value: width, containerProps: {
                                sx: { mr: 1 },
                            }, onChange: function (e) { return onSizeChange(e.target.valueAsNumber); } }), _jsx(InlineInput, { label: "height", type: "number", value: height, onChange: function (e) { return onSizeChange(undefined, e.target.valueAsNumber); } })] }))] })) })));
}
